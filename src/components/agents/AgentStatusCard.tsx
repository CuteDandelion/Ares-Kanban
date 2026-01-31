'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Cpu, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  PauseCircle,
  PowerOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent, AgentStatus } from '@/types/agent';

interface AgentStatusCardProps {
  agent: Agent;
  currentTask?: {
    id: string;
    title: string;
    progress?: number;
  };
  stats?: {
    tasksCompleted: number;
    avgDuration: number;
    successRate: number;
  };
  className?: string;
}

const statusConfig: Record<AgentStatus, { 
  label: string; 
  color: string; 
  icon: React.ReactNode;
  bgColor: string;
}> = {
  idle: {
    label: 'Idle',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  busy: {
    label: 'Busy',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: <Clock className="w-4 h-4" />,
  },
  paused: {
    label: 'Paused',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: <PauseCircle className="w-4 h-4" />,
  },
  offline: {
    label: 'Offline',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    icon: <PowerOff className="w-4 h-4" />,
  },
};

const agentTypeLabels: Record<string, string> = {
  pm: 'Project Manager',
  architect: 'Architect',
  engineer: 'Engineer',
  tester: 'Tester',
  devops: 'DevOps',
};

export function AgentStatusCard({ 
  agent, 
  currentTask, 
  stats,
  className 
}: AgentStatusCardProps) {
  const config = statusConfig[agent.status];
  const initials = agent.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card className={cn(
      "bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-all duration-200",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-slate-700">
              <AvatarFallback className="bg-slate-800 text-slate-200 text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-semibold text-slate-100">
                {agent.name}
              </CardTitle>
              <p className="text-xs text-slate-400">
                {agentTypeLabels[agent.type] || agent.type}
              </p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={cn(
              "flex items-center gap-1.5 px-2 py-1",
              config.bgColor,
              config.color,
              "border-0"
            )}
          >
            {config.icon}
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Task */}
        {currentTask && agent.status === 'busy' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Task</span>
              <span className="text-slate-300 truncate max-w-[150px]">
                {currentTask.title}
              </span>
            </div>
            {currentTask.progress !== undefined && (
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${currentTask.progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1.5">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <Badge 
              key={capability}
              variant="outline" 
              className="text-[10px] px-1.5 py-0.5 border-slate-700 text-slate-400"
            >
              {capability}
            </Badge>
          ))}
          {agent.capabilities.length > 3 && (
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0.5 border-slate-700 text-slate-400"
            >
              +{agent.capabilities.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-200">
                {stats.tasksCompleted}
              </p>
              <p className="text-[10px] text-slate-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-200">
                {Math.round(stats.avgDuration)}m
              </p>
              <p className="text-[10px] text-slate-500">Avg Time</p>
            </div>
            <div className="text-center">
              <p className={cn(
                "text-lg font-semibold",
                stats.successRate >= 80 ? "text-emerald-400" : 
                stats.successRate >= 50 ? "text-amber-400" : "text-red-400"
              )}>
                {Math.round(stats.successRate)}%
              </p>
              <p className="text-[10px] text-slate-500">Success</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
