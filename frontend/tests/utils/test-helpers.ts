/**
 * Frontend Test Utilities
 *
 * Provides mock helpers and render utilities for React component testing.
 */

import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AxiosInstance } from 'axios'

// ==========================================
// AXIOS MOCK UTILITIES
// ==========================================

/**
 * Mock axios instance for API testing
 */
export const createMockAxios = (): jest.Mocked<AxiosInstance> => {
  const mockAxios = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(() => mockAxios),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  } as unknown as jest.Mocked<AxiosInstance>

  return mockAxios
}

/**
 * Mock successful response
 */
export const mockSuccessResponse = <T = any>(data: T, status: number = 200) => {
  return Promise.resolve({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  })
}

/**
 * Mock error response
 * Returns an error object (not a Promise) for use with mockRejectedValueOnce
 */
export const mockErrorResponse = (
  message: string,
  status: number = 500,
  code?: string
) => {
  const error: any = new Error(message)
  error.response = {
    data: { error: message },
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  }
  error.code = code
  return error
}

/**
 * Mock network error
 * Returns an error object (not a Promise) for use with mockRejectedValueOnce
 */
export const mockNetworkError = () => {
  const error = new Error('Network Error') as any
  error.code = 'ERR_NETWORK'
  error.request = {}
  error.config = {}
  return error
}

// ==========================================
// REACT RENDERING UTILITIES
// ==========================================

/**
 * Custom render function with providers if needed
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  // Add providers here if needed (e.g., ThemeProvider, etc.)
  return render(ui, options)
}

// ==========================================
// TEST DATA FIXTURES
// ==========================================

export const mockColumn = {
  id: 'col-1',
  name: 'Test Column',
  board_id: 'board-1',
  position: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockCard = {
  id: 'card-1',
  column_id: 'col-1',
  title: 'Test Card',
  description: 'Test Description',
  position: 0,
  metadata: { priority: 'high' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockBoard = {
  id: 'board-1',
  name: 'Test Board',
  user_id: 'user-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockColumns = [
  { ...mockColumn, id: 'col-1', name: 'Backlog', position: 0 },
  { ...mockColumn, id: 'col-2', name: 'To Do', position: 1 },
  { ...mockColumn, id: 'col-3', name: 'Done', position: 2 },
]

export const mockCards = [
  { ...mockCard, id: 'card-1', title: 'Card 1', position: 0 },
  { ...mockCard, id: 'card-2', title: 'Card 2', position: 1 },
  { ...mockCard, id: 'card-3', title: 'Card 3', position: 2 },
]
