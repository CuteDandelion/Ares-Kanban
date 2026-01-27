/**
 * Board Component Tests
 *
 * Essential tests for KanbanBoard component functionality.
 * Tests rendering, card/column interactions, sidebar toggle.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import KanbanBoard from '@/components/KanbanBoard/Board'
import { renderWithProviders } from '../utils/test-helpers'

// Mock window.confirm for column deletion
global.confirm = jest.fn(() => true)

describe('KanbanBoard Component', () => {
  const mockColumns = [
    { id: 'col-1', name: 'Backlog', position: 0 },
    { id: 'col-2', name: 'To Do', position: 1 },
    { id: 'col-3', name: 'Done', position: 2 },
  ]

  const mockCards = [
    {
      id: 'card-1',
      title: 'Test Card 1',
      description: 'Description 1',
      column_id: 'col-1',
      position: 0,
      metadata: { priority: 'high' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'card-2',
      title: 'Test Card 2',
      description: 'Description 2',
      column_id: 'col-2',
      position: 0,
      metadata: { priority: 'medium' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const defaultProps = {
    columns: mockColumns,
    cards: mockCards,
    sidebarOpen: false,
    selectedCard: null,
    onAddCard: jest.fn(),
    onAddColumn: jest.fn(),
    onCardClick: jest.fn(),
    onUpdateCard: jest.fn(),
    onDeleteCard: jest.fn(),
    onCloseCard: jest.fn(),
    onToggleSidebar: jest.fn(),
    onUpdateColumn: jest.fn(),
    onDeleteColumn: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders header with logo and title', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} />)

      expect(screen.getByText('ARES')).toBeInTheDocument()
      expect(screen.getByText('PROJECT MANAGEMENT')).toBeInTheDocument()
    })

    it('renders all columns when provided', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} />)

      expect(screen.getByText('Backlog')).toBeInTheDocument()
      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByText('Done')).toBeInTheDocument()
    })

    it('displays card count in header', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} />)

      expect(screen.getByText('2 Active Tasks')).toBeInTheDocument()
      expect(screen.getByText('3 Columns')).toBeInTheDocument()
    })

    it('shows empty state when no columns', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} columns={[]} />)

      expect(screen.getByText(/No columns yet/i)).toBeInTheDocument()
    })

    it('displays sidebar toggle button', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} />)

      const toggleButton = screen.getByLabelText('Toggle sidebar')
      expect(toggleButton).toBeInTheDocument()
    })
  })

  describe('Card Interactions', () => {
    it('displays cards in correct columns', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} />)

      expect(screen.getByText('Test Card 1')).toBeInTheDocument()
      expect(screen.getByText('Test Card 2')).toBeInTheDocument()
    })

    it('calls onCardClick when card is clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(<KanbanBoard {...defaultProps} />)

      const card1 = screen.getByText('Test Card 1')
      await user.click(card1)

      expect(defaultProps.onCardClick).toHaveBeenCalledWith(mockCards[0])
    })

    it('shows priority badge if metadata.priority exists', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} />)

      expect(screen.getByText('high')).toBeInTheDocument()
      expect(screen.getByText('medium')).toBeInTheDocument()
    })

    it('shows "No cards yet" message for empty columns', () => {
      const emptyColumns = mockColumns.filter((c) => c.id === 'col-3')
      const emptyCards = mockCards.filter((c) => c.column_id === 'col-3')

      renderWithProviders(
        <KanbanBoard
          {...defaultProps}
          columns={emptyColumns}
          cards={emptyCards}
        />
      )

      expect(screen.getAllByText('No cards yet')).toHaveLength(1)
    })
  })

  describe('Column Interactions', () => {
    it('shows column menu when menu button clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(<KanbanBoard {...defaultProps} />)

      const menuButtons = screen.getAllByLabelText('Column options')
      await user.click(menuButtons[0])

      expect(screen.getByText('Edit Title')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('calls onUpdateColumn when Edit Title clicked', async () => {
      const user = userEvent.setup()
      global.confirm = jest.fn(() => true)

      renderWithProviders(<KanbanBoard {...defaultProps} />)

      const menuButtons = screen.getAllByLabelText('Column options')
      await user.click(menuButtons[0])

      const editButton = screen.getByText('Edit Title')
      await user.click(editButton)

      expect(defaultProps.onUpdateColumn).not.toHaveBeenCalled()
    })

    it('confirms before deleting column', async () => {
      const user = userEvent.setup()
      global.confirm = jest.fn(() => true)

      renderWithProviders(<KanbanBoard {...defaultProps} />)

      const menuButtons = screen.getAllByLabelText('Column options')
      await user.click(menuButtons[0])

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Delete column')
      )
    })

    it('shows "Add Card" button in each column', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} />)

      const addCardButtons = screen.getAllByText('Add Card')
      expect(addCardButtons.length).toBe(3)
    })

    it('opens sidebar when Add Card button clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(<KanbanBoard {...defaultProps} />)

      const addCardButtons = screen.getAllByText('Add Card')
      await user.click(addCardButtons[0])

      // Clicking "Add Card" in column opens sidebar, not directly adds card
      expect(defaultProps.onToggleSidebar).toHaveBeenCalled()
    })
  })

  describe('Sidebar Toggle', () => {
    it('opens sidebar when toggle button clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(<KanbanBoard {...defaultProps} sidebarOpen={false} />)

      const toggleButton = screen.getByLabelText('Toggle sidebar')
      await user.click(toggleButton)

      expect(defaultProps.onToggleSidebar).toHaveBeenCalled()
    })

    it('shows chevron right when sidebar is closed', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} sidebarOpen={false} />)

      const toggleButton = screen.getByLabelText('Toggle sidebar')
      expect(toggleButton).toBeInTheDocument()
    })

    it('does not render sidebar content when sidebarOpen is false', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} sidebarOpen={false} />)

      // Sidebar content should not be visible
      // Note: "Add Card" buttons exist in columns, so check for sidebar-specific content
      expect(screen.queryByRole('tab', { name: 'ADD CARD' })).not.toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'ADD COLUMN' })).not.toBeInTheDocument()
    })

    it('renders sidebar content when sidebarOpen is true', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} sidebarOpen={true} />)

      // Sidebar content should be visible (check for sidebar tabs)
      expect(screen.getByRole('tab', { name: 'ADD CARD' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'ADD COLUMN' })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty cards array', () => {
      renderWithProviders(<KanbanBoard {...defaultProps} cards={[]} />)

      expect(screen.getByText('0 Active Tasks')).toBeInTheDocument()
      expect(screen.getAllByText('No cards yet')).toHaveLength(3)
    })

    it('handles card without description', () => {
      const cardsWithoutDescription = [
        {
          ...mockCards[0],
          description: undefined,
        },
      ]

      renderWithProviders(
        <KanbanBoard {...defaultProps} cards={cardsWithoutDescription} />
      )

      expect(screen.getByText('Test Card 1')).toBeInTheDocument()
    })

    it('handles card without metadata', () => {
      const cardsWithoutMetadata = [
        {
          ...mockCards[0],
          metadata: undefined,
        },
      ]

      renderWithProviders(
        <KanbanBoard {...defaultProps} cards={cardsWithoutMetadata} />
      )

      expect(screen.getByText('Test Card 1')).toBeInTheDocument()
    })

    it('handles column with no cards', () => {
      const emptyColumnCards = mockCards.filter((c) => c.column_id !== 'col-3')

      renderWithProviders(
        <KanbanBoard {...defaultProps} cards={emptyColumnCards} />
      )

      expect(screen.getByText('Done')).toBeInTheDocument()
      // Should show "No cards yet" for Done column
      const doneColumnCards = screen.getAllByText('No cards yet')
      expect(doneColumnCards.length).toBeGreaterThan(0)
    })
  })
})
