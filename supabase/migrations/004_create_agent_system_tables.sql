-- Migration 004: Create Agent System Tables
-- Description: Core tables for the Ares Agent System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- AGENTS TABLE
-- Registry of all available agents in the system
-- ============================================
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pm', 'architect', 'engineer', 'tester', 'devops')),
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'busy', 'paused', 'offline')),
    capabilities JSONB NOT NULL DEFAULT '[]',
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE agents IS 'Registry of AI agents in the Ares system';
COMMENT ON COLUMN agents.type IS 'Agent specialization: pm, architect, engineer, tester, devops';
COMMENT ON COLUMN agents.capabilities IS 'JSON array of capability strings';

-- Indexes for agents
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_status ON agents(status);

-- ============================================
-- TASKS TABLE
-- Tasks to be executed by agents
-- ============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'analyzing', 'planning', 'executing', 'verifying', 'completed', 'failed', 'blocked')),
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER,
    quality_gates JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

COMMENT ON TABLE tasks IS 'Tasks to be executed by agents';
COMMENT ON COLUMN tasks.status IS 'Task lifecycle: pending → analyzing → planning → executing → verifying → completed';
COMMENT ON COLUMN tasks.priority IS '1 (highest) to 5 (lowest)';
COMMENT ON COLUMN tasks.quality_gates IS 'JSON array of quality gate results';

-- Indexes for tasks
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_agent ON tasks(assigned_agent_id);
CREATE INDEX idx_tasks_board ON tasks(board_id);
CREATE INDEX idx_tasks_card ON tasks(card_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- ============================================
-- AGENT_SESSIONS TABLE
-- Active agent sessions for task execution
-- ============================================
CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'creating' 
        CHECK (status IN ('creating', 'active', 'paused', 'completed', 'failed', 'cleaning')),
    git_branch TEXT,
    sandbox_id TEXT,
    context_window JSONB DEFAULT '[]',
    checkpoint_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_activity TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE agent_sessions IS 'Active agent sessions for task execution';
COMMENT ON COLUMN agent_sessions.context_window IS 'JSON array of LLM context messages';
COMMENT ON COLUMN agent_sessions.checkpoint_id IS 'Reference to last recovery checkpoint';

-- Indexes for sessions
CREATE INDEX idx_sessions_agent ON agent_sessions(agent_id);
CREATE INDEX idx_sessions_task ON agent_sessions(task_id);
CREATE INDEX idx_sessions_status ON agent_sessions(status);
CREATE INDEX idx_sessions_last_activity ON agent_sessions(last_activity DESC);

-- ============================================
-- AGENT_AUDIT_LOGS TABLE
-- Immutable audit trail of all agent actions
-- ============================================
CREATE TABLE agent_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    event_type TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    integrity_hash TEXT NOT NULL
);

COMMENT ON TABLE agent_audit_logs IS 'Immutable audit trail of all agent actions';
COMMENT ON COLUMN agent_audit_logs.integrity_hash IS 'SHA-256 hash for tamper detection';

-- Indexes for audit logs
CREATE INDEX idx_audit_timestamp ON agent_audit_logs(timestamp DESC);
CREATE INDEX idx_audit_actor ON agent_audit_logs(actor_id);
CREATE INDEX idx_audit_target ON agent_audit_logs(target_id);
CREATE INDEX idx_audit_event_type ON agent_audit_logs(event_type);

-- ============================================
-- AGENT_COSTS TABLE
-- Cost tracking for agent operations
-- ============================================
CREATE TABLE agent_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES agent_sessions(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('compute', 'storage', 'ai_tokens', 'bandwidth')),
    amount DECIMAL(10,4) NOT NULL,
    currency TEXT DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE agent_costs IS 'Cost tracking for agent operations';
COMMENT ON COLUMN agent_costs.category IS 'Cost type: compute, storage, ai_tokens, bandwidth';

-- Indexes for costs
CREATE INDEX idx_costs_user ON agent_costs(user_id);
CREATE INDEX idx_costs_session ON agent_costs(session_id);
CREATE INDEX idx_costs_category ON agent_costs(category);
CREATE INDEX idx_costs_created ON agent_costs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_costs ENABLE ROW LEVEL SECURITY;

-- Agents policies
CREATE POLICY "Agents are viewable by all authenticated users"
ON agents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only service role can modify agents"
ON agents FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role');

-- Tasks policies
CREATE POLICY "Users can view tasks for accessible boards"
ON tasks FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM board_members bm
    WHERE bm.board_id = tasks.board_id 
    AND bm.user_id = auth.uid()
));

CREATE POLICY "Users can create tasks on editable boards"
ON tasks FOR INSERT TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM board_members bm
    WHERE bm.board_id = tasks.board_id 
    AND bm.user_id = auth.uid()
    AND bm.role IN ('owner', 'admin', 'editor')
));

CREATE POLICY "Users can update tasks on editable boards"
ON tasks FOR UPDATE TO authenticated
USING (EXISTS (
    SELECT 1 FROM board_members bm
    WHERE bm.board_id = tasks.board_id 
    AND bm.user_id = auth.uid()
    AND bm.role IN ('owner', 'admin', 'editor')
));

CREATE POLICY "Users can delete tasks on editable boards"
ON tasks FOR DELETE TO authenticated
USING (EXISTS (
    SELECT 1 FROM board_members bm
    WHERE bm.board_id = tasks.board_id 
    AND bm.user_id = auth.uid()
    AND bm.role IN ('owner', 'admin', 'editor')
));

-- Agent sessions policies
CREATE POLICY "Users can view sessions for accessible boards"
ON agent_sessions FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM tasks t
    JOIN board_members bm ON bm.board_id = t.board_id
    WHERE t.id = agent_sessions.task_id
    AND bm.user_id = auth.uid()
));

CREATE POLICY "Only service role can modify sessions"
ON agent_sessions FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role');

-- Audit logs policies (admin only)
CREATE POLICY "Audit logs viewable by admins"
ON agent_audit_logs FOR SELECT TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

CREATE POLICY "System can create audit logs"
ON agent_audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Costs policies
CREATE POLICY "Users can view their own costs"
ON agent_costs FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can track costs"
ON agent_costs FOR INSERT TO authenticated
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp trigger to agents
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update session last_activity function
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply activity trigger to sessions
CREATE TRIGGER update_session_last_activity
    BEFORE UPDATE ON agent_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- Insert default agents
INSERT INTO agents (name, type, status, capabilities, config) VALUES
('Ares PM', 'pm', 'idle', '["planning", "orchestration", "analysis", "delegation"]', '{"model": "claude-3-opus", "temperature": 0.7}'),
('Architect Agent', 'architect', 'idle', '["system-design", "architecture", "technical-planning"]', '{"model": "claude-3-opus"}'),
('Engineer Agent', 'engineer', 'idle', '["typescript", "react", "nodejs", "python", "code-generation"]', '{"model": "claude-3-sonnet"}'),
('Tester Agent', 'tester', 'idle', '["unit-testing", "integration-testing", "test-generation", "quality-assurance"]', '{"model": "claude-3-sonnet"}'),
('DevOps Agent', 'devops', 'idle', '["deployment", "ci-cd", "infrastructure", "docker", "kubernetes"]', '{"model": "claude-3-haiku"}');
