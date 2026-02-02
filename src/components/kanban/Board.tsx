'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DndContext, 
  DragOverlay, 
  pointerWithin,
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent, 
  DragOverEvent,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType, Card as CardType, CardPriority } from '@/types';

// Extended Column type that includes cards (as used in the store)
interface ColumnWithCards extends ColumnType {
  cards: CardType[];
}
import { Column } from './Column';
import { ListView } from './ListView';
import { AresButton } from '@/components/ui/ares-button';
import { AresInput } from '@/components/ui/ares-input';
import { Plus, ArrowLeft, LayoutList, X, Columns, Trash2, Calendar, Tag, AlertCircle, Terminal } from 'lucide-react';
import { useKanbanStore } from '@/stores/kanbanStore';
import { AresLogo } from '@/components/branding/AresLogo';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CLIPanel } from '@/components/layout/CLIPanel';
import { useCLI } from '@/cli/useCLI';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { PulsingStatusDot } from '@/components/ui/PulsingStatusDot';
import { useSettingsStore } from '@/stores/settingsStore';
import ClaudeService from '@/lib/claude/claudeService';
import { dockerSandbox } from '@/lib/sandbox/DockerSandbox';

interface BoardProps {
  boardId: string;
}

type ViewMode = 'board' | 'list';

const priorityOptions: { value: CardPriority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'text-red-400 bg-red-950/50 border-red-600' },
  { value: 'high', label: 'High', color: 'text-orange-400 bg-orange-950/50 border-orange-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400 bg-yellow-950/50 border-yellow-600' },
  { value: 'low', label: 'Low', color: 'text-green-400 bg-green-950/50 border-green-600' },
  { value: 'none', label: 'None', color: 'text-ares-dark-400 bg-ares-dark-750 border-ares-dark-600' },
];

