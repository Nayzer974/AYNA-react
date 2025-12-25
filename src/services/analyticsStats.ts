/**
 * Service pour calculer les statistiques d'analytics personnelles
 */

import { getUserAnalytics, type AnalyticsEvent } from './analytics';
import { getUserUsageStats, getModuleUsageTime, getDailyUsageFrequency, type UsageStats } from './usageTracking';
import { loadAllModuleVisits } from './moduleTracking';
import { supabase } from './supabase';
import { APP_CONFIG } from '@/config';

export interface PersonalOverview {
  // Sessions
  sessionsToday: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  
  // Temps passé
  totalTimeSeconds: number;
  totalTimeFormatted: string; // "2h 30min"
  averageSessionMinutes: number;
  
  // Écrans les plus visités
  topScreens: Array<{
    name: string;
    visits: number;
    timeSeconds: number;
  }>;
  
  // Actions réalisées
  actions: {
    dhikr: number;
    prayers: number;
    notes: number;
    khalwa: number;
    [key: string]: number;
  };
  
  // Progression
  progression: {
    week: {
      sessions: number;
      timeSeconds: number;
      changePercent: number; // +20% ou -10%
    };
    month: {
      sessions: number;
      timeSeconds: number;
      changePercent: number;
    };
  };
}

export interface EventHistoryItem {
  id: string;
  type: 'dhikr' | 'prayer' | 'note' | 'khalwa' | 'module_visit' | 'other';
  category: string;
  description: string;
  timestamp: number;
  date: string;
  duration?: number; // en secondes
  score?: number;
  count?: number; // nombre de répétitions
  metadata?: Record<string, any>;
}

export interface AnalyticsInsights {
  summary: string;
  personalizedAdvice: string[];
  trends: Array<{
    type: 'increase' | 'decrease' | 'stable';
    description: string;
    period: string;
  }>;
  recommendations: string[];
}

/**
 * Calcule la vue d'ensemble personnelle
 */
