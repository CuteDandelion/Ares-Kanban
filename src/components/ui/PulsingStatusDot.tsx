'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusState = 'online' | 'processing' | 'error' | 'offline' | 'warning' | 'info' | 'agent' | 'thinking' | 'tool' | 'success';

export interface PulsingStatusDotProps {
  state: StatusState;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const stateColors: Record<StatusState, { bg: string; glow: string; label: string }> = {
  online: {
    bg: 'bg-emerald-500',
    glow: 'shadow-glow-emerald',
    label: 'Online',
  },
  processing: {
    bg: 'bg-amber-400',
    glow: 'shadow-glow-amber',
    label: 'Processing',
  },
  error: {
    bg: 'bg-red-500',
    glow: 'shadow-glow-red',
    label: 'Error',
  },
  offline: {
    bg: 'bg-slate-500',
    glow: '',
    label: 'Offline',
  },
  warning: {
    bg: 'bg-orange-500',
    glow: 'shadow-glow-orange',
    label: 'Warning',
  },
  info: {
    bg: 'bg-blue-500',
    glow: 'shadow-glow-blue',
    label: 'Info',
  },
  agent: {
    bg: 'bg-purple-500',
    glow: 'shadow-glow-purple',
    label: 'Agent',
  },
  thinking: {
    bg: 'bg-amber-400',
    glow: 'shadow-glow-amber',
    label: 'Thinking',
  },
  tool: {
    bg: 'bg-violet-500',
    glow: 'shadow-glow-violet',
    label: 'Tool',
  },
  success: {
    bg: 'bg-emerald-500',
    glow: 'shadow-glow-emerald',
    label: 'Success',
  },
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function PulsingStatusDot({
  state,
  size = 'md',
  pulse = true,
  showLabel = false,
  label,
  className,
}: PulsingStatusDotProps) {
  const colors = stateColors[state];
  const displayLabel = label || colors.label;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full transition-all duration-300',
          sizeClasses[size],
          colors.bg,
          pulse && state !== 'offline' && 'animate-pulse-dot',
          pulse && colors.glow
        )}
        aria-label={`Status: ${displayLabel}`}
        role="status"
      />
      {showLabel && (
        <span
          className={cn(
            'text-xs font-medium',
            state === 'online' && 'text-emerald-400',
            state === 'processing' && 'text-amber-400',
            state === 'error' && 'text-red-400',
            state === 'offline' && 'text-slate-400',
            state === 'warning' && 'text-orange-400',
            state === 'info' && 'text-blue-400',
            state === 'agent' && 'text-purple-400',
            state === 'thinking' && 'text-amber-400',
            state === 'tool' && 'text-violet-400',
            state === 'success' && 'text-emerald-400'
          )}
        >
          {displayLabel}
        </span>
      )}
    </div>
  );
}

export default PulsingStatusDot;
