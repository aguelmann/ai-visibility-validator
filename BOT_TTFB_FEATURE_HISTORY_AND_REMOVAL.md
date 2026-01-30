# Bot TTFB Emulator – History & Removal Log

**Date compiled:** January 30, 2026  
**Scope:** Everything done since the Bot TTFB emulator request, plus full removal from the web tool.

---

## 1) What was implemented (chronological summary)

### Phase A – Initial Bot TTFB feature (Codex)
- Added a **Cloud Run service** (`cloud-run-bot-probe/`) to simulate AI bot user agents and measure TTFB.
- Added **frontend UI** in the TTFB tab to show simulated bot results.
- Added **PDF export** to include bot TTFB results.
- Added **retry button** and **last-updated timestamp** for bot probes.
- Added **config** entry `BOT_PROBE_URL` in `config.js`.

### Phase B – Reliability & CORS attempts (Codex)
- Added explicit `OPTIONS` handlers to Cloud Run bot‑probe for preflight.
- Replaced `AbortSignal.timeout()` with `AbortController` in `fetchBotTtfb()`.
- Added documentation guides:
  - `BOT_TTFB_FIX_GUIDE.md`
  - `BOT_TTFB_PROXY_URL_FIX.md`

### Phase C – Developer changes (per handoff + notes)
- Moved bot probing through **proxy** (`crux-api-proxy`), via `action: "botProbe"`.
- Added `botProbe` handler inside `cloud-function/index.js`.
- Batched 8 bots into 4 batches of 2 for reliability.
- Increased bot‑probe timeouts from 5s → 15s.
- Redeployed Cloud Run services with new URLs.
- Reported successful `curl` tests to both bot‑probe and proxy.

---

## 2) Observed issues (from logs + console)

- Browser console showed:
  - 503 responses from proxy:
    ```
    POST https://crux-api-proxy-... 503
    {"error":"Bot probe failed","status":503,"details":"Service Unavailable"}
    ```
- This indicated **proxy reached**, but **bot‑probe returned 503**.
- Multiple iterations did **not** stabilize production behavior.

---

## 3) Current removal decision

Given instability, the Bot TTFB emulator feature is removed entirely from the **web tool**.

This includes:
- Frontend UI (TTFB tab section)
- JS logic (batching, fetch, rendering, retry)
- PDF inclusion
- Config entries
- Proxy handler
- Cloud Run bot‑probe service source

---

## 4) Removal changes applied (Codex)

### Frontend
- Removed “Simulated Bot TTFB” section from `tool.html`.
- Removed all bot‑probe styling from `styles.css`.
- Removed bot‑probe logic from `app.js`:
  - `BOT_TTFB_PROFILES`
  - `fetchBotTtfb`, `renderBotTtfbResults`, `renderBotTtfbLoading`
  - retry handler + timestamp
  - bot TTFB PDF section
  - bot TTFB state (`lastBotTtfbData`)
- Removed `BOT_PROBE_URL` from `config.js`.

### Backend
- Removed `action: "botProbe"` handler from `cloud-function/index.js`.
- Deleted Cloud Run bot‑probe source:
  - `cloud-run-bot-probe/index.js`
  - `cloud-run-bot-probe/package.json`
  - `cloud-run-bot-probe/README.md`

---

## 5) Files changed in removal

- `tool.html`  
- `styles.css`  
- `app.js`  
- `config.js`  
- `cloud-function/index.js`  
- Deleted: `cloud-run-bot-probe/*`

---

## 6) Notes / open items

- Existing Cloud Run services might still be deployed in GCP.  
  If you want to fully decommission:
  - Delete Cloud Run service `bot-ttfb-probe`.
  - Remove any environment variables referencing bot probe URLs.

- Older documentation files remain in repo for historical reference:
  - `IMPLEMENTATION_LOG.md`
  - `BOT_TTFB_FIX_GUIDE.md`
  - `BOT_TTFB_PROXY_URL_FIX.md`

---

## 7) Suggested final verification (post-removal)

1) Deploy web tool (Vercel).
2) Run tool normally:
   - CrUX metrics should work
   - Crawlability should work
   - PDF export should work
3) Confirm no bot TTFB UI remains in TTFB tab.

---

If you want the bot emulator re‑introduced later, we can rebuild it with a new architecture (queue + async jobs + results polling), which avoids browser timeouts and Cloud Run cold‑start issues.
