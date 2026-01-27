// Configuration loaded from config.js
// API calls now go through Cloud Function proxy for security

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
    maxValue: 0.1,
    color: '#25995c',
    description: 'High Vector Integrity',
    impact: 'Stable DOM allows RAG systems to chunk text properly for vector databases.',
    primaryImpact: 'For AI, CLS is about semantic continuity. High CLS means dynamic elements inject tags that break paragraphs, confusing RAG parsers and splitting answers into disconnected pieces.'
  },
  {
    name: 'Needs Improvement',
    minValue: 0.1,
    maxValue: 0.25,
    color: '#FFC107',
    description: 'Parsing Risk',
    impact: 'Dynamic content may interrupt text stream and risk retrieval failure.',
    primaryImpact: 'AI bots dislike layout shifts because they break code structure. RAG systems chunk content based on HTML tags like &lt;p&gt; and &lt;div&gt;.'
  },
  {
    name: 'Poor',
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
    maxMs: 200,
    color: '#25995c',
    description: 'Agentic Success',
    impact: 'Required for autonomous agents. Fast response confirms actions succeeded.',
    primaryImpact: 'Irrelevant for read-only bots (GPTBot, Perplexity). Critical for Agentic AI (OpenAI Operator) that performs tasks like booking flights.'
  },
  {
    name: 'Poor',
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

// Main check function
async function checkAIVisibility() {
  const loadingDiv = document.getElementById('loading');
  const urlInput = document.getElementById('url-input');

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
