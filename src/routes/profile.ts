import { Router, Request, Response } from "express";
import { stakesDb, scoresDb } from "../db/schema.js";

const router = Router();

/** GET /profile/:address — User prediction stats */
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
