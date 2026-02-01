import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const aresCardVariants = cva(
  'rounded-lg border bg-ares-dark-850 text-white shadow-card transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-ares-dark-700 hover:border-ares-red-600/50',
        interactive: 'border-ares-dark-700 hover:border-ares-red-600 hover:shadow-[0_0_0_1px_rgba(220,38,38,0.3),0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 cursor-pointer',
        flat: 'border-ares-dark-700 shadow-none',
        ghost: 'border-transparent bg-transparent shadow-none',
      },
      size: {
        default: 'p-4',
        sm: 'p-3',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ARESCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof aresCardVariants> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const ARESCard = React.forwardRef<HTMLDivElement, ARESCardProps>(
  ({ className, variant, size, header, footer, children, ...props }, ref) => {
    return (
      <div
        className={cn(aresCardVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {header && (
          <div className="mb-3 pb-3 border-b border-ares-dark-700">
            {header}
          </div>
        )}
        <div className="space-y-2">{children}</div>
        {footer && (
          <div className="mt-3 pt-3 border-t border-ares-dark-700">
            {footer}
          </div>
        )}
      </div>
    );
  }
);
ARESCard.displayName = 'ARESCard';

const ARESCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-4', className)}
    {...props}
  />
));
ARESCardHeader.displayName = 'ARESCardHeader';

const ARESCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)}
    {...props}
  />
));
ARESCardTitle.displayName = 'ARESCardTitle';

const ARESCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-ares-dark-300', className)}
    {...props}
  />
));
ARESCardDescription.displayName = 'ARESCardDescription';

const ARESCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
));
ARESCardContent.displayName = 'ARESCardContent';

const ARESCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 pt-0', className)}
    {...props}
  />
));
ARESCardFooter.displayName = 'ARESCardFooter';

export {
  ARESCard,
  ARESCardHeader,
  ARESCardTitle,
  ARESCardDescription,
  ARESCardContent,
  ARESCardFooter,
  aresCardVariants,
};
