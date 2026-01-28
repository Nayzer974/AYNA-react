import React from 'react';
import { TextInput, StyleSheet, View, Text, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { spacing, borderRadius, fontSize, fontWeight, touchTarget } from '@/utils/designTokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Composant Input réutilisable
 * 
 * Supporte :
 * - Label optionnel
 * - Message d'erreur
 * - Icônes gauche/droite
 * - Style personnalisable
 */
export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  style,
  ...textInputProps
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            error && styles.inputError,
            inputStyle,
            style,
          ]}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          {...textInputProps}
        />
        
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontFamily: 'System',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    height: touchTarget.comfortable,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
    fontSize: fontSize.base,
    fontFamily: 'System',
  },
  inputWithLeftIcon: {
    paddingLeft: touchTarget.comfortable,
  },
  inputWithRightIcon: {
    paddingRight: touchTarget.comfortable,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  leftIconContainer: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 1,
  },
  error: {
    fontSize: fontSize.xs,
    fontFamily: 'System',
    color: '#EF4444',
    marginTop: spacing.xs,
  },
});

