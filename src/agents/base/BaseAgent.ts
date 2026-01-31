/**
 * Base Agent Framework
 * 
 * Abstract base class for all agents in the Ares system.
 * Provides lifecycle management, capability tracking, and execution hooks.
 */

import { Agent, AgentStatus, Task, TaskResult, AgentConfig } from '@/types/agent';

export interface TaskAnalysis {
  complexity: 'low' | 'medium' | 'high';
  estimatedDuration: number; // minutes
  requiredCapabilities: string[];
  risks: string[];
  recommendations: string[];
}

export interface ExecutionPlan {
  phases: ExecutionPhase[];
  estimatedDuration: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface ExecutionPhase {
  order: number;
  description: string;
  agentType: string;
  estimatedDuration: number;
  dependencies: number[];
}

export interface ErrorRecovery {
  strategy: 'retry' | 'delegate' | 'fail' | 'pause';
  reason: string;
  nextAgentId?: string;
  retryDelay?: number;
}

export abstract class BaseAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly type: string;
  protected _status: AgentStatus = 'idle';
  protected _currentTask?: Task;
  protected readonly capabilities: string[];
  protected readonly config: AgentConfig;
  
  // Statistics tracking
  protected stats = {
    tasksCompleted: 0,
    tasksFailed: 0,
    totalExecutionTime: 0,
    avgExecutionTime: 0,
  };

  constructor(
    id: string,
    name: string,
    type: string,
    capabilities: string[],
    config: AgentConfig
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.capabilities = capabilities;
    this.config = {
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 300,
      retryAttempts: 3,
      ...config,
    };
  }

  // ============================================
  // GETTERS
  // ============================================

  get status(): AgentStatus {
    return this._status;
  }

  get currentTask(): Task | undefined {
    return this._currentTask;
  }

  get isBusy(): boolean {
    return this._status === 'busy';
  }

