import { NextRequest, NextResponse } from 'next/server';
import { getLightweightSandbox, ExecutionOptions } from '@/sandbox/LightweightSandbox';

/**
 * POST /api/sandbox/execute
 * Execute a command in a card's workspace
 * 
 * Request Body:
 * {
 *   cardId: string;
 *   command: string[];
 *   options?: {
 *     timeout?: number;
 *     maxBuffer?: number;
 *     env?: Record<string, string>;
 *   }
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   exitCode: number;
 *   stdout: string;
 *   stderr: string;
 *   duration: number;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, command, options } = body;

    // Validate required fields
    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json(
        { error: 'cardId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!command || !Array.isArray(command) || command.length === 0) {
      return NextResponse.json(
        { error: 'command is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate command elements are strings
    if (!command.every(cmd => typeof cmd === 'string')) {
      return NextResponse.json(
        { error: 'All command elements must be strings' },
        { status: 400 }
      );
    }

    // Get sandbox instance
    const sandbox = getLightweightSandbox();
    await sandbox.initialize();

    // Execute command
    const result = await sandbox.executeCommand(cardId, command, options as ExecutionOptions);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sandbox execution error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        exitCode: -1,
        stdout: '',
        stderr: errorMessage,
        duration: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sandbox/execute
 * Get resource stats from the sandbox
 */
export async function GET() {
  try {
    const sandbox = getLightweightSandbox();
    const stats = sandbox.getResourceStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get sandbox stats:', error);
    
    return NextResponse.json(
      { error: 'Failed to get sandbox stats' },
      { status: 500 }
    );
  }
}
