"use client";

import bs58 from "bs58";
import { getNonce, buildSigningPayload, signPayload } from "../utils/wallet.js";
import { getWalletFromConfigOrModal } from "../utils/walletSelector.js";

const url = "https://magenx404.onrender.com/x404_auth/tier";
const path = new URL(url).pathname;

/**
 * x404-Tier: Tiered access levels
 * Different access levels based on token holdings
 */
export async function X404Tier(config) {
  const issued_jwt = localStorage.getItem("sjwt404_tier");

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
        tier: data.tier,
      };
    }
  }

  console.log("Starting x404-Tier authentication...");

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
  if (!nonce) {
    return {
      success: false,
      error: "NONCE_ERROR",
      message: "Failed to get nonce from server",
    };
  }

  const payload = buildSigningPayload(nonce, path, "MAGEN404_TIER");
  const { signature, publicKey } = await signPayload(payload, wallet);
  const signatureBase58 = bs58.encode(signature);

  const res = await fetch(url, {
    mode: "cors",
    method: "get",
    cache: "no-store",
    headers: {
      "X-404-Nonce": nonce,
      "X-404-Signature": signatureBase58,
      "X-404-Addr": publicKey,
      "X-404-Feature": "tier",
      tier_config: JSON.stringify(config.tier_config || {}),
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
      error: "INSUFFICIENT_TOKENS",
      message: data.message || "User does not meet any tier requirements",
    };
  } else if (res.status === 401 && data.status === "locdeny") {
    return {
      success: false,
      error: "LOCATION_DENIED",
      message: "Access denied for your location",
    };
  } else if (res.status === 200) {
    if (data.token) {
      localStorage.setItem("sjwt404_tier", data.token);
    }
    return {
      success: true,
      alreadyAuthenticated: false,
      token: data.token,
      tier: data.tier, // "bronze", "silver", or "gold"
      data: data,
    };
  }

  return {
    success: false,
    error: "UNKNOWN_ERROR",
    message: data.message || "Authentication failed",
  };
}
