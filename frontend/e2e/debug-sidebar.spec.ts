import { test, expect } from '@playwright/test'

test('debug sidebar structure', async ({ page }) => {
  await page.goto('http://127.0.0.1:3002')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Take a screenshot of initial state
  await page.screenshot({ path: 'test-results/debug-initial.png', fullPage: true })

  // Try to open sidebar
  const toggleBtn = page.getByLabel('Toggle sidebar')
  console.log('Toggle button visible:', await toggleBtn.isVisible())

  if (await toggleBtn.isVisible()) {
    await toggleBtn.click()
    await page.waitForTimeout(1000)

    // Take screenshot with sidebar open
    await page.screenshot({ path: 'test-results/debug-sidebar-open.png', fullPage: true })

    // Log what we can find
    console.log('Page content:', await page.content())

    // Try different selectors
    const byText = page.getByText('Manage Board')
    console.log('By text "Manage Board":', await byText.isVisible())

    const byRole = page.getByRole('heading', { name: 'Manage Board' })
    console.log('By role heading "Manage Board":', await byRole.isVisible())

    const selectLocator = page.locator('form combobox[aria-label*="Column"]')
    console.log('Select element count:', await selectLocator.count())

    const formLocator = page.locator('form')
    console.log('Form element count:', await formLocator.count())

    const asideLocator = page.locator('aside')
    console.log('Aside element count:', await asideLocator.count())
  }
})
