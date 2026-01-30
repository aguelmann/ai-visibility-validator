# Bot TTFB Feature - Developer Handoff Document

**Date:** January 30, 2026
**Status:** ❌ CRITICAL - Feature not working in production
**Priority:** HIGH - Business critical

---

## Executive Summary

The Bot TTFB (Time To First Byte) feature is experiencing persistent "Failed to fetch" errors in the browser despite:
- Backend services working perfectly when tested with curl
- CORS headers properly configured
- Multiple fix attempts (CORS preflight, timeout changes, server-side proxy)

**Critical Finding:** Browser is NOT sending requests to the bot probe service at all (no requests visible in DevTools Network tab), suggesting a client-side blocking issue unrelated to CORS.

---

## The Feature

### Purpose
Measure real website TTFB by simulating requests with actual AI bot user agents:
- OpenAI: GPTBot, ChatGPT-User, OAI-SearchBot
- Anthropic: ClaudeBot, Claude-SearchBot, Claude-User
- Perplexity: PerplexityBot, Perplexity-User

### Architecture
```
Browser (app.js)
    ↓
Cloud Function Proxy (crux-api-proxy)
    ↓
Cloud Run Bot Probe Service (bot-ttfb-probe)
    ↓
Target Website (with bot user agent)
```

---

## Current Deployment Status

### 1. Cloud Run - Bot Probe Service
- **Name:** `bot-ttfb-probe`
- **URL:** `https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app`
- **Status:** ✅ Working (verified with curl)
- **Location:** `cloud-run-bot-probe/`
- **Endpoint:** `POST /probe`
- **Health:** `GET /` returns `{"status":"ok"}`

**Test (Working):**
```bash
curl -X POST https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/probe \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/","botKeys":["openai_gptbot"]}'

# Response:
{"success":true,"url":"https://example.com/","generatedAt":"2026-01-30T01:08:51.740Z","results":[{"botKey":"openai_gptbot","company":"OpenAI","label":"GPTBot","ttfbMs":113,"status":200,"finalUrl":"https://example.com/","redirects":0,"cached":false}]}
```

### 2. Cloud Function - Proxy Service
- **Name:** `crux-api-proxy` (Cloud Run, not Cloud Functions)
- **URL:** `https://crux-api-proxy-658532897815.us-central1.run.app`
- **Status:** ✅ Working (verified with curl)
- **Location:** `cloud-function/`
- **Actions:** CrUX API, robots.txt fetch, **botProbe** (new)

**Test (Working):**
```bash
curl -X POST https://crux-api-proxy-658532897815.us-central1.run.app \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/","botKeys":["openai_gptbot"],"action":"botProbe"}'

# Response:
{"success":true,"url":"https://example.com/","generatedAt":"2026-01-30T01:09:01.038Z","results":[{"botKey":"openai_gptbot","company":"OpenAI","label":"GPTBot","ttfbMs":96,"status":200,"finalUrl":"https://example.com/","redirects":0,"cached":false}]}
```

### 3. Frontend - Vercel
- **URL:** `https://ai-check.andreguelmann.com/tool.html`
- **Status:** ❌ Not working
- **Error:** "Failed to fetch" for all bot probes
- **GitHub:** Auto-deploys from `main` branch

---

## All Solutions Attempted (Chronological)

### Attempt 1: Increase Cloud Run Timeout
**Problem:** Service timing out with 8 bots
**Action:** Increased timeout from 30s → 60s → 90s → 120s
**Result:** ❌ No improvement

### Attempt 2: Reduce Concurrency
**Problem:** Multiple bots causing service overload
**Action:** Reduced concurrent bot probes from 8 → 6 → 3 → 2 → 1
**Result:** ⚠️ Only 2 concurrent bots work reliably (hardware limitation)

### Attempt 3: Batched Requests (Frontend)
**Problem:** Can't probe more than 2 bots at once
**Action:** Split 8 bots into 4 batches of 2, sequential API calls
**Implementation:** `app.js` lines 666-735
**Result:** ⚠️ Should work but still getting "Failed to fetch"

