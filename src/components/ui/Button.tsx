import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

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
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const baseContainer: ViewStyle = {
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    };

    const baseText: TextStyle = {
      fontFamily: 'System',
      fontWeight: '500',
    };

    switch (variant) {
      case 'default':
        return {
          container: {
            ...baseContainer,
            backgroundColor: '#FFA500',
          },
          text: {
            ...baseText,
            color: '#0A0F2C',
          },
        };
      case 'outline':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
          text: {
            ...baseText,
            color: '#FFFFFF',
          },
        };
      case 'ghost':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
          },
          text: {
            ...baseText,
            color: '#FFFFFF',
          },
        };
      case 'destructive':
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
      case 'secondary':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          text: {
            ...baseText,
            color: '#FFFFFF',
          },
        };
      default:
        return {
          container: baseContainer,
          text: baseText,
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: 8,
            paddingHorizontal: 12,
            minHeight: 36,
          },
          text: {
            fontSize: 14,
          },
        };
      case 'lg':
        return {
          container: {
            paddingVertical: 14,
            paddingHorizontal: 24,
            minHeight: 48,
          },
          text: {
            fontSize: 16,
          },
        };
      case 'icon':
        return {
          container: {
            width: 40,
            height: 40,
            padding: 0,
          },
          text: {},
        };
      default:
        return {
          container: {
            paddingVertical: 10,
            paddingHorizontal: 16,
            minHeight: 40,
          },
          text: {
            fontSize: 15,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const containerStyle: ViewStyle = {
    ...variantStyles.container,
    ...sizeStyles.container,
    opacity: isDisabled ? 0.5 : 1,
    ...style,
  };

  const textStyleFinal: TextStyle = {
    ...variantStyles.text,
    ...sizeStyles.text,
    ...textStyle,
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
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
          <Text style={textStyleFinal}>{children}</Text>
        ) : (
          children
        )}
        {iconElement && iconPosition === 'right' && iconElement}
      </>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        containerStyle,
        pressed && !isDisabled && {
          opacity: 0.8,
          transform: [{ scale: 0.98 }],
        },
      ]}
      testID={testID}
    >
      {renderContent()}
    </Pressable>
  );
}

