/**
 * Service de stockage des sessions Khalwa (Bayt An Nûr)
 * Sauvegarde et récupération des sessions depuis Supabase
 */

import { supabase } from './supabase';
import { DivineName } from '@/data/khalwaData';
import { BreathingType } from '@/data/khalwaData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline, addToSyncQueue } from './syncService';

export interface KhalwaSessionData {
  id?: string;
  intention?: string;
  divineName: DivineName;
  soundAmbiance: string;
  duration: number; // en minutes (peut avoir des décimales pour les secondes, ex: 0.5 = 30 secondes)
  breathingType: BreathingType;
  guided: boolean;
  feeling?: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface KhalwaStats {
  totalSessions: number;
  totalMinutes: number;
  avgDuration: number;
  mostUsedDivineName: string;
  mostUsedBreathingType: string;
  mostUsedSound: string;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  longestStreakDays: number;
}

const STORAGE_KEY = 'khalwa_sessions';

/**
 * Sauvegarder une session Khalwa dans Supabase
 * Sauvegarde toujours localement, puis synchronise vers Supabase si en ligne
 */
export async function saveKhalwaSession(
  userId: string,
  sessionData: KhalwaSessionData
): Promise<string | null> {
  // TOUJOURS sauvegarder localement d'abord
  const localId = await saveKhalwaSessionLocal(userId, sessionData);
  
  // Vérifier si on est en ligne
  const online = await isOnline();
  
  if (!online || !supabase) {
    // Hors ligne ou Supabase non configuré : ajouter à la queue de synchronisation
    await addToSyncQueue({
      type: 'khalwa_session',
      data: sessionData,
      userId,
    });
    return localId;
  }

  // En ligne : essayer de sauvegarder directement dans Supabase
  try {
    // Vérifier d'abord si une session existe
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn('Aucune session Supabase active. Sauvegarde locale uniquement.');
      // Ajouter à la queue pour synchronisation ultérieure
      await addToSyncQueue({
        type: 'khalwa_session',
        data: sessionData,
        userId,
      });
      return localId;
    }

    // CRITIQUE : Récupérer l'ID utilisateur directement depuis Supabase auth
    // Cela garantit que l'ID correspond bien à auth.uid() utilisé dans les politiques RLS
    const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !supabaseUser?.id) {
      console.error('Erreur lors de la récupération de l\'utilisateur Supabase:', userError);
      // Ajouter à la queue pour synchronisation ultérieure
      await addToSyncQueue({
        type: 'khalwa_session',
        data: sessionData,
        userId,
      });
      return localId;
    }

    // Utiliser l'ID Supabase authentifié (qui correspond à auth.uid())
    const authenticatedUserId = supabaseUser.id;

    const { data, error } = await supabase
      .from('khalwa_sessions')
      .insert({
        user_id: authenticatedUserId, // Utiliser l'ID Supabase authentifié
        intention: sessionData.intention || null,
        divine_name_id: sessionData.divineName.id,
        divine_name_arabic: sessionData.divineName.arabic,
        divine_name_transliteration: sessionData.divineName.transliteration,
        sound_ambiance: sessionData.soundAmbiance,
        duration_minutes: sessionData.duration,
        breathing_type: sessionData.breathingType,
        guided: sessionData.guided,
        feeling: sessionData.feeling || null,
        completed: sessionData.completed !== false
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur lors de la sauvegarde de la session:', error);
      // Si c'est une erreur RLS, donner plus de détails
      if (error.code === '42501') {
        console.error('❌ Erreur RLS - Vérifiez que :');
        console.error('  1. Les politiques RLS sont correctement configurées (exécutez fix-all-rls-and-missing-tables.sql)');
        console.error('  2. L\'utilisateur est bien authentifié dans Supabase');
        console.error('  3. L\'ID utilisateur correspond à auth.uid()');
      }
      // Ajouter à la queue pour synchronisation ultérieure
      await addToSyncQueue({
        type: 'khalwa_session',
        data: sessionData,
        userId: authenticatedUserId,
      });
      return localId;
    }

    // Si sauvegarde Supabase réussie, on peut supprimer la version locale
    // (mais on garde une copie pour les stats locales)
    return data?.id || localId;
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde de la session:', error);
    // Ajouter à la queue pour synchronisation ultérieure
    await addToSyncQueue({
      type: 'khalwa_session',
      data: sessionData,
      userId,
    });
    return localId;
  }
}

