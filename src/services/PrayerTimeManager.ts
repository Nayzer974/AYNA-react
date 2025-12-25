/**
 * Service simplifié de gestion des notifications de prière
 * Approche simple : cycle complet à chaque lancement/focus de l'application
 * 
 * 3 Étapes Simples :
 * 1. Initialisation : Obtenir la géolocalisation
 * 2. Récupération et Filtre : Fetch API pour aujourd'hui + filtrer les prières passées
 * 3. Planification : Planifier 3 notifications par prière future (10min, 5min, à l'heure)
 */

import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { requestNotificationPermissions } from './notifications';

const aladhanBaseUrl = Constants.expoConfig?.extra?.aladhanBaseUrl || "https://api.aladhan.com/v1";

// Noms des prières
const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

/**
 * Réponse de l'API Aladhan pour un jour
 */
interface AladhanTimingsResponse {
  code: number;
  status: string;
  data: {
    timings: Record<string, string>;
    date: {
      readable: string;
      timestamp: string;
      gregorian: {
        date: string;
      };
    };
  };
}

/**
 * Structure d'une prière future
 */
interface FuturePrayer {
  name: string;
  time: string; // HH:MM
  dateTime: Date; // Date complète avec heure
}

/**
 * Interface pour les coordonnées de localisation
 */
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

// ============================================================================
// ÉTAPE 1 : Initialisation - Obtenir la géolocalisation
// ============================================================================

/**
 * Obtient la géolocalisation de l'utilisateur
 * @param userLocation Coordonnées optionnelles depuis le profil utilisateur
 * @returns Coordonnées de localisation
 */
async function getLocation(userLocation?: LocationCoords): Promise<LocationCoords> {
  if (userLocation?.latitude && userLocation?.longitude) {
    console.log('[PrayerTimeManager] Utilisation de la localisation du profil utilisateur');
    return userLocation;
  }

  // Demander la permission de localisation
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission de localisation refusée');
  }

  // Obtenir la position actuelle
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  console.log('[PrayerTimeManager] Localisation obtenue:', location.coords.latitude, location.coords.longitude);
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

// ============================================================================
// ÉTAPE 2 : Récupération et Filtre - Fetch API pour aujourd'hui + Filtrer
// ============================================================================

/**
 * Récupère les heures de prière pour aujourd'hui via l'API Aladhan
 * @param latitude Latitude de l'utilisateur
 * @param longitude Longitude de l'utilisateur
 * @param method Méthode de calcul (défaut: 2 - ISNA)
 * @returns Record avec les heures de prière (Fajr, Dhuhr, Asr, Maghrib, Isha)
 */
