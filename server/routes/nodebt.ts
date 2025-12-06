import { Response } from "express";
import { generateToken, AuthenticatedRequest } from "../middleware/auth";
import { checkDebt } from "../utils/solana";

export async function nodebtRoute(
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
    const checkProtocols = JSON.parse(
      (req.headers["check_protocols"] as string) || "[]"
    ) as string[];
    const maxDebtAllowed = (req.headers["max_debt_allowed"] as string) || "0";

    // Check debt across protocols
    const debtInfo = await checkDebt(publicKey, checkProtocols);
    const totalDebt = BigInt(debtInfo.totalDebt || "0");
    const maxDebt = BigInt(maxDebtAllowed);

    if (totalDebt > maxDebt) {
      res.status(500).json({
        error: "HAS_DEBT",
        message: `Total debt (${debtInfo.totalDebt}) exceeds maximum allowed (${maxDebtAllowed})`,
        debtInfo,
      });
      return;
    }

    // All checks passed - generate token
    const token = generateToken(publicKey, "nodebt", {
      totalDebt: debtInfo.totalDebt,
      protocols: checkProtocols,
    });

    res.status(200).json({
      success: true,
      token,
      publicKey,
      feature: "nodebt",
      totalDebt: debtInfo.totalDebt,
      protocols: checkProtocols,
    });
  } catch (error) {
    console.error("NoDebt route error:", error);
    res.status(500).json({
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}