### Attempt 4: Fix CORS Preflight
**Problem:** OPTIONS request returning 404 instead of 204
**Action:** Added explicit OPTIONS handlers in `cloud-run-bot-probe/index.js` (lines 102-118)
**Result:** ✅ CORS preflight now returns 204, but browser still fails

### Attempt 5: Replace AbortSignal.timeout()
**Problem:** Browser compatibility with timeout API
**Action:** Replaced with AbortController pattern in `app.js` (lines 681-691)
**Result:** ❌ No improvement

### Attempt 6: Server-Side Proxy (LATEST)
**Problem:** Browser CORS blocking despite correct headers
**Action:** Added `botProbe` action to cloud-function, call proxy instead of direct service
**Implementation:**
- `cloud-function/index.js` lines 28-71 (botProbe handler)
- `app.js` line 685 (changed from BOT_PROBE_URL to PROXY_URL)
- `config.js` updated with new proxy URL

**Result:** ❌ Still "Failed to fetch" in browser (despite working perfectly with curl)

---

## Critical Evidence

### What Works ✅
1. **Direct curl to bot probe service** - Perfect response in 1-2 seconds
2. **curl to proxy with botProbe action** - Perfect response
3. **Health endpoint from browser** - `{"status":"ok"}` loads fine
4. **Other features (CrUX, robots.txt)** - All working

### What Fails ❌
1. **Browser fetch to bot probe** - "Failed to fetch"
2. **Browser fetch to proxy** - "Failed to fetch"
3. **ALL 4 batches fail** - No requests visible in Network tab

### Browser Console Errors (Incognito, Chrome)
```
Access to fetch at 'https://crux-api-proxy-658532897815.us-central1.run.app'
from origin 'https://ai-check.andreguelmann.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.

TypeError: Failed to fetch
```

