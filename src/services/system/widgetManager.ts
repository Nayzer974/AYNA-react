/**
 * Service de gestion des widgets iOS/Android
 * GÃ¨re les donnÃ©es des widgets : heures de priÃ¨re, dhikr, verset du jour
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayPrayerTimes, initialize } from '@/services/content/PrayerTimeManager';
import { getDhikrOfDay } from '@/services/content/dhikr';
import { getSurahWithTranslation } from '@/services/content/quranApi';

const WIDGET_DATA_KEY = '@ayna_widget_data';
const WIDGET_UPDATE_INTERVAL = 60 * 60 * 1000; // 1 heure

export interface PrayerTimesWidgetData {
  type: 'prayer_times';
  timings: {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
  };
  nextPrayer: {
    name: string;
    time: string;
    timeUntil: string;
  } | null;
  date: string;
}

export interface DhikrWidgetData {
  type: 'dhikr';
  arabic: string;
  transliteration?: string;
  translation?: string;
  reference?: string;
  date: string;
}

export interface VerseWidgetData {
  type: 'verse';
  arabic: string;
  translation: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  date: string;
}

export type WidgetData = PrayerTimesWidgetData | DhikrWidgetData | VerseWidgetData;

export interface AllWidgetsData {
  prayerTimes: PrayerTimesWidgetData | null;
  dhikr: DhikrWidgetData | null;
  verse: VerseWidgetData | null;
  lastUpdate: number;
}

/**
 * RÃ©cupÃ¨re les donnÃ©es des heures de priÃ¨re pour le widget
 */
export async function getPrayerTimesWidgetData(
  userLocation?: { latitude: number; longitude: number }
): Promise<PrayerTimesWidgetData | null> {
  try {
    // Initialiser les heures de priÃ¨re si nÃ©cessaire
    const timings = await getTodayPrayerTimes();
    if (!timings) {
      if (userLocation) {
        await initialize(userLocation);
        const updatedTimings = await getTodayPrayerTimes(userLocation);
        if (!updatedTimings) return null;
        return formatPrayerTimesData(updatedTimings);
      }
      return null;
    }

    return formatPrayerTimesData(timings);
  } catch (error) {
    console.error('Erreur lors de la rÃ©cupÃ©ration des heures de priÃ¨re pour widget:', error);
    return null;
  }
}

function formatPrayerTimesData(timings: Record<string, string>): PrayerTimesWidgetData {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
  
  // Trouver la prochaine priÃ¨re
  let nextPrayer: { name: string; time: string; timeUntil: string } | null = null;
  const prayerTimes: Array<{ name: string; time: string; dateTime: Date }> = [];

  prayers.forEach(prayerName => {
    const time = timings[prayerName];
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      const prayerDateTime = new Date();
      prayerDateTime.setHours(hours, minutes, 0, 0);
      prayerTimes.push({ name: prayerName, time, dateTime: prayerDateTime });
    }
  });

  // Trier par heure et trouver la prochaine
  prayerTimes.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  
  const futurePrayers = prayerTimes.filter(p => p.dateTime.getTime() > now.getTime());
  if (futurePrayers.length > 0) {
    const prayer = futurePrayers[0];
    const timeUntilMs = prayer.dateTime.getTime() - now.getTime();
    const hoursUntil = Math.floor(timeUntilMs / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeUntilMs % (1000 * 60 * 60)) / (1000 * 60));
    
    nextPrayer = {
      name: prayer.name,
      time: prayer.time,
      timeUntil: hoursUntil > 0 ? `${hoursUntil}h ${minutesUntil}m` : `${minutesUntil}m`,
    };
  }

  return {
    type: 'prayer_times',
    timings: {
      Fajr: timings.Fajr || '',
      Dhuhr: timings.Dhuhr || '',
      Asr: timings.Asr || '',
      Maghrib: timings.Maghrib || '',
      Isha: timings.Isha || '',
    },
    nextPrayer,
    date: today,
  };
}

/**
 * RÃ©cupÃ¨re les donnÃ©es du dhikr du jour pour le widget
 */
export async function getDhikrWidgetData(): Promise<DhikrWidgetData | null> {
  try {
    const dhikr = await getDhikrOfDay('fr');
    if (!dhikr) return null;

    const today = new Date().toISOString().split('T')[0];

    return {
      type: 'dhikr',
      arabic: dhikr.text || '',
      transliteration: dhikr.transliteration,
      translation: dhikr.translation,
      reference: dhikr.reference,
      date: today,
    };
  } catch (error) {
    console.error('Erreur lors de la rÃ©cupÃ©ration du dhikr pour widget:', error);
    return null;
  }
}

/**
 * RÃ©cupÃ¨re le verset du jour pour le widget
 * Utilise un index basÃ© sur le jour pour avoir le mÃªme verset toute la journÃ©e
 */
