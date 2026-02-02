/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useCLI } from '@/cli/useCLI';

describe('useCLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useCLI());
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.cliHeight).toBe(300);
  });

  it('should add messages', () => {
    const { result } = renderHook(() => useCLI());
    
    act(() => {
      result.current.addMessage({
        type: 'ares',
        content: 'Test message',
      });
    });
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].type).toBe('ares');
    expect(result.current.messages[0].content).toBe('Test message');
    expect(result.current.messages[0].id).toBeDefined();
    expect(result.current.messages[0].timestamp).toBeInstanceOf(Date);
  });

  it('should clear output', () => {
    const { result } = renderHook(() => useCLI());
    
    act(() => {
      result.current.addMessage({ type: 'ares', content: 'Message 1' });
      result.current.addMessage({ type: 'user', content: 'Message 2' });
    });
    
    expect(result.current.messages).toHaveLength(2);
    
    act(() => {
      result.current.handleClearOutput();
    });
    
    // Should have the system message indicating output was cleared
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].type).toBe('system');
    expect(result.current.messages[0].content).toBe('Output cleared.');
  });

  it('should handle help command', async () => {
    const { result } = renderHook(() => useCLI());
    
    await act(async () => {
      result.current.handleCommandSubmit('help');
    });
    
    expect(result.current.messages).toHaveLength(2); // user command + ares response
    expect(result.current.messages[0].type).toBe('user');
    expect(result.current.messages[0].content).toBe('help');
    expect(result.current.messages[1].type).toBe('ares');
    expect(result.current.messages[1].content).toContain('AVAILABLE COMMANDS');
  });

  it('should handle clear command', async () => {
    const { result } = renderHook(() => useCLI());
    
    act(() => {
      result.current.addMessage({ type: 'ares', content: 'Test' });
    });
    
    await act(async () => {
      result.current.handleCommandSubmit('clear');
    });
    
    // Should only have the system message
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].type).toBe('system');
  });

  it('should handle unknown command', async () => {
    const { result } = renderHook(() => useCLI());
    
    await act(async () => {
      result.current.handleCommandSubmit('unknowncommand');
    });
    
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].type).toBe('user');
    expect(result.current.messages[1].type).toBe('error');
    expect(result.current.messages[1].content).toContain('Unknown command');
  });

  it('should handle unknown command when title is missing', async () => {
    const { result } = renderHook(() => useCLI());
    
    await act(async () => {
      result.current.handleCommandSubmit('create card');
    });
    
    // "create card" without title doesn't match any regex pattern, so it's unknown
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].type).toBe('error');
    expect(result.current.messages[1].content).toContain('Unknown command');
  });

  it('should call onCommand handler for valid commands', async () => {
    const onCommand = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useCLI({ onCommand }));
    
    await act(async () => {
      result.current.handleCommandSubmit('create card "Test" in "Backlog"');
    });
    
    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'create',
        target: 'card',
        args: expect.objectContaining({
          title: 'Test',
          column: 'Backlog',
        }),
      })
    );
  });

  it('should handle onCommand errors', async () => {
    const onCommand = jest.fn().mockRejectedValue(new Error('Execution failed'));
    const { result } = renderHook(() => useCLI({ onCommand }));
    
    await act(async () => {
      result.current.handleCommandSubmit('create card "Test"');
    });
    
    expect(result.current.messages).toHaveLength(2); // user + error (no processing acknowledgment when onCommand is provided)
    expect(result.current.messages[result.current.messages.length - 1].type).toBe('error');
    expect(result.current.messages[result.current.messages.length - 1].content).toBe('Execution failed');
  });

  it('should set CLI height', () => {
    const { result } = renderHook(() => useCLI());
    
    act(() => {
      result.current.setCLIHeight(450);
    });
    
    expect(result.current.cliHeight).toBe(450);
  });

  it('should limit message history', () => {
    const { result } = renderHook(() => useCLI({ maxHistory: 3 }));
    
    act(() => {
      result.current.addMessage({ type: 'ares', content: '1' });
      result.current.addMessage({ type: 'ares', content: '2' });
      result.current.addMessage({ type: 'ares', content: '3' });
      result.current.addMessage({ type: 'ares', content: '4' });
    });
    
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[0].content).toBe('2');
    expect(result.current.messages[2].content).toBe('4');
  });

  it('should not process empty commands', async () => {
    const { result } = renderHook(() => useCLI());
    
    await act(async () => {
      result.current.handleCommandSubmit('');
      result.current.handleCommandSubmit('   ');
    });
    
    expect(result.current.messages).toHaveLength(0);
  });

  it('should prevent concurrent command processing', async () => {
    const onCommand = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    const { result } = renderHook(() => useCLI({ onCommand }));
    
    act(() => {
      result.current.handleCommandSubmit('create card "Test 1"');
    });
    
    expect(result.current.isProcessing).toBe(true);
    
    // Try to submit another command while processing
    act(() => {
      result.current.handleCommandSubmit('create card "Test 2"');
    });
    
    // Should not have processed the second command
    expect(onCommand).toHaveBeenCalledTimes(1);
  });
});
