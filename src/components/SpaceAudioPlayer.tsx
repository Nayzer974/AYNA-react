// components/SpaceAudioPlayer.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { Play, Pause, X, Volume2 } from 'lucide-react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { useSpaceAudio } from '@/contexts/SpaceAudioContext';
import { usePreferences } from '@/contexts/PreferencesContext';

interface SpaceAudioPlayerProps {
  visible: boolean;
  onClose: () => void;
  enabled: boolean;
}

/**
 * Lecteur audio simple et élégant pour "space"
 * Design minimaliste et non encombrant
 * Le son continue à jouer même quand l'utilisateur navigue dans l'application
 */
export function SpaceAudioPlayer({ visible, onClose, enabled }: SpaceAudioPlayerProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { isPlaying, toggle, setEnabled } = useSpaceAudio();
  const { preferences } = usePreferences();

  // Synchroniser l'état enabled avec le contexte
  useEffect(() => {
    setEnabled(enabled && (preferences.spaceAudioEnabled ?? true));
  }, [enabled, preferences.spaceAudioEnabled, setEnabled]);

  const handleToggle = async () => {
    await toggle();
  };

  if (!enabled || !(preferences.spaceAudioEnabled ?? true)) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.springify().damping(15)}
          style={styles.container}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={[
                theme.colors.backgroundSecondary + 'F0',
                theme.colors.backgroundSecondary + 'E0',
              ]}
              style={styles.gradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Volume2 size={20} color={theme.colors.accent} />
                  <Text style={[styles.title, { color: theme.colors.text }]}>
                    Space
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <X size={20} color={theme.colors.textSecondary} />
                </Pressable>
              </View>

              {/* Player Controls */}
              <View style={styles.playerContainer}>
                {/* Track Info */}
                <View style={styles.trackInfo}>
                  <Text style={[styles.trackTitle, { color: theme.colors.text }]}>
                    Ambiance Spatiale
                  </Text>
                  <Text style={[styles.trackSubtitle, { color: theme.colors.textSecondary }]}>
                    Sons de l'univers pour la méditation
                  </Text>
                </View>

                {/* Waveform Visualization (Simulated) */}
                <View style={styles.waveformContainer}>
                  {[...Array(40)].map((_, i) => {
                    // Softer animation with sine wave pattern
                    const baseHeight = 12;
                    const maxVariation = isPlaying ? 18 : 4;
                    const sineValue = Math.sin((i / 40) * Math.PI * 2);
                    const height = baseHeight + (sineValue * maxVariation);

                    return (
                      <View
                        key={i}
                        style={[
                          styles.waveformBar,
                          {
                            height,
                            backgroundColor: theme.colors.accent,
                            opacity: isPlaying ? 0.5 + (sineValue * 0.2) : 0.3,
                          },
                        ]}
                      />
                    );
                  })}
                </View>

                {/* Play/Pause Button */}
                <View style={styles.controls}>
                  <Pressable
                    onPress={handleToggle}
                    style={({ pressed }) => [
                      styles.playButton,
                      {
                        backgroundColor: theme.colors.accent,
                        opacity: pressed ? 0.8 : 1,
                      }
                    ]}
                  >
                    {isPlaying ? (
                      <Pause size={32} color={theme.colors.background} fill={theme.colors.background} />
                    ) : (
                      <Play size={32} color={theme.colors.background} fill={theme.colors.background} />
                    )}
                  </Pressable>
                </View>

                {/* Status */}
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, {
                    backgroundColor: isPlaying ? '#10b981' : theme.colors.textSecondary
                  }]} />
                  <Text style={[styles.status, { color: theme.colors.textSecondary }]}>
                    {isPlaying ? 'En lecture' : 'En pause'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: 40,
  },
  gradient: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerContainer: {
    gap: 20,
  },
  trackInfo: {
    alignItems: 'center',
    gap: 4,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  trackSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 2,
    paddingHorizontal: 20,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  controls: {
    alignItems: 'center',
    marginVertical: 8,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  status: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    fontWeight: '500',
  },
});

