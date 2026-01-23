# Kanban Board with Multi-Agent Architecture

## Project Overview

A flexible kanban board application that integrates with multiple AI coding agents (Claude Code, OpenCode, Crush, OpenAI, etc.) through a unified abstraction layer. The system allows users to interact with different agents via a chat interface while providing MCP tools for programmatic board manipulation.

---

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE LAYER                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  KANBAN BOARD APP (React/Vue/Svelte)                         │  │
│  │  - Board UI (drag-drop, columns, cards)                        │  │
│  │  - Agent Chat Panel (agent selector, chat, actions)             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP/WebSocket
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   API GATEWAY / BACKEND SERVER                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  REST API Endpoints                                            │  │
│  │  - POST /api/chat/send-message                                │  │
│  │  - POST /api/agent/switch                                     │  │
│  │  - GET  /api/agent/list                                       │  │
│  │  - GET  /api/board/state                                      │  │
│  │  - SSE   /api/chat/stream                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Agent Orchestration Service                                  │  │
│  │  - Agent Registry                                             │  │
│  │  - Conversation Manager                                         │  │
│  │  - Action Executor (MCP tools)                               │  │
│  │  - Response Parser                                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Claude Code     │  │   OpenCode       │  │   Crush          │  │   OpenAI         │
│  (Anthropic SDK) │  │   (AgentAPI)     │  │   (AgentAPI)     │  │   (OpenAI SDK)   │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
         │                    │                    │                    │
         └────────────────────┴────────────────────┴────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────┐
                    │  MCP Server             │
                    │  (Kanban Board Tools)   │
                    └─────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────┐
                    │  Database / Storage     │
                    │  (Board State)         │
                    └─────────────────────────┘
```

---

## Key Design Decisions

### 1. Hybrid Approach: Both Agent Chat + MCP Tools

**Why both?**
- **Agent Chat**: Natural language interaction, AI assistance, brainstorming, analysis
- **MCP Tools**: Programmatic control, automation, multi-agent coordination, integration with other tools

**Benefits:**
- Users can talk to agents for planning and suggestions
- Agents can use MCP tools to manipulate the board
- Automation scripts can use MCP tools directly
- Flexible - use the right tool for the right task

### 2. Multi-Agent Abstraction Layer

**Pattern**: Adapter + Factory Pattern

**Benefits:**
- Add new agents without changing the UI
- Switch agents at runtime
- Clear separation of concerns
- Easy to test and maintain

---

## Agent Communication Architecture

### Communication Flow

```
User → Frontend → Backend API → Agent Adapter → External Agent Service
 (1)     (2)          (3)            (4)              (5)
```

**Step-by-Step:**

1. **User Action**: User types message in chat panel
2. **HTTP Request**: Frontend sends `POST /api/chat/send-message`
3. **Backend Processing**: Gets conversation, selects agent adapter, formats message
4. **Agent Adapter**: Formats message for specific agent, calls external service
5. **Agent Response**: Returns message + optional MCP tool actions
6. **Action Execution**: Backend executes MCP tools, updates database
7. **Response**: Backend sends response to frontend, UI updates

---

## Agent Backend Options

### Option 1: Claude Code (Anthropic)

**API**: Native Anthropic API

**Setup**:
```bash
npm install @anthropic-ai/sdk
```

**Communication**: HTTP REST API

**SDK**: https://docs.anthropic.com/

---

### Option 2: OpenCode (Archived) / Crush (Active)

**Status**:
- OpenCode: Archived (https://github.com/opencode-ai/opencode)
- Crush: Active successor (https://github.com/charmbracelet/crush)

**API**: Via **AgentAPI** (Universal HTTP Adapter)

**AgentAPI**: https://github.com/coder/agentapi

**Supported Agents**:
- OpenCode
- Crush
- Claude Code
- Aider
- Goose
- Amazon Q
- GitHub Copilot
- Sourcegraph Amp
- And more...

---

### Option 3: OpenAI

**API**: Native OpenAI API

**Setup**:
```bash
npm install openai
```

**Communication**: HTTP REST API

**SDK**: https://platform.openai.com/docs/libraries

---

## AgentAPI Integration

### What is AgentAPI?

A universal HTTP adapter that wraps coding agents and exposes them as REST APIs with SSE streaming.

### Installation

```bash
# Download binary
OS=$(uname -s | tr "[:upper:]" "[:lower:]")
ARCH=$(uname -m | sed "s/x86_64/amd64/;s/aarch64/arm64/")
curl -fsSL "https://github.com/coder/agentapi/releases/latest/download/agentapi-${OS}-${ARCH}" -o agentapi
chmod +x agentapi

