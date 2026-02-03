/**
 * Memory Manager Tests
 * 
 * Tests for the Contextual Memory system with localStorage persistence.
 */

import { MemoryManager, MemoryEntry, MemoryConfig } from '@/memory/memoryManager';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem(key: string): string | null {
    return this.store[key] || null;
  },
  setItem(key: string, value: string): void {
    this.store[key] = value;
  },
  removeItem(key: string): void {
    delete this.store[key];
  },
  clear(): void {
    this.store = {};
  },
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    mockLocalStorage.clear();
    memoryManager = new MemoryManager({
      persistToStorage: true,
      storageKey: 'test_memory',
      maxEntries: 10,
    });
  });

  afterEach(() => {
    memoryManager.destroy();
  });

  describe('Basic Operations', () => {
    test('should create a memory manager with default config', () => {
      const mm = new MemoryManager();
      expect(mm.getSessionId()).toBeDefined();
      mm.destroy();
    });

    test('should add an entry', () => {
      const entry = memoryManager.addEntry({
        role: 'user',
        content: 'Hello',
      });

      expect(entry.id).toBeDefined();
      expect(entry.role).toBe('user');
      expect(entry.content).toBe('Hello');
      expect(entry.timestamp).toBeGreaterThan(0);
    });

    test('should get all entries', () => {
      memoryManager.addEntry({ role: 'user', content: 'Message 1' });
      memoryManager.addEntry({ role: 'assistant', content: 'Message 2' });

      const entries = memoryManager.getAllEntries();
      expect(entries).toHaveLength(2);
    });

    test('should get context window', () => {
      // Add 15 entries
      for (let i = 0; i < 15; i++) {
        memoryManager.addEntry({
          role: 'user',
          content: `Message ${i}`,
        });
      }

      // Default context window size is 10, but we set it to 10 in config
      const context = memoryManager.getContextWindow(5);
      expect(context).toHaveLength(5);
      expect(context[0].content).toBe('Message 10');
      expect(context[4].content).toBe('Message 14');
    });
  });

  describe('Persistence', () => {
    test('should save to localStorage', (done) => {
      memoryManager.addEntry({
        role: 'user',
        content: 'Test message',
      });

      // Wait for debounced save
      setTimeout(() => {
        const data = mockLocalStorage.getItem('test_memory');
        expect(data).toBeTruthy();
        
        const parsed = JSON.parse(data!);
        expect(parsed.entries).toHaveLength(1);
        expect(parsed.entries[0].content).toBe('Test message');
        done();
      }, 600);
    });

    test('should load from localStorage', () => {
      // Pre-populate localStorage
      mockLocalStorage.setItem('test_memory', JSON.stringify({
        entries: [
          { id: '1', role: 'user', content: 'Loaded message', timestamp: Date.now() },
        ],
        currentSessionId: 'test-session',
      }));

      const mm = new MemoryManager({
        persistToStorage: true,
        storageKey: 'test_memory',
      });

      const entries = mm.getAllEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].content).toBe('Loaded message');

      mm.destroy();
    });
  });

  describe('Memory Limits', () => {
    test('should enforce max entries limit', () => {
      // Add more entries than the limit
      for (let i = 0; i < 15; i++) {
        memoryManager.addEntry({
          role: 'user',
          content: `Message ${i}`,
        });
      }

      const entries = memoryManager.getAllEntries();
      expect(entries).toHaveLength(10); // maxEntries was set to 10
      expect(entries[0].content).toBe('Message 5'); // Oldest 5 removed
    });

    test('should enforce max age limit', () => {
      const mm = new MemoryManager({
        persistToStorage: false,
        maxAge: 1000, // 1 second
      });

      // Add old entry
      mm['entries'].push({
        id: 'old',
        role: 'user',
        content: 'Old message',
        timestamp: Date.now() - 2000, // 2 seconds ago
      });

      // Add new entry to trigger enforcement
      mm.addEntry({ role: 'user', content: 'New message' });

      const entries = mm.getAllEntries();
      expect(entries.some(e => e.content === 'Old message')).toBe(false);

      mm.destroy();
    });
  });

  describe('Query and Search', () => {
    beforeEach(() => {
      memoryManager.addEntry({ role: 'user', content: 'Create card Bug fix' });
      memoryManager.addEntry({ role: 'assistant', content: 'Created card "Bug fix"' });
      memoryManager.addEntry({ role: 'user', content: 'Move it to Done' });
    });

    test('should search by term', () => {
      const results = memoryManager.search('card');
      expect(results).toHaveLength(2);
    });

    test('should query by role', () => {
      const results = memoryManager.query({ role: 'user' });
      expect(results).toHaveLength(2);
    });

    test('should get last N entries', () => {
      const results = memoryManager.getLast(2);
      expect(results).toHaveLength(2);
      expect(results[1].content).toBe('Move it to Done');
    });
  });

  describe('Session Management', () => {
    test('should start new session', () => {
      const oldSessionId = memoryManager.getSessionId();
      const newSessionId = memoryManager.startNewSession();

      expect(newSessionId).not.toBe(oldSessionId);
      
      const entries = memoryManager.getAllEntries();
      expect(entries[entries.length - 1].role).toBe('system');
    });

    test('should get session entries', () => {
      const sessionId = memoryManager.getSessionId();
      
      memoryManager.addEntry({
        role: 'user',
        content: 'Test',
        metadata: { sessionId },
      });

      const sessionEntries = memoryManager.getSessionEntries();
      expect(sessionEntries).toHaveLength(1);
    });
  });

  describe('Import/Export', () => {
    test('should export memory to JSON', () => {
      memoryManager.addEntry({ role: 'user', content: 'Export test' });
      
      const exported = memoryManager.export();
      const parsed = JSON.parse(exported);
      
      expect(parsed.entries).toHaveLength(1);
      expect(parsed.currentSessionId).toBeDefined();
    });

    test('should import memory from JSON', () => {
      const data = JSON.stringify({
        entries: [
          { id: '1', role: 'user', content: 'Imported', timestamp: Date.now() },
        ],
        currentSessionId: 'imported-session',
      });

      const success = memoryManager.import(data);
      expect(success).toBe(true);
      
      const entries = memoryManager.getAllEntries();
      expect(entries.some(e => e.content === 'Imported')).toBe(true);
    });
  });

  describe('Statistics', () => {
    test('should get memory stats', () => {
      memoryManager.addEntry({ role: 'user', content: 'Message 1' });
      memoryManager.addEntry({ role: 'assistant', content: 'Message 2' });
      memoryManager.addEntry({ role: 'tool', content: 'Result' });

      const stats = memoryManager.getStats();
      
      expect(stats.totalEntries).toBe(3);
      expect(stats.entriesByRole.user).toBe(1);
      expect(stats.entriesByRole.assistant).toBe(1);
      expect(stats.entriesByRole.tool).toBe(1);
      expect(stats.sessionCount).toBe(1);
    });
  });
});
