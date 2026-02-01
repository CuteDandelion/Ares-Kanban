/**
 * Tests for useSandboxCLI hook
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSandboxCLI } from '@/hooks/useSandboxCLI';

// Mock fetch globally
global.fetch = jest.fn();

describe('useSandboxCLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('message management', () => {
    it('should start with empty messages', () => {
      const { result } = renderHook(() => useSandboxCLI());
      
      expect(result.current.messages).toEqual([]);
    });

    it('should add messages', () => {
      const { result } = renderHook(() => useSandboxCLI());
      
      act(() => {
        result.current.addMessage('user', 'Test message');
      });
      
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].type).toBe('user');
      expect(result.current.messages[0].content).toBe('Test message');
    });

    it('should clear messages', () => {
      const { result } = renderHook(() => useSandboxCLI());
      
      act(() => {
        result.current.addMessage('user', 'Message 1');
        result.current.addMessage('system', 'Message 2');
      });
      
      expect(result.current.messages).toHaveLength(2);
      
      act(() => {
        result.current.clearMessages();
      });
      
      expect(result.current.messages).toHaveLength(0);
    });

    it('should call onMessage callback', () => {
      const onMessage = jest.fn();
      const { result } = renderHook(() => useSandboxCLI({ onMessage }));
      
      act(() => {
        result.current.addMessage('ares', 'Test');
      });
      
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ares',
          content: 'Test',
        })
      );
    });
  });

  describe('command execution', () => {
    it('should throw error without cardId', async () => {
      const { result } = renderHook(() => useSandboxCLI());
      
      await expect(
        result.current.executeCommand(['npm', 'test'])
      ).rejects.toThrow('No cardId specified');
    });

    it('should execute command with default cardId', async () => {
      const mockResponse = {
        success: true,
        exitCode: 0,
        stdout: 'Test output',
        stderr: '',
        duration: 100,
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      await act(async () => {
        const response = await result.current.executeCommand(['npm', 'test']);
        expect(response).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sandbox/execute',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('test-card'),
        })
      );
    });

    it('should execute command with override cardId', async () => {
      const mockResponse = {
        success: true,
        exitCode: 0,
        stdout: 'Test',
        stderr: '',
        duration: 50,
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSandboxCLI({ cardId: 'default-card' }));
      
      await act(async () => {
        await result.current.executeCommand(['echo', 'hello'], { cardId: 'other-card' });
      });

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.cardId).toBe('other-card');
    });

    it('should add user message before execution', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          exitCode: 0,
          stdout: '',
          stderr: '',
          duration: 0,
        }),
      });

      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      await act(async () => {
        await result.current.executeCommand(['npm', 'test']);
      });

      const userMessage = result.current.messages.find(m => m.type === 'user');
      expect(userMessage).toBeDefined();
      expect(userMessage?.content).toBe('$ npm test');
    });

    it('should handle execution errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      const response = await act(async () => {
        return await result.current.executeCommand(['npm', 'test']);
      });

      expect(response.success).toBe(false);
      expect(response.exitCode).toBe(-1);
      
      const errorMessage = result.current.messages.find(m => m.type === 'error');
      expect(errorMessage).toBeDefined();
    });

    it('should set isProcessing during execution', async () => {
      let resolveExecution!: (value: any) => void;
      const executionPromise = new Promise(resolve => {
        resolveExecution = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(executionPromise);

      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      expect(result.current.isProcessing).toBe(false);
      
      act(() => {
        result.current.executeCommand(['npm', 'test']);
      });
      
      expect(result.current.isProcessing).toBe(true);
      
      // Resolve the execution
      resolveExecution({ ok: true, json: async () => ({ success: true, exitCode: 0, stdout: '', stderr: '', duration: 0 }) });
      
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      });
    });
  });

  describe('workspace management', () => {
    it('should create workspace', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          workspacePath: '/path/to/workspace',
          message: 'Workspace created',
        }),
      });

      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      const response = await act(async () => {
        return await result.current.createWorkspace('https://github.com/user/repo.git');
      });

      expect(response.success).toBe(true);
      expect(response.workspacePath).toBe('/path/to/workspace');
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sandbox/workspace',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('github.com/user/repo'),
        })
      );
    });

    it('should delete workspace', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Workspace deleted',
        }),
      });

      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      const response = await act(async () => {
        return await result.current.deleteWorkspace();
      });

      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sandbox/workspace?cardId=test-card',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should get workspace info', async () => {
      const mockInfo = {
        exists: true,
        path: '/path/to/workspace',
        size: 1024,
        fileCount: 5,
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockInfo,
      });

      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      const info = await act(async () => {
        return await result.current.getWorkspaceInfo();
      });

      expect(info).toEqual(mockInfo);
    });
  });

  describe('parse and execute', () => {
    it('should execute sandbox command with ! prefix', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          exitCode: 0,
          stdout: 'output',
          stderr: '',
          duration: 100,
        }),
      });

      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      await act(async () => {
        await result.current.parseAndExecute('!npm test');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sandbox/execute',
        expect.any(Object)
      );
    });

    it('should handle /help command', async () => {
      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      await act(async () => {
        await result.current.parseAndExecute('/help');
      });

      const aresMessage = result.current.messages.find(m => m.type === 'ares');
      expect(aresMessage).toBeDefined();
      expect(aresMessage?.content).toContain('Available commands');
    });

    it('should handle /clear command', async () => {
      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      act(() => {
        result.current.addMessage('user', 'Test');
      });
      
      expect(result.current.messages).toHaveLength(1);
      
      await act(async () => {
        await result.current.parseAndExecute('/clear');
      });
      
      // Should have 'Messages cleared' message
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Messages cleared.');
    });

    it('should handle unknown / command', async () => {
      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      await act(async () => {
        await result.current.parseAndExecute('/unknown');
      });

      const errorMessage = result.current.messages.find(m => m.type === 'error');
      expect(errorMessage).toBeDefined();
      expect(errorMessage?.content).toContain('Unknown command');
    });

    it('should handle regular message', async () => {
      const { result } = renderHook(() => useSandboxCLI({ cardId: 'test-card' }));
      
      await act(async () => {
        await result.current.parseAndExecute('Hello ARES');
      });

      const userMessage = result.current.messages.find(m => m.type === 'user');
      expect(userMessage?.content).toBe('Hello ARES');
      
      const aresMessage = result.current.messages.find(m => m.type === 'ares');
      expect(aresMessage).toBeDefined();
    });
  });

  describe('stats', () => {
    it('should get sandbox stats', async () => {
      const mockStats = {
        activeProcesses: 1,
        maxProcesses: 3,
        baseWorkspaceDir: '/home/user/.ares/workspaces',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const { result } = renderHook(() => useSandboxCLI());
      
      await act(async () => {
        await result.current.getStats();
      });

      expect(result.current.stats).toEqual(mockStats);
    });
  });
});
