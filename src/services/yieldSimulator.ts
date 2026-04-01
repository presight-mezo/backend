import { marketsDb, stakesDb, trovesDb } from "../db/schema.js";
import { broadcast } from "./websocket.js";

// Simulated Mezo Annual Yield Rate: 5%
const ANNUAL_YIELD_RATE = 0.05;
const SECONDS_PER_YEAR = 31_536_000;

/**
 * Calculate the accrued yield based on the user's trove balance and elapsed time.
 * @param troveBalance The user's active BTC collateral balance (or equivalent metric used for yield)
 * @param openedAt The timestamp when the market was created
 * @returns Yield amount in wei
 */
export function calculateYield(troveBalance: bigint, openedAt: Date): bigint {
  const elapsedSeconds = (Date.now() - openedAt.getTime()) / 1000;
  if (elapsedSeconds <= 0) return 0n;

  const ratePerSecond = (Number(troveBalance) * ANNUAL_YIELD_RATE) / SECONDS_PER_YEAR;
  return BigInt(Math.floor(ratePerSecond * elapsedSeconds));
}

/**
 * Start the background simulation loop that pushes real-time yield updates to connected clients.
 */
export function startYieldSimulator() {
  console.log("[yield] Starting Zero Risk Mode yield simulator...");

  setInterval(() => {
    try {
      const openZeroRiskMarkets = marketsDb.getOpenZeroRisk();

      for (const market of openZeroRiskMarkets) {
        const openedAt = new Date(market.created_at);
        const stakes = stakesDb.getByMarket(market.id);

        for (const stake of stakes) {
          if (stake.mode === "zero-risk") {
            const trove = trovesDb.get(stake.user_address);
            if (trove) {
              const troveBalance = BigInt(trove.trove_balance);
              const accruedAmount = calculateYield(troveBalance, openedAt);

              broadcast(market.group_id, "yield:tick", {
                marketId: market.id,
                userAddress: stake.user_address,
                accruedAmount: accruedAmount.toString(),
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.error("[yield] Simulator loop error:", err.message);
    }
  }, 30_000); // Trigger every 30 seconds
}
