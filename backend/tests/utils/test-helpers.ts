/**
 * Backend Test Utilities
 *
 * Provides comprehensive testing utilities for backend tests including:
 * - DatabaseHelper: Manages test database state with cleanup
 * - MockPool: Mock PostgreSQL pool for unit tests
 * - Test data factories: createTestUser, createTestBoard, etc.
 * - Assertion helpers: assertMatch, assertSortedBy
 */

import { Pool, PoolClient, QueryResult } from 'pg'
import { v4 as uuidv4 } from 'uuid'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface TestUser {
  id: string
  email: string
  password_hash: string
  created_at?: Date
}

export interface TestBoard {
  id: string
  name: string
  user_id: string
  created_at?: Date
  updated_at?: Date
}

export interface TestColumn {
  id: string
  name: string
  board_id: string
  position: number
  created_at?: Date
  updated_at?: Date
}

export interface TestCard {
  id: string
  column_id: string
  title: string
  description?: string | null
  position?: number | null
  metadata?: Record<string, any>
  created_at?: Date
  updated_at?: Date
}

// ==========================================
// DATABASE HELPER CLASS
// ==========================================

/**
 * Manages test database state with proper cleanup
 */
export class DatabaseHelper {
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Clean up all test data from tables
   * Deletes in reverse dependency order to avoid foreign key violations
   */
  async cleanup(): Promise<void> {
    try {
      // Delete in reverse order of foreign key dependencies
      await this.pool.query('DELETE FROM cards')
      await this.pool.query('DELETE FROM columns')
      await this.pool.query('DELETE FROM boards')
      await this.pool.query('DELETE FROM users')

      // Add delay to ensure cleanup completes
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Error during cleanup:', error)
      throw error
    }
  }

  /**
   * Insert a test user into the database
   */
  async insertUser(user: TestUser): Promise<void> {
    await this.pool.query(
      'INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)',
      [user.id, user.email, user.password_hash, user.created_at || new Date()]
    )
  }

  /**
   * Insert a test board into the database
   */
  async insertBoard(board: TestBoard): Promise<void> {
    await this.pool.query(
      'INSERT INTO boards (id, name, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
      [
        board.id,
        board.name,
        board.user_id,
        board.created_at || new Date(),
        board.updated_at || new Date(),
      ]
    )
  }

  /**
   * Insert a test column into the database
   */
  async insertColumn(column: TestColumn): Promise<void> {
    await this.pool.query(
      'INSERT INTO columns (id, name, board_id, position, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        column.id,
        column.name,
        column.board_id,
        column.position,
        column.created_at || new Date(),
        column.updated_at || new Date(),
      ]
    )
  }

  /**
   * Insert a test card into the database
   */
  async insertCard(card: TestCard): Promise<void> {
    await this.pool.query(
      'INSERT INTO cards (id, column_id, title, description, position, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        card.id,
        card.column_id,
        card.title,
        card.description || null,
        card.position || null,
        card.metadata || {},
        card.created_at || new Date(),
        card.updated_at || new Date(),
      ]
    )
  }

  /**
   * Get the underlying pool
   */
  getPool(): Pool {
    return this.pool
  }
}

// ==========================================
// MOCK POOL CLASS
// ==========================================

/**
 * Mock PostgreSQL pool for unit tests
 * Simulates database behavior without actual database
 */
export class MockPool {
  private tables: Map<string, any[]> = new Map()
  private delay: number = 10

  constructor(delay: number = 10) {
    this.delay = delay
  }

  /**
   * Set table data for testing
   */
  setTableData(tableName: string, data: any[]): void {
    this.tables.set(tableName, data)
  }

  /**
   * Get table data
   */
  getTableData(tableName: string): any[] {
    return this.tables.get(tableName) || []
  }

