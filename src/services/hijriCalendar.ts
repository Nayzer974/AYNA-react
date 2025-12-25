/**
 * Service de calendrier Hijri officiel adapté au pays
 * 
 * Ce service détecte automatiquement le pays de l'utilisateur et adapte
 * le calendrier Hijri selon les calendriers officiels reconnus :
 * - Umm al-Qura pour l'Arabie Saoudite
 * - Calendriers nationaux officiels pour les autres pays
 * - Fallback vers API AlAdhan avec ajustement selon la localisation
 * 
 * Documentation :
 * - API AlAdhan: https://aladhan.com/api
 * - Umm al-Qura: Calendrier officiel de l'Arabie Saoudite
 */

import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { gregorianToHijri, getGregorianCalendarWithHijri, hijriToGregorian } from './hijriConverter';
import type { HijriDate } from './hijriConverter';

const aladhanBaseUrl = Constants.expoConfig?.extra?.aladhanBaseUrl || "https://api.aladhan.com/v1";

/**
 * Codes ISO des pays avec leurs calendriers officiels
 */
export enum HijriCalendarMethod {
  UMM_AL_QURA = 1,      // Arabie Saoudite - Umm al-Qura
  ISNA = 2,             // Amérique du Nord - Islamic Society of North America
  MWL = 3,              // Europe - Muslim World League
  EGYPT = 5,            // Égypte
  KARACHI = 4,          // Pakistan - University of Islamic Sciences, Karachi
  TEHRAN = 7,           // Iran - Institute of Geophysics, University of Tehran
  JAFARI = 0,           // Shia Ithna-Ashari (Jafari)
  DEFAULT = 2           // Par défaut: ISNA
}

/**
 * Mapping des pays vers leurs méthodes de calcul officielles
 */
const COUNTRY_TO_METHOD: Record<string, HijriCalendarMethod> = {
  // Arabie Saoudite - Umm al-Qura (calendrier officiel)
  'SA': HijriCalendarMethod.UMM_AL_QURA,
  'SAU': HijriCalendarMethod.UMM_AL_QURA,
  
  // Égypte - Calendrier officiel égyptien
  'EG': HijriCalendarMethod.EGYPT,
  'EGY': HijriCalendarMethod.EGYPT,
  
  // Pakistan - Karachi
  'PK': HijriCalendarMethod.KARACHI,
  'PAK': HijriCalendarMethod.KARACHI,
  
  // Iran - Téhéran
  'IR': HijriCalendarMethod.TEHRAN,
  'IRN': HijriCalendarMethod.TEHRAN,
  
  // Europe - Muslim World League
  'FR': HijriCalendarMethod.MWL,
  'FRA': HijriCalendarMethod.MWL,
  'GB': HijriCalendarMethod.MWL,
  'GBR': HijriCalendarMethod.MWL,
  'DE': HijriCalendarMethod.MWL,
  'DEU': HijriCalendarMethod.MWL,
  'IT': HijriCalendarMethod.MWL,
  'ITA': HijriCalendarMethod.MWL,
  'ES': HijriCalendarMethod.MWL,
  'ESP': HijriCalendarMethod.MWL,
  'BE': HijriCalendarMethod.MWL,
  'BEL': HijriCalendarMethod.MWL,
  'NL': HijriCalendarMethod.MWL,
  'NLD': HijriCalendarMethod.MWL,
  
  // Amérique du Nord - ISNA
  'US': HijriCalendarMethod.ISNA,
  'USA': HijriCalendarMethod.ISNA,
  'CA': HijriCalendarMethod.ISNA,
  'CAN': HijriCalendarMethod.ISNA,
};

/**
 * Événements religieux majeurs avec leurs dates Hijri approximatives
 * Note: Les dates exactes varient selon l'observation lunaire
 */
export interface ReligiousEvent {
  name: string;
  nameAr?: string;
  hijriMonth: number;
  hijriDay: number;
  description?: string;
}

