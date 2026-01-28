/**
 * Service de progression de lecture du Coran
 * Sauvegarde automatique de la progression (sourate, verset, timestamp)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = '@quran_reading_progress';
const DISPLAY_MODE_KEY = '@quran_display_mode';

export interface ReadingProgress {
  surahNumber: number;
  verseNumber: number;
  timestamp: string;
  scrollPosition?: number;
}

/**
 * Sauvegarder la progression de lecture
 */
export async function saveReadingProgress(
  progress: ReadingProgress
): Promise<void> {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('[QuranProgress] Erreur lors de la sauvegarde:', error);
  }
}

/**
 * Charger la progression de lecture
 */
export async function loadReadingProgress(): Promise<ReadingProgress | null> {
  try {
    const stored = await AsyncStorage.getItem(PROGRESS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('[QuranProgress] Erreur lors du chargement:', error);
    return null;
  }
}

/**
 * Supprimer la progression de lecture
 */
export async function clearReadingProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROGRESS_KEY);
  } catch (error) {
    console.error('[QuranProgress] Erreur lors de la suppression:', error);
  }
}

/**
 * Sauvegarder le mode d'affichage préféré
 */
export async function saveDisplayMode(
  mode: 'list' | 'single'
): Promise<void> {
  try {
    await AsyncStorage.setItem(DISPLAY_MODE_KEY, mode);
  } catch (error) {
    console.error('[QuranProgress] Erreur lors de la sauvegarde du mode:', error);
  }
}

/**
 * Charger le mode d'affichage préféré
 */
export async function loadDisplayMode(): Promise<'list' | 'single'> {
  try {
    const stored = await AsyncStorage.getItem(DISPLAY_MODE_KEY);
    if (stored === 'single' || stored === 'list') {
      return stored;
    }
    return 'list'; // Par défaut : mode liste
  } catch (error) {
    console.error('[QuranProgress] Erreur lors du chargement du mode:', error);
    return 'list';
  }
}

