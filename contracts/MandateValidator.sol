// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;



/// @title MandateValidator
/// @notice Manages per-user Mezo Passport mandates and enforces one-stake-per-market.
contract MandateValidator {
    // ─── Structs ────────────────────────────────────────────────────────────────

    struct Mandate {
        uint256 limitPerMarket; // max MUSD wei per stake
        bool active;
    }

    // ─── State ──────────────────────────────────────────────────────────────────

    /// @notice Address of the PredictionMarket contract — only it can call recordStake()
    address public predictionMarket;

    mapping(address => Mandate) private _mandates;

    /// @dev user → marketId → has staked?
    mapping(address => mapping(bytes32 => bool)) private _hasStaked;

    // ─── Events ─────────────────────────────────────────────────────────────────

    event MandateRegistered(address indexed user, uint256 limitPerMarket);
    event MandateRevoked(address indexed user);
    event PredictionMarketSet(address indexed predictionMarket);

    // ─── Errors ─────────────────────────────────────────────────────────────────

    error NoMandate(address user);
    error MandateExceeded(uint256 limit, uint256 attempted);
    error AlreadyStaked(address user, bytes32 marketId);
    error Unauthorized();
    error PredictionMarketAlreadySet();
    error ZeroAddress();
    error ZeroLimit();

    // ─── Constructor ────────────────────────────────────────────────────────────

    constructor() {}

    // ─── Admin ──────────────────────────────────────────────────────────────────

    /// @notice Set the PredictionMarket address — one-time, irreversible.
    function setPredictionMarket(address _predictionMarket) external {
        if (predictionMarket != address(0)) revert PredictionMarketAlreadySet();
        if (_predictionMarket == address(0)) revert ZeroAddress();
        predictionMarket = _predictionMarket;
        emit PredictionMarketSet(_predictionMarket);
    }

    // ─── User-Facing ─────────────────────────────────────────────────────────

    /// @notice Register or update a Prediction Mandate.
    ///         May be called by the user themselves or by an authorized backend relay.
    function registerMandate(address user, uint256 limitPerMarket) external {
        if (user == address(0)) revert ZeroAddress();
        if (limitPerMarket == 0) revert ZeroLimit();
        _mandates[user] = Mandate({ limitPerMarket: limitPerMarket, active: true });
        emit MandateRegistered(user, limitPerMarket);
    }

    /// @notice Revoke own mandate.
    function revokeMandate() external {
        _mandates[msg.sender].active = false;
        emit MandateRevoked(msg.sender);
    }

    // ─── Validation ──────────────────────────────────────────────────────────

    /// @notice Validate that a stake is within mandate scope.
    ///         Pure view — does NOT record the stake. Call recordStake() after execution.
    function validateMandate(
        address user,
        uint256 amount,
        bytes32 marketId
    ) external view returns (bool valid, string memory reason) {
        Mandate storage m = _mandates[user];
        if (!m.active) return (false, "NO_MANDATE");
        if (amount > m.limitPerMarket) return (false, "MANDATE_EXCEEDED");
        if (_hasStaked[user][marketId]) return (false, "ALREADY_STAKED");
        return (true, "");
    }

    /// @notice Called by PredictionMarket after a successful stake to record usage.
    ///         Prevents double-staking even if mandate check is bypassed.
    function recordStake(address user, bytes32 marketId) external {
        if (msg.sender != predictionMarket) revert Unauthorized();
        _hasStaked[user][marketId] = true;
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    function getMandate(address user)
        external
        view
        returns (uint256 limitPerMarket, bool active)
    {
        Mandate storage m = _mandates[user];
        return (m.limitPerMarket, m.active);
    }

    function hasStaked(address user, bytes32 marketId) external view returns (bool) {
        return _hasStaked[user][marketId];
    }
}
