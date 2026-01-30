'use client';

import { Column as ColumnType, Card as CardType, CardPriority, CardStatus } from '@/types';
import { 
  ChevronDown, 
  ChevronRight,
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  GripVertical,
  Calendar,
  Tag,
  AlertCircle,
  ChevronUp,
  List,
  Columns
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AresButton } from '@/components/ui/ares-button';
import { AresInput } from '@/components/ui/ares-input';

interface ListViewProps {
  columns: (ColumnType & { cards: CardType[] })[];
  onCardEdit: (card: CardType) => void;
  onCardDelete: (cardId: string) => void;
  onColumnUpdate: (columnId: string, updates: Partial<ColumnType>) => void;
  onColumnDelete: (columnId: string) => void;
}

const priorityConfig: Record<CardPriority, { color: string; label: string; bgColor: string }> = {
  critical: { 
    color: 'text-red-400', 
    label: 'Critical',
    bgColor: 'bg-red-950/50 border-red-600'
  },
  high: { 
    color: 'text-orange-400', 
    label: 'High',
    bgColor: 'bg-orange-950/50 border-orange-600'
  },
  medium: { 
    color: 'text-yellow-400', 
    label: 'Medium',
    bgColor: 'bg-yellow-950/50 border-yellow-600'
  },
  low: { 
    color: 'text-green-400', 
    label: 'Low',
    bgColor: 'bg-green-950/50 border-green-600'
  },
  none: { 
    color: 'text-ares-dark-400', 
    label: 'None',
    bgColor: 'bg-ares-dark-750 border-ares-dark-600'
  },
};

const statusConfig: Record<CardStatus, { color: string; label: string }> = {
  todo: { color: 'text-ares-dark-400', label: 'To Do' },
  in_progress: { color: 'text-blue-400', label: 'In Progress' },
  review: { color: 'text-purple-400', label: 'Review' },
  done: { color: 'text-green-400', label: 'Done' },
  blocked: { color: 'text-red-400', label: 'Blocked' },
};

// Compact Priority Badge
function PriorityBadge({ priority }: { priority: CardPriority }) {
  const config = priorityConfig[priority];
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 text-xs rounded border',
      config.bgColor,
      config.color
    )}>
      {config.label}
    </span>
  );
}

// Compact Status Badge
function StatusBadge({ status }: { status: CardStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn('text-xs', config.color)}>
      {config.label}
    </span>
  );
}

// Tag List with overflow handling
function TagList({ tags, maxDisplay = 2 }: { tags: string[]; maxDisplay?: number }) {
  if (!tags?.length) return <span className="text-ares-dark-500 text-xs">-</span>;
  
  const displayTags = tags.slice(0, maxDisplay);
  const remaining = tags.length - maxDisplay;
  
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayTags.map(tag => (
        <span key={tag} className="text-xs px-1.5 py-0.5 bg-ares-dark-800 rounded text-ares-dark-300">
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-ares-dark-500">+{remaining}</span>
      )}
    </div>
  );
}

