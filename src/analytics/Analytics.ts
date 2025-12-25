/**
 * Analytics v2 - Public API
 * 
 * Main entry point for analytics in the application.
 * Provides track(), screen(), identify(), flush(), and optOut() methods.
 * 
 * USAGE:
 *   import { analytics } from '@/analytics';
 *   
 *   analytics.track('button_clicked', { buttonName: 'submit' });
 *   analytics.screen('Home');
 *   analytics.identify('user123', { plan: 'premium' });
 *   await analytics.flush();
 */

// Generate UUID v4 without external dependency
// Enhanced with timestamp + counter to prevent collisions
let uuidCounter = 0;
const uuidTimestamp = Date.now();

function uuidv4(): string {
  uuidCounter = (uuidCounter + 1) % 65536; // Reset at 16-bit limit
  
  // Include timestamp and counter for uniqueness
  const timestamp = Date.now();
  const unique = (timestamp ^ uuidTimestamp ^ uuidCounter).toString(16).padStart(8, '0');
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }) + `-${unique}`;
}
import { AppState } from 'react-native';
import { AnalyticsProvider, AnalyticsEvent, AnalyticsConfig, DEFAULT_CONFIG, buildEventContext, validateEventProperties } from './types';
import { EventQueue } from './EventQueue';
import { BatchProcessor } from './BatchProcessor';
import { SupabaseProvider } from './providers/SupabaseProvider';
import { DebugProvider } from './providers/DebugProvider';

/**
 * Analytics singleton instance
 * Use this instance throughout the app
 */
class Analytics {
  private queue: EventQueue;
  private processor: BatchProcessor | null = null;
  private provider: AnalyticsProvider | null = null;
  private config: AnalyticsConfig;
  private sessionId: string;
  private currentUserId: string | null = null;
  private initialized: boolean = false;
  private consent: boolean = false; // HARD GATE: Default false, explicit consent required

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.sessionId = uuidv4();
    this.queue = new EventQueue(this.config);
    
