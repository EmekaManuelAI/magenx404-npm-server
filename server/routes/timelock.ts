import { Response } from "express";
import { generateToken, AuthenticatedRequest } from "../middleware/auth";
import { getTokenBalance, getTokenHoldingDuration } from "../utils/solana";

export async function timelockRoute(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const publicKey = req.verifiedPublicKey;
    if (!publicKey) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    // Parse headers
    const requiredMint = req.headers["required_mint"] as string;
    const mintAmount = (req.headers["mint_amount"] as string) || "0";
    const minHoldDurationDays = parseInt(
      (req.headers["min_hold_duration_days"] as string) || "0"
    );

    if (!requiredMint) {
      res.status(400).json({
        error: "MISSING_PARAMETER",
        message: "required_mint is required",
      });
      return;
    }

    // Check current balance
    const balance = await getTokenBalance(publicKey, requiredMint);

    if (BigInt(balance) < BigInt(mintAmount)) {
      res.status(500).json({
        error: "INSUFFICIENT_BALANCE",
        message: `Current balance (${balance}) is less than required (${mintAmount})`,
      });
      return;
    }

    // Get token holding duration
    const firstHeldDate = await getTokenHoldingDuration(
      publicKey,
      requiredMint
    );

    if (!firstHeldDate) {
      res.status(500).json({
        error: "INSUFFICIENT_HOLD_DURATION",
        message: "Cannot determine token holding duration",
      });
      return;
    }

    const now = new Date();
    const holdDurationDays =
      (now.getTime() - firstHeldDate.getTime()) / (1000 * 60 * 60 * 24);

    if (holdDurationDays < minHoldDurationDays) {
      res.status(500).json({
        error: "INSUFFICIENT_HOLD_DURATION",
        message: `Tokens have been held for ${Math.floor(
          holdDurationDays
        )} days, but ${minHoldDurationDays} days are required`,
      });
      return;
    }

    // All checks passed - generate token
    const token = generateToken(publicKey, "timelock", {
      mint: requiredMint,
      balance,
      holdDurationDays: Math.floor(holdDurationDays),
    });

    res.status(200).json({
      success: true,
      token,
      publicKey,
      feature: "timelock",
      balance,
      holdDurationDays: Math.floor(holdDurationDays),
    });
  } catch (error) {
    console.error("Timelock route error:", error);
    res.status(500).json({
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}
