/**
 * Composant Card avec effet glassmorphism
 */

import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated from 'react-native-reanimated';
import { glassmorphismCard, type GlassmorphismStyle } from '@/utils/visualEffects';
import { borderRadius } from '@/utils/designTokens';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  blurType?: 'light' | 'dark' | 'default';
  testID?: string;
}

/**
 * Composant Card avec effet glassmorphism
 * Utilise expo-blur pour iOS et une simulation pour Android
 */
export function GlassCard({
  children,
  style,
  intensity = 20,
  blurType = 'default',
  testID,
}: GlassCardProps) {
  // Pour iOS, utiliser BlurView
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={blurType === 'dark' ? 'dark' : blurType === 'light' ? 'light' : 'default'}
        style={[styles.card, glassmorphismCard.container, style]}
        testID={testID}
      >
        {children}
      </BlurView>
    );
  }

  // Pour Android, utiliser une simulation avec couleur semi-transparente
  return (
    <Animated.View
      style={[styles.card, glassmorphismCard.container, style]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});




