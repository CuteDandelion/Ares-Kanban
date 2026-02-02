/**
 * ARES CLI Module
 * 
 * Provides command-line interface functionality for ARES Command Center.
 * Includes command parsing, validation, help system, and React hooks.
 */

// Command Parser
export {
  parseCommand,
  validateCommand,
  formatCommandHelp,
  getAvailableCommands,
  generateHelpText,
} from './commandParser';

export type {
  ParsedCommand,
} from './commandParser';

// React Hook
export {
  useCLI,
} from './useCLI';

export type {
  UseCLIProps,
  UseCLIReturn,
} from './useCLI';
