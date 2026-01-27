import { Page, expect } from '@playwright/test'

/**
 * Test Helper Utilities
 *
 * Common utility functions for E2E tests.
 */

/**
 * Wait for a specified amount of time
 * (Prefer using waitForSelector or waitForLoadState over this)
 */
export async function wait(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Wait for an element to be visible
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout })
}

/**
 * Wait for an element to be hidden
 */
export async function waitForElementHidden(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'hidden', timeout })
}

/**
 * Take a screenshot with a unique filename
 */
export async function takeScreenshot(
  page: Page,
  filename: string,
  options?: { fullPage?: boolean; element?: string }
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fullFilename = `screenshots/${timestamp}-${filename}`

  if (options?.element) {
    const element = page.locator(options.element)
    await element.screenshot({ path: fullFilename })
  } else {
    await page.screenshot({
      path: fullFilename,
      fullPage: options?.fullPage ?? true,
    })
  }
}

/**
 * Get console messages from the page
 */
export async function getConsoleMessages(page: Page): Promise<string[]> {
  const messages: string[] = []

  page.on('console', msg => {
    const type = msg.type()
    const text = msg.text()
    if (type === 'error' || type === 'warning') {
      messages.push(`[${type}] ${text}`)
    }
  })

  // Wait a bit to collect messages
  await wait(100)

  return messages
}

/**
 * Get network requests from the page
 */
export async function getNetworkRequests(page: Page): Promise<NetworkRequest[]> {
  const requests: NetworkRequest[] = []

  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
    })
  })

  page.on('response', response => {
    const request = requests.find(r => r.url === response.url())
    if (request) {
      request.status = response.status()
    }
  })

  // Wait a bit to collect requests
  await wait(100)

  return requests
}

/**
 * Clear all cookies and local storage
 */
export async function clearCookiesAndStorage(page: Page): Promise<void> {
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Check if element exists
 */
export async function elementExists(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 1000 })
    return true
  } catch {
    return false
  }
}

/**
 * Click element with retry
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  retries = 3
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await page.click(selector, { timeout: 5000 })
      return
    } catch (error) {
      if (i === retries - 1) throw error
      await wait(500)
    }
  }
}

/**
 * Fill form with data
 */
export async function fillForm(
  page: Page,
  fields: Array<{ selector: string; value: string }>
): Promise<void> {
  for (const field of fields) {
    await page.fill(field.selector, field.value)
  }
}

/**
 * Select option from dropdown
 */
export async function selectOption(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  await page.selectOption(selector, value)
}

/**
 * Get text content of element
 */
export async function getTextContent(
  page: Page,
  selector: string
): Promise<string> {
  const element = page.locator(selector)
  return await element.textContent() || ''
}

/**
 * Get attribute value of element
 */
export async function getAttribute(
  page: Page,
  selector: string,
  attribute: string
): Promise<string | null> {
  const element = page.locator(selector)
  return await element.getAttribute(attribute)
}

/**
 * Wait for toast notification to appear
 */
export async function waitForToast(
  page: Page,
  message: string,
  timeout = 5000
): Promise<void> {
  await page.waitForSelector(`text=${message}`, { timeout })
  await wait(1000) // Wait for toast to be visible
}

/**
 * Verify no console errors
 */
export async function verifyNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = []

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await wait(500)

  if (errors.length > 0) {
    throw new Error(`Console errors found:\n${errors.join('\n')}`)
  }
}

/**
 * Generate random string for test data
 */
export function randomString(prefix = 'test', length = 8): string {
  const random = Math.random().toString(36).substring(2, 2 + length)
  return `${prefix}-${random}`
}

/**
 * Generate random card title
 */
export function randomCardTitle(): string {
  return randomString('Card')
}

/**
 * Generate random column name
 */
export function randomColumnName(): string {
  return randomString('Column')
}

// Type definitions
export interface NetworkRequest {
  url: string
  method: string
  headers: Record<string, string>
  status?: number
  timing?: Record<string, number>
}
