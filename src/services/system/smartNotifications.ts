/**
 * Service de Notifications Intelligentes
 * 
 * FonctionnalitÃ©s :
 * - Rappels de priÃ¨res personnalisÃ©s basÃ©s sur les habitudes
 * - Suggestions contextuelles basÃ©es sur l'activitÃ©
 * - Analyse des patterns d'utilisation
 * - Notifications adaptatives selon le contexte
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimesByCoords } from '@/services/content/prayerServices';
import * as Location from 'expo-location';
import { supabase } from '@/services/auth/supabase';
// expo-notifications supprimÃ©
// import {
//   ensureNotificationPermissions,
//   scheduleAynaLocalNotifications,
//   type AynaLocalNotification,
// } from './expoNotifications';

// Types
export interface UserHabits {
  // Habitudes de priÃ¨re
  prayerPatterns: {
    [prayerName: string]: {
      averageTime: string; // HH:MM - heure moyenne oÃ¹ l'utilisateur prie
      completionRate: number; // 0-1 - taux de complÃ©tion
      preferredReminderOffset: number; // minutes avant la priÃ¨re (par dÃ©faut 10)
      lastCompleted?: string; // ISO date
    };
  };

  // Habitudes de dhikr
  dhikrPatterns: {
    preferredTimes: string[]; // ['08:00', '14:00', '20:00']
    averageDuration: number; // minutes
    frequency: number; // fois par jour
  };

  // Habitudes de journal
  journalPatterns: {
    preferredTimes: string[]; // ['20:00', '21:00']
    frequency: number; // fois par semaine
  };

  // Habitudes gÃ©nÃ©rales
  activeHours: {
    start: string; // HH:MM
    end: string; // HH:MM
  };

  // DerniÃ¨re activitÃ©
  lastActivity: {
    type: 'prayer' | 'dhikr' | 'journal' | 'quran' | 'meditation';
    timestamp: string; // ISO date
  } | null;
}

export interface SmartNotification {
  id: string;
  type: 'prayer' | 'dhikr' | 'journal' | 'suggestion' | 'verse' | 'reminder';
  title: string;
  body: string;
  scheduledTime: Date;
  priority: 'low' | 'medium' | 'high';
  data?: Record<string, any>;
}

export interface NotificationSettings {
  enabled: boolean;
  prayerReminders: {
    enabled: boolean;
    offsets: number[]; // [10, 5, 0] minutes avant
    adaptive: boolean; // S'adapte aux habitudes
  };
  dhikrReminders: {
    enabled: boolean;
    times: string[]; // ['08:00', '14:00']
    adaptive: boolean;
  };
  journalReminders: {
    enabled: boolean;
    times: string[]; // ['20:00']
    adaptive: boolean;
  };
  suggestions: {
    enabled: boolean;
    frequency: 'low' | 'medium' | 'high';
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
  respectPrayerTime: boolean; // Ne pas notifier pendant les priÃ¨res
}

const HABITS_KEY = '@ayna_user_habits';
const SETTINGS_KEY = '@ayna_notification_settings';
const NOTIFICATIONS_KEY = '@ayna_scheduled_notifications';

// ============================================================================
// Gestion des Habitudes Utilisateur
// ============================================================================

/**
 * Charge les habitudes utilisateur depuis le stockage
 */
