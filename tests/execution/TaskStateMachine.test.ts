import { TaskStateMachine, TaskStateManager } from '@/execution/TaskStateMachine'
import { TaskQueue } from '@/execution/TaskQueue'
import type { Task, TaskStatus, TaskStateTransition } from '@/types'

describe('TaskStateMachine', () => {
  let machine: TaskStateMachine
  let mockTask: Task

  beforeEach(() => {
    machine = new TaskStateMachine()
    mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'pending',
      priority: 'medium',
      assignee_agent_id: null,
      creator_id: 'user-1',
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
    }
  })

  describe('canTransition', () => {
    it('should allow valid pending transitions', () => {
      expect(machine.canTransition(mockTask, 'queued')).toBe(true)
      expect(machine.canTransition(mockTask, 'cancelled')).toBe(true)
      expect(machine.canTransition(mockTask, 'running')).toBe(false)
    })

    it('should allow valid queued transitions', () => {
      mockTask.status = 'queued'
      expect(machine.canTransition(mockTask, 'assigned')).toBe(true)
      expect(machine.canTransition(mockTask, 'cancelled')).toBe(true)
      expect(machine.canTransition(mockTask, 'running')).toBe(false)
    })

    it('should allow valid running transitions', () => {
      mockTask.status = 'running'
      expect(machine.canTransition(mockTask, 'paused')).toBe(true)
      expect(machine.canTransition(mockTask, 'completed')).toBe(true)
      expect(machine.canTransition(mockTask, 'failed')).toBe(true)
      expect(machine.canTransition(mockTask, 'cancelled')).toBe(true)
    })

    it('should allow valid failed transitions', () => {
      mockTask.status = 'failed'
      expect(machine.canTransition(mockTask, 'retrying')).toBe(true)
      expect(machine.canTransition(mockTask, 'cancelled')).toBe(true)
      expect(machine.canTransition(mockTask, 'running')).toBe(false)
    })

    it('should not allow transitions to the same state', () => {
      expect(machine.canTransition(mockTask, 'pending')).toBe(false)
    })
  })

  describe('getValidTransitions', () => {
    it('should return valid transitions from pending', () => {
      const transitions = machine.getValidTransitions(mockTask)
      expect(transitions).toContain('queued')
      expect(transitions).toContain('cancelled')
      expect(transitions).not.toContain('running')
    })

    it('should return valid transitions from running', () => {
      mockTask.status = 'running'
      const transitions = machine.getValidTransitions(mockTask)
      expect(transitions).toContain('paused')
      expect(transitions).toContain('completed')
      expect(transitions).toContain('failed')
      expect(transitions).toContain('cancelled')
    })
  })

  describe('transition', () => {
    it('should execute valid transition', async () => {
      const result = await machine.transition(mockTask, 'queued')

      expect(result.success).toBe(true)
      expect(result.task.status).toBe('queued')
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid transition', async () => {
      const result = await machine.transition(mockTask, 'running')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid transition')
    })

    it('should call onTransition hook', async () => {
      const onTransition = jest.fn()
      const customMachine = new TaskStateMachine({ onTransition })

      await customMachine.transition(mockTask, 'queued')

      expect(onTransition).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'queued' }),
        'pending',
        'queued'
      )
    })

    it('should track transition history', async () => {
      await machine.transition(mockTask, 'queued')
      await machine.transition({ ...mockTask, status: 'queued' }, 'assigned')

      const history = machine.getHistory('task-1')
      expect(history).toHaveLength(2)
      expect(history[0].from).toBe('pending')
      expect(history[0].to).toBe('queued')
    })

    it('should run validator if provided', async () => {
      const validator = jest.fn().mockResolvedValue(false)
      const transition: TaskStateTransition = {
        from: 'pending',
        to: 'queued',
        action: 'queue',
        validator,
      }

      const customMachine = new TaskStateMachine({ transitions: [transition] })
      const result = await customMachine.transition(mockTask, 'queued')

      expect(validator).toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.error).toContain('validation failed')
    })

    it('should handle validator errors', async () => {
      const onError = jest.fn()
      const validator = jest.fn().mockRejectedValue(new Error('Validation error'))
      const transition: TaskStateTransition = {
        from: 'pending',
        to: 'queued',
        action: 'queue',
        validator,
      }

      const customMachine = new TaskStateMachine({ 
        transitions: [transition],
        onError 
      })
      
      const result = await customMachine.transition(mockTask, 'queued')

      expect(onError).toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
    })
  })

  describe('convenience methods', () => {
    describe('queue', () => {
      it('should transition from pending to queued', async () => {
        const result = await machine.queue(mockTask)
        expect(result.success).toBe(true)
        expect(result.task.status).toBe('queued')
      })
    })

    describe('assign', () => {
      it('should transition from queued to assigned', async () => {
        mockTask.status = 'queued'
        const result = await machine.assign(mockTask, 'agent-1')
        expect(result.success).toBe(true)
        expect(result.task.status).toBe('assigned')
      })
    })

    describe('start', () => {
      it('should transition from assigned to running', async () => {
        mockTask.status = 'assigned'
        const result = await machine.start(mockTask)
        expect(result.success).toBe(true)
        expect(result.task.status).toBe('running')
      })
    })

    describe('pause', () => {
      it('should transition from running to paused', async () => {
        mockTask.status = 'running'
        const result = await machine.pause(mockTask)
        expect(result.success).toBe(true)
        expect(result.task.status).toBe('paused')
      })
    })

    describe('resume', () => {
      it('should transition from paused to running', async () => {
        mockTask.status = 'paused'
        const result = await machine.resume(mockTask)
        expect(result.success).toBe(true)
        expect(result.task.status).toBe('running')
      })
    })

    describe('complete', () => {
      it('should transition from running to completed', async () => {
        mockTask.status = 'running'
        const result = await machine.complete(mockTask, { success: true })
        expect(result.success).toBe(true)
        expect(result.task.status).toBe('completed')
      })
    })

    describe('fail', () => {
      it('should transition from running to failed', async () => {
        mockTask.status = 'running'
        const result = await machine.fail(mockTask, 'Error message')
        expect(result.success).toBe(true)
        expect(result.task.status).toBe('failed')
      })
    })

    describe('retry', () => {
      it('should transition from failed to retrying', async () => {
        mockTask.status = 'failed'
        const result = await machine.retry(mockTask)
        expect(result.success).toBe(true)
        expect(result.task.status).toBe('retrying')
      })
    })

    describe('cancel', () => {
      it('should transition from any state to cancelled', async () => {
        const result = await machine.cancel(mockTask)
        expect(result.success).toBe(true)
        expect(result.task.status).toBe('cancelled')
      })
    })
  })

  describe('state helpers', () => {
    describe('isTerminalState', () => {
      it('should return true for terminal states', () => {
        expect(machine.isTerminalState('completed')).toBe(true)
        expect(machine.isTerminalState('failed')).toBe(true)
        expect(machine.isTerminalState('cancelled')).toBe(true)
      })

      it('should return false for non-terminal states', () => {
        expect(machine.isTerminalState('pending')).toBe(false)
        expect(machine.isTerminalState('running')).toBe(false)
        expect(machine.isTerminalState('queued')).toBe(false)
      })
    })

    describe('isActiveState', () => {
      it('should return true for active states', () => {
        expect(machine.isActiveState('assigned')).toBe(true)
        expect(machine.isActiveState('running')).toBe(true)
        expect(machine.isActiveState('paused')).toBe(true)
      })

      it('should return false for inactive states', () => {
        expect(machine.isActiveState('pending')).toBe(false)
        expect(machine.isActiveState('completed')).toBe(false)
      })
    })

    describe('canCancel', () => {
      it('should return true for cancellable states', () => {
        expect(machine.canCancel(mockTask)).toBe(true) // pending
        mockTask.status = 'running'
        expect(machine.canCancel(mockTask)).toBe(true)
      })

      it('should return false for terminal states', () => {
        mockTask.status = 'completed'
        expect(machine.canCancel(mockTask)).toBe(false)
        mockTask.status = 'failed'
        expect(machine.canCancel(mockTask)).toBe(false)
      })
    })

    describe('getActionName', () => {
      it('should return action name for valid transition', () => {
        const action = machine.getActionName('pending', 'queued')
        expect(action).toBe('queue')
      })

      it('should return undefined for invalid transition', () => {
        const action = machine.getActionName('pending', 'running')
        expect(action).toBeUndefined()
      })
    })
  })

  describe('custom transitions', () => {
    it('should use custom transitions', async () => {
      const customTransition: TaskStateTransition = {
        from: 'pending',
        to: 'running',
        action: 'custom_start',
      }

      const customMachine = new TaskStateMachine({
        transitions: [customTransition],
      })

      expect(customMachine.canTransition(mockTask, 'running')).toBe(true)
      
      const result = await customMachine.transition(mockTask, 'running')
      expect(result.success).toBe(true)
    })
  })
})

