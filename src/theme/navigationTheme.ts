/**
 * Thème de navigation pour React Navigation
 * 
 * React Navigation attend un thème avec une structure spécifique incluant :
 * - colors: couleurs de base
 * - fonts: configuration des polices (requis pour certains composants)
 * - dark: mode sombre/clair
 * 
 * Ce fichier crée un thème compatible avec NavigationContainer
 * en mappant notre système de thème personnalisé vers le format attendu.
 */

import { Theme as NavigationTheme } from '@react-navigation/native';
import { Theme } from '@/data/themes';

/**
 * Crée un thème de navigation compatible avec React Navigation
 * à partir de notre thème personnalisé
 */
export function createNavigationTheme(customTheme: Theme): NavigationTheme {
  // Configuration des fonts complète pour éviter l'erreur "Cannot read property 'material' of undefined"
  const fontsConfig = {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 14,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 14,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
      fontSize: 14,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '800' as const,
      fontSize: 14,
    },
    // Propriété material requise par certaines versions de React Navigation
    material: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 14,
    },
  };

  return {
    dark: true,
    colors: {
      primary: customTheme.colors.accent,
      background: customTheme.colors.background,
      card: customTheme.colors.backgroundSecondary,
      text: customTheme.colors.text,
      border: 'rgba(255, 255, 255, 0.1)',
      notification: customTheme.colors.accent,
    },
    fonts: fontsConfig,
  };
}

