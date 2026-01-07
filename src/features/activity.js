"use client";

import bs58 from "bs58";
import { getNonce, buildSigningPayload, signPayload } from "../utils/wallet.js";
import { getWalletFromConfigOrModal } from "../utils/walletSelector.js";

const url = "https://magenx404.onrender.com/x404_auth/activity";
const path = new URL(url).pathname;

/**
 * x404-Activity: Transaction history verification
 * Verifies user has transaction history/activity
 */
export async function X404Activity(config) {
  const issued_jwt = localStorage.getItem("sjwt404_activity");

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

  console.log("Starting x404-Activity authentication...");

  // Get wallet from config or show modal
  const logoPaths = config.logoPaths || {};
  const wallet = await getWalletFromConfigOrModal(config, logoPaths);
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

  const payload = buildSigningPayload(nonce, path, "MAGEN404_ACTIVITY");
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
      "X-404-Feature": "activity",
      min_transactions: config.min_transactions.toString(),
      min_volume: config.min_volume || "0",
      time_period_days: config.time_period_days.toString(),
      transaction_types: JSON.stringify(config.transaction_types || []),
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
      error: "INSUFFICIENT_ACTIVITY",
      message: data.message || "User does not meet activity requirements",
    };
  } else if (res.status === 401 && data.status === "locdeny") {
    return {
      success: false,
      error: "LOCATION_DENIED",
      message: "Access denied for your location",
    };
  } else if (res.status === 200) {
    if (data.token) {
      localStorage.setItem("sjwt404_activity", data.token);
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
