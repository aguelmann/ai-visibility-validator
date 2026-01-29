// Configuration loaded from config.js
// API calls now go through Cloud Function proxy for security

// AI Bots List (33 bots for crawlability checking)
const AI_BOTS = [
  // 1. OpenAI (Most Common)
  { userAgent: 'GPTBot', company: 'OpenAI', product: 'ChatGPT training crawler', category: 'Training' },
  { userAgent: 'ChatGPT-User', company: 'OpenAI', product: 'ChatGPT user-initiated browsing', category: 'Browsing' },
  { userAgent: 'OAI-SearchBot', company: 'OpenAI', product: 'SearchGPT crawler', category: 'Search' },
  // 2. Perplexity
  { userAgent: 'PerplexityBot', company: 'Perplexity', product: 'Perplexity AI search crawler', category: 'Search' },
  { userAgent: 'Perplexity-User', company: 'Perplexity', product: 'Perplexity user browsing', category: 'Browsing' },
  // 3. Anthropic
  { userAgent: 'ClaudeBot', company: 'Anthropic', product: 'Claude training crawler', category: 'Training' },
  { userAgent: 'Claude-SearchBot', company: 'Anthropic', product: 'Claude search functionality', category: 'Search' },
  { userAgent: 'Claude-User', company: 'Anthropic', product: 'Claude user-initiated browsing', category: 'Browsing' },
  // 4. Google
  { userAgent: 'Google-Extended', company: 'Google', product: 'Gemini AI training', category: 'Training' },
  { userAgent: 'CloudVertexBot', company: 'Google', product: 'Google Cloud Vertex AI', category: 'Training' },
  { userAgent: 'Gemini-Deep-Research', company: 'Google', product: 'Gemini deep research feature', category: 'Research' },
  { userAgent: 'Google-NotebookLM', company: 'Google', product: 'NotebookLM AI assistant', category: 'Research' },
  { userAgent: 'GoogleAgent-Mariner', company: 'Google', product: 'Google AI agent browsing', category: 'Browsing' },
  { userAgent: 'Googlebot', company: 'Google', product: 'Googlebot Desktop', category: 'Crawling' },
  { userAgent: 'Googlebot-Mobile', company: 'Google', product: 'Googlebot Smartphone', category: 'Crawling' },
  { userAgent: 'Googlebot-Image', company: 'Google', product: 'Google Image crawler', category: 'Crawling' },
  { userAgent: 'Googlebot-Video', company: 'Google', product: 'Google Video crawler', category: 'Crawling' },
  { userAgent: 'Googlebot-News', company: 'Google', product: 'Google News crawler', category: 'Crawling' },
  { userAgent: 'Storebot-Google', company: 'Google', product: 'Google StoreBot Desktop', category: 'Crawling' },
  { userAgent: 'Storebot-Google-Mobile', company: 'Google', product: 'Google StoreBot Mobile', category: 'Crawling' },
  { userAgent: 'GoogleOther', company: 'Google', product: 'GoogleOther Desktop', category: 'Crawling' },
  { userAgent: 'GoogleOther-Mobile', company: 'Google', product: 'GoogleOther Mobile', category: 'Crawling' },
  { userAgent: 'GoogleOther-Image', company: 'Google', product: 'GoogleOther Image crawler', category: 'Crawling' },
  { userAgent: 'GoogleOther-Video', company: 'Google', product: 'GoogleOther Video crawler', category: 'Crawling' },
  // 5. Mistral
  { userAgent: 'MistralAI-User', company: 'Mistral', product: 'Mistral AI user browsing', category: 'Browsing' },
  // 6. Amazon
  { userAgent: 'Amazonbot', company: 'Amazon', product: 'Alexa AI training', category: 'Training' },
  // 7. Apple
  { userAgent: 'Applebot-Extended', company: 'Apple', product: 'Apple Intelligence training', category: 'Training' },
  // 8. Meta
  { userAgent: 'FacebookBot', company: 'Meta', product: 'Facebook AI crawler', category: 'Training' },
  { userAgent: 'facebookexternalhit', company: 'Meta', product: 'Meta external content fetcher', category: 'Browsing' },
  { userAgent: 'Meta-ExternalAgent', company: 'Meta', product: 'Meta AI external agent', category: 'Browsing' },
  { userAgent: 'meta-externalfetcher', company: 'Meta', product: 'Meta content fetcher', category: 'Browsing' },
  // 9. DuckDuckGo
  { userAgent: 'DuckAssistBot', company: 'DuckDuckGo', product: 'DuckDuckGo AI search', category: 'Search' },
  // 10. Common Crawl
  { userAgent: 'CCBot', company: 'Common Crawl', product: 'Open web crawl data (used by AI models)', category: 'Training' }
];

const BOT_TTFB_PROFILES = [
  { key: 'openai_gptbot', company: 'OpenAI', label: 'GPTBot' },
  { key: 'openai_chatgpt_user', company: 'OpenAI', label: 'ChatGPT-User' },
  { key: 'openai_searchbot', company: 'OpenAI', label: 'OAI-SearchBot' },
  { key: 'anthropic_claudebot', company: 'Anthropic', label: 'ClaudeBot' },
  { key: 'anthropic_claude_searchbot', company: 'Anthropic', label: 'Claude-SearchBot' },
  { key: 'anthropic_claude_user', company: 'Anthropic', label: 'Claude-User' },
  { key: 'perplexity_bot', company: 'Perplexity', label: 'PerplexityBot' },
  { key: 'perplexity_user', company: 'Perplexity', label: 'Perplexity-User' }
];

// TTFB Categories based on CSV data
const TTFB_CATEGORIES = [
  {
    name: 'Ideal',
    grade: 'A+',
    maxMs: 200,
    color: '#25995c',
    description: 'Guaranteed Inclusion',
    impact: 'Gold standard for AI access. Wins race conditions against competitors.',
    primaryImpact: 'In GEO (Generative Engine Optimization), speed is binary. Slow sites are often treated as non-existent when bots timeout.'
  },
  {
    name: 'Competitive',
    grade: 'A',
    minMs: 200,
    maxMs: 350,
    color: '#25995c',
    description: 'High Visibility',
    impact: 'Average TTFB for top-ranking AI search sites. Reliably indexed.',
    primaryImpact: 'RAG systems (Perplexity, ChatGPT) race between sources. First responders win, even if slower sites technically succeed.'
  },
  {
    name: 'Target',
    grade: 'B',
    minMs: 350,
    maxMs: 600,
    color: '#25995c',
    description: 'Optimal Access',
    impact: 'Recommended threshold for full AI crawler access.',
    primaryImpact: 'Edge caching with stale-while-revalidate can serve cached content instantly (<50ms) while updating in background.'
  },
  {
    name: 'Needs Improvement',
    grade: 'C',
    minMs: 600,
    maxMs: 1000,
    color: '#FFC107',
    description: 'Competitive Disadvantage',
    impact: 'At risk of losing race logic. Slower responses get discarded.',
    primaryImpact: 'RAG systems query multiple sources but only process the fastest. A site at 800ms loses to one at 100ms.'
  },
  {
    name: 'At Risk',
    grade: 'D',
    minMs: 1000,
    maxMs: 2000,
    color: '#FF9800',
    description: 'The "Timeout Wall"',
    impact: 'Many RAG systems timeout between 1-2 seconds. High risk of connection resets.',
    primaryImpact: 'Speed is binary in AI search. Unlike SEO where slow sites rank lower, slow AI sites are treated as unavailable.'
  },
  {
    name: 'Poor (Invisible)',
    grade: 'F',
    minMs: 2000,
    color: '#F44336',
    description: 'Guaranteed Exclusion',
    impact: 'Effectively invisible. AI platforms timeout and abandon the request.',
    primaryImpact: 'Timeout constraints (1-5 seconds) mean slow sites are treated as non-existent, not just lower-ranked.'
  }
];

