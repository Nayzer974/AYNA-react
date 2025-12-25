import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { spacing, borderRadius, fontSize, fontWeight } from '@/utils/designTokens';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  style?: ViewStyle;
}

/**
 * Composant Alert - Alertes contextuelles avec icônes
 * 
 * Variantes :
 * - info: Information (bleu)
 * - success: Succès (vert)
 * - warning: Avertissement (orange)
 * - error: Erreur (rouge)
 */
export function Alert({ variant = 'info', title, children, onClose, style }: AlertProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: '#10B981' + '20',
          borderColor: '#10B981' + '60',
          iconColor: '#10B981',
          Icon: CheckCircle,
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B' + '20',
          borderColor: '#F59E0B' + '60',
          iconColor: '#F59E0B',
          Icon: AlertTriangle,
        };
      case 'error':
        return {
          backgroundColor: '#EF4444' + '20',
          borderColor: '#EF4444' + '60',
          iconColor: '#EF4444',
          Icon: AlertCircle,
        };
      default:
        return {
          backgroundColor: theme.colors.accent + '20',
          borderColor: theme.colors.accent + '60',
          iconColor: theme.colors.accent,
          Icon: Info,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const Icon = variantStyles.Icon;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: 1,
          borderRadius: borderRadius.md,
          padding: spacing.base,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Icon size={20} color={variantStyles.iconColor} style={styles.icon} />
        <View style={styles.textContainer}>
          {title && (
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
          )}
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {children}
          </Text>
        </View>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={18} color={theme.colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: fontSize.sm,
    fontFamily: 'System',
    lineHeight: fontSize.sm * 1.5,
  },
  closeButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
});




