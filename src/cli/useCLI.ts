/**
 * ARES CLI Hook
 * 
 * Provides a React hook for managing CLI state and command execution.
 * Integrates with the command parser and handles command processing.
 */

import { useState, useCallback, useRef } from 'react';
import { CLIMessage } from '@/components/layout/CLIPanel';
import { 
  parseCommand, 
  validateCommand, 
  generateHelpText, 
  ParsedCommand 
} from '@/cli/commandParser';

export interface UseCLIProps {
  onCommand?: (command: ParsedCommand) => Promise<void> | void;
  maxHistory?: number;
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
export const useCLI = ({ onCommand, maxHistory = 100 }: UseCLIProps = {}): UseCLIReturn => {
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

      // Parse the command
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
            // No handler provided - acknowledge receipt
            addMessage({
              type: 'ares',
              content: `⚔️ Mission accepted. Processing "${parsed.type} ${parsed.target || ''}" command...`,
            });

            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            addMessage({
              type: 'success',
              content: `Command "${parsed.type}" executed successfully.`,
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
  }, [addMessage, handleClearOutput, onCommand]);

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
