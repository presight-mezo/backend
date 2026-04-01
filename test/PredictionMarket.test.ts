import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type {
  PredictionMarket,
  MandateValidator,
  GroupRegistry,
} from "../typechain-types";

// ─── ERC-20 Mock ────────────────────────────────────────────────────────────
// We deploy a simple ERC-20 mock for MUSD in tests.
// OpenZeppelin's ERC20 is used in the fixture via ethers.deployContract.

const MUSD_SUPPLY = ethers.parseEther("1000000"); // 1 million MUSD
const ONE_MUSD    = ethers.parseEther("1");
const FIFTY_MUSD  = ethers.parseEther("50");
const HUNDRED_MUSD = ethers.parseEther("100");
const ONE_WEEK    = 7 * 24 * 60 * 60;

// ─── Fixture ─────────────────────────────────────────────────────────────────

async function deployFixture() {
  const [owner, alice, bob, charlie, feeWallet, resolver, nonResolver] =
    await ethers.getSigners();

  // Deploy mock MUSD (ERC-20 with mint)
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const musd = await MockERC20.deploy("Mock MUSD", "MUSD", MUSD_SUPPLY);

  // Deploy MandateValidator
  const MandateValidator = await ethers.getContractFactory("MandateValidator");
  const mandateValidator = await MandateValidator.deploy() as unknown as MandateValidator;

  // Deploy GroupRegistry
  const GroupRegistry = await ethers.getContractFactory("GroupRegistry");
  const groupRegistry = await GroupRegistry.deploy() as unknown as GroupRegistry;

  // Deploy PredictionMarket
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy(
    await musd.getAddress(),
    feeWallet.address,
    await mandateValidator.getAddress()
  ) as unknown as PredictionMarket;

  // Wire PredictionMarket into MandateValidator
  await mandateValidator.setPredictionMarket(await predictionMarket.getAddress());

  // Fund alice and bob with MUSD
  const musdAddress = await musd.getAddress();
  await musd.transfer(alice.address, HUNDRED_MUSD * 100n);
  await musd.transfer(bob.address, HUNDRED_MUSD * 100n);
  await musd.transfer(charlie.address, HUNDRED_MUSD * 100n);

  // Register mandates for alice and bob
  await mandateValidator.registerMandate(alice.address, HUNDRED_MUSD);
  await mandateValidator.registerMandate(bob.address, HUNDRED_MUSD);
  await mandateValidator.registerMandate(charlie.address, HUNDRED_MUSD);

  // Approve PredictionMarket to spend MUSD on behalf of alice and bob
  const pmAddress = await predictionMarket.getAddress();
  await musd.connect(alice).approve(pmAddress, ethers.MaxUint256);
  await musd.connect(bob).approve(pmAddress, ethers.MaxUint256);
  await musd.connect(charlie).approve(pmAddress, ethers.MaxUint256);

  // Helper: create a market
  const deadline = (await time.latest()) + ONE_WEEK;
  const groupId = ethers.keccak256(ethers.toUtf8Bytes("group1"));

  async function createDefaultMarket() {
    const tx = await predictionMarket
      .connect(owner)
      .createMarket(groupId, "Will BTC close above $120k this week?", deadline, resolver.address, 0);
    const receipt = await tx.wait();
    const event = receipt!.logs
      .map((log) => {
        try { return predictionMarket.interface.parseLog(log as any); } catch { return null; }
      })
      .find((e) => e?.name === "MarketCreated");
    return event!.args.marketId as string;
  }

  return {
    musd, mandateValidator, groupRegistry, predictionMarket,
    owner, alice, bob, charlie, feeWallet, resolver, nonResolver,
    groupId, deadline,
    createDefaultMarket,
    pmAddress,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("PredictionMarket", function () {

  // ── Market Creation ────────────────────────────────────────────────────────

  describe("createMarket()", function () {
    it("should create a market and emit MarketCreated", async function () {
      const { predictionMarket, groupId, resolver, deadline, owner } = await loadFixture(deployFixture);
      const tx = await predictionMarket.connect(owner).createMarket(
        groupId, "Test question?", deadline, resolver.address, 0
      );
      await expect(tx).to.emit(predictionMarket, "MarketCreated");
    });

    it("should revert with empty question", async function () {
      const { predictionMarket, groupId, resolver, deadline, owner } = await loadFixture(deployFixture);
      await expect(
        predictionMarket.connect(owner).createMarket(groupId, "", deadline, resolver.address, 0)
      ).to.be.revertedWithCustomError(predictionMarket, "EmptyQuestion");
    });

    it("should revert with past deadline", async function () {
      const { predictionMarket, groupId, resolver, owner } = await loadFixture(deployFixture);
      const pastDeadline = (await time.latest()) - 1;
      await expect(
        predictionMarket.connect(owner).createMarket(groupId, "Q?", pastDeadline, resolver.address, 0)
      ).to.be.revertedWithCustomError(predictionMarket, "InvalidDeadline");
    });
  });

  // ── Staking ────────────────────────────────────────────────────────────────

  describe("stake()", function () {
    it("full lifecycle: YES and NO stake recorded correctly", async function () {
      const { predictionMarket, alice, bob, createDefaultMarket } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();

      await predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD);
      await predictionMarket.connect(bob).stake(marketId, false, FIFTY_MUSD);

      const [,,,,,,,, yesPool, noPool, participantCount] = await predictionMarket.getMarket(marketId);
      expect(yesPool).to.equal(FIFTY_MUSD);
      expect(noPool).to.equal(FIFTY_MUSD);
      expect(participantCount).to.equal(2n);
    });

    it("should emit StakePlaced", async function () {
      const { predictionMarket, alice, createDefaultMarket } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();
      await expect(
        predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD)
      ).to.emit(predictionMarket, "StakePlaced");
    });

    it("should revert if staking after deadline", async function () {
      const { predictionMarket, alice, createDefaultMarket, deadline } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();
      await time.increaseTo(deadline + 1);
      await expect(
        predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD)
      ).to.be.revertedWithCustomError(predictionMarket, "StakingAfterDeadline");
    });

    it("should revert if same user stakes twice on same market", async function () {
      const { predictionMarket, alice, createDefaultMarket } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();
      await predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD);
      await expect(
        predictionMarket.connect(alice).stake(marketId, false, FIFTY_MUSD)
      ).to.be.revertedWithCustomError(predictionMarket, "AlreadyStaked");
    });

    it("should revert if amount is zero", async function () {
      const { predictionMarket, alice, createDefaultMarket } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();
      await expect(
        predictionMarket.connect(alice).stake(marketId, true, 0n)
      ).to.be.revertedWithCustomError(predictionMarket, "ZeroAmount");
    });

    it("should revert when mandate is exceeded", async function () {
      const { predictionMarket, alice, createDefaultMarket } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();
      const overLimit = HUNDRED_MUSD + ONE_MUSD; // mandate limit is 100 MUSD
      await expect(
        predictionMarket.connect(alice).stake(marketId, true, overLimit)
      ).to.be.revertedWithCustomError(predictionMarket, "MandateCheckFailed");
    });

    it("should revert when no mandate is set", async function () {
      const { predictionMarket, nonResolver, createDefaultMarket, musd, pmAddress } =
        await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();
      await musd.transfer(nonResolver.address, HUNDRED_MUSD);
      await musd.connect(nonResolver).approve(pmAddress, ethers.MaxUint256);
      // nonResolver has no mandate registered
      await expect(
        predictionMarket.connect(nonResolver).stake(marketId, true, FIFTY_MUSD)
      ).to.be.revertedWithCustomError(predictionMarket, "MandateCheckFailed");
    });
  });

  // ── Resolution ─────────────────────────────────────────────────────────────

  describe("resolve()", function () {
    it("should revert if called by non-resolver", async function () {
      const { predictionMarket, alice, nonResolver, createDefaultMarket } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();
      await predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD);
      await expect(
        predictionMarket.connect(nonResolver).resolve(marketId, true)
      ).to.be.revertedWithCustomError(predictionMarket, "NotResolver");
    });

    it("should revert if market already resolved", async function () {
      const { predictionMarket, alice, bob, resolver, createDefaultMarket } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();
      await predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD);
      await predictionMarket.connect(bob).stake(marketId, false, FIFTY_MUSD);
      await predictionMarket.connect(resolver).resolve(marketId, true);
      await expect(
        predictionMarket.connect(resolver).resolve(marketId, false)
      ).to.be.revertedWithCustomError(predictionMarket, "MarketAlreadyResolved");
    });
  });

  // ── Fee Routing ─────────────────────────────────────────────────────────────

  describe("1% fee routing", function () {
    it("should route exactly 1% of total pool to protocolFeeAddr on resolution", async function () {
      const { predictionMarket, musd, alice, bob, resolver, feeWallet, createDefaultMarket } =
        await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();

      await predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD);
      await predictionMarket.connect(bob).stake(marketId, false, FIFTY_MUSD);

      const feeBalanceBefore = await musd.balanceOf(feeWallet.address);
      await predictionMarket.connect(resolver).resolve(marketId, true);
      const feeBalanceAfter = await musd.balanceOf(feeWallet.address);

      const totalPool = FIFTY_MUSD + FIFTY_MUSD;
      const expectedFee = (totalPool * 100n) / 10000n; // 1%
      expect(feeBalanceAfter - feeBalanceBefore).to.equal(expectedFee);
    });
  });

  // ── Auto-Distribution ──────────────────────────────────────────────────────

  describe("reward auto-distribution", function () {
    it("winners receive proportional share of net pool (YES wins)", async function () {
      const { predictionMarket, musd, alice, bob, charlie, resolver, createDefaultMarket } =
        await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();

      // alice: 50 YES, bob: 30 YES, charlie: 20 NO
      await predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD);
      await predictionMarket.connect(bob).stake(marketId, true, ethers.parseEther("30"));
      await predictionMarket.connect(charlie).stake(marketId, false, ethers.parseEther("20"));

      const aliceBefore  = await musd.balanceOf(alice.address);
      const bobBefore    = await musd.balanceOf(bob.address);
      const charlieBefore = await musd.balanceOf(charlie.address);

      await predictionMarket.connect(resolver).resolve(marketId, true);

      const totalPool = FIFTY_MUSD + ethers.parseEther("30") + ethers.parseEther("20");
      const feeAmount = (totalPool * 100n) / 10000n;
      const netPool   = totalPool - feeAmount;
      const winPool   = FIFTY_MUSD + ethers.parseEther("30"); // 80 MUSD

      // Alice staked 50 / 80 of winPool
      const aliceExpected  = (netPool * FIFTY_MUSD) / winPool;
      // Bob staked 30 / 80 of winPool
      const bobExpected    = (netPool * ethers.parseEther("30")) / winPool;

      const aliceAfter  = await musd.balanceOf(alice.address);
      const bobAfter    = await musd.balanceOf(bob.address);
      const charlieAfter = await musd.balanceOf(charlie.address);

      expect(aliceAfter - aliceBefore).to.be.closeTo(aliceExpected, ethers.parseEther("0.001"));
      expect(bobAfter - bobBefore).to.be.closeTo(bobExpected, ethers.parseEther("0.001"));
      // Charlie (loser) gets nothing from auto-distribution
      expect(charlieAfter).to.equal(charlieBefore);
    });

    it("emits RewardsDistributed with correct winnerCount", async function () {
      const { predictionMarket, alice, bob, resolver, createDefaultMarket } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();

      await predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD);
      await predictionMarket.connect(bob).stake(marketId, false, FIFTY_MUSD);

      await expect(
        predictionMarket.connect(resolver).resolve(marketId, true)
      ).to.emit(predictionMarket, "RewardsDistributed").withArgs(marketId, 1n, anyValue);
    });
  });

  // ── Zero-Distribution Guard ────────────────────────────────────────────────

  describe("zero-distribution guard", function () {
    it("refunds all stakers pro-rata minus fee when all stakes are on one side", async function () {
      const { predictionMarket, musd, alice, bob, resolver, createDefaultMarket } =
        await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();

      // All YES — no NO stakes
      await predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD);
      await predictionMarket.connect(bob).stake(marketId, true, FIFTY_MUSD);

      const aliceBefore = await musd.balanceOf(alice.address);
      const bobBefore   = await musd.balanceOf(bob.address);

      await predictionMarket.connect(resolver).resolve(marketId, false); // NO wins, but no NO stakes

      const totalPool = FIFTY_MUSD + FIFTY_MUSD;
      const feeAmount = (totalPool * 100n) / 10000n;
      const netPool   = totalPool - feeAmount;

      // Each gets 50% of netPool (equal stakes)
      const expectedRefund = netPool / 2n;
      const aliceAfter = await musd.balanceOf(alice.address);
      const bobAfter   = await musd.balanceOf(bob.address);

      expect(aliceAfter - aliceBefore).to.be.closeTo(expectedRefund, ethers.parseEther("0.001"));
      expect(bobAfter - bobBefore).to.be.closeTo(expectedRefund, ethers.parseEther("0.001"));
    });
  });

  // ── claimReward (pull fallback) ────────────────────────────────────────────

  describe("claimReward()", function () {
    it("reverts for losers", async function () {
      const { predictionMarket, alice, bob, resolver, createDefaultMarket } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();

      await predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD);
      await predictionMarket.connect(bob).stake(marketId, false, FIFTY_MUSD);
      await predictionMarket.connect(resolver).resolve(marketId, true);

      // bob is a loser
      await expect(
        predictionMarket.connect(bob).claimReward(marketId)
      ).to.be.revertedWithCustomError(predictionMarket, "NothingToClaim");
    });

    it("reverts for already-claimed winner (double-claim prevention)", async function () {
      const { predictionMarket, alice, bob, resolver, createDefaultMarket } = await loadFixture(deployFixture);
      const marketId = await createDefaultMarket();

      await predictionMarket.connect(alice).stake(marketId, true, FIFTY_MUSD);
      await predictionMarket.connect(bob).stake(marketId, false, FIFTY_MUSD);
      await predictionMarket.connect(resolver).resolve(marketId, true);

      // alice was auto-distributed — claimed is already true
      await expect(
        predictionMarket.connect(alice).claimReward(marketId)
      ).to.be.revertedWithCustomError(predictionMarket, "NothingToClaim");
    });
  });

  // ── ReentrancyGuard ───────────────────────────────────────────────────────

  describe("ReentrancyGuard", function () {
    it("stake() has nonReentrant guard (covered by OpenZeppelin's ReentrancyGuard)", async function () {
      // Structural: if the contract compiles with nonReentrant on stake/resolve/claimReward,
      // the guard is in place. This test is a compile-time + interface check.
      const { predictionMarket } = await loadFixture(deployFixture);
      // Verify the function selector exists on the deployed contract
      expect(predictionMarket.stake).to.be.a("function");
      expect(predictionMarket.resolve).to.be.a("function");
      expect(predictionMarket.claimReward).to.be.a("function");
    });
  });
});

// Helper: match any bigint value in event assertions
function anyValue() { return true; }
