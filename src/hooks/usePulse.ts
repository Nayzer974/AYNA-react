/**
 * Hook pour effet pulse
 */

import { useEffect } from 'react';
import { useSharedValue, withRepeat, withTiming, withSequence, useAnimatedStyle } from 'react-native-reanimated';
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/utils/animations';

interface UsePulseOptions {
  minScale?: number;
  maxScale?: number;
  duration?: number;
  repeat?: boolean;
  delay?: number;
}

/**
 * Hook pour créer un effet pulse continu
 */
export function usePulse(options: UsePulseOptions = {}) {
  const {
    minScale = 0.95,
    maxScale = 1.05,
    duration = 1000,
    repeat = true,
    delay = 0,
  } = options;

  const scale = useSharedValue(minScale);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (repeat) {
        scale.value = withRepeat(
          withSequence(
            withTiming(maxScale, {
              duration: duration / 2,
              easing: ANIMATION_EASING.EASE_IN_OUT,
            }),
            withTiming(minScale, {
              duration: duration / 2,
              easing: ANIMATION_EASING.EASE_IN_OUT,
            })
          ),
          -1, // Infinite
          false
        );
      } else {
        scale.value = withTiming(maxScale, {
          duration,
          easing: ANIMATION_EASING.EASE_IN_OUT,
        });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [minScale, maxScale, duration, repeat, delay, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return { animatedStyle, scale };
}








