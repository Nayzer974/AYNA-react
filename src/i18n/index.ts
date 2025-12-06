/**
 * Configuration i18n pour le multilingue
 * Supporte: Français, Arabe, Anglais
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Import des traductions
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import en from './locales/en.json';

const LANGUAGE_KEY = '@ayna_language';

// Détecteur de langue personnalisé pour React Native
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Détecter la langue du système
      const locales = Localization.getLocales();
      const systemLanguage = locales[0]?.languageCode || 'fr';
      callback(systemLanguage === 'ar' ? 'ar' : systemLanguage === 'en' ? 'en' : 'fr');
    } catch (error) {
      callback('fr'); // Par défaut
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la langue:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React échappe déjà
    },
    compatibilityJSON: 'v3',
    react: {
      useSuspense: false,
    },
  });

/**
 * Change la langue de l'application
 */
export async function changeLanguage(lng: 'fr' | 'ar' | 'en'): Promise<void> {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
}

export default i18n;