# Verify
./agentapi --help
```

### Starting Servers

**OpenCode:**
```bash
agentapi server --type=opencode -- opencode
```

**Crush:**
```bash
agentapi server --type=crush -- crush
```

**Claude Code:**
```bash
agentapi server --type=codex -- claude
```

### API Endpoints

**Base URL**: `http://localhost:3284`

#### 1. Send Message
```http
POST /message
Content-Type: application/json

{
  "content": "Help me understand this codebase",
  "type": "user"
}
```

#### 2. Get Messages
```http
GET /messages
```

#### 3. Get Status
```http
GET /status
```

Response:
```json
{
  "status": "stable" | "running"
}
```

#### 4. Stream Events (SSE)
```http
GET /events
```

#### 5. Web Interface
```
http://localhost:3284/chat
```

#### 6. API Documentation
```
http://localhost:3284/docs
```

#### 7. OpenAPI Schema
```
http://localhost:3284/openapi.json
```

---

## Backend API Design

### REST API Endpoints

#### POST /api/chat/send-message

**Request**:
```json
{
  "agentId": "claude-code" | "opencode" | "crush" | "openai",
  "conversationId": "conv-123",
  "message": "Move all high-priority cards to 'To Do'",
  "context": {
    "boardState": {...},
    "availableTools": [...]
  }
}
```

**Response**:
```json
{
  "conversationId": "conv-123",
  "message": "I'll move the high-priority cards to 'To Do'...",
  "actions": [
    {
      "type": "mcp_tool",
      "tool": "move_card",
      "parameters": {
        "cardId": "card-1",
        "toColumn": "To Do"
      }
    }
  ],
  "actionResults": [
    {
      "action": {...},
      "success": true,
      "result": {...}
    }
  ],
  "needsConfirmation": false,
  "timestamp": "2026-01-22T10:30:00Z"
}
```

#### POST /api/agent/switch

**Request**:
```json
{
  "conversationId": "conv-123",
  "newAgentId": "opencode"
}
```

**Response**:
```json
{
  "previousAgentId": "claude-code",
  "newAgentId": "opencode",
  "conversationPreserved": true
}
```

#### GET /api/agent/list

**Response**:
```json
{
  "agents": [
    {
      "id": "claude-code",
      "name": "Claude Code",
      "type": "claude-code",
      "capabilities": {
        "canManipulateBoard": true,
        "canAnalyzeBoard": true,
        "canGenerateTasks": true,
        "canWriteCode": true,
        "supportsStreaming": true
      }
    },
    {
      "id": "opencode",
      "name": "OpenCode Agent",
      "type": "opencode",
      "capabilities": {...}
    }
  ]
}
```

#### SSE /api/chat/stream

Server-Sent Events endpoint for real-time streaming responses.

---

## MCP Tool Design

### MCP Server Tools

```typescript
export const KANBAN_MCP_TOOLS = [
  {
    name: 'add_card',
    description: 'Add a new card to a column',
    parameters: {
      type: 'object',
      properties: {
        column: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['column', 'title'],
    },
  },
  {
    name: 'update_card',
    description: 'Update an existing card',
    parameters: {
      type: 'object',
      properties: {
        cardId: { type: 'string' },
        updates: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            metadata: { type: 'object' },
          },
        },
      },
      required: ['cardId', 'updates'],
    },
  },
  {
    name: 'move_card',
    description: 'Move a card to another column',
    parameters: {
      type: 'object',
      properties: {
        cardId: { type: 'string' },
        fromColumn: { type: 'string' },
        toColumn: { type: 'string' },
        position: { type: 'number' },
      },
      required: ['cardId', 'toColumn'],
    },
  },
  {
    name: 'delete_card',
    description: 'Delete a card',
    parameters: {
      type: 'object',
      properties: {
        cardId: { type: 'string' },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'add_column',
    description: 'Add a new column',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        position: { type: 'number' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_column',
    description: 'Update a column',
    parameters: {
      type: 'object',
      properties: {
        columnId: { type: 'string' },
        updates: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            position: { type: 'number' },
          },
        },
      },
      required: ['columnId', 'updates'],
    },
  },
  {
    name: 'delete_column',
    description: 'Delete a column',
    parameters: {
      type: 'object',
      properties: {
        columnId: { type: 'string' },
      },
      required: ['columnId'],
    },
  },
  {
    name: 'get_board_state',
    description: 'Get the current state of the kanban board',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'search_cards',
    description: 'Search for cards matching criteria',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        column: { type: 'string' },
        metadata: { type: 'object' },
      },
    },
  },
  {
    name: 'get_metrics',
    description: 'Get board metrics (cycle time, throughput, etc.)',
    parameters: {
      type: 'object',
      properties: {
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' },
          },
        },
      },
    },
  },
];
```

