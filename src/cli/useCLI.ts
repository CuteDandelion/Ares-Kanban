/**
 * ARES CLI Hook - Hybrid Memory + Chain of Thought
 * 
 * Enhanced CLI hook with:
 * - Contextual memory persistence (localStorage)
 * - Chain of Thought reasoning visibility
 * - Context reference resolution ("it", "that", etc.)
 * - Multi-step ReAct pattern
 * - Memory statistics display
 * 
 * This replaces the basic useCLI hook with a fully-featured
 * hybrid system combining memory and reasoning.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
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
import { 
  HybridOrchestrator, 
  HybridEvent,
  HybridConfig,
  MemoryManager,
  ReActEngine,
  getHybridOrchestrator
} from '@/memory';

export interface UseCLIProps {
  onCommand?: (command: ParsedCommand) => Promise<void> | void;
  maxHistory?: number;
  claudeService?: ClaudeService;
  claudeEnabled?: boolean;
  thinkingMode?: boolean;
  memoryEnabled?: boolean;
  hybridConfig?: HybridConfig;
}

export interface UseCLIReturn {
  messages: CLIMessage[];
  isProcessing: boolean;
  cliHeight: number;
  setCLIHeight: (height: number) => void;
  handleCommandSubmit: (command: string) => void;
  handleClearOutput: () => void;
  addMessage: (message: Omit<CLIMessage, 'id' | 'timestamp'>) => string;
  
  // Memory features
  memoryStats: {
    totalEntries: number;
    sessionCount: number;
    storageSize: string;
  } | null;
  clearMemory: () => void;
  showMemoryPanel: boolean;
  setShowMemoryPanel: (show: boolean) => void;
  
  // Chain of Thought features
  currentThinking: string | null;
  reactSteps: Array<{ type: string; content: string }>;
}

// Generate unique ID for messages
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * React hook for managing CLI state with Hybrid Memory + Chain of Thought
 */
