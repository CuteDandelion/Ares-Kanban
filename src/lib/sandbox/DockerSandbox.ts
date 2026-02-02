/**
 * Docker Sandbox Service for Safe CLI Command Execution
 * Uses Docker socket to spawn sibling containers for command execution
 * 
 * NOTE: This is a stub for browser-side. Actual implementation runs on server via API routes.
 */

export interface ExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export interface StreamedOutput {
  type: 'stdout' | 'stderr';
  data: string;
  timestamp: Date;
}

class DockerSandbox {
  private isServerSide: boolean;

  constructor() {
    this.isServerSide = typeof window === 'undefined';
  }

  async initialize(): Promise<void> {
    if (!this.isServerSide) {
      console.log('Docker Sandbox: Client-side mode (commands run via API)');
      return;
    }
    // Server-side initialization would happen here
    console.log('Docker Sandbox: Server-side mode');
  }

  async createCardWorkspace(cardId: string, githubRepoUrl?: string, branch = 'main'): Promise<string> {
    if (!this.isServerSide) {
      throw new Error('Workspace creation requires server-side execution');
    }
    return `/workspaces/card-${cardId}-repo`;
  }

  async executeCommand(
    cardId: string,
    command: string[],
    options?: { timeout?: number; maxBuffer?: number; env?: Record<string, string> }
  ): Promise<ExecutionResult> {
    // Client-side: would call API
    // For now, return a message that this needs server implementation
    return {
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: 'Docker commands require server-side execution. Use API routes for production.',
      duration: 0,
    };
  }

  async cancelExecution(cardId: string): Promise<void> {
    // No-op in browser
  }

  async deleteCardWorkspace(cardId: string): Promise<void> {
    // No-op in browser
  }

  getWorkspacePath(cardId: string): string {
    return `/workspaces/card-${cardId}-repo`;
  }

  async checkDockerAvailability(): Promise<{ available: boolean; error?: string }> {
    if (!this.isServerSide) {
      return { available: false, error: 'Docker not available in browser' };
    }
    return { available: true };
  }
}

// Singleton instance
export const dockerSandbox = new DockerSandbox();
export default DockerSandbox;
