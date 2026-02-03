/**
 * ReAct Engine Tests
 * 
 * Tests for the Chain of Thought reasoning system.
 */

import { ReActEngine, ReActTool, ReActToolResult } from '@/memory/reactEngine';

describe('ReActEngine', () => {
  let engine: ReActEngine;

  beforeEach(() => {
    engine = new ReActEngine({
      maxSteps: 5,
      maxThinkingTime: 10000,
      showThinking: true,
    });
  });

  describe('Tool Registration', () => {
    test('should register a tool', () => {
      const tool: ReActTool = {
        name: 'test_tool',
        description: 'A test tool',
        parameters: {
          type: 'object',
          properties: {
            param1: { type: 'string', description: 'Parameter 1' },
          },
        },
        execute: async () => ({ success: true, result: 'test' }),
      };

      engine.registerTool(tool);
      
      const retrieved = engine.getTool('test_tool');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test_tool');
    });

    test('should register multiple tools', () => {
      const tools: ReActTool[] = [
        {
          name: 'tool1',
          description: 'Tool 1',
          parameters: { type: 'object', properties: {} },
          execute: async () => ({ success: true }),
        },
        {
          name: 'tool2',
          description: 'Tool 2',
          parameters: { type: 'object', properties: {} },
          execute: async () => ({ success: true }),
        },
      ];

      engine.registerTools(tools);
      
      expect(engine.getAllTools()).toHaveLength(2);
    });
  });

  describe('Execution', () => {
    beforeEach(() => {
      // Register a test tool
      engine.registerTool({
        name: 'echo',
        description: 'Echo the input',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to echo' },
          },
        },
        execute: async (input) => ({
          success: true,
          result: input.message,
        }),
      });
    });

    test('should execute without tools', async () => {
      const session = await engine.execute('Hello');

      expect(session.status).toBe('completed');
      expect(session.steps.length).toBeGreaterThan(0);
      expect(session.steps[0].type).toBe('observation');
    });

    test('should track progress through callback', async () => {
      const progressSteps: Array<{ type: string; content: string }> = [];

      await engine.execute('Test', (step) => {
        progressSteps.push({
          type: step.type,
          content: step.content,
        });
      });

      expect(progressSteps.length).toBeGreaterThan(0);
      expect(progressSteps[0].type).toBe('observation');
    });

    test('should complete with final step', async () => {
      const session = await engine.execute('Test');

      const finalStep = session.steps.find(s => s.type === 'final');
      expect(finalStep).toBeDefined();
      expect(session.finalResponse).toBeDefined();
    });

    test('should track step count', async () => {
      await engine.execute('Test');
      expect(engine.getStepCount()).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    test('should report running state', async () => {
      const executePromise = engine.execute('Test');
      
      // State should be running during execution
      expect(engine.isRunning()).toBe(true);
      
      await executePromise;
      
      // State should not be running after completion
      expect(engine.isRunning()).toBe(false);
    });

    test('should get active session', async () => {
      const executePromise = engine.execute('Test');
      
      const session = engine.getActiveSession();
      expect(session).toBeDefined();
      expect(session?.status).toBe('running');
      
      await executePromise;
    });
  });

  describe('Cancellation', () => {
    test('should cancel execution', async () => {
      // Start a long-running execution
      const executePromise = engine.execute('Test');
      
      // Cancel immediately
      engine.cancel();
      
      const session = await executePromise;
      expect(session.status).toBe('cancelled');
    });
  });

  describe('Thinking Trace', () => {
    test('should format thinking trace', async () => {
      await engine.execute('Test');
      
      const trace = engine.formatThinkingTrace();
      expect(trace).toContain('OBSERVATION');
      expect(typeof trace).toBe('string');
    });
  });

  describe('Session Export', () => {
    test('should export session to JSON', async () => {
      const session = await engine.execute('Test');
      
      const exported = engine.exportSession();
      const parsed = JSON.parse(exported);
      
      expect(parsed.id).toBeDefined();
      expect(parsed.steps).toBeDefined();
      expect(Array.isArray(parsed.steps)).toBe(true);
    });
  });

  describe('Configuration', () => {
    test('should respect max steps limit', async () => {
      const limitedEngine = new ReActEngine({
        maxSteps: 3,
        showThinking: true,
      });

      const session = await limitedEngine.execute('Test');
      
      // Should have observation + final at minimum
      expect(session.steps.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle timeout', async () => {
      const timeoutEngine = new ReActEngine({
        maxThinkingTime: 1, // 1ms timeout
        showThinking: true,
      });

      await expect(timeoutEngine.execute('Test')).rejects.toThrow('time exceeded');
    });
  });
});
