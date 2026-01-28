/**
 * Service de gestion de la localisation GPS
 * Fournit la position, vitesse, et heading GPS
 */

import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number; // en mètres
  altitude: number | null;
  speed: number | null; // en m/s
  heading: number | null; // GPS heading en degrés (0-360), null si non disponible
  timestamp: number;
}

/**
 * Obtient la position actuelle avec toutes les données GPS
 */
export async function getCurrentLocation(): Promise<LocationData> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission de localisation refusée');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
    mayShowUserSettingsDialog: true,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy || 0,
    altitude: location.coords.altitude || null,
    speed: location.coords.speed || null, // m/s
    heading: location.coords.heading || null, // GPS heading (disponible si en mouvement)
    timestamp: location.timestamp,
  };
}

/**
 * Démarre le suivi de position en continu
 * @param callback Fonction appelée à chaque mise à jour
 * @returns Fonction pour arrêter le suivi
 */
export function watchPosition(
  callback: (location: LocationData) => void,
  options: {
    accuracy?: Location.Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
  } = {}
): () => void {
  let subscription: Location.LocationSubscription | null = null;

  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission de localisation refusée');
    }

    subscription = await Location.watchPositionAsync(
      {
        accuracy: options.accuracy || Location.Accuracy.High,
        timeInterval: options.timeInterval || 1000,
        distanceInterval: options.distanceInterval || 1,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          altitude: location.coords.altitude || null,
          speed: location.coords.speed || null,
          heading: location.coords.heading || null,
          timestamp: location.timestamp,
        });
      }
    );
  })();

  // Retourner une fonction pour arrêter le suivi
  return () => {
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
  };
}

/**
 * Vérifie si le GPS heading est fiable
 * Le GPS heading n'est disponible que si l'utilisateur se déplace
 * @param speed Vitesse en m/s
 * @param heading GPS heading
 * @returns true si le GPS heading est fiable
 */
export function isGPSHeadingReliable(speed: number | null, heading: number | null): boolean {
  // GPS heading fiable si vitesse > 1.5 m/s (environ 5.4 km/h) et heading disponible
  return (speed !== null && speed > 1.5) && (heading !== null && Number.isFinite(heading));
}


