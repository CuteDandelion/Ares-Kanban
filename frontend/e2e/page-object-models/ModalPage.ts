import { Page, expect } from '@playwright/test'

/**
 * Modal Page Object Model
 *
 * Encapsulates all interactions with card and column modals.
 * Provides actions for editing, saving, and deleting cards/columns.
 */
export class ModalPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // ===== Locators =====

  // Card Modal Locators
  readonly getCardModal = () =>
    this.page.getByRole('dialog', { name: /card details/i })
  readonly getCardId = () =>
    this.page.getByText(/card id:/i)
  readonly getCardTitleInput = () =>
    this.page.getByLabel('Title')
  readonly getCardDescriptionTextarea = () =>
    this.page.getByLabel('Description')
  readonly getSaveCardButton = () =>
    this.page.getByRole('button', { name: 'Save Changes' })
  readonly getDeleteCardButton = () =>
    this.page.getByRole('button', { name: 'Delete' })
  readonly getCloseCardModalButton = () =>
    this.page.getByRole('button', { name: /close/i }).first()

  // Column Edit Modal Locators
  readonly getColumnEditModal = () =>
    this.page.getByRole('dialog', { name: /edit column/i })
  readonly getColumnNameInput = () =>
    this.page.getByLabel('Column Name')
  readonly getSaveColumnButton = () =>
    this.page.getByRole('button', { name: 'Save Changes' })
  readonly getDeleteColumnButton = () =>
    this.page.getByRole('button', { name: 'Delete' })
  readonly getCloseColumnModalButton = () =>
    this.page.getByRole('button', { name: /cancel/i })

  // Confirmation Dialog Locators
  readonly getConfirmDialog = () =>
    this.page.locator('[role="alertdialog"]')
  readonly getConfirmButton = () =>
    this.getConfirmDialog().getByRole('button', { name: /confirm|yes|delete/i })
  readonly getCancelButton = () =>
    this.getConfirmDialog().getByRole('button', { name: /cancel|no/i })

  // ===== Actions =====

  /**
   * Wait for card modal to be visible
   */
  async waitForCardModal(timeout = 5000) {
    await expect(this.getCardModal()).toBeVisible({ timeout })
  }

  /**
   * Wait for column edit modal to be visible
   */
  async waitForColumnEditModal(timeout = 5000) {
    await expect(this.getColumnEditModal()).toBeVisible({ timeout })
  }

  /**
   * Update card details
   */
  async updateCard(data: {
    title?: string
    description?: string
  }) {
    if (data.title) {
      await this.getCardTitleInput().clear()
      await this.getCardTitleInput().fill(data.title)
    }

    if (data.description) {
      await this.getCardDescriptionTextarea().clear()
      await this.getCardDescriptionTextarea().fill(data.description)
    }
  }

  /**
   * Save card changes
   */
  async saveCard() {
    await this.getSaveCardButton().click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Delete card with confirmation
   */
  async deleteCard() {
    // Setup dialog handler to accept confirmation
    this.page.once('dialog', async dialog => {
      await dialog.accept()
    })

    await this.getDeleteCardButton().click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Close card modal
   */
  async closeCardModal() {
    await this.getCloseCardModalButton().click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Update column name
   */
  async updateColumn(name: string) {
    await this.getColumnNameInput().clear()
    await this.getColumnNameInput().fill(name)
  }

  /**
   * Save column changes
   */
  async saveColumn() {
    await this.getSaveColumnButton().click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Delete column with confirmation
   */
  async deleteColumn() {
    // Setup dialog handler to accept confirmation
    this.page.once('dialog', async dialog => {
      await dialog.accept()
    })

    await this.getDeleteColumnButton().click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Cancel column edit
   */
  async cancelColumnEdit() {
    await this.getCloseColumnModalButton().click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Verify card modal is visible
   */
  async verifyCardModalVisible() {
    await expect(this.getCardModal()).toBeVisible()
  }

  /**
   * Verify card modal is not visible
   */
  async verifyCardModalNotVisible() {
    await expect(this.getCardModal()).not.toBeVisible()
  }

  /**
   * Verify column edit modal is visible
   */
  async verifyColumnEditModalVisible() {
    await expect(this.getColumnEditModal()).toBeVisible()
  }

  /**
   * Verify column edit modal is not visible
   */
  async verifyColumnEditModalNotVisible() {
    await expect(this.getColumnEditModal()).not.toBeVisible()
  }

  /**
   * Get current card title from modal
   */
  async getCardTitle(): Promise<string> {
    return await this.getCardTitleInput().inputValue()
  }

  /**
   * Get current card description from modal
   */
  async getCardDescription(): Promise<string> {
    return await this.getCardDescriptionTextarea().inputValue()
  }

  /**
   * Get current column name from modal
   */
  async getColumnName(): Promise<string> {
    return await this.getColumnNameInput().inputValue()
  }

  /**
   * Click outside modal to close it (backdrop click)
   */
  async clickOutsideModal() {
    await this.page.mouse.click(0, 0)
    await this.page.waitForTimeout(500)
  }

  /**
   * Take screenshot of modal
   */
  async takeScreenshot(filename: string) {
    const cardModal = this.getCardModal()
    const columnEditModal = this.getColumnEditModal()
    const modal = await cardModal.isVisible() ? cardModal : columnEditModal
    await modal.screenshot({ path: `test-results/${filename}` })
  }
}
