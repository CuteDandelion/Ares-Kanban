import fs from 'fs'
import path from 'path'
import pool from './config'

async function migrate() {
  const client = await pool.connect()

  try {
    console.log('Running database migrations...')

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Execute schema
    await client.query(schema)

    console.log('Migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(console.error)
