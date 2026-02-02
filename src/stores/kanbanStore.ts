/**
 * Phase 2: Supabase Kanban Store (Zustand) - Optimistic Updates for Real-Time Collaboration
 *
 * Real Supabase database integration with real-time subscriptions.
 * Uses optimistic updates for instant UI feedback - critical for multi-agent collaboration.
 * No disruptive loading states - all operations feel instantaneous.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Board, Column, Card, CardCreate, CardMove, Activity } from '@/types';

// Extended types for the store
interface ColumnWithCards extends Column {
  cards: Card[];
}

interface BoardWithColumns extends Board {
  columns: ColumnWithCards[];
}

export interface KanbanState {
  boards: Board[];
  currentBoard: BoardWithColumns | null;
  isLoading: boolean; // Only used for initial load, not for operations
  error: string | null;
  pendingOperations: Set<string>; // Track in-flight operations
  
  // Real-time subscriptions
  subscriptions: {
    cards?: any;
    columns?: any;
    presence?: any;
    activities?: any;
  };

  // Actions
  loadBoards: () => Promise<void>;
  loadBoard: (boardId: string) => Promise<void>;
  createBoard: (boardData: { name: string; description?: string; organization_id?: string }) => Promise<Board | null>;
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  
  // Column actions - optimistic
  createColumn: (boardId: string, columnData: { title: string; position?: number; wip_limit?: number }) => Promise<void>;
  updateColumn: (columnId: string, updates: Partial<Column>) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  moveColumn: (columnId: string, newIndex: number) => Promise<void>;
  
  // Card actions - optimistic
  createCard: (columnId: string, cardData: CardCreate) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  moveCard: (moveData: CardMove) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  
  // Real-time subscriptions
  subscribeToBoard: (boardId: string) => Promise<void>;
  unsubscribeFromBoard: () => void;
  
  // Error handling
  clearError: () => void;
}

// Generate temporary ID for optimistic updates
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Debounce utility for subscription reloads
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  // Initial state
  boards: [],
  currentBoard: null,
  isLoading: false,
  error: null,
  pendingOperations: new Set(),
  subscriptions: {},

  // Load all boards for the current user
  loadBoards: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: boards, error } = await supabase
        .from('boards')
        .select(`
          *,
          board_members!inner(user_id, role)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      set({
        boards: boards?.map(b => ({
          id: b.id,
          organization_id: b.organization_id,
          owner_id: b.created_by,
          name: b.name,
          settings: b.settings || {},
          is_public: (b.settings as any)?.visibility === 'public',
          created_at: b.created_at,
          updated_at: b.updated_at,
        })) || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading boards:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load boards',
      });
    }
  },

  // Load a specific board with columns and cards
  loadBoard: async (boardId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Load board details
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardError) {
        throw boardError;
      }

      // Load columns
      const { data: columns, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (columnsError) {
        throw columnsError;
      }

      // Load cards for all columns
      const columnIds = columns?.map(c => c.id) || [];
      let cards: any[] = [];
      
      if (columnIds.length > 0) {
        const { data: cardsData, error: cardsError } = await supabase
          .from('cards')
          .select('*')
          .in('column_id', columnIds)
          .order('position', { ascending: true });

        if (cardsError) {
          throw cardsError;
        }
        
        cards = cardsData || [];
      }

      // Map columns with their cards
      const columnsWithCards: ColumnWithCards[] = (columns || []).map(col => ({
        id: col.id,
        board_id: col.board_id,
        title: col.title,
        order_index: col.position,
        wip_limit: col.wip_limit,
        settings: col.settings || {},
        created_at: col.created_at,
        cards: cards
          .filter(c => c.column_id === col.id)
          .map(c => ({
            id: c.id,
            column_id: c.column_id,
            board_id: c.board_id,
            title: c.title,
            description: c.description,
            assignee_type: c.assignee_type || null,
            assignee_id: c.assignee_id || null,
            priority: c.priority || 'none',
            status: c.status || 'todo',
            tags: c.tags || [],
            due_date: c.due_date || null,
            position: c.position || 0,
            version: c.version || 1,
            agent_context: c.agent_context || {},
            created_by: c.created_by || null,
            created_at: c.created_at,
            updated_at: c.updated_at,
            completed_at: c.completed_at || null,
          })) as Card[],
      }));

      set({
        currentBoard: {
          id: board.id,
          organization_id: board.organization_id,
          owner_id: board.created_by,
          name: board.name,
          description: board.description,
          settings: board.settings || {},
          is_public: (board.settings as any)?.visibility === 'public',
          created_at: board.created_at,
          updated_at: board.updated_at,
          columns: columnsWithCards,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading board:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load board',
      });
    }
  },

  // Create a new board
  createBoard: async (boardData) => {
    set({ isLoading: true, error: null });

    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      // Create board
      const { data: board, error } = await supabase
        .from('boards')
        .insert({
          name: boardData.name,
          description: boardData.description || null,
          organization_id: boardData.organization_id || null,
          created_by: authUser.id,
          settings: { visibility: 'private', allow_agent_assignment: true },
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add creator as board member with owner role
      await supabase
        .from('board_members')
        .insert({
          board_id: board.id,
          user_id: authUser.id,
          role: 'owner',
        });

      // Create default columns
      const defaultColumns = ['To Do', 'In Progress', 'Review', 'Done'];
      const columnsToInsert = defaultColumns.map((title, index) => ({
        board_id: board.id,
        title,
        position: index,
        wip_limit: null,
        settings: {},
      }));

      await supabase.from('columns').insert(columnsToInsert);

      // Refresh boards list
      await get().loadBoards();

      set({ isLoading: false });
      
      return {
        id: board.id,
        organization_id: board.organization_id,
        owner_id: board.created_by,
        name: board.name,
        settings: board.settings || {},
        is_public: (board.settings as any)?.visibility === 'public',
        created_at: board.created_at,
        updated_at: board.updated_at,
      };
    } catch (error) {
      console.error('Error creating board:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create board',
      });
      return null;
    }
  },

  // Update board
  updateBoard: async (boardId: string, updates: Partial<Board>) => {
    const previousBoard = get().currentBoard ? { ...get().currentBoard! } : null;
    
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.settings !== undefined) updateData.settings = updates.settings;

      // Optimistic update
      const currentBoard = get().currentBoard;
      if (currentBoard?.id === boardId) {
        set({
          currentBoard: { ...currentBoard, ...updates },
        });
      }

      const { error } = await supabase
        .from('boards')
        .update(updateData)
        .eq('id', boardId);

      if (error) {
        throw error;
      }

      // Refresh boards list
      await get().loadBoards();
    } catch (error) {
      console.error('Error updating board:', error);
      // Rollback to previous state
      if (previousBoard) {
        set({ currentBoard: previousBoard });
      }
      set({
        error: error instanceof Error ? error.message : 'Failed to update board',
      });
    }
  },

  // Delete board
  deleteBoard: async (boardId: string) => {
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);

      if (error) {
        throw error;
      }

      // Clear current board if it was deleted
      if (get().currentBoard?.id === boardId) {
        set({ currentBoard: null });
      }

      // Refresh boards list
      await get().loadBoards();
    } catch (error) {
      console.error('Error deleting board:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete board',
      });
    }
  },

  // Create a new column - OPTIMISTIC
  createColumn: async (boardId: string, columnData: { title: string; position?: number; wip_limit?: number }) => {
    // Validation
    if (!boardId || typeof boardId !== 'string') {
      set({ error: 'Invalid board ID' });
      return;
    }
    
    if (!columnData.title?.trim()) {
      set({ error: 'Column title is required' });
      return;
    }

    const currentBoard = get().currentBoard;
    
    // Validate we're working with the correct board
    if (!currentBoard || currentBoard.id !== boardId) {
      console.error('Board mismatch:', { expected: boardId, actual: currentBoard?.id });
      set({ error: 'Board not loaded or mismatch' });
      return;
    }
    
    const tempId = generateTempId();
    const operationId = `create-column-${tempId}`;
    
    // Track pending operation and clear errors
    set(state => ({
      pendingOperations: new Set([...state.pendingOperations, operationId]),
      error: null,
    }));
    
    try {
      // Get current max position
      const position = columnData.position ?? currentBoard.columns.length;
      
      // OPTIMISTIC: Add column immediately using functional update
      const optimisticColumn: ColumnWithCards = {
        id: tempId,
        board_id: boardId,
        title: columnData.title,
        order_index: position,
        wip_limit: columnData.wip_limit || null,
        settings: {},
        created_at: new Date().toISOString(),
        cards: [],
      };
      
      set(state => ({
        currentBoard: state.currentBoard ? {
          ...state.currentBoard,
          columns: [...state.currentBoard.columns, optimisticColumn],
        } : null,
      }));

      // Server operation
      const { data: newColumn, error } = await supabase
        .from('columns')
        .insert({
          board_id: boardId,
          title: columnData.title,
          position,
          wip_limit: columnData.wip_limit || null,
          settings: {},
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update with real ID using functional set to ensure fresh state
      set(state => {
        if (state.currentBoard?.id !== boardId) return state;
        return {
          currentBoard: {
            ...state.currentBoard,
            columns: state.currentBoard.columns.map(col =>
              col.id === tempId ? { ...col, id: newColumn.id } : col
            ),
          },
        };
      });
    } catch (error) {
      console.error('Error creating column:', error);
      // Rollback using functional set
      set(state => {
        if (!state.currentBoard) return state;
        return {
          currentBoard: {
            ...state.currentBoard,
            columns: state.currentBoard.columns.filter(col => col.id !== tempId),
          },
          error: error instanceof Error ? error.message : 'Failed to create column',
        };
      });
    } finally {
      // Remove pending operation
      set(state => ({
        pendingOperations: new Set([...state.pendingOperations].filter(op => op !== operationId)),
      }));
    }
  },

  // Update column - OPTIMISTIC
  updateColumn: async (columnId: string, updates: Partial<Column>) => {
    const previousBoard = get().currentBoard ? { ...get().currentBoard! } : null;
    
    try {
      // OPTIMISTIC: Update immediately
      const currentBoard = get().currentBoard;
      if (currentBoard) {
        set({
          currentBoard: {
            ...currentBoard,
            columns: currentBoard.columns.map(col =>
              col.id === columnId ? { ...col, ...updates } : col
            ),
          },
        });
      }

      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.order_index !== undefined) updateData.position = updates.order_index;
      if (updates.wip_limit !== undefined) updateData.wip_limit = updates.wip_limit;

      const { error } = await supabase
        .from('columns')
        .update(updateData)
        .eq('id', columnId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating column:', error);
      // Rollback to previous state
      if (previousBoard) {
        set({ currentBoard: previousBoard });
      }
      set({
        error: error instanceof Error ? error.message : 'Failed to update column',
      });
    }
  },

  // Delete column - OPTIMISTIC
  deleteColumn: async (columnId: string) => {
    try {
      // OPTIMISTIC: Remove immediately
      const currentBoard = get().currentBoard;
      if (currentBoard) {
        set({
          currentBoard: {
            ...currentBoard,
            columns: currentBoard.columns.filter(col => col.id !== columnId),
          },
        });
      }

      const { error } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting column:', error);
      // Revert by reloading
      const boardId = get().currentBoard?.id;
      if (boardId) {
        await get().loadBoard(boardId);
      }
      set({
        error: error instanceof Error ? error.message : 'Failed to delete column',
      });
    }
  },

  // Move column - OPTIMISTIC
  moveColumn: async (columnId: string, newIndex: number) => {
    try {
      const currentBoard = get().currentBoard;
      if (!currentBoard) return;

      // Find the column to move
      const currentIndex = currentBoard.columns.findIndex(col => col.id === columnId);
      if (currentIndex === -1) return;
      if (currentIndex === newIndex) return; // No change needed

      // OPTIMISTIC: Reorder columns immediately
      const columns = [...currentBoard.columns];
      const [movedColumn] = columns.splice(currentIndex, 1);
      columns.splice(newIndex, 0, movedColumn);

      // Update order_index for all columns
      const updatedColumns = columns.map((col, index) => ({
        ...col,
        order_index: index,
      }));

      set({
        currentBoard: {
          ...currentBoard,
          columns: updatedColumns,
        },
      });

      // Server operation - update all affected columns' positions
      const updates = updatedColumns.map(col => ({
        id: col.id,
        position: col.order_index,
      }));

      // Update each column position individually
      for (const update of updates) {
        const { error } = await supabase
          .from('columns')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error moving column:', error);
      // Revert by reloading
      const boardId = get().currentBoard?.id;
      if (boardId) {
        await get().loadBoard(boardId);
      }
      set({
        error: error instanceof Error ? error.message : 'Failed to move column',
      });
    }
  },

  // Create a new card - OPTIMISTIC
  createCard: async (columnId: string, cardData: CardCreate) => {
    // Validation
    if (!columnId || typeof columnId !== 'string') {
      set({ error: 'Invalid column ID' });
      return;
    }
    
    if (!cardData.title?.trim()) {
      set({ error: 'Card title is required' });
      return;
    }

    const currentBoard = get().currentBoard;
    const column = currentBoard?.columns.find(c => c.id === columnId);
    
    if (!column || !currentBoard) {
      set({ error: 'Column or board not found' });
      return;
    }
    
    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      set({ error: 'User not authenticated' });
      return;
    }

    const tempId = generateTempId();
    const operationId = `create-card-${tempId}`;
    
    // Track pending operation and clear errors
    set(state => ({
      pendingOperations: new Set([...state.pendingOperations, operationId]),
      error: null,
    }));
    
    try {
      // OPTIMISTIC: Add card immediately using functional update
      const optimisticCard: Card = {
        id: tempId,
        column_id: columnId,
        board_id: currentBoard.id,
        title: cardData.title,
        description: cardData.description || null,
        priority: cardData.priority || 'none',
        status: 'todo',
        tags: cardData.tags || [],
        due_date: cardData.due_date || null,
        position: column.cards.length,
        version: 1,
        agent_context: cardData.agent_context || {},
        assignee_type: null,
        assignee_id: null,
        created_by: authUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };

      set(state => ({
        currentBoard: state.currentBoard ? {
          ...state.currentBoard,
          columns: state.currentBoard.columns.map(col =>
            col.id === columnId
              ? { ...col, cards: [...col.cards, optimisticCard] }
              : col
          ),
        } : null,
      }));

      // Server operation - FIXED: Added board_id
      const { data: newCard, error } = await supabase
        .from('cards')
        .insert({
          column_id: columnId,
          board_id: currentBoard.id, // CRITICAL FIX: Added board_id
          title: cardData.title,
          description: cardData.description || null,
          priority: cardData.priority || 'none',
          status: 'todo',
          tags: cardData.tags || [],
          due_date: cardData.due_date || null,
          position: column.cards.length,
          agent_context: cardData.agent_context || {},
          created_by: authUser.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update with real ID using functional set
      set(state => {
        if (!state.currentBoard) return state;
        return {
          currentBoard: {
            ...state.currentBoard,
            columns: state.currentBoard.columns.map(col =>
              col.id === columnId
                ? {
                    ...col,
                    cards: col.cards.map(card =>
                      card.id === tempId ? { ...card, id: newCard.id } : card
                    ),
                  }
                : col
            ),
          },
        };
      });
    } catch (error) {
      console.error('Error creating card:', error);
      // Rollback using functional set
      set(state => {
        if (!state.currentBoard) return state;
        return {
          currentBoard: {
            ...state.currentBoard,
            columns: state.currentBoard.columns.map(col =>
              col.id === columnId
                ? { ...col, cards: col.cards.filter(card => card.id !== tempId) }
                : col
            ),
          },
          error: error instanceof Error ? error.message : 'Failed to create card',
        };
      });
    } finally {
      // Remove pending operation
      set(state => ({
        pendingOperations: new Set([...state.pendingOperations].filter(op => op !== operationId)),
      }));
    }
  },

  // Update card - OPTIMISTIC
  updateCard: async (cardId: string, updates: Partial<Card>) => {
    const previousBoard = get().currentBoard ? { ...get().currentBoard! } : null;
    
    try {
      // OPTIMISTIC: Update immediately
      const currentBoard = get().currentBoard;
      if (currentBoard) {
        set({
          currentBoard: {
            ...currentBoard,
            columns: currentBoard.columns.map(col => ({
              ...col,
              cards: col.cards.map(card =>
                card.id === cardId ? { ...card, ...updates } : card
              ),
            })),
          },
        });
      }

      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
      if (updates.assignee_type !== undefined) updateData.assignee_type = updates.assignee_type;
      if (updates.assignee_id !== undefined) updateData.assignee_id = updates.assignee_id;
      if (updates.agent_context !== undefined) updateData.agent_context = updates.agent_context;

      const { error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', cardId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating card:', error);
      // Rollback to previous state
      if (previousBoard) {
        set({ currentBoard: previousBoard });
      }
      set({
        error: error instanceof Error ? error.message : 'Failed to update card',
      });
    }
  },

  // Move card between columns - OPTIMISTIC
  moveCard: async (moveData: CardMove) => {
    const { cardId, fromColumnId, toColumnId, newIndex } = moveData;
    
    try {
      // OPTIMISTIC: Move card immediately in UI
      const currentBoard = get().currentBoard;
      if (!currentBoard) return;

      const fromColumn = currentBoard.columns.find(c => c.id === fromColumnId);
      const toColumn = currentBoard.columns.find(c => c.id === toColumnId);
      
      if (!fromColumn) return;

      const cardToMove = fromColumn.cards.find(c => c.id === cardId);
      if (!cardToMove) return;

      // Create updated columns
      const updatedColumns = currentBoard.columns.map(col => {
        if (col.id === fromColumnId) {
          // Remove from source column
          return {
            ...col,
            cards: col.cards.filter(c => c.id !== cardId),
          };
        }
        if (col.id === toColumnId) {
          // Add to target column at new position
          const newCards = [...col.cards];
          const updatedCard = { ...cardToMove, column_id: toColumnId };
          newCards.splice(newIndex, 0, updatedCard);
          return { ...col, cards: newCards };
        }
        return col;
      });

      set({
        currentBoard: {
          ...currentBoard,
          columns: updatedColumns,
        },
      });

      // Server operation
      const { data: card } = await supabase
        .from('cards')
        .select('version')
        .eq('id', cardId)
        .single();

      const { error } = await supabase
        .from('cards')
        .update({
          column_id: toColumnId,
          position: newIndex,
        })
        .eq('id', cardId)
        .eq('version', card?.version || 1);

      if (error) {
        if (error.message.includes('version')) {
          throw new Error('Card was modified by another user. Please refresh and try again.');
        }
        throw error;
      }
    } catch (error) {
      console.error('Error moving card:', error);
      // Revert by reloading
      const boardId = get().currentBoard?.id;
      if (boardId) {
        await get().loadBoard(boardId);
      }
      set({
        error: error instanceof Error ? error.message : 'Failed to move card',
      });
    }
  },

  // Delete card - OPTIMISTIC
  deleteCard: async (cardId: string) => {
    try {
      // OPTIMISTIC: Remove immediately
      const currentBoard = get().currentBoard;
      if (currentBoard) {
        set({
          currentBoard: {
            ...currentBoard,
            columns: currentBoard.columns.map(col => ({
              ...col,
              cards: col.cards.filter(card => card.id !== cardId),
            })),
          },
        });
      }

      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      // Revert by reloading
      const boardId = get().currentBoard?.id;
      if (boardId) {
        await get().loadBoard(boardId);
      }
      set({
        error: error instanceof Error ? error.message : 'Failed to delete card',
      });
    }
  },

  // Subscribe to real-time updates for a board
  subscribeToBoard: async (boardId: string) => {
    const { subscriptions, pendingOperations } = get();
    
    // Unsubscribe from existing subscriptions
    get().unsubscribeFromBoard();

    // Create debounced reload function
    const debouncedLoadBoard = debounce((id: string) => {
      // Only reload if no pending operations to avoid race conditions
      if (get().pendingOperations.size === 0) {
        get().loadBoard(id);
      } else {
        console.log('Skipping reload due to pending operations');
      }
    }, 100);

    try {
      // Subscribe to card changes
      const cardsSubscription = supabase
        .channel(`board:${boardId}:cards`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cards',
            filter: `board_id=eq.${boardId}`,
          },
          (payload) => {
            console.log('Card change received:', payload);
            const currentBoard = get().currentBoard;
            // Only reload if we're viewing this board and have no pending operations
            if (currentBoard?.id === boardId) {
              debouncedLoadBoard(boardId);
            }
          }
        )
        .subscribe();

      // Subscribe to column changes
      const columnsSubscription = supabase
        .channel(`board:${boardId}:columns`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'columns',
            filter: `board_id=eq.${boardId}`,
          },
          (payload) => {
            console.log('Column change received:', payload);
            const currentBoard = get().currentBoard;
            // Only reload if we're viewing this board and have no pending operations
            if (currentBoard?.id === boardId) {
              debouncedLoadBoard(boardId);
            }
          }
        )
        .subscribe();

      set({
        subscriptions: {
          cards: cardsSubscription,
          columns: columnsSubscription,
        },
      });
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }
  },

  // Unsubscribe from real-time updates
  unsubscribeFromBoard: () => {
    const { subscriptions } = get();

    if (subscriptions.cards) {
      supabase.removeChannel(subscriptions.cards);
    }
    if (subscriptions.columns) {
      supabase.removeChannel(subscriptions.columns);
    }
    if (subscriptions.presence) {
      supabase.removeChannel(subscriptions.presence);
    }
    if (subscriptions.activities) {
      supabase.removeChannel(subscriptions.activities);
    }

    set({ subscriptions: {} });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
