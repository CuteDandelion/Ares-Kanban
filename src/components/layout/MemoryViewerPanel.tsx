/**
 * ARES Memory Viewer Panel
 * 
 * Displays conversation memory and context information.
 * Shows memory statistics, recent entries, and context window.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MemoryEntry, MemoryStats } from '@/memory';
import { X, Brain, Clock, Database, Trash2 } from 'lucide-react';

export interface MemoryViewerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entries: MemoryEntry[];
  stats: MemoryStats | null;
  onClearMemory: () => void;
}

export function MemoryViewerPanel({
  isOpen,
  onClose,
  entries,
  stats,
  onClearMemory,
}: MemoryViewerPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'recent' | 'stats'>('recent');

  if (!isOpen) return null;

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user':
        return '👤';
      case 'assistant':
        return '🤖';
      case 'tool':
        return '🔧';
      case 'system':
        return '⚙️';
      case 'thought':
        return '💭';
      default:
        return '📝';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user':
        return 'text-cyan-400';
      case 'assistant':
        return 'text-purple-400';
      case 'tool':
        return 'text-yellow-400';
      case 'system':
        return 'text-gray-400';
      case 'thought':
        return 'text-pink-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-ares-dark-900/95 border-l border-ares-dark-700 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ares-dark-700 bg-ares-dark-800/50">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">Memory Viewer</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-ares-dark-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ares-dark-700">
        <button
          onClick={() => setActiveTab('recent')}
          className={cn(
            'flex-1 py-2 px-4 text-sm font-medium transition-colors',
            activeTab === 'recent'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-ares-dark-800/50'
              : 'text-gray-400 hover:text-white hover:bg-ares-dark-800/30'
          )}
        >
          Recent Entries
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={cn(
            'flex-1 py-2 px-4 text-sm font-medium transition-colors',
            activeTab === 'stats'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-ares-dark-800/50'
              : 'text-gray-400 hover:text-white hover:bg-ares-dark-800/30'
          )}
        >
          Statistics
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'recent' ? (
          <div className="p-4 space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No memory entries yet</p>
                <p className="text-sm mt-1">Start a conversation to build memory</p>
              </div>
            ) : (
              entries.slice(-20).reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="bg-ares-dark-800/50 rounded-lg p-3 border border-ares-dark-700"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span>{getRoleIcon(entry.role)}</span>
                      <span className={cn('text-xs font-medium uppercase', getRoleColor(entry.role))}>
                        {entry.role}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300 line-clamp-3">
                    {entry.content}
                  </p>
                  
                  {entry.metadata?.toolName && (
                    <span className="inline-block mt-2 text-xs bg-ares-dark-700 px-2 py-0.5 rounded text-yellow-400">
                      {entry.metadata.toolName}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {stats ? (
              <>
                <div className="bg-ares-dark-800/50 rounded-lg p-4 border border-ares-dark-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">Storage</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Entries</span>
                      <span className="text-white font-mono">{stats.totalEntries}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Sessions</span>
                      <span className="text-white font-mono">{stats.sessionCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Storage Size</span>
                      <span className="text-white font-mono">{stats.storageSize}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-ares-dark-800/50 rounded-lg p-4 border border-ares-dark-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-white">Timeline</span>
                  </div>
                  
                  <div className="space-y-2">
                    {stats.oldestEntry > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Oldest Entry</span>
                        <span className="text-white">{formatDate(stats.oldestEntry)}</span>
                      </div>
                    )}
                    
                    {stats.newestEntry > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Latest Entry</span>
                        <span className="text-white">{formatDate(stats.newestEntry)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {Object.keys(stats.entriesByRole).length > 0 && (
                  <div className="bg-ares-dark-800/50 rounded-lg p-4 border border-ares-dark-700">
                    <span className="font-medium text-white mb-3 block">Entries by Type</span>
                    
                    <div className="space-y-2">
                      {Object.entries(stats.entriesByRole).map(([role, count]) => (
                        <div key={role} className="flex justify-between text-sm">
                          <span className={cn('capitalize', getRoleColor(role))}>
                            {getRoleIcon(role)} {role}
                          </span>
                          <span className="text-white font-mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No statistics available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-ares-dark-700 p-4 bg-ares-dark-800/50">
        <button
          onClick={onClearMemory}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 
                     bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg
                     transition-colors text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Clear Memory
        </button>
      </div>
    </div>
  );
}

export default MemoryViewerPanel;
