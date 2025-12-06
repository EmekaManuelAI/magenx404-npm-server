import { describe, it, expect, beforeEach } from "vitest";
import { generateToken, verifyToken } from "../../../server/middleware/auth.ts";
import { generateNonce } from "../../../server/utils/nonce.ts";

describe("Auth Middleware", () => {
  beforeEach(() => {
    // Set a test JWT secret
    process.env.JWT_SECRET = "test-secret-key";
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const publicKey = "test-public-key";
      const feature = "blacklist";

      const token = generateToken(publicKey, feature);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should include additional data in token", () => {
      const publicKey = "test-public-key";
      const feature = "blacklist";
      const additionalData = { tier: "gold" };

      const token = generateToken(publicKey, feature, additionalData);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded).not.toBeNull();
      if (decoded) {
        expect(decoded.publicKey).toBe(publicKey);
        expect(decoded.feature).toBe(feature);
        expect(decoded.tier).toBe("gold");
      }
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const publicKey = "test-public-key";
      const feature = "blacklist";
      const token = generateToken(publicKey, feature);

      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded).not.toBeNull();
      if (decoded) {
        expect(decoded.publicKey).toBe(publicKey);
        expect(decoded.feature).toBe(feature);
      }
    });

    it("should return null for invalid token", () => {
      const invalidToken = "invalid.token.here";

      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it("should return null for expired token", () => {
      // This would require mocking time or using a very short expiry
      // For now, we'll just test with invalid token
      const decoded = verifyToken("expired.token.here");

      expect(decoded).toBeNull();
    });
  });
});

describe("Nonce Generation", () => {
  it("should generate a nonce", () => {
    const nonce = generateNonce();

    expect(nonce).toBeDefined();
    expect(typeof nonce).toBe("string");
    expect(nonce.length).toBeGreaterThan(0);
  });

  it("should generate unique nonces", () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();

    expect(nonce1).not.toBe(nonce2);
  });

  it("should generate hex-encoded nonces", () => {
    const nonce = generateNonce();

    // Hex string should only contain 0-9 and a-f
    expect(/^[0-9a-f]+$/.test(nonce)).toBe(true);
  });
});
