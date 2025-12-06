import React, { useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface GalaxyBackgroundProps {
  starCount?: number;
  minSize?: number;
  maxSize?: number;
}

function StarComponent({ star }: { star: Star }) {
  const opacityAnim = React.useRef(new Animated.Value(star.opacity * 0.2)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: star.opacity * 0.8,
            duration: star.duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: star.duration / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: star.opacity * 0.2,
            duration: star.duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: star.duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate());
    };

    const timeout = setTimeout(() => animate(), star.delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: (star.x / 100) * SCREEN_WIDTH,
          top: (star.y / 100) * SCREEN_HEIGHT,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    />
  );
}

export function GalaxyBackground({ 
  starCount = 100,
  minSize = 1,
  maxSize = 2
}: GalaxyBackgroundProps) {
  // Générer les étoiles de manière déterministe
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      opacity: 0.3 + Math.random() * 0.7,
      duration: 3000 + Math.random() * 4000,
      delay: Math.random() * 2000
    }));
  }, [starCount, minSize, maxSize]);

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((star) => (
        <StarComponent key={star.id} star={star} />
      ))}
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
  star: {
    position: 'absolute',
    backgroundColor: 'white',
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
});

