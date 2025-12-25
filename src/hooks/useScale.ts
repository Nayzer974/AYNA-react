/**
 * Hook pour animation scale
 */

import { useEffect } from 'react';
import { useSharedValue, withTiming, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ANIMATION_DURATION, ANIMATION_EASING, ANIMATION_VALUES, SPRING_CONFIGS } from '@/utils/animations';

interface UseScaleOptions {
  initialScale?: number;
  finalScale?: number;
  duration?: number;
  delay?: number;
  useSpring?: boolean;
}

/**
 * Hook pour créer une animation scale
 */
export function useScale(options: UseScaleOptions = {}) {
  const {
    initialScale = ANIMATION_VALUES.SCALE_INITIAL,
    finalScale = 1,
    duration = ANIMATION_DURATION.NORMAL,
    delay = 0,
    useSpring = false,
  } = options;

  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(ANIMATION_VALUES.OPACITY_INITIAL);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(ANIMATION_VALUES.OPACITY_VISIBLE, {
        duration,
        easing: ANIMATION_EASING.STANDARD,
      });

      if (useSpring) {
        scale.value = withSpring(finalScale, SPRING_CONFIGS.GENTLE);
      } else {
        scale.value = withTiming(finalScale, {
          duration,
          easing: ANIMATION_EASING.STANDARD,
        });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [duration, delay, finalScale, useSpring, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return { animatedStyle, scale, opacity };
}

/**
 * Hook pour créer un effet de scale au press
 */
export function usePressScale() {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(ANIMATION_VALUES.SCALE_PRESSED, {
      duration: ANIMATION_DURATION.FAST,
      easing: ANIMATION_EASING.STANDARD,
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: ANIMATION_DURATION.FAST,
      easing: ANIMATION_EASING.STANDARD,
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return { animatedStyle, handlePressIn, handlePressOut, scale };
}








