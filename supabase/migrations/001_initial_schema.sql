-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('human', 'agent', 'admin');
CREATE TYPE card_status AS ENUM ('todo', 'in-progress', 'review', 'done');
CREATE TYPE card_priority AS ENUM ('critical', 'high', 'medium', 'low', 'none');
CREATE TYPE agent_type AS ENUM ('claude-code', 'open-code', 'custom', 'project-manager');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'busy');
CREATE TYPE actor_type AS ENUM ('human', 'agent');
CREATE TYPE presence_status AS ENUM ('active', 'idle', 'offline');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'human',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table (multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boards table
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Columns table
CREATE TABLE columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  wip_limit INTEGER,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_column_order UNIQUE (board_id, order_index)
);

-- Cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id UUID REFERENCES columns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status card_status DEFAULT 'todo',
  priority card_priority DEFAULT 'none',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  agent_context JSONB DEFAULT '{}',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_card_order UNIQUE (column_id, order_index)
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type agent_type NOT NULL,
  name TEXT NOT NULL,
  capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
  status agent_status DEFAULT 'active',
  current_task_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  oauth_provider TEXT,
  oauth_client_id TEXT,
  api_key_encrypted TEXT,
  version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table (audit log)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  actor_type actor_type,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presence table (real-time presence)
CREATE TABLE presence (
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status presence_status DEFAULT 'offline',
  cursor_x DECIMAL,
  cursor_y DECIMAL,
  PRIMARY KEY (board_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_boards_owner ON boards(owner_id);
CREATE INDEX idx_boards_org ON boards(organization_id);
CREATE INDEX idx_columns_board ON columns(board_id);
CREATE INDEX idx_cards_column ON cards(column_id);
CREATE INDEX idx_cards_assignee ON cards(assignee_id);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_cards_priority ON cards(priority);
CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_activities_board_timestamp ON activities(board_id, timestamp);
CREATE INDEX idx_presence_board_time ON presence(board_id, last_seen);

-- Enable Row-Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for boards
CREATE POLICY "Users can view boards in their organizations" ON boards
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE owner_id = auth.uid()
        OR id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    )
    OR owner_id = auth.uid()
    OR is_public = TRUE
  );

CREATE POLICY "Users can create boards in their organizations" ON boards
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE owner_id = auth.uid()
        OR id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    )
    OR owner_id = auth.uid()
  );

-- RLS Policies for columns
CREATE POLICY "Users can view columns on accessible boards" ON columns
  FOR SELECT USING (
    board_id IN (
      SELECT id FROM boards
      WHERE owner_id = auth.uid()
        OR organization_id IN (
          SELECT id FROM organizations
          WHERE owner_id = auth.uid()
            OR id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        )
        OR is_public = TRUE
    )
  );

-- RLS Policies for cards
CREATE POLICY "Users can view cards on accessible boards" ON cards
  FOR SELECT USING (
    column_id IN (
      SELECT id FROM columns
      WHERE board_id IN (
        SELECT id FROM boards
        WHERE owner_id = auth.uid()
          OR organization_id IN (
            SELECT id FROM organizations
            WHERE owner_id = auth.uid()
              OR id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
          )
          OR is_public = TRUE
      )
    )
  );

CREATE POLICY "Users can create cards on accessible boards" ON cards
  FOR INSERT WITH CHECK (
    column_id IN (
      SELECT id FROM columns
      WHERE board_id IN (
        SELECT id FROM boards
        WHERE owner_id = auth.uid()
          OR organization_id IN (
            SELECT id FROM organizations
            WHERE owner_id = auth.uid()
              OR id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
          )
      )
    )
  );

CREATE POLICY "Users can update cards on accessible boards" ON cards
  FOR UPDATE USING (
    column_id IN (
      SELECT id FROM columns
      WHERE board_id IN (
        SELECT id FROM boards
        WHERE owner_id = auth.uid()
          OR organization_id IN (
            SELECT id FROM organizations
            WHERE owner_id = auth.uid()
              OR id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
          )
      )
    )
  );

-- RLS Policies for activities
CREATE POLICY "Users can view activities on accessible boards" ON activities
  FOR SELECT USING (
    board_id IN (
      SELECT id FROM boards
      WHERE owner_id = auth.uid()
        OR organization_id IN (
          SELECT id FROM organizations
          WHERE owner_id = auth.uid()
            OR id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        )
        OR is_public = TRUE
    )
  );

-- RLS Policies for presence
CREATE POLICY "Users can view presence on accessible boards" ON presence
  FOR SELECT USING (
    board_id IN (
      SELECT id FROM boards
      WHERE owner_id = auth.uid()
        OR organization_id IN (
          SELECT id FROM organizations
          WHERE owner_id = auth.uid()
            OR id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        )
        OR is_public = TRUE
    )
  );

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function for real-time card updates
CREATE OR REPLACE FUNCTION notify_card_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'card_updates',
    json_build_object(
      'type', 'card_update',
      'cardId', NEW.id,
      'columnId', NEW.column_id,
      'status', NEW.status,
      'timestamp', NOW()
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for card updates
CREATE TRIGGER trigger_card_update
  AFTER INSERT OR UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION notify_card_update();

-- Insert default admin user (for development)
INSERT INTO users (email, name, role)
VALUES ('admin@ares-kanban.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;
