import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { spacing, borderRadius, fontSize, fontWeight } from '@/utils/designTokens';

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

/**
 * Composant Progress - Barre de progression
 * 
 * Tailles :
 * - sm: 4px
 * - default: 8px
 * - lg: 12px
 */
export function Progress({
  value,
  max = 100,
  showLabel = false,
  size = 'default',
  variant = 'default',
  style,
  labelStyle,
}: ProgressProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  const progressValue = useSharedValue(0);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  React.useEffect(() => {
    progressValue.value = withTiming(percentage, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, [percentage, progressValue]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value}%`,
    };
  });

  const getHeight = (): number => {
    switch (size) {
      case 'sm':
        return 4;
      case 'lg':
        return 12;
      default:
        return 8;
    }
  };

  const getVariantColor = (): string => {
    switch (variant) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      default:
        return theme.colors.accent;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }, labelStyle]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height: getHeight(),
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height: getHeight(),
              backgroundColor: getVariantColor(),
              borderRadius: borderRadius.full,
            },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: 'System',
    fontWeight: fontWeight.medium,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});




