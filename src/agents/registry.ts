/**
 * Agent Registry
 * 
 * Central registry for managing agent instances.
 */

import { BaseAgent } from './base/BaseAgent';
import { AresAgent } from './orchestrator/AresAgent';
import { EngineerAgent } from './specialist/EngineerAgent';
import { TesterAgent } from './specialist/TesterAgent';
import { AgentType, Agent } from '@/types/agent';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, BaseAgent> = new Map();
  private aresAgent?: AresAgent;

  private constructor() {}

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Initialize the default agent setup
   */
  initializeDefaultAgents(): AresAgent {
    // Create Ares orchestrator
    this.aresAgent = new AresAgent('ares-pm-001', {
      model: 'claude-3-opus',
      temperature: 0.7,
    });
    this.registerAgent(this.aresAgent);

    // Create specialist agents
    const engineer = new EngineerAgent('engineer-001', 'Engineer Alpha', {
      model: 'claude-3-sonnet',
    });
    this.registerAgent(engineer);
    this.aresAgent.registerAgent(engineer);

    const tester = new TesterAgent('tester-001', 'Tester Alpha', {
      model: 'claude-3-sonnet',
    });
    this.registerAgent(tester);
    this.aresAgent.registerAgent(tester);

    // Create additional engineer for parallel processing
    const engineer2 = new EngineerAgent('engineer-002', 'Engineer Beta', {
      model: 'claude-3-sonnet',
    });
    this.registerAgent(engineer2);
    this.aresAgent.registerAgent(engineer2);

    return this.aresAgent;
  }

  /**
   * Register an agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    console.log(`[Registry] Registered agent: ${agent.name} (${agent.id})`);
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      console.log(`[Registry] Unregistered agent: ${agent.name}`);
    }
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get the Ares orchestrator agent
   */
  getAresAgent(): AresAgent | undefined {
    return this.aresAgent;
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: AgentType): BaseAgent[] {
    return this.getAllAgents().filter(agent => agent.type === type);
  }

  /**
   * Get available (idle) agents
   */
  getAvailableAgents(): BaseAgent[] {
    return this.getAllAgents().filter(agent => agent.isAvailable);
  }

  /**
   * Get available agents by type
   */
  getAvailableAgentsByType(type: AgentType): BaseAgent[] {
    return this.getAvailableAgents().filter(agent => agent.type === type);
  }

  /**
   * Get agent statistics
   */
  getAgentStats(): {
    total: number;
    available: number;
    busy: number;
    offline: number;
    byType: Record<AgentType, number>;
  } {
    const all = this.getAllAgents();
    const byType: Record<AgentType, number> = {
      pm: 0,
      architect: 0,
      engineer: 0,
      tester: 0,
      devops: 0,
    };

    all.forEach(agent => {
      byType[agent.type as AgentType] = (byType[agent.type as AgentType] || 0) + 1;
    });

    return {
      total: all.length,
      available: all.filter(a => a.isAvailable).length,
      busy: all.filter(a => a.isBusy).length,
      offline: all.filter(a => a.status === 'offline').length,
      byType,
    };
  }

  /**
   * Find best agent for a capability
   */
  findAgentForCapability(capability: string): BaseAgent | undefined {
    const available = this.getAvailableAgents();
    return available.find(agent => agent.hasCapability(capability));
  }

  /**
   * Convert all agents to plain objects
   */
  toJSON(): Agent[] {
    return this.getAllAgents().map(agent => agent.toJSON());
  }

  /**
   * Clear all agents (useful for testing)
   */
  clear(): void {
    this.agents.clear();
    this.aresAgent = undefined;
  }
}

// Export singleton instance
export const agentRegistry = AgentRegistry.getInstance();
