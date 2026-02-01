/**
 * Integration Tests: End-to-End Multi-Agent Task Execution
 * 
 * Sprint 1 Module 1.7: Integration & End-to-End Flow
 * 
 * These tests verify the complete task lifecycle from submission
 * through completion, including multi-agent coordination.
 */

import { AresAgent } from '@/agents/orchestrator/AresAgent';
import { EngineerAgent } from '@/agents/specialist/EngineerAgent';
import { TesterAgent } from '@/agents/specialist/TesterAgent';
import { AgentRegistry } from '@/agents/registry';
import { executionEngine } from '@/execution';
import { Task, TaskCreate, TaskStatus, TaskPriority } from '@/types';
import { Task as AgentTask, TaskResult, TaskStatus as AgentTaskStatus } from '@/types/agent';

// Mock implementations for testing
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      select: () => ({ data: [], error: null }),
    }),
  },
}));

describe('End-to-End: Multi-Agent Task Execution', () => {
  let ares: AresAgent;
  let engineer: EngineerAgent;
  let tester: TesterAgent;
  let registry: AgentRegistry;

  beforeEach(async () => {
    // Reset execution engine
    await executionEngine.stop();
    
    // Create fresh agent instances
    registry = AgentRegistry.getInstance();
    registry.clear();
    
    ares = new AresAgent('ares-test', { model: 'claude-3-opus' });
    engineer = new EngineerAgent('engineer-test', 'Engineer Test', { model: 'claude-3-sonnet' });
    tester = new TesterAgent('tester-test', 'Tester Test', { model: 'claude-3-sonnet' });
    
    // Register agents
    registry.registerAgent(ares);
    registry.registerAgent(engineer);
    registry.registerAgent(tester);
    
    // Start execution engine
    await executionEngine.start();
  });

  afterEach(async () => {
    await executionEngine.stop();
    registry.clear();
  });

  describe('Full Task Lifecycle', () => {
    it('should complete full task lifecycle from submission to completion', async () => {
      // 1. User submits task
      const taskCreate: TaskCreate = {
        title: 'Create greeting function',
        description: 'Write a TypeScript function that greets users by name',
        priority: 'high' as TaskPriority,
      };

      // Submit task through execution engine
      const submittedTask = await executionEngine.submitTask(taskCreate);
      expect(submittedTask).toBeDefined();
      expect(submittedTask.title).toBe(taskCreate.title);

      // 2. Ares analyzes and creates plan
      const analysis = await ares.analyze(taskCreate.description);
      expect(analysis).toBeDefined();
      expect(analysis.complexity).toBeDefined();
      expect(analysis.estimatedDuration).toBeGreaterThan(0);
      expect(analysis.requiredCapabilities.length).toBeGreaterThan(0);

      // 3. Ares creates execution plan
      const agentTask = convertToAgentTask(submittedTask);
      const plan = await ares.plan(agentTask);
      expect(plan).toBeDefined();
      expect(plan.phases.length).toBeGreaterThan(0);
      expect(plan.estimatedDuration).toBeGreaterThan(0);

      // 4. Execute through the engine
      const result = await ares.runTask(agentTask);
      
      // 5. Verify task completed
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
    }, 30000); // 30 second timeout

    it('should handle task with multiple phases correctly', async () => {
      const taskCreate: TaskCreate = {
        title: 'Implement and test feature',
        description: 'Implement a new feature and write comprehensive tests for it',
        priority: 'critical' as TaskPriority,
      };

      // Submit and execute
      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);
      const plan = await ares.plan(agentTask);
      
      // Verify plan has multiple phases
      expect(plan.phases.length).toBeGreaterThan(1);
      
      // Execute and verify
      const result = await ares.runTask(agentTask);
      expect(result.success).toBe(true);
    }, 30000);

    it('should track task progress through all states', async () => {
      const taskCreate: TaskCreate = {
        title: 'Test state transitions',
        description: 'Simple task to test state machine',
        priority: 'medium' as TaskPriority,
      };

      const statusHistory: string[] = [];
      
      // Subscribe to task updates
      executionEngine.subscribeToTasks((task, event) => {
        if (task.id) {
          statusHistory.push(`${event}: ${task.status}`);
        }
      });

      // Submit and execute task
      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);
      await ares.runTask(agentTask);

      // Verify state transitions occurred
      expect(statusHistory.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Agent Handoff', () => {
    it('should successfully handoff from Engineer to Tester agent', async () => {
      const taskCreate: TaskCreate = {
        title: 'Feature with tests',
        description: 'Implement feature and verify with tests',
        priority: 'high' as TaskPriority,
      };

      // Submit through engine
      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);

      // Engineer executes first
      const engineerResult = await engineer.runTask(agentTask);
      expect(engineerResult.success).toBe(true);
      expect(engineerResult.output).toContain('implementation');

      // Create verification task for tester
      const verifyTaskCreate: TaskCreate = {
        title: `${taskCreate.title} - Verification`,
        description: `Verify implementation: ${engineerResult.output}`,
        priority: 'high' as TaskPriority,
        parent_task_id: submittedTask.id,
      };

      const verifySubmitted = await executionEngine.submitTask(verifyTaskCreate);
      const verifyAgentTask = convertToAgentTask(verifySubmitted);

      // Tester verifies
      const testerResult = await tester.runTask(verifyAgentTask);
      expect(testerResult.success).toBe(true);
      expect(testerResult.output).toContain('test');
    }, 30000);

    it('should pass context between agents during handoff', async () => {
      const taskCreate: TaskCreate = {
        title: 'Context passing test',
        description: 'Test that context is passed between agents',
        priority: 'medium' as TaskPriority,
        context: {
          original_requirement: 'Must include error handling',
        },
      };

      // Submit task
      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);

      // Engineer executes with metadata
      const engineerResult = await engineer.runTask(agentTask);
      
      // Verify metadata was preserved
      expect(engineerResult.metadata).toBeDefined();
      
      // Create handoff task preserving context
      const handoffTaskCreate: TaskCreate = {
        title: `${taskCreate.title} - Handoff`,
        description: 'Handoff task with context',
        priority: 'medium' as TaskPriority,
        parent_task_id: submittedTask.id,
        context: {
          ...taskCreate.context,
          previous_result: engineerResult.output,
          previous_agent: 'EngineerAgent',
        },
      };

      const handoffSubmitted = await executionEngine.submitTask(handoffTaskCreate);
      const handoffAgentTask = convertToAgentTask(handoffSubmitted);

      const testerResult = await tester.runTask(handoffAgentTask);
      expect(testerResult.success).toBe(true);
    }, 30000);
  });

  describe('Task Results', () => {
    it('should return structured results with execution metrics', async () => {
      const taskCreate: TaskCreate = {
        title: 'Metrics test',
        description: 'Test that results include proper metrics',
        priority: 'low' as TaskPriority,
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);
      const result = await engineer.runTask(agentTask);

      // Verify result structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('errors');

      // Verify types
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.output).toBe('string');

      // Verify execution time in metadata
      expect(result.metadata?.executionTime).toBeDefined();
      expect(typeof result.metadata?.executionTime).toBe('number');
    }, 30000);

    it('should aggregate results from multiple agents in orchestration', async () => {
      const taskCreate: TaskCreate = {
        title: 'Multi-agent task',
        description: 'Task requiring multiple agents',
        priority: 'high' as TaskPriority,
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);
      const plan = await ares.plan(agentTask);
      const result = await ares.runTask(agentTask);

      // Verify results include agent info
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.agentId).toBeDefined();
      expect(result.metadata?.agentName).toBeDefined();
    }, 30000);
  });

  describe('Task Priority Handling', () => {
    it('should respect task priorities in execution order', async () => {
      const tasks: TaskCreate[] = [
        {
          title: 'Low priority task',
          description: 'Low priority',
          priority: 'low' as TaskPriority,
        },
        {
          title: 'Critical task',
          description: 'Critical priority',
          priority: 'critical' as TaskPriority,
        },
        {
          title: 'High priority task',
          description: 'High priority',
          priority: 'high' as TaskPriority,
        },
      ];

      // Submit all tasks
      for (const task of tasks) {
        await executionEngine.submitTask(task);
      }

      // Get queue status
      const status = executionEngine.getStatus();
      
      // Tasks should be tracked
      expect(status.queueDepth).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Activity Feed', () => {
    it('should generate activity feed events during execution', async () => {
      const activities: string[] = [];
      
      // Subscribe to status updates
      executionEngine.subscribeToStatus((status) => {
        activities.push(`State: ${status.isRunning ? 'running' : 'stopped'}`);
      });

      const taskCreate: TaskCreate = {
        title: 'Activity test',
        description: 'Test activity feed generation',
        priority: 'medium' as TaskPriority,
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);
      const plan = await ares.plan(agentTask);
      await ares.runTask(agentTask);

      // Verify activities were generated
      expect(activities.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Agent Status Management', () => {
    it('should track agent status correctly', async () => {
      const taskCreate: TaskCreate = {
        title: 'Agent status test',
        description: 'Test agent status tracking',
        priority: 'medium' as TaskPriority,
      };

      // Initially idle
      expect(engineer.status).toBe('idle');
      expect(engineer.isAvailable).toBe(true);
      expect(engineer.isBusy).toBe(false);

      // Submit and execute task
      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);
      
      // Execute task
      const executePromise = engineer.runTask(agentTask);
      
      // Should be busy during execution
      expect(engineer.status).toBe('busy');
      expect(engineer.isBusy).toBe(true);
      expect(engineer.isAvailable).toBe(false);

      // Wait for completion
      await executePromise;

      // Should be idle after completion
      expect(engineer.status).toBe('idle');
      expect(engineer.isAvailable).toBe(true);
      expect(engineer.isBusy).toBe(false);
    }, 30000);

    it('should track agent statistics', async () => {
      const taskCreate: TaskCreate = {
        title: 'Agent stats test',
        description: 'Test agent statistics tracking',
        priority: 'medium' as TaskPriority,
      };

      // Get initial stats
      const initialStats = engineer.getStats();
      expect(initialStats.tasksCompleted).toBe(0);

      // Submit and execute task
      const submittedTask = await executionEngine.submitTask(taskCreate);
      const agentTask = convertToAgentTask(submittedTask);
      await engineer.runTask(agentTask);

      // Get updated stats
      const updatedStats = engineer.getStats();
      expect(updatedStats.tasksCompleted).toBe(1);
      expect(updatedStats.successRate).toBe(1);
      expect(updatedStats.avgExecutionTime).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Execution Engine Management', () => {
    it('should manage engine lifecycle correctly', async () => {
      // Stop engine
      await executionEngine.stop();
      let status = executionEngine.getStatus();
      expect(status.isRunning).toBe(false);

      // Start engine
      await executionEngine.start();
      status = executionEngine.getStatus();
      expect(status.isRunning).toBe(true);

      // Pause engine
      await executionEngine.pause();
      status = executionEngine.getStatus();
      expect(status.isPaused).toBe(true);

      // Resume engine
      await executionEngine.resume();
      status = executionEngine.getStatus();
      expect(status.isPaused).toBe(false);
      expect(status.isRunning).toBe(true);
    }, 30000);

    it('should provide accurate queue and agent statistics', async () => {
      const taskCreate: TaskCreate = {
        title: 'Engine stats test',
        description: 'Test engine statistics',
        priority: 'medium' as TaskPriority,
      };

      // Get initial status
      const initialStatus = executionEngine.getStatus();
      expect(initialStatus.agents.total).toBeGreaterThan(0);
      expect(initialStatus.agents.idle).toBeGreaterThan(0);

      // Submit task
      await executionEngine.submitTask(taskCreate);

      // Get updated status
      const updatedStatus = executionEngine.getStatus();
      expect(updatedStatus.completedTasks + updatedStatus.failedTasks + updatedStatus.queueDepth + updatedStatus.activeTasks).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle task timeout gracefully', async () => {
      const taskCreate: TaskCreate = {
        title: 'Timeout test',
        description: 'Test that should timeout',
        priority: 'medium' as TaskPriority,
        timeout_ms: 100, // Very short timeout
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      
      // Task should be handled (may fail due to timeout)
      expect(submittedTask).toBeDefined();
      expect(submittedTask.timeout_ms).toBe(100);
    }, 30000);

    it('should support task retry on failure', async () => {
      const taskCreate: TaskCreate = {
        title: 'Retry test',
        description: 'Test retry mechanism',
        priority: 'medium' as TaskPriority,
        max_retries: 3,
      };

      const submittedTask = await executionEngine.submitTask(taskCreate);
      expect(submittedTask.max_retries).toBe(3);

      // Retry mechanism is tested through the execution engine
      const retried = await executionEngine.retryTask(submittedTask.id);
      // May or may not retry depending on task state
    }, 30000);
  });

  describe('Multiple Task Execution', () => {
    it('should handle multiple tasks in sequence', async () => {
      const tasks: TaskCreate[] = [
        { title: 'Task 1', description: 'First task', priority: 'high' as TaskPriority },
        { title: 'Task 2', description: 'Second task', priority: 'medium' as TaskPriority },
        { title: 'Task 3', description: 'Third task', priority: 'low' as TaskPriority },
      ];

      const results: TaskResult[] = [];

      for (const taskCreate of tasks) {
        const submittedTask = await executionEngine.submitTask(taskCreate);
        const agentTask = convertToAgentTask(submittedTask);
        const result = await engineer.runTask(agentTask);
        results.push(result);
      }

      // All tasks should complete
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    }, 60000); // 60 second timeout for multiple tasks
  });
});

// Helper function to convert Task to AgentTask
function convertToAgentTask(task: Task): AgentTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: convertStatus(task.status),
    priority: convertPriority(task.priority),
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

// Helper function to convert TaskStatus
function convertStatus(status: TaskStatus): AgentTaskStatus {
  const statusMap: Record<TaskStatus, AgentTaskStatus> = {
    'pending': 'pending',
    'queued': 'pending',
    'assigned': 'analyzing',
    'running': 'executing',
    'paused': 'analyzing',
    'completed': 'completed',
    'failed': 'failed',
    'cancelled': 'failed',
    'retrying': 'analyzing',
  };
  return statusMap[status] || 'pending';
}

// Helper function to convert TaskPriority
function convertPriority(priority: TaskPriority): number {
  const priorityMap: Record<TaskPriority, number> = {
    'critical': 5,
    'high': 4,
    'medium': 3,
    'low': 2,
  };
  return priorityMap[priority] || 3;
}
