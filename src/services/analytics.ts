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
    if (!supabase) return;
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
    if (user && supabase) {
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_name: eventName,
        properties: properties || {},
        created_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    // Erreur silencieuse en production
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
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || events.length === 0) return;

    // Envoyer tous les événements en batch
    const eventsToInsert = events.map(event => ({
      user_id: user.id,
      event_name: event.name,
      properties: event.properties || {},
      created_at: new Date(event.timestamp).toISOString(),
    }));

    if (supabase) {
    await supabase.from('analytics_events').insert(eventsToInsert);
    }

    // Vider le cache local après synchronisation réussie
    await AsyncStorage.removeItem(ANALYTICS_KEY);
  } catch (error) {
    // Erreur silencieuse en production
  }
}

/**
 * Obtient les statistiques analytics pour un utilisateur
 * Fusionne les événements locaux (AsyncStorage) avec ceux de Supabase
 * pour inclure les activités récentes même si elles ne sont pas encore synchronisées
 */
export async function getUserAnalytics(userId: string): Promise<any> {
  try {
    // Récupérer les événements locaux (y compris ceux du jour)
    const storedEvents = await AsyncStorage.getItem(ANALYTICS_KEY);
    const localEvents: AnalyticsEvent[] = storedEvents ? JSON.parse(storedEvents) : [];
    
    // Filtrer uniquement les événements de l'utilisateur actuel
    const userLocalEvents = localEvents.filter(e => e.userId === userId);

    // Récupérer les événements de Supabase (sans limite pour récupérer toutes les données depuis la création du compte)
    let remoteEvents: any[] = [];
    try {
      // Récupérer tous les événements par batch pour éviter les limites
      let hasMore = true;
      let offset = 0;
      const batchSize = 1000;
      
      if (!supabase) return [];
      while (hasMore) {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + batchSize - 1);

        if (error) {
          console.warn('[getUserAnalytics] Erreur récupération batch:', error);
          hasMore = false;
        } else if (data && data.length > 0) {
          remoteEvents = [...remoteEvents, ...data];
          offset += batchSize;
          // Si on a récupéré moins que le batch size, on a tout récupéré
          if (data.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.warn('[getUserAnalytics] Erreur récupération événements Supabase:', error);
      // Erreur silencieuse, on continue avec les événements locaux uniquement
    }

    // Fusionner les événements locaux et distants
    // Convertir les événements locaux au format Supabase pour uniformiser
    const normalizedLocalEvents = userLocalEvents.map(event => ({
      id: `local_${event.timestamp}`,
      user_id: event.userId,
      event_name: event.name,
      properties: event.properties || {},
      created_at: new Date(event.timestamp).toISOString(),
      timestamp: event.timestamp, // Garder le timestamp pour le filtrage
    }));

    // Convertir les événements distants pour inclure le timestamp
    const normalizedRemoteEvents = remoteEvents.map(event => ({
      ...event,
      timestamp: event.created_at ? new Date(event.created_at).getTime() : Date.now(),
    }));

    // Fusionner en évitant les doublons (basé sur event_name + timestamp)
    const eventMap = new Map<string, any>();
    
    // Ajouter d'abord les événements distants
    normalizedRemoteEvents.forEach(event => {
      const key = `${event.event_name}_${event.timestamp}`;
      eventMap.set(key, event);
    });
    
    // Ajouter les événements locaux (ils peuvent être plus récents)
    normalizedLocalEvents.forEach(event => {
      const key = `${event.event_name}_${event.timestamp}`;
      // Les événements locaux ont priorité s'ils sont plus récents
      const existing = eventMap.get(key);
      if (!existing || event.timestamp > existing.timestamp) {
        eventMap.set(key, event);
      }
    });

    // Convertir en tableau et trier par timestamp (plus récent en premier)
    const allEvents = Array.from(eventMap.values()).sort((a, b) => {
      const timeA = a.timestamp || (a.created_at ? new Date(a.created_at).getTime() : 0);
      const timeB = b.timestamp || (b.created_at ? new Date(b.created_at).getTime() : 0);
      return timeB - timeA;
    });

    return {
      totalEvents: allEvents.length,
      events: allEvents,
    };
  } catch (error) {
    // Erreur silencieuse en production
    return { totalEvents: 0, events: [] };
  }
}


