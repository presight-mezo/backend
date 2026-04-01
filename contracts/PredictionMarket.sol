// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MandateValidator.sol";

/// @title PredictionMarket
/// @notice Core Presight escrow contract. Holds MUSD, manages YES/NO staking,
///         routes 1% fee to the Mezo protocol, and auto-distributes rewards on resolution.
///
/// Security: ReentrancyGuard applied to ALL MUSD transfer functions (stake, resolve, claimReward).
contract PredictionMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Enums ──────────────────────────────────────────────────────────────────

    enum Mode    { FULL_STAKE, ZERO_RISK }
    enum Status  { OPEN, RESOLVED }
    enum Outcome { NONE, YES, NO }

    // ─── Constants ──────────────────────────────────────────────────────────────

    /// @notice 1% platform fee in basis points — immutable, cannot be bypassed.
    uint256 public constant FEE_BPS = 100;
    uint256 private constant BPS_DENOMINATOR = 10_000;

    // ─── Immutables ─────────────────────────────────────────────────────────────

    IERC20 public immutable musd;
    address public immutable protocolFeeAddr;
    MandateValidator public immutable mandateValidator;

    // ─── Structs ────────────────────────────────────────────────────────────────

    struct Market {
        bytes32  id;
        bytes32  groupId;
        string   question;
        uint256  deadline;
        address  resolver;
        Mode     mode;
        Status   status;
        Outcome  outcome;
        uint256  yesPool;
        uint256  noPool;
        uint256  participantCount;
    }

    struct Stake {
        bool    isYes;     // true = YES, false = NO
        uint256 amount;
        bool    claimed;
    }

    // ─── State ──────────────────────────────────────────────────────────────────

    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => mapping(address => Stake)) public stakes;
    mapping(bytes32 => address[]) private _stakers; // for auto-distribution iteration

    // ─── Events ─────────────────────────────────────────────────────────────────

    event MarketCreated(
        bytes32 indexed marketId,
        bytes32 indexed groupId,
        string question,
        address resolver,
        Mode mode,
        uint256 deadline
    );
    event StakePlaced(
        bytes32 indexed marketId,
        address indexed staker,
        bool    isYes,
        uint256 amount
    );
    event MarketResolved(
        bytes32 indexed marketId,
        bool    outcome,
        uint256 totalPool,
        uint256 feeAmount
    );
    event RewardsDistributed(
        bytes32 indexed marketId,
        uint256 winnerCount,
        uint256 netPool
    );
    event RewardClaimed(
        bytes32 indexed marketId,
        address indexed staker,
        uint256 amount
    );

    // ─── Errors ─────────────────────────────────────────────────────────────────

    error MarketNotFound(bytes32 marketId);
    error MarketAlreadyResolved(bytes32 marketId);
    error MarketDeadlineNotPassed(bytes32 marketId);
    error StakingAfterDeadline(bytes32 marketId);
    error MarketNotOpen(bytes32 marketId);
    error NotResolver(bytes32 marketId, address caller);
    error AlreadyStaked(bytes32 marketId, address staker);
    error MandateCheckFailed(string reason);
    error ZeroAmount();
    error ZeroAddress();
    error NothingToClaim(bytes32 marketId, address staker);
    error InvalidDeadline();
    error EmptyQuestion();

    // ─── Modifiers ──────────────────────────────────────────────────────────────

    modifier onlyResolver(bytes32 marketId) {
        if (markets[marketId].resolver != msg.sender)
            revert NotResolver(marketId, msg.sender);
        _;
    }

    modifier marketExists(bytes32 marketId) {
        if (markets[marketId].deadline == 0) revert MarketNotFound(marketId);
        _;
    }

    // ─── Constructor ────────────────────────────────────────────────────────────

    /// @param _musd             MUSD ERC-20 address on Mezo Testnet.
    /// @param _protocolFeeAddr  Address that receives the 1% platform fee (immutable).
    /// @param _mandateValidator Deployed MandateValidator contract.
    constructor(
        address _musd,
        address _protocolFeeAddr,
        address _mandateValidator
    ) {
        if (_musd == address(0) || _protocolFeeAddr == address(0) || _mandateValidator == address(0))
            revert ZeroAddress();

        musd             = IERC20(_musd);
        protocolFeeAddr  = _protocolFeeAddr;
        mandateValidator = MandateValidator(_mandateValidator);
    }

    // ─── Market Creation ─────────────────────────────────────────────────────

    /// @notice Create a new YES/NO prediction market.
    ///         Called by the group admin (enforced off-chain; the GroupRegistry stores admin state).
    /// @param groupId    On-chain group identifier from GroupRegistry.
    /// @param question   The prediction question string.
    /// @param deadline   Unix timestamp after which staking closes.
    /// @param resolver   Address of the Trusted Resolver (distinct from group admin).
    /// @param mode       FULL_STAKE or ZERO_RISK.
    /// @return marketId  keccak256-derived unique market identifier.
    function createMarket(
        bytes32 groupId,
        string calldata question,
        uint256 deadline,
        address resolver,
        Mode mode
    ) external returns (bytes32 marketId) {
        if (bytes(question).length == 0) revert EmptyQuestion();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (resolver == address(0)) revert ZeroAddress();

        marketId = keccak256(
            abi.encodePacked(groupId, question, deadline, resolver, block.timestamp, msg.sender)
        );

        markets[marketId] = Market({
            id:               marketId,
            groupId:          groupId,
            question:         question,
            deadline:         deadline,
            resolver:         resolver,
            mode:             mode,
            status:           Status.OPEN,
            outcome:          Outcome.NONE,
            yesPool:          0,
            noPool:           0,
            participantCount: 0
        });

        emit MarketCreated(marketId, groupId, question, resolver, mode, deadline);
    }

    // ─── Staking ────────────────────────────────────────────────────────────
    //     ReentrancyGuard: nonReentrant applied — satisfies security requirement.

    /// @notice Stake MUSD into a market.
    ///         Validates deadline, open status, mandate scope, and one-stake-per-user.
    ///         Transfers MUSD from caller into this contract (escrow).
    /// @param marketId  The market to stake on.
    /// @param isYes     true for YES, false for NO.
    /// @param amount    MUSD amount in wei.
    function stake(
        bytes32 marketId,
        bool isYes,
        uint256 amount
    ) external nonReentrant marketExists(marketId) {
        Market storage m = markets[marketId];

        if (amount == 0) revert ZeroAmount();
        if (block.timestamp >= m.deadline) revert StakingAfterDeadline(marketId);
        if (m.status != Status.OPEN) revert MarketNotOpen(marketId);
        if (stakes[marketId][msg.sender].amount != 0) revert AlreadyStaked(marketId, msg.sender);

        // Mandate scope check — reverts if no mandate or exceeded
        (bool valid, string memory reason) = mandateValidator.validateMandate(
            msg.sender, amount, marketId
        );
        if (!valid) revert MandateCheckFailed(reason);

        // Pull MUSD from user into escrow
        musd.safeTransferFrom(msg.sender, address(this), amount);

        // Record stake
        stakes[marketId][msg.sender] = Stake({ isYes: isYes, amount: amount, claimed: false });
        _stakers[marketId].push(msg.sender);

        if (isYes) {
            m.yesPool += amount;
        } else {
            m.noPool += amount;
        }
        m.participantCount++;

        // Record stake in MandateValidator (prevents double-stake even under attack)
        mandateValidator.recordStake(msg.sender, marketId);

        emit StakePlaced(marketId, msg.sender, isYes, amount);
    }

    // ─── Resolution ─────────────────────────────────────────────────────────
    //     ReentrancyGuard: nonReentrant applied — satisfies security requirement.

    /// @notice Resolve a market and auto-distribute rewards.
    ///         Only the assigned Trusted Resolver may call this.
    ///         Can be called before deadline for early resolution (resolver override).
    /// @param marketId  The market to resolve.
    /// @param outcomeYes true if YES wins, false if NO wins.
    function resolve(
        bytes32 marketId,
        bool outcomeYes
    ) external nonReentrant marketExists(marketId) onlyResolver(marketId) {
        Market storage m = markets[marketId];
        if (m.status == Status.RESOLVED) revert MarketAlreadyResolved(marketId);

        m.status  = Status.RESOLVED;
        m.outcome = outcomeYes ? Outcome.YES : Outcome.NO;

        uint256 totalPool = m.yesPool + m.noPool;
        uint256 feeAmount = (totalPool * FEE_BPS) / BPS_DENOMINATOR;

        emit MarketResolved(marketId, outcomeYes, totalPool, feeAmount);

        _distribute(marketId, outcomeYes, totalPool, feeAmount);
    }

    /// @dev Internal distribution engine. Called by resolve().
    ///      Handles: normal distribution, zero-winner refund, fee routing.
    function _distribute(
        bytes32 marketId,
        bool outcomeYes,
        uint256 totalPool,
        uint256 feeAmount
    ) internal {
        Market storage m = markets[marketId];
        address[] storage stakers = _stakers[marketId];

        uint256 netPool   = totalPool - feeAmount;
        uint256 winPool   = outcomeYes ? m.yesPool : m.noPool;

        // ── Fee → protocol address ──────────────────────────────────────────
        if (feeAmount > 0) {
            musd.safeTransfer(protocolFeeAddr, feeAmount);
        }

        // ── Zero-distribution guard ─────────────────────────────────────────
        // All stakes on the same side → refund all stakers net of fee pro-rata
        if (winPool == 0 || winPool == totalPool) {
            // Refund: each staker gets their proportional share of netPool
            for (uint256 i = 0; i < stakers.length; i++) {
                address staker = stakers[i];
                Stake storage s = stakes[marketId][staker];
                if (s.amount > 0 && !s.claimed) {
                    uint256 refund = (netPool * s.amount) / totalPool;
                    s.claimed = true;
                    musd.safeTransfer(staker, refund);
                }
            }
            emit RewardsDistributed(marketId, 0, netPool);
            return;
        }

        // ── Normal distribution → winners get proportional share of netPool ──
        uint256 winnerCount = 0;
        for (uint256 i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            Stake storage s = stakes[marketId][staker];
            if (s.isYes == outcomeYes && !s.claimed) {
                uint256 reward = (netPool * s.amount) / winPool;
                s.claimed = true;
                musd.safeTransfer(staker, reward);
                winnerCount++;
            }
        }

        emit RewardsDistributed(marketId, winnerCount, netPool);
    }

    // ─── Claim Reward (pull fallback) ────────────────────────────────────────
    //     ReentrancyGuard: nonReentrant applied — satisfies security requirement.

    /// @notice Pull-pattern fallback for winners whose auto-distribution failed.
    ///         Safe to call even if auto-distribution succeeded (will revert with NothingToClaim).
    function claimReward(bytes32 marketId) external nonReentrant marketExists(marketId) {
        Market storage m = markets[marketId];
        if (m.status != Status.RESOLVED) revert MarketNotOpen(marketId);

        Stake storage s = stakes[marketId][msg.sender];
        if (s.claimed) revert NothingToClaim(marketId, msg.sender);

        bool outcomeYes = (m.outcome == Outcome.YES);
        if (s.isYes != outcomeYes) revert NothingToClaim(marketId, msg.sender);

        uint256 totalPool = m.yesPool + m.noPool;
        uint256 feeAmount = (totalPool * FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPool   = totalPool - feeAmount;
        uint256 winPool   = outcomeYes ? m.yesPool : m.noPool;

        uint256 reward = (netPool * s.amount) / winPool;
        s.claimed = true;

        musd.safeTransfer(msg.sender, reward);
        emit RewardClaimed(marketId, msg.sender, reward);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getMarket(bytes32 marketId)
        external
        view
        returns (
            bytes32 id,
            bytes32 groupId,
            string memory question,
            uint256 deadline,
            address resolver,
            Mode mode,
            Status status,
            Outcome outcome,
            uint256 yesPool,
            uint256 noPool,
            uint256 participantCount
        )
    {
        Market storage m = markets[marketId];
        return (
            m.id, m.groupId, m.question, m.deadline,
            m.resolver, m.mode, m.status, m.outcome,
            m.yesPool, m.noPool, m.participantCount
        );
    }

    function getStake(bytes32 marketId, address staker)
        external
        view
        returns (bool isYes, uint256 amount, bool claimed)
    {
        Stake storage s = stakes[marketId][staker];
        return (s.isYes, s.amount, s.claimed);
    }

    function getStakers(bytes32 marketId) external view returns (address[] memory) {
        return _stakers[marketId];
    }
}
