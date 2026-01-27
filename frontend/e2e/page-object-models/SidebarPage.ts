import { Page, expect } from '@playwright/test'

/**
 * Sidebar Page Object Model
 *
 * Encapsulates all interactions with the sidebar panel.
 * Provides actions for switching tabs and filling forms.
 */
export class SidebarPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // ===== Locators =====

  readonly getSidebar = () => this.page.getByRole('complementary')
  readonly getSidebarTitle = () => this.page.getByText('Manage Board')
  readonly getAddCardTab = () => this.page.getByTestId('card-tab')
  readonly getAddColumnTab = () => this.page.getByTestId('column-tab')

  // Add Card Form Locators
  readonly getCardColumnSelect = () =>
    this.page.locator('form combobox[aria-label*="Column"]').first()
  readonly getCardTitleInput = () =>
    this.page.locator('form textbox[aria-label*="Title"]').first()
  readonly getCardDescriptionTextarea = () =>
    this.page.locator('form textarea[aria-label="Description"]').first()
  readonly getAddCardSubmitButton = () =>
    this.page.getByTestId('add-card-submit')

  // Add Column Form Locators
  readonly getColumnNameInput = () =>
    this.page.locator('form input[aria-label*="Column Name"]').first()
  readonly getAddColumnSubmitButton = () =>
    this.page.getByTestId('add-column-submit')

  readonly getBackdrop = () =>
    this.page.locator('.fixed.inset-0.bg-black\\/60')

  // ===== Actions =====

  /**
   * Verify sidebar is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.getSidebar().isVisible()
  }

  /**
   * Switch to Add Card tab
   */
  async switchToAddCardTab() {
    await this.getAddCardTab().click()
    await this.page.waitForTimeout(300)
  }

  /**
   * Switch to Add Column tab
   */
  async switchToAddColumnTab() {
    await this.getAddColumnTab().click()
    await this.page.waitForTimeout(300)
  }

  /**
   * Get currently active tab
   */
  async getActiveTab(): Promise<'card' | 'column'> {
    const cardTab = this.getAddCardTab()
    const isCardActive = await cardTab.getAttribute('aria-selected')

    if (isCardActive === 'true') {
      return 'card'
    }
    return 'column'
  }

  /**
   * Fill and submit Add Card form
   */
  async addCard(data: {
    column: string
    title: string
    description: string
  }) {
    await this.switchToAddCardTab()

    // Fill form fields
    await this.getCardColumnSelect().selectOption(data.column)
    await this.getCardTitleInput().fill(data.title)
    await this.getCardDescriptionTextarea().fill(data.description)

    // Submit form
    await this.getAddCardSubmitButton().click()

    // Wait for operation to complete
    await this.page.waitForTimeout(1000)
  }

  /**
   * Fill and submit Add Column form
   */
  async addColumn(name: string) {
    await this.switchToAddColumnTab()

    // Fill form field
    await this.getColumnNameInput().fill(name)

    // Submit form
    await this.getAddColumnSubmitButton().click()

    // Wait for operation to complete
    await this.page.waitForTimeout(1000)
  }

  /**
   * Clear Add Card form
   */
  async clearAddCardForm() {
    await this.getCardTitleInput().fill('')
    await this.getCardDescriptionTextarea().fill('')
  }

  /**
   * Clear Add Column form
   */
  async clearAddColumnForm() {
    await this.getColumnNameInput().fill('')
  }

  /**
   * Verify Add Card tab is active
   */
  async verifyAddCardTabActive() {
    const tab = this.getAddCardTab()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
  }

  /**
   * Verify Add Column tab is active
   */
  async verifyAddColumnTabActive() {
    const tab = this.getAddColumnTab()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
  }

  /**
   * Get column options from dropdown
   */
  async getColumnOptions(): Promise<string[]> {
    const select = this.getCardColumnSelect()
    await select.click()

    const options = select.locator('option')
    const optionTexts = await options.allTextContents()

    await select.click() // Close dropdown

    return optionTexts.filter(text => text.trim() !== '')
  }

  /**
   * Verify form field values
   */
  async verifyAddCardFormValues(data: {
    column?: string
    title?: string
    description?: string
  }) {
    if (data.column) {
      const selectedOption = await this.getCardColumnSelect().inputValue()
      await expect(selectedOption).toBe(data.column)
    }

    if (data.title) {
      const title = await this.getCardTitleInput().inputValue()
      await expect(title).toBe(data.title)
    }

    if (data.description) {
      const description = await this.getCardDescriptionTextarea().inputValue()
      await expect(description).toBe(data.description)
    }
  }

  /**
   * Verify Add Column form value
   */
  async verifyAddColumnFormValue(name: string) {
    const columnName = await this.getColumnNameInput().inputValue()
    await expect(columnName).toBe(name)
  }

  /**
   * Wait for sidebar to be fully loaded
   */
  async waitForLoad() {
    await expect(this.getSidebarTitle()).toBeVisible({ timeout: 5000 })
  }

  /**
   * Take screenshot of sidebar
   */
  async takeScreenshot(filename: string) {
    await this.getSidebar().screenshot({ path: `test-results/${filename}` })
  }
}
