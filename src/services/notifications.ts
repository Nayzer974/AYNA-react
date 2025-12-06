/**
 * Service de notifications push
 * Utilise expo-notifications pour gérer les notifications locales et push
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NOTIFICATION_TOKEN_KEY = '@ayna_notification_token';

/**
 * Demande les permissions de notification
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Les notifications push ne fonctionnent que sur un appareil physique');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Permission de notification refusée');
    return false;
  }

  return true;
}

/**
 * Enregistre le token de notification push
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Obtenir le token
    // Utiliser le project ID depuis Constants ou une variable d'environnement
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      Constants.expoConfig?.extra?.expoProjectId ||
                      process.env.EXPO_PUBLIC_PROJECT_ID;
    
    if (!projectId) {
      console.warn('Expo Project ID non configuré. Les notifications push peuvent ne pas fonctionner.');
    }

    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    // Sauvegarder le token localement
    await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token.data);

    // Envoyer le token à Supabase pour l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Mettre à jour le profil utilisateur avec le token
      await supabase
        .from('profiles')
        .update({ push_token: token.data })
        .eq('id', user.id);
    }

    return token.data;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des notifications push:', error);
    return null;
  }
}

/**
 * Planifie une notification locale
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: trigger || null, // null = immédiat
  });
}

/**
 * Planifie un rappel de prière
 */
export async function schedulePrayerReminder(
  prayerName: string,
  time: Date
): Promise<string> {
  return await scheduleLocalNotification(
    `Heure de ${prayerName}`,
    `Il est temps pour la prière ${prayerName}`,
    {
      date: time,
      repeats: true,
    }
  );
}

/**
 * Planifie un rappel pour le Challenge 40 jours
 */
export async function scheduleChallengeReminder(
  day: number,
  time: Date
): Promise<string> {
  return await scheduleLocalNotification(
    `Jour ${day} du Challenge`,
    `N'oublie pas de compléter ton défi du jour ${day}`,
    {
      date: time,
    }
  );
}

/**
 * Annule toutes les notifications planifiées
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Annule une notification spécifique
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Obtient le token de notification sauvegardé
 */
export async function getStoredNotificationToken(): Promise<string | null> {
  return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
}

