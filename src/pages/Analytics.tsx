import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
// Temporairement désactivé - victory-native nécessite une API différente
// import { CartesianChart, Bar, CartesianAxis } from 'victory-native';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { BarChart2, TrendingUp, Clock } from 'lucide-react-native';
import { getUserUsageStats, getDailyUsageFrequency, getModuleUsageTime } from '@/services/usageTracking';
import { loadAllModuleVisits, filterVisitsByPeriod, calculateModuleFrequency, type ModuleVisit } from '@/services/moduleTracking';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64; // Padding de 32 de chaque côté

/**
 * Page Analytics
 * 
 * Affiche les statistiques d'utilisation de l'application
 */
export function Analytics() {
  const { user, isAuthenticated } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  const [frequencyPeriod, setFrequencyPeriod] = useState<'30days' | '7days' | '24h'>('30days');
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [dailyFrequency, setDailyFrequency] = useState<Array<{ date: string; timeMinutes?: number; timeHours?: number; hour?: number }>>([]);
  const [moduleUsage, setModuleUsage] = useState<Array<{ module: string; timeSeconds: number; sessions: number }>>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  
  // Nouveau système de tracking des modules
  const [moduleVisits, setModuleVisits] = useState<ModuleVisit[]>([]);
  const [moduleFrequency, setModuleFrequency] = useState<Record<string, number>>({});
  const [loadingModuleTracking, setLoadingModuleTracking] = useState(false);

  const moduleNames: Record<string, string> = {
    sabilanur: "Sabila'Nûr",
    'dairat-an-nur': "Da'irat an-nur",
    'nur-shifa': 'Nur & Shifa',
    asma: "99 noms d'Allah",
    journal: 'Journal',
    chat: 'AYNA',
    quran: "Qur'an",
  };

  const getDaysForPeriod = (period: '30days' | '7days' | '24h'): number => {
    if (period === '24h') return 1;
    if (period === '7days') return 7;
    return 30;
  };

  // Charger les données du tracking des modules
  useEffect(() => {
    const loadModuleTrackingData = async () => {
      setLoadingModuleTracking(true);
      try {
        // Convertir la période en heures
        const periodHours = frequencyPeriod === '24h' ? 24 : frequencyPeriod === '7days' ? 168 : 720;
        
        // Charger toutes les visites (local + remote)
        const allVisits = await loadAllModuleVisits(user?.id);
        
        // Filtrer selon la période
        const filteredVisits = filterVisitsByPeriod(allVisits, periodHours);
        
        // Calculer la fréquence par module
        const frequency = calculateModuleFrequency(filteredVisits);
        
        setModuleVisits(filteredVisits);
        setModuleFrequency(frequency);
      } catch (error) {
        console.error('Erreur lors du chargement du tracking des modules:', error);
        setModuleVisits([]);
        setModuleFrequency({});
      } finally {
        setLoadingModuleTracking(false);
      }
    };

    loadModuleTrackingData();
    
    // Rafraîchir toutes les 30 secondes pour les données en temps réel
    const interval = setInterval(loadModuleTrackingData, 30000);
    return () => clearInterval(interval);
  }, [user?.id, frequencyPeriod]);

  useEffect(() => {
    // Charger les données même sans authentification (affichera des données vides)
    if (user?.id) {
      const loadData = async () => {
        if (!user?.id) return;
        setLoadingUsage(true);
        try {
          const days = getDaysForPeriod(frequencyPeriod);
          
          // Charger les données depuis Supabase
          const [stats, daily, modules] = await Promise.all([
            getUserUsageStats(user.id, days),
            getDailyUsageFrequency(user.id, days),
            getModuleUsageTime(user.id, days),
          ]);

          setDailyFrequency(daily || []);
          setModuleUsage(modules || []);
          setUsageStats(stats || {
            activeDays: 0,
            totalDays: days,
            totalTimeSeconds: 0,
          });
        } catch (error) {
          console.error('Erreur lors du chargement des données analytiques:', error);
          setDailyFrequency([]);
          setModuleUsage([]);
          setUsageStats(null);
        } finally {
          setLoadingUsage(false);
        }
      };

      loadData();
      if (frequencyPeriod === '24h') {
        const interval = setInterval(loadData, 60000);
        return () => clearInterval(interval);
      }
    }
  }, [user?.id, frequencyPeriod]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  const formatYAxis = (value: number) => {
    if (frequencyPeriod === '24h') {
      return `${value} min`;
    }
    if (value % 1 === 0) {
      return `${value}h`;
    }
    return `${value.toFixed(1)}h`;
  };

  // Préparer les données pour le graphique
  const chartData = dailyFrequency.map((item, index) => ({
    x: frequencyPeriod === '24h' ? item.hour || index : index + 1,
    y: frequencyPeriod === '24h' ? (item.timeMinutes || 0) : (item.timeHours || 0),
    label: frequencyPeriod === '24h' 
      ? `${item.hour || index}h`
      : new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  }));

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
      
      <SafeAreaView 
        style={styles.container}
        edges={['top']}
      >
        <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BarChart2 size={24} color={theme.colors.accent} />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('analytics.title')}
          </Text>
        </View>

        {/* Sélecteur de période */}
        <View style={styles.periodSelector}>
          {(['30days', '7days', '24h'] as const).map((period) => (
            <Pressable
              key={period}
              onPress={() => setFrequencyPeriod(period)}
              style={[
                styles.periodButton,
                frequencyPeriod === period && {
                  backgroundColor: theme.colors.accent,
                },
                frequencyPeriod !== period && {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
              ]}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: frequencyPeriod === period 
                      ? '#0A0F2C' 
                      : theme.colors.text,
                  },
                ]}
              >
                {period === '30days' ? t('analytics.period30days') : period === '7days' ? t('analytics.period7days') : t('analytics.period24h')}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Statistiques générales */}
        {usageStats && (
          <Card style={{ backgroundColor: theme.colors.backgroundSecondary, marginBottom: 16 }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.text }}>
                {t('analytics.overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <TrendingUp size={20} color={theme.colors.accent} />
                  <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                    {usageStats.activeDays || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    {t('analytics.activeDays')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Clock size={20} color={theme.colors.accent} />
                  <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                    {formatTime(usageStats.totalTimeSeconds || 0)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    {t('analytics.totalTime')}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Graphique de fréquence */}
        <Card style={{ backgroundColor: theme.colors.backgroundSecondary, marginBottom: 16 }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.text }}>
              {t('analytics.usageFrequency')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsage ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  {t('analytics.loading')}
                </Text>
              </View>
            ) : chartData.length > 0 ? (
              <View style={styles.chartContainer}>
                {/* Graphique simplifié temporairement - TODO: Implémenter avec victory-native API */}
                <View style={styles.simpleChart}>
                  {chartData.map((item, index) => {
                    const maxValue = Math.max(...chartData.map(d => d.y));
                    const barHeight = maxValue > 0 ? (item.y / maxValue) * 200 : 0;
                    return (
                      <View key={index} style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barHeight,
                              backgroundColor: theme.colors.accent,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.barLabel,
                            { color: theme.colors.textSecondary, fontSize: 9 },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.barValue,
                            { color: theme.colors.textSecondary, fontSize: 8 },
                          ]}
                        >
                          {formatYAxis(item.y)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {t('analytics.noData')}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Nouveau système : Fréquence d'utilisation par module (10 secondes) */}
        <Card style={{ backgroundColor: theme.colors.backgroundSecondary, marginBottom: 16 }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.text }}>
              {t('analytics.moduleFrequency')}
            </CardTitle>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('analytics.validatedVisits')}
            </Text>
          </CardHeader>
          <CardContent>
            {loadingModuleTracking ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  {t('analytics.loading')}
                </Text>
              </View>
            ) : Object.keys(moduleFrequency).length > 0 ? (
              <View style={styles.moduleFrequencyList}>
                {Object.entries(moduleFrequency)
                  .sort(([, a], [, b]) => b - a) // Trier par fréquence décroissante
                  .map(([moduleId, count]) => (
                    <View key={moduleId} style={styles.moduleFrequencyItem}>
                      <View style={styles.moduleFrequencyInfo}>
                        <Text style={[styles.moduleFrequencyName, { color: theme.colors.text }]}>
                          {moduleId}
                        </Text>
                        <Text style={[styles.moduleFrequencyCount, { color: theme.colors.accent }]}>
                          {count} {t(count > 1 ? 'analytics.visits_plural' : 'analytics.visits')}
                        </Text>
                      </View>
                      <View style={styles.moduleFrequencyBarContainer}>
                        <View
                          style={[
                            styles.moduleFrequencyBar,
                            {
                              width: `${Math.min((count / Math.max(...Object.values(moduleFrequency))) * 100, 100)}%`,
                              backgroundColor: theme.colors.accent,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {t('analytics.noValidatedVisits')}
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  {t('analytics.visitsUnder10Seconds')}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Liste des modules (ancien système) */}
        {moduleUsage.length > 0 && (
          <Card style={{ backgroundColor: theme.colors.backgroundSecondary }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.text }}>
                {t('analytics.usageByModule')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {moduleUsage.map((item, index) => (
                <View key={index} style={styles.moduleItem}>
                  <View style={styles.moduleInfo}>
                    <Text style={[styles.moduleName, { color: theme.colors.text }]}>
                      {moduleNames[item.module] || item.module}
                    </Text>
                    <Text style={[styles.moduleTime, { color: theme.colors.textSecondary }]}>
                      {formatTime(item.timeSeconds)}
                    </Text>
                  </View>
                  <View style={styles.moduleSessions}>
                    <Text style={[styles.moduleSessionsText, { color: theme.colors.textSecondary }]}>
                      {item.sessions} {t(item.sessions > 1 ? 'analytics.sessions_plural' : 'analytics.sessions')}
                    </Text>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'System',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'System',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  simpleChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    height: 250,
    paddingHorizontal: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  bar: {
    width: '80%',
    minHeight: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
  },
  barValue: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  moduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 4,
  },
  moduleTime: {
    fontSize: 12,
    fontFamily: 'System',
  },
  moduleSessions: {
    marginLeft: 16,
  },
  moduleSessionsText: {
    fontSize: 12,
    fontFamily: 'System',
  },
});
