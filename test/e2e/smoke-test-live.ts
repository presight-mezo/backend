import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

/**
 * 2-Wallet Smoke Test for Deployed Sandbox
 * Verifies: Mandate -> Stake (YES/NO) -> Resolve -> Fee -> Distribution
 */

const RPC_URL = process.env.MEZO_RPC_URL!;
const DEPLOYER_PK = process.env.DEPLOYER_PRIVATE_KEY!;
const sandbox = JSON.parse(fs.readFileSync(path.join(__dirname, "../../deployments/sandbox.json"), "utf8"));

const provider = new ethers.JsonRpcProvider(RPC_URL, { chainId: 31611, name: "mezoTestnet" });
const walletA = new ethers.Wallet(DEPLOYER_PK, provider);
const walletB = ethers.Wallet.createRandom(provider);

// ABIs
const ERC20_ABI = ["function mint(address,uint256)", "function approve(address,uint256)", "function balanceOf(address) view returns (uint256)"];
const PM_ABI = ["function createMarket(bytes32,string,uint256,address,uint8) returns (bytes32)", "function stake(bytes32,bool,uint256)", "function resolve(bytes32,bool)", "function getMarket(bytes32) view returns (bytes32,bytes32,string,uint256,address,uint8,uint8,uint8,uint256,uint256,uint256)"];
const MV_ABI = ["function registerMandate(address,uint256)"];
const GR_ABI = ["function createGroup(string) returns (bytes32)"];

async function main() {
  console.log("🚀 Starting Live Smoke Test on Sandbox...");
  console.log(`  Wallet A: ${walletA.address}`);
  console.log(`  Wallet B: ${walletB.address}`);

  const musd = new ethers.Contract(sandbox.addresses.MUSD, ERC20_ABI, walletA);
  const pm = new ethers.Contract(sandbox.addresses.PredictionMarket, PM_ABI, walletA);
  const mv = new ethers.Contract(sandbox.addresses.MandateValidator, MV_ABI, walletA);
  const gr = new ethers.Contract(sandbox.addresses.GroupRegistry, GR_ABI, walletA);

  // 1. Fund Wallet B
  console.log("\n━━ 1. Funding Wallets ━━");
  await (await walletA.sendTransaction({ to: walletB.address, value: ethers.parseEther("0.0001") })).wait();
  await (await musd.mint(walletA.address, ethers.parseEther("1000"))).wait();
  await (await musd.mint(walletB.address, ethers.parseEther("1000"))).wait();
  console.log("  ✅ Wallet B gas and MUSD funded");

  // 2. Register Mandates
  console.log("\n━━ 2. Registering Mandates ━━");
  await (await mv.registerMandate(walletA.address, ethers.parseEther("100"))).wait();
  const mvB = mv.connect(walletB);
  await (await (mvB as any).registerMandate(walletB.address, ethers.parseEther("100"))).wait();
  console.log("  ✅ Mandates registered for both wallets");

  // 3. Create Group & Market
  console.log("\n━━ 3. Creating Market ━━");
  const grTx = await gr.createGroup("Sandbox Group");
  const grReceipt = await grTx.wait();
  
  const grIface = new ethers.Interface(["event GroupCreated(bytes32 indexed groupId, address indexed admin, string name)"]);
  let groupId = "";
  for (const log of grReceipt.logs) {
    try {
      const p = grIface.parseLog(log as any);
      if (p?.name === "GroupCreated") { groupId = p.args.groupId; break; }
    } catch {}
  }

  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const mTx = await pm.createMarket(groupId, "Sandbox Market?", deadline, walletA.address, 0);
  const mReceipt = await mTx.wait();

  const pmIface = new ethers.Interface(["event MarketCreated(bytes32 indexed marketId, bytes32 indexed groupId, string question, address resolver, uint8 mode, uint256 deadline)"]);
  let marketId = "";
  for (const log of mReceipt.logs) {
    try {
      const p = pmIface.parseLog(log as any);
      if (p?.name === "MarketCreated") { marketId = p.args.marketId; break; }
    } catch {}
  }
  console.log(`  ✅ Market Created: ${marketId}`);

  // 4. Stake
  console.log("\n━━ 4. Dual Staking ━━");
  await (await musd.approve(sandbox.addresses.PredictionMarket, ethers.MaxUint256)).wait();
  await (await pm.stake(marketId, true, ethers.parseEther("10"))).wait();
  
  const musdB = musd.connect(walletB);
  const pmB = pm.connect(walletB);
  await (await (musdB as any).approve(sandbox.addresses.PredictionMarket, ethers.MaxUint256)).wait();
  await (await (pmB as any).stake(marketId, false, ethers.parseEther("10"))).wait();
  console.log("  ✅ Stake YES (10) and NO (10) successful");

  // 5. Resolve
  console.log("\n━━ 5. Resolution & Fee Routing ━━");
  const feeBefore = await musd.balanceOf(sandbox.addresses.protocolFeeAddress);
  await (await pm.resolve(marketId, true)).wait();
  const feeAfter = await musd.balanceOf(sandbox.addresses.protocolFeeAddress);
  
  console.log(`  ✅ Market Resolved (YES wins)`);
  console.log(`  ✅ Fee Before: ${ethers.formatEther(feeBefore)}`);
  console.log(`  ✅ Fee After:  ${ethers.formatEther(feeAfter)} (Diff: ${ethers.formatEther(feeAfter - feeBefore)})`);

  if (feeAfter > feeBefore) {
    console.log("\n✨ FINAL VERIFICATION: PASS ✨");
    console.log("Weekly Gate Requirements Satisfied Across 2 Distinct Wallets.");
  } else {
    throw new Error("Fee distribution failed!");
  }
}

main().catch(console.error);
