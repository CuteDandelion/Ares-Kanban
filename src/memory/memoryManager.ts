/**
 * ARES Memory Manager
 * 
 * Provides contextual/persistence memory for the CLI.
 * Stores conversation history with localStorage persistence.
 * 
 * Features:
 * - Message history storage (user messages, assistant responses, tool results)
 * - localStorage persistence with auto-save
 * - Context window management (max tokens/messages)
 * - Memory search and retrieval
 * - Session management
 * - Memory export/import
 */

// Memory entry types

/**
 * Generate a unique ID
 * Simple implementation without external dependencies
 */
function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}
export type MemoryEntryRole = 'user' | 'assistant' | 'system' | 'tool' | 'thought';

export interface MemoryEntry {
  id: string;
  role: MemoryEntryRole;
  content: string;
  timestamp: number;
  metadata?: {
    toolName?: string;
    toolResult?: unknown;
    thoughtType?: 'observation' | 'thought' | 'action' | 'result';
    sessionId?: string;
    [key: string]: unknown;
  };
}

// Memory configuration
export interface MemoryConfig {
  maxEntries?: number;           // Max entries to keep (default: 100)
  maxAge?: number;               // Max age in milliseconds (default: 7 days)
  persistToStorage?: boolean;    // Whether to persist to localStorage (default: true)
  storageKey?: string;           // localStorage key (default: 'ares_memory')
  contextWindowSize?: number;    // Number of entries to include in context (default: 20)
}

// Memory statistics
export interface MemoryStats {
  totalEntries: number;
  entriesByRole: Record<MemoryEntryRole, number>;
  oldestEntry: number;
  newestEntry: number;
  sessionCount: number;
  storageSize: string;
}

// Memory query options
export interface MemoryQuery {
  role?: MemoryEntryRole;
  sessionId?: string;
  startTime?: number;
  endTime?: number;
  searchTerm?: string;
  limit?: number;
}

/**
 * Memory Manager class
 * Manages conversation history with persistence
 */
export class MemoryManager {
  private entries: MemoryEntry[] = [];
  private config: Required<MemoryConfig>;
  private currentSessionId: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(config: MemoryConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 100,
      maxAge: config.maxAge ?? 7 * 24 * 60 * 60 * 1000, // 7 days
      persistToStorage: config.persistToStorage ?? true,
      storageKey: config.storageKey ?? 'ares_memory',
      contextWindowSize: config.contextWindowSize ?? 20,
    };

    this.currentSessionId = generateId();
    
    if (this.config.persistToStorage) {
      this.loadFromStorage();
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.currentSessionId;
  }

  /**
   * Start a new session
   */
  startNewSession(): string {
    this.currentSessionId = generateId();
    this.addEntry({
      role: 'system',
      content: `New session started: ${new Date().toISOString()}`,
      metadata: { sessionId: this.currentSessionId },
    });
    return this.currentSessionId;
  }

  /**
   * Add a new memory entry
   */
  addEntry(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): MemoryEntry {
    const newEntry: MemoryEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
      metadata: {
        ...entry.metadata,
        sessionId: entry.metadata?.sessionId || this.currentSessionId,
      },
    };

    this.entries.push(newEntry);
    this.enforceLimits();
    this.scheduleSave();

