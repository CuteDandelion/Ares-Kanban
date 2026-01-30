/**
 * Lightweight TDD Tests for Card Component
 *
 * These tests verify basic rendering and interaction of the Card component.
 * Tests will be updated when connecting to real backend.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Card } from '@/components/kanban/Card';

import type { Card as CardType } from '@/types';

const mockCard: CardType = {
  id: 'card-1',
  column_id: 'col-1',
  board_id: 'board-1',
  title: 'Test Task',
  description: 'This is a test description for card',
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

const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnMove = jest.fn();

describe('Card Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render card title', () => {
      render(
        <Card
          card={mockCard}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should render card description', () => {
      render(
        <Card
          card={mockCard}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      expect(screen.getByText('This is a test description for card')).toBeInTheDocument();
    });

    it('should render priority badge', () => {
      render(
        <Card
          card={mockCard}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      const priorityBadge = screen.getByText(/High/i);
      expect(priorityBadge).toBeInTheDocument();
    });

    it('should render action button', () => {
      render(
        <Card
          card={mockCard}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      const actionButton = screen.getByRole('button', { name: /card actions/i });
      expect(actionButton).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should show action menu when button is clicked', async () => {
      render(
        <Card
          card={mockCard}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      const actionButton = screen.getByRole('button', { name: /card actions/i });
      
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });

    it('should call onEdit when edit button is clicked', async () => {
      render(
        <Card
          card={mockCard}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      const actionButton = screen.getByRole('button', { name: /card actions/i });
      fireEvent.click(actionButton);

      const editButton = await screen.findByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockCard);
    });
  });

  describe('Priority Levels', () => {
    it('should render critical priority badge', () => {
      const criticalCard = { ...mockCard, priority: 'critical' as const };

      render(
        <Card
          card={criticalCard}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      expect(screen.getByText(/Critical/i)).toBeInTheDocument();
    });

    it('should render medium priority badge', () => {
      const mediumCard = { ...mockCard, priority: 'medium' as const };

      render(
        <Card
          card={mediumCard}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });

    it('should render low priority badge', () => {
      const lowCard = { ...mockCard, priority: 'low' as const };

      render(
        <Card
          card={lowCard}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      expect(screen.getByText(/Low/i)).toBeInTheDocument();
    });

    it('should render none priority badge', () => {
      const noneCard = { ...mockCard, priority: 'none' as const };

      render(
        <Card
          card={noneCard}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      expect(screen.getByText(/None/i)).toBeInTheDocument();
    });
  });
});
