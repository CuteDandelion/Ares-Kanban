'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// CLI Message types
interface CLIMessage {
  id: string;
  type: 'ares' | 'user' | 'agent' | 'system' | 'error' | 'success';
  content: string;
  timestamp: Date;
  agentName?: string;
}

interface CLIPanelProps {
  className?: string;
  onCommandSubmit?: (command: string) => void;
  messages?: CLIMessage[];
  isProcessing?: boolean;
}

// CLI Prompt component
const CLIPrompt = () => (
  <span className="text-ares-red-500 font-mono font-bold">ARES&gt;</span>
);

// Message type icons
const MessageIcon = ({ type }: { type: CLIMessage['type'] }) => {
  switch (type) {
    case 'ares':
      return <span className="text-ares-red-500">⚔️</span>;
    case 'user':
      return null;
    case 'agent':
      return <span className="text-orange-500">🤖</span>;
    case 'error':
      return <span className="text-red-500">❌</span>;
    case 'success':
      return <span className="text-green-500">✅</span>;
    default:
      return null;
  }
};

// Message type colors
const messageTypeClasses = {
  ares: 'text-ares-red-400',
  user: 'text-ares-red-300',
  agent: 'text-orange-400',
  system: 'text-ares-dark-400',
  error: 'text-red-400',
  success: 'text-green-400',
};

const CLIPanel = React.forwardRef<HTMLDivElement, CLIPanelProps>(
  ({ className, onCommandSubmit, messages = [], isProcessing = false }, ref) => {
    const [input, setInput] = React.useState('');
    const [history, setHistory] = React.useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = React.useState(-1);
    const outputRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom on new messages
    React.useEffect(() => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }, [messages]);

    // Focus input on mount
    React.useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isProcessing) return;

      // Add to history
      setHistory(prev => [...prev, input.trim()]);
      setHistoryIndex(-1);

      // Submit command
      onCommandSubmit?.(input.trim());
      setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Command history navigation
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length > 0) {
          const newIndex = historyIndex === -1 
            ? history.length - 1 
            : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setInput(history[newIndex] || '');
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex !== -1) {
          const newIndex = historyIndex + 1;
          if (newIndex >= history.length) {
            setHistoryIndex(-1);
            setInput('');
          } else {
            setHistoryIndex(newIndex);
            setInput(history[newIndex] || '');
          }
        }
      } else if (e.key === 'Escape') {
        // Clear input
        setInput('');
        setHistoryIndex(-1);
      } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+L to clear (would need parent component to handle)
        e.preventDefault();
      }
    };

    // Format timestamp
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col h-full bg-ares-dark-950',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-ares-dark-700 bg-ares-dark-900">
          <div className="flex items-center gap-3">
            <span className="text-ares-red-500 font-mono font-bold">⚔️ ARES Command Interface</span>
            <span className="text-xs text-ares-dark-400 bg-ares-dark-800 px-2 py-0.5 rounded">
              Claude Opus 4.5
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-status" />
              <span className="text-xs text-ares-dark-300">Online</span>
            </div>
          </div>
        </div>

        {/* Output Area */}
        <div
          ref={outputRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm cli-scrollbar space-y-2"
        >
          {messages.length === 0 ? (
            <div className="text-ares-dark-500 text-center py-8">
              <div className="mb-2">⚔️ Welcome to ARES Command Interface</div>
              <div className="text-xs">Type a command or ask ARES for assistance.</div>
              <div className="text-xs mt-1">Use <span className="text-ares-dark-400">help</span> for available commands.</div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2 animate-fade-in',
                  messageTypeClasses[message.type]
                )}
              >
                <span className="text-ares-dark-600 flex-shrink-0">
                  [{formatTime(message.timestamp)}]
                </span>
                <div className="flex gap-2">
                  {message.type !== 'user' && (
                    <span className="flex-shrink-0">
                      <MessageIcon type={message.type} />
                    </span>
                  )}
                  {message.agentName && (
                    <span className="text-orange-500 flex-shrink-0">
                      [{message.agentName}]
                    </span>
                  )}
                  {message.type === 'user' && (
                    <CLIPrompt />
                  )}
                  <span className="break-all">{message.content}</span>
                </div>
              </div>
            ))
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-ares-dark-400">
              <span className="text-ares-dark-600">[{formatTime(new Date())}]</span>
              <span>⚔️</span>
              <span>Thinking</span>
              <span className="flex gap-0.5">
                <span className="typing-dot">.</span>
                <span className="typing-dot">.</span>
                <span className="typing-dot">.</span>
              </span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-ares-dark-700 p-3 bg-ares-dark-900"
        >
          <div className="flex items-center gap-2">
            <CLIPrompt />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              disabled={isProcessing}
              className={cn(
                'flex-1 bg-transparent border-none outline-none',
                'font-mono text-sm text-white placeholder:text-ares-dark-500',
                'disabled:opacity-50'
              )}
              autoComplete="off"
              spellCheck={false}
            />
            {input && (
              <span className="text-xs text-ares-dark-600">
                ↵ Enter
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-ares-dark-500">
            <div className="flex gap-4">
              <span>↑↓ History</span>
              <span>Tab Autocomplete</span>
              <span>Esc Clear</span>
            </div>
            <div>
              {history.length} commands in history
            </div>
          </div>
        </form>
      </div>
    );
  }
);
CLIPanel.displayName = 'CLIPanel';

export { CLIPanel, type CLIPanelProps, type CLIMessage };
