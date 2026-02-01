import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const aresBadgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ares-red-600/20 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-ares-red-600 text-white',
        secondary: 'border-transparent bg-ares-dark-700 text-ares-dark-300',
        outline: 'border-ares-dark-600 text-ares-dark-300',
        ghost: 'border-transparent text-ares-dark-300',
      },
      // Priority variants
      priority: {
        critical: 'priority-badge-critical',
        high: 'priority-badge-high',
        medium: 'priority-badge-medium',
        low: 'priority-badge-low',
        none: 'bg-ares-dark-750 text-ares-dark-400 border-ares-dark-700',
      },
      // Status variants
      status: {
        online: 'border-transparent bg-green-900/50 text-green-200',
        busy: 'border-transparent bg-orange-900/50 text-orange-200',
        offline: 'border-transparent bg-ares-dark-700 text-ares-dark-400',
        error: 'border-transparent bg-red-900/50 text-red-200',
        idle: 'border-transparent bg-yellow-900/50 text-yellow-200',
      },
      // ARES accent variants
      accent: {
        red: 'border-transparent bg-ares-red-900/50 text-ares-red-200',
        cyan: 'border-transparent bg-cyan-900/50 text-cyan-200',
        gold: 'border-transparent bg-yellow-900/50 text-yellow-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ARESBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof aresBadgeVariants> {
  dot?: boolean;
  dotColor?: 'green' | 'orange' | 'red' | 'gray' | 'yellow';
}

const ARESBadge = React.forwardRef<HTMLDivElement, ARESBadgeProps>(
  ({ className, variant, priority, status, accent, dot, dotColor, children, ...props }, ref) => {
    const dotColorClass = {
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      gray: 'bg-gray-500',
      yellow: 'bg-yellow-500',
    }[dotColor || 'gray'];

    return (
      <div
        className={cn(aresBadgeVariants({ variant, priority, status, accent }), className)}
        ref={ref}
        {...props}
      >
        {dot && (
          <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dotColorClass)} />
        )}
        {children}
      </div>
    );
  }
);
ARESBadge.displayName = 'ARESBadge';

// Specialized badges for common use cases
const PriorityBadge = ({
  priority,
  className,
}: {
  priority: 'critical' | 'high' | 'medium' | 'low' | 'none';
  className?: string;
}) => {
  const labels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    none: 'None',
  };

  return (
    <ARESBadge priority={priority} className={className}>
      {labels[priority]}
    </ARESBadge>
  );
};

const StatusBadge = ({
  status,
  showDot = true,
  className,
}: {
  status: 'online' | 'busy' | 'offline' | 'error' | 'idle';
  showDot?: boolean;
  className?: string;
}) => {
  const labels = {
    online: 'Online',
    busy: 'Busy',
    offline: 'Offline',
    error: 'Error',
    idle: 'Idle',
  };

  const dotColors = {
    online: 'green',
    busy: 'orange',
    offline: 'gray',
    error: 'red',
    idle: 'yellow',
  } as const;

  return (
    <ARESBadge
      status={status}
      dot={showDot}
      dotColor={dotColors[status]}
      className={className}
    >
      {labels[status]}
    </ARESBadge>
  );
};

export { ARESBadge, PriorityBadge, StatusBadge, aresBadgeVariants };