describe('TaskStateManager', () => {
  let manager: TaskStateManager
  let queue: TaskQueue

  beforeEach(() => {
    queue = new TaskQueue()
    manager = new TaskStateManager(queue)
  })

  afterEach(() => {
    queue.clear()
  })

  describe('submitTask', () => {
    it('should add task to queue and transition to queued', async () => {
      const task = await manager.submitTask({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
      })

      expect(task).toBeDefined()
      expect(task.status).toBe('queued')
      expect(task.priority).toBe('high')
    })

    it('should use default priority', async () => {
      const task = await manager.submitTask({
        title: 'Test Task',
        description: 'Test Description',
      })

      expect(task.priority).toBe('medium')
    })
  })

  describe('getNextTask', () => {
    it('should return the next task from queue', async () => {
      await manager.submitTask({ title: 'Task 1', description: 'Desc 1', priority: 'low' })
      await manager.submitTask({ title: 'Task 2', description: 'Desc 2', priority: 'high' })

      const next = manager.getNextTask()
      expect(next?.title).toBe('Task 2') // High priority first
    })
  })

  describe('startTask', () => {
    it('should transition task to running', async () => {
      const task = await manager.submitTask({
        title: 'Test Task',
        description: 'Test Description',
      })
      
      // First assign the task, then start it
      const queue = manager.getQueue()
      queue.updateStatus(task.id, 'assigned')
      
      const started = await manager.startTask(task.id)
      expect(started?.status).toBe('running')
      expect(started?.started_at).toBeDefined()
    })

    it('should return undefined for non-existent task', async () => {
      const result = await manager.startTask('non-existent')
      expect(result).toBeUndefined()
    })
  })

  describe('completeTask', () => {
    it('should complete task with result', async () => {
      const task = await manager.submitTask({
        title: 'Test Task',
        description: 'Test Description',
      })
      
      // Transition through states: queued -> assigned -> running -> completed
      const queue = manager.getQueue()
      queue.updateStatus(task.id, 'assigned')
      queue.updateStatus(task.id, 'running')

      const result = {
        success: true,
        output: 'Task completed',
        execution_time_ms: 1000,
        logs: ['log1'],
      }

      const completed = await manager.completeTask(task.id, result)
      expect(completed?.status).toBe('completed')
      expect(completed?.result).toEqual(result)
    })
  })

  describe('failTask', () => {
    it('should mark task as failed', async () => {
      const task = await manager.submitTask({
        title: 'Test Task',
        description: 'Test Description',
      })
      
      // Transition through states: queued -> assigned -> running -> failed
      const queue = manager.getQueue()
      queue.updateStatus(task.id, 'assigned')
      queue.updateStatus(task.id, 'running')

      const failed = await manager.failTask(task.id, 'Something went wrong')
      expect(failed?.status).toBe('failed')
    })
  })

  describe('cancelTask', () => {
    it('should cancel task', async () => {
      const task = await manager.submitTask({
        title: 'Test Task',
        description: 'Test Description',
      })

      const cancelled = await manager.cancelTask(task.id)
      expect(cancelled?.status).toBe('cancelled')
    })
  })

  describe('getTaskHistory', () => {
    it('should return task transition history', async () => {
      const task = await manager.submitTask({
        title: 'Test Task',
        description: 'Test Description',
      })
      await manager.startTask(task.id)
      await manager.completeTask(task.id, {
        success: true,
        output: 'Done',
        execution_time_ms: 1000,
        logs: [],
      })

      const history = manager.getTaskHistory(task.id)
      expect(history.length).toBeGreaterThan(0)
    })
  })

  describe('getStats', () => {
    it('should return queue statistics', async () => {
      await manager.submitTask({ title: 'Task 1', description: 'Desc 1' })
      await manager.submitTask({ title: 'Task 2', description: 'Desc 2' })

      const stats = manager.getStats()
      expect(stats.total).toBe(2)
      expect(stats.queued).toBe(2)
    })
  })

  describe('getters', () => {
    it('should return queue instance', () => {
      expect(manager.getQueue()).toBe(queue)
    })

    it('should return state machine instance', () => {
      expect(manager.getStateMachine()).toBeDefined()
    })
  })
})
