# AI Validator - Web App Conversion Guide

## Project Overview

Convert the Chrome Extension "AI & LLM Visibility Validator" into a standalone web app where users can paste a URL and get CrUX performance metrics.

## Recommended Architecture (Option 1 - Simplest)

**Frontend**: Static HTML/CSS/JS (keep existing code structure)
**Backend**: Existing Google Cloud Function (already deployed)
**Hosting**: Vercel or Netlify (free tier)

## Required Changes

### 1. Remove Chrome Extension Dependencies

**File: index.html (rename from popup.html)**
- Keep all existing HTML structure
- No changes needed to the HTML itself

**File: app.js (rename from popup.js)**

Remove/Replace this section (lines 412-414):
```javascript
// OLD - Extension version:
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const currentUrl = tab.url;
```

Replace with:
```javascript
// NEW - Web app version:
const urlInput = document.getElementById('url-input');
const currentUrl = urlInput.value.trim();

// Validate URL
if (!currentUrl) {
  showError('Please enter a URL');
  return;
}

try {
  new URL(currentUrl); // Validate URL format
} catch (error) {
  showError('Please enter a valid URL (e.g., https://example.com)');
  return;
}
```

**File: manifest.json**
- Delete this file (not needed for web app)

### 2. Add URL Input Field to HTML

Add this section right after the header (after line 60 in popup.html):

```html
<!-- URL Input Section -->
<div class="url-input-section">
  <label for="url-input">Enter Website URL:</label>
  <div class="url-input-wrapper">
    <input
      type="url"
      id="url-input"
      placeholder="https://example.com"
      required
      pattern="https?://.+"
    />
    <button id="check-button" class="check-button">Analyze</button>
  </div>
  <p class="url-hint">Enter the full URL including https://</p>
</div>
```

### 3. Update Event Listeners

**In app.js**, replace the DOMContentLoaded section (lines 453-457):

```javascript
// OLD:
document.addEventListener('DOMContentLoaded', () => {
  setupTabSwitching();
  // Auto-run check when extension opens
  checkAIVisibility();
});
```

Replace with:
```javascript
// NEW:
document.addEventListener('DOMContentLoaded', () => {
  setupTabSwitching();

  const checkButton = document.getElementById('check-button');
  const urlInput = document.getElementById('url-input');

  // Check on button click
  checkButton.addEventListener('click', checkAIVisibility);

  // Check on Enter key
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkAIVisibility();
    }
  });
});
```

### 4. Add CSS for URL Input

**File: styles.css**

Add these styles:
```css
.url-input-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.url-input-section label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a202c;
}

.url-input-wrapper {
  display: flex;
  gap: 12px;
}

#url-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Lato', sans-serif;
  transition: border-color 0.2s;
}

#url-input:focus {
  outline: none;
  border-color: #25995c;
}

#url-input:invalid {
  border-color: #f44336;
}

.check-button {
  padding: 12px 24px;
  background: #25995c;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  transition: background 0.2s;
}

.check-button:hover {
  background: #1e7a49;
}

.check-button:active {
  transform: scale(0.98);
}

.url-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #718096;
}
```

### 5. Update config.js

Make sure your Cloud Function URL is configured:
```javascript
const CONFIG = {
  PROXY_URL: 'https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/getCruxData'
};
```

## File Structure for Web App

```
ai-validator-webapp/
├── index.html          (renamed from popup.html)
├── app.js              (renamed from popup.js)
├── styles.css          (keep existing)
├── config.js           (keep existing)
├── icons/              (keep existing)
├── Eu.webp            (keep existing)
└── README.md          (optional)
```

Files to DELETE:
- manifest.json (Chrome extension specific)

Folder to IGNORE:
- cloud-function/ (already deployed, not needed in web app)

## Backend - Google Cloud Function

Your Cloud Function is already deployed and working. Current configuration:

**File: cloud-function/index.js**
- API Key: AIzaSyCF2TCPZ60Izuy3_OcPdoZSeAfmgaQEKXE
- Endpoint: getCruxData
- CORS: Enabled for all origins (*)

### Important Security Updates

1. **Add Rate Limiting** (recommended):
```javascript
// Add at top of cloud-function/index.js
const rateLimit = new Map();

// In getCruxData function, before processing:
const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
const now = Date.now();
const userRequests = rateLimit.get(clientIp) || [];

// Keep only requests from last minute
const recentRequests = userRequests.filter(time => now - time < 60000);

if (recentRequests.length >= 10) {
  res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  return;
}

recentRequests.push(now);
rateLimit.set(clientIp, recentRequests);
```

2. **Restrict API Key** (Google Cloud Console):
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Edit your API key
   - Under "API restrictions": Select "Restrict key" > Choose "Chrome UX Report API"
   - Under "Website restrictions": Add your web app domain when deployed

3. **Update CORS** (optional - restrict after deployment):
```javascript
// Change line 8 in cloud-function/index.js:
res.set('Access-Control-Allow-Origin', 'https://yourdomain.com');
```

