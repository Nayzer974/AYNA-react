import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { spacing, fontSize, fontWeight, borderRadius } from '@/utils/designTokens';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

/**
 * Composant EmptyState - Affiche un état vide avec illustration et message
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  return (
    <View style={[styles.container, style]}>
      {Icon && (
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Icon size={48} color={theme.colors.textSecondary} />
        </View>
      )}
      
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>
      
      {description && (
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {description}
        </Text>
      )}
      
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button onPress={onAction} variant="default" size="default">
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    minHeight: 200,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: fontSize.base * 1.5,
  },
  actionContainer: {
    marginTop: spacing.md,
    width: '100%',
    maxWidth: 200,
  },
});




