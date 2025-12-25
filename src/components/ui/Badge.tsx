import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { spacing, borderRadius, fontSize, fontWeight } from '@/utils/designTokens';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'default' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Composant Badge - Badge/tag pour labels et statuts
 * 
 * Variantes :
 * - default: Style par défaut
 * - primary: Couleur primaire du thème
 * - success: Vert
 * - warning: Orange/Jaune
 * - error: Rouge
 * - outline: Avec bordure seulement
 */
export function Badge({
  children,
  variant = 'default',
  size = 'default',
  style,
  textStyle,
}: BadgeProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const baseContainer: ViewStyle = {
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      alignSelf: 'flex-start',
    };

    const baseText: TextStyle = {
      fontFamily: 'System',
      fontWeight: fontWeight.semibold,
    };

    switch (variant) {
      case 'primary':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.primary,
          },
          text: {
            ...baseText,
            color: theme.colors.background,
          },
        };
      case 'success':
        return {
          container: {
            ...baseContainer,
            backgroundColor: '#10B981',
          },
          text: {
            ...baseText,
            color: '#FFFFFF',
          },
        };
      case 'warning':
        return {
          container: {
            ...baseContainer,
            backgroundColor: '#F59E0B',
          },
          text: {
            ...baseText,
            color: '#FFFFFF',
          },
        };
      case 'error':
        return {
          container: {
            ...baseContainer,
            backgroundColor: '#EF4444',
          },
          text: {
            ...baseText,
            color: '#FFFFFF',
          },
        };
      case 'outline':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.accent,
          },
          text: {
            ...baseText,
            color: theme.colors.accent,
          },
        };
      default:
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.backgroundSecondary,
          },
          text: {
            ...baseText,
            color: theme.colors.text,
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
          },
          text: {
            fontSize: fontSize.xs,
          },
        };
      case 'lg':
        return {
          container: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs + 2,
          },
          text: {
            fontSize: fontSize.sm,
          },
        };
      default:
        return {
          container: {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          },
          text: {
            fontSize: fontSize.xs + 1,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View style={[variantStyles.container, sizeStyles.container, style]}>
      <Text style={[variantStyles.text, sizeStyles.text, textStyle]}>
        {children}
      </Text>
    </View>
  );
}




