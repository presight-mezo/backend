import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { trovesDb } from "../db/schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Trove
 *   description: Management of user BTC collateral troves
 */

/**
 * @swagger
 * /api/v1/trove:
 *   get:
 *     summary: Get current user BTC collateral and MUSD debt
 *     tags: [Trove]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trove details retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/", requireAuth, (req: Request, res: Response) => {
  const userAddress = req.userAddress!;
  const trove = trovesDb.get(userAddress);

  if (!trove) {
    // Return a default mock trove for new users during development
    return res.json({
      userAddress,
      troveBalance: "0.5", // Default 0.5 BTC
      musdBalance: "0",
      isDefault: true
    });
  }

  res.json({
    userAddress: trove.user_address,
    troveBalance: trove.trove_balance,
    musdBalance: trove.musd_balance,
    updatedAt: trove.updated_at,
    isDefault: false
  });
});

/**
 * @swagger
 * /api/v1/trove:
 *   post:
 *     summary: Update or create a user trove (Mock for development)
 *     tags: [Trove]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               troveBalance:
 *                 type: string
 *               musdBalance:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trove updated
 */
router.post("/", requireAuth, (req: Request, res: Response) => {
  const userAddress = req.userAddress!;
  const { troveBalance, musdBalance } = req.body;

  if (!troveBalance || !musdBalance) {
    return res.status(400).json({ error: "MISSING_PARAMS" });
  }

  trovesDb.upsert(userAddress, troveBalance.toString(), musdBalance.toString());
  res.json({ success: true, userAddress, troveBalance, musdBalance });
});

export default router;
