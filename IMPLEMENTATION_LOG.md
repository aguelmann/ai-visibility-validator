# AI Validator Tool - Implementation Log & Technical Documentation

**Date:** January 29, 2026
**Developer Handoff Document**

---

## Executive Summary

Implemented two major features for the AI Visibility Validator tool:
1. **Bot TTFB Probing** - Server-side measurement of website response times using real AI bot user agents
2. **PDF Export** - Client-side PDF generation of analysis reports

**Current Status:** ⚠️ Bot TTFB feature experiencing "Failed to fetch" errors in production despite backend working correctly when tested directly.

---

## 1. Features Implemented

### 1.1 Bot TTFB Probe Feature

**Purpose:** Measure real TTFB (Time To First Byte) by simulating requests with actual AI bot user agents (GPTBot, ClaudeBot, PerplexityBot, etc.)

**Architecture:**
- **Backend:** Google Cloud Run service (`cloud-run-bot-probe/`)
- **Frontend:** Progressive batched requests in `app.js`
- **Configuration:** `config.js` with `BOT_PROBE_URL`

**Bots Tested (8 total):**
- OpenAI: GPTBot, ChatGPT-User, OAI-SearchBot
- Anthropic: ClaudeBot, Claude-SearchBot, Claude-User
- Perplexity: PerplexityBot, Perplexity-User

**UI Integration:**
- New section in TTFB tab: "Simulated Bot TTFB"
- Progressive loading skeleton with pulsing animation
- Results grouped by company
- Retry button with timestamp
- Includes bot results in PDF export

### 1.2 PDF Export Feature

**Purpose:** Generate downloadable PDF reports with all analysis data

**Implementation:**
- **Library:** pdf-lib (CDN loaded in `tool.html`)
- **Location:** "Download PDF" button under URL input
- **Content:** CrUX metrics, bot TTFB results, crawlability status, clickable CTA links
- **Filename:** `ai-visibility-report_{hostname}_{date}.pdf`

---

## 2. Technical Implementation Details

### 2.1 Cloud Run Bot Probe Service

**Location:** `cloud-run-bot-probe/`

**Files:**
- `index.js` - Express server with probe endpoint
- `package.json` - Dependencies (express, undici)
- `README.md` - Deployment instructions

**Key Configuration:**
```javascript
CONCURRENCY_LIMIT: 2         // Max concurrent bot probes
REQUEST_TIMEOUT_MS: 5000     // 5 second timeout per request
CACHE_TTL_MS: 5 * 60 * 1000  // 5 minute cache
```

**API Endpoint:**
```
POST https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/probe

Request:
{
  "url": "https://example.com",
  "botKeys": ["openai_gptbot", "anthropic_claudebot"]
}

Response:
{
  "success": true,
  "url": "https://example.com/",
  "generatedAt": "2026-01-29T20:00:00.000Z",
  "results": [
    {
      "botKey": "openai_gptbot",
      "company": "OpenAI",
      "label": "GPTBot",
      "ttfbMs": 348,
      "status": 200,
      "finalUrl": "https://example.com/",
      "redirects": 0,
      "cached": false
    }
  ]
}
```

**CORS Configuration:**
```javascript
Allowed origins:
- https://ai-check.andreguelmann.com
- https://andreguelmann.com
- http://localhost:3000
- http://localhost:5173
```

**Cloud Run Settings:**
- Region: us-central1
- Memory: 512Mi
- Timeout: 60 seconds
- Max instances: 10
- Authentication: Unauthenticated (public)

### 2.2 Frontend Implementation

**Location:** `app.js`

**Key Functions:**

1. **`fetchBotTtfb(url)`** - Main function
   - Splits 8 bots into 4 batches of 2
   - Makes sequential API calls for each batch
   - Updates UI progressively as results arrive
   - Handles errors per-batch

2. **`renderBotTtfbLoading()`** - Initial UI
   - Shows skeleton table with all 8 bots
   - "Testing..." status with pulsing animation

