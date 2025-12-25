/**
 * Utilitaires pour les effets visuels avancés
 * Glassmorphism, blur effects, radial gradients
 */

import { ViewStyle } from 'react-native';

export interface GlassmorphismStyle {
  container: ViewStyle;
  overlay?: ViewStyle;
}

/**
 * Crée un style glassmorphism (effet de verre dépoli)
 * @param opacity - Opacité du fond (0-1)
 * @param blur - Intensité du blur (en pixels)
 * @param borderColor - Couleur de la bordure
 * @param borderWidth - Largeur de la bordure
 */
export function createGlassmorphismStyle(
  opacity: number = 0.1,
  blur: number = 10,
  borderColor: string = 'rgba(255, 255, 255, 0.2)',
  borderWidth: number = 1
): GlassmorphismStyle {
  return {
    container: {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
      // Note: backdropFilter n'est pas supporté nativement en React Native
      // Il faudra utiliser une bibliothèque comme react-native-blur ou une alternative
      borderWidth,
      borderColor,
      // Pour iOS, on peut utiliser une vue avec blur effect via expo-blur
      // Pour Android, on simule avec une couleur semi-transparente
    },
  };
}

/**
 * Style glassmorphism pré-configuré pour les cartes
 */
export const glassmorphismCard: GlassmorphismStyle = createGlassmorphismStyle(
  0.15,
  20,
  'rgba(255, 255, 255, 0.3)',
  1
);

/**
 * Style glassmorphism pré-configuré pour les modals
 */
export const glassmorphismModal: GlassmorphismStyle = createGlassmorphismStyle(
  0.2,
  30,
  'rgba(255, 255, 255, 0.4)',
  1.5
);

/**
 * Style glassmorphism pré-configuré pour les overlays
 */
export const glassmorphismOverlay: GlassmorphismStyle = createGlassmorphismStyle(
  0.1,
  15,
  'rgba(255, 255, 255, 0.1)',
  1
);

/**
 * Crée un style avec blur effect
 * Note: En React Native, le blur doit être géré via expo-blur ou react-native-blur
 */
export interface BlurStyle {
  blurType?: 'light' | 'dark' | 'xlight';
  blurAmount?: number;
}

export function createBlurStyle(
  blurType: 'light' | 'dark' | 'xlight' = 'light',
  blurAmount: number = 10
): BlurStyle {
  return {
    blurType,
    blurAmount,
  };
}

/**
 * Palette de couleurs pour les gradients radiaux
 */
export interface RadialGradientColors {
  center: string;
  middle?: string;
  edge: string;
}

/**
 * Crée une configuration de gradient radial
 * Note: LinearGradient de expo-linear-gradient peut simuler un radial avec start/end
 */
export function createRadialGradientConfig(
  colors: RadialGradientColors,
  centerX: number = 0.5,
  centerY: number = 0.5
) {
  return {
    colors: colors.middle
      ? [colors.center, colors.middle, colors.edge]
      : [colors.center, colors.edge],
    start: { x: centerX - 0.3, y: centerY - 0.3 },
    end: { x: centerX + 0.3, y: centerY + 0.3 },
  };
}

/**
 * Effet de glow (pour remplacer les shadows si besoin)
 */
export interface GlowStyle extends ViewStyle {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation?: number;
}

export function createGlowStyle(
  color: string,
  intensity: number = 0.5,
  radius: number = 8,
  offset: { width: number; height: number } = { width: 0, height: 4 }
): GlowStyle {
  return {
    shadowColor: color,
    shadowOpacity: intensity,
    shadowRadius: radius,
    shadowOffset: offset,
    elevation: Math.round(radius / 2), // Android elevation
  };
}




