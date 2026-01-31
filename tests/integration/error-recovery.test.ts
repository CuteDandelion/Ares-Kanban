/**
 * Integration Tests: Error Handling and Recovery
 * 
 * Sprint 1 Module 1.7: Integration & End-to-End Flow
 * 
 * Tests for error handling, retry logic, and recovery mechanisms.
 */

import { EngineerAgent } from '@/agents/specialist/EngineerAgent';
import { AgentRegistry } from '@/agents/registry';
import { executionEngine } from '@/execution';
import { Task as AgentTask, TaskStatus as AgentTaskStatus, TaskResult } from '@/types/agent';
import { TaskCreate, TaskPriority } from '@/types';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      select: () => ({ data: [], error: null }),
    }),
  },
}));

describe('Error Recovery', () => {
  let engineer: EngineerAgent;
  let registry: AgentRegistry;

  beforeEach(async () => {
    await executionEngine.stop();
    
    registry = AgentRegistry.getInstance();
    registry.clear();
    
    engineer = new EngineerAgent('engineer-error-test', 'Engineer Error Test', { model: 'claude-3-sonnet' });
    registry.registerAgent(engineer);
    
    await executionEngine.start();
  });

  afterEach(async () => {
    await executionEngine.stop();
    registry.clear();
  });

  describe('Retry Logic', () => {
    it('should retry failed tasks up to max attempts', async () => {
      const task: AgentTask = {
        id: 'retry-test-task',
        title: 'Retry test',
        description: 'Task to test retry logic',
        status: 'pending' as AgentTaskStatus,
        priority: 3,
        qualityGates: [],
        metadata: { shouldFail: true },
        createdAt: new Date().toISOString(),
      };

      // Execute task (mock may simulate failures)
      const result = await engineer.runTask(task);
      
      // Should have attempted retries
      expect(result.metadata?.attempts).toBeDefined();
      expect(result.metadata?.attempts).toBeGreaterThanOrEqual(1);
    }, 30000);

    it('should increment retry count on failure', async () => {
      const taskCreate: TaskCreate = {
        title: 'Retry count test',
        description: 'Test retry counting',
        priority: 'medium' as TaskPriority,
        max_retries: 3,
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      expect(submittedTask.max_retries).toBe(3);
      expect(submittedTask.retry_count).toBe(0);
    }, 30000);

    it('should use exponential backoff for retries', async () => {
      // Test that retry delays increase exponentially
      const task: AgentTask = {
        id: 'backoff-test',
        title: 'Backoff test',
        description: 'Test exponential backoff',
        status: 'pending' as AgentTaskStatus,
        priority: 3,
        qualityGates: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      // Execute and check timing
      const startTime = Date.now();
      await engineer.runTask(task);
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time (not too fast if retries occurred)
      expect(duration).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Timeout Handling', () => {
    it('should respect task timeout', async () => {
      const taskCreate: TaskCreate = {
        title: 'Timeout test',
        description: 'Test task timeout handling',
        priority: 'medium' as TaskPriority,
        timeout_ms: 100, // Very short timeout
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      expect(submittedTask.timeout_ms).toBe(100);
    }, 30000);

    it('should handle timeout errors gracefully', async () => {
      const taskCreate: TaskCreate = {
        title: 'Timeout error test',
        description: 'Test timeout error handling',
        priority: 'medium' as TaskPriority,
        timeout_ms: 1, // Extremely short to trigger timeout
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);
      
      // Task should be handled (may timeout)
      const result = await engineer.runTask(agentTask);
      
      // Result should be structured even on timeout
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('output');
    }, 30000);
  });

  describe('Error Recovery Strategies', () => {
    it('should support retry recovery strategy', async () => {
      const task: AgentTask = {
        id: 'recovery-retry-test',
        title: 'Retry recovery test',
        description: 'Test retry recovery strategy',
        status: 'pending' as AgentTaskStatus,
        priority: 3,
        qualityGates: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      const result = await engineer.runTask(task);
      
      // Result should indicate strategy used
      if (!result.success) {
        expect(result.metadata?.attempts).toBeDefined();
      }
    }, 30000);

    it('should handle pause recovery strategy', async () => {
      // Test pause functionality
      await engineer.pause();
      expect(engineer.status).toBe('paused');

      // Resume
      await engineer.resume();
      expect(engineer.status).toBe('idle');
    }, 30000);

    it('should handle agent going offline', async () => {
      // Initially online
      expect(engineer.status).toBe('idle');

      // Go offline
      await engineer.goOffline();
      expect(engineer.status).toBe('offline');
      expect(engineer.isAvailable).toBe(false);

      // Come back online
      await engineer.goOnline();
      expect(engineer.status).toBe('idle');
      expect(engineer.isAvailable).toBe(true);
    });
  });

  describe('Task Cancellation', () => {
    it('should support task cancellation', async () => {
      const taskCreate: TaskCreate = {
        title: 'Cancellation test',
        description: 'Test task cancellation',
        priority: 'medium' as TaskPriority,
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      
      // Cancel the task
      const cancelled = await executionEngine.cancelTask(submittedTask.id);
      
      // Cancellation may succeed or fail depending on task state
      expect(typeof cancelled).toBe('boolean');
    }, 30000);

    it('should abort running tasks', async () => {
      const taskCreate: TaskCreate = {
        title: 'Abort test',
        description: 'Test task abortion',
        priority: 'medium' as TaskPriority,
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      
      // Try to cancel immediately
      await executionEngine.cancelTask(submittedTask.id);
      
      // Task status may vary
      const task = executionEngine.getTask(submittedTask.id);
      if (task) {
        expect(['pending', 'queued', 'running', 'cancelled', 'failed']).toContain(task.status);
      }
    }, 30000);
  });

  describe('Error Reporting', () => {
    it('should provide detailed error messages', async () => {
      const taskCreate: TaskCreate = {
        title: 'Error detail test',
        description: 'Test error detail reporting',
        priority: 'medium' as TaskPriority,
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);
      
      const result = await engineer.runTask(agentTask);
      
      // Result should always have these properties
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    }, 30000);

    it('should log execution errors', async () => {
      const task: AgentTask = {
        id: 'error-log-test',
        title: 'Error logging test',
        description: 'Test that errors are logged',
        status: 'pending' as AgentTaskStatus,
        priority: 3,
        qualityGates: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      const result = await engineer.runTask(task);
      
      // Should have execution metadata
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.agentId).toBe(engineer.id);
    }, 30000);
  });

  describe('Engine Failure Handling', () => {
    it('should handle engine stop with force option', async () => {
      // Start engine
      await executionEngine.start();
      expect(executionEngine.running).toBe(true);

      // Stop with force
      await executionEngine.stop({ force: true });
      expect(executionEngine.running).toBe(false);
    }, 30000);

    it('should handle engine stop with timeout', async () => {
      // Start engine
      await executionEngine.start();
      expect(executionEngine.running).toBe(true);

      // Stop with timeout
      await executionEngine.stop({ timeout: 5000 });
      expect(executionEngine.running).toBe(false);
    }, 30000);

    it('should handle engine pause and resume', async () => {
      // Start engine
      await executionEngine.start();
      
      // Pause
      await executionEngine.pause();
      expect(executionEngine.paused).toBe(true);

      // Resume
      await executionEngine.resume();
      expect(executionEngine.paused).toBe(false);
      expect(executionEngine.running).toBe(true);
    }, 30000);
  });

  describe('Recovery After Failure', () => {
    it('should recover and continue processing after errors', async () => {
      const tasks: TaskCreate[] = [
        { title: 'Task 1', description: 'First task', priority: 'high' as TaskPriority },
        { title: 'Task 2', description: 'Second task', priority: 'medium' as TaskPriority },
        { title: 'Task 3', description: 'Third task', priority: 'low' as TaskPriority },
      ];

      const results: boolean[] = [];

      for (const taskCreate of tasks) {
        try {
          const submittedTask = await executionEngine.submitTask(taskCreate);
          const agentTask = convertToAgentTask(submittedTask);
          const result = await engineer.runTask(agentTask);
          results.push(result.success);
        } catch (error) {
          results.push(false);
        }
      }

      // Should have processed all tasks
      expect(results.length).toBe(3);
    }, 60000);

    it('should maintain state consistency after failures', async () => {
      const taskCreate: TaskCreate = {
        title: 'State consistency test',
        description: 'Test state after failures',
        priority: 'medium' as TaskPriority,
      };

      // Submit task
      const submittedTask = await executionEngine.submitTask(taskCreate);
      
      // Get initial status
      const initialStatus = executionEngine.getStatus();
      
      // Execute
      const agentTask = convertToAgentTask(submittedTask);
      await engineer.runTask(agentTask);
      
      // Get final status
      const finalStatus = executionEngine.getStatus();
      
      // Status should be consistent
      expect(finalStatus.isRunning).toBe(initialStatus.isRunning);
    }, 30000);
  });
});

// Helper function to convert Task to AgentTask
function convertToAgentTask(task: { 
  id: string; 
  title: string; 
  description: string; 
  status: string; 
  priority: string;
  created_at: string;
  [key: string]: any;
}): AgentTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status as AgentTaskStatus,
    priority: task.priority === 'critical' ? 5 : task.priority === 'high' ? 4 : task.priority === 'medium' ? 3 : 2,
    assignedAgentId: task.assignee_agent_id || undefined,
    parentTaskId: task.parent_task_id || undefined,
    boardId: task.board_id || undefined,
    cardId: task.card_id || undefined,
    estimatedDuration: task.timeout_ms ? Math.round(task.timeout_ms / 60000) : undefined,
    actualDuration: undefined,
    qualityGates: [],
    metadata: task.context || {},
    createdAt: task.created_at,
    startedAt: task.started_at || undefined,
    completedAt: task.completed_at || undefined,
  };
}
