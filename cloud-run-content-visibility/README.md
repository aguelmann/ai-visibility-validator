# Content Visibility (JS On/Off) - Cloud Run

This service loads a URL twice (JS enabled + JS disabled) and returns a summary plus lost/gained content snippets.

## Deploy (Cloud Run)

From `cloud-run-content-visibility/`:

```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

gcloud run deploy content-visibility \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 60s
```

## Endpoint

POST `/analyze`

Request:
```json
{ "url": "https://example.com" }
```

Response:
```json
{
  "success": true,
  "url": "https://example.com/",
  "generatedAt": "2026-01-30T12:00:00.000Z",
  "cached": false,
  "summary": {
    "enabledWords": 1200,
    "disabledWords": 450,
    "difference": -750,
    "hiddenPercent": 62.5
  },
  "diff": {
    "lostContent": [ { "text": "...", "wordCount": 120 } ],
    "gainedContent": [ { "text": "...", "wordCount": 40 } ]
  }
}
```

Notes:
- Cache TTL is 10 minutes (per instance).
- Uses Playwright (Chromium) with JS enabled and disabled.
