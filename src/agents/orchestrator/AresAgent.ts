/**
 * Ares Orchestrator Agent
 * 
 * The PM (Project Manager) agent that coordinates all specialist agents.
 * Analyzes tasks, creates execution plans, and manages the workflow.
 */

import { BaseAgent, TaskAnalysis, ExecutionPlan, ExecutionPhase, ErrorRecovery } from '../base/BaseAgent';
import { Task, TaskResult, AgentType, Agent } from '@/types/agent';

export interface AgentAssignment {
  phase: number;
  agentType: AgentType;
  description: string;
  estimatedDuration: number;
}

export interface OrchestrationResult {
  taskId: string;
  success: boolean;
  phasesCompleted: number;
  totalPhases: number;
  results: TaskResult[];
  duration: number;
}

export class AresAgent extends BaseAgent {
  private specialistAgents: Map<AgentType, BaseAgent> = new Map();
  private taskHistory: Map<string, OrchestrationResult> = new Map();

  constructor(
    id: string,
    config: { model?: string; temperature?: number; maxTokens?: number } = {}
  ) {
    super(
      id,
      'Ares PM',
      'pm',
      ['planning', 'orchestration', 'analysis', 'delegation', 'coordination'],
      {
        model: config.model || 'claude-3-opus',
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 4000,
        timeout: 600, // 10 minutes for complex planning
        retryAttempts: 3,
      }
    );
  }

  /**
   * Register a specialist agent for delegation
   */
  registerAgent(agent: BaseAgent): void {
    this.specialistAgents.set(agent.type as AgentType, agent);
    this.log(`Registered ${agent.name} (${agent.type})`);
  }

  /**
   * Unregister a specialist agent
   */
  unregisterAgent(agentType: AgentType): void {
    this.specialistAgents.delete(agentType);
    this.log(`Unregistered ${agentType}`);
  }

  /**
   * Get all registered agents
   */
  getRegisteredAgents(): BaseAgent[] {
    return Array.from(this.specialistAgents.values());
  }

  /**
   * Analyze a task description to determine complexity and approach
   */
  async analyze(taskDescription: string): Promise<TaskAnalysis> {
    this.log('Analyzing task:', taskDescription.substring(0, 100) + '...');

    // Mock analysis for Sprint 1 (will use LLM in production)
    const complexity = this.assessComplexity(taskDescription);
    const estimatedDuration = this.estimateDuration(taskDescription, complexity);
    const requiredCapabilities = this.identifyCapabilities(taskDescription);
    const risks = this.identifyRisks(taskDescription);
    const recommendations = this.generateRecommendations(taskDescription);

    return {
      complexity,
      estimatedDuration,
      requiredCapabilities,
      risks,
      recommendations,
    };
  }

  /**
   * Create an execution plan for a task
   */
  async plan(task: Task): Promise<ExecutionPlan> {
    this.log('Creating execution plan for:', task.title);

    const analysis = await this.analyze(task.description || '');
    const phases = this.createPhases(analysis, task);

    return {
      phases,
      estimatedDuration: analysis.estimatedDuration,
      complexity: analysis.complexity,
    };
  }

  /**
   * Execute a task (Ares coordinates other agents)
   */
  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    this.log('Orchestrating task:', task.title);

