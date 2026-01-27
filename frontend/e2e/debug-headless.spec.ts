/**
 * Debug E2E Test - Diagnose headless mode issues
 */

import { test, expect } from '@playwright/test'

test.describe('Debug - Headless Mode Issues', () => {
  test('debug page load - check actual page content', async ({ page }) => {
    // Navigate to board
    await page.goto('http://127.0.0.1:3002')

    // Take screenshot to see what's on the page
    await page.screenshot({ path: 'test-results/debug-page-load.png', fullPage: true })

    // Get page title
    const title = await page.title()
    console.log('Page title:', title)

    // Get all text content
    const bodyText = await page.locator('body').textContent()
    console.log('Page text length:', bodyText?.length)

    // Check for common elements
    const hasHeading = await page.locator('h1, h2, h3').count() > 0
    const hasLoading = await page.getByText(/loading|Loading/i).count() > 0
    const hasError = await page.getByText(/error|Error/i).count() > 0

    console.log('Has heading:', hasHeading)
    console.log('Has loading text:', hasLoading)
    console.log('Has error text:', hasError)

    // Wait a bit longer for initial render
    await page.waitForTimeout(5000)

    // Try to find ARES heading
    try {
      const heading = page.getByRole('heading', { name: 'ARES' })
      await expect(heading).toBeVisible({ timeout: 10000 })
      console.log('✓ ARES heading found!')
    } catch (error) {
      console.log('✗ ARES heading not found after 5s wait')

      // Try with partial match
      const anyHeading = page.locator('h1:has-text("ARES"), h2:has-text("ARES"), h3:has-text("ARES")')
      const headingCount = await anyHeading.count()
      console.log('Partial heading match count:', headingCount)
    }
  })

  test('debug browser console for JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Navigate to page
    await page.goto('http://127.0.0.1:3002')
    await page.waitForTimeout(3000)

    // Log any JavaScript errors found
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors)
    } else {
      console.log('No JavaScript errors found')
    }
  })
})
