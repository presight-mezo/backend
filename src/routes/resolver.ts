import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { marketsDb, stakesDb, scoresDb } from "../db/schema.js";
import { relayResolve } from "../services/passport.js";
import { broadcast } from "../services/websocket.js";
import { predictionMarket } from "../config.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Resolver
 *   description: Market resolution and settlement by trusted resolvers
 */

/**
 * @swagger
 * /api/v1/resolver/notifications:
 *   get:
 *     summary: Get notifications for markets requiring resolution by the caller
 *     tags: [Resolver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of markets that need resolution
 *       401:
 *         description: Unauthorized
 */
router.get("/notifications", requireAuth, (req: Request, res: Response) => {
  const userAddress = req.userAddress!;
  
  // Fetch markets where the resolver is the current user and status is OPEN
  const pendingMarkets = marketsDb.getByResolverAndStatus(userAddress, "OPEN");

  // Filter for markets that are past their deadline, or approaching it (e.g. within 24 hours)
  const now = Date.now();
  const notifications = pendingMarkets.map((m: any) => {
    const deadlineMs = new Date(m.deadline).getTime();
    const isPastDeadline = now >= deadlineMs;
    return {
      marketId: m.id,
      groupId: m.group_id,
      question: m.question,
      deadline: m.deadline,
      isResponseRequired: isPastDeadline, // True if deadline has passed and it needs resolution
    };
  });

  res.json({ notifications });
});

/**
 * @swagger
 * /api/v1/resolver/{marketId}/resolve:
 *   post:
 *     summary: Resolve a market with an outcome (Relayed)
 *     tags: [Resolver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               outcome:
 *                 type: string
 *                 enum: [YES, NO]
 *     responses:
 *       200:
 *         description: Market resolved and rewards distributed
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the assigned resolver
 *       404:
 *         description: Market not found
 *       409:
 *         description: Already resolved
 */
router.post("/:marketId/resolve", requireAuth, async (req: Request, res: Response) => {
  const marketId = req.params.marketId as string;
  const { outcome }  = req.body;
  const userAddress  = req.userAddress!;

  if (outcome !== "YES" && outcome !== "NO") {
    res.status(400).json({ error: "BAD_REQUEST", message: "outcome must be 'YES' or 'NO'" });
    return;
  }

  // Fetch market
  const market = marketsDb.get(marketId);
  if (!market) {
    res.status(404).json({ error: "MARKET_NOT_FOUND" });
    return;
  }
  if (market.status === "RESOLVED") {
    res.status(409).json({ error: "ALREADY_RESOLVED" });
    return;
  }

  // Verify caller is the assigned resolver
  if (market.resolver_address.toLowerCase() !== userAddress.toLowerCase()) {
    res.status(403).json({ error: "NOT_RESOLVER", message: "Only the assigned resolver can resolve this market" });
    return;
  }

  try {
    const txHash = await relayResolve({ marketId, outcome: outcome === "YES" });

    // Update DB
    marketsDb.resolve(marketId, outcome === "YES");

    // Recalculate conviction scores
    await recalculateScores(marketId, market.group_id, outcome);

    // Fetch resolution details from chain
    const stakes = stakesDb.getByMarket(marketId);
    const totalPool = stakes.reduce((acc: bigint, s: any) => acc + BigInt(s.amount), 0n);
    const feeAmount = (totalPool * 100n) / 10000n;
    const winners   = stakes.filter((s: any) => s.direction === outcome);

    broadcast(market.group_id, "market:resolved", {
      marketId,
      outcome,
      totalPool:   totalPool.toString(),
      feeDeducted: feeAmount.toString(),
      winnerCount: winners.length,
      resolvedAt:  new Date().toISOString(),
    });

    res.json({
      txHash,
      outcome,
      totalPool:   totalPool.toString(),
      feeDeducted: feeAmount.toString(),
      netPool:     (totalPool - feeAmount).toString(),
      winnerCount: winners.length,
      resolvedAt:  new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[resolver] relay failed:", err);
    res.status(500).json({ error: "RESOLVE_FAILED", message: err.message });
  }
});

async function recalculateScores(marketId: string, groupId: string, outcome: string) {
  const stakes   = stakesDb.getByMarket(marketId);
  const totalPool = stakes.reduce((acc: bigint, s: any) => acc + BigInt(s.amount), 0n);
  if (totalPool === 0n) return;

  for (const stake of stakes) {
    const isWinner   = stake.direction === outcome;
    const stakeAmt   = BigInt(stake.amount);
    const weight     = Number(stakeAmt) / Number(totalPool); // 0–1
    const scoreDelta = isWinner ? Math.round(weight * 1000) : 0;

    scoresDb.increment(stake.user_address, groupId, {
      score:         scoreDelta,
      marketsPlayed: 1,
      wins:          isWinner ? 1 : 0,
      totalStaked:   stake.amount,
      totalWon:      isWinner ? stake.amount : "0",
    });
  }
}

export default router;
