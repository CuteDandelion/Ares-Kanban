/**
 * Lightweight TDD Tests for Column Component
 *
 * These tests verify basic rendering and interaction of Column component.
 * Tests will be updated when connecting to real backend.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Column } from '@/components/kanban/Column';

import type { Column as ColumnType, Card as CardType } from '@/types';

const mockCard: CardType = {
  id: 'card-1',
  column_id: 'col-1',
  board_id: 'board-1',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo',
  priority: 'high',
  assignee_id: null,
  assignee_type: null,
  created_by: 'mock-user-1',
  due_date: null,
  tags: [],
  agent_context: {},
  position: 0,
  version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  completed_at: null,
};

const mockColumn: ColumnType & { cards: CardType[] } = {
  id: 'col-1',
  board_id: 'board-1',
  title: 'To Do',
  order_index: 0,
  wip_limit: null,
  settings: {},
  created_at: new Date().toISOString(),
  cards: [mockCard],
};

const mockOnCardMove = jest.fn();
const mockOnColumnUpdate = jest.fn();
const mockOnColumnDelete = jest.fn();
const mockOnCardEdit = jest.fn();
const mockOnCardDelete = jest.fn();
const mockOnCardAdd = jest.fn();

describe('Column Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render column title', () => {
      render(
        <Column
          column={mockColumn}
          onCardMove={mockOnCardMove}
          onColumnUpdate={mockOnColumnUpdate}
          onColumnDelete={mockOnColumnDelete}
          onCardEdit={mockOnCardEdit}
          onCardDelete={mockOnCardDelete}
          onCardAdd={mockOnCardAdd}
        />
      );

      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    it('should render all cards in column', () => {
      render(
        <Column
          column={mockColumn}
          onCardMove={mockOnCardMove}
          onColumnUpdate={mockOnColumnUpdate}
          onColumnDelete={mockOnColumnDelete}
          onCardEdit={mockOnCardEdit}
          onCardDelete={mockOnCardDelete}
          onCardAdd={mockOnCardAdd}
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should display card count', () => {
      render(
        <Column
          column={mockColumn}
          onCardMove={mockOnCardMove}
          onColumnUpdate={mockOnColumnUpdate}
          onColumnDelete={mockOnColumnDelete}
          onCardEdit={mockOnCardEdit}
          onCardDelete={mockOnCardDelete}
          onCardAdd={mockOnCardAdd}
        />
      );

      const cardCount = screen.getByText('1');
      expect(cardCount).toBeInTheDocument();
    });

    it('should render empty column when no cards', () => {
      const emptyColumn = { ...mockColumn, cards: [] };

      render(
        <Column
          column={emptyColumn}
          onCardMove={mockOnCardMove}
          onColumnUpdate={mockOnColumnUpdate}
          onColumnDelete={mockOnColumnDelete}
          onCardEdit={mockOnCardEdit}
          onCardDelete={mockOnCardDelete}
          onCardAdd={mockOnCardAdd}
        />
      );

      expect(screen.getByText('To Do')).toBeInTheDocument();
      const cardCount = screen.getByText('0');
      expect(cardCount).toBeInTheDocument();
    });

    it('should display add card button', () => {
      render(
        <Column
          column={mockColumn}
          onCardMove={mockOnCardMove}
          onColumnUpdate={mockOnColumnUpdate}
          onColumnDelete={mockOnColumnDelete}
          onCardEdit={mockOnCardEdit}
          onCardDelete={mockOnCardDelete}
          onCardAdd={mockOnCardAdd}
        />
      );

      const addCardButton = screen.getByRole('button', { name: /add card/i });
      expect(addCardButton).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should allow editing column title', () => {
      render(
        <Column
          column={mockColumn}
          onCardMove={mockOnCardMove}
          onColumnUpdate={mockOnColumnUpdate}
          onColumnDelete={mockOnColumnDelete}
          onCardEdit={mockOnCardEdit}
          onCardDelete={mockOnCardDelete}
          onCardAdd={mockOnCardAdd}
        />
      );

      const titleElement = screen.getByText('To Do');
      fireEvent.click(titleElement);

      // After clicking, title should become editable
      const inputElement = screen.getByDisplayValue('To Do');
      expect(inputElement).toBeInTheDocument();
    });

    it('should allow adding new card', () => {
      render(
        <Column
          column={mockColumn}
          onCardMove={mockOnCardMove}
          onColumnUpdate={mockOnColumnUpdate}
          onColumnDelete={mockOnColumnDelete}
          onCardEdit={mockOnCardEdit}
          onCardDelete={mockOnCardDelete}
          onCardAdd={mockOnCardAdd}
        />
      );

      const addCardButton = screen.getByRole('button', { name: /add card/i });
      fireEvent.click(addCardButton);

      // Dialog should open
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });
});
