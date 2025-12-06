import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { BookHeart, Mic } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { sttTranscribe } from '@/services/voice';
import * as FileSystem from 'expo-file-system';
import { requestRecordingPermissionsAsync, AudioModule } from 'expo-audio';
import type { AudioRecorder } from 'expo-audio';
import { saveChallengeJournalEntry, getChallengeJournalEntry, type ChallengeJournalEntry } from '@/services/notesStorage';

interface JournalEntryProps {
  day: number;
  onEntryChange?: (hasEntry: boolean, text?: string) => void;
}

const prompts = [
  'Comment vous sentez-vous après cette journée ?',
  "Quelle transformation avez-vous ressentie aujourd'hui ?",
  "Qu'avez-vous appris de ce verset ?",
  'Comment votre cœur a-t-il réagi au dhikr ?',
  'Quelle intention portez-vous pour demain ?'
];

export function JournalEntry({
  day,
  onEntryChange
}: JournalEntryProps) {
  const { user, addJournalEntry } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [entry, setEntry] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<AudioRecorder | null>(null);
  const prompt = prompts[day % prompts.length];

  // Animation pour le bouton d'enregistrement
  const pulse = useSharedValue(1);
  
  useEffect(() => {
    if (isRecording) {
      pulse.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Charger l'entrée existante pour ce jour au montage
  useEffect(() => {
    const loadEntry = async () => {
      try {
        const savedEntry = await getChallengeJournalEntry(day);
        if (savedEntry) {
          setEntry(savedEntry.entry);
        } else {
          setEntry('');
        }
      } catch (e) {
        console.warn('Failed to load journal entry', e);
        setEntry('');
      }
    };
    
    loadEntry();
  }, [day]);

  // Sauvegarder dans le stockage local avec debounce
  useEffect(() => {
    if (entry.trim().length === 0) {
      // Si l'entrée est vide, supprimer l'entrée sauvegardée pour ce jour
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      try {
        const journalEntry: ChallengeJournalEntry = {
          day,
          entry: entry.trim(),
          createdAt: new Date().toISOString()
        };
        
        // Sauvegarder dans le stockage local
        await saveChallengeJournalEntry(journalEntry);
        
        // Sauvegarder aussi dans le UserContext pour synchronisation
        try {
          addJournalEntry(day, entry.trim());
        } catch (e) {
          // Ignorer si le contexte utilisateur n'est pas disponible
          console.warn('Failed to save journal entry to UserContext', e);
        }
      } catch (e) {
        console.warn('Failed to save journal entry locally', e);
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [entry, day]);

  // Notifier le parent quand une entrée est présente
  useEffect(() => {
    if (onEntryChange) {
      onEntryChange(entry.trim().length > 0, entry);
    }
  }, [entry, onEntryChange]);

  async function toggleRecording() {
    if (!isRecording) {
      try {
        // Demander la permission d'enregistrer
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          alert('Permission d\'enregistrement refusée');
          return;
        }

        // Créer un nouvel enregistrement
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
        setIsRecording(true);
      } catch (error) {
        console.error('Erreur lors du démarrage de l\'enregistrement:', error);
        alert('Erreur lors du démarrage de l\'enregistrement');
      }
    } else {
      try {
        if (recordingRef.current) {
          await recordingRef.current.stop();
          const uri = recordingRef.current.uri;
          if (uri) {
            try {
              const text = await sttTranscribe(uri);
              setEntry(prev => (prev ? prev + '\n' + text : text));
            } catch (error) {
              console.error('Erreur lors de la transcription:', error);
              alert('Erreur lors de la transcription audio');
            }
          }
          recordingRef.current = null;
          setIsRecording(false);
        }
      } catch (error) {
        console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
        alert('Erreur lors de l\'arrêt de l\'enregistrement');
      }
    }
  }

  return (
    <Animated.View entering={FadeInDown.delay(500).duration(500)} style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.header}>
        <BookHeart size={24} color="#FFD369" />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Journal du cœur
        </Text>
      </View>
      <Text style={[styles.prompt, { color: '#FFD369' }]}>
        {prompt}
      </Text>
      <TextInput
        value={entry}
        onChangeText={setEntry}
        placeholder="Écrivez vos réflexions..."
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        style={[styles.textInput, {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: theme.colors.text,
          borderColor: theme.colors.accent,
        }]}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />
      <Animated.View style={animatedButtonStyle}>
        <Pressable
          onPress={toggleRecording}
          style={({ pressed }) => [
            styles.recordButton,
            {
              backgroundColor: isRecording ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Mic size={20} color="#FFFFFF" />
          <Text style={styles.recordButtonText}>
            {isRecording ? "Arrêter l'enregistrement" : 'Enregistrer vocalement'}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  prompt: {
    fontSize: 14,
    marginBottom: 16,
    fontFamily: 'Poppins',
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: 'Poppins',
    minHeight: 120,
    borderWidth: 2,
    marginBottom: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  recordButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});

