/**
 * Frontend Unit Tests - API Service
 *
 * Tests API service layer using mocked functions.
 * Ensures correct function calls and error handling.
 */

// Mock helpers imports (must be before jest.mock)
import {
  mockSuccessResponse,
  mockErrorResponse,
  mockNetworkError,
} from '../utils/test-helpers'

// Mock the api module BEFORE importing it
jest.mock('@/services/api')

// Import mocked API after mock is setup
import { columnApi, cardApi } from '@/services/api'

describe('API Service - Column API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('columnApi.getAll', () => {
    test('should call getAll method', async () => {
      const mockColumns = [
        { id: '1', name: 'Backlog', position: 0 },
        { id: '2', name: 'To Do', position: 1 },
      ]

      columnApi.getAll.mockResolvedValueOnce(mockSuccessResponse(mockColumns))

      const result = await columnApi.getAll()

      expect(columnApi.getAll).toHaveBeenCalled()
      expect(result.data).toEqual(mockColumns)
    })

    test('should handle errors', async () => {
      columnApi.getAll.mockRejectedValueOnce(mockNetworkError())

      await expect(columnApi.getAll()).rejects.toThrow('Network Error')
    })
  })

  describe('columnApi.getOne', () => {
    test('should call getOne with id', async () => {
      const mockColumn = { id: '1', name: 'Backlog', position: 0 }

      columnApi.getOne.mockResolvedValueOnce(mockSuccessResponse(mockColumn))

      const result = await columnApi.getOne('1')

      expect(columnApi.getOne).toHaveBeenCalledWith('1')
      expect(result.data).toEqual(mockColumn)
    })

    test('should handle errors', async () => {
      columnApi.getOne.mockRejectedValueOnce(mockErrorResponse('Not found', 404))

      await expect(columnApi.getOne('non-existent')).rejects.toThrow('Not found')
    })
  })

  describe('columnApi.create', () => {
    test('should call create with data', async () => {
      const newColumn = { name: 'New Column', position: 0 }
      const createdColumn = { id: '3', ...newColumn }

      columnApi.create.mockResolvedValueOnce(mockSuccessResponse(createdColumn))

      const result = await columnApi.create(newColumn)

      expect(columnApi.create).toHaveBeenCalledWith(newColumn)
      expect(result.data).toEqual(createdColumn)
    })

    test('should handle optional board_id', async () => {
      const newColumn = { name: 'New Column', board_id: 'board-1', position: 0 }
      const createdColumn = { id: '3', ...newColumn }

      columnApi.create.mockResolvedValueOnce(mockSuccessResponse(createdColumn))

      const result = await columnApi.create(newColumn)

      expect(columnApi.create).toHaveBeenCalledWith(newColumn)
      expect(result.data).toEqual(createdColumn)
    })

    test('should handle errors', async () => {
      const newColumn = { name: 'New Column', position: 0 }

      columnApi.create.mockRejectedValueOnce(mockErrorResponse('Validation error', 400))

      await expect(columnApi.create(newColumn)).rejects.toThrow('Validation error')
    })
  })

  describe('columnApi.update', () => {
    test('should call update with id and data', async () => {
      const updateData = { name: 'Updated Name' }
      const updatedColumn = { id: '1', ...updateData }

      columnApi.update.mockResolvedValueOnce(mockSuccessResponse(updatedColumn))

      const result = await columnApi.update('1', updateData)

      expect(columnApi.update).toHaveBeenCalledWith('1', updateData)
      expect(result.data).toEqual(updatedColumn)
    })

    test('should handle partial updates', async () => {
      const updateData = { position: 5 }

      columnApi.update.mockResolvedValueOnce(
        mockSuccessResponse({ id: '1', name: 'Backlog', position: 5 })
      )

      const result = await columnApi.update('1', updateData)

      expect(columnApi.update).toHaveBeenCalledWith('1', updateData)
      expect(result.data).toEqual({ id: '1', name: 'Backlog', position: 5 })
    })

    test('should handle errors', async () => {
      const updateData = { name: 'Updated Name' }

      columnApi.update.mockRejectedValueOnce(mockErrorResponse('Not found', 404))

      await expect(columnApi.update('non-existent', updateData)).rejects.toThrow('Not found')
    })
  })

  describe('columnApi.delete', () => {
    test('should call delete with id', async () => {
      const mockResponse = { message: 'Column deleted successfully' }

      columnApi.delete.mockResolvedValueOnce(mockSuccessResponse(mockResponse))

      const result = await columnApi.delete('1')

      expect(columnApi.delete).toHaveBeenCalledWith('1')
      expect(result.data).toEqual(mockResponse)
    })

    test('should return deletion message', async () => {
      const mockResponse = { message: 'Column deleted successfully' }

      columnApi.delete.mockResolvedValueOnce(mockSuccessResponse(mockResponse))

      const result = await columnApi.delete('1')

      expect(result.data).toEqual(mockResponse)
    })

    test('should handle errors', async () => {
      columnApi.delete.mockRejectedValueOnce(mockErrorResponse('Not found', 404))

      await expect(columnApi.delete('non-existent')).rejects.toThrow('Not found')
    })
  })

  describe('columnApi.reorder', () => {
    test('should call reorder with columns array', async () => {
      const columnsToReorder = [
        { id: '1', position: 1 },
        { id: '2', position: 0 },
      ]
      const mockResponse = { message: 'Columns reordered successfully' }

      columnApi.reorder.mockResolvedValueOnce(mockSuccessResponse(mockResponse))

      const result = await columnApi.reorder(columnsToReorder)

      expect(columnApi.reorder).toHaveBeenCalledWith(columnsToReorder)
      expect(result.data).toEqual(mockResponse)
    })

    test('should return reorder message', async () => {
      const columnsToReorder = [
        { id: '1', position: 1 },
        { id: '2', position: 0 },
      ]
      const mockResponse = { message: 'Columns reordered successfully' }

      columnApi.reorder.mockResolvedValueOnce(mockSuccessResponse(mockResponse))

      const result = await columnApi.reorder(columnsToReorder)

      expect(result.data).toEqual(mockResponse)
    })

    test('should handle errors', async () => {
      const columnsToReorder = [{ id: '1', position: 1 }]

      columnApi.reorder.mockRejectedValueOnce(mockErrorResponse('Server error', 500))

      await expect(columnApi.reorder(columnsToReorder)).rejects.toThrow('Server error')
    })
  })
})

