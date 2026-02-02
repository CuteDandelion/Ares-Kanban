'use client';

import { useState, useCallback, useRef } from 'react';

export interface CLIMessage {
  id: string;
  type: 'ares' | 'user' | 'system' | 'error' | 'success' | 'output';
  content: string;
  timestamp: Date;
}

export interface SandboxExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export interface SandboxStats {
  activeProcesses: number;
  maxProcesses: number;
  baseWorkspaceDir: string;
}

export interface UseSandboxCLIOptions {
  cardId?: string;
  onMessage?: (message: CLIMessage) => void;
}

/**
 * Hook for interacting with the lightweight sandbox via CLI
 * 
 * @example
 * const { 
 *   messages, 
 *   isProcessing, 
 *   executeCommand, 
 *   createWorkspace,
 *   clearMessages 
 * } = useSandboxCLI({ cardId: '123' });
 * 
 * // Execute a command
 * await executeCommand(['npm', 'test']);
 * 
 * // Create a workspace
 * await createWorkspace('https://github.com/user/repo.git');
 */
export function useSandboxCLI(options: UseSandboxCLIOptions = {}) {
  const { cardId: defaultCardId, onMessage } = options;
  
  const [messages, setMessages] = useState<CLIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<SandboxStats | null>(null);
  const messageIdRef = useRef(0);

  const generateMessageId = () => {
    messageIdRef.current += 1;
    return `msg-${Date.now()}-${messageIdRef.current}`;
  };

  const addMessage = useCallback((type: CLIMessage['type'], content: string) => {
    const message: CLIMessage = {
      id: generateMessageId(),
      type,
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, message]);
    onMessage?.(message);
    
    return message;
  }, [onMessage]);

  /**
   * Execute a command in the sandbox
   */
  const executeCommand = useCallback(async (
    command: string[],
    opts: { 
      cardId?: string; 
      timeout?: number;
      showOutput?: boolean;
    } = {}
  ): Promise<SandboxExecutionResult> => {
    const targetCardId = opts.cardId || defaultCardId;
    
    if (!targetCardId) {
      const error = 'No cardId specified. Either provide it in options or set a default in useSandboxCLI.';
      addMessage('error', error);
      throw new Error(error);
    }

    setIsProcessing(true);
    addMessage('user', `$ ${command.join(' ')}`);

    try {
      const response = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: targetCardId,
          command,
          options: {
            timeout: opts.timeout || 300000,
          },
        }),
      });

      const result: SandboxExecutionResult = await response.json();

      if (!response.ok) {
        const errorMsg = result.stderr || 'Command execution failed';
        addMessage('error', errorMsg);
        return result;
      }

      // Add stdout output if present and showOutput is true
      if (opts.showOutput !== false && result.stdout) {
        addMessage('output', result.stdout);
      }

      // Add stderr output if present (usually warnings)
      if (result.stderr) {
        addMessage('system', `stderr: ${result.stderr}`);
      }

      // Show success or error based on exit code
      if (result.success) {
        addMessage('success', `✓ Command completed in ${result.duration}ms`);
      } else {
        addMessage('error', `✗ Command failed with exit code ${result.exitCode}`);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addMessage('error', `Execution error: ${errorMsg}`);
      
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: errorMsg,
        duration: 0,
      };
    } finally {
      setIsProcessing(false);
    }
  }, [defaultCardId, addMessage]);

  /**
   * Create a workspace for a card
   */
  const createWorkspace = useCallback(async (
    githubRepoUrl?: string,
    branch?: string,
    opts: { cardId?: string } = {}
  ): Promise<{ success: boolean; workspacePath?: string; message?: string }> => {
    const targetCardId = opts.cardId || defaultCardId;
    
    if (!targetCardId) {
      const error = 'No cardId specified';
      addMessage('error', error);
      throw new Error(error);
    }

    setIsProcessing(true);
    addMessage('system', `Creating workspace for card ${targetCardId}...`);

    try {
      const response = await fetch('/api/sandbox/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: targetCardId,
          githubRepoUrl,
          branch: branch || 'main',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        addMessage('error', result.error || 'Failed to create workspace');
        return { success: false, message: result.error };
      }

      addMessage('success', result.message);
      return { success: true, workspacePath: result.workspacePath, message: result.message };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addMessage('error', `Failed to create workspace: ${errorMsg}`);
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  }, [defaultCardId, addMessage]);

  /**
   * Delete a workspace for a card
   */
  const deleteWorkspace = useCallback(async (
    opts: { cardId?: string } = {}
  ): Promise<{ success: boolean; message?: string }> => {
    const targetCardId = opts.cardId || defaultCardId;
    
    if (!targetCardId) {
      const error = 'No cardId specified';
      addMessage('error', error);
      throw new Error(error);
    }

    setIsProcessing(true);
    addMessage('system', `Deleting workspace for card ${targetCardId}...`);

    try {
      const response = await fetch(`/api/sandbox/workspace?cardId=${targetCardId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        addMessage('error', result.error || 'Failed to delete workspace');
        return { success: false, message: result.error };
      }

      addMessage('success', result.message);
      return { success: true, message: result.message };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addMessage('error', `Failed to delete workspace: ${errorMsg}`);
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  }, [defaultCardId, addMessage]);

  /**
   * Get workspace info for a card
   */
  const getWorkspaceInfo = useCallback(async (
    opts: { cardId?: string } = {}
  ): Promise<{
    exists: boolean;
    path: string;
    size?: number;
    fileCount?: number;
  }> => {
    const targetCardId = opts.cardId || defaultCardId;
    
    if (!targetCardId) {
      throw new Error('No cardId specified');
    }

    try {
      const response = await fetch(`/api/sandbox/workspace?cardId=${targetCardId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get workspace info');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get workspace info:', error);
      return { exists: false, path: '' };
    }
  }, [defaultCardId]);

  /**
   * Get sandbox stats
   */
  const getStats = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/sandbox/execute');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to get sandbox stats:', error);
    }
  }, []);

  /**
   * Cancel an ongoing execution
   */
  const cancelExecution = useCallback(async (
    opts: { cardId?: string } = {}
  ): Promise<void> => {
    const targetCardId = opts.cardId || defaultCardId;
    
    if (!targetCardId) {
      throw new Error('No cardId specified');
    }

    try {
      const response = await fetch('/api/sandbox/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: targetCardId,
          action: 'cancel',
        }),
      });

      if (response.ok) {
        addMessage('system', 'Execution cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  }, [defaultCardId, addMessage]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Parse and execute a CLI command
   * Supports:
   * - !command (execute in sandbox)
   * - /command (special CLI commands)
   * - Regular text (treated as message)
   */
  const parseAndExecute = useCallback(async (
    input: string,
    opts: { cardId?: string } = {}
  ): Promise<void> => {
    const trimmed = input.trim();
    
    if (!trimmed) return;

    // Sandbox command (starts with !)
    if (trimmed.startsWith('!')) {
      const commandStr = trimmed.slice(1).trim();
      const command = commandStr.split(/\s+/);
      await executeCommand(command, { cardId: opts.cardId, showOutput: true });
      return;
    }

    // CLI special commands (start with /)
    if (trimmed.startsWith('/')) {
      const parts = trimmed.slice(1).split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      switch (cmd) {
        case 'help':
          addMessage('ares', `Available commands:
/help - Show this help
/workspace [create|delete|info] - Manage workspace
/stats - Show sandbox stats
/clear - Clear messages
!command - Execute command in sandbox (e.g., !npm test)`);
          break;

        case 'clear':
          clearMessages();
          addMessage('ares', 'Messages cleared.');
          break;

        case 'stats':
          await getStats();
          if (stats) {
            addMessage('ares', `Sandbox Stats:
Active Processes: ${stats.activeProcesses}/${stats.maxProcesses}
Workspace Dir: ${stats.baseWorkspaceDir}`);
          }
          break;

        case 'workspace':
          if (args[0] === 'create') {
            await createWorkspace(args[1], args[2], { cardId: opts.cardId });
          } else if (args[0] === 'delete') {
            await deleteWorkspace({ cardId: opts.cardId });
          } else if (args[0] === 'info') {
            const info = await getWorkspaceInfo({ cardId: opts.cardId });
            addMessage('ares', `Workspace Info:
Exists: ${info.exists ? 'Yes' : 'No'}
Path: ${info.path}
Size: ${info.size ? `${(info.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
Files: ${info.fileCount || 0}`);
          } else {
            addMessage('error', 'Usage: /workspace [create|delete|info] [repo-url] [branch]');
          }
          break;

        default:
          addMessage('error', `Unknown command: /${cmd}. Type /help for available commands.`);
      }
      return;
    }

    // Regular message
    addMessage('user', trimmed);
    addMessage('ares', 'Command received. Use /help for available commands or ! to execute sandbox commands.');
  }, [executeCommand, createWorkspace, deleteWorkspace, getWorkspaceInfo, getStats, clearMessages, addMessage, stats]);

  return {
    // State
    messages,
    isProcessing,
    stats,
    
    // Actions
    executeCommand,
    createWorkspace,
    deleteWorkspace,
    getWorkspaceInfo,
    getStats,
    cancelExecution,
    clearMessages,
    parseAndExecute,
    addMessage,
  };
}

export default useSandboxCLI;
