/**
 * Hook pour animations en cascade (stagger)
 */

import { useEffect } from 'react';
import { useSharedValue, withTiming, withDelay, useAnimatedStyle } from 'react-native-reanimated';
import { ANIMATION_DURATION, ANIMATION_EASING, ANIMATION_VALUES, STAGGER_DELAY, getStaggerDelay } from '@/utils/animations';

interface UseStaggerOptions {
  count: number;
  baseDelay?: number;
  duration?: number;
  initialOpacity?: number;
  finalOpacity?: number;
  initialTranslateY?: number;
  finalTranslateY?: number;
}

/**
 * Hook pour créer des animations en cascade (stagger)
 */
export function useStagger(options: UseStaggerOptions) {
  const {
    count,
    baseDelay = STAGGER_DELAY,
    duration = ANIMATION_DURATION.NORMAL,
    initialOpacity = ANIMATION_VALUES.OPACITY_INITIAL,
    finalOpacity = ANIMATION_VALUES.OPACITY_VISIBLE,
    initialTranslateY = ANIMATION_VALUES.TRANSLATE_Y_SLIDE,
    finalTranslateY = 0,
  } = options;

  // Créer un tableau de shared values pour chaque élément
  const opacities = Array.from({ length: count }, () => useSharedValue(initialOpacity));
  const translateYs = Array.from({ length: count }, () => useSharedValue(initialTranslateY));

  useEffect(() => {
    opacities.forEach((opacity, index) => {
      const delay = getStaggerDelay(index, baseDelay);
      opacity.value = withDelay(
        delay,
        withTiming(finalOpacity, {
          duration,
          easing: ANIMATION_EASING.STANDARD,
        })
      );
    });

    translateYs.forEach((translateY, index) => {
      const delay = getStaggerDelay(index, baseDelay);
      translateY.value = withDelay(
        delay,
        withTiming(finalTranslateY, {
          duration,
          easing: ANIMATION_EASING.STANDARD,
        })
      );
    });
  }, [count, baseDelay, duration, finalOpacity, finalTranslateY, opacities, translateYs]);

  const getAnimatedStyle = (index: number) => {
    'worklet';
    return useAnimatedStyle(() => {
      return {
        opacity: opacities[index].value,
        transform: [{ translateY: translateYs[index].value }],
      };
    });
  };

  return { getAnimatedStyle, opacities, translateYs };
}








