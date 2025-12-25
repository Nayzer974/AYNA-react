/**
 * Analytics v2 - Types and Interfaces
 * 
 * Defines the canonical event model and provider contracts.
 * All providers must conform to these types without mutation.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Canonical analytics event structure
 * This is the immutable event model that flows through the system.
 */
export interface AnalyticsEvent {
  /** Unique event identifier (UUID v4) */
  eventId: string;
  
  /** Event name (e.g., 'dhikr_completed', 'screen_viewed') */
  name: string;
  
  /** Timestamp in UTC milliseconds */
  timestamp: number;
  
  /** User ID (may be hashed/anonymized by provider) */
  userId?: string;
  
  /** Session ID for grouping events */
  sessionId?: string;
  
  /** Event-specific properties (validated, size-limited) */
  properties?: Record<string, unknown>;
  
  /** Contextual information (app version, OS, etc.) */
  context: EventContext;
}

/**
 * Contextual information attached to every event
 * Captured automatically, not user-provided
 */
export interface EventContext {
  /** App version from package.json */
  appVersion: string;
  
  /** Platform: 'ios' | 'android' | 'web' */
  platform: string;
  
  /** OS version (e.g., '15.0') */
  osVersion: string;
  
  /** Device model (e.g., 'iPhone 13') */
  deviceModel: string;
  
  /** Locale (e.g., 'fr-FR') */
  locale: string;
  
  /** Timezone (e.g., 'Europe/Paris') */
  timezone: string;
  
  /** Screen width */
  screenWidth: number;
  
  /** Screen height */
  screenHeight: number;
}

/**
 * Provider contract
 * All analytics providers must implement this interface
 */
export interface AnalyticsProvider {
  /**
   * Initialize the provider
   * Called once when Analytics is initialized
   */
  initialize(): Promise<void>;
  
  /**
   * Send a batch of events to the provider
   * Provider must NOT mutate events
   * 
   * @param events Array of events to send
   * @returns Promise that resolves when events are sent
   */
  track(events: AnalyticsEvent[]): Promise<void>;
  
  /**
   * Identify a user
   * Called when user logs in or updates profile
   * 
   * @param userId User identifier
   * @param traits User traits (non-PII only)
   */
  identify(userId: string, traits?: Record<string, unknown>): Promise<void>;
  
  /**
   * Clear/reset provider state
   * Called on logout or opt-out
   */
  reset(): Promise<void>;
  
  /**
   * Check if provider is ready to accept events
   */
  isReady(): boolean;
}

/**
 * Queue statistics for observability
 */
export interface QueueStats {
  /** Number of events currently queued */
  queued: number;
  
  /** Number of failed sync attempts */
  failedSyncs: number;
  
  /** Timestamp of last successful sync */
  lastSyncTime: number | null;
  
  /** Timestamp of last failed sync */
  lastFailedSyncTime: number | null;
}

/**
 * Configuration for the analytics system
 */
export interface AnalyticsConfig {
  /** Maximum number of events in queue */
  maxQueueSize: number;
  
  /** Maximum age of events in milliseconds (7 days) */
  maxEventAge: number;
  
  /** Batch size for sending events */
  batchSize: number;
  
  /** Debounce delay for screen tracking (ms) */
  screenDebounceMs: number;
  
  /** Enable debug logging in development */
  debug: boolean;
  
  /** User consent status */
  consent: boolean;
}

/**
 * Stored event in AsyncStorage
 * Includes metadata for queue management
 */
export interface QueuedEvent {
  /** The analytics event */
  event: AnalyticsEvent;
  
  /** Timestamp when event was queued */
  queuedAt: number;
  
  /** Number of send attempts */
  attemptCount: number;
  
