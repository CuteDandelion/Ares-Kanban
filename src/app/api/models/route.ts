/**
 * Anthropic Models API Route
 * Fetches available models from Anthropic API
 */

import { NextRequest, NextResponse } from 'next/server';

export interface AnthropicModel {
  id: string;
  display_name: string;
  created_at: string;
  description?: string;
}

export interface ModelsResponse {
  data: AnthropicModel[];
  has_more: boolean;
  first_id: string | null;
  last_id: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to fetch models', details: data },
        { status: response.status }
      );
    }

    // Sort models by created_at (newest first) and filter for completion models
    const models = (data.data || [])
      .filter((model: AnthropicModel) => 
        // Only include models that support messages API
        model.id.includes('claude')
      )
      .sort((a: AnthropicModel, b: AnthropicModel) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Models fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
