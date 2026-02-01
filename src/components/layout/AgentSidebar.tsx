'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Agent types
interface Agent {
  id: string;
  name: string;
  type: 'pm' | 'engineer' | 'tester' | 'specialist';
  status: 'idle' | 'busy' | 'paused' | 'offline' | 'error';
  currentTask?: string;
  taskProgress?: number;
  completedTasks: number;
  successRate: number;
  capabilities: string[];
  lastActive: Date;
}

interface AgentSidebarProps {
  className?: string;
  agents?: Agent[];
  onAgentClick?: (agent: Agent) => void;
  onPauseAgent?: (agentId: string) => void;
  onResumeAgent?: (agentId: string) => void;
}

// Mock agents for placeholder
const defaultAgents: Agent[] = [
  {
    id: 'ares-pm',
    name: 'ARES PM',
    type: 'pm',
    status: 'busy',
    currentTask: 'Planning Sprint 2',
    taskProgress: 65,
    completedTasks: 143,
    successRate: 98,
    capabilities: ['Planning', 'Architecture', 'Coordination'],
    lastActive: new Date(),
  },
  {
    id: 'engineer-1',
    name: 'Engineer Alpha',
    type: 'engineer',
    status: 'busy',
    currentTask: 'Implementing CLI Panel',
    taskProgress: 42,
    completedTasks: 89,
    successRate: 95,
    capabilities: ['Frontend', 'React', 'TypeScript'],
    lastActive: new Date(),
  },
  {
    id: 'engineer-2',
    name: 'Engineer Beta',
    type: 'engineer',
    status: 'idle',
    completedTasks: 76,
    successRate: 92,
    capabilities: ['Backend', 'API', 'Database'],
    lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
  },
  {
    id: 'tester-1',
    name: 'Tester Prime',
    type: 'tester',
    status: 'paused',
    completedTasks: 234,
    successRate: 99,
    capabilities: ['E2E Testing', 'Quality Assurance'],
    lastActive: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
];

// Status configurations
const statusConfig = {
  idle: { color: 'bg-green-500', animation: 'animate-pulse-status', label: 'Idle' },
  busy: { color: 'bg-orange-500', animation: 'animate-pulse-busy', label: 'Busy' },
  paused: { color: 'bg-yellow-500', animation: '', label: 'Paused' },
  offline: { color: 'bg-gray-500', animation: '', label: 'Offline' },
  error: { color: 'bg-red-500', animation: 'animate-pulse-critical', label: 'Error' },
};

const typeConfig = {
  pm: { label: 'PM', color: 'text-ares-red-500', icon: '⚔️' },
  engineer: { label: 'ENG', color: 'text-blue-400', icon: '🔧' },
  tester: { label: 'QA', color: 'text-purple-400', icon: '🧪' },
  specialist: { label: 'SPEC', color: 'text-cyan-400', icon: '⭐' },
};

const AgentCard = ({ 
  agent, 
  isSpecial = false,
  onClick,
}: { 
  agent: Agent; 
  isSpecial?: boolean;
  onClick?: () => void;
}) => {
  const status = statusConfig[agent.status];
  const type = typeConfig[agent.type];

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border transition-all duration-200 cursor-pointer',
        isSpecial 
          ? 'bg-gradient-to-br from-ares-red-900/30 to-ares-dark-850 border-ares-red-600/50' 
          : 'bg-ares-dark-850 border-ares-dark-700 hover:border-ares-dark-600'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{type.icon}</span>
          <div>
            <div className={cn(
              'font-medium text-sm',
              isSpecial && 'text-ares-red-400'
            )}>
              {agent.name}
            </div>
            <div className="text-xs text-ares-dark-400">{type.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn('w-2 h-2 rounded-full', status.color, status.animation)} />
          <span className="text-xs text-ares-dark-400">{status.label}</span>
        </div>
      </div>

      {/* Current Task */}
      {agent.currentTask && (
        <div className="mb-3">
          <div className="text-xs text-ares-dark-400 mb-1">Current Task</div>
          <div className="text-sm text-white truncate">{agent.currentTask}</div>
          {agent.taskProgress !== undefined && (
            <div className="mt-2">
              <div className="h-1.5 bg-ares-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ares-red-600 rounded-full transition-all duration-500"
                  style={{ width: `${agent.taskProgress}%` }}
                />
              </div>
              <div className="text-xs text-ares-dark-400 mt-1">
                {agent.taskProgress}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-ares-dark-700">
        <div>
          <div className="text-xs text-ares-dark-400">Completed</div>
          <div className="text-sm font-medium">{agent.completedTasks}</div>
        </div>
        <div>
          <div className="text-xs text-ares-dark-400">Success Rate</div>
          <div className={cn(
            'text-sm font-medium',
            agent.successRate >= 95 ? 'text-green-400' : 
            agent.successRate >= 80 ? 'text-yellow-400' : 'text-red-400'
          )}>
            {agent.successRate}%
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="mt-3 flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 3).map((cap) => (
          <span
            key={cap}
            className="text-[10px] px-1.5 py-0.5 bg-ares-dark-800 text-ares-dark-300 rounded"
          >
            {cap}
          </span>
        ))}
        {agent.capabilities.length > 3 && (
          <span className="text-[10px] px-1.5 py-0.5 bg-ares-dark-800 text-ares-dark-400 rounded">
            +{agent.capabilities.length - 3}
          </span>
        )}
      </div>
    </div>
  );
};

const AgentSidebar = React.forwardRef<HTMLDivElement, AgentSidebarProps>(
  ({ className, agents = defaultAgents, onAgentClick }, ref) => {
    const [filter, setFilter] = React.useState<'all' | 'active' | 'idle' | 'offline'>('all');

    const filteredAgents = React.useMemo(() => {
      switch (filter) {
        case 'active':
          return agents.filter(a => a.status === 'busy');
        case 'idle':
          return agents.filter(a => a.status === 'idle');
        case 'offline':
          return agents.filter(a => a.status === 'offline' || a.status === 'paused');
        default:
          return agents;
      }
    }, [agents, filter]);

    const pmAgent = filteredAgents.find(a => a.type === 'pm');
    const otherAgents = filteredAgents.filter(a => a.type !== 'pm');

    // Count by status
    const counts = {
      all: agents.length,
      active: agents.filter(a => a.status === 'busy').length,
      idle: agents.filter(a => a.status === 'idle').length,
      offline: agents.filter(a => a.status === 'offline' || a.status === 'paused').length,
    };

    return (
      <div
        ref={ref}
        className={cn(
          'h-full flex flex-col bg-ares-dark-900',
          className
        )}
      >
        {/* Header */}
        <div className="h-16 border-b border-ares-dark-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-ares-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-semibold">Agent Observatory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-status" />
            <span className="text-xs text-ares-dark-400">Live</span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-3 py-3 border-b border-ares-dark-700">
          <div className="flex gap-1">
            {(['all', 'active', 'idle', 'offline'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors',
                  filter === f
                    ? 'bg-ares-red-600/20 text-ares-red-400 border border-ares-red-600/50'
                    : 'text-ares-dark-400 hover:text-white hover:bg-ares-dark-800'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={cn(
                  'ml-1.5 px-1 rounded text-[10px]',
                  filter === f ? 'bg-ares-red-600/30' : 'bg-ares-dark-800'
                )}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* ARES PM - Always first */}
          {pmAgent && (
            <div className="mb-4">
              <div className="text-xs text-ares-red-500 font-medium mb-2 flex items-center gap-1">
                <span>⚔️</span>
                <span>ARES Project Manager</span>
              </div>
              <AgentCard
                agent={pmAgent}
                isSpecial={true}
                onClick={() => onAgentClick?.(pmAgent)}
              />
            </div>
          )}

          {/* Other Agents */}
          {otherAgents.length > 0 && (
            <>
              <div className="text-xs text-ares-dark-400 font-medium mb-2">
                Agent Pool
              </div>
              <div className="space-y-3">
                {otherAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onClick={() => onAgentClick?.(agent)}
                  />
                ))}
              </div>
            </>
          )}

          {filteredAgents.length === 0 && (
            <div className="text-center py-8 text-ares-dark-500">
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-sm">No agents found</div>
              <div className="text-xs mt-1">Try a different filter</div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-3 border-t border-ares-dark-700 bg-ares-dark-900">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold text-white">
                {agents.filter(a => a.status === 'busy').length}
              </div>
              <div className="text-[10px] text-ares-dark-400">Active</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">
                {agents.reduce((sum, a) => sum + a.completedTasks, 0)}
              </div>
              <div className="text-[10px] text-ares-dark-400">Tasks Done</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-400">
                {Math.round(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length || 0)}%
              </div>
              <div className="text-[10px] text-ares-dark-400">Avg Success</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
AgentSidebar.displayName = 'AgentSidebar';

export { AgentSidebar, type AgentSidebarProps, type Agent };
