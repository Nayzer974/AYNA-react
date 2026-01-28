/**
 * Analytics v2 - Batch Processor
 * 
 * Handles batching events and sending them to providers.
 * Implements retry logic with exponential backoff.
 * Integrates with syncService for network detection.
 */

import { AppState, AppStateStatus } from 'react-native';
import { AnalyticsProvider, AnalyticsConfig, DEFAULT_CONFIG, AnalyticsEvent } from './types';
import { EventQueue } from './EventQueue';
import { isOnline } from '@/services/storage/syncService';

interface BackoffState {
  attemptCount: number;
  nextRetryAt: number;
}

const INITIAL_BACKOFF_MS = 1000; // 1 second
const MAX_BACKOFF_MS = 60000; // 1 minute
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Batch Processor
 * Manages sending events to providers with retry logic
 */
export class BatchProcessor {
  private queue: EventQueue;
  private provider: AnalyticsProvider;
  private config: AnalyticsConfig;
  private isProcessing: boolean = false;
  private backoffState: BackoffState = {
    attemptCount: 0,
    nextRetryAt: 0,
  };
  private appStateSubscription: any = null;

  constructor(
    queue: EventQueue,
    provider: AnalyticsProvider,
    config: Partial<AnalyticsConfig> = {}
  ) {
    this.queue = queue;
    this.provider = provider;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize batch processor
   * Sets up app state listener for sync triggers
   */
  async initialize(): Promise<void> {
    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App returned to foreground - trigger sync
        this.processQueue().catch(() => {
          // Ignore errors - already logged
        });
      }
    });

    // Initial sync if online
    if (await isOnline() && this.provider.isReady()) {
      this.processQueue().catch(() => {
        // Ignore errors
      });
    }
  }

  /**
   * Cleanup and unsubscribe from listeners
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Process queue and send events to provider
   * Called automatically on sync triggers or manually via flush()
   * Handles network changes during batch and partial failures
   */
  private currentBatch: AnalyticsEvent[] | null = null;

  async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      if (this.config.debug) {
        console.log('[Analytics] Queue processing already in progress');
      }
      return;
    }

    // Check backoff (but allow manual flush to override)
    const now = Date.now();
    if (this.backoffState.nextRetryAt > now && this.backoffState.attemptCount > 0) {
      const delayMs = this.backoffState.nextRetryAt - now;
      if (this.config.debug) {
        console.log(`[Analytics] Backoff active, retry in ${delayMs}ms`);
      }
      return;
    }

    // Check provider readiness
    if (!this.provider.isReady()) {
      if (this.config.debug) {
        console.log('[Analytics] Provider not ready');
      }
      return;
    }

    // Check network BEFORE getting batch
    let online = await isOnline();
    if (!online) {
      if (this.config.debug) {
        console.log('[Analytics] Offline, skipping sync');
      }
      return;
    }

    this.isProcessing = true;

    try {
      // Get batch from queue
      const events = await this.queue.dequeueBatch();
      
      if (events.length === 0) {
        this.isProcessing = false;
        return;
      }
      
      // Store current batch for error handling
      this.currentBatch = events;

      // Double-check network after getting batch (network may have changed)
      online = await isOnline();
      if (!online) {
        if (this.config.debug) {
          console.log('[Analytics] Network lost after getting batch, marking for retry');
        }
        // Mark as failed so it can be retried
        const eventIds = events.map(e => e.eventId);
        await this.queue.markFailed(eventIds, MAX_RETRY_ATTEMPTS);
        this.isProcessing = false;
        return;
      }

      if (this.config.debug) {
        console.log(`[Analytics] Processing batch of ${events.length} events`);
      }

      // Store event IDs before sending (for rollback if needed)
      const eventIds = events.map(e => e.eventId);

      // Send to provider (may throw on network error or provider error)
      try {
        await this.provider.track(events);
        
        // Double-check network after send (connection may have dropped)
        const stillOnline = await isOnline();
        if (!stillOnline && this.config.debug) {
          console.warn('[Analytics] Network lost during send, but events were sent');
        }
      } catch (providerError: any) {
        // Check if it's a network error
        const isNetworkError = providerError?.message?.includes('network') ||
                               providerError?.code === 'NETWORK_ERROR' ||
                               !(await isOnline());
        
        if (isNetworkError) {
          // Network error - mark for retry
          throw new Error('NETWORK_ERROR');
        }
        
        // Other provider error - may be permanent (RLS, validation, etc.)
        // Log but don't retry indefinitely
        if (this.config.debug) {
          console.error('[Analytics] Provider error (may be permanent):', providerError);
        }
        throw providerError;
      }

      // Mark as sent only after successful send
      await this.queue.markSent(eventIds);

      // Reset backoff on success
      this.backoffState = {
        attemptCount: 0,
        nextRetryAt: 0,
      };

      // Clear current batch on success
      this.currentBatch = null;

      if (this.config.debug) {
        console.log(`[Analytics] Successfully sent ${events.length} events`);
      }

      // Process next batch if available
      // Don't use setTimeout (suspended in background) - use recursive call
      const remainingStats = await this.queue.getStats();
      if (remainingStats.queued > 0 && AppState.currentState === 'active') {
        // Only continue if app is still active
        // Use setImmediate-like pattern (but don't await)
        Promise.resolve().then(() => {
          this.processQueue().catch(() => {
            // Ignore errors
          });
        });
      }
    } catch (error: any) {
      // Determine which events failed from current batch
      const failedEventIds = this.currentBatch?.map(e => e.eventId) || [];
      
      if (failedEventIds.length > 0) {
        // Mark as failed (will increment attempt count)
        await this.queue.markFailed(failedEventIds, MAX_RETRY_ATTEMPTS);
      }

      // Update backoff (exponential)
      this.backoffState.attemptCount += 1;
      const backoffMs = Math.min(
        INITIAL_BACKOFF_MS * Math.pow(2, this.backoffState.attemptCount - 1),
        MAX_BACKOFF_MS
      );
      this.backoffState.nextRetryAt = now + backoffMs;

      if (this.config.debug) {
        const errorMsg = error?.message || 'Unknown error';
        console.error(`[Analytics] Failed to send batch (attempt ${this.backoffState.attemptCount}):`, errorMsg);
        console.log(`[Analytics] Next retry in ${backoffMs}ms`);
      }
      
      // Clear current batch on error
      this.currentBatch = null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Trigger immediate sync
   * Called by flush() or network status change
   */
  async flush(): Promise<void> {
    // Reset backoff for manual flush
    this.backoffState.nextRetryAt = 0;
    await this.processQueue();
  }

  /**
   * Setup network listener integration
   * Should be called with syncService network listener callback
   */
  onNetworkStatusChange(isOnline: boolean): void {
    if (isOnline && this.provider.isReady()) {
      // Network became available - trigger sync
      this.processQueue().catch(() => {
        // Ignore errors
      });
    }
  }
}

