'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AgentStatusCard } from './AgentStatusCard';
import { TaskQueueView } from './TaskQueueView';
import { ExecuteTaskForm } from './ExecuteTaskForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Play, 
  Pause, 
  Square, 
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { executionEngine } from '@/execution';
import type { Agent, AgentWithStats, ExecutionStatus } from '@/types/agent';
import type { Task } from '@/types/index';

interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'task' | 'agent' | 'system';
  message: string;
  status?: 'success' | 'error' | 'info';
}

// Mock agents data - in production this would come from the agent registry
const mockAgents: AgentWithStats[] = [
  {
    id: 'ares-pm-001',
    name: 'Ares PM',
    type: 'pm',
    status: 'idle',
    capabilities: ['planning', 'coordination', 'analysis'],
    config: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      tasksCompleted: 12,
      avgDuration: 15,
      successRate: 92,
    },
  },
  {
    id: 'ares-engineer-001',
    name: 'Engineer Agent',
    type: 'engineer',
    status: 'idle',
    capabilities: ['coding', 'refactoring', 'testing'],
    config: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      tasksCompleted: 28,
      avgDuration: 25,
      successRate: 88,
    },
  },
  {
    id: 'ares-tester-001',
    name: 'Tester Agent',
    type: 'tester',
    status: 'offline',
    capabilities: ['unit-testing', 'e2e-testing', 'quality-gates'],
    config: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      tasksCompleted: 45,
      avgDuration: 10,
      successRate: 95,
    },
  },
];

export function AgentDashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentWithStats[]>(mockAgents);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [engineStatus, setEngineStatus] = useState<ExecutionStatus>({
    isRunning: false,
    queueDepth: 0,
    activeTasks: 0,
    agents: { total: 0, idle: 0, busy: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and subscribe to engine status
  useEffect(() => {
    const initEngine = async () => {
      try {
        await executionEngine.start();
        const status = executionEngine.getStatus();
        setEngineStatus(status);
        
        // Add initial activity
        addActivity({
          type: 'system',
          message: 'Execution engine started successfully',
          status: 'success',
        });
      } catch (error) {
        console.error('Failed to start engine:', error);
        addActivity({
          type: 'system',
          message: 'Failed to start execution engine',
          status: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initEngine();

    // Subscribe to status updates
    const unsubscribe = executionEngine.subscribeToStatus((status) => {
      setEngineStatus(status);
    });

    // Subscribe to task updates
    const unsubscribeTasks = executionEngine.subscribeToTasks((task) => {
      setTasks((prev) => {
        const index = prev.findIndex((t) => t.id === task.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = task as unknown as Task;
          return updated;
        }
        return [...prev, task as unknown as Task];
      });

      // Add activity for task status changes
      if (task.status === 'completed') {
        addActivity({
          type: 'task',
          message: `Task "${task.title}" completed`,
          status: 'success',
        });
      } else if (task.status === 'failed') {
        addActivity({
          type: 'task',
          message: `Task "${task.title}" failed`,
          status: 'error',
        });
      }
    });

    return () => {
      unsubscribe();
      unsubscribeTasks();
    };
  }, []);

  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    setActivities((prev) => [
      {
        ...activity,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 49), // Keep last 50 activities
    ]);
  }, []);

  const handleSubmitTask = async (taskData: { title: string; description: string; priority: number }) => {
    try {
      const task = await executionEngine.submitTask({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority === 5 ? 'critical' : 
                 taskData.priority === 4 ? 'high' : 
                 taskData.priority === 3 ? 'medium' : 'low',
      });

      addActivity({
        type: 'task',
        message: `New task submitted: "${taskData.title}"`,
        status: 'info',
      });
    } catch (error) {
      console.error('Failed to submit task:', error);
      addActivity({
        type: 'task',
        message: `Failed to submit task: ${taskData.title}`,
        status: 'error',
      });
      throw error;
    }
  };

  const handleTaskClick = (task: Task) => {
    router.push(`/agents/tasks/${task.id}`);
  };

  const handleEngineAction = async (action: 'start' | 'pause' | 'stop') => {
    try {
      switch (action) {
        case 'start':
          await executionEngine.start();
          addActivity({
            type: 'system',
            message: 'Execution engine started',
            status: 'success',
          });
          break;
        case 'pause':
          executionEngine.pause();
          addActivity({
            type: 'system',
            message: 'Execution engine paused',
            status: 'info',
          });
          break;
        case 'stop':
          await executionEngine.stop();
          addActivity({
            type: 'system',
            message: 'Execution engine stopped',
            status: 'info',
          });
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} engine:`, error);
      addActivity({
        type: 'system',
        message: `Failed to ${action} execution engine`,
        status: 'error',
      });
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Initializing Agent Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Agent Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Monitor agents, submit tasks, and track progress
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant="secondary" 
            className={cn(
              "px-3 py-1.5",
              engineStatus.isRunning 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "bg-slate-500/10 text-slate-400"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              engineStatus.isRunning ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
            )} />
            {engineStatus.isRunning ? 'Engine Running' : 'Engine Stopped'}
          </Badge>
          
          <div className="flex gap-2">
            {!engineStatus.isRunning ? (
              <Button
                size="sm"
                onClick={() => handleEngineAction('start')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEngineAction('pause')}
                  className="border-slate-700"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEngineAction('stop')}
                  className="border-slate-700 text-red-400 hover:text-red-300"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentStatusCard
            key={agent.id}
            agent={agent}
            stats={agent.stats}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Queue */}
        <div className="lg:col-span-2">
          <TaskQueueView
            tasks={tasks}
            title="Task Queue & History"
            maxHeight="500px"
            onTaskClick={handleTaskClick}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Submit Task Form */}
          <ExecuteTaskForm onSubmit={handleSubmitTask} />

          {/* Activity Feed */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-base font-semibold text-slate-100">
                  Activity Feed
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-auto">
                {activities.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <Activity className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity yet</p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/30"
                    >
                      {activity.status === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      )}
                      {activity.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      )}
                      {activity.status === 'info' && (
                        <Activity className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">{activity.message}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Engine Stats */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-base font-semibold text-slate-100">
                  Engine Stats
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <p className="text-2xl font-bold text-slate-200">
                    {engineStatus.queueDepth}
                  </p>
                  <p className="text-xs text-slate-500">Queue Depth</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <p className="text-2xl font-bold text-blue-400">
                    {engineStatus.activeTasks}
                  </p>
                  <p className="text-xs text-slate-500">Active Tasks</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <p className="text-2xl font-bold text-emerald-400">
                    {engineStatus.agents.idle}
                  </p>
                  <p className="text-xs text-slate-500">Idle Agents</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <p className="text-2xl font-bold text-amber-400">
                    {engineStatus.agents.busy}
                  </p>
                  <p className="text-xs text-slate-500">Busy Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
