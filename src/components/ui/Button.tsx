import React, { useEffect } from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon, Check } from 'lucide-react-native';
import { usePressScale } from '@/hooks/useScale';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ANIMATION_DURATION, ANIMATION_VALUES } from '@/utils/animations';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { spacing, borderRadius, fontSize, fontWeight, touchTarget } from '@/utils/designTokens';

export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  // Accessibilité
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
  // États supplémentaires
  success?: boolean;
}

/**
 * Composant Button réutilisable
 * 
 * Variantes :
 * - default: Bouton principal avec couleur d'accent
 * - outline: Bouton avec bordure
 * - ghost: Bouton transparent
 * - destructive: Bouton rouge pour actions destructives
 * - secondary: Bouton secondaire
 * 
 * Tailles :
 * - sm: Petit
 * - default: Normal
 * - lg: Grand
 * - icon: Carré pour icône seule
 */
export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  success = false,
}: ButtonProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const isDisabled = disabled || loading || success;
  const haptic = useHapticFeedback();

  const handlePress = () => {
    if (!isDisabled && onPress) {
      haptic.light();
      onPress();
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; useGradient?: boolean; gradientColors?: [string, string, ...string[]] } => {
    const baseContainer: ViewStyle = {
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderWidth: 0,
    };

    const baseText: TextStyle = {
      fontFamily: 'System',
      fontWeight: fontWeight.medium,
    };

    switch (variant) {
      case 'default':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
            overflow: 'hidden',
          },
          text: {
            ...baseText,
            fontWeight: fontWeight.bold,
            color: theme.colors.background,
            textShadowColor: 'rgba(0, 0, 0, 0.2)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          },
          useGradient: true,
          gradientColors: [theme.colors.primary, theme.colors.accent, theme.colors.primary],
        };
      case 'outline':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
          },
          text: {
            ...baseText,
            color: theme.colors.background,
            textShadowColor: 'rgba(0, 0, 0, 0.2)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          },
          useGradient: true,
          gradientColors: [theme.colors.primary, theme.colors.accent, theme.colors.primary],
        };
      case 'ghost':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
          },
          text: {
            ...baseText,
            color: theme.colors.background,
            textShadowColor: 'rgba(0, 0, 0, 0.2)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          },
          useGradient: true,
          gradientColors: [theme.colors.primary, theme.colors.accent, theme.colors.primary],
        };
      case 'destructive':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
            overflow: 'hidden',
          },
          text: {
            ...baseText,
            fontWeight: fontWeight.bold,
            color: '#FFFFFF',
            textShadowColor: 'rgba(0, 0, 0, 0.2)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          },
          useGradient: true,
          gradientColors: ['#EF4444', '#DC2626', '#EF4444'],
        };
      case 'secondary':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
          },
          text: {
            ...baseText,
            color: theme.colors.background,
            textShadowColor: 'rgba(0, 0, 0, 0.2)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          },
          useGradient: true,
          gradientColors: [theme.colors.primary, theme.colors.accent, theme.colors.primary],
        };
      default:
        return {
          container: baseContainer,
          text: baseText,
          useGradient: true,
          gradientColors: [theme.colors.primary, theme.colors.accent, theme.colors.primary],
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            minHeight: touchTarget.minimum - spacing.sm,
          },
          text: {
            fontSize: fontSize.sm,
          },
        };
      case 'lg':
        return {
          container: {
            paddingVertical: spacing.md + spacing.xs,
            paddingHorizontal: spacing.lg,
            minHeight: touchTarget.comfortable,
          },
          text: {
            fontSize: fontSize.base,
          },
        };
      case 'icon':
        return {
          container: {
            width: touchTarget.minimum,
            height: touchTarget.minimum,
            padding: 0,
          },
          text: {},
        };
      default:
        return {
          container: {
            paddingVertical: spacing.sm + spacing.xs,
            paddingHorizontal: spacing.base,
            minHeight: touchTarget.minimum,
          },
          text: {
            fontSize: fontSize.sm + 1,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const useGradient = variantStyles.useGradient !== false; // Utiliser le gradient pour toutes les variantes sauf destructive
  const gradientColors: [string, string, ...string[]] = variantStyles.gradientColors || [theme.colors.primary, theme.colors.accent, theme.colors.primary] as [string, string, string];

  // Animations avec Reanimated
  const opacity = useSharedValue(isDisabled ? 0.5 : 1);
  const { animatedStyle: scaleStyle, handlePressIn, handlePressOut } = usePressScale();

  useEffect(() => {
    opacity.value = withTiming(isDisabled ? 0.5 : 1, {
      duration: ANIMATION_DURATION.FAST,
    });
  }, [isDisabled, opacity]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const containerStyle: ViewStyle = {
    ...variantStyles.container,
    ...sizeStyles.container,
  };

  const textStyleFinal: TextStyle = {
    ...variantStyles.text,
    ...sizeStyles.text,
    ...textStyle,
  };

  // Styles pour le gradient (padding interne)
  const gradientStyle: ViewStyle = {
    paddingVertical: size === 'sm' ? spacing.sm : size === 'lg' ? spacing.md + spacing.xs : spacing.md,
    paddingHorizontal: size === 'sm' ? spacing.md : size === 'lg' ? spacing.lg : spacing.base,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm + spacing.xs,
    minHeight: size === 'sm' ? touchTarget.minimum - spacing.sm : size === 'lg' ? touchTarget.comfortable : touchTarget.minimum,
    // Overflow hidden pour les coins arrondis du gradient
    overflow: 'hidden',
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color}
          accessibilityLabel="Chargement en cours"
        />
      );
    }

    if (success) {
      // Icône de succès (checkmark)
      return (
        <Check
          size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18}
          color={variantStyles.text.color}
        />
      );
    }

    const iconElement = Icon && (
      <Icon
        size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18}
        color={variantStyles.text.color}
      />
    );

    return (
      <>
        {iconElement && iconPosition === 'left' && iconElement}
        {typeof children === 'string' ? (
          <Text style={textStyleFinal} numberOfLines={1} ellipsizeMode="clip">{children}</Text>
        ) : (
          children
        )}
        {iconElement && iconPosition === 'right' && iconElement}
      </>
    );
  };

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  // Si on utilise le gradient (toutes les variantes), wrapper dans LinearGradient
  if (useGradient) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        disabled={isDisabled}
        hitSlop={{ top: spacing.xs, bottom: spacing.xs, left: spacing.xs, right: spacing.xs }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          containerStyle,
          containerAnimatedStyle,
          scaleStyle,
          style,
        ]}
        testID={testID}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={gradientStyle}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  // Branche de fallback pour les variantes sans gradient (non utilisée actuellement)
  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={isDisabled}
      hitSlop={{ top: spacing.xs, bottom: spacing.xs, left: spacing.xs, right: spacing.xs }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        containerStyle,
        containerAnimatedStyle,
        scaleStyle,
        style,
      ]}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