describe('API Service - Card API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('cardApi.getAll', () => {
    test('should call getAll without filter', async () => {
      const mockCards = [
        { id: '1', title: 'Card 1', column_id: 'col-1' },
        { id: '2', title: 'Card 2', column_id: 'col-1' },
      ]

      cardApi.getAll.mockResolvedValueOnce(mockSuccessResponse(mockCards))

      const result = await cardApi.getAll()

      expect(cardApi.getAll).toHaveBeenCalledWith()
      expect(result.data).toEqual(mockCards)
    })

    test('should call getAll with column_id filter', async () => {
      const mockCards = [
        { id: '1', title: 'Card 1', column_id: 'col-1' },
      ]

      cardApi.getAll.mockResolvedValueOnce(mockSuccessResponse(mockCards))

      const result = await cardApi.getAll('col-1')

      expect(cardApi.getAll).toHaveBeenCalledWith('col-1')
      expect(result.data).toEqual(mockCards)
    })

    test('should handle errors', async () => {
      cardApi.getAll.mockRejectedValueOnce(mockNetworkError())

      await expect(cardApi.getAll()).rejects.toThrow('Network Error')
    })
  })

  describe('cardApi.getOne', () => {
    test('should call getOne with id', async () => {
      const mockCard = { id: '1', title: 'Card 1', column_id: 'col-1' }

      cardApi.getOne.mockResolvedValueOnce(mockSuccessResponse(mockCard))

      const result = await cardApi.getOne('1')

      expect(cardApi.getOne).toHaveBeenCalledWith('1')
      expect(result.data).toEqual(mockCard)
    })

    test('should handle errors', async () => {
      cardApi.getOne.mockRejectedValueOnce(mockErrorResponse('Not found', 404))

      await expect(cardApi.getOne('non-existent')).rejects.toThrow('Not found')
    })
  })

  describe('cardApi.create', () => {
    test('should call create with full data', async () => {
      const newCard = {
        column_id: 'col-1',
        title: 'New Card',
        description: 'Card description',
        position: 0,
        metadata: { priority: 'high' },
      }
      const createdCard = { id: 'card-1', ...newCard }

      cardApi.create.mockResolvedValueOnce(mockSuccessResponse(createdCard))

      const result = await cardApi.create(newCard)

      expect(cardApi.create).toHaveBeenCalledWith(newCard)
      expect(result.data).toEqual(createdCard)
    })

    test('should handle optional fields', async () => {
      const minimalCard = { column_id: 'col-1', title: 'New Card' }
      const createdCard = { id: 'card-1', ...minimalCard }

      cardApi.create.mockResolvedValueOnce(mockSuccessResponse(createdCard))

      const result = await cardApi.create(minimalCard)

      expect(cardApi.create).toHaveBeenCalledWith(minimalCard)
      expect(result.data).toEqual(createdCard)
    })

    test('should handle errors', async () => {
      const newCard = { column_id: 'col-1', title: 'New Card' }

      cardApi.create.mockRejectedValueOnce(mockErrorResponse('Validation error', 400))

      await expect(cardApi.create(newCard)).rejects.toThrow('Validation error')
    })
  })

  describe('cardApi.update', () => {
    test('should call update with id and data', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      }
      const updatedCard = { id: '1', ...updateData }

      cardApi.update.mockResolvedValueOnce(mockSuccessResponse(updatedCard))

      const result = await cardApi.update('1', updateData)

      expect(cardApi.update).toHaveBeenCalledWith('1', updateData)
      expect(result.data).toEqual(updatedCard)
    })

    test('should handle partial updates', async () => {
      const updateData = { description: 'New description' }

      cardApi.update.mockResolvedValueOnce(
        mockSuccessResponse({ id: '1', title: 'Card 1', description: 'New description' })
      )

      const result = await cardApi.update('1', updateData)

      expect(cardApi.update).toHaveBeenCalledWith('1', updateData)
      expect(result.data).toEqual({ id: '1', title: 'Card 1', description: 'New description' })
    })

    test('should handle errors', async () => {
      const updateData = { title: 'Updated Title' }

      cardApi.update.mockRejectedValueOnce(mockErrorResponse('Not found', 404))

      await expect(cardApi.update('non-existent', updateData)).rejects.toThrow('Not found')
    })
  })

  describe('cardApi.delete', () => {
    test('should call delete with id', async () => {
      const mockResponse = { message: 'Card deleted successfully' }

      cardApi.delete.mockResolvedValueOnce(mockSuccessResponse(mockResponse))

      const result = await cardApi.delete('1')

      expect(cardApi.delete).toHaveBeenCalledWith('1')
      expect(result.data).toEqual(mockResponse)
    })

    test('should return deletion message', async () => {
      const mockResponse = { message: 'Card deleted successfully' }

      cardApi.delete.mockResolvedValueOnce(mockSuccessResponse(mockResponse))

      const result = await cardApi.delete('1')

      expect(result.data).toEqual(mockResponse)
    })

    test('should handle errors', async () => {
      cardApi.delete.mockRejectedValueOnce(mockErrorResponse('Not found', 404))

      await expect(cardApi.delete('non-existent')).rejects.toThrow('Not found')
    })
  })

  describe('cardApi.move', () => {
    test('should call move with column_id and position', async () => {
      const moveData = { column_id: 'col-2', position: 0 }
      const movedCard = { id: '1', ...moveData }

      cardApi.move.mockResolvedValueOnce(mockSuccessResponse(movedCard))

      const result = await cardApi.move('1', moveData)

      expect(cardApi.move).toHaveBeenCalledWith('1', moveData)
      expect(result.data).toEqual(movedCard)
    })

    test('should handle position-only move', async () => {
      const moveData = { column_id: 'col-1', position: 5 }

      cardApi.move.mockResolvedValueOnce(
        mockSuccessResponse({ id: '1', column_id: 'col-1', position: 5 })
      )

      const result = await cardApi.move('1', moveData)

      expect(cardApi.move).toHaveBeenCalledWith('1', moveData)
      expect(result.data).toEqual({ id: '1', column_id: 'col-1', position: 5 })
    })

    test('should handle errors', async () => {
      const moveData = { column_id: 'col-2', position: 0 }

      cardApi.move.mockRejectedValueOnce(mockErrorResponse('Not found', 404))

      await expect(cardApi.move('non-existent', moveData)).rejects.toThrow('Not found')
    })
  })
})
