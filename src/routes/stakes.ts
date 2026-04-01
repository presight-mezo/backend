import { Router, Request, Response } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { validateMandate } from "../middleware/validateMandate.js";
import { marketsDb, stakesDb, trovesDb } from "../db/schema.js";
import { relayStake } from "../services/passport.js";
import { broadcast } from "../services/websocket.js";
import { calculateYield } from "../services/yieldSimulator.js";

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
  if (!marketId || !direction) {
    res.status(400).json({ error: "BAD_REQUEST", message: "marketId and direction are required" });
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

  // ── Zero Risk Amount Override ────────────────────────────────────────────────
  let finalAmount = BigInt(amount || 0);

  if (market.mode === "zero-risk") {
    let trove = trovesDb.get(userAddress);
    if (!trove) {
      // Auto-mock 5 BTC for MVP demo
      const mockTroveBalance = "50000000000000000000000"; 
      trovesDb.upsert(userAddress, mockTroveBalance, "10000000000000000000");
      trove = trovesDb.get(userAddress);
    }
    const accruedYield = calculateYield(BigInt(trove.trove_balance), new Date(market.created_at));
    if (accruedYield <= 0n) {
      res.status(400).json({ error: "ZERO_YIELD", message: "You have not accrued any yield to stake yet." });
      return;
    }
    finalAmount = accruedYield;
  } else if (finalAmount <= 0n) {
    res.status(400).json({ error: "BAD_REQUEST", message: "amount is required and must be > 0 for full-stake mode" });
    return;
  }

  try {
    // ── Execute stake via relay ──────────────────────────────────────────────────
    const txHash = await relayStake({
      userAddress,
      marketId,
      direction: direction as "YES" | "NO",
      amount: finalAmount,
    });

    // ── Persist to DB ────────────────────────────────────────────────────────────
    const stakeMode = mode ?? "full-stake";
    const amountStr = finalAmount.toString();
    stakesDb.create({
      marketId,
      userAddress,
      direction,
      amount: amountStr,
      mode: stakeMode,
      txHash,
    });

    // Update market pool totals in DB
    marketsDb.updatePool(marketId, direction === "YES", amountStr);

    // ── WebSocket broadcast ──────────────────────────────────────────────────────
    const updatedMarket = marketsDb.get(marketId);
    
    // Obfuscate participant data for non-stakers in the WS feed
    broadcast(market.group_id, "stake:placed", {
      marketId,
      direction,
      amount: "???",
      userAddress: "0x***",
      txHash,
      timestamp: new Date().toISOString(),
      isRevealed: false
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
      amount: amountStr,
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
router.get("/", optionalAuth, (req: Request, res: Response) => {
  const { marketId } = req.query;
  const userAddress = req.userAddress;

  if (!marketId) {
    res.status(400).json({ error: "BAD_REQUEST", message: "marketId query param required" });
    return;
  }
  
  const mId = marketId as string;
  const rawStakes = stakesDb.getByMarket(mId);
  
  // Reveal logic: only show stakes if the user has already staked on this market
  const hasStaked = userAddress ? stakesDb.hasStaked(mId, userAddress) : false;

  const stakes = rawStakes.map(s => {
    // Always reveal the user's own stake to themselves
    if (userAddress && s.user_address.toLowerCase() === userAddress.toLowerCase()) {
      return s;
    }
    
    // Otherwise, mask if not structurally revealed
    if (!hasStaked) {
      return {
        ...s,
        user_address: "0x***",
        amount: "???",
      };
    }
    return s;
  });

  res.json({ stakes, isRevealed: hasStaked });
});

export default router;