  get isAvailable(): boolean {
    return this._status === 'idle';
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.tasksCompleted > 0
        ? this.stats.tasksCompleted / (this.stats.tasksCompleted + this.stats.tasksFailed)
        : 0,
    };
  }

  hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }

  hasAllCapabilities(capabilities: string[]): boolean {
    return capabilities.every(cap => this.capabilities.includes(cap));
  }

  // ============================================
  // ABSTRACT METHODS (must be implemented)
  // ============================================

  /**
   * Execute a task
   * This is the main work method that each agent must implement
   */
  abstract execute(task: Task): Promise<TaskResult>;

  /**
   * Analyze a task description to determine complexity and approach
   */
  abstract analyze(taskDescription: string): Promise<TaskAnalysis>;

  /**
   * Create an execution plan for a task
   */
  abstract plan(task: Task): Promise<ExecutionPlan>;

  // ============================================
  // LIFECYCLE HOOKS (can be overridden)
  // ============================================

  /**
   * Called when agent starts working on a task
   */
  async onStart(task: Task): Promise<void> {
    this._status = 'busy';
    this._currentTask = task;
    console.log(`[${this.name}] Starting task: ${task.title}`);
  }

  /**
   * Called when agent successfully completes a task
   */
  async onComplete(result: TaskResult): Promise<void> {
    this._status = 'idle';
    this._currentTask = undefined;
    this.stats.tasksCompleted++;
    
    if (result.metadata?.executionTime) {
      this.stats.totalExecutionTime += result.metadata.executionTime as number;
      this.stats.avgExecutionTime = this.stats.totalExecutionTime / this.stats.tasksCompleted;
    }
    
    console.log(`[${this.name}] Task completed successfully`);
  }

  /**
   * Called when agent encounters an error
   */
  async onError(error: Error): Promise<ErrorRecovery> {
    this.stats.tasksFailed++;
    console.error(`[${this.name}] Error:`, error.message);
    
    // Default recovery strategy: retry up to configured attempts
    return {
      strategy: 'retry',
      reason: error.message,
      retryDelay: 5000, // 5 seconds
    };
  }

  /**
   * Called when agent is paused
   */
  async onPause(): Promise<void> {
    if (this._status === 'busy') {
      this._status = 'paused';
      console.log(`[${this.name}] Paused`);
    }
  }

  /**
   * Called when agent is resumed from pause
   */
  async onResume(): Promise<void> {
    if (this._status === 'paused') {
      this._status = 'busy';
      console.log(`[${this.name}] Resumed`);
    }
  }

  /**
   * Called when agent is going offline
   */
  async onOffline(): Promise<void> {
    this._status = 'offline';
    console.log(`[${this.name}] Going offline`);
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Main entry point for task execution with lifecycle management
   */
  async runTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.config.retryAttempts!) {
      try {
        // Lifecycle: Start
        await this.onStart(task);

        // Execute with timeout
        const result = await this.executeWithTimeout(task);
        
        // Lifecycle: Complete
        result.metadata = {
          ...result.metadata,
          executionTime: (Date.now() - startTime) / 1000,
          attempts: attempts + 1,
          agentId: this.id,
          agentName: this.name,
        };
        
        await this.onComplete(result);
        return result;

      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        console.error(`[${this.name}] Attempt ${attempts} failed:`, lastError.message);
        
        // Lifecycle: Error
        const recovery = await this.onError(lastError);
        
        switch (recovery.strategy) {
          case 'retry':
            if (attempts < this.config.retryAttempts!) {
              console.log(`[${this.name}] Retrying in ${recovery.retryDelay}ms...`);
              await this.delay(recovery.retryDelay || 5000);
              continue;
            }
            break;
            
          case 'delegate':
            return {
              success: false,
              output: `Task failed and delegated to ${recovery.nextAgentId}`,
              errors: [lastError.message],
              metadata: {
                delegatedTo: recovery.nextAgentId,
                attempts,
              },
            };
            
          case 'pause':
            await this.onPause();
            return {
              success: false,
              output: 'Task paused due to error',
              errors: [lastError.message],
              metadata: { paused: true },
            };
            
          case 'fail':
          default:
            this._status = 'idle';
            this._currentTask = undefined;
            return {
              success: false,
              output: 'Task failed after all retry attempts',
              errors: [lastError.message],
              metadata: { attempts },
            };
        }
      }
    }

    // All attempts exhausted
    this._status = 'idle';
    this._currentTask = undefined;
    return {
      success: false,
      output: 'Task failed after maximum retry attempts',
      errors: lastError ? [lastError.message] : ['Unknown error'],
      metadata: { attempts },
    };
  }

  /**
   * Pause the agent's current work
   */
  async pause(): Promise<void> {
    await this.onPause();
  }

  /**
   * Resume the agent's work
   */
  async resume(): Promise<void> {
    await this.onResume();
  }

  /**
   * Take the agent offline
   */
  async goOffline(): Promise<void> {
    if (this._status === 'busy') {
      throw new Error('Cannot go offline while busy');
    }
    await this.onOffline();
  }

  /**
   * Bring the agent back online
   */
  async goOnline(): Promise<void> {
    if (this._status === 'offline') {
      this._status = 'idle';
      console.log(`[${this.name}] Back online`);
    }
  }

  // ============================================
  // PROTECTED METHODS
  // ============================================

  /**
   * Execute task with timeout
   */
  protected async executeWithTimeout(task: Task): Promise<TaskResult> {
    const timeoutMs = (this.config.timeout || 300) * 1000;
    
    return Promise.race([
      this.execute(task),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Task execution timed out')), timeoutMs)
      ),
    ]);
  }

  /**
   * Delay helper
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log helper with agent prefix
   */
  protected log(message: string, ...args: unknown[]): void {
    console.log(`[${this.name}] ${message}`, ...args);
  }

  /**
   * Error log helper
   */
  protected error(message: string, error?: Error): void {
    console.error(`[${this.name}] ${message}`, error?.message || '');
  }

  /**
   * Convert agent to plain object for serialization
   */
  toJSON(): Agent {
    return {
      id: this.id,
      name: this.name,
      type: this.type as Agent['type'],
      status: this._status,
      capabilities: this.capabilities,
      config: { ...this.config } as Record<string, unknown>,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
