// Service de tracking de l'utilisation de l'application (React Native)
import { supabase } from '@/services/auth/supabase';
import { isOnline, addToSyncQueue } from '@/services/storage/syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Modules autorisÃ©s pour le tracking
const ALLOWED_MODULES = ['sabilanur', 'dairat-an-nur', 'nur-shifa', 'asma', 'journal', 'chat', 'quran'];

export interface UsageSession {
  id?: string;
  user_id: string;
  module: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  date: string;
  has_interaction?: boolean;
  is_valid?: boolean;
}

export interface UsageStats {
  totalDays: number;
  activeDays: number;
  totalTimeSeconds: number;
  moduleStats?: Record<string, {
    totalTimeSeconds: number;
    sessions: number;
  }>;
}

const USAGE_TRACKING_LOCAL_KEY = 'ayna_usage_tracking_local';

// Sauvegarder une session localement
async function saveSessionLocal(session: UsageSession): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(USAGE_TRACKING_LOCAL_KEY);
    const sessions: UsageSession[] = stored ? JSON.parse(stored) : [];
    const sessionId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessions.push({ ...session, id: sessionId });
    await AsyncStorage.setItem(USAGE_TRACKING_LOCAL_KEY, JSON.stringify(sessions));
    return sessionId;
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}

// DÃ©marrer une session de tracking
export async function startTrackingSession(userId: string, module: string): Promise<string | null> {
  if (!userId) return null;
  if (!ALLOWED_MODULES.includes(module)) return null;

  try {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const session: UsageSession = {
      user_id: userId,
      module,
      start_time: now.toISOString(),
      date,
    };

    // TOUJOURS sauvegarder localement d'abord
    const localId = await saveSessionLocal(session);

    // VÃ©rifier si on est en ligne
    const online = await isOnline();
    
    if (!online || !supabase) {
      // Hors ligne : ajouter Ã  la queue de synchronisation
      await addToSyncQueue({
        type: 'usage_tracking',
        data: session,
        userId,
      });
      return localId;
    }

    // En ligne : essayer de sauvegarder directement dans Supabase
    try {
      const { data, error } = await supabase
        .from('user_usage_tracking')
        .insert({
          user_id: userId,
          module,
          start_time: now.toISOString(),
          date,
        })
        .select('id')
        .single();

      if (error) {
        // Erreur silencieuse en production
        // Ajouter Ã  la queue pour synchronisation ultÃ©rieure
        await addToSyncQueue({
          type: 'usage_tracking',
          data: session,
          userId,
        });
        return localId;
      }
      return data?.id || localId;
    } catch (error) {
      // Erreur silencieuse en production
      // Ajouter Ã  la queue pour synchronisation ultÃ©rieure
      await addToSyncQueue({
        type: 'usage_tracking',
        data: session,
        userId,
      });
      return localId;
    }
  } catch (error) {
    // Erreur silencieuse en production
    return null;
  }
}

// Marquer une interaction
export async function markInteraction(sessionId: string): Promise<boolean> {
  if (!supabase || !sessionId) return false;
  try {
    const { error } = await supabase
      .from('user_usage_tracking')
      .update({ has_interaction: true })
      .eq('id', sessionId);
    return !error;
  } catch (error) {
    return false;
  }
}

// Terminer une session de tracking
export async function endTrackingSession(sessionId: string): Promise<boolean> {
  if (!supabase || !sessionId) return false;

  try {
    const { data: session, error: fetchError } = await supabase
      .from('user_usage_tracking')
      .select('start_time, has_interaction')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) return false;

    const startTime = new Date(session.start_time);
    const endTime = new Date();
    let durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const hasInteraction = session.has_interaction || false;

    // Limitation : Une session ne peut pas dÃ©passer 24h
    if (durationSeconds > 86400) {
      // Session dÃ©passe 24h, limitation Ã  24h
      durationSeconds = 86400;
    }

    // Suppression si session invalide (< 30s et sans interaction)
    if (durationSeconds < 30 && !hasInteraction) {
      await supabase.from('user_usage_tracking').delete().eq('id', sessionId);
      return false;
    }

    const { error } = await supabase
      .from('user_usage_tracking')
      .update({
        end_time: endTime.toISOString(),
        duration_seconds: durationSeconds,
        is_valid: true,
      })
      .eq('id', sessionId);

    return !error;
  } catch (error) {
    // Erreur silencieuse en production
    return false;
  }
}

