// Minimal Quran API service using Quran.com API
// Source: https://api.quran.com/api/v4
// No cache, no AsyncStorage, no side effects
// Guarantees: Arabic and translations are strictly separated

const BASE_URL = 'https://api.quran.com/api/v4';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fonction utilitaire pour le cache
// Cache infini par défaut pour le Coran (le texte ne change pas)
async function getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (e) {
    // Ignore cache errors
  }

  const data = await fetcher();

  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // Ignore write errors
  }

  return data;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz?: number;
  manzil?: number;
  page?: number;
  ruku?: number;
  hizbQuarter?: number;
  sajda?: boolean;
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

// Quran.com API response structure for Arabic verses
interface QuranComVerse {
  id: number;
  verse_number: number;
  chapter_id: number;
  text_uthmani: string;
  translations?: Array<{
    id: number;
    text: string;
    resource_name: string;
    resource_id: number;
  }>;
}

// Quran.com API response structure for translations
interface QuranComTranslationVerse {
  id: number;
  verse_number: number;
  chapter_id: number;
  text: string; // Translation text is directly in 'text' field
  resource_id?: number;
  resource_name?: string;
}

interface QuranComResponse {
  verses: QuranComVerse[];
  pagination?: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

interface QuranComTranslationResponse {
  translations: QuranComTranslationVerse[];
  pagination?: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

interface QuranComChapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    name: string;
    language_name: string;
  };
}

interface QuranComChapterResponse {
  chapter: QuranComChapter;
}

// Translation IDs for Quran.com API
const TRANSLATION_IDS = {
  fr: 31, // fr.hamidullah
  en: 131, // en.sahih
} as const;

// Transliteration ID for Quran.com API
const TRANSLITERATION_ID = 57; // English Transliteration