/**
 * Sauvegarder une session en AsyncStorage (fallback)
 */
async function saveKhalwaSessionLocal(
  userId: string,
  sessionData: KhalwaSessionData
): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const localSessions = stored ? JSON.parse(stored) : [];
    const newSession = {
      ...sessionData,
      id: `local_${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localSessions.push(newSession);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localSessions));
    return newSession.id;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde locale:', error);
    return null;
  }
}

/**
 * Charger toutes les sessions d'un utilisateur
 * Priorité : Supabase > AsyncStorage
 */
export async function loadKhalwaSessions(
  userId: string,
  limit?: number
): Promise<KhalwaSessionData[]> {
  if (!supabase) {
    // Charger depuis AsyncStorage
    return loadKhalwaSessionsLocal(userId, limit);
  }

  try {
    let query = supabase
      .from('khalwa_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      // Si la table n'existe pas encore, utiliser AsyncStorage
      if (error.message?.includes('does not exist') || error.code === '42P01' || error.message?.includes('relation')) {
        console.warn('La table khalwa_sessions n\'existe pas encore. Utilisation d\'AsyncStorage.');
        return loadKhalwaSessionsLocal(userId, limit);
      }
      console.error('Erreur lors du chargement des sessions:', error);
      // Essayer quand même AsyncStorage en fallback
      return loadKhalwaSessionsLocal(userId, limit);
    }

    const supabaseSessions = (data || []).map(transformSessionFromDB);
    
    // Si on a des sessions depuis Supabase, les retourner
    if (supabaseSessions.length > 0) {
      return supabaseSessions;
    }

    // Si aucune session dans Supabase, essayer AsyncStorage (pour migration)
    return loadKhalwaSessionsLocal(userId, limit);
  } catch (error: any) {
    console.error('Erreur lors du chargement des sessions:', error);
    return loadKhalwaSessionsLocal(userId, limit);
  }
}

/**
 * Charger les sessions depuis AsyncStorage (fallback)
 */
async function loadKhalwaSessionsLocal(
  userId: string,
  limit?: number
): Promise<KhalwaSessionData[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const localSessions = stored ? JSON.parse(stored) : [];
    const userSessions = localSessions
      .filter((s: any) => s.userId === userId && s.completed !== false)
      .sort((a: any, b: any) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

    return limit ? userSessions.slice(0, limit) : userSessions;
  } catch (error) {
    console.error('Erreur lors du chargement local:', error);
    return [];
  }
}

/**
 * Transformer une session de la base de données en objet KhalwaSessionData
 */
function transformSessionFromDB(dbSession: any): KhalwaSessionData {
  return {
    id: dbSession.id,
    intention: dbSession.intention,
    divineName: {
      id: dbSession.divine_name_id,
      arabic: dbSession.divine_name_arabic,
      transliteration: dbSession.divine_name_transliteration,
      meaning: '', // Pas stocké en DB, sera récupéré depuis khalwaData si nécessaire
      description: ''
    },
    soundAmbiance: dbSession.sound_ambiance,
    duration: Number(dbSession.duration_minutes) || 0, // Convertir en nombre pour gérer les décimales
    breathingType: dbSession.breathing_type as BreathingType,
    guided: dbSession.guided,
    feeling: dbSession.feeling,
    completed: dbSession.completed,
    createdAt: dbSession.created_at,
    updatedAt: dbSession.updated_at
  };
}

/**
 * Obtenir les statistiques d'un utilisateur
 * Utilise la fonction RPC Supabase si disponible, sinon calcule depuis les sessions Supabase, sinon depuis AsyncStorage
 */
export async function getKhalwaStats(userId: string): Promise<KhalwaStats | null> {
  if (!supabase) {
    // Calculer les stats depuis AsyncStorage
    return getKhalwaStatsLocal(userId);
  }

  try {
    // Essayer d'abord la fonction RPC
    const { data, error } = await supabase.rpc('get_khalwa_stats', {
      p_user_id: userId
    });

    if (!error && data && data.length > 0) {
      const stats = data[0];
      return {
        totalSessions: Number(stats.total_sessions) || 0,
        totalMinutes: Number(stats.total_minutes) || 0,
        avgDuration: Number(stats.avg_duration) || 0,
        mostUsedDivineName: stats.most_used_divine_name || '',
        mostUsedBreathingType: stats.most_used_breathing_type || '',
        mostUsedSound: stats.most_used_sound || '',
        sessionsThisWeek: Number(stats.sessions_this_week) || 0,
        sessionsThisMonth: Number(stats.sessions_this_month) || 0,
        longestStreakDays: Number(stats.longest_streak_days) || 0
      };
    }

    // Si la fonction RPC n'existe pas ou échoue, charger les sessions depuis Supabase et calculer
    if (error && (error.message?.includes('function') || error.code === '42883' || error.message?.includes('does not exist'))) {
      console.warn('La fonction RPC get_khalwa_stats n\'existe pas. Calcul depuis les sessions Supabase...');
      // Charger toutes les sessions depuis Supabase et calculer les stats
      const sessions = await loadKhalwaSessions(userId);
      return calculateStatsFromSessions(sessions);
    }

    // Autre erreur, essayer de charger depuis Supabase quand même
    console.warn('Erreur RPC, calcul depuis les sessions Supabase:', error);
    const sessions = await loadKhalwaSessions(userId);
    if (sessions.length > 0) {
      return calculateStatsFromSessions(sessions);
    }

    // Fallback sur AsyncStorage
    return getKhalwaStatsLocal(userId);
  } catch (error: any) {
    console.error('Erreur lors du chargement des statistiques:', error);
    // Essayer de charger depuis Supabase
    try {
      const sessions = await loadKhalwaSessions(userId);
      if (sessions.length > 0) {
        return calculateStatsFromSessions(sessions);
      }
    } catch (e) {
      console.error('Erreur lors du chargement des sessions:', e);
    }
    // Dernier recours : AsyncStorage
    return getKhalwaStatsLocal(userId);
  }
}

/**
 * Calculer les statistiques depuis une liste de sessions
 */
function calculateStatsFromSessions(sessions: KhalwaSessionData[]): KhalwaStats {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      avgDuration: 0,
      mostUsedDivineName: '',
      mostUsedBreathingType: '',
      mostUsedSound: '',
      sessionsThisWeek: 0,
      sessionsThisMonth: 0,
      longestStreakDays: 0
    };
  }

  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const avgDuration = totalMinutes / totalSessions;

  // Calculer les plus utilisés
  const divineNameCounts: Record<string, number> = {};
  const breathingCounts: Record<string, number> = {};
  const soundCounts: Record<string, number> = {};

  sessions.forEach((s) => {
    const nameId = s.divineName?.id || '';
    const breathing = s.breathingType || '';
    const sound = s.soundAmbiance || '';

    if (nameId) divineNameCounts[nameId] = (divineNameCounts[nameId] || 0) + 1;
    if (breathing) breathingCounts[breathing] = (breathingCounts[breathing] || 0) + 1;
    if (sound) soundCounts[sound] = (soundCounts[sound] || 0) + 1;
  });

  const mostUsedDivineName = Object.keys(divineNameCounts).reduce((a, b) => 
    divineNameCounts[a] > divineNameCounts[b] ? a : b, ''
  );
  const mostUsedBreathingType = Object.keys(breathingCounts).reduce((a, b) => 
    breathingCounts[a] > breathingCounts[b] ? a : b, ''
  );
  const mostUsedSound = Object.keys(soundCounts).reduce((a, b) => 
    soundCounts[a] > soundCounts[b] ? a : b, ''
  );

  // Calculer les sessions de cette semaine et ce mois (basé sur les vraies dates)
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);
  
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  monthAgo.setHours(0, 0, 0, 0);

  const sessionsThisWeek = sessions.filter((s) => {
    if (!s.createdAt) return false;
    const sessionDate = new Date(s.createdAt);
    return sessionDate >= weekAgo;
  }).length;

  const sessionsThisMonth = sessions.filter((s) => {
    if (!s.createdAt) return false;
    const sessionDate = new Date(s.createdAt);
    return sessionDate >= monthAgo;
  }).length;

  // Calculer la série (basée sur les vraies dates, jours consécutifs)
  // Trier les sessions par date (plus récentes en premier pour calculer depuis aujourd'hui)
  const sortedSessions = [...sessions]
    .filter((s) => s.createdAt) // Filtrer les sessions sans date
    .sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

  let longestStreakDays = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  // Parcourir depuis aujourd'hui vers le passé
  sortedSessions.forEach((s) => {
    if (!s.createdAt) return;
    
    const sessionDate = new Date(s.createdAt);
    const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

    if (lastDate === null) {
      // Première session
      currentStreak = 1;
      lastDate = sessionDay;
    } else {
      const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      const daysDiff = Math.floor((lastDay.getTime() - sessionDay.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDiff === 1) {
        // Jour consécutif (hier)
        currentStreak++;
        lastDate = sessionDay;
      } else if (daysDiff === 0) {
        // Même jour, ne pas compter comme nouveau jour mais garder la série
        // Ne rien faire, on garde lastDate
      } else {
        // Gap dans la série
        longestStreakDays = Math.max(longestStreakDays, currentStreak);
        currentStreak = 1;
        lastDate = sessionDay;
      }
    }
  });

  longestStreakDays = Math.max(longestStreakDays, currentStreak);

  return {
    totalSessions,
    totalMinutes,
    avgDuration: Math.round(avgDuration * 10) / 10,
    mostUsedDivineName,
    mostUsedBreathingType,
    mostUsedSound,
    sessionsThisWeek,
    sessionsThisMonth,
    longestStreakDays
  };
}

/**
 * Calculer les statistiques depuis AsyncStorage (fallback)
 */
async function getKhalwaStatsLocal(userId: string): Promise<KhalwaStats | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const localSessions = stored ? JSON.parse(stored) : [];
    const userSessions = localSessions.filter((s: any) => s.userId === userId && s.completed !== false);

    if (userSessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        avgDuration: 0,
        mostUsedDivineName: '',
        mostUsedBreathingType: '',
        mostUsedSound: '',
        sessionsThisWeek: 0,
        sessionsThisMonth: 0,
        longestStreakDays: 0
      };
    }

    const totalSessions = userSessions.length;
    const totalMinutes = userSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
    const avgDuration = totalMinutes / totalSessions;

    // Calculer les plus utilisés
    const divineNameCounts: Record<string, number> = {};
    const breathingCounts: Record<string, number> = {};
    const soundCounts: Record<string, number> = {};

    userSessions.forEach((s: any) => {
      const nameId = s.divineName?.id || '';
      const breathing = s.breathingType || '';
      const sound = s.soundAmbiance || '';

      divineNameCounts[nameId] = (divineNameCounts[nameId] || 0) + 1;
      breathingCounts[breathing] = (breathingCounts[breathing] || 0) + 1;
      soundCounts[sound] = (soundCounts[sound] || 0) + 1;
    });

    const mostUsedDivineName = Object.keys(divineNameCounts).reduce((a, b) => 
      divineNameCounts[a] > divineNameCounts[b] ? a : b, ''
    );
    const mostUsedBreathingType = Object.keys(breathingCounts).reduce((a, b) => 
      breathingCounts[a] > breathingCounts[b] ? a : b, ''
    );
    const mostUsedSound = Object.keys(soundCounts).reduce((a, b) => 
      soundCounts[a] > soundCounts[b] ? a : b, ''
    );

    // Calculer les sessions de cette semaine et ce mois
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sessionsThisWeek = userSessions.filter((s: any) => {
      const sessionDate = new Date(s.createdAt || 0);
      return sessionDate >= weekAgo;
    }).length;

    const sessionsThisMonth = userSessions.filter((s: any) => {
      const sessionDate = new Date(s.createdAt || 0);
      return sessionDate >= monthAgo;
    }).length;

    // Calculer la série (simplifié)
    const sortedSessions = [...userSessions].sort((a: any, b: any) => 
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

    let longestStreakDays = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    sortedSessions.forEach((s: any) => {
      const sessionDate = new Date(s.createdAt || 0);
      const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        const daysDiff = Math.floor((sessionDay.getTime() - lastDay.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysDiff === 1) {
          currentStreak++;
        } else if (daysDiff > 1) {
          longestStreakDays = Math.max(longestStreakDays, currentStreak);
          currentStreak = 1;
        }
      }

      lastDate = sessionDay;
    });

    longestStreakDays = Math.max(longestStreakDays, currentStreak);

    return {
      totalSessions,
      totalMinutes,
      avgDuration: Math.round(avgDuration * 10) / 10,
      mostUsedDivineName,
      mostUsedBreathingType,
      mostUsedSound,
      sessionsThisWeek,
      sessionsThisMonth,
      longestStreakDays
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques locales:', error);
    return null;
  }
}

