const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json({ limit: '200kb' }));

const PORT = process.env.PORT || 8080;
const CACHE_TTL_MS = 10 * 60 * 1000;
const NAV_TIMEOUT_MS = 20000;
const WAIT_AFTER_LOAD_MS = 2000;
const MAX_ELEMENTS = 4000;
const MAX_TEXT_CHARS = 280;
const MAX_LIST_ITEMS = 20;

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

function buildKey(element) {
  return `${(element.text || '').substring(0, 100)}_${element.tagName}_${element.className}`;
}

function compareContent(jsEnabled, jsDisabled) {
  if (!jsEnabled || !jsDisabled) {
    return { lostContent: [], gainedContent: [] };
  }

  const enabledMap = new Map();
  const disabledMap = new Map();

  jsEnabled.elements.forEach(elem => {
    enabledMap.set(buildKey(elem), elem);
  });

  jsDisabled.elements.forEach(elem => {
    disabledMap.set(buildKey(elem), elem);
  });

  const lostContent = [];
  const gainedContent = [];

  for (const [key, elem] of enabledMap) {
    if (!disabledMap.has(key) && elem.isVisible) {
      lostContent.push(elem);
    }
  }

  for (const [key, elem] of disabledMap) {
    if (!enabledMap.has(key) && elem.isVisible) {
      gainedContent.push(elem);
    }
  }

  lostContent.sort((a, b) => b.wordCount - a.wordCount);
  gainedContent.sort((a, b) => b.wordCount - a.wordCount);

  return {
    lostContent: lostContent.slice(0, MAX_LIST_ITEMS),
    gainedContent: gainedContent.slice(0, MAX_LIST_ITEMS)
  };
}

async function extractContent(page) {
  return page.evaluate(({ maxElements, maxTextChars }) => {
    const analysis = {
      elements: [],
      totalWords: 0,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    if (!document || !document.body) {
      return analysis;
    }

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          try {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tagName = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript'].includes(tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          } catch (e) {
            return NodeFilter.FILTER_REJECT;
          }
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      if (analysis.elements.length >= maxElements) break;
      try {
        const parent = node.parentElement;
        const rawText = node.textContent.trim();
        if (!rawText) continue;

        const words = rawText.split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        if (!wordCount) continue;

        const style = window.getComputedStyle(parent);
        const isVisible = !(
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0' ||
          parent.hidden
        );

        let category = 'static';
        const className = parent.className || '';
        const id = parent.id || '';

        if (className.includes('dynamic') || className.includes('loaded') ||
            className.includes('ajax') || className.includes('async')) {
          category = 'dynamic-content';
        } else if (parent.closest('[data-testid], [data-component]')) {
          category = 'component';
        } else if (['nav', 'header', 'footer', 'aside'].includes(parent.tagName.toLowerCase())) {
          category = 'navigation';
        } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(parent.tagName.toLowerCase())) {
          category = 'heading';
        } else if (parent.tagName.toLowerCase() === 'p') {
          category = 'paragraph';
        } else if (['button', 'input', 'select', 'textarea'].includes(parent.tagName.toLowerCase())) {
          category = 'interactive';
        }

        const text = rawText.length > maxTextChars ? `${rawText.substring(0, maxTextChars)}...` : rawText;

        analysis.elements.push({
          text,
          wordCount,
          isVisible,
          category,
          tagName: parent.tagName.toLowerCase(),
          className,
          id
        });

        if (isVisible) {
          analysis.totalWords += wordCount;
        }
      } catch (e) {
        continue;
      }
    }

    return analysis;
  }, { maxElements: MAX_ELEMENTS, maxTextChars: MAX_TEXT_CHARS });
}

async function analyzeUrl(url) {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const enabledContext = await browser.newContext();
    const disabledContext = await browser.newContext({ javaScriptEnabled: false });

    const enabledPage = await enabledContext.newPage();
    const disabledPage = await disabledContext.newPage();

    await enabledPage.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
    await enabledPage.waitForTimeout(WAIT_AFTER_LOAD_MS);

    await disabledPage.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
    await disabledPage.waitForTimeout(WAIT_AFTER_LOAD_MS);

    const jsEnabled = await extractContent(enabledPage);
    const jsDisabled = await extractContent(disabledPage);

    const diff = compareContent(jsEnabled, jsDisabled);
    const enabledWords = jsEnabled.totalWords || 0;
    const disabledWords = jsDisabled.totalWords || 0;
    const difference = disabledWords - enabledWords;
    const hiddenPercent = enabledWords > 0
      ? Math.max(0, ((enabledWords - disabledWords) / enabledWords) * 100)
      : 0;

    return {
      jsEnabled,
      jsDisabled,
      diff,
      summary: {
        enabledWords,
        disabledWords,
        difference,
        hiddenPercent: Number(hiddenPercent.toFixed(1))
      }
    };
  } finally {
    await browser.close();
  }
}

app.post('/analyze', async (req, res) => {
  const url = normalizeUrl(req.body?.url || '');

  if (!url) {
    res.status(400).json({ success: false, error: 'Invalid URL.' });
    return;
  }

  const cacheKey = url;
  const cached = getCache(cacheKey);
  if (cached) {
    res.json({ ...cached, cached: true });
    return;
  }

  try {
    const result = await analyzeUrl(url);
    const payload = {
      success: true,
      url,
      generatedAt: new Date().toISOString(),
      cached: false,
      ...result
    };
    setCache(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Analysis failed.' });
  }
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Content visibility service listening on ${PORT}`);
});
