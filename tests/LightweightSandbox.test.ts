/**
 * @jest-environment node
 */

import { LightweightSandbox } from '@/sandbox/LightweightSandbox';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

describe('LightweightSandbox', () => {
  let sandbox: LightweightSandbox;
  let testWorkspaceDir: string;

  beforeEach(async () => {
    // Create a temporary directory for tests
    testWorkspaceDir = path.join(os.tmpdir(), `ares-sandbox-test-${Date.now()}`);
    sandbox = new LightweightSandbox(testWorkspaceDir);
    await sandbox.initialize();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testWorkspaceDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    it('should create the base workspace directory', async () => {
      const stats = await fs.stat(testWorkspaceDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should initialize without errors', async () => {
      const newSandbox = new LightweightSandbox(path.join(os.tmpdir(), `test-${Date.now()}`));
      await expect(newSandbox.initialize()).resolves.not.toThrow();
    });
  });

  describe('workspace management', () => {
    it('should create a workspace for a card', async () => {
      const cardId = 'test-card-123';
      const workspacePath = await sandbox.createCardWorkspace(cardId);
      
      expect(workspacePath).toBe(path.join(testWorkspaceDir, `card-${cardId}-repo`));
      
      const stats = await fs.stat(workspacePath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should get workspace info', async () => {
      const cardId = 'test-card-456';
      await sandbox.createCardWorkspace(cardId);
      
      const info = await sandbox.getCardWorkspaceInfo(cardId);
      
      expect(info.exists).toBe(true);
      expect(info.path).toBe(path.join(testWorkspaceDir, `card-${cardId}-repo`));
      expect(info.fileCount).toBe(0);
    });

    it('should return non-existent info for unknown card', async () => {
      const info = await sandbox.getCardWorkspaceInfo('non-existent-card');
      
      expect(info.exists).toBe(false);
    });

    it('should delete a workspace', async () => {
      const cardId = 'test-card-789';
      await sandbox.createCardWorkspace(cardId);
      
      await sandbox.deleteCardWorkspace(cardId);
      
      const info = await sandbox.getCardWorkspaceInfo(cardId);
      expect(info.exists).toBe(false);
    });

    it('should list all workspaces', async () => {
      await sandbox.createCardWorkspace('card-1');
      await sandbox.createCardWorkspace('card-2');
      await sandbox.createCardWorkspace('card-3');
      
      const workspaces = await sandbox.listWorkspaces();
      
      expect(workspaces).toHaveLength(3);
      expect(workspaces.map(w => w.cardId).sort()).toEqual(['card-1', 'card-2', 'card-3']);
    });
  });

  describe('command validation', () => {
    it('should allow whitelisted commands', () => {
      expect(sandbox.isCommandAllowed('npm')).toBe(true);
      expect(sandbox.isCommandAllowed('git')).toBe(true);
      expect(sandbox.isCommandAllowed('node')).toBe(true);
      expect(sandbox.isCommandAllowed('ls')).toBe(true);
    });

    it('should block blacklisted commands', () => {
      expect(sandbox.isCommandAllowed('sudo')).toBe(false);
      expect(sandbox.isCommandAllowed('su')).toBe(false);
      expect(sandbox.isCommandAllowed('ssh')).toBe(false);
      expect(sandbox.isCommandAllowed('eval')).toBe(false);
    });

    it('should block unknown commands', () => {
      expect(sandbox.isCommandAllowed('unknown-command')).toBe(false);
      expect(sandbox.isCommandAllowed('malicious')).toBe(false);
    });

    it('should validate command array', () => {
      expect(() => sandbox.validateCommand(['npm', 'test'])).not.toThrow();
    });

    it('should reject empty commands', () => {
      expect(() => sandbox.validateCommand([])).toThrow('Command cannot be empty');
    });

    it('should reject blocked commands', () => {
      expect(() => sandbox.validateCommand(['sudo', 'ls'])).toThrow('not allowed for security reasons');
    });

    it('should reject command chaining', () => {
      expect(() => sandbox.validateCommand(['npm', 'test;', 'rm', '-rf', '/'])).toThrow('shell operators are not allowed');
      expect(() => sandbox.validateCommand(['npm', 'test', '&&', 'echo', 'done'])).toThrow('shell operators are not allowed');
    });
  });

  describe('command execution', () => {
    it('should execute a simple command', async () => {
      const cardId = 'exec-test-1';
      await sandbox.createCardWorkspace(cardId);
      
      const result = await sandbox.executeCommand(cardId, ['echo', 'hello']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('hello');
      expect(result.duration).toBeGreaterThan(0);
    }, 10000);

    it('should execute in the correct workspace', async () => {
      const cardId = 'exec-test-2';
      const workspacePath = await sandbox.createCardWorkspace(cardId);
      
      // Create a test file
      await fs.writeFile(path.join(workspacePath, 'test.txt'), 'workspace content');
      
      const result = await sandbox.executeCommand(cardId, ['cat', 'test.txt']);
      
      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('workspace content');
    }, 10000);

    it('should handle command failure', async () => {
      const cardId = 'exec-test-3';
      await sandbox.createCardWorkspace(cardId);
      
      const result = await sandbox.executeCommand(cardId, ['ls', 'non-existent-file']);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).not.toBe(0);
    }, 10000);

    it('should reject blocked commands', async () => {
      const cardId = 'exec-test-4';
      await sandbox.createCardWorkspace(cardId);
      
      await expect(sandbox.executeCommand(cardId, ['sudo', 'ls'])).rejects.toThrow('not allowed for security reasons');
    });

    it('should respect timeout', async () => {
      const cardId = 'exec-test-5';
      await sandbox.createCardWorkspace(cardId);
      
      // This command should timeout
      const result = await sandbox.executeCommand(cardId, ['sleep', '10'], { timeout: 100 });
      
      // Should be killed, so exit code will be non-zero
      expect(result.success).toBe(false);
    }, 15000);
  });

  describe('process management', () => {
    it('should track active processes', async () => {
      const cardId = 'process-test-1';
      await sandbox.createCardWorkspace(cardId);
      
      expect(sandbox.isCardActive(cardId)).toBe(false);
      
      // Start a long-running command
      const execPromise = sandbox.executeCommand(cardId, ['sleep', '2']);
      
      // Check it's active (may need a small delay for process to start)
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(sandbox.isCardActive(cardId)).toBe(true);
      
      // Wait for completion
      await execPromise;
      expect(sandbox.isCardActive(cardId)).toBe(false);
    }, 10000);

    it('should limit concurrent processes', async () => {
      const cardId = 'process-test-2';
      await sandbox.createCardWorkspace(cardId);
      
      // Mock having max processes
      for (let i = 0; i < 3; i++) {
        await sandbox.createCardWorkspace(`other-${i}`);
        // Start processes
        sandbox.executeCommand(`other-${i}`, ['sleep', '5']);
      }
      
      // Give processes time to start
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // This should fail due to max concurrent limit
      await expect(sandbox.executeCommand(cardId, ['echo', 'test'])).rejects.toThrow('Maximum concurrent processes');
      
      // Cleanup
      for (let i = 0; i < 3; i++) {
        await sandbox.cancelExecution(`other-${i}`);
      }
    }, 10000);

    it('should cancel execution', async () => {
      const cardId = 'process-test-3';
      await sandbox.createCardWorkspace(cardId);
      
      // Start a long command
      const execPromise = sandbox.executeCommand(cardId, ['sleep', '10']);
      
      // Give it time to start
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(sandbox.isCardActive(cardId)).toBe(true);
      
      // Cancel it
      await sandbox.cancelExecution(cardId);
      
      // Should no longer be active
      expect(sandbox.isCardActive(cardId)).toBe(false);
      
      // Clean up the promise
      try {
        await execPromise;
      } catch {
        // Expected to fail
      }
    }, 15000);
  });

  describe('resource stats', () => {
    it('should return resource stats', () => {
      const stats = sandbox.getResourceStats();
      
      expect(stats).toHaveProperty('activeProcesses');
      expect(stats).toHaveProperty('maxProcesses');
      expect(stats).toHaveProperty('baseWorkspaceDir');
      expect(stats.maxProcesses).toBe(3);
      expect(stats.baseWorkspaceDir).toBe(testWorkspaceDir);
    });
  });

  describe('cleanup', () => {
    it('should clean up all resources', async () => {
      const cardId = 'cleanup-test';
      await sandbox.createCardWorkspace(cardId);
      
      // Start a process
      sandbox.executeCommand(cardId, ['sleep', '10']);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(sandbox.isCardActive(cardId)).toBe(true);
      
      // Cleanup
      await sandbox.cleanup();
      
      expect(sandbox.isCardActive(cardId)).toBe(false);
    }, 15000);
  });
});
