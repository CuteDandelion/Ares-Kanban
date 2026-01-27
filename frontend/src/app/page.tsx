"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { AresThemeProvider } from "@/contexts/ThemeProvider"
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

export default function Home() {
  const [columns, setColumns] = React.useState<Column[]>([])
  const [cards, setCards] = React.useState<Card[]>([])
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [selectedCard, setSelectedCard] = React.useState<Card | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchColumns = async () => {
    try {
      const response = await columnApi.getAll()
      setColumns(response.data)
    } catch (err: any) {
      const errorMessage = err.userMessage || 'Failed to load columns'
      setError(errorMessage)
      console.error('Error fetching columns:', err)
      toast.error(errorMessage)
    }
  }

  const fetchCards = async () => {
    try {
      const response = await cardApi.getAll()
      setCards(response.data)
    } catch (err: any) {
      const errorMessage = err.userMessage || 'Failed to load cards'
      setError(errorMessage)
      console.error('Error fetching cards:', err)
      toast.error(errorMessage)
    }
  }

  const handleAddCard = async (data: { column_id: string; title: string; description: string; metadata?: any }) => {
    try {
      const response = await cardApi.create({
        ...data,
        position: cards.filter((c) => c.column_id === data.column_id).length,
      })
      // Add new card to local state immediately for better UX
      setCards(prevCards => [...prevCards, response.data])
      toast.success('Card added successfully')
    } catch (err: any) {
      console.error('Failed to add card:', err)
      toast.error(err.userMessage || 'Failed to add card')
      // Refresh cards from API if add fails to ensure consistency
      await fetchCards()
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
      // Add new column to local state immediately for better UX
      setColumns(prevColumns => [...prevColumns, response.data])
      toast.success('Column added successfully')
    } catch (err: any) {
      console.error('Failed to add column:', err)
      toast.error(err.userMessage || 'Failed to add column')
      // Refresh columns from API if add fails to ensure consistency
      await fetchColumns()
    }
  }

  const handleUpdateCard = async (id: string, data: any) => {
    try {
      const response = await cardApi.update(id, data)
      // Update local state immediately for better UX
      setCards(prevCards =>
        prevCards.map(card =>
          card.id === id ? { ...card, ...response.data } : card
        )
      )
      toast.success('Card updated successfully')
    } catch (err: any) {
      console.error('Failed to update card:', err)
      toast.error(err.userMessage || 'Failed to update card')
      // Refresh cards from API if update fails to ensure consistency
      await fetchCards()
    }
  }

  const handleDeleteCard = async (id: string) => {
    try {
      await cardApi.delete(id)
      // Remove from local state immediately for better UX
      setCards(prevCards => prevCards.filter(card => card.id !== id))
      toast.success('Card deleted successfully')
    } catch (err: any) {
      console.error('Failed to delete card:', err)
      toast.error(err.userMessage || 'Failed to delete card')
      // Refresh cards from API if delete fails to ensure consistency
      await fetchCards()
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
      // Update local state immediately for better UX
      setColumns(prevColumns =>
        prevColumns.map(col =>
          col.id === id ? { ...col, name } : col
        )
      )
      toast.success('Column name updated successfully')
    } catch (error) {
      console.error('Failed to save column name:', error)
      toast.error('Failed to update column name')
      // Refresh columns from API if update fails to ensure consistency
      await fetchColumns()
    }
  }

  const handleDeleteColumn = async (id: string) => {
    try {
      await columnApi.delete(id)
      // Remove column and its cards from local state immediately for better UX
      setColumns(prevColumns => prevColumns.filter(col => col.id !== id))
      setCards(prevCards => prevCards.filter(card => card.column_id !== id))
      toast.success('Column deleted successfully')
    } catch (error) {
      console.error('Failed to delete column:', error)
      toast.error('Failed to delete column')
      // Refresh from API if delete fails to ensure consistency
      await fetchColumns()
      await fetchCards()
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

      // Update local state with new positions
      setColumns(newColumns.map((col, index) => ({ ...col, position: index })))

      toast.success('Columns reordered successfully')
    } catch (error) {
      console.error('Failed to reorder columns:', error)
      toast.error('Failed to reorder columns')
      // Revert to original order if API call fails
      await fetchColumns()
    }
  }

  const handleMoveCard = async (cardId: string, newColumnId: string, newPosition: number) => {
    try {
      await cardApi.move(cardId, { column_id: newColumnId, position: newPosition })

      // Update local state immediately for better UX
      setCards(prevCards =>
        prevCards.map(card =>
          card.id === cardId
            ? { ...card, column_id: newColumnId, position: newPosition, updated_at: new Date().toISOString() }
            : card
        )
      )

      toast.success('Card moved successfully')
    } catch (err: any) {
      console.error('Failed to move card:', err)
      toast.error(err.userMessage || 'Failed to move card')
      // Refresh cards from API if move fails to ensure consistency
      await fetchCards()
    }
  }

  React.useEffect(() => {
    // Fetch both columns and cards in parallel, then set loading to false
    Promise.all([fetchColumns(), fetchCards()])
      .then(() => {
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading data:', err)
        setLoading(false)
      })
  }, [])

  // Loading state
  if (loading) {
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
  if (error) {
    const isNetworkError = error.includes('Network Error') || error.includes('Connection Refused')
    const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
                {isNetworkError ? 'Connection Error' : 'Error Loading Data'}
              </motion.h2>

              {/* Error Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-foreground-muted/80 text-center mb-6 whitespace-pre-wrap"
              >
                {error}
              </motion.p>

              {/* Troubleshooting Steps */}
              {isNetworkError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-card/50 rounded-lg border border-border/50 p-4 mb-6"
                >
                  <p className="font-semibold text-foreground mb-3">Troubleshooting Steps:</p>
                  <ol className="list-decimal list-inside space-y-3 text-sm text-foreground-muted/80">
                    <li>
                      Check if backend is running:
                      <code className="block mt-1 ml-4 bg-background p-2 rounded border border-border/50 font-mono text-xs">
                        docker ps | grep kanban-backend
                      </code>
                    </li>
                    <li>
                      Verify backend health:
                      <code className="block mt-1 ml-4 bg-background p-2 rounded border border-border/50 font-mono text-xs">
                        curl {apiURL}/health
                      </code>
                    </li>
                    <li>
                      Check backend logs:
                      <code className="block mt-1 ml-4 bg-background p-2 rounded border border-border/50 font-mono text-xs">
                        docker logs kanban-backend
                      </code>
                    </li>
                  </ol>
                </motion.div>
              )}

              {/* Retry Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center"
              >
                <button
                  onClick={() => {
                    setLoading(true)
                    setError(null)
                    fetchColumns()
                    fetchCards()
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
        columns={columns}
        cards={cards}
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
