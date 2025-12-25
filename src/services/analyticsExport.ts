/**
 * Service pour exporter les données analytics par email via Brevo
 */

import { getUserAnalytics } from './analytics';
import { getUserUsageStats, getModuleUsageTime } from './usageTracking';
import { loadAllModuleVisits } from './moduleTracking';
import { calculatePersonalOverview, loadEventHistory } from './analyticsStats';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_STORAGE_KEY = 'ayna_analytics_events';

export interface ExportData {
  exportDate: string;
  userId: string;
  overview: any;
  eventHistory: any[];
  usageStats: any;
  moduleVisits: any[];
  rawEvents: any[];
}

/**
 * Exporte toutes les données analytics en JSON et les envoie par email
 */
export async function exportAnalyticsAsJSON(userId: string, userEmail: string, userName?: string): Promise<boolean> {
  try {
    // Collecter toutes les données
    const analytics = await getUserAnalytics(userId);
    const overview = await calculatePersonalOverview(userId, 'month');
    const eventHistory = await loadEventHistory(userId);
    const usageStats = await getUserUsageStats(userId, 0); // Toutes les données
    const moduleVisits = await loadAllModuleVisits(userId);
    
    // Récupérer les événements bruts depuis AsyncStorage
    const storedEvents = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
    const rawEvents = storedEvents ? JSON.parse(storedEvents) : [];
    
    // Récupérer les événements depuis Supabase
    let supabaseEvents: any[] = [];
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        supabaseEvents = data;
      }
    } catch (error) {
      console.warn('[analyticsExport] Erreur chargement Supabase:', error);
    }
    
    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      userId,
      overview,
      eventHistory,
      usageStats,
      moduleVisits,
      rawEvents: [...rawEvents, ...supabaseEvents],
    };
    
    // Envoyer par email via Edge Function Supabase
    try {
      const requestBody = {
        userEmail,
        userName: userName || userEmail.split('@')[0],
        userId,
        format: 'json',
        data: exportData,
      };
      
      console.log('[analyticsExport] Envoi à Edge Function:', {
        userEmail,
        userName: requestBody.userName,
        userId,
        format: 'json',
        dataSize: JSON.stringify(exportData).length
      });

      const { data: functionData, error: functionError } = await supabase.functions.invoke('send-analytics-export', {
        method: 'POST',
        body: requestBody,
      });
      
      if (functionError) {
        console.error('[analyticsExport] Erreur Edge Function:', functionError);
        // Si l'erreur contient un message, l'utiliser
        if (functionError.message) {
          throw new Error(functionError.message);
        }
        // Sinon, vérifier si c'est une erreur de déploiement
        if (functionError.toString().includes('not found') || functionError.toString().includes('404')) {
          throw new Error('La fonction d\'export n\'est pas déployée. Veuillez contacter le support.');
        }
        throw functionError;
      }
      
      if (!functionData?.success) {
        throw new Error(functionData?.error || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error: any) {
      // Gérer les erreurs HTTP spécifiques
      if (error?.status || error?.statusCode) {
        const status = error.status || error.statusCode;
        if (status === 404) {
          throw new Error('La fonction d\'export n\'est pas disponible. Veuillez contacter le support.');
        } else if (status === 500) {
          throw new Error('Erreur serveur lors de l\'export. Veuillez réessayer plus tard.');
        } else if (status === 401 || status === 403) {
          throw new Error('Vous n\'êtes pas autorisé à exporter vos données.');
        }
      }
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('[analyticsExport] Erreur export JSON:', error);
    throw error;
  }
}

/**
 * Exporte les données analytics en CSV et les envoie par email
 */
export async function exportAnalyticsAsCSV(userId: string, userEmail: string, userName?: string): Promise<boolean> {
  try {
    const analytics = await getUserAnalytics(userId);
    const eventHistory = await loadEventHistory(userId);
    const usageStats = await getUserUsageStats(userId, 0); // Toutes les données
    
    // Préparer les données pour l'export CSV
    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      eventHistory,
      usageStats,
    };
    
    // Envoyer par email via Edge Function Supabase
    try {
      const requestBody = {
        userEmail,
        userName: userName || userEmail.split('@')[0],
        userId,
        format: 'csv',
        data: exportData,
      };
      
      console.log('[analyticsExport] Envoi à Edge Function:', {
        userEmail,
        userName: requestBody.userName,
        userId,
        format: 'csv',
        dataSize: JSON.stringify(exportData).length
      });

      const { data: functionData, error: functionError } = await supabase.functions.invoke('send-analytics-export', {
        method: 'POST',
        body: requestBody,
      });
      
      if (functionError) {
        console.error('[analyticsExport] Erreur Edge Function:', functionError);
        // Si l'erreur contient un message, l'utiliser
        if (functionError.message) {
          throw new Error(functionError.message);
        }
        // Sinon, vérifier si c'est une erreur de déploiement
        if (functionError.toString().includes('not found') || functionError.toString().includes('404')) {
          throw new Error('La fonction d\'export n\'est pas déployée. Veuillez contacter le support.');
        }
        throw functionError;
      }
      
      if (!functionData?.success) {
        throw new Error(functionData?.error || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error: any) {
      // Gérer les erreurs HTTP spécifiques
      if (error?.status || error?.statusCode) {
        const status = error.status || error.statusCode;
        if (status === 404) {
          throw new Error('La fonction d\'export n\'est pas disponible. Veuillez contacter le support.');
        } else if (status === 500) {
          throw new Error('Erreur serveur lors de l\'export. Veuillez réessayer plus tard.');
        } else if (status === 401 || status === 403) {
          throw new Error('Vous n\'êtes pas autorisé à exporter vos données.');
        }
      }
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('[analyticsExport] Erreur export CSV:', error);
    throw error;
  }
}

/**
 * Exporte les données dans le format demandé et les envoie par email
 */
export async function exportAnalytics(
  userId: string,
  userEmail: string,
  userName?: string,
  format: 'json' | 'csv' = 'json'
): Promise<boolean> {
  if (format === 'json') {
    return await exportAnalyticsAsJSON(userId, userEmail, userName);
  } else {
    return await exportAnalyticsAsCSV(userId, userEmail, userName);
  }
}

