'use client'

import React, { useState } from 'react'

interface Card {
  id: string
  title: string
  description?: string
  position: number
}

interface Column {
  id: string
  name: string
  position: number
  cards: Card[]
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'col-1', name: 'Backlog', position: 0, cards: [] },
    { id: 'col-2', name: 'To Do', position: 1, cards: [] },
    { id: 'col-3', name: 'In Progress', position: 2, cards: [] },
    { id: 'col-4', name: 'Done', position: 3, cards: [] },
  ])

  const [newCardTitle, setNewCardTitle] = useState('')
  const [selectedColumn, setSelectedColumn] = useState('col-1')

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return

    const newCard: Card = {
      id: `card-${Date.now()}`,
      title: newCardTitle,
      position: 0,
    }

    setColumns((prev) =>
      prev.map((col) =>
        col.id === selectedColumn
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      )
    )

    setNewCardTitle('')
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Multi-Agent Kanban Board
      </h1>

      {/* Add Card Form */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex gap-4">
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
            placeholder="Enter card title..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddCard}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Card
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="bg-gray-100 p-4 rounded-lg min-h-[400px]"
          >
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              {column.name}
              <span className="ml-2 text-sm text-gray-500">
                ({column.cards.length})
              </span>
            </h2>
            <div className="space-y-2">
              {column.cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md cursor-move transition-shadow"
                >
                  <p className="text-gray-800 font-medium">{card.title}</p>
                  {card.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {card.description}
                    </p>
                  )}
                </div>
              ))}
              {column.cards.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  No cards
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
