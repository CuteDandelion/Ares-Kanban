import type { Task, TaskCreate, TaskStatus, TaskPriority, TaskResult, TaskQueueStats, TaskFilter } from '@/types'

/**
 * TaskQueue - Priority-based task queue for agent task management
 * 
 * Features:
 * - Priority-based ordering (critical > high > medium > low)
 * - Task status tracking
 * - Dependency management
 * - Statistics and filtering
 * - In-memory storage (can be extended to persistent storage)
 */
export class TaskQueue {
  private tasks: Map<string, Task> = new Map()
  private queue: string[] = [] // Ordered list of task IDs
  private listeners: Set<(stats: TaskQueueStats) => void> = new Set()

  /**
   * Add a new task to the queue
   */
  add(task: TaskCreate): Task {
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const newTask: Task = {
      id,
      title: task.title,
      description: task.description,
      status: 'pending',
      priority: task.priority || 'medium',
      assignee_agent_id: task.assignee_agent_id || null,
      creator_id: 'system', // Should be set by caller
      board_id: task.board_id || null,
      card_id: task.card_id || null,
      parent_task_id: task.parent_task_id || null,
      dependencies: task.dependencies || [],
      context: task.context || {},
      result: null,
      retry_count: 0,
      max_retries: task.max_retries || 3,
      timeout_ms: task.timeout_ms || 300000, // 5 minutes default
      started_at: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    }

    this.tasks.set(id, newTask)
    this.insertIntoQueue(id, newTask.priority)
    this.notifyListeners()
    
    return newTask
  }

  /**
   * Get a task by ID
   */
  get(id: string): Task | undefined {
    return this.tasks.get(id)
  }

  /**
   * Get the next task from the queue (highest priority, respecting dependencies)
   */
  dequeue(): Task | undefined {
    // Find first task in queue that has all dependencies satisfied
    for (const taskId of this.queue) {
      const task = this.tasks.get(taskId)
      if (task && this.canExecute(task)) {
        this.queue = this.queue.filter(id => id !== taskId)
        return task
      }
    }
    return undefined
  }

  /**
   * Peek at the next task without removing it
   */
  peek(): Task | undefined {
    for (const taskId of this.queue) {
      const task = this.tasks.get(taskId)
      if (task && this.canExecute(task)) {
        return task
      }
    }
    return undefined
  }

  /**
   * Update a task's status
   */
  updateStatus(id: string, status: TaskStatus, updates?: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id)
    if (!task) return undefined

    const updatedTask: Task = {
      ...task,
      status,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // Track timestamps
    if (status === 'running' && !updatedTask.started_at) {
      updatedTask.started_at = updatedTask.updated_at
    }
    if (['completed', 'failed', 'cancelled'].includes(status)) {
      updatedTask.completed_at = updatedTask.updated_at
    }

    this.tasks.set(id, updatedTask)
    this.notifyListeners()
    
    return updatedTask
  }

  /**
   * Update task result
   */
  setResult(id: string, result: TaskResult): Task | undefined {
    const task = this.tasks.get(id)
    if (!task) return undefined

    const updatedTask: Task = {
      ...task,
      result,
      status: result.success ? 'completed' : 'failed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (!result.success) {
      updatedTask.retry_count = task.retry_count + 1
      if (updatedTask.retry_count < updatedTask.max_retries) {
        updatedTask.status = 'retrying'
        // Re-queue for retry
        this.insertIntoQueue(id, updatedTask.priority)
      }
    }

    this.tasks.set(id, updatedTask)
    this.notifyListeners()
    
    return updatedTask
  }

  /**
   * Remove a task from the queue
   */
  remove(id: string): boolean {
    const existed = this.tasks.delete(id)
    if (existed) {
      this.queue = this.queue.filter(taskId => taskId !== id)
      this.notifyListeners()
    }
    return existed
  }

  /**
   * Cancel a task
   */
  cancel(id: string): Task | undefined {
    return this.updateStatus(id, 'cancelled')
  }

