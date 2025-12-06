"use client";

import bs58 from "bs58";
import { getNonce, buildSigningPayload, signPayload } from "../utils/wallet.js";
import { getWalletFromConfigOrModal } from "../utils/walletSelector.js";

const url = "https://magenx404.onrender.com/x404_auth/blacklist";
const path = new URL(url).pathname;

/**
 * x404-Blacklist: Exclusion-based authentication
 * Verifies user does NOT hold banned/blacklisted tokens
 */
export async function X404Blacklist(config) {
  const issued_jwt = localStorage.getItem("sjwt404_blacklist");

  // Check if already authenticated
  if (issued_jwt) {
    const res = await fetch(url, {
      mode: "cors",
      method: "get",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "x-jwt": issued_jwt,
      },
    });

    const data = await res.json();

    if (res.status === 200) {
      return {
        success: true,
        alreadyAuthenticated: true,
        token: issued_jwt,
      };
    }
  }

  console.log("Starting x404-Blacklist authentication...");

  // Get wallet from config or show modal
  const wallet = await getWalletFromConfigOrModal(config);
  if (!wallet) {
    return {
      success: false,
      error: "WALLET_CANCELLED",
      message: "Wallet selection was cancelled",
    };
  }

  const nonce = await getNonce(url);
  console.log("Got nonce:", nonce);
  if (!nonce) {
    console.error("Failed to get nonce!");
    return {
      success: false,
      error: "NONCE_ERROR",
      message: "Failed to get nonce from server",
    };
  }

  console.log("Building payload...");
  const payload = buildSigningPayload(nonce, path, "MAGEN404_BLACKLIST");

  console.log("Requesting signature from wallet...");
  const { signature, publicKey } = await signPayload(payload, wallet);

  const signatureBase58 = bs58.encode(signature);
  console.log("Signature:", signatureBase58);
  console.log("Public Key:", publicKey);

  console.log("Sending authenticated request...");

  const res = await fetch(url, {
    mode: "cors",
    method: "get",
    cache: "no-store",
    headers: {
      "X-404-Nonce": nonce,
      "X-404-Signature": signatureBase58,
      "X-404-Addr": publicKey,
      "X-404-Feature": "blacklist",
      excluded_mints: JSON.stringify(config.excluded_mints || []),
      max_holdings: JSON.stringify(config.max_holdings || {}),
      "X-Lat": String(config.coords.latitude || ""),
      "X-Long": String(config.coords.longitude || ""),
      geo_code: config.geo_code || "false",
      geo_code_locs: config.geo_code_locs || "",
    },
  });

  const data = await res.json();

  if (res.status === 500 && data.status === "locerror") {
    return {
      success: false,
      error: "LOCATION_ERROR",
      message: "Location access error",
    };
  } else if (res.status === 500) {
    return {
      success: false,
      error: "HOLDS_BANNED_TOKEN",
      message: data.message || "User holds excluded tokens",
    };
  } else if (res.status === 401 && data.status === "locdeny") {
    return {
      success: false,
      error: "LOCATION_DENIED",
      message: "Access denied for your location",
    };
  } else if (res.status === 403) {
    return {
      success: false,
      error: "EXCEEDS_MAX_HOLDING",
      message:
        data.message || "User exceeds maximum holdings for restricted tokens",
    };
  } else if (res.status === 200) {
    if (data.token) {
      localStorage.setItem("sjwt404_blacklist", data.token);
    }
    return {
      success: true,
      alreadyAuthenticated: false,
      token: data.token,
      data: data,
    };
  }

  return {
    success: false,
    error: "UNKNOWN_ERROR",
    message: data.message || "Authentication failed",
  };
}
