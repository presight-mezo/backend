/**
 * E2E Fresh Deploy + Full Stake Test
 *
 * Deploys MockERC20 + fresh PredictionMarket + MandateValidator on Mezo Testnet,
 * then runs the full 2-wallet stake-and-distribute cycle.
 *
 * Run: npx tsx test/e2e/stake-and-distribute.ts
 *
 * Required .env:
 *   DEPLOYER_PRIVATE_KEY — wallet with testnet BTC for gas
 *   WALLET_B_PRIVATE_KEY — second wallet (optional, defaults to derived key)
 *   MEZO_RPC_URL
 *
 * Note: Uses MockERC20 (not real MUSD) to avoid CDP dependency during testing.
 *       The production contracts use real MUSD at 0x118917...
 */

import * as dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

dotenv.config();

// ─── Setup ────────────────────────────────────────────────────────────────────

const RPC_URL     = process.env.MEZO_RPC_URL!;
const DEPLOYER_PK = process.env.DEPLOYER_PRIVATE_KEY!;
const FEE_ADDR    = process.env.MEZO_PROTOCOL_FEE_ADDRESS!;

const provider = new ethers.JsonRpcProvider(RPC_URL, { chainId: 31611, name: "mezoTestnet" });
const walletA  = new ethers.Wallet(
  DEPLOYER_PK.startsWith("0x") ? DEPLOYER_PK : `0x${DEPLOYER_PK}`, provider
);

// Wallet B: use WALLET_B_PRIVATE_KEY or derive a second test key
const WALLET_B_PK = process.env.WALLET_B_PRIVATE_KEY;
const walletB = WALLET_B_PK
  ? new ethers.Wallet(WALLET_B_PK.startsWith("0x") ? WALLET_B_PK : `0x${WALLET_B_PK}`, provider)
  : ethers.Wallet.createRandom(provider);

const STAKE_AMOUNT = ethers.parseEther("10"); // 10 mock MUSD each

// ─── Contract ABIs ────────────────────────────────────────────────────────────

const MOCK_ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
  "function mint(address,uint256)",
];

const PM_ABI = [
  "function createMarket(bytes32,string,uint256,address,uint8) returns (bytes32)",
  "function stake(bytes32,bool,uint256)",
  "function resolve(bytes32,bool)",
  "function getMarket(bytes32) view returns (bytes32,bytes32,string,uint256,address,uint8,uint8,uint8,uint256,uint256,uint256)",
  "function getStakers(bytes32) view returns (address[])",
  "event MarketCreated(bytes32 indexed,bytes32 indexed,string,address,uint8,uint256)",
  "event RewardsDistributed(bytes32 indexed,uint256,uint256)",
];

const MV_ABI = ["function registerMandate(address,uint256)"];
const GR_ABI = [
  "function createGroup(string) returns (bytes32)",
  "event GroupCreated(bytes32 indexed,address indexed,string)",
];

// ─── Load Hardhat artifacts ───────────────────────────────────────────────────

