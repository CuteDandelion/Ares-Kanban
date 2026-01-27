"use client"

import * as React from "react"
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, GripVertical, Plus, Menu, X, ChevronLeft, ChevronRight, Zap, Trash2, Edit2, GripHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTheme } from "@/contexts/ThemeProvider"

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

// Drag state for card drag-and-drop
interface DragState {
  cardId: string | null
  sourceColumnId: string | null
  sourcePosition: number | null
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
  onCardDragStart?: (cardId: string, columnId: string, position: number) => void
  onCardDragOver?: (e: React.DragEvent, columnId: string) => void
  onCardDragLeave?: (columnId: string) => void
  onCardDrop?: (e: React.DragEvent, columnId: string) => void
  draggedOverColumnId?: string | null
  draggedCardId?: string | null
}

function KanbanColumn({ column, cards, onCardClick, index, onEditColumn, onDeleteColumn, onAddCardToColumn, isDraggable = false, onKeyboardReorder, dragControls, onCardDragStart, onCardDragOver, onCardDragLeave, onCardDrop, draggedOverColumnId, draggedCardId }: KanbanColumnProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const columnCards = cards.filter((card) => card.column_id === column.id)

  // Handle keyboard navigation for column reordering
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key, 'onKeyboardReorder:', !!onKeyboardReorder)

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
    onKeyDown: handleKeyDown,
    onPointerDown: dragControls ? dragControls.start : undefined
  }), [isDraggable, handleKeyDown, dragControls])

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
            <h2 className="font-bold text-foreground text-lg tracking-wide">
              {column.name}
            </h2>
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

        {/* Cards List */}
        <div
          className={cn(
            "flex-1 space-y-3 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)] pr-1",
            "transition-all duration-200",
            draggedOverColumnId === column.id && "bg-primary/5"
          )}
          onDragOver={(e) => onCardDragOver?.(e, column.id)}
          onDragLeave={() => onCardDragLeave?.(column.id)}
          onDrop={(e) => onCardDrop?.(e, column.id)}
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
            <AnimatePresence mode="popLayout">
              {columnCards.map((card, cardIndex) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: cardIndex * 0.05 }}
                  draggable={true}
                  onDragStart={() => onCardDragStart?.(card.id, column.id, cardIndex)}
                  style={{ cursor: 'grab' }}
                  className={cn(
                    draggedCardId === card.id && "opacity-50 scale-95",
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
                        <h4 className="font-semibold text-foreground text-sm line-clamp-1 pr-2">
                          {card.title}
                        </h4>
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
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface KanbanBoardProps {
  columns: Column[]
  cards: KanbanCard[]
  sidebarOpen: boolean
  selectedCard: KanbanCard | null
  onAddCard: (data: { column_id: string; title: string; description: string; metadata?: any }) => void
  onAddColumn: (name: string) => void
  onCardClick: (card: KanbanCard) => void
  onUpdateCard?: (id: string, data: any) => void
  onDeleteCard?: (id: string) => void
  onCloseCard: () => void
  onToggleSidebar: () => void
  onUpdateColumn?: (id: string, name: string) => void
  onDeleteColumn?: (id: string) => void
  onReorderColumns?: (columns: Column[]) => void
  onMoveCard?: (cardId: string, newColumnId: string, newPosition: number) => void
}

export default function KanbanBoard({
  columns,
  cards,
  sidebarOpen,
  selectedCard,
  onAddCard,
  onAddColumn,
  onCardClick,
  onUpdateCard,
  onDeleteCard,
  onCloseCard,
  onToggleSidebar,
  onUpdateColumn,
  onDeleteColumn,
  onReorderColumns,
  onMoveCard
}: KanbanBoardProps) {
  const { theme } = useTheme()
  const [editingColumn, setEditingColumn] = React.useState<Column | null>(null)
  const [editingColumnName, setEditingColumnName] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  // Card drag-and-drop state
  const [dragState, setDragState] = React.useState<DragState>({
    cardId: null,
    sourceColumnId: null,
    sourcePosition: null,
  })
  const [draggedOverColumnId, setDraggedOverColumnId] = React.useState<string | null>(null)

  const handleEditColumn = (column: Column) => {
    console.log('Opening edit modal for column:', column.id, column.name)
    setEditingColumn(column)
    setEditingColumnName(column.name)
  }

  const handleSaveColumnName = async () => {
    if (!editingColumn || !onUpdateColumn) return

    console.log('Saving column name:', editingColumn.id, editingColumnName)
    setIsSaving(true)

    try {
      await onUpdateColumn(editingColumn.id, editingColumnName.trim())
      console.log('Column name saved successfully')
      setEditingColumn(null)
      toast.success('Column name updated successfully')
    } catch (error) {
      console.error('Failed to save column name:', error)
      toast.error('Failed to update column name')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCardToColumn = (columnId: string) => {
    // Focus on the sidebar's Add Card tab and pre-select this column
    onToggleSidebar()
  }

  const handleColumnReorder = (newColumns: Column[]) => {
    console.log('Columns reordered:', newColumns.map(c => ({ id: c.id, name: c.name, position: c.position })))

    // Call parent callback to persist reorder to API
    if (onReorderColumns) {
      onReorderColumns(newColumns)
    }
  }

  // Card drag-and-drop handlers
  const handleCardDragStart = (cardId: string, columnId: string, position: number) => {
    setDragState({
      cardId,
      sourceColumnId: columnId,
      sourcePosition: position,
    })
    console.log('Card drag started:', { cardId, columnId, position })
  }

  const handleCardDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDraggedOverColumnId(columnId)
  }

  const handleCardDragLeave = (columnId: string) => {
    if (draggedOverColumnId === columnId) {
      setDraggedOverColumnId(null)
    }
  }

  const handleCardDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()

    if (!dragState.cardId || !dragState.sourceColumnId) {
      console.log('No card being dragged')
      setDraggedOverColumnId(null)
      setDragState({ cardId: null, sourceColumnId: null, sourcePosition: null })
      return
    }

    const { cardId, sourceColumnId } = dragState

    // Calculate new position based on drop target
    const targetColumnCards = cards.filter(c => c.column_id === targetColumnId)
    const newPosition = targetColumnCards.length

    console.log('Card dropped:', { cardId, from: sourceColumnId, to: targetColumnId, position: newPosition })

    // If dropping in same column, just reorder
    // If dropping in different column, move card
    if (sourceColumnId === targetColumnId) {
      // Reorder within same column - not implemented yet
      console.log('Card dropped in same column - reorder not implemented yet')
    } else {
      // Move to different column
      if (onMoveCard) {
        await onMoveCard(cardId, targetColumnId, newPosition)
      }
    }

    // Reset drag state
    setDraggedOverColumnId(null)
    setDragState({ cardId: null, sourceColumnId: null, sourcePosition: null })
  }

  // Handle keyboard navigation for column reordering
  const handleKeyboardReorder = React.useCallback((direction: 'left' | 'right', currentIndex: number) => {
    console.log('Keyboard reorder triggered:', direction, 'from index:', currentIndex)

    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1

    // Validate that new index is within bounds
    if (newIndex < 0 || newIndex >= columns.length) {
      console.log(`Cannot move column ${direction}: out of bounds (index ${currentIndex}, total ${columns.length})`)
      return
    }

    // Create new columns array with swapped columns
    const newColumns = [...columns]
    const [movedColumn] = newColumns.splice(currentIndex, 1)
    newColumns.splice(newIndex, 0, movedColumn)

    console.log(`Keyboard reorder: moving column ${currentIndex} to ${newIndex}`)
    console.log('New column order:', newColumns.map(c => c.name))

    // Call the reorder handler
    handleColumnReorder(newColumns)
  }, [columns, handleColumnReorder])

  return (
    <div className="flex min-h-screen bg-pattern bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop for all screen sizes - allows clicking outside to close sidebar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggleSidebar}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sidebar Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-background-secondary z-50 shadow-2xl border-r border-border"
            >
              <SidebarContent
                columns={columns}
                onAddCard={onAddCard}
                onAddColumn={onAddColumn}
                onClose={onToggleSidebar}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content - Fixed Header Layout */}
      <div className="flex-1 flex flex-col min-h-screen h-screen overflow-hidden">
        {/* Fixed Header - NEVER MOVES */}
        <header className={`fixed top-0 left-0 right-0 glass-effect header-glow border-b border-border transition-all duration-300 z-50 ${sidebarOpen ? 'z-[55]' : 'z-[60]'}`}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle Button - Always visible and obvious */}
              <div className={`flex items-center ${sidebarOpen ? "relative z-[60]" : ""}`}>
                 <button
                   onClick={(e) => {
                     e.preventDefault()
                     e.stopPropagation()
                     onToggleSidebar()
                   }}
                   className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-primary/30 hover:border-primary hover:bg-primary/20 transition-all duration-300 text-primary"
                   aria-label="Toggle sidebar"
                   title="Toggle Sidebar"
                   style={{ minWidth: '48px', minHeight: '48px' }}
                 >
                   {sidebarOpen ? (
                     <motion.div
                       key="close"
                       initial={{ rotate: -90, opacity: 0 }}
                       animate={{ rotate: 0, opacity: 1 }}
                       exit={{ rotate: 90, opacity: 0 }}
                       transition={{ duration: 0.2 }}
                     >
                       <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                     </motion.div>
                   ) : (
                     <motion.div
                       key="open"
                       initial={{ rotate: 90, opacity: 0 }}
                       animate={{ rotate: 0, opacity: 1 }}
                       exit={{ rotate: 90, opacity: 0 }}
                       transition={{ duration: 0.2 }}
                     >
                       <ChevronRight className="h-6 w-6 stroke-[2.5]" />
                     </motion.div>
                   )}
                 </button>
              </div>

              {/* Logo and Title */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Logo */}
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                  <Zap className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-2xl font-bold tracking-wider text-foreground">
                    ARES
                  </h1>
                  <p className="text-xs text-foreground-muted/70 tracking-wide">PROJECT MANAGEMENT</p>
                </div>
              </motion.div>
            </div>

            {/* Right side - Stats or user info */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>{cards.length} Active Tasks</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{columns.length} Columns</span>
              </div>
            </div>
          </div>
        </header>

        {/* Board Area - Scrollable only for cards */}
        <main className="flex-1 overflow-hidden pt-20">
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <div className="h-full px-6 pb-6">
              {/* Empty State - No Columns */}
              {columns.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-primary/50" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-2">No columns yet</p>
                  <p className="text-sm text-foreground-muted">Click "Add Column" in the sidebar to get started</p>
                </div>
              )}

              {/* Draggable Columns Container */}
              {columns.length > 0 && (
                <Reorder.Group
                axis="x"
                values={columns}
                onReorder={handleColumnReorder}
                className="h-full flex gap-6 items-start"
              >
                {columns.map((column, index) => {
                  const controls = useDragControls()

                  return (
                    <Reorder.Item
                      key={column.id}
                      value={column}
                      id={column.id}
                      as="div"
                      className="flex-shrink-0 w-80"
                      dragListener={false}
                      dragControls={controls}
                    >
                      <KanbanColumn
                        column={column}
                        cards={cards}
                        onCardClick={onCardClick}
                        index={index}
                        onEditColumn={onUpdateColumn ? (col) => handleEditColumn(col) : () => {}}
                        onDeleteColumn={onDeleteColumn || (() => {})}
                        onAddCardToColumn={handleAddCardToColumn}
                        isDraggable={true}
                        onKeyboardReorder={handleKeyboardReorder}
                        dragControls={controls}
                        onCardDragStart={handleCardDragStart}
                        onCardDragOver={handleCardDragOver}
                        onCardDragLeave={handleCardDragLeave}
                        onCardDrop={handleCardDrop}
                        draggedOverColumnId={draggedOverColumnId}
                        draggedCardId={dragState.cardId}
                      />
                    </Reorder.Item>
                  )
                })}
              </Reorder.Group>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Card Modal */}
      <AnimatePresence>
        {selectedCard && (
          <CardModal
            card={selectedCard}
            onUpdate={onUpdateCard || (() => {})}
            onDelete={onDeleteCard || (() => {})}
            onClose={onCloseCard}
          />
        )}
      </AnimatePresence>

      {/* Column Edit Modal */}
      <AnimatePresence>
        {editingColumn && (
          <ColumnEditModal
            column={editingColumn}
            onClose={() => setEditingColumn(null)}
            onSave={handleSaveColumnName}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

interface SidebarContentProps {
  columns: Column[]
  onAddCard: (data: { column_id: string; title: string; description: string; metadata?: any }) => void
  onAddColumn: (name: string) => void
  onClose: () => void
}

function SidebarContent({ columns, onAddCard, onAddColumn, onClose }: SidebarContentProps) {
  const [activeTab, setActiveTab] = React.useState<"add-card" | "add-column">("add-card")
  const [selectedColumnId, setSelectedColumnId] = React.useState(columns[0]?.id || "")
  const [cardTitle, setCardTitle] = React.useState("")
  const [cardDescription, setCardDescription] = React.useState("")
  const [columnName, setColumnName] = React.useState("")
  const [priority, setPriority] = React.useState("low")

  // Update selected column when columns change
  React.useEffect(() => {
    if (columns.length > 0 && !columns.find(c => c.id === selectedColumnId)) {
      setSelectedColumnId(columns[0].id)
    }
  }, [columns, selectedColumnId])

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardTitle.trim() || !selectedColumnId) return

    const cardData: { column_id: string; title: string; description: string; metadata?: any } = {
      column_id: selectedColumnId,
      title: cardTitle,
      description: cardDescription,
      metadata: { priority: priority || "low" } // Default to low if not set
    }

    onAddCard(cardData)

    setCardTitle("")
    setCardDescription("")
    setPriority("low") // Reset to default low
  }

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!columnName.trim()) return

    onAddColumn(columnName)
    setColumnName("")
    setActiveTab("add-card")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground tracking-wide">
            MANAGE BOARD
          </h2>
          {/* Collapse Sidebar Button - Shows on ALL screen sizes */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-primary/20 border border-border hover:border-primary transition-all duration-300 text-foreground"
            aria-label="Close sidebar"
            title="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("add-card")}
          data-testid="add-card-tab"
          className={cn(
            "flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 relative",
            activeTab === "add-card"
              ? "text-primary"
              : "text-foreground-muted hover:text-foreground hover:bg-primary/5"
          )}
          aria-selected={activeTab === "add-card"}
          role="tab"
        >
          ADD CARD
          {activeTab === "add-card" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("add-column")}
          data-testid="add-column-tab"
          className={cn(
            "flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 relative",
            activeTab === "add-column"
              ? "text-primary"
              : "text-foreground-muted hover:text-foreground hover:bg-primary/5"
          )}
          aria-selected={activeTab === "add-column"}
          role="tab"
        >
          ADD COLUMN
          {activeTab === "add-column" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto" role="tabpanel">
        <AnimatePresence mode="wait">
          {activeTab === "add-card" ? (
            <motion.form
              key="add-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleAddCard}
              className="space-y-4"
              role="form"
            >
              {/* Column Selection */}
              <div className="space-y-2">
                <label htmlFor="column-select" className="block text-sm font-semibold text-foreground">
                  Column <span className="text-primary" aria-hidden="true">*</span>
                </label>
                <select
                  id="column-select"
                  data-testid="card-column-select"
                  value={selectedColumnId}
                  onChange={(e) => setSelectedColumnId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground transition-all focus-ring"
                  required
                  aria-required="true"
                  aria-label="Column"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id} className="bg-background">
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="card-title" className="block text-sm font-semibold text-foreground">
                  Title <span className="text-primary" aria-hidden="true">*</span>
                </label>
                <input
                  id="card-title"
                  data-testid="card-title-input"
                  type="text"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  placeholder="Enter card title..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground transition-all focus-ring placeholder:text-foreground-muted/50"
                  required
                  aria-required="true"
                  aria-label="Title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="card-description" className="block text-sm font-semibold text-foreground">
                  Description
                </label>
                <textarea
                  id="card-description"
                  data-testid="card-description-textarea"
                  value={cardDescription}
                  onChange={(e) => setCardDescription(e.target.value)}
                  placeholder="Enter card description..."
                  rows={4}
                  className="w-full min-h-[100px] px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground transition-all focus-ring resize-none placeholder:text-foreground-muted/50"
                  aria-label="Description"
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label htmlFor="card-priority" className="block text-sm font-semibold text-foreground">
                  Priority
                </label>
                <select
                  id="card-priority"
                  data-testid="card-priority-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground transition-all focus-ring"
                >
                  <option value="low" className="bg-background">Low</option>
                  <option value="medium" className="bg-background">Medium</option>
                  <option value="high" className="bg-background">High</option>
                </select>
              </div>

              <Button
                type="submit"
                data-testid="add-card-submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold btn-gaming focus-ring"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="add-column"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleAddColumn}
              className="space-y-4"
              role="form"
            >
              {/* Column Name */}
              <div className="space-y-2">
                <label htmlFor="column-name" className="block text-sm font-semibold text-foreground">
                  Column Name <span className="text-primary" aria-hidden="true">*</span>
                </label>
                <input
                  id="column-name"
                  data-testid="column-name-input"
                  type="text"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="Enter column name..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground transition-all focus-ring placeholder:text-foreground-muted/50"
                  required
                  aria-required="true"
                  aria-label="Column Name"
                />
              </div>

              <Button
                type="submit"
                data-testid="add-column-submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold btn-gaming focus-ring"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Column
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-foreground-muted/70 text-center">
          © 2026 ARES KANBAN
        </p>
      </div>
    </div>
  )
}

interface CardModalProps {
  card: KanbanCard | null
  onUpdate: (id: string, data: Partial<KanbanCard>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function CardModal({ card, onUpdate, onDelete, onClose }: CardModalProps) {
  const [title, setTitle] = React.useState(card?.title || "")
  const [description, setDescription] = React.useState(card?.description || "")
  const [priority, setPriority] = React.useState(card?.metadata?.priority || "low")

  React.useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description || "")
      setPriority(card.metadata?.priority || "low")
    }
  }, [card])

  const handleUpdate = () => {
    if (!card) return
    onUpdate(card.id, {
      title,
      description,
      metadata: { ...card.metadata, priority }
    })
    onClose()
  }

  const handleDelete = () => {
    if (!card) return
    if (window.confirm("Are you sure you want to delete this card?")) {
      onDelete(card.id)
      onClose()
    }
  }

  if (!card) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-modal-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-background rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border"
      >
        <CardHeader className="border-b border-border bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <CardTitle id="card-modal-title" className="text-2xl font-bold text-foreground">
                CARD DETAILS
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-primary/10 text-foreground focus-ring"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Card ID */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Card ID
            </label>
            <div className="text-sm text-foreground-muted font-mono bg-card/50 p-3 rounded-lg border border-border/50">
              {card.id}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="edit-title" className="block text-sm font-semibold text-foreground">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground transition-all focus-ring placeholder:text-foreground-muted/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="edit-description" className="block text-sm font-semibold text-foreground">
              Description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full min-h-[120px] px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground transition-all focus-ring resize-none placeholder:text-foreground-muted/50"
              placeholder="Enter card description..."
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label htmlFor="edit-priority" className="block text-sm font-semibold text-foreground">
              Priority
            </label>
            <select
              id="edit-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground transition-all focus-ring"
            >
              <option value="low" className="bg-background">Low</option>
              <option value="medium" className="bg-background">Medium</option>
              <option value="high" className="bg-background">High</option>
            </select>
          </div>

          {/* Metadata */}
          {card.metadata && Object.keys(card.metadata).length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Metadata
              </label>
              <div className="bg-card/50 p-4 rounded-lg border border-border/50">
                <pre className="text-sm text-foreground overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(card.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-foreground-muted/70 space-y-1 pt-4 border-t border-border/50">
            {card.created_at && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Created:</span>
                <span className="font-mono">{new Date(card.created_at).toLocaleString()}</span>
              </div>
            )}
            {card.updated_at && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Updated:</span>
                <span className="font-mono">{new Date(card.updated_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 p-6 border-t border-border gap-3">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white focus-ring"
            aria-label="Delete card"
          >
            Delete
          </Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border hover:bg-primary/10 text-foreground focus-ring"
              aria-label="Cancel changes"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold btn-gaming focus-ring"
              aria-label="Save changes"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Column Edit Modal
interface ColumnEditModalProps {
  column: Column | null
  onClose: () => void
  onSave: (name: string) => Promise<void>
  isSaving?: boolean
}

function ColumnEditModal({ column, onClose, onSave, isSaving = false }: ColumnEditModalProps) {
  const [name, setName] = React.useState(column?.name || "")

  React.useEffect(() => {
    setName(column?.name || "")
  }, [column])

  const handleSave = async () => {
    if (name.trim()) {
      await onSave(name)
    }
  }

  if (!column) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="column-edit-modal-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-background rounded-lg shadow-2xl w-full max-w-md border border-border"
      >
        <CardHeader className="border-b border-border bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-white" />
              </div>
              <CardTitle id="column-edit-modal-title" className="text-2xl font-bold text-foreground">
                EDIT COLUMN
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-primary/10 text-foreground focus-ring"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <label htmlFor="edit-column-name" className="block text-sm font-semibold text-foreground">
              Column Name
            </label>
            <input
              id="edit-column-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter column name..."
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground transition-all focus-ring placeholder:text-foreground-muted/50"
              autoFocus
            />
          </div>
        </CardContent>

        <div className="flex gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 border-border hover:bg-primary/10 text-foreground focus-ring"
            aria-label="Cancel changes"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold btn-gaming focus-ring disabled:opacity-50"
            aria-label="Save changes"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
