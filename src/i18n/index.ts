/**
 * Configuration i18n pour le multilingue
 * Supporte: Français, Arabe, Anglais
 * Production-ready avec support RTL automatique
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { setRTLForLanguage } from '@/services/system/rtl';

// Logger simplifié pour éviter les problèmes de runtime lors de l'initialisation
// Utiliser directement console.error ici car i18n s'initialise avant que le logger soit disponible
const safeLog = {
  error: (message: string, error?: any) => {
    // En développement seulement pour éviter les logs en production
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(message, error);
    }
  }
};

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
      safeLog.error('Erreur lors de la sauvegarde de la langue:', error);
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
 * Configure automatiquement RTL pour l'arabe
 * @param lng - Code de langue ('fr', 'ar', 'en')
 * @returns true si un redémarrage est requis (Android uniquement pour RTL)
 */
export async function changeLanguage(lng: 'fr' | 'ar' | 'en'): Promise<boolean> {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  
  // Configurer RTL automatiquement selon la langue
  const requiresRestart = await setRTLForLanguage(lng);
  
  return requiresRestart;
}

/**
 * Initialise RTL selon la langue actuelle
 * À appeler au démarrage de l'application
 */
export async function initializeRTL(): Promise<void> {
  const currentLang = i18n.language || 'fr';
  await setRTLForLanguage(currentLang);
}

export default i18n;

