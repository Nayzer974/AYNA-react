/**
 * Service pour calculer les statistiques d'analytics personnelles
 */

import { getUserAnalytics, type AnalyticsEvent } from '@/services/analytics/analytics';
import { getUserUsageStats, getModuleUsageTime, getDailyUsageFrequency, type UsageStats } from '@/services/analytics/usageTracking';
import { loadAllModuleVisits } from '@/services/analytics/moduleTracking';
import { supabase } from '@/services/auth/supabase';
import { APP_CONFIG } from '@/config';

export interface PersonalOverview {
  // Sessions
  sessionsToday: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;

  // Temps passÃ©
  totalTimeSeconds: number;
  totalTimeFormatted: string; // "2h 30min"
  averageSessionMinutes: number;

  // Ã‰crans les plus visitÃ©s
  topScreens: Array<{
    name: string;
    visits: number;
    timeSeconds: number;
  }>;

  // Actions rÃ©alisÃ©es
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
  count?: number; // nombre de rÃ©pÃ©titions
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
    // Charger les Ã©vÃ©nements analytics
    const analytics = await getUserAnalytics(userId);
    const events = analytics.events || [];

    // Normaliser les Ã©vÃ©nements
    const normalizedEvents: AnalyticsEvent[] = (events.map((event: any) => ({
      name: event.event_name || event.name || '',
      properties: event.properties || {},
      timestamp: event.timestamp || (event.created_at ? new Date(event.created_at).getTime() : Date.now()),
      userId: event.user_id || event.userId,
    })) as any[]).filter((e: any) => e.name);

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

    // Compter les sessions (basÃ© sur les Ã©vÃ©nements uniques par jour)
    const sessionsToday = new Set(
      normalizedEvents
        .filter((e: AnalyticsEvent) => e.timestamp >= todayStart)
        .map((e: AnalyticsEvent) => new Date(e.timestamp).toDateString())
    ).size;

    const sessionsThisWeek = new Set(
      normalizedEvents
        .filter((e: AnalyticsEvent) => e.timestamp >= weekStart)
        .map((e: AnalyticsEvent) => new Date(e.timestamp).toDateString())
    ).size;

