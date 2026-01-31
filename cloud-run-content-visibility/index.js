const express = require('express');
const { chromium } = require('playwright');
const cheerio = require('cheerio');

const app = express();
app.use(express.json({ limit: '200kb' }));

const PORT = process.env.PORT || 8080;
const CACHE_TTL_MS = 10 * 60 * 1000;
const NAV_TIMEOUT_MS = 20000;
const WAIT_AFTER_LOAD_MS = 2000;
const MAX_ELEMENTS = 4000;
const MAX_TEXT_CHARS = 280;
const MAX_LIST_ITEMS = 20;
const MAX_EVALUATE_RETRIES = 2;
const QUIET_WINDOW_MS = 1200;
const STABLE_TIMEOUT_MS = 8000;
const TOTAL_TIMEOUT_MS = 45000;
const STRICT_MODE = process.env.STRICT_MODE ? process.env.STRICT_MODE.toLowerCase() !== 'false' : true;

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

function createRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createLogger(requestId) {
  return (message, extra) => {
    const prefix = `[content-visibility:${requestId}]`;
    if (extra !== undefined) {
      console.log(prefix, message, extra);
    } else {
      console.log(prefix, message);
    }
  };
}

function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label || 'Operation'} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise
  ]);
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

function createPageState(label) {
  return {
    label,
    lastNavAt: 0,
    navigations: 0,
    requestFailures: 0,
    lastUrl: ''
  };
}

function attachPageObservers(page, state, log) {
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      state.navigations += 1;
      state.lastNavAt = Date.now();
      state.lastUrl = frame.url();
      log(`[${state.label}] navigated (${state.navigations})`, state.lastUrl);
    }
  });

  page.on('requestfailed', request => {
    if (request.frame() === page.mainFrame()) {
      state.requestFailures += 1;
      const failure = request.failure();
      log(`[${state.label}] request failed`, {
        url: request.url(),
        errorText: failure ? failure.errorText : 'unknown'
      });
    }
  });

  page.on('pageerror', error => {
    log(`[${state.label}] pageerror`, error.message || String(error));
  });
}

