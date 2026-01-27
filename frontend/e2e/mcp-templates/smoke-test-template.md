# Playwright MCP Test Template - Smoke Test

**Template Name**: Smoke Test
**Purpose**: Quick health check of core functionality
**Estimated Duration**: 3-5 minutes
**Browsers**: Chromium (primary), Firefox, WebKit (secondary)

---

## Test Configuration

```yaml
name: Smoke Test
description: Quick health check verifying core board functionality
type: automated/mcp-hybrid
priority: critical
browsers:
  - chromium
  - firefox
  - webkit
viewports:
  - desktop: 1920x1080
  - mobile: 375x667
timeout: 300000  # 5 minutes
```

---

## Test Steps

### Step 1: Navigate to Application
**Action**: Navigate to http://localhost:3002
**Expected Result**:
- Page loads successfully
- Loading spinner appears briefly
- ARES logo and header are visible
- No console errors

**MCP Commands**:
```typescript
await playwright_browser_navigate({ url: 'http://localhost:3002' })
await playwright_browser_wait_for({ time: 2 })
await playwright_browser_take_screenshot({ filename: '01-page-loaded.png' })
```

**Verification**:
- [ ] ARES heading is visible
- [ ] Loading state completes
- [ ] No 404/500 errors
- [ ] Console logs are clean

---

### Step 2: Verify Board Layout
**Action**: Take accessibility snapshot and verify board structure
**Expected Result**:
- Header with ARES logo visible
- Sidebar toggle button visible
- Task count displayed
- Column count displayed
- At least 3 default columns (Backlog, To Do, Done)

**MCP Commands**:
```typescript
await playwright_browser_snapshot({ filename: '02-board-structure.md' })
await playwright_browser_take_screenshot({ filename: '02-board-layout.png' })
```

**Verification**:
- [ ] Header contains ARES logo
- [ ] Sidebar toggle button is present
- [ ] Task count badge visible (e.g., "5 Active Tasks")
- [ ] Column count badge visible (e.g., "3 Columns")
- [ ] At least 3 columns displayed
- [ ] All columns have proper heading structure

---

### Step 3: Test Sidebar Toggle
**Action**: Toggle sidebar open and closed
**Expected Result**:
- Sidebar opens when toggle button clicked
- Sidebar contains "Manage Board" title
- ADD CARD and ADD COLUMN tabs visible
- Sidebar closes when toggle button clicked again
- No console errors during toggle

**MCP Commands**:
```typescript
// Toggle open
await playwright_browser_click({
  ref: 'sidebar-toggle-button',
  element: 'Toggle sidebar button'
})
await playwright_browser_wait_for({ time: 1 })
await playwright_browser_take_screenshot({ filename: '03-sidebar-open.png' })

// Verify sidebar content
await playwright_browser_snapshot({ filename: '03-sidebar-content.md' })

// Toggle closed
await playwright_browser_click({
  ref: 'sidebar-toggle-button',
  element: 'Toggle sidebar button'
})
await playwright_browser_wait_for({ time: 1 })
await playwright_browser_take_screenshot({ filename: '03-sidebar-closed.png' })
```

**Verification**:
- [ ] Sidebar opens smoothly with animation
- [ ] "Manage Board" title visible
- [ ] ADD CARD tab visible and clickable
- [ ] ADD COLUMN tab visible and clickable
- [ ] Add Card form displayed
- [ ] Sidebar closes smoothly
- [ ] No layout shifts during toggle

---

### Step 4: Test Add Card Flow
**Action**: Add a test card to the "Backlog" column
**Expected Result**:
- Sidebar opens in ADD CARD mode
- Column dropdown shows all available columns
- Title input accepts text
- Description textarea accepts text
- Submit button is enabled after filling form
- Card appears in selected column after submission
- Toast notification shows success message
- Card count increases

**MCP Commands**:
```typescript
// Open sidebar
await playwright_browser_click({
  ref: 'sidebar-toggle-button',
  element: 'Toggle sidebar button'
})
await playwright_browser_wait_for({ time: 1 })

// Fill form
await playwright_browser_type({
  ref: 'card-column-select',
  element: 'Column dropdown',
  text: 'Backlog'
})
await playwright_browser_type({
  ref: 'card-title-input',
  element: 'Card title input',
  text: 'Smoke Test Card'
})
await playwright_browser_type({
  ref: 'card-description-textarea',
  element: 'Card description textarea',
  text: 'This is a smoke test card created by MCP'
})

// Take screenshot before submit
await playwright_browser_take_screenshot({ filename: '04-form-filled.png' })

// Submit form
await playwright_browser_click({
  ref: 'add-card-submit-button',
  element: 'Add Card submit button'
})
await playwright_browser_wait_for({ time: 2 })

// Take screenshot after submit
await playwright_browser_take_screenshot({ filename: '04-after-submit.png' })
```

