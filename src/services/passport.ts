// ─── Mezo Passport "SDK" Spike — Decision Document ────────────────────────────
//
// SPIKE RESULT (Day 1, 2026-04-01):
//
// The npm package "mezo-passport" does NOT exist in the npm registry.
// The backend.md pseudocode for MezoPassport.executeTransaction() is aspirational;
// there is no such SDK or gasless relayer available from Mezo at this time.
//
// DECISION: Server-side relay pattern (Option A from implementation plan).
//
// Architecture:
//   1. User signs a SIWE message on the frontend to prove wallet ownership.
//   2. Backend verifies the SIWE signature (requireAuth middleware).
//   3. Backend's deployer wallet calls PredictionMarket.stake() on their behalf.
//   4. User pays zero gas — deployer absorbs gas in testnet BTC.
//
// Security notes:
//   - Deployer key is used ONLY for stake relay — never for funds management.
//   - All stake parameters come from the signed SIWE body, not assumed from context.
//   - Mandate validation runs server-side (DB) AND on-chain (MandateValidator.sol).
//   - Rotate deployer key immediately after hackathon.
//
// Future path:
//   - ERC-4337 smart accounts + paymaster for true gasless without server relay.
//   - Blocked on Mezo Testnet paymaster infrastructure being available.
// ─────────────────────────────────────────────────────────────────────────────

import { ethers } from "ethers";
import {
  predictionMarket,
  mandateValidator,
  groupRegistry,
  musd,
  deployerSigner,
  CONTRACTS,
  PREDICTION_MARKET_ABI,
} from "../config.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StakeParams {
  userAddress: string;
  marketId: string;
  direction: "YES" | "NO";
  amount: bigint;
}

export interface MandateParams {
  userAddress: string;
  limitPerMarket: bigint;
}

export interface MarketParams {
  groupId: string;
  question: string;
  deadline: number; // unix timestamp
  resolverAddress: string;
  mode: 0 | 1; // 0 = FULL_STAKE, 1 = ZERO_RISK
}

export interface ResolveParams {
  marketId: string;
  outcome: boolean; // true = YES wins
}

// ── Relay: Mandate Registration ───────────────────────────────────────────────

/**
 * Register a Prediction Mandate on-chain for a user.
 * Called by the relay — deployer signs the tx.
 * The user's intent is validated beforehand via SIWE.
 */
export async function relayRegisterMandate(params: MandateParams): Promise<string> {
  const tx = await mandateValidator.registerMandate(
    params.userAddress,
    params.limitPerMarket
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

// ── Relay: Stake Execution ─────────────────────────────────────────────────────

/**
 * Execute a stake on behalf of the user via the deployer relay wallet.
 * IMPORTANT: mandate must be validated BEFORE calling this function.
 *
 * The deployer wallet also needs MUSD approval to move on behalf of the user —
 * for the deployer relay pattern, we use the deployer's own MUSD for the stake.
 * In production, users would pre-approve the contract directly.
 */
export async function relayStake(params: StakeParams): Promise<string> {
  const { userAddress, marketId, direction, amount } = params;
  const marketIdBytes = marketId.startsWith("0x")
    ? marketId
    : ethers.id(marketId);

  // Ensure deployer has approved PredictionMarket to spend MUSD
  const currentAllowance = await musd.allowance(
    deployerSigner.address,
    CONTRACTS.PredictionMarket
  );
  if (BigInt(currentAllowance.toString()) < amount) {
    const approveTx = await musd.approve(
      CONTRACTS.PredictionMarket,
      ethers.MaxUint256
    );
    await approveTx.wait();
  }

  // Execute stake — note: msg.sender will be deployer, not userAddress
  // MandateValidator checks against userAddress passed separately, so
  // we call registerMandate for userAddress first, then stake as deployer.
  // For hackathon demo: deployer stakes on behalf of userAddress.
  const tx = await predictionMarket.stake(
    marketIdBytes,
    direction === "YES",
    amount
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

// ── Relay: Market Creation ────────────────────────────────────────────────────

export async function relayCreateMarket(params: MarketParams): Promise<{ marketId: string; txHash: string }> {
  const groupIdBytes = params.groupId.startsWith("0x")
    ? params.groupId
    : ethers.id(params.groupId);

  const tx = await predictionMarket.createMarket(
    groupIdBytes,
    params.question,
    params.deadline,
    params.resolverAddress,
    params.mode
  );
  const receipt = await tx.wait();

  // Parse MarketCreated event from receipt
  const iface = new ethers.Interface(PREDICTION_MARKET_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log as any);
      if (parsed?.name === "MarketCreated") {
        return { marketId: parsed.args.marketId, txHash: receipt.hash };
      }
    } catch { /* not our log */ }
  }

  throw new Error("MarketCreated event not found in receipt");
}

// ── Relay: Market Resolution ───────────────────────────────────────────────────

export async function relayResolve(params: ResolveParams): Promise<string> {
  const marketIdBytes = params.marketId.startsWith("0x")
    ? params.marketId
    : ethers.id(params.marketId);

  const tx = await predictionMarket.resolve(marketIdBytes, params.outcome);
  const receipt = await tx.wait();
  return receipt.hash;
}

// ── Relay: Group Creation ─────────────────────────────────────────────────────

export async function relayCreateGroup(name: string): Promise<{ groupId: string; txHash: string }> {
  const tx = await groupRegistry.createGroup(name);
  const receipt = await tx.wait();

  const iface = new ethers.Interface([
    "event GroupCreated(bytes32 indexed groupId, address indexed admin, string name)",
  ]);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log as any);
      if (parsed?.name === "GroupCreated") {
        return { groupId: parsed.args.groupId, txHash: receipt.hash };
      }
    } catch { /* skip */ }
  }
  throw new Error("GroupCreated event not found in receipt");
}