3. **`renderBotTtfbResults(results)`** - Progressive updates
   - Updates individual bot rows as results arrive
   - Fade-in animation
   - Skips already-rendered rows

**Batching Strategy:**
```javascript
BATCH_SIZE = 2  // Only 2 bots per request (reliability limit)

Batches:
1. GPTBot, ChatGPT-User
2. OAI-SearchBot, ClaudeBot
3. Claude-SearchBot, Claude-User
4. PerplexityBot, Perplexity-User
```

**Timeout Configuration:**
```javascript
fetch(url, {
  signal: AbortSignal.timeout(30000)  // 30 second timeout per batch
})
```

---

## 3. Issues Encountered & Solutions Attempted

### Issue 1: Multi-Bot Timeout (CRITICAL)

**Problem:** Testing more than 2 bots simultaneously causes Cloud Run to timeout or return "Service Unavailable"

**Root Cause:**
- Concurrency limit discovered through testing
- Works with 1-2 bots: ✅
- Fails with 3+ bots: ❌

**Solutions Attempted:**

1. **Increased Cloud Run timeout:** 30s → 60s → 90s → 120s
   - Result: No improvement

2. **Reduced concurrency:** 8 → 6 → 3 → 2 → 1
   - Result: Only concurrency=2 works reliably

3. **Reduced per-request timeouts:** 15s → 10s → 7s → 5s
   - Result: Some improvement but still limited to 2 concurrent

4. **Removed complex timeout wrappers:** Simplified code, removed Promise.race
   - Result: Slight improvement in reliability

5. **Increased memory:** 256Mi → 512Mi
   - Result: No significant impact

**Final Solution:** Implemented batched requests on frontend
- Split 8 bots into 4 batches of 2
- Sequential API calls
- Progressive UI updates
- Total time: ~10-15 seconds

### Issue 2: "Failed to Fetch" Errors (CURRENT)

**Problem:** Frontend shows "Failed to fetch" for all bots despite backend working correctly

**Evidence:**
- Direct curl tests to Cloud Run: ✅ Works perfectly
- CORS headers: ✅ Properly configured
- Frontend on live site: ❌ All requests fail

**Testing Results:**
```bash
# Direct API test - WORKS
curl -X POST https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/probe \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.andreguelmann.com/","botKeys":["openai_gptbot","openai_chatgpt_user"]}'

Response: {"success":true, "results":[...]}
Status: 200 OK
Time: ~2 seconds
```

**Possible Causes:**

1. **CORS Preflight Failure**
   - OPTIONS request to /probe returns 404 (should be 204)
   - However, CORS headers are present
   - May need explicit OPTIONS handler

2. **Client-Side CORS Policy**
   - Browser may be blocking despite server headers
   - Check browser console for CORS errors

3. **JavaScript Error**
   - Possible uncaught exception in fetch code
   - Check browser DevTools console

4. **Network/CDN Issue**
   - Possible intermediate caching/proxy blocking
   - Vercel edge network interference

5. **Fetch API Compatibility**
   - `AbortSignal.timeout()` requires modern browser
   - May fail silently in older browsers

**Solutions Attempted:**
- Added 30-second fetch timeout
- Improved error logging
- Better error message display
- Still failing in production

### Issue 3: Rate Limiting on Certain Sites

**Problem:** Some sites (AccessiBe, etc.) have aggressive rate limiting

**Observation:**
- Single bot probe: ✅ Works
- Multiple bots: ❌ Times out or blocks

**Solution:**
- Batching helps but doesn't fully resolve
- Consider adding delays between batches
- User education: some sites will always block/rate-limit

### Issue 4: Local File Testing

