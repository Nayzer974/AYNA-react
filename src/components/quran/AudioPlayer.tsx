/**
 * AudioPlayer - Player audio moderne sticky en bas de page
 * 
 * Fonctionnalités :
 * - Play/Pause
 * - Next/Previous verset
 * - Vitesse de lecture (0.5x, 0.75x, 1x, 1.25x, 1.5x)
 * - Affichage du verset actuel
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, ChevronDown } from 'lucide-react-native';
import Animated, { SlideInDown, SlideOutDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/data/themes';

interface AudioPlayerProps {
  visible: boolean;
  surahName: string;
  currentVerseNumber: number;
  totalVerses: number;
  isPlaying: boolean;
  playbackRate: number;
  theme: Theme;
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRateChange: (rate: number) => void;
  onClose?: () => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  visible,
  surahName,
  currentVerseNumber,
  totalVerses,
  isPlaying,
  playbackRate,
  theme,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onRateChange,
  onClose,
}) => {
  const { t } = useTranslation();
  const [showRateMenu, setShowRateMenu] = useState(false);
  const scale = useSharedValue(1);

  // Animation de pulsation pour le bouton play
  useEffect(() => {
    if (isPlaying) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1
      );
    } else {
      scale.value = 1;
    }
  }, [isPlaying]);

  const animatedPlayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.backgroundSecondary,
          borderTopColor: theme.colors.accent + '30',
        },
      ]}
    >
      {/* Barre de drag (optionnelle) */}
      {onClose && (
        <Pressable onPress={onClose} style={styles.dragHandle}>
          <View style={[styles.dragBar, { backgroundColor: theme.colors.textSecondary + '40' }]} />
        </Pressable>
      )}

      <View style={styles.content}>
        {/* Informations */}
        <View style={styles.info}>
          <Text
            style={[styles.surahName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {surahName}
          </Text>
          <Text
            style={[styles.verseInfo, { color: theme.colors.textSecondary }]}
          >
            {t('quran.verse', { number: currentVerseNumber, total: totalVerses }) || 
              `Verset ${currentVerseNumber}/${totalVerses}`}
          </Text>
        </View>

        {/* Contrôles */}
        <View style={styles.controls}>
          {/* Previous */}
          <Pressable
            onPress={onPrevious}
            style={({ pressed }) => [
              styles.controlButton,
              pressed && styles.pressed,
            ]}
          >
            <SkipBack size={20} color={theme.colors.text} />
          </Pressable>

          {/* Play/Pause */}
          <Animated.View style={animatedPlayStyle}>
            <Pressable
              onPress={isPlaying ? onPause : onPlay}
              style={({ pressed }) => [
                styles.playButton,
                {
                  backgroundColor: theme.colors.accent,
                },
                pressed && styles.pressed,
              ]}
            >
              {isPlaying ? (
                <Pause size={24} color={theme.colors.background} />
              ) : (
                <Play size={24} color={theme.colors.background} />
              )}
            </Pressable>
          </Animated.View>

          {/* Next */}
          <Pressable
            onPress={onNext}
            style={({ pressed }) => [
              styles.controlButton,
              pressed && styles.pressed,
            ]}
          >
            <SkipForward size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Vitesse de lecture */}
        <View style={styles.rateContainer}>
          <Pressable
            onPress={() => setShowRateMenu(!showRateMenu)}
            style={({ pressed }) => [
              styles.rateButton,
              {
                backgroundColor: theme.colors.accent + '20',
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.rateText, { color: theme.colors.accent }]}
            >
              {playbackRate.toFixed(2)}x
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Menu de vitesse (dropdown) */}
      {showRateMenu && (
        <View
          style={[
            styles.rateMenu,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.accent + '30',
            },
          ]}
        >
          {PLAYBACK_RATES.map((rate) => (
            <Pressable
              key={rate}
              onPress={() => {
                onRateChange(rate);
                setShowRateMenu(false);
              }}
              style={({ pressed }) => [
                styles.rateMenuItem,
                playbackRate === rate && {
                  backgroundColor: theme.colors.accent + '20',
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.rateMenuText,
                  {
                    color:
                      playbackRate === rate
                        ? theme.colors.accent
                        : theme.colors.text,
                  },
                ]}
              >
                {rate.toFixed(2)}x
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  surahName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  verseInfo: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'System',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateContainer: {
    alignItems: 'center',
  },
  rateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  rateText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  rateMenu: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  rateMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rateMenuText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});