**BUT:** When testing with curl, the response DOES include CORS headers:
```
Access-Control-Allow-Origin: https://ai-check.andreguelmann.com
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### DevTools Network Tab Findings
- **Filter for "probe":** No requests visible
- **Filter for "crux-api-proxy":** CrUX API calls work, botProbe calls don't appear
- **Health check works:** Proves service is reachable
- **Conclusion:** Requests are being blocked BEFORE being sent

---

## Current Code Implementation

### File: `cloud-function/index.js` (Lines 28-71)

```javascript
// Handle bot probe action (server-side bot TTFB testing)
if (action === 'botProbe') {
  const { botKeys } = req.body;
  const BOT_PROBE_URL = 'https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/probe';

  if (!url) {
    res.status(400).json({ error: 'URL is required for bot probe' });
    return;
  }

  if (!botKeys || !Array.isArray(botKeys)) {
    res.status(400).json({ error: 'botKeys array is required' });
    return;
  }

  try {
    // Call the bot probe service (server-to-server, no CORS issues)
    const probeResponse = await fetch(BOT_PROBE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, botKeys })
    });

    if (!probeResponse.ok) {
      const errorText = await probeResponse.text().catch(() => 'Unknown error');
      res.status(probeResponse.status).json({
        error: 'Bot probe failed',
        status: probeResponse.status,
        details: errorText
      });
      return;
    }

    const probeData = await probeResponse.json();
    res.status(200).json(probeData);
    return;
  } catch (error) {
    res.status(500).json({
      error: 'Failed to call bot probe service',
      details: error.message
    });
    return;
  }
}
```

### File: `app.js` (Lines 654-753)

```javascript
async function fetchBotTtfb(url) {
  // Use proxy to avoid CORS issues (server-side bot probing)
  if (!CONFIG.PROXY_URL || CONFIG.PROXY_URL === 'REPLACE_WITH_YOUR_CLOUD_FUNCTION_URL') {
    showBotTtfbError('Proxy URL not configured.');
    return null;
  }

  try {
    setBotTtfbLoading(false);
    showBotTtfbError('');
    renderBotTtfbLoading(); // Show skeleton with "Testing..." for each bot

    // Split bots into batches of 2 for reliability
    const BATCH_SIZE = 2;
    const batches = [];
    for (let i = 0; i < BOT_TTFB_PROFILES.length; i += BATCH_SIZE) {
      batches.push(BOT_TTFB_PROFILES.slice(i, i + BATCH_SIZE));
    }

    const allResults = [];
    let hasError = false;

    // Fetch batches sequentially and update UI progressively
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const botKeys = batch.map(bot => bot.key);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(CONFIG.PROXY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url, botKeys, action: 'botProbe' }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Probe request failed');
        }

        // Add results from this batch
        if (data.results && data.results.length > 0) {
          allResults.push(...data.results);

          // Update UI progressively with current results
          lastBotTtfbData = {
            generatedAt: data.generatedAt,
            results: allResults
          };
          renderBotTtfbResults(allResults);
        }
      } catch (error) {
        console.error(`Batch ${batchIndex + 1} error:`, error);
        hasError = true;

        // Add error entries for failed batch
        batch.forEach(bot => {
          allResults.push({
            botKey: bot.key,
            company: bot.company,
            label: bot.label,
            error: error.message || 'Request failed',
            cached: false
          });
        });

        // Still update UI with partial results
        renderBotTtfbResults(allResults);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    lastBotTtfbData = {
      generatedAt: new Date().toISOString(),
      results: allResults
    };

    if (hasError && allResults.length === 0) {
      showBotTtfbError('All bot probes failed. Please try again.');
      return null;
    }

    return allResults;
  } catch (error) {
    console.error('Bot TTFB probe error:', error);
    showBotTtfbError(error.message || 'Failed to fetch bot TTFB.');
    return null;
  } finally {
    setBotTtfbLoading(false);
  }
}
```

### File: `config.js`

```javascript
const CONFIG = {
  PROXY_URL: 'https://crux-api-proxy-658532897815.us-central1.run.app',
  ROBOTS_PROXY_URL: 'https://crux-api-proxy-658532897815.us-central1.run.app',
  BOT_PROBE_URL: 'https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app'
};
```

---

## Testing Checklist

### Backend Tests (All Passing ✅)

```bash
# 1. Test bot probe service health
curl https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/
# Expected: {"status":"ok"}

# 2. Test bot probe service with single bot
curl -X POST https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/probe \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/","botKeys":["openai_gptbot"]}'
# Expected: {"success":true,"results":[...]}

# 3. Test bot probe service with 2 bots
curl -X POST https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/probe \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/","botKeys":["openai_gptbot","anthropic_claudebot"]}'
# Expected: {"success":true,"results":[...]}

# 4. Test proxy with botProbe action
curl -X POST https://crux-api-proxy-658532897815.us-central1.run.app \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/","botKeys":["openai_gptbot"],"action":"botProbe"}'
# Expected: {"success":true,"results":[...]}

# 5. Test CORS preflight
curl -I -X OPTIONS https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/probe \
  -H "Origin: https://ai-check.andreguelmann.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
# Expected: HTTP/1.1 204 No Content
# Expected headers:
#   Access-Control-Allow-Origin: https://ai-check.andreguelmann.com
#   Access-Control-Allow-Methods: POST, OPTIONS
#   Access-Control-Allow-Headers: Content-Type
```

### Frontend Tests (All Failing ❌)

1. Open: https://ai-check.andreguelmann.com/tool.html
2. Enter URL: https://example.com/
3. Click "Analyze"
4. Go to TTFB tab
5. Observe "Simulated Bot TTFB" section

**Expected:** Table with 8 bots, TTFB values appearing progressively
**Actual:** "Failed to fetch" error for all bots

### Browser DevTools Debugging

1. **Console Tab:**
   - Error: "No 'Access-Control-Allow-Origin' header is present"
   - Error: "TypeError: Failed to fetch"

2. **Network Tab:**
   - Filter for "probe" → No requests visible
   - Filter for "crux-api-proxy" → Only CrUX API calls visible, not botProbe
   - This proves browser is NOT sending the fetch request at all

3. **Application Tab:**
   - No service worker blocking
   - No CSP errors in console
   - Cache cleared, still fails

---

## Possible Root Causes

### 1. Content Security Policy (CSP)
**Likelihood:** HIGH
**Test:** Check if Vercel is adding CSP headers that block fetch
**Check:** Response headers from `https://ai-check.andreguelmann.com/tool.html`
```bash
curl -I https://ai-check.andreguelmann.com/tool.html
```
Look for: `Content-Security-Policy: connect-src ...`

