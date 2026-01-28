/**
 * Service pour rÃ©initialiser complÃ¨tement les analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/auth/supabase';

const ANALYTICS_STORAGE_KEY = 'ayna_analytics_events';
const USAGE_TRACKING_LOCAL_KEY = 'ayna_usage_tracking_local';
const MODULE_TRACKING_KEY = 'ayna_module_visits';

/**
 * RÃ©initialise toutes les donnÃ©es analytics locales
 */
export async function resetLocalAnalytics(): Promise<void> {
  try {
    // Supprimer les Ã©vÃ©nements analytics
    await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
    
    // Supprimer les sessions de tracking
    await AsyncStorage.removeItem(USAGE_TRACKING_LOCAL_KEY);
    
    // Supprimer les visites de modules
    await AsyncStorage.removeItem(MODULE_TRACKING_KEY);
    
    console.log('[analyticsReset] DonnÃ©es locales supprimÃ©es');
  } catch (error) {
    console.error('[analyticsReset] Erreur suppression locale:', error);
    throw error;
  }
}

/**
 * RÃ©initialise toutes les donnÃ©es analytics sur Supabase
 */
export async function resetRemoteAnalytics(userId: string): Promise<void> {
  if (!supabase || !userId) return;
  
  try {
    // Supprimer les Ã©vÃ©nements analytics
    const { error: eventsError } = await supabase
      .from('analytics_events')
      .delete()
      .eq('user_id', userId);
    
    if (eventsError) {
      console.warn('[analyticsReset] Erreur suppression Ã©vÃ©nements:', eventsError);
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
      console.warn('[analyticsReset] Erreur suppression visites (peut Ãªtre normal):', visitsError);
    }
    
    console.log('[analyticsReset] DonnÃ©es distantes supprimÃ©es');
  } catch (error) {
    console.error('[analyticsReset] Erreur suppression distante:', error);
    throw error;
  }
}

/**
 * RÃ©initialise complÃ¨tement toutes les donnÃ©es analytics (local + remote)
 */
export async function resetAllAnalytics(userId: string): Promise<void> {
  try {
    // RÃ©initialiser les donnÃ©es locales
    await resetLocalAnalytics();
    
    // RÃ©initialiser les donnÃ©es distantes
    await resetRemoteAnalytics(userId);
    
    console.log('[analyticsReset] Toutes les donnÃ©es analytics ont Ã©tÃ© rÃ©initialisÃ©es');
  } catch (error) {
    console.error('[analyticsReset] Erreur rÃ©initialisation complÃ¨te:', error);
    throw error;
  }
}





