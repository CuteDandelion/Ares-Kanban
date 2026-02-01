'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  cliPanel?: React.ReactNode;
  className?: string;
}

/**
 * AppLayout - Three-panel layout system for ARES Command Center
 * 
 * Layout structure:
 * - Left Sidebar (fixed, 64px or 240px when expanded)
 * - Main Content (flexible)
 * - Right Sidebar (fixed, 320px - Agent Observatory)
 * - Bottom CLI Panel (collapsible, 48px closed, 300px open)
 */
const AppLayout = React.forwardRef<HTMLDivElement, AppLayoutProps>(
  ({ children, leftSidebar, rightSidebar, cliPanel, className }, ref) => {
    const [isCLIExpanded, setIsCLIExpanded] = React.useState(false);
    const [isLeftExpanded, setIsLeftExpanded] = React.useState(false);
    const [isRightVisible, setIsRightVisible] = React.useState(true);

    return (
      <div
        ref={ref}
        className={cn(
          'flex h-screen w-screen overflow-hidden bg-ares-dark-950 text-white',
          className
        )}
      >
        {/* Left Sidebar */}
        {leftSidebar && (
          <aside
            className={cn(
              'flex-shrink-0 h-full border-r border-ares-dark-700 transition-all duration-300 ease-out',
              isLeftExpanded ? 'w-60' : 'w-16'
            )}
            onMouseEnter={() => setIsLeftExpanded(true)}
            onMouseLeave={() => setIsLeftExpanded(false)}
          >
            {leftSidebar}
          </aside>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Main Content */}
          <main
            className={cn(
              'flex-1 overflow-hidden relative',
              isCLIExpanded && cliPanel && 'pb-[300px]',
              !isCLIExpanded && cliPanel && 'pb-12'
            )}
          >
            <div className="h-full overflow-auto">
              {children}
            </div>
          </main>

          {/* CLI Panel */}
          {cliPanel && (
            <div
              className={cn(
                'fixed bottom-0 left-16 right-0 transition-all duration-300 ease-out z-30',
                isCLIExpanded ? 'h-[300px]' : 'h-12',
                leftSidebar || 'left-0',
                rightSidebar && isRightVisible && 'right-80'
              )}
            >
              <div className="h-full bg-ares-dark-900 border-t border-ares-dark-700 shadow-cli">
                {/* CLI Toggle Bar */}
                <button
                  onClick={() => setIsCLIExpanded(!isCLIExpanded)}
                  className="w-full h-12 px-4 flex items-center justify-between bg-ares-dark-900 hover:bg-ares-dark-850 transition-colors border-b border-ares-dark-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-status" />
                      <span className="text-sm font-mono text-ares-red-500">
                        ARES ⚔️
                      </span>
                    </div>
                    <span className="text-xs text-ares-dark-400">
                      {isCLIExpanded ? 'Click to collapse' : 'Click to expand'}
                    </span>
                  </div>
                  
                  <svg
                    className={cn(
                      'w-5 h-5 text-ares-dark-400 transition-transform duration-300',
                      isCLIExpanded && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* CLI Content */}
                <div className={cn(
                  'h-[calc(100%-48px)] overflow-hidden',
                  !isCLIExpanded && 'hidden'
                )}>
                  {cliPanel}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar (Agent Observatory) */}
        {rightSidebar && (
          <aside
            className={cn(
              'w-80 h-full flex-shrink-0 border-l border-ares-dark-700 bg-ares-dark-900 transition-all duration-300 ease-out',
              !isRightVisible && 'w-0 opacity-0 overflow-hidden'
            )}
          >
            {rightSidebar}
          </aside>
        )}

        {/* Right Sidebar Toggle (if right sidebar exists) */}
        {rightSidebar && (
          <button
            onClick={() => setIsRightVisible(!isRightVisible)}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-6 h-12 bg-ares-dark-800 border border-ares-dark-700 rounded-l-md flex items-center justify-center hover:bg-ares-dark-700 transition-colors"
            style={{
              right: isRightVisible ? '320px' : '0',
            }}
          >
            <svg
              className={cn(
                'w-4 h-4 text-ares-dark-400 transition-transform duration-300',
                !isRightVisible && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
AppLayout.displayName = 'AppLayout';

export { AppLayout };
export type { AppLayoutProps };
