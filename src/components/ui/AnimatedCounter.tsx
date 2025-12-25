/**
 * Composant AnimatedCounter
 * 
 * Affiche un compteur avec animation de comptage progressif
 */

import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/utils/animations';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: any;
  formatValue?: (value: number) => string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1000,
  style,
  formatValue = (val) => Math.floor(val).toString()
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withSpring(value, SPRING_CONFIGS.GENTLE);
  }, [value, animatedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    // Interpoler la valeur pour un comptage progressif
    const displayValue = animatedValue.value;
    return {};
  });

  return (
    <Animated.Text style={[style, animatedStyle]}>
      {formatValue(value)}
    </Animated.Text>
  );
}








