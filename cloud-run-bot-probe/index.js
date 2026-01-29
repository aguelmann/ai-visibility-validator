const express = require('express');
const { request } = require('undici');

const app = express();
app.use(express.json({ limit: '200kb' }));

const PORT = process.env.PORT || 8080;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_REDIRECTS = 5;
const CONCURRENCY_LIMIT = 2; // Limit concurrency to avoid overwhelming the service
const REQUEST_TIMEOUT_MS = 5000; // 5s per request

const BOT_PROFILES = {
  openai_gptbot: {
    company: 'OpenAI',
    label: 'GPTBot',
    userAgent: 'GPTBot'
  },
  openai_chatgpt_user: {
    company: 'OpenAI',
    label: 'ChatGPT-User',
    userAgent: 'ChatGPT-User'
  },
  openai_searchbot: {
    company: 'OpenAI',
    label: 'OAI-SearchBot',
    userAgent: 'OAI-SearchBot'
  },
  anthropic_claudebot: {
    company: 'Anthropic',
    label: 'ClaudeBot',
    userAgent: 'ClaudeBot'
  },
  anthropic_claude_searchbot: {
    company: 'Anthropic',
    label: 'Claude-SearchBot',
    userAgent: 'Claude-SearchBot'
  },
  anthropic_claude_user: {
    company: 'Anthropic',
    label: 'Claude-User',
    userAgent: 'Claude-User'
  },
  perplexity_bot: {
    company: 'Perplexity',
    label: 'PerplexityBot',
    userAgent: 'PerplexityBot'
  },
  perplexity_user: {
    company: 'Perplexity',
    label: 'Perplexity-User',
    userAgent: 'Perplexity-User'
  }
};

const cache = new Map();

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

function allowOrigin(origin) {
  if (!origin) return '*';
  const allowed = [
    'https://ai-check.andreguelmann.com',
    'https://andreguelmann.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  if (allowed.includes(origin)) {
    return origin;
  }
  return '*';
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', allowOrigin(origin));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

function normalizeUrl(rawUrl) {
  let normalized = rawUrl.trim();
  if (!normalized) return null;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  try {
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch (error) {
    return null;
  }
}

async function measureTtfb(url, userAgent) {
  const startTime = Date.now();
  let currentUrl = url;
  let redirects = 0;

  while (true) {
    const response = await request(currentUrl, {
      method: 'GET',
      headers: {
        'user-agent': userAgent,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache'
      },
      maxRedirections: 0,
      headersTimeout: REQUEST_TIMEOUT_MS,
      bodyTimeout: REQUEST_TIMEOUT_MS
    });

    const status = response.statusCode;
    const location = response.headers.location;

    if (status >= 300 && status < 400 && location) {
      response.body?.destroy();
      redirects += 1;
      if (redirects > MAX_REDIRECTS) {
        throw new Error(`Too many redirects (>${MAX_REDIRECTS}).`);
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    const ttfbMs = await new Promise((resolve, reject) => {
      let resolved = false;
      const cleanup = () => {
        response.body?.off('data', onData);
        response.body?.off('end', onEnd);
        response.body?.off('error', onError);
      };
      const onData = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(Date.now() - startTime);
        response.body?.destroy();
      };
      const onEnd = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(Date.now() - startTime);
      };
      const onError = (err) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        reject(err);
      };
      response.body?.once('data', onData);
      response.body?.once('end', onEnd);
      response.body?.once('error', onError);
    });

    return {
      ttfbMs,
      status,
      finalUrl: currentUrl,
      redirects
    };
  }
}

async function mapWithLimit(items, limit, fn) {
  const results = [];
  let index = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  });
  await Promise.all(workers);
  return results;
}

app.post('/probe', async (req, res) => {
  const url = normalizeUrl(req.body?.url || '');
  const botKeys = Array.isArray(req.body?.botKeys) ? req.body.botKeys : [];

  if (!url) {
    res.status(400).json({ success: false, error: 'Invalid URL.' });
    return;
  }

  const selectedBots = botKeys.length > 0
    ? botKeys.filter(key => BOT_PROFILES[key])
    : Object.keys(BOT_PROFILES);

  if (selectedBots.length === 0) {
    res.status(400).json({ success: false, error: 'No valid bot keys provided.' });
    return;
  }

  try {
    const results = await mapWithLimit(selectedBots, CONCURRENCY_LIMIT, async (botKey) => {
      const profile = BOT_PROFILES[botKey];
      const cacheKey = `${botKey}:${url}`;
      const cached = getCache(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }

      try {
        const probe = await measureTtfb(url, profile.userAgent);
        const result = {
          botKey,
          company: profile.company,
          label: profile.label,
          ttfbMs: probe.ttfbMs,
          status: probe.status,
          finalUrl: probe.finalUrl,
          redirects: probe.redirects,
          cached: false
        };
        setCache(cacheKey, result);
        return result;
      } catch (error) {
        return {
          botKey,
          company: profile.company,
          label: profile.label,
          error: error.message || 'Probe failed.',
          cached: false
        };
      }
    });

    res.json({
      success: true,
      url,
      generatedAt: new Date().toISOString(),
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Probe failed.' });
  }
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Bot probe service listening on ${PORT}`);
});