export function Board({ boardId }: BoardProps) {
  const router = useRouter();
  const {
    currentBoard,
    isLoading,
    loadBoard,
    createCard,
    updateCard,
    moveCard,
    deleteCard,
    updateColumn,
    createColumn,
    deleteColumn,
    moveColumn,
    subscribeToBoard,
    unsubscribeFromBoard,
  } = useKanbanStore();

  // Settings
  const { claudeEnabled, claudeConnectionStatus, claudeApiKey, claudeModel } = useSettingsStore();

  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnWithCards | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  
  // Edit Card Dialog State
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<CardPriority>('none');
  const [editTags, setEditTags] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  
  // Add Column Dialog State
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  
  // CLI State
  const [showCLI, setShowCLI] = useState(false);
  
  // Initialize Claude service
  const claudeServiceRef = React.useRef<ClaudeService | null>(null);
  
  React.useEffect(() => {
    if (claudeApiKey && claudeModel) {
      // Create or update Claude service when API key or model changes
      claudeServiceRef.current = new ClaudeService({ 
        apiKey: claudeApiKey,
        model: claudeModel,
      });
      // Set the store for the Claude service
      const store = useKanbanStore.getState();
      claudeServiceRef.current.setStore(() => useKanbanStore.getState());
    }
  }, [claudeApiKey, claudeModel]);
  
  const { messages, isProcessing, cliHeight, setCLIHeight, handleCommandSubmit, handleClearOutput } = useCLI({
    claudeService: claudeServiceRef.current || undefined,
    claudeEnabled: claudeEnabled && !!claudeApiKey,
  });
  
  // DndKit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Track drag over state for visual feedback
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Load board on mount and subscribe to real-time updates
  useEffect(() => {
    loadBoard(boardId);
    subscribeToBoard(boardId);
    
    return () => {
      unsubscribeFromBoard();
    };
  }, [boardId, loadBoard, subscribeToBoard, unsubscribeFromBoard]);

  // Keyboard shortcut for toggling CLI (Ctrl+`)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setShowCLI(prev => !prev);
      }
      // Esc to close CLI
      if (e.key === 'Escape' && showCLI) {
        setShowCLI(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCLI]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id.toString();
    
    if (!currentBoard) return;

    // Check if it's a column being dragged
    const column = currentBoard.columns.find(col => col.id === activeId);
    if (column) {
      setActiveColumn(column as ColumnWithCards);
      return;
    }
    
    // Find the card in the current board
    for (const col of currentBoard.columns) {
      const card = col.cards.find(c => c.id === activeId);
      if (card) {
        setActiveCard(card);
        break;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    
    if (!over || !currentBoard) {
      setDragOverColumnId(null);
      return;
    }

    const overId = over.id.toString();
    
    // Find which column we're dragging over
    const column = currentBoard.columns.find(col => col.id === overId);
    if (column) {
      setDragOverColumnId(column.id);
      return;
    }
    
    // Check if we're over a card
    for (const col of currentBoard.columns) {
      const card = col.cards.find(c => c.id === overId);
      if (card) {
        setDragOverColumnId(col.id);
        return;
      }
    }
    
    setDragOverColumnId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColumn(null);
    setDragOverColumnId(null);

    if (!over || !currentBoard) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Don't do anything if dropped on itself
    if (activeId === overId) return;

    // Check if this is a column drag operation
    const activeColumnData = currentBoard.columns.find(col => col.id === activeId);
    const overColumnData = currentBoard.columns.find(col => col.id === overId);

    if (activeColumnData) {
      // This is a column reorder operation
      const sourceIndex = currentBoard.columns.findIndex(col => col.id === activeId);
      const targetIndex = currentBoard.columns.findIndex(col => col.id === overId);

      if (sourceIndex === -1 || targetIndex === -1) return;
      if (sourceIndex === targetIndex) return;

      try {
        await moveColumn(activeId, targetIndex);
      } catch (error) {
        console.error('Failed to move column:', error);
      }
      return;
    }

    // This is a card drag operation
    // Find the card and columns
    let sourceColumnId: string | null = null;
    let sourceIndex: number = -1;
    let targetColumnId: string | null = null;
    let targetIndex: number = 0;
    let cardToMove: CardType | null = null;

    // Find source column, card, and its index
    for (const col of currentBoard.columns) {
      const cardIndex = col.cards.findIndex(c => c.id === activeId);
      if (cardIndex !== -1) {
        sourceColumnId = col.id;
        sourceIndex = cardIndex;
        cardToMove = col.cards[cardIndex];
        break;
      }
    }

    if (!sourceColumnId || !cardToMove) return;

    // Find target - first check if dropped on a column directly
    if (overColumnData) {
      targetColumnId = overColumnData.id;
      // If dropping on an empty area or at the end, place at the end
      targetIndex = overColumnData.cards.length;
    } else {
      // Dropped on a card - find which column contains the target card
      for (const col of currentBoard.columns) {
        const overCardIndex = col.cards.findIndex(c => c.id === overId);
        if (overCardIndex !== -1) {
          targetColumnId = col.id;
          // If in same column, calculate proper index
          if (sourceColumnId === targetColumnId) {
            // When reordering within same column, adjust index based on drag direction
            if (sourceIndex < overCardIndex) {
              // Dragging down: target index is the over card's position
              targetIndex = overCardIndex;
            } else {
              // Dragging up: target index is after the over card
              targetIndex = overCardIndex + 1;
            }
          } else {
            // Different column: insert at target card's position
            targetIndex = overCardIndex;
          }
          break;
        }
      }
    }

    if (!targetColumnId) return;

    // Same column, same position - no change needed
    if (sourceColumnId === targetColumnId && sourceIndex === targetIndex) return;

    // Adjust target index for same-column moves
    if (sourceColumnId === targetColumnId && sourceIndex < targetIndex) {
      targetIndex = targetIndex - 1;
    }

    // Move card
    try {
      await moveCard({
        cardId: activeId,
        fromColumnId: sourceColumnId,
        toColumnId: targetColumnId,
        newIndex: targetIndex,
      });
    } catch (error) {
      console.error('Failed to move card:', error);
    }
  };

  // Custom drop animation
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const handleAddCard = async (columnId: string, title: string) => {
    try {
      await createCard(columnId, { title });
    } catch (error) {
      console.error('Failed to add card:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard(cardId);
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const handleEditCard = (card: CardType) => {
    setEditingCard(card);
    setEditTitle(card.title);
    setEditDescription(card.description || '');
    setEditPriority(card.priority);
    setEditTags(card.tags?.join(', ') || '');
    setEditDueDate(card.due_date ? card.due_date.split('T')[0] : '');
  };

  const handleSaveEdit = async () => {
    if (!editingCard || !editTitle.trim()) return;
    
    try {
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
      
      await updateCard(editingCard.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        priority: editPriority,
        tags,
        due_date: editDueDate || null,
      });
      setEditingCard(null);
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditTitle('');
    setEditDescription('');
    setEditPriority('none');
    setEditTags('');
    setEditDueDate('');
  };

  const handleUpdateColumn = async (columnId: string, updates: Partial<ColumnType>) => {
    try {
      await updateColumn(columnId, updates);
    } catch (error) {
      console.error('Failed to update column:', error);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await deleteColumn(columnId);
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !currentBoard) return;
    
    try {
      await createColumn(currentBoard.id, { title: newColumnTitle.trim() });
      setNewColumnTitle('');
      setShowAddColumn(false);
    } catch (error) {
      console.error('Failed to add column:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ares-dark-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ares-red-600 to-ares-red-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <p className="text-ares-dark-400">Loading board...</p>
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ares-dark-950">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-ares-dark-800 flex items-center justify-center mx-auto mb-6">
            <LayoutList className="h-10 w-10 text-ares-dark-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Board not found</h3>
          <p className="text-ares-dark-400 mb-6">
            The board you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <AresButton onClick={() => router.push('/boards')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Boards
          </AresButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ares-dark-950">
      {/* Header */}
      <header className="bg-ares-dark-900/95 backdrop-blur border-b border-ares-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/boards')}
                className="p-2 rounded-lg hover:bg-ares-dark-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-ares-dark-400" />
              </button>
              
              <AresLogo size="sm" showText={false} />
              
              <div>
                <h1 className="text-xl font-bold text-white">
                  {currentBoard.name}
                </h1>
                <p className="text-xs text-ares-dark-400">
                  {currentBoard.columns.length} columns • {currentBoard.columns.reduce((acc, col) => acc + col.cards.length, 0)} cards
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle Button */}
              <AresButton 
                variant={viewMode === 'list' ? 'primary' : 'secondary'}
                size="icon"
                onClick={() => setViewMode(viewMode === 'board' ? 'list' : 'board')}
                title={viewMode === 'board' ? 'Switch to List View' : 'Switch to Board View'}
              >
                <LayoutList className="h-4 w-4" />
              </AresButton>
              
              {/* Settings Panel - Status dot is inside the button */}
              <SettingsPanel />
              
              {/* CLI Toggle Button */}
              <AresButton 
                variant={showCLI ? 'primary' : 'secondary'}
                size="icon"
                onClick={() => setShowCLI(!showCLI)}
                title="Toggle CLI"
              >
                <Terminal className="h-4 w-4" />
              </AresButton>
              
              {/* Add Column Button */}
              <AresButton 
                size="icon"
                onClick={() => setShowAddColumn(true)}
                title="Add New Column"
              >
                <Plus className="h-4 w-4" />
              </AresButton>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {viewMode === 'board' ? (
            <SortableContext 
              items={currentBoard.columns.map(col => col.id)} 
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex flex-wrap content-start gap-4 max-w-[1920px] mx-auto">
                {currentBoard.columns.map((column) => (
                  <Column
                    key={column.id}
                    column={column}
                    onCardMove={moveCard}
                    onColumnUpdate={handleUpdateColumn}
                    onColumnDelete={handleDeleteColumn}
                    onCardEdit={handleEditCard}
                    onCardDelete={handleDeleteCard}
                    onCardAdd={handleAddCard}
                    isDragOver={dragOverColumnId === column.id}
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            <ListView 
              columns={currentBoard.columns}
              onCardEdit={handleEditCard}
              onCardDelete={handleDeleteCard}
              onColumnUpdate={handleUpdateColumn}
              onColumnDelete={handleDeleteColumn}
            />
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeCard && (
            <div className="w-80 opacity-50 rotate-2">
              <div className="bg-ares-dark-800 p-4 rounded-xl border border-ares-dark-600 shadow-2xl">
                <h3 className="font-semibold text-sm text-white">
                  {activeCard.title}
                </h3>
                {activeCard.description && (
                  <p className="text-xs text-ares-dark-400 mt-2 line-clamp-2">
                    {activeCard.description}
                  </p>
                )}
              </div>
            </div>
          )}
          {activeColumn && (
            <div className="w-80 opacity-50 rotate-2">
              <div className="bg-ares-dark-850 rounded-xl border border-ares-red-500 shadow-2xl flex flex-col">
                {/* Column Header */}
                <div className="flex items-center justify-between p-4 border-b border-ares-dark-700">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-4 w-4 bg-ares-dark-600 rounded" />
                    <h2 className="font-semibold text-sm text-white truncate">
                      {activeColumn.title}
                    </h2>
                    <span className="text-xs text-ares-dark-400 bg-ares-dark-800 px-2 py-0.5 rounded-full">
                      {activeColumn.cards?.length || 0}
                    </span>
                  </div>
                </div>
                {/* Cards Placeholder */}
                <div className="flex-1 p-3 min-h-[100px]">
                  <div className="space-y-3">
                    {(activeColumn.cards || []).slice(0, 3).map((_card: CardType, i: number) => (
                      <div key={i} className="h-16 bg-ares-dark-800 rounded-lg border border-ares-dark-700" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Edit Card Dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="bg-ares-dark-850 border-ares-dark-700 text-white max-w-lg" aria-describedby="edit-card-description">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-ares-red-500" />
              Edit Card
            </DialogTitle>
            <p id="edit-card-description" className="text-sm text-ares-dark-400">
              Update the card details below. Created: {editingCard ? new Date(editingCard.created_at).toLocaleString() : ''}
            </p>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Title */}
            <AresInput
              label="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Card title..."
            />
            
            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ares-dark-300">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add a description..."
                className="w-full min-h-[100px] px-3 py-2 text-sm bg-ares-dark-900 border border-ares-dark-600 rounded-lg text-white placeholder:text-ares-dark-500 focus:border-ares-red-600 focus:outline-none focus:ring-2 focus:ring-ares-red-600/20 resize-none"
              />
            </div>
            
            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ares-dark-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEditPriority(option.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm border transition-all',
                      option.color,
                      editPriority === option.value && 'ring-2 ring-offset-2 ring-offset-ares-dark-850 ring-white'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ares-dark-300 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="bug, feature, urgent..."
                className="w-full px-3 py-2 text-sm bg-ares-dark-900 border border-ares-dark-600 rounded-lg text-white placeholder:text-ares-dark-500 focus:border-ares-red-600 focus:outline-none focus:ring-2 focus:ring-ares-red-600/20"
              />
            </div>
            
            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ares-dark-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-ares-dark-900 border border-ares-dark-600 rounded-lg text-white focus:border-ares-red-600 focus:outline-none focus:ring-2 focus:ring-ares-red-600/20"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <AresButton variant="ghost" onClick={handleCancelEdit}>
              Cancel
            </AresButton>
            <AresButton onClick={handleSaveEdit} disabled={!editTitle.trim()}>
              Save Changes
            </AresButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* CLI Panel */}
      {showCLI && (
        <CLIPanel
          messages={messages}
          isProcessing={isProcessing}
          height={cliHeight}
          onHeightChange={setCLIHeight}
          onCommandSubmit={handleCommandSubmit}
          onClearOutput={handleClearOutput}
        />
      )}

      {/* Add Column Dialog */}
      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent className="bg-ares-dark-850 border-ares-dark-700 text-white" aria-describedby="add-column-description">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Columns className="h-5 w-5 text-ares-red-500" />
              Add New Column
            </DialogTitle>
            <p id="add-column-description" className="text-sm text-ares-dark-400">
              Create a new column for your board
            </p>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <AresInput
              label="Column Name"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Enter column name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newColumnTitle.trim()) {
                  handleAddColumn();
                }
              }}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <AresButton variant="ghost" onClick={() => setShowAddColumn(false)}>
              Cancel
            </AresButton>
            <AresButton onClick={handleAddColumn} disabled={!newColumnTitle.trim()}>
              Add Column
            </AresButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
