import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming, interpolateColor, Easing, useDerivedValue } from 'react-native-reanimated';
import { Plus, Minus, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { getTheme, themes } from '@/data/themes';
import Counter from '@/components/Counter';

// Composant Counter animé pour supporter les changements de thème
function AnimatedCounter({
  value,
  places,
  fontSize,
  padding,
  gap,
  animatedTextColor,
  fontWeight
}: {
  value: number;
  places: number[];
  fontSize: number;
  padding: number;
  gap: number;
  animatedTextColor: Animated.SharedValue<string>;
  fontWeight: string | number;
}) {
  const height = fontSize + padding;
  
  const calculatePlaces = (val: number): number[] => {
    if (val < 100) return [10, 1];
    if (val < 1000) return [100, 10, 1];
    return [1000, 100, 10, 1];
  };

  function AnimatedDigit({ place, value, height, fontSize, animatedTextColor, fontWeight }: {
    place: number;
    value: number;
    height: number;
    fontSize: number;
    animatedTextColor: Animated.SharedValue<string>;
    fontWeight: string | number;
  }) {
    const valueRoundedToPlace = Math.floor(value / place);
    const animatedValue = useSharedValue(valueRoundedToPlace);

    useEffect(() => {
      const newValue = Math.floor(value / place);
      animatedValue.value = withTiming(newValue, {
        duration: 300,
      });
    }, [value, place]);

    const digit = valueRoundedToPlace % 10;
    const animatedColorStyle = useAnimatedStyle(() => ({
      color: animatedTextColor.value,
    }));

    return (
      <View style={[styles.digitContainer, { height, width: fontSize * 0.7, paddingHorizontal: 4 }]}>
        <Animated.Text
          style={[
            styles.number,
            {
              fontSize,
              fontWeight: fontWeight as any,
            },
            animatedColorStyle,
          ]}
        >
          {digit}
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', overflow: 'visible', flexShrink: 1, gap }}>
      {places.map((place) => (
        <AnimatedDigit
          key={place}
          place={place}
          value={value}
          height={height}
          fontSize={fontSize}
          animatedTextColor={animatedTextColor}
          fontWeight={fontWeight}
        />
      ))}
    </View>
  );
}

type Phase = '3' | '6' | '9' | 'portal' | 'return';

interface DhikrCounterProps {
  phase: Phase;
  day?: number;
  onTargetReached?: (reached: boolean) => void;
  onCountChange?: (count: number) => void;
  resetTrigger?: number;
}

const targets = {
  '3': 33,
  '6': 66,
  '9': 99,
  portal: 0,
  return: 0
};

export function DhikrCounter({
  phase,
  day,
  onTargetReached,
  onCountChange,
  resetTrigger
}: DhikrCounterProps) {
  const { user, saveCurrentDhikrCount } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { width } = useWindowDimensions();
  const [count, setCount] = useState(0);
  const target = targets[phase];
  const displayTarget = 33; // Toujours afficher 33 comme cible
  const [counterFontSize, setCounterFontSize] = useState(60);
  
  const lastLoadedDayRef = useRef<number | null>(null);
  const lastResetTriggerRef = useRef<number>(0);
  const justLoadedRef = useRef<boolean>(false);
  const saveCurrentDhikrCountRef = useRef(saveCurrentDhikrCount);

  // Animation pour le changement de thème
  const themeAnimationProgress = useSharedValue(0);
  const previousThemeIdRef = useRef(user?.theme || 'default');
  const currentThemeId = user?.theme || 'default';

  useEffect(() => {
    // Démarrer l'animation quand le thème change
    if (previousThemeIdRef.current !== currentThemeId) {
      themeAnimationProgress.value = 0;
      themeAnimationProgress.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      previousThemeIdRef.current = currentThemeId;
    }
  }, [currentThemeId]);

  // Couleurs animées pour les compteurs
  const animatedTextColor = useDerivedValue(() => {
    const oldTheme = themes[previousThemeIdRef.current] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    return interpolateColor(
      themeAnimationProgress.value,
      [0, 1],
      [oldTheme.colors.text, newTheme.colors.text]
    );
  });

  const animatedTextSecondaryColor = useDerivedValue(() => {
    const oldTheme = themes[previousThemeIdRef.current] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    return interpolateColor(
      themeAnimationProgress.value,
      [0, 1],
      [oldTheme.colors.textSecondary, newTheme.colors.textSecondary]
    );
  });

  // Styles animés pour la transition de couleur
  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      color: animatedTextColor.value,
    };
  });

  const animatedTextSecondaryStyle = useAnimatedStyle(() => {
    return {
      color: animatedTextSecondaryColor.value,
    };
  });

  // Ajuster la taille du compteur en fonction de la largeur de l'écran
  useEffect(() => {
    const countDigits = Math.max(2, Math.ceil(Math.log10(Math.max(count, 9) + 1)));
    const targetDigits = 2;
    const estimatedCounterWidth = (fontSize: number, digits: number) => {
      const charWidth = fontSize * 0.65;
      const gapBetweenChars = 10;
      const horizontalPadding = 8;
      return (charWidth + gapBetweenChars) * digits - gapBetweenChars + horizontalPadding * 2;
    };
    const getSlashWidth = (fontSize: number) => fontSize * 0.3;
    const padding = width >= 768 ? 96 : width >= 640 ? 64 : 32;
    const gap = width >= 640 ? 16 : 8;
    const getTotalWidth = (fontSize: number) => {
      const currentWidth = estimatedCounterWidth(fontSize, countDigits);
      const targetWidth = estimatedCounterWidth(fontSize, targetDigits);
      return currentWidth + targetWidth + getSlashWidth(fontSize) + gap;
    };
    const availableWidth = width - padding;
    let fontSize = 100;
    const step = 2;
    while (getTotalWidth(fontSize) > availableWidth && fontSize > 20) {
      fontSize -= step;
    }
    const minSize = width >= 640 ? 40 : 30;
    const maxSize = width >= 640 ? 100 : 70;
    const finalSize = Math.max(minSize, Math.min(maxSize, fontSize));
    setCounterFontSize(finalSize);
  }, [count, displayTarget, width]);

  // Réinitialiser le compteur quand resetTrigger change
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0 && resetTrigger !== lastResetTriggerRef.current) {
      lastResetTriggerRef.current = resetTrigger;
      setCount(0);
      if (day) {
        saveCurrentDhikrCount(day, 0);
      }
    }
  }, [resetTrigger, day, saveCurrentDhikrCount]);

  // Charger le compteur sauvegardé quand le jour change
  useEffect(() => {
    if (day && day !== lastLoadedDayRef.current) {
      if (resetTrigger !== undefined && resetTrigger > 0 && resetTrigger === lastResetTriggerRef.current) {
        lastLoadedDayRef.current = day;
        justLoadedRef.current = false;
        return;
      }
      justLoadedRef.current = true;
      const savedCount = user?.challenge40Days?.currentDhikrCounts?.find(c => c.day === day);
      if (savedCount) {
        setCount(savedCount.count);
      } else {
        setCount(0);
      }
      lastLoadedDayRef.current = day;
      setTimeout(() => {
        justLoadedRef.current = false;
      }, 500);
    }
  }, [day, phase, resetTrigger, user?.challenge40Days?.currentDhikrCounts]);

  useEffect(() => {
    saveCurrentDhikrCountRef.current = saveCurrentDhikrCount;
  }, [saveCurrentDhikrCount]);

  useEffect(() => {
    if (day && lastLoadedDayRef.current === day && !justLoadedRef.current) {
      const timeoutId = setTimeout(() => {
        if (day && !justLoadedRef.current) {
          saveCurrentDhikrCountRef.current(day, count);
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [count, day]);

  // Notifier le parent quand la cible minimale (33) est atteinte
  useEffect(() => {
    if (onTargetReached && target > 0) {
      const minTarget = 33;
      onTargetReached(count >= minTarget);
    }
    if (onCountChange) {
      onCountChange(count);
    }
  }, [count, target, onTargetReached, onCountChange]);

  if (target === 0) return null;

  const calculatePlaces = (value: number): number[] => {
    if (value < 100) return [10, 1];
    if (value < 1000) return [100, 10, 1];
    return [1000, 100, 10, 1];
  };

  return (
    <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.container}>
      <LinearGradient
        colors={['#5A2D82', '#3B1C5A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Animated.Text style={[styles.title, animatedTextStyle]}>Compteur Dhikr</Animated.Text>
        <View style={styles.counterContainer}>
          <View style={styles.counterWrapper}>
            <AnimatedCounter
              value={count}
              places={calculatePlaces(count)}
              fontSize={counterFontSize}
              padding={5}
              gap={10}
              animatedTextColor={animatedTextColor}
              fontWeight="900"
            />
            <Animated.Text style={[styles.slash, { fontSize: counterFontSize }, animatedTextSecondaryStyle]}>
              /
            </Animated.Text>
            <AnimatedCounter
              value={displayTarget}
              places={[10, 1]}
              fontSize={counterFontSize}
              padding={5}
              gap={10}
              animatedTextColor={animatedTextSecondaryColor}
              fontWeight="900"
            />
          </View>
        </View>
        <View style={styles.controls}>
          <Pressable
            onPress={() => setCount(Math.max(0, count - 1))}
            style={({ pressed }) => [
              styles.controlButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Minus size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={() => setCount(count + 1)}
            style={({ pressed }) => [
              styles.mainButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Plus size={32} color="#0A0F2C" />
          </Pressable>
          <Pressable
            onPress={() => setCount(0)}
            style={({ pressed }) => [
              styles.controlButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <RotateCcw size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Poppins',
  },
  counterContainer: {
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    backgroundColor: 'rgba(90, 45, 130, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  slash: {
    fontWeight: '900',
    fontFamily: 'Poppins',
    lineHeight: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD369',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD369',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  digitContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    flexShrink: 0,
  },
  number: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
    flexShrink: 1,
  },
});

