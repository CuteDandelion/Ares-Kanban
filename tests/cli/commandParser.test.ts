/**
 * @jest-environment jsdom
 */

import { parseCommand, validateCommand, generateHelpText, getAvailableCommands } from '@/cli/commandParser';
import type { ParsedCommand } from '@/cli/commandParser';

describe('Command Parser', () => {
  describe('parseCommand', () => {
    describe('Help commands', () => {
      it('should parse help command', () => {
        const result = parseCommand('help');
        expect(result.type).toBe('help');
        expect(result.isValid).toBe(true);
      });

      it('should parse help with specific command', () => {
        const result = parseCommand('help create');
        expect(result.type).toBe('help');
        expect(result.action).toBe('create');
        expect(result.isValid).toBe(true);
      });

      it('should parse ? shorthand', () => {
        const result = parseCommand('?');
        expect(result.type).toBe('help');
        expect(result.isValid).toBe(true);
      });
    });

    describe('Clear command', () => {
      it('should parse clear command', () => {
        const result = parseCommand('clear');
        expect(result.type).toBe('clear');
        expect(result.isValid).toBe(true);
      });

      it('should parse cls shorthand', () => {
        const result = parseCommand('cls');
        expect(result.type).toBe('clear');
        expect(result.isValid).toBe(true);
      });
    });

    describe('Create commands', () => {
      it('should parse create card command', () => {
        const result = parseCommand('create card "Test Card" in "Backlog"');
        expect(result.type).toBe('create');
        expect(result.target).toBe('card');
        expect(result.args.title).toBe('Test Card');
        expect(result.args.column).toBe('Backlog');
        expect(result.isValid).toBe(true);
      });

      it('should parse create card without column', () => {
        const result = parseCommand('create card "Test Card"');
        expect(result.type).toBe('create');
        expect(result.target).toBe('card');
        expect(result.args.title).toBe('Test Card');
        expect(result.isValid).toBe(true);
      });

      it('should parse create card with flags', () => {
        const result = parseCommand('create card "Test Card" in "Backlog" --priority high --description "Test description"');
        expect(result.type).toBe('create');
        expect(result.target).toBe('card');
        expect(result.args.title).toBe('Test Card');
        expect(result.args.priority).toBe('high');
        expect(result.args.description).toBe('Test description');
      });

      it('should parse create column command', () => {
        const result = parseCommand('create column "In Progress"');
        expect(result.type).toBe('create');
        expect(result.target).toBe('column');
        expect(result.args.name).toBe('In Progress');
      });

      it('should parse create column with position flag', () => {
        const result = parseCommand('create column "Review" --position 3');
        expect(result.type).toBe('create');
        expect(result.target).toBe('column');
        expect(result.args.name).toBe('Review');
        expect(result.args.position).toBe(3);
      });
    });

    describe('Delete commands', () => {
      it('should parse delete card by title', () => {
        const result = parseCommand('delete card "Test Card"');
        expect(result.type).toBe('delete');
        expect(result.target).toBe('card');
        expect(result.args.title).toBe('Test Card');
      });

      it('should parse delete card by ID', () => {
        const result = parseCommand('delete card #123');
        expect(result.type).toBe('delete');
        expect(result.target).toBe('card');
        expect(result.args.id).toBe(123);
      });

      it('should parse delete column command', () => {
        const result = parseCommand('delete column "Backlog"');
        expect(result.type).toBe('delete');
        expect(result.target).toBe('column');
        expect(result.args.name).toBe('Backlog');
      });
    });

    describe('Move commands', () => {
      it('should parse move card by title', () => {
        const result = parseCommand('move card "Test Card" to "In Progress"');
        expect(result.type).toBe('move');
        expect(result.target).toBe('card');
        expect(result.args.title).toBe('Test Card');
        expect(result.args.toColumn).toBe('In Progress');
      });

      it('should parse move card by ID', () => {
        const result = parseCommand('move card #456 to "Done"');
        expect(result.type).toBe('move');
        expect(result.target).toBe('card');
        expect(result.args.id).toBe(456);
        expect(result.args.toColumn).toBe('Done');
      });
    });

    describe('Rename commands', () => {
      it('should parse rename card by title', () => {
        const result = parseCommand('rename card "Old Title" to "New Title"');
        expect(result.type).toBe('rename');
        expect(result.target).toBe('card');
        expect(result.args.title).toBe('Old Title');
        expect(result.args.newTitle).toBe('New Title');
      });

      it('should parse rename column', () => {
        const result = parseCommand('rename column "Backlog" to "To Do"');
        expect(result.type).toBe('rename');
        expect(result.target).toBe('column');
        expect(result.args.name).toBe('Backlog');
        expect(result.args.newName).toBe('To Do');
      });
    });

    describe('Search commands', () => {
      it('should parse search command', () => {
        const result = parseCommand('search "bug fix"');
        expect(result.type).toBe('search');
        expect(result.args.query).toBe('bug fix');
      });

      it('should parse search with flags', () => {
        const result = parseCommand('search "urgent" --priority critical --column "Backlog"');
        expect(result.type).toBe('search');
        expect(result.args.query).toBe('urgent');
        expect(result.args.priority).toBe('critical');
        expect(result.args.column).toBe('Backlog');
      });
    });

    describe('Unknown commands', () => {
      it('should return unknown for unrecognized commands', () => {
        const result = parseCommand('foobar');
        expect(result.type).toBe('unknown');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Unknown command');
      });

      it('should handle empty input', () => {
        const result = parseCommand('');
        expect(result.type).toBe('unknown');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Empty command');
      });
    });
  });

  describe('validateCommand', () => {
    it('should validate create card with title', () => {
      const command: ParsedCommand = {
        type: 'create',
        target: 'card',
        args: { title: 'Test Card' },
        raw: 'create card "Test Card"',
        isValid: true,
      };
      const result = validateCommand(command);
      expect(result.valid).toBe(true);
    });

    it('should reject create card without title', () => {
      const command: ParsedCommand = {
        type: 'create',
        target: 'card',
        args: {},
        raw: 'create card',
        isValid: true,
      };
      const result = validateCommand(command);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('title is required');
    });

    it('should validate delete card with ID', () => {
      const command: ParsedCommand = {
        type: 'delete',
        target: 'card',
        args: { id: 123 },
        raw: 'delete card #123',
        isValid: true,
      };
      const result = validateCommand(command);
      expect(result.valid).toBe(true);
    });

    it('should reject move without destination', () => {
      const command: ParsedCommand = {
        type: 'move',
        target: 'card',
        args: { id: 123 },
        raw: 'move card #123',
        isValid: true,
      };
      const result = validateCommand(command);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Destination column is required');
    });

    it('should validate priority values', () => {
      const command: ParsedCommand = {
        type: 'create',
        target: 'card',
        args: { title: 'Test', priority: 'invalid' },
        raw: 'create card "Test" --priority invalid',
        isValid: true,
      };
      const result = validateCommand(command);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Priority must be');
    });
  });

  describe('generateHelpText', () => {
    it('should generate general help text', () => {
      const helpText = generateHelpText();
      expect(helpText).toContain('AVAILABLE COMMANDS');
      expect(helpText).toContain('create');
      expect(helpText).toContain('delete');
      expect(helpText).toContain('move');
      expect(helpText).toContain('search');
    });

    it('should generate specific command help', () => {
      const helpText = generateHelpText('create');
      expect(helpText).toContain('CREATE');
      expect(helpText).toContain('create card');
    });
  });

  describe('getAvailableCommands', () => {
    it('should return list of available commands', () => {
      const commands = getAvailableCommands();
      expect(commands).toContain('create');
      expect(commands).toContain('delete');
      expect(commands).toContain('move');
      expect(commands).toContain('rename');
      expect(commands).toContain('search');
      expect(commands).toContain('help');
      expect(commands).toContain('clear');
    });
  });
});
