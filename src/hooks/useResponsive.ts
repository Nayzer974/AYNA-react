/**
 * Hook pour le responsive design
 * Permet d'adapter l'UI selon la taille de l'écran
 */

import { useMemo } from 'react';
import { useDimensions } from './useDimensions';
import { breakpoints } from '@/utils/designTokens';

export type ScreenSize = 'small' | 'medium' | 'large' | 'tablet';

/**
 * Hook pour détecter la taille de l'écran
 */
export function useResponsive() {
  const { width, height } = useDimensions();

  const screenSize = useMemo<ScreenSize>(() => {
    if (width >= breakpoints.xl) return 'tablet';
    if (width >= breakpoints.lg) return 'large';
    if (width >= breakpoints.md) return 'medium';
    return 'small';
  }, [width]);

  const isTablet = useMemo(() => screenSize === 'tablet', [screenSize]);
  const isSmall = useMemo(() => screenSize === 'small', [screenSize]);
  const isMedium = useMemo(() => screenSize === 'medium', [screenSize]);
  const isLarge = useMemo(() => screenSize === 'large', [screenSize]);

  // Helpers pour les valeurs adaptatives
  const adaptiveValue = useMemo(
    () => (small: number, medium: number, large: number, tablet: number) => {
      switch (screenSize) {
        case 'small':
          return small;
        case 'medium':
          return medium;
        case 'large':
          return large;
        case 'tablet':
          return tablet;
        default:
          return medium;
      }
    },
    [screenSize]
  );

  return {
    screenSize,
    isTablet,
    isSmall,
    isMedium,
    isLarge,
    width,
    height,
    adaptiveValue,
  };
}

/**
 * Hook pour obtenir des valeurs responsive (spacing, fontSize, etc.)
 */
export function useResponsiveValue<T>(
  values: {
    small: T;
    medium: T;
    large?: T;
    tablet?: T;
  }
): T {
  const { screenSize } = useResponsive();

  return useMemo(() => {
    switch (screenSize) {
      case 'tablet':
        return values.tablet ?? values.large ?? values.medium;
      case 'large':
        return values.large ?? values.medium;
      case 'medium':
        return values.medium;
      case 'small':
        return values.small;
      default:
        return values.medium;
    }
  }, [screenSize, values]);
}




