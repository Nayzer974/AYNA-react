/**
 * Service de notifications - Préférences et planification
 * 
 * Gère les préférences utilisateur et la planification des notifications locales
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

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

// Configurer le comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Vérifie les permissions de notification sans les demander automatiquement
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Demande explicitement les permissions de notification
 * À utiliser uniquement quand l'utilisateur active les notifications dans les paramètres
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

export async function schedulePrayerReminder(
  prayerName: string,
  time: Date
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Heure de prière',
        body: `Il est temps pour ${prayerName}`,
        sound: true,
        data: { type: 'prayer', prayerName },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: time,
      },
    });
    
    return identifier;
  } catch {
    return null;
  }
}

export async function scheduleDhikrReminder(hour: number, minute: number): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rappel de dhikr',
        body: 'N\'oubliez pas votre moment de dhikr quotidien',
        sound: true,
        data: { type: 'dhikr' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
    
    return identifier;
  } catch {
    return null;
  }
}

export async function scheduleDailyVerse(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Verset du jour',
        body: 'Votre verset quotidien vous attend',
        sound: true,
        data: { type: 'verse' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });
    
    return identifier;
  } catch {
    return null;
  }
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
      enabled: false, // Désactivées par défaut
      prayerReminders: false, // Désactivées par défaut
      dhikrReminders: false,
      journalReminders: false,
      dailyVerse: false, // Désactivées par défaut
      spiritualEvents: false, // Désactivées par défaut
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
      enabled: false, // Désactivées par défaut
      prayerReminders: false, // Désactivées par défaut
      dhikrReminders: false,
      journalReminders: false,
      dailyVerse: false, // Désactivées par défaut
      spiritualEvents: false, // Désactivées par défaut
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
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Erreur silencieuse
  }
}