async function waitForQuietNavigation(state, quietMs, timeoutMs, log) {
  const start = Date.now();
  if (!state.lastNavAt) {
    state.lastNavAt = Date.now();
  }

  while (Date.now() - start < timeoutMs) {
    if (Date.now() - state.lastNavAt >= quietMs) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  log(`[${state.label}] navigation did not settle within ${timeoutMs}ms`);
  return false;
}

async function gotoAndStabilize(page, url, state, log) {
  page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
  page.setDefaultTimeout(NAV_TIMEOUT_MS);
  log(`[${state.label}] goto start`, url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  await page.waitForTimeout(WAIT_AFTER_LOAD_MS);
  await waitForQuietNavigation(state, QUIET_WINDOW_MS, STABLE_TIMEOUT_MS, log);
}

function safePageUrl(page, fallbackUrl) {
  try {
    const current = page.url();
    if (current) return current;
  } catch (error) {
    // Ignore.
  }
  return fallbackUrl || '';
}

function categorizeElement(tagName, className) {
  if (!tagName) return 'static';
  const lowerTag = tagName.toLowerCase();
  const lowerClass = (className || '').toLowerCase();

  if (lowerClass.includes('dynamic') || lowerClass.includes('loaded') ||
      lowerClass.includes('ajax') || lowerClass.includes('async')) {
    return 'dynamic-content';
  }

  if (['nav', 'header', 'footer', 'aside'].includes(lowerTag)) {
    return 'navigation';
  }

  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(lowerTag)) {
    return 'heading';
  }

  if (lowerTag === 'p') {
    return 'paragraph';
  }

  if (['button', 'input', 'select', 'textarea'].includes(lowerTag)) {
    return 'interactive';
  }

  return 'static';
}

function buildEmptyAnalysis(url) {
  return {
    elements: [],
    totalWords: 0,
    url: url || '',
    timestamp: new Date().toISOString()
  };
}

function extractContentFromHtml(html, url) {
  const analysis = buildEmptyAnalysis(url);
  if (!html) return analysis;

  const $ = cheerio.load(html);
  const body = $('body')[0];
  if (!body) return analysis;

  const hiddenClassMatchers = [
    'hidden',
    'sr-only',
    'sr_only',
    'visually-hidden',
    'visuallyhidden',
    'screen-reader',
    'screenreader',
    'a11y-hidden'
  ];

  const hasHiddenClass = (className) => {
    if (!className) return false;
    const lower = className.toLowerCase();
    return hiddenClassMatchers.some(match => lower.includes(match));
  };

  const hasHiddenAttr = (node) => {
    if (!node || !node.attribs) return false;
    if (Object.prototype.hasOwnProperty.call(node.attribs, 'hidden')) return true;
    const ariaHidden = node.attribs['aria-hidden'];
    if (ariaHidden && ariaHidden.toLowerCase() === 'true') return true;
    const styleAttr = (node.attribs.style || '').toLowerCase();
    if (styleAttr.includes('display:none') || styleAttr.includes('visibility:hidden')) {
      return true;
    }
    const className = node.attribs.class || '';
    if (hasHiddenClass(className)) return true;
    if (node.attribs.type && node.attribs.type.toLowerCase() === 'hidden') return true;
    return false;
  };

  const isHiddenByAncestors = (node) => {
    let current = node;
    while (current) {
      if (hasHiddenAttr(current)) return true;
      current = current.parent;
    }
    return false;
  };

  const walk = (node) => {
    if (!node || analysis.elements.length >= MAX_ELEMENTS) return;

    if (node.type === 'text') {
      const rawText = (node.data || '').trim();
      if (!rawText) return;
      const parent = node.parent;
      const tagName = parent && parent.name ? parent.name.toLowerCase() : 'text';
      if (['script', 'style', 'noscript', 'template'].includes(tagName)) {
        return;
      }
      const className = parent && parent.attribs ? parent.attribs.class || '' : '';
      const id = parent && parent.attribs ? parent.attribs.id || '' : '';
      const isVisible = !isHiddenByAncestors(parent);
      const words = rawText.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      if (!wordCount) return;
      const text = rawText.length > MAX_TEXT_CHARS ? `${rawText.substring(0, MAX_TEXT_CHARS)}...` : rawText;
      const category = categorizeElement(tagName, className);

      analysis.elements.push({
        text,
        wordCount,
        isVisible,
        category,
        tagName,
        className,
        id
      });

      if (isVisible) {
        analysis.totalWords += wordCount;
      }

      return;
    }

    if (node.type === 'script' || node.type === 'style' || node.type === 'comment') {
      return;
    }

    if (node.children && node.children.length) {
      node.children.forEach(child => walk(child));
    }
  };

  walk(body);
  return analysis;
}

async function getHtmlSnapshot(page, label, log, fallbackUrl) {
  try {
    return await page.content();
  } catch (error) {
    log(`[${label}] page.content failed`, error.message || String(error));
  }

  const url = safePageUrl(page, fallbackUrl);
  if (!url) return null;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentVisibilityBot/1.0)'
      }
    });
    if (!response.ok) {
      log(`[${label}] fallback fetch failed`, response.status);
      return null;
    }
    return await response.text();
  } catch (error) {
    log(`[${label}] fallback fetch error`, error.message || String(error));
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

async function extractContentFast(page) {
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

    const bodyText = document.body.innerText || '';
    const words = bodyText.trim().split(/\s+/).filter(Boolean);
    analysis.totalWords = words.length;

    const selector = 'h1,h2,h3,h4,h5,h6,p,li,a,button,label,summary,figcaption,blockquote';
    const elements = document.querySelectorAll(selector);

    for (const el of elements) {
      if (analysis.elements.length >= maxElements) break;
      try {
        const rawText = (el.innerText || el.textContent || '').trim();
        if (!rawText) continue;

        const wordsInEl = rawText.split(/\s+/).filter(Boolean);
        const wordCount = wordsInEl.length;
        if (!wordCount) continue;

        const style = window.getComputedStyle(el);
        const isVisible = !(
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0' ||
          el.hidden
        );

        if (!isVisible) continue;

        const tagName = el.tagName ? el.tagName.toLowerCase() : 'text';
        const className = el.className || '';
        const id = el.id || '';
        const text = rawText.length > maxTextChars ? `${rawText.substring(0, maxTextChars)}...` : rawText;

        analysis.elements.push({
          text,
          wordCount,
          isVisible,
          category: categorizeElement(tagName, className),
          tagName,
          className,
          id
        });
      } catch (e) {
        continue;
      }
    }

    return analysis;
  }, { maxElements: MAX_ELEMENTS, maxTextChars: MAX_TEXT_CHARS });
}

