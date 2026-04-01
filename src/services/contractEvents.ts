import { ethers } from "ethers";
import {
  predictionMarket,
  provider,
  PREDICTION_MARKET_ABI,
} from "../config.js";
import { marketsDb, stakesDb } from "../db/schema.js";
import { broadcast } from "./websocket.js";

export function startContractEventListener() {
  console.log("[events] Starting contract event listener...");

  const iface = new ethers.Interface(PREDICTION_MARKET_ABI);

  // ── StakePlaced — sync pool totals to DB ─────────────────────────────────────
  predictionMarket.on(
    "StakePlaced",
    async (marketId: string, staker: string, direction: boolean, amount: bigint) => {
      try {
        marketsDb.updatePool(marketId, direction, amount.toString());
        const market = marketsDb.get(marketId);
        if (!market) return;

        broadcast(market.group_id, "market:updated", {
          marketId,
          yesPool:          market.yes_pool,
          noPool:           market.no_pool,
          participantCount: stakesDb.getByMarket(marketId).length,
        });

        console.log(`[events] StakePlaced: market=${marketId} staker=${staker} direction=${direction} amount=${amount}`);
      } catch (err) {
        console.error("[events] StakePlaced handler error:", err);
      }
    }
  );

  // ── MarketResolved ────────────────────────────────────────────────────────────
  predictionMarket.on(
    "MarketResolved",
    async (marketId: string, outcome: boolean, totalPool: bigint, feeAmount: bigint) => {
      try {
        marketsDb.resolve(marketId, outcome);
        const market = marketsDb.get(marketId);
        if (!market) return;

        broadcast(market.group_id, "market:resolved", {
          marketId,
          outcome: outcome ? "YES" : "NO",
          totalPool:   totalPool.toString(),
          feeDeducted: feeAmount.toString(),
        });

        console.log(`[events] MarketResolved: market=${marketId} outcome=${outcome}`);
      } catch (err) {
        console.error("[events] MarketResolved handler error:", err);
      }
    }
  );

  // ── RewardsDistributed ────────────────────────────────────────────────────────
  predictionMarket.on(
    "RewardsDistributed",
    async (marketId: string, winnerCount: bigint, netPool: bigint) => {
      const market = marketsDb.get(marketId);
      if (!market) return;
      console.log(`[events] RewardsDistributed: market=${marketId} winners=${winnerCount} netPool=${netPool}`);
    }
  );

  console.log("[events] Listening for: StakePlaced, MarketResolved, RewardsDistributed");
}
