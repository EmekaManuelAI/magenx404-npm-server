import { describe, it, expect } from "vitest";
import { buildSigningPayload } from "../../src/utils/wallet.js";

describe("Wallet Utilities", () => {
  describe("buildSigningPayload", () => {
    it("should build correct challenge payload", () => {
      const nonce = "test-nonce-123";
      const path = "/x404_auth/blacklist";
      const feature = "MAGEN404_BLACKLIST";

      const payload = buildSigningPayload(nonce, path, feature);

      expect(payload).toBe(`CHALLENGE::${nonce}::${path}::${feature}`);
    });

    it("should handle default feature name", () => {
      const nonce = "test-nonce";
      const path = "/x404_auth/test";

      const payload = buildSigningPayload(nonce, path);

      expect(payload).toBe(`CHALLENGE::${nonce}::${path}::MAGEN404`);
    });

    it("should handle empty strings", () => {
      const payload = buildSigningPayload("", "", "");

      // Empty strings are used as-is (default only applies when undefined)
      expect(payload).toBe("CHALLENGE::::::");
    });
  });

  describe("detectWallets", () => {
    it("should return empty array in Node.js environment", async () => {
      // In Node.js, window is undefined
      const { detectWallets } = await import("../../src/utils/wallet.js");
      const wallets = detectWallets();

      expect(Array.isArray(wallets)).toBe(true);
      expect(wallets.length).toBe(0);
    });
  });
});