export async function calculatePersonalOverview(
  userId: string,
  timeRange: 'day' | 'week' | 'month' = 'month'
): Promise<PersonalOverview> {
  try {
    // Charger les événements analytics
    const analytics = await getUserAnalytics(userId);
    const events = analytics.events || [];
    
    // Normaliser les événements
    const normalizedEvents = events.map((event: any) => ({
      name: event.event_name || event.name || '',
      properties: event.properties || {},
      timestamp: event.timestamp || (event.created_at ? new Date(event.created_at).getTime() : Date.now()),
      userId: event.user_id || event.userId,
    })).filter((e: any) => e.name);
    
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekStart = weekAgo.getTime();
    
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    monthAgo.setHours(0, 0, 0, 0);
    const monthStart = monthAgo.getTime();
    
    // Compter les sessions (basé sur les événements uniques par jour)
    const sessionsToday = new Set(
      normalizedEvents
        .filter(e => e.timestamp >= todayStart)
        .map(e => new Date(e.timestamp).toDateString())
    ).size;
    
    const sessionsThisWeek = new Set(
      normalizedEvents
        .filter(e => e.timestamp >= weekStart)
        .map(e => new Date(e.timestamp).toDateString())
    ).size;
    
    const sessionsThisMonth = new Set(
      normalizedEvents
        .filter(e => e.timestamp >= monthStart)
        .map(e => new Date(e.timestamp).toDateString())
    ).size;
    
    // Charger les stats d'utilisation (récupérer toutes les données depuis la création du compte)
    let usageStats: UsageStats | null = null;
    try {
      // Récupérer toutes les données (0 = pas de limite de date)
      usageStats = await getUserUsageStats(userId, 0);
    } catch (error) {
      console.error('[analyticsStats] Erreur chargement usage stats:', error);
    }
    
    const totalTimeSeconds = usageStats?.totalTimeSeconds || 0;
    const totalTimeFormatted = formatTime(totalTimeSeconds);
    
    // Calculer la moyenne par session
    const totalSessions = usageStats?.moduleStats 
      ? Object.values(usageStats.moduleStats).reduce((sum, stat) => sum + stat.sessions, 0)
      : 0;
    const averageSessionMinutes = totalSessions > 0 
      ? Math.round((totalTimeSeconds / 60) / totalSessions)
      : 0;
    
    // Top écrans visités
    const moduleUsage = await getModuleUsageTime(userId, 30);
    const topScreens = moduleUsage
      .slice(0, 5)
      .map(m => ({
        name: formatModuleName(m.module),
        visits: m.sessions,
        timeSeconds: m.timeSeconds,
      }));
    
    // Actions réalisées
    const actions = {
      dhikr: normalizedEvents.filter(e => e.name.includes('dhikr')).length,
      prayers: normalizedEvents.filter(e => e.name.includes('prayer')).length,
      notes: normalizedEvents.filter(e => e.name.includes('note') || e.name.includes('journal')).length,
      khalwa: normalizedEvents.filter(e => e.name.includes('khalwa') || e.name.includes('bayt')).length,
    };
    
    // Progression (comparer avec période précédente)
    const previousWeekStart = new Date(weekAgo);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEvents = normalizedEvents.filter(
      e => e.timestamp >= previousWeekStart.getTime() && e.timestamp < weekStart
    );
    const currentWeekEvents = normalizedEvents.filter(e => e.timestamp >= weekStart);
    
    const previousMonthStart = new Date(monthAgo);
    previousMonthStart.setDate(previousMonthStart.getDate() - 30);
    const previousMonthEvents = normalizedEvents.filter(
      e => e.timestamp >= previousMonthStart.getTime() && e.timestamp < monthStart
    );
    const currentMonthEvents = normalizedEvents.filter(e => e.timestamp >= monthStart);
    
    const weekSessions = new Set(currentWeekEvents.map(e => new Date(e.timestamp).toDateString())).size;
    const prevWeekSessions = new Set(previousWeekEvents.map(e => new Date(e.timestamp).toDateString())).size;
    const weekChangePercent = prevWeekSessions > 0 
      ? Math.round(((weekSessions - prevWeekSessions) / prevWeekSessions) * 100)
      : weekSessions > 0 ? 100 : 0;
    
    const monthSessions = new Set(currentMonthEvents.map(e => new Date(e.timestamp).toDateString())).size;
    const prevMonthSessions = new Set(previousMonthEvents.map(e => new Date(e.timestamp).toDateString())).size;
    const monthChangePercent = prevMonthSessions > 0
      ? Math.round(((monthSessions - prevMonthSessions) / prevMonthSessions) * 100)
      : monthSessions > 0 ? 100 : 0;
    
    // Calculer le temps pour les périodes (récupérer toutes les données pour les calculs)
    let weekUsageStats: UsageStats | null = null;
    let monthUsageStats: UsageStats | null = null;
    try {
      // Pour les comparaisons, on récupère les données des périodes spécifiques
      weekUsageStats = await getUserUsageStats(userId, 7);
      monthUsageStats = await getUserUsageStats(userId, 30);
    } catch (error) {
      console.error('[analyticsStats] Erreur chargement usage stats périodes:', error);
    }
    
    // Pour le temps total, récupérer toutes les données depuis la création
    let totalUsageStats: UsageStats | null = null;
    try {
      // Récupérer toutes les données (0 = pas de limite)
      totalUsageStats = await getUserUsageStats(userId, 0);
      if (totalUsageStats) {
        // Utiliser le temps total de toutes les données
        usageStats = totalUsageStats;
      }
    } catch (error) {
      console.error('[analyticsStats] Erreur chargement usage stats total:', error);
    }
    
    return {
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth,
      totalTimeSeconds,
      totalTimeFormatted,
      averageSessionMinutes,
      topScreens,
      actions,
      progression: {
        week: {
          sessions: weekSessions,
          timeSeconds: weekUsageStats?.totalTimeSeconds || 0,
          changePercent: weekChangePercent,
        },
        month: {
          sessions: monthSessions,
          timeSeconds: monthUsageStats?.totalTimeSeconds || 0,
          changePercent: monthChangePercent,
        },
      },
    };
  } catch (error) {
    console.error('[analyticsStats] Erreur calcul vue d\'ensemble:', error);
    return {
      sessionsToday: 0,
      sessionsThisWeek: 0,
      sessionsThisMonth: 0,
      totalTimeSeconds: 0,
      totalTimeFormatted: '0min',
      averageSessionMinutes: 0,
      topScreens: [],
      actions: { dhikr: 0, prayers: 0, notes: 0, khalwa: 0 },
      progression: {
        week: { sessions: 0, timeSeconds: 0, changePercent: 0 },
        month: { sessions: 0, timeSeconds: 0, changePercent: 0 },
      },
    };
  }
}

/**
 * Charge l'historique détaillé des événements
 */
