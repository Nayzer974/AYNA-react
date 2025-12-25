/**
 * Composant ActiveIndicator
 * 
 * Affiche un indicateur visuel (pill background) sous l'icône active
 * avec animation smooth lors du changement de tab
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SPRING_CONFIGS } from '@/utils/animations';

interface ActiveIndicatorProps {
  activeIndex: number;
  tabWidth: number;
  tabCount: number;
  tabPositions?: number[];
}

/**
 * Indicateur actif animé sous l'icône active
 */
export function ActiveIndicator({ 
  activeIndex, 
  tabWidth, 
  tabCount,
  tabPositions = []
}: ActiveIndicatorProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  // Calculer la position initiale
  const calculatePosition = (index: number) => {
    const pillWidth = tabWidth * 0.7;
    
    // Si on a les positions réelles mesurées, les utiliser
    if (tabPositions.length > index) {
      const tabCenterX = tabPositions[index];
      return tabCenterX - pillWidth / 2;
    }
    
    // Sinon, utiliser le calcul théorique
    const tabCenterX = index * tabWidth + tabWidth / 2;
    return tabCenterX - pillWidth / 2;
  };

  const translateX = useSharedValue(calculatePosition(activeIndex));

  useEffect(() => {
    // Calculer la position exacte du centre de chaque tab
    const targetX = calculatePosition(activeIndex);

    translateX.value = withSpring(targetX, SPRING_CONFIGS.GENTLE);
  }, [activeIndex, tabWidth, tabPositions, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: -12 }, // Descendre la bulle pour mieux aligner avec les icônes
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          backgroundColor: theme.colors.accent + '20', // 20% opacity
          borderColor: theme.colors.accent,
          width: tabWidth * 0.7, // 70% de la largeur du tab
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    top: '50%', // Centrer verticalement dans le conteneur
    left: 0, // Sera positionné par translateX dans animatedStyle
    height: 36, // Hauteur du pill
    borderRadius: 18,
    borderWidth: 1.5,
  },
});

