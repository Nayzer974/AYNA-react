/**
 * Service de gestion des notifications Expo
 * 
 * Gère les permissions, la planification et l'annulation des notifications locales
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuration du handler de notifications
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
 * Interface pour une notification locale AYNA
 */
export interface AynaLocalNotification {
  title: string;
  body: string;
  scheduledTime: Date;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Vérifie et demande les permissions de notification
 * @returns true si les permissions sont accordées, false sinon
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    // Ne pas demander automatiquement les permissions - l'utilisateur doit les activer dans les paramètres
    return existingStatus === 'granted';
  } catch (error) {
    console.error('[expoNotifications] Erreur lors de la vérification des permissions:', error);
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
  } catch (error) {
    console.error('[expoNotifications] Erreur lors de la demande de permissions:', error);
    return false;
  }
}

/**
 * Planifie une notification locale
 * @param notification Notification à planifier
 * @returns Identifiant de la notification planifiée ou null si erreur
 */
export async function scheduleAynaLocalNotification(
  notification: AynaLocalNotification
): Promise<string | null> {
  try {
    const hasPermission = await ensureNotificationPermissions();
    if (!hasPermission) {
      console.warn('[expoNotifications] Permissions de notification non accordées');
      return null;
    }

    const trigger: Notifications.NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notification.scheduledTime,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        sound: true,
        data: notification.data || {},
        priority: notification.priority === 'high' 
          ? Notifications.AndroidNotificationPriority.HIGH
          : notification.priority === 'low'
          ? Notifications.AndroidNotificationPriority.LOW
          : Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('[expoNotifications] Erreur lors de la planification:', error);
    return null;
  }
}

/**
 * Planifie plusieurs notifications locales
 * @param notifications Liste de notifications à planifier
 * @returns Liste des identifiants des notifications planifiées
 */
export async function scheduleAynaLocalNotifications(
  notifications: AynaLocalNotification[]
): Promise<string[]> {
  const notificationIds: string[] = [];

  for (const notification of notifications) {
    const id = await scheduleAynaLocalNotification(notification);
    if (id) {
      notificationIds.push(id);
    }
  }

  return notificationIds;
}

/**
 * Annule toutes les notifications planifiées
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[expoNotifications] Erreur lors de l\'annulation:', error);
  }
}

/**
 * Annule une notification spécifique
 * @param notificationId Identifiant de la notification à annuler
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('[expoNotifications] Erreur lors de l\'annulation:', error);
  }
}

/**
 * Récupère toutes les notifications planifiées
 * @returns Liste des notifications planifiées
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[expoNotifications] Erreur lors de la récupération:', error);
    return [];
  }
}

/**
 * Configure le canal de notification Android (pour Android 8.0+)
 */
export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications AYNA',
      description: 'Notifications pour les prières, dhikr et rappels spirituels',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0A0F2C',
      sound: 'default',
    });
  }
}

/**
 * Initialise le service de notifications
 * Doit être appelé au démarrage de l'application
 */
export async function initializeNotifications(): Promise<void> {
  try {
    // Configurer le canal Android
    await configureAndroidChannel();
    
    // Vérifier les permissions (sans forcer la demande - notifications désactivées par défaut)
    const hasPermission = await ensureNotificationPermissions();
    if (hasPermission) {
      console.log('[expoNotifications] Service de notifications initialisé avec succès');
    } else {
      console.log('[expoNotifications] Permissions de notification non accordées - notifications désactivées par défaut');
    }
  } catch (error) {
    console.error('[expoNotifications] Erreur lors de l\'initialisation:', error);
  }
}

