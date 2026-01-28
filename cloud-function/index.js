const functions = require('@google-cloud/functions-framework');

const API_KEY = 'AIzaSyCF2TCPZ60Izuy3_OcPdoZSeAfmgaQEKXE';
const CRUX_API_URL = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

functions.http('getCruxData', async (req, res) => {
  // Enable CORS for Chrome extension
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { url, formFactor, metrics, action } = req.body;

    // Handle robots.txt fetch action
    if (action === 'fetchRobotsTxt') {
      if (!url) {
        res.status(400).json({ error: 'URL is required for robots.txt fetch' });
        return;
      }

      try {
        const robotsResponse = await fetch(url, {
          headers: {
            'User-Agent': 'AI-Visibility-Validator/1.0'
          }
        });

        if (!robotsResponse.ok) {
          res.status(robotsResponse.status).json({
            error: 'Failed to fetch robots.txt',
            status: robotsResponse.status
          });
          return;
        }

        const robotsText = await robotsResponse.text();
        res.status(200).json({
          success: true,
          text: robotsText
        });
        return;
      } catch (error) {
        res.status(500).json({
          error: 'Failed to fetch robots.txt',
          details: error.message
        });
        return;
      }
    }

    // Validate input for CrUX API call
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Call CrUX API
    const response = await fetch(`${CRUX_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formFactor: formFactor || 'DESKTOP',
        metrics: metrics || ['experimental_time_to_first_byte', 'cumulative_layout_shift', 'interaction_to_next_paint']
      })
    });

    const data = await response.json();

    // Return the data with original status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error calling CrUX API:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});