---

## Agent Adapter Interface

```typescript
// Unified Agent Interface
interface Agent {
  id: string;
  name: string;
  type: 'claude-code' | 'opencode' | 'crush' | 'openai' | 'custom';
  capabilities: AgentCapabilities;
}

interface AgentCapabilities {
  canManipulateBoard: boolean;
  canAnalyzeBoard: boolean;
  canGenerateTasks: boolean;
  canWriteCode: boolean;
  supportsStreaming: boolean;
}

interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

interface AgentResponse {
  message: string;
  actions?: AgentAction[];
  metadata?: Record<string, any>;
  needsConfirmation?: boolean;
}

interface AgentAction {
  type: 'mcp_tool' | 'ui_action' | 'nothing';
  tool?: string;
  parameters?: Record<string, any>;
  uiAction?: string;
}

// Agent Adapter Interface
interface AgentAdapter {
  // Core messaging
  sendMessage(payload: SendMessagePayload): Promise<AgentResponse>;
  sendMessageStream?(payload: SendMessagePayload): AsyncGenerator<string>;

  // Lifecycle
  initialize(): Promise<void>;
  dispose(): void;

  // Metadata
  getCapabilities(): AgentCapabilities;
  getAgentInfo(): AgentInfo;
}

interface SendMessagePayload {
  message: string;
  context: {
    boardState: BoardState;
    tools: MCPTool[];
    conversationHistory: AgentMessage[];
  };
}
```

---

## Example: OpenCode AgentAPI Adapter

```typescript
class OpenCodeAgentAPIAdapter implements AgentAdapter {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.AGENTAPI_URL || 'http://localhost:3284';
  }

  async sendMessage(payload: SendMessagePayload): Promise<AgentResponse> {
    // 1. Send message to AgentAPI
    const response = await fetch(`${this.baseUrl}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: payload.message,
        type: 'user',
      }),
    });

    if (!response.ok) {
      throw new Error(`AgentAPI error: ${response.statusText}`);
    }

    // 2. Wait for agent to complete
    await this.waitForAgentCompletion();

    // 3. Get messages
    const messages = await this.getMessages();
    const lastAgentMessage = messages
      .filter((m: any) => m.type === 'assistant')
      .pop();

    // 4. Parse response for MCP tool calls
    return {
      message: lastAgentMessage.content,
      actions: this.parseActions(lastAgentMessage.content),
      needsConfirmation: false,
    };
  }

  private async waitForAgentCompletion(): Promise<void> {
    while (true) {
      const statusRes = await fetch(`${this.baseUrl}/status`);
      const status = await statusRes.json();
      if (status.status === 'stable') break;
      await new Promise(r => setTimeout(r, 500));
    }
  }

  private async getMessages(): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/messages`);
    return await res.json();
  }

  private parseActions(content: string): AgentAction[] {
    // Parse agent's response for MCP tool calls
    // This can be improved with structured output from the agent
    const actions: AgentAction[] = [];

    // Example: Look for tool call patterns
    const toolCallRegex = /(\w+)\(([^)]+)\)/g;
    const matches = content.matchAll(toolCallRegex);

    for (const match of matches) {
      const tool = match[1];
      const paramsStr = match[2];

      actions.push({
        type: 'mcp_tool',
        tool: tool,
        parameters: this.parseParams(paramsStr),
      });
    }

    return actions;
  }

  private parseParams(str: string): Record<string, any> {
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  }

  getCapabilities(): AgentCapabilities {
    return {
      canManipulateBoard: true,
      canAnalyzeBoard: true,
      canGenerateTasks: true,
      canWriteCode: true,
      supportsStreaming: true,
    };
  }

  async initialize() {
    try {
      await fetch(this.baseUrl);
    } catch (error) {
      throw new Error('AgentAPI server not running. Start it with: agentapi server --type=opencode -- opencode');
    }
  }

  dispose() {
    // Cleanup
  }
}
```

---

## Agent Registry

