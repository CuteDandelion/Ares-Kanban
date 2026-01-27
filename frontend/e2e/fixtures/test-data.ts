/**
 * Test Data Fixtures
 *
 * Provides consistent test data for E2E tests.
 */

export const TEST_COLUMNS = [
  { name: 'Backlog', position: 0 },
  { name: 'To Do', position: 1 },
  { name: 'In Progress', position: 2 },
  { name: 'Done', position: 3 },
] as const

export const TEST_CARDS = {
  lowPriority: {
    title: 'Low Priority Task',
    description: 'This is a low priority task that can be done later',
    metadata: { priority: 'low' },
  },
  mediumPriority: {
    title: 'Medium Priority Task',
    description: 'This is a medium priority task that should be completed soon',
    metadata: { priority: 'medium' },
  },
  highPriority: {
    title: 'High Priority Task',
    description: 'This is a high priority task that needs immediate attention',
    metadata: { priority: 'high' },
  },
  complex: {
    title: 'Complex Task with Multiple Assignees',
    description: 'This task involves multiple team members and requires coordination',
    metadata: {
      priority: 'high',
      assignee: 'John Doe',
      dueDate: '2026-02-01',
      tags: ['urgent', 'backend', 'critical'],
    },
  },
  withMetadata: {
    title: 'Task with Rich Metadata',
    description: 'This task includes various metadata fields',
    metadata: {
      priority: 'medium',
      assignee: 'Jane Smith',
      dueDate: '2026-02-15',
      tags: ['feature', 'frontend', 'ui'],
      estimatedHours: 8,
      actualHours: 6,
    },
  },
} as const

export const TEST_DATA = {
  columns: TEST_COLUMNS,
  cards: TEST_CARDS,

  // Card creation data for different scenarios
  cardCreation: {
    minimal: {
      title: 'Minimal Card',
      description: '',
      metadata: {},
    },
    full: {
      title: 'Full Card',
      description: 'This is a full card with all fields populated',
      metadata: {
        priority: 'medium',
        assignee: 'Test User',
        tags: ['test'],
      },
    },
    longTitle: {
      title: 'This is a very long title that might cause layout issues if not handled properly',
      description: 'Description',
      metadata: {},
    },
    longDescription: {
      title: 'Card with Long Description',
      description: 'This is a very long description that should wrap properly and not overflow the container. It contains multiple sentences to test text wrapping and layout behavior.',
      metadata: {},
    },
    specialChars: {
      title: 'Card with <script>alert("XSS")</script>',
      description: 'Description with quotes "double" and \'single\' and &ampersands',
      metadata: {},
    },
  },

  // Column creation data for different scenarios
  columnCreation: {
    simple: 'Simple Column',
    longName: 'This is a very long column name that might overflow the header',
    specialChars: 'Column with < & > " \'',
    withSpaces: '  Column with Extra Spaces  ',
  },

  // Viewport configurations for responsive testing
  viewports: {
    desktop: { width: 1920, height: 1080, name: 'Desktop' },
    laptop: { width: 1366, height: 768, name: 'Laptop' },
    tablet: { width: 768, height: 1024, name: 'Tablet' },
    mobile: { width: 375, height: 667, name: 'Mobile' },
    mobileLarge: { width: 414, height: 896, name: 'Mobile Large' },
  },

  // Browser configurations
  browsers: {
    chromium: 'chromium',
    firefox: 'firefox',
    webkit: 'webkit',
  } as const,
} as const

// Type exports
export type TestColumn = typeof TEST_COLUMNS[number]
export type TestCardKey = keyof typeof TEST_CARDS
export type ViewportKey = keyof typeof TEST_DATA.viewports
export type BrowserKey = keyof typeof TEST_DATA.browsers
