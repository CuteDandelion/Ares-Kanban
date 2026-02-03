/**
 * ARES CLI Hook
 * 
 * Provides a React hook for managing CLI state and command execution.
 * Integrates with Claude API for natural language command processing.
 * Supports enhanced mode with tool use and thinking visibility.
 */

import { useState, useCallback, useRef } from 'react';
import { CLIMessage } from '@/components/layout/CLIPanel';
import { 
  parseCommand, 
  validateCommand, 
  generateHelpText, 
  ParsedCommand 
} from '@/cli/commandParser';
import ClaudeService from '@/lib/claude/claudeService';
import { dockerSandbox } from '@/lib/sandbox/DockerSandbox';
import { useKanbanStore } from '@/stores/kanbanStore';
import { 
  executeBoardTool,
  ToolCall,
  BOARD_TOOLS
} from '@/cli/enhancedCLIService';

export interface UseCLIProps {
  onCommand?: (command: ParsedCommand) => Promise<void> | void;
  maxHistory?: number;
  claudeService?: ClaudeService;
  claudeEnabled?: boolean;
  thinkingMode?: boolean; // Enable thinking/reasoning visibility
}

  export interface UseCLIReturn {
  messages: CLIMessage[];
  isProcessing: boolean;
  cliHeight: number;
  setCLIHeight: (height: number) => void;
  handleCommandSubmit: (command: string) => void;
  handleClearOutput: () => void;
  addMessage: (message: Omit<CLIMessage, 'id' | 'timestamp'>) => string;
}

// Generate unique ID for messages
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * React hook for managing CLI state and command execution
 */
