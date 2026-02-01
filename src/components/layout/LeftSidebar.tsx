'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Navigation items
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  shortcut?: string;
}

interface LeftSidebarProps {
  className?: string;
  isExpanded?: boolean;
  onCLIToggle?: () => void;
  isCLIActive?: boolean;
}

const navigationItems: NavItem[] = [
  {
    id: 'boards',
    label: 'Boards',
    href: '/boards',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    id: 'agents',
    label: 'Agents',
    href: '/agents',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const LeftSidebar = React.forwardRef<HTMLDivElement, LeftSidebarProps>(
  ({ className, isExpanded = false, onCLIToggle, isCLIActive = false }, ref) => {
    const pathname = usePathname();

    const isActive = (href: string) => {
      if (href === '/boards') {
        return pathname === '/boards' || pathname.startsWith('/boards/');
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'h-full flex flex-col bg-ares-dark-900',
          className
        )}
      >
        {/* Logo */}
        <div className="h-16 border-b border-ares-dark-700 flex items-center justify-center">
          <Link href="/boards" className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-lg ares-gradient-red flex items-center justify-center shadow-lg shadow-red-900/30 animate-glow-pulse flex-shrink-0">
              <span className="text-xl font-bold text-white font-mono">A</span>
            </div>
            {isExpanded && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">ARES</span>
                <span className="text-[10px] text-ares-dark-400">Command Center</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'h-12 mx-2 rounded-lg flex items-center gap-3 px-3 relative transition-all duration-200 group',
                  active
                    ? 'bg-ares-red-600/10 text-ares-red-500'
                    : 'text-ares-dark-400 hover:text-white hover:bg-ares-dark-800'
                )}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-ares-red-600 rounded-r-full" />
                )}
                
                <div className={cn(
                  'flex-shrink-0 transition-colors',
                  active && 'text-ares-red-500'
                )}>
                  {item.icon}
                </div>
                
                {isExpanded && (
                  <span className="text-sm font-medium truncate">
                    {item.label}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-ares-dark-800 border border-ares-dark-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}

          {/* CLI Toggle */}
          <button
            onClick={onCLIToggle}
            className={cn(
              'h-12 mx-2 rounded-lg flex items-center gap-3 px-3 relative transition-all duration-200 group mt-4',
              isCLIActive
                ? 'bg-blue-600/10 text-blue-400'
                : 'text-ares-dark-400 hover:text-blue-400 hover:bg-ares-dark-800'
            )}
          >
            <div className={cn(
              'flex-shrink-0',
              isCLIActive && 'text-blue-400'
            )}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            {isExpanded && (
              <span className="text-sm font-medium truncate">
                CLI
              </span>
            )}

            {!isExpanded && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-ares-dark-800 border border-ares-dark-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                CLI
              </div>
            )}
          </button>
        </nav>

        {/* Bottom section */}
        <div className="py-4 border-t border-ares-dark-700">
          <button className="w-full h-12 mx-auto max-w-[48px] rounded-lg flex items-center justify-center text-ares-dark-400 hover:text-white hover:bg-ares-dark-800 transition-colors group relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            
            {!isExpanded && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-ares-dark-800 border border-ares-dark-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Profile
              </div>
            )}
          </button>
        </div>
      </div>
    );
  }
);
LeftSidebar.displayName = 'LeftSidebar';

export { LeftSidebar, type LeftSidebarProps };