    return newEntry;
  }

  /**
   * Add multiple entries at once
   */
  addEntries(entries: Omit<MemoryEntry, 'id' | 'timestamp'>[]): MemoryEntry[] {
    return entries.map(entry => this.addEntry(entry));
  }

  /**
   * Get all entries
   */
  getAllEntries(): MemoryEntry[] {
    return [...this.entries];
  }

  /**
   * Get recent entries for context window
   */
  getContextWindow(size?: number): MemoryEntry[] {
    const windowSize = size ?? this.config.contextWindowSize;
    return this.entries.slice(-windowSize);
  }

  /**
   * Get entries formatted for Claude API
   */
  getFormattedContext(): Array<{ role: string; content: string }> {
    return this.getContextWindow().map(entry => {
      let role = entry.role;
      
      // Map our roles to Claude's expected roles
      if (role === 'tool' || role === 'thought') {
        role = 'assistant';
      }
      
      return {
        role,
        content: entry.content,
      };
    });
  }

  /**
   * Query memory with filters
   */
  query(query: MemoryQuery): MemoryEntry[] {
    let results = [...this.entries];

    if (query.role) {
      results = results.filter(e => e.role === query.role);
    }

    if (query.sessionId) {
      results = results.filter(e => e.metadata?.sessionId === query.sessionId);
    }

    if (query.startTime) {
      results = results.filter(e => e.timestamp >= query.startTime!);
    }

    if (query.endTime) {
      results = results.filter(e => e.timestamp <= query.endTime!);
    }

    if (query.searchTerm) {
      const term = query.searchTerm.toLowerCase();
      results = results.filter(e => 
        e.content.toLowerCase().includes(term) ||
        e.metadata?.toolName?.toLowerCase().includes(term)
      );
    }

    if (query.limit) {
      results = results.slice(-query.limit);
    }

    return results;
  }

  /**
   * Search memory by content
   */
  search(searchTerm: string, limit?: number): MemoryEntry[] {
    return this.query({ searchTerm, limit });
  }

  /**
   * Get last N entries
   */
  getLast(n: number): MemoryEntry[] {
    return this.entries.slice(-n);
  }

  /**
   * Get entry by ID
   */
  getById(id: string): MemoryEntry | undefined {
    return this.entries.find(e => e.id === id);
  }

  /**
   * Update an entry
   */
  updateEntry(id: string, updates: Partial<Omit<MemoryEntry, 'id'>>): MemoryEntry | null {
    const index = this.entries.findIndex(e => e.id === id);
    if (index === -1) return null;

    this.entries[index] = {
      ...this.entries[index],
      ...updates,
      metadata: {
        ...this.entries[index].metadata,
        ...updates.metadata,
      },
    };

    this.scheduleSave();
    return this.entries[index];
  }

  /**
   * Delete an entry
   */
  deleteEntry(id: string): boolean {
    const index = this.entries.findIndex(e => e.id === id);
    if (index === -1) return false;

    this.entries.splice(index, 1);
    this.scheduleSave();
    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
    this.saveToStorage();
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const entriesByRole = this.entries.reduce((acc, entry) => {
      acc[entry.role] = (acc[entry.role] || 0) + 1;
      return acc;
    }, {} as Record<MemoryEntryRole, number>);

    const sessionIds = new Set(this.entries.map(e => e.metadata?.sessionId).filter(Boolean));

    // Calculate storage size
    let storageSize = '0 KB';
    if (typeof window !== 'undefined' && this.config.persistToStorage) {
      const data = localStorage.getItem(this.config.storageKey);
      if (data) {
        const bytes = new Blob([data]).size;
        storageSize = bytes > 1024 
          ? `${(bytes / 1024).toFixed(2)} KB` 
          : `${bytes} bytes`;
      }
    }

    return {
      totalEntries: this.entries.length,
      entriesByRole,
      oldestEntry: this.entries[0]?.timestamp || 0,
      newestEntry: this.entries[this.entries.length - 1]?.timestamp || 0,
      sessionCount: sessionIds.size,
      storageSize,
    };
  }

  /**
   * Export memory to JSON
   */
  export(): string {
    return JSON.stringify({
      entries: this.entries,
      currentSessionId: this.currentSessionId,
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * Import memory from JSON
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data.entries)) {
        this.entries = data.entries;
        if (data.currentSessionId) {
          this.currentSessionId = data.currentSessionId;
        }
        this.scheduleSave();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get entries for a specific session
   */
  getSessionEntries(sessionId?: string): MemoryEntry[] {
    const targetSessionId = sessionId || this.currentSessionId;
    return this.entries.filter(e => e.metadata?.sessionId === targetSessionId);
  }

  /**
   * Get all session IDs
   */
  getSessionIds(): string[] {
    const sessionIds = new Set<string>();
    this.entries.forEach(e => {
      if (e.metadata?.sessionId) {
        sessionIds.add(e.metadata.sessionId);
      }
    });
    return Array.from(sessionIds);
  }

  /**
   * Enforce memory limits
   */
  private enforceLimits(): void {
    // Remove old entries by max age
    if (this.config.maxAge > 0) {
      const cutoff = Date.now() - this.config.maxAge;
      this.entries = this.entries.filter(e => e.timestamp >= cutoff);
    }

    // Remove oldest entries if exceeding max
    if (this.entries.length > this.config.maxEntries) {
      const toRemove = this.entries.length - this.config.maxEntries;
      this.entries.splice(0, toRemove);
    }
  }

  /**
   * Schedule a save to localStorage (debounced)
   */
  private scheduleSave(): void {
    if (!this.config.persistToStorage) return;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveToStorage();
    }, 500);
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !this.config.persistToStorage) return;

    try {
      const data = JSON.stringify({
        entries: this.entries,
        currentSessionId: this.currentSessionId,
        savedAt: Date.now(),
      });
      localStorage.setItem(this.config.storageKey, data);
    } catch (error) {
      console.error('Failed to save memory to localStorage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem(this.config.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed.entries)) {
          this.entries = parsed.entries;
          if (parsed.currentSessionId) {
            this.currentSessionId = parsed.currentSessionId;
          }
          this.enforceLimits();
        }
      }
    } catch (error) {
      console.error('Failed to load memory from localStorage:', error);
      this.entries = [];
    }
  }

  /**
   * Destroy the memory manager
   */
  destroy(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveToStorage();
  }
}

// Singleton instance
let memoryManagerInstance: MemoryManager | null = null;

/**
 * Get or create the singleton memory manager instance
 */
export function getMemoryManager(config?: MemoryConfig): MemoryManager {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager(config);
  }
  return memoryManagerInstance;
}

/**
 * Reset the singleton instance
 */
export function resetMemoryManager(): void {
  if (memoryManagerInstance) {
    memoryManagerInstance.destroy();
    memoryManagerInstance = null;
  }
}

export default MemoryManager;
