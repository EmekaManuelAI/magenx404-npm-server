import crypto from "crypto";

/**
 * Generate a secure random nonce
 */
export function generateNonce(): string {
  return crypto.randomBytes(32).toString("hex");
}
