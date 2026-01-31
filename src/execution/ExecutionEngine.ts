/**
 * Execution Engine
 * 
 * Core execution engine that manages the agent pool, task queue, and state machine.
 * Coordinates task execution with timeout handling, retries, and error recovery.
 */

import { BaseAgent } from '@/agents/base/BaseAgent';
import { agentRegistry } from '@/agents/registry';
import { TaskQueue } from './TaskQueue';
import { TaskStateMachine, TaskStateManager } from './TaskStateMachine';
import type { Task, TaskCreate, TaskResult, TaskStatus } from '@/types';
import type { Agent, Task as AgentTask, TaskResult as AgentTaskResult } from '@/types/agent';

/**
 * Execution engine status
 */
export interface EngineStatus {
  isRunning: boolean;
  isPaused: boolean;
  queueDepth: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  agents: {
    total: number;
    idle: number;
    busy: number;
    paused: number;
    offline: number;
  };
  startedAt?: string;
  uptime: number; // milliseconds
}

/**
 * Execution metrics for monitoring
 */
export interface ExecutionMetrics {
  tasksSubmitted: number;
  tasksCompleted: number;
  tasksFailed: number;
  tasksRetried: number;
  avgExecutionTime: number;
  successRate: number;
}

/**
 * Execution engine configuration
 */
export interface ExecutionEngineConfig {
  maxConcurrentTasks: number;
  defaultTimeoutMs: number;
  defaultMaxRetries: number;
  pollIntervalMs: number;
  enableAutoRetry: boolean;
  enableMetrics: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ExecutionEngineConfig = {
  maxConcurrentTasks: 5,
  defaultTimeoutMs: 300000, // 5 minutes
  defaultMaxRetries: 3,
  pollIntervalMs: 1000, // 1 second
  enableAutoRetry: true,
  enableMetrics: true,
};

/**
 * Execution Engine - Core task execution coordinator
 * 
 * Manages:
 * - Agent pool lifecycle
 * - Task queue processing
 * - Task execution with timeouts
 * - Error handling and retries
 * - Engine state management
 */
export class ExecutionEngine {
  private queue: TaskQueue;
  private stateMachine: TaskStateMachine;
  private stateManager: TaskStateManager;
  private config: ExecutionEngineConfig;
  
  // Engine state
  private isRunning = false;
  private isPaused = false;
  private startedAt?: Date;
  private pollTimer?: NodeJS.Timeout;
  private activeExecutions = new Map<string, AbortController>();
  
  // Metrics
  private metrics: ExecutionMetrics = {
    tasksSubmitted: 0,
    tasksCompleted: 0,
    tasksFailed: 0,
    tasksRetried: 0,
    avgExecutionTime: 0,
    successRate: 0,
  };
  
  // Event listeners
  private statusListeners = new Set<(status: EngineStatus) => void>();
  private taskListeners = new Set<(task: Task, event: string) => void>();

