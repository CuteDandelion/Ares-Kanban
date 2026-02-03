/**
 * ARES Hybrid Orchestrator
 * 
 * Combines Contextual Memory and ReAct Reasoning into a unified system.
 * 
 * The Hybrid Orchestrator provides:
 * - Persistent memory across sessions
 * - Multi-step chain-of-thought reasoning
 * - Context-aware tool execution
 * - Conversation continuity with "it" reference resolution
 * - Smart context window management
 * 
 * Architecture:
 * ```
 * User Input → MemoryManager (context) → ReActEngine (reasoning) → Tool Execution
 *                    ↑                         ↓
 *                    └──── Save Result ←───────┘
 * ```
 */

import { MemoryManager, MemoryEntry, MemoryEntryRole, MemoryConfig } from './memoryManager';
import { 
  ReActEngine, 
  ReActStep, 
  ReActSession, 
  ReActTool, 
  ReActConfig,
  ReActToolResult 
} from './reactEngine';

// Tool definition from enhancedCLIService
export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

// Hybrid configuration
export interface HybridConfig {
  memory?: MemoryConfig;
  react?: ReActConfig;
  enableMemory?: boolean;           // Enable memory persistence (default: true)
  enableThinking?: boolean;         // Show thinking process (default: true)
  contextResolution?: boolean;      // Resolve "it" references (default: true)
  maxMemoryContext?: number;        // Max memory entries in context (default: 10)
}

// Hybrid event types
export type HybridEventType = 
  | 'thinking'
  | 'tool_start'
  | 'tool_complete'
  | 'step_complete'
  | 'memory_update'
  | 'complete'
  | 'error';

// Hybrid event
export interface HybridEvent {
  type: HybridEventType;
  data: unknown;
  timestamp: number;
}

// Hybrid event callback
export type HybridEventCallback = (event: HybridEvent) => void;

// Hybrid session
export interface HybridSession {
  id: string;
  userInput: string;
  memoryEntries: MemoryEntry[];
  reactSession: ReActSession;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  finalResponse?: string;
  contextUsed: boolean;
  resolvedReferences?: string[];
}

// Context resolution result
interface ContextResolution {
  resolvedInput: string;
  references: string[];
  contextEntries: MemoryEntry[];
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hybrid Orchestrator class
 * Combines Memory and ReAct into a unified system
 */
export class HybridOrchestrator {
  private memoryManager: MemoryManager;
  private reactEngine: ReActEngine;
  private config: Required<HybridConfig>;
  private eventCallbacks: HybridEventCallback[] = [];
  private activeSession: HybridSession | null = null;

  constructor(config: HybridConfig = {}) {
    this.config = {
      memory: config.memory ?? {},
      react: config.react ?? {},
      enableMemory: config.enableMemory ?? true,
      enableThinking: config.enableThinking ?? true,
      contextResolution: config.contextResolution ?? true,
      maxMemoryContext: config.maxMemoryContext ?? 10,
    };

    this.memoryManager = new MemoryManager(this.config.memory);
    this.reactEngine = new ReActEngine({
      ...this.config.react,
      showThinking: this.config.enableThinking,
    });
  }

