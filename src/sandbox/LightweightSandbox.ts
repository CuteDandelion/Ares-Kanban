import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

export interface SandboxConfig {
  cardId: string;
  githubRepoUrl?: string;
  branch?: string;
  workingDir: string;
}

export interface ExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export interface ExecutionOptions {
  timeout?: number;
  maxBuffer?: number;
  env?: Record<string, string>;
  streaming?: boolean;
}

export interface StreamData {
  type: 'stdout' | 'stderr';
  data: string;
  timestamp: number;
}

/**
 * Lightweight Process-Based Sandbox
 * 
 * Executes commands using Node.js child_process instead of Docker containers.
 * Provides directory-based isolation with command whitelist/blacklist security.
 * 
 * Resource Usage:
 * - RAM: ~50MB per running process (not per card!)
 * - CPU: Only when process is running
 * - Disk: ~10MB per card (just files, no overhead)
 * - Containers: ZERO
 * 
 * @example
 * const sandbox = new LightweightSandbox();
 * await sandbox.initialize();
 * 
 * // Create workspace for card
 * const workspace = await sandbox.createCardWorkspace('card-123', 'https://github.com/user/repo.git');
 * 
 * // Execute command
 * const result = await sandbox.executeCommand('card-123', ['npm', 'test']);
 */
export class LightweightSandbox extends EventEmitter {
  private baseWorkspaceDir: string;
  private activeProcesses: Map<string, any> = new Map();
  
  // Maximum concurrent processes (for local PC)
  private maxConcurrentProcesses = 3;
  
  // Allowed commands whitelist
  private allowedCommands = new Set([
    // Package managers
    'npm', 'yarn', 'pnpm', 'npx',
    // Version control
    'git', 'gh',
    // Build tools
    'node', 'tsc', 'vite', 'webpack', 'rollup', 'esbuild',
    // Testing
    'jest', 'vitest', 'playwright', 'cypress', 'mocha', 'jasmine',
    // Linting
    'eslint', 'prettier', 'stylelint',
    // Python (if needed)
    'python', 'python3', 'pip', 'pip3', 'pytest',
    // Ruby (if needed)
    'ruby', 'bundle', 'gem', 'rake',
    // Go (if needed)
    'go',
    // Rust (if needed)
    'cargo', 'rustc',
    // Utilities
    'ls', 'cat', 'pwd', 'echo', 'mkdir', 'cp', 'mv', 'rm',
    'touch', 'grep', 'find', 'cd', 'curl', 'wget', 'which',
    'head', 'tail', 'less', 'more', 'sort', 'uniq', 'wc',
    'tar', 'zip', 'unzip', 'gzip', 'gunzip',
    'date', 'whoami', 'uname', 'env',
    // Process management (for testing)
    'sleep', 'timeout', 'ping',
  ]);
  
  // Dangerous commands blacklist
  private blockedCommands = new Set([
    // Privilege escalation
    'sudo', 'su', 'passwd', 'doas', 'pkexec',
    // File system dangerous
    'chmod', 'chown', 'chgrp', 'mkfs', 'fdisk', 'dd', 'format',
    'fsck', 'mkswap', 'swapon', 'swapoff',
    // System dangerous
    'shutdown', 'reboot', 'poweroff', 'halt', 'init',
    'systemctl', 'service', 'telinit',
    // Process dangerous
    'kill', 'pkill', 'killall', 'xkill',
    // Network dangerous
    'nc', 'netcat', 'telnet', 'ncat',
    'ssh', 'scp', 'sftp', 'rsync',
    // Shell dangerous
    'eval', 'exec', 'source', '.',
    'bash', 'sh', 'zsh', 'fish', 'csh',
    // Script dangerous
    'perl', 'awk', 'sed', 'expect',
  ]);

  constructor(customBaseDir?: string) {
    super();
    // Store workspaces in user's home directory
    this.baseWorkspaceDir = customBaseDir || path.join(os.homedir(), '.ares', 'workspaces');
  }

