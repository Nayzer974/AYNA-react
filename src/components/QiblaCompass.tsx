/**
 * Composant de boussole Qibla
 * Rotation simple : rotation = bearingKaaba - heading
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Polygon, Text as SvgText } from 'react-native-svg';

interface QiblaCompassProps {
  rotation: number | null;
  size?: number;
  showLabels?: boolean;
}

export function QiblaCompass({ rotation, size = 280, showLabels = true }: QiblaCompassProps) {
  const rotationValue = useSharedValue(0);

  useEffect(() => {
    // Rotation directe : rotation = bearingKaaba - heading
    // Aucune inversion, aucune correction CSS
    if (typeof rotation === 'number' && Number.isFinite(rotation) && !isNaN(rotation)) {
      rotationValue.value = withSpring(rotation, {
        damping: 15,
        stiffness: 100,
        mass: 1,
      });
    }
  }, [rotation, rotationValue]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotationValue.value}deg` }],
    };
  });

  const svgSize = size;
  const center = svgSize / 2;
  const radius = svgSize / 2 - 20;

  return (
    <View style={[styles.container, { width: svgSize, height: svgSize }]}>
      {/* Cercle de la boussole (fixe) */}
      <Svg width={svgSize} height={svgSize} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />
        {/* Marqueurs cardinaux (fixes) */}
        {showLabels && ['N', 'E', 'S', 'W'].map((label, index) => {
          const angle = index * 90;
          const rad = (angle - 90) * Math.PI / 180;
          const x = center + (radius - 15) * Math.cos(rad);
          const y = center + (radius - 15) * Math.sin(rad);
          return (
            <SvgText
              key={label}
              x={x}
              y={y + 5}
              fontSize="16"
              fontWeight="bold"
              fill="rgba(255, 255, 255, 0.8)"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      {/* Flèche Qibla (animée) */}
      <Animated.View style={[styles.compassContainer, animatedStyle]}>
        <Svg width={svgSize} height={svgSize}>
          {/* Flèche principale pointant vers la Kaaba */}
          <Polygon
            points={`${center},${center - radius + 10} ${center + 15},${center + 20} ${center},${center + 10} ${center - 15},${center + 20}`}
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          {/* Cercle central */}
          <Circle
            cx={center}
            cy={center}
            r="8"
            fill="rgba(255, 255, 255, 0.2)"
            stroke="rgba(255, 255, 255, 0.5)"
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
