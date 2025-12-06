/**
 * TypeScript definitions for magenx404
 */

// Wallet window type definitions
interface PhantomSolana {
  connect(): Promise<void>;
  signMessage(
    message: Uint8Array,
    encoding: string
  ): Promise<{
    signature: Uint8Array;
    publicKey: { toString(): string };
  }>;
  publicKey?: { toString(): string };
}

interface PhantomWindow {
  phantom?: {
    solana?: PhantomSolana;
  };
  solana?: PhantomSolana;
}

interface SolflareWindow {
  solflare?: {
    solana?: {
      connect(): Promise<void>;
      signMessage(
        message: Uint8Array,
        encoding: string
      ): Promise<{
        signature: Uint8Array;
        publicKey: { toString(): string };
      }>;
      publicKey?: { toString(): string };
    };
  };
}

interface BackpackWindow {
  backpack?: {
    connect(): Promise<void>;
    signMessage(
      message: Uint8Array,
      encoding: string
    ): Promise<{
      signature: Uint8Array;
      publicKey: { toString(): string };
    }>;
    publicKey?: { toString(): string };
  };
}

declare global {
  interface Window extends PhantomWindow, SolflareWindow, BackpackWindow {}
}

export interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isFetching?: boolean;
}

export interface BaseX404Config {
  wallet?: string; // Optional - if not provided, modal will be shown
  geo_code: string;
  geo_code_locs: string;
  coords: {
    latitude: number | null;
    longitude: number | null;
  };
}

export interface X404BlacklistConfig extends BaseX404Config {
  excluded_mints: string[];
  max_holdings?: Record<string, string>;
}

export interface X404TimeLockConfig extends BaseX404Config {
  required_mint: string;
  mint_amount: string;
  min_hold_duration_days: number;
}

export interface X404MultiTokenConfig extends BaseX404Config {
  required_tokens: Array<{ mint: string; amount: string }>;
  verification_mode: "ALL" | "ANY";
}

export interface X404ActivityConfig extends BaseX404Config {
  min_transactions: number;
  min_volume: string;
  time_period_days: number;
  transaction_types: string[];
}

export interface X404TierConfig extends BaseX404Config {
  tier_config: {
    bronze?: { mint: string; amount: string };
    silver?: { mint: string; amount: string };
    gold?: { mint: string; amount: string };
  };
}

export interface X404NoDebtConfig extends BaseX404Config {
  check_protocols: string[];
  max_debt_allowed: string;
}

export interface X404AgeConfig extends BaseX404Config {
  min_wallet_age_days: number;
  min_first_transaction_days: number;
}

export interface X404AuthResult {
  success: boolean;
  alreadyAuthenticated?: boolean;
  token?: string;
  data?: unknown;
  error?:
    | "NONCE_ERROR"
    | "SIGNING_ERROR"
    | "LOCATION_ERROR"
    | "LOCATION_DENIED"
    | "HOLDS_BANNED_TOKEN"
    | "EXCEEDS_MAX_HOLDING"
    | "INSUFFICIENT_HOLD_DURATION"
    | "INSUFFICIENT_TOKENS"
    | "INSUFFICIENT_ACTIVITY"
    | "HAS_DEBT"
    | "WALLET_TOO_NEW"
    | "WALLET_CANCELLED"
    | "UNKNOWN_ERROR";
  message?: string;
  tier?: "bronze" | "silver" | "gold";
  required?: string;
}

// MagenAuth config - can be any feature config
export interface MagenAuthConfig extends BaseX404Config {
  feature?:
    | "timelock"
    | "blacklist"
    | "multitoken"
    | "activity"
    | "tier"
    | "nodebt"
    | "age";
  // Timelock properties
  required_mint?: string;
  mint_amount?: string;
  min_hold_duration_days?: number;
  // Blacklist properties
  excluded_mints?: string[];
  max_holdings?: Record<string, string>;
  // MultiToken properties
  required_tokens?: Array<{ mint: string; amount: string }>;
  verification_mode?: "ALL" | "ANY";
  // Activity properties
  min_transactions?: number;
  min_volume?: string;
  time_period_days?: number;
  transaction_types?: string[];
  // Tier properties
  tier_config?: {
    bronze?: { mint: string; amount: string };
    silver?: { mint: string; amount: string };
    gold?: { mint: string; amount: string };
  };
  // NoDebt properties
  check_protocols?: string[];
  max_debt_allowed?: string;
  // Age properties
  min_wallet_age_days?: number;
  min_first_transaction_days?: number;
}

// Utility functions
export function detectWallets(): string[];

export function getGeolocationData(): Promise<GeolocationData>;

export function signPayload(
  payload: string,
  wallet: string
): Promise<{ signature: Uint8Array; publicKey: string }>;

export function getNonce(endpoint: string): Promise<string>;

export function buildSigningPayload(
  nonce: string,
  path: string,
  feature?: string
): string;

export function showWalletModal(logoPaths?: {
  phantom?: string;
  solflare?: string;
  backpack?: string;
}): Promise<string | null>;

export function getWalletFromConfigOrModal(
  config: BaseX404Config,
  logoPaths?: {
    phantom?: string;
    solflare?: string;
    backpack?: string;
  }
): Promise<string | null>;

// Feature functions
export function X404Blacklist(
  config: X404BlacklistConfig
): Promise<X404AuthResult>;

export function X404TimeLock(
  config: X404TimeLockConfig
): Promise<X404AuthResult>;

export function X404MultiToken(
  config: X404MultiTokenConfig
): Promise<X404AuthResult>;

export function X404Activity(
  config: X404ActivityConfig
): Promise<X404AuthResult>;

export function X404Tier(config: X404TierConfig): Promise<X404AuthResult>;

export function X404NoDebt(config: X404NoDebtConfig): Promise<X404AuthResult>;

export function X404Age(config: X404AgeConfig): Promise<X404AuthResult>;

// Unified auth function
export function MagenAuth(config: MagenAuthConfig): Promise<X404AuthResult>;
