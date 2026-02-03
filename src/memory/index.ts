/**
 * ARES Memory Module
 * 
 * Chain of Thought + Contextual/Persistence Memory Hybrid System
 * 
 * Exports:
 * - MemoryManager: Persistent conversation memory with localStorage
 * - ReActEngine: Multi-step reasoning (Observation → Thought → Action → Result)
 * - HybridOrchestrator: Unified system combining memory + reasoning
 * 
 * Usage:
 * ```typescript
 * import { getHybridOrchestrator } from '@/memory';
 * 
 * const orchestrator = getHybridOrchestrator();
 * 
 * // Execute with memory and reasoning
 * const result = await orchestrator.execute("Create card Fix login bug", claudeService);
 * 
 * // Follow-up with context ("it" refers to the card created above)
 * await orchestrator.execute("Move it to Done", claudeService);
 * ```
 */

export { 
  MemoryManager, 
  getMemoryManager, 
  resetMemoryManager,
  type MemoryEntry,
  type MemoryEntryRole,
  type MemoryConfig,
  type MemoryStats,
  type MemoryQuery,
} from './memoryManager';

export { 
  ReActEngine, 
  getReActEngine, 
  resetReActEngine,
  type ReActStep,
  type ReActStepType,
  type ReActTool,
  type ReActToolResult,
  type ReActConfig,
  type ReActSession,
  type ReActMessage,
  type ReActProgressCallback,
} from './reactEngine';

export { 
  HybridOrchestrator, 
  getHybridOrchestrator, 
  resetHybridOrchestrator,
  type HybridConfig,
  type HybridEvent,
  type HybridEventType,
  type HybridEventCallback,
  type HybridSession,
} from './hybridOrchestrator';
