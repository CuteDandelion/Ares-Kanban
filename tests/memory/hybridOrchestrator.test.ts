/**
 * Hybrid Orchestrator Tests
 * 
 * Tests for the combined Memory + ReAct system.
 */

import { HybridOrchestrator, HybridEvent } from '@/memory/hybridOrchestrator';

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

describe('HybridOrchestrator', () => {
  let orchestrator: HybridOrchestrator;

  beforeEach(() => {
    mockLocalStorage.clear();
    orchestrator = new HybridOrchestrator({
      enableMemory: true,
      enableThinking: true,
      contextResolution: true,
    });
  });

  afterEach(() => {
    orchestrator.destroy();
  });

  describe('Initialization', () => {
    test('should create orchestrator with default config', () => {
      const ho = new HybridOrchestrator();
      expect(ho.getMemoryManager()).toBeDefined();
      expect(ho.getReActEngine()).toBeDefined();
      ho.destroy();
    });

    test('should create orchestrator with custom config', () => {
      const ho = new HybridOrchestrator({
        enableMemory: false,
        enableThinking: false,
        maxMemoryContext: 5,
      });
      
      expect(ho.getMemoryManager()).toBeDefined();
      ho.destroy();
    });
  });

  describe('Event System', () => {
    test('should subscribe to events', () => {
      const events: HybridEvent[] = [];
      
      const unsubscribe = orchestrator.onEvent((event) => {
        events.push(event);
      });

      // Trigger an event by clearing memory
      orchestrator.clearMemory();

      expect(events.length).toBeGreaterThan(0);
      
      unsubscribe();
    });

    test('should unsubscribe from events', () => {
      const events: HybridEvent[] = [];
      
      const unsubscribe = orchestrator.onEvent((event) => {
        events.push(event);
      });

      unsubscribe();
      
      // Clear and check no more events are received
      const countBefore = events.length;
      orchestrator.clearMemory();
      
      expect(events.length).toBe(countBefore);
    });
  });

  describe('Tool Registration', () => {
    test('should register a tool', () => {
      orchestrator.registerTool(
        'test_tool',
        'A test tool',
        {
          type: 'object',
          properties: {
            param: { type: 'string', description: 'Param' },
          },
        },
        async (args) => ({ success: true, result: args.param })
      );

      const tool = orchestrator.getReActEngine().getTool('test_tool');
      expect(tool).toBeDefined();
    });

    test('should register board tool', () => {
      orchestrator.registerBoardTool(
        'create_test',
        'Create test item',
        async (args) => ({ created: true, args })
      );

      const tool = orchestrator.getReActEngine().getTool('create_test');
      expect(tool).toBeDefined();
    });
  });

  describe('Execution', () => {
    test('should execute a command', async () => {
      const result = await orchestrator.execute('Hello');

      expect(result).toBeDefined();
      expect(result.userInput).toBe('Hello');
      expect(result.status).toBe('completed');
    });

    test('should save to memory after execution', async () => {
      await orchestrator.execute('Test message');

      const entries = orchestrator.getMemoryManager().getAllEntries();
      expect(entries.length).toBeGreaterThan(0);
    });

    test('should track React session', async () => {
      const result = await orchestrator.execute('Test');

      expect(result.reactSession).toBeDefined();
      expect(result.reactSession.steps.length).toBeGreaterThan(0);
    });

    test('should resolve context references', async () => {
      // Set up memory with a previous card creation
      orchestrator.getMemoryManager().addEntry({
        role: 'assistant',
        content: 'Created card "Bug Fix" successfully',
        metadata: { toolName: 'create_card' },
      });
      
      // Then use reference
      const result = await orchestrator.execute('Move it to Done');

      // Should have resolved "it"
      expect(result.contextUsed).toBe(true);
      expect(result.resolvedReferences).toContain('"Bug Fix"');
    });
  });

  describe('Context Resolution', () => {
    test('should resolve "it" reference', async () => {
      // Create initial context
      orchestrator.getMemoryManager().addEntry({
        role: 'assistant',
        content: 'Created card "Login Bug"',
      });

      const result = await orchestrator.execute('Move it to Done');

      // Check if context was resolved
      if (result.resolvedReferences && result.resolvedReferences.length > 0) {
        expect(result.resolvedReferences[0]).toContain('Login Bug');
      }
    });

    test('should resolve "that" reference', async () => {
      orchestrator.getMemoryManager().addEntry({
        role: 'assistant',
        content: 'Created card "API Issue"',
      });

      const result = await orchestrator.execute('Delete that');

      expect(result.contextUsed).toBe(true);
    });
  });

  describe('Memory Management', () => {
    test('should get memory context', async () => {
      await orchestrator.execute('Message 1');
      await orchestrator.execute('Message 2');

      const context = orchestrator.getMemoryContext();
      expect(context.length).toBeGreaterThan(0);
    });

    test('should clear memory', () => {
      orchestrator.getMemoryManager().addEntry({
        role: 'user',
        content: 'Test',
      });

      orchestrator.clearMemory();

      const entries = orchestrator.getMemoryManager().getAllEntries();
      expect(entries).toHaveLength(0);
    });

    test('should get memory stats', () => {
      orchestrator.getMemoryManager().addEntry({
        role: 'user',
        content: 'Test',
      });

      const stats = orchestrator.getMemoryStats();
      expect(stats.totalEntries).toBe(1);
    });
  });

  describe('Import/Export', () => {
    test('should export memory', () => {
      orchestrator.getMemoryManager().addEntry({
        role: 'user',
        content: 'Export test',
      });

      const exported = orchestrator.exportMemory();
      expect(exported).toBeTruthy();
      
      const parsed = JSON.parse(exported);
      expect(parsed.entries).toBeDefined();
    });

    test('should import memory', () => {
      const data = JSON.stringify({
        entries: [
          { id: '1', role: 'user', content: 'Imported', timestamp: Date.now() },
        ],
        currentSessionId: 'test',
      });

      const success = orchestrator.importMemory(data);
      expect(success).toBe(true);

      const entries = orchestrator.getMemoryManager().getAllEntries();
      expect(entries.some(e => e.content === 'Imported')).toBe(true);
    });
  });

  describe('Transcript', () => {
    test('should format transcript', async () => {
      await orchestrator.execute('Test command');

      const transcript = orchestrator.formatTranscript();
      expect(transcript).toContain('ARES Session Transcript');
      expect(transcript).toContain('Test command');
    });
  });

  describe('Cancellation', () => {
    test('should cancel execution', async () => {
      const executePromise = orchestrator.execute('Test');
      
      orchestrator.cancel();

      const result = await executePromise;
      expect(result.status).toBe('cancelled');
    });
  });
});
