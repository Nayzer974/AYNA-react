/**
 * Analytics v2 - Supabase Provider
 * 
 * Sends events to Supabase analytics_events table.
 * Implements the AnalyticsProvider interface.
 * Does NOT mutate events - sends them as-is.
 */

import { AnalyticsProvider, AnalyticsEvent } from '../types';
import { supabase } from '@/services/auth/supabase';
import { APP_CONFIG } from '@/config';

/**
 * Supabase Analytics Provider
 * Sends events to Supabase analytics_events table in batches
 */
export class SupabaseProvider implements AnalyticsProvider {
  private initialized: boolean = false;
  private currentUserId: string | null = null;

  async initialize(): Promise<void> {
    if (!APP_CONFIG.useSupabase || !supabase) {
      throw new Error('Supabase is not configured');
    }

    // Get current user ID if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUserId = user?.id || null;
    } catch (error) {
      // Not authenticated - continue with null userId
      this.currentUserId = null;
    }

    this.initialized = true;
  }

  async track(events: AnalyticsEvent[]): Promise<void> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    if (events.length === 0) {
      return;
    }

    // Verify user is still authenticated (userId may have changed)
    let userId: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
      // Update cached userId
      this.currentUserId = userId || null;
    } catch (error) {
      // Not authenticated - events without userId will be rejected by RLS
      userId = undefined;
    }

    // Transform events to Supabase format
    // DO NOT mutate original events
    const insertData = events.map(event => ({
      user_id: event.userId || userId || null,
      event_name: event.name,
      properties: {
        ...(event.properties || {}),
        // Store metadata for deduplication and querying
        _metadata: {
          eventId: event.eventId,
          sessionId: event.sessionId,
          // Context stored for analytics processing
          context: event.context,
        },
      },
      created_at: new Date(event.timestamp).toISOString(),
    }));

    // Insert batch into Supabase
    const { error } = await supabase
      .from('analytics_events')
      .insert(insertData);

    if (error) {
      // Handle specific errors
      if (error.code === '42501') {
        // RLS policy violation - user not authenticated
        throw new Error('Authentication required for analytics');
      } else if (error.code === '42P01') {
        // Table doesn't exist
        throw new Error('analytics_events table does not exist');
      } else {
        throw error;
      }
    }
  }

  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    // Cache userId for future events
    this.currentUserId = userId;

    // Supabase doesn't have a separate identify method
    // User identification happens via RLS policies using auth.uid()
    // Traits can be stored in profiles table if needed (not implemented here)
  }

  async reset(): Promise<void> {
    this.currentUserId = null;
    // Supabase provider doesn't need additional cleanup
  }

  isReady(): boolean {
    return this.initialized && !!supabase && APP_CONFIG.useSupabase;
  }
}

