import type { Task, TaskStatus, TaskStateTransition, StateMachineConfig } from '@/types'
import { TaskQueue } from './TaskQueue'

/**
 * TaskStateMachine - Manages task state transitions with validation
 * 
 * Features:
 * - Validated state transitions
 * - Transition hooks (before/after)
 * - Automatic state persistence
 * - History tracking
 * - Transition guards
 */
export class TaskStateMachine {
  private transitions: Map<string, TaskStateTransition[]> = new Map()
  private history: Map<string, Array<{ from: TaskStatus; to: TaskStatus; timestamp: string }>> = new Map()
  private onTransition?: StateMachineConfig['onTransition']
  private onError?: StateMachineConfig['onError']

  // Valid state transitions
  private static readonly DEFAULT_TRANSITIONS: TaskStateTransition[] = [
    // Pending transitions
    { from: 'pending', to: 'queued', action: 'queue' },
    { from: 'pending', to: 'cancelled', action: 'cancel' },
    
    // Queued transitions
    { from: 'queued', to: 'assigned', action: 'assign' },
    { from: 'queued', to: 'cancelled', action: 'cancel' },
    
    // Assigned transitions
    { from: 'assigned', to: 'running', action: 'start' },
    { from: 'assigned', to: 'queued', action: 'unassign' },
    { from: 'assigned', to: 'cancelled', action: 'cancel' },
    
    // Running transitions
    { from: 'running', to: 'paused', action: 'pause' },
    { from: 'running', to: 'completed', action: 'complete' },
    { from: 'running', to: 'failed', action: 'fail' },
    { from: 'running', to: 'cancelled', action: 'cancel' },
    
    // Paused transitions
    { from: 'paused', to: 'running', action: 'resume' },
    { from: 'paused', to: 'cancelled', action: 'cancel' },
    
    // Failed transitions
    { from: 'failed', to: 'retrying', action: 'retry' },
    { from: 'failed', to: 'cancelled', action: 'cancel' },
    
    // Retrying transitions
    { from: 'retrying', to: 'assigned', action: 'reassign' },
    { from: 'retrying', to: 'cancelled', action: 'cancel' },
    { from: 'retrying', to: 'failed', action: 'fail_retry' },
  ]

  constructor(config?: StateMachineConfig) {
    this.transitions = this.buildTransitionMap(
      config?.transitions || TaskStateMachine.DEFAULT_TRANSITIONS
    )
    this.onTransition = config?.onTransition
    this.onError = config?.onError
  }

  /**
   * Check if a state transition is valid
   */
  canTransition(task: Task, toStatus: TaskStatus): boolean {
    const transitions = this.transitions.get(task.status)
    if (!transitions) return false
    
    return transitions.some(t => t.to === toStatus)
  }

  /**
   * Get valid transition targets for a task
   */
  getValidTransitions(task: Task): TaskStatus[] {
    const transitions = this.transitions.get(task.status)
    if (!transitions) return []
    
    return transitions.map(t => t.to)
  }

