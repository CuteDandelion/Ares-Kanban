/**
 * Enhanced CLI Service with Tool Use and Thinking Mode
 * 
 * Provides a LangChain-inspired tool framework without the heavy dependency.
 * Supports:
 * - Tool definitions with JSON schemas
 * - Thought/reasoning visibility
 * - Function calling
 * - Memory/conversation context
 */

import { useKanbanStore } from '@/stores/kanbanStore';
import { Column, Card } from '@/types';

// Tool definition interface
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

// Tool call result
export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  name: string;
  success: boolean;
  result: any;
  error?: string;
}

// Thinking/reasoning step
export interface ThoughtStep {
  type: 'observation' | 'thought' | 'action' | 'result';
  content: string;
  timestamp: Date;
}

// CLI Response with thinking
export interface CLIResponse {
  text: string;
  thoughts?: ThoughtStep[];
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

// Board tools definition
const BOARD_TOOLS: ToolDefinition[] = [
  {
    name: 'create_card',
    description: 'Create a new card in a column',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the card'
        },
        column_name: {
          type: 'string',
          description: 'The name of the column to add the card to'
        },
        priority: {
          type: 'string',
          description: 'The priority level',
          enum: ['critical', 'high', 'medium', 'low', 'none']
        },
        description: {
          type: 'string',
          description: 'Optional description for the card'
        },
        tags: {
          type: 'string',
          description: 'Comma-separated list of tags'
        }
      },
      required: ['title', 'column_name']
    }
  },
  {
    name: 'move_card',
    description: 'Move a card from one column to another',
    parameters: {
      type: 'object',
      properties: {
        card_title: {
          type: 'string',
          description: 'The title of the card to move'
        },
        target_column: {
          type: 'string',
          description: 'The name of the column to move the card to'
        }
      },
      required: ['card_title', 'target_column']
    }
  },
  {
    name: 'delete_card',
    description: 'Delete a card by title',
    parameters: {
      type: 'object',
      properties: {
        card_title: {
          type: 'string',
          description: 'The title of the card to delete'
        }
      },
      required: ['card_title']
    }
  },
  {
    name: 'create_column',
    description: 'Create a new column',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the new column'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'search_cards',
    description: 'Search for cards by query',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to match against card titles and descriptions'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'list_columns',
    description: 'List all columns and their card counts',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_board_info',
    description: 'Get current board information',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

/**
 * Execute a board tool with the current kanban store state
 */
export async function executeBoardTool(
  toolCall: ToolCall,
  store: ReturnType<typeof useKanbanStore.getState>
): Promise<ToolResult> {
  const { name, arguments: args } = toolCall;
  
  try {
    switch (name) {
      case 'create_card': {
        const column = store.currentBoard?.columns.find(
          c => c.title.toLowerCase() === args.column_name.toLowerCase()
        );
        if (!column) {
          return {
            name,
            success: false,
            result: null,
            error: `Column "${args.column_name}" not found`
          };
        }
        
        await store.createCard(column.id, {
          title: args.title,
          description: args.description || null,
          priority: args.priority || 'none',
          tags: args.tags ? args.tags.split(',').map((t: string) => t.trim()) : []
        });
        
        // Find the created card by title
        const createdCard = store.currentBoard?.columns
          .find(c => c.id === column.id)
          ?.cards.find(c => c.title === args.title);
        
        return {
          name,
          success: true,
          result: { cardId: createdCard?.id || 'unknown', title: args.title }
        };
      }
      
      case 'move_card': {
        // Find the card
        let card: Card | undefined;
        let sourceColumnId: string | undefined;
        
        for (const col of store.currentBoard?.columns || []) {
          const found = col.cards.find(
            c => c.title.toLowerCase() === args.card_title.toLowerCase()
          );
          if (found) {
            card = found;
            sourceColumnId = col.id;
            break;
          }
        }
        
        if (!card || !sourceColumnId) {
          return {
            name,
            success: false,
            result: null,
            error: `Card "${args.card_title}" not found`
          };
        }
        
        // Find target column
        const targetColumn = store.currentBoard?.columns.find(
          c => c.title.toLowerCase() === args.target_column.toLowerCase()
        );
        
        if (!targetColumn) {
          return {
            name,
            success: false,
            result: null,
            error: `Target column "${args.target_column}" not found`
          };
        }
        
        await store.moveCard({
          cardId: card.id,
          fromColumnId: sourceColumnId,
          toColumnId: targetColumn.id,
          newIndex: targetColumn.cards.length
        });
        
        return {
          name,
          success: true,
          result: { cardId: card.id, from: sourceColumnId, to: targetColumn.id }
        };
      }
      
      case 'delete_card': {
        let card: Card | undefined;
        
        for (const col of store.currentBoard?.columns || []) {
          const found = col.cards.find(
            c => c.title.toLowerCase() === args.card_title.toLowerCase()
          );
          if (found) {
            card = found;
            break;
          }
        }
        
        if (!card) {
          return {
            name,
            success: false,
            result: null,
            error: `Card "${args.card_title}" not found`
          };
        }
        
        await store.deleteCard(card.id);
        
        return {
          name,
          success: true,
          result: { cardId: card.id }
        };
      }
      
      case 'create_column': {
        if (!store.currentBoard) {
          return {
            name,
            success: false,
            result: null,
            error: 'No board is currently loaded'
          };
        }
        
        await store.createColumn(store.currentBoard.id, {
          title: args.name
        });
        
        // Find the created column by title
        const createdColumn = store.currentBoard?.columns.find(
          c => c.title === args.name
        );
        
        return {
          name,
          success: true,
          result: { columnId: createdColumn?.id || 'unknown', name: args.name }
        };
      }
      
      case 'search_cards': {
        interface SearchResult {
          card: Card;
          columnTitle: string;
        }
        const results: SearchResult[] = [];
        const query = args.query.toLowerCase();
        
        for (const col of store.currentBoard?.columns || []) {
          for (const card of col.cards) {
            if (
              card.title.toLowerCase().includes(query) ||
              card.description?.toLowerCase().includes(query) ||
              card.tags?.some(tag => tag.toLowerCase().includes(query))
            ) {
              results.push({ card, columnTitle: col.title });
            }
          }
        }
        
        return {
          name,
          success: true,
          result: { 
            count: results.length, 
            cards: results.map(r => ({
              id: r.card.id,
              title: r.card.title,
              column: r.columnTitle,
              priority: r.card.priority,
              tags: r.card.tags
            }))
          }
        };
      }
      
      case 'list_columns': {
        const columns = store.currentBoard?.columns.map(col => ({
          name: col.title,
          cardCount: col.cards.length
        })) || [];
        
        return {
          name,
          success: true,
          result: { columns }
        };
      }
      
      case 'get_board_info': {
        const board = store.currentBoard;
        if (!board) {
          return {
            name,
            success: false,
            result: null,
            error: 'No board is currently loaded'
          };
        }
        
        const totalCards = board.columns.reduce((acc, col) => acc + col.cards.length, 0);
        
        return {
          name,
          success: true,
          result: {
            name: board.name,
            columns: board.columns.length,
            totalCards,
            columnNames: board.columns.map(c => c.title)
          }
        };
      }
      
      default:
        return {
          name,
          success: false,
          result: null,
          error: `Unknown tool: ${name}`
        };
    }
  } catch (error) {
    return {
      name,
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate system prompt with tool definitions for Claude
 */
export function generateSystemPrompt(includeThinking: boolean = false): string {
  const toolDescriptions = BOARD_TOOLS.map(tool => {
    const params = Object.entries(tool.parameters.properties)
      .map(([key, value]) => {
        const required = tool.parameters.required?.includes(key) ? ' (required)' : ' (optional)';
        const type = value.enum ? ` [${value.enum.join('|')}]` : '';
        return `    - ${key}${type}${required}: ${value.description}`;
      })
      .join('\n');
    
    return `${tool.name}: ${tool.description}
${params}`;
  }).join('\n\n');

  let prompt = `You are ARES, an intelligent assistant for managing Kanban boards.

You have access to the following tools:

${toolDescriptions}

When you need to perform an action, use the following format:
<tool_call>
{
  "name": "tool_name",
  "arguments": {
    "arg1": "value1",
    "arg2": "value2"
  }
}
</tool_call>

The system will execute the tool and return the result. Then respond to the user with a natural language summary.

GUIDELINES:
- Always confirm actions before executing them when possible
- If a user asks to create/move/delete something, use the appropriate tool
- If you're unsure about column names, ask the user for clarification
- Be concise but helpful in your responses`;

  if (includeThinking) {
    prompt += `\n
THINKING MODE ENABLED:
Show your reasoning process by including <thinking> tags in your response:
<thinking>
1. Observation: What the user is asking for
2. Thought: How to approach this
3. Action: Which tool to use
4. Expected Result: What should happen
</thinking>

Then provide your response.`;
  }

  return prompt;
}

/**
 * Parse tool calls from Claude's response
 */
export function parseToolCalls(response: string): { text: string; toolCalls: ToolCall[]; thoughts: ThoughtStep[] } {
  const toolCalls: ToolCall[] = [];
  const thoughts: ThoughtStep[] = [];
  
  // Extract thinking blocks
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/g;
  let thinkingMatch;
  let cleanResponse = response;
  
  while ((thinkingMatch = thinkingRegex.exec(response)) !== null) {
    const thinkingContent = thinkingMatch[1].trim();
    thoughts.push({
      type: 'thought',
      content: thinkingContent,
      timestamp: new Date()
    });
    // Remove thinking from the text response
    cleanResponse = cleanResponse.replace(thinkingMatch[0], '');
  }
  
  // Extract tool calls
  const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
  let toolMatch;
  
  while ((toolMatch = toolCallRegex.exec(response)) !== null) {
    try {
      const toolData = JSON.parse(toolMatch[1].trim());
      toolCalls.push({
        name: toolData.name,
        arguments: toolData.arguments || {}
      });
      // Remove tool call from the text response
      cleanResponse = cleanResponse.replace(toolMatch[0], '');
    } catch (e) {
      console.error('Failed to parse tool call:', e);
    }
  }
  
  return {
    text: cleanResponse.trim(),
    toolCalls,
    thoughts
  };
}

export default {
  BOARD_TOOLS,
  executeBoardTool,
  generateSystemPrompt,
  parseToolCalls
};