  /**
   * Initialize the sandbox by creating the base workspace directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.baseWorkspaceDir, { recursive: true });
      console.log(`📁 Sandbox workspace: ${this.baseWorkspaceDir}`);
    } catch (error) {
      console.error('Failed to initialize sandbox:', error);
      throw new Error(`Failed to initialize sandbox: ${error}`);
    }
  }

  /**
   * Get the workspace path for a card
   */
  getCardWorkspacePath(cardId: string): string {
    return path.join(this.baseWorkspaceDir, `card-${cardId}-repo`);
  }

  /**
   * Create a workspace directory for a card
   * Optionally clone a GitHub repository into it
   */
  async createCardWorkspace(
    cardId: string, 
    githubRepoUrl?: string,
    branch: string = 'main'
  ): Promise<string> {
    const workspacePath = this.getCardWorkspacePath(cardId);
    
    // Create directory
    await fs.mkdir(workspacePath, { recursive: true });
    
    // Clone repo if provided
    if (githubRepoUrl) {
      try {
        // Check if directory is empty
        const files = await fs.readdir(workspacePath);
        if (files.length === 0) {
          await this.executeCommand(
            cardId,
            ['git', 'clone', '--branch', branch, '--single-branch', '--depth', '1', githubRepoUrl, '.'],
            { timeout: 120000 }
          );
        }
      } catch (error) {
        console.error(`Failed to clone repo for card ${cardId}:`, error);
        // Don't throw - workspace is still created, just empty
      }
    }
    
    return workspacePath;
  }