## Deployment Instructions

### Option A: Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Prepare your project**:
   - Create new folder with renamed files
   - Delete manifest.json
   - Make sure config.js has correct PROXY_URL

3. **Deploy**:
   ```bash
   cd your-webapp-folder
   vercel
   ```

4. **Follow prompts**:
   - Login to Vercel
   - Set up new project
   - Deploy

5. **Custom domain** (optional):
   - Go to Vercel dashboard
   - Project Settings > Domains
   - Add your domain

**Vercel Configuration** (create `vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Option B: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   cd your-webapp-folder
   netlify deploy
   ```

3. **Follow prompts** and confirm production deployment

**Netlify Configuration** (create `netlify.toml`):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### Option C: Cloudflare Pages

1. **Create Cloudflare account** at pages.cloudflare.com

2. **Connect Git repository** or **Direct Upload**:
   - Drag and drop your folder
   - Or connect GitHub/GitLab repo

3. **Deploy** - automatic

4. **Custom domain**: Settings > Custom domains

### Option D: GitHub Pages (Free)

1. **Create GitHub repository**

2. **Push your code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/repo.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Repository Settings > Pages
   - Source: main branch
   - Folder: / (root)
   - Save

4. **Access at**: `https://yourusername.github.io/repo/`

## Testing Checklist

Before going live:

- [ ] URL input accepts valid URLs
- [ ] URL validation shows errors for invalid URLs
- [ ] "Analyze" button triggers check
- [ ] Enter key triggers check
- [ ] Loading state appears during API calls
- [ ] Results display correctly for pages with data
- [ ] Error messages show for pages without CrUX data
- [ ] Tab navigation works
- [ ] Metric cards are clickable and switch tabs
- [ ] All links work (Get Help, footer links)
- [ ] Mobile responsive (test on phone)
- [ ] Works in multiple browsers (Chrome, Firefox, Safari)

## SEO & Meta Tags

Add to `<head>` section of index.html:

```html
<meta name="description" content="Check if your website is fast enough for AI search engines. Validate your site's TTFB, CLS, and INP metrics for AI visibility.">
<meta name="keywords" content="AI visibility, GEO, Generative Engine Optimization, CrUX, Core Web Vitals, TTFB, AI SEO">

<!-- Open Graph -->
<meta property="og:title" content="AI & LLM Visibility Validator">
<meta property="og:description" content="Check if your website is fast enough for AI search engines">
<meta property="og:type" content="website">
<meta property="og:url" content="https://yourdomain.com">
<meta property="og:image" content="https://yourdomain.com/icons/icon128.png">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="AI & LLM Visibility Validator">
<meta name="twitter:description" content="Check if your website is fast enough for AI search engines">
<meta name="twitter:image" content="https://yourdomain.com/icons/icon128.png">
```

## Analytics (Optional)

Add Google Analytics or Plausible:

**Google Analytics** (add before `</head>`):
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## Cost Estimate

**Free Tier (Recommended for starting)**:
- Frontend Hosting: Free (Vercel/Netlify/Cloudflare Pages)
- Google Cloud Function: Free (2M invocations/month)
- Chrome UX Report API: Free
- **Total: $0/month** for small to medium traffic

**If you exceed free tier**:
- Cloud Functions: ~$0.40 per 1M invocations
- Bandwidth: ~$0.12 per GB

Typical traffic: 10,000 checks/month = Free

## Future Enhancements

Ideas for v2:
- Save reports / history
- Compare multiple URLs
- Export as PDF
- Mobile device metrics (add PHONE formFactor)
- Batch URL checking
- WordPress plugin version
- API for developers

## Support & Maintenance

**Monitor**:
- Google Cloud Console: Function errors and usage
- Hosting platform: Bandwidth and uptime
- Google API quota: Stay within limits

**Updates**:
- Keep API key secure
- Monitor for CrUX API changes
- Update thresholds as AI search evolves

## Quick Start Checklist

1. [ ] Create new folder for web app
2. [ ] Copy files (rename popup.html → index.html, popup.js → app.js)
3. [ ] Delete manifest.json
4. [ ] Add URL input field to HTML
5. [ ] Update app.js to remove chrome.tabs.query
6. [ ] Add URL input CSS
7. [ ] Update event listeners
8. [ ] Test locally (open index.html in browser)
9. [ ] Deploy to Vercel/Netlify
10. [ ] Test production URL
11. [ ] Add custom domain (optional)
12. [ ] Update Cloud Function CORS to restrict to your domain

## Resources

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Chrome UX Report: https://developer.chrome.com/docs/crux
- Google Cloud Functions: https://cloud.google.com/functions/docs

---

## Need Help?

If you run into issues:
1. Check browser console for errors
2. Verify config.js has correct Cloud Function URL
3. Test Cloud Function directly with Postman/curl
4. Check CORS settings if getting cross-origin errors
5. Verify API key restrictions in Google Cloud Console

Good luck with your deployment!
