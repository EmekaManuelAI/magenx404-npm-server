# Server Setup Guide

This guide will help you set up and run the x404 authentication server.

## Quick Start

1. **Install Dependencies**

```bash
npm install
```

2. **Configure Environment Variables**

Create a `.env` file in the project root (or `server/.env`):

```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=30d
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

**Important**: Change `JWT_SECRET` to a secure random string in production!

3. **Start the Server**

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Testing the Server

### Health Check

```bash
curl http://localhost:3000/health
```

### Test Nonce Generation

```bash
curl -H "Authorization: bearer test-token" http://localhost:3000/x404_auth/blacklist
```

You should receive a response with `X-404-Nonce` header.

## Updating Client Code

To use your local server instead of the hosted one, update the URLs in the feature files:

```javascript
// Production URL:
const url = "https://magenx404-server-production.up.railway.app/x404_auth/blacklist";

// Local development:
const url = "http://localhost:3000/x404_auth/blacklist";
```

## Production Deployment

1. **Use a Production RPC Endpoint**

   - Sign up for a dedicated Solana RPC provider (Helius, QuickNode, etc.)
   - Update `SOLANA_RPC_URL` in your environment variables

2. **Set Secure JWT Secret**

   ```bash
   # Generate a secure secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Configure CORS**

   Update CORS settings in `server/index.js` to allow only your frontend domain.

4. **Add Rate Limiting**

   Consider adding rate limiting middleware to prevent abuse.

5. **Set Up Monitoring**

   Add logging and error tracking (e.g., Sentry, LogRocket).

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, change the `PORT` environment variable:

```env
PORT=3001
```

### RPC Rate Limiting

If you encounter rate limit errors, switch to a dedicated RPC provider with higher limits.

### Signature Verification Fails

- Ensure the client is signing the correct challenge payload
- Check that the nonce matches between requests
- Verify the public key format is correct

## Next Steps

- Review `server/README.md` for detailed API documentation
- Check `API.md` for endpoint specifications
- Test with the client-side code in `src/features/`