  /**
   * Execute a state transition
   */
  async transition(
    task: Task, 
    toStatus: TaskStatus, 
    context?: any
  ): Promise<{ success: boolean; task: Task; error?: string }> {
    // Check if transition is valid
    if (!this.canTransition(task, toStatus)) {
      return {
        success: false,
        task,
        error: `Invalid transition from ${task.status} to ${toStatus}`,
      }
    }

    const transition = this.getTransition(task.status, toStatus)
    if (!transition) {
      return {
        success: false,
        task,
        error: `Transition not found from ${task.status} to ${toStatus}`,
      }
    }

    // Run validator if present
    if (transition.validator) {
      try {
        const isValid = await transition.validator(task, context)
        if (!isValid) {
          return {
            success: false,
            task,
            error: `Transition validation failed from ${task.status} to ${toStatus}`,
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown validation error'
        this.onError?.(task, error as Error)
        return {
          success: false,
          task,
          error: `Validation error: ${errorMessage}`,
        }
      }
    }

    const fromStatus = task.status
    const timestamp = new Date().toISOString()

    // Update task
    const updatedTask: Task = {
      ...task,
      status: toStatus,
      updated_at: timestamp,
    }

    // Track history
    this.trackHistory(task.id, fromStatus, toStatus, timestamp)

    // Call transition hook
    try {
      await this.onTransition?.(updatedTask, fromStatus, toStatus)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown transition error'
      this.onError?.(updatedTask, error as Error)
      return {
        success: false,
        task: updatedTask,
        error: `Transition hook error: ${errorMessage}`,
      }
    }

    return {
      success: true,
      task: updatedTask,
    }
  }

  /**
   * Queue a task (pending -> queued)
   */
  async queue(task: Task): Promise<{ success: boolean; task: Task; error?: string }> {
    return this.transition(task, 'queued')
  }

  /**
   * Assign a task to an agent (queued -> assigned)
   */
  async assign(task: Task, agentId: string): Promise<{ success: boolean; task: Task; error?: string }> {
    return this.transition(task, 'assigned', { agentId })
  }

  /**
   * Start task execution (assigned -> running)
   */
  async start(task: Task): Promise<{ success: boolean; task: Task; error?: string }> {
    return this.transition(task, 'running')
  }

  /**
   * Pause a running task (running -> paused)
   */
  async pause(task: Task): Promise<{ success: boolean; task: Task; error?: string }> {
    return this.transition(task, 'paused')
  }

  /**
   * Resume a paused task (paused -> running)
   */
  async resume(task: Task): Promise<{ success: boolean; task: Task; error?: string }> {
    return this.transition(task, 'running')
  }

  /**
   * Complete a task (running -> completed)
   */
  async complete(task: Task, result?: any): Promise<{ success: boolean; task: Task; error?: string }> {
    return this.transition(task, 'completed', { result })
  }

  /**
   * Mark task as failed (running -> failed)
   */
  async fail(task: Task, error?: string): Promise<{ success: boolean; task: Task; error?: string }> {
    return this.transition(task, 'failed', { error })
  }

  /**
   * Retry a failed task (failed -> retrying)
   */
  async retry(task: Task): Promise<{ success: boolean; task: Task; error?: string }> {
    return this.transition(task, 'retrying')
  }

  /**
   * Cancel a task (any active state -> cancelled)
   */
  async cancel(task: Task): Promise<{ success: boolean; task: Task; error?: string }> {
    return this.transition(task, 'cancelled')
  }

  /**
   * Get task state history
   */
  getHistory(taskId: string): Array<{ from: TaskStatus; to: TaskStatus; timestamp: string }> {
    return this.history.get(taskId) || []
  }

  /**
   * Get current state for a task
   */
  getCurrentState(task: Task): TaskStatus {
    return task.status
  }

  /**
   * Check if task is in a terminal state
   */
  isTerminalState(status: TaskStatus): boolean {
    return ['completed', 'failed', 'cancelled'].includes(status)
  }

  /**
   * Check if task is in an active state (can be worked on)
   */
  isActiveState(status: TaskStatus): boolean {
    return ['assigned', 'running', 'paused'].includes(status)
  }

  /**
   * Check if task can be cancelled
   */
  canCancel(task: Task): boolean {
    return !this.isTerminalState(task.status)
  }

  /**
   * Get action name for a transition
   */
  getActionName(from: TaskStatus, to: TaskStatus): string | undefined {
    const transition = this.getTransition(from, to)
    return transition?.action
  }

  // Private methods

  private buildTransitionMap(transitions: TaskStateTransition[]): Map<string, TaskStateTransition[]> {
    const map = new Map<string, TaskStateTransition[]>()
    
    for (const transition of transitions) {
      const key = transition.from
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(transition)
    }
    
    return map
  }

  private getTransition(from: TaskStatus, to: TaskStatus): TaskStateTransition | undefined {
    const transitions = this.transitions.get(from)
    if (!transitions) return undefined
    
    return transitions.find(t => t.to === to)
  }

  private trackHistory(
    taskId: string, 
    from: TaskStatus, 
    to: TaskStatus, 
    timestamp: string
  ): void {
    if (!this.history.has(taskId)) {
      this.history.set(taskId, [])
    }
    
    this.history.get(taskId)!.push({ from, to, timestamp })
  }
}

/**
 * TaskStateManager - Combines TaskQueue and TaskStateMachine
 * 
 * Provides a unified interface for task management with state machine validation
 */
export class TaskStateManager {
  private queue: TaskQueue
  private stateMachine: TaskStateMachine

  constructor(queue?: TaskQueue, config?: StateMachineConfig) {
    this.queue = queue || new TaskQueue()
    this.stateMachine = new TaskStateMachine(config)
  }

  /**
   * Submit a new task (adds to queue and transitions to queued)
   */
  async submitTask(task: { title: string; description: string } & Partial<import('@/types').TaskCreate>): Promise<Task> {
    const newTask = this.queue.add(task)
    
    const result = await this.stateMachine.queue(newTask)
    if (!result.success) {
      throw new Error(`Failed to queue task: ${result.error}`)
    }
    
    this.queue.updateStatus(newTask.id, 'queued')
    
    return this.queue.get(newTask.id)!
  }

  /**
   * Get the next task for execution
   */
  getNextTask(): Task | undefined {
    return this.queue.dequeue()
  }

  /**
   * Start executing a task
   */
  async startTask(taskId: string): Promise<Task | undefined> {
    const task = this.queue.get(taskId)
    if (!task) return undefined

    const result = await this.stateMachine.start(task)
    if (result.success) {
      return this.queue.updateStatus(taskId, 'running', {
        started_at: new Date().toISOString(),
      })
    }
    
    return task
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, result: import('@/types').TaskResult): Promise<Task | undefined> {
    const task = this.queue.get(taskId)
    if (!task) return undefined

    const transitionResult = await this.stateMachine.complete(task, result)
    if (transitionResult.success) {
      return this.queue.setResult(taskId, result)
    }
    
    return task
  }

  /**
   * Fail a task
   */
  async failTask(taskId: string, errorMessage: string): Promise<Task | undefined> {
    const task = this.queue.get(taskId)
    if (!task) return undefined

    const result = await this.stateMachine.fail(task, errorMessage)
    if (result.success) {
      return this.queue.updateStatus(taskId, 'failed')
    }
    
    return task
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<Task | undefined> {
    const task = this.queue.get(taskId)
    if (!task) return undefined

    const result = await this.stateMachine.cancel(task)
    if (result.success) {
      return this.queue.cancel(taskId)
    }
    
    return task
  }

  /**
   * Get task state history
   */
  getTaskHistory(taskId: string): Array<{ from: string; to: string; timestamp: string }> {
    return this.stateMachine.getHistory(taskId)
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return this.queue.getStats()
  }

  /**
   * Get underlying queue
   */
  getQueue(): TaskQueue {
    return this.queue
  }

  /**
   * Get underlying state machine
   */
  getStateMachine(): TaskStateMachine {
    return this.stateMachine
  }
}

// Export singleton instance
export const taskStateMachine = new TaskStateMachine()
export const taskStateManager = new TaskStateManager()
