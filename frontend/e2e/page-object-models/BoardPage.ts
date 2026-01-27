import { Page, expect } from '@playwright/test'

/**
 * Board Page Object Model
 *
 * Encapsulates all interactions with the main Kanban board page.
 * Provides high-level actions for board operations.
 */
export class BoardPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // ===== Locators =====

  readonly getHeaderTitle = () => this.page.getByRole('heading', { name: 'ARES' })
  readonly getSidebarToggle = () => this.page.getByLabel('Toggle sidebar')
  readonly getTaskCount = () => this.page.getByText(/Active Tasks/)
  readonly getColumnCount = () => this.page.getByText(/Columns/)

  readonly getColumn = (name: string) =>
    this.page.getByRole('heading', { level: 2, name })
  readonly getCard = (title: string) =>
    this.page.getByText(title)
  readonly getAllColumns = () =>
    this.page.getByRole('heading', { level: 2 })
  readonly getAllCards = () =>
    this.page.locator('[data-testid^="card-"]')

  readonly getColumnMenu = (columnName: string) => {
    const column = this.getColumn(columnName)
    return column.locator('..').getByLabel('Column options')
  }

  readonly getColumnAddCardButton = (columnName: string) => {
    const column = this.getColumn(columnName)
    return column.locator('..').getByTestId('column-add-card')
  }

  readonly getEmptyState = () =>
    this.page.getByText('No columns yet')

  // ===== Actions =====

  /**
   * Navigate to the board page and wait for it to load
   */
  async goto() {
    await this.page.goto('http://localhost:3002')
    await this.page.waitForLoadState('networkidle')
    await expect(this.getHeaderTitle()).toBeVisible({ timeout: 15000 })
  }

  /**
   * Open the sidebar panel
   */
  async openSidebar() {
    const toggle = this.getSidebarToggle()
    if (await toggle.isVisible()) {
      await toggle.click()
      await this.page.waitForTimeout(500)
    }
  }

  /**
   * Close the sidebar panel
   */
  async closeSidebar() {
    const toggle = this.getSidebarToggle()
    if (await toggle.isVisible()) {
      await toggle.click()
      await this.page.waitForTimeout(500)
    }
  }

  /**
   * Add a new card to the board via sidebar
   */
  async addCard(columnName: string, title: string, description: string) {
    await this.openSidebar()

    // Select column
    const columnSelect = this.page.locator('form combobox[aria-label*="Column"]').first()
    await columnSelect.selectOption(columnName)

    // Fill in title and description
    const titleInput = this.page.locator('form textbox[aria-label*="Title"]').first()
    await titleInput.fill(title)

    const descriptionInput = this.page.locator('form textarea[aria-label="Description"]').first()
    await descriptionInput.fill(description)

    // Submit form
    const submitButton = this.page.locator('form button[type="submit"]').first()
    await submitButton.click()

    // Wait for operation to complete
    await this.page.waitForTimeout(1000)
  }

  /**
   * Add a new column to the board via sidebar
   */
  async addColumn(columnName: string) {
    await this.openSidebar()

    // Switch to Add Column tab
    await this.page.getByRole('tab', { name: 'ADD COLUMN' }).click()
    await this.page.waitForTimeout(300)

    // Fill in column name
    const columnNameInput = this.page.locator('form input[aria-label*="Column Name"]').first()
    await columnNameInput.fill(columnName)

    // Submit form
    const submitButton = this.page.locator('form button[type="submit"]').first()
    await submitButton.click()

    // Wait for operation to complete
    await this.page.waitForTimeout(1000)
  }

  /**
   * Click on a card to open its modal
   */
  async openCardModal(cardTitle: string) {
    await this.getCard(cardTitle).click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Click on a column's menu button
   */
  async openColumnMenu(columnName: string) {
    const menu = this.getColumnMenu(columnName)
    await menu.click()
    await this.page.waitForTimeout(300)
  }

  /**
   * Verify a card exists on the board
   */
  async verifyCardExists(title: string, timeout = 5000) {
    await expect(this.getCard(title)).toBeVisible({ timeout })
  }

  /**
   * Verify a card does not exist on the board
   */
  async verifyCardNotExists(title: string, timeout = 5000) {
    await expect(this.getCard(title)).not.toBeVisible({ timeout })
  }

  /**
   * Verify a column exists on the board
   */
  async verifyColumnExists(name: string, timeout = 5000) {
    await expect(this.getColumn(name)).toBeVisible({ timeout })
  }

  /**
   * Verify a column does not exist on the board
   */
  async verifyColumnNotExists(name: string, timeout = 5000) {
    await expect(this.getColumn(name)).not.toBeVisible({ timeout })
  }

  /**
   * Get all column names
   */
  async getColumnNames(): Promise<string[]> {
    const columns = this.getAllColumns()
    const allContents = await columns.allTextContents()
    return allContents
  }

  /**
   * Get card count for a specific column
   */
  async getCardCountInColumn(columnName: string): Promise<number> {
    // This would need column-specific card counting logic
    // For now, return 0 as placeholder
    return 0
  }

  /**
   * Resize viewport for responsive testing
   */
  async resizeViewport(width: number, height: number) {
    await this.page.setViewportSize({ width, height })
    await this.page.waitForTimeout(500)
  }

  /**
   * Take a screenshot of the current page state
   */
  async takeScreenshot(filename: string) {
    await this.page.screenshot({ path: `test-results/${filename}`, fullPage: true })
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(1000)
  }
}
