import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { challenges, Challenge } from '@/data/challenges';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

interface ChallengeSelectionScreenProps {
  onSelect: (challenge: Challenge) => void;
  disabled?: boolean;
}

export function ChallengeSelectionScreen({
  onSelect,
  disabled = false
}: ChallengeSelectionScreenProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Choisissez Votre Défi
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          40 jours de transformation spirituelle
        </Text>
      </Animated.View>

      <View style={styles.challengesGrid}>
        {challenges.map((challenge, index) => (
          <Animated.View
            key={challenge.id}
            entering={FadeInDown.delay(index * 100).duration(500)}
          >
            <Pressable
              onPress={() => !disabled && setSelectedChallenge(challenge)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.challengeCard,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
                  borderWidth: selectedChallenge?.id === challenge.id ? 2 : 0,
                  borderColor: '#FFD369',
                },
              ]}
            >
              <View style={styles.challengeHeader}>
                <Text style={[styles.challengeEmoji, { fontSize: 40 }]}>
                  {challenge.emoji}
                </Text>
                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, { color: theme.colors.text }]}>
                    DÉFI {index + 1} — {challenge.title}
                  </Text>
                  <View style={styles.challengeAttribute}>
                    <Text style={[styles.attributeText, { color: challenge.color }]}>
                      {challenge.attribute}
                    </Text>
                    <Text style={[styles.attributeArabic, { color: theme.colors.textSecondary }]}>
                      {challenge.attributeArabic}
                    </Text>
                  </View>
                  <Text style={[styles.challengeDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {challenge.description}
                  </Text>
                </View>
              </View>
              {selectedChallenge?.id === challenge.id && (
                <Animated.View entering={FadeIn} style={styles.expandedInfo}>
                  <View style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
                  <Text style={[styles.expandedDescription, { color: theme.colors.textSecondary }]}>
                    {challenge.description}
                  </Text>
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {selectedChallenge && (
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={[styles.selectedCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.selectedHeader}>
            <Sparkles size={24} color={selectedChallenge.color} />
            <Text style={[styles.selectedTitle, { color: theme.colors.text }]}>
              Défi sélectionné
            </Text>
          </View>
          <Text style={[styles.selectedText, { color: theme.colors.textSecondary }]}>
            Vous avez choisi le <Text style={{ fontWeight: 'bold' }}>{selectedChallenge.title}</Text> avec l'attribut{' '}
            <Text style={{ fontWeight: 'bold' }}>{selectedChallenge.attribute}</Text>. Prêt à commencer votre voyage de 40
            jours ?
          </Text>
          <Pressable
            onPress={() => !disabled && onSelect(selectedChallenge)}
            disabled={selectedChallenge.days.length === 0 || disabled}
            style={({ pressed }) => [
              styles.continueButton,
              {
                backgroundColor: disabled ? 'rgba(255, 211, 105, 0.5)' : '#FFD369',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.continueButtonText, { color: '#0A0F2C' }]}>
              Continuer avec ce défi
            </Text>
          </Pressable>
        </Animated.View>
      )}
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    fontFamily: 'Poppins',
  },
  challengesGrid: {
    gap: 16,
    marginBottom: 24,
  },
  challengeCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  challengeEmoji: {
    fontSize: 40,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  challengeAttribute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  attributeText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  attributeArabic: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  challengeDescription: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  expandedInfo: {
    marginTop: 16,
    paddingTop: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  expandedDescription: {
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  selectedCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  selectedTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  selectedText: {
    fontSize: 14,
    marginBottom: 24,
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
});

