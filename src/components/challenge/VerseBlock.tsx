import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming, interpolateColor, Easing } from 'react-native-reanimated';
import { BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Challenge, getDayByChallengeAndDay } from '@/data/challenges';
import { useUser } from '@/contexts/UserContext';
import { themes } from '@/data/themes';

interface VerseBlockProps {
  day: number;
  challenge: Challenge;
}

const defaultVerses = [
  {
    arabic: 'يس',
    transliteration: 'Yâ-Sîn',
    translation: 'Yâ-Sîn (36:1)',
    tafsir: 'Les lettres mystérieuses qui ouvrent la sourate du cœur du Coran.'
  },
  {
    arabic: 'وَالْقُرْآنِ الْحَكِيمِ',
    transliteration: "Wa-l-qur'âni-l-hakîm",
    translation: 'Par le Coran plein de sagesse (36:2)',
    tafsir: 'Serment par le Coran, source de toute sagesse divine.'
  },
  {
    arabic: 'إِنَّكَ لَمِنَ الْمُرْسَلِينَ',
    transliteration: 'Innaka la-mina-l-mursalîn',
    translation: 'Tu es certes du nombre des messagers (36:3)',
    tafsir: 'Confirmation du statut prophétique du Messager ﷺ.'
  }
];

export function VerseBlock({
  day,
  challenge
}: VerseBlockProps) {
  const { user } = useUser();
  const dayData = getDayByChallengeAndDay(challenge.id, day);
  const verseData = dayData?.verse;
  const verse = verseData ? {
    arabic: verseData.arabic || '',
    transliteration: verseData.transliteration || verseData.reference,
    translation: verseData.translation,
    tafsir: verseData.tafsir || verseData.fullText || verseData.translation
  } : defaultVerses[day % defaultVerses.length];

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

  // Styles animés pour la transition de couleur
  const animatedTextStyle = useAnimatedStyle(() => {
    const oldTheme = themes[previousThemeIdRef.current] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    
    return {
      color: interpolateColor(
        themeAnimationProgress.value,
        [0, 1],
        [oldTheme.colors.text, newTheme.colors.text]
      ),
    };
  });

  const animatedAccentStyle = useAnimatedStyle(() => {
    const oldTheme = themes[previousThemeIdRef.current] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    
    return {
      color: interpolateColor(
        themeAnimationProgress.value,
        [0, 1],
        [oldTheme.colors.accent || oldTheme.colors.primary, newTheme.colors.accent || newTheme.colors.primary]
      ),
    };
  });

  const animatedTextSecondaryStyle = useAnimatedStyle(() => {
    const oldTheme = themes[previousThemeIdRef.current] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    
    return {
      color: interpolateColor(
        themeAnimationProgress.value,
        [0, 1],
        ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.8)'] // Garder la même opacité
      ),
    };
  });

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.container}>
      <LinearGradient
        colors={['#5A2D82', '#3B1C5A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Animated.View style={animatedAccentStyle}>
              <BookOpen size={20} />
            </Animated.View>
            <Animated.Text style={[styles.title, animatedTextStyle]}>Verset du jour</Animated.Text>
          </View>
        </View>
        {verse.arabic && (
          <View style={styles.arabicContainer}>
            <Animated.Text style={[styles.arabicText, animatedTextStyle]}>
              {verse.arabic}
            </Animated.Text>
          </View>
        )}
        <Animated.Text style={[styles.transliteration, animatedAccentStyle]}>
          {verse.transliteration}
        </Animated.Text>
        <Animated.Text style={[styles.translation, animatedTextSecondaryStyle]}>
          {verse.translation}
        </Animated.Text>
        <View style={styles.tafsirContainer}>
          <Animated.Text style={[styles.tafsirText, animatedTextSecondaryStyle]}>
            <Animated.Text style={[styles.tafsirLabel, animatedAccentStyle]}>Mini-Tafsir : </Animated.Text>
            {verse.tafsir}
          </Animated.Text>
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
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD369',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicContainer: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  arabicText: {
    fontSize: 28,
    lineHeight: 48,
    letterSpacing: 2,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Amiri',
    writingDirection: 'rtl',
  },
  transliteration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD369',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    fontFamily: 'Poppins',
  },
  translation: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    fontFamily: 'Roboto',
  },
  tafsirContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  tafsirText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Poppins',
  },
  tafsirLabel: {
    color: '#FFD369',
    fontWeight: '600',
  },
});

