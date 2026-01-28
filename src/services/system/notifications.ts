/**
 * Service de notifications - Préférences uniquement
 * 
 * NOTE: Les notifications Expo ont été désactivées car non utilisées en production.
 * Ce service gère uniquement les préférences utilisateur pour d'éventuelles
 * notifications futures (à implémenter avec un système de notifications push backend).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPreferences {
  enabled: boolean;
  prayerReminders: boolean;
  dhikrReminders: boolean;
  journalReminders: boolean;
  dailyVerse: boolean;
  spiritualEvents: boolean;
  reminderTimes: {
    morning: string; // HH:MM
    afternoon: string;
    evening: string;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

const NOTIFICATION_PREFS_KEY = '@ayna_notification_prefs';

// Configurer le comportement des notifications - DÉSACTIVÉ
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

export async function requestNotificationPermissions(): Promise<boolean> {
  // DÉSACTIVÉ - Retourne toujours false
    return false;
  // try {
  //   const { status: existingStatus } = await Notifications.getPermissionsAsync();
  //   let finalStatus = existingStatus;
  //   
  //   if (existingStatus !== 'granted') {
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     finalStatus = status;
  //   }
  //   
  //   return finalStatus === 'granted';
  // } catch {
  //   return false;
  // }
}

export async function schedulePrayerReminder(
  prayerName: string,
  time: Date
): Promise<string | null> {
  // DÉSACTIVÉ - Retourne toujours null
    return null;
  // try {
  //   const hasPermission = await requestNotificationPermissions();
  //   if (!hasPermission) return null;
  //   
  //   const identifier = await Notifications.scheduleNotificationAsync({
  //     content: {
  //       title: 'Heure de prière',
  //       body: `Il est temps pour ${prayerName}`,
  //       sound: true,
  //       data: { type: 'prayer', prayerName },
  //     },
  //     trigger: time,
  //   });
  //   
  //   return identifier;
  // } catch {
  //   return null;
  // }
}

export async function scheduleDhikrReminder(hour: number, minute: number): Promise<string | null> {
  // DÉSACTIVÉ - Retourne toujours null
    return null;
  // try {
  //   const hasPermission = await requestNotificationPermissions();
  //   if (!hasPermission) return null;
  //   
  //   const identifier = await Notifications.scheduleNotificationAsync({
  //     content: {
  //       title: 'Rappel de dhikr',
  //       body: 'N\'oubliez pas votre moment de dhikr quotidien',
  //       sound: true,
  //       data: { type: 'dhikr' },
  //     },
  //     trigger: {
  //       hour,
  //       minute,
  //       repeats: true,
  //     },
  //   });
  //   
  //   return identifier;
  // } catch {
  //   return null;
  // }
}

export async function scheduleDailyVerse(): Promise<string | null> {
  // DÉSACTIVÉ - Retourne toujours null
    return null;
  // try {
  //   const hasPermission = await requestNotificationPermissions();
  //   if (!hasPermission) return null;
  //   
  //   const identifier = await Notifications.scheduleNotificationAsync({
  //     content: {
  //       title: 'Verset du jour',
  //       body: 'Votre verset quotidien vous attend',
  //       sound: true,
  //       data: { type: 'verse' },
  //     },
  //     trigger: {
  //       hour: 8,
  //       minute: 0,
  //       repeats: true,
  //     },
  //   });
  //   
  //   return identifier;
  // } catch {
  //   return null;
  // }
}

export async function saveNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Erreur silencieuse
  }
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      enabled: true,
      prayerReminders: true,
      dhikrReminders: false,
      journalReminders: false,
      dailyVerse: true,
      spiritualEvents: true,
      reminderTimes: {
        morning: '08:00',
        afternoon: '14:00',
        evening: '20:00',
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
    };
  } catch {
    return {
      enabled: true,
      prayerReminders: true,
      dhikrReminders: false,
      journalReminders: false,
      dailyVerse: true,
      spiritualEvents: true,
      reminderTimes: {
        morning: '08:00',
        afternoon: '14:00',
        evening: '20:00',
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
    };
  }
}

export async function cancelAllNotifications(): Promise<void> {
  // DÉSACTIVÉ - Ne fait rien
  // try {
  //   await Notifications.cancelAllScheduledNotificationsAsync();
  // } catch {
  //   // Erreur silencieuse
  // }
}
