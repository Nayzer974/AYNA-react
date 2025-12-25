import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import {
  Heart,
  Star,
  Zap,
  Music,
  Moon,
  Sun,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { StaggeredText, StaggeredTextRef } from '@/components/StaggeredText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Page de test avec design Neumorphisme
 * 
 * Caractéristiques :
 * - Design neumorphique avec ombres douces
 * - Animations fluides
 * - Icônes animées
 * - Texte animé avec StaggeredText
 * - Petites fonctionnalités interactives
 */
export function Test() {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const textRef = useRef<StaggeredTextRef>(null);
  const textRef2 = useRef<StaggeredTextRef>(null);
  const textRef3 = useRef<StaggeredTextRef>(null);
  
  // États pour les fonctionnalités
  const [counter, setCounter] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [rating, setRating] = useState(0);
  const [isDark, setIsDark] = useState(false);

  // Couleurs neumorphiques (fond clair pour effet neumorphisme)
  const bgColor = isDark ? '#2C3E50' : '#E0E5EC';
  const cardColor = isDark ? '#34495E' : '#FFFFFF';
  const shadowLight = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)';
  const shadowDark = isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(163, 177, 198, 0.6)';

  // Animation pour le cœur (like)
  const heartScale = useSharedValue(1);
  const heartRotation = useSharedValue(0);

  // Animation pour les étoiles
  const starRotations = useRef(
    Array.from({ length: 5 }, () => useSharedValue(0))
  ).current;

  // Animation pour le compteur
  const counterScale = useSharedValue(1);

  // Animation pour l'icône zap
  const zapOpacity = useSharedValue(1);

  const handleLike = () => {
    setIsLiked(!isLiked);
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 5 }),
      withSpring(1, { damping: 5 })
    );
    heartRotation.value = withSequence(
      withTiming(-15, { duration: 100 }),
      withTiming(15, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  };

  const handleRating = (value: number) => {
    setRating(value);
    starRotations[value - 1].value = withSequence(
      withTiming(360, { duration: 300 }),
      withTiming(0, { duration: 0 })
    );
  };

  const handleCounter = () => {
    setCounter(counter + 1);
    counterScale.value = withSequence(
      withSpring(1.2, { damping: 5 }),
      withSpring(1, { damping: 5 })
    );
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  // Styles animés
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: heartScale.value },
      { rotate: `${heartRotation.value}deg` },
    ],
  }));

  const counterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));

  const starAnimatedStyles = starRotations.map((rotation) =>
    useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }],
    }))
  );

  // Animation zap clignotant
  React.useEffect(() => {
    zapOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const zapAnimatedStyle = useAnimatedStyle(() => ({
    opacity: zapOpacity.value,
  }));

  // Style neumorphique
  const neumorphicStyle = (pressed: boolean, size: 'sm' | 'md' | 'lg' = 'md') => {
    const shadowOffset = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
    const shadowRadius = size === 'sm' ? 8 : size === 'md' ? 12 : 16;
    
    if (pressed) {
      return {
        backgroundColor: cardColor,
        shadowColor: shadowDark,
        shadowOffset: { width: shadowOffset / 2, height: shadowOffset / 2 },
        shadowOpacity: 1,
        shadowRadius: shadowRadius / 2,
        elevation: shadowOffset / 2,
      };
    }
    
    return {
      backgroundColor: cardColor,
      shadowColor: shadowDark,
      shadowOffset: { width: shadowOffset, height: shadowOffset },
      shadowOpacity: 1,
      shadowRadius: shadowRadius,
      elevation: shadowOffset,
      // Ombre claire (inset effect)
      borderColor: shadowLight,
      borderWidth: 1,
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Titre principal avec StaggeredText - Inspiration "Everybody Can Cook" */}
          <View style={styles.titleContainer}>
            <StaggeredText
              ref={textRef}
              text="Everybody Can Cook"
              fontSize={48}
              delay={80}
              color={isDark ? '#ECF0F1' : '#2C3E50'}
              style={styles.title}
            />
            <Text style={[styles.subtitle, { color: isDark ? '#BDC3C7' : '#7F8C8D' }]}>
              Staggered Text Animation Demo
            </Text>
          </View>

          {/* Boutons de contrôle */}
          <View style={styles.controlRow}>
            <Pressable
              onPress={() => {
                textRef.current?.animate();
                textRef2.current?.animate();
                textRef3.current?.animate();
              }}
              style={({ pressed }) => [
                styles.controlButton,
                neumorphicStyle(pressed, 'sm'),
              ]}
            >
              <Text style={[styles.controlButtonText, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
                Animate All
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                textRef.current?.reset();
                textRef2.current?.reset();
                textRef3.current?.reset();
              }}
              style={({ pressed }) => [
                styles.controlButton,
                neumorphicStyle(pressed, 'sm'),
              ]}
            >
              <Text style={[styles.controlButtonText, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
                Reset All
              </Text>
            </Pressable>
            <Pressable
              onPress={toggleDarkMode}
              style={({ pressed }) => [
                styles.controlButton,
                neumorphicStyle(pressed, 'sm'),
              ]}
            >
              {isDark ? (
                <Sun size={20} color={isDark ? '#F39C12' : '#F39C12'} />
              ) : (
                <Moon size={20} color={isDark ? '#3498DB' : '#3498DB'} />
              )}
            </Pressable>
          </View>

          {/* Section StaggeredText - Exemple basique selon la documentation */}
          <Animated.View
            entering={FadeIn.delay(100).duration(500)}
            style={[styles.card, neumorphicStyle(false, 'lg')]}
          >
            <Text style={[styles.cardTitle, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
              Basic Usage Example
            </Text>
            
            {/* Exemple basique - "Hello World" comme dans la doc */}
            <View style={styles.staggeredExample}>
              <StaggeredText
                ref={textRef2}
                text="Hello World"
                fontSize={50}
                delay={300}
                color={isDark ? '#ECF0F1' : '#2C3E50'}
              />
            </View>

            {/* Contrôles individuels pour cet exemple */}
            <View style={styles.exampleControls}>
              <Pressable
                onPress={() => textRef2.current?.animate()}
                style={({ pressed }) => [
                  styles.exampleControlButton,
                  neumorphicStyle(pressed, 'sm'),
                ]}
              >
                <Text style={[styles.exampleControlText, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
                  Animate
                </Text>
              </Pressable>
              <Pressable
                onPress={() => textRef2.current?.reset()}
                style={({ pressed }) => [
                  styles.exampleControlButton,
                  neumorphicStyle(pressed, 'sm'),
                ]}
              >
                <Text style={[styles.exampleControlText, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
                  Reset
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.cardDescription, { color: isDark ? '#BDC3C7' : '#7F8C8D' }]}>
              Usage: textRef.current?.animate() - Start animation{'\n'}
              textRef.current?.reset() - Reset to initial state{'\n'}
              textRef.current?.toggleAnimate() - Toggle (requires enableReverse)
            </Text>
          </Animated.View>

          {/* Section StaggeredText - Exemples avancés */}
          <Animated.View
            entering={FadeIn.delay(200).duration(500)}
            style={[styles.card, neumorphicStyle(false, 'lg')]}
          >
            <Text style={[styles.cardTitle, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
              Advanced Examples
            </Text>
            
            {/* Exemple avec enableReverse */}
            <View style={styles.staggeredExample}>
              <Text style={[styles.exampleLabel, { color: isDark ? '#BDC3C7' : '#7F8C8D' }]}>
                With Reverse Animation (150ms delay)
              </Text>
              <StaggeredText
                ref={textRef3}
                text="Wave Effect"
                fontSize={36}
                delay={150}
                enableReverse={true}
                color={isDark ? '#3498DB' : '#2980B9'}
              />
              <Pressable
                onPress={() => textRef3.current?.toggleAnimate()}
                style={({ pressed }) => [
                  styles.exampleControlButton,
                  neumorphicStyle(pressed, 'sm'),
                  { marginTop: 12 },
                ]}
              >
                <Text style={[styles.exampleControlText, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
                  Toggle Animation
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Carte principale - Like */}
          <Animated.View
            entering={FadeIn.delay(200).duration(500)}
            style={[styles.card, neumorphicStyle(false, 'lg')]}
          >
            <Text style={[styles.cardTitle, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
              Like Button
            </Text>
            <Pressable onPress={handleLike} style={styles.likeContainer}>
              <Animated.View style={heartAnimatedStyle}>
                <Heart
                  size={48}
                  color={isLiked ? '#E74C3C' : (isDark ? '#BDC3C7' : '#95A5A6')}
                  fill={isLiked ? '#E74C3C' : 'transparent'}
                />
              </Animated.View>
            </Pressable>
            <Text style={[styles.cardDescription, { color: isDark ? '#BDC3C7' : '#7F8C8D' }]}>
              {isLiked ? 'Liked!' : 'Tap to like'}
            </Text>
          </Animated.View>

          {/* Carte - Rating avec étoiles */}
          <Animated.View
            entering={FadeIn.delay(300).duration(500)}
            style={[styles.card, neumorphicStyle(false, 'lg')]}
          >
            <Text style={[styles.cardTitle, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
              Star Rating
            </Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => handleRating(value)}
                  style={styles.starButton}
                >
                  <Animated.View style={starAnimatedStyles[value - 1]}>
                    <Star
                      size={32}
                      color={value <= rating ? '#F39C12' : (isDark ? '#BDC3C7' : '#95A5A6')}
                      fill={value <= rating ? '#F39C12' : 'transparent'}
                    />
                  </Animated.View>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.cardDescription, { color: isDark ? '#BDC3C7' : '#7F8C8D' }]}>
              {rating > 0 ? `Rating: ${rating}/5` : 'Select a rating'}
            </Text>
          </Animated.View>

          {/* Carte - Counter */}
          <Animated.View
            entering={FadeIn.delay(400).duration(500)}
            style={[styles.card, neumorphicStyle(false, 'lg')]}
          >
            <Text style={[styles.cardTitle, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
              Counter
            </Text>
            <Pressable onPress={handleCounter} style={styles.counterContainer}>
              <Animated.View style={counterAnimatedStyle}>
                <Text style={[styles.counterText, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
                  {counter}
                </Text>
              </Animated.View>
            </Pressable>
            <Text style={[styles.cardDescription, { color: isDark ? '#BDC3C7' : '#7F8C8D' }]}>
              Tap to increment
            </Text>
          </Animated.View>

          {/* Grille d'icônes animées */}
          <Animated.View
            entering={FadeIn.delay(500).duration(500)}
            style={[styles.card, neumorphicStyle(false, 'lg')]}
          >
            <Text style={[styles.cardTitle, { color: isDark ? '#ECF0F1' : '#2C3E50' }]}>
              Animated Icons
            </Text>
            <View style={styles.iconGrid}>
              <View style={[styles.iconCard, neumorphicStyle(false, 'sm')]}>
                <Animated.View style={zapAnimatedStyle}>
                  <Zap size={32} color={isDark ? '#F39C12' : '#E67E22'} />
                </Animated.View>
              </View>
              <View style={[styles.iconCard, neumorphicStyle(false, 'sm')]}>
                <Sparkles size={32} color={isDark ? '#9B59B6' : '#8E44AD'} />
              </View>
              <View style={[styles.iconCard, neumorphicStyle(false, 'sm')]}>
                <Music size={32} color={isDark ? '#E74C3C' : '#C0392B'} />
              </View>
              <View style={[styles.iconCard, neumorphicStyle(false, 'sm')]}>
                <TrendingUp size={32} color={isDark ? '#27AE60' : '#229954'} />
              </View>
            </View>
          </Animated.View>

          {/* Espace en bas */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    marginTop: 12,
  },
  likeContainer: {
    padding: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  counterContainer: {
    padding: 16,
  },
  counterText: {
    fontSize: 64,
    fontWeight: '700',
    fontFamily: 'System',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  iconCard: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staggeredExample: {
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exampleControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  exampleControlButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  exampleControlText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

