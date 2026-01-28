/**
 * VerseCard - Composant moderne pour afficher un verset
 * 
 * Affiche :
 * - Texte arabe
 * - Translittération (optionnelle)
 * - Traduction (optionnelle)
 * - Boutons d'action (lecture audio, IA, favoris)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Volume2, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Verse } from '@/contexts/QuranContext';
import { Theme } from '@/data/themes';

interface VerseCardProps {
  verse: Verse;
  transliteration?: string;
  theme: Theme;
  showTransliteration: boolean;
  showTranslation: boolean;
  currentLang: string;
  isPlaying: boolean;
  onRead: () => void;
  onExplain: () => void;
  index?: number;
}

export const VerseCard: React.FC<VerseCardProps> = ({
  verse,
  transliteration,
  theme,
  showTransliteration,
  showTranslation,
  currentLang,
  isPlaying,
  onRead,
  onExplain,
  index = 0,
}) => {
  const { t } = useTranslation();
  const verseNumber = verse.numberInSurah;

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: theme.colors.accent + '20',
        },
      ]}
    >
      <View style={styles.content}>
        {/* Header avec numéro de verset et bouton lecture */}
        <View style={styles.header}>
          <View
            style={[
              styles.verseNumberBadge,
              { backgroundColor: theme.colors.accent },
            ]}
          >
            <Text
              style={[
                styles.verseNumberText,
                { color: theme.colors.background },
              ]}
            >
              {verseNumber}
            </Text>
          </View>

          <Pressable
            onPress={onRead}
            style={({ pressed }) => [
              styles.readButton,
              {
                backgroundColor: isPlaying
                  ? theme.colors.accent
                  : theme.colors.accent + '20',
              },
              pressed && styles.pressed,
            ]}
          >
            <Volume2
              size={16}
              color={
                isPlaying ? theme.colors.background : theme.colors.accent
              }
            />
          </Pressable>
        </View>

        {/* Traduction (en haut si pas arabe) */}
        {currentLang !== 'ar' && showTranslation && (
          <View
            style={[
              styles.translationContainer,
              { backgroundColor: theme.colors.background + '80' },
            ]}
          >
            <Text style={[styles.translationText, { color: theme.colors.text }]}>
              {verse.french || '—'}
            </Text>
          </View>
        )}

        {/* Texte arabe */}
        <View style={styles.arabicContainer}>
          <Text
            style={[
              styles.arabicText,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {verse.arabic}
          </Text>
        </View>

        {/* Translittération */}
        {showTransliteration && transliteration && (
          <View style={styles.transliterationContainer}>
            <Text
              style={[
                styles.transliterationText,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              {transliteration}
            </Text>
          </View>
        )}

        {/* Bouton IA - Comprendre ce verset */}
        <Pressable
          onPress={onExplain}
          style={({ pressed }) => [
            styles.aiButton,
            {
              backgroundColor: theme.colors.accent + '20',
              borderColor: theme.colors.accent + '40',
            },
            pressed && styles.pressed,
          ]}
        >
          <Sparkles size={16} color={theme.colors.accent} />
          <Text style={[styles.aiButtonText, { color: theme.colors.accent }]}>
            {t('quran.explainVerse') || 'Comprendre ce verset'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  verseNumberBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumberText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  readButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  translationContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
  },
  translationText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
  },
  arabicContainer: {
    marginVertical: 8,
  },
  arabicText: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 48,
    fontFamily: 'System',
  },
  transliterationContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  transliterationText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
    fontFamily: 'System',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

