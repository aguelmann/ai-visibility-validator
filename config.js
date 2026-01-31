// Configuration file for API endpoints
// Update PROXY_URL with your Cloud Function URL after deployment

const CONFIG = {
  // Replace this with your Cloud Function URL after deployment
  // Example: 'https://us-central1-your-project.cloudfunctions.net/crux-api-proxy'
  PROXY_URL: 'https://crux-api-proxy-658532897815.us-central1.run.app',

  // Same proxy URL used for robots.txt fetching (bypasses CORS)
  ROBOTS_PROXY_URL: 'https://crux-api-proxy-658532897815.us-central1.run.app',

  // Content visibility (JS on/off) analysis via Cloud Run
  // Example: 'https://content-visibility-xxxxx-uc.a.run.app'
  CONTENT_VISIBILITY_URL: 'https://content-visibility-658532897815.us-central1.run.app'
};
