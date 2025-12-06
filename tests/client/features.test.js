import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock browser environment
global.window = {
  phantom: {
    solana: {
      connect: vi.fn(),
      signMessage: vi.fn(),
    },
  },
  solflare: {
    solana: {
      connect: vi.fn(),
      signMessage: vi.fn(),
    },
  },
  backpack: {
    connect: vi.fn(),
    signMessage: vi.fn(),
  },
};

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

// Mock fetch
global.fetch = vi.fn();

describe("Client Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Feature Exports", () => {
    it("should export all features from index", async () => {
      const module = await import("../../index.js");

      expect(module.X404Blacklist).toBeDefined();
      expect(module.X404TimeLock).toBeDefined();
      expect(module.X404MultiToken).toBeDefined();
      expect(module.X404Activity).toBeDefined();
      expect(module.X404Tier).toBeDefined();
      expect(module.X404NoDebt).toBeDefined();
      expect(module.X404Age).toBeDefined();
    });
  });

  describe("Feature Function Signatures", () => {
    it("should have correct function signatures", async () => {
      const { X404Blacklist } = await import("../../index.js");

      expect(typeof X404Blacklist).toBe("function");
    });
  });
});
