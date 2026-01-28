/**
 * Analytics v2 - Event Queue
 * 
 * Manages the persistent FIFO queue of analytics events in AsyncStorage.
 * Handles automatic rotation, TTL, and size limits.
 * 
 * CRITICAL: Thread-safe operations with locking to prevent race conditions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsEvent, QueuedEvent, AnalyticsConfig, DEFAULT_CONFIG } from './types';

const QUEUE_STORAGE_KEY = '@ayna_analytics_v2_queue';
const QUEUE_BACKUP_KEY = '@ayna_analytics_v2_queue_backup';
const STATS_STORAGE_KEY = '@ayna_analytics_v2_stats';
const LOCK_KEY = '@ayna_analytics_v2_lock';

// Maximum serialized size before we start aggressive cleanup (5MB)
const MAX_SERIALIZED_SIZE = 5 * 1024 * 1024;

/**
 * Calculate byte length of UTF-8 string (React Native compatible)
 * Replaces Node.js Buffer.byteLength which doesn't exist in React Native
 */
function getByteLength(str: string): number {
  // Use TextEncoder if available (modern browsers and some RN environments)
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  
  // Fallback: calculate UTF-8 byte length manually
  let byteLength = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) {
      byteLength += 1;
    } else if (code <= 0x7ff) {
      byteLength += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // Surrogate pair (4 bytes)
      byteLength += 4;
      i++; // Skip next char (low surrogate)
    } else {
      byteLength += 3;
    }
  }
  return byteLength;
}

interface QueueStats {
  queued: number;
  failedSyncs: number;
  lastSyncTime: number | null;
  lastFailedSyncTime: number | null;
}

/**
 * Event Queue Manager
 * Thread-safe operations for persisting and retrieving events
 */
export class EventQueue {
  private config: AnalyticsConfig;
  private stats: QueueStats = {
    queued: 0,
    failedSyncs: 0,
    lastSyncTime: null,
    lastFailedSyncTime: null,
  };
  
  // Lock for preventing concurrent operations
  private lockPromise: Promise<void> | null = null;
  private lockResolve: (() => void) | null = null;
  
  // Track batches currently being processed (prevent duplicates)
  private processingBatches: Set<string> = new Set();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Acquire lock for queue operations
   * Prevents race conditions with concurrent reads/writes
   */
  private async acquireLock(): Promise<() => void> {
    // Wait for existing lock to release
    while (this.lockPromise) {
      await this.lockPromise;
    }
    
    // Create new lock
    let resolveLock: () => void;
    this.lockPromise = new Promise(resolve => {
      resolveLock = resolve;
      this.lockResolve = resolve;
    });
    
    return () => {
      this.lockPromise = null;
      this.lockResolve = null;
      resolveLock();
    };
  }