export async function loadEventHistory(
  userId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: string[];
  }
): Promise<EventHistoryItem[]> {
  try {
    const analytics = await getUserAnalytics(userId);
    const events = analytics.events || [];
    
    // Normaliser les événements
    let filteredEvents = events.map((event: any) => ({
      name: event.event_name || event.name || '',
      properties: event.properties || {},
      timestamp: event.timestamp || (event.created_at ? new Date(event.created_at).getTime() : Date.now()),
      userId: event.user_id || event.userId,
    })).filter((e: any) => e.name);
    
    // Appliquer les filtres
    if (filters?.startDate) {
      const startTime = filters.startDate.getTime();
      filteredEvents = filteredEvents.filter(e => e.timestamp >= startTime);
    }
    
    if (filters?.endDate) {
      const endTime = filters.endDate.getTime();
      filteredEvents = filteredEvents.filter(e => e.timestamp <= endTime);
    }
    
    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter(e => 
        filters.eventTypes!.some(type => e.name.toLowerCase().includes(type.toLowerCase()))
      );
    }
    
    // Convertir en EventHistoryItem et exclure le type "other"
    let historyItems: EventHistoryItem[] = filteredEvents
      .map((event: any) => {
        const eventType = categorizeEvent(event.name);
        const description = formatEventDescription(event.name, event.properties);
        
        return {
          id: `${event.timestamp}_${event.name}`,
          type: eventType,
          category: getEventCategory(event.name),
          description,
          timestamp: event.timestamp,
          date: new Date(event.timestamp).toISOString(),
          duration: event.properties?.duration,
          score: event.properties?.score,
          count: event.properties?.count || event.properties?.click_count || 1,
          metadata: event.properties,
        };
      })
      .filter((item: EventHistoryItem) => item.type !== 'other'); // Exclure le type "other"
    
    // Regrouper les événements dhikr par session (même timestamp ou dans une fenêtre de 5 minutes)
    const groupedItems: EventHistoryItem[] = [];
    const dhikrGroups: Map<string, EventHistoryItem[]> = new Map();
    
    // Séparer les dhikr des autres événements
    const nonDhikrItems: EventHistoryItem[] = [];
    
    historyItems.forEach(item => {
      if (item.type === 'dhikr') {
        // Créer une clé de session basée sur le timestamp arrondi à 5 minutes
        const sessionKey = Math.floor(item.timestamp / (5 * 60 * 1000)) * (5 * 60 * 1000);
        const key = `${sessionKey}`;
        
        if (!dhikrGroups.has(key)) {
          dhikrGroups.set(key, []);
        }
        dhikrGroups.get(key)!.push(item);
      } else {
        nonDhikrItems.push(item);
      }
    });
    
    // Regrouper les dhikr par session
    dhikrGroups.forEach((group, sessionKey) => {
      if (group.length === 0) return;
      
      // Trier par timestamp pour obtenir le premier et le dernier
      group.sort((a, b) => a.timestamp - b.timestamp);
      const firstEvent = group[0];
      const lastEvent = group[group.length - 1];
      
      // Additionner tous les comptes
      const totalCount = group.reduce((sum, item) => sum + (item.count || 1), 0);
      
      // Créer un seul événement regroupé
      const groupedItem: EventHistoryItem = {
        id: `dhikr_session_${sessionKey}`,
        type: 'dhikr',
        category: 'Dhikr',
        description: `Dhikr (${totalCount} répétitions)`,
        timestamp: firstEvent.timestamp, // Utiliser le timestamp du premier événement
        date: firstEvent.date,
        count: totalCount,
        metadata: {
          ...firstEvent.metadata,
          sessionStart: firstEvent.timestamp,
          sessionEnd: lastEvent.timestamp,
          eventsCount: group.length,
        },
      };
      
      groupedItems.push(groupedItem);
    });
    
    // Combiner les dhikr regroupés avec les autres événements
    const allItems = [...groupedItems, ...nonDhikrItems];
    
    // Trier par date (plus récent en premier)
    return allItems.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[analyticsStats] Erreur chargement historique:', error);
    return [];
  }
}

/**
 * Catégorise un événement
 */
function categorizeEvent(eventName: string): EventHistoryItem['type'] {
  const name = eventName.toLowerCase();
  if (name.includes('dhikr')) return 'dhikr';
  if (name.includes('prayer')) return 'prayer';
  if (name.includes('note') || name.includes('journal')) return 'note';
  if (name.includes('khalwa') || name.includes('bayt')) return 'khalwa';
  if (name.includes('module') || name.includes('visit')) return 'module_visit';
  return 'other';
}

/**
 * Obtient la catégorie d'un événement
 */
function getEventCategory(eventName: string): string {
  const name = eventName.toLowerCase();
  if (name.includes('dhikr')) return 'Dhikr';
  if (name.includes('prayer')) return 'Prières';
  if (name.includes('note') || name.includes('journal')) return 'Journal';
  if (name.includes('khalwa') || name.includes('bayt')) return 'Méditation';
  if (name.includes('module') || name.includes('visit')) return 'Navigation';
  return 'Autre';
}

/**
 * Formate la description d'un événement
 */
function formatEventDescription(eventName: string, properties: any): string {
  const name = eventName.toLowerCase();
  
  if (name.includes('dhikr')) {
    return `Dhikr ${properties?.count ? `(${properties.count} répétitions)` : ''}`;
  }
  if (name.includes('prayer')) {
    return `Prière ${properties?.prayer_name || ''}`;
  }
  if (name.includes('note') || name.includes('journal')) {
    return 'Note de journal';
  }
  if (name.includes('khalwa') || name.includes('bayt')) {
    const duration = properties?.duration;
    if (duration) {
      // La durée est en minutes, formater correctement
      const minutes = Math.round(duration);
      return `Méditation ${minutes > 0 ? `(${minutes}min)` : ''}`;
    }
    return 'Méditation';
  }
  if (name.includes('module') || name.includes('visit')) {
    return `Visite: ${properties?.module || eventName}`;
  }
  
  return eventName;
}

/**
 * Formate le nom d'un module
 */
function formatModuleName(module: string): string {
  const moduleMap: Record<string, string> = {
    'sabilanur': 'Sabila Nur',
    'dairat-an-nur': 'Dairat an Nur',
    'nur-shifa': 'Nur & Shifa',
    'asma': 'Asma',
    'journal': 'Journal',
    'chat': 'AYNA',
    'quran': 'Quran',
  };
  return moduleMap[module] || module;
}

/**
 * Formate le temps en heures et minutes
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

