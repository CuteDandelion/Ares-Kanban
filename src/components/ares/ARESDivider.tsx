import * as React from 'react';
import { cn } from '@/lib/utils';

interface ARESDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'glow' | 'dashed';
  label?: React.ReactNode;
}

const ARESDivider = React.forwardRef<HTMLDivElement, ARESDividerProps>(
  ({ className, orientation = 'horizontal', variant = 'default', label, ...props }, ref) => {
    const baseClasses = {
      horizontal: 'w-full h-px',
      vertical: 'h-full w-px',
    }[orientation];

    const variantClasses = {
      default: 'bg-ares-dark-700',
      glow: 'bg-gradient-to-r from-transparent via-ares-red-600/50 to-transparent',
      dashed: 'border-t border-dashed border-ares-dark-700 bg-transparent',
    }[variant];

    if (label) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center',
            orientation === 'vertical' && 'flex-col',
            className
          )}
          {...props}
        >
          <div className={cn(baseClasses, variantClasses, 'flex-1')} />
          <span className={cn(
            'text-xs text-ares-dark-400 font-medium',
            orientation === 'horizontal' ? 'px-3' : 'py-3'
          )}>
            {label}
          </span>
          <div className={cn(baseClasses, variantClasses, 'flex-1')} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses, className)}
        {...props}
      />
    );
  }
);
ARESDivider.displayName = 'ARESDivider';

export { ARESDivider, type ARESDividerProps };
