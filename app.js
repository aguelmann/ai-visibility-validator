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
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('error');
  const errorText = document.getElementById('error-text');
  errorText.textContent = message;
  errorDiv.classList.remove('hidden');

  document.getElementById('loading').classList.add('hidden');
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
  } catch (error) {
    console.error('Error checking crawlability:', error);
    // Show error in the crawlability tab
    document.getElementById('crawl-status-card').innerHTML = `
      <h3>Error</h3>
      <p style="color: #F44336;">Failed to check crawlability: ${error.message}</p>
    `;
    document.getElementById('bots-summary').innerHTML = '';
    document.getElementById('bots-list').innerHTML = '';
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

    // Query CrUX API for both page and origin
    const [pageResponse, originResponse] = await Promise.allSettled([
      queryCruxAPI(currentUrl, 'DESKTOP'),
      queryCruxAPI(origin, 'DESKTOP')
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

    // Check crawlability (run regardless of CrUX data availability)
    await checkCrawlability(origin);

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

  // Check on button click
  checkButton.addEventListener('click', checkAIVisibility);

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
