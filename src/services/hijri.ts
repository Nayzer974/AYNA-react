import Constants from 'expo-constants';

const aladhanBaseUrl = Constants.expoConfig?.extra?.aladhanBaseUrl || "https://api.aladhan.com/v1";

export interface PrayerTimingsResponse {
  data: {
    timings: Record<string, string>;
    date: { readable: string; timestamp: string; hijri: unknown; gregorian: unknown };
  };
}

export async function getPrayerTimesByCity(
  city: string,
  country: string,
  method = 2
): Promise<PrayerTimingsResponse> {
  const url = `${aladhanBaseUrl}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Aladhan API error');
  return res.json();
}

// NOTE: Les fonctions de conversion de dates Hijri ont été déplacées vers aladhan.ts
// Ce fichier garde uniquement les fonctions pour les heures de prière et la Qibla qui utilisent AlAdhan

export async function getPrayerTimesByCoords(
  latitude: number,
  longitude: number,
  method = 2
): Promise<PrayerTimingsResponse> {
  const url = `${aladhanBaseUrl}/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Aladhan API error');
  return res.json();
}

/**
 * Récupère les heures de prière pour une date spécifique
 * @param latitude Latitude de l'utilisateur
 * @param longitude Longitude de l'utilisateur
 * @param day Jour (1-31)
 * @param month Mois (1-12)
 * @param year Année (ex: 2025)
 * @param method Méthode de calcul (défaut: 2 - ISNA)
 * @returns Record avec les heures de prière
 */
export async function getPrayerTimesForDate(
  latitude: number,
  longitude: number,
  day: number,
  month: number,
  year: number,
  method = 2
): Promise<PrayerTimingsResponse> {
  // Format: DD-MM-YYYY (ex: 21-12-2025)
  const dateStr = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
  const url = `${aladhanBaseUrl}/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=${method}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Aladhan API error');
  return res.json();
}

export async function getQiblaByCoords(latitude: number, longitude: number): Promise<{ data: { direction: number } }> {
  // L'API Aladhan utilise l'endpoint /qibla mais peut nécessiter un format différent
  // Essayer d'abord avec l'endpoint standard
  let url = `${aladhanBaseUrl}/qibla/${latitude}/${longitude}`;
  let res = await fetch(url);
  
  // Si 404, essayer avec query parameters
  if (!res.ok && res.status === 404) {
    url = `${aladhanBaseUrl}/qibla?latitude=${latitude}&longitude=${longitude}`;
    res = await fetch(url);
  }
  
  // Si toujours en erreur, calculer la direction localement
  if (!res.ok) {
    // Calcul de la direction localement
    const direction = calculateQiblaDirection(latitude, longitude);
    return { data: { direction } };
  }
  
  const data = await res.json();
  // L'API peut retourner directement { direction } ou { data: { direction } }
  if (data.direction !== undefined) {
    return { data: { direction: data.direction } };
  }
  return data;
}

// Calculer la direction de la Qibla localement (formule approximative)
function calculateQiblaDirection(latitude: number, longitude: number): number {
  // Coordonnées de la Kaaba à La Mecque
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8262;
  
  // Convertir en radians
  const lat1 = (latitude * Math.PI) / 180;
  const lon1 = (longitude * Math.PI) / 180;
  const lat2 = (kaabaLat * Math.PI) / 180;
  const lon2 = (kaabaLon * Math.PI) / 180;
  
  // Calculer la direction (bearing)
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360; // Normaliser entre 0 et 360
  
  return Math.round(bearing);
}


