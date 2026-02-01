/**
 * ARES CLI Hook
 * 
 * Provides a React hook for managing CLI state and command execution.
 * Integrates with Claude API for natural language command processing.
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

export interface UseCLIProps {
  onCommand?: (command: ParsedCommand) => Promise<void> | void;
  maxHistory?: number;
  claudeService?: ClaudeService;
  claudeEnabled?: boolean;
}

export interface UseCLIReturn {
  messages: CLIMessage[];
  isProcessing: boolean;
  cliHeight: number;
  setCLIHeight: (height: number) => void;
  handleCommandSubmit: (command: string) => void;
  handleClearOutput: () => void;
  addMessage: (message: Omit<CLIMessage, 'id' | 'timestamp'>) => void;
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
  claudeEnabled = false
}: UseCLIProps = {}): UseCLIReturn => {
  const [messages, setMessages] = useState<CLIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cliHeight, setCLIHeight] = useState(300);
  const processingRef = useRef(false);

  /**
   * Add a message to the CLI output
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
          const response = await claudeService.sendMessage(commandText);
          
          addMessage({
            type: 'ares',
            content: response.text,
          });

          // Execute any tool calls
          if (response.toolCalls && response.toolCalls.length > 0) {
            const results = await claudeService.executeTools(response.toolCalls);
            
            for (const result of results) {
              addMessage({
                type: result.success ? 'success' : 'error',
                content: `${result.name}: ${result.success ? 'Success' : 'Failed'} - ${JSON.stringify(result.result)}`,
              });
            }
          }
        } catch (error) {
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
  }, [addMessage, handleClearOutput, onCommand, claudeService, claudeEnabled]);

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
