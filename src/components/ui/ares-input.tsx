'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AresInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const AresInput = React.forwardRef<HTMLInputElement, AresInputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-white">
            {label}
            {props.required && <span className="text-ares-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ares-dark-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-11 w-full rounded-lg border border-ares-dark-600 bg-ares-dark-750 px-4 py-2',
              'text-sm text-white placeholder:text-ares-dark-500',
              'transition-all duration-200',
              'focus:border-ares-red-600 focus:outline-none focus:ring-2 focus:ring-ares-red-600/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'hover:border-ares-dark-500',
              icon && 'pl-10',
              error && 'border-ares-red-600 focus:border-ares-red-600 focus:ring-ares-red-600/20',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-ares-red-500">{error}</p>
        )}
      </div>
    );
  }
);
AresInput.displayName = 'AresInput';

export { AresInput };
