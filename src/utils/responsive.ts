/**
 * Utilitaires pour le responsive design
 * 
 * Fournit des helpers pour adapter les tailles, polices et espacements
 * selon la taille de l'écran
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Breakpoints pour le responsive
 */
export const BREAKPOINTS = {
  SMALL: 375,   // iPhone SE, petits Android
  MEDIUM: 414,  // iPhone 11 Pro Max
  LARGE: 768,   // iPad
} as const;

/**
 * Types de taille d'écran
 */
export type ScreenSize = 'small' | 'medium' | 'large';

/**
 * Détermine la taille d'écran actuelle
 */
export function getScreenSize(): ScreenSize {
  if (SCREEN_WIDTH < BREAKPOINTS.SMALL) return 'small';
  if (SCREEN_WIDTH < BREAKPOINTS.MEDIUM) return 'medium';
  return 'large';
}

/**
 * Calcule une taille responsive selon la taille d'écran
 */
export function getResponsiveSize(
  small: number,
  medium: number = small * 1.1,
  large: number = small * 1.2
): number {
  const screenSize = getScreenSize();
  switch (screenSize) {
    case 'small':
      return small;
    case 'medium':
      return medium;
    case 'large':
      return large;
  }
}

/**
 * Calcule une taille de police responsive
 */
export function getResponsiveFontSize(
  base: number,
  scale: number = 1.0
): number {
  const screenSize = getScreenSize();
  let multiplier = 1.0;
  
  switch (screenSize) {
    case 'small':
      multiplier = 0.9;
      break;
    case 'medium':
      multiplier = 1.0;
      break;
    case 'large':
      multiplier = 1.1;
      break;
  }
  
  return Math.round(base * multiplier * scale);
}

/**
 * Calcule un espacement responsive
 */
export function getResponsiveSpacing(
  base: number,
  scale: number = 1.0
): number {
  return getResponsiveSize(
    base * scale,
    base * scale * 1.1,
    base * scale * 1.2
  );
}

/**
 * Calcule la largeur d'une cellule de calendrier (7 jours)
 * Avec padding et gap appropriés
 */
export function getCalendarDayWidth(
  paddingHorizontal: number = 16,
  gap: number = 8
): number {
  const totalPadding = paddingHorizontal * 2;
  const totalGaps = gap * 6; // 6 gaps entre 7 jours
  return Math.floor((SCREEN_WIDTH - totalPadding - totalGaps) / 7);
}

/**
 * Calcule la hauteur d'une cellule de calendrier
 * Proportionnelle à la largeur (ratio carré)
 */
export function getCalendarDayHeight(
  dayWidth: number,
  ratio: number = 1.0
): number {
  return Math.floor(dayWidth * ratio);
}

/**
 * Vérifie si l'écran est petit
 */
export function isSmallScreen(): boolean {
  return SCREEN_WIDTH < BREAKPOINTS.SMALL;
}

/**
 * Vérifie si l'écran est grand (tablette)
 */
export function isLargeScreen(): boolean {
  return SCREEN_WIDTH >= BREAKPOINTS.LARGE;
}

/**
 * Dimensions de l'écran
 */
export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

