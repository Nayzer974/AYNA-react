import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, FlatList } from 'react-native';
import Animated, { FadeInDown, FadeIn, SlideInDown, Layout } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Mic, TrendingUp, BookOpen, Sparkles, Heart, Brain } from 'lucide-react-native';
import { storage } from '@/utils/storage';
import { loadJournalNotes, saveJournalNotes, deleteJournalNote, type JournalNote } from '@/services/notesStorage';
import { requestRecordingPermissionsAsync, AudioModule } from 'expo-audio';
import type { AudioRecorder } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { sttTranscribe } from '@/services/voice';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics';
import i18n from '@/i18n';
import { EmptyState, Skeleton, SkeletonText, Button, GlassCard } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { createAccessibilityProps } from '@/utils/accessibility';
import { AnimatedListItem } from '@/components/AnimatedListItem';
import { analyzeJournal, analyzeSingleNote, type JournalInsight } from '@/services/journalAnalysis';
import { logger } from '@/utils/logger';
import { getSubscriptionStatus } from '@/services/subscription';
import { PaywallModal } from '@/components/PaywallModal';

interface JournalEntry {
  id?: string; // ID Supabase (optionnel pour compatibilité)
  text: string;
  createdAt: string;
}

/**
 * Page Journal
 * 
 * Permet à l'utilisateur de :
 * - Ajouter des notes de journal
 * - Voir l'historique des notes
 * - Voir une analyse IA (placeholder pour l'instant)
 */
