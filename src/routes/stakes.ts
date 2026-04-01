import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateMandate } from "../middleware/validateMandate.js";
import { marketsDb, stakesDb } from "../db/schema.js";
import { relayStake } from "../services/passport.js";
import { broadcast } from "../services/websocket.js";

const router = Router();

/**
 * POST /stakes
 * Place a YES/NO stake on a market.
 *
 * Middleware chain: requireAuth → validateMandate → handler
 *
 * Body: { marketId, direction: "YES"|"NO", amount: string (MUSD wei), mode: "full-stake"|"zero-risk" }
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
 * GET /stakes?marketId=:id
 * List all stakes for a market.
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