  constructor(
    queue?: TaskQueue,
    stateMachine?: TaskStateMachine,
    config?: Partial<ExecutionEngineConfig>
  ) {
    this.queue = queue || new TaskQueue();
    this.stateMachine = stateMachine || new TaskStateMachine();
    this.stateManager = new TaskStateManager(this.queue, {
      onTransition: this.handleStateTransition.bind(this),
      onError: this.handleStateError.bind(this),
    });
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================

  /**
   * Start the execution engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[ExecutionEngine] Already running');
      return;
    }

    console.log('[ExecutionEngine] Starting...');
    
    this.isRunning = true;
    this.isPaused = false;
    this.startedAt = new Date();
    
    // Initialize agent pool
    this.initializeAgentPool();
    
    // Start queue processor
    this.startQueueProcessor();
    
    this.notifyStatusListeners();
    console.log('[ExecutionEngine] Started successfully');
  }

  /**
   * Pause the execution engine
   * Prevents new task execution but allows current tasks to complete
   */
  async pause(): Promise<void> {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    console.log('[ExecutionEngine] Pausing...');
    this.isPaused = true;
    
    // Pause all idle agents
    const agents = agentRegistry.getAllAgents();
    for (const agent of agents) {
      if (agent.status === 'idle') {
        await agent.pause();
      }
    }
    
    this.notifyStatusListeners();
    console.log('[ExecutionEngine] Paused');
  }

  /**
   * Resume the execution engine
   */
  async resume(): Promise<void> {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    console.log('[ExecutionEngine] Resuming...');
    this.isPaused = false;
    
    // Resume paused agents
    const agents = agentRegistry.getAllAgents();
    for (const agent of agents) {
      if (agent.status === 'paused') {
        await agent.resume();
      }
    }
    
    this.notifyStatusListeners();
    console.log('[ExecutionEngine] Resumed');
  }

  /**
   * Stop the execution engine
   * Gracefully shuts down, waiting for active tasks or aborting them
   */
  async stop(options?: { force?: boolean; timeout?: number }): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('[ExecutionEngine] Stopping...');
    
    // Stop queue processor
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    
    // Handle active executions
    if (options?.force) {
      // Abort all active tasks
      for (const [taskId, controller] of this.activeExecutions) {
        console.log(`[ExecutionEngine] Aborting task: ${taskId}`);
        controller.abort();
      }
      this.activeExecutions.clear();
    } else {
      // Wait for active tasks to complete
      const timeout = options?.timeout || 30000; // 30 seconds default
      const startTime = Date.now();
      
      while (this.activeExecutions.size > 0 && Date.now() - startTime < timeout) {
        console.log(`[ExecutionEngine] Waiting for ${this.activeExecutions.size} active tasks...`);
        await this.delay(1000);
      }
      
      if (this.activeExecutions.size > 0) {
        console.warn(`[ExecutionEngine] ${this.activeExecutions.size} tasks did not complete in time, aborting`);
        for (const [taskId, controller] of this.activeExecutions) {
          controller.abort();
        }
        this.activeExecutions.clear();
      }
    }
    
    this.isRunning = false;
    this.isPaused = false;
    this.startedAt = undefined;
    
    this.notifyStatusListeners();
    console.log('[ExecutionEngine] Stopped');
  }

