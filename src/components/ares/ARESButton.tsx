import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const aresButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ares-red-600/20 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-ares-red-600 text-white hover:bg-ares-red-700 shadow-lg shadow-ares-red-900/30 active:scale-95',
        secondary:
          'bg-ares-dark-800 text-white hover:bg-ares-dark-700 border border-ares-dark-700 active:scale-95',
        ghost:
          'text-ares-dark-300 hover:text-white hover:bg-ares-dark-800 active:scale-95',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/30 active:scale-95',
        outline:
          'border border-ares-red-600 text-ares-red-500 hover:bg-ares-red-600/10 active:scale-95',
        link:
          'text-ares-red-500 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ARESButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof aresButtonVariants> {
  loading?: boolean;
}

const ARESButton = React.forwardRef<HTMLButtonElement, ARESButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(aresButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
ARESButton.displayName = 'ARESButton';

export { ARESButton, aresButtonVariants };
