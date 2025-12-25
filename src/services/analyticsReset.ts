/**
 * Service pour réinitialiser complètement les analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const ANALYTICS_STORAGE_KEY = 'ayna_analytics_events';
const USAGE_TRACKING_LOCAL_KEY = 'ayna_usage_tracking_local';
const MODULE_TRACKING_KEY = 'ayna_module_visits';

/**
 * Réinitialise toutes les données analytics locales
 */
export async function resetLocalAnalytics(): Promise<void> {
  try {
    // Supprimer les événements analytics
    await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
    
    // Supprimer les sessions de tracking
    await AsyncStorage.removeItem(USAGE_TRACKING_LOCAL_KEY);
    
    // Supprimer les visites de modules
    await AsyncStorage.removeItem(MODULE_TRACKING_KEY);
    
    console.log('[analyticsReset] Données locales supprimées');
  } catch (error) {
    console.error('[analyticsReset] Erreur suppression locale:', error);
    throw error;
  }
}

/**
 * Réinitialise toutes les données analytics sur Supabase
 */
export async function resetRemoteAnalytics(userId: string): Promise<void> {
  if (!supabase || !userId) return;
  
  try {
    // Supprimer les événements analytics
    const { error: eventsError } = await supabase
      .from('analytics_events')
      .delete()
      .eq('user_id', userId);
    
    if (eventsError) {
      console.warn('[analyticsReset] Erreur suppression événements:', eventsError);
    }
    
    // Supprimer les sessions de tracking
    const { error: sessionsError } = await supabase
      .from('user_usage_tracking')
      .delete()
      .eq('user_id', userId);
    
    if (sessionsError) {
      console.warn('[analyticsReset] Erreur suppression sessions:', sessionsError);
    }
    
    // Supprimer les visites de modules
    const { error: visitsError } = await supabase
      .from('module_visits')
      .delete()
      .eq('user_id', userId);
    
    if (visitsError) {
      // La table peut ne pas exister, c'est OK
      console.warn('[analyticsReset] Erreur suppression visites (peut être normal):', visitsError);
    }
    
    console.log('[analyticsReset] Données distantes supprimées');
  } catch (error) {
    console.error('[analyticsReset] Erreur suppression distante:', error);
    throw error;
  }
}

/**
 * Réinitialise complètement toutes les données analytics (local + remote)
 */
export async function resetAllAnalytics(userId: string): Promise<void> {
  try {
    // Réinitialiser les données locales
    await resetLocalAnalytics();
    
    // Réinitialiser les données distantes
    await resetRemoteAnalytics(userId);
    
    console.log('[analyticsReset] Toutes les données analytics ont été réinitialisées');
  } catch (error) {
    console.error('[analyticsReset] Erreur réinitialisation complète:', error);
    throw error;
  }
}




