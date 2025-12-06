# magenx404

Easy-to-use Solana wallet authentication package with advanced verification features. Built with JavaScript for maximum compatibility. **Full TypeScript support included!**

## Installation

```bash
npm install magenx404

# or

bun add magenx404

# or

yarn add magenx404
```

## TypeScript Support

This package includes full TypeScript definitions! No need for `@ts-ignore` or type assertions.

```typescript
import {
  X404Blacklist,
  X404TimeLock,
  X404MultiToken,
  X404Activity,
  X404Tier,
  X404NoDebt,
  X404Age,
} from "magenx404";
import { detectWallets, getGeolocationData } from "magenx404/utils";

// Full type safety and IntelliSense support!
const wallets = detectWallets(); // string[]
const location = await getGeolocationData(); // Promise<GeolocationData>
const result = await X404TimeLock({ ... }); // Promise<X404Result>
```

## Quick Start

```javascript
"use client";

import { useState, useEffect } from "react";
import { X404TimeLock } from "magenx404";
import { detectWallets, getGeolocationData } from "magenx404/utils";

function App() {
  const [wallets, setWallets] = useState([]);
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    error: null,
    isFetching: false,
  });

  useEffect(() => {
    async function fetchLocation() {
      const locationdata = await getGeolocationData();
      setLocation({
        latitude: locationdata.latitude || null,
        longitude: locationdata.longitude || null,
        error: locationdata.error || null,
        isFetching: false,
      });
    }
    fetchLocation();
  }, []);

  useEffect(() => {
    let wallets = detectWallets();
    setWallets(wallets);
  }, []);

  const RUN = async (wallet) => {
    const result = await X404TimeLock({
      wallet: wallet, // Optional - modal will show if not provided
      required_mint: "TOKEN_CA",
      mint_amount: "1000000",
      min_hold_duration_days: 30,
      geo_code: "true", // or "false"
      geo_code_locs: "US,UK", // Country codes
      coords: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
    });

    if (result.success) {
      console.log(result.token);
      // Token is automatically stored in localStorage as "sjwt404_timelock"
      alert("authenticated");
      // RUN YOUR CUSTOM LOGIC HERE
    } else {
      switch (result.error) {
        case "INSUFFICIENT_TOKENS":
          alert(`You need more tokens to access`);
          break;
        case "LOCATION_DENIED":
          alert("Access denied for your location");
          break;
        case "LOCATION_ERROR":
          alert("Location permission denied");
          break;
        default:
          alert(result.message || "Authentication failed");
      }
    }
  };

  return (
    <div>
      {wallets.map((wallet, index) => (
        <button key={index} onClick={() => RUN(wallet)}>
          Connect {wallet}
        </button>
      ))}
    </div>
  );
}

export default App;
```

## Features

This package provides 7 different authentication features:

1. **Timelock** - Time-based token holding verification
2. **Blacklist** - Exclusion-based authentication (verify user does NOT hold banned tokens)
3. **MultiToken** - Multi-token portfolio verification
4. **Activity** - Transaction history verification
5. **Tier** - Tiered access levels (Bronze/Silver/Gold)
6. **NoDebt** - Negative balance verification
7. **Age** - Wallet age verification

## API

### `detectWallets()`

Detect available Solana wallets.

```javascript
import { detectWallets } from "magenx404/utils";

const wallets = detectWallets();
console.log(wallets); // ["phantom", "solflare", "backpack"]
```

### `getGeolocationData()`

Get user's geolocation data.

```javascript
import { getGeolocationData } from "magenx404/utils";

const location = await getGeolocationData();
console.log(location);
// {
//   latitude: 37.7749,
//   longitude: -122.4194,
//   error: null,
//   isFetching: false
// }
```

### Feature Functions

Each feature has its own function. The `wallet` parameter is optional - if not provided, a modal will appear for wallet selection.

#### `X404TimeLock`

Time-based token holding verification.

```javascript
import { X404TimeLock } from "magenx404";

const result = await X404TimeLock({
  wallet: "phantom", // Optional - modal will show if not provided
  required_mint: "TOKEN_CA",
  mint_amount: "1000000",
  min_hold_duration_days: 30,
  geo_code: "false",
  geo_code_locs: "",
  coords: {
    latitude: location.latitude,
    longitude: location.longitude,
  },
});
```

#### `X404Blacklist`

Exclusion-based authentication.

```javascript
import { X404Blacklist } from "magenx404";

const result = await X404Blacklist({
  wallet: "phantom", // Optional
  excluded_mints: ["scam_token_address"],
  max_holdings: {
    token_address: "1000",
  },
  geo_code: "false",
  geo_code_locs: "",
  coords: {
    latitude: null,
    longitude: null,
  },
});
```

#### `X404MultiToken`

Multi-token portfolio verification.

```javascript
import { X404MultiToken } from "magenx404";

const result = await X404MultiToken({
  wallet: "phantom", // Optional
  required_tokens: [
    { mint: "TOKEN_A", amount: "10000" },
    { mint: "TOKEN_B", amount: "5000" },
  ],
  verification_mode: "ALL", // or "ANY"
  geo_code: "false",
  geo_code_locs: "",
  coords: {
    latitude: null,
    longitude: null,
  },
});
```

#### `X404Activity`

Transaction history verification.

