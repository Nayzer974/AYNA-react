/**
 * Service d'insights IA pour analyser les patterns utilisateur
 */

import { UserProfile } from '@/types/user';
import { AnalyticsEvent } from '@/services/analytics/analytics';

export interface UserInsight {
  id: string;
  type: 'pattern' | 'recommendation' | 'achievement' | 'trend';
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  actionable?: boolean;
  actionLabel?: string;
}

export async function generateInsights(
  user: UserProfile,
  events: AnalyticsEvent[]
): Promise<UserInsight[]> {
  const insights: UserInsight[] = [];

  // Analyse des patterns
  const dhikrPattern = analyzeDhikrPattern(events);
  if (dhikrPattern.peakHour) {
    insights.push({
      id: 'pattern-dhikr-time',
      type: 'pattern',
      title: 'Moment de prédilection',
      description: `Vous êtes plus actif dans le dhikr autour de ${dhikrPattern.peakHour}h`,
      icon: '⏰',
      priority: 'medium',
    });
  }

  // Recommandations basées sur les analytics
  if (user.analytics.streak > 0 && user.analytics.streak < 7) {
    insights.push({
      id: 'recommendation-streak',
      type: 'recommendation',
      title: 'Continuez votre série !',
      description: `Vous êtes à ${user.analytics.streak} jours consécutifs. Continuez pour atteindre 7 jours !`,
      icon: '🔥',
      priority: 'high',
      actionable: true,
      actionLabel: 'Voir les défis',
    });
  }

  // Tendances
  if (user.analytics.totalDhikr > user.analytics.totalNotes * 5) {
    insights.push({
      id: 'trend-dhikr-focus',
      type: 'trend',
      title: 'Focus sur le dhikr',
      description: 'Vous vous concentrez beaucoup sur le dhikr. Pensez aussi à écrire dans votre journal !',
      icon: '📝',
      priority: 'low',
      actionable: true,
      actionLabel: 'Ouvrir le journal',
    });
  }

  return insights;
}

function analyzeDhikrPattern(events: AnalyticsEvent[]): { peakHour?: number; frequency: number } {
  // Filtrer les événements dhikr en vérifiant que name existe
  const dhikrEvents = events.filter(e => e.name && typeof e.name === 'string' && e.name.toLowerCase().includes('dhikr'));
  const hours: Record<number, number> = {};

  dhikrEvents.forEach(event => {
    if (event.timestamp) {
      const date = new Date(event.timestamp);
      const hour = date.getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    }
  });

  let peakHour: number | undefined;
  let maxCount = 0;

  Object.entries(hours).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour);
    }
  });

  return { peakHour, frequency: dhikrEvents.length };
}