export const useCLI = ({ 
  onCommand, 
  maxHistory = 100,
  claudeService,
  claudeEnabled = false,
  thinkingMode = true,
  memoryEnabled = true,
  hybridConfig = {},
}: UseCLIProps = {}): UseCLIReturn => {
  const [messages, setMessages] = useState<CLIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cliHeight, setCLIHeight] = useState(300);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [currentThinking, setCurrentThinking] = useState<string | null>(null);
  const [reactSteps, setReactSteps] = useState<Array<{ type: string; content: string }>>([]);
  const [memoryStats, setMemoryStats] = useState<UseCLIReturn['memoryStats']>(null);
  
  const processingRef = useRef(false);
  const orchestratorRef = useRef<HybridOrchestrator | null>(null);

  // Initialize orchestrator
  useEffect(() => {
    if (memoryEnabled || thinkingMode) {
      orchestratorRef.current = getHybridOrchestrator({
        ...hybridConfig,
        enableMemory: memoryEnabled,
        enableThinking: thinkingMode,
      });

      // Subscribe to events
      const unsubscribe = orchestratorRef.current.onEvent((event: HybridEvent) => {
        handleHybridEvent(event);
      });

      // Update memory stats
      updateMemoryStats();

      return () => {
        unsubscribe();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryEnabled, thinkingMode]);

  /**
   * Update memory statistics
   */
  const updateMemoryStats = useCallback(() => {
    if (orchestratorRef.current) {
      const stats = orchestratorRef.current.getMemoryStats();
      setMemoryStats({
        totalEntries: stats.totalEntries,
        sessionCount: stats.sessionCount,
        storageSize: stats.storageSize,
      });
    }
  }, []);

  /**
   * Handle hybrid orchestrator events
   */
  const handleHybridEvent = useCallback((event: HybridEvent) => {
    switch (event.type) {
      case 'thinking':
        const step = event.data as { content: string };
        setCurrentThinking(step.content);
        setReactSteps(prev => [...prev, { type: 'thinking', content: step.content }]);
        break;

      case 'tool_start':
        setReactSteps(prev => [...prev, { 
          type: 'action', 
          content: 'Executing tool...' 
        }]);
        break;

      case 'tool_complete':
        setReactSteps(prev => [...prev, { 
          type: 'result', 
          content: 'Complete' 
        }]);
        break;

      case 'memory_update':
        // Handled separately
        break;

      case 'complete':
        setCurrentThinking(null);
        break;

      case 'error':
        setCurrentThinking(null);
        break;
    }
  }, []);

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
    setReactSteps([]);
    addMessage({
      type: 'system',
      content: 'Output cleared.',
    });
  }, [addMessage]);

  /**
   * Clear memory
   */
  const clearMemory = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.clearMemory();
      updateMemoryStats();
      addMessage({
        type: 'system',
        content: 'Memory cleared. Conversation history has been reset.',
      });
    }
  }, [addMessage, updateMemoryStats]);

  /**
   * Process a command with Hybrid Memory + Chain of Thought
   */
  const processCommand = useCallback(async (commandText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setReactSteps([]);

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

      // Check for memory management commands
      if (commandText.toLowerCase() === '/memory clear') {
        clearMemory();
        return;
      }

      if (commandText.toLowerCase() === '/memory stats') {
        const stats = orchestratorRef.current?.getMemoryStats();
        if (stats) {
          addMessage({
            type: 'system',
            content: `Memory Stats:\n- Total entries: ${stats.totalEntries}\n- Sessions: ${stats.sessionCount}\n- Storage: ${stats.storageSize}`,
          });
        }
        return;
      }

      if (commandText.toLowerCase() === '/memory show') {
        setShowMemoryPanel(true);
        addMessage({
          type: 'system',
          content: 'Memory panel opened.',
        });
        return;
      }

      // Use Claude with Hybrid Orchestrator if enabled
      if (claudeEnabled && claudeService && orchestratorRef.current) {
        try {
          // Show context resolution if applicable
          const session = orchestratorRef.current.getActiveSession();
          
          // Execute with hybrid orchestrator
          const result = await orchestratorRef.current.execute(
            commandText,
            {
              sendMessage: async (messages, tools) => {
                const kanbanStore = useKanbanStore.getState();
                const boardContext = kanbanStore.currentBoard ? {
                  boardName: kanbanStore.currentBoard.name,
                  columns: kanbanStore.currentBoard.columns.map(c => c.title)
                } : undefined;

                const response = await claudeService.sendMessage(
                  messages[messages.length - 1].content,
                  boardContext,
                  {
                    previousMessages: messages.slice(0, -1).map(m => ({
                      role: m.role as 'user' | 'assistant',
                      content: m.content,
                    })),
                    enableMemory: memoryEnabled,
                    enableThinking: thinkingMode,
                  }
                );

                return {
                  text: response.text,
                  toolCalls: response.toolCalls?.map(tc => ({
                    name: tc.name,
                    input: tc.input,
                  })),
                };
              },
            }
          );

          // Show final response
          if (result.finalResponse) {
            // Add context resolution info if applicable
            if (result.contextUsed && result.resolvedReferences && result.resolvedReferences.length > 0) {
              addMessage({
                type: 'system',
                content: `Context: Referenced ${result.resolvedReferences.join(', ')}`,
              });
            }

            addMessage({
              type: 'ares',
              content: result.finalResponse,
            });
          }

          // Show completion summary
          const toolCount = result.reactSession.steps.filter(s => s.type === 'action').length;
          if (toolCount > 0) {
            addMessage({
              type: 'success',
              content: `✓ Completed with ${toolCount} tool execution(s)`,
            });
          }

        } catch (error) {
          console.error('Hybrid processing error:', error);
          addMessage({
            type: 'error',
            content: error instanceof Error ? error.message : 'Processing failed',
          });
        }
        return;
      }

      // Fallback: Use basic Claude without hybrid features
      if (claudeEnabled && claudeService) {
        try {
          const kanbanStore = useKanbanStore.getState();
          const boardContext = kanbanStore.currentBoard ? {
            boardName: kanbanStore.currentBoard.name,
            columns: kanbanStore.currentBoard.columns.map(c => c.title)
          } : undefined;

          const startTime = Date.now();
          const response = await claudeService.sendMessage(commandText, boardContext);
          const responseTime = Date.now() - startTime;
          
          if (response.text) {
            addMessage({
              type: 'ares',
              content: response.text,
              responseTime,
            });
          }

          // Execute tool calls
          if (response.toolCalls && response.toolCalls.length > 0) {
            const toolParentMessageId = addMessage({
              type: 'tool',
              content: `🔧 Executing ${response.toolCalls.length} tool call(s)...`,
            });
            
            for (const toolUse of response.toolCalls) {
              const toolStartTime = Date.now();
              
              const toolCall: ToolCall = {
                name: toolUse.name,
                arguments: toolUse.input
              };
              
              const result = await executeBoardTool(toolCall, kanbanStore);
              const toolResponseTime = Date.now() - toolStartTime;
              
              const toolCallMessageId = addMessage({
                type: 'tool',
                content: `call ${result.name}`,
                parentId: toolParentMessageId,
                responseTime: toolResponseTime,
              });
              
              addMessage({
                type: result.success ? 'success' : 'error',
                content: `${result.success ? '✓' : '✗'} ${result.name}: ${result.success 
                  ? (typeof result.result === 'object' 
                    ? JSON.stringify(result.result, null, 2) 
                    : result.result)
                  : result.error}`,
                parentId: toolCallMessageId,
              });
              
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

      // Legacy mode without Claude
      const parsed = parseCommand(commandText);
      const validation = validateCommand(parsed);
      
      if (!validation.valid) {
        addMessage({
          type: 'error',
          content: validation.error || 'Invalid command',
        });
        return;
      }

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
      setCurrentThinking(null);
    }
  }, [addMessage, handleClearOutput, onCommand, claudeService, claudeEnabled, thinkingMode, memoryEnabled, clearMemory]);

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
    
    // Memory features
    memoryStats,
    clearMemory,
    showMemoryPanel,
    setShowMemoryPanel,
    
    // Chain of Thought features
    currentThinking,
    reactSteps,
  };
};

export default useCLI;
