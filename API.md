# x404 API Documentation

This document describes the API endpoints that the x404 package expects to interact with.

## Base URL

```
https://magenx404-server-production.up.railway.app/x404_auth
```

## Authentication Flow

All endpoints follow the same authentication pattern:

1. **GET Request** - Client requests nonce

   - Server returns `X-404-Nonce` header
   - Server returns `X-404-Mechanism` header

2. **Client Signs Challenge**

   - Payload format: `CHALLENGE::${nonce}::${path}::${feature}`
   - User signs with wallet
   - Client sends signature in `X-404-Signature` header

3. **GET Request with Headers**

   - `X-404-Nonce`: Nonce from step 1
   - `X-404-Signature`: Base58-encoded signature
   - `X-404-Addr`: User's public key
   - `X-404-Feature`: Feature name (e.g., "blacklist", "timelock")
   - Feature-specific headers

4. **Server Verification**
   - Verify signature matches public key
   - Perform feature-specific checks
   - Return JWT token if successful

## Endpoints

### 1. `/blacklist` - Exclusion-Based Authentication

**Headers:**

- `X-404-Nonce`: Nonce
- `X-404-Signature`: Signature
- `X-404-Addr`: Public key
- `X-404-Feature`: "blacklist"
- `excluded_mints`: JSON array of token mint addresses
- `max_holdings`: JSON object of max holdings
- `X-Lat`: Latitude
- `X-Long`: Longitude
- `geo_code`: "true" or "false"
- `geo_code_locs`: Country code

**Verification Logic:**

1. Check wallet does NOT hold any tokens in `excluded_mints`
2. Check wallet does NOT exceed `max_holdings` for any token
3. Verify geolocation if enabled
4. Return JWT if all checks pass

**Response Codes:**

- `200`: Success - Returns `{ token: "JWT_TOKEN", ... }`
- `401`: Location denied - `{ status: "locdeny", message: "..." }`
- `403`: Exceeds max holdings - `{ error: "EXCEEDS_MAX_HOLDING", message: "..." }`
- `500`: Holds banned token or location error - `{ status: "locerror" }` or `{ error: "HOLDS_BANNED_TOKEN", message: "..." }`

---

### 2. `/timelock` - Time-Based Token Holding

**Headers:**

- `X-404-Nonce`: Nonce
- `X-404-Signature`: Signature
- `X-404-Addr`: Public key
- `X-404-Feature`: "timelock"
- `required_mint`: Token mint address
- `mint_amount`: Minimum amount required
- `min_hold_duration_days`: Minimum days tokens must be held
- `X-Lat`: Latitude
- `X-Long`: Longitude
- `geo_code`: "true" or "false"
- `geo_code_locs`: Country code

**Verification Logic:**

1. Check current token balance ≥ `mint_amount`
2. Query transaction history to verify holding duration
3. Verify tokens held for at least `min_hold_duration_days`
4. Return JWT if requirements met

**Response Codes:**

- `200`: Success - Returns `{ token: "JWT_TOKEN", ... }`
- `500`: Insufficient hold duration - `{ error: "INSUFFICIENT_HOLD_DURATION", message: "..." }`

---

### 3. `/multitoken` - Multi-Token Verification

**Headers:**

- `X-404-Nonce`: Nonce
- `X-404-Signature`: Signature
- `X-404-Addr`: Public key
- `X-404-Feature`: "multitoken"
- `required_tokens`: JSON array of `[{ mint: "...", amount: "..." }]`
- `verification_mode`: "ALL" or "ANY"
- `X-Lat`: Latitude
- `X-Long`: Longitude
- `geo_code`: "true" or "false"
- `geo_code_locs`: Country code

**Verification Logic:**

1. Check balance for each token in `required_tokens`
2. If `verification_mode` is "ALL": verify all tokens meet requirements
3. If `verification_mode` is "ANY": verify at least one token meets requirements
4. Return JWT if mode requirements met

**Response Codes:**

- `200`: Success - Returns `{ token: "JWT_TOKEN", ... }`
- `500`: Insufficient tokens - `{ error: "INSUFFICIENT_TOKENS", message: "..." }`

---

### 4. `/activity` - Transaction History Verification

**Headers:**

- `X-404-Nonce`: Nonce
- `X-404-Signature`: Signature
- `X-404-Addr`: Public key
- `X-404-Feature`: "activity"
- `min_transactions`: Minimum number of transactions
- `min_volume`: Minimum trading volume
- `time_period_days`: Time period in days
- `transaction_types`: JSON array of transaction types
- `X-Lat`: Latitude
- `X-Long`: Longitude
- `geo_code`: "true" or "false"
- `geo_code_locs`: Country code

**Verification Logic:**

1. Query blockchain for transactions in last `time_period_days`
2. Filter by `transaction_types`
3. Count transactions and calculate volume
4. Verify count ≥ `min_transactions` and volume ≥ `min_volume`
5. Return JWT if requirements met

**Response Codes:**

- `200`: Success - Returns `{ token: "JWT_TOKEN", ... }`
- `500`: Insufficient activity - `{ error: "INSUFFICIENT_ACTIVITY", message: "..." }`

---

### 5. `/tier` - Tiered Access Levels

**Headers:**

- `X-404-Nonce`: Nonce
- `X-404-Signature`: Signature
- `X-404-Addr`: Public key
- `X-404-Feature`: "tier"
- `tier_config`: JSON object with bronze/silver/gold requirements
- `X-Lat`: Latitude
- `X-Long`: Longitude
- `geo_code`: "true" or "false"
- `geo_code_locs`: Country code

