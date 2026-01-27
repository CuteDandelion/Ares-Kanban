# E2E Testing - Hybrid Approach

This directory contains **hybrid testing setup** combining automated E2E tests with Playwright MCP interactive testing.

## Directory Structure

```
e2e/
├── page-object-models/          # Page Object Model classes
│   ├── BoardPage.ts             # Board interactions
│   ├── SidebarPage.ts           # Sidebar interactions
│   └── ModalPage.ts             # Modal interactions
│
├── fixtures/                    # Test data
│   └── test-data.ts            # Consistent test data
│
├── utils/                       # Test utilities
│   └── test-helpers.ts         # Helper functions
│
├── spec/                        # Organized test specs (NEW)
│   ├── 01-board.spec.ts        # Board loading/rendering
│   ├── 02-sidebar.spec.ts      # Sidebar operations
│   ├── 03-card-crud.spec.ts   # Card operations
│   ├── 04-column-crud.spec.ts  # Column operations
│   ├── 05-responsive.spec.ts   # Mobile/responsive
│   ├── 06-error-handling.spec.ts # Error scenarios
│   ├── 07-accessibility.spec.ts # ARIA, keyboard nav
│   └── 08-visual-regression.spec.ts # Screenshot comparison
│
├── mcp-templates/              # Playwright MCP test templates
│   ├── smoke-test-template.md   # Quick health check
│   ├── accessibility-audit-template.md
│   ├── mobile-responsiveness-template.md
│   ├── bug-reproduction-template.md
│   └── visual-regression-template.md
│
├── mcp-screenshots/            # MCP test screenshots (auto-generated)
│
└── essential-flows.spec.ts     # Existing essential E2E tests
```

## Quick Start

### Run Automated E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with Playwright UI (interactive)
npm run test:e2e:ui

# Run in headed mode (watch browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test spec/01-board.spec.ts

# Run on specific browser
npx playwright test --project=chromium
```

### Run Playwright MCP Tests

**Option 1: Ask AI Assistant**
```
User: "Run the smoke test template using Playwright MCP tools"

AI: [Executes MCP commands from smoke-test-template.md]
```

**Option 2: Manual MCP Execution**
```typescript
// Use Playwright MCP tools
await playwright_browser_navigate({ url: 'http://localhost:3002' })
await playwright_browser_take_screenshot({ filename: 'test.png' })
await playwright_browser_click({ ref: 'button-id', element: 'Button' })
```

**Option 3: MCP Test Templates**
```bash
# Templates are in mcp-templates/ directory
# Can be executed by AI assistant

e2e/mcp-templates/
├── smoke-test-template.md
├── accessibility-audit-template.md
├── mobile-responsiveness-template.md
├── bug-reproduction-template.md
└── visual-regression-template.md
```

## Page Object Model

The Page Object Model (POM) pattern encapsulates page structure and interactions:

### BoardPage
```typescript
import { BoardPage } from './page-object-models/BoardPage'

const boardPage = new BoardPage(page)
await boardPage.goto()
await boardPage.addCard('Backlog', 'Test Card', 'Description')
await boardPage.verifyCardExists('Test Card')
```

### SidebarPage
```typescript
import { SidebarPage } from './page-object-models/SidebarPage'

const sidebarPage = new SidebarPage(page)
await sidebarPage.switchToAddCardTab()
await sidebarPage.addCard({ column: 'Backlog', title: 'Test', description: '...' })
```

### ModalPage
```typescript
import { ModalPage } from './page-object-models/ModalPage'

const modalPage = new ModalPage(page)
await modalPage.waitForCardModal()
await modalPage.updateCard({ title: 'Updated' })
await modalPage.saveCard()
```

## Test Data

Use consistent test data from fixtures:

```typescript
import { TEST_DATA, TEST_COLUMNS, TEST_CARDS } from './fixtures/test-data'

// Use predefined test cards
await boardPage.addCard(
  'Backlog',
  TEST_CARDS.lowPriority.title,
  TEST_CARDS.lowPriority.description
)

