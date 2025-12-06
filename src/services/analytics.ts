/**
 * Service d'analytics avancées
 * Tracking d'événements, funnels, cohorts, etc.
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_KEY = '@ayna_analytics_events';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface FunnelStep {
  name: string;
  event: string;
  order: number;
}

/**
 * Enregistre un événement analytics
 */
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      userId: user?.id,
    };

    // Sauvegarder localement pour synchronisation offline
    const storedEvents = await AsyncStorage.getItem(ANALYTICS_KEY);
    const events: AnalyticsEvent[] = storedEvents ? JSON.parse(storedEvents) : [];
    events.push(event);
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));

    // Envoyer à Supabase si connecté
    if (user) {
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_name: eventName,
        properties: properties || {},
        created_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Erreur lors du tracking d\'événement:', error);
  }
}

/**
 * Track un événement de conversion
 */
export async function trackConversion(
  conversionName: string,
  value?: number
): Promise<void> {
  await trackEvent('conversion', {
    conversion_name: conversionName,
    value,
  });
}

/**
 * Track un événement de funnel
 */
export async function trackFunnelStep(
  funnelName: string,
  stepName: string,
  stepOrder: number
): Promise<void> {
  await trackEvent('funnel_step', {
    funnel_name: funnelName,
    step_name: stepName,
    step_order: stepOrder,
  });
}

/**
 * Track un événement de page view
 */
export async function trackPageView(pageName: string): Promise<void> {
  await trackEvent('page_view', {
    page_name: pageName,
  });
}

/**
 * Track un événement d'erreur
 */
export async function trackError(
  errorName: string,
  errorMessage: string,
  errorStack?: string
): Promise<void> {
  await trackEvent('error', {
    error_name: errorName,
    error_message: errorMessage,
    error_stack: errorStack,
  });
}

/**
 * Synchronise les événements stockés localement avec Supabase
 */
export async function syncAnalyticsEvents(): Promise<void> {
  try {
    const storedEvents = await AsyncStorage.getItem(ANALYTICS_KEY);
    if (!storedEvents) return;

    const events: AnalyticsEvent[] = JSON.parse(storedEvents);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || events.length === 0) return;

    // Envoyer tous les événements en batch
    const eventsToInsert = events.map(event => ({
      user_id: user.id,
      event_name: event.name,
      properties: event.properties || {},
      created_at: new Date(event.timestamp).toISOString(),
    }));

    await supabase.from('analytics_events').insert(eventsToInsert);

    // Vider le cache local après synchronisation réussie
    await AsyncStorage.removeItem(ANALYTICS_KEY);
  } catch (error) {
    console.error('Erreur lors de la synchronisation des analytics:', error);
  }
}

/**
 * Obtient les statistiques analytics pour un utilisateur
 */
export async function getUserAnalytics(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    return {
      totalEvents: data?.length || 0,
      events: data,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error);
    return { totalEvents: 0, events: [] };
  }
}