export async function loadUserHabits(userId: string): Promise<UserHabits> {
  try {
    const stored = await AsyncStorage.getItem(`${HABITS_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }

    // Habitudes par dÃ©faut
    return {
      prayerPatterns: {},
      dhikrPatterns: {
        preferredTimes: ['08:00', '14:00', '20:00'],
        averageDuration: 5,
        frequency: 1,
      },
      journalPatterns: {
        preferredTimes: ['20:00'],
        frequency: 3,
      },
      activeHours: {
        start: '06:00',
        end: '23:00',
      },
      lastActivity: null,
    };
  } catch {
    return {
      prayerPatterns: {},
      dhikrPatterns: {
        preferredTimes: ['08:00', '14:00', '20:00'],
        averageDuration: 5,
        frequency: 1,
      },
      journalPatterns: {
        preferredTimes: ['20:00'],
        frequency: 3,
      },
      activeHours: {
        start: '06:00',
        end: '23:00',
      },
      lastActivity: null,
    };
  }
}

/**
 * Sauvegarde les habitudes utilisateur
 */
export async function saveUserHabits(userId: string, habits: UserHabits): Promise<void> {
  try {
    await AsyncStorage.setItem(`${HABITS_KEY}_${userId}`, JSON.stringify(habits));

    // Synchroniser avec Supabase si possible
    if (supabase) {
      await supabase.from('profiles').update({
        notification_habits: habits,
      }).eq('id', userId);
    }
  } catch {
    // Erreur silencieuse
  }
}

/**
 * Met Ã  jour les habitudes aprÃ¨s une activitÃ©
 */
export async function updateHabitsFromActivity(
  userId: string,
  activityType: 'prayer' | 'dhikr' | 'journal' | 'quran' | 'meditation',
  metadata?: {
    prayerName?: string;
    time?: string; // HH:MM
    duration?: number; // minutes
  }
): Promise<void> {
  const habits = await loadUserHabits(userId);
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Mettre Ã  jour la derniÃ¨re activitÃ©
  habits.lastActivity = {
    type: activityType,
    timestamp: now.toISOString(),
  };

  // Mettre Ã  jour les patterns selon le type d'activitÃ©
  if (activityType === 'prayer' && metadata?.prayerName && metadata?.time) {
    const prayerName = metadata.prayerName;
    if (!habits.prayerPatterns[prayerName]) {
      habits.prayerPatterns[prayerName] = {
        averageTime: metadata.time,
        completionRate: 1,
        preferredReminderOffset: 10,
        lastCompleted: now.toISOString(),
      };
    } else {
      const pattern = habits.prayerPatterns[prayerName];
      // Calculer la moyenne pondÃ©rÃ©e du temps
      const [avgHours, avgMinutes] = pattern.averageTime.split(':').map(Number);
      const [currentHours, currentMinutes] = metadata.time.split(':').map(Number);

      // Moyenne mobile avec facteur d'apprentissage
      const learningFactor = 0.3;
      const newAvgHours = Math.round(avgHours * (1 - learningFactor) + currentHours * learningFactor);
      const newAvgMinutes = Math.round(avgMinutes * (1 - learningFactor) + currentMinutes * learningFactor);

      pattern.averageTime = `${String(newAvgHours).padStart(2, '0')}:${String(newAvgMinutes).padStart(2, '0')}`;
      pattern.completionRate = Math.min(1, pattern.completionRate + 0.1);
      pattern.lastCompleted = now.toISOString();
    }
  } else if (activityType === 'dhikr' && metadata?.time) {
    // Mettre Ã  jour les patterns de dhikr
    if (!habits.dhikrPatterns.preferredTimes.includes(metadata.time)) {
      habits.dhikrPatterns.preferredTimes.push(metadata.time);
      // Garder seulement les 5 meilleurs moments
      habits.dhikrPatterns.preferredTimes = habits.dhikrPatterns.preferredTimes.slice(0, 5);
    }
    if (metadata.duration) {
      habits.dhikrPatterns.averageDuration = Math.round(
        habits.dhikrPatterns.averageDuration * 0.7 + metadata.duration * 0.3
      );
    }
    habits.dhikrPatterns.frequency = Math.min(7, habits.dhikrPatterns.frequency + 0.1);
  } else if (activityType === 'journal' && metadata?.time) {
    // Mettre Ã  jour les patterns de journal
    if (!habits.journalPatterns.preferredTimes.includes(metadata.time)) {
      habits.journalPatterns.preferredTimes.push(metadata.time);
      habits.journalPatterns.preferredTimes = habits.journalPatterns.preferredTimes.slice(0, 3);
    }
    habits.journalPatterns.frequency = Math.min(7, habits.journalPatterns.frequency + 0.1);
  }

  // Mettre Ã  jour les heures actives
  const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
  const [startHours] = habits.activeHours.start.split(':').map(Number);
  const [endHours] = habits.activeHours.end.split(':').map(Number);

  if (currentHours < startHours || (currentHours === startHours && currentMinutes < 0)) {
    habits.activeHours.start = currentTime;
  }
  if (currentHours > endHours || (currentHours === endHours && currentMinutes > 0)) {
    habits.activeHours.end = currentTime;
  }

  await saveUserHabits(userId, habits);
}

// ============================================================================
// Gestion des ParamÃ¨tres de Notifications
// ============================================================================

/**
 * Charge les paramÃ¨tres de notifications
 */
export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // ParamÃ¨tres par dÃ©faut
    return {
      enabled: true,
      prayerReminders: {
        enabled: true,
        offsets: [10, 5, 0], // 10 min avant, 5 min avant, Ã  l'heure
        adaptive: true,
      },
      dhikrReminders: {
        enabled: true,
        times: ['08:00', '14:00', '20:00'],
        adaptive: true,
      },
      journalReminders: {
        enabled: true,
        times: ['20:00'],
        adaptive: true,
      },
      suggestions: {
        enabled: true,
        frequency: 'medium',
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
      respectPrayerTime: true,
    };
  } catch {
    return {
      enabled: true,
      prayerReminders: {
        enabled: true,
        offsets: [10, 5, 0],
        adaptive: true,
      },
      dhikrReminders: {
        enabled: true,
        times: ['08:00', '14:00', '20:00'],
        adaptive: true,
      },
      journalReminders: {
        enabled: true,
        times: ['20:00'],
        adaptive: true,
      },
      suggestions: {
        enabled: true,
        frequency: 'medium',
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
      respectPrayerTime: true,
    };
  }
}

/**
 * Sauvegarde les paramÃ¨tres de notifications
 */
export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Erreur silencieuse
  }
}

// ============================================================================
// GÃ©nÃ©ration de Notifications Intelligentes
// ============================================================================

/**
 * GÃ©nÃ¨re les notifications de priÃ¨res personnalisÃ©es
 */
export async function generatePrayerNotifications(
  userId: string,
  habits: UserHabits,
  settings: NotificationSettings
): Promise<SmartNotification[]> {
  if (!settings.enabled || !settings.prayerReminders.enabled) {
    return [];
  }

  const notifications: SmartNotification[] = [];

  try {
    // IMPORTANT (prod): ne pas dÃ©clencher un prompt de localisation au dÃ©marrage
    // Si l'utilisateur n'a pas donnÃ© la permission, on ne gÃ©nÃ¨re pas de notifications de priÃ¨re.
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      return [];
    }

    const location = await Location.getCurrentPositionAsync({});
    const response = await getPrayerTimesByCoords(
      location.coords.latitude,
      location.coords.longitude
    );

    if (!response?.data?.timings) {
      return [];
    }

    const timings = response.data.timings;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Pour chaque priÃ¨re
    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const prayerName of prayerNames) {
      const prayerTimeStr = timings[prayerName];
      if (!prayerTimeStr) continue;

      const [hours, minutes] = prayerTimeStr.split(':').map(Number);
      const prayerTime = new Date(today);
      prayerTime.setHours(hours, minutes, 0, 0);

      // Si la priÃ¨re est dÃ©jÃ  passÃ©e, passer Ã  la suivante
      if (prayerTime.getTime() <= now.getTime()) {
        continue;
      }

      // DÃ©terminer les offsets selon les habitudes
      let offsets = settings.prayerReminders.offsets;
      if (settings.prayerReminders.adaptive && habits.prayerPatterns[prayerName]) {
        const pattern = habits.prayerPatterns[prayerName];
        // Utiliser l'offset prÃ©fÃ©rÃ© de l'utilisateur
        offsets = [pattern.preferredReminderOffset, Math.max(5, pattern.preferredReminderOffset - 5), 0];
      }

      // GÃ©nÃ©rer les notifications pour chaque offset
      for (const offset of offsets) {
        const notificationTime = new Date(prayerTime.getTime() - offset * 60 * 1000);

        // VÃ©rifier les heures silencieuses
        if (isInQuietHours(notificationTime, settings.quietHours)) {
          continue;
        }

        // VÃ©rifier si on respecte le temps de priÃ¨re
        if (settings.respectPrayerTime && isDuringPrayerTime(notificationTime, timings)) {
          continue;
        }

        let title = '';
        let body = '';

        if (offset === 0) {
          title = `Adhan ${prayerName}`;
          body = `Il est temps pour la priÃ¨re ${prayerName}`;
        } else {
          title = `Rappel ${prayerName}`;
          body = `La priÃ¨re ${prayerName} approche dans ${offset} minute${offset > 1 ? 's' : ''}`;
        }

        // Personnaliser selon les habitudes
        if (habits.prayerPatterns[prayerName]?.completionRate < 0.5) {
          body += ' - N\'oubliez pas votre moment spirituel';
        }

        notifications.push({
          id: `prayer_${prayerName}_${notificationTime.toISOString()}`,
          type: 'prayer',
          title,
          body,
          scheduledTime: notificationTime,
          priority: offset === 0 ? 'high' : 'medium',
          data: {
            prayerName,
            prayerTime: prayerTime.toISOString(),
            offset,
          },
        });
      }
    }
  } catch (error) {
    // Erreur silencieuse
  }

  return notifications;
}

/**
 * GÃ©nÃ¨re les notifications de dhikr personnalisÃ©es
 */
export async function generateDhikrNotifications(
  userId: string,
  habits: UserHabits,
  settings: NotificationSettings
): Promise<SmartNotification[]> {
  if (!settings.enabled || !settings.dhikrReminders.enabled) {
    return [];
  }

  const notifications: SmartNotification[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Utiliser les temps prÃ©fÃ©rÃ©s de l'utilisateur si adaptatif
  let reminderTimes = settings.dhikrReminders.times;
  if (settings.dhikrReminders.adaptive && habits.dhikrPatterns.preferredTimes.length > 0) {
    reminderTimes = habits.dhikrPatterns.preferredTimes;
  }

  for (const timeStr of reminderTimes) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const reminderTime = new Date(today);
    reminderTime.setHours(hours, minutes, 0, 0);

    // Si l'heure est dÃ©jÃ  passÃ©e, passer Ã  demain
    if (reminderTime.getTime() <= now.getTime()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    // VÃ©rifier les heures silencieuses
    if (isInQuietHours(reminderTime, settings.quietHours)) {
      continue;
    }

    // Personnaliser le message selon les habitudes
    let body = 'N\'oubliez pas votre moment de dhikr quotidien';
    if (habits.dhikrPatterns.averageDuration > 0) {
      body += ` (habituellement ${habits.dhikrPatterns.averageDuration} min)`;
    }

    notifications.push({
      id: `dhikr_${reminderTime.toISOString()}`,
      type: 'dhikr',
      title: 'Rappel de Dhikr',
      body,
      scheduledTime: reminderTime,
      priority: 'medium',
      data: {
        preferredTime: timeStr,
      },
    });
  }

  return notifications;
}

/**
 * GÃ©nÃ¨re les notifications de journal personnalisÃ©es
 */
export async function generateJournalNotifications(
  userId: string,
  habits: UserHabits,
  settings: NotificationSettings
): Promise<SmartNotification[]> {
  if (!settings.enabled || !settings.journalReminders.enabled) {
    return [];
  }

  const notifications: SmartNotification[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Utiliser les temps prÃ©fÃ©rÃ©s de l'utilisateur si adaptatif
  let reminderTimes = settings.journalReminders.times;
  if (settings.journalReminders.adaptive && habits.journalPatterns.preferredTimes.length > 0) {
    reminderTimes = habits.journalPatterns.preferredTimes;
  }

  for (const timeStr of reminderTimes) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const reminderTime = new Date(today);
    reminderTime.setHours(hours, minutes, 0, 0);

    // Si l'heure est dÃ©jÃ  passÃ©e, passer Ã  demain
    if (reminderTime.getTime() <= now.getTime()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    // VÃ©rifier les heures silencieuses
    if (isInQuietHours(reminderTime, settings.quietHours)) {
      continue;
    }

    // Personnaliser le message
    let body = 'Prenez un moment pour Ã©crire dans votre journal spirituel';
    const daysSinceLastJournal = habits.lastActivity?.type === 'journal'
      ? Math.floor((now.getTime() - new Date(habits.lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastJournal > 3) {
      body = 'Il y a quelques jours que vous n\'avez pas Ã©crit. Prenez un moment pour votre journal';
    }

    notifications.push({
      id: `journal_${reminderTime.toISOString()}`,
      type: 'journal',
      title: 'Rappel de Journal',
      body,
      scheduledTime: reminderTime,
      priority: 'low',
      data: {
        preferredTime: timeStr,
      },
    });
  }

  return notifications;
}

/**
 * GÃ©nÃ¨re des suggestions contextuelles basÃ©es sur les habitudes
 */
export async function generateSuggestions(
  userId: string,
  habits: UserHabits,
  settings: NotificationSettings
): Promise<SmartNotification[]> {
  if (!settings.enabled || !settings.suggestions.enabled) {
    return [];
  }

  const notifications: SmartNotification[] = [];
  const now = new Date();

  // Analyser les patterns pour gÃ©nÃ©rer des suggestions
  const suggestions: Array<{ time: Date; message: string; priority: 'low' | 'medium' | 'high' }> = [];

  // Suggestion si l'utilisateur n'a pas fait de dhikr aujourd'hui
  const lastDhikr = habits.lastActivity?.type === 'dhikr'
    ? new Date(habits.lastActivity.timestamp)
    : null;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!lastDhikr || lastDhikr.getTime() < todayStart.getTime()) {
    // SuggÃ©rer un moment de dhikr dans les prochaines heures
    const suggestionTime = new Date(now);
    suggestionTime.setHours(now.getHours() + 2, 0, 0, 0);

    if (suggestionTime.getTime() > now.getTime() && !isInQuietHours(suggestionTime, settings.quietHours)) {
      suggestions.push({
        time: suggestionTime,
        message: 'Vous n\'avez pas encore fait de dhikr aujourd\'hui. Un moment spirituel vous ferait du bien',
        priority: 'medium',
      });
    }
  }

  // Suggestion si l'utilisateur a une sÃ©rie de priÃ¨res manquÃ©es
  const missedPrayers = Object.entries(habits.prayerPatterns)
    .filter(([_, pattern]) => {
      if (!pattern.lastCompleted) return true;
      const lastCompleted = new Date(pattern.lastCompleted);
      return lastCompleted.getTime() < todayStart.getTime();
    })
    .map(([name]) => name);

  if (missedPrayers.length > 0) {
    const suggestionTime = new Date(now);
    suggestionTime.setHours(now.getHours() + 1, 0, 0, 0);

    if (suggestionTime.getTime() > now.getTime() && !isInQuietHours(suggestionTime, settings.quietHours)) {
      suggestions.push({
        time: suggestionTime,
        message: `Vous avez ${missedPrayers.length} priÃ¨re${missedPrayers.length > 1 ? 's' : ''} Ã  rattraper aujourd'hui`,
        priority: 'high',
      });
    }
  }

  // Convertir en notifications selon la frÃ©quence
  const frequencyMultiplier = settings.suggestions.frequency === 'high' ? 1 :
    settings.suggestions.frequency === 'medium' ? 2 : 3;

  for (let i = 0; i < suggestions.length; i += frequencyMultiplier) {
    const suggestion = suggestions[i];
    notifications.push({
      id: `suggestion_${suggestion.time.toISOString()}_${i}`,
      type: 'suggestion',
      title: 'Suggestion AYNA',
      body: suggestion.message,
      scheduledTime: suggestion.time,
      priority: suggestion.priority,
    });
  }

  return notifications;
}