// Obtenir les statistiques d'utilisation
// Si days = 0, rÃ©cupÃ¨re toutes les donnÃ©es depuis la crÃ©ation du compte
export async function getUserUsageStats(userId: string, days: number = 30): Promise<UsageStats | null> {
  if (!supabase || !userId) return null;

  try {
    let startDateStr: string | undefined;
    
    if (days > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDateStr = startDate.toISOString().split('T')[0];
    }
    // Si days = 0, on ne met pas de limite de date (rÃ©cupÃ¨re tout)

    let query = supabase
      .from('user_usage_tracking')
      .select('date, duration_seconds, module, is_valid')
      .eq('user_id', userId)
      .eq('is_valid', true);
    
    // Ajouter le filtre de date seulement si spÃ©cifiÃ©
    if (startDateStr) {
      query = query.gte('date', startDateStr);
    }
    
    const { data, error } = await query;

    if (error) {
      // Erreur silencieuse en production
      return null;
    }

    const uniqueDates = new Set<string>();
    let totalTimeSeconds = 0;
    const moduleStats: Record<string, { totalTimeSeconds: number; sessions: number }> = {};

    data?.forEach((record) => {
      if (record.date) uniqueDates.add(record.date);
      if (record.duration_seconds) {
        totalTimeSeconds += record.duration_seconds;
        if (record.module) {
          if (!moduleStats[record.module]) {
            moduleStats[record.module] = { totalTimeSeconds: 0, sessions: 0 };
          }
          moduleStats[record.module].totalTimeSeconds += record.duration_seconds;
          moduleStats[record.module].sessions += 1;
        }
      }
    });

    return {
      totalDays: days,
      activeDays: uniqueDates.size,
      totalTimeSeconds,
      moduleStats,
    };
  } catch (error) {
    // Erreur silencieuse en production
    return null;
  }
}

// Obtenir la frÃ©quence quotidienne d'utilisation
export async function getDailyUsageFrequency(
  userId: string,
  days: number = 30
): Promise<Array<{ date: string; timeHours?: number; timeMinutes?: number; hour?: number }>> {
  if (!supabase || !userId) return [];

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_usage_tracking')
      .select('date, duration_seconds, start_time, is_valid')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .eq('is_valid', true);

    if (error) {
      // Erreur silencieuse en production
      return [];
    }

    if (days === 1) {
      // Pour 24h, grouper par heure
      const hourlyData: Record<number, number> = {};
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      data?.forEach((record) => {
        if (record.start_time) {
          const recordTime = new Date(record.start_time);
          if (recordTime >= oneDayAgo) {
            const hour = recordTime.getHours();
            const minutes = Math.floor((record.duration_seconds || 0) / 60);
            hourlyData[hour] = (hourlyData[hour] || 0) + minutes;
          }
        }
      });

      return Array.from({ length: 24 }, (_, i) => ({
        date: '',
        hour: i,
        timeMinutes: hourlyData[i] || 0,
      }));
    } else {
      // Pour 7j et 30j, grouper par jour
      const dailyData: Record<string, number> = {};

      data?.forEach((record) => {
        if (record.date && record.duration_seconds) {
          const hours = record.duration_seconds / 3600;
          dailyData[record.date] = (dailyData[record.date] || 0) + hours;
        }
      });

      const result: Array<{ date: string; timeHours: number }> = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          timeHours: dailyData[dateStr] || 0,
        });
      }

      return result;
    }
  } catch (error) {
    // Erreur silencieuse en production
    return [];
  }
}

// Obtenir le temps d'utilisation par module
export async function getModuleUsageTime(
  userId: string,
  days: number = 30
): Promise<Array<{ module: string; timeSeconds: number; sessions: number }>> {
  if (!supabase || !userId) return [];

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_usage_tracking')
      .select('module, duration_seconds, is_valid')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .eq('is_valid', true);

    if (error) {
      // Erreur silencieuse en production
      return [];
    }

    const moduleData: Record<string, { timeSeconds: number; sessions: number }> = {};

    data?.forEach((record) => {
      if (record.module && record.duration_seconds) {
        if (!moduleData[record.module]) {
          moduleData[record.module] = { timeSeconds: 0, sessions: 0 };
        }
        moduleData[record.module].timeSeconds += record.duration_seconds;
        moduleData[record.module].sessions += 1;
      }
    });

    return Object.entries(moduleData)
      .map(([module, data]) => ({ module, ...data }))
      .sort((a, b) => b.timeSeconds - a.timeSeconds);
  } catch (error) {
    // Erreur silencieuse en production
    return [];
  }
}



