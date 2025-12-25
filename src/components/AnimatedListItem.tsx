/**
 * Composant AnimatedListItem
 * 
 * Wrapper pour animer les items de liste avec un effet stagger
 * Utilise react-native-reanimated pour des animations performantes
 */

import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { ANIMATION_DURATION, STAGGER_DELAY, SPRING_CONFIGS } from '@/utils/animations';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
  style?: ViewStyle;
  useSpring?: boolean;
}

/**
 * Composant pour animer les items de liste individuellement
 */
export function AnimatedListItem({
  children,
  index,
  delay = 0,
  style,
  useSpring = false,
}: AnimatedListItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    const totalDelay = delay + (index * STAGGER_DELAY);
    
    if (useSpring) {
      opacity.value = withDelay(
        totalDelay,
        withSpring(1, SPRING_CONFIGS.GENTLE)
      );
      translateY.value = withDelay(
        totalDelay,
        withSpring(0, SPRING_CONFIGS.GENTLE)
      );
      scale.value = withDelay(
        totalDelay,
        withSpring(1, SPRING_CONFIGS.GENTLE)
      );
    } else {
      opacity.value = withDelay(
        totalDelay,
        withTiming(1, { duration: ANIMATION_DURATION.NORMAL })
      );
      translateY.value = withDelay(
        totalDelay,
        withTiming(0, { duration: ANIMATION_DURATION.NORMAL })
      );
      scale.value = withDelay(
        totalDelay,
        withTiming(1, { duration: ANIMATION_DURATION.NORMAL })
      );
    }
  }, [index, delay, useSpring, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}




