import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { groupsDb, marketsDb, stakesDb, scoresDb } from "../db/schema.js";
import { relayCreateGroup } from "../services/passport.js";
import { broadcast } from "../services/websocket.js";

const router = Router();

/** POST /groups — Create a new prediction group */
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

/** GET /groups/:groupId — Get group metadata, members, leaderboard */
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

/** POST /groups/:groupId/join — Join a group */
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

/** GET /leaderboard/:groupId — Group leaderboard sorted by Conviction Score */
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
