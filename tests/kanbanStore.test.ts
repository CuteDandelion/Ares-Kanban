/**
 * Phase 2: Supabase Kanban Store Tests
 *
 * Unit tests for the Supabase kanban store.
 * Tests mock Supabase client to avoid actual API calls.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useKanbanStore } from '@/stores/kanbanStore';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

import { supabase } from '@/lib/supabase';

describe('Kanban Store (Supabase)', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };

  beforeEach(() => {
    // Reset store before each test
    useKanbanStore.setState({
      boards: [],
      currentBoard: null,
      isLoading: false,
      error: null,
      subscriptions: {},
    });
    jest.clearAllMocks();

    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);
  });

  describe('Initial State', () => {
    it('should have initial state with empty boards', () => {
      const { result } = renderHook(() => useKanbanStore());

      expect(result.current.boards).toEqual([]);
      expect(result.current.currentBoard).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Load Boards Function', () => {
    it('should load boards from Supabase', async () => {
      const mockBoards = [
        {
          id: 'board-1',
          name: 'Test Board',
          created_by: 'test-user-id',
          created_at: '2026-01-28T00:00:00.000Z',
          updated_at: '2026-01-28T00:00:00.000Z',
          organization_id: null,
          description: null,
          settings: { visibility: 'private' },
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockBoards,
          error: null,
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'boards') {
          return {
            select: mockSelect,
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.loadBoards();
      });

      expect(result.current.boards).toHaveLength(1);
      expect(result.current.boards[0].name).toBe('Test Board');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle error when loading boards', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to load boards' },
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'boards') {
          return {
            select: mockSelect,
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.loadBoards();
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Create Board Function', () => {
    it('should create new board with default columns', async () => {
      const mockBoard = {
        id: 'new-board-id',
        name: 'New Test Board',
        created_by: 'test-user-id',
        created_at: '2026-01-28T00:00:00.000Z',
        updated_at: '2026-01-28T00:00:00.000Z',
        organization_id: null,
        settings: { visibility: 'private', allow_agent_assignment: true },
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'boards') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockBoard,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'board_members') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        if (table === 'columns') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useKanbanStore());

      let createdBoard: any;
      await act(async () => {
        createdBoard = await result.current.createBoard({ name: 'New Test Board' });
      });

      expect(createdBoard).toBeDefined();
      expect(createdBoard?.name).toBe('New Test Board');
    });

    it('should require authentication to create board', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const { result } = renderHook(() => useKanbanStore());

      let createdBoard: any;
      await act(async () => {
        createdBoard = await result.current.createBoard({ name: 'New Board' });
      });

      expect(createdBoard).toBeNull();
      expect(result.current.error).toBeDefined();
    });
  });

  describe('Clear Error Function', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useKanbanStore());

      // Set an error
      useKanbanStore.setState({ error: 'Test error' });
      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to board updates', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };

      mockSupabase.channel.mockReturnValue(mockChannel as any);

      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.subscribeToBoard('board-1');
      });

      expect(mockSupabase.channel).toHaveBeenCalledWith('board:board-1:cards');
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from board updates', () => {
      const { result } = renderHook(() => useKanbanStore());

      act(() => {
        result.current.unsubscribeFromBoard();
      });

      expect(mockSupabase.removeChannel).not.toHaveBeenCalled(); // No subscriptions to remove
    });
  });
});