**Problem:** Opening HTML file directly (file://) causes CORS to block API calls

**Cause:** Browsers enforce strict CORS for file:// protocol

**Solution:** Requires local web server
```bash
# Python
python -m http.server 8000

# Node
npx http-server -p 8000
```

---

## 4. Files Modified

### New Files Created:
```
cloud-run-bot-probe/
  ├── index.js          # Express server with probe endpoint
  ├── package.json      # Dependencies
  └── README.md         # Deployment guide
```

### Modified Files:
```
config.js              # Added BOT_PROBE_URL
tool.html              # Added bot TTFB UI section, PDF button, pdf-lib CDN
app.js                 # Bot probe logic, PDF generation, progressive rendering
styles.css             # Bot table styling, loading animations
.gitignore             # Exclude cloud-run node_modules and Claude settings
```

### Git Commits:
```
e45841a - Add Cloud Run bot TTFB probe + PDF export functionality
37cc375 - Improve Cloud Run bot probe timeout handling
e98c525 - Add progressive bot TTFB probing with visual loading states
fba1cff - Fix bot TTFB: Use batched requests for reliability
2b0e10e - Add better error handling and fetch timeout for bot probes
```

---

## 5. Debugging Guide for Developer

### Step 1: Verify Cloud Run Service

Test the backend directly:
```bash
curl -X POST https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/probe \
  -H "Content-Type: application/json" \
  -H "Origin: https://ai-check.andreguelmann.com" \
  -d '{"url":"https://example.com","botKeys":["openai_gptbot","anthropic_claudebot"]}'
```

Expected: 200 OK with JSON results in ~2-5 seconds

### Step 2: Check CORS Preflight

```bash
curl -I -X OPTIONS https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/probe \
  -H "Origin: https://ai-check.andreguelmann.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

Expected: 204 No Content with CORS headers

Current: 404 Not Found (but CORS headers present) ⚠️

### Step 3: Browser DevTools Check

Open https://ai-check.andreguelmann.com/tool in browser:

1. **Console Tab:**
   - Look for CORS errors
   - Look for JavaScript errors
   - Look for "Failed to fetch" network errors

2. **Network Tab:**
   - Filter by "probe"
   - Check if request is sent
   - Check response status
   - Check timing
   - Check CORS headers in response

3. **Application Tab:**
   - Clear cache and reload
   - Test again

### Step 4: Test Local Server

Set up local development environment:
```bash
cd "/path/to/AI Validator Tool"
python -m http.server 8000
```

Open: http://localhost:8000/tool.html

Test with various URLs. If it works locally but not in production, issue is likely:
- Vercel deployment config
- CDN caching
- Production CORS settings

### Step 5: Check Cloud Run Logs

```bash
gcloud run services logs read bot-ttfb-probe --region us-central1 --limit 50
```

Look for:
- Request errors
- Timeout errors
- CORS-related errors
- Crash logs

---

## 6. Known Limitations

1. **Concurrency Limit:** Only 2 bots can be probed simultaneously
   - Hardware/resource limitation of Cloud Run instance
   - Solution: Batched requests (implemented)

2. **Total Probe Time:** 10-15 seconds for all 8 bots
   - Cannot be significantly reduced without higher concurrency
   - Acceptable for business use

3. **Site Rate Limiting:** Some sites (AccessiBe, etc.) block/throttle multiple rapid requests
   - Not fixable on our end
   - User education needed

4. **HTTP 403 Blocking:** Some sites (NYTimes, etc.) explicitly block AI bots
   - Expected behavior
   - Correctly displayed as "HTTP 403"

5. **Local File Testing:** Requires web server due to CORS
   - Documented in testing guide

---

## 7. Recommended Next Steps

### Immediate (Critical Bug Fix):

1. **Fix CORS/Fetch Issue:**
   - Add explicit OPTIONS handler to Cloud Run service
   - Test CORS preflight separately
   - Add comprehensive error logging in browser
   - Check if `AbortSignal.timeout()` is causing issues

2. **Alternative: Use Different Fetch Approach:**
   ```javascript
   // Instead of AbortSignal.timeout (new API)
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 30000);

   fetch(url, { signal: controller.signal })
     .finally(() => clearTimeout(timeoutId));
   ```

3. **Debugging Code:**
   Add this to `app.js` temporarily:
   ```javascript
   console.log('Fetching batch:', batchIndex, 'URL:', url, 'Bots:', botKeys);

   fetch(url, options)
     .then(res => {
       console.log('Response received:', res.status, res.headers);
       return res;
     })
     .catch(err => {
       console.error('Fetch failed:', err.name, err.message, err.stack);
       throw err;
     });
   ```

### Short-term (Optimization):

1. **Increase Concurrency:**
   - Test with larger Cloud Run instances
   - Consider Cloud Run Gen 2 with more CPU/memory
   - Goal: Process 4-8 bots concurrently

2. **Add Retry Logic:**
   - Automatic retry on failure
   - Exponential backoff
   - Per-bot retry (not whole batch)

3. **Cache Improvements:**
   - Extend cache TTL to 15-30 minutes
   - Add Redis/Memcache for distributed caching
   - Cache per bot+URL combination

### Long-term (Enhancement):

1. **WebSocket Streaming:**
   - Real-time result streaming
   - True progressive display
   - Better user experience

2. **Server-Sent Events (SSE):**
   - Simpler alternative to WebSockets
   - Push results as they complete
   - No need for batching

3. **Distributed Probing:**
   - Multiple Cloud Run regions
   - Parallel regional probes
   - Faster total completion time

4. **User-Agent Rotation:**
   - Rotate IPs/regions to avoid rate limiting
   - Use proxy services if needed

---

## 8. Cloud Resources & Access

### Google Cloud Project:
- **Project ID:** ai-visibility-validator
- **Region:** us-central1

### Cloud Run Services:
1. **Bot Probe Service:**
   - Name: bot-ttfb-probe
   - URL: https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app
   - Status: ✅ Deployed and running
   - Memory: 512Mi
   - Timeout: 60s

2. **CrUX API Proxy:**
   - Name: crux-api-proxy
   - URL: https://crux-api-proxy-tbohkm5aaq-uc.a.run.app
   - Status: ✅ Working

### Vercel Deployment:
- **Production URL:** https://ai-check.andreguelmann.com/
- **Auto-deploy:** Yes (on GitHub push to main)
- **GitHub Repo:** https://github.com/aguelmann/ai-visibility-validator

### Deployment Commands:

**Deploy Cloud Run:**
```bash
cd cloud-run-bot-probe/
gcloud run deploy bot-ttfb-probe \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 60s \
  --max-instances 10
