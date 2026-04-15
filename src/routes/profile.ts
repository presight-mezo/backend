import { Router, Request, Response } from "express";
import { scoresDb, usersDb, mandatesDb } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User-specific prediction statistics and profile info
 */

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/", requireAuth, (req: Request, res: Response) => {
  const address = req.userAddress!.toLowerCase();
  let userRecord = usersDb.get(address);
  const mandateRecord = mandatesDb.get(address);

  // Default values if no user record exists
  if (!userRecord) {
    userRecord = {
      address,
      default_risk_mode: 'full-stake',
      onboarding_completed: 0
    };
  }
  
  res.json({ 
    address,
    defaultRiskMode: userRecord.default_risk_mode,
    onboardingCompleted: userRecord.onboarding_completed === 1,
    hasMandate: !!mandateRecord,
    username: userRecord.username,
    bio: userRecord.bio,
    avatarUrl: userRecord.avatar_url,
    twitter: userRecord.twitter
  });
});

/**
 * @swagger
 * /api/v1/profile:
 *   patch:
 *     summary: Update current authenticated user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               twitter:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Invalid input
 */
router.patch("/", requireAuth, (req: Request, res: Response) => {
  const address = req.userAddress!.toLowerCase();
  const { username, bio, avatarUrl, twitter } = req.body;
  
  usersDb.updateProfile(address, {
    username,
    bio,
    avatar_url: avatarUrl,
    twitter
  });
  
  res.json({ success: true });
});

/**
 * @swagger
 * /api/v1/profile/onboard:
 *   post:
 *     summary: Set user onboarding preference
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               defaultRiskMode:
 *                 type: string
 *                 enum: [zero-risk, full-stake]
 *     responses:
 *       200:
 *         description: Onboarding complete
 *       400:
 *         description: Invalid input
 */
router.post("/onboard", requireAuth, (req: Request, res: Response) => {
  const address = req.userAddress!.toLowerCase();
  const { defaultRiskMode } = req.body;
  
  if (!defaultRiskMode || (defaultRiskMode !== 'zero-risk' && defaultRiskMode !== 'full-stake')) {
    res.status(400).json({ error: "Invalid defaultRiskMode. Must be 'zero-risk' or 'full-stake'" });
    return;
  }

  usersDb.upsert(address, defaultRiskMode, true);
  res.json({ success: true, defaultRiskMode, onboardingCompleted: true });
});

/**
 * @swagger
 * /api/v1/profile/{address}/global:
 *   get:
 *     summary: Get global aggregated profile for any user address
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Global profile data retrieved
 *       404:
 *         description: User not found
 */
router.get("/:address/global", (req: Request, res: Response) => {
  const address = (req.params.address as string).toLowerCase();
  const globalStats = scoresDb.getGlobal(address);
  const userRecord = usersDb.get(address);

  if (!globalStats && !userRecord) {
    res.status(404).json({ error: "USER_NOT_FOUND" });
    return;
  }

  const winRate = globalStats && globalStats.marketsPlayed > 0 
    ? globalStats.wins / globalStats.marketsPlayed 
    : 0;

  res.json({
    address,
    totalConvictionScore: globalStats?.totalScore ?? 0,
    marketsPlayed: globalStats?.marketsPlayed ?? 0,
    winRate: winRate,
    totalStaked: globalStats?.totalStaked ?? "0",
    totalWon: globalStats?.totalWon ?? "0",
    defaultRiskMode: userRecord?.default_risk_mode ?? 'full-stake',
    onboardingCompleted: userRecord?.onboarding_completed === 1,
    username: userRecord?.username,
    bio: userRecord?.bio,
    avatarUrl: userRecord?.avatar_url,
    twitter: userRecord?.twitter
  });
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
