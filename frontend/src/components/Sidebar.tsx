import React, { useState } from 'react'

interface Column {
  id: string
  name: string
}

interface SidebarProps {
  columns: Column[]
  onAddCard: (data: { column_id: string; title: string; description: string }) => void
  onAddColumn: (name: string) => void
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ columns, onAddCard, onAddColumn, isOpen, onToggle }: SidebarProps) {
  const [selectedColumnId, setSelectedColumnId] = useState(columns[0]?.id || '')
  const [cardTitle, setCardTitle] = useState('')
  const [cardDescription, setCardDescription] = useState('')
  const [columnName, setColumnName] = useState('')
  const [activeTab, setActiveTab] = useState<'card' | 'column'>('card')

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardTitle.trim() || !selectedColumnId) return

    onAddCard({
      column_id: selectedColumnId,
      title: cardTitle,
      description: cardDescription,
    })

    setCardTitle('')
    setCardDescription('')
    setSelectedColumnId(columns[0]?.id || '')
  }

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!columnName.trim()) return

    onAddColumn(columnName)
    setColumnName('')
    setActiveTab('card')
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Manage Board
            </h2>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className="absolute top-4 right-4 lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Tabs */}
          <div className="flex border-b dark:border-gray-700">
            <button
              data-testid="card-tab"
              onClick={() => setActiveTab('card')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'card'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Add Card
            </button>
            <button
              data-testid="column-tab"
              onClick={() => setActiveTab('column')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'column'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Add Column
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'card' ? (
              <form onSubmit={handleAddCard} className="space-y-4">
                {/* Column Selection */}
                <div>
                  <label htmlFor="column-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Column
                  </label>
                  <select
                    id="column-select"
                    value={selectedColumnId}
                    onChange={(e) => setSelectedColumnId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
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
                  <label htmlFor="card-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    id="card-title"
                    type="text"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    placeholder="Enter card title..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="card-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="card-description"
                    value={cardDescription}
                    onChange={(e) => setCardDescription(e.target.value)}
                    placeholder="Enter card description..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  data-testid="add-card-submit"
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Add Card
                </button>
              </form>
            ) : (
              <form onSubmit={handleAddColumn} className="space-y-4">
                {/* Column Name */}
                <div>
                  <label htmlFor="column-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Column Name *
                  </label>
                  <input
                    id="column-name"
                    type="text"
                    value={columnName}
                    onChange={(e) => setColumnName(e.target.value)}
                    placeholder="Enter column name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  data-testid="add-column-submit"
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  Add Column
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              © 2026 Ares-Kanban
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
