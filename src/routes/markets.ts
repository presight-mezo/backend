import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { marketsDb, stakesDb } from "../db/schema.js";
import { relayCreateMarket } from "../services/passport.js";
import { ethers } from "ethers";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Markets
 *   description: Prediction markets for YES/NO questions
 */

/**
 * @swagger
 * /api/v1/markets:
 *   post:
 *     summary: Create a new prediction market (Relayed)
 *     tags: [Markets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId:
 *                 type: string
 *               question:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               resolverAddress:
 *                 type: string
 *               mode:
 *                 type: string
 *                 enum: [full-stake, zero-risk]
 *     responses:
 *       201:
 *         description: Market created
 *       400:
 *         description: Bad Request
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { groupId, question, deadline, mode, resolverAddress } = req.body;

  if (!groupId || !question || !deadline || !resolverAddress) {
    res.status(400).json({ error: "BAD_REQUEST", message: "groupId, question, deadline, resolverAddress are required" });
    return;
  }

  const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);
  if (deadlineTs <= Math.floor(Date.now() / 1000)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "deadline must be in the future" });
    return;
  }

  const modeNum = mode === "zero-risk" ? 1 : 0;

  try {
    const { marketId, txHash } = await relayCreateMarket({
      groupId,
      question,
      deadline: deadlineTs,
      resolverAddress,
      mode: modeNum,
    });

    marketsDb.create({
      id:              marketId,
      groupId,
      question,
      deadline:        new Date(deadline).toISOString(),
      resolverAddress,
      mode:            mode ?? "full-stake",
    });

    res.status(201).json({
      marketId,
      txHash,
      question,
      deadline,
      mode:            mode ?? "full-stake",
      resolverAddress,
      status:          "OPEN",
    });
  } catch (err: any) {
    res.status(500).json({ error: "MARKET_CREATION_FAILED", message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/markets/{marketId}:
 *   get:
 *     summary: Get detailed market information
 *     tags: [Markets]
 *     parameters:
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Market details retrieved
 *       404:
 *         description: Market not found
 */
router.get("/:marketId", (req: Request, res: Response) => {
  const market = marketsDb.get(req.params.marketId as string);
  if (!market) {
    res.status(404).json({ error: "MARKET_NOT_FOUND" });
    return;
  }

  const participants   = stakesDb.getByMarket(market.id);
  const deadlineDate   = new Date(market.deadline);
  const timeRemaining  = Math.max(0, Math.floor((deadlineDate.getTime() - Date.now()) / 1000));

  res.json({
    marketId:         market.id,
    groupId:          market.group_id,
    question:         market.question,
    yesPool:          market.yes_pool,
    noPool:           market.no_pool,
    participantCount: participants.length,
    mode:             market.mode,
    status:           market.status,
    outcome:          market.outcome ?? null,
    deadline:         market.deadline,
    resolverAddress:  market.resolver_address,
    timeRemaining,
  });
});

/**
 * @swagger
 * /api/v1/markets:
 *   get:
 *     summary: List all markets in a group
 *     tags: [Markets]
 *     parameters:
 *       - in: query
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of markets
 *       400:
 *         description: Bad Request
 */
router.get("/", (req: Request, res: Response) => {
  const { groupId } = req.query;
  if (!groupId) {
    res.status(400).json({ error: "BAD_REQUEST", message: "groupId query param required" });
    return;
  }
  const markets = marketsDb.getByGroup(groupId as string);
  res.json({ markets });
});

export default router;
