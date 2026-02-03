/**
 * ARES ReAct Engine
 * 
 * Implements the ReAct (Reasoning + Acting) pattern for multi-step AI reasoning.
 * 
 * The ReAct pattern follows this loop:
 * 1. OBSERVATION - Perceive current state/context
 * 2. THOUGHT - Reason about what to do next
 * 3. ACTION - Execute a tool/action
 * 4. RESULT - Observe the result
 * 5. (repeat until complete)
 * 
 * Features:
 * - Multi-step reasoning with visibility into thought process
 * - Tool execution with result feedback
 * - Configurable max steps to prevent infinite loops
 * - Progress tracking and cancellation
 * - Integration with memory for context retention
 */

// ReAct step types
export type ReActStepType = 'observation' | 'thought' | 'action' | 'result' | 'final';

// ReAct step
export interface ReActStep {
  id: string;
  type: ReActStepType;
  content: string;
  timestamp: number;
  metadata?: {
    toolName?: string;
    toolInput?: Record<string, unknown>;
    toolResult?: unknown;
    toolError?: string;
    stepNumber: number;
    [key: string]: unknown;
  };
}

// Tool definition for ReAct
export interface ReActTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  execute: (input: Record<string, unknown>) => Promise<ReActToolResult>;
}

// Tool execution result
export interface ReActToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// ReAct configuration
export interface ReActConfig {
  maxSteps?: number;              // Max reasoning steps (default: 10)
  maxThinkingTime?: number;       // Max time in ms (default: 60000)
  showThinking?: boolean;         // Show thought process (default: true)
  toolTimeout?: number;           // Tool execution timeout (default: 30000)
  allowMultipleToolCalls?: boolean; // Allow multiple tools per step (default: true)
}

// ReAct session state
export interface ReActSession {
  id: string;
  userInput: string;
  steps: ReActStep[];
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  finalResponse?: string;
  error?: string;
}

// ReAct progress callback
export type ReActProgressCallback = (step: ReActStep, session: ReActSession) => void;

// Claude message format for ReAct
export interface ReActMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ReAct Engine class
 * Manages the reasoning loop
 */
export class ReActEngine {
  private config: Required<ReActConfig>;
  private tools: Map<string, ReActTool> = new Map();
  private activeSession: ReActSession | null = null;
  private cancelled = false;

  constructor(config: ReActConfig = {}) {
    this.config = {
      maxSteps: config.maxSteps ?? 10,
      maxThinkingTime: config.maxThinkingTime ?? 60000,
      showThinking: config.showThinking ?? true,
      toolTimeout: config.toolTimeout ?? 30000,
      allowMultipleToolCalls: config.allowMultipleToolCalls ?? true,
    };
  }

