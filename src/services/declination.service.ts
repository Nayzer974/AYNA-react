/**
 * Service de calcul de la déclinaison magnétique
 * Convertit le heading magnétique en heading vrai (Nord vrai)
 * 
 * Note: Sur iOS, CLLocationManager.heading.trueHeading est déjà en Nord vrai
 * Sur Android, il faut appliquer la déclinaison magnétique
 */

/**
 * Calcule la déclinaison magnétique approximative
 * Formule simplifiée basée sur le modèle IGRF (International Geomagnetic Reference Field)
 * 
 * Pour une précision maximale, utiliser une API ou une bibliothèque native
 * 
 * @param latitude Latitude de l'utilisateur
 * @param longitude Longitude de l'utilisateur
 * @param year Année (pour tenir compte de la variation temporelle)
 * @returns Déclinaison magnétique en degrés (positive = Est, négative = Ouest)
 */
export function calculateMagneticDeclination(
  latitude: number,
  longitude: number,
  year: number = new Date().getFullYear()
): number {
  // Validation
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 0;
  }

  // Formule simplifiée (approximation)
  // Pour une précision maximale, utiliser une API comme:
  // - NOAA Magnetic Field Calculator API
  // - World Magnetic Model (WMM)
  
  // Approximation basique (peut être améliorée avec une vraie API)
  // La déclinaison varie généralement entre -20° et +20°
  // Elle est plus importante près des pôles
  
  // Pour l'instant, retourner 0 (sera amélioré avec une vraie API)
  // TODO: Intégrer une API de déclinaison magnétique
  
  return 0;
}

/**
 * Convertit un heading magnétique en heading vrai
 * @param magneticHeading Heading magnétique (0-360)
 * @param declination Déclinaison magnétique en degrés
 * @returns Heading vrai (0-360)
 */
export function magneticToTrueHeading(
  magneticHeading: number,
  declination: number
): number {
  if (!Number.isFinite(magneticHeading) || !Number.isFinite(declination)) {
    return magneticHeading;
  }

  let trueHeading = magneticHeading + declination;
  
  // Normaliser entre 0 et 360
  trueHeading = (trueHeading + 360) % 360;
  
  return trueHeading;
}