**Verification Logic:**

1. Check token balance for each tier (bronze, silver, gold)
2. Determine highest tier user qualifies for
3. Return JWT with tier information

**Response Codes:**

- `200`: Success - Returns `{ token: "JWT_TOKEN", tier: "bronze|silver|gold", ... }`
- `500`: No tier qualified - `{ error: "INSUFFICIENT_TOKENS", message: "..." }`

---

### 6. `/nodebt` - Negative Balance Verification

**Headers:**

- `X-404-Nonce`: Nonce
- `X-404-Signature`: Signature
- `X-404-Addr`: Public key
- `X-404-Feature`: "nodebt"
- `check_protocols`: JSON array of protocol names
- `max_debt_allowed`: Maximum debt allowed (usually "0")
- `X-Lat`: Latitude
- `X-Long`: Longitude
- `geo_code`: "true" or "false"
- `geo_code_locs`: Country code

**Verification Logic:**

1. Query each protocol in `check_protocols` for user's debt
2. Sum total debt across all protocols
3. Verify total debt ≤ `max_debt_allowed`
4. Return JWT if no debt (or within limit)

**Response Codes:**

- `200`: Success - Returns `{ token: "JWT_TOKEN", ... }`
- `500`: Has debt - `{ error: "HAS_DEBT", message: "..." }`

---

### 7. `/age` - Wallet Age Verification

**Headers:**

- `X-404-Nonce`: Nonce
- `X-404-Signature`: Signature
- `X-404-Addr`: Public key
- `X-404-Feature`: "age"
- `min_wallet_age_days`: Minimum wallet age in days
- `min_first_transaction_days`: Minimum days since first transaction
- `X-Lat`: Latitude
- `X-Long`: Longitude
- `geo_code`: "true" or "false"
- `geo_code_locs`: Country code

**Verification Logic:**

1. Query blockchain for wallet creation date (first transaction)
2. Calculate wallet age
3. Verify wallet age ≥ `min_wallet_age_days`
4. Verify first transaction ≥ `min_first_transaction_days` ago
5. Return JWT if requirements met

**Response Codes:**

- `200`: Success - Returns `{ token: "JWT_TOKEN", ... }`
- `500`: Wallet too new - `{ error: "WALLET_TOO_NEW", message: "..." }`

---

## JWT Token Verification

For subsequent requests, clients send:

- `x-jwt`: JWT token from previous authentication

Server should:

1. Verify JWT signature
2. Check expiration
3. Verify token is for correct feature
4. Return `200` if valid, `401` if invalid

---

## Example Server Implementation (Python/Flask)

```python
from flask import Flask, request, jsonify
import jwt
from datetime import datetime, timedelta

app = Flask(__name__)
SECRET_KEY = "your-secret-key"

@app.route('/x404_auth/blacklist', methods=['GET'])
def x404_blacklist():
    # Get nonce request
    if 'X-404-Nonce' not in request.headers:
        nonce = generate_nonce()
        response = jsonify({"status": "nonce_ready"})
        response.headers['X-404-Nonce'] = nonce
        response.headers['X-404-Mechanism'] = 'MAGEN404'
        return response

    # Verify signature
    nonce = request.headers.get('X-404-Nonce')
    signature = request.headers.get('X-404-Signature')
    public_key = request.headers.get('X-404-Addr')

    if not verify_signature(nonce, signature, public_key):
        return jsonify({"error": "INVALID_SIGNATURE"}), 401

    # Get excluded mints
    excluded_mints = json.loads(request.headers.get('excluded_mints', '[]'))
    max_holdings = json.loads(request.headers.get('max_holdings', '{}'))

    # Check wallet balances
    wallet_balances = get_wallet_balances(public_key)

    # Verify no excluded tokens
    for mint in excluded_mints:
        if wallet_balances.get(mint, 0) > 0:
            return jsonify({
                "error": "HOLDS_BANNED_TOKEN",
                "message": f"Wallet holds excluded token: {mint}"
            }), 500

    # Verify max holdings
    for mint, max_amount in max_holdings.items():
        if wallet_balances.get(mint, 0) > float(max_amount):
            return jsonify({
                "error": "EXCEEDS_MAX_HOLDING",
                "message": f"Wallet exceeds max holding for {mint}"
            }), 403

    # Generate JWT
    token = jwt.encode({
        'public_key': public_key,
        'feature': 'blacklist',
        'exp': datetime.utcnow() + timedelta(days=30)
    }, SECRET_KEY, algorithm='HS256')

    return jsonify({
        "success": True,
        "token": token
    }), 200
```

---

## Error Response Format

All errors should follow this format:

```json
{
  "error": "ERROR_TYPE",
  "message": "Human-readable error message",
  "status": "locerror" // Optional, for location errors
}
```

Common error types:

- `NONCE_ERROR`
- `LOCATION_ERROR`
- `LOCATION_DENIED`
- `HOLDS_BANNED_TOKEN`
- `EXCEEDS_MAX_HOLDING`
- `INSUFFICIENT_HOLD_DURATION`
- `INSUFFICIENT_TOKENS`
- `INSUFFICIENT_ACTIVITY`
- `HAS_DEBT`
- `WALLET_TOO_NEW`
- `UNKNOWN_ERROR`