```typescript
class AgentRegistry {
  private adapters: Map<string, AgentAdapter> = new Map();

  register(type: string, adapter: AgentAdapter) {
    this.adapters.set(type, adapter);
  }

  getAdapter(type: string): AgentAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) {
      throw new Error(`No adapter found for agent type: ${type}`);
    }
    return adapter;
  }

  listAvailableAgents(): Agent[] {
    return Array.from(this.adapters.entries()).map(([type, adapter]) => ({
      id: type,
      name: this.formatAgentName(type),
      type: type as any,
      capabilities: adapter.getCapabilities(),
    }));
  }

  private formatAgentName(type: string): string {
    const names: Record<string, string> = {
      'claude-code': 'Claude Code',
      'opencode': 'OpenCode',
      'crush': 'Crush',
      'openai': 'OpenAI GPT',
      'custom': 'Custom Agent',
    };
    return names[type] || type;
  }
}

// Initialize
const registry = new AgentRegistry();
registry.register('claude-code', new ClaudeCodeAdapter());
registry.register('opencode', new OpenCodeAgentAPIAdapter());
registry.register('crush', new CrushAgentAPIAdapter());
registry.register('openai', new OpenAIAdapter());
```

---

## Configuration

### Environment Variables

```bash
# Agent Configuration
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# AgentAPI
AGENTAPI_URL=http://localhost:3284

# Backend
BACKEND_PORT=3000
JWT_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://...

# MCP Server
MCP_SERVER_PORT=4000
MCP_SERVER_URL=http://localhost:4000
```

### Agent Config (YAML)

```yaml
# config/agents.yaml
agents:
  claude-code:
    enabled: true
    api_key: ${CLAUDE_API_KEY}
    model: claude-sonnet-4-20250514
    max_tokens: 4096

  openai:
    enabled: true
    api_key: ${OPENAI_API_KEY}
    model: gpt-4
    max_tokens: 4096

  opencode:
    enabled: true
    type: agentapi
    endpoint: http://localhost:3284

  crush:
    enabled: true
    type: agentapi
    endpoint: http://localhost:3284
```

### MCP Config (for OpenCode/Crush)