    const sessionsThisMonth = new Set(
      normalizedEvents
        .filter((e: AnalyticsEvent) => e.timestamp >= monthStart)
        .map((e: AnalyticsEvent) => new Date(e.timestamp).toDateString())
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
      .map((m: { module: string; timeSeconds: number; sessions: number }) => ({
        name: formatModuleName(m.module),
        visits: m.sessions,
        timeSeconds: m.timeSeconds,
      }));

    // Actions rÃ©alisÃ©es
    const actions = {
      dhikr: normalizedEvents.filter((e: AnalyticsEvent) => e.name.includes('dhikr')).length,
      prayers: normalizedEvents.filter((e: AnalyticsEvent) => e.name.includes('prayer')).length,
      notes: normalizedEvents.filter((e: AnalyticsEvent) => e.name.includes('note') || e.name.includes('journal')).length,
      khalwa: normalizedEvents.filter((e: AnalyticsEvent) => e.name.includes('khalwa') || e.name.includes('bayt')).length,
    };

    // Progression (comparer avec période précédente)
    const previousWeekStart = new Date(weekAgo);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEvents = normalizedEvents.filter(
      (e: AnalyticsEvent) => e.timestamp >= previousWeekStart.getTime() && e.timestamp < weekStart
    );
    const currentWeekEvents = normalizedEvents.filter((e: AnalyticsEvent) => e.timestamp >= weekStart);

    const previousMonthStart = new Date(monthAgo);
    previousMonthStart.setDate(previousMonthStart.getDate() - 30);
    const previousMonthEvents = normalizedEvents.filter(
      (e: AnalyticsEvent) => e.timestamp >= previousMonthStart.getTime() && e.timestamp < monthStart
    );
    const currentMonthEvents = normalizedEvents.filter((e: AnalyticsEvent) => e.timestamp >= monthStart);

    const weekSessions = new Set(currentWeekEvents.map((e: AnalyticsEvent) => new Date(e.timestamp).toDateString())).size;
    const prevWeekSessions = new Set(previousWeekEvents.map((e: AnalyticsEvent) => new Date(e.timestamp).toDateString())).size;
    const weekChangePercent = prevWeekSessions > 0
      ? Math.round(((weekSessions - prevWeekSessions) / prevWeekSessions) * 100)
      : weekSessions > 0 ? 100 : 0;

    const monthSessions = new Set(currentMonthEvents.map(e => new Date(e.timestamp).toDateString())).size;
    const prevMonthSessions = new Set(previousMonthEvents.map(e => new Date(e.timestamp).toDateString())).size;
    const monthChangePercent = prevMonthSessions > 0
      ? Math.round(((monthSessions - prevMonthSessions) / prevMonthSessions) * 100)
      : monthSessions > 0 ? 100 : 0;

    // Calculer le temps pour les pÃ©riodes (rÃ©cupÃ©rer toutes les donnÃ©es pour les calculs)
    let weekUsageStats: UsageStats | null = null;
    let monthUsageStats: UsageStats | null = null;
    try {
      // Pour les comparaisons, on rÃ©cupÃ¨re les donnÃ©es des pÃ©riodes spÃ©cifiques
      weekUsageStats = await getUserUsageStats(userId, 7);
      monthUsageStats = await getUserUsageStats(userId, 30);
    } catch (error) {
      console.error('[analyticsStats] Erreur chargement usage stats pÃ©riodes:', error);
    }

    // Pour le temps total, rÃ©cupÃ©rer toutes les donnÃ©es depuis la crÃ©ation
    let totalUsageStats: UsageStats | null = null;
    try {
      // RÃ©cupÃ©rer toutes les donnÃ©es (0 = pas de limite)
      totalUsageStats = await getUserUsageStats(userId, 0);
      if (totalUsageStats) {
        // Utiliser le temps total de toutes les donnÃ©es
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
 * Charge l'historique dÃ©taillÃ© des Ã©vÃ©nements
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

    // Normaliser les Ã©vÃ©nements
    let filteredEvents = events.map((event: any) => ({
      name: event.event_name || event.name || '',
      properties: event.properties || {},
      timestamp: event.timestamp || (event.created_at ? new Date(event.created_at).getTime() : Date.now()),
      userId: event.user_id || event.userId,
    })).filter((e: any) => e.name);

    // Appliquer les filtres
    if (filters?.startDate) {
      const startTime = filters.startDate.getTime();
      filteredEvents = filteredEvents.filter((e: any) => e.timestamp >= startTime);
    }

    if (filters?.endDate) {
      const endTime = filters.endDate.getTime();
      filteredEvents = filteredEvents.filter((e: any) => e.timestamp <= endTime);
    }

    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter((e: any) =>
        filters.eventTypes!.some((type: string) => e.name.toLowerCase().includes(type.toLowerCase()))
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

    // Regrouper les Ã©vÃ©nements dhikr par session (mÃªme timestamp ou dans une fenÃªtre de 5 minutes)
    const groupedItems: EventHistoryItem[] = [];
    const dhikrGroups: Map<string, EventHistoryItem[]> = new Map();

    // SÃ©parer les dhikr des autres Ã©vÃ©nements
    const nonDhikrItems: EventHistoryItem[] = [];

    historyItems.forEach((item: EventHistoryItem) => {
      if (item.type === 'dhikr') {
        // CrÃ©er une clÃ© de session basÃ©e sur le timestamp arrondi Ã  5 minutes
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
    dhikrGroups.forEach((group: EventHistoryItem[], sessionKey: string) => {
      if (group.length === 0) return;

      // Trier par timestamp pour obtenir le premier et le dernier
      group.sort((a: EventHistoryItem, b: EventHistoryItem) => a.timestamp - b.timestamp);
      const firstEvent = group[0];
      const lastEvent = group[group.length - 1];

      // Additionner tous les comptes
      const totalCount = group.reduce((sum: number, item: EventHistoryItem) => sum + (item.count || 1), 0);

      // CrÃ©er un seul Ã©vÃ©nement regroupÃ©
      const groupedItem: EventHistoryItem = {
        id: `dhikr_session_${sessionKey}`,
        type: 'dhikr',
        category: 'Dhikr',
        description: `Dhikr (${totalCount} rÃ©pÃ©titions)`,
        timestamp: firstEvent.timestamp, // Utiliser le timestamp du premier Ã©vÃ©nement
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

    // Combiner les dhikr regroupÃ©s avec les autres Ã©vÃ©nements
    const allItems = [...groupedItems, ...nonDhikrItems];

    // Trier par date (plus rÃ©cent en premier)
    return allItems.sort((a: EventHistoryItem, b: EventHistoryItem) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[analyticsStats] Erreur chargement historique:', error);
    return [];
  }
}

/**
 * CatÃ©gorise un Ã©vÃ©nement
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
 * Obtient la catÃ©gorie d'un Ã©vÃ©nement
 */
function getEventCategory(eventName: string): string {
  const name = eventName.toLowerCase();
  if (name.includes('dhikr')) return 'Dhikr';
  if (name.includes('prayer')) return 'PriÃ¨res';
  if (name.includes('note') || name.includes('journal')) return 'Journal';
  if (name.includes('khalwa') || name.includes('bayt')) return 'MÃ©ditation';
  if (name.includes('module') || name.includes('visit')) return 'Navigation';
  return 'Autre';
}

/**
 * Formate la description d'un Ã©vÃ©nement
 */
function formatEventDescription(eventName: string, properties: any): string {
  const name = eventName.toLowerCase();

  if (name.includes('dhikr')) {
    return `Dhikr ${properties?.count ? `(${properties.count} rÃ©pÃ©titions)` : ''}`;
  }
  if (name.includes('prayer')) {
    return `PriÃ¨re ${properties?.prayer_name || ''}`;
  }
  if (name.includes('note') || name.includes('journal')) {
    return 'Note de journal';
  }
  if (name.includes('khalwa') || name.includes('bayt')) {
    const duration = properties?.duration;
    if (duration) {
      // La durÃ©e est en minutes, formater correctement
      const minutes = Math.round(duration);
      return `MÃ©ditation ${minutes > 0 ? `(${minutes}min)` : ''}`;
    }
    return 'MÃ©ditation';
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