  /**
   * Simulate query execution
   */
  async query(text: string, values?: any[]): Promise<QueryResult> {
    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, this.delay))

    // Parse SQL and return appropriate results
    const tableName = this.extractTableName(text)

    if (text.trim().toUpperCase().startsWith('SELECT')) {
      return this.handleSelect(tableName, text, values)
    } else if (text.trim().toUpperCase().startsWith('INSERT')) {
      return this.handleInsert(tableName, text, values)
    } else if (text.trim().toUpperCase().startsWith('UPDATE')) {
      return this.handleUpdate(tableName, text, values)
    } else if (text.trim().toUpperCase().startsWith('DELETE')) {
      return this.handleDelete(tableName, text, values)
    }

    // Default empty result
    return { 
      rows: [], 
      rowCount: 0,
      command: 'SELECT',
      oid: 0,
      fields: []
    }
  }

  /**
   * Connect (mock implementation)
   */
  async connect(): Promise<MockClient> {
    await new Promise((resolve) => setTimeout(resolve, this.delay))
    return new MockClient(this)
  }

  /**
   * End (mock implementation)
   */
  async end(): Promise<void> {
    this.tables.clear()
  }

  /**
   * Extract table name from SQL query
   */
  private extractTableName(text: string): string {
    const fromMatch = text.match(/from\s+(\w+)/i)
    const intoMatch = text.match(/into\s+(\w+)/i)

    return fromMatch?.[1] || intoMatch?.[1] || ''
  }

  /**
   * Handle SELECT queries
   */
  private handleSelect(tableName: string, text: string, values?: any[]): QueryResult<any> {
    const data = this.tables.get(tableName) || []

    // Handle WHERE id = $1
    const whereMatch = text.match(/where\s+id\s*=\s*\$1/i)
    if (whereMatch && values && values[0]) {
      const filtered = data.filter((row) => row.id === values[0])
      return { 
        rows: filtered, 
        rowCount: filtered.length,
        command: 'SELECT',
        oid: 0,
        fields: []
      }
    }

    // Handle ORDER BY
    const orderMatch = text.match(/order by\s+(\w+)(\s+(asc|desc))?/i)
    if (orderMatch) {
      const [, field, direction] = orderMatch
      const sorted = [...data].sort((a, b) => {
        const aVal = a[field]
        const bVal = b[field]

        // Handle Date objects
        if (aVal instanceof Date && bVal instanceof Date) {
          return direction?.toLowerCase() === 'desc'
            ? bVal.getTime() - aVal.getTime()
            : aVal.getTime() - bVal.getTime()
        }

        // Handle primitives
        return direction?.toLowerCase() === 'desc'
          ? (bVal > aVal ? 1 : -1)
          : (aVal > bVal ? 1 : -1)
      })
      return { 
        rows: sorted, 
        rowCount: sorted.length,
        command: 'SELECT',
        oid: 0,
        fields: []
      }
    }

    return { 
      rows: data, 
      rowCount: data.length,
      command: 'SELECT',
      oid: 0,
      fields: []
    }
  }

  /**
   * Handle INSERT queries
   */
  private handleInsert(tableName: string, text: string, values?: any[]): QueryResult<any> {
    const table = this.tables.get(tableName) || []
    const newRow: any = {}

    // Extract fields from INSERT statement
    const fieldMatch = text.match(/insert into \w+\s*\(([^)]+)\)/i)
    if (fieldMatch) {
      const fields = fieldMatch[1].split(',').map((f) => f.trim())
      values?.forEach((val, index) => {
        newRow[fields[index]] = val
      })
    }

    // Insert row
    table.push(newRow)
    this.tables.set(tableName, table)

    return { 
      rows: [newRow], 
      rowCount: 1,
      command: 'INSERT',
      oid: 0,
      fields: []
    }
  }

  /**
   * Handle UPDATE queries
   */
  private handleUpdate(tableName: string, text: string, values?: any[]): QueryResult<any> {
    const table = this.tables.get(tableName) || []
    let updatedCount = 0

    // Extract WHERE clause
    const whereMatch = text.match(/where\s+id\s*=\s*\$1/i)
    if (whereMatch && values && values[0]) {
      const index = table.findIndex((row) => row.id === values[0])
      if (index !== -1) {
        // Update fields (simplified - doesn't handle all COALESCE cases)
        if (values.length > 1) {
          table[index] = { ...table[index], ...values[1] }
        }
        updatedCount = 1
      }
    }

    return { 
      rows: table, 
      rowCount: updatedCount,
      command: 'UPDATE',
      oid: 0,
      fields: []
    }
  }

  /**
   * Handle DELETE queries
   */
  private handleDelete(tableName: string, text: string, values?: any[]): QueryResult<any> {
    const table = this.tables.get(tableName) || []

    // Handle WHERE id = $1
    const whereMatch = text.match(/where\s+id\s*=\s*\$1/i)
    if (whereMatch && values && values[0]) {
      const index = table.findIndex((row) => row.id === values[0])
      if (index !== -1) {
        const deleted = table.splice(index, 1)
        this.tables.set(tableName, table)
        return { 
          rows: deleted, 
          rowCount: 1,
          command: 'DELETE',
          oid: 0,
          fields: []
        }
      }
      return { 
        rows: [], 
        rowCount: 0,
        command: 'DELETE',
        oid: 0,
        fields: []
      }
    }

    // DELETE all (without WHERE)
    this.tables.set(tableName, [])
    return { 
      rows: [], 
      rowCount: table.length,
      command: 'DELETE',
      oid: 0,
      fields: []
    }
  }
}

