import { ethers } from "ethers";
import {
  predictionMarket,
  provider,
} from "../config.js";
import { marketsDb, stakesDb, syncDb } from "../db/schema.js";
import { broadcast } from "./websocket.js";

const POLLING_INTERVAL = 12000; // 12 seconds
const CHUNK_SIZE = 1000;       // blocks per poll

export async function startContractEventListener() {
  console.log("[events] Starting robust contract event sync...");

  let lastProcessedBlock = syncDb.getLastBlock();
  if (lastProcessedBlock === 0) {
    // Start from current block if no history
    lastProcessedBlock = await provider.getBlockNumber();
    syncDb.updateLastBlock(lastProcessedBlock);
    console.log(`[events] No sync history found. Starting from current block: ${lastProcessedBlock}`);
  } else {
    console.log(`[events] Resuming sync from block: ${lastProcessedBlock}`);
  }

  // Periodic polling loop
  setInterval(async () => {
    try {
      const currentBlock = await provider.getBlockNumber();
      if (currentBlock <= lastProcessedBlock) return;

      const toBlock = Math.min(lastProcessedBlock + CHUNK_SIZE, currentBlock);
      console.log(`[events] Syncing logs: ${lastProcessedBlock + 1} -> ${toBlock}`);

      // 1. Fetch StakePlaced logs
      const stakeLogs = await predictionMarket.queryFilter("StakePlaced", lastProcessedBlock + 1, toBlock);
      for (const log of stakeLogs) {
        const [marketId, staker, direction, amount] = (log as any).args;
        try {
          marketsDb.updatePool(marketId, direction, amount.toString());
          const market = marketsDb.get(marketId);
          if (market) {
            broadcast(market.group_id, "market:updated", {
              marketId,
              yesPool:          market.yes_pool,
              noPool:           market.no_pool,
              participantCount: stakesDb.getByMarket(marketId).length,
            });
          }
          console.log(`[events] StakePlaced sync: market=${marketId} staker=${staker} amount=${amount}`);
        } catch (err) {
          console.error(`[events] Failed to process StakePlaced log:`, err);
        }
      }

      // 2. Fetch MarketResolved logs
      const resolveLogs = await predictionMarket.queryFilter("MarketResolved", lastProcessedBlock + 1, toBlock);
      for (const log of resolveLogs) {
        const [marketId, outcome, totalPool, feeAmount] = (log as any).args;
        try {
          marketsDb.resolve(marketId, outcome);
          const market = marketsDb.get(marketId);
          if (market) {
            broadcast(market.group_id, "market:resolved", {
              marketId,
              outcome: outcome ? "YES" : "NO",
              totalPool:   totalPool.toString(),
              feeDeducted: feeAmount.toString(),
            });
          }
          console.log(`[events] MarketResolved sync: market=${marketId} outcome=${outcome}`);
        } catch (err) {
          console.error(`[events] Failed to process MarketResolved log:`, err);
        }
      }

      // 3. Fetch RewardsDistributed logs
      const rewardLogs = await predictionMarket.queryFilter("RewardsDistributed", lastProcessedBlock + 1, toBlock);
      for (const log of rewardLogs) {
        const [marketId, winnerCount, netPool] = (log as any).args;
        try {
          const market = marketsDb.get(marketId);
          if (market) {
            broadcast(market.group_id, "rewards:distributed", {
              marketId,
              winnerCount: winnerCount.toString(),
              netPool: netPool.toString(),
            });
          }
          console.log(`[events] RewardsDistributed sync: market=${marketId} winners=${winnerCount} netPool=${netPool}`);
        } catch (err) {
          console.error(`[events] Failed to process RewardsDistributed log:`, err);
        }
      }

      // Update sync progress
      lastProcessedBlock = toBlock;
      syncDb.updateLastBlock(toBlock);
    } catch (err: any) {
      console.error("[events] Polling loop error:", err.message);
    }
  }, POLLING_INTERVAL);
}
