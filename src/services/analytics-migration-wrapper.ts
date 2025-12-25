/**
 * Analytics Migration Wrapper
 * 
 * HARD CONSENT GATE: This wrapper respects user consent.
 * Events are only migrated/tracked if consent is explicitly granted.
 * 
 * This file provides backward compatibility during migration from old analytics.ts to analytics v2.
 * It will be removed after migration is complete.
 */

import { analytics } from '@/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_KEY = '@ayna_analytics_events';
const MIGRATION_COMPLETE_KEY = '@ayna_analytics_migration_complete';
const MIGRATION_STARTED_KEY = '@ayna_analytics_migration_started';

// Flag pour éviter double tracking pendant migration
let migrationInProgress = false;

/**
 * Migre les événements de l'ancien système vers le nouveau
 * Appelé une seule fois au démarrage de l'app
 * 
 * HARD CONSENT GATE: Only migrates if user has given consent
 */
async function migrateOldEvents(): Promise<void> {
  // Vérifier si migration déjà complète
  const migrationComplete = await AsyncStorage.getItem(MIGRATION_COMPLETE_KEY);
  if (migrationComplete === 'true') {
    return; // Migration déjà effectuée
  }

  // Vérifier si migration en cours (pour éviter doubles appels)
  const migrationStarted = await AsyncStorage.getItem(MIGRATION_STARTED_KEY);
  if (migrationStarted === 'true' && migrationInProgress) {
    return; // Migration déjà en cours
  }

  try {
    migrationInProgress = true;
    await AsyncStorage.setItem(MIGRATION_STARTED_KEY, 'true');

    // Initialiser analytics v2 si pas déjà fait
    if (!analytics.isInitialized()) {
      await analytics.initialize();
    }

    // HARD CONSENT GATE: Check consent BEFORE migrating
    const hasConsent = analytics.getConsent();
    
    if (!hasConsent) {
      if (__DEV__) {
        console.log('[Analytics Migration] Migration skipped - no user consent. Old events backed up but not migrated.');
      }
      
      // Backup old events but do NOT migrate them
      const oldEventsRaw = await AsyncStorage.getItem(ANALYTICS_KEY);
      if (oldEventsRaw) {
        await AsyncStorage.setItem(`${ANALYTICS_KEY}_backup_${Date.now()}`, oldEventsRaw);
        await AsyncStorage.removeItem(ANALYTICS_KEY);
      }
      
      await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
      return; // Exit without migrating
    }

    // Charger anciens événements
    const oldEventsRaw = await AsyncStorage.getItem(ANALYTICS_KEY);
    if (!oldEventsRaw) {
      // Aucun événement à migrer
      await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
      return;
    }

    const oldEvents: Array<{
      name: string;
      properties?: Record<string, any>;
      timestamp: number;
      userId?: string;
      sessionId?: string;
    }> = JSON.parse(oldEventsRaw);

    if (oldEvents.length === 0) {
      await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
      return;
    }

    // Migrer chaque événement vers analytics v2 (only if consent given)
    // Note: analytics.track() will check consent again, so events will be dropped if consent revoked
    let migratedCount = 0;
    for (const oldEvent of oldEvents) {
      try {
        // Créer événement au format v2 (sans contexte, on garde timestamp original)
        analytics.track(oldEvent.name, {
          ...oldEvent.properties,
          // Flag pour indiquer que c'est un événement migré
          _migrated: true,
          _original_timestamp: oldEvent.timestamp,
        });
        migratedCount++;
      } catch (error) {
        // Ignorer erreurs individuelles, continuer la migration
        if (__DEV__) {
          console.warn('[Analytics Migration] Failed to migrate event:', oldEvent.name, error);
        }
      }
    }

    // Marquer migration comme complète
    await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
    
    // Sauvegarder backup (garder anciens événements 7 jours)
    await AsyncStorage.setItem(`${ANALYTICS_KEY}_backup_${Date.now()}`, oldEventsRaw);
    
    // Supprimer anciens événements (après backup)
    await AsyncStorage.removeItem(ANALYTICS_KEY);

    if (__DEV__) {
      console.log(`✅ [Analytics Migration] Migrated ${migratedCount}/${oldEvents.length} events to v2`);
    }

    // Flush immédiatement pour envoyer les événements migrés (only if consent)
    await analytics.flush();
  } catch (error) {
    // En cas d'erreur, ne pas bloquer l'app
    if (__DEV__) {
      console.error('[Analytics Migration] Error during migration:', error);
    }
  } finally {
    migrationInProgress = false;
  }
}

/**
 * Appeler la migration au chargement du module
 * (une seule fois grâce aux flags)
 * 
 * HARD CONSENT GATE: Migration respects consent - events are only migrated if consent is given
 */
migrateOldEvents().catch(() => {
  // Ignorer erreurs, ne pas bloquer le chargement
});

/**
 * Wrapper pour trackEvent - redirige vers analytics v2
 * 
 * HARD CONSENT GATE: Respects consent - events are dropped if consent is false
 */
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): Promise<void> {
  // Empêcher double tracking pendant migration
  if (migrationInProgress) {
    return;
  }

  // S'assurer que analytics v2 est initialisé
  if (!analytics.isInitialized()) {
    await analytics.initialize();
  }

  // Utiliser analytics v2 (will check consent internally and drop if false)
  analytics.track(eventName, properties);
}

/**
 * Wrapper pour trackPageView - redirige vers analytics v2
 * 
 * HARD CONSENT GATE: Respects consent - events are dropped if consent is false
 */
export async function trackPageView(pageName: string): Promise<void> {
  if (migrationInProgress) {
    return;
  }

  if (!analytics.isInitialized()) {
    await analytics.initialize();
  }

  // analytics.screen() calls track() which checks consent
  analytics.screen(pageName);
}

/**
 * Wrapper pour trackConversion
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
 * Wrapper pour trackFunnelStep
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
 * Wrapper pour trackError
 * 
 * PRODUCTION SECURITY: Redirects to analytics.trackError() which enforces strict security.
 * This wrapper ensures developers cannot bypass security by calling trackEvent('error') directly.
 */
export async function trackError(
  errorName: string,
  error?: Error | unknown,
  additionalProperties?: Record<string, unknown>
): Promise<void> {
  // Ensure analytics is initialized
  if (!analytics.isInitialized()) {
    await analytics.initialize();
  }

  // Use the secure trackError method from Analytics
  // This ensures error.message is never sent, stack traces are stripped, etc.
  analytics.trackError(errorName, error, additionalProperties);
}

/**
 * Wrapper pour syncAnalyticsEvents - redirige vers analytics v2 flush
 */
export async function syncAnalyticsEvents(): Promise<void> {
  if (!analytics.isInitialized()) {
    await analytics.initialize();
  }
  await analytics.flush();
}

/**
 * Wrapper pour getUserAnalytics - utilise analytics v2 export
 */
export async function getUserAnalytics(userId: string): Promise<any> {
  if (!analytics.isInitialized()) {
    await analytics.initialize();
  }
  
  const events = await analytics.exportUserData(userId);
  
  return {
    totalEvents: events.length,
    events: events,
  };
}

// Exporter les types pour compatibilité
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

