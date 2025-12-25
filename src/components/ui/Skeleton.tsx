import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { borderRadius, spacing } from '@/utils/designTokens';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'circular' | 'rectangular';
}

/**
 * Composant Skeleton - Placeholder animé pour le chargement
 * 
 * Variantes :
 * - text: Pour les lignes de texte (hauteur 16px)
 * - circular: Pour les avatars (carré avec border radius complet)
 * - rectangular: Pour les cartes (border radius moyen)
 */
export function Skeleton({
  width = '100%',
  height,
  borderRadius: customBorderRadius,
  style,
  variant = 'rectangular',
}: SkeletonProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  
  const opacity = useSharedValue(0.3);
  const translateX = useSharedValue(-100);

  useEffect(() => {
    // Animation d'opacité pulsante
    opacity.value = withRepeat(
      withTiming(0.7, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    
    // Animation shimmer (effet de brillance qui traverse)
    translateX.value = withRepeat(
      withTiming(300, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [opacity, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Style pour l'effet shimmer
  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const getDefaultHeight = () => {
    switch (variant) {
      case 'text':
        return 16;
      case 'circular':
        return typeof width === 'number' ? width : 40;
      default:
        return height || 20;
    }
  };

  const getDefaultBorderRadius = () => {
    if (customBorderRadius !== undefined) return customBorderRadius;
    switch (variant) {
      case 'circular':
        return 999;
      case 'text':
        return borderRadius.sm;
      default:
        return borderRadius.md;
    }
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: typeof width === 'string' ? width : (width as number),
          height: getDefaultHeight(),
          borderRadius: getDefaultBorderRadius(),
          backgroundColor: theme.colors.backgroundSecondary,
          overflow: 'hidden',
        },
        style,
        animatedStyle,
      ]}
    >
      {/* Effet shimmer */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            width: '50%',
            height: '100%',
            backgroundColor: theme.colors.accent + '15',
          },
          shimmerStyle,
        ]}
      />
    </Animated.View>
  );
}

/**
 * Composant SkeletonText - Pour plusieurs lignes de texte
 */
export interface SkeletonTextProps {
  lines?: number;
  width?: number | string;
  lineHeight?: number;
  spacing?: number;
}

export function SkeletonText({ lines = 3, width = '100%', lineHeight = 16, spacing: lineSpacing = 8 }: SkeletonTextProps) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? '80%' : width}
          height={lineHeight}
          style={{ marginBottom: index < lines - 1 ? lineSpacing : 0 }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.3,
    borderRadius: 999,
  },
});