  /**
   * Initialize queue from storage
   * Loads existing events and applies TTL/size limits
   * Handles corrupted data recovery
   */
  async initialize(): Promise<void> {
    try {
      await this.loadStats();
      
      // Attempt to load and repair queue
      const repaired = await this.repairQueueIfNeeded();
      if (repaired) {
        if (this.config.debug) {
          console.log('[Analytics] Queue repaired after corruption detection');
        }
      }
      
      await this.cleanup();
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to initialize queue:', error);
      }
      // Continue with empty queue on error - better than crashing
      await this.resetQueue();
    }
  }
  
  /**
   * Reset queue to empty state (fallback)
   */
  private async resetQueue(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([QUEUE_STORAGE_KEY, QUEUE_BACKUP_KEY]);
      this.stats.queued = 0;
      await this.saveStats();
    } catch (error) {
      // Last resort - ignore
    }
  }

  /**
   * Add event to queue
   * Immediately persists to AsyncStorage
   * Handles storage quota errors gracefully
   */
  async enqueue(event: AnalyticsEvent): Promise<void> {
    const releaseLock = await this.acquireLock();
    
    try {
      const queue = await this.loadQueue();
      
      // Aggressive cleanup if queue is getting large
      if (queue.length >= this.config.maxQueueSize * 0.9) {
        await this.aggressiveCleanup(queue);
      }
      
      // Apply size limit (remove oldest if needed)
      if (queue.length >= this.config.maxQueueSize) {
        // Remove multiple old events to make room (remove 10% oldest)
        const removeCount = Math.floor(this.config.maxQueueSize * 0.1);
        queue.splice(0, removeCount);
      }
      
      // Add new event
      const queuedEvent: QueuedEvent = {
        event,
        queuedAt: Date.now(),
        attemptCount: 0,
      };
      
      queue.push(queuedEvent);
      
      // Try to save, with quota error handling
      try {
        await this.saveQueue(queue);
        this.stats.queued = queue.length;
        await this.saveStats();
      } catch (saveError: any) {
        // Check if it's a quota error
        if (saveError?.message?.includes('quota') || 
            saveError?.message?.includes('QuotaExceeded') ||
            saveError?.code === 'QUOTA_EXCEEDED_ERROR') {
          
          if (this.config.debug) {
            console.warn('[Analytics] Storage quota exceeded, performing aggressive cleanup');
          }
          
          // Aggressive cleanup and retry
          await this.aggressiveCleanup(queue);
          
          // Retry save
          try {
            await this.saveQueue(queue);
            this.stats.queued = queue.length;
            await this.saveStats();
          } catch (retryError) {
            // Still failing - remove new event and log
            queue.pop();
            if (this.config.debug) {
              console.error('[Analytics] Failed to save after cleanup, event dropped:', event.name);
            }
            return; // Event lost but app continues
          }
        } else {
          throw saveError; // Re-throw non-quota errors
        }
      }
      
      if (this.config.debug) {
        console.log(`[Analytics] Event queued: ${event.name} (${queue.length} total)`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to enqueue event:', error);
      }
      // Don't throw - analytics failures should not crash the app
    } finally {
      releaseLock();
    }
  }

  /**
   * Get batch of events for sending
   * Returns up to batchSize events, oldest first
   * Prevents duplicate batches with lock tracking
   */
  async dequeueBatch(): Promise<AnalyticsEvent[]> {
    const releaseLock = await this.acquireLock();
    
    try {
      const queue = await this.loadQueue();
      
      // Filter out expired events
      const now = Date.now();
      const validQueue = queue.filter(
        item => (now - item.queuedAt) < this.config.maxEventAge
      );
      
      if (validQueue.length !== queue.length) {
        await this.saveQueue(validQueue);
      }
      
      if (validQueue.length === 0) {
        return [];
      }
      
      // Get batch (oldest first)
      const batch = validQueue
        .slice(0, this.config.batchSize)
        .map(item => item.event);
      
      // Create batch ID from event IDs to prevent duplicates
      const batchId = batch.map(e => e.eventId).sort().join(',');
      
      // Check if this batch is already being processed
      if (this.processingBatches.has(batchId)) {
        if (this.config.debug) {
          console.warn('[Analytics] Batch already being processed, skipping duplicate');
        }
        return [];
      }
      
      // Mark batch as processing
      this.processingBatches.add(batchId);
      
      // Auto-remove from processing set after 5 minutes (safety net)
      setTimeout(() => {
        this.processingBatches.delete(batchId);
      }, 5 * 60 * 1000);
      
      return batch;
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to dequeue batch:', error);
      }
      return [];
    } finally {
      releaseLock();
    }
  }

  /**
   * Mark events as successfully sent and remove from queue
   * Removes events by eventId
   * Also removes batch from processing set
   */
  async markSent(eventIds: string[]): Promise<void> {
    const releaseLock = await this.acquireLock();
    
    try {
      // Remove batch from processing set
      const batchId = [...eventIds].sort().join(',');
      this.processingBatches.delete(batchId);
      
      const queue = await this.loadQueue();
      const idSet = new Set(eventIds);
      
      const filtered = queue.filter(item => !idSet.has(item.event.eventId));
      
      if (filtered.length !== queue.length) {
        await this.saveQueue(filtered);
        this.stats.queued = filtered.length;
        this.stats.lastSyncTime = Date.now();
        await this.saveStats();
        
        if (this.config.debug) {
          console.log(`[Analytics] Marked ${eventIds.length} events as sent`);
        }
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to mark events as sent:', error);
      }
    } finally {
      releaseLock();
    }
  }

  /**
   * Mark batch as failed, increment attempt count
   * Events with too many attempts are removed to prevent infinite queue
   * Also removes batch from processing set to allow retry
   */
  async markFailed(eventIds: string[], maxAttempts: number = 5): Promise<void> {
    const releaseLock = await this.acquireLock();
    
    try {
      // Remove batch from processing set to allow retry
      const batchId = [...eventIds].sort().join(',');
      this.processingBatches.delete(batchId);
      
      const queue = await this.loadQueue();
      const idSet = new Set(eventIds);
      
      let updated = false;
      let removedCount = 0;
      const now = Date.now();
      
      const updatedQueue = queue.map(item => {
        if (idSet.has(item.event.eventId)) {
          updated = true;
          const newAttemptCount = (item.attemptCount || 0) + 1;
          
          // Remove if too many attempts
          if (newAttemptCount >= maxAttempts) {
            removedCount++;
            return null;
          }
          
          return {
            ...item,
            attemptCount: newAttemptCount,
            lastAttemptAt: now,
          };
        }
        return item;
      }).filter((item): item is QueuedEvent => item !== null);
      
      if (updated) {
        try {
          await this.saveQueue(updatedQueue);
          this.stats.queued = updatedQueue.length;
          this.stats.failedSyncs += 1;
          this.stats.lastFailedSyncTime = now;
          await this.saveStats();
          
          if (this.config.debug) {
            console.warn(`[Analytics] Marked ${eventIds.length} events as failed (${removedCount} removed after max attempts)`);
          }
        } catch (saveError) {
          // If save fails, at least update in-memory state
          if (this.config.debug) {
            console.error('[Analytics] Failed to save failed batch state:', saveError);
          }
        }
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to mark events as failed:', error);
      }
    } finally {
      releaseLock();
    }
  }

  /**
   * Get current queue statistics
   */
  async getStats(): Promise<QueueStats> {
    await this.loadStats();
    return { ...this.stats };
  }

  /**
   * Clear all events from queue
   * Used for opt-out or reset
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
      this.stats.queued = 0;
      await this.saveStats();
      
      if (this.config.debug) {
        console.log('[Analytics] Queue cleared');
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to clear queue:', error);
      }
    }
  }

  /**
   * Get all events for export/debugging
   */
  async getAllEvents(): Promise<AnalyticsEvent[]> {
    try {
      const queue = await this.loadQueue();
      return queue.map(item => item.event);
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to get all events:', error);
      }
      return [];
    }
  }

  /**
   * Remove events for a specific user
   * Used for GDPR data deletion
   */
  async removeUserEvents(userId: string): Promise<number> {
    try {
      const queue = await this.loadQueue();
      const initialLength = queue.length;
      
      const filtered = queue.filter(item => item.event.userId !== userId);
      const removed = initialLength - filtered.length;
      
      if (removed > 0) {
        await this.saveQueue(filtered);
        this.stats.queued = filtered.length;
        await this.saveStats();
        
        if (this.config.debug) {
          console.log(`[Analytics] Removed ${removed} events for user ${userId}`);
        }
      }
      
      return removed;
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to remove user events:', error);
      }
      return 0;
    }
  }

  /**
   * Clean up expired events and enforce size limits
   */
  private async cleanup(): Promise<void> {
    try {
      const queue = await this.loadQueue();
      const now = Date.now();
      
      // Remove expired events
      const validQueue = queue.filter(
        item => (now - item.queuedAt) < this.config.maxEventAge
      );
      
      // Enforce size limit
      if (validQueue.length > this.config.maxQueueSize) {
        validQueue.splice(0, validQueue.length - this.config.maxQueueSize);
      }
      
      if (validQueue.length !== queue.length) {
        await this.saveQueue(validQueue);
        this.stats.queued = validQueue.length;
        await this.saveStats();
        
        if (this.config.debug) {
          const removed = queue.length - validQueue.length;
          console.log(`[Analytics] Cleaned up ${removed} expired/old events`);
        }
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to cleanup queue:', error);
      }
    }
  }

  /**
   * Load queue from AsyncStorage
   * Attempts to repair corrupted data using backup
   */
  private async loadQueue(): Promise<QueuedEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!raw) return [];
      
      try {
        const parsed = JSON.parse(raw);
        // Validate structure
        if (Array.isArray(parsed)) {
          // Validate each item has required fields
          const validItems = parsed.filter((item: any) => 
            item && 
            item.event && 
            item.event.eventId && 
            item.event.name &&
            typeof item.queuedAt === 'number'
          );
          
          if (validItems.length !== parsed.length && this.config.debug) {
            console.warn(`[Analytics] Filtered out ${parsed.length - validItems.length} invalid queue items`);
          }
          
          return validItems;
        }
        
        if (this.config.debug) {
          console.warn('[Analytics] Queue data is not an array, attempting backup recovery');
        }
        throw new Error('Invalid queue structure');
      } catch (parseError) {
        // Try backup
        return await this.loadQueueFromBackup();
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to load queue:', error);
      }
      // Try backup before giving up
      return await this.loadQueueFromBackup();
    }
  }
  
  /**
   * Load queue from backup
   */
  private async loadQueueFromBackup(): Promise<QueuedEvent[]> {
    try {
      const backupRaw = await AsyncStorage.getItem(QUEUE_BACKUP_KEY);
      if (backupRaw) {
        const parsed = JSON.parse(backupRaw);
        if (Array.isArray(parsed)) {
          if (this.config.debug) {
            console.log('[Analytics] Loaded queue from backup');
          }
          // Restore backup to main
          await AsyncStorage.setItem(QUEUE_STORAGE_KEY, backupRaw);
          return parsed.filter((item: any) => 
            item && item.event && item.event.eventId
          );
        }
      }
    } catch (error) {
      // Backup also corrupted - start fresh
      if (this.config.debug) {
        console.error('[Analytics] Backup also corrupted, starting with empty queue');
      }
    }
    return [];
  }
  
  /**
   * Repair queue if corrupted
   */
  private async repairQueueIfNeeded(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!raw) return false;
      
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Queue is valid, no repair needed
          return false;
        }
      } catch (error) {
        // Queue is corrupted, attempt repair
      }
      
      // Try to repair from backup
      const repaired = await this.loadQueueFromBackup();
      if (repaired.length > 0) {
        await this.saveQueue(repaired);
        return true;
      }
      
      // No valid backup, reset queue
      await this.resetQueue();
      return true;
    } catch (error) {
      // Unable to repair, reset
      await this.resetQueue();
      return true;
    }
  }

  /**
   * Save queue to AsyncStorage
   * Creates backup before overwriting (atomic-like operation)
   */
  private async saveQueue(queue: QueuedEvent[]): Promise<void> {
    try {
      // Validate queue size before serialization
      if (queue.length > this.config.maxQueueSize * 1.1) {
        // Queue somehow exceeded limit, enforce it
        queue = queue.slice(-this.config.maxQueueSize);
        if (this.config.debug) {
          console.warn('[Analytics] Queue exceeded max size, truncating');
        }
      }
      
      // Serialize and check size
      const serialized = JSON.stringify(queue);
      const size = getByteLength(serialized);
      
      if (size > MAX_SERIALIZED_SIZE) {
        // Too large, perform aggressive cleanup
        if (this.config.debug) {
          console.warn(`[Analytics] Queue serialized size ${size} exceeds limit, cleaning up`);
        }
        await this.aggressiveCleanup(queue);
        // Re-serialize after cleanup
        const cleanedQueue = await this.loadQueue(); // Reload cleaned queue
        const cleanedSerialized = JSON.stringify(cleanedQueue);
        
        if (getByteLength(cleanedSerialized) > MAX_SERIALIZED_SIZE) {
          throw new Error('Queue too large even after cleanup');
        }
        
        // Save cleaned queue
        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, cleanedSerialized);
        // Update backup
        await AsyncStorage.setItem(QUEUE_BACKUP_KEY, cleanedSerialized);
        return;
      }
      
      // Create backup first (atomic-like)
      const current = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (current) {
        await AsyncStorage.setItem(QUEUE_BACKUP_KEY, current);
      }
      
      // Save main queue
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, serialized);
    } catch (error: any) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to save queue:', error);
      }
      
      // If it's a quota error, try aggressive cleanup
      if (error?.message?.includes('quota') || error?.code === 'QUOTA_EXCEEDED_ERROR') {
        throw error; // Let caller handle with aggressive cleanup
      }
      
      throw error;
    }
  }
  
  /**
   * Aggressive cleanup to reduce queue size
   * Removes expired events and old events beyond limit
   */
  private async aggressiveCleanup(queue: QueuedEvent[]): Promise<void> {
    const now = Date.now();
    
    // Remove expired events (strict)
    const validQueue = queue.filter(
      item => (now - item.queuedAt) < this.config.maxEventAge
    );
    
    // If still too large, keep only most recent 70% of max
    if (validQueue.length > this.config.maxQueueSize * 0.7) {
      const keepCount = Math.floor(this.config.maxQueueSize * 0.7);
      const removed = validQueue.splice(0, validQueue.length - keepCount);
      
      if (this.config.debug) {
        console.warn(`[Analytics] Aggressive cleanup: removed ${removed.length} events`);
      }
    }
    
    // Save cleaned queue
    try {
      const serialized = JSON.stringify(validQueue);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, serialized);
      await AsyncStorage.setItem(QUEUE_BACKUP_KEY, serialized);
    } catch (error) {
      // If still failing, remove more aggressively
      const emergencyQueue = validQueue.slice(-Math.floor(this.config.maxQueueSize * 0.5));
      const emergencySerialized = JSON.stringify(emergencyQueue);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, emergencySerialized);
      await AsyncStorage.setItem(QUEUE_BACKUP_KEY, emergencySerialized);
    }
  }

  /**
   * Load statistics from AsyncStorage
   */
  private async loadStats(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STATS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.stats = { ...this.stats, ...parsed };
      }
    } catch (error) {
      // Ignore - use default stats
    }
  }

  /**
   * Save statistics to AsyncStorage
   */
  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(this.stats));
    } catch (error) {
      // Ignore - stats are non-critical
    }
  }
}

