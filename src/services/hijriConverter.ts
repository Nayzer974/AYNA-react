/**
 * Service de conversion de dates Hijri - API AlAdhan UNIQUEMENT
 * 
 * Utilise uniquement l'API AlAdhan pour les conversions de dates.
 * Documentation: https://aladhan.com/api
 * 
 * Endpoints utilisés:
 * - gToH: Conversion Grégorien → Hijri
 * - hToG: Conversion Hijri → Grégorien
 * - hijriCalendar: Calendrier Hijri complet (mois entier)
 * - gToHCalendar: Calendrier Grégorien converti en Hijri (mois entier)
 */

import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { getCachedHijriDate, setCachedHijriDate, getCachedHijriDates } from './hijriCache';

interface AlAdhanResponse {
  code?: number;
  data?: {
    hijri?: HijriDate;
    gregorian?: GregorianDate;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface CalendarDayData {
  hijri: HijriDate;
  gregorian: GregorianDate;
  [key: string]: unknown;
}

interface RateLimitError extends Error {
  status?: number;
  response?: {
    status?: number;
  };
}

/**
 * Fonction helper pour parser une réponse JSON de manière sécurisée
 * Utilise response.json() directement pour éviter les problèmes avec text()
 */
async function safeJsonParse(response: Response | null | undefined): Promise<AlAdhanResponse | null> {
  try {
    // Vérifier que la réponse existe
    if (!response) {
      return null;
    }

    // Vérifier le statut de la réponse
    if (!response.ok) {
      return null;
    }

    // Essayer d'utiliser json() directement (plus fiable que text() + JSON.parse)
    try {
      if (typeof response.json === 'function') {
        const data = await response.json();
        return data;
      }
    } catch (jsonError: unknown) {
      // Si json() échoue, essayer avec text() comme fallback
      try {
        if (typeof response.text === 'function') {
          const text = await response.text();
          
          // Vérifier que le texte est valide
          if (!text || typeof text !== 'string') {
            return null;
          }
          
          const trimmed = text.trim();
          
          // Vérifier que ce n'est pas vide ou undefined/null comme string
          if (trimmed === '' || 
              trimmed === 'undefined' || 
              trimmed === 'null' ||
              trimmed.toLowerCase() === 'undefined' ||
              trimmed.toLowerCase() === 'null') {
            return null;
          }
          
          // Vérifier que ça ressemble à du JSON
          if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            return null;
          }
          
          // Parser le JSON
          try {
            const parsed = JSON.parse(trimmed) as AlAdhanResponse;
            return parsed;
          } catch (_parseError: unknown) {
            return null;
          }
        }
      } catch (_textError: unknown) {
        return null;
      }
      
      return null;
    }
    
    return null;
  } catch (_error: unknown) {
    // Erreur inattendue - retourner null silencieusement
    return null;
  }
}

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
    console.warn('[hijriConverter] Ajustement invalide, doit être entre -1 et 1');
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
 * Utilise uniquement l'API AlAdhan avec cache persistant
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

  // Vérifier le cache persistant d'abord
  const cached = await getCachedHijriDate(year, month, day);
  if (cached) {
    return {
      date: `${cached.day}-${cached.month.number}-${cached.year}`,
      format: 'DD-MM-YYYY',
      day: cached.day,
      weekday: cached.weekday || { en: '', ar: '' },
      month: cached.month,
      year: cached.year,
    };
  }

  const online = await isOnline();
  if (!online) {
    // Si pas de connexion et pas de cache, utiliser conversion approximative
    const approx = approximateGregorianToHijri(year, month, day);
    return {
      date: `${approx.day}-${approx.month}-${approx.year}`,
      format: 'DD-MM-YYYY',
      day: String(approx.day),
      weekday: { en: '', ar: '' },
      month: { number: approx.month, en: '', ar: '' },
      year: String(approx.year),
    };
  }

