/**
 * Analytics v2 - Debug Provider
 * 
 * Development-only provider that logs events to console.
 * Useful for debugging and development.
 */

import { AnalyticsProvider, AnalyticsEvent } from '../types';

/**
 * Debug Analytics Provider
 * Logs events to console in development mode
 */
export class DebugProvider implements AnalyticsProvider {
  private initialized: boolean = false;
  private eventCount: number = 0;

  async initialize(): Promise<void> {
    this.initialized = true;
    console.log('[Analytics Debug] Provider initialized');
  }

  async track(events: AnalyticsEvent[]): Promise<void> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    this.eventCount += events.length;

    // Log each event
    events.forEach(event => {
      console.log('[Analytics Debug] Event:', {
        id: event.eventId,
        name: event.name,
        timestamp: new Date(event.timestamp).toISOString(),
        userId: event.userId || '(anonymous)',
        sessionId: event.sessionId || '(no session)',
        properties: event.properties,
        context: event.context,
      });
    });

    console.log(`[Analytics Debug] Total events logged: ${this.eventCount}`);
  }

  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    console.log('[Analytics Debug] Identify:', {
      userId,
      traits,
    });
  }

  async reset(): Promise<void> {
    this.eventCount = 0;
    console.log('[Analytics Debug] Provider reset');
  }

  isReady(): boolean {
    return this.initialized;
  }
}