  /**
   * Check if the engine is running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Check if the engine is paused
   */
  get paused(): boolean {
    return this.isPaused;
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  /**
   * Submit a new task for execution
   */
  async submitTask(task: TaskCreate): Promise<Task> {
    console.log(`[ExecutionEngine] Submitting task: ${task.title}`);
    
    // Set defaults
    const taskWithDefaults: TaskCreate = {
      ...task,
      max_retries: task.max_retries ?? this.config.defaultMaxRetries,
      timeout_ms: task.timeout_ms ?? this.config.defaultTimeoutMs,
    };
    
    // Submit to state manager (adds to queue and sets to queued)
    const newTask = await this.stateManager.submitTask(taskWithDefaults);
    
    this.metrics.tasksSubmitted++;
    this.updateMetrics();
    this.notifyTaskListeners(newTask, 'submitted');
    
    return newTask;
  }

  /**
   * Get the next task from the queue
   */
  getNextTask(): Task | undefined {
    return this.stateManager.getNextTask();
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.queue.get(taskId);
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    console.log(`[ExecutionEngine] Cancelling task: ${taskId}`);
    
    const task = this.queue.get(taskId);
    if (!task) {
      return false;
    }
    
    // Abort if currently executing
    const controller = this.activeExecutions.get(taskId);
    if (controller) {
      controller.abort();
      this.activeExecutions.delete(taskId);
    }
    
    const cancelled = await this.stateManager.cancelTask(taskId);
    if (cancelled) {
      this.notifyTaskListeners(cancelled, 'cancelled');
    }
    
    return !!cancelled;
  }

  /**
   * Retry a failed task
   */
  async retryTask(taskId: string): Promise<Task | undefined> {
    console.log(`[ExecutionEngine] Retrying task: ${taskId}`);
    
    const task = this.queue.get(taskId);
    if (!task || task.status !== 'failed') {
      return undefined;
    }
    
    const retried = this.queue.retry(taskId);
    if (retried) {
      this.metrics.tasksRetried++;
      this.updateMetrics();
      this.notifyTaskListeners(retried, 'retried');
    }
    
    return retried;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return this.queue.getAll();
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.queue.getByStatus(status);
  }

  // ============================================
  // TASK EXECUTION
  // ============================================

  /**
   * Execute a task with a specific agent
   */
  async executeTask(task: Task, agent: BaseAgent): Promise<TaskResult> {
    const taskId = task.id;
    const startTime = Date.now();
    
    console.log(`[ExecutionEngine] Executing task ${taskId} with agent ${agent.name}`);
    
    // Create abort controller for this execution
    const controller = new AbortController();
    this.activeExecutions.set(taskId, controller);
    
    try {
      // Start the task
      await this.stateManager.startTask(taskId);
      this.notifyTaskListeners(this.queue.get(taskId)!, 'started');
      
      // Execute with timeout and abort signal
      const timeoutMs = task.timeout_ms || this.config.defaultTimeoutMs;
      const result = await this.executeWithTimeout(agent, task, timeoutMs, controller.signal);
      
      // Complete the task
      await this.stateManager.completeTask(taskId, result);
      
      if (result.success) {
        this.metrics.tasksCompleted++;
        this.notifyTaskListeners(this.queue.get(taskId)!, 'completed');
      } else {
        this.metrics.tasksFailed++;
        this.handleTaskFailure(taskId, result);
        this.notifyTaskListeners(this.queue.get(taskId)!, 'failed');
      }
      
      // Update execution time metrics
      const executionTime = Date.now() - startTime;
      this.updateExecutionTimeMetrics(executionTime);
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ExecutionEngine] Task ${taskId} failed:`, errorMessage);
      
      // Mark as failed
      const result: TaskResult = {
        success: false,
        output: '',
        artifacts: {
          error: errorMessage,
          aborted: controller.signal.aborted,
        },
        execution_time_ms: Date.now() - startTime,
        logs: [`Task failed: ${errorMessage}`],
      };
      
      await this.stateManager.failTask(taskId, errorMessage);
      this.metrics.tasksFailed++;
      this.handleTaskFailure(taskId, result);
      this.notifyTaskListeners(this.queue.get(taskId)!, 'failed');
      
      return result;
      
    } finally {
      this.activeExecutions.delete(taskId);
      this.updateMetrics();
    }
  }

  /**
   * Execute task with timeout and abort support
   */
  private async executeWithTimeout(
    agent: BaseAgent,
    task: Task,
    timeoutMs: number,
    signal: AbortSignal
  ): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Task execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      // Set up abort handler
      const abortHandler = () => {
        clearTimeout(timeoutId);
        reject(new Error('Task execution aborted'));
      };
      
      if (signal.aborted) {
        abortHandler();
        return;
      }
      
      signal.addEventListener('abort', abortHandler);
      
      // Execute task (convert Task to AgentTask)
      const agentTask: AgentTask = {
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status as any,
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
      
      agent.runTask(agentTask)
        .then((result: AgentTaskResult) => {
          clearTimeout(timeoutId);
          signal.removeEventListener('abort', abortHandler);
          // Convert AgentTaskResult to TaskResult
          const taskResult: TaskResult = {
            success: result.success,
            output: result.output,
            artifacts: result.fileChanges ? { fileChanges: result.fileChanges } : result.metadata,
            execution_time_ms: result.metadata?.executionTime ? (result.metadata.executionTime as number) * 1000 : 0,
            logs: result.errors || [],
          };
          resolve(taskResult);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }

  /**
   * Handle task failure (retry logic)
   */
  private async handleTaskFailure(taskId: string, result: TaskResult): Promise<void> {
    const task = this.queue.get(taskId);
    if (!task) return;
    
    // Check if we should retry
    if (this.config.enableAutoRetry && task.retry_count < task.max_retries) {
      console.log(`[ExecutionEngine] Task ${taskId} will be retried (${task.retry_count + 1}/${task.max_retries})`);
      
      // Delay before retry
      const retryDelay = Math.pow(2, task.retry_count) * 1000; // Exponential backoff
      await this.delay(retryDelay);
      
      // Retry if engine is still running
      if (this.isRunning) {
        await this.retryTask(taskId);
      }
    }
  }

  // ============================================
  // AGENT MANAGEMENT
  // ============================================

  /**
   * Initialize the agent pool
   */
  private initializeAgentPool(): void {
    // Use the global agent registry
    const stats = agentRegistry.getAgentStats();
    
    if (stats.total === 0) {
      console.log('[ExecutionEngine] Initializing default agent pool');
      agentRegistry.initializeDefaultAgents();
    } else {
      console.log(`[ExecutionEngine] Using existing agent pool (${stats.total} agents)`);
    }
  }

  /**
   * Find the best available agent for a task
   */
  findAgentForTask(task: Task): BaseAgent | undefined {
    // If task has assigned agent, use that
    if (task.assignee_agent_id) {
      const agent = agentRegistry.getAgent(task.assignee_agent_id);
      if (agent && agent.isAvailable) {
        return agent;
      }
    }
    
    // Otherwise find by capability or type
    // For now, find any available agent
    const available = agentRegistry.getAvailableAgents();
    
    if (available.length === 0) {
      return undefined;
    }
    
    // Prefer agents based on task requirements (could be more sophisticated)
    // Return first available for now
    return available[0];
  }

  /**
   * Get all registered agents
   */
  getAgents(): Agent[] {
    return agentRegistry.toJSON();
  }

  /**
   * Get agent statistics
   */
  getAgentStats() {
    return agentRegistry.getAgentStats();
  }

  // ============================================
  // QUEUE PROCESSOR
  // ============================================

  /**
   * Start the queue processor loop
   */
  private startQueueProcessor(): void {
    this.pollTimer = setInterval(async () => {
      if (!this.isRunning || this.isPaused) {
        return;
      }
      
      // Check if we can start more tasks
      if (this.activeExecutions.size >= this.config.maxConcurrentTasks) {
        return;
      }
      
      // Get next task
      const task = this.getNextTask();
      if (!task) {
        return;
      }
      
      // Find available agent
      const agent = this.findAgentForTask(task);
      if (!agent) {
        // No agent available, re-queue the task
        console.log(`[ExecutionEngine] No agent available for task ${task.id}, re-queueing`);
        return;
      }
      
      // Execute task (don't await, run in background)
      this.executeTask(task, agent).catch(error => {
        console.error(`[ExecutionEngine] Unexpected error executing task:`, error);
      });
      
    }, this.config.pollIntervalMs);
  }

  // ============================================
  // STATUS & METRICS
  // ============================================

  /**
   * Get current engine status
   */
  getStatus(): EngineStatus {
    const agentStats = agentRegistry.getAgentStats();
    const queueStats = this.queue.getStats();
    
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      queueDepth: queueStats.queued + queueStats.pending,
      activeTasks: this.activeExecutions.size,
      completedTasks: queueStats.completed,
      failedTasks: queueStats.failed,
      agents: {
        total: agentStats.total,
        idle: agentStats.available,
        busy: agentStats.busy,
        paused: agentRegistry.getAllAgents().filter(a => a.status === 'paused').length,
        offline: agentStats.offline,
      },
      startedAt: this.startedAt?.toISOString(),
      uptime: this.startedAt ? Date.now() - this.startedAt.getTime() : 0,
    };
  }

  /**
   * Get execution metrics
   */
  getMetrics(): ExecutionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.queue.getStats();
  }

  /**
   * Subscribe to status changes
   */
  subscribeToStatus(listener: (status: EngineStatus) => void): () => void {
    this.statusListeners.add(listener);
    // Call immediately with current status
    listener(this.getStatus());
    
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Subscribe to task events
   */
  subscribeToTasks(listener: (task: Task, event: string) => void): () => void {
    this.taskListeners.add(listener);
    
    return () => {
      this.taskListeners.delete(listener);
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private handleStateTransition(task: Task, from: TaskStatus, to: TaskStatus): void {
    console.log(`[ExecutionEngine] Task ${task.id} transitioned: ${from} -> ${to}`);
    this.notifyTaskListeners(task, `transition:${from}->${to}`);
  }

  private handleStateError(task: Task, error: Error): void {
    console.error(`[ExecutionEngine] State error for task ${task.id}:`, error.message);
    this.notifyTaskListeners(task, 'error');
  }

  private notifyStatusListeners(): void {
    const status = this.getStatus();
    this.statusListeners.forEach(listener => listener(status));
  }

  private notifyTaskListeners(task: Task, event: string): void {
    this.taskListeners.forEach(listener => listener(task, event));
  }

  private updateMetrics(): void {
    const total = this.metrics.tasksCompleted + this.metrics.tasksFailed;
    this.metrics.successRate = total > 0 ? this.metrics.tasksCompleted / total : 0;
    this.notifyStatusListeners();
  }

  private updateExecutionTimeMetrics(executionTime: number): void {
    const total = this.metrics.tasksCompleted + this.metrics.tasksFailed;
    const currentAvg = this.metrics.avgExecutionTime;
    this.metrics.avgExecutionTime = (currentAvg * (total - 1) + executionTime) / total;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const executionEngine = new ExecutionEngine();
