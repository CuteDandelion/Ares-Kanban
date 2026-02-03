'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PulsingStatusDot, StatusState } from '@/components/ui/PulsingStatusDot';

export interface CLIMessage {
  id: string;
  type: 'ares' | 'user' | 'agent' | 'system' | 'error' | 'success' | 'thinking' | 'tool';
  content: string;
  timestamp: Date;
  agentName?: string;
  responseTime?: number; // Response time in milliseconds
  parentId?: string; // Parent message ID for hierarchical display
  isCollapsed?: boolean; // Whether child messages are collapsed
  toolName?: string; // Name of the tool being called (for tool type messages)
}

export type SyntaxToken = {
  type: 'keyword' | 'string' | 'number' | 'flag' | 'identifier' | 'operator' | 'text';
  value: string;
};

const COMMAND_KEYWORDS = [
  'create', 'delete', 'move', 'rename', 'search', 'help', 'clear',
  'card', 'column', 'board', 'agent', 'task', 'show', 'list'
];

const OPERATORS = ['in', 'to', 'from', 'with', 'by'];

export interface CLIPanelProps {
  className?: string;
  onCommandSubmit?: (command: string) => void;
  onClearOutput?: () => void;
  messages?: CLIMessage[];
  isProcessing?: boolean;
  height?: number;
  onHeightChange?: (height: number) => void;
}

export interface AutocompleteSuggestion {
  text: string;
  description: string;
  type: 'command' | 'argument' | 'flag';
}

export const AUTOCOMPLETE_SUGGESTIONS: AutocompleteSuggestion[] = [
  { text: 'create', description: 'Create a new card, column, or board', type: 'command' },
  { text: 'delete', description: 'Delete a card or column', type: 'command' },
  { text: 'move', description: 'Move a card to another column', type: 'command' },
  { text: 'rename', description: 'Rename a card or column', type: 'command' },
  { text: 'search', description: 'Search for cards', type: 'command' },
  { text: 'help', description: 'Show help information', type: 'command' },
  { text: 'clear', description: 'Clear the CLI output', type: 'command' },
  { text: 'card', description: 'Target a card', type: 'argument' },
  { text: 'column', description: 'Target a column', type: 'argument' },
  { text: 'board', description: 'Target a board', type: 'argument' },
  { text: 'agent', description: 'Target an agent', type: 'argument' },
  { text: 'task', description: 'Target a task', type: 'argument' },
  { text: 'show', description: 'Show details', type: 'command' },
  { text: 'list', description: 'List items', type: 'command' },
  { text: '--priority', description: 'Set priority (critical|high|medium|low)', type: 'flag' },
  { text: '--description', description: 'Add a description', type: 'flag' },
  { text: '--tags', description: 'Add tags (comma-separated)', type: 'flag' },
  { text: '--assignee', description: 'Assign to user', type: 'flag' },
  { text: '--due', description: 'Set due date', type: 'flag' },
  { text: '--status', description: 'Set status', type: 'flag' },
];

const CLIPrompt = () => (
  <span className="text-cyan-400 font-mono font-bold">USER&gt;</span>
);

// Recursive MessageItem component for hierarchical display
interface MessageItemProps {
  message: CLIMessage;
  formatTimestamp: (date: Date) => string;
  depth?: number;
  getChildMessages: (id: string) => CLIMessage[];
}

