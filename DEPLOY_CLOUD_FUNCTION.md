# Deploy Cloud Function Update

The cloud function has been updated to support robots.txt fetching. Follow these steps to deploy the update:

## Prerequisites

- Google Cloud SDK installed (`gcloud` command)
- GCP project with Cloud Functions enabled
- Authentication set up (`gcloud auth login`)

## Deployment Steps

### 1. Navigate to cloud-function directory

```bash
cd "G:\My Drive\Downloads\AI Validator Tool\cloud-function"
```

### 2. Deploy the updated function

```bash
gcloud functions deploy crux-api-proxy \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --entry-point getCruxData
```

### 3. Verify deployment

After deployment completes, test the robots.txt endpoint:

```bash
curl -X POST https://crux-api-proxy-tbohkm5aaq-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{"action": "fetchRobotsTxt", "url": "https://google.com/robots.txt"}'
```

You should see a response with `"success": true` and the robots.txt content.

## What's New

The updated cloud function now handles two types of requests:

1. **CrUX API requests** (existing functionality)
   - Queries Chrome UX Report for performance metrics
   - No changes to existing behavior

2. **Robots.txt fetching** (new functionality)
   - Bypasses CORS restrictions
   - Fetches robots.txt files from any domain
   - Used by the Crawlability tab

## Troubleshooting

If deployment fails:

1. Check you're authenticated: `gcloud auth list`
2. Verify project is set: `gcloud config get-value project`
3. Check quota limits: `gcloud functions describe crux-api-proxy --region us-central1`

## Testing Locally

Before deploying, test locally:

```bash
cd cloud-function
npm install
npm start
```

Then in another terminal:

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"action": "fetchRobotsTxt", "url": "https://google.com/robots.txt"}'
```

## Notes

- The function URL in `config.js` is already set to the production endpoint
- No changes needed to `config.js` unless you deploy to a different region/project
- The same function handles both CrUX and robots.txt requests
