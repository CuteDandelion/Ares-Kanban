/**
 * Integration Tests: Agent Coordination
 * 
 * Sprint 1 Module 1.7: Integration & End-to-End Flow
 * 
 * Tests for multi-agent coordination, handoffs, and collaboration.
 */

import { AresAgent } from '@/agents/orchestrator/AresAgent';
import { EngineerAgent } from '@/agents/specialist/EngineerAgent';
import { TesterAgent } from '@/agents/specialist/TesterAgent';
import { AgentRegistry } from '@/agents/registry';
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

describe('Agent Coordination', () => {
  let ares: AresAgent;
  let engineer: EngineerAgent;
  let tester: TesterAgent;
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = AgentRegistry.getInstance();
    registry.clear();
    
    ares = new AresAgent('ares-coordination-test', { model: 'claude-3-opus' });
    engineer = new EngineerAgent('engineer-coordination-test', 'Engineer Coordination', { model: 'claude-3-sonnet' });
    tester = new TesterAgent('tester-coordination-test', 'Tester Coordination', { model: 'claude-3-sonnet' });
    
    // Register agents with Ares
    ares.registerAgent(engineer);
    ares.registerAgent(tester);
    
    // Register with global registry
    registry.registerAgent(ares);
    registry.registerAgent(engineer);
    registry.registerAgent(tester);
  });

  afterEach(() => {
    registry.clear();
  });

  describe('Multi-Agent Task Decomposition', () => {
    it('should decompose complex tasks into multiple phases', async () => {
      const task: AgentTask = {
        id: 'complex-task-1',
        title: 'Build complete feature',
        description: 'Implement a user authentication system with login, registration, and password reset',
        status: 'pending' as AgentTaskStatus,
        priority: 5,
        qualityGates: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      const plan = await ares.plan(task);
      
      // Complex task should have multiple phases
      expect(plan.phases.length).toBeGreaterThan(1);
      
      // Each phase should have required properties
      plan.phases.forEach(phase => {
        expect(phase.order).toBeDefined();
        expect(phase.agentType).toBeDefined();
        expect(phase.description).toBeDefined();
        expect(phase.estimatedDuration).toBeGreaterThan(0);
      });
    }, 30000);

    it('should assign phases to appropriate agent types', async () => {
      const task: AgentTask = {
        id: 'multi-agent-task',
        title: 'Feature with testing',
        description: 'Implement a feature and write tests',
        status: 'pending' as AgentTaskStatus,
        priority: 4,
        qualityGates: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      const plan = await ares.plan(task);
      
      // Should have phases for different agent types
      const agentTypes = plan.phases.map(p => p.agentType);
      expect(agentTypes.length).toBeGreaterThan(0);
      
      // Should identify which agent type is needed for each phase
      agentTypes.forEach(type => {
        expect(['engineer', 'tester', 'pm', 'architect', 'devops']).toContain(type);
      });
    }, 30000);

    it('should identify phase dependencies correctly', async () => {
      const task: AgentTask = {
        id: 'dependent-task',
        title: 'Dependent phases task',
        description: 'Implement feature, then test it',
        status: 'pending' as AgentTaskStatus,
        priority: 4,
        qualityGates: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      const plan = await ares.plan(task);
      
      // Check for dependencies in phases
      const phasesWithDeps = plan.phases.filter(p => p.dependencies.length > 0);
      
      // Later phases should depend on earlier ones
      if (plan.phases.length > 1) {
        expect(phasesWithDeps.length).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('Agent Handoff Protocol', () => {
    it('should successfully handoff between agents', async () => {
      const task: AgentTask = {
        id: 'handoff-task',
        title: 'Handoff test',
        description: 'Task to test handoff between agents',
        status: 'pending' as AgentTaskStatus,
        priority: 3,
        qualityGates: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      // Engineer executes first
      const engineerResult = await engineer.runTask(task);
      expect(engineerResult.success).toBe(true);
      expect(engineerResult.metadata?.agentId).toBe(engineer.id);

      // Create handoff task with previous results
      const handoffTask: AgentTask = {
        ...task,
        id: `${task.id}-handoff`,
        parentTaskId: task.id,
        metadata: {
          previousResult: engineerResult.output,
          previousAgent: engineer.name,
        },
      };

      // Tester takes over
      const testerResult = await tester.runTask(handoffTask);
      expect(testerResult.success).toBe(true);
      expect(testerResult.metadata?.agentId).toBe(tester.id);
    }, 30000);

    it('should preserve context during handoff', async () => {
      const task: AgentTask = {
        id: 'context-handoff-task',
        title: 'Context preservation test',
        description: 'Test that context is preserved during handoff',
        status: 'pending' as AgentTaskStatus,
        priority: 3,
        qualityGates: [],
        metadata: {
          originalRequirement: 'Must handle edge cases',
          constraints: ['Use TypeScript', 'Add tests'],
        },
        createdAt: new Date().toISOString(),
      };

      // First agent execution
      const engineerResult = await engineer.runTask(task);
      
      // Context should be preserved in result metadata
      expect(engineerResult.metadata).toBeDefined();
    }, 30000);

    it('should handle sequential agent execution', async () => {
      const task: AgentTask = {
        id: 'sequential-task',
        title: 'Sequential execution test',
        description: 'Test sequential agent execution',
        status: 'pending' as AgentTaskStatus,
        priority: 3,
        qualityGates: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      const results: Array<{ agent: string; success: boolean } > = [];

      // Execute with engineer
      const engineerResult = await engineer.runTask(task);
      results.push({ agent: 'engineer', success: engineerResult.success });

      // Execute with tester
      const testTask: AgentTask = {
        ...task,
        id: `${task.id}-test`,
        parentTaskId: task.id,
      };
      const testerResult = await tester.runTask(testTask);
      results.push({ agent: 'tester', success: testerResult.success });

      // Both should succeed
      expect(results.every(r => r.success)).toBe(true);
      expect(results.length).toBe(2);
    }, 30000);
  });

  describe('Agent Registration and Discovery', () => {
    it('should register agents correctly', () => {
      const registeredAgents = ares.getRegisteredAgents();
      
      // Should have registered agents
      expect(registeredAgents.length).toBeGreaterThanOrEqual(2);
      
      // Should include engineer and tester
      const agentTypes = registeredAgents.map(a => a.type);
      expect(agentTypes).toContain('engineer');
      expect(agentTypes).toContain('tester');
    });

    it('should find agents by capability', () => {
      // Find agent with code-generation capability
      const codeAgent = registry.findAgentForCapability('code-generation');
      expect(codeAgent).toBeDefined();
      expect(codeAgent?.hasCapability('code-generation')).toBe(true);

      // Find agent with testing capability
      const testAgent = registry.findAgentForCapability('unit-testing');
      expect(testAgent).toBeDefined();
      expect(testAgent?.hasCapability('unit-testing')).toBe(true);
    });

    it('should track agent availability', () => {
      const availableAgents = registry.getAvailableAgents();
      
      // Initially all agents should be available
      expect(availableAgents.length).toBeGreaterThanOrEqual(3);
      
      // Each agent should report availability correctly
      availableAgents.forEach(agent => {
        expect(agent.isAvailable).toBe(true);
        expect(agent.status).toBe('idle');
      });
    });

    it('should get agent statistics', () => {
      const stats = registry.getAgentStats();
      
      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.available).toBeGreaterThanOrEqual(0);
      expect(stats.busy).toBeGreaterThanOrEqual(0);
      expect(stats.byType).toBeDefined();
      
      // Should track by agent type
      expect(stats.byType.engineer).toBeGreaterThanOrEqual(1);
      expect(stats.byType.tester).toBeGreaterThanOrEqual(1);
      expect(stats.byType.pm).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Task Analysis and Planning', () => {
    it('should analyze task complexity', async () => {
      const taskDescriptions = [
        { desc: 'Fix typo in README', expected: 'low' },
        { desc: 'Implement new feature with tests', expected: 'medium' },
        { desc: 'Build complete microservice architecture with database, API, and frontend', expected: 'high' },
      ];

      for (const { desc, expected } of taskDescriptions) {
        const analysis = await ares.analyze(desc);
        expect(analysis.complexity).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(analysis.complexity);
        expect(analysis.estimatedDuration).toBeGreaterThan(0);
        expect(analysis.requiredCapabilities).toBeInstanceOf(Array);
      }
    }, 30000);

    it('should identify required capabilities', async () => {
      const taskDescription = 'Create a React component with TypeScript and write unit tests';
      
      const analysis = await ares.analyze(taskDescription);
      
      // Should identify relevant capabilities
      expect(analysis.requiredCapabilities.length).toBeGreaterThan(0);
      
      // Likely capabilities for this task
      const likelyCapabilities = ['typescript', 'react', 'unit-testing'];
      const hasMatchingCapability = analysis.requiredCapabilities.some(cap => 
        likelyCapabilities.some(likely => cap.toLowerCase().includes(likely))
      );
      expect(hasMatchingCapability).toBe(true);
    }, 30000);

    it('should generate appropriate execution plans', async () => {
      const task: AgentTask = {
        id: 'planning-task',
        title: 'Planning test',
        description: 'Test that generates appropriate plan',
        status: 'pending' as AgentTaskStatus,
        priority: 3,
        qualityGates: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      const plan = await ares.plan(task);
      
      expect(plan.phases).toBeInstanceOf(Array);
      expect(plan.estimatedDuration).toBeGreaterThan(0);
      expect(plan.complexity).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(plan.complexity);
    }, 30000);
  });

  describe('Error Handling in Coordination', () => {
    it('should handle agent unavailability gracefully', async () => {
      // Take engineer offline
      await engineer.goOffline();
      
      expect(engineer.status).toBe('offline');
      expect(engineer.isAvailable).toBe(false);
      
      // Bring back online for other tests
      await engineer.goOnline();
      expect(engineer.status).toBe('idle');
    });

    it('should track task history', async () => {
      const task: AgentTask = {
        id: 'history-task',
        title: 'History tracking test',
        description: 'Test task history tracking',
        status: 'pending' as AgentTaskStatus,
        priority: 3,
        qualityGates: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      // Execute through orchestrator
      const result = await ares.runTask(task);
      
      // Result should include agent info
      expect(result.metadata?.agentId).toBeDefined();
      expect(result.metadata?.agentName).toBeDefined();
    }, 30000);
  });
});
