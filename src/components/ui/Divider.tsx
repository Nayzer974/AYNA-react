import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { spacing } from '@/utils/designTokens';

export interface DividerProps {
  vertical?: boolean;
  margin?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

/**
 * Composant Divider - Séparateur visuel horizontal ou vertical
 */
export function Divider({ vertical = false, margin = 'md', style }: DividerProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  const getMargin = (): number => {
    switch (margin) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.sm;
      case 'lg':
        return spacing.lg;
      default:
        return spacing.base;
    }
  };

  if (vertical) {
    return (
      <View
        style={[
          styles.vertical,
          {
            width: 1,
            backgroundColor: theme.colors.textSecondary + '30',
            marginHorizontal: getMargin(),
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        {
          height: 1,
          backgroundColor: theme.colors.textSecondary + '30',
          marginVertical: getMargin(),
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
});