  /**
   * Register a tool
   */
  registerTool(tool: ReActTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools
   */
  registerTools(tools: ReActTool[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * Get registered tool
   */
  getTool(name: string): ReActTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ReActTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute the ReAct loop
   */
  async execute(
    userInput: string,
    onProgress?: ReActProgressCallback,
    claudeService?: {
      sendMessage: (messages: ReActMessage[], tools: ReActTool[]) => Promise<{
        text: string;
        toolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
      }>;
    }
  ): Promise<ReActSession> {
    // Initialize session
    this.activeSession = {
      id: generateId(),
      userInput,
      steps: [],
      status: 'running',
      startTime: Date.now(),
    };

    this.cancelled = false;

    try {
      // Step 1: Observation - User input
      const observationStep: ReActStep = {
        id: generateId(),
        type: 'observation',
        content: `User request: ${userInput}`,
        timestamp: Date.now(),
        metadata: { stepNumber: 1 },
      };
      this.addStep(observationStep, onProgress);

      let stepCount = 1;
      const messages: ReActMessage[] = [
        { role: 'user', content: userInput },
      ];

      // Main ReAct loop
      while (stepCount < this.config.maxSteps && !this.cancelled) {
        // Check timeout
        if (Date.now() - this.activeSession.startTime > this.config.maxThinkingTime) {
          throw new Error('Thinking time exceeded maximum allowed');
        }

        stepCount++;

        // Get AI response with potential tool calls
        let aiResponse: { text: string; toolCalls?: Array<{ name: string; input: Record<string, unknown> }> };
        
        if (claudeService) {
          aiResponse = await claudeService.sendMessage(messages, this.getAllTools());
        } else {
          // Fallback: simulate AI response
          aiResponse = await this.simulateAIResponse(messages);
        }

        // Check timeout after getting response
        if (Date.now() - this.activeSession.startTime > this.config.maxThinkingTime) {
          throw new Error('Thinking time exceeded maximum allowed');
        }

        // Check if cancelled after getting response
        if (this.cancelled) {
          this.activeSession.status = 'cancelled';
          this.activeSession.endTime = Date.now();
          return this.activeSession;
        }

        // Step: Thought
        if (aiResponse.text && this.config.showThinking) {
          const thoughtStep: ReActStep = {
            id: generateId(),
            type: 'thought',
            content: aiResponse.text,
            timestamp: Date.now(),
            metadata: { stepNumber: stepCount },
          };
          this.addStep(thoughtStep, onProgress);
          messages.push({ role: 'assistant', content: aiResponse.text });
        }

        // Step: Action (Tool calls)
        if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
          for (const toolCall of aiResponse.toolCalls) {
            stepCount++;

            const tool = this.tools.get(toolCall.name);
            if (!tool) {
              const errorStep: ReActStep = {
                id: generateId(),
                type: 'result',
                content: `Tool "${toolCall.name}" not found`,
                timestamp: Date.now(),
                metadata: {
                  stepNumber: stepCount,
                  toolName: toolCall.name,
                  toolError: 'Tool not found',
                },
              };
              this.addStep(errorStep, onProgress);
              continue;
            }

            // Action step
            const actionStep: ReActStep = {
              id: generateId(),
              type: 'action',
              content: `Executing ${toolCall.name}...`,
              timestamp: Date.now(),
              metadata: {
                stepNumber: stepCount,
                toolName: toolCall.name,
                toolInput: toolCall.input,
              },
            };
            this.addStep(actionStep, onProgress);

            // Execute tool
            let toolResult: ReActToolResult;
            try {
              toolResult = await this.executeWithTimeout(
                tool,
                toolCall.input,
                this.config.toolTimeout
              );
            } catch (error) {
              toolResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Tool execution failed',
              };
            }

            // Result step
            stepCount++;
            const resultStep: ReActStep = {
              id: generateId(),
              type: 'result',
              content: toolResult.success
                ? `Result: ${JSON.stringify(toolResult.result)}`
                : `Error: ${toolResult.error}`,
              timestamp: Date.now(),
              metadata: {
                stepNumber: stepCount,
                toolName: toolCall.name,
                toolResult: toolResult.result,
                toolError: toolResult.error,
              },
            };
            this.addStep(resultStep, onProgress);

            // Add tool result to messages for next AI call
            messages.push({
              role: 'user',
              content: `Tool ${toolCall.name} result: ${JSON.stringify(toolResult)}`,
            });

            // If this was the final action, we might be done
            if (!this.config.allowMultipleToolCalls) {
              break;
            }
          }
        } else {
          // No tool calls - this is the final response
          break;
        }
      }

      // Final step
      const finalStep: ReActStep = {
        id: generateId(),
        type: 'final',
        content: this.generateFinalResponse(),
        timestamp: Date.now(),
        metadata: { stepNumber: stepCount },
      };
      this.addStep(finalStep, onProgress);

      // Complete session
      this.activeSession.status = 'completed';
      this.activeSession.endTime = Date.now();
      this.activeSession.finalResponse = finalStep.content;

    } catch (error) {
      this.activeSession.status = 'failed';
      this.activeSession.endTime = Date.now();
      this.activeSession.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }

    return this.activeSession;
  }

  /**
   * Cancel the current session
   */
  cancel(): void {
    this.cancelled = true;
    if (this.activeSession && this.activeSession.status === 'running') {
      this.activeSession.status = 'cancelled';
      this.activeSession.endTime = Date.now();
    }
  }

  /**
   * Get the current active session
   */
  getActiveSession(): ReActSession | null {
    return this.activeSession;
  }

  /**
   * Get the current step count
   */
  getStepCount(): number {
    return this.activeSession?.steps.length ?? 0;
  }

  /**
   * Check if currently running
   */
  isRunning(): boolean {
    return this.activeSession?.status === 'running';
  }

  /**
   * Format ReAct steps as a thinking trace
   */
  formatThinkingTrace(session?: ReActSession): string {
    const targetSession = session || this.activeSession;
    if (!targetSession) return '';

    return targetSession.steps
      .filter(step => step.type !== 'final')
      .map(step => {
        const icon = {
          observation: '👁️',
          thought: '💭',
          action: '🔧',
          result: '📊',
          final: '✅',
        }[step.type];

        return `${icon} ${step.type.toUpperCase()}: ${step.content}`;
      })
      .join('\n\n');
  }

  /**
   * Export session as JSON
   */
  exportSession(session?: ReActSession): string {
    const targetSession = session || this.activeSession;
    return JSON.stringify(targetSession, null, 2);
  }

  /**
   * Add a step to the session and trigger callback
   */
  private addStep(step: ReActStep, onProgress?: ReActProgressCallback): void {
    if (this.activeSession) {
      this.activeSession.steps.push(step);
      if (onProgress) {
        onProgress(step, this.activeSession);
      }
    }
  }

  /**
   * Execute tool with timeout
   */
  private executeWithTimeout(
    tool: ReActTool,
    input: Record<string, unknown>,
    timeout: number
  ): Promise<ReActToolResult> {
    return Promise.race([
      tool.execute(input),
      new Promise<ReActToolResult>((_, reject) =>
        setTimeout(() => reject(new Error(`Tool execution timed out after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * Simulate AI response (fallback when no Claude service)
   */
  private async simulateAIResponse(
    messages: ReActMessage[]
  ): Promise<{ text: string; toolCalls?: Array<{ name: string; input: Record<string, unknown> }> }> {
    // Check timeout before delay
    if (Date.now() - (this.activeSession?.startTime || 0) > this.config.maxThinkingTime) {
      throw new Error('Thinking time exceeded maximum allowed');
    }

    // Add a small delay to allow cancellation/timeout to work
    await new Promise(resolve => setTimeout(resolve, 10));

    // Check if cancelled - return gracefully
    if (this.cancelled) {
      return { text: 'Execution was cancelled.' };
    }

    // This is a simple fallback that extracts tool calls from user intent
    const lastMessage = messages[messages.length - 1].content.toLowerCase();

    // Check for create card intent
    if (lastMessage.includes('create') && lastMessage.includes('card')) {
      return {
        text: 'I need to create a new card. Let me identify the column and title.',
        toolCalls: [
          {
            name: 'list_columns',
            input: {},
          },
        ],
      };
    }

    // Check for move card intent
    if (lastMessage.includes('move') && lastMessage.includes('card')) {
      return {
        text: 'I will move the card to the specified column.',
        toolCalls: [
          {
            name: 'move_card',
            input: { card_title: 'Sample Card', target_column: 'Done' },
          },
        ],
      };
    }

    // Default response
    return {
      text: 'I understand your request. Let me process it for you.',
    };
  }

  /**
   * Generate final response based on all steps
   */
  private generateFinalResponse(): string {
    if (!this.activeSession) return '';

    const resultSteps = this.activeSession.steps.filter(s => s.type === 'result');
    const successCount = resultSteps.filter(s => !s.metadata?.toolError).length;
    const failCount = resultSteps.length - successCount;

    if (failCount === 0) {
      return `Task completed successfully. ${successCount} tool(s) executed.`;
    } else {
      return `Task completed with ${failCount} error(s). ${successCount} tool(s) succeeded.`;
    }
  }
}

// Singleton instance
let reactEngineInstance: ReActEngine | null = null;

/**
 * Get or create the singleton ReAct engine instance
 */
export function getReActEngine(config?: ReActConfig): ReActEngine {
  if (!reactEngineInstance) {
    reactEngineInstance = new ReActEngine(config);
  }
  return reactEngineInstance;
}

/**
 * Reset the singleton instance
 */
export function resetReActEngine(): void {
  if (reactEngineInstance) {
    reactEngineInstance.cancel();
    reactEngineInstance = null;
  }
}

export default ReActEngine;
