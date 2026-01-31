# JS Visibility Fallback Fix – Deployment Notes

## Summary
This patch fixes inflated JS‑off word counts that can occur when the **HTML fallback** parser is used (i.e., when live DOM extraction fails). The fix excludes text that is **hidden** via common accessibility patterns or inline styles.

This change **does not affect** the primary Playwright DOM extraction path; it only runs on the fallback path.

## What changed
### File: `cloud-run-content-visibility/index.js`
In the HTML fallback parser, **ignore text nodes** whose parent or ancestor has:
- `hidden` attribute
- `aria-hidden="true"`
- inline `display:none` or `visibility:hidden`
- common hidden classes (e.g., `sr-only`, `visually-hidden`, `hidden`, `screen-reader`, etc.)

### File: `cloud-run-content-visibility/package.json`
- Added `cheerio` dependency (required by fallback parsing)

## Why this matters
Some sites (example: `https://accessibe.com/accesswidget`) inject accessibility markup or hidden text that shows up in the raw HTML snapshot. The previous fallback counted this as visible content, causing **inflated JS‑off word counts** and misleading “lost/gained” lists.

## Deployment
From `cloud-run-content-visibility/`:
1) Deploy Cloud Run:
   - `gcloud run deploy content-visibility --region us-central1 --source . --allow-unauthenticated --memory 1Gi --timeout 60`
2) Confirm the service URL:
   - If it changed, update `CONTENT_VISIBILITY_URL` in `config.js`

## Validation
1) Run the tool against `https://accessibe.com/accesswidget`
2) Verify:
   - JS‑off word count is not drastically higher than JS‑on
   - Hidden % is reasonable
   - Lost/gained lists are coherent

## Optional next step (if still inconsistent)
Enable **strict mode** to skip fallback entirely and return a warning instead of possibly inaccurate fallback results.
