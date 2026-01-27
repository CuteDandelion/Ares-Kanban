"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/contexts/ThemeProvider"
import { MoreHorizontal, Calendar, User, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

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
  cards?: KanbanCard[]
}

interface ProfessionalKanbanBoardProps {
  columns: Column[]
  cards: KanbanCard[]
  sidebarOpen: boolean
  selectedCard: KanbanCard | null
  onAddCard: (data: { column_id: string; title: string; description: string }) => void
  onAddColumn: (name: string) => void
  onCardClick: (card: KanbanCard) => void
  onUpdateCard: (id: string, data: Partial<KanbanCard>) => void
  onDeleteCard: (id: string) => void
  onCloseCard: () => void
  onToggleSidebar: () => void
}

export default function ProfessionalKanbanBoard({
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
  onToggleSidebar
}: ProfessionalKanbanBoardProps) {
  const { theme, setTheme } = useTheme()

  const getCardsForColumn = (columnId: string) => {
    return cards
      .filter(card => card.column_id === columnId)
      .sort((a, b) => a.position - b.position)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 dark:from-slate-900 dark:via-slate-950 to-slate-800 transition-colors">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-40 border-r dark:border-slate-800 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent
          columns={columns}
          onAddCard={onAddCard}
          onAddColumn={onAddColumn}
          onClose={() => onToggleSidebar()}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onToggleSidebar()}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MoreHorizontal className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ares-Kanban
              </h1>
            </div>

            {/* Theme Toggle - Disabled in gaming mode */}
            <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-all opacity-50 cursor-not-allowed">
              <Zap className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </header>

        {/* Board */}
        <main className="flex-1 p-6 overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {columns.map((column) => {
              const columnCards = getCardsForColumn(column.id)
              return (
                <div key={column.id} className="w-80 flex-shrink-0">
                  <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-lg p-4 flex flex-col border-2">
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-semibold text-slate-800 dark:text-white">
                        {column.name}
                        <Badge className="ml-2" variant="secondary">
                          {columnCards.length}
                        </Badge>
                      </h2>
                    </div>

                    {/* Cards List */}
                    <div className="flex-1 space-y-3 overflow-y-auto min-h-[400px]">
                      {columnCards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-500 dark:text-slate-400">
                          <p className="text-sm">No cards yet</p>
                          <p className="text-xs mt-2">Drag cards here or add a new one</p>
                        </div>
                      ) : (
                        columnCards.map((card, index) => (
                          <Card
                            key={card.id}
                            onClick={() => onCardClick(card)}
                            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                          >
                            <CardContent>
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-slate-900 dark:text-white text-base line-clamp-1">
                                  {card.title}
                                </h4>
                                {card.metadata?.priority && (
                                  <Badge variant={card.metadata.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                                    {card.metadata.priority}
                                  </Badge>
                                )}
                              </div>
                              {card.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {card.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-500">
                                {card.updated_at && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(card.updated_at).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {card.metadata?.assignee && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span className="truncate max-w-[100px]">
                                      {card.metadata.assignee}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* Add Card Button */}
                    <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                      <Button variant="ghost" size="sm" className="w-full text-slate-600 dark:text-slate-400">
                        + Add Card
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onUpdate={onUpdateCard}
          onDelete={onDeleteCard}
          onClose={onCloseCard}
        />
      )}
    </div>
  )
}

interface SidebarContentProps {
  columns: Column[]
  onAddCard: (data: { column_id: string; title: string; description: string }) => void
  onAddColumn: (name: string) => void
  onClose: () => void
}

function SidebarContent({ columns, onAddCard, onAddColumn, onClose }: SidebarContentProps) {
  const [activeTab, setActiveTab] = React.useState<"add-card" | "add-column">("add-card")
  const [selectedColumnId, setSelectedColumnId] = React.useState(columns[0]?.id || "")
  const [cardTitle, setCardTitle] = React.useState("")
  const [cardDescription, setCardDescription] = React.useState("")
  const [columnName, setColumnName] = React.useState("")

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardTitle.trim() || !selectedColumnId) return

    onAddCard({
      column_id: selectedColumnId,
      title: cardTitle,
      description: cardDescription,
    })

    setCardTitle("")
    setCardDescription("")
  }

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!columnName.trim()) return

    onAddColumn(columnName)
    setColumnName("")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Manage Board
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("add-card")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "add-card"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Add Card
        </button>
        <button
          onClick={() => setActiveTab("add-column")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "add-column"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Add Column
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "add-card" ? (
          <form onSubmit={handleAddCard} className="space-y-4">
            {/* Column Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Column
              </label>
              <select
                value={selectedColumnId}
                onChange={(e) => setSelectedColumnId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder="Enter card title..."
                className="w-full h-10 rounded-md border border-slate-300 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={cardDescription}
                onChange={(e) => setCardDescription(e.target.value)}
                placeholder="Enter card description..."
                rows={4}
                className="w-full min-h-[80px] rounded-md border border-slate-300 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full">
              Add Card
            </Button>
          </form>
        ) : (
          <form onSubmit={handleAddColumn} className="space-y-4">
            {/* Column Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Column Name
              </label>
              <input
                type="text"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="Enter column name..."
                className="w-full h-10 rounded-md border border-slate-300 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full">
              Add Column
            </Button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          © 2026 Ares-Kanban
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Card Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Card ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Card ID
            </label>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
              {card.id}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 rounded-md border border-slate-300 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full min-h-[120px] rounded-md border border-slate-300 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              placeholder="Enter card description..."
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full h-10 rounded-md border border-slate-300 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Metadata */}
          {card.metadata && Object.keys(card.metadata).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Metadata
              </label>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                <pre className="text-sm text-slate-700 dark:text-slate-300 overflow-x-auto">
                  {JSON.stringify(card.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            {card.created_at && (
              <div className="flex items-center gap-1">
                <span>Created:</span>
                <span className="font-mono">{new Date(card.created_at).toLocaleString()}</span>
              </div>
            )}
            {card.updated_at && (
              <div className="flex items-center gap-1">
                <span>Updated:</span>
                <span className="font-mono">{new Date(card.updated_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
            Delete
          </Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
