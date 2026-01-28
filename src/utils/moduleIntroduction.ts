import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = '@module_introduction_seen_';

export const MODULE_KEYS = {
  SABILAT_NUR: 'sabilat_nur',
  BAYT_NUR: 'bayt_nur',
  NUR_AL_QURAN: 'nur_al_quran',
  NUR_AL_AFIYAH: 'nur_al_afiyah',
  DAIRAT_AN_NUR: 'dairat_an_nur',
} as const;

/**
 * Vérifie si l'utilisateur a déjà vu l'introduction d'un module
 */
export async function hasSeenModuleIntroduction(moduleKey: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${moduleKey}`);
    return value === 'true';
  } catch (error) {
    console.error('Error checking module introduction status:', error);
    return false;
  }
}

/**
 * Marque l'introduction d'un module comme vue
 */
export async function markModuleIntroductionAsSeen(moduleKey: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${moduleKey}`, 'true');
  } catch (error) {
    console.error('Error marking module introduction as seen:', error);
  }
}

/**
 * Réinitialise l'état "vu" pour un module (utile pour les tests)
 */
export async function resetModuleIntroduction(moduleKey: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}${moduleKey}`);
  } catch (error) {
    console.error('Error resetting module introduction:', error);
  }
}

