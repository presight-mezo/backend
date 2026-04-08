import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { groupsDb, marketsDb, stakesDb, scoresDb } from "../db/schema.js";
import { relayCreateGroup } from "../services/passport.js";
import { broadcast } from "../services/websocket.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Groups for shared prediction markets
 */

/**
 * @swagger
 * /api/v1/groups:
 *   post:
 *     summary: Create a new prediction group (Relayed)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mezo Alpha Testers
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: "BAD_REQUEST", message: "name is required" });
    return;
  }

  try {
    const { groupId, txHash } = await relayCreateGroup(name.trim());
    groupsDb.create(groupId, name.trim(), req.userAddress!);
    groupsDb.addMember(groupId, req.userAddress!);

    res.status(201).json({
      groupId,
      name: name.trim(),
      adminAddress:  req.userAddress,
      inviteLink:    `${process.env.CORS_ORIGIN}/group/${groupId}`,
      txHash,
      createdAt:     new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: "GROUP_CREATION_FAILED", message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/groups:
 *   get:
 *     summary: List all groups the user is a member of
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 *       401:
 *         description: Unauthorized
 */
router.get("/", requireAuth, (req: Request, res: Response) => {
  try {
    const rawGroups = groupsDb.getByUser(req.userAddress!);
    const groups = rawGroups.map((g: any) => ({
      id: g.id,
      name: g.name,
      adminAddress: g.admin_address,
      createdAt: g.created_at,
      _count: {
        members: g._count_members
      }
    }));
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: "FAILED_TO_FETCH_GROUPS" });
  }
});

/**
 * @swagger
 * /api/v1/groups/{groupId}:
 *   get:
 *     summary: Get group metadata and leaderboard
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details retrieved
 *       404:
 *         description: Group not found
 */
router.get("/:groupId", (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const group = groupsDb.get(groupId);
  if (!group) {
    res.status(404).json({ error: "GROUP_NOT_FOUND" });
    return;
  }

  const members      = groupsDb.members(groupId);
  const activeMarkets = marketsDb.getByGroup(groupId).filter((m: any) => m.status === "OPEN");
  const scores       = scoresDb.getLeaderboard(groupId);

  const scoresMap = new Map(scores.map((s: any) => [s.user_address, s]));
  const enrichedMembers = members.map((m: any) => ({
    address:        m.address,
    convictionScore: scoresMap.get(m.address)?.score ?? 0,
    joinedAt:       m.joined_at,
  }));

  res.json({
    groupId,
    name:             group.name,
    adminAddress:     group.admin_address,
    memberCount:      members.length,
    members:          enrichedMembers,
    activeMarketCount: activeMarkets.length,
  });
});

/**
 * @swagger
 * /api/v1/groups/{groupId}/join:
 *   post:
 *     summary: Join an existing group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully joined group
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
router.post("/:groupId/join", requireAuth, (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const group = groupsDb.get(groupId);
  if (!group) {
    res.status(404).json({ error: "GROUP_NOT_FOUND" });
    return;
  }

  groupsDb.addMember(groupId, req.userAddress!);
  const count = groupsDb.memberCount(groupId);

  broadcast(groupId, "group:member:joined", {
    groupId,
    address:     req.userAddress,
    memberCount: count,
  });

  res.json({ success: true, memberCount: count });
});

/**
 * @swagger
 * /api/v1/groups/{groupId}/leaderboard:
 *   get:
 *     summary: Get rank-sorted leaderboard for a group
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leaderboard retrieved
 *       404:
 *         description: Group not found
 */
router.get("/:groupId/leaderboard", (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const entries = scoresDb.getLeaderboard(groupId).map((e: any, i: number) => ({
    rank:           i + 1,
    address:        e.user_address,
    convictionScore: e.score,
    winRate:        e.markets_played > 0 ? e.wins / e.markets_played : 0,
    marketsPlayed:  e.markets_played,
  }));

  res.json({ groupId, entries, updatedAt: new Date().toISOString() });
});

export default router;