    try {
      // Step 1: Create execution plan
      const plan = await this.plan(task);
      this.log(`Plan created: ${plan.phases.length} phases, ${plan.estimatedDuration}min estimated`);

      // Step 2: Execute phases sequentially
      const results: TaskResult[] = [];
      let currentPhase = 0;

      for (const phase of plan.phases) {
        currentPhase++;
        this.log(`Executing phase ${currentPhase}/${plan.phases.length}: ${phase.description}`);

        // Find appropriate agent
        const agent = this.specialistAgents.get(phase.agentType as AgentType);
        if (!agent) {
          throw new Error(`No agent available for type: ${phase.agentType}`);
        }

        if (!agent.isAvailable) {
          throw new Error(`Agent ${agent.name} is not available`);
        }

        // Create sub-task for this phase
        const phaseTask: Task = {
          ...task,
          id: `${task.id}-phase-${phase.order}`,
          title: `${task.title} - Phase ${phase.order}`,
          description: phase.description,
          estimatedDuration: phase.estimatedDuration,
          parentTaskId: task.id,
        };

        // Execute phase
        const result = await agent.runTask(phaseTask);
        results.push(result);

        if (!result.success) {
          this.log(`Phase ${currentPhase} failed`);
          return {
            success: false,
            output: `Task failed at phase ${currentPhase}: ${result.output}`,
            errors: result.errors,
            fileChanges: results.flatMap(r => r.fileChanges || []),
            metadata: {
              phasesCompleted: currentPhase - 1,
              totalPhases: plan.phases.length,
              duration: (Date.now() - startTime) / 1000,
            },
          };
        }

        this.log(`Phase ${currentPhase} completed successfully`);
      }

      // All phases completed
      const duration = (Date.now() - startTime) / 1000;
      const orchestrationResult: OrchestrationResult = {
        taskId: task.id,
        success: true,
        phasesCompleted: plan.phases.length,
        totalPhases: plan.phases.length,
        results,
        duration,
      };

      this.taskHistory.set(task.id, orchestrationResult);

      return {
        success: true,
        output: `Task completed successfully. ${plan.phases.length} phases executed in ${duration}s.`,
        fileChanges: results.flatMap(r => r.fileChanges || []),
        metadata: {
          phasesCompleted: plan.phases.length,
          totalPhases: plan.phases.length,
          duration,
          plan,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error('Orchestration failed:', error as Error);

      return {
        success: false,
        output: 'Task orchestration failed',
        errors: [errorMessage],
        metadata: {
          duration: (Date.now() - startTime) / 1000,
        },
      };
    }
  }

  /**
   * Main orchestration method - coordinates multiple agents
   */
  async orchestrate(task: Task): Promise<OrchestrationResult> {
    const result = await this.execute(task);
    
    return {
      taskId: task.id,
      success: result.success,
      phasesCompleted: result.metadata?.phasesCompleted as number || 0,
      totalPhases: result.metadata?.totalPhases as number || 0,
      results: [result],
      duration: result.metadata?.duration as number || 0,
    };
  }

  /**
   * Get task history
   */
  getTaskHistory(taskId?: string): OrchestrationResult | OrchestrationResult[] | undefined {
    if (taskId) {
      return this.taskHistory.get(taskId);
    }
    return Array.from(this.taskHistory.values());
  }

  /**
   * Handle errors with specific recovery strategies
   */
  async onError(error: Error): Promise<ErrorRecovery> {
    this.error('Orchestration error:', error);

    // Analyze error for recovery strategy
    if (error.message.includes('No agent available')) {
      return {
        strategy: 'fail',
        reason: 'Required specialist agent not registered',
      };
    }

    if (error.message.includes('not available')) {
      return {
        strategy: 'retry',
        reason: 'Agent busy, will retry',
        retryDelay: 10000, // 10 seconds
      };
    }

    // Default: retry
    return {
      strategy: 'retry',
      reason: error.message,
      retryDelay: 5000,
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private assessComplexity(description: string): 'low' | 'medium' | 'high' {
    const complexity = description.length;
    const hasComplexKeywords = /architecture|design|implement|create|build/i.test(description);
    
    if (complexity > 500 || hasComplexKeywords) return 'high';
    if (complexity > 200) return 'medium';
    return 'low';
  }

  private estimateDuration(description: string, complexity: 'low' | 'medium' | 'high'): number {
    const baseDuration = {
      low: 30,
      medium: 90,
      high: 180,
    };
    return baseDuration[complexity];
  }

  private identifyCapabilities(description: string): string[] {
    const capabilities: string[] = [];
    
    if (/code|implement|function|class/i.test(description)) {
      capabilities.push('code-generation');
    }
    if (/test|spec|unit|integration/i.test(description)) {
      capabilities.push('testing');
    }
    if (/design|architecture|structure/i.test(description)) {
      capabilities.push('architecture');
    }
    if (/deploy|build|ci|cd|docker/i.test(description)) {
      capabilities.push('devops');
    }
    
    return capabilities.length > 0 ? capabilities : ['code-generation'];
  }

  private identifyRisks(description: string): string[] {
    const risks: string[] = [];
    
    if (/complex|difficult|challenging/i.test(description)) {
      risks.push('High complexity may require multiple iterations');
    }
    if (/legacy|old|deprecated/i.test(description)) {
      risks.push('Legacy code compatibility issues');
    }
    if (/security|auth|password/i.test(description)) {
      risks.push('Security implications require careful review');
    }
    
    return risks;
  }

  private generateRecommendations(description: string): string[] {
    const recommendations: string[] = [
      'Break task into smaller, testable components',
      'Write tests before implementation',
    ];
    
    if (/api|endpoint|route/i.test(description)) {
      recommendations.push('Include API documentation');
    }
    if (/database|model|schema/i.test(description)) {
      recommendations.push('Consider migration strategy');
    }
    
    return recommendations;
  }

  private createPhases(analysis: TaskAnalysis, task: Task): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];
    let order = 1;

    // Phase 1: Design/Architecture (if high complexity)
    if (analysis.complexity === 'high') {
      phases.push({
        order: order++,
        description: `Design architecture for: ${task.title}`,
        agentType: 'architect',
        estimatedDuration: 30,
        dependencies: [],
      });
    }

    // Phase 2: Implementation
    phases.push({
      order: order++,
      description: `Implement: ${task.description || task.title}`,
      agentType: 'engineer',
      estimatedDuration: analysis.estimatedDuration * 0.6,
      dependencies: analysis.complexity === 'high' ? [1] : [],
    });

    // Phase 3: Testing
    phases.push({
      order: order++,
      description: `Write and run tests for: ${task.title}`,
      agentType: 'tester',
      estimatedDuration: analysis.estimatedDuration * 0.3,
      dependencies: [order - 2],
    });

    // Phase 4: DevOps (if relevant)
    if (analysis.requiredCapabilities.includes('devops')) {
      phases.push({
        order: order++,
        description: `Setup deployment for: ${task.title}`,
        agentType: 'devops',
        estimatedDuration: 20,
        dependencies: [order - 2],
      });
    }

    return phases;
  }
}
