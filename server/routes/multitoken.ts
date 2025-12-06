import { Response } from "express";
import { generateToken, AuthenticatedRequest } from "../middleware/auth";
import { getTokenBalance } from "../utils/solana";

interface RequiredToken {
  mint: string;
  amount: string;
}

export async function multitokenRoute(
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
    const requiredTokens = JSON.parse(
      (req.headers["required_tokens"] as string) || "[]"
    ) as RequiredToken[];
    const verificationMode =
      (req.headers["verification_mode"] as string) || "ALL";

    if (requiredTokens.length === 0) {
      res.status(400).json({
        error: "MISSING_PARAMETER",
        message: "required_tokens is required",
      });
      return;
    }

    // Check each token
    const tokenResults: Array<{
      mint: string;
      required: string;
      balance: string;
      meetsRequirement: boolean;
    }> = [];
    for (const token of requiredTokens) {
      const balance = await getTokenBalance(publicKey, token.mint);
      const required = BigInt(token.amount || "0");
      const hasEnough = BigInt(balance) >= required;

      tokenResults.push({
        mint: token.mint,
        required: token.amount,
        balance,
        meetsRequirement: hasEnough,
      });
    }

    // Verify based on mode
    let passes = false;
    if (verificationMode === "ALL") {
      passes = tokenResults.every((result) => result.meetsRequirement);
    } else if (verificationMode === "ANY") {
      passes = tokenResults.some((result) => result.meetsRequirement);
    } else {
      res.status(400).json({
        error: "INVALID_PARAMETER",
        message: "verification_mode must be 'ALL' or 'ANY'",
      });
      return;
    }

    if (!passes) {
      res.status(500).json({
        error: "INSUFFICIENT_TOKENS",
        message: `User does not meet ${verificationMode} token requirements`,
        tokenResults,
      });
      return;
    }

    // All checks passed - generate token
    const token = generateToken(publicKey, "multitoken", {
      verificationMode,
      tokenResults,
    });

    res.status(200).json({
      success: true,
      token,
      publicKey,
      feature: "multitoken",
      verificationMode,
      tokenResults,
    });
  } catch (error) {
    console.error("Multitoken route error:", error);
    res.status(500).json({
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}
