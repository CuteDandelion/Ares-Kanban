# Playwright MCP Test Template - Column Rearrangement

**Template Name**: Column Rearrangement
**Purpose**: Test column drag-and-drop functionality
**Estimated Duration**: 5-8 minutes
**Browsers**: Chromium (primary), Firefox, WebKit (secondary)

---

## Test Configuration

```yaml
name: Column Rearrangement
description: Verify column drag-and-drop and reordering functionality
type: automated/mcp-hybrid
priority: high
browsers:
  - chromium
  - firefox
  - webkit
viewports:
  - desktop: 1920x1080
  - mobile: 375x667
timeout: 480000  # 8 minutes
```

---

## Test Steps

### Step 1: Navigate to Application and Load Board
**Action**: Navigate to http://localhost:3002 and wait for board to load
**Expected Result**:
- Page loads successfully
- ARES logo and header are visible
- At least 3 default columns (Backlog, To Do, Done) appear
- No console errors

**MCP Commands**:
```typescript
await playwright_browser_navigate({ url: 'http://localhost:3002' })
await playwright_browser_wait_for({ time: 2 })
```

**Verification**:
- [ ] ARES heading is visible
- [ ] At least 3 columns displayed
- [ ] No console errors

---

### Step 2: Verify Drag Handles Exist
**Action**: Check that each column has a drag handle
**Expected Result**:
- Drag handles are visible for each column
- Drag handles have correct data attributes
- Handles have proper accessibility labels

**MCP Commands**:
```typescript
await playwright_browser_snapshot({ filename: '01-drag-handles-visible.md' })
```

**Verification**:
- [ ] Drag handles visible for all columns
- [ ] Drag handles have data-drag-handle="true" attribute
- [ ] Drag handles have aria-label="Drag column to reorder"
- [ ] Drag handles have role="button"

---

### Step 3: Get Initial Column Order
**Action**: Record the initial order of columns
**Expected Result**:
- Column order is captured (e.g., Backlog, To Do, Done)
- Column names are visible and readable

**MCP Commands**:
```typescript
await playwright_browser_snapshot({ filename: '02-initial-column-order.md' })
```

**Verification**:
- [ ] At least 3 columns exist
- [ ] Column names are captured
- [ ] Initial order recorded

---

### Step 4: Perform Column Drag Operation
**Action**: Drag first column to position after second column
**Expected Result**:
- First column can be grabbed
- Drag operation completes successfully
- Column moves to new position
- Animation completes smoothly
- No errors during drag

**MCP Commands**:
```typescript
// Get first drag handle
await playwright_browser_hover({
  element: 'First column drag handle',
  ref: 'first-drag-handle'
})

// Drag first column to second column position
await playwright_browser_drag({
  startElement: 'First column drag handle',
  startRef: 'first-drag-handle',
  endElement: 'Second column',
  endRef: 'second-column'
})

await playwright_browser_wait_for({ time: 1 })
await playwright_browser_snapshot({ filename: '03-after-drag.md' })
```

**Verification**:
- [ ] Drag handle responds to hover (cursor changes to grab)
- [ ] Column follows mouse during drag
- [ ] Column drops at target position
- [ ] Animation completes smoothly
- [ ] No console errors during drag

---

### Step 5: Verify Column Order Changed
**Action**: Check that column order has changed after drag
**Expected Result**:
- Column order is different from initial
- All columns are still present
- No columns were lost or duplicated
- Column structure maintained (cards still with columns)

**MCP Commands**:
```typescript
await playwright_browser_snapshot({ filename: '04-new-column-order.md' })
```

**Verification**:
- [ ] Column order is different from Step 3
- [ ] Same number of columns as initial
- [ ] Each column has correct cards
- [ ] No duplicate columns
- [ ] No missing columns

---

### Step 6: Perform Multiple Rearrangements
**Action**: Drag column from position 1 to last position, then another column to middle
**Expected Result**:
- Multiple drags complete successfully
- Each drag updates column order
- No race conditions or state issues
- Board remains stable after multiple operations

**MCP Commands**:
```typescript
// Drag first column to last position
await playwright_browser_drag({
  startElement: 'First column drag handle',
  startRef: 'first-drag-handle',
  endElement: 'Last column',
  endRef: 'last-column'
})

await playwright_browser_wait_for({ time: 1 })

// Drag new first column to middle
await playwright_browser_drag({
  startElement: 'New first column drag handle',
  startRef: 'new-first-drag-handle',
  endElement: 'Middle column',
  endRef: 'middle-column'
})

await playwright_browser_wait_for({ time: 1 })
await playwright_browser_snapshot({ filename: '05-after-multiple-drags.md' })
```