**Fix if found:**
- Add Vercel config file (`vercel.json`) with CSP allow list
- Or remove CSP entirely for testing

### 2. Vercel Edge Network Interference
**Likelihood:** MEDIUM
**Test:** Check if Vercel is proxying/modifying requests
**Evidence:** Other features work, only botProbe fails

**Potential Fix:**
- Add `/_headers` or `vercel.json` configuration
- Test on different domain (not Vercel)
- Deploy to GitHub Pages or Netlify for comparison

### 3. Browser Extension Blocking
**Likelihood:** LOW (tested in incognito)
**Test:** Already tested in incognito mode
**Result:** Still fails

### 4. HTTPS Mixed Content
**Likelihood:** LOW
**All endpoints are HTTPS:** ✅

### 5. JavaScript Error Breaking Fetch
**Likelihood:** MEDIUM
**Test:** Add extensive console.log debugging
**Check:** If error happens before fetch is called

**Debug Code to Add:**
```javascript
console.log('About to fetch:', CONFIG.PROXY_URL);
console.log('Request body:', { url, botKeys, action: 'botProbe' });

const response = await fetch(CONFIG.PROXY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url, botKeys, action: 'botProbe' }),
  signal: controller.signal
}).then(res => {
  console.log('Response received:', res.status, res.headers);
  return res;
}).catch(err => {
  console.error('Fetch failed:', err.name, err.message, err.stack);
  throw err;
});
```

### 6. Vercel Serverless Function Timeout
**Likelihood:** LOW
**Evidence:** curl works, so service is responding
**But:** Vercel may have different timeout for browser requests

### 7. CORS Headers Not Being Sent
**Likelihood:** LOW (verified with curl)
**Evidence:** curl shows correct headers
**But:** Browser may be getting different response

**Test:**
```javascript
// In browser console
fetch('https://crux-api-proxy-658532897815.us-central1.run.app', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/',
    botKeys: ['openai_gptbot'],
    action: 'botProbe'
  })
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
```

---

## Recommended Debug Steps

### Step 1: Check Vercel Configuration
```bash
# Check if vercel.json exists
ls -la vercel.json

# Check deployment logs
# Visit: https://vercel.com/aguelmann/ai-visibility-validator/deployments
```

### Step 2: Check Response Headers in Browser
1. Open DevTools → Network tab
2. Load: https://ai-check.andreguelmann.com/tool.html
3. Find the HTML document request
4. Check Response Headers for CSP or other blocking headers

