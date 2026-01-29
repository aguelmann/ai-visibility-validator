# Bot TTFB Probe (Cloud Run)

This service measures simulated bot TTFB for a URL using bot User-Agent strings.

## Deploy (Cloud Run, source deploy)

From `cloud-run-bot-probe/`:

1) Authenticate and set project:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```

2) Deploy:
   ```bash
   gcloud run deploy bot-ttfb-probe \
     --source . \
     --region us-central1 \
     --allow-unauthenticated
   ```

3) Copy the service URL and set it in `config.js` as `BOT_PROBE_URL`.

## Endpoint

POST `/probe`

Request body:
```json
{
  "url": "https://example.com",
  "botKeys": ["openai_gptbot", "anthropic_claudebot"]
}
```

Response:
```json
{
  "success": true,
  "url": "https://example.com/",
  "generatedAt": "2026-01-29T12:00:00.000Z",
  "results": [
    {
      "botKey": "openai_gptbot",
      "company": "OpenAI",
      "label": "GPTBot",
      "ttfbMs": 123,
      "status": 200,
      "finalUrl": "https://example.com/",
      "redirects": 0,
      "cached": false
    }
  ]
}
```

## Notes
- Caches results in memory for 5 minutes (per instance).
- Follows redirects up to 5.
- Measures TTFB to first response chunk.