  /**
   * Subscribe to hybrid events
   */
  onEvent(callback: HybridEventCallback): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event
   */
  private emitEvent(type: HybridEventType, data: unknown): void {
    const event: HybridEvent = {
      type,
      data,
      timestamp: Date.now(),
    };
    this.eventCallbacks.forEach(cb => {
      try {
        cb(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  /**
   * Execute a command with hybrid memory + reasoning
   */
  async execute(
    userInput: string,
    claudeService?: {
      sendMessage: (messages: Array<{ role: string; content: string }>, tools: ReActTool[]) => Promise<{
        text: string;
        toolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
      }>;
    }
  ): Promise<HybridSession> {
    const sessionId = generateId();
    
    // Step 1: Resolve context (if enabled)
    let resolvedInput = userInput;
    let contextEntries: MemoryEntry[] = [];
    let resolvedReferences: string[] = [];

    if (this.config.contextResolution && this.config.enableMemory) {
      const resolution = this.resolveContext(userInput);
      resolvedInput = resolution.resolvedInput;
      contextEntries = resolution.contextEntries;
      resolvedReferences = resolution.references;
    }

    // Step 2: Add user input to memory
    if (this.config.enableMemory) {
      this.memoryManager.addEntry({
        role: 'user',
        content: userInput,
        metadata: {
          sessionId,
          resolvedInput: resolvedInput !== userInput ? resolvedInput : undefined,
        },
      });
    }

    // Step 3: Initialize hybrid session
    this.activeSession = {
      id: sessionId,
      userInput,
      memoryEntries: contextEntries,
      reactSession: {
        id: sessionId,
        userInput: resolvedInput,
        steps: [],
        status: 'running',
        startTime: Date.now(),
      },
      status: 'running',
      startTime: Date.now(),
      contextUsed: contextEntries.length > 0,
      resolvedReferences,
    };

    // Step 4: Execute ReAct with progress tracking
    const reactSession = await this.reactEngine.execute(
      resolvedInput,
      (step, session) => {
        this.handleReActStep(step, session);
      },
      claudeService
    );

    // Step 5: Update session with results
    this.activeSession.reactSession = reactSession;
    this.activeSession.status = reactSession.status;
    this.activeSession.endTime = Date.now();
    this.activeSession.finalResponse = reactSession.finalResponse;

    // Step 6: Save final response to memory
    if (this.config.enableMemory && reactSession.finalResponse) {
      this.memoryManager.addEntry({
        role: 'assistant',
        content: reactSession.finalResponse,
        metadata: {
          sessionId,
          toolResults: reactSession.steps
            .filter(s => s.type === 'result')
            .map(s => s.metadata?.toolResult),
        },
      });
    }

    this.emitEvent('complete', this.activeSession);
    return this.activeSession;
  }

  /**
   * Register a tool for ReAct
   */
  registerTool(
    name: string,
    description: string,
    parameters: ReActTool['parameters'],
    execute: (input: Record<string, unknown>) => Promise<ReActToolResult>
  ): void {
    this.reactEngine.registerTool({
      name,
      description,
      parameters,
      execute,
    });
  }

  /**
   * Register a board tool (wrapper for enhancedCLIService tools)
   */
  registerBoardTool(
    name: string,
    description: string,
    handler: (args: Record<string, unknown>) => Promise<unknown>
  ): void {
    this.registerTool(
      name,
      description,
      {
        type: 'object',
        properties: {},
      },
      async (input) => {
        try {
          const result = await handler(input);
          return { success: true, result };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Tool execution failed',
          };
        }
      }
    );
  }

  /**
   * Resolve context references like "it", "that", "the card"
   */
  private resolveContext(input: string): ContextResolution {
    const references: string[] = [];
    let resolvedInput = input;
    const relevantEntries: MemoryEntry[] = [];

    // Get recent context
    const recentEntries = this.memoryManager.getContextWindow(this.config.maxMemoryContext);

    // Resolve "it" - look for last mentioned card/item
    if (/\bit\b/i.test(input) || /\bthat\b/i.test(input) || /\bthe card\b/i.test(input)) {
      // Find last card-related entry
      const lastCardEntry = recentEntries
        .reverse()
        .find(e => 
          (e.role === 'assistant' && 
           (e.content.includes('card') || e.content.includes('created') || e.content.includes('moved'))) ||
          e.metadata?.toolName === 'create_card' ||
          e.metadata?.toolName === 'move_card'
        );

      if (lastCardEntry) {
        // Try to extract card name from content
        const cardNameMatch = lastCardEntry.content.match(/["']([^"']+)["']/);
        if (cardNameMatch) {
          const cardName = cardNameMatch[1];
          resolvedInput = input
            .replace(/\bit\b/gi, `"${cardName}"`)
            .replace(/\bthat\b/gi, `"${cardName}"`)
            .replace(/\bthe card\b/gi, `"${cardName}"`);
          references.push(`"${cardName}"`);
          relevantEntries.push(lastCardEntry);
        }
      }
    }

    // Resolve column references
    const columnPattern = /\b(to|in|from)\s+(\w+)\s+column\b/i;
    const columnMatch = input.match(columnPattern);
    if (columnMatch) {
      // Check if column exists in memory
      const columnName = columnMatch[2];
      const columnEntry = recentEntries.find(e => 
        e.content.toLowerCase().includes(columnName.toLowerCase())
      );
      if (columnEntry) {
        relevantEntries.push(columnEntry);
      }
    }

    return {
      resolvedInput,
      references,
      contextEntries: relevantEntries,
    };
  }

  /**
   * Handle ReAct step and sync with memory
   */
  private handleReActStep(step: ReActStep, session: ReActSession): void {
    // Emit thinking event
    if (step.type === 'thought') {
      this.emitEvent('thinking', step);
    }

    // Emit tool events
    if (step.type === 'action') {
      this.emitEvent('tool_start', step);
    }

    if (step.type === 'result') {
      this.emitEvent('tool_complete', step);
      
      // Save tool result to memory
      if (this.config.enableMemory) {
        this.memoryManager.addEntry({
          role: 'tool',
          content: step.content,
          metadata: {
            toolName: step.metadata?.toolName,
            toolResult: step.metadata?.toolResult,
            toolError: step.metadata?.toolError,
            sessionId: this.activeSession?.id,
          },
        });
      }
    }

    // Emit step complete
    this.emitEvent('step_complete', { step, session });
    this.emitEvent('memory_update', this.memoryManager.getStats());
  }

  /**
   * Get memory manager
   */
  getMemoryManager(): MemoryManager {
    return this.memoryManager;
  }

  /**
   * Get ReAct engine
   */
  getReActEngine(): ReActEngine {
    return this.reactEngine;
  }

  /**
   * Get active session
   */
  getActiveSession(): HybridSession | null {
    return this.activeSession;
  }

  /**
   * Get memory context for display
   */
  getMemoryContext(): MemoryEntry[] {
    return this.memoryManager.getContextWindow(this.config.maxMemoryContext);
  }

  /**
   * Clear memory
   */
  clearMemory(): void {
    this.memoryManager.clear();
    this.emitEvent('memory_update', { cleared: true });
  }

  /**
   * Cancel current execution
   */
  cancel(): void {
    this.reactEngine.cancel();
    if (this.activeSession) {
      this.activeSession.status = 'cancelled';
      this.activeSession.endTime = Date.now();
    }
  }

  /**
   * Export full memory
   */
  exportMemory(): string {
    return this.memoryManager.export();
  }

  /**
   * Import memory
   */
  importMemory(json: string): boolean {
    return this.memoryManager.import(json);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return this.memoryManager.getStats();
  }

  /**
   * Format session as a conversation transcript
   */
  formatTranscript(session?: HybridSession): string {
    const targetSession = session || this.activeSession;
    if (!targetSession) return '';

    const lines: string[] = [
      `=== ARES Session Transcript ===`,
      `Session ID: ${targetSession.id}`,
      `Started: ${new Date(targetSession.startTime).toISOString()}`,
      `Status: ${targetSession.status}`,
      '',
      `User: ${targetSession.userInput}`,
      '',
    ];

    if (targetSession.contextUsed) {
      lines.push(`Context: Referenced ${targetSession.resolvedReferences?.join(', ') || 'previous items'}`, '');
    }

    targetSession.reactSession.steps.forEach(step => {
      const prefix = {
        observation: '[OBSERVATION]',
        thought: '[THINKING]',
        action: '[ACTION]',
        result: '[RESULT]',
        final: '[RESPONSE]',
      }[step.type];

      lines.push(`${prefix} ${step.content}`);
    });

    if (targetSession.endTime) {
      lines.push(
        '',
        `Completed: ${new Date(targetSession.endTime).toISOString()}`,
        `Duration: ${targetSession.endTime - targetSession.startTime}ms`
      );
    }

    return lines.join('\n');
  }

  /**
   * Destroy the orchestrator
   */
  destroy(): void {
    this.cancel();
    this.memoryManager.destroy();
    this.eventCallbacks = [];
  }
}

// Singleton instance
let orchestratorInstance: HybridOrchestrator | null = null;

/**
 * Get or create the singleton orchestrator instance
 */
export function getHybridOrchestrator(config?: HybridConfig): HybridOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new HybridOrchestrator(config);
  }
  return orchestratorInstance;
}

/**
 * Reset the singleton instance
 */
export function resetHybridOrchestrator(): void {
  if (orchestratorInstance) {
    orchestratorInstance.destroy();
    orchestratorInstance = null;
  }
}

export default HybridOrchestrator;
