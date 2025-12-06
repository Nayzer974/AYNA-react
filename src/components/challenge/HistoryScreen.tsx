import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

interface HistoryScreenProps {
  currentDay: number;
}

interface Badge {
  id: number;
  name: string;
  icon: string;
  description: string;
  checkUnlocked: (completedDays: Set<number>) => boolean;
}

const badges: Badge[] = [
  {
    id: 1,
    name: 'Intention',
    icon: '🎯',
    description: 'Phase 3 complétée (Jours 1-13)',
    checkUnlocked: (completedDays) => {
      for (let day = 1; day <= 12; day++) {
        if (!completedDays.has(day)) return false;
      }
      return completedDays.has(13);
    }
  },
  {
    id: 2,
    name: 'Transformation',
    icon: '🦋',
    description: 'Phase 6 complétée (Jours 14-26)',
    checkUnlocked: (completedDays) => {
      for (let day = 14; day <= 25; day++) {
        if (!completedDays.has(day)) return false;
      }
      return completedDays.has(26);
    }
  },
  {
    id: 3,
    name: 'Illumination',
    icon: '✨',
    description: 'Phase 9 complétée (Jours 27-39)',
    checkUnlocked: (completedDays) => {
      for (let day = 27; day <= 39; day++) {
        if (!completedDays.has(day)) return false;
      }
      return true;
    }
  },
  {
    id: 4,
    name: 'Portail 1',
    icon: '🌀',
    description: 'Portail jour 13 complété',
    checkUnlocked: (completedDays) => completedDays.has(13)
  },
  {
    id: 5,
    name: 'Portail 2',
    icon: '🌀',
    description: 'Portail jour 26 complété',
    checkUnlocked: (completedDays) => completedDays.has(26)
  },
  {
    id: 6,
    name: 'Retour',
    icon: '🌟',
    description: 'Jour 40 complété',
    checkUnlocked: (completedDays) => completedDays.has(40)
  },
  {
    id: 7,
    name: 'Streak 7',
    icon: '🔥',
    description: '7 jours consécutifs',
    checkUnlocked: (completedDays) => {
      const days = Array.from(completedDays).sort((a, b) => a - b);
      let streak = 1;
      for (let i = 1; i < days.length; i++) {
        if (days[i] === days[i - 1] + 1) {
          streak++;
          if (streak >= 7) return true;
        } else {
          streak = 1;
        }
      }
      return false;
    }
  }
];

const getPhaseColor = (day: number) => {
  if (day === 13 || day === 26) return '#9B59B6';
  if (day === 40) return '#3498DB';
  if (day <= 13) return '#FFD369';
  if (day <= 26) return '#FFA500';
  if (day <= 39) return '#FF6B6B';
  return '#3498DB';
};

export function HistoryScreen({
  currentDay
}: HistoryScreenProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { width } = useWindowDimensions();
  const [selectedBadge, setSelectedBadge] = useState<number | null>(null);

  // Calculer les jours complétés
  const completedDays = new Set<number>();
  const journalDays = new Set((user?.challenge40Days?.journalEntries || []).map(e => e.day));
  const dhikrDays = new Set(
    (user?.challenge40Days?.dhikrCounts || [])
      .filter(d => d.count >= 33)
      .map(d => d.day)
  );

  for (let day = 1; day <= 40; day++) {
    if (journalDays.has(day) && dhikrDays.has(day)) {
      completedDays.add(day);
    }
  }

  const unlockedBadges = badges.map(badge => ({
    ...badge,
    unlocked: badge.checkUnlocked(completedDays)
  }));

  const daySize = (width - 64) / 7; // 7 colonnes avec padding

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Animated.View entering={FadeInDown.duration(500)} style={[styles.calendarCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.calendarTitle, { color: theme.colors.text }]}>
          Calendrier 40 Jours
        </Text>
        <View style={styles.calendarGrid}>
          {Array.from({ length: 40 }, (_, i) => i + 1).map(day => {
            const isCompleted = completedDays.has(day);
            const isCurrent = day === currentDay;
            const isPast = day < currentDay;
            
            return (
              <Animated.View
                key={day}
                entering={FadeInDown.delay(day * 10).duration(300)}
              >
                <Pressable
                  style={[
                    styles.dayBox,
                    {
                      width: daySize,
                      height: daySize,
                      backgroundColor: isCompleted ? '#FFD369' : isCurrent ? getPhaseColor(day) : undefined,
                      borderWidth: isCurrent ? 2 : 0,
                      borderColor: '#FFD369',
                    },
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    {
                      color: isCompleted ? '#0A0F2C' : isCurrent ? '#0A0F2C' : theme.colors.textSecondary,
                      opacity: isPast && !isCompleted ? 0.4 : 1,
                    }
                  ]}>
                    {day}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFD369' }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              Phase 3 (Jours 1-13)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFA500' }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              Phase 6 (Jours 14-26)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              Phase 9 (Jours 27-39)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9B59B6' }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              Portail (Jours 13, 26)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              Retour (Jour 40)
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.badgesCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={styles.badgesHeader}>
          <Award size={24} color="#FFD369" />
          <Text style={[styles.badgesTitle, { color: theme.colors.text }]}>
            Badges
          </Text>
        </View>
        <View style={styles.badgesGrid}>
          {unlockedBadges.map((badge, index) => (
            <Animated.View
              key={badge.id}
              entering={FadeInDown.delay(300 + index * 100).duration(500)}
            >
              <Pressable
                onPress={() => setSelectedBadge(selectedBadge === badge.id ? null : badge.id)}
                style={({ pressed }) => [
                  styles.badgeCard,
                  {
                    backgroundColor: badge.unlocked ? undefined : 'rgba(255, 255, 255, 0.05)',
                    borderWidth: selectedBadge === badge.id ? 2 : 0,
                    borderColor: '#FFD369',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {badge.unlocked ? (
                  <LinearGradient
                    colors={['#FFD369', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.badgeGradient}
                  >
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeNameUnlocked}>{badge.name}</Text>
                    <Text style={styles.badgeDescriptionUnlocked}>{badge.description}</Text>
                    {selectedBadge === badge.id && (
                      <Animated.View entering={FadeIn.duration(300)} style={styles.badgeDetail}>
                        <Text style={styles.badgeDetailText}>✓ Badge débloqué !</Text>
                      </Animated.View>
                    )}
                  </LinearGradient>
                ) : (
                  <>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={[styles.badgeName, { color: theme.colors.textSecondary }]}>
                      {badge.name}
                    </Text>
                    <Text style={[styles.badgeDescription, { color: theme.colors.textSecondary }]}>
                      {badge.description}
                    </Text>
                    {selectedBadge === badge.id && (
                      <Animated.View entering={FadeIn.duration(300)} style={styles.badgeDetail}>
                        <Text style={[styles.badgeDetailText, { color: theme.colors.textSecondary }]}>
                          Complétez les objectifs pour débloquer ce badge
                        </Text>
                      </Animated.View>
                    )}
                  </>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </View>
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
  calendarCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  calendarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    fontFamily: 'Poppins',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dayBox: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  badgesCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  badgesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 140,
  },
  badgeGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  badgeNameUnlocked: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    color: '#0A0F2C',
    fontFamily: 'Poppins',
  },
  badgeDescription: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  badgeDescriptionUnlocked: {
    fontSize: 11,
    textAlign: 'center',
    color: '#0A0F2C',
    opacity: 0.7,
    fontFamily: 'Poppins',
  },
  badgeDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10, 15, 44, 0.2)',
  },
  badgeDetailText: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
});