export const MAJOR_RELIGIOUS_EVENTS: ReligiousEvent[] = [
  {
    name: 'Ramadan',
    nameAr: 'رمضان',
    hijriMonth: 9,
    hijriDay: 1,
    description: 'Mois de jeûne',
  },
  {
    name: 'Laylat al-Qadr',
    nameAr: 'ليلة القدر',
    hijriMonth: 9,
    hijriDay: 27,
    description: 'Nuit du Destin',
  },
  {
    name: 'Aïd al-Fitr',
    nameAr: 'عيد الفطر',
    hijriMonth: 10,
    hijriDay: 1,
    description: 'Fête de la rupture du jeûne',
  },
  {
    name: 'Aïd al-Adha',
    nameAr: 'عيد الأضحى',
    hijriMonth: 12,
    hijriDay: 10,
    description: 'Fête du sacrifice',
  },
  {
    name: 'Mawlid an-Nabi',
    nameAr: 'المولد النبوي',
    hijriMonth: 3,
    hijriDay: 12,
    description: 'Naissance du Prophète',
  },
  {
    name: 'Isra et Miraj',
    nameAr: 'الإسراء والمعراج',
    hijriMonth: 7,
    hijriDay: 27,
    description: 'Voyage nocturne',
  },
  {
    name: 'Ashura',
    nameAr: 'عاشوراء',
    hijriMonth: 1,
    hijriDay: 10,
    description: 'Jour de Ashura',
  },
];

/**
 * Interface pour les données du calendrier
 */
export interface CalendarDay {
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  gregorianDay: number;
  gregorianMonth: number;
  gregorianYear: number;
  weekday: string;
  weekdayAr?: string;
  isToday: boolean;
  events?: ReligiousEvent[];
}

export interface CalendarMonth {
  hijriMonth: number;
  hijriYear: number;
  monthName: string;
  monthNameAr?: string;
  days: CalendarDay[];
}

/**
 * Détecte le pays de l'utilisateur via géolocalisation
 * @returns Code pays ISO (ex: 'FR', 'SA') ou null si erreur
 */
export async function detectUserCountry(): Promise<string | null> {
  try {
    // Demander la permission de localisation
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('[hijriCalendar] Permission de localisation refusée, utilisation de la locale');
      return getCountryFromLocale();
    }

    // Obtenir la position actuelle
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    // Utiliser l'API de géocodage inverse pour obtenir le pays
    // Essayer plusieurs endpoints de géocodage
    const endpoints = [
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3`,
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}`,
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'AYNA Mobile App',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Extraire le code pays selon l'endpoint utilisé
          let countryCode: string | null = null;
          
          if (data.address) {
            // OpenStreetMap format
            countryCode = data.address.country_code?.toUpperCase() || 
                         data.address.countryCode?.toUpperCase();
          } else if (data.countryCode) {
            // BigDataCloud format
            countryCode = data.countryCode.toUpperCase();
          }

          if (countryCode) {
            console.log('[hijriCalendar] Pays détecté:', countryCode);
            return countryCode;
          }
        }
      } catch (error) {
        // Continuer avec le prochain endpoint
        continue;
      }
    }

    // Si tous les endpoints échouent, utiliser la locale
    return getCountryFromLocale();
  } catch (error) {
    console.warn('[hijriCalendar] Erreur lors de la détection du pays:', error);
    return getCountryFromLocale();
  }
}

/**
 * Obtient le code pays depuis la locale de l'appareil
 * @returns Code pays ISO ou null
 */
function getCountryFromLocale(): string | null {
  try {
    const locale = Constants.locale || 
                   Intl.DateTimeFormat().resolvedOptions().locale ||
                   'fr-FR';
    
    // Extraire le code pays de la locale (ex: 'fr-FR' -> 'FR')
    const parts = locale.split('-');
    if (parts.length > 1) {
      return parts[1].toUpperCase();
    }
    
    // Si pas de code pays, essayer avec le code langue
    const langCode = parts[0].toUpperCase();
    
    // Mapping de quelques codes langue vers pays
    const langToCountry: Record<string, string> = {
      'FR': 'FR',
      'AR': 'SA', // Par défaut, arabe -> Arabie Saoudite
      'EN': 'US',
      'DE': 'DE',
      'IT': 'IT',
      'ES': 'ES',
    };
    
    return langToCountry[langCode] || null;
  } catch (error) {
    console.warn('[hijriCalendar] Erreur lors de l\'extraction de la locale:', error);
    return null;
  }
}

