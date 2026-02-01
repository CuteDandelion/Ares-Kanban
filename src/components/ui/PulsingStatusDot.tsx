'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusState = 'online' | 'processing' | 'error' | 'offline' | 'warning';

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
    bg: 'bg-green-500',
    glow: 'shadow-glow-green',
    label: 'Online',
  },
  processing: {
    bg: 'bg-yellow-400',
    glow: 'shadow-glow-yellow',
    label: 'Processing',
  },
  error: {
    bg: 'bg-red-500',
    glow: 'shadow-glow-red',
    label: 'Error',
  },
  offline: {
    bg: 'bg-gray-500',
    glow: '',
    label: 'Offline',
  },
  warning: {
    bg: 'bg-orange-500',
    glow: 'shadow-glow-orange',
    label: 'Warning',
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
            state === 'online' && 'text-green-400',
            state === 'processing' && 'text-yellow-400',
            state === 'error' && 'text-red-400',
            state === 'offline' && 'text-gray-400',
            state === 'warning' && 'text-orange-400'
          )}
        >
          {displayLabel}
        </span>
      )}
    </div>
  );
}

export default PulsingStatusDot;