const MessageItem = ({ message, formatTimestamp, depth = 0, getChildMessages }: MessageItemProps) => {
  const childMessages = getChildMessages(message.id);
  const hasChildren = childMessages.length > 0;
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  const getIndentClass = (d: number) => {
    switch (d) {
      case 0: return '';
      case 1: return 'ml-6';
      case 2: return 'ml-12';
      default: return `ml-${Math.min(d * 6, 24)}`;
    }
  };
  
  return (
    <div className={cn('animate-fade-in', getIndentClass(depth))}>
      <div className={cn('flex gap-2', message.type === 'user' && depth === 0 && 'ml-4')}>
        <span className="text-ares-dark-500 text-xs shrink-0 pt-0.5">
          {formatTimestamp(message.timestamp)}
        </span>
        <span className="shrink-0">
          <MessageIcon type={message.type} />
        </span>
        {message.type === 'user' ? (
          <span className={messageTypeClasses.user}>
            <CLIPrompt /> {message.content}
          </span>
        ) : message.type === 'agent' && message.agentName ? (
          <div className="flex flex-col">
            <span className="text-purple-400 text-xs">[{message.agentName}]</span>
            <span className={messageTypeClasses[message.type]}>
              {message.content}
            </span>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className={messageTypeClasses[message.type]}>
                {hasChildren && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mr-1 text-ares-dark-400 hover:text-white transition-colors"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                )}
                {message.content}
              </span>
            </div>
            {message.responseTime && message.responseTime > 0 && (
              <span className="text-ares-dark-500 text-xs mt-0.5">
                ✓ Response time: {(message.responseTime / 1000).toFixed(2)}s
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Render child messages if expanded */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {childMessages.map(child => (
            <MessageItem
              key={child.id}
              message={child}
              formatTimestamp={formatTimestamp}
              depth={depth + 1}
              getChildMessages={getChildMessages}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MessageIcon = ({ type }: { type: CLIMessage['type'] }) => {
  switch (type) {
    case 'ares':
      return <PulsingStatusDot state="info" size="sm" pulse={false} />;
    case 'user':
      return <span className="text-cyan-500">⌨️</span>;
    case 'agent':
      return <PulsingStatusDot state="agent" size="sm" pulse={false} />;
    case 'thinking':
      return <PulsingStatusDot state="thinking" size="sm" pulse />;
    case 'tool':
      return <PulsingStatusDot state="tool" size="sm" pulse={false} />;
    case 'error':
      return <PulsingStatusDot state="error" size="sm" pulse={false} />;
    case 'success':
      return <PulsingStatusDot state="success" size="sm" pulse={false} />;
    case 'system':
      return <span className="text-ares-dark-500">⚙️</span>;
    default:
      return null;
  }
};

const messageTypeClasses = {
  ares: 'text-blue-400',           // ARES responses - blue (calm, AI-like)
  user: 'text-cyan-400',           // User input - cyan (distinct from ARES)
  agent: 'text-purple-400',        // Agent messages - purple
  system: 'text-ares-dark-400',    // System messages - gray
  error: 'text-red-400',           // Errors - red
  success: 'text-emerald-400',     // Success - emerald green
  thinking: 'text-amber-400',      // Thinking/processing - amber
  tool: 'text-violet-400',         // Tool execution - violet
};

const tokenTypeClasses = {
  keyword: 'text-purple-400 font-semibold',
  string: 'text-green-400',
  number: 'text-blue-400',
  flag: 'text-yellow-400',
  identifier: 'text-cyan-400',
  operator: 'text-ares-dark-300',
  text: 'text-white',
};

export const highlightSyntax = (input: string): SyntaxToken[] => {
  const tokens: SyntaxToken[] = [];
  const regex = /("[^"]*"|'[^']*'|\S+)/g;
  let match;

  while ((match = regex.exec(input)) !== null) {
    const token = match[1];
    let type: SyntaxToken['type'] = 'text';

    if ((token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))) {
      type = 'string';
    }
    else if (token.startsWith('--') || (token.startsWith('-') && token.length === 2)) {
      type = 'flag';
    }
    else if (/^\d+$/.test(token)) {
      type = 'number';
    }
    else if (COMMAND_KEYWORDS.includes(token.toLowerCase())) {
      type = 'keyword';
    }
    else if (OPERATORS.includes(token.toLowerCase())) {
      type = 'operator';
    }
    else if (/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(token)) {
      type = 'identifier';
    }

    tokens.push({ type, value: token });
  }

  return tokens;
};

const SyntaxHighlightedInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    placeholder?: string;
  }
>(
  ({ value, onChange, onKeyDown, disabled, placeholder }, ref) => {
    return (
      <div className="flex-1">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'w-full bg-transparent border-none outline-none',
            'font-mono text-sm text-white caret-white',
            'disabled:opacity-50 placeholder:text-ares-dark-500'
          )}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    );
  }
);
SyntaxHighlightedInput.displayName = 'SyntaxHighlightedInput';

export function CLIPanel({
  className,
  onCommandSubmit,
  onClearOutput,
  messages = [],
  isProcessing = false,
  height = 200,
  onHeightChange,
}: CLIPanelProps) {
  const [input, setInput] = React.useState('');
  const [panelHeight, setPanelHeight] = React.useState(height);
  const [isResizing, setIsResizing] = React.useState(false);
  const [commandHistory, setCommandHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [showAutocomplete, setShowAutocomplete] = React.useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = React.useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<AutocompleteSuggestion[]>([]);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const resizeStartY = React.useRef(0);
  const resizeStartHeight = React.useRef(0);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle resize
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = resizeStartY.current - e.clientY;
      const newHeight = Math.max(100, Math.min(600, resizeStartHeight.current + deltaY));
      setPanelHeight(newHeight);
      onHeightChange?.(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onHeightChange]);

  // Update height when prop changes
  React.useEffect(() => {
    setPanelHeight(height);
  }, [height]);

  // Filter autocomplete suggestions based on input
  React.useEffect(() => {
    if (!input.trim()) {
      setShowAutocomplete(false);
      return;
    }

    const lastWord = input.split(/\s+/).pop() || '';
    if (lastWord.length < 1) {
      setShowAutocomplete(false);
      return;
    }

    const filtered = AUTOCOMPLETE_SUGGESTIONS.filter(
      (suggestion) =>
        suggestion.text.toLowerCase().startsWith(lastWord.toLowerCase())
    );

    if (filtered.length > 0) {
      setFilteredSuggestions(filtered);
      setShowAutocomplete(true);
      setAutocompleteIndex(0);
    } else {
      setShowAutocomplete(false);
    }
  }, [input]);

  const handleSubmit = React.useCallback(() => {
    if (!input.trim() || isProcessing) return;

    const command = input.trim();
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);
    setInput('');
    setShowAutocomplete(false);
    onCommandSubmit?.(command);
  }, [input, isProcessing, onCommandSubmit]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Tab autocomplete
      if (e.key === 'Tab') {
        e.preventDefault();
        if (showAutocomplete && filteredSuggestions.length > 0) {
          const suggestion = filteredSuggestions[autocompleteIndex];
          const words = input.split(/\s+/);
          words[words.length - 1] = suggestion.text;
          setInput(words.join(' ') + ' ');
          setShowAutocomplete(false);
        }
        return;
      }

      // Escape to clear input
      if (e.key === 'Escape') {
        e.preventDefault();
        setInput('');
        setShowAutocomplete(false);
        return;
      }

      // Ctrl+L to clear output
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        onClearOutput?.();
        return;
      }

      // Up arrow for history
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (showAutocomplete) {
          setAutocompleteIndex((prev) =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
        } else if (commandHistory.length > 0) {
          const newIndex = historyIndex + 1;
          if (newIndex < commandHistory.length) {
            setHistoryIndex(newIndex);
            setInput(commandHistory[commandHistory.length - 1 - newIndex]);
          }
        }
        return;
      }

      // Down arrow for history
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (showAutocomplete) {
          setAutocompleteIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
        } else if (historyIndex >= 0) {
          const newIndex = historyIndex - 1;
          if (newIndex >= 0) {
            setHistoryIndex(newIndex);
            setInput(commandHistory[commandHistory.length - 1 - newIndex]);
          } else {
            setHistoryIndex(-1);
            setInput('');
          }
        }
        return;
      }

      // Enter to submit
      if (e.key === 'Enter') {
        handleSubmit();
      }
    },
    [
      showAutocomplete,
      filteredSuggestions,
      autocompleteIndex,
      input,
      commandHistory,
      historyIndex,
      handleSubmit,
      onClearOutput,
    ]
  );

  const handleResizeStart = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = panelHeight;
    setIsResizing(true);
  }, [panelHeight]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // Organize messages hierarchically
  const organizeMessagesHierarchically = (msgs: CLIMessage[]) => {
    const parentMap = new Map<string, CLIMessage[]>();
    const rootMessages: CLIMessage[] = [];
    const messageMap = new Map<string, CLIMessage>();
    
    // First pass: build message map
    msgs.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    // Second pass: organize into hierarchy
    msgs.forEach(msg => {
      if (msg.parentId) {
        if (!parentMap.has(msg.parentId)) {
          parentMap.set(msg.parentId, []);
        }
        parentMap.get(msg.parentId)!.push(msg);
      } else {
        rootMessages.push(msg);
      }
    });
    
    return { rootMessages, parentMap, messageMap };
  };

  const { rootMessages, parentMap, messageMap } = organizeMessagesHierarchically(messages);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col bg-ares-dark-900 border-t border-ares-dark-700',
        'shadow-cli',
        className
      )}
      style={{ height: panelHeight }}
    >
      {/* Resize Handle */}
      <div
        className={cn(
          'h-1 w-full cursor-ns-resize flex items-center justify-center',
          'hover:bg-ares-red-500/20 transition-colors',
          isResizing && 'bg-ares-red-500/40'
        )}
        onMouseDown={handleResizeStart}
      >
        <div className="w-12 h-1 rounded-full bg-ares-dark-600" />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
        {messages.length === 0 ? (
          <div className="text-ares-dark-500 text-center py-8">
            <p className="mb-2">Welcome to ARES CLI</p>
            <p className="text-xs text-ares-dark-400">
              Type a command or press <kbd className="px-1 py-0.5 bg-ares-dark-750 rounded">Tab</kbd> for autocomplete
            </p>
            <p className="text-xs text-ares-dark-400 mt-1">
              <kbd className="px-1 py-0.5 bg-ares-dark-750 rounded">Ctrl+L</kbd> to clear ·
              <kbd className="px-1 py-0.5 bg-ares-dark-750 rounded ml-1">Esc</kbd> to clear input ·
              <kbd className="px-1 py-0.5 bg-ares-dark-750 rounded ml-1">↑↓</kbd> for history
            </p>
          </div>
        ) : (
          rootMessages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              formatTimestamp={formatTimestamp}
              depth={0}
              getChildMessages={(id) => parentMap.get(id) || []}
            />
          ))
        )}
        {isProcessing && (
          <div className="flex gap-2 items-center">
            <span className="text-ares-dark-500 text-xs">
              {formatTimestamp(new Date())}
            </span>
            <PulsingStatusDot state="thinking" size="sm" pulse showLabel label="Thinking..." />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-ares-dark-700 p-3 bg-ares-dark-850">
        <div className="relative">
          <div className="flex items-center gap-2">
            <CLIPrompt />
            <SyntaxHighlightedInput
              ref={inputRef}
              value={input}
              onChange={setInput}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              placeholder="Enter command..."
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showAutocomplete && filteredSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-ares-dark-800 border border-ares-dark-700 rounded-md shadow-lg overflow-hidden z-50">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.text}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                    'hover:bg-ares-dark-700 transition-colors',
                    index === autocompleteIndex && 'bg-ares-dark-750'
                  )}
                  onClick={() => {
                    const words = input.split(/\s+/);
                    words[words.length - 1] = suggestion.text;
                    setInput(words.join(' ') + ' ');
                    setShowAutocomplete(false);
                    inputRef.current?.focus();
                  }}
                >
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      suggestion.type === 'command' && 'bg-purple-500/20 text-purple-400',
                      suggestion.type === 'argument' && 'bg-cyan-500/20 text-cyan-400',
                      suggestion.type === 'flag' && 'bg-yellow-500/20 text-yellow-400'
                    )}
                  >
                    {suggestion.type}
                  </span>
                  <span className="font-mono text-white">{suggestion.text}</span>
                  <span className="text-ares-dark-400 text-xs ml-auto">
                    {suggestion.description}
                  </span>
                </button>
              ))}
              <div className="px-3 py-1 bg-ares-dark-900 text-xs text-ares-dark-500 border-t border-ares-dark-700">
                Press <kbd className="px-1 bg-ares-dark-750 rounded">Tab</kbd> to accept ·
                <kbd className="px-1 bg-ares-dark-750 rounded ml-1">↑↓</kbd> to navigate
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="flex items-center justify-between mt-2 text-xs text-ares-dark-500">
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-ares-dark-750 rounded text-ares-dark-300">Tab</kbd>
              <span>autocomplete</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-ares-dark-750 rounded text-ares-dark-300">↑↓</kbd>
              <span>history</span>
            </span>
          </div>
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-ares-dark-750 rounded text-ares-dark-300">Ctrl+L</kbd>
              <span>clear</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-ares-dark-750 rounded text-ares-dark-300">Esc</kbd>
              <span>clear input</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CLIPanel;
