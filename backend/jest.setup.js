const { Pool } = require('pg')

// Test database configuration
const TEST_DB_NAME = process.env.TEST_DATABASE_NAME || 'kanban_test'

// Connection to default 'postgres' database for creating test database
const setupPool = new Pool({
  host: process.env.TEST_DATABASE_HOST || 'localhost',
  port: parseInt(process.env.TEST_DATABASE_PORT || '5432'),
  database: 'postgres', // Connect to default database to create test database
  user: process.env.TEST_DATABASE_USER || 'kanban',
  password: process.env.TEST_DATABASE_PASSWORD || 'kanban_password',
  max: 10, // Limit connections for testing
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Connection to test database for running tests
const testPool = new Pool({
  host: process.env.TEST_DATABASE_HOST || 'localhost',
  port: parseInt(process.env.TEST_DATABASE_PORT || '5432'),
  database: TEST_DB_NAME,
  user: process.env.TEST_DATABASE_USER || 'kanban',
  password: process.env.TEST_DATABASE_PASSWORD || 'kanban_password',
  max: 10, // Limit connections for testing
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Make pool available globally for tests
global.testPool = testPool

// Setup and teardown for all tests
beforeAll(async () => {
  console.log('Setting up test database...')
  console.log('Test database name:', TEST_DB_NAME)

  // First, connect to default postgres database to create/drop test database
  console.log('Connecting to postgres database to set up test database...')

  // Check if test database exists and drop it if it does
  const dbCheckResult = await setupPool.query(`
    SELECT 1 FROM pg_database WHERE datname = '${TEST_DB_NAME}'
  `)

  const dbExists = dbCheckResult.rows.length > 0

  if (dbExists) {
    console.log('Test database already exists, dropping it...')
    await setupPool.query(`DROP DATABASE ${TEST_DB_NAME};`)
    console.log('✓ Dropped existing test database')
  }

  // Create the test database
  console.log(`Creating test database: ${TEST_DB_NAME}...`)
  await setupPool.query(`CREATE DATABASE ${TEST_DB_NAME};`)
  console.log('✓ Created test database')

  // Close the setup connection
  await setupPool.end()
  console.log('✓ Setup connection closed')

  console.log('Connecting to test database:', process.env.TEST_DATABASE_HOST, TEST_DB_NAME)

  try {
    // Create users table
    await testPool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ Created users table')
  } catch (error) {
    console.error('Error creating users table:', error)
  }

  try {
    // Create boards table
    await testPool.query(`
      CREATE TABLE boards (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ Created boards table')
  } catch (error) {
    console.error('Error creating boards table:', error)
  }

  try {
    // Create columns table
    await testPool.query(`
      CREATE TABLE columns (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        board_id UUID REFERENCES boards(id),
        position INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ Created columns table')
  } catch (error) {
    console.error('Error creating columns table:', error)
  }

  try {
    // Create cards table
    await testPool.query(`
      CREATE TABLE cards (
        id UUID PRIMARY KEY,
        column_id UUID REFERENCES columns(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        position INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ Created cards table')
  } catch (error) {
    console.error('Error creating cards table:', error)
  }

  // Verify tables exist
  const result = await testPool.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `)
  console.log('Tables in database:', result.rows.map(r => r.tablename))

  console.log('Test database setup complete')
})

afterAll(async () => {
  console.log('Closing test database connection...')
  await testPool.end()
  console.log('Test database connection closed')
})
