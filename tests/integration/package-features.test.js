import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock browser environment
global.window = {
  phantom: {
    solana: {
      connect: vi.fn(() => Promise.resolve()),
      signMessage: vi.fn(() =>
        Promise.resolve({
          signature: new Uint8Array([1, 2, 3]),
          publicKey: { toString: () => "test-public-key" },
        })
      ),
      publicKey: { toString: () => "test-public-key" },
    },
  },
  solflare: {
    solana: {
      connect: vi.fn(() => Promise.resolve()),
      signMessage: vi.fn(() =>
        Promise.resolve({
          signature: new Uint8Array([1, 2, 3]),
          publicKey: { toString: () => "test-public-key" },
        })
      ),
      publicKey: { toString: () => "test-public-key" },
    },
  },
  backpack: {
    connect: vi.fn(() => Promise.resolve()),
    signMessage: vi.fn(() =>
      Promise.resolve({
        signature: new Uint8Array([1, 2, 3]),
        publicKey: { toString: () => "test-public-key" },
      })
    ),
    publicKey: { toString: () => "test-public-key" },
  },
  solana: {
    connect: vi.fn(() => Promise.resolve()),
    signMessage: vi.fn(() =>
      Promise.resolve({
        signature: new Uint8Array([1, 2, 3]),
        publicKey: { toString: () => "test-public-key" },
      })
    ),
    publicKey: { toString: () => "test-public-key" },
  },
};

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock navigator.geolocation
Object.defineProperty(global, "navigator", {
  value: {
    geolocation: {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
        });
      }),
    },
  },
  writable: true,
  configurable: true,
});

// Mock fetch - create a reusable mock response factory
const createMockFetchResponse = (
  nonce = "test-nonce-123",
  token = "test-jwt-token"
) => ({
  ok: true,
  status: 200,
  headers: {
    get: vi.fn((header) => {
      if (header === "X-404-Nonce") return nonce;
      if (header === "X-404-Mechanism") return "MAGEN404";
      return null;
    }),
  },
  json: vi.fn(() =>
    Promise.resolve({
      status: "nonce_ready",
      token: token,
    })
  ),
});

global.fetch = vi.fn(() => Promise.resolve(createMockFetchResponse()));

// Mock document for modal
global.document = {
  createElement: vi.fn((tag) => ({
    className: "",
    innerHTML: "",
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    addEventListener: vi.fn(),
    classList: {
      add: vi.fn(),
    },
    parentNode: {
      removeChild: vi.fn(),
    },
  })),
  head: {
    appendChild: vi.fn(),
  },
  body: {
    appendChild: vi.fn(),
  },
  getElementById: vi.fn(() => null),
};

