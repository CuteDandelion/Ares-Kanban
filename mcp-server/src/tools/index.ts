import { z } from 'zod'
import pool from '../db/config'
import { v4 as uuidv4 } from 'uuid'

export const tools = {
  // ==================== CARD TOOLS ====================

  add_card: {
    name: 'add_card',
    description: 'Add a new card to a column. Default priority is "low" if not specified in metadata.',
    inputSchema: z.object({
      columnId: z.string().describe('Column ID to add card to'),
      title: z.string().describe('Card title'),
      description: z.string().optional().describe('Card description'),
      metadata: z.record(z.any()).optional().describe('Additional metadata including priority (high/medium/low)'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        // Get max position in column
        const posResult = await client.query(
          'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM cards WHERE column_id = $1',
          [params.columnId]
        )
        const position = posResult.rows[0].next_pos

        // Default metadata with low priority
        const metadata = {
          priority: 'low',
          ...(params.metadata || {})
        }

        const result = await client.query(
          `INSERT INTO cards (id, column_id, title, description, position, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [uuidv4(), params.columnId, params.title, params.description || '', position, JSON.stringify(metadata)]
        )

        return {
          success: true,
          card: result.rows[0],
        }
      } finally {
        client.release()
      }
    },
  },

  update_card: {
    name: 'update_card',
    description: 'Update an existing card',
    inputSchema: z.object({
      cardId: z.string().describe('Card ID to update'),
      title: z.string().optional().describe('New card title'),
      description: z.string().optional().describe('New card description'),
      metadata: z.record(z.any()).optional().describe('New metadata including priority (high/medium/low)'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        const updates: any = {}
        if (params.title) updates.title = params.title
        if (params.description !== undefined) updates.description = params.description
        if (params.metadata) updates.metadata = JSON.stringify(params.metadata)
        updates.updated_at = 'NOW()'

        const setClause = Object.keys(updates)
          .map((key, i) => `${key} = $${i + 2}`)
          .join(', ')

        const result = await client.query(
          `UPDATE cards SET ${setClause} WHERE id = $1 RETURNING *`,
          [params.cardId, ...Object.values(updates)]
        )

        return {
          success: true,
          card: result.rows[0],
        }
      } finally {
        client.release()
      }
    },
  },

  move_card: {
    name: 'move_card',
    description: 'Move a card to another column',
    inputSchema: z.object({
      cardId: z.string().describe('Card ID to move'),
      toColumnId: z.string().describe('Destination column ID'),
      position: z.number().optional().describe('New position in column'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        let position = params.position

        if (position === undefined) {
          const posResult = await client.query(
            'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM cards WHERE column_id = $1',
            [params.toColumnId]
          )
          position = posResult.rows[0].next_pos
        }

        const result = await client.query(
          `UPDATE cards SET column_id = $1, position = $2, updated_at = NOW()
           WHERE id = $3
           RETURNING *`,
          [params.toColumnId, position, params.cardId]
        )

        return {
          success: true,
          card: result.rows[0],
        }
      } finally {
        client.release()
      }
    },
  },

  delete_card: {
    name: 'delete_card',
    description: 'Delete a card',
    inputSchema: z.object({
      cardId: z.string().describe('Card ID to delete'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        await client.query('DELETE FROM cards WHERE id = $1', [params.cardId])

        return {
          success: true,
          cardId: params.cardId,
        }
      } finally {
        client.release()
      }
    },
  },

  get_card: {
    name: 'get_card',
    description: 'Get details of a specific card',
    inputSchema: z.object({
      cardId: z.string().describe('Card ID to retrieve'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        const result = await client.query(
          'SELECT * FROM cards WHERE id = $1',
          [params.cardId]
        )

        if (result.rows.length === 0) {
          return {
            success: false,
            error: 'Card not found',
          }
        }

        return {
          success: true,
          card: result.rows[0],
        }
      } finally {
        client.release()
      }
    },
  },

  // ==================== COLUMN TOOLS ====================

  create_column: {
    name: 'create_column',
    description: 'Create a new column on the board',
    inputSchema: z.object({
      name: z.string().describe('Column name'),
      boardId: z.string().optional().describe('Board ID (uses default if not provided)'),
      position: z.number().optional().describe('Column position'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        const id = uuidv4()
        const boardId = params.boardId || '67f60311-ebe8-4763-ab7e-aecc5e37e20e'

        // Get max position if not provided
        let position = params.position
        if (position === undefined) {
          const posResult = await client.query(
            'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM columns WHERE board_id = $1',
            [boardId]
          )
          position = posResult.rows[0].next_pos
        }

        const result = await client.query(
          `INSERT INTO columns (id, name, board_id, position)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [id, params.name, boardId, position]
        )

        return {
          success: true,
          column: result.rows[0],
        }
      } finally {
        client.release()
      }
    },
  },

  update_column: {
    name: 'update_column',
    description: 'Update an existing column (name, position)',
    inputSchema: z.object({
      columnId: z.string().describe('Column ID to update'),
      name: z.string().optional().describe('New column name'),
      position: z.number().optional().describe('New column position'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        const updates: any = {}
        if (params.name) updates.name = params.name
        if (params.position !== undefined) updates.position = params.position
        updates.updated_at = 'NOW()'

        const setClause = Object.keys(updates)
          .map((key, i) => `${key} = $${i + 2}`)
          .join(', ')

        const result = await client.query(
          `UPDATE columns SET ${setClause} WHERE id = $1 RETURNING *`,
          [params.columnId, ...Object.values(updates)]
        )

        if (result.rows.length === 0) {
          return {
            success: false,
            error: 'Column not found',
          }
        }

        return {
          success: true,
          column: result.rows[0],
        }
      } finally {
        client.release()
      }
    },
  },

  delete_column: {
    name: 'delete_column',
    description: 'Delete a column and all its cards',
    inputSchema: z.object({
      columnId: z.string().describe('Column ID to delete'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // First, delete all cards in this column
        const cardResult = await client.query(
          'DELETE FROM cards WHERE column_id = $1 RETURNING *',
          [params.columnId]
        )

        // Then delete the column
        const columnResult = await client.query(
          'DELETE FROM columns WHERE id = $1 RETURNING *',
          [params.columnId]
        )

        await client.query('COMMIT')

        if (columnResult.rows.length === 0) {
          return {
            success: false,
            error: 'Column not found',
          }
        }

        return {
          success: true,
          columnId: params.columnId,
          cardsDeleted: cardResult.rowCount,
        }
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    },
  },

  list_columns: {
    name: 'list_columns',
    description: 'List all columns on the board',
    inputSchema: z.object({
      boardId: z.string().optional().describe('Board ID (optional)'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        let query = 'SELECT * FROM columns'
        const queryParams: any[] = []

        if (params.boardId) {
          query += ' WHERE board_id = $1'
          queryParams.push(params.boardId)
        }

        query += ' ORDER BY position'

        const result = await client.query(query, queryParams)

        return {
          success: true,
          columns: result.rows,
        }
      } finally {
        client.release()
      }
    },
  },

  reorder_columns: {
    name: 'reorder_columns',
    description: 'Reorder columns on the board',
    inputSchema: z.object({
      columns: z.array(z.object({
        id: z.string().describe('Column ID'),
        position: z.number().describe('New position'),
      })).describe('Array of columns with their new positions'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        for (const column of params.columns) {
          await client.query(
            'UPDATE columns SET position = $1 WHERE id = $2',
            [column.position, column.id]
          )
        }

        await client.query('COMMIT')

        return {
          success: true,
          message: 'Columns reordered successfully',
        }
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    },
  },

  // ==================== BOARD TOOLS ====================

  get_board_state: {
    name: 'get_board_state',
    description: 'Get current state of kanban board with columns and cards sorted by creation date',
    inputSchema: z.object({
      boardId: z.string().optional().describe('Board ID (optional)'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        // Get columns with their cards sorted by created_at DESC
        const columns = await client.query(`
          SELECT c.*,
            json_agg(
              json_build_object(
                'id', card.id,
                'title', card.title,
                'description', card.description,
                'position', card.position,
                'metadata', card.metadata,
                'created_at', card.created_at,
                'updated_at', card.updated_at
              ) ORDER BY card.created_at DESC
            ) as cards
          FROM columns c
          LEFT JOIN cards card ON card.column_id = c.id
          ${params.boardId ? 'WHERE c.board_id = $1' : ''}
          GROUP BY c.id
          ORDER BY c.position
        `, params.boardId ? [params.boardId] : [])

        return {
          success: true,
          board: {
            columns: columns.rows,
          },
        }
      } finally {
        client.release()
      }
    },
  },
}

export default tools
