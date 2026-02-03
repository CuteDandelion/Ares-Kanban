/**
 * ARES Claude Service - Multi-Turn with Memory Support
 * 
 * Enhanced Claude service with:
 * - Multi-turn conversation support
 * - Memory integration for context persistence
 * - ReAct pattern for multi-step reasoning
 * - Tool execution with result feedback
 * - Streaming responses
 * 
 * This service extends the base Claude service to support the 
 * Chain of Thought + Contextual Memory Hybrid system.
 */

import { useKanbanStore, KanbanState } from '@/stores/kanbanStore';
import { 
  MemoryManager, 
  MemoryEntry,
  getMemoryManager 
} from '@/memory';
import { 
  ReActEngine, 
  ReActTool,
  ReActToolResult,
  getReActEngine 
} from '@/memory';

export interface ClaudeConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolUse {
  name: string;
  input: Record<string, unknown>;
}

export interface ClaudeResponse {
  text: string;
  toolCalls?: ToolUse[];
  stopReason: string;
  thinkingTrace?: string;
}

export interface MultiTurnContext {
  conversationId?: string;
  previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  enableMemory?: boolean;
  enableThinking?: boolean;
}

// Tool definitions for kanban operations
export const kanbanTools: ToolDefinition[] = [
  {
    name: 'create_card',
    description: 'Create a new card in a specified column',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Card title' },
        columnId: { type: 'string', description: 'Target column ID' },
        description: { type: 'string', description: 'Card description (optional)' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'none'], description: 'Card priority' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Card tags' },
      },
      required: ['title', 'columnId'],
    },
  },
  {
    name: 'move_card',
    description: 'Move a card to a different column',
    input_schema: {
      type: 'object',
      properties: {
        cardId: { type: 'string', description: 'Card ID to move' },
        targetColumnId: { type: 'string', description: 'Destination column ID' },
        targetIndex: { type: 'number', description: 'Position in target column (optional)' },
      },
      required: ['cardId', 'targetColumnId'],
    },
  },
  {
    name: 'delete_card',
    description: 'Delete a card from the board',
    input_schema: {
      type: 'object',
      properties: {
        cardId: { type: 'string', description: 'Card ID to delete' },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'update_card',
    description: 'Update card properties',
    input_schema: {
      type: 'object',
      properties: {
        cardId: { type: 'string', description: 'Card ID to update' },
        title: { type: 'string', description: 'New title (optional)' },
        description: { type: 'string', description: 'New description (optional)' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'none'], description: 'New priority (optional)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'New tags (optional)' },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'create_column',
    description: 'Create a new column on the board',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Column title' },
        position: { type: 'number', description: 'Column position index (optional)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'rename_column',
    description: 'Rename an existing column',
    input_schema: {
      type: 'object',
      properties: {
        columnId: { type: 'string', description: 'Column ID to rename' },
        newTitle: { type: 'string', description: 'New column title' },
      },
      required: ['columnId', 'newTitle'],
    },
  },
  {
    name: 'delete_column',
    description: 'Delete a column and all its cards',
    input_schema: {
      type: 'object',
      properties: {
        columnId: { type: 'string', description: 'Column ID to delete' },
      },
      required: ['columnId'],
    },
  },
  {
    name: 'search_cards',
    description: 'Search for cards by title, description, or tags',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        columnId: { type: 'string', description: 'Limit search to specific column (optional)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_columns',
    description: 'Get all columns on the current board',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_column_cards',
    description: 'Get all cards in a specific column',
    input_schema: {
      type: 'object',
      properties: {
        columnId: { type: 'string', description: 'Column ID' },
      },
      required: ['columnId'],
    },
  },
];

/**
 * Enhanced Claude Service with Multi-Turn Support
 */
class EnhancedClaudeService {
  private config: ClaudeConfig;
  private getState: (() => KanbanState) | null = null;
  private memoryManager: MemoryManager | null = null;
  private reactEngine: ReActEngine | null = null;

  constructor(config: ClaudeConfig) {
    this.config = {
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.7,
      ...config,
    };
  }

  setStore(getState: () => KanbanState) {
    this.getState = getState;
  }

  /**
   * Enable memory persistence
   */
  enableMemory(): void {
    this.memoryManager = getMemoryManager();
  }

  /**
   * Enable ReAct engine
   */
  enableReAct(): void {
    this.reactEngine = getReActEngine();
    this.registerKanbanTools();
  }

  /**
   * Send a message to Claude with multi-turn support
   */
  async sendMessage(
    message: string,
    context?: { boardName?: string; columns?: string[] },
    multiTurnContext?: MultiTurnContext
  ): Promise<ClaudeResponse> {
    if (!this.config.apiKey) {
      throw new Error('Claude API key not configured');
    }

    // Build message history with memory
    const messages = this.buildMessageHistory(message, multiTurnContext);
    
    const systemPrompt = this.buildSystemPrompt(context, multiTurnContext?.enableThinking);

    try {
      // Use the proxy API route to avoid CORS issues
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.config.apiKey,
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: systemPrompt,
          messages: messages,
          tools: kanbanTools,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details?.error?.message || 'Claude API error');
      }

      const data = await response.json();
      const parsedResponse = this.parseResponse(data);

      // Save to memory if enabled
      if (this.memoryManager && multiTurnContext?.enableMemory !== false) {
        this.saveToMemory(message, parsedResponse);
      }

      return parsedResponse;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Execute multi-turn conversation with ReAct
   */
  async executeMultiTurn(
    userInput: string,
    context?: { boardName?: string; columns?: string[] },
    onProgress?: (step: { type: string; content: string }) => void
  ): Promise<{
    finalResponse: string;
    steps: Array<{ type: string; content: string }>;
    toolResults: Array<{ name: string; success: boolean; result?: unknown; error?: string }>;
  }> {
    if (!this.reactEngine) {
      this.enableReAct();
    }

    const steps: Array<{ type: string; content: string }> = [];
    const toolResults: Array<{ name: string; success: boolean; result?: unknown; error?: string }> = [];

    // Add observation step
    steps.push({
      type: 'observation',
      content: `User request: ${userInput}`,
    });
    onProgress?.({ type: 'observation', content: `User request: ${userInput}` });

    let stepCount = 0;
    const maxSteps = 10;

    while (stepCount < maxSteps) {
      stepCount++;

      // Get AI response
      const response = await this.sendMessage(userInput, context, {
        enableMemory: true,
        enableThinking: true,
      });

      // Record thought
      if (response.text) {
        steps.push({
          type: 'thought',
          content: response.text,
        });
        onProgress?.({ type: 'thought', content: response.text });
      }

      // Execute tools
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          steps.push({
            type: 'action',
            content: `Executing ${toolCall.name}...`,
          });
          onProgress?.({ type: 'action', content: `Executing ${toolCall.name}...` });

          try {
            const result = await this.executeTool(toolCall);
            toolResults.push({ name: toolCall.name, success: true, result });
            
            steps.push({
              type: 'result',
              content: JSON.stringify(result),
            });
            onProgress?.({ type: 'result', content: JSON.stringify(result) });

            // Update user input with tool result for next iteration
            userInput = `Tool ${toolCall.name} result: ${JSON.stringify(result)}. Continue.`;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Tool execution failed';
            toolResults.push({ name: toolCall.name, success: false, error: errorMsg });
            
            steps.push({
              type: 'result',
              content: `Error: ${errorMsg}`,
            });
            onProgress?.({ type: 'result', content: `Error: ${errorMsg}` });
          }
        }
      } else {
        // No more tools - we're done
        break;
      }
    }

    return {
      finalResponse: steps[steps.length - 1]?.content || 'Task completed',
      steps,
      toolResults,
    };
  }

  /**
   * Execute tool calls returned by Claude
   */
  async executeTools(toolCalls: ToolUse[]): Promise<{ name: string; result: unknown; success: boolean }[]> {
    if (!this.getState) {
      throw new Error('Kanban store not set');
    }

    const results = [];

    for (const tool of toolCalls) {
      try {
        const result = await this.executeTool(tool);
        results.push({ name: tool.name, result, success: true });
      } catch (error) {
        results.push({
          name: tool.name,
          result: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        });
      }
    }

    return results;
  }

  /**
   * Get conversation history from memory
   */
  getConversationHistory(limit?: number): MemoryEntry[] {
    if (!this.memoryManager) return [];
    return this.memoryManager.getContextWindow(limit);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    if (this.memoryManager) {
      this.memoryManager.clear();
    }
  }

  /**
   * Build message history with context
   */
  private buildMessageHistory(
    currentMessage: string,
    multiTurnContext?: MultiTurnContext
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add memory context if enabled
    if (this.memoryManager && multiTurnContext?.enableMemory !== false) {
      const memoryEntries = this.memoryManager.getFormattedContext();
      messages.push(...memoryEntries as Array<{ role: 'user' | 'assistant'; content: string }>);
    }

    // Add previous messages from multi-turn context
    if (multiTurnContext?.previousMessages) {
      messages.push(...multiTurnContext.previousMessages);
    }

    // Add current message
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  /**
   * Save interaction to memory
   */
  private saveToMemory(userMessage: string, response: ClaudeResponse): void {
    if (!this.memoryManager) return;

    // Save user message
    this.memoryManager.addEntry({
      role: 'user',
      content: userMessage,
    });

    // Save assistant response
    this.memoryManager.addEntry({
      role: 'assistant',
      content: response.text,
      metadata: {
        toolCalls: response.toolCalls?.map(t => t.name),
        stopReason: response.stopReason,
      },
    });

    // Save tool results
    if (response.toolCalls) {
      response.toolCalls.forEach(toolCall => {
        this.memoryManager?.addEntry({
          role: 'tool',
          content: `Tool ${toolCall.name} executed`,
          metadata: {
            toolName: toolCall.name,
            toolInput: toolCall.input,
          },
        });
      });
    }
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(context?: { boardName?: string; columns?: string[] }, enableThinking?: boolean): string {
    let prompt = `You are ARES (Autonomous Resource Execution System), an AI project manager that helps users manage kanban boards.

You have access to tools that allow you to manipulate the kanban board directly. When a user asks you to perform an action, use the appropriate tool.

Guidelines:
1. Always confirm successful operations with specific details
2. If you can't find something (e.g., a card by name), ask for clarification
3. Be concise but informative in your responses
4. When creating cards, use appropriate priority levels based on context
5. Before deleting anything, confirm the action unless explicitly instructed otherwise`;

    if (context?.boardName) {
      prompt += `\n\nCurrent board: ${context.boardName}`;
    }

    if (context?.columns && context.columns.length > 0) {
      prompt += `\n\nAvailable columns: ${context.columns.join(', ')}`;
    }

    if (enableThinking) {
      prompt += `\n\nTHINKING MODE ENABLED:
Show your reasoning process step by step. Think about what the user wants, what tools you need, and what the expected outcome should be.`;
    }

    return prompt;
  }

  /**
   * Execute a single tool
   */
  private async executeTool(tool: ToolUse): Promise<unknown> {
    if (!this.getState) throw new Error('Store not available');

    const state = this.getState();
    const { currentBoard } = state;
    if (!currentBoard) throw new Error('No board selected');

    switch (tool.name) {
      case 'create_card': {
        const { title, columnId, description, priority, tags } = tool.input as {
          title: string;
          columnId: string;
          description?: string;
          priority?: string;
          tags?: string[];
        };
        
        await state.createCard(columnId, {
          title,
          description,
          priority: priority as 'critical' | 'high' | 'medium' | 'low' | 'none',
          tags,
        });
        return { cardId: 'created', title };
      }

      case 'move_card': {
        const { cardId, targetColumnId, targetIndex } = tool.input as {
          cardId: string;
          targetColumnId: string;
          targetIndex?: number;
        };
        
        let fromColumnId = '';
        for (const col of currentBoard.columns) {
          if (col.cards?.some((c: { id: string }) => c.id === cardId)) {
            fromColumnId = col.id;
            break;
          }
        }
        
        await state.moveCard({ 
          cardId, 
          fromColumnId, 
          toColumnId: targetColumnId, 
          newIndex: targetIndex ?? 0 
        });
        return { success: true, cardId, targetColumnId };
      }

      case 'delete_card': {
        const { cardId } = tool.input as { cardId: string };
        await state.deleteCard(cardId);
        return { success: true, cardId };
      }

      case 'update_card': {
        const { cardId, title, description, priority, tags } = tool.input as {
          cardId: string;
          title?: string;
          description?: string;
          priority?: string;
          tags?: string[];
        };
        
        const updates: Record<string, unknown> = {};
        if (title) updates.title = title;
        if (description) updates.description = description;
        if (priority) updates.priority = priority;
        if (tags) updates.tags = tags;
        
        await state.updateCard(cardId, updates as Parameters<typeof state.updateCard>[1]);
        return { success: true, cardId };
      }

      case 'create_column': {
        const { title } = tool.input as { title: string };
        const boardId = currentBoard.id;
        await state.createColumn(boardId, { title });
        return { columnId: 'created', title };
      }

      case 'rename_column': {
        const { columnId, newTitle } = tool.input as { columnId: string; newTitle: string };
        await state.updateColumn(columnId, { title: newTitle });
        return { success: true, columnId, newTitle };
      }

      case 'delete_column': {
        const { columnId } = tool.input as { columnId: string };
        await state.deleteColumn(columnId);
        return { success: true, columnId };
      }

      case 'search_cards': {
        const { query, columnId } = tool.input as { query: string; columnId?: string };
        
        const searchResults: typeof currentBoard.columns[0]['cards'] = [];
        currentBoard.columns.forEach(col => {
          col.cards?.forEach((card: typeof col.cards[0]) => {
            if (columnId && card.column_id !== columnId) return;
            const searchText = `${card.title} ${card.description || ''} ${card.tags?.join(' ') || ''}`.toLowerCase();
            if (searchText.includes(query.toLowerCase())) {
              searchResults.push(card);
            }
          });
        });
        
        return { 
          results: searchResults.map((c: typeof searchResults[0]) => ({ 
            id: c.id, 
            title: c.title, 
            columnId: c.column_id 
          })),
          count: searchResults.length 
        };
      }

      case 'list_columns': {
        return currentBoard.columns.map((col: typeof currentBoard.columns[0]) => ({
          id: col.id,
          title: col.title,
          cardCount: col.cards?.length || 0,
        }));
      }

      case 'get_column_cards': {
        const { columnId } = tool.input as { columnId: string };
        const column = currentBoard.columns.find((c: typeof currentBoard.columns[0]) => c.id === columnId);
        if (!column) throw new Error(`Column ${columnId} not found`);
        
        return column.cards?.map((card: typeof column.cards[0]) => ({
          id: card.id,
          title: card.title,
          priority: card.priority,
          tags: card.tags,
        })) || [];
      }

      default:
        throw new Error(`Unknown tool: ${tool.name}`);
    }
  }

  /**
   * Parse Claude API response
   */
  private parseResponse(data: unknown): ClaudeResponse {
    const response = data as {
      content: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown> }>;
      stop_reason: string;
    };

    let text = '';
    const toolCalls: ToolUse[] = [];

    for (const block of response.content) {
      if (block.type === 'text' && block.text) {
        text += block.text;
      } else if (block.type === 'tool_use' && block.name) {
        toolCalls.push({
          name: block.name,
          input: block.input || {},
        });
      }
    }

    return {
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stopReason: response.stop_reason,
    };
  }

  /**
   * Register kanban tools with ReAct engine
   */
  private registerKanbanTools(): void {
    if (!this.reactEngine) return;

    const toolDefinitions: ReActTool[] = kanbanTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema as ReActTool['parameters'],
      execute: async (input: Record<string, unknown>): Promise<ReActToolResult> => {
        try {
          const result = await this.executeTool({ name: tool.name, input });
          return { success: true, result };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Tool execution failed',
          };
        }
      },
    }));

    toolDefinitions.forEach(tool => this.reactEngine?.registerTool(tool));
  }

  /**
   * Test API key validity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.config.apiKey,
          model: this.config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || errorData.details?.error?.message || 'Connection failed' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }
}

export default EnhancedClaudeService;
