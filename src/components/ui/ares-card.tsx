'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const AresCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'elevated' | 'outlined' | 'glow';
    hover?: boolean;
  }
>(({ className, variant = 'default', hover = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl transition-all duration-200',
      // Base styles
      'bg-ares-dark-850 text-white',
      // Variants
      variant === 'default' && 'border border-ares-dark-700',
      variant === 'elevated' && 'border border-ares-dark-700 ares-gradient-panel',
      variant === 'outlined' && 'border-2 border-ares-dark-600 bg-transparent',
      variant === 'glow' && 'border border-ares-red-600/30 shadow-glow-red',
      // Hover effects
      hover && 'hover:border-ares-red-600/30 hover:shadow-glow-red-sm',
      className
    )}
    {...props}
  />
));
AresCard.displayName = 'AresCard';

const AresCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
AresCardHeader.displayName = 'AresCardHeader';

const AresCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-semibold leading-none tracking-tight text-white',
      className
    )}
    {...props}
  />
));
AresCardTitle.displayName = 'AresCardTitle';

const AresCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-ares-dark-300', className)}
    {...props}
  />
));
AresCardDescription.displayName = 'AresCardDescription';

const AresCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
AresCardContent.displayName = 'AresCardContent';

const AresCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
AresCardFooter.displayName = 'AresCardFooter';

export {
  AresCard,
  AresCardHeader,
  AresCardFooter,
  AresCardTitle,
  AresCardDescription,
  AresCardContent,
};
