/**
 * Claude API Proxy Route
 * Proxies requests to Anthropic's Claude API to avoid CORS issues and protect API keys
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, model, max_tokens, messages, temperature, system, tools } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Build request payload with optional parameters
    const payload: Record<string, unknown> = {
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: max_tokens || 10,
      messages,
    };

    // Add optional parameters if provided
    if (temperature !== undefined) payload.temperature = temperature;
    if (system) payload.system = system;
    if (tools) payload.tools = tools;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Claude API error', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Claude proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
