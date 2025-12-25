/**
 * Page Analytics complète avec vue d'ensemble, historique et insights IA
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, Pressable, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { calculatePersonalOverview, loadEventHistory, type PersonalOverview, type EventHistoryItem } from '@/services/analyticsStats';
import { generateAnalyticsAnalysis, queryAnalytics, type AnalyticsAnalysis, type AnalyticsQuery } from '@/services/aiAnalyticsAgent';
import { exportAnalytics } from '@/services/analyticsExport';
import { resetAllAnalytics } from '@/services/analyticsReset';
import { LineChart, Heatmap } from '@/components/analytics/AdvancedCharts';
import { TrendingUp, Award, Lightbulb, Send, Bot, Sparkles, Clock, Monitor, Activity, ArrowUp, ArrowDown, Filter, Download, Trash2, Shield, ChevronRight, Calendar } from 'lucide-react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import { InteractionManager } from 'react-native';
import { SubscriptionGate } from '@/components/SubscriptionGate';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function Analytics() {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  
  // Vue d'ensemble
  const [overview, setOverview] = useState<PersonalOverview | null>(null);
  const [overviewPeriod, setOverviewPeriod] = useState<'day' | 'week' | 'month'>('month');
  
  // Historique
  const [eventHistory, setEventHistory] = useState<EventHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<{
    startDate?: Date;
    endDate?: Date;
    eventTypes?: string[];
  }>({});
  const [showHistoryFilters, setShowHistoryFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  // Agent IA
  const [showAgent, setShowAgent] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AnalyticsAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [querying, setQuerying] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  
  // Confidentialité - toujours visible maintenant
  const [showPrivacySettings, setShowPrivacySettings] = useState(true);
  
  // Rafraîchissement
  const [refreshing, setRefreshing] = useState(false);

  // Recharger les données à chaque fois que la page est focusée (mise à jour en temps réel)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadAllData();
        loadHistory();
      }
    }, [user?.id, overviewPeriod, historyFilter])
  );

  // Recharger aussi quand overviewPeriod change
  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id, overviewPeriod]);

  // Recharger l'historique quand les filtres changent
  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id, historyFilter]);

  // ✅ OPTIMISÉ : Charger overview de manière asynchrone et mémorisée
  const loadAllData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Différer le calcul lourd après les interactions
      InteractionManager.runAfterInteractions(async () => {
        const overviewData = await calculatePersonalOverview(user.id, overviewPeriod);
        setOverview(overviewData);
        setLoading(false);
      });
    } catch (error) {
      logger.error('[Analytics] Erreur chargement données:', error);
      setLoading(false);
    }
  }, [user?.id, overviewPeriod]);

  // ✅ OPTIMISÉ : Charger eventHistory de manière asynchrone et mémorisée
  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Différer le chargement après les interactions
      InteractionManager.runAfterInteractions(async () => {
        const history = await loadEventHistory(user.id, historyFilter);
        setEventHistory(history);
      });
    } catch (error) {
      logger.error('[Analytics] Erreur chargement historique:', error);
    }
  }, [user?.id, historyFilter]);

  // Fonction de rafraîchissement manuel
  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        loadAllData(),
        loadHistory(),
      ]);
    } catch (error) {
      logger.error('[Analytics] Erreur rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, overviewPeriod, historyFilter]);

  // Générer une analyse automatique
  const handleGenerateAnalysis = async () => {
    if (analyzing) return;
    
    setAnalyzing(true);
    try {
      // ✅ Permettre l'accès anonyme - Utiliser un utilisateur par défaut si non connecté
      const userForAnalysis = user || {
        id: undefined,
        name: '',
        email: '',
        theme: 'default' as const,
        analytics: { totalDhikr: 0, totalNotes: 0, totalPrayers: 0, totalDays: 0, streak: 0, lastActive: new Date().toISOString(), firstActive: new Date().toISOString() }
      };
      const analysis = await generateAnalyticsAnalysis(userForAnalysis, timeRange);
      setAiAnalysis(analysis);
      
      if (chatMessages.length === 0) {
        setChatMessages([{
          id: '1',
          text: t('analytics.assistant.welcome') || 'Bonjour ! Je suis votre assistant analytics. Comment puis-je vous aider ?',
          sender: 'ai',
          timestamp: new Date(),
        }]);
      }
    } catch (error: any) {
      logger.error('[Analytics] Erreur génération analyse:', error);
      if (error.message === 'SUBSCRIPTION_REQUIRED') {
        Alert.alert(
          t('subscription.required') || 'Active subscription required',
          t('subscription.requiredMessage') || 'This feature requires an active account. Please activate your account to use AI features.'
        );
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Envoyer une question à l'agent
  const handleSendQuery = async () => {
    if (!inputText.trim() || !user || querying) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputText('');
    setQuerying(true);

    try {
      const query: AnalyticsQuery = {
        question: inputText.trim(),
        context: { timeRange },
      };

      const response = await queryAnalytics(user, query);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
      } catch (error: any) {
      logger.error('[Analytics] Erreur requête:', error);
      
      let errorText = t('analytics.assistant.error') || 'Désolé, une erreur est survenue.';
      if (error.message === 'SUBSCRIPTION_REQUIRED') {
        errorText = t('subscription.required') || 'This feature requires an active account.';
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        text: errorText,
        sender: 'ai',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
      } finally {
      setQuerying(false);
    }
  };

  // Réinitialiser les analytics
  const handleResetAnalytics = () => {
    Alert.alert(
      t('analytics.privacy.resetTitle') || 'Réinitialiser les analytics',
      t('analytics.privacy.resetMessage') || 'Êtes-vous sûr de vouloir supprimer toutes vos données analytics ? Cette action est irréversible.',
      [
        { text: t('common.cancel') || 'Annuler', style: 'cancel' },
        {
          text: t('common.delete') || 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            setResetting(true);
            try {
              await resetAllAnalytics(user.id);
              // Recharger les données
              await loadAllData();
              await loadHistory();
              Alert.alert(t('common.success') || 'Succès', t('analytics.privacy.resetSuccess') || 'Vos données analytics ont été supprimées.');
            } catch (error) {
              console.error('[Analytics] Erreur réinitialisation:', error);
              Alert.alert(t('common.error') || 'Erreur', 'Erreur lors de la réinitialisation.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  // Exporter les données
  const handleExportData = async () => {
    if (!user?.id || !user?.email) {
      Alert.alert(
        t('common.error') || 'Erreur',
        t('analytics.privacy.emailRequired') || 'Votre adresse email est requise pour l\'export.'
      );
      return;
    }
    
    Alert.alert(
      t('analytics.privacy.export') || 'Exporter mes données',
      t('analytics.privacy.exportMessage') || 'Choisissez le format d\'export. Les données seront envoyées à votre adresse email.',
      [
        { text: t('common.cancel') || 'Annuler', style: 'cancel' },
        {
          text: 'JSON',
          onPress: async () => {
            setExporting(true);
            try {
              await exportAnalytics(user.id, user.email, user.name, 'json');
              Alert.alert(
                t('common.success') || 'Succès',
                t('analytics.privacy.exportSuccess') || 'Vos données ont été exportées et envoyées par email.'
              );
            } catch (error: any) {
              console.error('[Analytics] Erreur export JSON:', error);
              let errorMessage = error.message || t('analytics.privacy.exportError') || 'Erreur lors de l\'export.';
              
              // Messages d'erreur plus spécifiques
              if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                errorMessage = 'La fonction d\'export n\'est pas disponible. Veuillez contacter le support.';
              } else if (errorMessage.includes('500') || errorMessage.includes('serveur')) {
                errorMessage = 'Erreur serveur lors de l\'export. Veuillez réessayer plus tard.';
              } else if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('autorisé')) {
                errorMessage = 'Vous n\'êtes pas autorisé à exporter vos données.';
              } else if (errorMessage.includes('BREVO_API_KEY')) {
                errorMessage = 'Configuration manquante. Veuillez contacter le support.';
              }
              
              Alert.alert(
                t('common.error') || 'Erreur',
                errorMessage
              );
            } finally {
              setExporting(false);
            }
          },
        },
        {
          text: 'CSV',
          onPress: async () => {
            setExporting(true);
            try {
              await exportAnalytics(user.id, user.email, user.name, 'csv');
              Alert.alert(
                t('common.success') || 'Succès',
                t('analytics.privacy.exportSuccess') || 'Vos données ont été exportées et envoyées par email.'
              );
            } catch (error: any) {
              console.error('[Analytics] Erreur export CSV:', error);
              let errorMessage = error.message || t('analytics.privacy.exportError') || 'Erreur lors de l\'export.';
              
              // Messages d'erreur plus spécifiques
              if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                errorMessage = 'La fonction d\'export n\'est pas disponible. Veuillez contacter le support.';
              } else if (errorMessage.includes('500') || errorMessage.includes('serveur')) {
                errorMessage = 'Erreur serveur lors de l\'export. Veuillez réessayer plus tard.';
              } else if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('autorisé')) {
                errorMessage = 'Vous n\'êtes pas autorisé à exporter vos données.';
              } else if (errorMessage.includes('BREVO_API_KEY')) {
                errorMessage = 'Configuration manquante. Veuillez contacter le support.';
              }
              
              Alert.alert(
                t('common.error') || 'Erreur',
                errorMessage
              );
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
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
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Bot size={28} color={theme.colors.accent} />
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {t('analytics.title') || 'Mon Analytics'}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowPrivacySettings(!showPrivacySettings)}
              style={styles.privacyButton}
            >
              <Shield size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Settings de confidentialité */}
          {showPrivacySettings && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Card style={StyleSheet.flatten([styles.card, { backgroundColor: theme.colors.backgroundSecondary }])}>
                <CardContent>
                  <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>
                    {t('analytics.privacy.title') || 'Confidentialité et contrôle'}
                  </Text>
                  <Text style={[styles.privacyDescription, { color: theme.colors.textSecondary }]}>
                    {t('analytics.privacy.description') || 'Toutes vos données restent locales et sécurisées. Aucune donnée sensible n\'est envoyée à l\'IA.'}
                  </Text>
                  <View style={styles.privacyActions}>
                    <Button
                      onPress={handleExportData}
                      icon={Download}
                      iconPosition="left"
                      variant="outline"
                      style={styles.privacyActionButton}
                      loading={exporting}
                      disabled={exporting}
                    >
                      {exporting 
                        ? t('analytics.privacy.exporting') || 'Export en cours...'
                        : t('analytics.privacy.export') || 'Exporter mes données'}
                    </Button>
                    <Button
                      onPress={handleResetAnalytics}
                      icon={Trash2}
                      iconPosition="left"
                      variant="destructive"
                      style={styles.privacyActionButton}
                      loading={resetting}
                      disabled={resetting}
                    >
                      {resetting 
                        ? t('analytics.privacy.resetting') || 'Réinitialisation...'
                        : t('analytics.privacy.reset') || 'Réinitialiser'}
                    </Button>
                  </View>
                </CardContent>
              </Card>
            </Animated.View>
          )}

          {/* Vérifier s'il y a des données */}
          {!overview || (overview.sessionsToday === 0 && overview.sessionsThisWeek === 0 && overview.sessionsThisMonth === 0) ? (
            <Animated.View entering={FadeIn.delay(100).duration(600)}>
              <Card style={StyleSheet.flatten([styles.card, { backgroundColor: theme.colors.backgroundSecondary }])}>
                <CardContent>
                  <View style={styles.emptyState}>
                    <TrendingUp size={48} color={theme.colors.textSecondary} />
                    <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
                      {t('analytics.noData') || 'Aucune donnée'}
                    </Text>
                    <Text style={[styles.emptyStateDescription, { color: theme.colors.textSecondary }]}>
                      {t('analytics.noDataDescription') || 'Utilisez l\'application pour voir vos statistiques ici.'}
                    </Text>
                  </View>
                </CardContent>
              </Card>
            </Animated.View>
          ) : (
            <>
              {/* Vue d'ensemble personnelle */}
              <Animated.View entering={FadeIn.delay(100).duration(600)}>
            <Card style={StyleSheet.flatten([styles.card, { backgroundColor: theme.colors.backgroundSecondary }])}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>
                      {t('analytics.overview.title') || 'Vue d\'ensemble'}
                </CardTitle>
                    <View style={styles.periodSelector}>
                      {(['day', 'week', 'month'] as const).map((period) => (
                        <Pressable
                          key={period}
                          onPress={() => setOverviewPeriod(period)}
                            style={[
                            styles.periodButton,
                            {
                              backgroundColor: overviewPeriod === period 
                                ? theme.colors.accent + '33' 
                                : 'transparent',
                              borderColor: overviewPeriod === period 
                                ? theme.colors.accent 
                                : theme.colors.textSecondary + '40',
                            },
                          ]}
                        >
                          <Text style={[
                            styles.periodText,
                            {
                              color: overviewPeriod === period 
                                ? theme.colors.accent 
                                : theme.colors.textSecondary,
                            },
                          ]}>
                            {period === 'day' ? t('analytics.day') || 'Jour' :
                             period === 'week' ? t('analytics.week') || 'Semaine' :
                             t('analytics.month') || 'Mois'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </CardHeader>
                  <CardContent>
                    {/* Statistiques clés */}
                    <View style={styles.statsGrid}>
                      <View style={[styles.statCard, { backgroundColor: theme.colors.accent + '15' }]}>
                        <Activity size={20} color={theme.colors.accent} />
                        <Text style={[styles.statValue, { color: theme.colors.text }]}>
                          {overviewPeriod === 'day' ? overview.sessionsToday :
                           overviewPeriod === 'week' ? overview.sessionsThisWeek :
                           overview.sessionsThisMonth}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                          {t('analytics.overview.sessions') || 'Sessions'}
                          </Text>
                        </View>
                      
                      <View style={[styles.statCard, { backgroundColor: theme.colors.accent + '15' }]}>
                        <Clock size={20} color={theme.colors.accent} />
                        <Text style={[styles.statValue, { color: theme.colors.text }]}>
                          {overview.totalTimeFormatted}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                          {t('analytics.overview.totalTime') || 'Temps total'}
                        </Text>
                      </View>
                      
                      <View style={[styles.statCard, { backgroundColor: theme.colors.accent + '15' }]}>
                        <Clock size={20} color={theme.colors.accent} />
                        <Text style={[styles.statValue, { color: theme.colors.text }]}>
                          {overview.averageSessionMinutes}min
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                          {t('analytics.overview.avgSession') || 'Moyenne/session'}
                        </Text>
                      </View>
                    </View>

                    {/* Écrans les plus visités */}
                    {overview.topScreens.length > 0 && (
                      <View style={styles.topScreensContainer}>
                        <Text style={[styles.sectionSubtitle, { color: theme.colors.text }]}>
                          {t('analytics.overview.topScreens') || 'Écrans les plus visités'}
                        </Text>
                        {overview.topScreens.map((screen, index) => (
                          <View key={index} style={[styles.screenItem, { borderColor: theme.colors.textSecondary + '20' }]}>
                            <Monitor size={16} color={theme.colors.textSecondary} />
                            <View style={styles.screenInfo}>
                              <Text style={[styles.screenName, { color: theme.colors.text }]}>
                                {screen.name}
                              </Text>
                              <Text style={[styles.screenStats, { color: theme.colors.textSecondary }]}>
                                {screen.visits} visites • {Math.round(screen.timeSeconds / 60)}min
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Actions réalisées */}
                    <View style={styles.actionsContainer}>
                      <Text style={[styles.sectionSubtitle, { color: theme.colors.text }]}>
                        {t('analytics.overview.actions') || 'Actions réalisées'}
                      </Text>
                      <View style={styles.actionsGrid}>
                        <View style={[styles.actionItem, { borderColor: theme.colors.accent + '30' }]}>
                          <Text style={[styles.actionValue, { color: theme.colors.accent }]}>
                            {overview.actions.dhikr}
                          </Text>
                          <Text style={[styles.actionLabel, { color: theme.colors.textSecondary }]}>
                            {t('analytics.actions.dhikr') || 'Dhikr'}
                          </Text>
                        </View>
                        <View style={[styles.actionItem, { borderColor: theme.colors.accent + '30' }]}>
                          <Text style={[styles.actionValue, { color: theme.colors.accent }]}>
                            {overview.actions.prayers}
                          </Text>
                          <Text style={[styles.actionLabel, { color: theme.colors.textSecondary }]}>
                            {t('analytics.actions.prayers') || 'Prières'}
                          </Text>
                        </View>
                        <View style={[styles.actionItem, { borderColor: theme.colors.accent + '30' }]}>
                          <Text style={[styles.actionValue, { color: theme.colors.accent }]}>
                            {overview.actions.notes}
                          </Text>
                          <Text style={[styles.actionLabel, { color: theme.colors.textSecondary }]}>
                            {t('analytics.actions.notes') || 'Notes'}
                          </Text>
                        </View>
                        <View style={[styles.actionItem, { borderColor: theme.colors.accent + '30' }]}>
                          <Text style={[styles.actionValue, { color: theme.colors.accent }]}>
                            {overview.actions.khalwa}
                          </Text>
                          <Text style={[styles.actionLabel, { color: theme.colors.textSecondary }]}>
                            {t('analytics.actions.khalwa') || 'Méditations'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Progression */}
                    <View style={styles.progressionContainer}>
                      <Text style={[styles.sectionSubtitle, { color: theme.colors.text }]}>
                        {t('analytics.overview.progression') || 'Progression'}
                      </Text>
                      <View style={styles.progressionItem}>
                        <View style={styles.progressionHeader}>
                          <Text style={[styles.progressionLabel, { color: theme.colors.text }]}>
                            {t('analytics.overview.thisWeek') || 'Cette semaine'}
                          </Text>
                          <View style={styles.progressionChange}>
                            {overview.progression.week.changePercent > 0 ? (
                              <ArrowUp size={16} color="#10B981" />
                            ) : overview.progression.week.changePercent < 0 ? (
                              <ArrowDown size={16} color="#EF4444" />
                            ) : null}
                            <Text style={[
                              styles.progressionPercent,
                              {
                                color: overview.progression.week.changePercent > 0 
                                  ? '#10B981' 
                                  : overview.progression.week.changePercent < 0 
                                  ? '#EF4444' 
                                  : theme.colors.textSecondary,
                              },
                            ]}>
                              {overview.progression.week.changePercent > 0 ? '+' : ''}
                              {overview.progression.week.changePercent}%
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.progressionValue, { color: theme.colors.textSecondary }]}>
                          {overview.progression.week.sessions} sessions • {Math.round(overview.progression.week.timeSeconds / 60)}min
                        </Text>
                      </View>
                      
                      <View style={styles.progressionItem}>
                        <View style={styles.progressionHeader}>
                          <Text style={[styles.progressionLabel, { color: theme.colors.text }]}>
                            {t('analytics.overview.thisMonth') || 'Ce mois'}
                          </Text>
                          <View style={styles.progressionChange}>
                            {overview.progression.month.changePercent > 0 ? (
                              <ArrowUp size={16} color="#10B981" />
                            ) : overview.progression.month.changePercent < 0 ? (
                              <ArrowDown size={16} color="#EF4444" />
                            ) : null}
                            <Text style={[
                              styles.progressionPercent,
                              {
                                color: overview.progression.month.changePercent > 0 
                                  ? '#10B981' 
                                  : overview.progression.month.changePercent < 0 
                                  ? '#EF4444' 
                                  : theme.colors.textSecondary,
                              },
                            ]}>
                              {overview.progression.month.changePercent > 0 ? '+' : ''}
                              {overview.progression.month.changePercent}%
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.progressionValue, { color: theme.colors.textSecondary }]}>
                          {overview.progression.month.sessions} sessions • {Math.round(overview.progression.month.timeSeconds / 60)}min
                        </Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              </Animated.View>

              {/* Graphiques avancés */}
              {overview && eventHistory.length > 0 && (
                <Animated.View entering={FadeIn.delay(150).duration(600)}>
                  <Card style={StyleSheet.flatten([styles.card, { backgroundColor: theme.colors.backgroundSecondary }])}>
                    <CardHeader>
                      <CardTitle style={{ color: theme.colors.text }}>
                        {t('analytics.charts.title') || 'Graphiques détaillés'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Graphique en courbe - Activité sur 7 jours */}
                      <View style={styles.chartSection}>
                        <Text style={[styles.chartSectionTitle, { color: theme.colors.text }]}>
                          {t('analytics.charts.activity7Days') || 'Activité des 7 derniers jours'}
                        </Text>
                        <LineChart
                          data={Array.from({ length: 7 }, (_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (6 - i));
                            date.setHours(0, 0, 0, 0);
                            const dayEnd = new Date(date);
                            dayEnd.setHours(23, 59, 59, 999);
                            
                            const dayEvents = eventHistory.filter(e => {
                              const eventDate = new Date(e.timestamp);
                              return eventDate >= date && eventDate <= dayEnd;
                            });
                            
                            return {
                              x: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                              y: dayEvents.length,
                              date,
                            };
                          })}
                          color={theme.colors.accent}
                        />
                  </View>

                      {/* Heatmap - Activité mensuelle */}
                      <View style={styles.chartSection}>
                        <Text style={[styles.chartSectionTitle, { color: theme.colors.text }]}>
                          {t('analytics.charts.monthlyHeatmap') || 'Carte de chaleur mensuelle'}
                        </Text>
                        <Heatmap
                          data={eventHistory.map(e => ({
                            date: new Date(e.timestamp),
                            value: 1,
                          }))}
                          startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
                          endDate={new Date()}
                          color={theme.colors.accent}
                        />
                </View>
              </CardContent>
            </Card>
          </Animated.View>
              )}

              {/* Historique détaillé */}
              <Animated.View entering={FadeIn.delay(200).duration(600)}>
              <Card style={StyleSheet.flatten([styles.card, { backgroundColor: theme.colors.backgroundSecondary }])}>
                <CardHeader>
                    <CardTitle style={{ color: theme.colors.text }}>
                      {t('analytics.history.title') || 'Historique détaillé'}
                  </CardTitle>
                    <Pressable
                      onPress={() => setShowHistoryFilters(!showHistoryFilters)}
                      style={styles.filterButton}
                    >
                      <Filter size={20} color={theme.colors.textSecondary} />
                    </Pressable>
                </CardHeader>
                <CardContent>
                    {/* Filtres */}
                    {showHistoryFilters && (
                      <View style={styles.filtersContainer}>
                        <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
                          {t('analytics.history.filterByType') || 'Filtrer par type'}
                        </Text>
                        <View style={styles.filterButtons}>
                          {['dhikr', 'prayer', 'note', 'khalwa'].map((type) => (
                            <Pressable
                              key={type}
                              onPress={() => {
                                // Si le type est déjà sélectionné, désélectionner (toggle)
                                if (historyFilter.eventTypes?.includes(type)) {
                                  const newTypes = historyFilter.eventTypes.filter(t => t !== type);
                                  setHistoryFilter({ 
                                    ...historyFilter, 
                                    eventTypes: newTypes.length > 0 ? newTypes : undefined 
                                  });
                                } else {
                                  // Ajouter le type aux filtres
                                  setHistoryFilter({ 
                                    ...historyFilter, 
                                    eventTypes: [...(historyFilter.eventTypes || []), type] 
                                  });
                                }
                              }}
                              style={[
                                styles.filterButton,
                                {
                                  backgroundColor: historyFilter.eventTypes?.includes(type) 
                                    ? theme.colors.accent + '33' 
                                    : 'transparent',
                                  borderColor: historyFilter.eventTypes?.includes(type) 
                                    ? theme.colors.accent 
                                    : theme.colors.textSecondary + '40',
                                },
                              ]}
                            >
                              <Text style={[
                                styles.filterButtonText,
                                {
                                  color: historyFilter.eventTypes?.includes(type) 
                                    ? theme.colors.accent 
                                    : theme.colors.textSecondary,
                                },
                              ]}>
                                {type === 'dhikr' ? t('analytics.actions.dhikr') || 'Dhikr' :
                                 type === 'prayer' ? t('analytics.actions.prayers') || 'Prières' :
                                 type === 'note' ? t('analytics.actions.notes') || 'Notes' :
                                 t('analytics.actions.khalwa') || 'Méditations'}
                        </Text>
                            </Pressable>
                          ))}
                        </View>
                        
                        {/* Filtres de date */}
                        <Text style={[styles.filterLabel, { color: theme.colors.text, marginTop: 16 }]}>
                          {t('analytics.history.filterByDate') || 'Filtrer par date'}
                        </Text>
                        <View style={styles.dateFiltersContainer}>
                          <Pressable
                            onPress={() => {
                              // Pour simplifier, on utilise des périodes prédéfinies
                              const now = new Date();
                              const weekAgo = new Date(now);
                              weekAgo.setDate(weekAgo.getDate() - 7);
                              setHistoryFilter({ ...historyFilter, startDate: weekAgo, endDate: now });
                            }}
                            style={[
                              styles.dateFilterButton,
                              {
                                backgroundColor: historyFilter.startDate ? theme.colors.accent + '33' : 'transparent',
                                borderColor: historyFilter.startDate ? theme.colors.accent : theme.colors.textSecondary + '40',
                              },
                            ]}
                          >
                            <Calendar size={16} color={historyFilter.startDate ? theme.colors.accent : theme.colors.textSecondary} />
                            <Text style={[
                              styles.dateFilterText,
                              { color: historyFilter.startDate ? theme.colors.accent : theme.colors.textSecondary },
                            ]}>
                              {historyFilter.startDate && historyFilter.endDate
                                ? `${historyFilter.startDate.toLocaleDateString('fr-FR')} - ${historyFilter.endDate.toLocaleDateString('fr-FR')}`
                                : t('analytics.history.selectDateRange') || 'Sélectionner une période'}
                            </Text>
                          </Pressable>
                          {historyFilter.startDate && (
                            <Pressable
                              onPress={() => setHistoryFilter({ ...historyFilter, startDate: undefined, endDate: undefined })}
                              style={styles.clearDateButton}
                            >
                              <Text style={[styles.clearDateText, { color: theme.colors.textSecondary }]}>
                                {t('analytics.history.clearDates') || 'Effacer'}
                              </Text>
                            </Pressable>
                          )}
                      </View>
                        
                        {/* Périodes rapides */}
                        <View style={styles.quickDateButtons}>
                          {[
                            { label: t('analytics.history.last7Days') || '7 derniers jours', days: 7 },
                            { label: t('analytics.history.last30Days') || '30 derniers jours', days: 30 },
                            { label: t('analytics.history.last90Days') || '90 derniers jours', days: 90 },
                          ].map((period) => (
                            <Pressable
                              key={period.days}
                              onPress={() => {
                                const now = new Date();
                                const start = new Date(now);
                                start.setDate(start.getDate() - period.days);
                                setHistoryFilter({ ...historyFilter, startDate: start, endDate: now });
                              }}
                              style={[
                                styles.quickDateButton,
                                {
                                  borderColor: theme.colors.textSecondary + '40',
                                },
                              ]}
                            >
                              <Text style={[styles.quickDateText, { color: theme.colors.textSecondary }]}>
                                {period.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Liste des événements */}
                    <View style={styles.historyList}>
                      {eventHistory.length === 0 ? (
                        <Text style={[styles.emptyHistoryText, { color: theme.colors.textSecondary }]}>
                          {t('analytics.history.empty') || 'Aucun événement trouvé'}
                        </Text>
                      ) : (
                        eventHistory.slice(0, 50).map((item, index) => (
                          <View key={item.id} style={[styles.historyItem, { borderColor: theme.colors.textSecondary + '20' }]}>
                            <View style={styles.historyItemHeader}>
                              <Text style={[styles.historyCategory, { color: theme.colors.accent }]}>
                                {item.category}
                              </Text>
                              <Text style={[styles.historyDate, { color: theme.colors.textSecondary }]}>
                                {new Date(item.timestamp).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Text>
                            </View>
                            <Text style={[styles.historyDescription, { color: theme.colors.text }]}>
                              {item.description}
                            </Text>
                            {(item.duration || item.count || item.score) && (
                              <View style={styles.historyMetadata}>
                                {item.duration && (
                                  <Text style={[styles.historyMeta, { color: theme.colors.textSecondary }]}>
                                    {Math.round(item.duration / 60)}min
                                  </Text>
                                )}
                                {item.count && (
                                  <Text style={[styles.historyMeta, { color: theme.colors.textSecondary }]}>
                                    {item.count} répétitions
                                  </Text>
                                )}
                                {item.score && (
                                  <Text style={[styles.historyMeta, { color: theme.colors.textSecondary }]}>
                                    Score: {item.score}
                                  </Text>
                                )}
                              </View>
                            )}
                          </View>
                        ))
                      )}
                    </View>
                </CardContent>
              </Card>
            </Animated.View>

              {/* Insights IA personnalisés */}
              <Animated.View entering={FadeIn.delay(300).duration(600)}>
              <Card style={StyleSheet.flatten([styles.card, { backgroundColor: theme.colors.backgroundSecondary }])}>
                <CardHeader>
                    <Lightbulb size={24} color={theme.colors.accent} />
                  <CardTitle style={{ color: theme.colors.text, marginLeft: 8 }}>
                      {t('analytics.insights.title') || 'Insights IA personnalisés'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SubscriptionGate>
                    {!showAgent ? (
                      <View>
                        <Text style={[styles.agentDescription, { color: theme.colors.textSecondary }]}>
                          {t('analytics.assistant.description') || 'Obtenez des insights personnalisés sur votre activité et des recommandations basées sur vos données.'}
                        </Text>
                        <Button
                          onPress={() => setShowAgent(true)}
                          icon={Sparkles}
                          iconPosition="left"
                          style={styles.agentButton}
                        >
                          {t('analytics.assistant.open') || 'Ouvrir l\'assistant'}
                        </Button>
                      </View>
                    ) : (
                      <View style={styles.agentContainer}>
                        {/* Sélecteur de période */}
                        <View style={styles.timeRangeSelector}>
                          {(['week', 'month', 'year', 'all'] as const).map((range) => (
                            <Pressable
                              key={range}
                              onPress={() => setTimeRange(range)}
                              style={[
                                styles.timeRangeButton,
                                {
                                  backgroundColor: timeRange === range 
                                    ? theme.colors.accent + '33' 
                                    : 'transparent',
                                  borderColor: timeRange === range 
                                    ? theme.colors.accent 
                                    : theme.colors.textSecondary + '40',
                                },
                              ]}
                            >
                              <Text style={[
                                styles.timeRangeText,
                                {
                                  color: timeRange === range 
                                    ? theme.colors.accent 
                                    : theme.colors.textSecondary,
                                },
                              ]}>
                                {range === 'week' ? t('analytics.week') || 'Semaine' :
                                 range === 'month' ? t('analytics.month') || 'Mois' :
                                 range === 'year' ? t('analytics.year') || 'Année' :
                                 t('analytics.all') || 'Tout'}
                        </Text>
                            </Pressable>
                    ))}
                  </View>

                        {/* Bouton générer analyse */}
                        <Button
                          onPress={handleGenerateAnalysis}
                          loading={analyzing}
                          disabled={analyzing}
                          icon={Sparkles}
                          iconPosition="left"
                          style={styles.generateButton}
                        >
                          {analyzing 
                            ? t('analytics.assistant.analyzing') || 'Analyse en cours...'
                            : t('analytics.assistant.analyze') || 'Générer une analyse'}
                        </Button>

                        {/* Analyse générée */}
                        {aiAnalysis && (
                          <View style={[styles.analysisContainer, { borderColor: theme.colors.accent + '30' }]}>
                            <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>
                              {t('analytics.assistant.summary') || 'Résumé automatique'}
                            </Text>
                            <Text style={[styles.analysisText, { color: theme.colors.textSecondary }]}>
                              {aiAnalysis.summary}
                            </Text>

                            {aiAnalysis.patterns.length > 0 && (
                              <>
                                <Text style={[styles.analysisTitle, { color: theme.colors.text, marginTop: 16 }]}>
                                  {t('analytics.assistant.trends') || 'Tendances détectées'}
                                </Text>
                                {aiAnalysis.patterns.map((pattern, index) => (
                                  <Text key={index} style={[styles.analysisItem, { color: theme.colors.textSecondary }]}>
                                    • {pattern}
                                  </Text>
                                ))}
                              </>
                            )}

                            {aiAnalysis.recommendations.length > 0 && (
                              <>
                                <Text style={[styles.analysisTitle, { color: theme.colors.text, marginTop: 16 }]}>
                                  {t('analytics.assistant.advice') || 'Conseils personnalisés'}
                                </Text>
                                {aiAnalysis.recommendations.map((rec, index) => (
                                  <Text key={index} style={[styles.analysisItem, { color: theme.colors.textSecondary }]}>
                                    • {rec}
                                  </Text>
                                ))}
                              </>
                            )}

                            {aiAnalysis.questions && aiAnalysis.questions.length > 0 && (
                              <>
                                <Text style={[styles.analysisTitle, { color: theme.colors.text, marginTop: 16 }]}>
                                  {t('analytics.assistant.suggestions') || 'Questions suggérées'}
                                </Text>
                                {aiAnalysis.questions.map((question, index) => (
                                  <Pressable
                                    key={index}
                                    onPress={() => setInputText(question)}
                                    style={[styles.questionButton, { borderColor: theme.colors.accent + '40' }]}
                                  >
                                    <Text style={[styles.questionText, { color: theme.colors.accent }]}>
                                      {question}
                                    </Text>
                                  </Pressable>
                                ))}
                              </>
                            )}
                          </View>
                        )}

                        {/* Chat avec l'agent */}
                        <View style={styles.chatContainer}>
                          <Text style={[styles.chatTitle, { color: theme.colors.text }]}>
                            {t('analytics.assistant.chat') || 'Posez vos questions'}
                          </Text>
                          <View style={styles.chatMessagesList}>
                            {chatMessages.map((item) => (
                              <View
                                key={item.id}
                                style={[
                                  styles.chatMessage,
                                  item.sender === 'user' ? styles.chatMessageUser : styles.chatMessageAI,
                                  {
                                    backgroundColor: item.sender === 'user' 
                                      ? theme.colors.accent + '20' 
                                      : theme.colors.background,
                                  },
                                ]}
                              >
                                <Text style={[
                                  styles.chatMessageText,
                                  { color: theme.colors.text },
                                ]}>
                                  {item.text}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <View style={[styles.chatInputContainer, { borderColor: theme.colors.textSecondary + '40' }]}>
                            <TextInput
                              value={inputText}
                              onChangeText={setInputText}
                              placeholder={t('analytics.assistant.placeholder') || 'Posez une question sur vos analytics...'}
                              placeholderTextColor={theme.colors.textSecondary + '80'}
                              style={[styles.chatInput, { color: theme.colors.text }]}
                              multiline
                              editable={!querying}
                            />
                            <Pressable
                              onPress={handleSendQuery}
                              disabled={!inputText.trim() || querying}
                              style={[
                                styles.chatSendButton,
                                {
                                  backgroundColor: inputText.trim() && !querying 
                                    ? theme.colors.accent 
                                    : theme.colors.textSecondary + '40',
                                },
                              ]}
                            >
                              {querying ? (
                                <ActivityIndicator size="small" color={theme.colors.background} />
                              ) : (
                                <Send size={20} color={theme.colors.background} />
                              )}
                            </Pressable>
                          </View>
                        </View>

                        <Button
                          onPress={() => {
                            setShowAgent(false);
                            setChatMessages([]);
                            setAiAnalysis(null);
                          }}
                          variant="outline"
                          style={styles.closeAgentButton}
                        >
                          {t('analytics.assistant.close') || 'Fermer'}
                        </Button>
                      </View>
                    )}
                  </SubscriptionGate>
                </CardContent>
              </Card>
            </Animated.View>
            </>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  privacyButton: {
    padding: 8,
  },
  card: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  topScreensContainer: {
    marginBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  screenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  screenInfo: {
    flex: 1,
  },
  screenName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  screenStats: {
    fontSize: 12,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  progressionContainer: {
    gap: 12,
  },
  progressionItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressionChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressionPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressionValue: {
    fontSize: 12,
  },
  filtersContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    gap: 8,
  },
  emptyHistoryText: {
    textAlign: 'center',
    padding: 24,
    fontSize: 14,
  },
  historyItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  historyDate: {
    fontSize: 11,
  },
  historyDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  historyMetadata: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  historyMeta: {
    fontSize: 11,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  privacyDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  privacyActions: {
    gap: 12,
  },
  privacyActionButton: {
    marginTop: 4,
  },
  agentDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  agentButton: {
    marginTop: 8,
  },
  agentContainer: {
    gap: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  generateButton: {
    marginTop: 8,
  },
  analysisContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  analysisItem: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  questionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  questionText: {
    fontSize: 14,
  },
  chatContainer: {
    marginTop: 16,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chatMessagesList: {
    maxHeight: 300,
    marginBottom: 12,
    paddingVertical: 8,
  },
  chatMessage: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '85%',
  },
  chatMessageUser: {
    alignSelf: 'flex-end',
  },
  chatMessageAI: {
    alignSelf: 'flex-start',
  },
  chatMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
  },
  chatSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeAgentButton: {
    marginTop: 8,
  },
  dateFiltersContainer: {
    marginTop: 8,
    gap: 8,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dateFilterText: {
    fontSize: 14,
  },
  clearDateButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    fontSize: 12,
  },
  quickDateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  quickDateButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickDateText: {
    fontSize: 12,
  },
  chartSection: {
    marginBottom: 24,
  },
  chartSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
});
