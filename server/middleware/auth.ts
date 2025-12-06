import jwt from "jsonwebtoken";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { Request, Response, NextFunction } from "express";
import { verifyGeolocation } from "../utils/geolocation";
import { generateNonce } from "../utils/nonce";

const JWT_SECRET: string =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRY: string = process.env.JWT_EXPIRY || "30d";

// Extend Express Request to include verified data
declare global {
  namespace Express {
    interface Request {
      verifiedPublicKey?: string;
      verifiedFeature?: string;
    }
  }
}

export type AuthenticatedRequest = Request;

/**
 * Verify Solana signature
 */
function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKey).toBytes();

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Build the challenge payload that should have been signed
 */
function buildChallengePayload(
  nonce: string,
  path: string,
  feature: string
): string {
  return `CHALLENGE::${nonce}::${path}::${feature}`;
}

/**
 * Generate JWT token
 */
export function generateToken(
  publicKey: string,
  feature: string,
  additionalData: Record<string, unknown> = {}
): string {
  const payload = {
    publicKey,
    feature,
    ...additionalData,
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Authentication middleware
 * Handles nonce generation, signature verification, and JWT validation
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const path = req.path;
  const feature = path.split("/").pop() || ""; // Extract feature name from path

  // Check if this is a JWT verification request
  const jwtToken = req.headers["x-jwt"] as string | undefined;
  if (jwtToken) {
    const decoded = verifyToken(jwtToken);
    if (decoded && decoded.feature === feature) {
      res.status(200).json({
        success: true,
        alreadyAuthenticated: true,
        publicKey: decoded.publicKey,
        feature: decoded.feature,
      });
      return;
    } else {
      res.status(401).json({
        error: "INVALID_TOKEN",
        message: "Invalid or expired JWT token",
      });
      return;
    }
  }

  // Check if this is a nonce request (no signature headers)
  const nonce = req.headers["x-404-nonce"] as string | undefined;
  const signature = req.headers["x-404-signature"] as string | undefined;
  const publicKey = req.headers["x-404-addr"] as string | undefined;

  if (!nonce || !signature || !publicKey) {
    // Optional: Verify Authorization header if provided (for additional security)
    const authHeader = req.headers["authorization"];
    // Note: The client sends a bearer token, but we don't require it for nonce generation
    // You can add validation here if needed

    // Generate and return nonce
    const newNonce = generateNonce();
    res.setHeader("X-404-Nonce", newNonce);
    res.setHeader("X-404-Mechanism", "MAGEN404");
    res.json({ status: "nonce_ready" });
    return;
  }

  // Verify signature
  const challenge = buildChallengePayload(
    nonce,
    path,
    `MAGEN404_${feature.toUpperCase()}`
  );
  const isValid = verifySignature(challenge, signature, publicKey);

  if (!isValid) {
    res.status(401).json({
      error: "INVALID_SIGNATURE",
      message: "Signature verification failed",
    });
    return;
  }

  // Verify geolocation if enabled
  const geoCode = req.headers["geo_code"] === "true";
  if (geoCode) {
    const latitude = req.headers["x-lat"] as string | undefined;
    const longitude = req.headers["x-long"] as string | undefined;
    const geoCodeLocs = (req.headers["geo_code_locs"] as string) || "";

    const geoResult = await verifyGeolocation(latitude, longitude, geoCodeLocs);

    if (geoResult.error) {
      res.status(500).json({
        status: "locerror",
        error: "LOCATION_ERROR",
        message: geoResult.error,
      });
      return;
    }

    if (!geoResult.allowed) {
      res.status(401).json({
        status: "locdeny",
        error: "LOCATION_DENIED",
        message: "Access denied for your location",
      });
      return;
    }
  }

  // Attach verified data to request
  req.verifiedPublicKey = publicKey;
  req.verifiedFeature = feature;

  next();
}
