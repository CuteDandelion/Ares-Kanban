import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getPool } from '../db/config'

const router = Router()

// Helper function to handle database errors
const handleDbError = (error: any, res: any) => {
  console.error('Database error:', error)
  res.status(500).json({ error: 'Database operation failed' })
}

// ==================== COLUMNS ====================

// Get all columns
router.get('/columns', async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM columns ORDER BY position'
    )
    res.json(result.rows)
  } catch (error) {
    handleDbError(error, res)
  }
})

// Get a single column
router.get('/columns/:id', async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    const result = await pool.query('SELECT * FROM columns WHERE id = $1', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Column not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    handleDbError(error, res)
  }
})

// Create a new column
router.post('/columns', async (req, res) => {
  try {
    const pool = getPool()
    const { name, board_id, position } = req.body
    const id = uuidv4()

    console.log('POST /columns - body:', { name, board_id, position })

    // If board_id not provided, use first available board
    let finalBoardId = board_id
    if (!finalBoardId) {
      const boardResult = await pool.query('SELECT id FROM boards ORDER BY created_at LIMIT 1')
      if (boardResult.rows.length === 0) {
        return res.status(400).json({ error: 'No board available. Please specify a board_id.' })
      }
      finalBoardId = boardResult.rows[0].id
      console.log('POST /columns - using default board_id:', finalBoardId)
    }

    const result = await pool.query(
      'INSERT INTO columns (id, name, board_id, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name, finalBoardId, position]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    handleDbError(error, res)
  }
})

// Reorder columns (must be defined before /columns/:id)
router.put('/columns/reorder', async (req, res) => {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const { columns: columnsList } = req.body // Array of { id, position }

    await client.query('BEGIN')

    for (const column of columnsList) {
      await client.query(
        'UPDATE columns SET position = $1 WHERE id = $2',
        [column.position, column.id]
      )
    }

    await client.query('COMMIT')

    res.json({ message: 'Columns reordered successfully' })
  } catch (error) {
    await client.query('ROLLBACK')
    client.release()
    handleDbError(error, res)
  } finally {
    client.release()
  }
})

// Update a column
router.put('/columns/:id', async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    const { name, position } = req.body

    const result = await pool.query(
      'UPDATE columns SET name = COALESCE($1, name), position = COALESCE($2, position), updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, position, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Column not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    handleDbError(error, res)
  }
})

// Delete a column
router.delete('/columns/:id', async (req, res) => {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const { id } = req.params

    // First, delete all cards in this column
    await client.query('DELETE FROM cards WHERE column_id = $1', [id])

    // Then delete column
    const result = await client.query('DELETE FROM columns WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Column not found' })
    }

    res.json({ message: 'Column deleted successfully' })
  } catch (error) {
    handleDbError(error, res)
  } finally {
    client.release()
  }
})

// ==================== CARDS ====================

// Get all cards
router.get('/cards', async (req, res) => {
  try {
    const pool = getPool()
    const { column_id } = req.query

    let query = 'SELECT * FROM cards'
    const params: any[] = []

    // Sort by created_at descending (latest first), then by position
    if (column_id) {
      query += ' WHERE column_id = $1 ORDER BY created_at DESC, position'
      params.push(column_id)
      console.log('GET /cards - Filtering by column_id:', column_id)
    } else {
      query += ' ORDER BY created_at DESC, position'
      console.log('GET /cards - Getting all cards')
    }

    const result = await pool.query(query, params)
    console.log('GET /cards - Query:', query)
    console.log('GET /cards - Params:', params)
    console.log('GET /cards - Found', result.rows.length, 'cards')
    res.json(result.rows)
  } catch (error) {
    handleDbError(error, res)
  }
})

// Get a single card
router.get('/cards/:id', async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    const result = await pool.query('SELECT * FROM cards WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    handleDbError(error, res)
  }
})

// Create a new card
router.post('/cards', async (req, res) => {
  try {
    const pool = getPool()
    const { column_id, title, description, position, metadata } = req.body
    const id = uuidv4()

    const result = await pool.query(
      'INSERT INTO cards (id, column_id, title, description, position, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, column_id, title, description, position, metadata || {}]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    handleDbError(error, res)
  }
})

// Update a card
router.put('/cards/:id', async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    const { title, description, column_id, position, metadata } = req.body

    const result = await pool.query(
      'UPDATE cards SET title = COALESCE($1, title), description = COALESCE($2, description), column_id = COALESCE($3, column_id), position = COALESCE($4, position), metadata = COALESCE($5, metadata), updated_at = NOW() WHERE id = $6 RETURNING *',
      [title, description, column_id, position, metadata, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    handleDbError(error, res)
  }
})

// Delete a card
router.delete('/cards/:id', async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    const result = await pool.query('DELETE FROM cards WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' })
    }

    res.json({ message: 'Card deleted successfully' })
  } catch (error) {
    handleDbError(error, res)
  }
})

// Move card to another column
router.patch('/cards/:id/move', async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    const { column_id, position } = req.body

    const result = await pool.query(
      'UPDATE cards SET column_id = $1, position = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [column_id, position, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    handleDbError(error, res)
  }
})

export default router