```

**Deploy to Vercel:**
```bash
git add .
git commit -m "Your commit message"
git push origin main
# Vercel auto-deploys
```

---

## 9. Testing Checklist

- [ ] Cloud Run service responds to direct curl
- [ ] CORS preflight returns 204 (not 404)
- [ ] Browser console shows no CORS errors
- [ ] Browser network tab shows successful requests
- [ ] Results appear progressively (4 batches)
- [ ] Error messages are specific (not generic "Failed to fetch")
- [ ] Works on multiple test sites (example.com, user's site)
- [ ] PDF export includes bot TTFB data
- [ ] Retry button works correctly
- [ ] Timestamp updates after probe completes

---

## 10. Contact & Support

**Implementation Done By:** Claude Sonnet 4.5 (Anthropic)
**Date:** January 29, 2026
**Handoff To:** Andre's Developer Team

**Critical Issue:** Bot TTFB feature shows "Failed to fetch" in production despite backend working correctly. CORS/fetch debugging required.

**Priority:** HIGH - Business-critical feature

---

## Appendix A: Code Snippets

### Cloud Run CORS Middleware (index.js):
```javascript
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', allowOrigin(origin));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});
```

### Frontend Batch Fetch (app.js):
```javascript
const BATCH_SIZE = 2;
const batches = [];
for (let i = 0; i < BOT_TTFB_PROFILES.length; i += BATCH_SIZE) {
  batches.push(BOT_TTFB_PROFILES.slice(i, i + BATCH_SIZE));
}

for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
  const batch = batches[batchIndex];
  const botKeys = batch.map(bot => bot.key);

  const response = await fetch(`${CONFIG.BOT_PROBE_URL}/probe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, botKeys }),
    signal: AbortSignal.timeout(30000)
  });

  // Handle response and update UI progressively
}
```

---

**END OF TECHNICAL LOG**
