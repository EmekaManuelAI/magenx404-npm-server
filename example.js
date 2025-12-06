/**
 * Example usage of magenx404
 *
 * This file demonstrates how to use each feature of the x404 package
 */

import {
  X404Blacklist,
  X404TimeLock,
  X404MultiToken,
  X404Activity,
  X404Tier,
  X404NoDebt,
  X404Age,
} from "./index.js";
import { detectWallets, getGeolocationData } from "./src/utils/wallet.js";

// Example 1: Blacklist (Exclusion-Based)
async function exampleBlacklist() {
  console.log("=== x404-Blacklist Example ===");

  const wallets = detectWallets();
  if (wallets.length === 0) {
    console.error("No wallets detected");
    return;
  }

  const location = await getGeolocationData();

  const result = await X404Blacklist({
    wallet: wallets[0],
    excluded_mints: ["scam_token_1_address", "scam_token_2_address"],
    max_holdings: {
      competitor_token: "0", // Must not hold any
    },
    geo_code: "false",
    geo_code_locs: "",
    coords: {
      latitude: location.latitude,
      longitude: location.longitude,
    },
  });

  if (result.success) {
    console.log("✅ Authenticated! Token:", result.token);
  } else {
    console.error("❌ Error:", result.error, "-", result.message);
  }
}

// Example 2: TimeLock
async function exampleTimeLock() {
  console.log("=== x404-TimeLock Example ===");

  const wallets = detectWallets();
  if (wallets.length === 0) return;

  const result = await X404TimeLock({
    wallet: wallets[0],
    required_mint: "TOKEN_MINT_ADDRESS",
    mint_amount: "100000",
    min_hold_duration_days: 30,
    geo_code: "false",
    geo_code_locs: "",
    coords: { latitude: null, longitude: null },
  });

  if (result.success) {
    console.log("✅ Authenticated! Token:", result.token);
  } else {
    console.error("❌ Error:", result.error);
  }
}

// Example 3: MultiToken
async function exampleMultiToken() {
  console.log("=== x404-MultiToken Example ===");

  const wallets = detectWallets();
  if (wallets.length === 0) return;

  const result = await X404MultiToken({
    wallet: wallets[0],
    required_tokens: [
      { mint: "TOKEN_A", amount: "10000" },
      { mint: "TOKEN_B", amount: "5000" },
      { mint: "TOKEN_C", amount: "1000" },
    ],
    verification_mode: "ALL", // Must have ALL tokens
    geo_code: "false",
    geo_code_locs: "",
    coords: { latitude: null, longitude: null },
  });

  if (result.success) {
    console.log("✅ Authenticated! Token:", result.token);
  } else {
    console.error("❌ Error:", result.error);
  }
}

// Example 4: Activity
async function exampleActivity() {
  console.log("=== x404-Activity Example ===");

  const wallets = detectWallets();
  if (wallets.length === 0) return;

  const result = await X404Activity({
    wallet: wallets[0],
    min_transactions: 5,
    min_volume: "1000",
    time_period_days: 30,
    transaction_types: ["swap", "transfer"],
    geo_code: "false",
    geo_code_locs: "",
    coords: { latitude: null, longitude: null },
  });

  if (result.success) {
    console.log("✅ Authenticated! Token:", result.token);
  } else {
    console.error("❌ Error:", result.error);
  }
}

// Example 5: Tier
async function exampleTier() {
  console.log("=== x404-Tier Example ===");

  const wallets = detectWallets();
  if (wallets.length === 0) return;

  const result = await X404Tier({
    wallet: wallets[0],
    tier_config: {
      bronze: { mint: "TOKEN", amount: "1000" },
      silver: { mint: "TOKEN", amount: "10000" },
      gold: { mint: "TOKEN", amount: "100000" },
    },
    geo_code: "false",
    geo_code_locs: "",
    coords: { latitude: null, longitude: null },
  });

  if (result.success) {
    console.log("✅ Authenticated! Tier:", result.tier, "Token:", result.token);
  } else {
    console.error("❌ Error:", result.error);
  }
}

// Example 6: NoDebt
async function exampleNoDebt() {
  console.log("=== x404-NoDebt Example ===");

  const wallets = detectWallets();
  if (wallets.length === 0) return;

  const result = await X404NoDebt({
    wallet: wallets[0],
    check_protocols: ["lending_protocol_1", "lending_protocol_2"],
    max_debt_allowed: "0",
    geo_code: "false",
    geo_code_locs: "",
    coords: { latitude: null, longitude: null },
  });

  if (result.success) {
    console.log("✅ Authenticated! Token:", result.token);
  } else {
    console.error("❌ Error:", result.error);
  }
}

// Example 7: Age
async function exampleAge() {
  console.log("=== x404-Age Example ===");

  const wallets = detectWallets();
  if (wallets.length === 0) return;

  const result = await X404Age({
    wallet: wallets[0],
    min_wallet_age_days: 90,
    min_first_transaction_days: 30,
    geo_code: "false",
    geo_code_locs: "",
    coords: { latitude: null, longitude: null },
  });

  if (result.success) {
    console.log("✅ Authenticated! Token:", result.token);
  } else {
    console.error("❌ Error:", result.error);
  }
}

// Run examples (uncomment to test)
// exampleBlacklist();
// exampleTimeLock();
// exampleMultiToken();
// exampleActivity();
// exampleTier();
// exampleNoDebt();
// exampleAge();
