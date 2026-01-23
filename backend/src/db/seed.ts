import pool from './config'
import bcrypt from 'bcrypt'

async function seed() {
  const client = await pool.connect()

  try {
    console.log('Seeding database...')

    // Create default user
    const passwordHash = await bcrypt.hash('password123', 10)
    const userResult = await client.query(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['user@example.com', 'Demo User', passwordHash]
    )

    const userId = userResult.rows[0]?.id

    if (userId) {
      // Create default board
      const boardResult = await client.query(
        `INSERT INTO boards (user_id, name)
         VALUES ($1, $2)
         RETURNING id`,
        [userId, 'My Kanban Board']
      )

      const boardId = boardResult.rows[0].id

      // Create default columns
      const columns = ['Backlog', 'To Do', 'In Progress', 'Done']
      for (let i = 0; i < columns.length; i++) {
        await client.query(
          `INSERT INTO columns (board_id, name, position)
           VALUES ($1, $2, $3)`,
          [boardId, columns[i], i]
        )
      }

      console.log('Seed data created successfully!')
      console.log('Default user: user@example.com / password123')
    }
  } catch (error) {
    console.error('Seeding failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch(console.error)
