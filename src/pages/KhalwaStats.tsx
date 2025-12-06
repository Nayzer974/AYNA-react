import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, Flame, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { getKhalwaStats, loadKhalwaSessions, KhalwaStats as KhalwaStatsType, KhalwaSessionData } from '@/services/khalwaStorage';
import { divineNames } from '@/data/khalwaData';
import { soundAmbiances } from '@/data/khalwaData';

export function KhalwaStats() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [stats, setStats] = useState<KhalwaStatsType | null>(null);
  const [recentSessions, setRecentSessions] = useState<KhalwaSessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = React.useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [statsData, sessions] = await Promise.all([
        getKhalwaStats(user.id),
        loadKhalwaSessions(user.id, 10)
      ]);

      setStats(statsData);
      setRecentSessions(sessions);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id, loadStats]);

  const getDivineNameDisplay = (nameId: string) => {
    const name = divineNames.find(n => n.id === nameId);
    if (name) {
      return { arabic: name.arabic, transliteration: name.transliteration };
    }
    return { arabic: '', transliteration: nameId };
  };

  const getSoundDisplay = (soundId: string) => {
    const sound = soundAmbiances.find(s => s.id === soundId);
    return sound ? { icon: sound.icon, name: sound.name } : { icon: '🔇', name: soundId };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formater le temps total : secondes si < 1 min, minutes si < 1h, heures sinon
  const formatTotalTime = (totalMinutes: number): string => {
    const totalSeconds = Math.round(totalMinutes * 60);
    
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    
    const totalMinutesInt = Math.floor(totalMinutes);
    if (totalMinutesInt < 60) {
      const seconds = totalSeconds % 60;
      if (seconds > 0) {
        return `${totalMinutesInt}min ${seconds}s`;
      }
      return `${totalMinutesInt}min`;
    }
    
    const hours = Math.floor(totalMinutesInt / 60);
    const minutes = totalMinutesInt % 60;
    if (minutes > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${hours}h`;
  };

  // Formater la durée moyenne : toujours en minutes sauf si c'est que des secondes
  const formatAverageDuration = (avgMinutes: number): string => {
    const avgSeconds = Math.round(avgMinutes * 60);
    
    // Si la moyenne est inférieure à 1 minute, afficher en secondes
    if (avgSeconds < 60) {
      return `${avgSeconds}s`;
    }
    
    // Sinon, afficher en minutes (avec décimales si nécessaire)
    const minutes = Math.floor(avgMinutes);
    const seconds = Math.round((avgMinutes - minutes) * 60);
    
    if (seconds > 0 && minutes === 0) {
      return `${seconds}s`;
    } else if (seconds > 0) {
      return `${minutes}min ${seconds}s`;
    } else {
      return `${minutes}min`;
    }
  };

  // Formater la durée d'une session individuelle
  const formatSessionDuration = (durationMinutes: number): string => {
    const totalSeconds = Math.round(durationMinutes * 60);
    
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    
    const minutes = Math.floor(durationMinutes);
    const seconds = Math.round((durationMinutes - minutes) * 60);
    
    if (seconds > 0 && minutes === 0) {
      return `${seconds}s`;
    } else if (seconds > 0) {
      return `${minutes}min ${seconds}s`;
    } else {
      return `${minutes}min`;
    }
  };

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.backgroundSecondary]}
          style={StyleSheet.absoluteFill}
        />
        <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Chargement des statistiques...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <View style={styles.wrapper}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.backgroundSecondary]}
          style={StyleSheet.absoluteFill}
        />
        <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.buttonPressed
              ]}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Statistiques Khalwa
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Aucune session pour le moment
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Commence ta première session Khalwa pour voir tes statistiques ici.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('BaytAnNur' as never)}
              style={({ pressed }) => [
                styles.startButton,
                { backgroundColor: theme.colors.accent },
                pressed && styles.buttonPressed
              ]}
            >
              <Text style={[styles.startButtonText, { color: theme.colors.background }]}>
                Commencer une session
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
      
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed
            ]}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Mes Statistiques Khalwa
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Statistiques principales */}
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Calendar size={24} color="#ffffff" />}
              label="Sessions totales"
              value={stats.totalSessions.toString()}
              colorFrom="#3b82f6"
              colorTo="#2563eb"
              theme={theme}
            />
            <StatCard
              icon={<Clock size={24} color="#ffffff" />}
              label="Temps total"
              value={formatTotalTime(stats.totalMinutes)}
              colorFrom="#a855f7"
              colorTo="#9333ea"
              theme={theme}
            />
            <StatCard
              icon={<TrendingUp size={24} color="#ffffff" />}
              label="Durée moyenne"
              value={formatAverageDuration(stats.avgDuration)}
              colorFrom="#10b981"
              colorTo="#059669"
              theme={theme}
            />
            <StatCard
              icon={<Flame size={24} color="#ffffff" />}
              label="Série"
              value={`${stats.longestStreakDays} jours`}
              colorFrom="#f97316"
              colorTo="#ea580c"
              theme={theme}
            />
          </View>

          {/* Statistiques périodiques */}
          <View style={styles.periodStats}>
            <View style={[styles.periodCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Text style={[styles.periodLabel, { color: theme.colors.textSecondary }]}>
                Cette semaine
              </Text>
              <Text style={[styles.periodValue, { color: theme.colors.text }]}>
                {stats.sessionsThisWeek} session{stats.sessionsThisWeek > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={[styles.periodCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Text style={[styles.periodLabel, { color: theme.colors.textSecondary }]}>
                Ce mois
              </Text>
              <Text style={[styles.periodValue, { color: theme.colors.text }]}>
                {stats.sessionsThisMonth} session{stats.sessionsThisMonth > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Préférences */}
          <View style={styles.preferencesGrid}>
            {stats.mostUsedDivineName && (
              <View style={[styles.preferenceCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Text style={[styles.preferenceLabel, { color: theme.colors.textSecondary }]}>
                  Nom divin favori
                </Text>
                {(() => {
                  const nameDisplay = getDivineNameDisplay(stats.mostUsedDivineName);
                  return (
                    <>
                      <Text style={[styles.divineNameArabic, { color: theme.colors.text }]}>
                        {nameDisplay.arabic}
                      </Text>
                      <Text style={[styles.divineNameTrans, { color: theme.colors.accent }]}>
                        {nameDisplay.transliteration}
                      </Text>
                    </>
                  );
                })()}
              </View>
            )}

            {stats.mostUsedBreathingType && (
              <View style={[styles.preferenceCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Text style={[styles.preferenceLabel, { color: theme.colors.textSecondary }]}>
                  Respiration préférée
                </Text>
                <Text style={[styles.preferenceValue, { color: theme.colors.text }]}>
                  {stats.mostUsedBreathingType === 'libre' ? 'Libre' : 
                   stats.mostUsedBreathingType === '4-4' ? '4-4' : 
                   stats.mostUsedBreathingType === '3-6-9' ? '3-6-9' : 
                   stats.mostUsedBreathingType}
                </Text>
              </View>
            )}

            {stats.mostUsedSound && (
              <View style={[styles.preferenceCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Text style={[styles.preferenceLabel, { color: theme.colors.textSecondary }]}>
                  Ambiance favorite
                </Text>
                {(() => {
                  const soundDisplay = getSoundDisplay(stats.mostUsedSound);
                  return (
                    <>
                      <Text style={styles.soundIcon}>{soundDisplay.icon}</Text>
                      <Text style={[styles.preferenceValue, { color: theme.colors.text }]}>
                        {soundDisplay.name}
                      </Text>
                    </>
                  );
                })()}
              </View>
            )}
          </View>

          {/* Sessions récentes */}
          {recentSessions.length > 0 && (
            <View style={[styles.recentSessionsCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Text style={[styles.recentSessionsTitle, { color: theme.colors.text }]}>
                Sessions récentes
              </Text>
              <View style={styles.sessionsList}>
                {recentSessions.map((session) => {
                  const nameDisplay = getDivineNameDisplay(session.divineName.id);
                  const soundDisplay = getSoundDisplay(session.soundAmbiance);
                  return (
                    <View
                      key={session.id}
                      style={[styles.sessionItem, { backgroundColor: theme.colors.background }]}
                    >
                      <View style={styles.sessionContent}>
                        <View style={styles.sessionHeader}>
                          <Text style={styles.sessionIcon}>{soundDisplay.icon}</Text>
                          <View style={styles.sessionInfo}>
                            <Text style={[styles.sessionName, { color: theme.colors.text }]}>
                              {nameDisplay.transliteration}
                            </Text>
                            <Text style={[styles.sessionDate, { color: theme.colors.textSecondary }]}>
                              {formatDate(session.createdAt)}
                            </Text>
                          </View>
                        </View>
                        {session.intention && (
                          <Text style={[styles.sessionIntention, { color: theme.colors.textSecondary }]}>
                            "{session.intention}"
                          </Text>
                        )}
                        {session.feeling && (
                          <Text style={[styles.sessionFeeling, { color: theme.colors.accent }]}>
                            Ressenti : {session.feeling}
                          </Text>
                        )}
                      </View>
                      <View style={styles.sessionMeta}>
                        <Text style={[styles.sessionDuration, { color: theme.colors.text }]}>
                          {formatSessionDuration(session.duration)}
                        </Text>
                        <Text style={[styles.sessionBreathing, { color: theme.colors.textSecondary }]}>
                          {session.breathingType}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  colorFrom,
  colorTo,
  theme
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorFrom: string;
  colorTo: string;
  theme: any;
}) {
  return (
    <LinearGradient
      colors={[colorFrom, colorTo]}
      style={styles.statCard}
    >
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'System',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'System',
    marginBottom: 32,
    textAlign: 'center',
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  statIcon: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'System',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'System',
  },
  periodStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  periodCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  periodLabel: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 8,
  },
  periodValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'System',
  },
  preferencesGrid: {
    gap: 12,
    marginBottom: 16,
  },
  preferenceCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  preferenceLabel: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 12,
  },
  preferenceValue: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
  },
  divineNameArabic: {
    fontSize: 24,
    fontFamily: 'System',
    marginBottom: 8,
    textAlign: 'right',
  },
  divineNameTrans: {
    fontSize: 18,
    fontFamily: 'System',
  },
  soundIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  recentSessionsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentSessionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 16,
  },
  sessionsList: {
    gap: 12,
  },
  sessionItem: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sessionIcon: {
    fontSize: 24,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  sessionDate: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 4,
  },
  sessionIntention: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sessionFeeling: {
    fontSize: 14,
    fontFamily: 'System',
  },
  sessionMeta: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  sessionBreathing: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 4,
  },
});

