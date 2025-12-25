import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ANIMATION_DURATION, ANIMATION_VALUES } from '@/utils/animations';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '@/utils/designTokens';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  onPress?: () => void;
  pressable?: boolean;
}

/**
 * Composant Card - Conteneur de carte avec animations
 */
export function Card({ children, style, testID, onPress, pressable = false }: CardProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (!pressable || !onPress) return;
    translateY.value = withTiming(-2, {
      duration: ANIMATION_DURATION.FAST,
    });
    opacity.value = withTiming(0.9, {
      duration: ANIMATION_DURATION.FAST,
    });
  };

  const handlePressOut = () => {
    if (!pressable || !onPress) return;
    translateY.value = withTiming(0, {
      duration: ANIMATION_DURATION.FAST,
    });
    opacity.value = withTiming(1, {
      duration: ANIMATION_DURATION.FAST,
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const cardContent = (
    <AnimatedView
      style={[styles.card, style, pressable && animatedStyle]}
      testID={testID}
    >
      {children}
    </AnimatedView>
  );

  if (pressable && onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * En-tête de carte
 */
export function CardHeader({ children, style }: CardHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

export interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

/**
 * Titre de carte
 */
export function CardTitle({ children, style }: CardTitleProps) {
  return (
    <Text style={[styles.title, style]}>
      {children}
    </Text>
  );
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

/**
 * Description de carte
 */
export function CardDescription({ children, style }: CardDescriptionProps) {
  return (
    <Text style={[styles.description, style]}>
      {children}
    </Text>
  );
}

export interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Contenu de carte
 */
export function CardContent({ children, style }: CardContentProps) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

export interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Pied de carte
 */
export function CardFooter({ children, style }: CardFooterProps) {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#1E1E2F',
    ...shadows.sm,
  },
  header: {
    flexDirection: 'column',
    padding: spacing.lg + spacing.xs,
    gap: spacing.xs + spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
    color: '#FFFFFF',
  },
  description: {
    fontSize: fontSize.sm,
    fontFamily: 'System',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    padding: spacing.lg + spacing.xs,
    paddingTop: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg + spacing.xs,
    paddingTop: 0,
  },
});

