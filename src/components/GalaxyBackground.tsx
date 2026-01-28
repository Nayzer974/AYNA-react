import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GalaxyBackgroundProps {
  starCount?: number;
  minSize?: number;
  maxSize?: number;
}

export function GalaxyBackground({
  starCount = 100,
  minSize = 1,
  maxSize = 2,
  themeId: propThemeId
}: GalaxyBackgroundProps & { themeId?: string }) {
  // Tous les hooks doivent être appelés avant tout retour conditionnel
  const { user } = useUser();
  const { starsEnabled } = usePreferences();
  const themeId = propThemeId || user?.theme || 'default';

  // Générer les étoiles éparpillées sur tout l'écran (même si on ne les affiche pas)
  const stars = useMemo(() => {
    return Array.from({ length: starCount }, (_, i) => ({
      id: i,
      cx: Math.random() * SCREEN_WIDTH,
      cy: Math.random() * SCREEN_HEIGHT,
      r: minSize + Math.random() * (maxSize - minSize),
      opacity: 0.3 + Math.random() * 0.7,
    }));
  }, [starCount, minSize, maxSize]);

  // Retours conditionnels APRÈS tous les hooks
  // Si le thème est "galaxy", utiliser juste le background de couleur (sans étoiles)
  if (themeId === 'galaxy') {
    return (
      <View style={[styles.container, styles.galaxyBackground]} pointerEvents="none" />
    );
  }

  // Si les étoiles sont désactivées, ne rien afficher
  if (!starsEnabled) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Canvas style={styles.svg}>
        <Group>
          {stars.map((star) => (
            <Circle
              key={star.id}
              cx={star.cx}
              cy={star.cy}
              r={star.r}
              color={`rgba(255, 255, 255, ${star.opacity})`}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  galaxyBackground: {
    backgroundColor: '#0A0F2C', // Background de base pour le thème galaxy
  },
  svg: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

