'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { executionEngine } from '@/execution';
import type { Task, TaskStatus } from '@/types/index';

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
    icon: <Clock className="w-4 h-4" />,
  },
  queued: {
    label: 'Queued',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: <Clock className="w-4 h-4" />,
  },
  assigned: {
    label: 'Assigned',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  running: {
    label: 'Running',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  paused: {
    label: 'Paused',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    icon: <Clock className="w-4 h-4" />,
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  failed: {
    label: 'Failed',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: <XCircle className="w-4 h-4" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    icon: <XCircle className="w-4 h-4" />,
  },
  retrying: {
    label: 'Retrying',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    icon: <RotateCcw className="w-4 h-4" />,
  },
};

const priorityLabels: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-red-400' },
  high: { label: 'High', color: 'text-orange-400' },
  medium: { label: 'Medium', color: 'text-amber-400' },
  low: { label: 'Low', color: 'text-blue-400' },
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, we would fetch the task from the execution engine
    // For now, we'll show a placeholder
    setIsLoading(false);
  }, [taskId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading task details...</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/agents')}
            className="mb-6 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <XCircle className="w-12 h-12 text-slate-500 mb-4" />
              <h1 className="text-xl font-semibold text-slate-300 mb-2">
                Task Not Found
              </h1>
              <p className="text-slate-500">
                The task you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const status = statusConfig[task.status];
  const priority = priorityLabels[task.priority] || { label: task.priority, color: 'text-slate-400' };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/agents')}
          className="mb-6 text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      status.bgColor,
                      status.color,
                      "border-0"
                    )}
                  >
                    {status.icon}
                    <span className="ml-1">{status.label}</span>
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className={cn("border-slate-700", priority.color)}
                  >
                    {priority.label}
                  </Badge>
                </div>
                
                <CardTitle className="text-2xl text-slate-100">
                  {task.title}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {task.description && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  Description
                </h3>
                <p className="text-slate-300">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/30">
                <p className="text-sm text-slate-500 mb-1">Created</p>
                <p className="text-slate-300">
                  {new Date(task.created_at).toLocaleString()}
                </p>
              </div>

              {task.started_at && (
                <div className="p-4 rounded-lg bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Started</p>
                  <p className="text-slate-300">
                    {new Date(task.started_at).toLocaleString()}
                  </p>
                </div>
              )}

              {task.completed_at && (
                <div className="p-4 rounded-lg bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Completed</p>
                  <p className="text-slate-300">
                    {new Date(task.completed_at).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-slate-800/30">
                <p className="text-sm text-slate-500 mb-1">Retries</p>
                <p className="text-slate-300">
                  {task.retry_count} / {task.max_retries}
                </p>
              </div>
            </div>

            {task.result && (
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Result</h3>
                <div className="flex items-center gap-2 mb-2">
                  {task.result.success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Success</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-medium">Failed</span>
                    </>
                  )}
                </div>
                <p className="text-slate-300">{task.result.output}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
