import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Mic, TrendingUp } from 'lucide-react-native';
import { storage } from '@/utils/storage';
import { loadJournalNotes, saveJournalNotes, type JournalNote } from '@/services/notesStorage';
import { requestRecordingPermissionsAsync, AudioModule } from 'expo-audio';
import type { AudioRecorder } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { sttTranscribe } from '@/services/voice';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics';
import i18n from '@/i18n';

interface JournalEntry {
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
  const { user, addJournalEntry } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<AudioRecorder | null>(null);

  // Track page view
  useEffect(() => {
    trackPageView('Journal');
  }, []);

  // Charger les entrées depuis le stockage local
  useEffect(() => {
    const loadEntries = async () => {
      try {
        // Charger les notes depuis le service de stockage dédié
        const localStorageEntries = await loadJournalNotes();
        
        // Charger aussi les entrées du challenge depuis user.challenge40Days.journalEntries
        const challengeEntries = user?.challenge40Days?.journalEntries || [];
        
        // Fusionner les deux sources en évitant les doublons
        const mergedEntries: JournalEntry[] = [...localStorageEntries];
        
        challengeEntries.forEach((challengeEntry: { day: number; entry: string; createdAt?: string }) => {
          const entryText = `[${i18n.t('journal.challengeDay', { day: challengeEntry.day })} - ${i18n.t('journal.heartJournal')}]\n${challengeEntry.entry}`;
          const entryDate = challengeEntry.createdAt || new Date().toISOString();
          
          const exists = mergedEntries.some((e) => {
            const eDate = new Date(e.createdAt).toISOString().split('T')[0];
            const cDate = new Date(entryDate).toISOString().split('T')[0];
            return eDate === cDate && e.text === entryText;
          });
          
          if (!exists) {
            mergedEntries.push({
              text: entryText,
              createdAt: entryDate
            });
          }
        });
        
        // Trier par date (plus récent en premier) et limiter à 500
        mergedEntries.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setEntries(mergedEntries.slice(0, 500));
      } catch (e) {
        console.error('Error loading journal entries', e);
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEntries();
  }, [user?.challenge40Days?.journalEntries]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    
    try {
      const newEntry: JournalEntry = {
        text: note,
        createdAt: new Date().toISOString()
      };
      
      const next = [newEntry, ...entries].slice(0, 500);
      setEntries(next);
      
      // Sauvegarder dans le stockage local via le service dédié
      try {
        await saveJournalNotes(next);
      } catch (e) {
        console.warn('Failed to save journal locally', e);
        // Fallback: sauvegarder directement dans AsyncStorage
        try {
          await storage.setItem('ayna_journal', JSON.stringify(next));
        } catch (fallbackError) {
          console.error('Fallback save also failed', fallbackError);
        }
      }
      
      // Sauvegarder dans le profil utilisateur si disponible
      try {
        const day = user?.challenge40Days?.currentDay || 0;
        addJournalEntry(day || 0, note);
      } catch (e) {
        // ignore if no user context
      }
      
      // TODO: Envoyer à l'IA pour analyse
      // sendToAyna([{ role: 'user', content: `Analyse cette note de journal en français: ${note}` }]).catch(() => null);
      
      setNote('');
      trackEvent('journal_entry_created', { hasText: !!note, length: note.length });
    } catch (e) {
      console.error('Error adding note', e);
      trackEvent('journal_entry_failed', { error: 'save_error' });
    }
  };

  // Demander les permissions audio au montage
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await requestRecordingPermissionsAsync();
      } catch (error) {
        console.warn('Erreur lors de la demande de permissions audio:', error);
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
            Alert.alert(t('common.error'), 'Permission d\'enregistrement refusée');
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
                console.error('Erreur de transcription:', transcribeError);
                Alert.alert(
                  t('journal.error.transcriptionError'),
                  transcribeError.message || t('journal.error.transcriptionFailed')
                );
                trackEvent('journal_transcription_failed', { error: transcribeError.message });
              }
            }
          } catch (error: any) {
            console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
            Alert.alert(t('common.error'), t('journal.error.stopRecordingFailed'));
            trackEvent('journal_recording_stop_failed', { error: error.message });
          } finally {
            recordingRef.current = null;
            setIsTranscribing(false);
          }
        }
      }
    } catch (error: any) {
      console.error('Erreur enregistrement vocal:', error);
      Alert.alert(t('common.error'), error.message || t('journal.error.recordingFailed'));
      trackEvent('journal_recording_error', { error: error.message });
      setRecording(false);
      setIsTranscribing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('journal.title')}
          </Text>
        </View>

        {/* Note Editor */}
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
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
            <Pressable
              onPress={handleAddNote}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: theme.colors.accent },
                pressed && styles.buttonPressed
              ]}
            >
              <Plus size={20} color={theme.colors.background} />
              <Text style={[styles.addButtonText, { color: theme.colors.background }]}>
                {t('journal.addNote')}
              </Text>
            </Pressable>
            
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
        </View>

        {/* AI Summary */}
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.aiHeader}>
            <TrendingUp size={24} color={theme.colors.accent} />
            <Text style={[styles.aiTitle, { color: theme.colors.accent }]}>
              {t('journal.aiAnalysis')}
            </Text>
          </View>
          
          <View style={styles.aiContent}>
            <Text style={[styles.aiSubtitle, { color: theme.colors.text }]}>
              {t('journal.feelings')}
            </Text>
            <Text style={[styles.aiText, { color: theme.colors.textSecondary }]}>
              Vous montrez une progression positive dans votre cheminement spirituel.
            </Text>
            
            <Text style={[styles.aiSubtitle, { color: theme.colors.text, marginTop: 16 }]}>
              {t('journal.efforts')}
            </Text>
            <Text style={[styles.aiText, { color: theme.colors.textSecondary }]}>
              Continuez sur cette voie, votre engagement est remarquable.
            </Text>
          </View>
        </View>

        {/* Entries List */}
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.accent} />
        ) : entries.length > 0 ? (
          <View style={styles.entriesSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('journal.myNotes')}
            </Text>
            {entries.map((entry, index) => (
              <View 
                key={index} 
                style={[styles.entryCard, { backgroundColor: theme.colors.backgroundSecondary }]}
              >
                <Text style={[styles.entryDate, { color: theme.colors.textSecondary }]}>
                  {formatDate(entry.createdAt)}
                </Text>
                <Text style={[styles.entryText, { color: theme.colors.text }]}>
                  {entry.text}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('journal.noEntries')}
            </Text>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 16,
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
  },
  entryText: {
    fontSize: 14,
    fontFamily: 'System',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'System',
  },
});