  /**
   * Delete a card's workspace directory
   */
  async deleteCardWorkspace(cardId: string): Promise<void> {
    // Cancel any running processes
    await this.cancelExecution(cardId);
    
    // Delete workspace
    const workspacePath = this.getCardWorkspacePath(cardId);
    try {
      await fs.rm(workspacePath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to delete workspace for card ${cardId}:`, error);
    }
  }

  /**
   * Check if a command is allowed
   */
  isCommandAllowed(cmd: string): boolean {
    // Check blacklist first
    if (this.blockedCommands.has(cmd)) {
      return false;
    }
    
    // Check whitelist
    return this.allowedCommands.has(cmd);
  }

  /**
   * Validate a command before execution
   */
  validateCommand(command: string[]): void {
    if (command.length === 0) {
      throw new Error('Command cannot be empty');
    }
    
    const [cmd] = command;
    
    if (!this.isCommandAllowed(cmd)) {
      throw new Error(`Command '${cmd}' is not allowed for security reasons`);
    }
    
    // Additional validation: check for command chaining
    const commandString = command.join(' ');
    const dangerousPatterns = [
      /;\s*\w+/,       // command; command
      /&&\s*\w+/,      // command && command
      /\|\s*\w+/,      // command | command
      />\s*\w+/,       // command > file
      /<\s*\w+/,       // command < file
      /`.*`/,          // backticks
      /\$\(.*\)/,      // $(command)
      /\$\{.*\}/,      // ${variable}
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(commandString)) {
        throw new Error('Command chaining and shell operators are not allowed for security reasons');
      }
    }
  }

  /**
   * Execute a command in a card's workspace
   */
  async executeCommand(
    cardId: string,
    command: string[],
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    // Validate command
    this.validateCommand(command);
    
    const [cmd, ...args] = command;
    const workspacePath = this.getCardWorkspacePath(cardId);
    
    // Ensure workspace exists
    await fs.mkdir(workspacePath, { recursive: true });
    
    // Check concurrent process limit
    if (this.activeProcesses.size >= this.maxConcurrentProcesses) {
      throw new Error(`Maximum concurrent processes (${this.maxConcurrentProcesses}) reached. Please wait for existing processes to complete.`);
    }
    
    // Sanitize environment variables
    const sanitizedEnv = this.sanitizeEnvironment(options?.env);
    
    // Set spawn options
    const spawnOptions: any = {
      cwd: workspacePath,
      env: sanitizedEnv,
      timeout: options?.timeout || 300000, // 5 min default
      maxBuffer: options?.maxBuffer || 10 * 1024 * 1024, // 10MB
      windowsHide: true, // Hide console window on Windows
    };

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Spawn process (NOT a container!)
      let child;
      try {
        child = spawn(cmd, args, spawnOptions);
      } catch (error) {
        reject(new Error(`Failed to spawn process: ${error}`));
        return;
      }
      
      // Track active process
      this.activeProcesses.set(cardId, child);
      
      let stdout = '';
      let stderr = '';
      
      // Capture output
      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          const chunk = data.toString();
          stdout += chunk;
          
          // Stream to agent in real-time if streaming is enabled
          if (options?.streaming) {
            this.emitOutput(cardId, { type: 'stdout', data: chunk, timestamp: Date.now() });
          }
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          const chunk = data.toString();
          stderr += chunk;
          
          // Stream to agent in real-time if streaming is enabled
          if (options?.streaming) {
            this.emitOutput(cardId, { type: 'stderr', data: chunk, timestamp: Date.now() });
          }
        });
      }
      
      // Handle timeout
      const timeoutId = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
          setTimeout(() => {
            if (!child.killed) {
              child.kill('SIGKILL');
            }
          }, 5000);
        }
      }, spawnOptions.timeout);
      
      // Handle completion
      child.on('close', (exitCode) => {
        clearTimeout(timeoutId);
        this.activeProcesses.delete(cardId);
        
        resolve({
          success: exitCode === 0,
          exitCode: exitCode || 0,
          stdout,
          stderr,
          duration: Date.now() - startTime,
        });
      });
      
      child.on('error', (error) => {
        clearTimeout(timeoutId);
        this.activeProcesses.delete(cardId);
        reject(error);
      });
    });
  }

  /**
   * Execute a command with streaming output
   */
  async *executeCommandStream(
    cardId: string,
    command: string[],
    options: ExecutionOptions = {}
  ): AsyncGenerator<StreamData, ExecutionResult, unknown> {
    // Validate command
    this.validateCommand(command);
    
    const [cmd, ...args] = command;
    const workspacePath = this.getCardWorkspacePath(cardId);
    
    // Ensure workspace exists
    await fs.mkdir(workspacePath, { recursive: true });
    
    // Check concurrent process limit
    if (this.activeProcesses.size >= this.maxConcurrentProcesses) {
      throw new Error(`Maximum concurrent processes (${this.maxConcurrentProcesses}) reached`);
    }
    
    // Sanitize environment variables
    const sanitizedEnv = this.sanitizeEnvironment(options?.env);
    
    const spawnOptions: any = {
      cwd: workspacePath,
      env: sanitizedEnv,
      timeout: options?.timeout || 300000,
      windowsHide: true,
    };

    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      let child;
      try {
        child = spawn(cmd, args, spawnOptions);
      } catch (error) {
        reject(new Error(`Failed to spawn process: ${error}`));
        return;
      }
      
      this.activeProcesses.set(cardId, child);
      
      let stdout = '';
      let stderr = '';
      let exitCode: number | null = null;
      let completed = false;
      
      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          const chunk = data.toString();
          stdout += chunk;
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          const chunk = data.toString();
          stderr += chunk;
        });
      }
      
      child.on('close', (code) => {
        exitCode = code || 0;
        completed = true;
        this.activeProcesses.delete(cardId);
        
        resolve({
          success: exitCode === 0,
          exitCode,
          stdout,
          stderr,
          duration: Date.now() - startTime,
        } as ExecutionResult);
      });
      
      child.on('error', (error) => {
        completed = true;
        this.activeProcesses.delete(cardId);
        reject(error);
      });
    });
  }

  /**
   * Cancel an ongoing execution
   */
  async cancelExecution(cardId: string): Promise<void> {
    const process = this.activeProcesses.get(cardId);
    if (process) {
      process.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
        }
      }, 5000);
      
      this.activeProcesses.delete(cardId);
    }
  }

  /**
   * Check if a card has an active process
   */
  isCardActive(cardId: string): boolean {
    return this.activeProcesses.has(cardId);
  }

  /**
   * Get workspace information for a card
   */
  async getCardWorkspaceInfo(cardId: string): Promise<{
    exists: boolean;
    path: string;
    size?: number;
    fileCount?: number;
  }> {
    const workspacePath = this.getCardWorkspacePath(cardId);
    
    try {
      await fs.access(workspacePath);
      const files = await fs.readdir(workspacePath);
      
      // Calculate size (simplified)
      let size = 0;
      for (const file of files) {
        try {
          const stat = await fs.stat(path.join(workspacePath, file));
          size += stat.size;
        } catch {
          // Ignore errors for individual files
        }
      }
      
      return {
        exists: true,
        path: workspacePath,
        size,
        fileCount: files.length,
      };
    } catch {
      return {
        exists: false,
        path: workspacePath,
      };
    }
  }

  /**
   * List all workspaces
   */
  async listWorkspaces(): Promise<Array<{
    cardId: string;
    path: string;
    created?: Date;
  }>> {
    try {
      const entries = await fs.readdir(this.baseWorkspaceDir, { withFileTypes: true });
      const workspaces = [];
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('card-') && entry.name.endsWith('-repo')) {
          const cardId = entry.name.replace('card-', '').replace('-repo', '');
          const fullPath = path.join(this.baseWorkspaceDir, entry.name);
          const stat = await fs.stat(fullPath);
          
          workspaces.push({
            cardId,
            path: fullPath,
            created: stat.birthtime,
          });
        }
      }
      
      return workspaces;
    } catch {
      return [];
    }
  }

  /**
   * Sanitize environment variables for security
   */
  private sanitizeEnvironment(
    customEnv?: Record<string, string>
  ): Record<string, string> {
    // Start with minimal environment
    const env: Record<string, string> = {
      PATH: process.env.PATH || '',
      HOME: process.env.HOME || '',
      USERPROFILE: process.env.USERPROFILE || '',
      NODE_ENV: process.env.NODE_ENV || 'development',
      // Keep these for Node.js/npm to work properly
      NODE_PATH: process.env.NODE_PATH || '',
      NPM_CONFIG_PREFIX: process.env.NPM_CONFIG_PREFIX || '',
      // Terminal settings
      TERM: process.env.TERM || 'xterm-256color',
      COLORTERM: process.env.COLORTERM || 'truecolor',
      // Locale
      LANG: process.env.LANG || 'en_US.UTF-8',
      // Add any custom env vars
      ...customEnv,
    };
    
    // Remove sensitive variables
    const sensitiveVars = [
      'SUDO_USER', 'SUDO_UID', 'SUDO_GID',
      'SSH_AUTH_SOCK', 'SSH_AGENT_LAUNCHER',
      'GNOME_KEYRING_CONTROL', 'GNOME_KEYRING_PID',
      'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY',
      'GOOGLE_APPLICATION_CREDENTIALS',
      'PRIVATE_KEY', 'SECRET_KEY',
    ];
    
    for (const varName of sensitiveVars) {
      delete env[varName];
    }
    
    return env;
  }

  /**
   * Emit output for real-time streaming
   */
  private emitOutput(cardId: string, output: StreamData): void {
    this.emit('output', { cardId, ...output });
  }

  /**
   * Get resource usage stats
   */
  getResourceStats(): {
    activeProcesses: number;
    maxProcesses: number;
    baseWorkspaceDir: string;
  } {
    return {
      activeProcesses: this.activeProcesses.size,
      maxProcesses: this.maxConcurrentProcesses,
      baseWorkspaceDir: this.baseWorkspaceDir,
    };
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    // Cancel all active processes
    for (const cardId of this.activeProcesses.keys()) {
      await this.cancelExecution(cardId);
    }
    
    this.activeProcesses.clear();
    this.removeAllListeners();
  }
}

// Singleton instance for application-wide use
let sandboxInstance: LightweightSandbox | null = null;

export function getLightweightSandbox(): LightweightSandbox {
  if (!sandboxInstance) {
    sandboxInstance = new LightweightSandbox();
  }
  return sandboxInstance;
}

export function resetLightweightSandbox(): void {
  if (sandboxInstance) {
    sandboxInstance.cleanup();
    sandboxInstance = null;
  }
}

export default LightweightSandbox;
