'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFormData {
  title: string;
  description: string;
  priority: number;
}

interface ExecuteTaskFormProps {
  onSubmit: (task: TaskFormData) => Promise<void>;
  className?: string;
}

const priorityOptions = [
  { value: 5, label: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/10' },
  { value: 4, label: 'High', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  { value: 3, label: 'Medium', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { value: 2, label: 'Low', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { value: 1, label: 'Minimal', color: 'text-slate-400', bgColor: 'bg-slate-500/10' },
];

export function ExecuteTaskForm({ onSubmit, className }: ExecuteTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<number>(3);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setPriority(3);
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPriority = priorityOptions.find(p => p.value === priority);

  if (!showForm) {
    return (
      <Card 
        className={cn(
          "bg-slate-900/50 border-slate-700/50 border-dashed",
          "hover:border-slate-600/50 hover:bg-slate-800/30",
          "transition-all duration-200 cursor-pointer",
          className
        )}
        onClick={() => setShowForm(true)}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-300 font-medium">Submit New Task</p>
          <p className="text-slate-500 text-sm mt-1">Assign to Ares Agent System</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "bg-slate-900/50 border-slate-700/50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <CardTitle className="text-base font-semibold text-slate-100">
            Submit Task to Ares
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">
              Task Title
            </Label>
            <Input
              id="title"
              placeholder="e.g., Implement user authentication"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Description
            </Label>
            <Input
              id="description"
              placeholder="Describe what needs to be done..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Priority</Label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  disabled={isSubmitting}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                    "border border-slate-700",
                    priority === option.value 
                      ? cn(option.bgColor, option.color, "border-current")
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit Task
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
