import { Response } from "express";
import { generateToken, AuthenticatedRequest } from "../middleware/auth";
import { getAllTokenBalances } from "../utils/solana";

export async function blacklistRoute(
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
    const excludedMints = JSON.parse(
      (req.headers["excluded_mints"] as string) || "[]"
    ) as string[];
    const maxHoldings = JSON.parse(
      (req.headers["max_holdings"] as string) || "{}"
    ) as Record<string, string>;

    // Get all token balances
    const balances = await getAllTokenBalances(publicKey);

    // Check for excluded tokens
    for (const mint of excludedMints) {
      const balance = balances[mint] || "0";
      if (BigInt(balance) > 0n) {
        res.status(500).json({
          error: "HOLDS_BANNED_TOKEN",
          message: `Wallet holds excluded token: ${mint}`,
        });
        return;
      }
    }

    // Check max holdings
    for (const [mint, maxAmount] of Object.entries(maxHoldings)) {
      const balance = balances[mint] || "0";
      const max = BigInt(maxAmount || "0");

      if (BigInt(balance) > max) {
        res.status(403).json({
          error: "EXCEEDS_MAX_HOLDING",
          message: `Wallet exceeds maximum holding for ${mint}. Current: ${balance}, Max: ${maxAmount}`,
        });
        return;
      }
    }

    // All checks passed - generate token
    const token = generateToken(publicKey, "blacklist");

    res.status(200).json({
      success: true,
      token,
      publicKey,
      feature: "blacklist",
    });
  } catch (error) {
    console.error("Blacklist route error:", error);
    res.status(500).json({
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}
