import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';

interface QiblaCompassProps {
  rotation: number | null;
}

/**
 * Composant de boussole Qibla avec SVG
 * La flèche pointe vers la Kaaba en fonction de la rotation calculée
 */
export function QiblaCompass({ rotation }: QiblaCompassProps) {
  const rotateAnim = useRef(new Animated.Value(rotation !== null ? -rotation : 0)).current;

  useEffect(() => {
    if (rotation !== null) {
      Animated.timing(rotateAnim, {
        toValue: -rotation,
        duration: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [rotation, rotateAnim]);

  const animatedStyle = {
    transform: [{ 
      rotate: rotateAnim.interpolate({
        inputRange: [-360, 360],
        outputRange: ['-360deg', '360deg'],
      })
    }],
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.compassContainer, animatedStyle]}>
        <Svg width={140} height={140} viewBox="0 0 24 24">
          {/* Cercle de la boussole */}
          <Circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
          {/* Flèche pointant vers le haut (vers la Kaaba) */}
          <Polygon
            points="12,7 14.5,14.5 12,13 9.5,14.5"
            fill="white"
            stroke="white"
            strokeWidth="1"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

