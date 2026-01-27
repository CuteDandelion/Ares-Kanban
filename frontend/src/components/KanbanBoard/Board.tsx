"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDroppable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, GripVertical, Plus, X, ChevronLeft, ChevronRight, Zap, Trash2, Edit2, GripHorizontal, Check, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface KanbanCard {
  id: string
  title: string
  description?: string
  position: number
  column_id: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

interface Column {
  id: string
  name: string
  position: number
}

interface KanbanColumnProps {
  column: Column
  cards: KanbanCard[]
  onCardClick: (card: KanbanCard) => void
  index: number
  onEditColumn: (column: Column) => void
  onDeleteColumn: (columnId: string) => void
  onAddCardToColumn: (columnId: string) => void
  isDraggable?: boolean
  onKeyboardReorder?: (direction: 'left' | 'right', currentIndex: number) => void
  dragControls?: any
}

function KanbanColumn({ column, cards, onCardClick, index, onEditColumn, onDeleteColumn, onAddCardToColumn, isDraggable = false, onKeyboardReorder, dragControls }: KanbanColumnProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editingName, setEditingName] = React.useState(column.name)
  const columnCards = cards.filter((card) => card.column_id === column.id)

  // dnd-kit droppable for cards
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  // Handle keyboard navigation for column reordering
  const handleKeyDownForDrag = React.useCallback((e: React.KeyboardEvent) => {
    console.log('Column drag key pressed:', e.key, 'onKeyboardReorder:', !!onKeyboardReorder)

    if (!onKeyboardReorder) {
      console.log('No onKeyboardReorder callback available')
      return
    }

    // Only handle ArrowLeft and ArrowRight keys
    if (e.key === 'ArrowLeft') {
      console.log('ArrowLeft pressed, calling onKeyboardReorder')
      e.preventDefault()
      onKeyboardReorder('left', index)
    } else if (e.key === 'ArrowRight') {
      console.log('ArrowRight pressed, calling onKeyboardReorder')
      e.preventDefault()
      onKeyboardReorder('right', index)
    }
  }, [onKeyboardReorder, index])

  // Get drag handle for column - connect to dragControls
  const dragHandleProps = React.useMemo(() => ({
    'data-drag-handle': true,
    'aria-label': 'Drag column to reorder. Use arrow keys to move.',
    'role': 'button',
    'tabIndex': isDraggable ? 0 : -1,
    'style': { cursor: isDraggable ? 'grab' : 'default' },
    onKeyDown: handleKeyDownForDrag,
    onPointerDown: dragControls ? dragControls.start : undefined
  }), [isDraggable, handleKeyDownForDrag, dragControls])

  // Inline edit handlers
  const handleStartEdit = () => {
    setIsEditing(true)
    setEditingName(column.name)
  }

  const handleSaveEdit = async () => {
    const newName = editingName.trim()
    if (newName && newName !== column.name) {
      setIsEditing(false)
      try {
        await onEditColumn({ ...column, name: newName })
        toast.success('Column name updated')
      } catch (error) {
        toast.error('Failed to update column name')
        setEditingName(column.name)
      }
    } else {
      setIsEditing(false)
      setEditingName(column.name)
    }
  }

  const handleKeyDownInline = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingName(column.name)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="flex-shrink-0 w-80"
    >
      <div className="bg-card rounded-lg p-4 flex flex-col border border-border shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Column Header with glow effect */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 flex-1">
            {/* Drag Handle for Column Reordering */}
            {isDraggable && (
              <div
                {...dragHandleProps}
                className="p-1 rounded hover:bg-primary/10 text-foreground-muted/50 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <GripHorizontal className="h-4 w-4" />
              </div>
            )}
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleKeyDownInline}
                onBlur={handleSaveEdit}
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-foreground text-lg font-semibold tracking-wide focus:ring-2 focus:ring-primary/50"
              />
            ) : (
              <h2
                onClick={handleStartEdit}
                className="font-bold text-foreground text-lg tracking-wide cursor-pointer hover:text-primary transition-colors"
                title="Click to edit column name"
              >
                {column.name}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "text-sm font-semibold",
                "bg-primary/10 text-primary border border-primary/30"
              )}
            >
              {columnCards.length}
            </Badge>

            {/* Column Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-foreground-muted hover:text-foreground transition-colors"
                aria-label="Column options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-xl z-50"
                  >
                    <button
                      onClick={() => {
                        onEditColumn(column)
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-sm hover:bg-primary/10 text-left transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Title
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete column "${column.name}" and all its cards?`)) {
                          onDeleteColumn(column.id)
                        }
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-sm hover:bg-red-600/20 text-red-500 text-left transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Quick Add Card Button */}
        <button
          onClick={() => onAddCardToColumn(column.id)}
          className="w-full mb-3 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 text-sm text-foreground-muted hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Card
        </button>

        {/* Cards List - Droppable Area */}
        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 space-y-3 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)] pr-1",
            "transition-all duration-200",
            isOver && "bg-primary/5 ring-2 ring-primary/30"
          )}
        >
          {columnCards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-8"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground-muted">No cards yet</p>
              <p className="text-xs text-foreground-muted/70 mt-1">Add your first task</p>
            </motion.div>
          ) : (
            <SortableContext items={columnCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence mode="popLayout">
                {columnCards.map((card, cardIndex) => (
                  <SortableCard
                    key={card.id}
                    id={card.id}
                    card={card}
                    cardIndex={cardIndex}
                    onCardClick={onCardClick}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Sortable Card Component using dnd-kit
interface SortableCardProps {
  id: string
  card: KanbanCard
  cardIndex: number
  onCardClick: (card: KanbanCard) => void
}

function SortableCard({ id, card, cardIndex, onCardClick }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: cardIndex * 0.05 }}
      className={cn(
        isDragging && "opacity-50 scale-95",
        "transition-all duration-200"
      )}
    >
      <Card
        onClick={() => onCardClick(card)}
        className={cn(
          "cursor-pointer card-hover-effect card-indicator",
          "bg-card border border-border/50"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div
              {...attributes}
              {...listeners}
              className="flex-1 cursor-grab"
            >
              <h4 className="font-semibold text-foreground text-sm line-clamp-1 pr-2">
                {card.title}
              </h4>
            </div>
            <GripVertical className="h-4 w-4 text-foreground-muted/50 flex-shrink-0" />
          </div>

          {card.description && (
            <p className="text-sm text-foreground-muted line-clamp-2 mb-3">
              {card.description}
            </p>
          )}

          {/* Priority Badge */}
          {card.metadata?.priority && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium mb-3",
                card.metadata.priority === "high" && "bg-red-600/20 text-red-400 border-red-600/30",
                card.metadata.priority === "medium" && "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
                card.metadata.priority === "low" && "bg-green-600/20 text-green-400 border-green-600/30"
              )}
            >
              {card.metadata.priority}
            </Badge>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              {card.metadata?.assignee && (
                <Avatar className="h-6 w-6 border border-border bg-primary/20">
                  <AvatarFallback className="text-[10px] font-bold text-primary">
                    {card.metadata.assignee.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            {card.updated_at && (
              <span className="text-xs text-foreground-muted/70">
                {new Date(card.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
