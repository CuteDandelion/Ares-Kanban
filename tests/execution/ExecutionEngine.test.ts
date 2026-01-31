/**
 * ExecutionEngine Tests
 * 
 * Comprehensive test suite for the ExecutionEngine
 * Tests: lifecycle, task execution, error handling, retries, and metrics
 */

import { ExecutionEngine } from '@/execution/ExecutionEngine';
import { TaskQueue } from '@/execution/TaskQueue';
import { TaskStateMachine, TaskStateManager } from '@/execution/TaskStateMachine';
import { agentRegistry } from '@/agents/registry';
import { BaseAgent } from '@/agents/base/BaseAgent';
import type { Task, TaskCreate, TaskResult } from '@/types';
import type { Task as AgentTask, AgentConfig } from '@/types/agent';

// Mock agent for testing
class MockAgent extends BaseAgent {
  private shouldFail = false;
  private executionDelay = 0;
  private executionCount = 0;

  constructor(
    id: string,
    name: string,
    private mockResult: Partial<TaskResult> = {}
  ) {
    super(id, name, 'engineer', ['code-generation'], {
      model: 'test-model',
      timeout: 30,
      retryAttempts: 3,
    });
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setExecutionDelay(delay: number): void {
    this.executionDelay = delay;
  }

  getExecutionCount(): number {
    return this.executionCount;
  }

  async execute(task: AgentTask): Promise<{
    success: boolean;
    output: string;
    fileChanges?: any[];
    errors?: string[];
    metadata?: Record<string, unknown>;
  }> {
    this.executionCount++;
    
    if (this.executionDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.executionDelay));
    }

    if (this.shouldFail) {
      throw new Error('Mock execution failure');
    }

    return {
      success: true,
      output: this.mockResult.output || `Executed: ${task.title}`,
      metadata: {
        executionTime: 1,
        ...this.mockResult,
      },
    };
  }

  async analyze(taskDescription: string): Promise<{
    complexity: 'low' | 'medium' | 'high';
    estimatedDuration: number;
    requiredCapabilities: string[];
    risks: string[];
    recommendations: string[];
  }> {
    return {
      complexity: 'low',
      estimatedDuration: 5,
      requiredCapabilities: ['code-generation'],
      risks: [],
      recommendations: [],
    };
  }

  async plan(task: AgentTask): Promise<{
    phases: any[];
    estimatedDuration: number;
    complexity: 'low' | 'medium' | 'high';
  }> {
    return {
      phases: [],
      estimatedDuration: 5,
      complexity: 'low',
    };
  }
}

