import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Sparkles, Users, Hand } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

interface PortalScreenProps {
  onContinue: () => void;
  day?: number;
}

export function PortalScreen({
  onContinue,
  day = 13
}: PortalScreenProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const totalParticipants = 234;
  const totalDhikr = 15678;

  // Animation pour l'emoji
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      false
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 750 }),
        withTiming(-5, { duration: 750 }),
        withTiming(0, { duration: 750 }),
        withTiming(0, { duration: 750 })
      ),
      -1,
      false
    );
  }, []);

  const animatedEmojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <LinearGradient
          colors={['#9B59B6', '#5A2D82']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portalCard}
        >
          <Animated.View style={[styles.emojiContainer, animatedEmojiStyle]}>
            <Text style={styles.emoji}>✨</Text>
          </Animated.View>
          <Text style={styles.arabicTitle}>كُن فَيَكُونُ</Text>
          <Text style={styles.transliteration}>Kun fa yakûn</Text>
          <Text style={styles.translation}>"Sois, et cela est"</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              Vous avez atteint le Portail (Jour {day}). C'est le moment du dhikr
              collectif après Maghrib, où l'énergie de la communauté amplifie
              votre intention.
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.statsCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
          Dhikr Collectif
        </Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Users size={40} color="#FFD369" />
            <Text style={styles.statValue}>{totalParticipants}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Participants
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Sparkles size={40} color="#FFD369" />
            <Text style={styles.statValue}>{totalDhikr.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Dhikr total
            </Text>
          </View>
        </View>
        <LinearGradient
          colors={['#FFD369', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.affirmationBox}
        >
          <View style={styles.affirmationHeader}>
            <Hand size={24} color="#0A0F2C" />
            <Text style={styles.affirmationTitle}>Affirmation</Text>
          </View>
          <Text style={styles.affirmationText}>
            Placez votre main sur votre cœur et répétez : "Kun fa yakûn" (99
            fois)
          </Text>
        </LinearGradient>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.continueButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <LinearGradient
            colors={['#9B59B6', '#5A2D82']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>
              Rejoindre le dhikr collectif
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 24,
  },
  portalCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  emojiContainer: {
    marginBottom: 24,
  },
  emoji: {
    fontSize: 64,
  },
  arabicTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  transliteration: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  translation: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    fontFamily: 'Poppins',
  },
  descriptionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  descriptionText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  statsCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    fontFamily: 'Poppins',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  affirmationBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  affirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  affirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A0F2C',
    fontFamily: 'Poppins',
  },
  affirmationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A0F2C',
    fontFamily: 'Poppins',
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});

