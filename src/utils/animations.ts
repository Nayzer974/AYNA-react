/**
 * Utilitaires d'animation partagés
 * 
 * Centralise les durées, easing functions et helpers d'animation
 * pour une cohérence dans toute l'application
 */

import { Easing } from 'react-native-reanimated';
import type { EasingFunction } from 'react-native-reanimated';

/**
 * Durées standard pour les animations
 */
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
} as const;

/**
 * Délai entre éléments pour les animations stagger
 */
export const STAGGER_DELAY = 50;

/**
 * Easing functions standard
 * 
 * IMPORTANT: Les valeurs SPRING, SPRING_GENTLE, SPRING_SNAPPY sont des objets de configuration
 * pour withSpring(), PAS des fonctions easing pour withTiming().
 * 
 * Pour withTiming(), utilisez uniquement:
 * - STANDARD, EASE_IN, EASE_OUT, EASE_IN_OUT, BOUNCE, ELASTIC, BEZIER_SMOOTH, BEZIER_SHARP
 * 
 * Pour withSpring(), utilisez:
 * - SPRING_CONFIGS.NORMAL, SPRING_CONFIGS.GENTLE, SPRING_CONFIGS.SNAPPY, etc.
 */
export const ANIMATION_EASING = {
  STANDARD: Easing.out(Easing.ease),
  EASE_IN: Easing.in(Easing.ease),
  EASE_OUT: Easing.out(Easing.ease),
  EASE_IN_OUT: Easing.inOut(Easing.ease),
  // ⚠️ NE PAS utiliser ces valeurs avec withTiming() - ce sont des configs pour withSpring()
  SPRING: { damping: 18, stiffness: 90 },
  SPRING_GENTLE: { damping: 20, stiffness: 80 },
  SPRING_SNAPPY: { damping: 15, stiffness: 120 },
  // ✅ Ces valeurs peuvent être utilisées avec withTiming()
  BOUNCE: Easing.out(Easing.back(1.1)),
  ELASTIC: Easing.out(Easing.elastic(1)),
  BEZIER_SMOOTH: Easing.bezier(0.4, 0.0, 0.2, 1),
  BEZIER_SHARP: Easing.bezier(0.4, 0.0, 0.6, 1),
} as const;

/**
 * Valeurs d'animation communes
 */
export const ANIMATION_VALUES = {
  SCALE_PRESSED: 0.95,
  SCALE_HOVER: 1.05,
  SCALE_INITIAL: 0.8,
  OPACITY_INITIAL: 0,
  OPACITY_VISIBLE: 1,
  TRANSLATE_Y_SLIDE: 20,
  TRANSLATE_X_SLIDE: 20,
} as const;

/**
 * Configuration pour les animations spring
 */
export interface SpringConfig {
  damping: number;
  stiffness: number;
  mass?: number;
}

/**
 * Configuration standard pour spring animations
 */
export const SPRING_CONFIGS = {
  GENTLE: { damping: 20, stiffness: 80, mass: 1 },
  NORMAL: { damping: 18, stiffness: 90, mass: 1 },
  SNAPPY: { damping: 15, stiffness: 120, mass: 1 },
  BOUNCY: { damping: 12, stiffness: 100, mass: 1 },
} as const;

/**
 * Helper pour calculer le délai d'une animation stagger
 */
export function getStaggerDelay(index: number, baseDelay: number = STAGGER_DELAY): number {
  return index * baseDelay;
}

/**
 * Helper pour créer une animation avec easing personnalisé
 */
export function createEasingAnimation(
  duration: number = ANIMATION_DURATION.NORMAL,
  easing: EasingFunction = ANIMATION_EASING.STANDARD
) {
  return { duration, easing };
}

/**
 * Helper pour créer une animation spring
 */
export function createSpringAnimation(config: SpringConfig = SPRING_CONFIGS.NORMAL) {
  return config;
}

/**
 * Helper pour valider qu'un easing est une fonction (pas un objet spring)
 * Utilisez cette fonction si vous utilisez des configurations d'animation de manière générique
 */
export function isValidEasingFunction(easing: any): easing is EasingFunction {
  return typeof easing === 'function';
}

/**
 * Helper pour obtenir une fonction easing valide depuis une configuration
 * Si la config utilise spring, retourne une fonction easing par défaut
 */
export function getEasingFromConfig(config: { easing?: any; useSpring?: boolean }): EasingFunction {
  if (config.useSpring) {
    // Si c'est une animation spring, on ne devrait pas utiliser withTiming
    // Mais si on doit quand même fournir un easing, on retourne STANDARD
    return ANIMATION_EASING.STANDARD;
  }
  
  if (config.easing && isValidEasingFunction(config.easing)) {
    return config.easing;
  }
  
  // Par défaut, utiliser STANDARD
  return ANIMATION_EASING.STANDARD;
}

/**
 * Valeurs par défaut pour les animations d'entrée
 */
export const ENTRY_ANIMATIONS = {
  FADE_IN: {
    initial: { opacity: ANIMATION_VALUES.OPACITY_INITIAL },
    final: { opacity: ANIMATION_VALUES.OPACITY_VISIBLE },
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.STANDARD,
  },
  SLIDE_UP: {
    initial: { 
      opacity: ANIMATION_VALUES.OPACITY_INITIAL,
      translateY: ANIMATION_VALUES.TRANSLATE_Y_SLIDE,
    },
    final: { 
      opacity: ANIMATION_VALUES.OPACITY_VISIBLE,
      translateY: 0,
    },
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.STANDARD,
  },
  SLIDE_DOWN: {
    initial: { 
      opacity: ANIMATION_VALUES.OPACITY_INITIAL,
      translateY: -ANIMATION_VALUES.TRANSLATE_Y_SLIDE,
    },
    final: { 
      opacity: ANIMATION_VALUES.OPACITY_VISIBLE,
      translateY: 0,
    },
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.STANDARD,
  },
  SLIDE_LEFT: {
    initial: { 
      opacity: ANIMATION_VALUES.OPACITY_INITIAL,
      translateX: ANIMATION_VALUES.TRANSLATE_X_SLIDE,
    },
    final: { 
      opacity: ANIMATION_VALUES.OPACITY_VISIBLE,
      translateX: 0,
    },
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.STANDARD,
  },
  SLIDE_RIGHT: {
    initial: { 
      opacity: ANIMATION_VALUES.OPACITY_INITIAL,
      translateX: -ANIMATION_VALUES.TRANSLATE_X_SLIDE,
    },
    final: { 
      opacity: ANIMATION_VALUES.OPACITY_VISIBLE,
      translateX: 0,
    },
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.STANDARD,
  },
  SCALE_IN: {
    initial: { 
      opacity: ANIMATION_VALUES.OPACITY_INITIAL,
      scale: ANIMATION_VALUES.SCALE_INITIAL,
    },
    final: { 
      opacity: ANIMATION_VALUES.OPACITY_VISIBLE,
      scale: 1,
    },
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.EASE_OUT,
  },
  SCALE_SPRING: {
    initial: { 
      opacity: ANIMATION_VALUES.OPACITY_INITIAL,
      scale: ANIMATION_VALUES.SCALE_INITIAL,
    },
    final: { 
      opacity: ANIMATION_VALUES.OPACITY_VISIBLE,
      scale: 1,
    },
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.STANDARD,
    useSpring: true,
    springConfig: SPRING_CONFIGS.NORMAL,
  },
} as const;