// CLS Categories
const CLS_CATEGORIES = [
  {
    name: 'Good',
    grade: 'A',
    maxValue: 0.1,
    color: '#25995c',
    description: 'High Vector Integrity',
    impact: 'Stable DOM allows RAG systems to chunk text properly for vector databases.',
    primaryImpact: 'For AI, CLS is about semantic continuity. High CLS means dynamic elements inject tags that break paragraphs, confusing RAG parsers and splitting answers into disconnected pieces.'
  },
  {
    name: 'Needs Improvement',
    grade: 'C',
    minValue: 0.1,
    maxValue: 0.25,
    color: '#FFC107',
    description: 'Parsing Risk',
    impact: 'Dynamic content may interrupt text stream and risk retrieval failure.',
    primaryImpact: 'AI bots dislike layout shifts because they break code structure. RAG systems chunk content based on HTML tags like &lt;p&gt; and &lt;div&gt;.'
  },
  {
    name: 'Poor',
    grade: 'F',
    minValue: 0.25,
    color: '#F44336',
    description: 'RAG Chunking Failure',
    impact: 'Broken semantic continuity. Content may be split into nonsensical halves.',
    primaryImpact: 'Late-loading ads that inject mid-paragraph cause RAG parsers to split text. AI fails to retrieve answers when neither half contains complete context.'
  }
];

// INP Categories
const INP_CATEGORIES = [
  {
    name: 'Good',
    grade: 'A',
    maxMs: 200,
    color: '#25995c',
    description: 'Agentic Success',
    impact: 'Required for autonomous agents. Fast response confirms actions succeeded.',
    primaryImpact: 'Irrelevant for read-only bots (GPTBot, Perplexity). Critical for Agentic AI (OpenAI Operator) that performs tasks like booking flights.'
  },
  {
    name: 'Poor',
    grade: 'F',
    minMs: 200,
    color: '#F44336',
    description: 'Agentic Friction',
    impact: 'Blocked threads cause agents to interpret delays as failed interactions.',
    primaryImpact: 'INP is for "Agents," not "Search." Agentic AI timeouts on slow buttons and abandons tasks, unlike humans who wait.'
  }
];

let lastReportData = null;
let lastBotTtfbData = null;

// Get category for a given TTFB value
function getTTFBCategory(ttfbMs) {
  for (const category of TTFB_CATEGORIES) {
    if (category.maxMs === undefined) {
      if (ttfbMs >= category.minMs) {
        return category;
      }
    } else if (category.minMs === undefined) {
      if (ttfbMs < category.maxMs) {
        return category;
      }
    } else {
      if (ttfbMs >= category.minMs && ttfbMs < category.maxMs) {
        return category;
      }
    }
  }
  return TTFB_CATEGORIES[TTFB_CATEGORIES.length - 1];
}

// Get category for a given CLS value
function getCLSCategory(clsValue) {
  for (const category of CLS_CATEGORIES) {
    if (category.maxValue === undefined) {
      if (clsValue >= category.minValue) {
        return category;
      }
    } else if (category.minValue === undefined) {
      if (clsValue < category.maxValue) {
        return category;
      }
    } else {
      if (clsValue >= category.minValue && clsValue < category.maxValue) {
        return category;
      }
    }
  }
  return CLS_CATEGORIES[CLS_CATEGORIES.length - 1];
}

// Get category for a given INP value
function getINPCategory(inpMs) {
  for (const category of INP_CATEGORIES) {
    if (category.maxMs === undefined) {
      if (inpMs >= category.minMs) {
        return category;
      }
    } else if (category.minMs === undefined) {
      if (inpMs < category.maxMs) {
        return category;
      }
    } else {
      if (inpMs >= category.minMs && inpMs < category.maxMs) {
        return category;
      }
    }
  }
  return INP_CATEGORIES[INP_CATEGORIES.length - 1];
}

