# Testing Guide for Crawlability Feature

## Prerequisites

Before testing, ensure:
1. Cloud Function is deployed with updated code
2. `config.js` has correct `ROBOTS_PROXY_URL`
3. Web tool is running (locally or on Vercel)

## Test Cases

### Test 1: Site with robots.txt (Google)

**URL**: `google.com`

**Expected Results**:
- Status card shows "Found"
- Robots.txt URL is clickable link
- Summary shows counts for Total/Allowed/Blocked
- All 33 bots listed by company
- Some Google bots may show as Allowed
- Other bots status depends on Google's robots.txt

**How to Verify**:
1. Enter "google.com" in URL input
2. Click "Analyze"
3. Click "Crawlability" tab after analysis completes
4. Check status card
5. Verify summary numbers add up to 33
6. Scroll through bot list

### Test 2: Site without robots.txt

**URL**: `example.com` (or any small site without robots.txt)

**Expected Results**:
- Status card shows "Not Found"
- Message: "No robots.txt file found. All bots are allowed by default."
- Summary shows: Total=33, Allowed=33, Blocked=0
- All 33 bots show green "Allowed" badge
- Reason: "No robots.txt found (default allow)"

**How to Verify**:
1. Enter URL
2. Click "Analyze"
3. Click "Crawlability" tab
4. Verify all counts
5. Check that all bots are green

### Test 3: Site that blocks AI bots

**URL**: Try sites known to block AI crawlers (vary by site)

**Expected Results**:
- Status card shows "Found"
- Summary shows some blocked bots
- Blocked bots have red "Blocked" badge
- Allowed bots have green "Allowed" badge
- Reason for blocked: "Blocked by robots.txt"

### Test 4: Tab Navigation

**Steps**:
1. Analyze any URL
2. Click through all tabs: Overview → TTFB → CLS → INP → Crawlability → More Info
3. Click back to Crawlability
4. Click on Overview metric cards

**Expected Results**:
- All tabs switch smoothly
- Crawlability tab data persists
- No console errors
- Active tab highlights correctly

### Test 5: New Search (Clear Results)

**Steps**:
1. Analyze first URL (e.g., google.com)
2. View Crawlability tab
3. Enter new URL (e.g., github.com)
4. Click "Analyze"
5. Check Crawlability tab

**Expected Results**:
- Old data is cleared
- Loading state shows
- New results display
- No data mixing between searches

### Test 6: Mobile Responsive

**Steps**:
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different viewports:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1200px)

**Expected Results**:
- Summary grid: 3 columns on desktop → 1 column on mobile
- Bot items stack vertically
- Text remains readable
- No horizontal scroll
- Touch targets are adequate size

### Test 7: Error Handling

**Test 7a: Invalid URL**
- Enter: "not-a-valid-url"
- Click "Analyze"
- Expected: Error message, no crawlability check runs

**Test 7b: Network Error (simulate)**
- Enter valid URL
- Disable internet briefly during analysis
- Expected: Error message in Crawlability tab, other tabs may fail too

**Test 7c: CORS Proxy Down**
- Temporarily change `ROBOTS_PROXY_URL` in config.js to invalid URL
- Try to analyze
- Expected: Error message in Crawlability tab

### Test 8: Company Grouping

**Steps**:
1. Analyze any URL with robots.txt
2. Go to Crawlability tab
3. Scroll through bot list

**Expected Results**:
- Bots grouped by company
- 10 company groups visible:
  1. OpenAI (3 bots)
  2. Perplexity (2 bots)
  3. Anthropic (3 bots)
  4. Google (14 bots)
  5. Mistral (1 bot)
  6. Amazon (1 bot)
  7. Apple (1 bot)
  8. Meta (4 bots)
  9. DuckDuckGo (1 bot)
  10. Common Crawl (1 bot)
- Each group has company header
- Bots listed under correct company

### Test 9: Integration with CrUX Analysis

**Steps**:
1. Enter URL
2. Click "Analyze"
3. Watch loading indicator
4. Check all tabs populate

**Expected Results**:
- CrUX metrics load (Overview, TTFB, CLS, INP)
- Crawlability check runs automatically
- Both CrUX and Crawlability data available
- No interference between the two

### Test 10: Sites with Various robots.txt Rules

Try these URLs to test different scenarios:

**Sites that typically allow AI bots**:
- `github.com`
- `stackoverflow.com`
- `wikipedia.org`

**Sites that typically block some AI bots**:
- `reddit.com` (may block some training bots)
- `nytimes.com` (may have restrictions)
- Various news sites

**Expected Results**:
- Different patterns of allowed/blocked
- Summary counts vary by site
- Status badges reflect actual robots.txt rules

## Performance Testing

### Load Time
- Crawlability check should complete in 1-3 seconds
- Should not block CrUX analysis
- UI should remain responsive

### Console Errors
- Open browser console (F12)
- Run through all test cases
- Expected: No JavaScript errors
- Warnings about CrUX data are OK (existing behavior)

## Verification Checklist

After completing all tests, verify:

- [ ] All 33 bots are tracked
- [ ] 10 companies are represented
- [ ] Status card displays correctly
- [ ] Summary math is correct (Total = Allowed + Blocked)
- [ ] Bot badges are color-coded (green/red)
- [ ] Tab navigation works smoothly
- [ ] Mobile responsive design works
- [ ] Error handling is graceful
- [ ] Integration with CrUX doesn't break
- [ ] Results clear on new search
- [ ] No console errors
- [ ] Cloud Function proxy works
- [ ] CORS is handled properly

## Troubleshooting

### Issue: "Failed to check crawlability"
**Solution**: Check Cloud Function deployment and `ROBOTS_PROXY_URL` in config.js

### Issue: All bots show "Allowed" for sites that should block
**Solution**: Verify robots.txt parsing logic in `parseRobotsTxt()` and `isBotBlocked()`

### Issue: Tab doesn't appear
**Solution**: Clear browser cache, check HTML for crawlability nav item

### Issue: Styles look broken
**Solution**: Clear browser cache, verify styles.css loaded, check for CSS conflicts

### Issue: Mobile layout wrong
**Solution**: Check responsive media queries in styles.css

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Final Verification

Before considering feature complete:

1. Deploy to staging/production
2. Run all test cases on live site
3. Check Cloud Function logs for errors
4. Monitor user feedback
5. Verify analytics tracking (if implemented)
6. Test with real user scenarios

## Success Criteria

Feature is ready when:
- All test cases pass
- No console errors
- Mobile responsive
- Cloud Function deployed
- Integration works smoothly
- Error handling is robust
- Performance is acceptable (<3s for crawlability check)
