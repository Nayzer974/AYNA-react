import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Star {
  id: number;
  baseX: number;
  baseY: number;
  size: number;
  baseOpacity: number;
  hue: number;
  rotationAngle: number;
  distance: number;
  twinkleOffset: number;
}

interface GalaxyBackgroundProps {
  density?: number; // 2 par défaut
  glowDensity?: number; // 0.3 par défaut
  saturation?: number; // 0 par défaut
  hueShift?: number; // 140° par défaut
  twinkleIntensity?: number; // 0.3 par défaut
  rotationSpeed?: number; // 0.05 par défaut
  starSpeed?: number; // 0.4 par défaut
  animationSpeed?: number; // 0.5 par défaut
}

// Fonction pour convertir HSV en RGB
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h < 1/6) {
    r = c; g = x; b = 0;
  } else if (h < 2/6) {
    r = x; g = c; b = 0;
  } else if (h < 3/6) {
    r = 0; g = c; b = x;
  } else if (h < 4/6) {
    r = 0; g = x; b = c;
  } else if (h < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

export function GalaxyBackgroundReactBits({
  density = 2,
  glowDensity = 0.3,
  saturation = 0,
  hueShift = 140,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.05,
  starSpeed = 0.4,
  animationSpeed = 0.5,
}: GalaxyBackgroundProps) {
  const [rotationValue, setRotationValue] = useState(0);
  const [twinkleValue, setTwinkleValue] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const twinkleAnim = useRef(new Animated.Value(0)).current;

  // Calculer le nombre d'étoiles basé sur la densité (augmenté pour plus de visibilité)
  const starCount = useMemo(() => {
    return Math.floor((SCREEN_WIDTH * SCREEN_HEIGHT) / (8000 / density));
  }, [density]);

  // Générer les étoiles de manière déterministe
  const stars = useMemo<Star[]>(() => {
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;
    const maxDistance = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.45;
    
    return Array.from({ length: starCount }, (_, i) => {
      const angle = (i / starCount) * Math.PI * 2;
      const distance = Math.random() * maxDistance;
      
      return {
        id: i,
        baseX: centerX,
        baseY: centerY,
        size: 1.5 + Math.random() * 3, // Taille augmentée pour plus de visibilité
        baseOpacity: 0.5 + Math.random() * 0.5, // Opacité de base augmentée
        hue: (hueShift + Math.random() * 60) % 360,
        rotationAngle: angle,
        distance: distance,
        twinkleOffset: Math.random() * Math.PI * 2,
      };
    });
  }, [starCount, hueShift]);

  // Animation de rotation avec requestAnimationFrame pour fluidité
  useEffect(() => {
    rotationAnim.setValue(0);
    const rotationListener = rotationAnim.addListener(({ value }) => {
      setRotationValue(value);
    });
    
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: (10000 / rotationSpeed) / animationSpeed,
        useNativeDriver: false,
      })
    ).start();

    return () => {
      rotationAnim.removeListener(rotationListener);
    };
  }, [rotationSpeed, animationSpeed]);

  // Animation de scintillement
  useEffect(() => {
    twinkleAnim.setValue(0);
    const twinkleListener = twinkleAnim.addListener(({ value }) => {
      setTwinkleValue(value);
    });
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleAnim, {
          toValue: 1,
          duration: 2000 / animationSpeed,
          useNativeDriver: false,
        }),
        Animated.timing(twinkleAnim, {
          toValue: 0,
          duration: 2000 / animationSpeed,
          useNativeDriver: false,
        }),
      ])
    ).start();

    return () => {
      twinkleAnim.removeListener(twinkleListener);
    };
  }, [animationSpeed]);

  // Calculer les positions et opacités des étoiles avec mise à jour continue
  const starsState = useMemo(() => {
    return stars.map((star) => {
      // Calculer la position avec rotation
      const currentAngle = star.rotationAngle + (rotationValue * Math.PI * 2 * starSpeed);
      const x = star.baseX + Math.cos(currentAngle) * star.distance;
      const y = star.baseY + Math.sin(currentAngle) * star.distance;

      // Calculer l'opacité avec scintillement (augmentée pour plus de visibilité)
      const twinkle = 1 + Math.sin(twinkleValue * Math.PI * 2 + star.twinkleOffset) * twinkleIntensity;
      const opacity = Math.max(0.3, Math.min(1, star.baseOpacity * twinkle * glowDensity * 1.8));

      // Convertir HSV en RGB
      const h = star.hue / 360;
      const rgb = hsvToRgb(h, saturation, 1);
      const color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

      return {
        id: star.id,
        x,
        y,
        opacity,
        color,
        size: star.size,
      };
    });
  }, [stars, rotationValue, twinkleValue, starSpeed, twinkleIntensity, glowDensity, saturation]);

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={styles.svg}>
        <Defs>
          {/* Gradient radial pour l'effet de glow */}
          <RadialGradient id="starGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="white" stopOpacity="1" />
            <Stop offset="50%" stopColor="white" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="white" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <G>
          {starsState.map((star) => {
            const rgb = star.color.match(/\d+/g);
            if (!rgb) return null;
            
            return (
              <G key={star.id}>
                {/* Étoile principale avec glow */}
                <Circle
                  cx={star.x}
                  cy={star.y}
                  r={star.size * 1.5}
                  fill={star.color}
                  opacity={star.opacity * 0.3}
                />
                <Circle
                  cx={star.x}
                  cy={star.y}
                  r={star.size}
                  fill={star.color}
                  opacity={star.opacity}
                />
                <Circle
                  cx={star.x}
                  cy={star.y}
                  r={star.size * 0.5}
                  fill="white"
                  opacity={star.opacity * 1.2}
                />
              </G>
            );
          })}
        </G>
      </Svg>
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
    zIndex: 1,
  },
  svg: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
