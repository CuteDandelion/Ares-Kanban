import { NextRequest, NextResponse } from 'next/server';
import { getLightweightSandbox } from '@/sandbox/LightweightSandbox';

/**
 * GET /api/sandbox/workspace
 * List all workspaces or get info for a specific card
 * 
 * Query Parameters:
 * - cardId: string (optional) - Get info for specific card
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    const sandbox = getLightweightSandbox();
    await sandbox.initialize();

    if (cardId) {
      // Get info for specific card
      const info = await sandbox.getCardWorkspaceInfo(cardId);
      return NextResponse.json(info);
    } else {
      // List all workspaces
      const workspaces = await sandbox.listWorkspaces();
      return NextResponse.json({ workspaces });
    }
  } catch (error) {
    console.error('Failed to get workspace info:', error);
    
    return NextResponse.json(
      { error: 'Failed to get workspace information' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sandbox/workspace
 * Create a new workspace for a card
 * 
 * Request Body:
 * {
 *   cardId: string;
 *   githubRepoUrl?: string;
 *   branch?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, githubRepoUrl, branch } = body;

    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json(
        { error: 'cardId is required and must be a string' },
        { status: 400 }
      );
    }

    const sandbox = getLightweightSandbox();
    await sandbox.initialize();

    const workspacePath = await sandbox.createCardWorkspace(
      cardId,
      githubRepoUrl,
      branch || 'main'
    );

    return NextResponse.json({
      success: true,
      cardId,
      workspacePath,
      message: githubRepoUrl 
        ? `Workspace created and repository cloned for card ${cardId}`
        : `Workspace created for card ${cardId}`,
    });
  } catch (error) {
    console.error('Failed to create workspace:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sandbox/workspace
 * Delete a workspace for a card
 * 
 * Query Parameters:
 * - cardId: string (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return NextResponse.json(
        { error: 'cardId is required as query parameter' },
        { status: 400 }
      );
    }

    const sandbox = getLightweightSandbox();
    await sandbox.deleteCardWorkspace(cardId);

    return NextResponse.json({
      success: true,
      message: `Workspace for card ${cardId} deleted successfully`,
    });
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sandbox/workspace
 * Cancel an ongoing execution for a card
 * 
 * Request Body:
 * {
 *   cardId: string;
 *   action: 'cancel';
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, action } = body;

    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json(
        { error: 'cardId is required' },
        { status: 400 }
      );
    }

    if (action !== 'cancel') {
      return NextResponse.json(
        { error: 'Only action=cancel is supported' },
        { status: 400 }
      );
    }

    const sandbox = getLightweightSandbox();
    await sandbox.cancelExecution(cardId);

    return NextResponse.json({
      success: true,
      message: `Execution for card ${cardId} cancelled`,
    });
  } catch (error) {
    console.error('Failed to cancel execution:', error);
    
    return NextResponse.json(
      { error: 'Failed to cancel execution' },
      { status: 500 }
    );
  }
}
