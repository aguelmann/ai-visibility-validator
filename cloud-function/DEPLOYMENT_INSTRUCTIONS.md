# Cloud Function Deployment Instructions

## Prerequisites
1. Google Cloud account (free tier)
2. Google Cloud CLI installed (optional, can use web console)

## Deployment Steps

### Option A: Using Google Cloud Console (Easiest)

1. **Go to Cloud Functions**
   - Visit: https://console.cloud.google.com/functions
   - Enable Cloud Functions API if prompted

2. **Create Function**
   - Click "CREATE FUNCTION"
   - **Environment**: 2nd gen
   - **Function name**: `crux-api-proxy`
   - **Region**: Choose closest to your users (e.g., `us-central1`)

3. **Trigger Configuration**
   - **Trigger type**: HTTPS
   - **Authentication**: Allow unauthenticated invocations
   - Click "SAVE"

4. **Runtime Configuration** (optional but recommended)
   - **Memory**: 256 MB (sufficient)
   - **Timeout**: 60 seconds
   - **Maximum instances**: 10 (to control costs)

5. **Code**
   - **Runtime**: Node.js 20
   - **Entry point**: `getCruxData`
   - **Source code**: Inline editor
   - Copy the contents of `index.js` into the editor
   - Copy the contents of `package.json` into package.json tab

6. **Deploy**
   - Click "DEPLOY"
   - Wait 1-2 minutes for deployment
   - Once deployed, you'll see a green checkmark

7. **Get Your Function URL**
   - Click on the function name
   - Go to "TRIGGER" tab
   - Copy the URL (e.g., `https://us-central1-your-project.cloudfunctions.net/crux-api-proxy`)
   - **Save this URL** - you'll need it for the extension!

### Option B: Using gcloud CLI (Advanced)

1. **Install gcloud CLI**
   ```bash
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Login and Set Project**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Deploy Function**
   ```bash
   cd "G:/My Drive/Downloads/AI Validator/cloud-function"

   gcloud functions deploy crux-api-proxy \
     --gen2 \
     --runtime=nodejs20 \
     --region=us-central1 \
     --source=. \
     --entry-point=getCruxData \
     --trigger-http \
     --allow-unauthenticated \
     --memory=256MB \
     --timeout=60s \
     --max-instances=10
   ```

4. **Get Function URL**
   ```bash
   gcloud functions describe crux-api-proxy --gen2 --region=us-central1 --format="value(serviceConfig.uri)"
   ```

## Testing Your Function

Once deployed, test it with curl:

```bash
curl -X POST https://YOUR-FUNCTION-URL \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.google.com",
    "formFactor": "DESKTOP",
    "metrics": ["experimental_time_to_first_byte", "cumulative_layout_shift", "interaction_to_next_paint"]
  }'
```

You should receive CrUX data in response!

## Next Steps

After deployment:
1. Copy your function URL
2. Update the extension's `config.js` with your function URL:
   ```javascript
   const CONFIG = {
     PROXY_URL: 'https://us-central1-your-project.cloudfunctions.net/crux-api-proxy'
   };
   ```
3. Reload the extension in Chrome (`chrome://extensions/` → reload button)
4. Test the extension by visiting any website and clicking the extension icon
5. If successful, package and submit to Chrome Web Store

## Cost Monitoring

- Free tier: 2 million invocations/month
- Monitor usage at: https://console.cloud.google.com/functions/usage
- Set up budget alerts: https://console.cloud.google.com/billing/budgets

## Troubleshooting

**Function not responding:**
- Check Cloud Functions logs: https://console.cloud.google.com/logs
- Verify function is deployed successfully
- Test with curl command above

**CORS errors:**
- Ensure headers are set correctly in index.js
- Check browser console for specific error

**API quota exceeded:**
- Check CrUX API quotas: https://console.cloud.google.com/apis/api/chromeuxreport.googleapis.com/quotas
- Default is 25,000 requests/day (more than enough)