  /** Last attempt timestamp */
  lastAttemptAt?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: AnalyticsConfig = {
  maxQueueSize: 1000,
  maxEventAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  batchSize: 50,
  screenDebounceMs: 500,
  debug: __DEV__,
  consent: false, // GDPR: Opt-in by default (require explicit consent)
};

/**
 * Build event context from device/app info
 * Handles all possible undefined/null cases safely
 */
export function buildEventContext(): EventContext {
  let appVersion = '1.0.0';
  let osVersion = 'unknown';
  let deviceModel = 'unknown';
  let locale = 'en-US';
  let timezone = 'UTC';
  let screenWidth = 0;
  let screenHeight = 0;
  
  try {
    const expoConfig = Constants.expoConfig;
    const device = Constants.device;
    
    appVersion = expoConfig?.version || '1.0.0';
    osVersion = Platform.Version?.toString() || 'unknown';
    deviceModel = device?.modelName || device?.brand || 'unknown';
    
    // Safe locale extraction
    try {
      locale = Constants.locale || Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
    } catch {
      locale = 'en-US';
    }
    
    // Safe timezone extraction
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      timezone = 'UTC';
    }
    
    // Safe screen dimensions
    try {
      screenWidth = Constants.windowWidth || Constants.screenWidth || 0;
      screenHeight = Constants.windowHeight || Constants.screenHeight || 0;
    } catch {
      screenWidth = 0;
      screenHeight = 0;
    }
  } catch (error) {
    // If any part fails, use safe defaults
    // This ensures events can still be created even if context fails
  }
  
  return {
    appVersion,
    platform: Platform.OS || 'unknown',
    osVersion,
    deviceModel,
    locale,
    timezone,
    screenWidth,
    screenHeight,
  };
}

/**
 * Liste exhaustive de champs PII à bloquer
 * Inclut champs sensibles religieux spécifiques à l'app
 */
const PII_FIELDS = [
  // PII standard
  'email', 'password', 'phone', 'address', 'ssn', 'credit_card',
  'token', 'secret', 'key', 'auth', 'session',
  'name', 'firstname', 'lastname', 'username',
  'ip', 'device_id', 'advertising_id',
  // Champs sensibles religieux
  'intention', 'intention_text', 'prayer_text', 'dhikr_text',
  'journal_text', 'journal_entry', 'note_text', 'chat_message',
  'conversation_content', 'message_content',
  // Champs personnels
  'bio', 'description', 'comment', 'feedback_text',
];

/**
 * Calculer profondeur d'un objet
 */
function getObjectDepth(obj: any, currentDepth: number = 0): number {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const depth = getObjectDepth(obj[key], currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}

/**
 * Validate event properties - GDPR compliant
 * Ensures no PII and reasonable size
 * Blocks sensitive religious data
 */
export function validateEventProperties(
  properties?: Record<string, unknown>
): { valid: boolean; error?: string } {
  if (!properties) return { valid: true };
  
  // Check size (max 100KB serialized)
  const serialized = JSON.stringify(properties);
  if (serialized.length > 100 * 1024) {
    return { valid: false, error: 'Properties exceed 100KB limit' };
  }
  
  // Vérifier chaque clé pour PII
  for (const key of Object.keys(properties)) {
    const lowerKey = key.toLowerCase();
    
    // Bloquer si clé contient PII
    if (PII_FIELDS.some(pii => lowerKey.includes(pii.toLowerCase()))) {
      return {
        valid: false,
        error: `PII field detected: ${key}. PII and sensitive religious fields are not allowed in analytics.`,
      };
    }

    // Bloquer si valeur est une string longue (potentiel texte sensible)
    const value = properties[key];
    if (typeof value === 'string' && value.length > 100) {
      return {
        valid: false,
        error: `Long string value in ${key} (${value.length} chars). Long text fields are not allowed to prevent PII/religious data leakage.`,
      };
    }

    // Bloquer si valeur est un objet profond (pourrait contenir PII)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const depth = getObjectDepth(value);
      if (depth > 2) {
        return {
          valid: false,
          error: `Nested object in ${key} (depth ${depth}). Deep objects are not allowed.`,
        };
      }
    }
  }
  
  // Check for common PII patterns in values (email, SSN, credit card)
  const piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // email
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // credit card
  ];
  
  const valueString = JSON.stringify(properties);
  for (const pattern of piiPatterns) {
    if (pattern.test(valueString)) {
      return { valid: false, error: 'Potential PII pattern detected in property values' };
    }
  }
  
  return { valid: true };
}

