import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, MessageCircle, Plus, Mic, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { sendToAyna, type ChatMessage } from '@/services/ayna';
import { storage } from '@/utils/storage';
import { requestRecordingPermissionsAsync, AudioModule } from 'expo-audio';
import type { AudioRecorder } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { sttTranscribe } from '@/services/voice';
import { speak, stopSpeaking, isSpeaking } from '@/services/speech';
import { trackPageView, trackEvent } from '@/services/analytics';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ayna';
  timestamp: Date;
}

/**
 * Page Chat/AYNA
 * 
 * Permet à l'utilisateur de :
 * - Discuter avec AYNA (assistant IA)
 * - Voir l'historique des conversations
 * - Créer de nouvelles conversations
 */
export function Chat() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chat.welcomeMessage'),
      sender: 'ayna',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingRef = useRef<AudioRecorder | null>(null);

  // Charger l'historique depuis AsyncStorage et tracker la page
  useEffect(() => {
    trackPageView('Chat');
    const loadHistory = async () => {
      try {
        const saved = await storage.getItem('ayna_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })));
          }
        }
      } catch (error) {
        console.warn('Erreur lors du chargement de l\'historique:', error);
      }
    };
    loadHistory();
  }, []);

  // Sauvegarder l'historique
  useEffect(() => {
    const saveHistory = async () => {
      try {
        await storage.setItem('ayna_chat_history', JSON.stringify(messages));
      } catch (error) {
        console.warn('Erreur lors de la sauvegarde de l\'historique:', error);
      }
    };
    if (messages.length > 1) {
      saveHistory();
    }
  }, [messages]);

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

  // Scroller vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Construire l'historique pour AYNA
      const history: ChatMessage[] = [...messages, userMessage].map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      // Envoyer à AYNA
      const response = await sendToAyna(history);

      const aynaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.content || 'Désolé, je n\'ai pas pu générer de réponse.',
        sender: 'ayna',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aynaMessage]);
      
      // Lire la réponse avec TTS
      if (response.content) {
        try {
          await speak(response.content);
        } catch (error) {
          console.warn('Erreur lors de la lecture vocale:', error);
        }
      }
      
      // Tracker l'événement
      trackEvent('chat_message_sent', {
        message_length: inputText.trim().length,
        response_length: response.content?.length || 0,
      });
    } catch (error: any) {
      console.error('Erreur AYNA:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error.message || t('chat.error.serviceUnavailable'),
        sender: 'ayna',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    // Arrêter la lecture vocale si en cours
    if (isSpeaking()) {
      stopSpeaking();
    }
    
    setMessages([
      {
        id: '1',
        text: t('chat.welcomeMessage'),
        sender: 'ayna',
        timestamp: new Date(),
      },
    ]);
    
    trackEvent('chat_new_conversation');
  };

  const toggleVoiceRecording = async () => {
    try {
      if (!recording) {
        // Démarrer l'enregistrement
        try {
          const { granted } = await requestRecordingPermissionsAsync();
          if (!granted) {
            Alert.alert('Erreur', 'Permission d\'enregistrement refusée');
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
          Alert.alert('Erreur', `Impossible de démarrer l'enregistrement: ${error.message}`);
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
                setInputText(prev => (prev ? prev + ' ' + transcribedText : transcribedText));
                
                // Supprimer le fichier temporaire
                await FileSystem.deleteAsync(uri, { idempotent: true });
              } catch (transcribeError: any) {
                console.error('Erreur de transcription:', transcribeError);
                Alert.alert(
                  t('chat.error.transcriptionError'),
                  transcribeError.message || t('chat.error.transcriptionFailed')
                );
              }
            }
          } catch (error: any) {
            console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
            Alert.alert(t('common.error'), t('chat.error.stopRecordingFailed'));
          } finally {
            recordingRef.current = null;
            setIsTranscribing(false);
          }
        }
      }
    } catch (error: any) {
      console.error('Erreur enregistrement vocal:', error);
      Alert.alert(t('common.error'), error.message || t('chat.error.recordingFailed'));
      setRecording(false);
      setIsTranscribing(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
        <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Pressable
            onPress={() => navigation.navigate('Main' as never)}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.headerButtonPressed,
            ]}
          >
            <ArrowLeft size={20} color={theme.colors.text} />
            <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
              {t('common.back')}
            </Text>
          </Pressable>
          <View style={styles.headerContent}>
            <MessageCircle size={24} color={theme.colors.accent} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t('chat.title')}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleNewChat}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <Plus size={20} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'user' ? styles.userMessage : styles.aynaMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.sender === 'user'
                    ? { backgroundColor: theme.colors.accent }
                    : { backgroundColor: theme.colors.backgroundSecondary },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    {
                      color: message.sender === 'user' ? '#0A0F2C' : theme.colors.text,
                    },
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    {
                      color:
                        message.sender === 'user'
                          ? 'rgba(10, 15, 44, 0.6)'
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                {t('chat.thinking')}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Pressable
            onPress={toggleVoiceRecording}
            disabled={isTranscribing || loading}
            style={({ pressed }) => [
              styles.voiceButton,
              {
                backgroundColor: recording
                  ? '#EF4444'
                  : isTranscribing
                  ? theme.colors.accent
                  : 'rgba(255, 255, 255, 0.1)',
              },
              (pressed || isTranscribing || loading) && styles.voiceButtonPressed,
            ]}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color={recording ? 'white' : theme.colors.background} />
            ) : (
              <Mic size={20} color={recording ? 'white' : theme.colors.text} />
            )}
          </Pressable>
          
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={t('chat.inputPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!loading && !isTranscribing}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || loading || isTranscribing}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: inputText.trim() && !loading && !isTranscribing ? theme.colors.accent : 'rgba(255, 255, 255, 0.1)',
              },
              pressed && styles.sendButtonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#0A0F2C" />
            ) : (
              <Send size={20} color={inputText.trim() && !isTranscribing ? '#0A0F2C' : theme.colors.textSecondary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
  },
  headerActions: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aynaMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'System',
    lineHeight: 22,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'System',
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 16,
    fontFamily: 'System',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
