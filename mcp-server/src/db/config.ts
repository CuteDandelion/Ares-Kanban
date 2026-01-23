import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'postgres-service',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'kanban',
  user: process.env.DATABASE_USER || 'kanban',
  password: process.env.DATABASE_PASSWORD || 'kanban',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export default pool
