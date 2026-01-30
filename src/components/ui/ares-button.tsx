'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const aresButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ares-red-600/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-ares-red-600 to-ares-red-700 text-white shadow-glow-red hover:from-ares-red-700 hover:to-ares-red-800 hover:shadow-glow-red-lg hover:-translate-y-0.5',
        secondary:
          'bg-ares-dark-750 border border-ares-dark-600 text-white hover:bg-ares-dark-700 hover:border-ares-dark-500 hover:border-ares-red-600/30',
        ghost:
          'text-ares-dark-300 hover:bg-ares-red-600/10 hover:text-white',
        outline:
          'border border-ares-dark-600 bg-transparent text-white hover:bg-ares-dark-750 hover:border-ares-red-600/50',
        danger:
          'bg-ares-red-900/50 text-ares-red-200 border border-ares-red-800 hover:bg-ares-red-900',
        link:
          'text-ares-red-500 underline-offset-4 hover:underline hover:text-ares-red-400',
        glow:
          'bg-ares-red-600 text-white shadow-glow-red-lg hover:shadow-glow-red animate-glow-pulse',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface AresButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof aresButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const AresButton = React.forwardRef<HTMLButtonElement, AresButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(aresButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
AresButton.displayName = 'AresButton';

export { AresButton, aresButtonVariants };
