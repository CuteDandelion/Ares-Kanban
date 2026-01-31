'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  Loader2,
  ListTodo,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types/index';

interface TaskQueueViewProps {
  tasks: Task[];
  title?: string;
  maxHeight?: string;
  onTaskClick?: (task: Task) => void;
  className?: string;
}

const statusConfig: Record<TaskStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: 'Pending',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    icon: <Clock className="w-3 h-3" />,
  },
  queued: {
    label: 'Queued',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: <ListTodo className="w-3 h-3" />,
  },
  assigned: {
    label: 'Assigned',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  running: {
    label: 'Running',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  paused: {
    label: 'Paused',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  failed: {
    label: 'Failed',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: <XCircle className="w-3 h-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    icon: <XCircle className="w-3 h-3" />,
  },
  retrying: {
    label: 'Retrying',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    icon: <RotateCcw className="w-3 h-3" />,
  },
};

const priorityLabels: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-blue-400',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function TaskQueueView({ 
  tasks, 
  title = 'Task Queue',
  maxHeight = '400px',
  onTaskClick,
  className 
}: TaskQueueViewProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort by status (active first), then priority (high first), then created date
    const statusOrder: Record<TaskStatus, number> = {
      running: 0,
      retrying: 1,
      assigned: 2,
      queued: 3,
      pending: 4,
      paused: 5,
      failed: 6,
      cancelled: 7,
      completed: 8,
    };
    
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Priority sort (critical > high > medium > low)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const activeCount = tasks.filter(t => 
    ['running', 'assigned', 'retrying'].includes(t.status)
  ).length;
  const pendingCount = tasks.filter(t => 
    ['pending', 'queued'].includes(t.status)
  ).length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <Card className={cn(
      "bg-slate-900/50 border-slate-700/50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-100">
            {title}
          </CardTitle>
          <div className="flex gap-2">
            {activeCount > 0 && (
              <Badge className="bg-blue-500/10 text-blue-400 border-0">
                {activeCount} Active
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge className="bg-slate-500/10 text-slate-400 border-0">
                {pendingCount} Pending
              </Badge>
            )}
            <Badge className="bg-emerald-500/10 text-emerald-400 border-0">
              {completedCount} Done
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="px-6 pb-6 overflow-auto" style={{ maxHeight }}>
          <div className="space-y-2">
            {sortedTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tasks in queue</p>
              </div>
            ) : (
              sortedTasks.map((task) => {
                const config = statusConfig[task.status];
                const isClickable = !!onTaskClick;
                
                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className={cn(
                      "p-3 rounded-lg border border-slate-800 bg-slate-800/50",
                      "transition-all duration-200",
                      isClickable && "cursor-pointer hover:border-slate-600 hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-200 truncate">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 shrink-0",
                          config.bgColor,
                          config.color,
                          "border-0 text-[10px]"
                        )}
                      >
                        {config.icon}
                        {config.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "font-medium capitalize",
                          priorityLabels[task.priority] || 'text-slate-400'
                        )}>
                          {task.priority}
                        </span>
                        <span className="text-slate-500">
                          {formatTimeAgo(task.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
