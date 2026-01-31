/**
 * Agent System Type Definitions
 * 
 * Core types for the Ares Agent System
 */

// ============================================
// AGENT TYPES
// ============================================

export type AgentType = 'pm' | 'architect' | 'engineer' | 'tester' | 'devops';

export type AgentStatus = 'idle' | 'busy' | 'paused' | 'offline';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentWithStats extends Agent {
  currentTask?: Task;
  stats: {
    tasksCompleted: number;
    avgDuration: number;
    successRate: number;
  };
}

// ============================================
// TASK TYPES
// ============================================

export type TaskStatus = 
  | 'pending' 
  | 'analyzing' 
  | 'planning' 
  | 'executing' 
  | 'verifying' 
  | 'completed' 
  | 'failed' 
  | 'blocked';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number; // 1-5
  assignedAgentId?: string;
  parentTaskId?: string;
  boardId?: string;
  cardId?: string;
  estimatedDuration?: number; // minutes
  actualDuration?: number; // minutes
  qualityGates: QualityGateResult[];
  metadata: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TaskWithAgent extends Task {
  assignedAgent?: Agent;
}

export interface TaskWithSubtasks extends Task {
  subTasks: Task[];
  parentTask?: Task;
}

// ============================================
// QUALITY GATE TYPES
// ============================================

export type QualityGateType = 'build' | 'lint' | 'test' | 'security';

export type QualityGateStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface QualityGateResult {
  name: QualityGateType;
  status: QualityGateStatus;
  details?: string;
  completedAt?: string;
}

export interface QualityGate {
  type: QualityGateType;
  name: string;
  required: boolean;
  config: Record<string, unknown>;
}

// ============================================
// SESSION TYPES
// ============================================

export type SessionStatus = 
  | 'creating' 
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cleaning';

export interface AgentSession {
  id: string;
  agentId: string;
  taskId: string;
  status: SessionStatus;
  gitBranch?: string;
  sandboxId?: string;
  contextWindow: ContextMessage[];
  checkpointId?: string;
  createdAt: string;
  lastActivity: string;
}

export interface AgentSessionWithRelations extends AgentSession {
  agent: Agent;
  task: Task;
}

export interface ContextMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// ============================================
// EXECUTION TYPES
// ============================================

export interface ExecutionPlan {
  id: string;
  taskId: string;
  phases: ExecutionPhase[];
  estimatedDuration: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface ExecutionPhase {
  order: number;
  agentType: AgentType;
  description: string;
  dependencies: number[];
  estimatedDuration: number;
  qualityGates: QualityGateType[];
}

export interface TaskResult {
  success: boolean;
  output: string;
  fileChanges?: FileChange[];
  errors?: string[];
  metadata?: Record<string, unknown>;
}

export interface FileChange {
  path: string;
  operation: 'create' | 'modify' | 'delete';
  content?: string;
  diff?: string;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: string;
  actorType: 'agent' | 'user' | 'system';
  actorId: string;
  actorName?: string;
  targetType: string;
  targetId: string;
  action: string;
  details: Record<string, unknown>;
  metadata: Record<string, unknown>;
  integrityHash: string;
}

// ============================================
// COST TYPES
// ============================================

export type CostCategory = 'compute' | 'storage' | 'ai_tokens' | 'bandwidth';

export interface CostEntry {
  id: string;
  userId: string;
  sessionId?: string;
  category: CostCategory;
  amount: number;
  currency: string;
  metadata: {
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
  };
  createdAt: string;
}

export interface CostSummary {
  total: number;
  currency: string;
  byCategory: Record<CostCategory, number>;
  byDay: {
    date: string;
    amount: number;
  }[];
}

// ============================================
// EXECUTION ENGINE TYPES
// ============================================

export interface ExecutionStatus {
  isRunning: boolean;
  queueDepth: number;
  activeTasks: number;
  agents: {
    total: number;
    idle: number;
    busy: number;
  };
}

export interface TaskQueueItem {
  task: Task;
  priority: number;
  enqueuedAt: string;
}

// ============================================
// WEBSOCKET EVENT TYPES
// ============================================

export type WebSocketEventType =
  | 'task.created'
  | 'task.status_changed'
  | 'task.completed'
  | 'agent.status_changed'
  | 'session.activity'
  | 'quality_gate.updated';

export interface WebSocketEvent {
  type: WebSocketEventType;
  data: unknown;
  timestamp: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================
// CONFIGURATION TYPES
// ============================================

export interface AgentConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // seconds
  retryAttempts?: number;
}

export interface ExecutionEngineConfig {
  maxConcurrentAgents: number;
  defaultBudgetDaily: number;
  sandboxTimeoutHours: number;
  queuePollInterval: number; // milliseconds
}

export interface QualityGateConfig {
  build: {
    command: string;
    timeout: number;
  };
  lint: {
    command: string;
    timeout: number;
  };
  test: {
    command: string;
    coverageThreshold: number;
    timeout: number;
  };
  security: {
    command: string;
    timeout: number;
  };
}
