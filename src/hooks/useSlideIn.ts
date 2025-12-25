/**
 * Hook pour animation slide in
 */

import { useEffect } from 'react';
import { useSharedValue, withTiming, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ANIMATION_DURATION, ANIMATION_EASING, ANIMATION_VALUES, SPRING_CONFIGS } from '@/utils/animations';

type SlideDirection = 'up' | 'down' | 'left' | 'right';

interface UseSlideInOptions {
  direction?: SlideDirection;
  duration?: number;
  delay?: number;
  distance?: number;
  useSpring?: boolean;
}

/**
 * Hook pour créer une animation slide in
 */
export function useSlideIn(options: UseSlideInOptions = {}) {
  const {
    direction = 'up',
    duration = ANIMATION_DURATION.NORMAL,
    delay = 0,
    distance = ANIMATION_VALUES.TRANSLATE_Y_SLIDE,
    useSpring = false,
  } = options;

  const opacity = useSharedValue(ANIMATION_VALUES.OPACITY_INITIAL);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Initialiser la position selon la direction
  useEffect(() => {
    switch (direction) {
      case 'up':
        translateY.value = distance;
        break;
      case 'down':
        translateY.value = -distance;
        break;
      case 'left':
        translateX.value = distance;
        break;
      case 'right':
        translateX.value = -distance;
        break;
    }
  }, [direction, distance, translateX, translateY]);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = useSpring
        ? withSpring(ANIMATION_VALUES.OPACITY_VISIBLE, SPRING_CONFIGS.GENTLE)
        : withTiming(ANIMATION_VALUES.OPACITY_VISIBLE, {
            duration,
            easing: ANIMATION_EASING.STANDARD,
          });

      if (useSpring) {
        translateX.value = withSpring(0, SPRING_CONFIGS.GENTLE);
        translateY.value = withSpring(0, SPRING_CONFIGS.GENTLE);
      } else {
        translateX.value = withTiming(0, {
          duration,
          easing: ANIMATION_EASING.STANDARD,
        });
        translateY.value = withTiming(0, {
          duration,
          easing: ANIMATION_EASING.STANDARD,
        });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [duration, delay, useSpring, opacity, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  return { animatedStyle, opacity, translateX, translateY };
}