### Step 3: Test Fetch Directly in Browser Console
```javascript
// Test 1: Simple fetch
fetch('https://crux-api-proxy-658532897815.us-central1.run.app')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);

// Test 2: With CORS
fetch('https://crux-api-proxy-658532897815.us-central1.run.app', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com/', action: 'botProbe', botKeys: ['openai_gptbot'] })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Step 4: Add Debug Logging to app.js
Add before line 685 in `fetchBotTtfb()`:
```javascript
console.log('=== BOT TTFB DEBUG START ===');
console.log('CONFIG.PROXY_URL:', CONFIG.PROXY_URL);
console.log('Batch:', batchIndex, 'of', batches.length);
console.log('Bot keys:', botKeys);
console.log('Target URL:', url);
console.log('Request body:', JSON.stringify({ url, botKeys, action: 'botProbe' }));
console.log('About to fetch...');
```

Add after line 692:
```javascript
console.log('Response status:', response.status);
console.log('Response headers:', [...response.headers.entries()]);
console.log('=== BOT TTFB DEBUG END ===');
```

### Step 5: Test Without Batching
Temporarily simplify to test if batching logic is causing issues:
```javascript
// Replace entire fetchBotTtfb with simple version
async function fetchBotTtfb(url) {
  try {
    const response = await fetch(CONFIG.PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        botKeys: ['openai_gptbot'],
        action: 'botProbe'
      })
    });
    const data = await response.json();
    console.log('SUCCESS:', data);
    return data.results;
  } catch (error) {
    console.error('FAILED:', error);
    return null;
  }
}
```

---

## Alternative Solutions to Consider

### Option A: Remove CORS Entirely (Testing Only)
Modify `cloud-function/index.js` to allow all origins:
```javascript
res.set('Access-Control-Allow-Origin', '*');
```

### Option B: Use JSONP Instead of Fetch
Old-school but bypasses CORS:
```javascript
function jsonp(url, callback) {
  const script = document.createElement('script');
  script.src = url + '&callback=' + callback;
  document.head.appendChild(script);
}
```

### Option C: Server-Side Rendering
Move entire bot probe logic to backend:
1. User submits URL to backend
2. Backend does all bot probing
3. Backend stores results
4. Frontend polls for results
5. No CORS issues at all

### Option D: Use Vercel Serverless Function
Instead of external Cloud Run:
1. Create `/api/bot-probe.js` in Vercel
2. Vercel function calls Cloud Run bot-ttfb-probe
3. Same domain, no CORS

---

## Files Changed in Latest Attempt

### Modified Files:
1. `cloud-function/index.js` - Added botProbe action (lines 28-71)
2. `app.js` - Changed fetch to use PROXY_URL instead of BOT_PROBE_URL (line 685)
3. `config.js` - Updated PROXY_URL to new deployment URL

### Git Commit:
```
commit bc503c7
Author: Andre
Date: Wed Jan 30 01:10:00 2026

Fix bot TTFB: Use server-side proxy to bypass CORS

- Modified cloud-function to handle botProbe action (server-to-server)
- Updated app.js to call proxy instead of bot probe service directly
- Updated config.js with new proxy URL after redeployment
- This completely bypasses browser CORS restrictions
```

### Deployed Services:
1. Cloud Run `crux-api-proxy`: https://crux-api-proxy-658532897815.us-central1.run.app
2. Cloud Run `bot-ttfb-probe`: https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app (unchanged)

---

## What Should Work But Doesn't

**Theory:** Since we're now calling PROXY_URL (same service that handles CrUX API and robots.txt successfully), and that service makes server-to-server calls to bot-ttfb-probe, there should be NO CORS issues whatsoever.

**Reality:** Still getting "Failed to fetch" and browser isn't sending requests.

**Conclusion:** There's something blocking fetch requests BEFORE they leave the browser. This is not a CORS issue on the server side.

---

## Next Steps for Developer

1. **Immediate:** Check for CSP headers in Vercel deployment
2. **Test:** Run fetch directly in browser console (see Step 3 above)
3. **Debug:** Add extensive logging to app.js (see Step 4 above)
4. **Compare:** Test same code on different hosting (not Vercel)
5. **Consider:** Implement Option D (Vercel serverless function) to eliminate external CORS entirely

---

## Contact & Resources

**GitHub Repo:** https://github.com/aguelmann/ai-visibility-validator
**Live Site:** https://ai-check.andreguelmann.com/tool.html
**Vercel Dashboard:** https://vercel.com/aguelmann/ai-visibility-validator

**Previous Documentation:**
- `IMPLEMENTATION_LOG.md` - Full technical implementation history
- `BOT_TTFB_FIX_GUIDE.md` - CORS + timeout fixes (by previous developer)

**GCP Project:** ai-visibility-validator
**Region:** us-central1

---

**END OF DEVELOPER HANDOFF DOCUMENT**
