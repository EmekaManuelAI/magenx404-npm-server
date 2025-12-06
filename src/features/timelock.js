"use client";

import bs58 from "bs58";
import { getNonce, buildSigningPayload, signPayload } from "../utils/wallet.js";
import { getWalletFromConfigOrModal } from "../utils/walletSelector.js";

const url = "https://magenx404.onrender.com/x404_auth/timelock";
const path = new URL(url).pathname;

/**
 * x404-TimeLock: Time-based token holding verification
 * Verifies user has held tokens for a minimum duration
 */
export async function X404TimeLock(config) {
  const issued_jwt = localStorage.getItem("sjwt404_timelock");

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

  console.log("Starting x404-TimeLock authentication...");

  // Get wallet from config or show modal
  const wallet = await getWalletFromConfigOrModal(config);
  if (!wallet) {
    return {
      success: false,
      error: "WALLET_CANCELLED",
      message: "Wallet selection was cancelled",
    };
  }

  let nonce;
  try {
    nonce = await getNonce(url);
    if (!nonce) {
      return {
        success: false,
        error: "NONCE_ERROR",
        message: "Failed to get nonce from server",
      };
    }
  } catch (error) {
    console.error("Error getting nonce:", error);
    return {
      success: false,
      error: "NONCE_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to get nonce from server",
    };
  }

  const payload = buildSigningPayload(nonce, path, "MAGEN404_TIMELOCK");
  console.log("Payload to sign:", payload);

  let signature, publicKey, signatureBase58;
  try {
    const signResult = await signPayload(payload, wallet);
    signature = signResult.signature;
    publicKey = signResult.publicKey;
    signatureBase58 = bs58.encode(signature);
    console.log("Signature created successfully");
  } catch (error) {
    console.error("Error signing payload:", error);
    return {
      success: false,
      error: "SIGNING_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to sign authentication challenge. Please approve the transaction in your wallet.",
    };
  }

  const res = await fetch(url, {
    mode: "cors",
    method: "get",
    cache: "no-store",
    headers: {
      "X-404-Nonce": nonce,
      "X-404-Signature": signatureBase58,
      "X-404-Addr": publicKey,
      "X-404-Feature": "timelock",
      required_mint: config.required_mint,
      mint_amount: config.mint_amount,
      min_hold_duration_days: config.min_hold_duration_days.toString(),
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
      error: "INSUFFICIENT_HOLD_DURATION",
      message:
        data.message ||
        `Tokens must be held for at least ${config.min_hold_duration_days} days`,
    };
  } else if (res.status === 401 && data.status === "locdeny") {
    return {
      success: false,
      error: "LOCATION_DENIED",
      message: "Access denied for your location",
    };
  } else if (res.status === 200) {
    if (data.token) {
      localStorage.setItem("sjwt404_timelock", data.token);
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