function loadArtifact(name: string) {
  const subFolder = name === "MockERC20" ? "mocks/MockERC20.sol" : `${name}.sol`;
  const p = path.join(process.cwd(), "artifacts", "contracts", subFolder, `${name}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pass(msg: string) { console.log(`  ✅ ${msg}`); }
function fail(msg: string) { console.error(`  ❌ ${msg}`); process.exitCode = 1; }
function section(msg: string) { console.log(`\n━━ ${msg} ━━`); }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("══════════════════════════════════════════════════════");
  console.log("  Presight E2E: Fresh Deploy + Stake + Distribution");
  console.log("══════════════════════════════════════════════════════\n");
  console.log(`  Wallet A: ${walletA.address}`);
  console.log(`  Wallet B: ${walletB.address}`);
  console.log();

  // ── Step 0: Deploy contracts ────────────────────────────────────────────────
  section("0. Deploy Test Contracts");

  // Deploy MockERC20
  const mockArtifact = loadArtifact("MockERC20");
  const MockFactory  = new ethers.ContractFactory(mockArtifact.abi, mockArtifact.bytecode, walletA);
  const mockMusd     = await MockFactory.deploy("Test MUSD", "tMUSD", ethers.parseEther("10000000"));
  await mockMusd.waitForDeployment();
  const mockMusdAddr = await mockMusd.getAddress();
  pass(`MockERC20 deployed: ${mockMusdAddr}`);

  // Deploy MandateValidator
  const mvArtifact = loadArtifact("MandateValidator");
  const MVFactory  = new ethers.ContractFactory(mvArtifact.abi, mvArtifact.bytecode, walletA);
  const mv         = await MVFactory.deploy();
  await mv.waitForDeployment();
  const mvAddr     = await mv.getAddress();
  pass(`MandateValidator deployed: ${mvAddr}`);

  // Deploy PredictionMarket
  const pmArtifact = loadArtifact("PredictionMarket");
  const PMFactory  = new ethers.ContractFactory(pmArtifact.abi, pmArtifact.bytecode, walletA);
  const pm         = await PMFactory.deploy(mockMusdAddr, FEE_ADDR, mvAddr);
  await pm.waitForDeployment();
  const pmAddr     = await pm.getAddress();
  pass(`PredictionMarket deployed: ${pmAddr}`);

  // Wire PM → MV
  const mvFull       = new ethers.Contract(mvAddr, mvArtifact.abi, walletA);
  await (await (mvFull as any).setPredictionMarket(pmAddr)).wait();
  pass(`MandateValidator wired to PredictionMarket`);

  // Deploy GroupRegistry
  const grArtifact = loadArtifact("GroupRegistry");
  const GRFactory  = new ethers.ContractFactory(grArtifact.abi, grArtifact.bytecode, walletA);
  const gr         = await GRFactory.deploy();
  await gr.waitForDeployment();
  const grAddr     = await gr.getAddress();
  pass(`GroupRegistry deployed: ${grAddr}`);

  // Typed contract instances
  const musd    = new ethers.Contract(mockMusdAddr, MOCK_ERC20_ABI, walletA);
  const pmTyped = new ethers.Contract(pmAddr, PM_ABI, walletA);
  const mvTyped = new ethers.Contract(mvAddr, MV_ABI, walletA);
  const grTyped = new ethers.Contract(grAddr, GR_ABI, walletA);

  // ── Step 1: Fund wallets with MockERC20 ──────────────────────────────────────
  section("1. Fund Wallets");
  const mockMusd_W = new ethers.Contract(mockMusdAddr, MOCK_ERC20_ABI, walletA);

  // Mint 10000 tMUSD for Wallet A
  await (await (mockMusd_W as any).mint(walletA.address, ethers.parseEther("10000"))).wait();
  const balA = await musd.balanceOf(walletA.address);
  pass(`Wallet A (tMUSD): ${ethers.formatEther(balA)}`);

  // Fund Wallet B with gas (0.0001 BTC) and MUSD
  const fundTx = await walletA.sendTransaction({
    to: walletB.address,
    value: ethers.parseEther("0.0001") // testnet BTC for gas
  });
  await fundTx.wait();
  pass(`Wallet B funded with gas (0.0001 tBTC)`);

  await (await (mockMusd_W as any).mint(walletB.address, ethers.parseEther("10000"))).wait();
  const balB = await musd.balanceOf(walletB.address);
  pass(`Wallet B (tMUSD): ${ethers.formatEther(balB)}`);

  const feeBefore = await musd.balanceOf(FEE_ADDR);
  console.log(`  Fee addr: ${ethers.formatEther(feeBefore)} tMUSD`);

  // ── Step 2: Create Group ──────────────────────────────────────────────────────
  section("2. Create Group");
  const grTx      = await grTyped.createGroup(`E2E-${Date.now()}`);
  const grReceipt = await grTx.wait();
  const grIface   = new ethers.Interface(GR_ABI);
  let groupId = "";
  for (const log of grReceipt.logs) {
    try {
      const p = grIface.parseLog(log as any);
      if (p?.name === "GroupCreated") { groupId = p.args[0]; break; }
    } catch {}
  }
  if (!groupId) { fail("GroupCreated event not found"); return; }
  pass(`Group: ${groupId}`);

  // ── Step 3: Register Mandates ──────────────────────────────────────────────
  section("3. Register Mandates");
  await (await mvTyped.registerMandate(walletA.address, ethers.parseEther("100"))).wait();
  pass(`Wallet A mandate: 100 tMUSD limit`);

  const mvB = new ethers.Contract(mvAddr, MV_ABI, walletB);
  await (await mvB.registerMandate(walletB.address, ethers.parseEther("100"))).wait();
  pass(`Wallet B mandate: 100 tMUSD limit`);

  // ── Step 4: Create Market ──────────────────────────────────────────────────
  section("4. Create Market");
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const mTx      = await pmTyped.createMarket(
    groupId,
    "Will BTC close above $100K this week?",
    deadline,
    walletA.address, // Wallet A = resolver
    0                // FULL_STAKE
  );
  const mReceipt = await mTx.wait();
  const pmIface  = new ethers.Interface(PM_ABI);
  let marketId   = "";
  for (const log of mReceipt.logs) {
    try {
      const p = pmIface.parseLog(log as any);
      if (p?.name === "MarketCreated") { marketId = p.args[0]; break; }
    } catch {}
  }
  if (!marketId) { fail("MarketCreated event not found"); return; }
  pass(`Market: ${marketId}`);

  // ── Step 5: Approve + Stake ────────────────────────────────────────────────
  section("5. Stake");
  await (await musd.approve(pmAddr, ethers.MaxUint256)).wait();
  pass(`Wallet A approved tMUSD`);

  await (await pmTyped.stake(marketId, true /* YES */, STAKE_AMOUNT)).wait();
  pass(`Wallet A staked YES: ${ethers.formatEther(STAKE_AMOUNT)} tMUSD`);

  const musdB = new ethers.Contract(mockMusdAddr, MOCK_ERC20_ABI, walletB);
  await (await musdB.approve(pmAddr, ethers.MaxUint256)).wait();
  const pmB   = new ethers.Contract(pmAddr, PM_ABI, walletB);
  await (await pmB.stake(marketId, false /* NO */, STAKE_AMOUNT)).wait();
  pass(`Wallet B staked NO: ${ethers.formatEther(STAKE_AMOUNT)} tMUSD`);

  // ── Step 6: Verify On-Chain Pool ───────────────────────────────────────────
  section("6. Verify Pool");
  const marketData = await pmTyped.getMarket(marketId);
  const yesPool    = marketData[8];
  const noPool     = marketData[9];
  const participants = marketData[10];
  console.log(`  YES pool:     ${ethers.formatEther(yesPool)} tMUSD`);
  console.log(`  NO pool:      ${ethers.formatEther(noPool)} tMUSD`);
  console.log(`  Participants: ${participants}`);

  if (yesPool >= STAKE_AMOUNT) pass(`YES pool ≥ stake amount ✓`);
  else fail(`YES pool too low: ${ethers.formatEther(yesPool)}`);

  // ── Step 7: Resolve (YES wins) ─────────────────────────────────────────────
  section("7. Resolve Market");
  const walletABefore = await musd.balanceOf(walletA.address);
  const feeBefore2    = await musd.balanceOf(FEE_ADDR);

  const resTx = await pmTyped.resolve(marketId, true /* YES wins */);
  await resTx.wait();
  pass(`Market resolved: outcome = YES`);

  // Wait for RewardsDistributed
  await new Promise(r => setTimeout(r, 2000));

  // ── Step 8: Verify Balances ────────────────────────────────────────────────
  section("8. Verify Balances & Fee");
  const walletAAfter = await musd.balanceOf(walletA.address);
  const feeAfter     = await musd.balanceOf(FEE_ADDR);
  const totalPool    = yesPool + noPool;
  const expectedFee  = (totalPool * 100n) / 10000n; // 1%

  console.log(`  Wallet A before: ${ethers.formatEther(walletABefore)} tMUSD`);
  console.log(`  Wallet A after:  ${ethers.formatEther(walletAAfter)} tMUSD`);
  console.log(`  Fee addr before: ${ethers.formatEther(feeBefore2)} tMUSD`);
  console.log(`  Fee addr after:  ${ethers.formatEther(feeAfter)} tMUSD`);
  console.log(`  Expected fee:    ${ethers.formatEther(expectedFee)} tMUSD (1%)`);

  const feeReceived = feeAfter - feeBefore2;
  if (feeReceived >= expectedFee) pass(`Protocol fee routed correctly (1%): ${ethers.formatEther(feeReceived)} tMUSD ✓`);
  else fail(`Fee mismatch: expected ${ethers.formatEther(expectedFee)}, got ${ethers.formatEther(feeReceived)}`);

  const gain = walletAAfter - walletABefore;
  if (gain > 0n) pass(`Winner (Wallet A) net gain: ${ethers.formatEther(gain)} tMUSD ✓ (Includes Loser's stake minus fee)`);
  else           fail(`Winner (Wallet A) did not gain tMUSD`);

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  if (process.exitCode === 1) {
    console.log("  ❌ E2E TEST FAILED — see errors above");
  } else {
    console.log("  ✅ E2E TEST PASSED — full cycle confirmed on Mezo Testnet");
    console.log("\n  Deployed contracts (test instances):");
    console.log(`    MockERC20:        ${mockMusdAddr}`);
    console.log(`    MandateValidator: ${mvAddr}`);
    console.log(`    PredictionMarket: ${pmAddr}`);
    console.log(`    GroupRegistry:    ${grAddr}`);
  }
  console.log("══════════════════════════════════════════════════════");
}

main().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
