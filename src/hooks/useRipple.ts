/**
 * Hook pour effet ripple
 */

import { useState, useCallback } from 'react';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/utils/animations';

interface RippleState {
  x: number;
  y: number;
  id: string;
}

/**
 * Hook pour créer un effet ripple au tap
 */
export function useRipple() {
  const [ripples, setRipples] = useState<RippleState[]>([]);

  const addRipple = useCallback((x: number, y: number) => {
    const id = Date.now().toString();
    setRipples((prev) => [...prev, { x, y, id }]);

    // Retirer le ripple après l'animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, ANIMATION_DURATION.NORMAL);
  }, []);

  return { ripples, addRipple };
}

/**
 * Hook pour créer un effet ripple animé
 */
export function useAnimatedRipple() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const trigger = useCallback(() => {
    scale.value = 0;
    opacity.value = 1;

    scale.value = withTiming(4, {
      duration: ANIMATION_DURATION.NORMAL,
      easing: ANIMATION_EASING.EASE_OUT,
    });

    opacity.value = withTiming(0, {
      duration: ANIMATION_DURATION.NORMAL,
      easing: ANIMATION_EASING.EASE_OUT,
    });
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return { animatedStyle, trigger, scale, opacity };
}