  try {
    // Format: DD-MM-YYYY (ex: 13-12-2025)
    const dateStr = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    
    // Construire l'URL avec le paramètre adjustment si nécessaire
    let url = `${aladhanBaseUrl}/gToH?date=${dateStr}`;
    if (dateAdjustment !== 0) {
      url += `&adjustment=${dateAdjustment > 0 ? '+' : ''}${dateAdjustment}`;
    }
    
    let response: Response;
    try {
      response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
      } catch (fetchError) {
        // Erreur réseau - utiliser conversion approximative
        const approx = approximateGregorianToHijri(year, month, day);
        return {
          date: `${approx.day}-${approx.month}-${approx.year}`,
          format: 'DD-MM-YYYY',
          day: String(approx.day),
          weekday: { en: '', ar: '' },
          month: { number: approx.month, en: '', ar: '' },
          year: String(approx.year),
        };
      }

    if (!response) {
      // Pas de réponse - utiliser conversion approximative
      const approx = approximateGregorianToHijri(year, month, day);
      return {
        date: `${approx.day}-${approx.month}-${approx.year}`,
        format: 'DD-MM-YYYY',
        day: String(approx.day),
        weekday: { en: '', ar: '' },
        month: { number: approx.month, en: '', ar: '' },
        year: String(approx.year),
      };
    }

    if (!response.ok) {
      // Pour les erreurs 429 (rate limit), lancer une erreur pour que le retry puisse le gérer
      if (response.status === 429) {
        const error: any = new Error(`API AlAdhan rate limit: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      
      // Pour les autres erreurs, utiliser conversion approximative
      const approx = approximateGregorianToHijri(year, month, day);
      return {
        date: `${approx.day}-${approx.month}-${approx.year}`,
        format: 'DD-MM-YYYY',
        day: String(approx.day),
        weekday: { en: '', ar: '' },
        month: { number: approx.month, en: '', ar: '' },
        year: String(approx.year),
      };
    }

    // Vérifier que la réponse est valide avant de parser
    if (!response || typeof response.json !== 'function') {
      return null;
    }

    // Utiliser la fonction helper sécurisée pour parser le JSON
    const data = await safeJsonParse(response);
    
    if (!data) {
      return null;
    }

    if (!data) {
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

    if (!result) {
      // Format de réponse inattendu - utiliser conversion approximative
      const approx = approximateGregorianToHijri(year, month, day);
      return {
        date: `${approx.day}-${approx.month}-${approx.year}`,
        format: 'DD-MM-YYYY',
        day: String(approx.day),
        weekday: { en: '', ar: '' },
        month: { number: approx.month, en: '', ar: '' },
        year: String(approx.year),
      };
    }

    // Sauvegarder dans le cache persistant
    await setCachedHijriDate(year, month, day, result);

    return result;
    } catch (error) {
      // Si c'est une erreur 429, la relancer pour le retry
      if (error && typeof error === 'object' && 'status' in error) {
        const rateLimitError = error as RateLimitError;
        if (rateLimitError.status === 429) {
          throw error;
        }
      }
      // Autres erreurs - utiliser conversion approximative
      const approx = approximateGregorianToHijri(year, month, day);
      return {
        date: `${approx.day}-${approx.month}-${approx.year}`,
        format: 'DD-MM-YYYY',
        day: String(approx.day),
        weekday: { en: '', ar: '' },
        month: { number: approx.month, en: '', ar: '' },
        year: String(approx.year),
      };
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
    return null;
  }

  try {
    // Format: DD-MM-YYYY (ex: 22-06-1447)
    const dateStr = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    const url = `${aladhanBaseUrl}/hToG?date=${dateStr}`;
    
    let response: Response;
    try {
      response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    } catch (fetchError) {
      return null;
    }

    if (!response) {
      return null;
    }

    if (response.ok) {
      // Vérifier que la réponse est valide avant de parser
      if (!response || typeof response.json !== 'function') {
        return null;
      }

      // Utiliser la fonction helper sécurisée pour parser le JSON
      const data = await safeJsonParse(response);
      
      if (!data) {
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
    } else {
      return null;
    }
  } catch (error) {
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

/**
 * Obtient un calendrier Hijri complet pour un mois donné
 * 
 * @param hijriYear - Année Hijri
 * @param hijriMonth - Mois Hijri (1-12)
 * @returns Calendrier complet du mois ou null si erreur
 * 
 * Exemple: https://api.aladhan.com/v1/hijriCalendar?month=6&year=1447
 */
export async function getHijriCalendar(hijriYear: number, hijriMonth: number): Promise<CalendarDayData[] | null> {
  if (!hijriYear || !hijriMonth || isNaN(hijriYear) || isNaN(hijriMonth)) {
    return null;
  }

  const online = await isOnline();
  if (!online) {
    // Retourner null silencieusement si pas de connexion
    return null;
  }

  try {
    const url = `${aladhanBaseUrl}/hijriCalendar?month=${hijriMonth}&year=${hijriYear}`;
    
    let response: Response;
    try {
      response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    } catch (fetchError) {
      return null;
    }

    if (!response) {
      return null;
    }

    if (response.ok) {
      // Vérifier que la réponse est valide avant de parser
      if (!response || typeof response.json !== 'function') {
        return null;
      }

      // Utiliser la fonction helper sécurisée pour parser le JSON
      const data = await safeJsonParse(response);
      
      if (!data) {
        return null;
      }

      if (data.code === 200 && data.data) {
        return data.data;
      }
    } else {
      // Retourner null silencieusement pour les erreurs
      return null;
    }
  } catch (error) {
    return null;
  }

  return null;
}

/**
 * Cache en mémoire pour les conversions de dates (session uniquement)
 * Le cache persistant est géré par hijriCache.ts
 */
const dateConversionCache = new Map<string, HijriDate | null>();

/**
 * Cache persistant pour les calendriers complets (mois entiers)
 * Clé: "calendar-YYYY-MM", Valeur: calendrier complet
 */
const calendarCache = new Map<string, CalendarDayData[]>();

/**
 * Fonction helper pour convertir une date avec retry et backoff exponentiel
 */
async function gregorianToHijriWithRetry(
  year: number,
  month: number,
  day: number,
  maxRetries: number = 3
): Promise<HijriDate | null> {
  const cacheKey = `${year}-${month}-${day}`;
  
  // Vérifier le cache en mémoire d'abord
  if (dateConversionCache.has(cacheKey)) {
    return dateConversionCache.get(cacheKey)!;
  }

  // Vérifier le cache persistant
  const cached = await getCachedHijriDate(year, month, day);
  if (cached) {
    const result = {
      date: `${cached.day}-${cached.month.number}-${cached.year}`,
      format: 'DD-MM-YYYY',
      day: cached.day,
      weekday: cached.weekday || { en: '', ar: '' },
      month: cached.month,
      year: cached.year,
    };
    dateConversionCache.set(cacheKey, result);
    return result;
  }

  let retryCount = 0;
  let delay = 2000; // Délai initial de 2 secondes

  while (retryCount < maxRetries) {
    try {
      const result = await gregorianToHijri(year, month, day);
      
      // Mettre en cache en mémoire (même si null)
      dateConversionCache.set(cacheKey, result);
      
      // Le cache persistant est géré dans gregorianToHijri()
      
      return result;
    } catch (error: unknown) {
      // Si c'est une erreur 429 (rate limit), attendre avant de réessayer
      const rateLimitError = error as RateLimitError;
      if (rateLimitError?.status === 429 || (rateLimitError?.response?.status === 429)) {
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Backoff exponentiel
        } else {
          dateConversionCache.set(cacheKey, null);
          return null;
        }
      } else {
        // Autre erreur, ne pas retry
        dateConversionCache.set(cacheKey, null);
        return null;
      }
    }
  }

  return null;
}

/**
 * Obtient un calendrier grégorien converti en Hijri pour un mois donné
 * 
 * @param gregorianYear - Année grégorienne
 * @param gregorianMonth - Mois grégorien (1-12)
 * @returns Calendrier complet du mois avec dates Hijri ou null si erreur
 * 
 * Note: L'API AlAdhan n'a pas d'endpoint direct gToHCalendar, donc on construit
 * le calendrier jour par jour en utilisant l'endpoint gToH pour chaque jour du mois.
 * On limite drastiquement les appels parallèles pour éviter le rate limiting.
 */
/**
 * Conversion locale approximative Hijri (pour optimisation)
 * Utilisée pour les jours non critiques pendant le chargement
 * Cette fonction est exportée pour être utilisée dans d'autres fichiers
 */
export function approximateGregorianToHijri(year: number, month: number, day: number): { day: number; month: number; year: number } {
  // Conversion approximative basée sur la différence moyenne
  const gregorianDate = new Date(year, month - 1, day);
  const epoch = new Date(622, 6, 16); // Époque Hijri
  const diffTime = gregorianDate.getTime() - epoch.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Année Hijri approximative (354.37 jours par année)
  const hijriYear = Math.floor(diffDays / 354.37) + 1;
  const daysInHijriYear = diffDays % Math.floor(354.37);
  
  // Mois approximatif (29.5 jours par mois en moyenne)
  const hijriMonth = Math.floor(daysInHijriYear / 29.5) + 1;
  const hijriDay = Math.floor(daysInHijriYear % 29.5) + 1;
  
  return {
    day: Math.max(1, Math.min(30, hijriDay)),
    month: Math.max(1, Math.min(12, hijriMonth)),
    year: hijriYear
  };
}

/**
 * Charge un calendrier de manière optimisée avec chargement progressif
 */
export async function getGregorianCalendarWithHijri(gregorianYear: number, gregorianMonth: number): Promise<CalendarDayData[] | null> {
  if (!gregorianYear || !gregorianMonth || isNaN(gregorianYear) || isNaN(gregorianMonth)) {
    return null;
  }

  // Vérifier le cache en mémoire d'abord
  const cacheKey = `calendar-${gregorianYear}-${gregorianMonth}`;
  if (calendarCache.has(cacheKey)) {
    return calendarCache.get(cacheKey)!;
  }

  const online = await isOnline();
  const daysInMonth = new Date(gregorianYear, gregorianMonth, 0).getDate();
  const calendarData: CalendarDayData[] = [];

  try {
    // Si pas de connexion, utiliser conversion approximative pour tous les jours
  if (!online) {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(gregorianYear, gregorianMonth - 1, day);
        const weekdayEn = dateObj.toLocaleString('en', { weekday: 'long' });
        const monthEn = dateObj.toLocaleString('en', { month: 'long' });
        const approxHijri = approximateGregorianToHijri(gregorianYear, gregorianMonth, day);
        
        calendarData.push({
          gregorian: {
            date: `${day}-${gregorianMonth}-${gregorianYear}`,
            day: day.toString(),
            month: {
              number: gregorianMonth.toString(),
              en: monthEn,
            },
            year: gregorianYear.toString(),
            weekday: {
              en: weekdayEn,
              ar: '',
            },
          },
          hijri: {
            date: `${approxHijri.day}-${approxHijri.month}-${approxHijri.year}`,
            day: approxHijri.day.toString(),
            month: {
              number: approxHijri.month,
              en: '',
              ar: '',
            },
            year: approxHijri.year.toString(),
            weekday: {
              en: weekdayEn,
              ar: '',
            },
          },
        });
      }
      
      if (calendarData.length > 0) {
        calendarCache.set(cacheKey, calendarData);
        return calendarData;
      }
    return null;
  }

    // Avec connexion : charger les jours critiques d'abord (1er, 15, dernier, aujourd'hui)
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();
    
    const criticalDays = new Set<number>();
    criticalDays.add(1); // Premier jour
    criticalDays.add(15); // Milieu du mois
    criticalDays.add(daysInMonth); // Dernier jour
    
    // Ajouter aujourd'hui si c'est dans ce mois
    if (todayYear === gregorianYear && todayMonth === gregorianMonth) {
      criticalDays.add(todayDay);
    }

    // Vérifier le cache persistant pour tous les jours du mois d'abord
    const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const datesToCheck = allDays.map(day => ({ year: gregorianYear, month: gregorianMonth, day }));
    const cachedDates = await getCachedHijriDates(datesToCheck);

    // Charger les jours critiques qui ne sont pas en cache
    const criticalDayNumbers = Array.from(criticalDays);
    const criticalPromises: Promise<HijriDate | null>[] = [];
    
    for (const day of criticalDayNumbers) {
      const cacheKey = `${gregorianYear}-${gregorianMonth}-${day}`;
      if (cachedDates.has(cacheKey)) {
        // Utiliser le cache
        const cached = cachedDates.get(cacheKey)!;
        criticalPromises.push(Promise.resolve({
          date: `${cached.day}-${cached.month.number}-${cached.year}`,
          format: 'DD-MM-YYYY',
          day: cached.day,
          weekday: cached.weekday || { en: '', ar: '' },
          month: cached.month,
          year: cached.year,
        }));
      } else {
        // Charger depuis l'API
        criticalPromises.push(gregorianToHijriWithRetry(gregorianYear, gregorianMonth, day));
      }
    }
    
    const criticalResults = await Promise.all(criticalPromises);
    
    // Construire les données pour les jours critiques
    for (let i = 0; i < criticalDayNumbers.length; i++) {
      const day = criticalDayNumbers[i];
      const hijriDate = criticalResults[i];
      
      if (hijriDate) {
        const dateObj = new Date(gregorianYear, gregorianMonth - 1, day);
        const weekdayEn = dateObj.toLocaleString('en', { weekday: 'long' });
        const monthEn = dateObj.toLocaleString('en', { month: 'long' });
        
        calendarData.push({
          gregorian: {
            date: `${day}-${gregorianMonth}-${gregorianYear}`,
            day: day.toString(),
            month: {
              number: gregorianMonth.toString(),
              en: monthEn,
            },
            year: gregorianYear.toString(),
            weekday: {
              en: weekdayEn,
              ar: hijriDate.weekday?.ar || '',
            },
          },
          hijri: {
            date: hijriDate.date,
            day: hijriDate.day,
            month: hijriDate.month,
            year: hijriDate.year,
            weekday: hijriDate.weekday,
          },
        });
    }
    }

    // Pour les autres jours, utiliser conversion approximative
    // et charger progressivement en arrière-plan (sans bloquer)
    for (let day = 1; day <= daysInMonth; day++) {
      if (criticalDays.has(day)) {
        continue; // Déjà chargé
      }

      const dateObj = new Date(gregorianYear, gregorianMonth - 1, day);
      const weekdayEn = dateObj.toLocaleString('en', { weekday: 'long' });
      const monthEn = dateObj.toLocaleString('en', { month: 'long' });
      const approxHijri = approximateGregorianToHijri(gregorianYear, gregorianMonth, day);
      
      calendarData.push({
        gregorian: {
          date: `${day}-${gregorianMonth}-${gregorianYear}`,
          day: day.toString(),
          month: {
            number: gregorianMonth.toString(),
            en: monthEn,
          },
          year: gregorianYear.toString(),
          weekday: {
            en: weekdayEn,
            ar: '',
          },
        },
        hijri: {
          date: `${approxHijri.day}-${approxHijri.month}-${approxHijri.year}`,
          day: approxHijri.day.toString(),
          month: {
            number: approxHijri.month,
            en: '',
            ar: '',
          },
          year: approxHijri.year.toString(),
          weekday: {
            en: weekdayEn,
            ar: '',
          },
        },
    });
    }

    // Trier par jour
    calendarData.sort((a, b) => parseInt(a.gregorian.day) - parseInt(b.gregorian.day));

    // Charger les jours restants en arrière-plan (sans bloquer l'affichage)
    if (calendarData.length > 0) {
      // Mettre en cache immédiatement avec données approximatives
      calendarCache.set(cacheKey, calendarData);
      
      // Charger les jours restants en arrière-plan (batch de 5 avec délai réduit)
      setTimeout(async () => {
        const remainingDays: number[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          if (!criticalDays.has(day)) {
            remainingDays.push(day);
          }
        }

        // Charger par batch de 5 avec délai de 200ms
        for (let i = 0; i < remainingDays.length; i += 5) {
          const batch = remainingDays.slice(i, i + 5);
          const batchPromises = batch.map(day => 
            gregorianToHijriWithRetry(gregorianYear, gregorianMonth, day)
          );
          
          const batchResults = await Promise.all(batchPromises);
          
          // Mettre à jour les données avec les vraies valeurs
          for (let j = 0; j < batch.length; j++) {
            const day = batch[j];
            const hijriDate = batchResults[j];
            
            if (hijriDate) {
              const index = calendarData.findIndex(d => parseInt(d.gregorian.day) === day);
              if (index >= 0) {
                calendarData[index].hijri = {
                  date: hijriDate.date,
                  day: hijriDate.day,
                  month: hijriDate.month,
                  year: hijriDate.year,
                  weekday: hijriDate.weekday,
                };
              }
            }
          }
          
          // Délai réduit entre les batches
          if (i + 5 < remainingDays.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // Mettre à jour le cache avec les vraies valeurs
        calendarCache.set(cacheKey, calendarData);
      }, 100);
    }

    if (calendarData.length === 0) {
      return null;
    }

    return calendarData;
  } catch (error) {
    // Erreur lors de la construction - retourner null silencieusement
    return null;
  }
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
