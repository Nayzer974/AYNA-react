/**
 * Composant TabBadge
 * 
 * Badge de notification pour les onglets
 * Affiche un nombre avec animation d'apparition
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SPRING_CONFIGS, ANIMATION_DURATION } from '@/utils/animations';

interface TabBadgeProps {
  count?: number;
  visible?: boolean;
}

/**
 * Badge de notification animé
 */
export function TabBadge({ count = 0, visible = false }: TabBadgeProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && count > 0) {
      // Animation d'apparition avec bounce
      scale.value = withSequence(
        withSpring(1.2, SPRING_CONFIGS.BOUNCY),
        withSpring(1, SPRING_CONFIGS.GENTLE)
      );
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION.FAST });
    } else {
      scale.value = withTiming(0, { duration: ANIMATION_DURATION.FAST });
      opacity.value = withTiming(0, { duration: ANIMATION_DURATION.FAST });
    }
  }, [visible, count, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  if (!visible || count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <Animated.View style={[styles.badge, animatedStyle]}>
      <Text style={styles.badgeText}>{displayCount}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E1E2F',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'System',
    lineHeight: 12,
  },
});








