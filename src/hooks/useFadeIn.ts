/**
 * Hook pour animation fade in
 */

import { useEffect } from 'react';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { ANIMATION_DURATION, ANIMATION_EASING, ANIMATION_VALUES } from '@/utils/animations';

interface UseFadeInOptions {
  duration?: number;
  delay?: number;
  initialOpacity?: number;
  finalOpacity?: number;
}

/**
 * Hook pour créer une animation fade in
 */
export function useFadeIn(options: UseFadeInOptions = {}) {
  const {
    duration = ANIMATION_DURATION.NORMAL,
    delay = 0,
    initialOpacity = ANIMATION_VALUES.OPACITY_INITIAL,
    finalOpacity = ANIMATION_VALUES.OPACITY_VISIBLE,
  } = options;

  const opacity = useSharedValue(initialOpacity);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(finalOpacity, {
        duration,
        easing: ANIMATION_EASING.STANDARD,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [duration, delay, finalOpacity, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return { animatedStyle, opacity };
}