// Due Date with overdue highlighting
function DueDate({ date }: { date: string | null }) {
  if (!date) return <span className="text-ares-dark-500 text-xs">-</span>;
  
  const dueDate = new Date(date);
  const isOverdue = dueDate < new Date();
  const isDueSoon = !isOverdue && (dueDate.getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;
  
  return (
    <span className={cn(
      'text-xs',
      isOverdue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-ares-dark-400'
    )}>
      {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
    </span>
  );
}

// Card Actions Dropdown
function CardActions({ 
  card, 
  onEdit, 
  onDelete 
}: { 
  card: CardType; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useClickOutside<HTMLDivElement>(() => setShowActions(false), showActions);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showActions) {
      // Calculate position for fixed menu
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left - 100, // Align right edge of menu with button
      });
    }
    setShowActions(!showActions);
  };

  return (
    <div className="relative" ref={buttonRef}>
      <button
        className="p-1 rounded hover:bg-ares-dark-750 text-ares-dark-400 hover:text-white transition-colors"
        onClick={handleToggle}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      
      {showActions && menuPosition && (
        <div 
          className="fixed z-[100] flex flex-col gap-1 bg-ares-dark-850 border border-ares-dark-700 rounded-lg shadow-xl p-1 min-w-[120px]"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white hover:bg-ares-dark-750 rounded transition-colors"
            onClick={() => {
              onEdit();
              setShowActions(false);
            }}
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-ares-red-400 hover:bg-ares-red-900/30 rounded transition-colors"
            onClick={() => {
              onDelete();
              setShowActions(false);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// Column Header Component
function ColumnHeader({
  column,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  column: ColumnType & { cards: CardType[] };
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<ColumnType>) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const actionsRef = useClickOutside<HTMLDivElement>(() => setShowActions(false), showActions);

  const handleSave = () => {
    if (title.trim() && title !== column.title) {
      onUpdate({ title: title.trim() });
    }
    setIsEditing(false);
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 bg-ares-dark-800/50 border-b border-ares-dark-700">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-ares-dark-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-ares-dark-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-ares-dark-400" />
            )}
          </button>

          <GripVertical className="h-4 w-4 text-ares-dark-500" />
          
          {isEditing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setTitle(column.title);
                }
              }}
              className="h-7 px-2 py-1 text-sm bg-ares-dark-750 border border-ares-dark-600 rounded text-white focus:border-ares-red-600 focus:outline-none focus:ring-1 focus:ring-ares-red-600/20 flex-1 min-w-0"
              autoFocus
            />
          ) : (
            <h3 
              className="font-semibold text-white truncate cursor-pointer hover:text-ares-red-400 transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {column.title}
            </h3>
          )}
          
          <span className="text-xs text-ares-dark-400 bg-ares-dark-800 px-2 py-0.5 rounded-full shrink-0">
            {column.cards.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            className="p-1.5 rounded hover:bg-ares-dark-750 text-ares-dark-400 hover:text-white transition-colors"
            onClick={() => setIsEditing(true)}
            title="Rename column"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          
          <div className="relative" ref={actionsRef}>
            <button
              className="p-1.5 rounded hover:bg-ares-dark-750 text-ares-dark-400 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (!showActions) {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setMenuPosition({
                    top: rect.bottom + 4,
                    left: rect.left - 110,
                  });
                }
                setShowActions(!showActions);
              }}
              title="Column actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            
            {showActions && menuPosition && (
              <div 
                className="fixed z-[100] flex flex-col gap-1 bg-ares-dark-850 border border-ares-dark-700 rounded-lg shadow-xl p-1 min-w-[140px]"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-ares-dark-750 rounded transition-colors"
                  onClick={() => {
                    setIsEditing(true);
                    setShowActions(false);
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Rename
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ares-red-400 hover:bg-ares-red-900/30 rounded transition-colors"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowActions(false);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-ares-dark-850 border-ares-dark-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-ares-red-500" />
              Delete Column
            </DialogTitle>
            <p className="text-sm text-ares-dark-400">
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
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              className="bg-ares-red-600 hover:bg-ares-red-700 text-white"
            >
              Delete Column
            </AresButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Card Table Row Component
function CardTableRow({
  card,
  onEdit,
  onDelete,
}: {
  card: CardType;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="group hover:bg-ares-dark-800/30 transition-colors border-b border-ares-dark-700/50 last:border-b-0">
      <td className="px-3 py-2">
        <div className="flex flex-col min-w-0 max-w-[200px]">
          <span className="text-sm text-white truncate font-medium" title={card.title}>
            {card.title}
          </span>
          {card.description && (
            <span className="text-xs text-ares-dark-500 truncate" title={card.description}>
              {card.description}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <PriorityBadge priority={card.priority} />
      </td>
      <td className="px-3 py-2">
        <StatusBadge status={card.status} />
      </td>
      <td className="px-3 py-2">
        <TagList tags={card.tags} maxDisplay={2} />
      </td>
      <td className="px-3 py-2">
        <DueDate date={card.due_date} />
      </td>
      <td className="px-3 py-2 text-right">
        <CardActions card={card} onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}

// Card Table Component
function CardTable({
  cards,
  onCardEdit,
  onCardDelete,
}: {
  cards: CardType[];
  onCardEdit: (card: CardType) => void;
  onCardDelete: (cardId: string) => void;
}) {
  if (cards.length === 0) {
    return (
      <div className="p-6 text-center text-ares-dark-500 text-sm">
        No cards in this column
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ares-dark-700">
            <th className="px-3 py-2 text-left text-xs font-medium text-ares-dark-400 w-[35%]">Title</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-ares-dark-400 w-[12%]">Priority</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-ares-dark-400 w-[12%]">Status</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-ares-dark-400 w-[20%]">Tags</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-ares-dark-400 w-[12%]">Due Date</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-ares-dark-400 w-[9%]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <CardTableRow
              key={card.id}
              card={card}
              onEdit={() => onCardEdit(card)}
              onDelete={() => onCardDelete(card.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Column Section Component
function ColumnSection({
  column,
  isExpanded,
  onToggle,
  onCardEdit,
  onCardDelete,
  onColumnUpdate,
  onColumnDelete,
}: {
  column: ColumnType & { cards: CardType[] };
  isExpanded: boolean;
  onToggle: () => void;
  onCardEdit: (card: CardType) => void;
  onCardDelete: (cardId: string) => void;
  onColumnUpdate: (columnId: string, updates: Partial<ColumnType>) => void;
  onColumnDelete: (columnId: string) => void;
}) {
  return (
    <div className="bg-ares-dark-850 rounded-lg border border-ares-dark-700 overflow-hidden">
      <ColumnHeader
        column={column}
        isExpanded={isExpanded}
        onToggle={onToggle}
        onUpdate={(updates) => onColumnUpdate(column.id, updates)}
        onDelete={() => onColumnDelete(column.id)}
      />
      
      {isExpanded && (
        <CardTable
          cards={column.cards}
          onCardEdit={onCardEdit}
          onCardDelete={onCardDelete}
        />
      )}
    </div>
  );
}

// Main ListView Component
export function ListView({ 
  columns, 
  onCardEdit, 
  onCardDelete, 
  onColumnUpdate, 
  onColumnDelete 
}: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(() => 
    new Set() // Start with all columns collapsed
  );

  const filteredColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      cards: column.cards.filter(card => {
        const matchesSearch = searchTerm === '' || 
          card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (card.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          card.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesPriority = priorityFilter === null || card.priority === priorityFilter;
        
        return matchesSearch && matchesPriority;
      })
    }));
  }, [columns, searchTerm, priorityFilter]);

  const totalCards = filteredColumns.reduce((acc, col) => acc + col.cards.length, 0);
  const expandedCount = expandedColumns.size;

  const toggleColumn = (columnId: string) => {
    setExpandedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedColumns(new Set(columns.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedColumns(new Set());
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-ares-dark-850 rounded-xl border border-ares-dark-700">
        <div className="flex-1 min-w-[200px]">
          <AresInput
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-ares-dark-400">Filter:</span>
          {(['all', 'critical', 'high', 'medium', 'low', 'none'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p === 'all' ? null : p)}
              className={cn(
                'px-2 py-1 text-xs rounded-full border transition-all',
                (p === 'all' && priorityFilter === null) || priorityFilter === p
                  ? 'bg-ares-red-600 text-white border-ares-red-500'
                  : 'bg-ares-dark-750 text-ares-dark-400 border-ares-dark-600 hover:border-ares-dark-500'
              )}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-ares-dark-800 hover:bg-ares-dark-750 rounded-lg text-ares-dark-300 transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-ares-dark-800 hover:bg-ares-dark-750 rounded-lg text-ares-dark-300 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
            Collapse All
          </button>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-ares-dark-400">
          <span className="flex items-center gap-1.5">
            <Columns className="h-4 w-4" />
            {expandedCount}/{columns.length} columns expanded
          </span>
          <span className="flex items-center gap-1.5">
            <List className="h-4 w-4" />
            {totalCards} cards
          </span>
        </div>
      </div>

      {/* Columns */}
      <div className="space-y-2">
        {filteredColumns.map((column) => (
          <ColumnSection
            key={column.id}
            column={column}
            isExpanded={expandedColumns.has(column.id)}
            onToggle={() => toggleColumn(column.id)}
            onCardEdit={onCardEdit}
            onCardDelete={onCardDelete}
            onColumnUpdate={onColumnUpdate}
            onColumnDelete={onColumnDelete}
          />
        ))}
      </div>
    </div>
  );
}
