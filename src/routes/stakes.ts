import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateMandate } from "../middleware/validateMandate.js";
import { marketsDb, stakesDb } from "../db/schema.js";
import { relayStake } from "../services/passport.js";
import { broadcast } from "../services/websocket.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Stakes
 *   description: Relayed staking for prediction markets
 */

/**
 * @swagger
 * /api/v1/stakes:
 *   post:
 *     summary: Place a YES/NO stake (Relayed/Gasless)
 *     tags: [Stakes]
 *     security:
 *       - bearerAuth: []
 *     description: Requires a valid SIWE session and an active Passport Mandate for the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               marketId:
 *                 type: string
 *               direction:
 *                 type: string
 *                 enum: [YES, NO]
 *               amount:
 *                 type: string
 *                 description: Amount in MUSD wei (as string to avoid precision loss)
 *               mode:
 *                 type: string
 *                 enum: [full-stake, zero-risk]
 *     responses:
 *       201:
 *         description: Stake placed successfully via relay
 *       400:
 *         description: Bad Request / Market Closed / Insufficient Mandate
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Market not found
 *       409:
 *         description: Already staked on this market
 */
router.post("/", requireAuth, validateMandate, async (req: Request, res: Response) => {
  const userAddress = req.userAddress!;
  const { marketId, direction, amount, mode } = req.body;

  // ── Validate request body ────────────────────────────────────────────────────
  if (!marketId || !direction || !amount) {
    res.status(400).json({ error: "BAD_REQUEST", message: "marketId, direction, and amount are required" });
    return;
  }
  if (direction !== "YES" && direction !== "NO") {
    res.status(400).json({ error: "BAD_REQUEST", message: "direction must be 'YES' or 'NO'" });
    return;
  }

  // ── Verify market exists and is OPEN ─────────────────────────────────────────
  const market = marketsDb.get(marketId);
  if (!market) {
    res.status(404).json({ error: "MARKET_NOT_FOUND" });
    return;
  }
  if (market.status !== "OPEN") {
    res.status(400).json({ error: "MARKET_CLOSED", message: "Market is not open for staking" });
    return;
  }
  if (new Date(market.deadline) <= new Date()) {
    res.status(400).json({ error: "MARKET_CLOSED", message: "Market deadline has passed" });
    return;
  }

  // ── Check no existing stake ───────────────────────────────────────────────────
  if (stakesDb.hasStaked(marketId, userAddress)) {
    res.status(409).json({ error: "ALREADY_STAKED", message: "You have already staked on this market" });
    return;
  }

  try {
    // ── Execute stake via relay ──────────────────────────────────────────────────
    const txHash = await relayStake({
      userAddress,
      marketId,
      direction: direction as "YES" | "NO",
      amount: BigInt(amount),
    });

    // ── Persist to DB ────────────────────────────────────────────────────────────
    const stakeMode = mode ?? "full-stake";
    stakesDb.create({
      marketId,
      userAddress,
      direction,
      amount,
      mode: stakeMode,
      txHash,
    });

    // Update market pool totals in DB
    marketsDb.updatePool(marketId, direction === "YES", amount);

    // ── WebSocket broadcast ──────────────────────────────────────────────────────
    const updatedMarket = marketsDb.get(marketId);
    broadcast(market.group_id, "stake:placed", {
      marketId,
      direction,
      amount,
      userAddress,
      txHash,
      timestamp: new Date().toISOString(),
    });
    broadcast(market.group_id, "market:updated", {
      marketId,
      yesPool:          updatedMarket.yes_pool,
      noPool:           updatedMarket.no_pool,
      participantCount: stakesDb.getByMarket(marketId).length,
    });

    res.status(201).json({
      stakeId:    undefined, // populated when queried
      txHash,
      marketId,
      direction,
      amount,
      mode:       stakeMode,
      executedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[stakes] relay failed:", err);
    res.status(500).json({ error: "STAKE_RELAY_FAILED", message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/stakes:
 *   get:
 *     summary: List all stakes for a specific market
 *     tags: [Stakes]
 *     parameters:
 *       - in: query
 *         name: marketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of stakes retrieved
 *       400:
 *         description: marketId required
 */
router.get("/", (req: Request, res: Response) => {
  const { marketId } = req.query;
  if (!marketId) {
    res.status(400).json({ error: "BAD_REQUEST", message: "marketId query param required" });
    return;
  }
  const stakes = stakesDb.getByMarket(marketId as string);
  res.json({ stakes });
});

export default router;