// Query CrUX API through Cloud Function proxy
async function queryCruxAPI(url, formFactor = 'DESKTOP') {
  const requestBody = {
    url: url,
    formFactor: formFactor,
    metrics: ['experimental_time_to_first_byte', 'cumulative_layout_shift', 'interaction_to_next_paint']
  };

  try {
    // Check if proxy URL is configured
    if (!CONFIG.PROXY_URL || CONFIG.PROXY_URL === 'REPLACE_WITH_YOUR_CLOUD_FUNCTION_URL') {
      throw new Error('Cloud Function URL not configured. Please update config.js with your deployed function URL.');
    }

    const response = await fetch(CONFIG.PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Proxy Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

// Extract metrics from CrUX response
function extractMetrics(cruxData) {
  if (!cruxData.record || !cruxData.record.metrics) {
    return { ttfb: null, cls: null, inp: null };
  }

  const metrics = cruxData.record.metrics;

  const ttfbMetric = metrics.experimental_time_to_first_byte;
  const ttfb = (ttfbMetric && ttfbMetric.percentiles) ? ttfbMetric.percentiles.p75 : null;

  const clsMetric = metrics.cumulative_layout_shift;
  const cls = (clsMetric && clsMetric.percentiles) ? clsMetric.percentiles.p75 : null;

  const inpMetric = metrics.interaction_to_next_paint;
  const inp = (inpMetric && inpMetric.percentiles) ? inpMetric.percentiles.p75 : null;

  return { ttfb, cls, inp };
}

// Create overview metric card
function createOverviewMetricCard(metricName, value, unit, category, metricType) {
  return `
    <div class="metric-card-overview" data-metric="${metricType}">
      <div class="metric-name-overview">${metricName}</div>
      <div class="metric-value-overview">${value}${unit}</div>
      <div class="metric-badge-overview" style="background-color: ${category.color};">
        ${category.name}
      </div>
    </div>
  `;
}

// Create detailed metric card
function createDetailMetricCard(metrics, metricType) {
  let category, value, unit, metricName;

  if (metricType === 'ttfb') {
    if (metrics.ttfb === null) return '<p class="no-data">No TTFB data available</p>';
    category = getTTFBCategory(metrics.ttfb);
    value = metrics.ttfb;
    unit = 'ms';
    metricName = 'Time To First Byte';
  } else if (metricType === 'cls') {
    if (metrics.cls === null) return '<p class="no-data">No CLS data available</p>';
    category = getCLSCategory(metrics.cls);
    value = Number(metrics.cls).toFixed(3);
    unit = '';
    metricName = 'Cumulative Layout Shift';
  } else if (metricType === 'inp') {
    if (metrics.inp === null) return '<p class="no-data">No INP data available</p>';
    category = getINPCategory(metrics.inp);
    value = metrics.inp;
    unit = 'ms';
    metricName = 'Interaction to Next Paint';
  }

  const gradeDisplay = category.grade ? `<div class="grade-detail">${category.grade}</div>` : '';

  return `
    <div class="metric-header-detail" style="background-color: ${category.color};">
      <div class="metric-title-detail">
        ${gradeDisplay}
        <div class="metric-name-detail">${metricName}</div>
      </div>
      <div class="metric-value-detail">${value}${unit}</div>
    </div>
    <div class="metric-body-detail">
      <div class="category-badge-detail" style="background-color: ${category.color};">
        ${category.name}
      </div>
      <div class="category-description-detail">
        <strong style="color: ${category.color};">${category.description}</strong>
      </div>
      <div class="category-impact-detail">${category.impact}</div>
      <div class="category-primary-impact-detail">${category.primaryImpact}</div>
    </div>
  `;
}

// Create overview metrics HTML
function createOverviewMetricsHTML(metrics) {
  let html = '';

  if (metrics.ttfb !== null) {
    const ttfbCategory = getTTFBCategory(metrics.ttfb);
    html += createOverviewMetricCard('TTFB', metrics.ttfb, 'ms', ttfbCategory, 'ttfb');
  } else {
    html += '<div class="metric-card-overview"><p class="no-data">No TTFB data</p></div>';
  }

  if (metrics.cls !== null) {
    const clsCategory = getCLSCategory(metrics.cls);
    const clsValue = Number(metrics.cls).toFixed(3);
    html += createOverviewMetricCard('CLS', clsValue, '', clsCategory, 'cls');
  } else {
    html += '<div class="metric-card-overview"><p class="no-data">No CLS data</p></div>';
  }

  if (metrics.inp !== null) {
    const inpCategory = getINPCategory(metrics.inp);
    html += createOverviewMetricCard('INP', metrics.inp, 'ms', inpCategory, 'inp');
  } else {
    html += '<div class="metric-card-overview"><p class="no-data">No INP data</p></div>';
  }

  return html;
}

// Tab switching
function setupTabSwitching() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      // Remove active class from all nav items and tab contents
      navItems.forEach(nav => nav.classList.remove('active'));
      tabContents.forEach(tab => tab.classList.remove('active'));

      // Add active class to clicked nav item and corresponding tab
      item.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  // Setup metric card click handlers in overview to switch tabs
  document.addEventListener('click', (event) => {
    const card = event.target.closest('.metric-card-overview');
    if (card) {
      const metricType = card.getAttribute('data-metric');
      if (metricType) {
        // Find and click the corresponding nav item
        const navItem = document.querySelector(`.nav-item[data-tab="${metricType}"]`);
        if (navItem) {
          navItem.click();
        }
      }
    }
  });
}

// Clear previous results
function clearResults() {
  // Clear overview tabs
  document.getElementById('page-url').textContent = '';
  document.getElementById('origin-url').textContent = '';
  document.getElementById('page-overview-metrics').innerHTML = '';
  document.getElementById('origin-overview-metrics').innerHTML = '';

  // Clear detail tabs
  document.getElementById('page-ttfb-detail').innerHTML = '';
  document.getElementById('origin-ttfb-detail').innerHTML = '';
  document.getElementById('page-cls-detail').innerHTML = '';
  document.getElementById('origin-cls-detail').innerHTML = '';
  document.getElementById('page-inp-detail').innerHTML = '';
  document.getElementById('origin-inp-detail').innerHTML = '';

  // Clear crawlability tab
  document.getElementById('crawl-status-card').innerHTML = '';
  document.getElementById('bots-summary').innerHTML = '';
  document.getElementById('bots-list').innerHTML = '';
  const botTable = document.getElementById('bot-ttfb-table');
  if (botTable) {
    botTable.innerHTML = '';
  }
  showBotTtfbError('');
  setBotTtfbLoading(false);
  lastBotTtfbData = null;
  const updatedEl = document.getElementById('bot-ttfb-updated');
  if (updatedEl) {
    updatedEl.textContent = '';
  }

  lastReportData = null;
  setDownloadButtonEnabled(false);
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('error');
  const errorText = document.getElementById('error-text');
  errorText.textContent = message;
  errorDiv.classList.remove('hidden');

  document.getElementById('loading').classList.add('hidden');
  showBotTtfbError('');
  setBotTtfbLoading(false);
  lastBotTtfbData = null;
  const updatedEl = document.getElementById('bot-ttfb-updated');
  if (updatedEl) {
    updatedEl.textContent = '';
  }
  lastReportData = null;
  setDownloadButtonEnabled(false);
}

// Show results
function showResults(pageData, originData) {
  const pageUrlDiv = document.getElementById('page-url');
  const originUrlDiv = document.getElementById('origin-url');

  // Display URLs
  pageUrlDiv.textContent = pageData.url;
  originUrlDiv.textContent = originData.url;

  // Overview tab - Page metrics
  const pageOverviewDiv = document.getElementById('page-overview-metrics');
  if (pageData.metrics && (pageData.metrics.ttfb !== null || pageData.metrics.cls !== null || pageData.metrics.inp !== null)) {
    pageOverviewDiv.innerHTML = createOverviewMetricsHTML(pageData.metrics);
  } else {
    pageOverviewDiv.innerHTML = '<p class="no-data">No CrUX data available for this specific page. This is common for pages with low traffic. Check the website-level results below.</p>';
  }

  // Overview tab - Origin metrics
  const originOverviewDiv = document.getElementById('origin-overview-metrics');
  if (originData.metrics && (originData.metrics.ttfb !== null || originData.metrics.cls !== null || originData.metrics.inp !== null)) {
    originOverviewDiv.innerHTML = createOverviewMetricsHTML(originData.metrics);
  } else {
    originOverviewDiv.innerHTML = '<p class="no-data">No CrUX data available for this website.</p>';
  }

  // Detail tabs - TTFB
  document.getElementById('page-ttfb-detail').innerHTML = createDetailMetricCard(pageData.metrics, 'ttfb');
  document.getElementById('origin-ttfb-detail').innerHTML = createDetailMetricCard(originData.metrics, 'ttfb');

  // Detail tabs - CLS
  document.getElementById('page-cls-detail').innerHTML = createDetailMetricCard(pageData.metrics, 'cls');
  document.getElementById('origin-cls-detail').innerHTML = createDetailMetricCard(originData.metrics, 'cls');

  // Detail tabs - INP
  document.getElementById('page-inp-detail').innerHTML = createDetailMetricCard(pageData.metrics, 'inp');
  document.getElementById('origin-inp-detail').innerHTML = createDetailMetricCard(originData.metrics, 'inp');

  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');
}

function setBotTtfbLoading(isLoading) {
  const loadingEl = document.getElementById('bot-ttfb-loading');
  if (!loadingEl) return;
  loadingEl.classList.toggle('hidden', !isLoading);
}

function showBotTtfbError(message) {
  const errorEl = document.getElementById('bot-ttfb-error');
  if (!errorEl) return;
  if (message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  } else {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }
}

function renderBotTtfbLoading() {
  const tableEl = document.getElementById('bot-ttfb-table');
  if (!tableEl) return;

  const companies = {};
  BOT_TTFB_PROFILES.forEach(bot => {
    if (!companies[bot.company]) {
      companies[bot.company] = [];
    }
    companies[bot.company].push(bot);
  });

  let html = '';
  Object.keys(companies).forEach(company => {
    html += `
      <div class="bot-ttfb-company">
        <h4>${company}</h4>
        <div class="bot-ttfb-grid">
          <div class="bot-ttfb-row">
            <div class="bot-ttfb-cell bot-ttfb-header">Bot</div>
            <div class="bot-ttfb-cell bot-ttfb-header">TTFB</div>
            <div class="bot-ttfb-cell bot-ttfb-header">Status</div>
          </div>
    `;

    companies[company].forEach(bot => {
      html += `
        <div class="bot-ttfb-row" data-bot-key="${bot.key}">
          <div class="bot-ttfb-cell">
            <strong>${bot.label}</strong>
          </div>
          <div class="bot-ttfb-cell">
            <span class="bot-ttfb-loading">Testing...</span>
          </div>
          <div class="bot-ttfb-cell">
            <span class="bot-ttfb-loading">—</span>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  tableEl.innerHTML = html;
}

function renderBotTtfbResults(results) {
  const tableEl = document.getElementById('bot-ttfb-table');
  if (!tableEl) return;

  const updatedEl = document.getElementById('bot-ttfb-updated');
  if (updatedEl && lastBotTtfbData?.generatedAt) {
    updatedEl.textContent = `Last updated: ${formatDateTime(lastBotTtfbData.generatedAt)}`;
  } else if (updatedEl) {
    updatedEl.textContent = '';
  }

  if (!Array.isArray(results) || results.length === 0) {
    tableEl.innerHTML = '<div class="bot-ttfb-status">No bot TTFB data available.</div>';
    return;
  }

  // Update results (called progressively as batches complete)
  results.forEach((result) => {
    const row = tableEl.querySelector(`[data-bot-key="${result.botKey}"]`);
    if (!row) return;

    // Skip if already rendered (check if it still has loading class)
    const loadingSpan = row.querySelector('.bot-ttfb-loading');
    if (!loadingSpan) return; // Already rendered

    const cells = row.querySelectorAll('.bot-ttfb-cell');
    let ttfbContent = '—';
    let statusContent = '—';
    let meta = '';

    if (result.error) {
      ttfbContent = '<span class="bot-ttfb-badge" style="color:#F44336;">Error</span>';
      statusContent = 'Failed';
      meta = result.error;
    } else if (typeof result.ttfbMs === 'number') {
      const category = getTTFBCategory(result.ttfbMs);
      const color = category?.color || '#25995c';
      ttfbContent = `
        <span class="bot-ttfb-badge" style="color:${color};">
          ${result.ttfbMs} ms
        </span>
        <div class="bot-ttfb-meta">${category.name}${category.grade ? ` (${category.grade})` : ''}</div>
      `;
      statusContent = result.status ? `HTTP ${result.status}` : 'OK';
      if (result.cached) {
        meta = 'Cached (last 5 min)';
      }
    }

    // Update the cells
    if (cells[0]) {
      cells[0].innerHTML = `
        <strong>${result.label}</strong>
        ${meta ? `<div class="bot-ttfb-meta">${meta}</div>` : ''}
      `;
    }
    if (cells[1]) {
      cells[1].innerHTML = ttfbContent;
    }
    if (cells[2]) {
      cells[2].innerHTML = statusContent;
    }

    // Add fade-in animation
    row.style.opacity = '0.5';
    setTimeout(() => {
      row.style.transition = 'opacity 0.3s ease-in';
      row.style.opacity = '1';
    }, 10);
  });
}

async function fetchBotTtfb(url) {
  if (!CONFIG.BOT_PROBE_URL || CONFIG.BOT_PROBE_URL === 'REPLACE_WITH_YOUR_BOT_PROBE_URL') {
    showBotTtfbError('Bot TTFB probe URL not configured.');
    return null;
  }

  try {
    setBotTtfbLoading(false);
    showBotTtfbError('');
    renderBotTtfbLoading(); // Show skeleton with "Testing..." for each bot

    // Split bots into batches of 2 for reliability
    const BATCH_SIZE = 2;
    const batches = [];
    for (let i = 0; i < BOT_TTFB_PROFILES.length; i += BATCH_SIZE) {
      batches.push(BOT_TTFB_PROFILES.slice(i, i + BATCH_SIZE));
    }

    const allResults = [];
    let hasError = false;

    // Fetch batches sequentially and update UI progressively
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const botKeys = batch.map(bot => bot.key);

      try {
        const response = await fetch(`${CONFIG.BOT_PROBE_URL}/probe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url, botKeys })
        });

        if (!response.ok) {
          throw new Error(`Batch ${batchIndex + 1} failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || `Batch ${batchIndex + 1} failed.`);
        }

        // Add results from this batch
        if (data.results && data.results.length > 0) {
          allResults.push(...data.results);

          // Update UI progressively with current results
          lastBotTtfbData = {
            generatedAt: data.generatedAt,
            results: allResults
          };
          renderBotTtfbResults(allResults);
        }
      } catch (error) {
        console.error(`Batch ${batchIndex + 1} error:`, error);
        hasError = true;

        // Add error entries for failed batch
        batch.forEach(bot => {
          allResults.push({
            botKey: bot.key,
            company: bot.company,
            label: bot.label,
            error: error.message || 'Request failed',
            cached: false
          });
        });

        // Still update UI with partial results
        renderBotTtfbResults(allResults);
      }
    }

    lastBotTtfbData = {
      generatedAt: new Date().toISOString(),
      results: allResults
    };

    if (hasError && allResults.length === 0) {
      showBotTtfbError('All bot probes failed. Please try again.');
      return null;
    }

    return allResults;
  } catch (error) {
    console.error('Bot TTFB probe error:', error);
    showBotTtfbError(error.message || 'Failed to fetch bot TTFB.');
    return null;
  } finally {
    setBotTtfbLoading(false);
  }
}

async function runBotProbe(url) {
  const results = await fetchBotTtfb(url);
  if (results) {
    renderBotTtfbResults(results);
  } else {
    renderBotTtfbResults([]);
  }

  if (lastReportData) {
    lastReportData.botTtfb = lastBotTtfbData;
  }
}

function setDownloadButtonEnabled(enabled) {
  const downloadButton = document.getElementById('download-pdf-button');
  if (!downloadButton) return;
  downloadButton.disabled = !enabled;
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function buildReportFileName(reportData) {
  let host = 'report';
  try {
    host = new URL(reportData.pageData.url).hostname;
  } catch (error) {
    host = 'report';
  }
  const dateStamp = new Date(reportData.generatedAt).toISOString().slice(0, 10);
  return `ai-visibility-report_${host}_${dateStamp}.pdf`;
}

function formatMetricSummary(metricType, metrics) {
  const labelMap = {
    ttfb: 'TTFB',
    cls: 'CLS',
    inp: 'INP'
  };

  const label = labelMap[metricType] || metricType.toUpperCase();

  if (!metrics || metrics[metricType] === null || metrics[metricType] === undefined) {
    return `${label}: No data`;
  }

  if (metricType === 'ttfb') {
    const category = getTTFBCategory(metrics.ttfb);
    const gradeText = category.grade ? `, ${category.grade}` : '';
    return `${label}: ${metrics.ttfb}ms (${category.name}${gradeText})`;
  }

  if (metricType === 'cls') {
    const clsValue = Number(metrics.cls).toFixed(3);
    const category = getCLSCategory(metrics.cls);
    const gradeText = category.grade ? `, ${category.grade}` : '';
    return `${label}: ${clsValue} (${category.name}${gradeText})`;
  }

  if (metricType === 'inp') {
    const category = getINPCategory(metrics.inp);
    const gradeText = category.grade ? `, ${category.grade}` : '';
    return `${label}: ${metrics.inp}ms (${category.name}${gradeText})`;
  }

  return `${label}: ${metrics[metricType]}`;
}

function wrapText(text, font, fontSize, maxWidth) {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  const splitLongWord = (word) => {
    const parts = [];
    let chunk = '';
    for (const char of word) {
      const testChunk = chunk + char;
      if (font.widthOfTextAtSize(testChunk, fontSize) <= maxWidth) {
        chunk = testChunk;
      } else {
        if (chunk) parts.push(chunk);
        chunk = char;
      }
    }
    if (chunk) parts.push(chunk);
    return parts;
  };

  words.forEach(word => {
    if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
      const longParts = splitLongWord(word);
      longParts.forEach(part => {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        lines.push(part);
      });
      return;
    }

    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function addLinkAnnotation(page, pdfDoc, x, y, width, height, url) {
  if (!url) return;

  const { PDFName, PDFArray, PDFString } = PDFLib;
  const context = pdfDoc.context;

  const linkAnnotation = context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of(url)
    }
  });

  const linkAnnotationRef = context.register(linkAnnotation);

  let annots = page.node.lookup(PDFName.of('Annots'), PDFArray);
  if (!annots) {
    annots = context.obj([]);
    page.node.set(PDFName.of('Annots'), annots);
  }

  annots.push(linkAnnotationRef);
}

function hexToRgb(hex) {
  if (!hex) return null;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length !== 6) return null;
  const num = parseInt(cleanHex, 16);
  if (Number.isNaN(num)) return null;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

async function generatePdfReport(reportData) {
  if (!window.PDFLib || !PDFLib.PDFDocument) {
    throw new Error('PDF library not loaded.');
  }

  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const pageSize = [612, 792];
  let page = pdfDoc.addPage(pageSize);
  const pageWidth = pageSize[0];
  const pageHeight = pageSize[1];
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  let y = pageHeight - margin;

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const colors = {
    text: rgb(0.06, 0.07, 0.09),
    muted: rgb(0.4, 0.4, 0.4),
    accent: rgb(0.145, 0.6, 0.36),
    line: rgb(0.86, 0.88, 0.9)
  };

  const lineGap = 1.2;

  const addPage = () => {
    page = pdfDoc.addPage(pageSize);
    y = pageHeight - margin;
  };

  const ensureSpace = (heightNeeded) => {
    if (y - heightNeeded < margin) {
      addPage();
    }
  };

  const drawTextLine = (text, size, font, color) => {
    const lineHeight = size * lineGap;
    ensureSpace(lineHeight);
    page.drawText(text, {
      x: margin,
      y: y - size,
      size,
      font,
      color
    });
    y -= lineHeight;
  };

  const drawParagraph = (text, size, font, color) => {
    const lines = wrapText(text, font, size, contentWidth);
    lines.forEach(line => drawTextLine(line, size, font, color));
  };

  const drawWrappedTextAt = (text, x, yTop, size, font, color, maxWidth) => {
    const lines = wrapText(text, font, size, maxWidth);
    let cursor = yTop;
    lines.forEach(line => {
      page.drawText(line, {
        x,
        y: cursor - size,
        size,
        font,
        color
      });
      cursor -= size * lineGap;
    });
    return cursor;
  };

  const drawDivider = () => {
    ensureSpace(12);
    page.drawLine({
      start: { x: margin, y: y - 4 },
      end: { x: pageWidth - margin, y: y - 4 },
      thickness: 1,
      color: colors.line
    });
    y -= 14;
  };

  const drawSectionTitle = (title) => {
    drawTextLine(title, 12, fontBold, colors.accent);
    y -= 2;
  };

  const drawMetricCard = (title, metrics, metricType, x, yTop, width, height) => {
    const baseColor = rgb(0.95, 0.96, 0.97);
    const borderColor = colors.line;
    let valueText = 'No data';
    let badgeText = 'No data';
    let headerColor = rgb(0.63, 0.65, 0.68);
    let valueColor = colors.text;
    let unitText = '';

    if (metrics && metrics[metricType] !== null && metrics[metricType] !== undefined) {
      let category = null;
      if (metricType === 'ttfb') {
        category = getTTFBCategory(metrics.ttfb);
        valueText = `${metrics.ttfb}`;
        unitText = 'ms';
      } else if (metricType === 'cls') {
        category = getCLSCategory(metrics.cls);
        valueText = Number(metrics.cls).toFixed(3);
      } else if (metricType === 'inp') {
        category = getINPCategory(metrics.inp);
        valueText = `${metrics.inp}`;
        unitText = 'ms';
      }

      if (category) {
        const rgbColor = hexToRgb(category.color);
        headerColor = rgbColor ? rgb(rgbColor.r, rgbColor.g, rgbColor.b) : colors.accent;
        badgeText = category.grade ? `${category.name} (${category.grade})` : category.name;
        valueColor = headerColor;
      }
    }

    page.drawRectangle({
      x,
      y: yTop - height,
      width,
      height,
      color: baseColor,
      borderColor,
      borderWidth: 1
    });

    const headerHeight = 14;
    page.drawRectangle({
      x,
      y: yTop - headerHeight,
      width,
      height: headerHeight,
      color: headerColor
    });

    page.drawText(title, {
      x: x + 8,
      y: yTop - headerHeight + 3,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText(badgeText, {
      x: x + 8,
      y: yTop - headerHeight - 9,
      size: 7,
      font: fontRegular,
      color: colors.muted
    });

    page.drawText(valueText, {
      x: x + 8,
      y: yTop - headerHeight - 26,
      size: 14,
      font: fontBold,
      color: valueColor
    });

    if (unitText) {
      const valueWidth = fontBold.widthOfTextAtSize(valueText, 14);
      page.drawText(unitText, {
        x: x + 8 + valueWidth + 4,
        y: yTop - headerHeight - 22,
        size: 8,
        font: fontRegular,
        color: colors.muted
      });
    }
  };

  const drawMetricRow = (metricType, metricLabel) => {
    const rowHeight = 58;
    const gap = 12;
    const cardWidth = (contentWidth - gap) / 2;
    const labelHeight = 10 * lineGap;
    ensureSpace(rowHeight + labelHeight + 8);

    drawTextLine(metricLabel, 10, fontBold, colors.text);
    const rowTop = y;

    drawMetricCard('Page', reportData.pageData.metrics, metricType, margin, rowTop, cardWidth, rowHeight);
    drawMetricCard('Website', reportData.originData.metrics, metricType, margin + cardWidth + gap, rowTop, cardWidth, rowHeight);

    y = rowTop - rowHeight - 12;
  };

  drawTextLine('AI & LLM Visibility Validator', 16, fontBold, colors.accent);
  drawTextLine('AI Visibility Report', 10, fontRegular, colors.muted);
  drawDivider();

  drawSectionTitle('Report Details');
  drawTextLine(`Generated: ${formatDateTime(reportData.generatedAt)}`, 9, fontRegular, colors.text);
  drawParagraph(`Report URL: ${reportData.pageData.url}`, 9, fontRegular, colors.text);
  drawParagraph(`Origin: ${reportData.originData.url}`, 9, fontRegular, colors.text);
  drawTextLine('Source: Chrome UX Report (CrUX), p75 desktop', 9, fontRegular, colors.muted);
  drawDivider();

  drawSectionTitle('Performance Metrics');
  drawMetricRow('ttfb', 'Time To First Byte (TTFB)');
  drawMetricRow('cls', 'Cumulative Layout Shift (CLS)');
  drawMetricRow('inp', 'Interaction to Next Paint (INP)');
  drawDivider();

  drawSectionTitle('Simulated Bot TTFB');
  if (reportData.botTtfb && Array.isArray(reportData.botTtfb.results) && reportData.botTtfb.results.length > 0) {
    const groupedBots = {};
    reportData.botTtfb.results.forEach(result => {
      if (!groupedBots[result.company]) {
        groupedBots[result.company] = [];
      }
      groupedBots[result.company].push(result);
    });

    Object.keys(groupedBots).forEach(company => {
      drawTextLine(company, 9, fontBold, colors.text);
      groupedBots[company].forEach(result => {
        let detailText = `${result.label}: `;
        if (result.error) {
          detailText += 'Error';
        } else if (typeof result.ttfbMs === 'number') {
          const category = getTTFBCategory(result.ttfbMs);
          const gradeLabel = category.grade ? ` ${category.grade}` : '';
          detailText += `${result.ttfbMs}ms (${category.name}${gradeLabel})`;
        } else {
          detailText += 'No data';
        }
        drawTextLine(detailText, 8, fontRegular, colors.muted);
      });
    });
  } else {
    drawTextLine('Bot TTFB data unavailable.', 9, fontRegular, colors.muted);
  }

  drawDivider();

  drawSectionTitle('AI Bot Crawlability');
  if (reportData.crawlData) {
    drawTextLine(`Robots.txt: ${reportData.crawlData.robotsExists ? 'Found' : 'Not Found'}`, 9, fontRegular, colors.text);
    drawTextLine(`Allowed bots: ${reportData.crawlData.summary.allowed} / ${reportData.crawlData.summary.total}`, 9, fontRegular, colors.text);

    if (reportData.crawlData.summary.blocked > 0) {
      const blockedBots = reportData.crawlData.bots
        .filter(bot => !bot.allowed)
        .map(bot => bot.userAgent)
        .join(', ');
      drawParagraph(`Blocked bots (${reportData.crawlData.summary.blocked}): ${blockedBots}`, 9, fontRegular, colors.text);
    } else {
      drawTextLine('Blocked bots: None', 9, fontRegular, colors.text);
    }

    if (!reportData.crawlData.robotsExists) {
      drawTextLine('Note: No robots.txt found. Default allow applies.', 9, fontRegular, colors.muted);
    }
  } else {
    drawTextLine('Crawlability data unavailable.', 9, fontRegular, colors.muted);
  }

  drawDivider();
  const ctaHeight = 96;
  const ctaPadding = 12;
  ensureSpace(ctaHeight + 12);

  const ctaTop = y;
  const ctaBottom = ctaTop - ctaHeight;

  page.drawRectangle({
    x: margin,
    y: ctaBottom,
    width: contentWidth,
    height: ctaHeight,
    color: rgb(0.95, 0.98, 0.96),
    borderColor: colors.accent,
    borderWidth: 1
  });

  const ctaContentX = margin + ctaPadding;
  const ctaContentWidth = contentWidth - ctaPadding * 2;
  let ctaCursor = ctaTop - ctaPadding;

  ctaCursor = drawWrappedTextAt('Need Help?', ctaContentX, ctaCursor, 11, fontBold, colors.accent, ctaContentWidth);
  ctaCursor = drawWrappedTextAt('Hi, I\'m Andre Guelmann, an SEO & Website Growth expert with more than 15 years of successfully helping companies and startups of all sizes improve their visibility through Technical SEO and Website Optimization.', ctaContentX, ctaCursor, 9, fontRegular, colors.text, ctaContentWidth);
  ctaCursor -= 4;
  ctaCursor = drawWrappedTextAt('If you need help understanding or improving these numbers, get in touch and let\'s see if I can help you.', ctaContentX, ctaCursor, 9, fontRegular, colors.text, ctaContentWidth);

  const buttonLabel = 'Get In Touch';
  const buttonUrl = 'https://andrglmn.me/AI-Extension-Contact';
  const buttonHeight = 20;
  const buttonWidth = 132;
  const buttonX = ctaContentX;
  const buttonY = ctaBottom + ctaPadding;

  page.drawRectangle({
    x: buttonX,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight,
    color: colors.accent,
    borderColor: colors.accent,
    borderWidth: 1
  });

  const buttonTextWidth = fontBold.widthOfTextAtSize(buttonLabel, 9);
  const buttonTextX = buttonX + (buttonWidth - buttonTextWidth) / 2;
  const buttonTextY = buttonY + (buttonHeight - 9) / 2 + 1;

  page.drawText(buttonLabel, {
    x: buttonTextX,
    y: buttonTextY,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  addLinkAnnotation(page, pdfDoc, buttonX, buttonY, buttonWidth, buttonHeight, buttonUrl);

  y = ctaBottom - 18;

  drawDivider();
  const toolUrl = 'https://ai-check.andreguelmann.com/';
  const footerText = `Report generated by ${toolUrl}`;
  drawTextLine(footerText, 8, fontRegular, colors.muted);
  const footerTextWidth = fontRegular.widthOfTextAtSize(footerText, 8);
  const footerY = y + 8 * lineGap - 8;
  addLinkAnnotation(page, pdfDoc, margin, footerY, footerTextWidth, 10, toolUrl);

  return await pdfDoc.save();
}

async function downloadPdfReport() {
  if (!lastReportData) {
    showError('Run an analysis first to generate a PDF report.');
    return;
  }

  const downloadButton = document.getElementById('download-pdf-button');
  const originalLabel = downloadButton ? downloadButton.textContent : null;

  if (downloadButton) {
    downloadButton.disabled = true;
    downloadButton.textContent = 'Generating PDF...';
  }

  try {
    const pdfBytes = await generatePdfReport(lastReportData);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildReportFileName(lastReportData);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF generation failed:', error);
    showError('Failed to generate PDF. Please try again.');
  } finally {
    if (downloadButton) {
      downloadButton.disabled = false;
      downloadButton.textContent = originalLabel || 'Download PDF';
    }
  }
}

// Parse robots.txt content into structured rules
function parseRobotsTxt(content) {
  const lines = content.split('\n');
  const rules = [];
  let currentUserAgent = null;

  for (let line of lines) {
    line = line.trim();

    // Skip comments and empty lines
    if (line.startsWith('#') || line === '') continue;

    const lowerLine = line.toLowerCase();

    if (lowerLine.startsWith('user-agent:')) {
      currentUserAgent = line.substring(11).trim();
    } else if (lowerLine.startsWith('disallow:') && currentUserAgent) {
      const path = line.substring(9).trim();
      rules.push({
        userAgent: currentUserAgent,
        directive: 'Disallow',
        path: path
      });
    } else if (lowerLine.startsWith('allow:') && currentUserAgent) {
      const path = line.substring(6).trim();
      rules.push({
        userAgent: currentUserAgent,
        directive: 'Allow',
        path: path
      });
    }
  }

  return rules;
}

// Check if a bot is blocked by robots.txt rules
function isBotBlocked(botUserAgent, rules) {
  // Find rules that apply to this bot or to all bots (*)
  const applicableRules = rules.filter(rule =>
    rule.userAgent === '*' ||
    rule.userAgent.toLowerCase() === botUserAgent.toLowerCase()
  );

  // If no rules, bot is allowed
  if (applicableRules.length === 0) {
    return false;
  }

  // Check for disallow rules
  // If there's a "Disallow: /" rule, the bot is blocked from the entire site
  const hasFullDisallow = applicableRules.some(rule =>
    rule.directive === 'Disallow' && rule.path === '/'
  );

  // Check for empty disallow (allows everything)
  const hasEmptyDisallow = applicableRules.some(rule =>
    rule.directive === 'Disallow' && rule.path === ''
  );

  if (hasEmptyDisallow) {
    return false; // Empty disallow means allow all
  }

  if (hasFullDisallow) {
    // Check if there are any Allow rules that override
    const hasAllowOverride = applicableRules.some(rule =>
      rule.directive === 'Allow' && rule.path !== ''
    );

    return !hasAllowOverride; // Blocked unless there's an allow override
  }

  // Check if there's an explicit "Allow: /" rule (bot is explicitly allowed)
  const hasFullAllow = applicableRules.some(rule =>
    rule.directive === 'Allow' && rule.path === '/'
  );

  if (hasFullAllow) {
    return false; // Explicitly allowed
  }

  // If there are only specific disallow rules (not "Disallow: /"),
  // the bot is NOT blocked from the site (just from those specific paths)
  // We only consider a bot "blocked" if there's "Disallow: /" without an override
  return false;
}

// Fetch robots.txt via proxy
async function fetchRobotsTxt(robotsUrl) {
  if (!CONFIG.ROBOTS_PROXY_URL || CONFIG.ROBOTS_PROXY_URL === 'REPLACE_WITH_YOUR_CLOUD_FUNCTION_URL') {
    throw new Error('Robots proxy URL not configured. Please update config.js with your deployed function URL.');
  }

  const response = await fetch(CONFIG.ROBOTS_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'fetchRobotsTxt',
      url: robotsUrl
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch robots.txt: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch robots.txt');
  }

  return data.text;
}

// Analyze crawlability
async function analyzeCrawlability(url) {
  try {
    // Construct robots.txt URL
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    // Fetch robots.txt
    let robotsContent;
    try {
      robotsContent = await fetchRobotsTxt(robotsUrl);
    } catch (error) {
      // No robots.txt found - all bots allowed
      return {
        robotsExists: false,
        robotsUrl: robotsUrl,
        bots: AI_BOTS.map(bot => ({
          ...bot,
          allowed: true,
          reason: 'No robots.txt found (default allow)'
        })),
        summary: {
          total: AI_BOTS.length,
          allowed: AI_BOTS.length,
          blocked: 0
        }
      };
    }

    // Parse robots.txt
    const rules = parseRobotsTxt(robotsContent);

    // Analyze each bot
    const analyzedBots = AI_BOTS.map(bot => {
      const blocked = isBotBlocked(bot.userAgent, rules);
      return {
        ...bot,
        allowed: !blocked,
        reason: blocked ? 'Blocked by robots.txt' : 'Allowed'
      };
    });

    // Calculate summary
    const allowedCount = analyzedBots.filter(bot => bot.allowed).length;
    const blockedCount = analyzedBots.filter(bot => !bot.allowed).length;

    return {
      robotsExists: true,
      robotsUrl: robotsUrl,
      robotsContent: robotsContent,
      bots: analyzedBots,
      summary: {
        total: AI_BOTS.length,
        allowed: allowedCount,
        blocked: blockedCount
      }
    };

  } catch (error) {
    console.error('Error analyzing crawlability:', error);
    throw error;
  }
}

// Render crawlability results
function renderCrawlabilityResults(crawlData) {
  // Render status card
  const statusCard = document.getElementById('crawl-status-card');
  statusCard.innerHTML = `
    <h3>Robots.txt Status</h3>
    <p><strong>Status:</strong> ${crawlData.robotsExists ? 'Found' : 'Not Found'}</p>
    <p><strong>URL:</strong> <a href="${crawlData.robotsUrl}" target="_blank">${crawlData.robotsUrl}</a></p>
    ${!crawlData.robotsExists ? '<p><em>No robots.txt file found. All bots are allowed by default.</em></p>' : ''}
  `;

  // Render summary
  const summaryDiv = document.getElementById('bots-summary');
  summaryDiv.innerHTML = `
    <div class="summary-card">
      <h4>Total Bots</h4>
      <div class="summary-value">${crawlData.summary.total}</div>
    </div>
    <div class="summary-card allowed">
      <h4>Allowed</h4>
      <div class="summary-value">${crawlData.summary.allowed}</div>
    </div>
    <div class="summary-card blocked">
      <h4>Blocked</h4>
      <div class="summary-value">${crawlData.summary.blocked}</div>
    </div>
  `;

  // Group bots by company
  const botsByCompany = {};
  crawlData.bots.forEach(bot => {
    if (!botsByCompany[bot.company]) {
      botsByCompany[bot.company] = [];
    }
    botsByCompany[bot.company].push(bot);
  });

  // Render bots list
  const botsListDiv = document.getElementById('bots-list');
  let botsHTML = '';

  for (const company in botsByCompany) {
    botsHTML += `
      <div class="company-group">
        <div class="company-header">${company}</div>
    `;

    botsByCompany[company].forEach(bot => {
      botsHTML += `
        <div class="bot-item">
          <div class="bot-info">
            <div class="bot-name">${bot.userAgent}</div>
            <div class="bot-product">${bot.product}</div>
          </div>
          <div class="bot-status ${bot.allowed ? 'allowed' : 'blocked'}">
            ${bot.allowed ? 'Allowed' : 'Blocked'}
          </div>
        </div>
      `;
    });

    botsHTML += `</div>`;
  }

  botsListDiv.innerHTML = botsHTML;
}


// Check crawlability
async function checkCrawlability(url) {
  try {
    const crawlData = await analyzeCrawlability(url);
    renderCrawlabilityResults(crawlData);
    return crawlData;
  } catch (error) {
    console.error('Error checking crawlability:', error);
    // Show error in the crawlability tab
    document.getElementById('crawl-status-card').innerHTML = `
      <h3>Error</h3>
      <p style="color: #F44336;">Failed to check crawlability: ${error.message}</p>
    `;
    document.getElementById('bots-summary').innerHTML = '';
    document.getElementById('bots-list').innerHTML = '';
    return null;
  }
}

// Main check function
async function checkAIVisibility() {
  const loadingDiv = document.getElementById('loading');
  const urlInput = document.getElementById('url-input');

  // Clear previous results
  clearResults();

  // Show loading
  loadingDiv.classList.remove('hidden');
  document.getElementById('error').classList.add('hidden');

  try {
    // Get URL from input field
    let currentUrl = urlInput.value.trim();

    // Validate URL
    if (!currentUrl) {
      showError('Please enter a URL');
      return;
    }

    // Add https:// if no protocol specified
    if (!currentUrl.match(/^https?:\/\//i)) {
      currentUrl = 'https://' + currentUrl;
      urlInput.value = currentUrl; // Update input field with full URL
    }

    try {
      new URL(currentUrl); // Validate URL format
    } catch (error) {
      showError('Please enter a valid URL (e.g., example.com or https://example.com)');
      return;
    }

    // Extract origin from URL
    const urlObj = new URL(currentUrl);
    const origin = urlObj.origin;

    // Query CrUX API for both page and origin, and bot TTFB in parallel
    const [pageResponse, originResponse, botProbeResponse, crawlResponse] = await Promise.allSettled([
      queryCruxAPI(currentUrl, 'DESKTOP'),
      queryCruxAPI(origin, 'DESKTOP'),
      fetchBotTtfb(currentUrl),
      checkCrawlability(origin)
    ]);

    const pageData = {
      url: currentUrl,
      metrics: pageResponse.status === 'fulfilled' ? extractMetrics(pageResponse.value) : { ttfb: null, cls: null, inp: null }
    };

    const originData = {
      url: origin,
      metrics: originResponse.status === 'fulfilled' ? extractMetrics(originResponse.value) : { ttfb: null, cls: null, inp: null }
    };

    // Show results even if one or both failed
    const hasPageData = pageData.metrics.ttfb !== null || pageData.metrics.cls !== null || pageData.metrics.inp !== null;
    const hasOriginData = originData.metrics.ttfb !== null || originData.metrics.cls !== null || originData.metrics.inp !== null;

    if (!hasPageData && !hasOriginData) {
      showError('No CrUX data available for this website. This typically means the site doesn\'t have enough traffic to be included in the Chrome UX Report. CrUX requires a minimum threshold of real-user visits.');
    } else {
      showResults(pageData, originData);
    }

    let crawlData = null;
    if (crawlResponse.status === 'fulfilled') {
      crawlData = crawlResponse.value;
    }

    if (botProbeResponse.status === 'fulfilled') {
      renderBotTtfbResults(botProbeResponse.value || []);
    } else {
      renderBotTtfbResults([]);
    }

    if (hasPageData || hasOriginData) {
      lastReportData = {
        generatedAt: new Date().toISOString(),
        pageData,
        originData,
        crawlData,
        botTtfb: lastBotTtfbData
      };
      setDownloadButtonEnabled(true);
    }

  } catch (error) {
    console.error('Error checking AI visibility:', error);
    showError(`An error occurred: ${error.message || 'Please try again.'}`);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  setupTabSwitching();

  const checkButton = document.getElementById('check-button');
  const urlInput = document.getElementById('url-input');
  const downloadButton = document.getElementById('download-pdf-button');
  const botRetryButton = document.getElementById('bot-ttfb-retry');

  // Check on button click
  checkButton.addEventListener('click', checkAIVisibility);

  if (downloadButton) {
    downloadButton.addEventListener('click', downloadPdfReport);
  }

  if (botRetryButton) {
    botRetryButton.addEventListener('click', async () => {
      let currentUrl = urlInput.value.trim();
      if (!currentUrl) {
        showBotTtfbError('Enter a URL to run the bot probe.');
        return;
      }
      if (!currentUrl.match(/^https?:\/\//i)) {
        currentUrl = 'https://' + currentUrl;
      }
      try {
        new URL(currentUrl);
      } catch (error) {
        showBotTtfbError('Enter a valid URL to run the bot probe.');
        return;
      }
      await runBotProbe(currentUrl);
    });
  }

  setDownloadButtonEnabled(false);

  // Check on Enter key
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkAIVisibility();
    }
  });

  // Check if URL parameter is provided (from landing page)
  const urlParams = new URLSearchParams(window.location.search);
  const urlParam = urlParams.get('url');

  if (urlParam) {
    urlInput.value = urlParam;
    // Auto-run check
    setTimeout(() => {
      checkAIVisibility();
    }, 300);
  }
});
