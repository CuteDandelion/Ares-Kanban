# Quick Reference - Kanban Board Multi-Agent Integration

## Common Commands

### AgentAPI Setup

```bash
# Install AgentAPI
OS=$(uname -s | tr "[:upper:]" "[:lower:]")
ARCH=$(uname -m | sed "s/x86_64/amd64/;s/aarch64/arm64/")
curl -fsSL "https://github.com/coder/agentapi/releases/latest/download/agentapi-${OS}-${ARCH}" -o agentapi
chmod +x agentapi

# Start OpenCode server
agentapi server --type=opencode -- opencode

# Start Crush server
agentapi server --type=crush -- crush

# Start Claude Code server
agentapi server --type=codex -- claude

# Test API
curl -X POST localhost:3284/message \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, agent!", "type": "user"}'

# Get messages
curl localhost:3284/messages

# Get status
curl localhost:3284/status

# Stream events (SSE)
curl -N localhost:3284/events
```

### Frontend Setup (React Example)

```bash
# Create Next.js app
npx create-next-app@latest kanban-frontend
cd kanban-frontend

# Install dependencies
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install axios

# Start dev server
npm run dev
```

### Backend Setup (Node.js/Express Example)

```bash
# Create backend
mkdir kanban-backend
cd kanban-backend
npm init -y

# Install dependencies
npm install express cors dotenv
npm install @anthropic-ai/sdk  # For Claude
npm install openai              # For OpenAI
npm install typescript ts-node @types/node @types/express

# Start dev server
npx ts-node src/server.ts
```

---

## Environment Variables

```bash
# .env file for backend
PORT=3000
JWT_SECRET=your-jwt-secret-key

# Agent APIs
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# AgentAPI
AGENTAPI_URL=http://localhost:3284

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kanban
# Or for SQLite
DATABASE_URL=./kanban.db
```

---

## Quick Curl Commands

### Test Backend Chat API

```bash
# Send message to agent
curl -X POST http://localhost:3000/api/chat/send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "agentId": "claude-code",
    "conversationId": "test-conv-1",
    "message": "Create a new card for the backlog"
  }'
```

### Get Available Agents

```bash
curl http://localhost:3000/api/agent/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Switch Agent

```bash
curl -X POST http://localhost:3000/api/agent/switch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "conversationId": "test-conv-1",
    "newAgentId": "opencode"
  }'
```

---

## MCP Tool Examples

### Add Card

```json
{
  "tool": "add_card",
  "parameters": {
    "column": "Backlog",
    "title": "Fix login bug",
    "description": "Users unable to login with valid credentials"
  }
}
```

### Move Card

```json
{
  "tool": "move_card",
  "parameters": {
    "cardId": "card-123",
    "toColumn": "In Progress"
  }
}
```

### Get Board State

```json
{
  "tool": "get_board_state",
  "parameters": {}
}
```

---

## AgentAPI Configuration

### Allowed Hosts

```bash
# Allow any host (development)
agentapi server --allowed-hosts '*' -- opencode

# Allow specific host
agentapi server --allowed-hosts 'example.com' -- opencode

# Multiple hosts
agentapi server --allowed-hosts 'example.com,example.org' -- opencode
```

### CORS Configuration

```bash
# Allow any origin
agentapi server --allowed-origins '*' -- opencode

# Specific origin
agentapi server --allowed-origins 'https://yourdomain.com' -- opencode

# Multiple origins
agentapi server --allowed-origins 'https://yourdomain.com,http://localhost:3000' -- opencode
```

---

## Database Schema (PostgreSQL Example)

```sql
-- Boards
CREATE TABLE boards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Columns
CREATE TABLE columns (
  id SERIAL PRIMARY KEY,
  board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cards
CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  column_id INTEGER REFERENCES columns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_cards_column ON cards(column_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
```

---

## Project Initialization Checklist

- [ ] Create project directory structure
- [ ] Initialize frontend (Next.js/Vue/Svelte)
- [ ] Initialize backend (Node.js/Go)
- [ ] Set up database (PostgreSQL/SQLite)
- [ ] Install AgentAPI
- [ ] Install and configure agent tools (Claude Code, OpenCode, Crush)
- [ ] Create environment variables file
- [ ] Implement MCP server with kanban tools
- [ ] Build agent adapter interface
- [ ] Create Claude Code adapter
- [ ] Create OpenCode/Crush adapter (via AgentAPI)
- [ ] Build agent registry
- [ ] Implement backend API endpoints
- [ ] Build frontend kanban UI
- [ ] Build frontend chat UI
- [ ] Connect frontend to backend
- [ ] Test end-to-end flow
- [ ] Set up authentication
- [ ] Add error handling
- [ ] Write tests
- [ ] Deploy (optional)

---

## Troubleshooting

### AgentAPI Not Starting

```bash
# Check if agent is in PATH
which opencode

# Use full path
agentapi server --type=opencode -- /usr/local/bin/opencode

# Check AgentAPI version
./agentapi --version
```

### Port Already in Use

```bash
# Find process using port 3284
lsof -i :3284

# Kill process
kill -9 <PID>

# Or use different port
AGENTAPI_PORT=4000 agentapi server --type=opencode -- opencode
```

### Agent Not Responding

```bash
# Check AgentAPI status
curl localhost:3284/status

# Check AgentAPI logs
# Logs are typically in terminal where AgentAPI is running

# Check agent logs
opencode --debug  # or crush --debug
```

### CORS Errors

```bash
# Verify CORS configuration
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:3284/message

# If blocked, check AgentAPI allowed-origins
```

---

## Key URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api
- **AgentAPI**: http://localhost:3284
- **AgentAPI Chat UI**: http://localhost:3284/chat
- **AgentAPI Docs**: http://localhost:3284/docs
- **MCP Server**: http://localhost:4000/mcp

---

## Development Workflow

```bash
# Terminal 1: Start AgentAPI with OpenCode
agentapi server --type=opencode -- opencode

# Terminal 2: Start MCP Server
cd mcp-server
npm run dev

# Terminal 3: Start Backend
cd backend
npm run dev

# Terminal 4: Start Frontend
cd frontend
npm run dev

# Now access:
# - Kanban board: http://localhost:3000
# - AgentAPI UI: http://localhost:3284/chat
```

---

## Quick Links to Documentation

- **Full Architecture**: See `ARCHITECTURE.md`
- **AgentAPI**: https://github.com/coder/agentapi
- **Crush**: https://github.com/charmbracelet/crush
- **Claude API**: https://docs.anthropic.com/
- **OpenAI API**: https://platform.openai.com/docs/
- **MCP Protocol**: https://modelcontextprotocol.io/

---

**Tips**:
- Use AgentAPI web UI to test agents before integration
- Start with one agent (Claude Code) then add more
- Test MCP tools directly via curl first
- Keep API keys in `.env` and add `.env` to `.gitignore`
- Use the architecture doc as your guide for implementation

---

**Last Updated**: 2026-01-22