describe("Package Features Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.localStorage.getItem.mockReturnValue(null);
  });

  describe("Main Exports", () => {
    it("should export detectWallets", async () => {
      const { detectWallets } = await import("../../index.js");
      expect(typeof detectWallets).toBe("function");
    });

    it("should export getGeolocationData", async () => {
      const { getGeolocationData } = await import("../../index.js");
      expect(typeof getGeolocationData).toBe("function");
    });

    it("should export MagenAuth", async () => {
      const { MagenAuth } = await import("../../index.js");
      expect(typeof MagenAuth).toBe("function");
    });

    it("should export all feature functions", async () => {
      const module = await import("../../index.js");
      expect(typeof module.X404Blacklist).toBe("function");
      expect(typeof module.X404TimeLock).toBe("function");
      expect(typeof module.X404MultiToken).toBe("function");
      expect(typeof module.X404Activity).toBe("function");
      expect(typeof module.X404Tier).toBe("function");
      expect(typeof module.X404NoDebt).toBe("function");
      expect(typeof module.X404Age).toBe("function");
    });

    it("should export utility functions", async () => {
      const module = await import("../../index.js");
      expect(typeof module.showWalletModal).toBe("function");
      expect(typeof module.getWalletFromConfigOrModal).toBe("function");
      expect(typeof module.signPayload).toBe("function");
      expect(typeof module.getNonce).toBe("function");
      expect(typeof module.buildSigningPayload).toBe("function");
    });
  });

  describe("detectWallets", () => {
    it("should detect phantom wallet", async () => {
      const { detectWallets } = await import("../../index.js");
      const wallets = detectWallets();
      expect(wallets).toContain("phantom");
    });

    it("should detect solflare wallet", async () => {
      const { detectWallets } = await import("../../index.js");
      const wallets = detectWallets();
      expect(wallets).toContain("solflare");
    });

    it("should detect backpack wallet", async () => {
      const { detectWallets } = await import("../../index.js");
      const wallets = detectWallets();
      expect(wallets).toContain("backpack");
    });

    it("should return an array", async () => {
      const { detectWallets } = await import("../../index.js");
      const wallets = detectWallets();
      expect(Array.isArray(wallets)).toBe(true);
    });
  });

  describe("getGeolocationData", () => {
    it("should return geolocation data", async () => {
      const { getGeolocationData } = await import("../../index.js");
      const location = await getGeolocationData();
      expect(location).toHaveProperty("latitude");
      expect(location).toHaveProperty("longitude");
      expect(location).toHaveProperty("error");
      expect(location).toHaveProperty("isFetching");
    });

    it("should return valid coordinates", async () => {
      const { getGeolocationData } = await import("../../index.js");
      const location = await getGeolocationData();
      expect(typeof location.latitude).toBe("number");
      expect(typeof location.longitude).toBe("number");
      expect(location.latitude).toBe(37.7749);
      expect(location.longitude).toBe(-122.4194);
    });
  });

  describe("buildSigningPayload", () => {
    it("should build correct payload format", async () => {
      const { buildSigningPayload } = await import("../../index.js");
      const payload = buildSigningPayload("test-nonce", "/path", "FEATURE");
      expect(payload).toBe("CHALLENGE::test-nonce::/path::FEATURE");
    });

    it("should use default feature name when not provided", async () => {
      const { buildSigningPayload } = await import("../../index.js");
      const payload = buildSigningPayload("test-nonce", "/path");
      expect(payload).toBe("CHALLENGE::test-nonce::/path::MAGEN404");
    });
  });

  describe("getNonce", () => {
    it("should fetch nonce from server", async () => {
      const { getNonce } = await import("../../index.js");
      const nonce = await getNonce(
        "https://magenx404-server-production.up.railway.app/x404_auth/blacklist"
      );
      expect(nonce).toBe("test-nonce-123");
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("signPayload", () => {
    it("should sign payload with phantom wallet", async () => {
      const { signPayload } = await import("../../index.js");
      const result = await signPayload("test-payload", "phantom");
      expect(result).toHaveProperty("signature");
      expect(result).toHaveProperty("publicKey");
      expect(result.publicKey).toBe("test-public-key");
    });

    it("should sign payload with solflare wallet", async () => {
      const { signPayload } = await import("../../index.js");
      const result = await signPayload("test-payload", "solflare");
      expect(result).toHaveProperty("signature");
      expect(result).toHaveProperty("publicKey");
    });

    it("should sign payload with backpack wallet", async () => {
      const { signPayload } = await import("../../index.js");
      const result = await signPayload("test-payload", "backpack");
      expect(result).toHaveProperty("signature");
      expect(result).toHaveProperty("publicKey");
    });
  });

  describe("X404Blacklist", () => {
    it("should be callable with config", async () => {
      const { X404Blacklist } = await import("../../index.js");
      const config = {
        wallet: "phantom",
        excluded_mints: [],
        max_holdings: {},
        geo_code: "false",
        geo_code_locs: "",
        coords: { latitude: null, longitude: null },
      };

      // Mock fetch for auth flow
      global.fetch
        .mockResolvedValueOnce(createMockFetchResponse("test-nonce"))
        .mockResolvedValueOnce(
          createMockFetchResponse("test-nonce", "test-token")
        );

      const result = await X404Blacklist(config);
      expect(result).toHaveProperty("success");
    });
  });

  describe("X404TimeLock", () => {
    it("should be callable with config", async () => {
      const { X404TimeLock } = await import("../../index.js");
      const config = {
        wallet: "phantom",
        required_mint: "test-mint",
        mint_amount: "1000",
        min_hold_duration_days: 30,
        geo_code: "false",
        geo_code_locs: "",
        coords: { latitude: null, longitude: null },
      };

      // Mock fetch for auth flow
      global.fetch
        .mockResolvedValueOnce(createMockFetchResponse("test-nonce"))
        .mockResolvedValueOnce(
          createMockFetchResponse("test-nonce", "test-token")
        );

      const result = await X404TimeLock(config);
      expect(result).toHaveProperty("success");
    });
  });

  describe("X404MultiToken", () => {
    it("should be callable with config", async () => {
      const { X404MultiToken } = await import("../../index.js");
      const config = {
        wallet: "phantom",
        required_tokens: [{ mint: "token1", amount: "1000" }],
        verification_mode: "ALL",
        geo_code: "false",
        geo_code_locs: "",
        coords: { latitude: null, longitude: null },
      };

      // Mock fetch for auth flow
      global.fetch
        .mockResolvedValueOnce(createMockFetchResponse("test-nonce"))
        .mockResolvedValueOnce(
          createMockFetchResponse("test-nonce", "test-token")
        );

      const result = await X404MultiToken(config);
      expect(result).toHaveProperty("success");
    });
  });

  describe("X404Activity", () => {
    it("should be callable with config", async () => {
      const { X404Activity } = await import("../../index.js");
      const config = {
        wallet: "phantom",
        min_transactions: 5,
        min_volume: "1000",
        time_period_days: 30,
        transaction_types: ["swap"],
        geo_code: "false",
        geo_code_locs: "",
        coords: { latitude: null, longitude: null },
      };

      // Mock fetch for auth flow
      global.fetch
        .mockResolvedValueOnce(createMockFetchResponse("test-nonce"))
        .mockResolvedValueOnce(
          createMockFetchResponse("test-nonce", "test-token")
        );

      const result = await X404Activity(config);
      expect(result).toHaveProperty("success");
    });
  });

  describe("X404Tier", () => {
    it("should be callable with config", async () => {
      const { X404Tier } = await import("../../index.js");
      const config = {
        wallet: "phantom",
        tier_config: {
          bronze: { mint: "token", amount: "1000" },
        },
        geo_code: "false",
        geo_code_locs: "",
        coords: { latitude: null, longitude: null },
      };

      // Mock fetch for auth flow
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn((header) => {
            if (header === "X-404-Nonce") return "test-nonce";
            return null;
          }),
        },
        json: vi.fn(() => Promise.resolve({ status: "nonce_ready" })),
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn(() =>
          Promise.resolve({ token: "test-token", tier: "bronze" })
        ),
      });

      const result = await X404Tier(config);
      expect(result).toHaveProperty("success");
    });
  });

  describe("X404NoDebt", () => {
    it("should be callable with config", async () => {
      const { X404NoDebt } = await import("../../index.js");
      const config = {
        wallet: "phantom",
        check_protocols: ["protocol1"],
        max_debt_allowed: "0",
        geo_code: "false",
        geo_code_locs: "",
        coords: { latitude: null, longitude: null },
      };

      // Mock fetch for auth flow
      global.fetch
        .mockResolvedValueOnce(createMockFetchResponse("test-nonce"))
        .mockResolvedValueOnce(
          createMockFetchResponse("test-nonce", "test-token")
        );

      const result = await X404NoDebt(config);
      expect(result).toHaveProperty("success");
    });
  });

  describe("X404Age", () => {
    it("should be callable with config", async () => {
      const { X404Age } = await import("../../index.js");
      const config = {
        wallet: "phantom",
        min_wallet_age_days: 90,
        min_first_transaction_days: 30,
        geo_code: "false",
        geo_code_locs: "",
        coords: { latitude: null, longitude: null },
      };

      // Mock fetch for auth flow
      global.fetch
        .mockResolvedValueOnce(createMockFetchResponse("test-nonce"))
        .mockResolvedValueOnce(
          createMockFetchResponse("test-nonce", "test-token")
        );

      const result = await X404Age(config);
      expect(result).toHaveProperty("success");
    });
  });

  describe("MagenAuth", () => {
    it("should route to timelock by default", async () => {
      const { MagenAuth } = await import("../../index.js");
      const config = {
        wallet: "phantom",
        required_mint: "test-mint",
        mint_amount: "1000",
        min_hold_duration_days: 30,
        geo_code: "false",
        geo_code_locs: "",
        coords: { latitude: null, longitude: null },
      };

      // Mock fetch for auth flow
      global.fetch
        .mockResolvedValueOnce(createMockFetchResponse("test-nonce"))
        .mockResolvedValueOnce(
          createMockFetchResponse("test-nonce", "test-token")
        );

      const result = await MagenAuth(config);
      expect(result).toHaveProperty("success");
    });

    it("should route to blacklist feature", async () => {
      const { MagenAuth } = await import("../../index.js");
      const config = {
        wallet: "phantom",
        feature: "blacklist",
        excluded_mints: [],
        max_holdings: {},
        geo_code: "false",
        geo_code_locs: "",
        coords: { latitude: null, longitude: null },
      };

      // Mock fetch for auth flow
      global.fetch
        .mockResolvedValueOnce(createMockFetchResponse("test-nonce"))
        .mockResolvedValueOnce(
          createMockFetchResponse("test-nonce", "test-token")
        );

      const result = await MagenAuth(config);
      expect(result).toHaveProperty("success");
    });
  });

  describe("showWalletModal", () => {
    it("should be callable", async () => {
      const { showWalletModal } = await import("../../index.js");
      expect(typeof showWalletModal).toBe("function");

      // Mock the modal to resolve immediately
      const mockButton = {
        addEventListener: vi.fn(),
      };
      const mockModal = {
        querySelector: vi.fn(() => mockButton),
        querySelectorAll: vi.fn(() => []),
        classList: { add: vi.fn() },
        parentNode: { removeChild: vi.fn() },
      };

      global.document.createElement.mockReturnValue(mockModal);

      // Start the modal (it will wait for user interaction)
      const modalPromise = showWalletModal();

      // The modal should be created
      expect(global.document.createElement).toHaveBeenCalled();
    });
  });

  describe("getWalletFromConfigOrModal", () => {
    it("should return wallet from config if provided", async () => {
      const { getWalletFromConfigOrModal } = await import("../../index.js");
      const config = {
        wallet: "phantom",
        geo_code: "false",
        geo_code_locs: "",
        coords: { latitude: null, longitude: null },
      };

      const wallet = await getWalletFromConfigOrModal(config);
      expect(wallet).toBe("phantom");
    });
  });
});