  /**
   * Retry a failed task
   */
  retry(id: string): Task | undefined {
    const task = this.tasks.get(id)
    if (!task || !['failed', 'cancelled'].includes(task.status)) {
      return undefined
    }

    const updatedTask: Task = {
      ...task,
      status: 'queued',
      retry_count: task.retry_count + 1,
      updated_at: new Date().toISOString(),
    }

    this.tasks.set(id, updatedTask)
    this.insertIntoQueue(id, updatedTask.priority)
    this.notifyListeners()
    
    return updatedTask
  }

  /**
   * Get all tasks
   */
  getAll(): Task[] {
    return Array.from(this.tasks.values())
  }

  /**
   * Get tasks by status
   */
  getByStatus(status: TaskStatus): Task[] {
    return this.getAll().filter(task => task.status === status)
  }

  /**
   * Get tasks by priority
   */
  getByPriority(priority: TaskPriority): Task[] {
    return this.getAll().filter(task => task.priority === priority)
  }

  /**
   * Get tasks by assignee
   */
  getByAssignee(agentId: string): Task[] {
    return this.getAll().filter(task => task.assignee_agent_id === agentId)
  }

  /**
   * Filter tasks
   */
  filter(filter: TaskFilter): Task[] {
    return this.getAll().filter(task => {
      if (filter.status && task.status !== filter.status) return false
      if (filter.priority && task.priority !== filter.priority) return false
      if (filter.assignee_agent_id && task.assignee_agent_id !== filter.assignee_agent_id) return false
      if (filter.board_id && task.board_id !== filter.board_id) return false
      return true
    })
  }

  /**
   * Get queue statistics
   */
  getStats(): TaskQueueStats {
    const tasks = this.getAll()
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      queued: tasks.filter(t => t.status === 'queued').length,
      assigned: tasks.filter(t => t.status === 'assigned').length,
      running: tasks.filter(t => t.status === 'running').length,
      paused: tasks.filter(t => t.status === 'paused').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      retrying: tasks.filter(t => t.status === 'retrying').length,
    }
  }

  /**
   * Check if all dependencies are satisfied for a task
   */
  areDependenciesMet(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.dependencies.length === 0) return true

    return task.dependencies.every(depId => {
      const dep = this.tasks.get(depId)
      return dep?.status === 'completed'
    })
  }

  /**
   * Get tasks ready for execution (dependencies met)
   */
  getReadyTasks(): Task[] {
    return this.getAll().filter(task => 
      ['pending', 'queued'].includes(task.status) && this.canExecute(task)
    )
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.tasks.clear()
    this.queue = []
    this.notifyListeners()
  }

  /**
   * Subscribe to queue statistics changes
   */
  subscribe(listener: (stats: TaskQueueStats) => void): () => void {
    this.listeners.add(listener)
    // Call immediately with current stats
    listener(this.getStats())
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Get queue length (number of queued tasks)
   */
  get length(): number {
    return this.queue.length
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0
  }

  // Private methods

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private canExecute(task: Task): boolean {
    return this.areDependenciesMet(task.id)
  }

  private priorityWeight(priority: TaskPriority): number {
    const weights: Record<TaskPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    }
    return weights[priority]
  }

  private insertIntoQueue(taskId: string, priority: TaskPriority): void {
    const weight = this.priorityWeight(priority)
    
    // Insert in priority order (higher priority first)
    let inserted = false
    for (let i = 0; i < this.queue.length; i++) {
      const existingTask = this.tasks.get(this.queue[i])
      if (existingTask && this.priorityWeight(existingTask.priority) < weight) {
        this.queue.splice(i, 0, taskId)
        inserted = true
        break
      }
    }
    
    if (!inserted) {
      this.queue.push(taskId)
    }
  }

  private notifyListeners(): void {
    const stats = this.getStats()
    this.listeners.forEach(listener => listener(stats))
  }
}

// Export singleton instance for global use
export const taskQueue = new TaskQueue()
