// User Types
export type UserRole = 'admin' | 'member' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
  last_seen_at: string | null
}

// Board Types
export interface Board {
  id: string
  organization_id: string | null
  owner_id: string
  name: string
  description?: string | null
  settings: Record<string, any>
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface BoardSettings {
  columnConfig?: ColumnConfig[]
  wipLimits?: Record<string, number>
  theme?: 'light' | 'dark' | 'auto'
  permissions?: BoardPermissions
}

export interface ColumnConfig {
  id: string
  title: string
  order: number
  wipLimit?: number
  color?: string
}

export interface BoardPermissions {
  public: boolean
  allowGuestView: boolean
  requireApprovalToJoin: boolean
}

// Column Types
export interface Column {
  id: string
  board_id: string
  title: string
  order_index: number
  wip_limit: number | null
  settings: Record<string, any>
  created_at: string
}

// Card Types
export type CardStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
export type CardPriority = 'critical' | 'high' | 'medium' | 'low' | 'none'

export interface Card {
  id: string
  column_id: string
  board_id: string
  title: string
  description: string | null
  assignee_type: 'user' | 'agent' | null
  assignee_id: string | null
  priority: CardPriority
  status: CardStatus
  tags: string[]
  due_date: string | null
  position: number
  version: number
  agent_context: Record<string, any>
  created_by: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

// Card creation type (only required fields)
export interface CardCreate {
  title: string
  description?: string
  priority?: CardPriority
  assignee_id?: string
  due_date?: string
  tags?: string[]
  agent_context?: Record<string, any>
}

export interface CardMove {
  cardId: string
  fromColumnId: string
  toColumnId: string
  newIndex: number
}

// Agent Types
export type AgentType = 'claude-code' | 'open-code' | 'custom' | 'project-manager'
export type AgentStatus = 'active' | 'inactive' | 'busy'

export interface Agent {
  id: string
  user_id: string | null
  type: AgentType
  name: string
  capabilities: string[]
  status: AgentStatus
  current_task_id: string | null
  oauth_provider: string | null
  oauth_client_id: string | null
  api_key_encrypted: string | null
  version: string | null
  created_at: string
  updated_at: string
}

export interface AgentCapability {
  name: string
  description: string
  enabled: boolean
}

// Activity Types
export type ActorType = 'human' | 'agent'
export type EventType =
  | 'card_created'
  | 'card_updated'
  | 'card_moved'
  | 'card_deleted'
  | 'column_created'
  | 'column_updated'
  | 'column_deleted'
  | 'agent_assigned'
  | 'agent_started_task'
  | 'agent_completed_task'

export interface Activity {
  id: string
  board_id: string
  actor_id: string | null
  actor_type: ActorType | null
  event_type: EventType
  event_data: Record<string, any>
  timestamp: string
}

// Presence Types
export type PresenceStatus = 'active' | 'idle' | 'offline'

export interface Presence {
  board_id: string
  user_id: string
  agent_id: string | null
  last_seen: string
  status: PresenceStatus
  cursor_x: number | null
  cursor_y: number | null
}

// Real-time Event Types
export interface RealtimeEvent {
  type: 'card_update' | 'card_move' | 'presence_update' | 'agent_action' | 'activity_stream'
  room: string // board ID
  data: any
}

export interface CardUpdateEvent {
  cardId: string
  changes: Partial<Card>
  actor: {
    id: string
    name: string
    type: ActorType
  }
}

export interface PresenceUpdateEvent {
  userId: string
  agentId?: string
  status: PresenceStatus
  cursor?: { x: number; y: number }
}

export interface AgentActionEvent {
  agentId: string
  action: 'task_started' | 'task_completed' | 'waiting_for_input'
  taskId: string
  timestamp: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Filter Types
export interface CardFilters {
  assigneeId?: string
  status?: CardStatus
  priority?: CardPriority
  tags?: string[]
  dueDate?: 'overdue' | 'today' | 'this-week' | 'this-month'
  search?: string
}

// MCP Protocol Types
export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
}

export interface MCPToolInput {
  [key: string]: any
}

export interface MCPToolResponse {
  success: boolean
  data?: any
  error?: string
}

// Organization Types (for multi-tenant)
export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  settings: Record<string, any>
  created_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joined_at: string
}
