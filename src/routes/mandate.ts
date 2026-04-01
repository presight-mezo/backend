import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { mandatesDb } from "../db/schema.js";
import { relayRegisterMandate } from "../services/passport.js";
import { ethers } from "ethers";

const router = Router();

/**
 * POST /mandate
 * Register or update a Prediction Mandate for the authenticated user.
 *
 * Body: { limitPerMarket: string (MUSD wei), txHash?: string }
 *
 * If txHash is provided: trust the user already registered on-chain, just store it.
 * If no txHash: relay calls MandateValidator.registerMandate() via deployer wallet.
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userAddress = req.userAddress!;
  const { limitPerMarket, txHash: clientTxHash } = req.body;

  // Validate amount
  if (!limitPerMarket) {
    res.status(400).json({ error: "BAD_REQUEST", message: "limitPerMarket is required" });
    return;
  }

  let limitBn: bigint;
  try {
    limitBn = BigInt(limitPerMarket);
    if (limitBn <= 0n) throw new Error("zero");
  } catch {
    res.status(400).json({ error: "BAD_REQUEST", message: "limitPerMarket must be a positive integer string in MUSD wei" });
    return;
  }

  try {
    let txHash = clientTxHash as string | undefined;

    if (!txHash) {
      // Relay mode: deployer registers mandate on-chain for this user
      txHash = await relayRegisterMandate({ userAddress, limitPerMarket: limitBn });
    }

    // Upsert in DB
    mandatesDb.upsert({
      user_address:     userAddress,
      limit_per_market: limitPerMarket.toString(),
      tx_hash:          txHash,
    });

    res.status(201).json({
      success:         true,
      userAddress,
      limitPerMarket:  limitPerMarket.toString(),
      limitFormatted:  `${(Number(limitBn) / 1e18).toFixed(2)} MUSD`,
      txHash,
    });
  } catch (err: any) {
    console.error("[mandate] relay failed:", err);
    res.status(500).json({ error: "MANDATE_RELAY_FAILED", message: err.message });
  }
});

/**
 * GET /mandate
 * Get the current mandate for the authenticated user.
 */
router.get("/", requireAuth, (req: Request, res: Response) => {
  const userAddress = req.userAddress!;
  const mandate = mandatesDb.get(userAddress);

  if (!mandate) {
    res.status(404).json({ error: "NO_MANDATE", message: "No active mandate found" });
    return;
  }

  const limitBn = BigInt(mandate.limit_per_market);
  res.json({
    userAddress,
    limitPerMarket:  mandate.limit_per_market,
    limitFormatted:  `${(Number(limitBn) / 1e18).toFixed(2)} MUSD`,
    txHash:          mandate.tx_hash,
    registeredAt:    (mandate as any).registered_at,
  });
});

/**
 * DELETE /mandate
 * Revoke the authenticated user's mandate.
 */
router.delete("/", requireAuth, (req: Request, res: Response) => {
  mandatesDb.revoke(req.userAddress!);
  res.json({ success: true });
});

export default router;
