"use client";

/**
 * Detect available Solana wallets
 * @returns Array of detected wallet names (strings)
 */
export function detectWallets() {
  if (typeof window === "undefined") {
    return [];
  }

  const wallets = [];

  if (window.phantom?.solana || window.solana) {
    wallets.push("phantom");
  }
  if (window.backpack) {
    wallets.push("backpack");
  }
  if (window.solflare) {
    wallets.push("solflare");
  }

  return wallets;
}

/**
 * Get geolocation data
 * @returns Promise with geolocation data
 */
export function getGeolocationData() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: null,
        longitude: null,
        error: "Geolocation not supported by this browser.",
        isFetching: false,
      });
      return;
    }

    const success = (position) => {
      const { latitude, longitude } = position.coords;
      resolve({
        latitude: latitude,
        longitude: longitude,
        error: null,
        isFetching: false,
      });
    };

    const error = (err) => {
      let errorMessage;
      if (err.code === 1) {
        errorMessage = "Permission Denied: Location access was blocked.";
      } else {
        errorMessage = `Error (${err.code}): ${err.message}`;
      }
      resolve({
        latitude: null,
        longitude: null,
        error: errorMessage,
        isFetching: false,
      });
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 5000,
    });
  });
}

/**
 * Sign a payload with the specified wallet
 * @param payload - The message to sign
 * @param wallet - Wallet name ("phantom", "solflare", etc.)
 * @returns Promise with signature and public key
 */
export async function signPayload(payload, wallet) {
  if (wallet === "phantom") {
    if (!window.phantom?.solana && !window.solana) {
      throw new Error("Phantom wallet not found");
    }
    const phantom = window.phantom?.solana || window.solana;
    if (!phantom) {
      throw new Error("Phantom wallet not available");
    }
    await phantom.connect();
    const encoded = new TextEncoder().encode(payload);
    const signed = await phantom.signMessage(encoded, "utf8");
    return {
      signature: signed.signature,
      publicKey: signed.publicKey.toString(),
    };
  } else if (wallet === "solflare") {
    if (!window.solflare?.solana) {
      throw new Error("Solflare wallet not found");
    }
    await window.solflare.solana.connect();
    const encoded = new TextEncoder().encode(payload);
    const signed = await window.solflare.solana.signMessage(encoded, "utf8");
    return {
      signature: signed.signature,
      publicKey: signed.publicKey.toString(),
    };
  } else if (wallet === "backpack") {
    if (!window.backpack) {
      throw new Error("Backpack wallet not found");
    }
    await window.backpack.connect();
    const encoded = new TextEncoder().encode(payload);
    const signed = await window.backpack.signMessage(encoded, "utf8");
    return {
      signature: signed.signature,
      publicKey: signed.publicKey.toString(),
    };
  }

  throw new Error(`Unsupported wallet: ${wallet}`);
}

/**
 * Get nonce from x404 server
 * @param endpoint - The API endpoint URL
 * @returns Promise with the nonce
 */
export async function getNonce(endpoint) {
  // Add cache-busting query parameter to prevent 304 responses
  const url = new URL(endpoint);
  url.searchParams.set("_t", Date.now().toString());

  const res = await fetch(url.toString(), {
    mode: "cors",
    method: "get",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      Authorization: "bearer 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",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  });

  // Check if we got a valid response
  if (!res.ok && res.status !== 304) {
    throw new Error(`Failed to get nonce: ${res.status} ${res.statusText}`);
  }

  // Handle 304 Not Modified - retry with a fresh request
  if (res.status === 304) {
    console.warn("Received 304 Not Modified, retrying with fresh request...");
    // Retry with a new timestamp
    const retryUrl = new URL(endpoint);
    retryUrl.searchParams.set("_t", Date.now().toString());
    const retryRes = await fetch(retryUrl.toString(), {
      mode: "cors",
      method: "get",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        Authorization: "bearer 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",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });

    if (!retryRes.ok) {
      throw new Error(
        `Failed to get nonce: ${retryRes.status} ${retryRes.statusText}`
      );
    }

    const retryData = await retryRes.json();
    const retryNonce = retryRes.headers.get("X-404-Nonce") || "";
    const retryMechanism = retryRes.headers.get("X-404-Mechanism");
    console.log("Nonce (retry):", retryNonce, "Mechanism:", retryMechanism);
    console.log("Initial response (retry):", retryData);

    if (!retryNonce) {
      throw new Error("Nonce header not found in response");
    }

    return retryNonce;
  }

  const data = await res.json();
  const nonce = res.headers.get("X-404-Nonce") || "";
  const mechanism = res.headers.get("X-404-Mechanism");
  console.log("Nonce:", nonce, "Mechanism:", mechanism);
  console.log("Initial response:", data);

  // If nonce is empty, throw an error
  if (!nonce) {
    throw new Error("Nonce header not found in response");
  }

  return nonce;
}

/**
 * Build signing payload for x404
 * @param nonce - The nonce from server
 * @param path - The API path
 * @param feature - The feature name (e.g., "BLACKLIST", "TIMELOCK")
 * @returns The challenge payload
 */
export function buildSigningPayload(nonce, path, feature = "MAGEN404") {
  return `CHALLENGE::${nonce}::${path}::${feature}`;
}