// ============================================================================
// Fonctions Utilitaires
// ============================================================================

/**
 * VÃ©rifie si une heure est dans les heures silencieuses
 */
function isInQuietHours(time: Date, quietHours: NotificationSettings['quietHours']): boolean {
  if (!quietHours.enabled) return false;

  const [startHours, startMinutes] = quietHours.start.split(':').map(Number);
  const [endHours, endMinutes] = quietHours.end.split(':').map(Number);
  const [timeHours, timeMinutes] = [time.getHours(), time.getMinutes()];

  const startTime = startHours * 60 + startMinutes;
  const endTime = endHours * 60 + endMinutes;
  const currentTime = timeHours * 60 + timeMinutes;

  // GÃ©rer le cas oÃ¹ les heures silencieuses passent minuit
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  } else {
    return currentTime >= startTime && currentTime < endTime;
  }
}

/**
 * VÃ©rifie si une heure est pendant un temps de priÃ¨re
 */
function isDuringPrayerTime(time: Date, timings: Record<string, string>): boolean {
  const [timeHours, timeMinutes] = [time.getHours(), time.getMinutes()];
  const currentTime = timeHours * 60 + timeMinutes;

  for (const [prayerName, prayerTimeStr] of Object.entries(timings)) {
    const [prayerHours, prayerMinutes] = prayerTimeStr.split(':').map(Number);
    const prayerTime = prayerHours * 60 + prayerMinutes;

    // ConsidÃ©rer 30 minutes autour de l'heure de priÃ¨re
    if (Math.abs(currentTime - prayerTime) <= 30) {
      return true;
    }
  }

  return false;
}

