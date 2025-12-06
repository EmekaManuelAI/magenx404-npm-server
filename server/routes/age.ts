import { Response } from "express";
import { generateToken, AuthenticatedRequest } from "../middleware/auth";
import { getFirstTransactionTimestamp } from "../utils/solana";

export async function ageRoute(
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
    const minWalletAgeDays = parseInt(
      (req.headers["min_wallet_age_days"] as string) || "0"
    );
    const minFirstTransactionDays = parseInt(
      (req.headers["min_first_transaction_days"] as string) || "0"
    );

    // Get first transaction timestamp
    const firstTxDate = await getFirstTransactionTimestamp(publicKey);

    if (!firstTxDate) {
      res.status(500).json({
        error: "WALLET_TOO_NEW",
        message: "Wallet has no transaction history",
      });
      return;
    }

    const now = new Date();
    const walletAgeDays =
      (now.getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24);
    const firstTxDaysAgo = walletAgeDays;

    // Check wallet age requirement
    if (walletAgeDays < minWalletAgeDays) {
      res.status(500).json({
        error: "WALLET_TOO_NEW",
        message: `Wallet age (${Math.floor(
          walletAgeDays
        )} days) is less than required (${minWalletAgeDays} days)`,
      });
      return;
    }

    // Check first transaction requirement
    if (firstTxDaysAgo < minFirstTransactionDays) {
      res.status(500).json({
        error: "WALLET_TOO_NEW",
        message: `First transaction (${Math.floor(
          firstTxDaysAgo
        )} days ago) is less than required (${minFirstTransactionDays} days ago)`,
      });
      return;
    }

    // All checks passed - generate token
    const token = generateToken(publicKey, "age", {
      walletAgeDays: Math.floor(walletAgeDays),
      firstTransactionDays: Math.floor(firstTxDaysAgo),
    });

    res.status(200).json({
      success: true,
      token,
      publicKey,
      feature: "age",
      walletAgeDays: Math.floor(walletAgeDays),
      firstTransactionDays: Math.floor(firstTxDaysAgo),
    });
  } catch (error) {
    console.error("Age route error:", error);
    res.status(500).json({
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}