```javascript
import { X404Activity } from "magenx404";

const result = await X404Activity({
  wallet: "phantom", // Optional
  min_transactions: 5,
  min_volume: "1000",
  time_period_days: 30,
  transaction_types: ["swap", "transfer"],
  geo_code: "false",
  geo_code_locs: "",
  coords: {
    latitude: null,
    longitude: null,
  },
});
```

#### `X404Tier`

Tiered access levels.

```javascript
import { X404Tier } from "magenx404";

const result = await X404Tier({
  wallet: "phantom", // Optional
  tier_config: {
    bronze: { mint: "TOKEN_CA", amount: "1000" },
    silver: { mint: "TOKEN_CA", amount: "10000" },
    gold: { mint: "TOKEN_CA", amount: "100000" },
  },
  geo_code: "false",
  geo_code_locs: "",
  coords: {
    latitude: null,
    longitude: null,
  },
});
```

#### `X404NoDebt`

Negative balance verification.

```javascript
import { X404NoDebt } from "magenx404";

const result = await X404NoDebt({
  wallet: "phantom", // Optional
  check_protocols: ["protocol1", "protocol2"],
  max_debt_allowed: "0",
  geo_code: "false",
  geo_code_locs: "",
  coords: {
    latitude: null,
    longitude: null,
  },
});
```

#### `X404Age`

Wallet age verification.

```javascript
import { X404Age } from "magenx404";

const result = await X404Age({
  wallet: "phantom", // Optional
  min_wallet_age_days: 90,
  min_first_transaction_days: 30,
  geo_code: "false",
  geo_code_locs: "",
  coords: {
    latitude: null,
    longitude: null,
  },
});
```

## Feature Configuration

### Common Properties

All feature functions accept these common properties:

- `wallet` (optional) - Wallet name ("phantom", "solflare", "backpack"). If not provided, a modal will appear for wallet selection.
- `geo_code` - Enable geolocation check: "true" or "false"
- `geo_code_locs` - Allowed country codes (comma-separated): "US,UK"
- `coords` - Geolocation coordinates object
  - `latitude` - Latitude (number or null)
  - `longitude` - Longitude (number or null)

### Feature-Specific Properties

#### Timelock

- `required_mint` (required) - Token mint address
- `mint_amount` (required) - Required token amount (string)
- `min_hold_duration_days` (required) - Minimum hold duration in days (number)

#### Blacklist

- `excluded_mints` (required) - Array of excluded token mint addresses
- `max_holdings` (optional) - Object with max holdings per token: `{ "token_address": "max_amount" }`

#### MultiToken

- `required_tokens` (required) - Array of `{ mint, amount }` objects
- `verification_mode` (required) - "ALL" or "ANY"

#### Activity

- `min_transactions` (required) - Minimum number of transactions (number)
- `min_volume` (required) - Minimum volume (string)
- `time_period_days` (required) - Time period in days (number)
- `transaction_types` (required) - Array of transaction types (e.g., ["swap", "transfer"])

#### Tier

- `tier_config` (required) - Object with `bronze`, `silver`, `gold` tier configs: `{ tier: { mint: string, amount: string } }`

#### NoDebt

- `check_protocols` (optional) - Array of protocols to check
- `max_debt_allowed` (required) - Maximum debt allowed (string)

#### Age

- `min_wallet_age_days` (required) - Minimum wallet age in days (number)
- `min_first_transaction_days` (required) - Minimum first transaction days (number)

## Response Format

All authentication functions return a consistent result object:

```javascript
{
  success: boolean,
  token?: string,
  tier?: "bronze" | "silver" | "gold", // For tier feature
  message?: string,
  error?: string
}
```

### Error Types

- `NONCE_ERROR` - Failed to get nonce from server
- `SIGNING_ERROR` - Failed to sign authentication challenge
- `WALLET_CANCELLED` - User cancelled wallet selection
- `LOCATION_ERROR` - Geolocation access error
- `LOCATION_DENIED` - Access denied for location
- `INSUFFICIENT_TOKENS` - User doesn't meet token requirements
- `INSUFFICIENT_HOLD_DURATION` - Tokens not held long enough
- `INSUFFICIENT_ACTIVITY` - User doesn't meet activity requirements
- `HOLDS_BANNED_TOKEN` - User holds excluded tokens
- `EXCEEDS_MAX_HOLDING` - User exceeds max holdings
- `HAS_DEBT` - User has outstanding debts
- `WALLET_TOO_NEW` - Wallet doesn't meet age requirements
- `UNKNOWN_ERROR` - Unexpected error

## Token Storage

Each feature automatically stores its JWT token in localStorage with the following keys:

- `sjwt404_timelock` - Timelock feature
- `sjwt404_blacklist` - Blacklist feature
- `sjwt404_multitoken` - MultiToken feature
- `sjwt404_activity` - Activity feature
- `sjwt404_tier` - Tier feature
- `sjwt404_nodebt` - NoDebt feature
- `sjwt404_age` - Age feature

Tokens persist across sessions and are automatically checked on subsequent authentication attempts.

## Wallet Selection Modal

If you don't provide a `wallet` parameter in the config, a beautiful modal will automatically appear allowing users to select from their installed wallets (Phantom, Solflare, Backpack).

## License

ISC

## Author

Manuel Of The North
