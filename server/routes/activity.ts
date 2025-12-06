import { Response } from "express";
import { generateToken, AuthenticatedRequest } from "../middleware/auth";
import { getTransactionCount } from "../utils/solana";

export async function activityRoute(
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
    const minTransactions = parseInt(
      (req.headers["min_transactions"] as string) || "0"
    );
    const minVolume = (req.headers["min_volume"] as string) || "0";
    const timePeriodDays = parseInt(
      (req.headers["time_period_days"] as string) || "30"
    );
    const transactionTypes = JSON.parse(
      (req.headers["transaction_types"] as string) || "[]"
    ) as string[];

    // Get transaction count and volume
    const { count, volume } = await getTransactionCount(
      publicKey,
      timePeriodDays,
      transactionTypes
    );

    // Check transaction count requirement
    if (count < minTransactions) {
      res.status(500).json({
        error: "INSUFFICIENT_ACTIVITY",
        message: `Transaction count (${count}) is less than required (${minTransactions}) within the last ${timePeriodDays} days`,
      });
      return;
    }

    // Check volume requirement
    const minVolumeNum = parseFloat(minVolume);
    if (volume < minVolumeNum) {
      res.status(500).json({
        error: "INSUFFICIENT_ACTIVITY",
        message: `Trading volume (${volume}) is less than required (${minVolume}) within the last ${timePeriodDays} days`,
      });
      return;
    }

    // All checks passed - generate token
    const token = generateToken(publicKey, "activity", {
      transactionCount: count,
      volume,
      timePeriodDays,
    });

    res.status(200).json({
      success: true,
      token,
      publicKey,
      feature: "activity",
      transactionCount: count,
      volume,
      timePeriodDays,
    });
  } catch (error) {
    console.error("Activity route error:", error);
    res.status(500).json({
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}
