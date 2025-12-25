/**
 * Service AlAdhan - API de conversion de dates Hijri
 * 
 * Utilise uniquement l'API AlAdhan pour les conversions de dates.
 * Documentation: https://aladhan.com/api
 * 
 * Endpoints utilisés:
 * - gToH: Conversion Grégorien → Hijri
 * - hToG: Conversion Hijri → Grégorien
 */

import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';

const aladhanBaseUrl = Constants.expoConfig?.extra?.aladhanBaseUrl || "https://api.aladhan.com/v1";

/**
 * Ajustement pour la date Hijri (optionnel)
 * Utilisé si la date Hijri affichée ne correspond pas à celle observée dans le pays
 * Valeurs possibles: -1, 0, +1
 * Par défaut: 0 (pas d'ajustement)
 */
let dateAdjustment: number = 0;

/**
 * Configure l'ajustement de date Hijri
 * @param adjustment - Ajustement (-1, 0, ou +1)
 */
export function setDateAdjustment(adjustment: number): void {
  if (adjustment >= -1 && adjustment <= 1) {
    dateAdjustment = adjustment;
  } else {
    console.warn('[aladhan] Ajustement invalide, doit être entre -1 et 1');
  }
}

/**
 * Obtient l'ajustement de date Hijri actuel
 */
export function getDateAdjustment(): number {
  return dateAdjustment;
}

/**
 * Interface pour une date Hijri (format compatible avec les composants existants)
 */
export interface HijriDate {
  date: string; // Format DD-MM-YYYY
  format: string; // Format de la date
  day: string; // Jour (1-30)
  weekday: { en: string; ar: string }; // Nom du jour en anglais et arabe
  month: { number: number; en: string; ar: string }; // Mois avec numéro et noms
  year: string; // Année Hijri
}

/**
 * Interface pour une date grégorienne (format compatible avec les composants existants)
 */
export interface GregorianDate {
  date: string; // Format DD-MM-YYYY
  format: string; // Format de la date
  day: string; // Jour (1-31)
  weekday: { en: string; ar: string }; // Nom du jour en anglais et arabe
  month: { number: number; en: string; ar: string }; // Mois avec numéro et noms
  year: string; // Année grégorienne
}

/**
 * Vérifie si l'appareil est connecté à Internet
 */
async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    return false;
  }
}

/**
 * Convertit une date grégorienne en date Hijri
 * Utilise uniquement l'API AlAdhan
 * 
 * @param year - Année grégorienne
 * @param month - Mois grégorien (1-12)
 * @param day - Jour grégorien (1-31)
 * @returns Date Hijri ou null si erreur
 * 
 * Exemple: https://api.aladhan.com/v1/gToH?date=13-12-2025
 */
export async function gregorianToHijri(year: number, month: number, day: number): Promise<HijriDate | null> {
  if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
  }

  const online = await isOnline();
  if (!online) {
    console.warn('[aladhan] Pas de connexion internet, impossible de convertir la date');
    return null;
  }

  try {
    // Format: DD-MM-YYYY (ex: 13-12-2025)
    const dateStr = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    
    // Construire l'URL avec le paramètre adjustment si nécessaire
    let url = `${aladhanBaseUrl}/gToH?date=${dateStr}`;
    if (dateAdjustment !== 0) {
      url += `&adjustment=${dateAdjustment > 0 ? '+' : ''}${dateAdjustment}`;
    }
    
    console.log('[aladhan] Appel API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[aladhan] Erreur API AlAdhan:', response.status, response.statusText);
      console.error('[aladhan] Réponse:', text.substring(0, 200));
      return null;
    }

    // Vérifier le Content-Type avant de parser
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[aladhan] Réponse n\'est pas du JSON. Content-Type:', contentType);
      console.error('[aladhan] Réponse:', text.substring(0, 200));
      return null;
    }

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('[aladhan] Erreur parsing JSON:', parseError);
      console.error('[aladhan] Texte reçu:', text.substring(0, 500));
      return null;
    }

    let result: HijriDate | null = null;

    if (data.code === 200 && data.data?.hijri) {
      result = data.data.hijri;
    } else if (data.data?.hijri) {
      result = data.data.hijri;
    } else if (data.hijri) {
      result = data.hijri;
    }

    return result;
  } catch (error) {
    console.error('[aladhan] Erreur lors de l\'appel API AlAdhan:', error);
    if (error instanceof Error) {
      console.error('[aladhan] Message d\'erreur:', error.message);
      console.error('[aladhan] Stack:', error.stack);
    }
    return null;
  }
}

/**
 * Convertit une date Hijri en date grégorienne
 * Utilise uniquement l'API AlAdhan
 * 
 * @param year - Année Hijri
 * @param month - Mois Hijri (1-12)
 * @param day - Jour Hijri (1-30)
 * @returns Date grégorienne ou null si erreur
 * 
 * Exemple: https://api.aladhan.com/v1/hToG?date=22-06-1447
 */
export async function hijriToGregorian(year: number, month: number, day: number): Promise<GregorianDate | null> {
  if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
  }

  const online = await isOnline();
  if (!online) {
    console.warn('[aladhan] Pas de connexion internet, impossible de convertir la date');
    return null;
  }

  try {
    // Format: DD-MM-YYYY (ex: 22-06-1447)
    const dateStr = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    const url = `${aladhanBaseUrl}/hToG?date=${dateStr}`;
    
    console.log('[aladhan] Appel API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[aladhan] Erreur API AlAdhan:', response.status, response.statusText);
      console.error('[aladhan] Réponse:', text.substring(0, 200));
      return null;
    }

    // Vérifier le Content-Type avant de parser
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[aladhan] Réponse n\'est pas du JSON. Content-Type:', contentType);
      console.error('[aladhan] Réponse:', text.substring(0, 200));
      return null;
    }

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('[aladhan] Erreur parsing JSON:', parseError);
      console.error('[aladhan] Texte reçu:', text.substring(0, 500));
      return null;
    }

    let result: GregorianDate | null = null;

    if (data.code === 200 && data.data?.gregorian) {
      result = data.data.gregorian;
    } else if (data.data?.gregorian) {
      result = data.data.gregorian;
    } else if (data.gregorian) {
      result = data.gregorian;
    }

    return result;
  } catch (error) {
    console.error('[aladhan] Erreur lors de l\'appel API AlAdhan:', error);
    if (error instanceof Error) {
      console.error('[aladhan] Message d\'erreur:', error.message);
      console.error('[aladhan] Stack:', error.stack);
    }
    return null;
  }
}

/**
 * Obtient la date Hijri du jour actuel
 * Utilise uniquement l'API AlAdhan
 */
export async function getTodayHijri(): Promise<HijriDate | null> {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  return await gregorianToHijri(year, month, day);
}


// Constantes pour les mois Hijri (pour compatibilité avec les composants existants)
export const hijriMonths = [
  'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
  'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

export const hijriMonthsArabic = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

export const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
export const weekDaysArabic = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
