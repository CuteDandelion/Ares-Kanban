import { z } from 'zod'
import pool from '../db/config'

export const tools = {
  add_card: {
    name: 'add_card',
    description: 'Add a new card to a column',
    inputSchema: z.object({
      columnId: z.string().describe('Column ID to add card to'),
      title: z.string().describe('Card title'),
      description: z.string().optional().describe('Card description'),
      metadata: z.record(z.any()).optional().describe('Additional metadata'),
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

        const result = await client.query(
          `INSERT INTO cards (column_id, title, description, position, metadata)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            params.columnId,
            params.title,
            params.description || '',
            position,
            JSON.stringify(params.metadata || {}),
          ]
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
      metadata: z.record(z.any()).optional().describe('New metadata'),
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

  get_board_state: {
    name: 'get_board_state',
    description: 'Get the current state of the kanban board',
    inputSchema: z.object({
      boardId: z.string().optional().describe('Board ID (optional)'),
    }),
    handler: async (params: any) => {
      const client = await pool.connect()
      try {
        // Get columns
        const columns = await client.query(`
          SELECT c.*,
            json_agg(
              json_build_object(
                'id', card.id,
                'title', card.title,
                'description', card.description,
                'position', card.position,
                'metadata', card.metadata
              ) ORDER BY card.position
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