**Verification**:
- [ ] Sidebar opens in ADD CARD tab
- [ ] "Backlog" option available in dropdown
- [ ] Title input accepts characters without errors
- [ ] Description textarea accepts multi-line text
- [ ] Submit button enabled after form filled
- [ ] Success toast notification appears
- [ ] Card "Smoke Test Card" appears in Backlog column
- [ ] Task count increases (e.g., from 5 to 6)
- [ ] Card displays correct title

---

### Step 5: Test Add Column Flow
**Action**: Add a test column named "Testing"
**Expected Result**:
- Sidebar opens in ADD COLUMN mode
- Column name input accepts text
- Submit button enabled after filling form
- New column appears on board
- Toast notification shows success message
- Column count increases

**MCP Commands**:
```typescript
// Switch to ADD COLUMN tab
await playwright_browser_click({
  ref: 'add-column-tab',
  element: 'Add Column tab'
})
await playwright_browser_wait_for({ time: 0.5 })

// Fill form
await playwright_browser_type({
  ref: 'column-name-input',
  element: 'Column name input',
  text: 'Testing'
})

// Take screenshot before submit
await playwright_browser_take_screenshot({ filename: '05-column-form-filled.png' })

// Submit form
await playwright_browser_click({
  ref: 'add-column-submit-button',
  element: 'Add Column submit button'
})
await playwright_browser_wait_for({ time: 2 })

// Take screenshot after submit
await playwright_browser_take_screenshot({ filename: '05-after-add-column.png' })
```

**Verification**:
- [ ] Sidebar switches to ADD COLUMN tab
- [ ] ADD COLUMN tab is active (highlighted)
- [ ] Column name input accepts text
- [ ] Submit button enabled after typing
- [ ] Success toast notification appears
- [ ] "Testing" column appears on board
- [ ] Column count increases (e.g., from 3 to 4)
- [ ] Column appears in correct position

---

### Step 6: Test Card Click
**Action**: Click on a card to open its modal
**Expected Result**:
- Card modal opens with card details
- Card ID displayed
- Title input shows card title
- Description textarea shows card description
- Save Changes and Delete buttons visible
- Cancel button visible

**MCP Commands**:
```typescript
// Click on "Smoke Test Card"
await playwright_browser_click({
  ref: 'smoke-test-card',
  element: 'Smoke Test Card'
})
await playwright_browser_wait_for({ time: 1 })

// Take screenshot of modal
await playwright_browser_take_screenshot({ filename: '06-card-modal-open.png' })
await playwright_browser_snapshot({ filename: '06-modal-structure.md' })
```

**Verification**:
- [ ] Card modal opens with animation
- [ ] Card ID displayed (e.g., "Card ID: 123")
- [ ] Title shows "Smoke Test Card"
- [ ] Description shows correct text
- [ ] Save Changes button visible and enabled
- [ ] Delete button visible
- [ ] Close/Cancel button visible
- [ ] Backdrop visible on desktop

---

### Step 7: Close Card Modal
**Action**: Close card modal using Cancel button
**Expected Result**:
- Modal closes with animation
- Board returns to normal state
- No console errors
- Card data unchanged

**MCP Commands**:
```typescript
// Click cancel button
await playwright_browser_click({
  ref: 'modal-cancel-button',
  element: 'Cancel button'
})
await playwright_browser_wait_for({ time: 1 })

// Take screenshot after close
await playwright_browser_take_screenshot({ filename: '07-modal-closed.png' })
```

**Verification**:
- [ ] Modal closes smoothly
- [ ] No overlay/backdrop remains
- [ ] Board fully interactive
- [ ] Card "Smoke Test Card" still visible
- [ ] No console errors

---

### Step 8: Test Mobile Responsiveness
**Action**: Resize viewport to mobile and verify layout
**Expected Result**:
- Board adapts to mobile layout
- Sidebar toggle still works
- Cards and columns still accessible
- No horizontal scrolling
- Touch targets are sufficient size

