// Service API pour AlQuran Cloud
// Documentation: https://alquran.cloud/api

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.alquranCloudBaseUrl || "https://api.alquran.cloud/v1";

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: Ayah[];
}

export interface SurahResponse {
  code: number;
  status: string;
  data: SurahData;
}

const CACHE_KEY_PREFIX = 'quran_alquran_cloud_';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 jours

interface CacheEntry {
  data: SurahResponse;
  timestamp: number;
}

// Fonction pour obtenir une sourate depuis le cache ou l'API
async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data as T;
      }
    }
  } catch (e) {
    // Ignore cache errors
  }

  const data = await fetchFn();
  
  try {
    const cacheEntry: CacheEntry = {
      data: data as any,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (e) {
    // Ignore cache errors
  }

  return data;
}

/**
 * Récupère une sourate en arabe (quran-uthmani)
 */
export async function getSurahArabic(surahNumber: number): Promise<SurahData> {
  const cacheKey = `${CACHE_KEY_PREFIX}arabic_${surahNumber}`;
  
  return getCachedOrFetch(cacheKey, async () => {
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}/quran-uthmani`);
    if (!response.ok) {
      throw new Error(`Failed to fetch surah ${surahNumber}: ${response.statusText}`);
    }
    const data: SurahResponse = await response.json();
    return data.data;
  });
}

/**
 * Récupère une sourate en traduction selon la langue (fr, en, ar)
 */
export async function getSurahTranslation(surahNumber: number, lang: 'fr' | 'en' | 'ar' = 'fr'): Promise<SurahData> {
  // Mapper les langues aux codes de traduction de l'API
  const translationMap: Record<'fr' | 'en' | 'ar', string> = {
    fr: 'fr.hamidullah',
    en: 'en.ahmedali',
    ar: 'ar.alafasy' // Pour l'arabe, on utilise le texte arabe (pas de traduction)
  };
  
  const translationCode = translationMap[lang];
  const cacheKey = `${CACHE_KEY_PREFIX}${lang}_${surahNumber}`;
  
  return getCachedOrFetch(cacheKey, async () => {
    // Pour l'arabe, on retourne le texte arabe (quran-uthmani)
    if (lang === 'ar') {
      return getSurahArabic(surahNumber);
    }
    
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}/${translationCode}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${lang} translation for surah ${surahNumber}: ${response.statusText}`);
    }
    const data: SurahResponse = await response.json();
    return data.data;
  });
}

/**
 * Récupère une sourate en traduction française (Hamidullah) - DEPRECATED, utiliser getSurahTranslation
 */
export async function getSurahFrench(surahNumber: number): Promise<SurahData> {
  return getSurahTranslation(surahNumber, 'fr');
}

/**
 * Récupère une sourate avec texte arabe et traduction selon la langue de l'utilisateur
 */
export async function getSurahWithTranslation(surahNumber: number, userLang: 'fr' | 'en' | 'ar' = 'fr'): Promise<{
  arabic: SurahData;
  translation: SurahData;
}> {
  const [arabic, translation] = await Promise.all([
    getSurahArabic(surahNumber),
    getSurahTranslation(surahNumber, userLang)
  ]);

  return { arabic, translation };
}

/**
 * Récupère un verset spécifique
 */
export async function getAyah(surahNumber: number, ayahNumber: number): Promise<{
  arabic: Ayah;
  french: Ayah;
}> {
  const { arabic, french } = await getSurahWithTranslation(surahNumber);
  
  const arabicAyah = arabic.ayahs.find(a => a.numberInSurah === ayahNumber);
  const frenchAyah = french.ayahs.find(a => a.numberInSurah === ayahNumber);

  if (!arabicAyah || !frenchAyah) {
    throw new Error(`Ayah ${ayahNumber} not found in surah ${surahNumber}`);
  }

  return {
    arabic: arabicAyah,
    french: frenchAyah
  };
}

/**
 * Nettoie le cache (optionnel, pour libérer de l'espace)
 */
export async function clearQuranCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const quranKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(quranKeys);
  } catch (e) {
    console.error('Error clearing Quran cache:', e);
  }
}


