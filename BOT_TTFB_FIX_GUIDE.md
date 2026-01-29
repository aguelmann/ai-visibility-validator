# Bot TTFB Fix Guide (CORS + Timeout)

This guide explains how to deploy and test the fixes for the “Failed to fetch” errors on the Bot TTFB feature.

## What Changed

1) **Cloud Run (CORS preflight)**
   - Added explicit OPTIONS handlers (`/probe` and `*`) to ensure preflight returns **204**.

2) **Frontend (fetch timeout compatibility)**
   - Replaced `AbortSignal.timeout()` with `AbortController`, which works across all major browsers.

These changes do **not** affect the Chrome Extension.

---

## 1) Deploy the Cloud Run Fix

From the project root:

```bash
cd "cloud-run-bot-probe"

gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

gcloud run deploy bot-ttfb-probe \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Confirm the service URL still matches `BOT_PROBE_URL` in `config.js`.

---

## 2) Deploy the Frontend Fix

Commit and push the updated `app.js` to your repo (Vercel auto-deploy):

```bash
git add app.js
git commit -m "Fix bot TTFB fetch timeout (AbortController)"
git push origin main
```

---

## 3) Verify CORS Preflight (Critical)

Run this from your terminal:

```bash
curl -i -X OPTIONS https://bot-ttfb-probe-tbohkm5aaq-uc.a.run.app/probe \
  -H "Origin: https://ai-check.andreguelmann.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

Expected:
- `HTTP/1.1 204 No Content`
- `Access-Control-Allow-Origin: https://ai-check.andreguelmann.com`
- `Access-Control-Allow-Methods: POST, OPTIONS`

If you still get 404:
- The Cloud Run service was not redeployed correctly (likely old revision).

---

## 4) Verify Browser Fetch

Open: https://ai-check.andreguelmann.com/tool.html

1) Enter a URL and click **Analyze**.
2) Go to **TTFB** tab.
3) The “Simulated Bot TTFB” table should populate.

If it fails:
- Open DevTools → **Network** tab → filter for `probe`.
- Confirm the request succeeds (200) and the response has CORS headers.

---

## 5) Common Failure Causes

**A) Preflight still 404**
- Cloud Run service is running an older revision.
- Re-deploy and verify the latest revision is active.

**B) “Failed to fetch” only on Safari**
- This was caused by `AbortSignal.timeout()` and should be fixed now.

**C) Some sites return errors**
- Some sites block bot UAs (403/429). This is expected.

---

## 6) Files Updated (for reference)

- `cloud-run-bot-probe/index.js`
  - Explicit `OPTIONS` handlers
- `app.js`
  - Replaced `AbortSignal.timeout()` with `AbortController`

---

## 7) Quick Success Checklist

- [ ] OPTIONS `/probe` returns **204**
- [ ] Browser Network shows successful POST `/probe`
- [ ] Bot results populate in the TTFB tab
- [ ] No “Failed to fetch” errors in console

---

If you want, I can also add debug logging or additional retries for bot batches.