/**
 * Safe fetch helper with manual JSON parsing
 */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'identity',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();

  if (!text || text.trim().length === 0) {
    throw new Error(`Empty response from ${url}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (e: any) {
    throw new Error(`JSON parse error for ${url}: ${e.message}`);
  }
}

/**
 * Quran.com translations may contain HTML + footnote tags.
 * We render translations as plain text in RN, so we strip those tags.
 * Example to remove: <supfoot_note=211798>1</sup>
 */
function sanitizeTranslationText(input: string): string {
  if (!input) return '';

  let t = input;

  // Preserve line breaks
  t = t.replace(/<br\s*\/?>/gi, '\n');

  // Remove Quran.com footnotes
  t = t.replace(/<supfoot_note=\d+>\s*\d+\s*<\/sup>/gi, '');
  t = t.replace(/<sup[^>]*foot_note[^>]*>[\s\S]*?<\/sup>/gi, '');

  // Remove other <sup>...</sup> (often used for notes)
  t = t.replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '');

  // Strip remaining HTML tags
  t = t.replace(/<\/?[^>]+>/g, '');

  // Decode a few common HTML entities
  t = t
    .replace(/\u00A0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Normalize whitespace
  t = t.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');
  t = t.replace(/\n{3,}/g, '\n\n');

  return t.trim();
}

/**
 * Fetch chapter metadata
 */
/**
 * Fetch chapter metadata
 */
async function getChapterInfo(surahNumber: number): Promise<QuranComChapter> {
  return getCachedOrFetch<QuranComChapter>(`quran_chapter_${surahNumber}`, async () => {
    const url = `${BASE_URL}/chapters/${surahNumber}`;
    const json = await fetchJson<QuranComChapterResponse>(url);

    if (!json?.chapter) {
      throw new Error(`Invalid chapter info for surah ${surahNumber}`);
    }

    return json.chapter;
  });
}

/**
 * Fetch Arabic surah (Uthmani edition)
 */
/**
 * Fetch Arabic surah (Uthmani edition)
 */
export async function getSurahArabic(surahNumber: number): Promise<SurahData> {
  return getCachedOrFetch<SurahData>(`quran_surah_arabic_${surahNumber}`, async () => {
    const url = `${BASE_URL}/quran/verses/uthmani?chapter_number=${surahNumber}`;
    const json = await fetchJson<QuranComResponse>(url);
    const chapter = await getChapterInfo(surahNumber);

    if (!json?.verses || !Array.isArray(json.verses) || json.verses.length === 0) {
      throw new Error(`Invalid Arabic surah ${surahNumber} response structure`);
    }

    const ayahs: Ayah[] = json.verses.map((verse) => ({
      number: verse.id,
      text: verse.text_uthmani,
      numberInSurah: verse.verse_number,
      // Note: Quran.com API doesn't provide juz, manzil, page, etc. in this endpoint
      // These would need to be fetched separately if needed
    }));

    return {
      number: surahNumber,
      name: chapter.name_arabic,
      englishName: chapter.name_simple,
      englishNameTranslation: chapter.translated_name?.name || chapter.name_simple,
      numberOfAyahs: chapter.verses_count,
      revelationType: chapter.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
      ayahs,
    };
  });
}

/**
 * Fetch translation (FR / EN only)
 * Translations are strictly separated from Arabic text
 */
export async function getSurahTranslation(
  surahNumber: number,
  lang: 'fr' | 'en' = 'fr'
): Promise<SurahData> {
  return getCachedOrFetch<SurahData>(`quran_surah_${lang}_${surahNumber}`, async () => {
    const translationId = TRANSLATION_IDS[lang];
    const url = `${BASE_URL}/quran/translations/${translationId}?chapter_number=${surahNumber}`;

    try {
      // Try both possible response structures
      const json = await fetchJson<any>(url);
      const chapter = await getChapterInfo(surahNumber);

      // Check if it's the translations array structure
      if (json?.translations && Array.isArray(json.translations)) {
        if (json.translations.length === 0) {
          throw new Error(`No translations found for surah ${surahNumber}`);
        }

        const ayahs: Ayah[] = json.translations.map((verse: QuranComTranslationVerse) => {
          const cleaned = sanitizeTranslationText(verse.text || '');
          if (!cleaned) {
            throw new Error(
              `Missing translation text for surah ${surahNumber}, ayah ${verse.verse_number}`
            );
          }

          return {
            number: verse.id,
            text: cleaned,
            numberInSurah: verse.verse_number,
          };
        });

        return {
          number: surahNumber,
          name: chapter.name_arabic,
          englishName: chapter.name_simple,
          englishNameTranslation: chapter.translated_name?.name || chapter.name_simple,
          numberOfAyahs: chapter.verses_count,
          revelationType: chapter.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
          ayahs,
        };
      }

      // Check if it's the verses array structure (with translations nested)
      if (json?.verses && Array.isArray(json.verses)) {
        if (json.verses.length === 0) {
          throw new Error(`No verses found in ${lang} translation for surah ${surahNumber}`);
        }

        const ayahs: Ayah[] = json.verses.map((verse: any) => {
          // Try to get translation from nested translations array
          const raw = verse.translations?.[0]?.text || verse.text || '';
          const cleaned = sanitizeTranslationText(raw);

          if (!cleaned) {
            throw new Error(
              `Missing translation text for surah ${surahNumber}, ayah ${verse.verse_number}. ` +
              `Verse structure: ${JSON.stringify(Object.keys(verse)).substring(0, 200)}`
            );
          }

          return {
            number: verse.id,
            text: cleaned,
            numberInSurah: verse.verse_number,
          };
        });

        return {
          number: surahNumber,
          name: chapter.name_arabic,
          englishName: chapter.name_simple,
          englishNameTranslation: chapter.translated_name?.name || chapter.name_simple,
          numberOfAyahs: chapter.verses_count,
          revelationType: chapter.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
          ayahs,
        };
      }

      // Unknown structure
      throw new Error(
        `Invalid ${lang} translation response structure for surah ${surahNumber}. ` +
        `Expected 'translations' or 'verses' array. Got: ${JSON.stringify(Object.keys(json || {})).substring(0, 200)}`
      );
    } catch (error: any) {
      // Re-throw with more context
      if (error.message && (error.message.includes('Invalid') || error.message.includes('Missing'))) {
        throw error;
      }
      throw new Error(
        `Failed to fetch ${lang} translation for surah ${surahNumber}: ${error.message || error}`
      );
    }
  });
}

/**
 * Fetch Arabic + Translation together
 * For Arabic (lang='ar'), returns Arabic text only (no translation needed)
 * For French/English, returns Arabic + translation (strictly separated)
 */
export async function getSurahWithTranslation(
  surahNumber: number,
  lang: 'fr' | 'en' | 'ar' = 'fr'
): Promise<{
  arabic: SurahData;
  translation: SurahData;
}> {
  // For Arabic, no translation needed - return Arabic twice for compatibility
  if (lang === 'ar') {
    const arabic = await getSurahArabic(surahNumber);
    return { arabic, translation: arabic };
  }

  // For French and English, load Arabic + translation (strictly separated)
  const [arabic, translation] = await Promise.all([
    getSurahArabic(surahNumber),
    getSurahTranslation(surahNumber, lang),
  ]);

  return { arabic, translation };
}

/**
 * Get specific ayah (verse)
 */
export async function getAyah(
  surahNumber: number,
  ayahNumber: number
): Promise<{
  arabic: Ayah;
  french: Ayah;
}> {
  const { arabic, translation } = await getSurahWithTranslation(surahNumber);

  const arabicAyah = arabic.ayahs.find((a: Ayah) => a.numberInSurah === ayahNumber);
  const frenchAyah = translation.ayahs.find((a: Ayah) => a.numberInSurah === ayahNumber);

  if (!arabicAyah || !frenchAyah) {
    throw new Error(`Ayah ${ayahNumber} not found in surah ${surahNumber}`);
  }

  return {
    arabic: arabicAyah,
    french: frenchAyah,
  };
}

/**
 * Fetch transliteration (English phonetic)
 */
/**
 * Fetch transliteration (English phonetic)
 */
export async function getSurahTransliteration(surahNumber: number): Promise<SurahData> {
  return getCachedOrFetch<SurahData>(`quran_surah_transliteration_${surahNumber}`, async () => {
    const url = `${BASE_URL}/quran/transliteration/${TRANSLITERATION_ID}?chapter_number=${surahNumber}`;

    try {
      const json = await fetchJson<any>(url);
      const chapter = await getChapterInfo(surahNumber);

      // Check if it's the transliterations array structure
      if (json?.transliterations && Array.isArray(json.transliterations)) {
        if (json.transliterations.length === 0) {
          throw new Error(`No transliterations found for surah ${surahNumber}`);
        }

        const ayahs: Ayah[] = json.transliterations.map((verse: any) => {
          const text = verse.text || '';
          if (!text) {
            throw new Error(
              `Missing transliteration text for surah ${surahNumber}, ayah ${verse.verse_number || verse.verse_key}`
            );
          }

          // Extract verse number from verse_key (e.g., "2:1" -> 1)
          const verseNumber = verse.verse_key
            ? parseInt(verse.verse_key.split(':')[1] || '1', 10)
            : (verse.verse_number || 1);

          return {
            number: verse.id || verseNumber,
            text: text.trim(),
            numberInSurah: verseNumber,
          };
        });

        return {
          number: surahNumber,
          name: chapter.name_arabic,
          englishName: chapter.name_simple,
          englishNameTranslation: chapter.translated_name?.name || chapter.name_simple,
          numberOfAyahs: chapter.verses_count,
          revelationType: chapter.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
          ayahs,
        };
      }

      // Unknown structure
      throw new Error(
        `Invalid transliteration response structure for surah ${surahNumber}. ` +
        `Expected 'transliterations' array. Got: ${JSON.stringify(Object.keys(json || {})).substring(0, 200)}`
      );
    } catch (error: any) {
      // Re-throw with more context
      if (error.message && (error.message.includes('Invalid') || error.message.includes('Missing'))) {
        throw error;
      }
      throw new Error(
        `Failed to fetch transliteration for surah ${surahNumber}: ${error.message || error}`
      );
    }
  });
}

/**
 * Legacy alias for compatibility
 */
export async function getSurahFrench(surahNumber: number): Promise<SurahData> {
  return getSurahTranslation(surahNumber, 'fr');
}
