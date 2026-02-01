import { TaskQueue } from '@/execution/TaskQueue'
import type { Task, TaskCreate, TaskPriority, TaskResult, TaskStatus } from '@/types'

describe('TaskQueue', () => {
  let queue: TaskQueue

  beforeEach(() => {
    queue = new TaskQueue()
  })

  afterEach(() => {
    queue.clear()
  })

  describe('add', () => {
    it('should add a task with default values', () => {
      const task = queue.add({
        title: 'Test Task',
        description: 'Test Description',
      })

      expect(task).toBeDefined()
      expect(task.id).toBeDefined()
      expect(task.title).toBe('Test Task')
      expect(task.description).toBe('Test Description')
      expect(task.status).toBe('pending')
      expect(task.priority).toBe('medium')
      expect(task.retry_count).toBe(0)
      expect(task.max_retries).toBe(3)
      expect(task.timeout_ms).toBe(300000)
    })

    it('should add a task with custom values', () => {
      const task = queue.add({
        title: 'High Priority Task',
        description: 'Important task',
        priority: 'high',
        max_retries: 5,
        timeout_ms: 60000,
        context: { key: 'value' },
      })

      expect(task.priority).toBe('high')
      expect(task.max_retries).toBe(5)
      expect(task.timeout_ms).toBe(60000)
      expect(task.context).toEqual({ key: 'value' })
    })

    it('should generate unique IDs for each task', () => {
      const task1 = queue.add({ title: 'Task 1', description: 'Desc 1' })
      const task2 = queue.add({ title: 'Task 2', description: 'Desc 2' })

      expect(task1.id).not.toBe(task2.id)
    })
  })

  describe('get', () => {
    it('should retrieve a task by ID', () => {
      const task = queue.add({ title: 'Test', description: 'Test' })
      const retrieved = queue.get(task.id)

      expect(retrieved).toEqual(task)
    })

    it('should return undefined for non-existent task', () => {
      const retrieved = queue.get('non-existent-id')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('dequeue', () => {
    it('should return the highest priority task', () => {
      const lowPriority = queue.add({ title: 'Low', description: 'Low', priority: 'low' })
      const highPriority = queue.add({ title: 'High', description: 'High', priority: 'high' })
      const mediumPriority = queue.add({ title: 'Medium', description: 'Medium', priority: 'medium' })

      const dequeued = queue.dequeue()
      expect(dequeued?.id).toBe(highPriority.id)
    })

    it('should return critical priority before high', () => {
      const high = queue.add({ title: 'High', description: 'High', priority: 'high' })
      const critical = queue.add({ title: 'Critical', description: 'Critical', priority: 'critical' })

      const dequeued = queue.dequeue()
      expect(dequeued?.id).toBe(critical.id)
    })

    it('should return undefined when queue is empty', () => {
      const dequeued = queue.dequeue()
      expect(dequeued).toBeUndefined()
    })

    it('should respect dependencies', () => {
      const taskA = queue.add({ title: 'Task A', description: 'Task A' })
      const taskB = queue.add({ 
        title: 'Task B', 
        description: 'Task B',
        dependencies: [taskA.id]
      })

      // Task B depends on Task A, so only Task A should be dequeued
      const dequeued = queue.dequeue()
      expect(dequeued?.id).toBe(taskA.id)
    })
  })

  describe('peek', () => {
    it('should return the highest priority task without removing it', () => {
      const task = queue.add({ title: 'Test', description: 'Test', priority: 'high' })
      
      const peeked = queue.peek()
      expect(peeked?.id).toBe(task.id)
      
      // Task should still be in queue
      expect(queue.get(task.id)).toBeDefined()
      expect(queue.length).toBe(1)
    })
  })

  describe('updateStatus', () => {
    it('should update task status', () => {
      const task = queue.add({ title: 'Test', description: 'Test' })
      const updated = queue.updateStatus(task.id, 'running')

      expect(updated?.status).toBe('running')
      expect(updated?.started_at).toBeDefined()
    })

    it('should set completed_at for terminal states', () => {
      const task = queue.add({ title: 'Test', description: 'Test' })
      queue.updateStatus(task.id, 'running')
      const completed = queue.updateStatus(task.id, 'completed')

      expect(completed?.status).toBe('completed')
      expect(completed?.completed_at).toBeDefined()
    })

    it('should return undefined for non-existent task', () => {
      const updated = queue.updateStatus('non-existent', 'running')
      expect(updated).toBeUndefined()
    })
  })

  describe('setResult', () => {
    it('should set successful result and mark completed', () => {
      const task = queue.add({ title: 'Test', description: 'Test' })
      const result: TaskResult = {
        success: true,
        output: 'Task completed successfully',
        execution_time_ms: 1000,
        logs: ['log1', 'log2'],
      }

      const updated = queue.setResult(task.id, result)

      expect(updated?.status).toBe('completed')
      expect(updated?.result).toEqual(result)
    })

    it('should increment retry count on failure', () => {
      const task = queue.add({ title: 'Test', description: 'Test', max_retries: 3 })
      const result: TaskResult = {
        success: false,
        output: 'Task failed',
        execution_time_ms: 500,
        logs: ['error log'],
      }

      const updated = queue.setResult(task.id, result)

      expect(updated?.retry_count).toBe(1)
      expect(updated?.status).toBe('retrying')
    })

    it('should mark as failed after max retries', () => {
      const task = queue.add({ title: 'Test', description: 'Test', max_retries: 1 })
      const result: TaskResult = {
        success: false,
        output: 'Task failed',
        execution_time_ms: 500,
        logs: [],
      }

      // First failure
      queue.setResult(task.id, result)
      // Second failure (after retry)
      const updated = queue.setResult(task.id, result)

      expect(updated?.status).toBe('failed')
    })
  })

  describe('remove', () => {
    it('should remove a task from the queue', () => {
      const task = queue.add({ title: 'Test', description: 'Test' })
      const removed = queue.remove(task.id)

      expect(removed).toBe(true)
      expect(queue.get(task.id)).toBeUndefined()
    })

    it('should return false for non-existent task', () => {
      const removed = queue.remove('non-existent')
      expect(removed).toBe(false)
    })
  })

  describe('cancel', () => {
    it('should cancel a task', () => {
      const task = queue.add({ title: 'Test', description: 'Test' })
      const cancelled = queue.cancel(task.id)

      expect(cancelled?.status).toBe('cancelled')
    })
  })

  describe('retry', () => {
    it('should retry a failed task', () => {
      const task = queue.add({ title: 'Test', description: 'Test' })
      queue.updateStatus(task.id, 'failed')
      
      const retried = queue.retry(task.id)

      expect(retried?.status).toBe('queued')
      expect(retried?.retry_count).toBe(1)
    })

    it('should retry a cancelled task', () => {
      const task = queue.add({ title: 'Test', description: 'Test' })
      queue.cancel(task.id)
      
      const retried = queue.retry(task.id)

      expect(retried?.status).toBe('queued')
    })

    it('should return undefined for non-failed/cancelled tasks', () => {
      const task = queue.add({ title: 'Test', description: 'Test' })
      const retried = queue.retry(task.id)

      expect(retried).toBeUndefined()
    })
  })

  describe('filtering', () => {
    beforeEach(() => {
      queue.add({ title: 'High Priority', description: 'High', priority: 'high' })
      queue.add({ title: 'Low Priority', description: 'Low', priority: 'low' })
      queue.add({ title: 'Critical Priority', description: 'Critical', priority: 'critical' })
    })

    it('should get all tasks', () => {
      const all = queue.getAll()
      expect(all).toHaveLength(3)
    })

    it('should filter by priority', () => {
      const highPriority = queue.getByPriority('high')
      expect(highPriority).toHaveLength(1)
      expect(highPriority[0].priority).toBe('high')
    })

    it('should filter by multiple criteria', () => {
      const task = queue.add({ 
        title: 'Assigned High', 
        description: 'Assigned',
        priority: 'high',
        assignee_agent_id: 'agent-1'
      })
      queue.updateStatus(task.id, 'running')

      const filtered = queue.filter({ priority: 'high', status: 'running' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].assignee_agent_id).toBe('agent-1')
    })
  })

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      const task1 = queue.add({ title: 'Task 1', description: 'Task 1' })
      const task2 = queue.add({ title: 'Task 2', description: 'Task 2' })
      const task3 = queue.add({ title: 'Task 3', description: 'Task 3' })

      queue.updateStatus(task1.id, 'running')
      queue.updateStatus(task2.id, 'completed')

      const stats = queue.getStats()

      expect(stats.total).toBe(3)
      expect(stats.running).toBe(1)
      expect(stats.completed).toBe(1)
      expect(stats.pending).toBe(1)
    })
  })

  describe('dependencies', () => {
    it('should check if dependencies are met', () => {
      const taskA = queue.add({ title: 'Task A', description: 'Task A' })
      const taskB = queue.add({ 
        title: 'Task B', 
        description: 'Task B',
        dependencies: [taskA.id]
      })

      expect(queue.areDependenciesMet(taskB.id)).toBe(false)
      
      queue.updateStatus(taskA.id, 'completed')
      expect(queue.areDependenciesMet(taskB.id)).toBe(true)
    })

    it('should return ready tasks', () => {
      const taskA = queue.add({ title: 'Task A', description: 'Task A' })
      queue.add({ 
        title: 'Task B', 
        description: 'Task B',
        dependencies: [taskA.id]
      })

      const ready = queue.getReadyTasks()
      expect(ready).toHaveLength(1)
      expect(ready[0].id).toBe(taskA.id)
    })
  })

  describe('subscribe', () => {
    it('should notify listeners on changes', () => {
      const listener = jest.fn()
      const unsubscribe = queue.subscribe(listener)

      // Initial call
      expect(listener).toHaveBeenCalledTimes(1)

      queue.add({ title: 'Test', description: 'Test' })
      expect(listener).toHaveBeenCalledTimes(2)

      unsubscribe()
    })

    it('should stop notifying after unsubscribe', () => {
      const listener = jest.fn()
      const unsubscribe = queue.subscribe(listener)
      unsubscribe()

      queue.add({ title: 'Test', description: 'Test' })
      expect(listener).toHaveBeenCalledTimes(1) // Only initial call
    })
  })

  describe('utility methods', () => {
    it('should check if queue is empty', () => {
      expect(queue.isEmpty()).toBe(true)
      queue.add({ title: 'Test', description: 'Test' })
      expect(queue.isEmpty()).toBe(false)
    })

    it('should return correct queue length', () => {
      expect(queue.length).toBe(0)
      queue.add({ title: 'Test 1', description: 'Test 1' })
      expect(queue.length).toBe(1)
      queue.add({ title: 'Test 2', description: 'Test 2' })
      expect(queue.length).toBe(2)
    })

    it('should clear all tasks', () => {
      queue.add({ title: 'Test 1', description: 'Test 1' })
      queue.add({ title: 'Test 2', description: 'Test 2' })
      
      queue.clear()
      
      expect(queue.length).toBe(0)
      expect(queue.getAll()).toHaveLength(0)
    })
  })

  describe('priority ordering', () => {
    it('should maintain priority order after multiple adds', () => {
      queue.add({ title: 'Low 1', description: 'Low', priority: 'low' })
      queue.add({ title: 'Critical 1', description: 'Critical', priority: 'critical' })
      queue.add({ title: 'High 1', description: 'High', priority: 'high' })
      queue.add({ title: 'Critical 2', description: 'Critical', priority: 'critical' })
      queue.add({ title: 'Medium 1', description: 'Medium', priority: 'medium' })

      const dequeued: string[] = []
      while (!queue.isEmpty()) {
        const task = queue.dequeue()
        if (task) dequeued.push(task.priority)
      }

      // Should be: critical, critical, high, medium, low
      expect(dequeued).toEqual(['critical', 'critical', 'high', 'medium', 'low'])
    })
  })
})