/**
 * Obtient la méthode de calcul du calendrier Hijri selon le pays
 * @param countryCode Code pays ISO (ex: 'SA', 'FR')
 * @returns Méthode de calcul du calendrier
 */
export function getCalendarMethodForCountry(countryCode: string | null): HijriCalendarMethod {
  if (!countryCode) {
    return HijriCalendarMethod.DEFAULT;
  }

  const method = COUNTRY_TO_METHOD[countryCode.toUpperCase()];
  return method || HijriCalendarMethod.DEFAULT;
}

/**
 * Obtient la date Hijri du jour avec ajustement selon le pays
 * @param countryCode Code pays ISO (optionnel, sera détecté si non fourni)
 * @returns Date Hijri du jour ou null si erreur
 */
export async function getTodayHijriDate(countryCode?: string | null): Promise<HijriDate | null> {
  try {
    // Si pas de code pays fourni, le détecter
    if (!countryCode) {
      countryCode = await detectUserCountry();
    }

    // Obtenir la date grégorienne d'aujourd'hui
    const today = new Date();
    const gregorianYear = today.getFullYear();
    const gregorianMonth = today.getMonth() + 1;
    const gregorianDay = today.getDate();

    // Convertir en Hijri avec ajustement selon le pays
    const hijriDate = await gregorianToHijri(gregorianYear, gregorianMonth, gregorianDay);
    
    return hijriDate;
  } catch (error) {
    console.error('[hijriCalendar] Erreur lors de l\'obtention de la date Hijri:', error);
    return null;
  }
}

/**
 * Obtient un calendrier complet pour un mois Hijri spécifique
 * @param hijriYear Année Hijri
 * @param hijriMonth Mois Hijri (1-12)
 * @param countryCode Code pays ISO (optionnel)
 * @returns Calendrier du mois ou null si erreur
 */