export async function getVerseWidgetData(language: 'fr' | 'en' | 'ar' = 'fr'): Promise<VerseWidgetData | null> {
  try {
    // Calculer un index basÃ© sur le jour (pour avoir le mÃªme verset toute la journÃ©e)
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    
    // Utiliser un pattern simple : 114 sourates, on fait un modulo pour choisir une sourate
    // Puis on prend un verset alÃ©atoire mais dÃ©terminÃ© par le jour
    const surahNumber = (dayIndex % 114) + 1;
    
    // RÃ©cupÃ©rer la sourate
    const { arabic: surah } = await getSurahWithTranslation(surahNumber, language);
    
    // Prendre le premier verset ou un verset spÃ©cifique basÃ© sur le jour
    const verseIndex = (dayIndex % Math.max(1, surah.ayahs.length));
    const ayah = surah.ayahs[verseIndex] || surah.ayahs[0];
    
    if (!ayah) return null;

    // RÃ©cupÃ©rer la traduction
    const { translation } = await getSurahWithTranslation(surahNumber, language);
    const translationAyah = translation.ayahs[verseIndex] || translation.ayahs[0];

    const today = new Date().toISOString().split('T')[0];

    return {
      type: 'verse',
      arabic: ayah.text,
      translation: translationAyah?.text || '',
      surahNumber: surah.number,
      ayahNumber: ayah.numberInSurah,
      surahName: surah.englishName || surah.name || `Sourate ${surah.number}`,
      date: today,
    };
  } catch (error) {
    console.error('Erreur lors de la rÃ©cupÃ©ration du verset pour widget:', error);
    return null;
  }
}

/**
 * Met Ã  jour toutes les donnÃ©es des widgets et les stocke localement
 */
export async function updateAllWidgetsData(
  userLocation?: { latitude: number; longitude: number },
  language: 'fr' | 'en' | 'ar' = 'fr'
): Promise<AllWidgetsData> {
  try {
    const [prayerTimes, dhikr, verse] = await Promise.all([
      getPrayerTimesWidgetData(userLocation),
      getDhikrWidgetData(),
      getVerseWidgetData(language),
    ]);

    const data: AllWidgetsData = {
      prayerTimes,
      dhikr,
      verse,
      lastUpdate: Date.now(),
    };

    // Stocker les donnÃ©es
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));

    // Sauvegarder pour les widgets natifs (si disponibles)
    await saveWidgetDataForNative(data);

    return data;
  } catch (error) {
    console.error('Erreur lors de la mise Ã  jour des donnÃ©es des widgets:', error);
    throw error;
  }
}

/**
 * RÃ©cupÃ¨re les donnÃ©es des widgets depuis le stockage local
 */
export async function getStoredWidgetsData(): Promise<AllWidgetsData | null> {
  try {
    const stored = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (!stored) return null;

    const data: AllWidgetsData = JSON.parse(stored);
    
    // VÃ©rifier si les donnÃ©es sont encore valides (moins d'une heure)
    const now = Date.now();
    if (now - data.lastUpdate > WIDGET_UPDATE_INTERVAL) {
      // Les donnÃ©es sont expirÃ©es, retourner null pour forcer une mise Ã  jour
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de la rÃ©cupÃ©ration des donnÃ©es des widgets:', error);
    return null;
  }
}

/**
 * Synchronise les donnÃ©es des widgets
 * Ã€ appeler pÃ©riodiquement ou lors du lancement de l'app
 */
export async function syncWidgetsData(
  userLocation?: { latitude: number; longitude: number },
  language: 'fr' | 'en' | 'ar' = 'fr'
): Promise<AllWidgetsData> {
  // VÃ©rifier si on a des donnÃ©es rÃ©centes
  const stored = await getStoredWidgetsData();
  if (stored) {
    return stored;
  }

  // Sinon, mettre Ã  jour
  return await updateAllWidgetsData(userLocation, language);
}

/**
 * Sauvegarde les donnÃ©es des widgets pour les extensions natives
 * Cette fonction sera implÃ©mentÃ©e avec un module natif Expo
 */
async function saveWidgetDataForNative(data: AllWidgetsData): Promise<void> {
  try {
    // Pour iOS : Utiliser App Groups (UserDefaults)
    // Pour Android : Utiliser SharedPreferences
    // Note: NÃ©cessite un module Expo personnalisÃ© ou un package natif
    
    // Pour l'instant, sauvegarder dans AsyncStorage qui est accessible
    // Les extensions natives devront lire depuis SharedPreferences/UserDefaults
    // via un module Expo ou une configuration manuelle
    
    // Structure pour le partage :
    // - iOS: UserDefaults(suiteName: "group.com.ayna.app.shared")
    // - Android: SharedPreferences avec mode MODE_MULTI_PROCESS
    
    if (data.prayerTimes) {
      await AsyncStorage.setItem('@ayna_widget_prayer_times', JSON.stringify(data.prayerTimes));
    }
    if (data.dhikr) {
      await AsyncStorage.setItem('@ayna_widget_dhikr', JSON.stringify(data.dhikr));
    }
    if (data.verse) {
      await AsyncStorage.setItem('@ayna_widget_verse', JSON.stringify(data.verse));
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des donnÃ©es pour les widgets natifs:', error);
  }
}