describe('ExecutionEngine', () => {
  let engine: ExecutionEngine;
  let queue: TaskQueue;
  let stateMachine: TaskStateMachine;

  beforeEach(() => {
    queue = new TaskQueue();
    stateMachine = new TaskStateMachine();
    engine = new ExecutionEngine(queue, stateMachine, {
      maxConcurrentTasks: 2,
      pollIntervalMs: 100,
      enableAutoRetry: false,
    });
    agentRegistry.clear();
  });

  afterEach(async () => {
    await engine.stop({ force: true });
    agentRegistry.clear();
    queue.clear();
  });

  // ============================================
  // LIFECYCLE TESTS
  // ============================================

  describe('Lifecycle', () => {
    it('should start the engine', async () => {
      await engine.start();
      
      expect(engine.running).toBe(true);
      expect(engine.paused).toBe(false);
      
      const status = engine.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.startedAt).toBeDefined();
    });

    it('should not start if already running', async () => {
      await engine.start();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await engine.start();
      
      expect(consoleSpy).toHaveBeenCalledWith('[ExecutionEngine] Already running');
      consoleSpy.mockRestore();
    });

    it('should pause the engine', async () => {
      await engine.start();
      await engine.pause();
      
      expect(engine.paused).toBe(true);
      
      const status = engine.getStatus();
      expect(status.isPaused).toBe(true);
    });

    it('should resume the engine', async () => {
      await engine.start();
      await engine.pause();
      await engine.resume();
      
      expect(engine.paused).toBe(false);
      
      const status = engine.getStatus();
      expect(status.isPaused).toBe(false);
    });

    it('should stop the engine gracefully', async () => {
      await engine.start();
      await engine.stop();
      
      expect(engine.running).toBe(false);
      expect(engine.paused).toBe(false);
      
      const status = engine.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should force stop the engine', async () => {
      await engine.start();
      await engine.stop({ force: true });
      
      expect(engine.running).toBe(false);
    });

    it('should track uptime', async () => {
      await engine.start();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = engine.getStatus();
      expect(status.uptime).toBeGreaterThanOrEqual(100);
    });
  });

  // ============================================
  // TASK SUBMISSION TESTS
  // ============================================

  describe('Task Submission', () => {
    it('should submit a task', async () => {
      const task: TaskCreate = {
        title: 'Test Task',
        description: 'Test description',
        priority: 'high',
      };

      const submitted = await engine.submitTask(task);

      expect(submitted).toBeDefined();
      expect(submitted.title).toBe('Test Task');
      expect(submitted.status).toBe('queued');
    });

    it('should apply default configuration', async () => {
      const task: TaskCreate = {
        title: 'Test Task',
        description: 'Test description',
      };

      const submitted = await engine.submitTask(task);

      expect(submitted.max_retries).toBe(3); // Default
      expect(submitted.timeout_ms).toBe(300000); // Default 5 minutes
    });

    it('should track submitted tasks in metrics', async () => {
      await engine.submitTask({ title: 'Task 1', description: '' });
      await engine.submitTask({ title: 'Task 2', description: '' });

      const metrics = engine.getMetrics();
      expect(metrics.tasksSubmitted).toBe(2);
    });

    it('should get task by ID', async () => {
      const task = await engine.submitTask({
        title: 'Test Task',
        description: '',
      });

      const retrieved = engine.getTask(task.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(task.id);
    });

    it('should get all tasks', async () => {
      await engine.submitTask({ title: 'Task 1', description: '' });
      await engine.submitTask({ title: 'Task 2', description: '' });

      const tasks = engine.getAllTasks();
      expect(tasks).toHaveLength(2);
    });

    it('should get tasks by status', async () => {
      await engine.submitTask({ title: 'Task 1', description: '' });

      const queued = engine.getTasksByStatus('queued');
      expect(queued).toHaveLength(1);

      const completed = engine.getTasksByStatus('completed');
      expect(completed).toHaveLength(0);
    });
  });

  // ============================================
  // TASK EXECUTION TESTS
  // ============================================

  describe('Task Execution', () => {
    beforeEach(async () => {
      // Register a mock agent
      const mockAgent = new MockAgent('test-agent-1', 'Test Agent');
      agentRegistry.registerAgent(mockAgent);
      
      await engine.start();
    });

    it('should execute a task with an agent', async () => {
      const mockAgent = agentRegistry.getAgent('test-agent-1') as MockAgent;
      
      const task = await engine.submitTask({
        title: 'Execute Test',
        description: 'Test execution',
      });

      // Manually execute to test
      const result = await engine.executeTask(task, mockAgent);

      expect(result.success).toBe(true);
      expect(mockAgent.getExecutionCount()).toBe(1);
    });

    it('should mark task as running during execution', async () => {
      const mockAgent = agentRegistry.getAgent('test-agent-1') as MockAgent;
      mockAgent.setExecutionDelay(100);

      const task = await engine.submitTask({
        title: 'Slow Task',
        description: '',
      });

      // Start execution but don't await
      const executionPromise = engine.executeTask(task, mockAgent);
      
      // Check that task is marked as running
      await new Promise(resolve => setTimeout(resolve, 50));
      const runningTask = engine.getTask(task.id);
      expect(runningTask?.status).toBe('running');

      await executionPromise;
    });

    it('should handle task timeout', async () => {
      const mockAgent = agentRegistry.getAgent('test-agent-1') as MockAgent;
      
      const task: Task = {
        id: 'timeout-task',
        title: 'Timeout Test',
        description: '',
        status: 'assigned',
        priority: 'high',
        assignee_agent_id: null,
        creator_id: 'test',
        board_id: null,
        card_id: null,
        parent_task_id: null,
        dependencies: [],
        context: {},
        result: null,
        retry_count: 0,
        max_retries: 3,
        timeout_ms: 50, // 50ms timeout
        started_at: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockAgent.setExecutionDelay(200); // Will timeout

      // Directly set task in queue
      (queue as any).tasks.set(task.id, task);
      const result = await engine.executeTask(task, mockAgent);

      expect(result.success).toBe(false);
      expect(result.logs[0]).toContain('timed out');
    });

    it('should handle task abortion', async () => {
      const mockAgent = agentRegistry.getAgent('test-agent-1') as MockAgent;
      mockAgent.setExecutionDelay(500);

      const task = await engine.submitTask({
        title: 'Abort Test',
        description: '',
        timeout_ms: 1000,
      });

      // Start execution
      const executionPromise = engine.executeTask(task, mockAgent);

      // Cancel the task
      await new Promise(resolve => setTimeout(resolve, 50));
      await engine.cancelTask(task.id);

      const result = await executionPromise;
      
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    beforeEach(async () => {
      const mockAgent = new MockAgent('test-agent-1', 'Test Agent');
      agentRegistry.registerAgent(mockAgent);
      await engine.start();
    });

    it('should handle agent execution failure', async () => {
      const mockAgent = agentRegistry.getAgent('test-agent-1') as MockAgent;
      mockAgent.setShouldFail(true);

      const task = await engine.submitTask({
        title: 'Failing Task',
        description: '',
      });

      const result = await engine.executeTask(task, mockAgent);

      expect(result.success).toBe(false);
      expect(result.logs[0]).toContain('Mock execution failure');
    });

    it('should track failed tasks in metrics', async () => {
      const mockAgent = agentRegistry.getAgent('test-agent-1') as MockAgent;
      mockAgent.setShouldFail(true);

      const task = await engine.submitTask({
        title: 'Failing Task',
        description: '',
      });

      await engine.executeTask(task, mockAgent);

      const metrics = engine.getMetrics();
      expect(metrics.tasksFailed).toBe(1);
    });
  });

  // ============================================
  // RETRY LOGIC TESTS
  // ============================================

  describe('Retry Logic', () => {
    it('should retry a failed task', async () => {
      const mockAgent = new MockAgent('test-agent-1', 'Test Agent');
      agentRegistry.registerAgent(mockAgent);

      // Create engine with auto-retry disabled for manual testing
      const task = await engine.submitTask({
        title: 'Retry Test',
        description: '',
      });

      // Mark as failed first
      await queue.updateStatus(task.id, 'failed');

      const retried = await engine.retryTask(task.id);
      
      expect(retried).toBeDefined();
      expect(retried?.status).toBe('queued');
      expect(retried?.retry_count).toBe(1);
    });

    it('should track retry count in metrics', async () => {
      const mockAgent = new MockAgent('test-agent-1', 'Test Agent');
      agentRegistry.registerAgent(mockAgent);

      const task = await engine.submitTask({
        title: 'Retry Test',
        description: '',
      });

      await queue.updateStatus(task.id, 'failed');
      await engine.retryTask(task.id);

      const metrics = engine.getMetrics();
      expect(metrics.tasksRetried).toBe(1);
    });

    it('should not retry non-failed tasks', async () => {
      const task = await engine.submitTask({
        title: 'Non-failed Task',
        description: '',
      });

      const retried = await engine.retryTask(task.id);
      
      expect(retried).toBeUndefined();
    });
  });

  // ============================================
  // AGENT MANAGEMENT TESTS
  // ============================================

  describe('Agent Management', () => {
    it('should find agent for task', async () => {
      const mockAgent = new MockAgent('test-agent-1', 'Test Agent');
      agentRegistry.registerAgent(mockAgent);

      const task: Task = {
        id: 'test-task',
        title: 'Test',
        description: '',
        status: 'queued',
        priority: 'high',
        assignee_agent_id: 'test-agent-1',
        creator_id: 'test',
        board_id: null,
        card_id: null,
        parent_task_id: null,
        dependencies: [],
        context: {},
        result: null,
        retry_count: 0,
        max_retries: 3,
        timeout_ms: 300000,
        started_at: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const found = engine.findAgentForTask(task);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe('test-agent-1');
    });

    it('should return agent statistics', async () => {
      const mockAgent = new MockAgent('test-agent-1', 'Test Agent');
      agentRegistry.registerAgent(mockAgent);

      const stats = engine.getAgentStats();
      
      expect(stats.total).toBe(1);
      expect(stats.available).toBe(1);
    });

    it('should get all agents', async () => {
      const mockAgent = new MockAgent('test-agent-1', 'Test Agent');
      agentRegistry.registerAgent(mockAgent);

      const agents = engine.getAgents();
      
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('test-agent-1');
    });
  });

  // ============================================
  // STATUS & METRICS TESTS
  // ============================================

  describe('Status & Metrics', () => {
    beforeEach(async () => {
      const mockAgent = new MockAgent('test-agent-1', 'Test Agent');
      agentRegistry.registerAgent(mockAgent);
      await engine.start();
    });

    it('should provide engine status', async () => {
      await engine.submitTask({ title: 'Task 1', description: '' });
      await engine.submitTask({ title: 'Task 2', description: '' });

      const status = engine.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.queueDepth).toBe(2);
      expect(status.agents.total).toBe(1);
    });

    it('should provide queue statistics', async () => {
      await engine.submitTask({ title: 'Task 1', description: '' });

      const stats = engine.getQueueStats();

      expect(stats.total).toBe(1);
      expect(stats.queued).toBe(1);
    });

    it('should calculate success rate', async () => {
      const mockAgent = agentRegistry.getAgent('test-agent-1') as MockAgent;

      // Execute one success and one failure
      const successTask = await engine.submitTask({ title: 'Success', description: '' });
      await engine.executeTask(successTask, mockAgent);

      mockAgent.setShouldFail(true);
      const failTask = await engine.submitTask({ title: 'Fail', description: '' });
      await engine.executeTask(failTask, mockAgent);

      const metrics = engine.getMetrics();
      expect(metrics.tasksCompleted).toBe(1);
      expect(metrics.tasksFailed).toBe(1);
      expect(metrics.successRate).toBe(0.5);
    });

    it('should support status subscriptions', async () => {
      const statusUpdates: any[] = [];
      const unsubscribe = engine.subscribeToStatus(status => {
        statusUpdates.push(status);
      });

      await engine.pause();

      expect(statusUpdates.length).toBeGreaterThan(0);
      expect(statusUpdates[statusUpdates.length - 1].isPaused).toBe(true);

      unsubscribe();
    });

    it('should support task event subscriptions', async () => {
      const events: { task: Task; event: string }[] = [];
      const unsubscribe = engine.subscribeToTasks((task, event) => {
        events.push({ task, event });
      });

      await engine.submitTask({ title: 'Test', description: '' });

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].event).toBe('submitted');

      unsubscribe();
    });
  });

  // ============================================
  // CANCELLATION TESTS
  // ============================================

  describe('Task Cancellation', () => {
    beforeEach(async () => {
      const mockAgent = new MockAgent('test-agent-1', 'Test Agent');
      agentRegistry.registerAgent(mockAgent);
      await engine.start();
    });

    it('should cancel a queued task', async () => {
      const task = await engine.submitTask({
        title: 'Cancel Test',
        description: '',
      });

      const cancelled = await engine.cancelTask(task.id);
      
      expect(cancelled).toBe(true);
      
      const updatedTask = engine.getTask(task.id);
      expect(updatedTask?.status).toBe('cancelled');
    });

    it('should return false for non-existent task', async () => {
      const cancelled = await engine.cancelTask('non-existent-id');
      expect(cancelled).toBe(false);
    });
  });

  // ============================================
  // CONFIGURATION TESTS
  // ============================================

  describe('Configuration', () => {
    it('should use custom configuration', async () => {
      const customEngine = new ExecutionEngine(undefined, undefined, {
        maxConcurrentTasks: 10,
        defaultTimeoutMs: 60000,
        defaultMaxRetries: 5,
        pollIntervalMs: 500,
        enableAutoRetry: true,
        enableMetrics: false,
      });

      const mockAgent = new MockAgent('test-agent-1', 'Test Agent');
      agentRegistry.registerAgent(mockAgent);

      await customEngine.start();

      const task = await customEngine.submitTask({
        title: 'Config Test',
        description: '',
      });

      expect(task.max_retries).toBe(5);
      expect(task.timeout_ms).toBe(60000);

      await customEngine.stop();
    });
  });
});