/**
 * Mock client for transaction support (simplified)
 */
export class MockClient {
  private pool: MockPool

  constructor(pool: MockPool) {
    this.pool = pool
  }

  async query(text: string, values?: any[]): Promise<QueryResult> {
    return this.pool.query(text, values)
  }

  release(): void {
    // No-op for mock
  }
}

// ==========================================
// TEST DATA FACTORIES
// ==========================================

/**
 * Create test user data
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: overrides.id || uuidv4(),
    email: overrides.email || `user-${uuidv4()}@example.com`,
    password_hash:
      overrides.password_hash || '$2b$12$hashed_password_here',
    created_at: overrides.created_at || new Date(),
  }
}

/**
 * Create test board data
 */
export function createTestBoard(overrides: Partial<TestBoard> = {}): TestBoard {
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || 'Test Board',
    user_id: overrides.user_id || uuidv4(),
    created_at: overrides.created_at || new Date(),
    updated_at: overrides.updated_at || new Date(),
  }
}

/**
 * Create test column data
 */
export function createTestColumn(overrides: Partial<TestColumn> = {}): TestColumn {
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || 'Test Column',
    board_id: overrides.board_id || uuidv4(),
    position: overrides.position ?? 0,
    created_at: overrides.created_at || new Date(),
    updated_at: overrides.updated_at || new Date(),
  }
}

/**
 * Create test card data
 */
export function createTestCard(overrides: Partial<TestCard> = {}): TestCard {
  return {
    id: overrides.id || uuidv4(),
    column_id: overrides.column_id || uuidv4(),
    title: overrides.title || 'Test Card',
    description: overrides.description || null,
    position: overrides.position ?? 0,
    metadata: overrides.metadata || {},
    created_at: overrides.created_at || new Date(),
    updated_at: overrides.updated_at || new Date(),
  }
}

/**
 * Create multiple test columns
 */
export function createTestColumns(count: number, boardId: string): TestColumn[] {
  return Array.from({ length: count }, (_, index) =>
    createTestColumn({
      name: `Column ${index}`,
      board_id: boardId,
      position: index,
    })
  )
}

/**
 * Create multiple test cards
 */
export function createTestCards(count: number, columnId: string): TestCard[] {
  return Array.from({ length: count }, (_, index) =>
    createTestCard({
      title: `Card ${index}`,
      column_id: columnId,
      position: index,
    })
  )
}

// ==========================================
// ASSERTION HELPERS
// ==========================================

/**
 * Compare objects ignoring timestamp fields (created_at, updated_at)
 */
export function assertMatch(
  actual: any,
  expected: any,
  message?: string
): void {
  const normalize = (obj: any) => {
    const { created_at, updated_at, ...rest } = obj
    return rest
  }

  const normalizedActual = Array.isArray(actual)
    ? actual.map(normalize)
    : normalize(actual)
  const normalizedExpected = Array.isArray(expected)
    ? expected.map(normalize)
    : normalize(expected)

  expect(normalizedActual).toEqual(normalizedExpected)
}

/**
 * Verify array sorting, supports both primitives and Date objects
 */
export function assertSortedBy(
  array: any[],
  field: string,
  order: 'asc' | 'desc' = 'asc'
): void {
  for (let i = 0; i < array.length - 1; i++) {
    const a = array[i][field]
    const b = array[i + 1][field]

    // Handle Date objects
    if (a instanceof Date && b instanceof Date) {
      if (order === 'asc') {
        expect(a.getTime()).toBeLessThanOrEqual(b.getTime())
      } else {
        expect(a.getTime()).toBeGreaterThanOrEqual(b.getTime())
      }
    }
    // Handle Date strings (ISO format)
    else if (typeof a === 'string' && typeof b === 'string') {
      const aTime = new Date(a).getTime()
      const bTime = new Date(b).getTime()
      if (order === 'asc') {
        expect(aTime).toBeLessThanOrEqual(bTime)
      } else {
        expect(aTime).toBeGreaterThanOrEqual(bTime)
      }
    }
    // Handle primitives
    else {
      if (order === 'asc') {
        expect(a).toBeLessThanOrEqual(b)
      } else {
        expect(a).toBeGreaterThanOrEqual(b)
      }
    }
  }
}
