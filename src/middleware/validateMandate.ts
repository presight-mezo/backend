import { Request, Response, NextFunction } from "express";
import { mandatesDb } from "../db/schema.js";

export async function validateMandate(req: Request, res: Response, next: NextFunction) {
  const userAddress = req.userAddress;
  if (!userAddress) {
    // Should not happen — requireAuth runs first
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  const { amount } = req.body;
  if (!amount) {
    res.status(400).json({ error: "BAD_REQUEST", message: "amount is required" });
    return;
  }

  const mandate = mandatesDb.get(userAddress);

  if (!mandate) {
    res.status(422).json({
      error: "NO_MANDATE",
      message: "You must set a Prediction Mandate before staking. Call POST /mandate first.",
    });
    return;
  }

  let amountBn: bigint;
  let limitBn: bigint;
  try {
    amountBn = BigInt(amount);
    limitBn  = BigInt(mandate.limit_per_market);
  } catch {
    res.status(400).json({ error: "BAD_REQUEST", message: "amount must be a bigint string in MUSD wei" });
    return;
  }

  if (amountBn > limitBn) {
    res.status(422).json({
      error: "MANDATE_EXCEEDED",
      message: `Stake of ${formatMUSD(amountBn)} exceeds your mandate limit of ${formatMUSD(limitBn)}`,
      limit:    mandate.limit_per_market,
      attempted: amount,
    });
    return;
  }

  next();
}

function formatMUSD(wei: bigint): string {
  const musd = Number(wei) / 1e18;
  return `${musd.toFixed(2)} MUSD`;
}
