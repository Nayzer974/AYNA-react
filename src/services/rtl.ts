/**
 * Service de gestion RTL (Right-to-Left) pour l'arabe
 * Production-ready pour Android + iOS
 */

import { I18nManager, Platform } from 'react-native';

/**
 * Configure le mode RTL pour l'application
 * @param isRTL - true pour activer RTL (arabe), false pour LTR (français/anglais)
 * @returns true si un redémarrage est requis (Android uniquement)
 */
export async function setRTL(isRTL: boolean): Promise<boolean> {
  const currentRTL = I18nManager.isRTL;
  
  // Si déjà dans le bon mode, ne rien faire
  if (currentRTL === isRTL) {
    return false;
  }

  // Activer/désactiver RTL
  I18nManager.allowRTL(isRTL);
  I18nManager.forceRTL(isRTL);

  // Sur Android, un redémarrage de l'app est requis pour que RTL prenne effet
  if (Platform.OS === 'android') {
    return true; // Indique qu'un redémarrage est requis
  }

  // Sur iOS, le changement est immédiat
  return false;
}

/**
 * Vérifie si la langue actuelle nécessite RTL
 * @param language - Code de langue ('ar', 'fr', 'en')
 * @returns true si RTL requis
 */
export function isRTLRequired(language: string): boolean {
  return language === 'ar';
}

/**
 * Configure RTL automatiquement selon la langue
 * @param language - Code de langue ('ar', 'fr', 'en')
 * @returns true si un redémarrage est requis (Android uniquement)
 */
export async function setRTLForLanguage(language: string): Promise<boolean> {
  const isRTL = isRTLRequired(language);
  return await setRTL(isRTL);
}

/**
 * Obtient la direction actuelle (RTL ou LTR)
 */
export function getCurrentDirection(): 'rtl' | 'ltr' {
  return I18nManager.isRTL ? 'rtl' : 'ltr';
}





