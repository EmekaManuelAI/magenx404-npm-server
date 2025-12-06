"use client";

// Main entry point - exports all features
export { X404Blacklist } from "./src/features/blacklist.js";
export { X404TimeLock } from "./src/features/timelock.js";
export { X404MultiToken } from "./src/features/multitoken.js";
export { X404Activity } from "./src/features/activity.js";
export { X404Tier } from "./src/features/tier.js";
export { X404NoDebt } from "./src/features/nodebt.js";
export { X404Age } from "./src/features/age.js";

// Export utilities
export {
  detectWallets,
  getGeolocationData,
  signPayload,
  getNonce,
  buildSigningPayload,
} from "./src/utils/wallet.js";

// Export wallet selection utilities
export { showWalletModal } from "./src/utils/walletModal.js";
export { getWalletFromConfigOrModal } from "./src/utils/walletSelector.js";

// Unified MagenAuth function
import { X404TimeLock } from "./src/features/timelock.js";
import { X404Blacklist } from "./src/features/blacklist.js";
import { X404MultiToken } from "./src/features/multitoken.js";
import { X404Activity } from "./src/features/activity.js";
import { X404Tier } from "./src/features/tier.js";
import { X404NoDebt } from "./src/features/nodebt.js";
import { X404Age } from "./src/features/age.js";

/**
 * Unified MagenAuth function
 * Automatically routes to the appropriate feature based on config
 *
 * @param {Object} config - Configuration object
 * @param {string} [config.wallet] - Wallet name (optional, modal will show if not provided)
 * @param {string} [config.required_mint] - Token mint address (for timelock/tier)
 * @param {string} [config.mint_amount] - Token amount required
 * @param {string} [config.feature] - Feature to use: "timelock", "blacklist", "multitoken", "activity", "tier", "nodebt", "age" (default: "timelock")
 * @param {string} [config.geo_code] - Enable geolocation check: "true" or "false"
 * @param {string} [config.geo_code_locs] - Allowed country codes (comma-separated): "US,UK"
 * @param {Object} config.coords - Geolocation coordinates
 * @param {number|null} config.coords.latitude - Latitude
 * @param {number|null} config.coords.longitude - Longitude
 * @param {Array} [config.excluded_mints] - Excluded token mints (for blacklist)
 * @param {Object} [config.max_holdings] - Max holdings per token (for blacklist)
 * @param {number} [config.min_hold_duration_days] - Min hold duration in days (for timelock)
 * @param {Array} [config.required_tokens] - Required tokens array (for multitoken)
 * @param {string} [config.verification_mode] - "ALL" or "ANY" (for multitoken)
 * @param {number} [config.min_transactions] - Min transactions (for activity)
 * @param {string} [config.min_volume] - Min volume (for activity)
 * @param {number} [config.time_period_days] - Time period in days (for activity)
 * @param {Array} [config.transaction_types] - Transaction types (for activity)
 * @param {Object} [config.tier_config] - Tier configuration (for tier)
 * @param {Array} [config.check_protocols] - Protocols to check (for nodebt)
 * @param {string} [config.max_debt_allowed] - Max debt allowed (for nodebt)
 * @param {number} [config.min_wallet_age_days] - Min wallet age in days (for age)
 * @param {number} [config.min_first_transaction_days] - Min first transaction days (for age)
 * @returns {Promise<Object>} Authentication result
 */
export async function MagenAuth(config) {
  const feature = config.feature || "timelock";

  // Normalize wallet - if it's an object with wallet property, extract it
  let walletName = config.wallet;
  if (walletName && typeof walletName === "object" && walletName.wallet) {
    walletName = walletName.wallet;
  }

  const normalizedConfig = {
    ...config,
    wallet: walletName,
  };

  switch (feature.toLowerCase()) {
    case "timelock":
      return await X404TimeLock(normalizedConfig);
    case "blacklist":
      return await X404Blacklist(normalizedConfig);
    case "multitoken":
      return await X404MultiToken(normalizedConfig);
    case "activity":
      return await X404Activity(normalizedConfig);
    case "tier":
      return await X404Tier(normalizedConfig);
    case "nodebt":
      return await X404NoDebt(normalizedConfig);
    case "age":
      return await X404Age(normalizedConfig);
    default:
      // Default to timelock for simple token gating (like VelocityAuth)
      return await X404TimeLock(normalizedConfig);
  }
}
