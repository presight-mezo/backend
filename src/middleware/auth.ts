import { Request, Response, NextFunction } from "express";
import { SiweMessage } from "siwe";
import { SIWE_DOMAIN } from "../config.js";

// Extend Request to carry the resolved wallet address
declare global {
  namespace Express {
    interface Request {
      userAddress?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Missing Bearer token" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const { message, signature } = JSON.parse(
      Buffer.from(token, "base64").toString("utf8")
    );
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature, domain: SIWE_DOMAIN });
    if (!result.success) throw new Error("SIWE verify failed");
    req.userAddress = result.data.address.toLowerCase();
    next();
  } catch {
    res.status(401).json({ error: "INVALID_TOKEN", message: "Token invalid or expired" });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  try {
    const { message, signature } = JSON.parse(
      Buffer.from(token, "base64").toString("utf8")
    );
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature, domain: SIWE_DOMAIN });
    if (result.success) {
      req.userAddress = result.data.address.toLowerCase();
    }
  } catch {
    // Ignore error, optional
  }
  next();
}
