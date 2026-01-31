# JS Visibility Strict Mode – Deployment Guide

## Summary
This change enables **strict mode** on the Cloud Run service so that the **HTML snapshot fallback is skipped**.
If live DOM extraction fails *and* fast DOM extraction fails, the service now returns an **empty analysis + warning**
instead of potentially misleading counts.

This prevents inflated/deflated JS‑off counts on sites with buggy CMS or heavy client‑side behavior.

## What changed
### File: `cloud-run-content-visibility/index.js`
- Added `STRICT_MODE` (default: `true`)
- If both DOM extraction methods fail:
  - Return empty analysis
  - Add warning: `Strict mode enabled; HTML snapshot fallback skipped.`

## Behavior after this change
- **Best case:** Live DOM extraction works → accurate results (no change).
- **Fallback case:** Live DOM fails → fast DOM extraction runs (still accurate, uses computed styles).
- **Worst case:** Both DOM methods fail → **no JS‑off data** (empty analysis), rather than wrong data.

## Deployment steps
From `cloud-run-content-visibility/`:
1) Deploy Cloud Run:
   - `gcloud run deploy content-visibility --region us-central1 --source . --allow-unauthenticated --memory 1Gi --timeout 60`
2) Optional override:
   - Set `STRICT_MODE=false` if you ever want to re-enable HTML fallback.

## Validation
1) Test the problematic URLs with a cache‑buster:
   - `https://accessibe.com/accesswidget?cv_debug=1&cvb=2`
   - `https://www.lovedby.ai/?cv_debug=1&cvb=2`
2) Check:
   - If DOM extraction succeeds → normal counts.
   - If both DOM methods fail → JS‑off data should show “no data” (not inflated).
