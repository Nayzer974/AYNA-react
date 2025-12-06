import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AmbianceTheme } from '@/data/khalwaData';

interface AmbianceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  ambianceTheme?: AmbianceTheme;
}

export function AmbianceCard({
  title,
  description,
  icon: Icon,
  isActive,
  onClick,
  ambianceTheme,
}: AmbianceCardProps) {
  const scale = useSharedValue(1);
  const { width } = Dimensions.get('window');
  const cardWidth = (width - 48) / 2; // 2 colonnes avec padding

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  // Utiliser le thème d'ambiance si fourni, sinon utiliser les couleurs par défaut
  const cardBg = isActive
    ? ambianceTheme?.cardBackground || 'rgba(255, 211, 105, 0.15)'
    : 'rgba(30, 30, 47, 0.8)';
  const borderColor = isActive
    ? ambianceTheme?.cardBorderColor || ambianceTheme?.accentColor || '#FFD369'
    : 'rgba(255, 255, 255, 0.1)';
  const iconBg = isActive
    ? ambianceTheme?.accentColor || '#FFD369'
    : 'rgba(255, 255, 255, 0.1)';
  const iconColor = isActive
    ? ambianceTheme?.buttonTextColor || '#0A0F2C'
    : 'rgba(255, 255, 255, 0.8)';
  const titleColor = isActive
    ? ambianceTheme?.accentColor || '#FFD369'
    : ambianceTheme?.textColor || '#ffffff';
  const descColor = isActive
    ? ambianceTheme?.textSecondaryColor || 'rgba(10, 15, 44, 0.8)'
    : ambianceTheme?.textSecondaryColor || 'rgba(255, 255, 255, 0.6)';

  return (
    <View style={[styles.container, { width: cardWidth }]}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onClick}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: borderColor,
              shadowColor: isActive ? (ambianceTheme?.accentColor || '#FFD369') : '#000',
              shadowOpacity: isActive ? 0.2 : 0.3,
            },
          ]}
        >
          <View style={styles.content}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: iconBg,
                },
              ]}
            >
              <Icon
                size={32}
                color={iconColor}
              />
            </View>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.title,
                  { color: titleColor },
                ]}
              >
                {title}
              </Text>
              <Text
                style={[
                  styles.description,
                  {
                    color: descColor,
                  },
                ]}
              >
                {description}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    overflow: 'visible',
    minWidth: 140, // Largeur minimale pour assurer une taille uniforme
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    minHeight: 180, // Hauteur minimale pour assurer une taille uniforme
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  textContainer: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
  },
});

