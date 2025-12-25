/**
 * Versets du Coran pour le défi Sabila Nur
 * Source : https://quran.com (traduction Muhammad Hamidullah)
 */

export interface Verse {
  number: number;
  arabic: string;
  translation: string;
}

export interface SurahVerses {
  surahNumber: number;
  surahName: string;
  surahNameArabic: string;
  verses: Verse[];
}

/**
 * Sourate Al-Fatiha (1) - 7 versets
 * Source: https://quran.com/fr/1
 */
export const AL_FATIHA_VERSES: SurahVerses = {
  surahNumber: 1,
  surahName: 'Al-Fatiha',
  surahNameArabic: 'الفاتحة',
  verses: [
    {
      number: 1,
      arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
      translation: 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux.'
    },
    {
      number: 2,
      arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ',
      translation: 'Louange à Allah, Seigneur de l\'univers.'
    },
    {
      number: 3,
      arabic: 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
      translation: 'Le Tout Miséricordieux, le Très Miséricordieux,'
    },
    {
      number: 4,
      arabic: 'مَـٰلِكِ يَوْمِ ٱلدِّينِ',
      translation: 'Maître du Jour de la rétribution.'
    },
    {
      number: 5,
      arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
      translation: 'C\'est Toi [Seul] que nous adorons, et c\'est Toi [Seul] dont nous implorons secours.'
    },
    {
      number: 6,
      arabic: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
      translation: 'Guide-nous dans le droit chemin,'
    },
    {
      number: 7,
      arabic: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
      translation: 'le chemin de ceux que Tu as comblés de faveurs, non pas de ceux qui ont encouru Ta colère, ni des égarés.'
    }
  ]
};

/**
 * Sourate Yassine (36) - 83 versets
 * Source: https://quran.com/fr/36
 * Note: Les versets sont stockés ici pour référence dans le défi
 * Pour les versets complets, l'application utilisera l'API quranApi
 */
export const YASSINE_VERSES: SurahVerses = {
  surahNumber: 36,
  surahName: 'Yâ-Sîn',
  surahNameArabic: 'يس',
  verses: [
    // Les versets seront chargés dynamiquement depuis l'API
    // Cette structure sert de référence pour les numéros de versets
  ]
};

/**
 * Obtenir un verset spécifique d'Al-Fatiha
 */
export function getAlFatihaVerse(verseNumber: number): Verse | undefined {
  return AL_FATIHA_VERSES.verses.find(v => v.number === verseNumber);
}

/**
 * Obtenir tous les versets d'Al-Fatiha
 */
export function getAllAlFatihaVerses(): Verse[] {
  return AL_FATIHA_VERSES.verses;
}

/**
 * Obtenir une plage de versets d'Al-Fatiha
 */
export function getAlFatihaVersesRange(start: number, end: number): Verse[] {
  return AL_FATIHA_VERSES.verses.filter(v => v.number >= start && v.number <= end);
}

/**
 * Obtenir les versets 81-83 de Yassine (pour les jours 37-39)
 * Note: Ces versets seront chargés depuis l'API quranApi
 * Cette fonction retourne juste la référence
 */
export function getYassineVerses81to83(): { start: number; end: number } {
  return { start: 81, end: 83 };
}

/**
 * Obtenir une plage de 10 versets de Yassine (pour les jours 28-35)
 * Note: Les versets seront chargés depuis l'API quranApi
 * Cette fonction calcule juste la plage
 */
export function getYassineVersesRange(day: number): { start: number; end: number } {
  // J28 = versets 1-10, J29 = 11-20, J30 = 21-30, etc.
  const start = (day - 27) * 10 - 9;
  const end = (day - 27) * 10;
  return { start, end };
}



