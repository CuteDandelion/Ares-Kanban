/**
 * ARES Command Parser
 * 
 * Parses natural language commands for board manipulation.
 * Supports: create, delete, move, rename, search, help, clear
 */

export interface ParsedCommand {
  type: 'create' | 'delete' | 'move' | 'rename' | 'search' | 'help' | 'clear' | 'unknown';
  target?: 'card' | 'column' | 'board';
  action?: string;
  args: Record<string, any>;
  raw: string;
  isValid: boolean;
  error?: string;
}

// Command patterns for parsing
const COMMAND_PATTERNS = {
  // Create patterns
  createCard: /^(?:create|add|new)\s+(?:a\s+)?(?:card|task|issue)\s+(?:(?:called|named|titled)\s+)?["']?([^"']+)["']?(?:\s+in\s+["']?([^"']+)["']?)?(?:\s+.*)?$/i,
  createColumn: /^(?:create|add|new)\s+(?:a\s+)?(?:column|list|stage)\s+(?:(?:called|named)\s+)?["']?([^"']+)["']?(?:\s+.*)?$/i,
  
  // Delete patterns
  deleteCard: /^(?:delete|remove|destroy)\s+(?:card|task|issue)\s+(?:#(\d+)\s*|["']?([^"']+)["']?)$/i,
  deleteColumn: /^(?:delete|remove|destroy)\s+(?:column|list|stage)\s+["']?([^"']+)["']?$/i,
  
  // Move patterns
  moveCard: /^(?:move|transfer|shift)\s+(?:card|task|issue)\s+(?:#?(\d+)\s+|(?:["']?([^"']+)["']?\s+))?to\s+(?:column\s+)?["']?([^"']+)["']?$/i,
  
  // Rename patterns
  renameCard: /^(?:rename|retitle)\s+(?:card|task|issue)\s+(?:#?(\d+)\s+|(?:["']?([^"']+)["']?\s+))?to\s+["']?([^"']+)["']?$/i,
  renameColumn: /^(?:rename)\s+(?:column|list|stage)\s+["']?([^"']+)["']?\s+to\s+["']?([^"']+)["']?$/i,
  
  // Search patterns
  searchCards: /^(?:search|find|lookup)\s+(?:for\s+)?(?:cards?|tasks?|issues?)?\s*(?:with\s+|containing\s+)?["']?([^"']+)["']?(?:\s+.*)?$/i,
  
  // Help patterns
  help: /^(?:help|commands|\?|h)$/i,
  helpCommand: /^(?:help|\?)\s+(\w+)$/i,
  
  // Clear patterns
  clear: /^(?:clear|cls|clean)$/i,
};

// Extract flags from command string
const extractFlags = (input: string): Record<string, string | boolean> => {
  const flags: Record<string, string | boolean> = {};
  const flagRegex = /--(\w+)(?:\s+(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
  let match;
  
  while ((match = flagRegex.exec(input)) !== null) {
    const [, name, doubleQuoted, singleQuoted, unquoted] = match;
    const value = doubleQuoted || singleQuoted || unquoted;
    flags[name] = value || true;
  }
  
  return flags;
};

// Extract quoted strings
const extractQuotedStrings = (input: string): string[] => {
  const matches: string[] = [];
  const regex = /["']([^"']+)["']/g;
  let match;
  
  while ((match = regex.exec(input)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
};

/**
 * Parse a command string into a structured command object
 */
export const parseCommand = (input: string): ParsedCommand => {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      type: 'unknown',
      args: {},
      raw: trimmed,
      isValid: false,
      error: 'Empty command',
    };
  }
  
  const flags = extractFlags(trimmed);
  const lowerInput = trimmed.toLowerCase();
  
  // Check for help command
  if (COMMAND_PATTERNS.help.test(trimmed)) {
    return {
      type: 'help',
      args: { flags },
      raw: trimmed,
      isValid: true,
    };
  }
  
  const helpMatch = trimmed.match(COMMAND_PATTERNS.helpCommand);
  if (helpMatch) {
    return {
      type: 'help',
      action: helpMatch[1],
      args: { flags },
      raw: trimmed,
      isValid: true,
    };
  }
  
  // Check for clear command
  if (COMMAND_PATTERNS.clear.test(trimmed)) {
    return {
      type: 'clear',
      args: {},
      raw: trimmed,
      isValid: true,
    };
  }
  
  // Check for create card
  const createCardMatch = trimmed.match(COMMAND_PATTERNS.createCard);
  if (createCardMatch) {
    return {
      type: 'create',
      target: 'card',
      args: {
        title: createCardMatch[1].trim(),
        column: createCardMatch[2]?.trim(),
        priority: flags.priority as string | undefined,
        description: flags.description as string | undefined,
        tags: flags.tags ? String(flags.tags).split(',').map(t => t.trim()) : undefined,
        flags,
      },
      raw: trimmed,
      isValid: true,
    };
  }
  
  // Check for create column
  const createColumnMatch = trimmed.match(COMMAND_PATTERNS.createColumn);
  if (createColumnMatch) {
    return {
      type: 'create',
      target: 'column',
      args: {
        name: createColumnMatch[1].trim(),
        position: flags.position ? parseInt(String(flags.position), 10) : undefined,
        flags,
      },
      raw: trimmed,
      isValid: true,
    };
  }
  
  // Check for delete card (by ID or title)
  const deleteCardMatch = trimmed.match(COMMAND_PATTERNS.deleteCard);
  if (deleteCardMatch) {
    const cardId = deleteCardMatch[1];
    const cardTitle = deleteCardMatch[2];
    
    return {
      type: 'delete',
      target: 'card',
      args: {
        id: cardId ? parseInt(cardId, 10) : undefined,
        title: cardTitle?.trim(),
        flags,
      },
      raw: trimmed,
      isValid: true,
    };
  }
  
  // Check for delete column
  const deleteColumnMatch = trimmed.match(COMMAND_PATTERNS.deleteColumn);
  if (deleteColumnMatch) {
    return {
      type: 'delete',
      target: 'column',
      args: {
        name: deleteColumnMatch[1].trim(),
        flags,
      },
      raw: trimmed,
      isValid: true,
    };
  }
  
  // Check for move card
  const moveCardMatch = trimmed.match(COMMAND_PATTERNS.moveCard);
  if (moveCardMatch) {
    const cardId = moveCardMatch[1];
    const cardTitle = moveCardMatch[2];
    
    return {
      type: 'move',
      target: 'card',
      args: {
        id: cardId ? parseInt(cardId, 10) : undefined,
        title: cardTitle?.trim(),
        toColumn: moveCardMatch[3].trim(),
        flags,
      },
      raw: trimmed,
      isValid: true,
    };
  }
  
  // Check for rename card
  const renameCardMatch = trimmed.match(COMMAND_PATTERNS.renameCard);
  if (renameCardMatch) {
    const cardId = renameCardMatch[1];
    const cardTitle = renameCardMatch[2];
    
    return {
      type: 'rename',
      target: 'card',
      args: {
        id: cardId ? parseInt(cardId, 10) : undefined,
        title: cardTitle?.trim(),
        newTitle: renameCardMatch[3].trim(),
        flags,
      },
      raw: trimmed,
      isValid: true,
    };
  }
  
  // Check for rename column
  const renameColumnMatch = trimmed.match(COMMAND_PATTERNS.renameColumn);
  if (renameColumnMatch) {
    return {
      type: 'rename',
      target: 'column',
      args: {
        name: renameColumnMatch[1].trim(),
        newName: renameColumnMatch[2].trim(),
        flags,
      },
      raw: trimmed,
      isValid: true,
    };
  }
  
  // Check for search
  const searchMatch = trimmed.match(COMMAND_PATTERNS.searchCards);
  if (searchMatch) {
    return {
      type: 'search',
      args: {
        query: searchMatch[1].trim(),
        column: flags.column as string | undefined,
        priority: flags.priority as string | undefined,
        tag: flags.tag as string | undefined,
        flags,
      },
      raw: trimmed,
      isValid: true,
    };
  }
  
  // Unknown command
  return {
    type: 'unknown',
    args: { flags },
    raw: trimmed,
    isValid: false,
    error: `Unknown command: "${trimmed}". Type 'help' for available commands.`,
  };
};

/**
 * Validate a parsed command
 */
export const validateCommand = (command: ParsedCommand): { valid: boolean; error?: string } => {
  if (!command.isValid) {
    return { valid: false, error: command.error };
  }
  
  switch (command.type) {
    case 'create':
      if (command.target === 'card') {
        if (!command.args.title) {
          return { valid: false, error: 'Card title is required' };
        }
        if (command.args.priority) {
          const validPriorities = ['critical', 'high', 'medium', 'low'];
          if (!validPriorities.includes(String(command.args.priority).toLowerCase())) {
            return { valid: false, error: 'Priority must be: critical, high, medium, or low' };
          }
        }
      } else if (command.target === 'column') {
        if (!command.args.name) {
          return { valid: false, error: 'Column name is required' };
        }
      }
      break;
      
    case 'delete':
      if (command.target === 'card') {
        if (!command.args.id && !command.args.title) {
          return { valid: false, error: 'Card ID or title is required' };
        }
      } else if (command.target === 'column') {
        if (!command.args.name) {
          return { valid: false, error: 'Column name is required' };
        }
      }
      break;
      
    case 'move':
      if (!command.args.toColumn) {
        return { valid: false, error: 'Destination column is required' };
      }
      if (!command.args.id && !command.args.title) {
        return { valid: false, error: 'Card ID or title is required' };
      }
      break;
      
    case 'rename':
      if (command.target === 'card') {
        if (!command.args.newTitle) {
          return { valid: false, error: 'New title is required' };
        }
        if (!command.args.id && !command.args.title) {
          return { valid: false, error: 'Card ID or current title is required' };
        }
      } else if (command.target === 'column') {
        if (!command.args.name || !command.args.newName) {
          return { valid: false, error: 'Current and new column names are required' };
        }
      }
      break;
      
    case 'search':
      if (!command.args.query) {
        return { valid: false, error: 'Search query is required' };
      }
      break;
  }
  
  return { valid: true };
};

/**
 * Format a command for display
 */
export const formatCommandHelp = (type: string): string => {
  const help: Record<string, string> = {
    create: `create card "Title" in "Column" [--priority critical|high|medium|low] [--description "Text"] [--tags tag1,tag2]`,
    delete: `delete card "Title" | delete card #ID | delete column "Name"`,
    move: `move card "Title" to "Column" | move card #ID to "Column"`,
    rename: `rename card "Title" to "New Title" | rename column "Name" to "New Name"`,
    search: `search "query" [--column "Name"] [--priority high] [--tag bug]`,
    help: `help [command] - Show help for all commands or a specific command`,
    clear: `clear - Clear the CLI output`,
  };
  
  return help[type] || 'No help available';
};

/**
 * Get all available commands
 */
export const getAvailableCommands = (): string[] => {
  return ['create', 'delete', 'move', 'rename', 'search', 'help', 'clear'];
};

/**
 * Generate help text
 */
export const generateHelpText = (commandType?: string): string => {
  if (commandType) {
    const formatted = formatCommandHelp(commandType.toLowerCase());
    return `\n  ${commandType.toUpperCase()}\n  ${formatted}\n`;
  }
  
  return `
ARES COMMAND INTERFACE - AVAILABLE COMMANDS

BOARD MANIPULATION:
  create  - Create cards and columns
  delete  - Remove cards and columns
  move    - Move cards between columns
  rename  - Rename cards and columns

SEARCH & UTILITY:
  search  - Find cards by query
  help    - Show this help or command details
  clear   - Clear the CLI output

USAGE EXAMPLES:
  create card "Fix login bug" in "Backlog" --priority high
  move card "Fix login bug" to "In Progress"
  search "bug" --priority critical
  delete card #123
  rename column "Backlog" to "To Do"

Type "help <command>" for detailed syntax of a specific command.
`;
};