**Verification**:
- [ ] First drag completes successfully
- [ ] Second drag completes successfully
- [ ] All columns still present
- [ ] Column order reflects both operations
- [ ] No state corruption

---

### Step 7: Test Drag Handle Accessibility
**Action**: Verify drag handles have proper ARIA attributes
**Expected Result**:
- Drag handles have role="button"
- Drag handles have aria-label for screen readers
- Drag handles are keyboard accessible (tab index)
- Focus indicators visible

**MCP Commands**:
```typescript
await playwright_browser_snapshot({ filename: '06-accessibility-attributes.md' })
```

**Verification**:
- [ ] Drag handles have role="button"
- [ ] Drag handles have aria-label="Drag column to reorder"
- [ ] Drag handles are keyboard focusable
- [ ] Focus states visible when tabbing

---

### Step 8: Test Cursor Changes on Hover
**Action**: Hover over drag handles and verify cursor changes
**Expected Result**:
- Cursor changes to 'grab' or 'pointer' on hover
- Visual feedback indicates draggable element
- Cursor returns to default after hover ends
- Consistent behavior across all drag handles

**MCP Commands**:
```typescript
await playwright_browser_hover({
  element: 'First column drag handle',
  ref: 'first-drag-handle'
})
await playwright_browser_wait_for({ time: 0.5 })
// Cursor should be 'grab' or 'pointer'
```

**Verification**:
- [ ] Cursor changes to 'grab' or 'pointer' on hover
- [ ] Visual feedback visible (background color change)
- [ ] All drag handles show consistent behavior
- [ ] Cursor returns to default when not hovering

---

### Step 9: Test Column Structure After Rearrangement
**Action**: Verify that column structure (cards, badges) is maintained after rearrangement
**Expected Result**:
- Each column still has correct card count badge
- Cards remain in their respective columns
- No cards lost during rearrangement
- Column data integrity maintained

**MCP Commands**:
```typescript
await playwright_browser_snapshot({ filename: '07-column-structure.md' })
```

**Verification**:
- [ ] All column count badges visible
- [ ] Badges show correct numbers
- [ ] Cards displayed in correct columns
- [ ] No card count changes from rearrangement
- [ ] Column data integrity intact

---

### Step 10: Test Drag When Sidebar is Open
**Action**: Open sidebar and attempt column drag (should not interfere)
**Expected Result**:
- Sidebar opens successfully
- Drag handles remain visible
- Dragging column works even with sidebar open
- Sidebar doesn't block drag operations
- Both elements can be used independently

**MCP Commands**:
```typescript
// Open sidebar
await playwright_browser_click({
  element: 'Sidebar toggle button',
  ref: 'sidebar-toggle-button'
})
await playwright_browser_wait_for({ time: 1 })

// Try to drag column (should still work)
await playwright_browser_drag({
  startElement: 'First column drag handle',
  startRef: 'first-drag-handle',
  endElement: 'Second column',
  endRef: 'second-column'
})

await playwright_browser_wait_for({ time: 1 })
await playwright_browser_snapshot({ filename: '08-drag-with-sidebar.md' })

// Close sidebar
await playwright_browser_click({
  element: 'Sidebar toggle button',
  ref: 'sidebar-toggle-button'
})
await playwright_browser_wait_for({ time: 1 })
```

**Verification**:
- [ ] Sidebar opens without issues
- [ ] Drag handles still visible and interactive
- [ ] Column drag completes successfully
- [ ] Sidebar remains open during drag
- [ ] Both features work independently
- [ ] Sidebar closes successfully

---

### Step 11: Test Mobile Viewport Rearrangement
**Action**: Resize to mobile and test column rearrangement
**Expected Result**:
- Layout adapts to mobile
- Drag handles still visible and functional
- Touch interactions work (if supported)
- No horizontal scrolling
- Rearrangement works on mobile

