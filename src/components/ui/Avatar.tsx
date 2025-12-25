import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, ImageStyle } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { borderRadius } from '@/utils/designTokens';

export type AvatarSize = 'sm' | 'default' | 'lg' | 'xl';

export interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

/**
 * Composant Avatar - Avatar avec fallback sur initiales
 * 
 * Tailles :
 * - sm: 32px
 * - default: 40px
 * - lg: 56px
 * - xl: 80px
 */
export function Avatar({
  source,
  name,
  size = 'default',
  style,
  imageStyle,
}: AvatarProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  const getSize = (): number => {
    switch (size) {
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      case 'xl':
        return 80;
      default:
        return 40;
    }
  };

  const avatarSize = getSize();
  const fontSize = avatarSize * 0.4;

  const getInitials = (): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: borderRadius.full,
          backgroundColor: theme.colors.backgroundSecondary,
          borderWidth: 2,
          borderColor: theme.colors.accent + '40',
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={[
            {
              width: avatarSize - 4,
              height: avatarSize - 4,
              borderRadius: borderRadius.full,
            },
            imageStyle,
          ]}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize,
              color: theme.colors.accent,
              fontWeight: '700',
            },
          ]}
        >
          {getInitials()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: 'System',
    textAlign: 'center',
  },
});




