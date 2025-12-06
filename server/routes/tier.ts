import { Response } from "express";
import { generateToken, AuthenticatedRequest } from "../middleware/auth";
import { getTokenBalance } from "../utils/solana";

interface TierConfig {
  bronze?: { mint: string; amount: string };
  silver?: { mint: string; amount: string };
  gold?: { mint: string; amount: string };
}

export async function tierRoute(
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
    const tierConfig = JSON.parse(
      (req.headers["tier_config"] as string) || "{}"
    ) as TierConfig;

    if (!tierConfig.bronze && !tierConfig.silver && !tierConfig.gold) {
      res.status(400).json({
        error: "MISSING_PARAMETER",
        message:
          "tier_config must contain at least one tier (bronze, silver, gold)",
      });
      return;
    }

    // Check each tier (in order: gold, silver, bronze)
    let qualifiedTier: "bronze" | "silver" | "gold" | null = null;

    // Check gold tier
    if (tierConfig.gold) {
      const balance = await getTokenBalance(publicKey, tierConfig.gold.mint);
      if (BigInt(balance) >= BigInt(tierConfig.gold.amount || "0")) {
        qualifiedTier = "gold";
      }
    }

    // Check silver tier (if not gold)
    if (!qualifiedTier && tierConfig.silver) {
      const balance = await getTokenBalance(publicKey, tierConfig.silver.mint);
      if (BigInt(balance) >= BigInt(tierConfig.silver.amount || "0")) {
        qualifiedTier = "silver";
      }
    }

    // Check bronze tier (if not gold or silver)
    if (!qualifiedTier && tierConfig.bronze) {
      const balance = await getTokenBalance(publicKey, tierConfig.bronze.mint);
      if (BigInt(balance) >= BigInt(tierConfig.bronze.amount || "0")) {
        qualifiedTier = "bronze";
      }
    }

    if (!qualifiedTier) {
      res.status(500).json({
        error: "INSUFFICIENT_TOKENS",
        message: "User does not meet any tier requirements",
      });
      return;
    }

    // All checks passed - generate token
    const token = generateToken(publicKey, "tier", {
      tier: qualifiedTier,
    });

    res.status(200).json({
      success: true,
      token,
      publicKey,
      feature: "tier",
      tier: qualifiedTier,
    });
  } catch (error) {
    console.error("Tier route error:", error);
    res.status(500).json({
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}