/**
 * Planifie toutes les notifications intelligentes
 */
export async function scheduleAllSmartNotifications(userId: string): Promise<void> {
  try {
    const habits = await loadUserHabits(userId);
    const settings = await loadNotificationSettings();

    if (!settings.enabled) {
      return;
    }

    // GÃ©nÃ©rer toutes les notifications
    const prayerNotifications = await generatePrayerNotifications(userId, habits, settings);
    const dhikrNotifications = await generateDhikrNotifications(userId, habits, settings);
    const journalNotifications = await generateJournalNotifications(userId, habits, settings);
    const suggestions = await generateSuggestions(userId, habits, settings);

    // Combiner toutes les notifications
    const allNotifications = [
      ...prayerNotifications,
      ...dhikrNotifications,
      ...journalNotifications,
      ...suggestions,
    ];

    // Sauvegarder les notifications planifiÃ©es
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(allNotifications));

    // --- PROD: planifier de vraies notifications locales (expo-notifications) ---
    // expo-notifications supprimÃ© - notifications dÃ©sactivÃ©es
    // const hasNotifPerm = await ensureNotificationPermissions();
    // if (!hasNotifPerm) {
    //   // Pas de permission: on garde la liste planifiÃ©e mais on ne schedule pas l'OS
    //   return;
    // }

    // // Ã‰viter de dÃ©passer les limites OS (iOS ~64 scheduled notifications)
    // const now = Date.now();
    // const upcoming = allNotifications
    //   .filter((n) => n.scheduledTime && new Date(n.scheduledTime).getTime() > now)
    //   .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
    //   .slice(0, 40);

    // const local: AynaLocalNotification[] = upcoming.map((n) => ({
    //   title: n.title,
    //   body: n.body,
    //   scheduledTime: new Date(n.scheduledTime),
    //   data: { type: n.type, ...(n.data || {}) },
    //   priority: n.priority,
    // });

    // await scheduleAynaLocalNotifications(local);
  } catch (error) {
    // Erreur silencieuse
  }
}

/**
 * RÃ©cupÃ¨re les notifications planifiÃ©es
 */
export async function getScheduledNotifications(): Promise<SmartNotification[]> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (stored) {
      const notifications = JSON.parse(stored) as SmartNotification[];
      // Convertir les dates string en Date
      return notifications.map(n => ({
        ...n,
        scheduledTime: new Date(n.scheduledTime),
      }));
    }
    return [];
  } catch {
    return [];
  }
}



