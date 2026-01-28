// Configuration file for API endpoints
// Update PROXY_URL with your Cloud Function URL after deployment

const CONFIG = {
  // Replace this with your Cloud Function URL after deployment
  // Example: 'https://us-central1-your-project.cloudfunctions.net/crux-api-proxy'
  PROXY_URL: 'https://crux-api-proxy-tbohkm5aaq-uc.a.run.app',

  // Same proxy URL used for robots.txt fetching (bypasses CORS)
  ROBOTS_PROXY_URL: 'https://crux-api-proxy-tbohkm5aaq-uc.a.run.app'
};

