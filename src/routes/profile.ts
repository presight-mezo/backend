import { Router, Request, Response } from "express";
import { scoresDb } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User-specific prediction statistics
 */

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     summary: Get current authenticated user address
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User address retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/", requireAuth, (req: Request, res: Response) => {
  res.json({ address: req.userAddress });
});

/**
 * @swagger
 * /api/v1/profile/{groupId}/{address}:
 *   get:
 *     summary: Get conviction score and public stats for a user in a specific group
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile data retrieved
 *       404:
 *         description: Profile not found for this group
 */
router.get("/:groupId/:address", (req: Request, res: Response) => {
  const address = (req.params.address as string).toLowerCase();
  const groupId = req.params.groupId as string;
  
  const scoreRecord = scoresDb.get(address, groupId);

  if (!scoreRecord) {
    // If user has never staked/scored in this group, return baseline zeros
    res.json({
      address,
      groupId,
      marketsPlayed: 0,
      winRate:       0,
      totalStaked:   "0",
      totalWon:      "0",
      convictionScore: 0,
    });
    return;
  }

  const winRate = scoreRecord.markets_played > 0 
    ? scoreRecord.wins / scoreRecord.markets_played 
    : 0;

  res.json({
    address,
    groupId,
    marketsPlayed:   scoreRecord.markets_played,
    winRate:         winRate,
    totalStaked:     scoreRecord.total_staked,
    totalWon:        scoreRecord.total_won,
    convictionScore: scoreRecord.score,
  });
});

export default router;
