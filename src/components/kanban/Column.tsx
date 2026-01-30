'use client';

import { useState, useEffect } from 'react';
import { Column as ColumnType, Card as CardType, CardMove } from '@/types';
import { Card } from './Card';
import { AresButton } from '@/components/ui/ares-button';
import { AresInput } from '@/components/ui/ares-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MoreHorizontal, Pencil, GripVertical, Trash2 } from 'lucide-react';
import {
  useDroppable,
} from '@dnd-kit/core';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/useClickOutside';

interface ColumnProps {
  column: ColumnType & { cards: CardType[] };
  onCardMove: (moveData: CardMove) => void;
  onColumnUpdate: (columnId: string, updates: Partial<ColumnType>) => void;
  onColumnDelete: (columnId: string) => void;
  onCardEdit: (card: CardType) => void;
  onCardDelete: (cardId: string) => void;
  onCardAdd: (columnId: string, title: string) => void;
  isDragOver?: boolean;
}

export function Column({ column, onCardMove, onColumnUpdate, onColumnDelete, onCardEdit, onCardDelete, onCardAdd, isDragOver }: ColumnProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const actionsRef = useClickOutside<HTMLDivElement>(() => setShowActions(false), showActions);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
  });

  const setRefs = (node: HTMLElement | null) => {
    setNodeRef(node);
    setDroppableRef(node);
  };

  // Reset dialog when cards change (card was added successfully)
  useEffect(() => {
    if (showAddCard && newCardTitle) {
      setShowAddCard(false);
      setNewCardTitle('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column.cards.length]);

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;

    onCardAdd(column.id, newCardTitle.trim());
    setShowAddCard(false);
    setNewCardTitle('');
  };

  const handleTitleUpdate = () => {
    if (columnTitle.trim()) {
      onColumnUpdate(column.id, { title: columnTitle });
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setRefs}
      style={style}
      className={cn(
        'w-80 bg-ares-dark-850 rounded-xl border flex flex-col transition-colors duration-200',
        isDragging ? 'opacity-50 rotate-2' : '',
        isDragOver 
          ? 'border-ares-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] bg-ares-dark-800' 
          : 'border-ares-dark-700'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-ares-dark-700">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="h-4 w-4 text-ares-dark-500 cursor-grab" />
          
          {isEditingTitle ? (
            <input
              value={columnTitle}
              onChange={(e) => setColumnTitle(e.target.value)}
              onBlur={handleTitleUpdate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleUpdate();
                } else if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                  setColumnTitle(column.title);
                }
              }}
              className="flex-1 h-8 px-2 py-1 text-sm bg-ares-dark-750 border border-ares-dark-600 rounded text-white focus:border-ares-red-600 focus:outline-none focus:ring-2 focus:ring-ares-red-600/20"
              autoFocus
            />
          ) : (
            <h2
              className="font-semibold text-sm flex-1 truncate cursor-pointer hover:text-ares-red-400 transition-colors text-white"
              onClick={() => setIsEditingTitle(true)}
            >
              {columnTitle}
            </h2>
          )}
          
          <span className="text-xs text-ares-dark-400 bg-ares-dark-800 px-2 py-0.5 rounded-full">
            {column.cards.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-lg hover:bg-ares-dark-750 text-ares-dark-400 hover:text-white transition-colors"
            onClick={() => setIsEditingTitle(true)}
          >
            <Pencil className="h-3 w-3" />
          </button>
          <div className="relative" ref={actionsRef}>
            <button
              className="p-1.5 rounded-lg hover:bg-ares-dark-750 text-ares-dark-400 hover:text-white transition-colors"
              onClick={() => setShowActions(!showActions)}
              aria-label="Column actions"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
            
            {showActions && (
              <div 
                className="absolute right-0 top-8 z-20 flex flex-col gap-1 bg-ares-dark-850 border border-ares-dark-700 rounded-lg shadow-xl p-1 min-w-[140px]"
                role="menu"
              >
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-ares-dark-750 rounded-md transition-colors"
                  onClick={() => {
                    setIsEditingTitle(true);
                    setShowActions(false);
                  }}
                  role="menuitem"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rename
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ares-red-400 hover:bg-ares-red-900/30 rounded-md transition-colors"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowActions(false);
                  }}
                  role="menuitem"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards Area */}
      <div className="flex-1 p-3 min-h-[100px] max-h-[calc(100vh-300px)] overflow-y-auto">
        <SortableContext 
          items={column.cards.map(c => c.id)} 
          strategy={rectSortingStrategy}
        >
          <div className="space-y-3">
            {column.cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                onEdit={onCardEdit}
                onDelete={onCardDelete}
                onMove={() => onCardMove({ cardId: card.id, fromColumnId: column.id, toColumnId: column.id, newIndex: 0 })}
              />
            ))}
          </div>
        </SortableContext>

        {column.cards.length === 0 && (
          <div className="text-center py-8 text-ares-dark-500 text-sm border-2 border-dashed border-ares-dark-700 rounded-lg">
            Drop cards here
          </div>
        )}
      </div>

      {/* Add Card Button */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogTrigger asChild>
          <button className="m-3 p-2 rounded-lg bg-ares-dark-750/50 hover:bg-ares-dark-750 text-ares-dark-400 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Add Card
          </button>
        </DialogTrigger>
        
        <DialogContent className="bg-ares-dark-850 border-ares-dark-700 text-white" aria-describedby="add-card-description">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Card</DialogTitle>
            <p id="add-card-description" className="text-sm text-ares-dark-400">Enter a title for your new card.</p>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <AresInput
              label="Card Title"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Enter card title..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCardTitle.trim()) {
                  handleAddCard();
                }
              }}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <AresButton variant="ghost" onClick={() => setShowAddCard(false)}>
              Cancel
            </AresButton>
            <AresButton onClick={handleAddCard} disabled={!newCardTitle.trim()}>
              Add Card
            </AresButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Column Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-ares-dark-850 border-ares-dark-700 text-white" aria-describedby="delete-column-description">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-ares-red-500" />
              Delete Column
            </DialogTitle>
            <p id="delete-column-description" className="text-sm text-ares-dark-400">
              Are you sure you want to delete &quot;{column.title}&quot;? This action cannot be undone.
              {column.cards.length > 0 && (
                <span className="block mt-2 text-ares-red-400">
                  Warning: This column contains {column.cards.length} card{column.cards.length === 1 ? '' : 's'} that will also be deleted.
                </span>
              )}
            </p>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 mt-4">
            <AresButton variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AresButton>
            <AresButton 
              variant="secondary"
              onClick={() => {
                onColumnDelete(column.id);
                setShowDeleteConfirm(false);
              }}
              className="bg-ares-red-600 hover:bg-ares-red-700 text-white border-ares-red-500"
            >
              Delete Column
            </AresButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