**MCP Commands**:
```typescript
// Resize to mobile
await playwright_browser_resize({ width: 375, height: 667 })
await playwright_browser_wait_for({ time: 1 })
await playwright_browser_snapshot({ filename: '09-mobile-layout.md' })

// Attempt drag on mobile
await playwright_browser_drag({
  startElement: 'First column drag handle',
  startRef: 'first-drag-handle',
  endElement: 'Second column',
  endRef: 'second-column'
})

await playwright_browser_wait_for({ time: 1 })
await playwright_browser_snapshot({ filename: '09-mobile-after-drag.md' })

// Resize back to desktop
await playwright_browser_resize({ width: 1920, height: 1080 })
await playwright_browser_wait_for({ time: 1 })
```

**Verification**:
- [ ] No horizontal scrolling on mobile
- [ ] Drag handles visible on mobile
- [ ] Column rearrangement works on mobile
- [ ] Layout adapts correctly
- [ ] Touch targets are sufficient size (min 44x44px)
- [ ] Return to desktop layout successful

---

### Step 12: Check Console Errors During Drag Operations
**Action**: Review console messages for any errors during drag operations
**Expected Result**:
- No console errors
- No unhandled promise rejections
- No React warnings about drag-and-drop
- All drag events handled correctly

**MCP Commands**:
```typescript
await playwright_browser_console_messages({ level: 'error', filename: 'console-errors.txt' })
```

**Verification**:
- [ ] No error messages in console
- [ ] No warning messages (unless expected)
- [ ] All drag events handled
- [ ] No uncaught exceptions

---

### Step 13: Check Network Requests During Rearrangement
**Action**: Review network activity during column drag operations
**Expected Result**:
- API calls made to update column order
- No failed requests
- Response times are reasonable (< 2s)
- PUT/PATCH requests to reorder endpoint

**MCP Commands**:
```typescript
await playwright_browser_network_requests({ includeStatic: false, filename: 'network-requests.txt' })
```

**Verification**:
- [ ] Reorder API call successful (2xx status)
- [ ] Request body contains column order data
- [ ] Response time < 2000ms
- [ ] No failed requests
- [ ] Proper HTTP method used (PUT/PATCH)

---

## Expected Results Summary

✅ **PASS Criteria**:
- All 13 steps complete without errors
- Column drag-and-drop works smoothly
- Column order changes correctly after drag
- No console errors or warnings
- All API requests successful
- Accessibility attributes present
- Mobile rearrangement works
- Multiple rearrangements work without issues
- Total execution time < 8 minutes

❌ **FAIL Criteria**:
- Any step fails with error
- Column drag not functional
- Column order doesn't change
- Columns lost or duplicated
- Console errors present
- API request failures
- Drag handles missing or inaccessible

⚠️ **PARTIAL Criteria**:
- Minor issues that don't block functionality
- Drag operation works but has visual glitches
- Accessibility attributes missing but drag works
- Mobile layout issues but functionality intact
- Performance issues (slow but working)

---

## Artifacts Generated

1. **Accessibility Snapshots** (9 files):
   - 01-drag-handles-visible.md
   - 02-initial-column-order.md
   - 03-after-drag.md
   - 04-new-column-order.md
   - 05-after-multiple-drags.md
   - 06-accessibility-attributes.md
   - 07-column-structure.md
   - 08-drag-with-sidebar.md
   - 09-mobile-layout.md
   - 09-mobile-after-drag.md

2. **Console Logs** (1 file):
   - console-errors.txt

3. **Network Logs** (1 file):
   - network-requests.txt

4. **Test Report** (1 file):
   - column-rearrangement-report.md (generated after test execution)

---

## Next Steps

If **PASS**:
- ✅ Column rearrangement feature is fully functional
- ✅ Can proceed to production deployment
- ✅ Ready for user testing

If **FAIL**:
- ❌ Review error logs and snapshots
- ❌ Identify root cause of drag failures
- ❌ Check drag-and-drop library implementation
- ❌ Verify API endpoint for column reordering
- ❌ Retest after fixes

If **PARTIAL**:
- ⚠️ Document non-critical issues
- ⚠️ Create tickets for improvements
- ⚠️ Consider blocking critical issues only
- ⚠️ Monitor for regressions

---

## Additional Notes

- Drag-and-drop functionality may use HTML5 DnD API or libraries like dnd-kit, react-dnd
- Ensure backend API endpoint handles column order updates correctly
- Consider debouncing rapid drag operations if needed
- Test on different screen sizes to ensure consistent behavior
- Keyboard accessibility is ideal but may not be supported by all drag libraries
- Visual feedback during drag is important for UX (opacity, shadows, animations)
