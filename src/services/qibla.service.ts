/**
 * Service de calcul de la direction Qibla (Kaaba)
 * Utilise la formule de bearing géodésique validée
 */

export const KAABA_LAT = 21.422487;
export const KAABA_LNG = 39.826206;

/**
 * Calcule le bearing (azimut) depuis une position vers la Kaaba
 * @param lat1 Latitude de l'utilisateur
 * @param lon1 Longitude de l'utilisateur
 * @param lat2 Latitude de destination (Kaaba par défaut)
 * @param lon2 Longitude de destination (Kaaba par défaut)
 * @returns Bearing en degrés (0-360), 0 = Nord
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number = KAABA_LAT,
  lon2: number = KAABA_LNG
): number {
  // Validation des entrées
  if (
    !Number.isFinite(lat1) || !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) || !Number.isFinite(lon2)
  ) {
    throw new Error('Coordonnées invalides pour le calcul de bearing');
  }

  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let θ = Math.atan2(y, x);
  θ = θ * 180 / Math.PI;

  // Normaliser entre 0 et 360
  return (θ + 360) % 360;
}

/**
 * Calcule la distance en mètres entre deux points
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number = KAABA_LAT,
  lon2: number = KAABA_LNG
): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


