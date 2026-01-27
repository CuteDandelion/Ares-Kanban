// Load test environment variables before Jest runs
require('dotenv').config({ path: '.env.test' })

// Set NODE_ENV explicitly
process.env.NODE_ENV = 'test'

// Log test environment
console.log('Test environment loaded:')
console.log('  NODE_ENV:', process.env.NODE_ENV)
console.log('  TEST_DATABASE_HOST:', process.env.TEST_DATABASE_HOST)
console.log('  TEST_DATABASE_NAME:', process.env.TEST_DATABASE_NAME)
