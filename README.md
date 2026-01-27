# AI & LLM Visibility Validator

A Chrome Extension that helps website owners check if their pages are fast enough to be visible to AI search engines and Large Language Models (LLMs).

## What It Does

This extension measures your website's **Time to First Byte (TTFB)** using real-world data from Chrome UX Report and tells you whether AI bots like ChatGPT, Perplexity, and other RAG systems can actually access your content before timing out.

### Key Features

- **Instant TTFB Analysis**: Check both individual pages and entire website performance
- **AI Visibility Scoring**: Get a clear grade (A+ to F) based on AI accessibility
- **Educational Insights**: Learn why speed matters for AI visibility
- **Real User Data**: Powered by Chrome UX Report (CrUX) - real performance data from actual Chrome users

## Why TTFB Matters for AI

Unlike traditional SEO where slow sites just rank lower, **AI search treats slow sites as if they don't exist**. RAG orchestrators (like Perplexity and ChatGPT) run a "race" between sources and often only process the first 3-5 that respond. If your TTFB is 800ms and your competitor's is 100ms, you functionally don't exist to the AI.

## Installation

### Step 1: Deploy Cloud Function (Required)

This extension uses a secure backend proxy to protect API credentials. You must deploy a Cloud Function first:

1. Navigate to the `cloud-function` folder
2. Follow the instructions in `DEPLOYMENT_INSTRUCTIONS.md`
3. Copy your deployed function URL
4. Update `config.js` in the main folder with your function URL:
   ```javascript
   const CONFIG = {
     PROXY_URL: 'https://your-function-url-here'
   };
   ```

### Step 2: Create Icons

Before loading the extension, you need to create three icon files:

1. Navigate to the `icons` folder
2. Create three PNG images:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)
3. Use your brand color (#25995c green) and consider incorporating speed/AI/validation imagery

### Step 3: Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked"
4. Select the `AI Validator` folder (this folder)
5. The extension icon should appear in your Chrome toolbar

### Step 4: Use the Extension

1. Navigate to any website you want to check
2. Click the extension icon in your toolbar
3. The analysis runs automatically - no button needed!
4. View results across multiple tabs (Overview, TTFB, CLS, INP)

## What the Grades Mean

- **A+ (Ideal)**: < 200ms - Guaranteed inclusion in AI results
- **A (Competitive)**: 200-350ms - High visibility, competitive advantage
- **B (Target)**: 350-600ms - Optimal access, full crawler access
- **C (Needs Improvement)**: 600-1000ms - At risk of losing the "race"
- **D (At Risk)**: 1000-2000ms - High probability of timeouts
- **F (Poor/Invisible)**: > 2000ms - Effectively invisible to AI

## TTFB Categories Explained

### Ideal (< 200ms)
**Guaranteed Inclusion**
The "gold standard" for AI access. At this speed, edge caching allows your site to win "race conditions" against slower competitors.

### Competitive (200-350ms)
**High Visibility**
The average TTFB for top-ranking sites in AI search results. Sites in this range are reliably indexed and cited.

### Target (< 600ms)
**Optimal Access**
The recommended threshold for full AI crawler access. Case studies show 73% increases in indexed pages.

### Needs Improvement (600-1000ms)
**Competitive Disadvantage**
You're at risk of losing the "race logic." RAG systems prioritize faster responders.

### At Risk (1000-2000ms)
**The "Timeout Wall"**
Many RAG systems impose hard timeouts between 1-2 seconds. High probability of connection resets.

### Poor (> 2000ms)
**Guaranteed Exclusion**
Effectively invisible. AI platforms abandon requests that don't respond within 1-5 seconds.

## Technical Details

- **API**: Chrome UX Report (CrUX) API
- **Metric**: TTFB at 75th percentile (p75) for Desktop
- **Data Source**: Real user measurements from Chrome browsers
- **Form Factor**: Desktop (most AI crawlers behave like desktop browsers)

## Troubleshooting

### "No CrUX data available"

This means:
- The site doesn't have enough traffic to be in CrUX (needs minimum threshold of Chrome users)
- The specific page hasn't been visited enough (check the website-level result instead)
- The domain is very new

### Cloud Function Configuration

If you see an error about "Cloud Function URL not configured":
1. Make sure you've deployed the Cloud Function (see `cloud-function/DEPLOYMENT_INSTRUCTIONS.md`)
2. Update `config.js` with your deployed function URL
3. Reload the extension in `chrome://extensions/`

## How to Improve Your TTFB

To reach the "Ideal" range (< 200ms), implement:

1. **Edge Caching**: Use a CDN with `stale-while-revalidate` directive
2. **Server Optimization**: Upgrade to faster hosting or optimize your backend
3. **Database Performance**: Cache database queries and optimize indexes
4. **Reduce Server Processing**: Minimize logic before sending first byte

Need expert help? Visit [andreguelmann.com](https://www.andreguelmann.com/)

## Project Structure

```
AI Validator/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Main logic and API integration
├── styles.css            # Styling (matches andreguelmann.com brand)
├── config.js             # Cloud Function URL configuration
├── Eu.webp               # Profile picture for Get Help section
├── cloud-function/       # Backend proxy (deploy to Google Cloud)
│   ├── index.js          # Cloud Function code
│   ├── package.json      # Node.js dependencies
│   └── DEPLOYMENT_INSTRUCTIONS.md
├── icons/                # Extension icons (you need to create these)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## Privacy

This extension:
- Only accesses the current tab's URL when the extension is opened
- Sends the URL to a secure Cloud Function proxy, which queries Google's CrUX API
- Does not collect, store, or transmit any personal information
- Does not track your browsing history
- All API calls are proxied through your own Google Cloud Function for security

## Credits

- **Concept & Development**: Andre Guelmann
- **Data Source**: Chrome UX Report (CrUX)
- **TTFB Research**: Based on web.dev recommendations and RAG orchestrator behavior studies

## License

Copyright 2025 Andre Guelmann. All rights reserved.

## Support

For questions or assistance improving your website's AI visibility, visit:
**[andreguelmann.com](https://www.andreguelmann.com/)**