// Use predefined columns
const columns = TEST_COLUMNS.map(c => c.name)
```

## Test Utilities

Common helper functions:

```typescript
import {
  wait,
  takeScreenshot,
  getConsoleMessages,
  getNetworkRequests,
  verifyNoConsoleErrors,
  randomCardTitle,
} from './utils/test-helpers'

// Wait for element
await wait(1000)

// Take screenshot
await takeScreenshot(page, 'test-screenshot.png')

// Check for errors
await verifyNoConsoleErrors(page)

// Generate random data
const title = randomCardTitle()
```

## Hybrid Testing Strategy

### When to Use Automated E2E Tests
✅ CI/CD pipelines
✅ Regression testing
✅ Smoke tests
✅ Critical path validation
✅ Before merging to main

### When to Use Playwright MCP Tests
✅ Reproducing reported bugs
✅ Visual regression testing
✅ Exploratory testing
✅ Complex workflows
✅ Cross-browser compatibility
✅ Accessibility testing
✅ Pre-release QA

### Integration Workflow

1. **Development**: Use MCP tests for quick verification
2. **Pull Request**: Automated E2E tests run in CI/CD
3. **Bug Report**: Use MCP to quickly reproduce
4. **Bug Fix**: Convert MCP test to automated E2E test
5. **Release**: Full MCP test suite + automated tests

## Test Coverage

### Current Status
- Automated E2E: 13 tests (61.5% pass rate)
- Frontend Unit: 92 tests (100% pass rate)
- Backend Integration: 32 tests (100% pass rate)
- MCP Tests: 0 tests (NEW)

### Target Metrics
- Automated E2E: 30+ tests (95%+ pass rate)
- MCP Templates: 10+ templates
- Cross-Browser: All 3 browsers tested
- Mobile Coverage: Full viewport testing

## Documentation

- **Hybrid Testing Strategy**: `HYBRID_TESTING_STRATEGY.md` (root)
- **Testing Documentation**: `TESTING.md` (root)
- **Test Plan**: `TESTING_PLAN.md` (root)

## Best Practices

### Automated E2E Tests
1. ✅ Use Page Object Model
2. ✅ Test critical user flows only
3. ✅ Avoid fixed timeouts (use waitFor)
4. ✅ Reset state between tests
5. ✅ Use realistic test data
6. ✅ Take screenshots on failure

### Playwright MCP Tests
1. ✅ Document test steps clearly
2. ✅ Take screenshots at key steps
3. ✅ Capture console and network logs
4. ✅ Provide detailed analysis
5. ✅ Compare against visual baselines

## Troubleshooting

### Tests Timing Out
- Check if dev server is running: `npm run dev`
- Increase timeout in test: `test.setTimeout(60000)`
- Verify network connectivity
- Check browser console for errors

### Tests Flaky
- Use proper waitFor instead of fixed timeouts
- Ensure test isolation (cleanup in afterEach)
- Check for race conditions
- Increase retries in playwright.config.ts

### MCP Tools Not Working
- Verify Playwright MCP server is running
- Check tool availability
- Review tool documentation
- Try manual Playwright commands

## Contributing

### Adding New Automated Tests
1. Create new spec file in `spec/` directory
2. Use Page Object Model classes
3. Follow AAA pattern (Arrange, Act, Assert)
4. Run tests locally before committing
5. Update this README

### Adding New MCP Templates
1. Create new template in `mcp-templates/` directory
2. Document steps clearly with MCP commands
3. Include expected results
4. List generated artifacts
5. Update HYBRID_TESTING_STRATEGY.md

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [Hybrid Testing Strategy](../HYBRID_TESTING_STRATEGY.md)

## Support

For issues or questions:
1. Check this README
2. Review HYBRID_TESTING_STRATEGY.md
3. Check Playwright documentation
4. Contact development team

---

**Last Updated**: 2026-01-25
**Status**: Active ✅