export function Journal() {
  const { user, addJournalEntry, removeJournalEntry } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const { isTablet, adaptiveValue } = useResponsive();
  
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<AudioRecorder | null>(null);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  
  // Analyse IA
  const [journalInsight, setJournalInsight] = useState<JournalInsight | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [selectedNoteAnalysis, setSelectedNoteAnalysis] = useState<{
    noteId: string;
    analysis: Awaited<ReturnType<typeof analyzeSingleNote>>;
  } | null>(null);
  const [analyzingNote, setAnalyzingNote] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Track page view
  useEffect(() => {
    trackPageView('Journal');
  }, []);

  // Charger les entrées depuis le stockage local
  useEffect(() => {
    const loadEntries = async () => {
      try {
        // Charger les notes depuis le service de stockage dédié (avec synchronisation Supabase)
        const localStorageEntries = await loadJournalNotes(user?.id, true);
        
        // Convertir les notes en format JournalEntry
        const journalEntries: JournalEntry[] = localStorageEntries.map(note => ({
          id: note.id,
          text: note.text,
          createdAt: note.createdAt,
        }));
        
        // Trier par date (plus récent en premier) et limiter à 500
        journalEntries.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setEntries(journalEntries.slice(0, 500));
      } catch (e) {
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEntries();
  }, [user?.id]);

  // Générer l'analyse du journal
  const handleAnalyzeJournal = async () => {
    if (!user?.id || analyzing) return;

    // ✅ Premium gating: require active subscription
    try {
      const subscriptionStatus = await getSubscriptionStatus();
      if (!subscriptionStatus.isActive) {
        setShowPaywall(true);
        return;
      }
    } catch (e) {
      // Si on ne peut pas vérifier, on bloque par défaut (évite fuite premium)
      setShowPaywall(true);
      return;
    }

    setAnalyzing(true);
    try {
      const insight = await analyzeJournal(user.id, timeRange);
      setJournalInsight(insight);
      trackEvent('journal_analysis_generated', { timeRange });
    } catch (error) {
      logger.error('[Journal] Erreur analyse:', error);
      Alert.alert(t('common.error'), t('journal.error.analysisFailed'));
    } finally {
      setAnalyzing(false);
    }
  };

  // Analyser une note spécifique
  const handleAnalyzeNote = async (noteText: string, noteId: string) => {
    if (!user?.id || analyzingNote === noteId) return;

    // ✅ Premium gating: require active subscription (same behavior as global journal analysis)
    try {
      const subscriptionStatus = await getSubscriptionStatus();
      if (!subscriptionStatus.isActive) {
        setShowPaywall(true);
        return;
      }
    } catch (e) {
      // Si on ne peut pas vérifier, on bloque par défaut (évite fuite premium)
      setShowPaywall(true);
      return;
    }
    
    setAnalyzingNote(noteId);
    try {
      const analysis = await analyzeSingleNote(noteText, user.id);
      setSelectedNoteAnalysis({ noteId, analysis });
      trackEvent('journal_note_analyzed', { noteLength: noteText.length });
    } catch (error) {
      logger.error('[Journal] Erreur analyse note:', error);
      Alert.alert(t('common.error'), t('journal.error.noteAnalysisFailed'));
    } finally {
      setAnalyzingNote(null);
    }
  };

  // ❌ Analyse automatique supprimée (uniquement sur action utilisateur)

  const handleAddNote = async () => {
    if (!note.trim()) return;
    
    try {
      const newEntry: JournalEntry = {
        text: note,
        createdAt: new Date().toISOString()
      };
      
      const next = [newEntry, ...entries].slice(0, 500);
      setEntries(next);
      
      // Sauvegarder dans le stockage local et Supabase via le service dédié
      try {
        // Sauvegarder la nouvelle note avec synchronisation Supabase
        const { saveJournalNote } = await import('@/services/notesStorage');
        await saveJournalNote(newEntry, user?.id);
        
        // Recharger les notes pour obtenir l'ID Supabase
        const updatedNotes = await loadJournalNotes(user?.id, true);
        const updatedEntries = updatedNotes.map(n => ({
          id: n.id,
          text: n.text,
          createdAt: n.createdAt,
        }));
        
        // Trier par date (plus récent en premier) et limiter à 500
        updatedEntries.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setEntries(updatedEntries.slice(0, 500));
      } catch (e) {
        // Erreur silencieuse en production
        logger.error('[Journal] Erreur sauvegarde note:', e);
      }
      
      
      // TODO: Envoyer à l'IA pour analyse
      // sendToAyna([{ role: 'user', content: `Analyse cette note de journal en français: ${note}` }]).catch(() => null);
      
      setNote('');
      trackEvent('journal_entry_created', { hasText: !!note, length: note.length });
    } catch (e) {
      // Erreur silencieuse en production
      trackEvent('journal_entry_failed', { error: 'save_error' });
    }
  };

  // Demander les permissions audio au montage
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await requestRecordingPermissionsAsync();
      } catch (error) {
        // Erreur silencieuse en production
      }
    };
    requestPermissions();
  }, []);

  const toggleVoiceRecording = async () => {
    try {
      if (!recording) {
        // Démarrer l'enregistrement
        try {
          const { granted } = await requestRecordingPermissionsAsync();
          if (!granted) {
            Alert.alert(t('common.error'), t('common.recordingPermissionDenied'));
            return;
          }

          const recorder = new AudioModule.AudioRecorder({
            bitRate: 128000,
            sampleRate: 44100,
            numberOfChannels: 2,
            android: {
              extension: '.m4a',
              outputFormat: 2, // MPEG_4
              audioEncoder: 3, // AAC
            },
            ios: {
              extension: '.m4a',
              outputFormat: 'mpeg4',
              audioQuality: 127, // High
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
          });

          await recorder.record();
          recordingRef.current = recorder;
          setRecording(true);
        } catch (error: any) {
          Alert.alert(t('common.error'), t('journal.error.startRecordingFailed', { message: error.message }));
          trackEvent('journal_recording_failed', { error: error.message });
        }
      } else {
        // Arrêter l'enregistrement et transcrire
        if (recordingRef.current) {
          setRecording(false);
          setIsTranscribing(true);
          
          try {
            await recordingRef.current.stop();
            const uri = recordingRef.current.uri;
            
            if (uri) {
              // Transcrire l'audio
              try {
                const transcribedText = await sttTranscribe(uri);
                setNote(prev => (prev ? prev + '\n' + transcribedText : transcribedText));
                trackEvent('journal_voice_transcribed', { length: transcribedText.length });
                
                // Supprimer le fichier temporaire
                await FileSystem.deleteAsync(uri, { idempotent: true });
              } catch (transcribeError: any) {
                Alert.alert(
                  t('journal.error.transcriptionError'),
                  transcribeError.message || t('journal.error.transcriptionFailed')
                );
                trackEvent('journal_transcription_failed', { error: transcribeError.message });
              }
            }
          } catch (error: any) {
            Alert.alert(t('common.error'), t('journal.error.stopRecordingFailed'));
            trackEvent('journal_recording_stop_failed', { error: error.message });
          } finally {
            recordingRef.current = null;
            setIsTranscribing(false);
          }
        }
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('journal.error.recordingFailed'));
      trackEvent('journal_recording_error', { error: error.message });
      setRecording(false);
      setIsTranscribing(false);
    }
  };

  // ✅ OPTIMISÉ : Mémoriser formatDate
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const locale = i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'en' ? 'en-US' : 'fr-FR';
    
    // Format relatif pour les dates récentes
    if (diffDays === 0) {
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('common.yesterdayAt', { time: date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) });
    } else if (diffDays < 7) {
      return t('common.daysAgo', { count: diffDays });
    } else {
      // Format court pour les dates plus anciennes
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }, [t]);

  // ✅ OPTIMISÉ : renderEntry mémorisé
  const renderEntry = useCallback(({ item, index }: { item: JournalEntry; index: number }) => {
    const itemKey = `${item.createdAt}-${index}`;
    
    const handleDelete = async () => {
      try {
        // Fermer le swipeable avant de supprimer
        const swipeableRef = swipeableRefs.current.get(itemKey);
        swipeableRef?.close();
        
        const entryToDelete = item;
        
        // Vérifier si cette note vient du challenge (format: [Jour X - Journal du cœur]\n...)
        const isChallengeEntry = entryToDelete.text.startsWith('[') && entryToDelete.text.includes(' - ') && entryToDelete.text.includes(']\n');
        
        if (isChallengeEntry) {
          // Extraire le jour et l'entrée du texte formaté
          // Format: [Jour X - Journal du cœur]\n{entryText}
          const headerEndIndex = entryToDelete.text.indexOf(']\n');
          if (headerEndIndex > 0) {
            const header = entryToDelete.text.substring(0, headerEndIndex + 2);
            const entryText = entryToDelete.text.substring(headerEndIndex + 2);
            
          }
        }
        
        // Si ce n'est pas une entrée du challenge, supprimer aussi dans Supabase
        if (!isChallengeEntry && entryToDelete.id && user?.id) {
          await deleteJournalNote(entryToDelete.id, user.id);
        }
        
        // Utiliser l'index pour une suppression plus fiable
        const updatedEntries = entries.filter((_, i) => i !== index);
        setEntries(updatedEntries);
        
        // Nettoyer la ref
        swipeableRefs.current.delete(itemKey);
        
        // Sauvegarder les notes mises à jour (seulement les notes locales, pas celles du challenge)
        const localEntries = updatedEntries.filter(e => {
          // Exclure les entrées du challenge
          return !(e.text.startsWith('[') && e.text.includes(' - ') && e.text.includes(']\n'));
        });
        
        await saveJournalNotes(localEntries.map(e => ({
          id: e.id,
          text: e.text,
          createdAt: e.createdAt,
        })), user?.id);
        
        trackEvent('journal_entry_deleted');
      } catch (error) {
        logger.error('Erreur lors de la suppression:', error);
        Alert.alert(t('common.error'), t('journal.error.deleteFailed'));
      }
    };

    const renderRightActions = () => (
      <View style={styles.swipeDeleteContainer}>
        <Button
          onPress={handleDelete}
          variant="destructive"
          size="sm"
          style={styles.swipeDeleteButton}
        >
          Supprimer
        </Button>
      </View>
    );

    return (
      <AnimatedListItem index={index} useSpring={true}>
        <Swipeable
          key={itemKey} 
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current.set(itemKey, ref);
            } else {
              swipeableRefs.current.delete(itemKey);
            }
          }}
          renderRightActions={renderRightActions}
        >
          <Animated.View
            style={[styles.entryCard, { backgroundColor: theme.colors.backgroundSecondary }]}
            layout={Layout.springify()}
          >
          <View style={styles.entryHeader}>
            <Text style={[styles.entryDate, { color: theme.colors.textSecondary }]}>
              {formatDate(item.createdAt)}
            </Text>
            <Pressable
              onPress={() => handleAnalyzeNote(item.text, itemKey)}
              disabled={analyzingNote === itemKey}
              style={[
                styles.analyzeNoteButton,
                {
                  backgroundColor: analyzingNote === itemKey
                    ? theme.colors.accent + '40'
                    : theme.colors.accent + '20',
                },
              ]}
            >
              {analyzingNote === itemKey ? (
                <ActivityIndicator size="small" color={theme.colors.accent} />
              ) : (
                <Brain size={16} color={theme.colors.accent} />
              )}
            </Pressable>
          </View>
          <Text style={[styles.entryText, { color: theme.colors.text }]}>
            {item.text}
          </Text>

          {/* Analyse de la note sélectionnée */}
          {selectedNoteAnalysis?.noteId === itemKey && (
            <View style={[styles.noteAnalysis, { borderColor: theme.colors.accent + '40' }]}>
              <View style={styles.noteAnalysisHeader}>
                <Brain size={16} color={theme.colors.accent} />
                <Text style={[styles.noteAnalysisTitle, { color: theme.colors.accent }]}>
                  {t('journal.noteAnalysis')}
                </Text>
              </View>
              
              {selectedNoteAnalysis.analysis.emotions.length > 0 && (
                <View style={styles.noteEmotions}>
                  <Text style={[styles.noteAnalysisLabel, { color: theme.colors.textSecondary }]}>
                    {t('journal.emotions')}:
                  </Text>
                  <View style={styles.noteEmotionBadges}>
                    {selectedNoteAnalysis.analysis.emotions.map((emotion, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.noteEmotionBadge,
                          {
                            backgroundColor: theme.colors.accent + '20',
                            borderColor: theme.colors.accent + '60',
                          },
                        ]}
                      >
                        <Text style={[styles.noteEmotionBadgeText, { color: theme.colors.accent }]}>
                          {emotion}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {selectedNoteAnalysis.analysis.insight && (
                <View style={styles.noteInsight}>
                  <Text style={[styles.noteAnalysisLabel, { color: theme.colors.textSecondary }]}>
                    {t('journal.insight') || 'Perspective'}:
                  </Text>
                  <Text style={[styles.noteInsightText, { color: theme.colors.textSecondary }]}>
                    {selectedNoteAnalysis.analysis.insight}
                  </Text>
                </View>
              )}
            </View>
          )}
          </Animated.View>
        </Swipeable>
      </AnimatedListItem>
    );
  }, [entries, formatDate, theme, t, analyzingNote, selectedNoteAnalysis, handleAnalyzeNote, removeJournalEntry, user, deleteJournalNote, saveJournalNotes]);

  // ✅ OPTIMISÉ : keyExtractor
  const keyExtractor = useCallback((item: JournalEntry, index: number) => `${item.createdAt}-${index}`, []);

  // ✅ OPTIMISÉ : getItemLayout
  const getItemLayout = useCallback((data: ArrayLike<JournalEntry> | null | undefined, index: number) => ({
    length: 150, // Hauteur approximative d'une entrée
    offset: 150 * index,
    index,
  }), []);

  // ✅ OPTIMISÉ : ListHeaderComponent mémorisé
  const ListHeaderComponent = useMemo(() => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('journal.title')}
        </Text>
      </View>

      {/* Note Editor */}
      <GlassCard 
        intensity={adaptiveValue(15, 20, 25, 30)}
        blurType="dark"
        style={styles.card}
      >
        <TextInput
          style={[styles.textInput, { color: theme.colors.text }]}
          placeholder={t('journal.inputPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        
        <View style={styles.buttonRow}>
          <Button
            onPress={handleAddNote}
            variant="default"
            icon={Plus}
            iconPosition="left"
            style={styles.addButton}
            accessibilityLabel={t('journal.addNote')}
            accessibilityHint="Double-tap pour ajouter une nouvelle note au journal"
          >
            {t('journal.addNote')}
          </Button>
          
          <Pressable
            onPress={toggleVoiceRecording}
            disabled={isTranscribing}
            style={({ pressed }) => [
              styles.voiceButton,
              { 
                backgroundColor: recording 
                  ? '#EF4444' 
                  : isTranscribing 
                  ? theme.colors.accent 
                  : 'rgba(255, 255, 255, 0.1)' 
              },
              (pressed || isTranscribing) && styles.buttonPressed
            ]}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color={theme.colors.background} />
            ) : (
              <Mic size={20} color={recording ? 'white' : theme.colors.text} />
            )}
          </Pressable>
        </View>
      </GlassCard>

      {/* AI Analysis */}
      <GlassCard 
        intensity={adaptiveValue(15, 20, 25, 30)}
        blurType="dark"
        style={styles.card}
      >
        <View style={styles.aiHeader}>
          <Brain size={24} color={theme.colors.accent} />
          <Text style={[styles.aiTitle, { color: theme.colors.accent }]}>
            {t('journal.aiAnalysis')}
          </Text>
        </View>

        {/* Sélecteur de période */}
        <View style={styles.timeRangeSelector}>
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <Pressable
              key={range}
              onPress={() => {
                setTimeRange(range);
                setJournalInsight(null);
              }}
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
                {range === 'week' ? t('journal.week') :
                 range === 'month' ? t('journal.month') :
                 range === 'year' ? t('journal.year') :
                 t('journal.all')}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          onPress={handleAnalyzeJournal}
          loading={analyzing}
          disabled={analyzing || entries.length === 0}
          icon={Sparkles}
          iconPosition="left"
          style={styles.analyzeButton}
        >
          {analyzing 
            ? t('journal.analyzing')
            : t('journal.generateAnalysis')}
        </Button>

        {journalInsight && (
          <View style={styles.insightContainer}>
            {/* Résumé */}
            <Text style={[styles.insightSectionTitle, { color: theme.colors.text }]}>
              {t('journal.summary')}
            </Text>
            <Text style={[styles.insightText, { color: theme.colors.textSecondary }]}>
              {journalInsight.summary}
            </Text>

            {/* Émotions */}
            {journalInsight.emotions && (
              <>
                <View style={styles.emotionHeader}>
                  <Heart size={20} color={theme.colors.accent} />
                  <Text style={[styles.insightSectionTitle, { color: theme.colors.text, marginLeft: 8 }]}>
                    {t('journal.emotions')}
                  </Text>
                </View>
                <View style={styles.emotionBadges}>
                  <View style={[
                    styles.emotionBadge,
                    {
                      backgroundColor: journalInsight.emotions.sentiment === 'positive' 
                        ? '#10B981' + '33'
                        : journalInsight.emotions.sentiment === 'negative'
                        ? '#EF4444' + '33'
                        : theme.colors.textSecondary + '33',
                      borderColor: journalInsight.emotions.sentiment === 'positive' 
                        ? '#10B981'
                        : journalInsight.emotions.sentiment === 'negative'
                        ? '#EF4444'
                        : theme.colors.textSecondary,
                    },
                  ]}>
                    <Text style={[
                      styles.emotionBadgeText,
                      {
                        color: journalInsight.emotions.sentiment === 'positive' 
                          ? '#10B981'
                          : journalInsight.emotions.sentiment === 'negative'
                          ? '#EF4444'
                          : theme.colors.textSecondary,
                      },
                    ]}>
                      {journalInsight.emotions.sentiment === 'positive' 
                        ? t('journal.positive')
                        : journalInsight.emotions.sentiment === 'negative'
                        ? t('journal.negative')
                        : t('journal.neutral')}
                    </Text>
                  </View>
                  {journalInsight.emotions.topEmotions?.map((emotion, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.emotionBadge,
                        {
                          backgroundColor: theme.colors.accent + '20',
                          borderColor: theme.colors.accent + '60',
                        },
                      ]}
                    >
                      <Text style={[styles.emotionBadgeText, { color: theme.colors.accent }]}>
                        {emotion}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Tendances */}
            {journalInsight.trends && journalInsight.trends.length > 0 && (
              <>
                <View style={styles.emotionHeader}>
                  <TrendingUp size={20} color={theme.colors.accent} />
                  <Text style={[styles.insightSectionTitle, { color: theme.colors.text, marginLeft: 8 }]}>
                    {t('journal.trends')}
                  </Text>
                </View>
                {journalInsight.trends.map((trend, idx) => (
                  <View key={idx} style={styles.trendItem}>
                    <Text style={[styles.trendText, { color: theme.colors.textSecondary }]}>
                      {trend}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </GlassCard>

      {/* Section Title */}
      {entries.length > 0 && (
        <View style={styles.entriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('journal.myNotes')}
          </Text>
        </View>
      )}
    </>
  ), [theme, t, note, setNote, handleAddNote, toggleVoiceRecording, recording, isTranscribing, timeRange, setTimeRange, handleAnalyzeJournal, analyzing, entries.length, journalInsight, adaptiveValue]);

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
        {isLoading ? (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.loadingContainer}>
              <SkeletonText lines={3} width="100%" />
              <View style={{ marginTop: 16 }}>
                <SkeletonText lines={2} width="80%" />
              </View>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={entries}
            renderItem={renderEntry}
            keyExtractor={keyExtractor}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={
              <EmptyState
                icon={BookOpen}
                title={t('journal.noEntries')}
                description={t('journal.noEntriesDescription')}
              />
            }
            contentContainerStyle={styles.scrollContent}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            updateCellsBatchingPeriod={50}
            getItemLayout={getItemLayout}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Paywall - analyse du journal (premium) */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        resetAt={null}
        messagesUsed={0}
        mode="subscription"
      />
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
    paddingBottom: 120, // Espace pour la navbar du bas
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'System',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textInput: {
    minHeight: 120,
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    flex: 1,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
  },
  aiContent: {
    gap: 8,
  },
  aiSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  aiText: {
    fontSize: 14,
    fontFamily: 'System',
    lineHeight: 20,
  },
  entriesSection: {
    marginTop: 8,
  },
  entriesList: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 16,
  },
  swipeDeleteContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    width: 120,
    // Permettre au glow de s'afficher
    overflow: 'visible',
  },
  swipeDeleteButton: {
    minWidth: 100,
    height: '100%',
    // S'assurer que le shadow n'est pas coupé
    marginVertical: 4,
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  entryDate: {
    fontSize: 12,
    fontFamily: 'System',
    marginBottom: 8,
    flexShrink: 1, // Permet au texte de rétrécir si nécessaire
  },
  entryText: {
    fontSize: 14,
    fontFamily: 'System',
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
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
    fontFamily: 'System',
  },
  analyzeButton: {
    marginBottom: 16,
  },
  insightContainer: {
    marginTop: 16,
  },
  insightSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'System',
    lineHeight: 20,
    marginBottom: 12,
  },
  insightItem: {
    fontSize: 14,
    fontFamily: 'System',
    lineHeight: 20,
    marginTop: 4,
  },
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  emotionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  emotionBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  emotionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyzeNoteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteAnalysis: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  noteAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteAnalysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginLeft: 6,
  },
  noteAnalysisLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 6,
  },
  noteEmotions: {
    marginBottom: 12,
  },
  noteEmotionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  noteEmotionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteEmotionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'System',
  },
  noteThemes: {
    marginBottom: 12,
  },
  noteThemeItem: {
    fontSize: 12,
    fontFamily: 'System',
    lineHeight: 18,
    marginTop: 4,
  },
  noteInsight: {
    marginTop: 12,
  },
  noteInsightText: {
    fontSize: 13,
    fontFamily: 'System',
    lineHeight: 18,
    marginTop: 4,
  },
});

