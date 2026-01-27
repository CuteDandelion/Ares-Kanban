import { Pool } from 'pg'

// Check if we're running in test environment
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.TEST_DATABASE_HOST

  // Production/test pool configuration
  const createPool = () => {
    const pool = new Pool({
      host: isTestEnv
        ? process.env.TEST_DATABASE_HOST || 'localhost'
        : process.env.DATABASE_HOST || 'postgres',
    port: parseInt(
      isTestEnv
        ? process.env.TEST_DATABASE_PORT || '5432'
        : process.env.DATABASE_PORT || '5432'
    ),
    database: isTestEnv
      ? process.env.TEST_DATABASE_NAME || 'kanban_test'
      : process.env.DATABASE_NAME || 'kanban',
    user: isTestEnv
      ? process.env.TEST_DATABASE_USER || 'kanban'
      : process.env.DATABASE_USER || 'kanban',
    password: isTestEnv
      ? process.env.TEST_DATABASE_PASSWORD || 'kanban_password'
      : process.env.DATABASE_PASSWORD || 'kanban',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
  return pool
}

// Create a pool
let pool: Pool | null = null

// Function to get or create pool
export const getPool = () => {
  console.log('getPool called - isTestEnv:', isTestEnv)
  console.log('getPool called - global.testPool exists:', !!(global as any).testPool)
  console.log('getPool called - global.testPool object:', (global as any).testPool?.constructor?.name)

  // In test mode, use global testPool if available
  if (isTestEnv) {
    const testPool = (global as any).testPool
    console.log('getPool - returning testPool:', !!testPool, testPool?.constructor?.name)
    return testPool as Pool
  }

  // In production, create or return existing pool
  if (!pool) {
    pool = createPool()
  }
  console.log('getPool - returning production pool')
  return pool
}

// Export the pool getter
export default getPool()