**MCP Commands**:
```typescript
// Resize to mobile viewport
await playwright_browser_resize({ width: 375, height: 667 })
await playwright_browser_wait_for({ time: 1 })

// Take screenshot
await playwright_browser_take_screenshot({ filename: '08-mobile-view.png' })

// Toggle sidebar on mobile
await playwright_browser_click({
  ref: 'sidebar-toggle-button',
  element: 'Toggle sidebar button'
})
await playwright_browser_wait_for({ time: 1 })

// Take screenshot with sidebar
await playwright_browser_take_screenshot({ filename: '08-mobile-sidebar.png' })
```

**Verification**:
- [ ] No horizontal scrolling required
- [ ] Header elements visible and accessible
- [ ] Sidebar toggle button tapable (min 44x44px)
- [ ] Cards display correctly in single column view
- [ ] Sidebar slides in from left
- [ ] Backdrop appears on mobile sidebar
- [ ] All text remains readable
- [ ] No layout breaks or overlaps

---

### Step 9: Check Console Errors
**Action**: Review console messages for any errors or warnings
**Expected Result**:
- No console errors
- No unhandled promise rejections
- No network request failures

**MCP Commands**:
```typescript
await playwright_browser_console_messages({ level: 'error', filename: 'console-errors.txt' })
```

**Verification**:
- [ ] No error messages in console
- [ ] No warning messages (unless expected)
- [ ] All network requests complete successfully
- [ ] No uncaught exceptions

---

### Step 10: Capture Network Requests
**Action**: Review network activity for performance issues
**Expected Result**:
- All API requests complete successfully
- Response times are reasonable (< 2s)
- No failed requests
- No 404/500 errors

**MCP Commands**:
```typescript
await playwright_browser_network_requests({ includeStatic: false, filename: 'network-requests.txt' })
```

**Verification**:
- [ ] GET /api/board/columns - 200 OK
- [ ] GET /api/board/cards - 200 OK
- [ ] POST /api/board/cards - 201 Created
- [ ] POST /api/board/columns - 201 Created
- [ ] All API response times < 2000ms
- [ ] No failed requests

---

## Expected Results Summary

✅ **PASS Criteria**:
- All 10 steps complete without errors
- No console errors or warnings
- All API requests successful (2xx status)
- All verification points pass (90%+)
- Total execution time < 5 minutes

❌ **FAIL Criteria**:
- Any step fails with error
- Console errors present
- API request failures (4xx, 5xx status)
- Visual layout broken
- Key functionality not working

⚠️ **PARTIAL Criteria**:
- Minor issues that don't block core functionality
- Warnings in console (non-critical)
- Performance issues (slow but working)
- Visual glitches (functionality intact)

---

## Artifacts Generated

1. **Screenshots** (10 files):
   - 01-page-loaded.png
   - 02-board-layout.png
   - 03-sidebar-open.png
   - 03-sidebar-closed.png
   - 04-form-filled.png
   - 04-after-submit.png
   - 05-column-form-filled.png
   - 05-after-add-column.png
   - 06-card-modal-open.png
   - 07-modal-closed.png
   - 08-mobile-view.png
   - 08-mobile-sidebar.png

2. **Accessibility Snapshots** (2 files):
   - 02-board-structure.md
   - 03-sidebar-content.md
   - 06-modal-structure.md

3. **Console Logs** (1 file):
   - console-errors.txt

4. **Network Logs** (1 file):
   - network-requests.txt

5. **Test Report** (1 file):
   - smoke-test-report.md (generated after test execution)

---

## Next Steps

If **PASS**:
- ✅ Application is healthy for further testing
- ✅ Can proceed to detailed E2E tests
- ✅ Ready for CI/CD integration

If **FAIL**:
- ❌ Review error logs and screenshots
- ❌ Identify root cause of failures
- ❌ Create bug reports for critical issues
- ❌ Retest after fixes

If **PARTIAL**:
- ⚠️ Document non-critical issues
- ⚠️ Create tickets for improvements
- ⚠️ Consider blocking critical issues only
- ⚠️ Monitor for regressions

---

## Additional Notes

- This test can be run manually by following steps or automatically via MCP tools
- Adjust timeouts for slower systems/networks
- Test data cleanup should be handled after execution
- Screenshots provide visual baseline for regression testing
- Console and network logs help diagnose issues
