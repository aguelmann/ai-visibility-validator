# JS Content Visibility Feature – Implementation Summary, Recommendations, Next Steps

## Overview
This feature compares what text is visible on a page **with JavaScript enabled vs. disabled** (a proxy for what most LLM bots can see). It adds:
- A **Content** tab in the tool UI with a summary + “lost/gained” text lists.
- A **Cloud Run** service that runs a headless browser (Playwright) to fetch and compare both versions.
- A **PDF export** section with a compact summary + top lost/gained snippets.

## What was implemented
### 1) New Cloud Run service (Playwright)
Folder: `cloud-run-content-visibility/`
- `index.js`: Express API with `/analyze` endpoint
  - Loads URL twice (JS enabled + JS disabled)
  - Extracts visible text nodes, counts words
  - Compares lists and returns:
    - `summary` (enabledWords, disabledWords, difference, hiddenPercent)
    - `diff` (lostContent, gainedContent – top 20 by word count)
  - CORS allowlist for tool domain(s)
  - 10‑minute in‑memory cache
  - Timeouts: 20s navigation + 2s post-load wait
  - Stabilization + fallback:
    - Waits for quiet navigation window before extracting
    - Retries DOM extraction on transient navigation errors
    - Falls back to HTML snapshot parsing when live DOM evaluation fails
    - Returns `warnings` + `requestId` for debugging instead of failing hard
- `package.json`: `express` + `playwright` + `cheerio` (HTML fallback parsing)
- `Dockerfile`: Playwright base image
- `README.md`: basic deploy notes

### 2) Frontend UI
Files: `tool.html`, `styles.css`, `app.js`
- **New tab**: “Content”
  - Summary cards (JS enabled words, JS disabled words, difference, hidden %)
  - Two columns for “Lost with JS off” and “Gained with JS off”
- **App logic**
  - `fetchContentVisibility(url)` calls Cloud Run `/analyze`
  - `renderContentVisibilityResults(data)` renders summary + lists
  - Loading/error handling and clearing states
  - Results stored in `lastReportData.contentVisibility`

### 3) PDF Export update
File: `app.js`
- Adds a **Content Visibility (JS On vs Off)** section in `generatePdfReport`
- Includes summary and the **top 2 lost + top 2 gained** items
- Truncates long snippets to keep PDF to one page in most cases

### 4) Landing page tweaks (requested last)
Files: `index.html`, `landing.css`
- Removed top-right green CTA
- Added mobile hamburger menu so name + links still show on mobile

## Files changed/added
- Added: `cloud-run-content-visibility/index.js`
- Added: `cloud-run-content-visibility/package.json`
- Added: `cloud-run-content-visibility/Dockerfile`
- Added: `cloud-run-content-visibility/README.md`
- Updated: `config.js` (new `CONTENT_VISIBILITY_URL` placeholder)
- Updated: `tool.html` (new Content tab and layout)
- Updated: `styles.css` (content visibility styles)
- Updated: `app.js` (API call + rendering + PDF export section)
- Updated: `index.html`, `landing.css` (mobile nav + CTA removal)

## Deployment steps (Cloud Run)
From `cloud-run-content-visibility/`:
1) **Authenticate / set project**
   - `gcloud auth login`
   - `gcloud config set project YOUR_PROJECT_ID`
2) **Deploy**
   - `gcloud run deploy content-visibility`
     - `--region us-central1`
     - `--source .`
     - `--allow-unauthenticated`
     - `--memory 1Gi`
     - `--timeout 60`
3) **Copy the service URL**
4) **Update config**
   - In `config.js`, set:
     - `CONTENT_VISIBILITY_URL = "https://<your-cloud-run-url>"`

## Testing checklist
1) **Direct API test**
   - `curl -X POST https://<cloud-run-url>/analyze -H "Content-Type: application/json" -d "{\"url\":\"https://example.com\"}"`
   - Expect: `{ success: true, summary: { ... }, diff: { lostContent: [...], gainedContent: [...] } }`
2) **Tool UI**
   - Go to `tool.html?url=https://example.com`
   - Verify Content tab shows summary + lost/gained lists
3) **PDF**
   - Generate PDF
   - Confirm Content Visibility section appears and stays on one page

## Recommendations
- **Timeouts**: If slow sites fail, increase `NAV_TIMEOUT_MS` or `WAIT_AFTER_LOAD_MS` in `cloud-run-content-visibility/index.js`.
- **Performance**: Consider lowering `MAX_ELEMENTS` or `MAX_LIST_ITEMS` if memory/time is high.
- **Caching**: 10‑minute in‑memory cache is fine for initial launch; consider external caching (e.g., Redis) if scaling.
- **Error messaging**: If API fails, surface friendly errors in UI and PDF (currently “data unavailable”).
- **Security**: If needed, restrict CORS to only your production domain(s).

## Next steps
1) Deploy the Cloud Run service and update `config.js`
2) Smoke test in staging / production
3) Optional: add a small “data freshness” timestamp in UI
4) Optional: add paging/expand for lost/gained lists in UI
5) Monitor Cloud Run logs for timeouts or blocked sites
