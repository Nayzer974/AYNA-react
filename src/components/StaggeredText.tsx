import React, { useRef, useEffect, useImperativeHandle, forwardRef, useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

export interface StaggeredTextRef {
  animate: () => void;
  reset: () => void;
  toggleAnimate: () => void;
}

interface StaggeredTextProps {
  text: string;
  fontSize?: number;
  delay?: number;
  enableReverse?: boolean;
  style?: TextStyle;
  color?: string;
  duration?: number;
}

// Composant pour un caractère animé avec ses propres shared values
// Chaque caractère crée ses propres shared values de manière inconditionnelle
interface AnimatedCharProps {
  char: string;
  index: number;
  fontSize: number;
  color: string;
  delay: number;
  duration: number;
  animationTrigger: number; // Pour forcer le re-render et déclencher l'animation
  isReversed: boolean;
}

const AnimatedChar = React.memo(({ 
  char, 
  index, 
  fontSize, 
  color, 
  delay, 
  duration,
  animationTrigger,
  isReversed 
}: AnimatedCharProps) => {
  // Chaque caractère a ses propres shared values - toujours créés dans le même ordre
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Animer quand animationTrigger change
  useEffect(() => {
    if (animationTrigger > 0) {
      if (isReversed) {
        // Animation inverse
        const reverseDelay = delay * (10 - index); // Approximation pour l'inverse
        opacity.value = withDelay(
          reverseDelay,
          withTiming(0, { duration })
        );
        translateY.value = withDelay(
          reverseDelay,
          withTiming(20, { duration })
        );
      } else {
        // Animation normale
        const charDelay = index * delay;
        opacity.value = withDelay(
          charDelay,
          withTiming(1, { duration })
        );
        translateY.value = withDelay(
          charDelay,
          withTiming(0, { duration })
        );
      }
    }
  }, [animationTrigger, isReversed, index, delay, duration]);

  // Reset quand animationTrigger est 0
  useEffect(() => {
    if (animationTrigger === 0) {
      opacity.value = 0;
      translateY.value = 20;
    }
  }, [animationTrigger]);

  return (
    <Animated.Text
      style={[
        {
          fontSize,
          color,
          fontFamily: 'System',
          fontWeight: '700',
        },
        animatedStyle,
      ]}
    >
      {char === ' ' ? '\u00A0' : char}
    </Animated.Text>
  );
});

AnimatedChar.displayName = 'AnimatedChar';

// Maximum de caractères supportés
const MAX_CHARS = 50;

export const StaggeredText = forwardRef<StaggeredTextRef, StaggeredTextProps>(
  (
    {
      text,
      fontSize = 50,
      delay = 300,
      enableReverse = false,
      style,
      color = '#000',
      duration = 300,
    },
    ref
  ) => {
    const characters = useMemo(() => text.split('').slice(0, MAX_CHARS), [text]);
    
    // Utiliser un état pour déclencher les animations
    const [animationTrigger, setAnimationTrigger] = useState(1); // 1 pour animation initiale
    const [isReversed, setIsReversed] = useState(false);
    const isAnimatingRef = useRef(false);

    const animateCharacters = useCallback(() => {
      setIsReversed(false);
      isAnimatingRef.current = true;
      setAnimationTrigger(prev => prev + 1);
    }, []);

    const reverseCharacters = useCallback(() => {
      if (!enableReverse) return;
      setIsReversed(true);
      isAnimatingRef.current = false;
      setAnimationTrigger(prev => prev + 1);
    }, [enableReverse]);

    const reset = useCallback(() => {
      setIsReversed(false);
      isAnimatingRef.current = false;
      setAnimationTrigger(0);
    }, []);

    const toggleAnimate = useCallback(() => {
      if (!enableReverse) return;
      
      if (isAnimatingRef.current && !isReversed) {
        reverseCharacters();
      } else if (!isAnimatingRef.current && isReversed) {
        animateCharacters();
      } else {
        animateCharacters();
      }
    }, [enableReverse, isReversed, animateCharacters, reverseCharacters]);

    useImperativeHandle(ref, () => ({
      animate: animateCharacters,
      reset: reset,
      toggleAnimate: toggleAnimate,
    }), [animateCharacters, reset, toggleAnimate]);

    return (
      <View style={[styles.container, style]}>
        {characters.map((char, index) => (
          <AnimatedChar
            key={`${char}-${index}-${text}`}
            char={char}
            index={index}
            fontSize={fontSize}
            color={color}
            delay={delay}
            duration={duration}
            animationTrigger={animationTrigger}
            isReversed={isReversed}
          />
        ))}
      </View>
    );
  }
);

StaggeredText.displayName = 'StaggeredText';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});
