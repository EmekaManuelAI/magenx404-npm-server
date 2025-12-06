"use client";

import { showWalletModal } from "./walletModal.js";

/**
 * Get wallet from config or show modal to select one
 * @param config - Configuration object that may or may not have wallet
 * @param logoPaths - Optional object with wallet logo paths { phantom: "/path/to/phantom.png", solflare: "/path/to/solflare.svg", backpack: "/path/to/backpack.png" }
 * @returns Promise that resolves with wallet name or null if cancelled
 */
export async function getWalletFromConfigOrModal(config, logoPaths = {}) {
  // If wallet is already provided, use it
  if (config.wallet) {
    return config.wallet;
  }

  // Otherwise, show modal to select wallet
  return await showWalletModal(logoPaths);
}
