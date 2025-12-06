# x404 Auth Server

Server implementation for the Magen x404 authentication system. This server handles wallet signature verification, token balance checks, transaction history analysis, and JWT token generation.

## Features

- ✅ Nonce-based authentication flow
- ✅ Solana signature verification
- ✅ JWT token generation and validation
- ✅ Geolocation verification (optional)
- ✅ All 7 x404 authentication features:
  - Blacklist (exclusion-based)
  - Age (wallet age verification)
  - Activity (transaction history)
  - TimeLock (token holding duration)
  - MultiToken (portfolio verification)
  - Tier (tiered access levels)
  - NoDebt (debt verification)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp server/.env.example server/.env
```

3. Update `server/.env` with your configuration:
   - Set a secure `JWT_SECRET`
   - Configure your Solana RPC endpoint (recommended: use a dedicated RPC provider)

## Running the Server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will start on port 3000 (or the port specified in `PORT` environment variable).

## API Endpoints

All endpoints are available at `/x404_auth/{feature}`:

- `GET /x404_auth/blacklist` - Blacklist feature
- `GET /x404_auth/age` - Age feature
- `GET /x404_auth/activity` - Activity feature
- `GET /x404_auth/timelock` - TimeLock feature
- `GET /x404_auth/multitoken` - MultiToken feature
- `GET /x404_auth/tier` - Tier feature
- `GET /x404_auth/nodebt` - NoDebt feature

### Health Check

- `GET /health` - Server health check

## Authentication Flow

1. **Nonce Request**: Client makes GET request without auth headers

   - Server responds with `X-404-Nonce` header

2. **Signature**: Client signs challenge and sends:

   - `X-404-Nonce`: Nonce from step 1
   - `X-404-Signature`: Base58-encoded signature
   - `X-404-Addr`: User's public key
   - `X-404-Feature`: Feature name
   - Feature-specific headers

3. **Verification**: Server verifies signature and performs feature checks

4. **JWT Token**: Server returns JWT token on success

5. **Subsequent Requests**: Client sends `x-jwt` header for token validation

## Environment Variables

| Variable         | Description                | Default                                |
| ---------------- | -------------------------- | -------------------------------------- |
| `PORT`           | Server port                | `3000`                                 |
| `JWT_SECRET`     | Secret key for JWT signing | `your-secret-key-change-in-production` |
| `JWT_EXPIRY`     | JWT token expiration       | `30d`                                  |
| `SOLANA_RPC_URL` | Solana RPC endpoint        | `https://api.mainnet-beta.solana.com`  |

## Solana RPC Requirements

The server requires a Solana RPC endpoint to:

- Query token balances
- Get transaction history
- Verify wallet age
- Check token holding duration

**Recommended RPC Providers:**

- [Helius](https://www.helius.dev/)
- [QuickNode](https://www.quicknode.com/)
- [Alchemy](https://www.alchemy.com/)
- Public mainnet (rate-limited, not recommended for production)

## Production Considerations

1. **RPC Endpoint**: Use a dedicated RPC provider with rate limits suitable for your traffic
2. **JWT Secret**: Use a strong, randomly generated secret key
3. **CORS**: Configure CORS appropriately for your frontend domain
4. **Rate Limiting**: Consider adding rate limiting middleware
5. **Error Handling**: Implement proper logging and error tracking
6. **Geolocation**: Implement proper reverse geocoding service integration
7. **Debt Checking**: Implement actual protocol integrations for debt verification
8. **Transaction Volume**: Implement proper USD value calculation for transaction volume

## Development Notes

- The server uses ES modules (`type: "module"` in package.json)
- All Solana interactions use `@solana/web3.js` and `@solana/spl-token`
- Signature verification uses `tweetnacl` for Ed25519 verification
- JWT tokens are signed with HS256 algorithm

## Testing

You can test the server using the client-side code in the `src/features/` directory. Make sure to update the API URL in the client code to point to your server.

## License

ISC
