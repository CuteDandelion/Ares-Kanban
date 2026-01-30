'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AresLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textPosition?: 'right' | 'bottom';
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: { icon: 32, text: 'text-lg' },
  md: { icon: 40, text: 'text-xl' },
  lg: { icon: 64, text: 'text-3xl' },
  xl: { icon: 80, text: 'text-4xl' },
};

export function AresLogo({
  size = 'md',
  showText = true,
  textPosition = 'right',
  className,
  animate = false,
}: AresLogoProps) {
  const { icon: iconSize, text: textSize } = sizeMap[size];
  const isVertical = textPosition === 'bottom';

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        isVertical && 'flex-col gap-2',
        className
      )}
    >
      {/* ARES Icon - Spartan Helmet Shield Style */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl',
          'bg-gradient-to-br from-ares-red-600 to-ares-red-700',
          'shadow-glow-red',
          animate && 'animate-glow-pulse'
        )}
        style={{ width: iconSize, height: iconSize }}
      >
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/10" />
        
        {/* A Letter */}
        <span
          className={cn(
            'relative font-bold text-white tracking-tighter',
            size === 'sm' && 'text-lg',
            size === 'md' && 'text-xl',
            size === 'lg' && 'text-3xl',
            size === 'xl' && 'text-4xl'
          )}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          A
        </span>
        
        {/* Decorative corner accents */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 border-l-2 border-t-2 border-white/30 rounded-tl-sm" />
        <div className="absolute top-1 right-1 w-1.5 h-1.5 border-r-2 border-t-2 border-white/30 rounded-tr-sm" />
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-l-2 border-b-2 border-white/30 rounded-bl-sm" />
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-r-2 border-b-2 border-white/30 rounded-br-sm" />
      </div>

      {/* Text */}
      {showText && (
        <div className={cn('flex flex-col', isVertical && 'items-center')}>
          <span
            className={cn(
              'font-bold tracking-tight text-white',
              textSize
            )}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            ARES
          </span>
          <span className="text-xs text-ares-dark-400 tracking-widest uppercase">
            Kanban
          </span>
        </div>
      )}
    </div>
  );
}

// Minimal version - Just the A icon
export function AresIcon({
  size = 40,
  className,
  animate = false,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-xl',
        'bg-gradient-to-br from-ares-red-600 to-ares-red-700',
        'shadow-glow-red',
        animate && 'animate-glow-pulse',
        className
      )}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/10" />
      <span
        className="relative font-bold text-white tracking-tighter"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: size * 0.5,
        }}
      >
        A
      </span>
    </div>
  );
}

// Favicon/Small icon version
export function AresFavicon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background */}
      <rect
        width="32"
        height="32"
        rx="6"
        fill="url(#ares-gradient)"
      />
      {/* A Letter */}
      <text
        x="16"
        y="23"
        textAnchor="middle"
        fill="white"
        fontFamily="Inter, sans-serif"
        fontWeight="700"
        fontSize="18"
      >
        A
      </text>
      {/* Definitions */}
      <defs>
        <linearGradient
          id="ares-gradient"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#DC2626" />
          <stop offset="1" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