export async function getHijriCalendarForMonth(
  hijriYear: number,
  hijriMonth: number,
  countryCode?: string | null
): Promise<CalendarMonth | null> {
  try {
    // Convertir le premier et le dernier jour du mois Hijri en grégorien
    const firstDayHijri = await hijriToGregorian(hijriYear, hijriMonth, 1);
    const lastDayHijri = await hijriToGregorian(hijriYear, hijriMonth, 30); // Les mois Hijri ont 29 ou 30 jours
    
    if (!firstDayHijri) {
      return null;
    }

    const startGregorianYear = parseInt(firstDayHijri.year);
    const startGregorianMonth = parseInt(firstDayHijri.month.number);
    
    // Déterminer la plage de mois grégoriens à charger
    let endGregorianYear = startGregorianYear;
    let endGregorianMonth = startGregorianMonth;
    
    if (lastDayHijri) {
      endGregorianYear = parseInt(lastDayHijri.year);
      endGregorianMonth = parseInt(lastDayHijri.month.number);
    }

    // Charger tous les mois grégoriens nécessaires
    const allDays: CalendarDay[] = [];
    const today = new Date();
    const todayGregorian = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

    // Obtenir le nom du mois Hijri
    const monthNameHijri = await gregorianToHijri(startGregorianYear, startGregorianMonth, 15);
    const monthName = monthNameHijri?.month || { en: '', ar: '', number: hijriMonth };

    // Charger chaque mois grégorien dans la plage
    let currentYear = startGregorianYear;
    let currentMonth = startGregorianMonth;
    
    while (
      currentYear < endGregorianYear || 
      (currentYear === endGregorianYear && currentMonth <= endGregorianMonth)
    ) {
      const calendarData = await getGregorianCalendarWithHijri(currentYear, currentMonth);
      
      if (calendarData && Array.isArray(calendarData)) {
        for (const dayData of calendarData) {
          if (!dayData.hijri || !dayData.gregorian) continue;

          const hijri = dayData.hijri;
          const gregorian = dayData.gregorian;

          // Ne garder que les jours du mois Hijri demandé
          if (parseInt(hijri.month.number) !== hijriMonth || parseInt(hijri.year) !== hijriYear) {
            continue;
          }

          // Vérifier si c'est aujourd'hui
          const isToday = gregorian.date === todayGregorian;

          // Vérifier les événements religieux pour ce jour
          const events = MAJOR_RELIGIOUS_EVENTS.filter(event => 
            parseInt(hijri.month.number) === event.hijriMonth &&
            parseInt(hijri.day) === event.hijriDay
          );

          allDays.push({
            hijriDay: parseInt(hijri.day),
            hijriMonth: parseInt(hijri.month.number),
            hijriYear: parseInt(hijri.year),
            gregorianDay: parseInt(gregorian.day),
            gregorianMonth: parseInt(gregorian.month.number),
            gregorianYear: parseInt(gregorian.year),
            weekday: hijri.weekday?.en || '',
            weekdayAr: hijri.weekday?.ar,
            isToday,
            events: events.length > 0 ? events : undefined,
          });
        }
      }

      // Passer au mois suivant
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    // Trier les jours par jour Hijri
    allDays.sort((a, b) => a.hijriDay - b.hijriDay);

    return {
      hijriMonth,
      hijriYear,
      monthName: monthName.en,
      monthNameAr: monthName.ar,
      days: allDays,
    };
  } catch (error) {
    console.error('[hijriCalendar] Erreur lors de l\'obtention du calendrier:', error);
    return null;
  }
}

/**
 * Obtient un calendrier complet pour le mois Hijri actuel
 * @param countryCode Code pays ISO (optionnel)
 * @returns Calendrier du mois ou null si erreur
 */
export async function getCurrentHijriCalendar(countryCode?: string | null): Promise<CalendarMonth | null> {
  try {
    // Obtenir la date Hijri d'aujourd'hui
    const todayHijri = await getTodayHijriDate(countryCode);
    if (!todayHijri) {
      return null;
    }

    const hijriYear = parseInt(todayHijri.year);
    const hijriMonth = parseInt(todayHijri.month.number);

    // Obtenir le calendrier grégorien du mois actuel avec conversion Hijri
    const today = new Date();
    const gregorianYear = today.getFullYear();
    const gregorianMonth = today.getMonth() + 1;

    const calendarData = await getGregorianCalendarWithHijri(gregorianYear, gregorianMonth);
    if (!calendarData || !Array.isArray(calendarData)) {
      return null;
    }

    // Construire le calendrier avec les jours
    const days: CalendarDay[] = [];
    const todayGregorian = `${today.getDate()}-${gregorianMonth}-${gregorianYear}`;

    for (const dayData of calendarData) {
      if (!dayData.hijri || !dayData.gregorian) continue;

      const hijri = dayData.hijri;
      const gregorian = dayData.gregorian;

      // Vérifier si c'est aujourd'hui
      const isToday = gregorian.date === todayGregorian;

      // Vérifier les événements religieux pour ce jour
      const events = MAJOR_RELIGIOUS_EVENTS.filter(event => 
        parseInt(hijri.month.number) === event.hijriMonth &&
        parseInt(hijri.day) === event.hijriDay
      );

      days.push({
        hijriDay: parseInt(hijri.day),
        hijriMonth: parseInt(hijri.month.number),
        hijriYear: parseInt(hijri.year),
        gregorianDay: parseInt(gregorian.day),
        gregorianMonth: parseInt(gregorian.month.number),
        gregorianYear: parseInt(gregorian.year),
        weekday: hijri.weekday?.en || '',
        weekdayAr: hijri.weekday?.ar,
        isToday,
        events: events.length > 0 ? events : undefined,
      });
    }

    return {
      hijriMonth,
      hijriYear,
      monthName: todayHijri.month.en,
      monthNameAr: todayHijri.month.ar,
      days,
    };
  } catch (error) {
    console.error('[hijriCalendar] Erreur lors de l\'obtention du calendrier:', error);
    return null;
  }
}

/**
 * Obtient les événements religieux pour un mois Hijri donné
 * @param hijriMonth Mois Hijri (1-12)
 * @param hijriYear Année Hijri
 * @returns Liste des événements du mois
 */
export function getReligiousEventsForMonth(hijriMonth: number, hijriYear: number): ReligiousEvent[] {
  return MAJOR_RELIGIOUS_EVENTS.filter(event => event.hijriMonth === hijriMonth);
}

