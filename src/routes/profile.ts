import { Router, Request, Response } from "express";
import { stakesDb, scoresDb } from "../db/schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User-specific prediction statistics
 */

/**
 * @swagger
 * /api/v1/profile/{address}:
 *   get:
 *     summary: Get public stats for a user address
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile data retrieved
 */
router.get("/:address", (req: Request, res: Response) => {
  const address = (req.params.address as string).toLowerCase();
  const stakes  = stakesDb.getByMarket(""); // placeholder — need market data

  // Simplified profile: just aggregate across all DB data
  // In production, join properly across groups
  res.json({
    address,
    marketsPlayed: 0,
    winRate:       0,
    totalStaked:   "0",
    totalWon:      "0",
    convictionScore: 0,
    recentMarkets: [],
  });
});

export default router;