```json
{
  "mcp": {
    "kanban-board": {
      "type": "http",
      "url": "http://localhost:4000/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

---

## Security Considerations

### 1. API Key Management
- Store API keys on backend only (never expose to frontend)
- Use environment variables
- Rotate keys regularly
- Audit key usage

### 2. Authentication
- JWT-based authentication for frontend-backend communication
- API key authentication for agent services
- Rate limiting per user

### 3. Permission System
- User consent for agent actions
- Action approval workflow
- Audit logging of all operations

### 4. Input Validation
- Sanitize all user inputs
- Validate MCP tool parameters
- Prevent SQL injection, XSS, etc.

### 5. CORS Configuration
```bash
# AgentAPI CORS
AGENTAPI_ALLOWED_ORIGINS='https://yourdomain.com,http://localhost:3000'
```

---

## Technology Stack Recommendations

### Frontend
- **Framework**: React (Next.js), Vue 3, or Svelte
- **Kanban Library**:
  - React: `react-beautiful-dnd`, `@dnd-kit/core`
  - Vue: `vue-draggable`, `vuedraggable`
  - Svelte: `svelte-dnd-action`
- **State Management**: Redux Toolkit, Pinia, or Zustand
- **UI Components**: Tailwind CSS, Material-UI, or shadcn/ui

### Backend
- **Runtime**: Node.js (TypeScript) or Go
- **API Framework**: Express.js, Fastify, or Gin (Go)
- **Database**:
  - Simple: SQLite, PostgreSQL
  - Production: PostgreSQL, MongoDB
- **MCP Server**: Custom implementation using MCP SDK

### Agent Integration
- **Claude Code**: `@anthropic-ai/sdk`
- **OpenAI**: `openai` npm package
- **OpenCode/Crush**: AgentAPI wrapper
- **MCP**: Official MCP SDK

---

## Implementation Roadmap

### Phase 1: Core Infrastructure
1. Set up project structure (frontend + backend)
2. Implement database schema (boards, columns, cards)
3. Build basic kanban UI (drag-drop)
4. Create MCP server with basic tools

### Phase 2: Agent Abstraction
1. Implement Agent Registry and Adapter interface
2. Create Claude Code adapter
3. Create OpenAI adapter
4. Implement AgentAPI adapter (OpenCode/Crush)
5. Build Agent Service (orchestration)

### Phase 3: Chat Integration
1. Build chat UI component
2. Implement backend chat API
3. Connect agents to chat
4. Add agent selector dropdown
5. Implement action approval workflow

### Phase 4: Advanced Features
1. Add streaming responses (SSE)
2. Implement conversation history
3. Add board metrics and analytics
4. Build automation workflows
5. Add multi-agent coordination

### Phase 5: Testing & Polish
1. Unit tests for adapters
2. Integration tests for agent communication
3. E2E tests for user workflows
4. Performance optimization
5. Security audit

---

## File Structure

```
kanban-board/
├── frontend/                  # React/Vue/Svelte app
│   ├── src/
│   │   ├── components/
│   │   │   ├── KanbanBoard/
│   │   │   │   ├── Board.tsx
│   │   │   │   ├── Column.tsx
│   │   │   │   └── Card.tsx
│   │   │   ├── AgentChat/
│   │   │   │   ├── AgentSelector.tsx
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   └── MessageList.tsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/                   # Node.js/Go backend
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── chat.ts
│   │   │   │   ├── agent.ts
│   │   │   │   └── board.ts
│   │   │   └── server.ts
│   │   ├── services/
│   │   │   ├── agent-service.ts
│   │   │   ├── conversation-manager.ts
│   │   │   └── action-executor.ts
│   │   ├── adapters/
│   │   │   ├── agent-adapter.ts
│   │   │   ├── claude-code-adapter.ts
│   │   │   ├── opencode-adapter.ts
│   │   │   ├── crush-adapter.ts
│   │   │   └── openai-adapter.ts
│   │   ├── mcp/
│   │   │   ├── server.ts
│   │   │   └── tools.ts
│   │   └── db/
│   │       ├── models.ts
│   │       └── migrations/
│   ├── config/
│   │   ├── agents.yaml
│   │   └── database.ts
│   ├── package.json
│   └── ...
│
├── mcp-server/                # MCP server (can be part of backend)
│   ├── src/
│   │   ├── tools/
│   │   │   ├── card-tools.ts
│   │   │   ├── column-tools.ts
│   │   │   └── metrics-tools.ts
│   │   └── server.ts
│   └── ...
│
└── docs/
    ├── ARCHITECTURE.md        # This file
    ├── API.md
    └── AGENTS.md
```

---

## Key Resources

### Official Documentation
- **AgentAPI**: https://github.com/coder/agentapi
- **Crush**: https://github.com/charmbracelet/crush
- **OpenCode** (Archived): https://github.com/opencode-ai/opencode
- **Claude Code**: https://docs.anthropic.com/
- **OpenAI API**: https://platform.openai.com/docs/
- **MCP Protocol**: https://modelcontextprotocol.io/

### Relevant Blog Posts
- "How Coding Agents Actually Work: Inside OpenCode"
- "Crush CLI: The Next-Generation AI Coding Agent"

---

## Summary of Key Decisions

1. **Hybrid Approach**: Both agent chat (for natural language) + MCP tools (for automation)
2. **Multi-Agent Support**: Unified abstraction layer with adapter pattern
3. **AgentAPI Integration**: Use AgentAPI to get HTTP API for OpenCode/Crush
4. **Separation of Concerns**: Frontend → Backend API → Agent Adapters → External Agents
5. **Security**: API keys on backend only, JWT auth, permission system
6. **Extensibility**: Easy to add new agents via adapter pattern
7. **Flexibility**: Support Claude Code, OpenCode, Crush, OpenAI, and custom agents

---

## Next Steps

1. ✅ **Architecture designed** - documented in this file
2. 🔄 **Choose tech stack** - decide on frontend framework and backend runtime
3. 📋 **Create project structure** - initialize frontend and backend
4. 🔧 **Implement MCP server** - define and implement kanban tools
5. 🤖 **Build agent adapters** - start with one agent (e.g., Claude Code)
6. 💬 **Create chat UI** - build agent selector and chat panel
7. 🧪 **Test integration** - verify end-to-end flow

---

## Notes

- OpenCode has been archived in favor of Crush
- Crush is the actively maintained successor
- Both work with AgentAPI
- AgentAPI provides a consistent HTTP interface for multiple agents
- MCP is the recommended way to extend agent capabilities
- Always run AgentAPI locally (or on your own server) for security
- Keep API keys in environment variables, never commit them

---

**Last Updated**: 2026-01-22
**Version**: 1.0