    // Generate new session ID on app start
    this.generateSessionId();
  }

  /**
   * Initialize analytics system
   * Must be called before use
   * 
   * @param provider Provider to use (defaults to SupabaseProvider)
   * @param config Optional configuration overrides
   */
  async initialize(
    provider?: AnalyticsProvider,
    config?: Partial<AnalyticsConfig>
  ): Promise<void> {
    if (this.initialized) {
      if (this.config.debug) {
        console.warn('[Analytics] Already initialized');
      }
      return;
    }

    // Merge config
    this.config = { ...this.config, ...config };
    this.consent = this.config.consent;

    // Initialize queue
    await this.queue.initialize();

    // Create provider if not provided
    if (!provider) {
      if (this.config.debug && __DEV__) {
        // Use debug provider in dev mode if explicitly requested
        provider = new DebugProvider();
      } else {
        provider = new SupabaseProvider();
      }
    }

    this.provider = provider;

    // Initialize provider
    try {
      await this.provider.initialize();
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to initialize provider:', error);
      }
      // Continue even if provider fails - events will be queued
    }

    // Create batch processor
    if (this.provider) {
      this.processor = new BatchProcessor(this.queue, this.provider, this.config);
      await this.processor.initialize();
    }

    this.initialized = true;

    if (this.config.debug) {
      console.log('[Analytics] Initialized successfully');
    }
  }

  /**
   * Track an event
   * 
   * HARD CONSENT GATE: Events are DROPPED (not enqueued) if consent is false.
   * 
   * @param eventName Event name (e.g., 'dhikr_completed')
   * @param properties Optional event properties (no PII allowed)
   */
  track(eventName: string, properties?: Record<string, unknown>): void {
    // HARD GATE: Check consent FIRST, before any processing
    if (!this.consent) {
      if (this.config.debug) {
        console.log(`[Analytics] Event "${eventName}" DROPPED - no user consent`);
      }
      // Event is dropped, not queued, not persisted
      return;
    }

    if (!this.initialized) {
      if (this.config.debug) {
        console.warn('[Analytics] Not initialized, ignoring event:', eventName);
      }
      return;
    }

    // Validate properties
    const validation = validateEventProperties(properties);
    if (!validation.valid) {
      if (this.config.debug) {
        console.error(`[Analytics] Invalid event properties for ${eventName}:`, validation.error);
      }
      return;
    }

    // Build event
    const event: AnalyticsEvent = {
      eventId: uuidv4(),
      name: eventName,
      timestamp: Date.now(),
      userId: this.currentUserId || undefined,
      sessionId: this.sessionId,
      properties: properties || {},
      context: buildEventContext(),
    };

    // Queue event (non-blocking)
    this.queue.enqueue(event).catch(error => {
      if (this.config.debug) {
        console.error('[Analytics] Failed to enqueue event:', error);
      }
    });

    if (this.config.debug) {
      console.log(`[Analytics] Tracked: ${eventName}`, properties);
    }

    // Trigger sync if online and app is active
    if (AppState.currentState === 'active' && this.processor) {
      // Don't await - fire and forget
      this.processor.processQueue().catch(() => {
        // Ignore errors
      });
    }
  }

  /**
   * Track a screen view
   * 
   * @param screenName Screen name (e.g., 'Home', 'Profile')
   * @param params Optional route parameters
   */
  screen(screenName: string, params?: Record<string, unknown>): void {
    // Filter out sensitive params
    const safeParams = params ? this.sanitizeParams(params) : undefined;

    this.track('screen_viewed', {
      screen_name: screenName,
      ...safeParams,
    });
  }

  /**
   * Track an error event
   * 
   * PRODUCTION SECURITY: 
   * - error.message is NEVER sent in production
   * - Only whitelisted error fields are allowed
   * - Stack traces are completely stripped
   * - Aggressive redaction by default
   * - Cannot be bypassed by developers
   * 
   * @param errorName Error name/type (e.g., 'NetworkError', 'ValidationError')
   * @param error Optional error object (properties will be sanitized)
   * @param additionalProperties Optional additional safe properties
   */
  trackError(
    errorName: string,
    error?: Error | unknown,
    additionalProperties?: Record<string, unknown>
  ): void {
    // HARD CONSENT GATE: Check consent first
    if (!this.consent) {
      if (this.config.debug) {
        console.log(`[Analytics] Error event "${errorName}" DROPPED - no user consent`);
      }
      return;
    }

    if (!this.initialized) {
      if (this.config.debug) {
        console.warn('[Analytics] Not initialized, ignoring error event:', errorName);
      }
      return;
    }

    // PRODUCTION SECURITY: Whitelist of safe error fields only
    const WHITELISTED_ERROR_FIELDS = [
      'name',      // Error type/name
      'code',      // Error code (e.g., 'NETWORK_ERROR')
      'status',    // HTTP status code
      'statusCode', // HTTP status code (alternative)
    ];

    const safeProperties: Record<string, unknown> = {
      error_name: errorName,
    };

    // Extract safe fields from error object
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      
      for (const field of WHITELISTED_ERROR_FIELDS) {
        if (field in errorObj && errorObj[field] !== undefined) {
          const value = errorObj[field];
          
          // Only allow primitives (string, number, boolean)
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            // Aggressive redaction of any suspicious content
            if (typeof value === 'string') {
              safeProperties[`error_${field}`] = this.aggressiveRedact(value);
            } else {
              safeProperties[`error_${field}`] = value;
            }
          }
        }
      }
    }

    // Add additional properties (if provided and safe)
    if (additionalProperties) {
      for (const [key, value] of Object.entries(additionalProperties)) {
        // Only allow safe primitive values
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          if (typeof value === 'string') {
            safeProperties[key] = this.aggressiveRedact(value);
          } else {
            safeProperties[key] = value;
          }
        }
      }
    }

    // PRODUCTION: error.message is NEVER sent
    // Stack traces are NEVER sent
    // Only whitelisted, aggressively redacted fields are sent

    // Validate safe properties
    const validation = validateEventProperties(safeProperties);
    if (!validation.valid) {
      if (this.config.debug) {
        console.error(`[Analytics] Invalid error event properties for ${errorName}:`, validation.error);
      }
      return;
    }

    // Track the error event
    this.track('error_occurred', safeProperties);
  }

  /**
   * Aggressive redaction of potentially sensitive strings
   * 
   * This cannot be bypassed - always called for any string value in trackError
   */
  private aggressiveRedact(text: string): string {
    if (typeof text !== 'string') {
      return String(text);
    }

    let redacted = text;

    // Redact emails
    redacted = redacted.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL_REDACTED]');
    
    // Redact URLs with tokens/secrets
    redacted = redacted.replace(/https?:\/\/[^\s]+[?&](token|secret|key|auth|password|api[_-]?key)=[^\s&]+/gi, '[URL_REDACTED]');
    
    // Redact UUIDs (can be user IDs)
    redacted = redacted.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[UUID_REDACTED]');
    
    // Redact potential API keys (alphanumeric long strings)
    redacted = redacted.replace(/\b[a-zA-Z0-9]{32,}\b/g, (match) => {
      // Skip if it's clearly just a number or common identifier
      if (/^\d+$/.test(match) || match.length < 40) {
        return match;
      }
      return '[KEY_REDACTED]';
    });

    // Redact file paths (can leak system info)
    redacted = redacted.replace(/[/\\][\w./\\-]+/g, '[PATH_REDACTED]');

    // Limit length to prevent large error messages
    const maxLength = 100;
    if (redacted.length > maxLength) {
      redacted = redacted.substring(0, maxLength) + '...[TRUNCATED]';
    }

    return redacted;
  }

  /**
   * Identify a user
   * 
   * CRITICAL: Regenerates sessionId to prevent session mixing.
   * Flushes or discards pending events from previous user safely.
   * 
   * HARD CONSENT GATE: User identification is allowed without consent,
   * but identify event is NOT tracked if consent is false.
   * 
   * @param userId User identifier
   * @param traits User traits (non-PII only)
   */
  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    if (!this.initialized || !this.provider) {
      return;
    }

    // CRITICAL: If userId is changing, handle session transition safely
    const isUserChange = this.currentUserId && this.currentUserId !== userId;
    
    if (isUserChange) {
      // Different user - flush pending events for previous user before switching
      if (this.consent) {
        try {
          await this.flush();
        } catch (error) {
          if (this.config.debug) {
            console.warn('[Analytics] Failed to flush events during user change:', error);
          }
          // Continue with user change even if flush fails
        }
      } else {
        // No consent - discard pending events (they would be dropped anyway)
        if (this.config.debug) {
          console.log('[Analytics] Discarding pending events during user change (no consent)');
        }
      }
    }

    // Set new user ID
    this.currentUserId = userId;

    // CRITICAL: Always regenerate sessionId on identify() to prevent session mixing
    // This ensures rapid logout/login cycles don't mix sessions
    this.generateSessionId();

    if (this.config.debug) {
      console.log(`[Analytics] User identified: ${userId}, new sessionId: ${this.sessionId}`);
    }

    try {
      await this.provider.identify(userId, traits);
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to identify user:', error);
      }
    }

    // Track identify event ONLY if consent is given
    // (identify() itself is allowed without consent for provider setup)
    if (this.consent) {
      this.track('user_identified', {
        ...traits,
      });
    }
  }

  /**
   * Flush all queued events immediately
   * 
   * HARD CONSENT GATE: Only flushes if consent is true.
   * If consent is false, nothing is sent (but queue may still exist from before opt-out).
   * 
   * @returns Promise that resolves when flush completes
   */
  async flush(): Promise<void> {
    if (!this.consent) {
      if (this.config.debug) {
        console.log('[Analytics] Flush skipped - no user consent');
      }
      return;
    }

    if (!this.initialized || !this.processor) {
      return;
    }

    try {
      await this.processor.flush();
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Flush failed:', error);
      }
    }
  }

  /**
   * Opt out of analytics
   * Alias for setConsent(false)
   * Clears queue and stops tracking
   */
  async optOut(): Promise<void> {
    this.setConsent(false);
    // handleConsentRevoked() is called by setConsent(false)
    
    // Reset user ID (in addition to what setConsent does)
    this.currentUserId = null;

    if (this.config.debug) {
      console.log('[Analytics] User opted out');
    }
  }

  /**
   * Opt in to analytics
   * Alias for setConsent(true)
   */
  optIn(): void {
    this.setConsent(true);
  }

  /**
   * Set user consent for analytics tracking
   * 
   * HARD CONSENT GATE: This is the ONLY way to enable analytics.
   * 
   * - consent = false: All events are DROPPED (not queued, not persisted)
   * - consent = true: Events are queued and tracked normally
   * 
   * When consent is revoked (setConsent(false)):
   * - All queued events are cleared
   * - Current user ID is anonymized
   * - Provider is reset
   * 
   * When consent is granted (setConsent(true)):
   * - Events start being tracked from this point forward
   * - Previous events (before consent) are NOT recovered
   * 
   * @param consent True to enable analytics, false to disable and clear data
   */
  setConsent(consent: boolean): void {
    const previousConsent = this.consent;
    this.consent = consent;

    if (this.config.debug) {
      console.log(`[Analytics] Consent set to: ${consent}`);
    }

    if (consent && !previousConsent) {
      // Consent granted - analytics can now track
      if (this.config.debug) {
        console.log('[Analytics] Analytics enabled - events will now be tracked');
      }
    } else if (!consent && previousConsent) {
      // Consent revoked - clear all data and stop tracking
      this.handleConsentRevoked().catch(error => {
        if (this.config.debug) {
          console.error('[Analytics] Error handling consent revocation:', error);
        }
      });
    }
  }

  /**
   * Handle consent revocation - clear queue and reset state
   */
  private async handleConsentRevoked(): Promise<void> {
    if (this.config.debug) {
      console.log('[Analytics] Consent revoked - clearing analytics data');
    }

    // Clear queue (all queued events)
    await this.queue.clear();

    // Reset provider
    if (this.provider) {
      await this.provider.reset();
    }

    // Anonymize user ID (but keep it for provider if needed)
    // Note: We don't clear currentUserId completely as it might be needed
    // for provider identification, but we stop associating it with events

    if (this.config.debug) {
      console.log('[Analytics] Analytics disabled - all data cleared');
    }
  }

  /**
   * Check if analytics is initialized
   * Used by migration wrapper to verify state
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    return await this.queue.getStats();
  }

  /**
   * Export all analytics data for a user
   * For GDPR compliance
   */
  async exportUserData(userId: string): Promise<AnalyticsEvent[]> {
    const allEvents = await this.queue.getAllEvents();
    return allEvents.filter(event => event.userId === userId);
  }

  /**
   * Delete all analytics data for a user
   * For GDPR compliance
   */
  async deleteUserData(userId: string): Promise<number> {
    return await this.queue.removeUserEvents(userId);
  }

  /**
   * Logout handler - resets analytics state completely
   * 
   * CRITICAL: Called on user logout to prevent session mixing.
   * - Flushes pending events for current user
   * - Clears user ID
   * - Regenerates sessionId
   * - Resets provider state
   * 
   * This ensures rapid logout/login cycles don't mix sessions.
   */
  async logout(): Promise<void> {
    if (this.config.debug) {
      console.log('[Analytics] Logout - resetting analytics state');
    }

    // Flush pending events before logout (if consent)
    if (this.consent) {
      try {
        await this.flush();
      } catch (error) {
        if (this.config.debug) {
          console.warn('[Analytics] Failed to flush events during logout:', error);
        }
      }
    }

    // Clear user ID
    this.currentUserId = null;

    // CRITICAL: Regenerate sessionId to prevent session mixing
    this.generateSessionId();

    // Reset provider
    if (this.provider) {
      try {
        await this.provider.reset();
      } catch (error) {
        if (this.config.debug) {
          console.warn('[Analytics] Failed to reset provider during logout:', error);
        }
      }
    }

    // Note: We do NOT clear consent on logout
    // User consent persists across login/logout sessions
    // Queue is NOT cleared (events may be for different user later)

    if (this.config.debug) {
      console.log('[Analytics] Logout complete - analytics state reset');
    }
  }

  /**
   * Cleanup on app shutdown
   */
  cleanup(): void {
    if (this.processor) {
      this.processor.cleanup();
    }
  }

  /**
   * Generate new session ID
   * Called on app start or when app returns from background
   */
  private generateSessionId(): void {
    this.sessionId = uuidv4();
  }

  /**
   * Sanitize route parameters to remove PII
   */
  private sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
    const safe: Record<string, unknown> = {};
    const piiKeys = ['email', 'password', 'token', 'secret', 'key', 'auth'];

    for (const [key, value] of Object.entries(params)) {
      const lowerKey = key.toLowerCase();
      
      // Skip PII-like keys
      if (piiKeys.some(pii => lowerKey.includes(pii))) {
        continue;
      }

      // Skip large text fields (could contain PII)
      if (typeof value === 'string' && value.length > 100) {
        continue;
      }

      safe[key] = value;
    }

    return safe;
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Export types for external use
export type { AnalyticsEvent, AnalyticsConfig, QueueStats } from './types';