async function fetchTodayPrayerTimes(
  latitude: number,
  longitude: number,
  method: number = 2
): Promise<Record<string, string>> {
  const url = `${aladhanBaseUrl}/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`;
  
  console.log('[PrayerTimeManager] Récupération des heures de prière pour aujourd\'hui');
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erreur API Aladhan: ${response.status}`);
  }

  const data: AladhanTimingsResponse = await response.json();

  if (data.code !== 200 || !data.data || !data.data.timings) {
    throw new Error('Réponse API invalide');
  }

  // Extraire uniquement les heures des prières qui nous intéressent
  const timings: Record<string, string> = {};
  for (const prayerName of PRAYER_NAMES) {
    const time = data.data.timings[prayerName];
    if (time) {
      // Extraire uniquement HH:MM (l'API peut retourner HH:MM (GMT+XX))
      timings[prayerName] = time.split(' ')[0];
    }
  }

  console.log('[PrayerTimeManager] Heures de prière récupérées:', timings);
  return timings;
}

/**
 * Filtre les prières pour ne garder que celles dont l'heure est dans le futur
 * Compare l'heure de la prière avec l'heure actuelle
 * @param timings Record avec les heures de prière
 * @returns Tableau des prières futures triées par heure
 */
function filterFuturePrayers(timings: Record<string, string>): FuturePrayer[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const futurePrayers: FuturePrayer[] = [];

  for (const prayerName of PRAYER_NAMES) {
    const time = timings[prayerName];
    if (!time) continue;

    // Créer un objet Date avec la date et l'heure de la prière
    const [hours, minutes] = time.split(':').map(Number);
    const prayerDateTime = new Date(`${today}T${time}:00`);
    prayerDateTime.setHours(hours, minutes, 0, 0);

    // Vérifier si la prière est dans le futur (HeureDeLaPrière > HeureActuelle)
    if (prayerDateTime.getTime() > now.getTime()) {
      futurePrayers.push({
        name: prayerName,
        time: time,
        dateTime: prayerDateTime,
      });
    }
  }

  // Trier par heure (plus proche en premier)
  futurePrayers.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  console.log(`[PrayerTimeManager] ${futurePrayers.length} prière(s) future(s) trouvée(s)`);
  return futurePrayers;
}

// ============================================================================
// ÉTAPE 3 : Planification - Planifier 3 notifications par prière future
// ============================================================================

/**
 * Planifie les notifications locales pour les prières futures
 * Pour chaque prière future, planifie 3 notifications :
 * - 10 minutes avant
 * - 5 minutes avant
 * - À l'heure exacte
 * 
 * @param futurePrayers Tableau des prières futures
 */
async function scheduleNotifications(futurePrayers: FuturePrayer[]): Promise<void> {
  if (futurePrayers.length === 0) {
    console.log('[PrayerTimeManager] Aucune prière future, aucune notification planifiée');
    return;
  }

  const now = Date.now();
  const notificationIds: string[] = [];

  // Pour chaque prière future
  for (const prayer of futurePrayers) {
    const prayerTime = prayer.dateTime.getTime();

    // Les 3 moments de notification
    const notificationMoments = [
      { 
        offset: -10, 
        title: `Rappel ${prayer.name}`, 
        body: `La prière ${prayer.name} approche (10 min)` 
      },
      { 
        offset: -5, 
        title: `Rappel ${prayer.name}`, 
        body: `La prière ${prayer.name} approche (5 min)` 
      },
      { 
        offset: 0, 
        title: `Adhan ${prayer.name}`, 
        body: `Il est temps pour la prière ${prayer.name}` 
      },
    ];

    for (const moment of notificationMoments) {
      // Calcul du temps de déclenchement
      const notificationTime = new Date(prayerTime + moment.offset * 60 * 1000);

      // Vérifier que la notification est dans le futur (au moins 1 seconde)
      if (notificationTime.getTime() <= now + 1000) {
        console.log(`[PrayerTimeManager] Notification ${prayer.name} (${Math.abs(moment.offset)} min) ignorée: date passée`);
        continue;
      }

      // Créer un identifiant unique
      const identifier = `${prayer.name}_${prayer.dateTime.toISOString().split('T')[0]}_${Math.abs(moment.offset)}min`;

      try {
        // Planifier la notification locale
        const notificationId = await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: moment.title,
            body: moment.body,
            sound: true,
            data: { type: 'prayer', prayerName: prayer.name, offset: moment.offset },
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notificationTime,
          },
        });

        notificationIds.push(notificationId);
        console.log(`[PrayerTimeManager] Notification planifiée: ${identifier} pour ${notificationTime.toLocaleString()}`);
      } catch (error) {
        console.error(`[PrayerTimeManager] Erreur lors de la planification de ${identifier}:`, error);
      }
    }
  }

  console.log(`[PrayerTimeManager] ${notificationIds.length} notification(s) planifiée(s)`);
}

// ============================================================================
// Fonction principale - Cycle complet
// ============================================================================

/**
 * Fonction principale d'initialisation
 * Effectue le cycle complet à chaque lancement/focus de l'application :
 * 1. Initialisation : Obtenir la géolocalisation
 * 2. Récupération et Filtre : Fetch API pour aujourd'hui + filtrer les prières passées
 * 3. Planification : Planifier 3 notifications par prière future
 * 
 * IMPORTANT : Annule TOUTES les notifications précédentes avant de replanifier
 * 
 * @param userLocation Coordonnées optionnelles de l'utilisateur (depuis le profil)
 */
export async function initialize(userLocation?: LocationCoords): Promise<void> {
  try {
    console.log('[PrayerTimeManager] Début du cycle complet...');

    // Vérifier les préférences utilisateur avant de planifier
    try {
      const { loadUserPreferences } = await import('@/services/personalization');
      const preferences = await loadUserPreferences();
      
      // Si les notifications ou les rappels de prière sont désactivés, ne pas planifier
      if (!preferences.notificationsEnabled || !preferences.prayerReminders) {
        console.log('[PrayerTimeManager] Notifications désactivées par l\'utilisateur');
        return;
      }
    } catch (error) {
      // Si on ne peut pas charger les préférences, continuer (compatibilité)
      console.warn('[PrayerTimeManager] Impossible de charger les préférences, continuation...');
    }

    // Vérifier les permissions de notification (sans demander automatiquement)
    const { checkNotificationPermissions } = await import('./notifications');
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.log('[PrayerTimeManager] Permissions de notification non accordées');
      return;
    }

    // ÉTAPE CRUCIALE : Annuler TOUTES les notifications précédentes pour éviter les doublons
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[PrayerTimeManager] Toutes les notifications précédentes annulées');

    // ÉTAPE 1 : Initialisation - Obtenir la géolocalisation
    const location = await getLocation(userLocation);

    // ÉTAPE 2 : Récupération et Filtre
    // 2.1. Fetch API pour les heures de prière d'aujourd'hui
    const timings = await fetchTodayPrayerTimes(location.latitude, location.longitude);
    
    // 2.2. Filtrer les prières dont l'heure est déjà passée
    const futurePrayers = filterFuturePrayers(timings);

    // ÉTAPE 3 : Planification
    // Pour chaque prière future, planifier 3 notifications (10min, 5min, à l'heure)
    await scheduleNotifications(futurePrayers);

    console.log('[PrayerTimeManager] Cycle complet terminé avec succès');
  } catch (error) {
    console.error('[PrayerTimeManager] Erreur lors du cycle complet:', error);
    throw error;
  }
}

/**
 * Récupère les heures de prière pour le jour actuel
 * Utile pour l'affichage dans l'interface
 * @param userLocation Coordonnées optionnelles de l'utilisateur
 * @returns Record avec les heures de prière ou null si erreur
 */
export async function getTodayPrayerTimes(userLocation?: LocationCoords): Promise<Record<string, string> | null> {
  try {
    const location = await getLocation(userLocation);
    const timings = await fetchTodayPrayerTimes(location.latitude, location.longitude);
    return timings;
  } catch (error) {
    console.error('[PrayerTimeManager] Erreur lors de la récupération des heures du jour:', error);
    return null;
  }
}
