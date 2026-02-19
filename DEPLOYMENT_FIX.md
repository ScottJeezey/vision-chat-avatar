# Deployment Fix - Secure Claude API Proxy

## What Was Wrong

The app was calling the Claude API **directly from the browser**, which:
1. ❌ Exposed the API key in client-side JavaScript (security risk)
2. ❌ Required `VITE_ANTHROPIC_API_KEY` in Vercel (client-side)
3. ❌ Failed in production due to API key exposure

## What We Fixed

The Claude API now goes **through the proxy server** (like VerifEye APIs):

**New Architecture:**
```
Browser → Proxy Server → Claude API
         ↓
         → VerifEye APIs
```

**Changes Made:**
1. ✅ Added `/api/claude/chat` endpoint to proxy server
2. ✅ Moved API key to server-side only (secure)
3. ✅ Updated frontend to call proxy instead of Claude directly
4. ✅ Installed @anthropic-ai/sdk in server

## Deployment Steps

### 1. Update Render Environment Variables

Go to your Render dashboard for the backend:

1. Navigate to: https://dashboard.render.com
2. Select your `verifeye-proxy` service
3. Go to **Environment** tab
4. Add **NEW** environment variable:
   ```
   ANTHROPIC_API_KEY
   ```
   Value: `sk-ant-api03-...` (your Anthropic API key)

5. **Important:** Keep existing variables:
   - `VERIFEYE_API_KEY`
   - `VERIFEYE_REGION`
   - `NODE_ENV=production`

6. Click **Save Changes**
7. Render will automatically redeploy with the new variable

### 2. Update Vercel Environment Variables

Go to your Vercel dashboard for the frontend:

1. Navigate to: https://vercel.com/dashboard
2. Select your `vision-chat-avatar` project
3. Go to **Settings → Environment Variables**
4. **REMOVE** (if exists):
   - `VITE_ANTHROPIC_API_KEY` ← Delete this, no longer needed

5. **VERIFY** (should already exist):
   - `VITE_PROXY_URL` = `https://verifeye-proxy.onrender.com/api`

6. **Redeploy:**
   - Go to **Deployments** tab
   - Click 3 dots (...) on latest deployment
   - Click **Redeploy**

### 3. Deploy Updated Code

Push the changes to trigger deployments:

```bash
cd /Users/scott.jones/ai-workspace/vision-chat-avatar
git add .
git commit -m "Fix: Move Claude API to secure proxy server

- Add /api/claude/chat endpoint to proxy server
- Remove client-side Anthropic SDK usage (security fix)
- API key now server-side only
- Fixes 'invalid x-api-key' production errors"
git push
```

Both Vercel (frontend) and Render (backend) will auto-deploy from git push.

## Verification

After deployment:

1. **Visit:** https://vision-chat-avatar.vercel.app
2. **Open browser console** (F12)
3. **Say something** to the avatar
4. **Check console logs:**
   - Should see: `🤖 Calling Claude API via proxy`
   - Should NOT see: `invalid x-api-key` errors
5. **Avatar should respond** normally

## Local Development

For local development, update your `.env` file in the project root:

```bash
# Remove this line (if exists):
# VITE_ANTHROPIC_API_KEY=sk-ant-...

# Add this line instead:
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Keep existing:
VERIFEYE_API_KEY=your_key
VERIFEYE_REGION=us
VITE_PROXY_URL=http://localhost:3001/api
```

Then restart both servers:

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
npm run dev
```

## Security Benefits

✅ **Before:** API key exposed in browser JavaScript (anyone can steal)
✅ **After:** API key only on secure backend server
✅ **Same pattern** as VerifEye APIs (consistent architecture)
✅ **Rate limiting** can be added to proxy in future
✅ **Monitoring** centralized on backend

## Troubleshooting

**If avatar still doesn't respond:**

1. Check Render logs:
   - Go to Render dashboard → verifeye-proxy → Logs
   - Look for: `✅ Anthropic API key configured`
   - Should NOT see: `⚠️ WARNING: ANTHROPIC_API_KEY not found`

2. Check Render is awake:
   - Visit: https://verifeye-proxy.onrender.com/health
   - Should return: `{"status":"ok","demoMode":false}`
   - First request might take 30-60 seconds (cold start)

3. Check browser console:
   - Should call: `https://verifeye-proxy.onrender.com/api/claude/chat`
   - Should NOT have CORS errors
   - Should NOT have 500 errors

4. Verify API key is valid:
   - Go to: https://console.anthropic.com/settings/keys
   - Check key is active and has credits

## Files Changed

- `server/index.js` - Added Claude proxy endpoint
- `server/package.json` - Added @anthropic-ai/sdk dependency
- `src/api/claude.ts` - Changed to use proxy instead of direct API calls
- `.env.example` - Updated to show ANTHROPIC_API_KEY (not VITE_ANTHROPIC_API_KEY)
- `server/.env.example` - Created server environment variable template
- `README.md` - Updated setup instructions

---

**Timeline:** This fix addresses the production errors reported by Nicolò where transcription worked but avatar responses failed with "invalid x-api-key" errors.