export const useCLI = ({ 
  onCommand, 
  maxHistory = 100,
  claudeService,
  claudeEnabled = false,
  thinkingMode = true // Default to showing thinking process
}: UseCLIProps = {}): UseCLIReturn => {
  const [messages, setMessages] = useState<CLIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cliHeight, setCLIHeight] = useState(300);
  const processingRef = useRef(false);

  /**
   * Add a message to the CLI output
   * @returns The ID of the created message (for creating child messages)
   */
  const addMessage = useCallback((message: Omit<CLIMessage, 'id' | 'timestamp'>) => {
    const newMessage: CLIMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, newMessage];
      // Keep only the last maxHistory messages
      if (updated.length > maxHistory) {
        return updated.slice(-maxHistory);
      }
      return updated;
    });
    
    return newMessage.id;
  }, [maxHistory]);

  /**
   * Clear all messages from the CLI output
   */
  const handleClearOutput = useCallback(() => {
    setMessages([]);
    addMessage({
      type: 'system',
      content: 'Output cleared.',
    });
  }, [addMessage]);

  /**
   * Process a command and generate responses
   */
  const processCommand = useCallback(async (commandText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      // Add user command to messages
      addMessage({
        type: 'user',
        content: commandText,
      });

      // Check if this is a bash/command execution
      if (commandText.startsWith('!')) {
        const bashCommand = commandText.slice(1).trim();
        addMessage({
          type: 'system',
          content: `Executing: ${bashCommand}`,
        });
        
        try {
          const result = await dockerSandbox.executeCommand('cli', bashCommand.split(' '), { timeout: 60000 });
          if (result.success) {
            addMessage({
              type: 'success',
              content: result.stdout || 'Command executed successfully',
            });
          } else {
            addMessage({
              type: 'error',
              content: result.stderr || 'Command failed',
            });
          }
        } catch (error) {
          addMessage({
            type: 'error',
            content: error instanceof Error ? error.message : 'Command execution failed',
          });
        }
        return;
      }

      // Use Claude if enabled
      if (claudeEnabled && claudeService) {
        try {
          // Get current board context
          const kanbanStore = useKanbanStore.getState();
          const boardContext = kanbanStore.currentBoard ? {
            boardName: kanbanStore.currentBoard.name,
            columns: kanbanStore.currentBoard.columns.map(c => c.title)
          } : undefined;

          // Track response time
          const startTime = Date.now();
          
          // Send to Claude with native tool support
          const response = await claudeService.sendMessage(commandText, boardContext);
          const responseTime = Date.now() - startTime;
          
          // Show main response text with response time
          if (response.text) {
            addMessage({
              type: 'ares',
              content: response.text,
              responseTime,
            });
          }

          // Execute any tool calls from Claude's native tool_use blocks
          if (response.toolCalls && response.toolCalls.length > 0) {
            // Create parent message for tool execution
            const toolParentMessageId = addMessage({
              type: 'tool',
              content: `🔧 Executing ${response.toolCalls.length} tool call(s)...`,
            });
            
            for (const toolUse of response.toolCalls) {
              // Track execution time for each tool
              const toolStartTime = Date.now();
              
              // Convert Claude's native ToolUse format to enhancedCLIService format
              const toolCall: ToolCall = {
                name: toolUse.name,
                arguments: toolUse.input
              };
              
              const result = await executeBoardTool(toolCall, kanbanStore);
              const toolResponseTime = Date.now() - toolStartTime;
              
              // Add tool call as child of parent message
              const toolCallMessageId = addMessage({
                type: 'tool',
                content: `call ${result.name}`,
                parentId: toolParentMessageId,
                responseTime: toolResponseTime,
              });
              
              // Add tool result as child of the tool call
              addMessage({
                type: result.success ? 'success' : 'error',
                content: `${result.success ? '✓' : '✗'} ${result.name}: ${result.success 
                  ? (typeof result.result === 'object' 
                    ? JSON.stringify(result.result, null, 2) 
                    : result.result)
                  : result.error}`,
                parentId: toolCallMessageId,
              });
              
              // If tool succeeded, add confirmation as child of result
              if (result.success) {
                const itemName = toolCall.arguments.title || toolCall.arguments.card_title || toolCall.arguments.name || 'item';
                addMessage({
                  type: 'ares',
                  content: `I've ${toolCall.name.replace(/_/g, ' ')} "${itemName}" successfully.`,
                  parentId: toolCallMessageId,
                });
              }
            }
          }
        } catch (error) {
          console.error('Claude processing error:', error);
          addMessage({
            type: 'error',
            content: error instanceof Error ? error.message : 'Claude processing failed',
          });
        }
        return;
      }

      // Parse the command (legacy mode without Claude)
      const parsed = parseCommand(commandText);

      // Validate the command
      const validation = validateCommand(parsed);
      if (!validation.valid) {
        addMessage({
          type: 'error',
          content: validation.error || 'Invalid command',
        });
        return;
      }

      // Handle built-in commands
      switch (parsed.type) {
        case 'help':
          const helpText = generateHelpText(parsed.action);
          addMessage({
            type: 'ares',
            content: helpText,
          });
          break;

        case 'clear':
          handleClearOutput();
          break;

        case 'unknown':
          addMessage({
            type: 'error',
            content: parsed.error || 'Unknown command',
          });
          break;

        default:
          // For other commands, call the external handler if provided
          if (onCommand) {
            try {
              await onCommand(parsed);
            } catch (error) {
              addMessage({
                type: 'error',
                content: error instanceof Error ? error.message : 'Command execution failed',
              });
            }
          } else {
            addMessage({
              type: 'ares',
              content: `Command "${parsed.type}" acknowledged. Configure Claude API for intelligent processing.`,
            });
          }
          break;
      }
    } catch (error) {
      addMessage({
        type: 'error',
        content: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [addMessage, handleClearOutput, onCommand, claudeService, claudeEnabled, thinkingMode]);

  /**
   * Handle command submission
   */
  const handleCommandSubmit = useCallback((command: string) => {
    if (!command.trim() || processingRef.current) return;
    processCommand(command.trim());
  }, [processCommand]);

  return {
    messages,
    isProcessing,
    cliHeight,
    setCLIHeight,
    handleCommandSubmit,
    handleClearOutput,
    addMessage,
  };
};

export default useCLI;
