/**
 * CardModal Component Tests
 *
 * Essential tests for CardModal component functionality.
 * Tests rendering, form interactions, save/delete operations.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CardModal from '@/components/CardModal'
import { renderWithProviders } from '../utils/test-helpers'

// Mock window.confirm
global.confirm = jest.fn(() => true)

describe('CardModal Component', () => {
  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test Description',
    position: 0,
    column_id: 'col-1',
    metadata: { priority: 'high' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockOnClose = jest.fn()
  const mockOnUpdate = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders modal when card prop is provided', () => {
      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Card Details')).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockCard.title)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockCard.description as string)).toBeInTheDocument()
      expect(screen.getByText(mockCard.id)).toBeInTheDocument()
    })

    it('does not render when card prop is null', () => {
      const { container } = renderWithProviders(
        <CardModal
          card={null}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('displays metadata when present', () => {
      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Metadata')).toBeInTheDocument()
      expect(screen.getByText(/"priority":\s*"high"/)).toBeInTheDocument()
    })

    it('does not display metadata section when metadata is empty', () => {
      const cardWithoutMetadata = { ...mockCard, metadata: {} }

      renderWithProviders(
        <CardModal
          card={cardWithoutMetadata}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.queryByText('Metadata')).not.toBeInTheDocument()
    })

    it('displays timestamps when present', () => {
      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText(/Created:/i)).toBeInTheDocument()
      expect(screen.getByText(/Updated:/i)).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('updates title when typing in input', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      const titleInput = screen.getByLabelText('Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      expect(titleInput).toHaveValue('Updated Title')
    })

    it('updates description when typing in textarea', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      const descriptionTextarea = screen.getByLabelText('Description')
      await user.clear(descriptionTextarea)
      await user.type(descriptionTextarea, 'Updated Description')

      expect(descriptionTextarea).toHaveValue('Updated Description')
    })

    it('calls onUpdate with correct data when Save clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      const saveButton = screen.getByText('Save Changes')
      await user.click(saveButton)

      expect(mockOnUpdate).toHaveBeenCalledWith(mockCard.id, {
        title: mockCard.title,
        description: mockCard.description,
      })
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('does not call onUpdate when card is null', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <CardModal
          card={null}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      // Should not render, so no interactions possible
      expect(mockOnUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Delete Functionality', () => {
    it('shows confirmation dialog when Delete clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this card?')
    })

    it('calls onDelete when confirmed', async () => {
      const user = userEvent.setup()
      global.confirm = jest.fn(() => true)

      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith(mockCard.id)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('does not call onDelete when cancelled', async () => {
      const user = userEvent.setup()
      global.confirm = jest.fn(() => false)

      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(mockOnDelete).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Cancel Functionality', () => {
    it('calls onClose when Cancel clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
      expect(mockOnUpdate).not.toHaveBeenCalled()
      expect(mockOnDelete).not.toHaveBeenCalled()
    })

    it('does not call onUpdate when Cancel clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Close Button', () => {
    it('calls onClose when close button (X) clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <CardModal
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      const closeButton = screen.getByRole('button', { name: '' })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles card without description', () => {
      const cardWithoutDescription = { ...mockCard, description: undefined }

      renderWithProviders(
        <CardModal
          card={cardWithoutDescription}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      const descriptionTextarea = screen.getByLabelText('Description')
      expect(descriptionTextarea).toHaveValue('')
    })

    it('handles card without timestamps', () => {
      const cardWithoutTimestamps = { ...mockCard }
      delete cardWithoutTimestamps.created_at
      delete cardWithoutTimestamps.updated_at

      renderWithProviders(
        <CardModal
          card={cardWithoutTimestamps}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.queryByText(/Created:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Updated:/i)).not.toBeInTheDocument()
    })

    it('handles empty metadata', () => {
      const cardWithEmptyMetadata = { ...mockCard, metadata: {} }

      renderWithProviders(
        <CardModal
          card={cardWithEmptyMetadata}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.queryByText('Metadata')).not.toBeInTheDocument()
    })
  })
})
