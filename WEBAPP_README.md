# AI & LLM Visibility Validator - Web App

Check if your website is fast enough for AI search engines. This tool validates your site's TTFB, CLS, and INP metrics for AI visibility using real Chrome UX Report data.

## Live Demo

Check the live version at: [Your Vercel URL after deployment]

## What's This About?

AI search engines like ChatGPT, Perplexity, and Google's SGE use **race conditions** - they query multiple sources simultaneously and only process the fastest responses. A slow site isn't just penalized; it's effectively invisible to AI.

This tool helps you:
- Check your site's AI visibility metrics
- Understand your performance for RAG systems
- Get actionable insights for Generative Engine Optimization (GEO)

## Features

- **Real User Data**: Uses Chrome UX Report (CrUX) with real-world metrics
- **Multiple Metrics**: Analyzes TTFB, CLS, and INP
- **Page & Origin Analysis**: Check specific pages and entire website performance
- **AI-Focused Insights**: Understanding how metrics affect AI crawler access
- **Mobile Responsive**: Works on all devices

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Google Cloud Function (serverless)
- **API**: Chrome UX Report API
- **Hosting**: Vercel (can be deployed to any static host)

## Quick Start

### Local Development

1. Clone or download this repository
2. Open `index.html` in your browser
3. Enter a URL and click "Analyze"

That's it! No build process needed.

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to deploy

### Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

### Deploy to GitHub Pages

1. Create a GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/repo.git
   git push -u origin main
   ```
3. Enable GitHub Pages in repository settings

## Configuration

The Cloud Function URL is already configured in `config.js`. If you need to update it:

```javascript
const CONFIG = {
  PROXY_URL: 'https://your-cloud-function-url'
};
```

## File Structure

```
├── index.html          # Main HTML file
├── app.js              # Application logic
├── styles.css          # Styles and responsive design
├── config.js           # Configuration (Cloud Function URL)
├── vercel.json         # Vercel deployment config
├── icons/              # App icons
├── Eu.webp             # Profile image
└── README.md           # This file
```

## How It Works

1. User enters a website URL
2. App makes requests to Google Cloud Function (proxy)
3. Cloud Function queries Chrome UX Report API
4. Results are displayed with AI-focused insights
5. Metrics are categorized based on AI visibility impact

## Metrics Explained

### TTFB (Time To First Byte)
- Critical for AI crawler access
- Affects race conditions in RAG systems
- Target: < 600ms for optimal AI visibility

### CLS (Cumulative Layout Shift)
- Important for AI parsing
- Affects semantic continuity in vector databases
- Target: < 0.1 for stable content parsing

### INP (Interaction to Next Paint)
- Essential for Agentic AI
- Affects task-performing AI agents
- Target: < 200ms for agent success

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- All modern browsers with ES6+ support

## Performance

- Lighthouse score: 95+
- No dependencies or frameworks
- Fast load times
- Minimal bandwidth usage

## Security

- Secure headers configured in `vercel.json`
- CORS properly configured
- API key secured in Cloud Function
- No sensitive data stored

## Cost

**Free for typical usage:**
- Frontend Hosting: Free (Vercel/Netlify/GitHub Pages)
- Google Cloud Function: Free tier (2M requests/month)
- Chrome UX Report API: Free

Typical traffic of 10,000 checks/month = $0/month

## Future Enhancements

- Save report history
- Compare multiple URLs
- Export reports as PDF
- Mobile device metrics
- Batch URL checking
- API for developers

## Support

Need help improving your AI visibility metrics?

**Contact**: [Andre Guelmann](https://andrglmn.me/AI-Extension-Contact)

## Credits

- Built by [Andre Guelmann](https://andrglmn.me)
- Data powered by [Chrome UX Report](https://developer.chrome.com/docs/crux)
- Optimized for Generative Engine Optimization (GEO)

## License

© 2024 Andre Guelmann. All rights reserved.

---

## Troubleshooting

**"No CrUX data available"**
- The website doesn't have enough traffic for CrUX
- Try checking the origin URL instead of a specific page

**"Cloud Function URL not configured"**
- Check `config.js` has the correct Cloud Function URL

**CORS errors**
- Verify Cloud Function CORS settings
- Check that you're using HTTPS URL

**Invalid URL error**
- Make sure to include `https://` in the URL
- Example: `https://example.com`

## Contributing

This is a production tool. For feature requests or bug reports, contact the developer.
