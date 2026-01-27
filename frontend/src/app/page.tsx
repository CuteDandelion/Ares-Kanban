"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { AresThemeProvider } from "@/contexts/ThemeProvider"
import useSWR, { useSWRConfig } from 'swr'
import { columnApi, cardApi } from "@/services/api"
import { Toaster } from "@/components/ui/sonner"
import KanbanBoard from "@/components/KanbanBoard/Board"
import { Zap, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Column {
  id: string
  name: string
  position: number
  board_id?: string
}

interface Card {
  id: string
  title: string
  description?: string
  position: number
  column_id: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

// SWR configuration for better error handling and revalidation
const swrConfig = useSWRConfig({
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,
  onError: (error) => {
    console.error('SWR Error:', error)
    const errorMessage = (error as any)?.userMessage || 'An error occurred'
    toast.error(errorMessage)
  },
})

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [selectedCard, setSelectedCard] = React.useState<Card | null>(null)

  // SWR hooks for automatic real-time data fetching and caching
  const { data: columns = [], mutate: mutateColumns } = useSWR<Column[]>(
    '/board/columns',
    async () => columnApi.getAll().then(res => res.data),
    swrConfig
  )

  const { data: cards = [], mutate: mutateCards } = useSWR<Card[]>(
    '/board/cards',
    async () => cardApi.getAll().then(res => res.data),
    swrConfig
  )

  const handleAddCard = async (data: { column_id: string; title: string; description: string; metadata?: any }) => {
    try {
      const response = await cardApi.create({
        ...data,
        position: cards.filter((c) => c.column_id === data.column_id).length,
      })

      // Optimistic update - update local state immediately
      mutateCards((prevCards) => [...(prevCards || []), response.data], {
        rollbackOnError: true,
        populateCache: true,
      })

      toast.success('Card added successfully')
    } catch (err: any) {
      console.error('Failed to add card:', err)
      toast.error(err.userMessage || 'Failed to add card')
    }
  }

  const handleAddColumn = async (name: string) => {
    try {
      // Get board_id from existing columns (they should all belong to same board)
      const boardId = columns[0]?.board_id || ''

      const response = await columnApi.create({
        name,
        board_id: boardId,
        position: columns.length,
      })

      // Optimistic update
      mutateColumns((prevColumns) => [...(prevColumns || []), response.data], {
        rollbackOnError: true,
        populateCache: true,
      })

      toast.success('Column added successfully')
    } catch (err: any) {
      console.error('Failed to add column:', err)
      toast.error(err.userMessage || 'Failed to add column')
    }
  }

  const handleUpdateCard = async (id: string, data: any) => {
    try {
      const response = await cardApi.update(id, data)

      // Optimistic update
      mutateCards((prevCards) =>
        (prevCards || []).map(card =>
          card.id === id ? { ...card, ...response.data } : card
        ),
        {
          rollbackOnError: true,
          populateCache: true,
        }
      )

      toast.success('Card updated successfully')
    } catch (err: any) {
      console.error('Failed to update card:', err)
      toast.error(err.userMessage || 'Failed to update card')
    }
  }

  const handleDeleteCard = async (id: string) => {
    try {
      await cardApi.delete(id)

      // Optimistic update
      mutateCards((prevCards) => (prevCards || []).filter(card => card.id !== id), {
        rollbackOnError: true,
        populateCache: true,
      })

      toast.success('Card deleted successfully')
    } catch (err: any) {
      console.error('Failed to delete card:', err)
      toast.error(err.userMessage || 'Failed to delete card')
    }
  }

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
  }

  const handleCloseCard = () => {
    setSelectedCard(null)
  }

  const handleUpdateColumn = async (id: string, name: string) => {
    try {
      const response = await columnApi.update(id, { name })

      // Optimistic update - update column name in real-time
      mutateColumns((prevColumns) =>
        (prevColumns || []).map(col =>
          col.id === id ? { ...col, name } : col
        ),
        {
          rollbackOnError: true,
          populateCache: true,
        }
      )

      toast.success('Column name updated successfully')
    } catch (error) {
      console.error('Failed to save column name:', error)
      toast.error('Failed to update column name')
    }
  }

  const handleDeleteColumn = async (id: string) => {
    try {
      await columnApi.delete(id)

      // Optimistic update - remove column and its cards
      mutateColumns((prevColumns) => (prevColumns || []).filter(col => col.id !== id), {
        rollbackOnError: true,
        populateCache: true,
      })

      mutateCards((prevCards) => (prevCards || []).filter(card => card.column_id !== id), {
        rollbackOnError: true,
        populateCache: true,
      })

      toast.success('Column deleted successfully')
    } catch (error) {
      console.error('Failed to delete column:', error)
      toast.error('Failed to delete column')
    }
  }

  const handleReorderColumns = async (newColumns: Column[]) => {
    try {
      // Prepare columns for API with new positions
      const columnsToReorder = newColumns.map((col, index) => ({
        id: col.id,
        position: index,
      }))

      console.log('Reordering columns:', columnsToReorder)

      // Call API to persist new order
      await columnApi.reorder(columnsToReorder)

      // Optimistic update
      mutateColumns(newColumns, {
        rollbackOnError: true,
        populateCache: true,
      })

      toast.success('Columns reordered successfully')
    } catch (error) {
      console.error('Failed to reorder columns:', error)
      toast.error('Failed to reorder columns')
      // Revert to original order if API call fails
      mutateColumns()
    }
  }

  const handleMoveCard = async (cardId: string, newColumnId: string, newPosition: number) => {
    try {
      await cardApi.move(cardId, { column_id: newColumnId, position: newPosition })

      // Optimistic update - update card in real-time
      mutateCards((prevCards) =>
        (prevCards || []).map(card =>
          card.id === cardId
            ? { ...card, column_id: newColumnId, position: newPosition, updated_at: new Date().toISOString() }
            : card
        ),
        {
          rollbackOnError: true,
          populateCache: true,
        }
      )

      toast.success('Card moved successfully')
    } catch (err: any) {
      console.error('Failed to move card:', err)
      toast.error(err.userMessage || 'Failed to move card')
    }
  }

  // Loading state
  if (!columns || !cards) {
    return (
      <AresThemeProvider>
        <Toaster />
        <div className="flex items-center justify-center min-h-screen bg-pattern bg-background">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Logo */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse-glow">
              <Zap className="w-10 h-10 text-white" />
            </div>

            {/* Spinner */}
            <div className="spinner w-16 h-16 mx-auto mb-6"></div>

            {/* Loading text */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-foreground text-lg font-semibold tracking-wide"
            >
              LOADING BOARD...
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-foreground-muted/70 text-sm mt-2"
            >
              Initializing ARES Project Management
            </motion.p>
          </motion.div>
        </div>
      </AresThemeProvider>
    )
  }

  // Error state
  if (!columns) {
    return (
      <AresThemeProvider>
        <Toaster />
        <div className="flex items-center justify-center min-h-screen bg-pattern bg-background p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-card rounded-2xl border border-border shadow-2xl p-8">
              {/* Error Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-600/10 flex items-center justify-center"
              >
                <AlertCircle className="w-10 h-10 text-red-500" />
              </motion.div>

              {/* Error Title */}
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-foreground text-center mb-4"
              >
                Error Loading Data
              </motion.h2>

              {/* Error Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-foreground-muted/80 text-center mb-6"
              >
                Unable to load board data. Please try again.
              </motion.p>

              {/* Retry Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center"
              >
                <button
                  onClick={() => {
                    mutateColumns()
                    mutateCards()
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all duration-300 btn-gaming focus-ring"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AresThemeProvider>
    )
  }

  // Main board
  return (
    <AresThemeProvider>
      <Toaster />
      <KanbanBoard
        columns={columns || []}
        cards={cards || []}
        sidebarOpen={sidebarOpen}
        selectedCard={selectedCard}
        onAddCard={handleAddCard}
        onAddColumn={handleAddColumn}
        onCardClick={handleCardClick}
        onUpdateCard={handleUpdateCard}
        onDeleteCard={handleDeleteCard}
        onCloseCard={handleCloseCard}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onUpdateColumn={handleUpdateColumn}
        onDeleteColumn={handleDeleteColumn}
        onReorderColumns={handleReorderColumns}
        onMoveCard={handleMoveCard}
      />
    </AresThemeProvider>
  )
}
