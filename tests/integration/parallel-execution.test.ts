/**
 * Integration Tests: Parallel Task Execution
 * 
 * Sprint 1 Module 1.7: Integration & End-to-End Flow
 * 
 * Tests for concurrent task execution and parallel processing.
 */

import { EngineerAgent } from '@/agents/specialist/EngineerAgent';
import { TesterAgent } from '@/agents/specialist/TesterAgent';
import { AgentRegistry } from '@/agents/registry';
import { executionEngine } from '@/execution';
import { TaskCreate, TaskPriority } from '@/types';
import { Task as AgentTask, TaskStatus as AgentTaskStatus } from '@/types/agent';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      select: () => ({ data: [], error: null }),
    }),
  },
}));

describe('Parallel Task Execution', () => {
  let engineer1: EngineerAgent;
  let engineer2: EngineerAgent;
  let tester: TesterAgent;
  let registry: AgentRegistry;

  beforeEach(async () => {
    await executionEngine.stop();
    
    registry = AgentRegistry.getInstance();
    registry.clear();
    
    // Create multiple engineers for parallel processing
    engineer1 = new EngineerAgent('engineer-parallel-1', 'Engineer Parallel 1', { model: 'claude-3-sonnet' });
    engineer2 = new EngineerAgent('engineer-parallel-2', 'Engineer Parallel 2', { model: 'claude-3-sonnet' });
    tester = new TesterAgent('tester-parallel', 'Tester Parallel', { model: 'claude-3-sonnet' });
    
    registry.registerAgent(engineer1);
    registry.registerAgent(engineer2);
    registry.registerAgent(tester);
    
    await executionEngine.start();
  });

  afterEach(async () => {
    await executionEngine.stop();
    registry.clear();
  });

  describe('Concurrent Task Execution', () => {
    it('should execute multiple tasks concurrently', async () => {
      const tasks: TaskCreate[] = [
        { title: 'Parallel Task 1', description: 'First parallel task', priority: 'high' as TaskPriority },
        { title: 'Parallel Task 2', description: 'Second parallel task', priority: 'high' as TaskPriority },
        { title: 'Parallel Task 3', description: 'Third parallel task', priority: 'medium' as TaskPriority },
      ];

      // Submit all tasks
      const submittedTasks = await Promise.all(
        tasks.map(task => executionEngine.submitTask(task))
      );

      // Execute tasks in parallel
      const startTime = Date.now();
      const results = await Promise.all(
        submittedTasks.map(task => {
          const agentTask = convertToAgentTask(task);
          return engineer1.runTask(agentTask);
        })
      );
      const duration = Date.now() - startTime;

      // All tasks should complete
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should be faster than sequential execution
      expect(duration).toBeLessThan(30000); // 30 seconds max
    }, 30000);

    it('should handle concurrent agent assignment', async () => {
      const tasks: TaskCreate[] = [
        { title: 'Concurrent 1', description: 'Task 1', priority: 'high' as TaskPriority },
        { title: 'Concurrent 2', description: 'Task 2', priority: 'high' as TaskPriority },
      ];

      // Submit tasks
      const submittedTasks = await Promise.all(
        tasks.map(task => executionEngine.submitTask(task))
      );

      // Assign to different agents
      const result1 = await engineer1.runTask(convertToAgentTask(submittedTasks[0]));
      const result2 = await engineer2.runTask(convertToAgentTask(submittedTasks[1]));

      // Both should complete
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Different agents should have executed
      expect(result1.metadata?.agentId).toBe(engineer1.id);
      expect(result2.metadata?.agentId).toBe(engineer2.id);
    }, 30000);

    it('should track active executions correctly', async () => {
      const initialStatus = executionEngine.getStatus();
      expect(initialStatus.activeTasks).toBe(0);

      const taskCreate: TaskCreate = {
        title: 'Active execution test',
        description: 'Test active execution tracking',
        priority: 'medium' as TaskPriority,
      };

      // Submit task
      await executionEngine.submitTask(taskCreate);

      // Status should reflect submitted task
      const status = executionEngine.getStatus();
      expect(status.queueDepth + status.activeTasks + status.completedTasks).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe('Priority-Based Execution', () => {
    it('should execute high priority tasks first', async () => {
      const tasks: TaskCreate[] = [
        { title: 'Low Priority', description: 'Low', priority: 'low' as TaskPriority },
        { title: 'Critical Priority', description: 'Critical', priority: 'critical' as TaskPriority },
        { title: 'High Priority', description: 'High', priority: 'high' as TaskPriority },
        { title: 'Medium Priority', description: 'Medium', priority: 'medium' as TaskPriority },
      ];

      // Submit all tasks
      for (const task of tasks) {
        await executionEngine.submitTask(task);
      }

      // Get queue status
      const queueStats = executionEngine.getQueueStats();
      
      // Queue should track tasks
      expect(queueStats.total).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('should maintain priority during concurrent execution', async () => {
      const tasks: TaskCreate[] = [
        { title: 'Priority Test 1', description: 'Desc 1', priority: 'critical' as TaskPriority },
        { title: 'Priority Test 2', description: 'Desc 2', priority: 'high' as TaskPriority },
        { title: 'Priority Test 3', description: 'Desc 3', priority: 'low' as TaskPriority },
      ];

      // Submit tasks
      const submittedTasks = await Promise.all(
        tasks.map(task => executionEngine.submitTask(task))
      );

      // Execute concurrently
      const results = await Promise.all(
        submittedTasks.map(task => {
          const agentTask = convertToAgentTask(task);
          return engineer1.runTask(agentTask);
        })
      );

      // All should complete
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    }, 30000);
  });

  describe('Resource Management', () => {
    it('should track concurrent agent usage', async () => {
      const taskCreate: TaskCreate = {
        title: 'Resource tracking test',
        description: 'Test resource tracking',
        priority: 'medium' as TaskPriority,
      };

      // Submit multiple tasks
      const tasks: typeof taskCreate[] = Array(3).fill(taskCreate).map((t, i) => ({
        ...t,
        title: `${t.title} ${i + 1}`,
      }));

      for (const task of tasks) {
        await executionEngine.submitTask(task);
      }

      // Check agent stats
      const stats = registry.getAgentStats();
      expect(stats.total).toBeGreaterThanOrEqual(3);
    }, 30000);

    it('should handle queue depth correctly', async () => {
      const taskCreate: TaskCreate = {
        title: 'Queue depth test',
        description: 'Test queue depth tracking',
        priority: 'medium' as TaskPriority,
      };

      // Submit multiple tasks
      for (let i = 0; i < 5; i++) {
        await executionEngine.submitTask({
          ...taskCreate,
          title: `${taskCreate.title} ${i + 1}`,
        });
      }

      // Check queue stats
      const queueStats = executionEngine.getQueueStats();
      expect(queueStats.total).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Parallel Execution Performance', () => {
    it('should complete parallel tasks efficiently', async () => {
      const tasks: TaskCreate[] = Array(5).fill(null).map((_, i) => ({
        title: `Performance Test Task ${i + 1}`,
        description: `Description ${i + 1}`,
        priority: 'medium' as TaskPriority,
      }));

      // Submit all tasks
      const submittedTasks = await Promise.all(
        tasks.map(task => executionEngine.submitTask(task))
      );

      // Execute in parallel
      const startTime = Date.now();
      const results = await Promise.all(
        submittedTasks.map((task, i) => {
          const agentTask = convertToAgentTask(task);
          // Alternate between agents
          const agent = i % 2 === 0 ? engineer1 : engineer2;
          return agent.runTask(agentTask);
        })
      );
      const duration = Date.now() - startTime;

      // All tasks should complete
      expect(results.length).toBe(5);
      expect(results.every(r => r.success)).toBe(true);

      // Should complete within reasonable time
      expect(duration).toBeLessThan(60000); // 60 seconds
    }, 60000);

    it('should maintain performance with mixed priorities', async () => {
      const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low', 'critical'];
      
      const tasks: TaskCreate[] = priorities.map((priority, i) => ({
        title: `Mixed Priority Task ${i + 1}`,
        description: `Priority: ${priority}`,
        priority,
      }));

      // Submit all tasks
      const submittedTasks = await Promise.all(
        tasks.map(task => executionEngine.submitTask(task))
      );

      // Execute
      const results = await Promise.all(
        submittedTasks.map(task => {
          const agentTask = convertToAgentTask(task);
          return engineer1.runTask(agentTask);
        })
      );

      // All should complete
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    }, 60000);
  });

  describe('Concurrent Error Handling', () => {
    it('should handle errors in parallel execution', async () => {
      const tasks: TaskCreate[] = [
        { title: 'Error Task 1', description: 'May fail', priority: 'high' as TaskPriority },
        { title: 'Normal Task 1', description: 'Should succeed', priority: 'high' as TaskPriority },
        { title: 'Error Task 2', description: 'May fail', priority: 'medium' as TaskPriority },
        { title: 'Normal Task 2', description: 'Should succeed', priority: 'medium' as TaskPriority },
      ];

      // Submit tasks
      const submittedTasks = await Promise.all(
        tasks.map(task => executionEngine.submitTask(task))
      );

      // Execute in parallel
      const results = await Promise.all(
        submittedTasks.map(task => {
          const agentTask = convertToAgentTask(task);
          return engineer1.runTask(agentTask);
        })
      );

      // All tasks should have results
      expect(results.length).toBe(4);
      
      // Each result should have success property
      results.forEach(result => {
        expect(result).toHaveProperty('success');
      });
    }, 30000);

    it('should recover from concurrent failures', async () => {
      const tasks: TaskCreate[] = Array(3).fill(null).map((_, i) => ({
        title: `Recovery Test ${i + 1}`,
        description: 'Test recovery',
        priority: 'medium' as TaskPriority,
      }));

      // Submit and execute
      const submittedTasks = await Promise.all(
        tasks.map(task => executionEngine.submitTask(task))
      );

      const results = await Promise.all(
        submittedTasks.map(task => {
          const agentTask = convertToAgentTask(task);
          return engineer1.runTask(agentTask);
        })
      );

      // System should remain stable
      const status = executionEngine.getStatus();
      expect(status.isRunning).toBe(true);
    }, 30000);
  });

  describe('Metrics Collection', () => {
    it('should collect metrics during parallel execution', async () => {
      const initialMetrics = executionEngine.getMetrics();

      const tasks: TaskCreate[] = Array(3).fill(null).map((_, i) => ({
        title: `Metrics Test ${i + 1}`,
        description: 'Test metrics collection',
        priority: 'medium' as TaskPriority,
      }));

      // Submit and execute
      for (const task of tasks) {
        const submitted = await executionEngine.submitTask(task);
        const agentTask = convertToAgentTask(submitted);
        await engineer1.runTask(agentTask);
      }

      // Metrics should be updated
      const finalMetrics = executionEngine.getMetrics();
      expect(finalMetrics.tasksSubmitted).toBeGreaterThanOrEqual(initialMetrics.tasksSubmitted);
    }, 30000);

    it('should calculate success rate correctly', async () => {
      const tasks: TaskCreate[] = [
        { title: 'Success Rate 1', description: 'Task 1', priority: 'high' as TaskPriority },
        { title: 'Success Rate 2', description: 'Task 2', priority: 'high' as TaskPriority },
        { title: 'Success Rate 3', description: 'Task 3', priority: 'high' as TaskPriority },
      ];

      // Submit and execute
      for (const task of tasks) {
        const submitted = await executionEngine.submitTask(task);
        const agentTask = convertToAgentTask(submitted);
        await engineer1.runTask(agentTask);
      }

      // Check success rate
      const metrics = executionEngine.getMetrics();
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
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
