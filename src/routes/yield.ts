import { Router, Request, Response } from "express";
import { marketsDb, trovesDb, stakesDb } from "../db/schema.js";
import { calculateYield } from "../services/yieldSimulator.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Yield
 *   description: Time-based yield accrual simulation for Zero Risk mode
 */

/**
 * @swagger
 * /api/v1/yield/accrued:
 *   get:
 *     summary: Get total live accrued yield across all markets for the connected user
 *     tags: [Yield]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total accrued MUSD yield
 */
router.get("/accrued", requireAuth, (req: Request, res: Response) => {
  const userAddress = req.userAddress!;
  const trove = trovesDb.get(userAddress);
  
  if (!trove) {
    res.json({ accruedYield: "0", troveBalance: "0" });
    return;
  }

  const troveBalanceStr = trove.trove_balance;
  const troveBalanceBig = BigInt(troveBalanceStr);

  const openMarkets = marketsDb.getOpenZeroRisk();
  let totalAccrued = 0n;

  for (const m of openMarkets) {
    if (stakesDb.hasStaked(m.id, userAddress)) {
      const openedAt = new Date(m.created_at);
      totalAccrued += calculateYield(troveBalanceBig, openedAt);
    }
  }

  res.json({
    userAddress,
    troveBalance: troveBalanceStr,
    accruedYield: totalAccrued.toString(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/v1/yield/{userAddress}/{marketId}:
 *   get:
 *     summary: Get live accrued yield for a specific user and market
 *     tags: [Yield]
 *     parameters:
 *       - in: path
 *         name: userAddress
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Accrued MUSD yield amount
 *       404:
 *         description: Market not found
 */
router.get("/:userAddress/:marketId", (req: Request, res: Response) => {
  const userAddress = req.params.userAddress as string;
  const marketId = req.params.marketId as string;

  const market = marketsDb.get(marketId);
  if (!market) {
    res.status(404).json({ error: "MARKET_NOT_FOUND" });
    return;
  }

  let trove = trovesDb.get(userAddress);
  
  // MVP Auto-Mocking for smooth demos: Assume 5 BTC equivalent if no trove exists
  if (!trove) {
    // 5 BTC in satoshis = 500,000,000, mapped abstractly to wei for simplicity in MVP
    const mockTroveBalance = "50000000000000000000000"; // 50K MUSD equivalent collateral
    trovesDb.upsert(userAddress, mockTroveBalance, "10000000000000000000"); // 10 MUSD wallet
    trove = trovesDb.get(userAddress);
  }

  const troveBalanceStr = trove.trove_balance;
  const openedAt = new Date(market.created_at);
  const accruedYield = calculateYield(BigInt(troveBalanceStr), openedAt);

  res.json({
    userAddress,
    marketId,
    troveBalance: troveBalanceStr,
    accruedYield: accruedYield.toString(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