async function extractContentWithRetry(page) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_EVALUATE_RETRIES; attempt += 1) {
    try {
      return await extractContent(page);
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error);
      const isContextError = message.includes('callback is no longer runnable') ||
        message.includes('Execution context was destroyed') ||
        message.includes('Cannot find context') ||
        message.includes('Target closed');

      if (!isContextError || attempt === MAX_EVALUATE_RETRIES) {
        break;
      }

      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      } catch (waitError) {
        // Best-effort; retry anyway.
      }

      await page.waitForTimeout(500);
    }
  }

  throw lastError;
}

async function extractContentSafe(page, options) {
  const { label, log, warnings, fallbackUrl } = options;
  try {
    return await extractContentWithRetry(page);
  } catch (error) {
    log(`[${label}] live DOM extraction failed, falling back`, error.message || String(error));
  }

  try {
    const fastResult = await extractContentFast(page);
    warnings.push(`[${label}] Live DOM extraction failed; used fast DOM extraction.`);
    return fastResult;
  } catch (error) {
    log(`[${label}] fast DOM extraction failed, falling back`, error.message || String(error));
    warnings.push(`[${label}] Fast DOM extraction failed.`);
  }

  if (STRICT_MODE) {
    warnings.push(`[${label}] Strict mode enabled; HTML snapshot fallback skipped.`);
    return buildEmptyAnalysis(fallbackUrl || safePageUrl(page, fallbackUrl));
  }

  const snapshot = await getHtmlSnapshot(page, label, log, fallbackUrl);
  if (snapshot) {
    return extractContentFromHtml(snapshot, fallbackUrl || safePageUrl(page, fallbackUrl));
  }

  warnings.push(`[${label}] HTML snapshot fallback failed; returning empty analysis.`);
  return buildEmptyAnalysis(fallbackUrl || safePageUrl(page, fallbackUrl));
}

async function analyzeUrl(url, log) {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const warnings = [];

  try {
    const enabledContext = await browser.newContext();
    const disabledContext = await browser.newContext({ javaScriptEnabled: false });

    const enabledPage = await enabledContext.newPage();
    const disabledPage = await disabledContext.newPage();

    const enabledState = createPageState('js-enabled');
    const disabledState = createPageState('js-disabled');

    attachPageObservers(enabledPage, enabledState, log);
    attachPageObservers(disabledPage, disabledState, log);

    await gotoAndStabilize(enabledPage, url, enabledState, log);
    await gotoAndStabilize(disabledPage, url, disabledState, log);

    const jsEnabled = await extractContentSafe(enabledPage, {
      label: 'js-enabled',
      log,
      warnings,
      fallbackUrl: url
    });

    const jsDisabled = await extractContentSafe(disabledPage, {
      label: 'js-disabled',
      log,
      warnings,
      fallbackUrl: url
    });

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
      },
      warnings
    };
  } finally {
    await browser.close();
  }
}

app.post('/analyze', async (req, res) => {
  const requestId = createRequestId();
  const log = createLogger(requestId);
  const startedAt = Date.now();
  const url = normalizeUrl(req.body?.url || '');

  if (!url) {
    res.status(400).json({ success: false, error: 'Invalid URL.' });
    return;
  }

  log('analyze request', { url });

  const cacheKey = url;
  const cached = getCache(cacheKey);
  if (cached) {
    log('cache hit');
    res.json({ ...cached, cached: true, requestId });
    return;
  }

  try {
    const result = await withTimeout(analyzeUrl(url, log), TOTAL_TIMEOUT_MS, 'Analyze');
    const payload = {
      success: true,
      url,
      generatedAt: new Date().toISOString(),
      cached: false,
      requestId,
      timings: {
        totalMs: Date.now() - startedAt
      },
      ...result
    };
    setCache(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    log('analysis failed', error.message || String(error));
    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed.',
      requestId
    });
  }
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Content visibility service listening on ${PORT}`);
});
