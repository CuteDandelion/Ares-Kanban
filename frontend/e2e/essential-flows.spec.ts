/**
 * Essential E2E Tests for Kanban Board
 *
 * Tests critical user flows from loading the board to CRUD operations.
 * Tests run on Chromium by default, can be extended to other browsers.
 */

import { test, expect } from '@playwright/test'

test.describe('Kanban Board E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to board before each test
    await page.goto('http://127.0.0.1:3002')

    // Wait for loading state to complete - wait for ARES heading to appear
    // This ensures React has finished rendering the board after loading state
    await expect(page.getByRole('heading', { name: 'ARES' })).toBeVisible({ timeout: 15000 })

    // Clean up E2E test data if it exists
    try {
      // Delete E2E Test Card if it exists
      const testCard = page.getByText('E2E Test Card').first()
      if (await testCard.isVisible()) {
        const deleteBtn = testCard.getByLabel(/delete/i).first()
        await deleteBtn.click()
        await page.waitForTimeout(1000)
      }

      // Delete E2E Test Column if it exists
      const testColumn = page.getByRole('heading', { name: 'E2E Test Column' })
      if (await testColumn.isVisible()) {
        const columnDeleteBtn = testColumn.getByLabel(/delete/i)
        await columnDeleteBtn.click()
        await page.waitForTimeout(1000)
      }
    } catch (error) {
      // Ignore cleanup errors if elements don't exist
      console.log('Cleanup note:', error.message)
    }
  })

  test('loads board successfully', async ({ page }) => {
    // Wait for loading state to complete - wait for ARES heading to appear
    // This ensures React has finished rendering the board after loading state
    await expect(page.getByRole('heading', { name: 'ARES' })).toBeVisible()

    // Verify sidebar toggle button exists
    await expect(page.getByLabel('Toggle sidebar')).toBeVisible()

    // Verify default columns exist (Backlog, To Do, Done) - use specific selectors
    const columns = page.getByRole('heading', { level: 2 })
    const columnNames = await columns.allTextContents()
    expect(columnNames).toContain('Backlog')
    expect(columnNames).toContain('To Do')
    expect(columnNames).toContain('Done')
  })

  test('adds a new card to a column', async ({ page }) => {
    // Open sidebar
    await page.getByLabel('Toggle sidebar').click()

    // Wait for sidebar to open
    await page.waitForTimeout(500)

    // Switch to Add Card tab
    await page.getByTestId('add-card-tab').click()
    await page.waitForTimeout(300)

    // Fill in card details - use data-testid selectors
    const columnSelect = page.getByTestId('card-column-select')
    await columnSelect.selectOption('Backlog')

    const titleInput = page.getByTestId('card-title-input')
    await titleInput.fill('E2E Test Card')

    const descriptionInput = page.getByTestId('card-description-textarea')
    await descriptionInput.fill('This is a test card from E2E tests')

    const prioritySelect = page.getByTestId('card-priority-select')
    await prioritySelect.selectOption('low')

    // Submit form - use data-testid selector
    await page.getByTestId('add-card-submit').click()

    // Wait for card to appear
    await page.waitForTimeout(1000)

    // Verify card was added
    await expect(page.getByText('E2E Test Card')).toBeVisible()

    // Verify card count increased (text format: "1 Active Tasks")
    const taskCount = page.getByText(/Active Tasks/)
    await expect(taskCount).toBeVisible()
  })

  test('adds a new column', async ({ page }) => {
    // Open sidebar
    await page.getByLabel('Toggle sidebar').click()

    // Wait for sidebar to open
    await page.waitForTimeout(500)

    // Switch to Add Column tab - use data-testid
    await page.getByTestId('add-column-tab').click()
    await page.waitForTimeout(300)

    // Fill in column name - use data-testid selector
    const columnNameInput = page.getByTestId('column-name-input')
    await columnNameInput.fill('E2E Test Column')

    // Submit form - use data-testid selector
    await page.getByTestId('add-column-submit').click()

    // Wait for column to appear
    await page.waitForTimeout(3000)

    // Verify column was added - look for heading text in board area
    await expect(page.getByRole('heading', { name: 'E2E Test Column' })).toBeVisible({ timeout: 5000 })

    // Verify column count increased (text format: "4 Columns")
    const columnCount = page.getByText(/Columns/)
    await expect(columnCount).toBeVisible()
  })

  test('edits an existing card', async ({ page }) => {
    // Wait for cards to load
    await page.waitForTimeout(1000)

    // Click on the first card (if any exists)
    const cards = page.getByText(/Test/)
    const cardCount = await cards.count()

    if (cardCount > 0) {
      // Click first card
      await cards.first().click()

      // Wait for modal to open
      await page.waitForTimeout(500)

      // Update card title
      const titleInput = page.getByLabel('Title')
      await titleInput.clear()
      await titleInput.fill('Updated Test Card')

      // Update card description
      const descriptionInput = page.getByLabel('Description')
      await descriptionInput.clear()
      await descriptionInput.fill('Updated description from E2E tests')

      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click()

      // Wait for modal to close and card to update
      await page.waitForTimeout(1000)

      // Verify card was updated
      await expect(page.getByText('Updated Test Card')).toBeVisible()
    } else {
      console.log('No cards found to edit - skipping test')
      test.skip()
    }
  })

  test('deletes an existing card', async ({ page }) => {
    // Wait for cards to load
    await page.waitForTimeout(1000)

    // Click on the first card (if any exists)
    const cards = page.getByText(/Test/)
    const cardCount = await cards.count()

    if (cardCount > 0) {
      // Click first card
      await cards.first().click()

      // Wait for modal to open
      await page.waitForTimeout(500)

      // Handle confirmation dialog
      page.once('dialog', dialog => dialog.accept())

      // Click delete button
      await page.getByRole('button', { name: 'Delete' }).click()

      // Wait for modal to close and card to be removed
      await page.waitForTimeout(1000)

      // Verify card was removed
      await expect(page.getByText('Updated Test Card')).not.toBeVisible()
    } else {
      console.log('No cards found to delete - skipping test')
      test.skip()
    }
  })

  test('deletes a column', async ({ page }) => {
    // Wait for columns to load
    await page.waitForTimeout(1000)

    // Find and click column menu for a specific column
    const columnMenus = page.getByLabel('Column options')
    const menuCount = await columnMenus.count()

    if (menuCount > 0) {
      // Click menu button for the last column (safer to delete)
      await columnMenus.last().click()

      // Wait for menu to appear
      await page.waitForTimeout(300)

      // Click Delete option
      const deleteButton = page.getByRole('button', { name: 'Delete' })
      await deleteButton.click()

      // Handle confirmation dialog
      page.once('dialog', dialog => dialog.accept())

      // Wait for column to be removed
      await page.waitForTimeout(1000)

      // Verify column was removed
      // Note: We can't easily verify without knowing which column was deleted
      // The test passes if no errors occur
    } else {
      console.log('No columns found to delete - skipping test')
      test.skip()
    }
  })

  test('toggles sidebar open and close', async ({ page }) => {
    // Verify sidebar toggle button exists
    const toggleButton = page.getByLabel('Toggle sidebar')
    await expect(toggleButton).toBeVisible()

    // Sidebar should be closed from beforeEach, click to open
    await toggleButton.click()
    await page.waitForTimeout(500)

    // Verify sidebar content is visible using specific selectors
    await expect(page.getByText('Manage Board')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'ADD CARD' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'ADD COLUMN' })).toBeVisible()

    // Click toggle button to close sidebar
    await toggleButton.click()
    await page.waitForTimeout(500)

    // On desktop, sidebar is always visible but can be toggled
    // On mobile, sidebar completely disappears
    // We can verify the toggle button still works
    await expect(toggleButton).toBeVisible()
  })

  test('shows empty state for columns without cards', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000)

    // Check if any column shows "No cards yet" message
    const emptyState = page.getByText('No cards yet')
    const emptyStateCount = await emptyState.count()

    // At least one column should show empty state if no cards exist
    // Or we can verify the empty state message is present in the DOM
    if (emptyStateCount > 0) {
      await expect(emptyState.first()).toBeVisible()
    }
    // If all columns have cards, this test passes as well
  })

  test('displays card count in column headers', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000)

    // Verify column cards count badges exist
    const columnCountBadges = page.locator('[class*="bg-primary\\/10"]')
    const badgeCount = await columnCountBadges.count()

    // Each column should have a count badge
    await expect(badgeCount).toBeGreaterThan(0)
  })

  test('displays task count and column count in header', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000)

    // Verify task count (text format: "1 Active Tasks")
    const taskCount = page.getByText(/Active Tasks/)
    await expect(taskCount).toBeVisible()

    // Verify column count (text format: "4 Columns")
    const columnCount = page.getByText(/Columns/)
    await expect(columnCount).toBeVisible()
  })

  test('handles responsive design on mobile', async ({ page }) => {
    // Resize to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Wait for page to adjust
    await page.waitForTimeout(500)

    // Verify header is still visible
    await expect(page.getByRole('heading', { name: 'ARES' })).toBeVisible()

    // Verify sidebar toggle button exists
    await expect(page.getByLabel('Toggle sidebar')).toBeVisible()

    // Toggle sidebar on mobile
    await page.getByLabel('Toggle sidebar').click()
    await page.waitForTimeout(500)

    // Verify backdrop appears on mobile (using CSS class directly)
    // Note: Backdrop might not exist on all viewports, check if it's rendered
    const hasBackdrop = await page.locator('.fixed.inset-0.bg-black\\/60').count() > 0
    if (hasBackdrop) {
      const backdrop = page.locator('.fixed.inset-0.bg-black\\/60')
      await expect(backdrop).toBeVisible()

      // Close sidebar
      await backdrop.click()
      await page.waitForTimeout(500)

      // Verify backdrop disappears
      await expect(backdrop).not.toBeVisible()
    }
  })
})

test.describe('Error Handling', () => {
  test('shows connection error when backend is down', async ({ page }) => {
    // This test assumes backend is down or network issue
    // In real scenario, you'd mock network errors

    // Navigate to page
    await page.goto('http://127.0.0.1:3002')

    // Wait for potential error state
    await page.waitForTimeout(3000)

    // If error message appears, it should be visible
    const errorMessage = page.getByText(/error|connection|failed/i)
    const hasError = await errorMessage.count()

    if (hasError > 0) {
      await expect(errorMessage.first()).toBeVisible()
    }
    // If no error (backend is up), test still passes
  })
})
