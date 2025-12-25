import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  SlideInRight,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, MessageCircle, Mic, ArrowLeft, Menu, Smile } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { sendToAyna, type ChatMessage } from '@/services/ayna';
import { storage } from '@/utils/storage';
import { requestRecordingPermissionsAsync, AudioModule } from 'expo-audio';
import type { AudioRecorder } from 'expo-audio';
// import * as FileSystem from 'expo-file-system'; // Temporairement désactivé si le package n'est pas installé
import { sttTranscribe } from '@/services/voice';
import { trackPageView, trackEvent } from '@/services/analytics';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { MessageItem } from '@/components/MessageItem';
import { StaggeredMenu, type StaggeredMenuItem } from '@/components/StaggeredMenu';
import { PaywallModal } from '@/components/PaywallModal';
import {
  loadConversations,
  saveConversation,
  deleteConversation,
  loadConversation,
  generateConversationTitle,
  saveCurrentConversationId,
  loadCurrentConversationId,
  type Conversation,
} from '@/services/chatStorage';
import { checkRateLimit } from '@/services/rateLimiting';
import { getSubscriptionStatus } from '@/services/subscription';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ayna';
  timestamp: Date;
}

function TypingDots({ color }: { color: string }) {
  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);
  const d3 = useSharedValue(0);

  useEffect(() => {
    const makeAnim = (sv: { value: number }, delayMs: number) => {
      sv.value = withRepeat(
        withDelay(
          delayMs,
          withSequence(
            withTiming(-4, { duration: 220 }),
            withTiming(0, { duration: 220 })
          )
        ),
        -1,
        false
      );
    };

    makeAnim(d1, 0);
    makeAnim(d2, 140);
    makeAnim(d3, 280);
  }, [d1, d2, d3]);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: d1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: d2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: d3.value }] }));

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, s1]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, s2]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, s3]} />
    </View>
  );
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
  const insets = useSafeAreaInsets();
  
  // Gestion d'erreur pour éviter les erreurs de bundle
  const [hasError, setHasError] = useState(false);

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
  const [showMenu, setShowMenu] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);
  const recordingRef = useRef<AudioRecorder | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [rateLimitData, setRateLimitData] = useState<{ resetAt: Date | null; messagesUsed: number } | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remainingMessages: number; resetAt: Date | null } | null>(null);
  const shouldScrollToEndRef = useRef(true);
  const lastMessageCountRef = useRef(0);
  const inputRef = useRef<TextInput>(null);

  // Track page view once
  useEffect(() => {
    trackPageView('Chat');
  }, []);

  // Charger les conversations par utilisateur (évite fuite entre comptes + boucles iOS)
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const userId = user?.id || undefined;

        // Charger toutes les conversations (scopées userId)
        const loadedConversations = await loadConversations(userId, true);
        if (cancelled) return;
        setConversations(loadedConversations);

        // Charger la conversation actuelle (scopée userId)
        const currentId = await loadCurrentConversationId(userId);
        if (cancelled) return;
        if (currentId) {
          const conversation = await loadConversation(currentId, userId);
          if (cancelled) return;
          if (conversation) {
            setCurrentConversationId(currentId);
            setMessages(conversation.messages.map((m: any) => ({
              id: m.id,
              text: m.text,
              sender: m.sender,
              timestamp: new Date(m.timestamp),
            })));
            return;
          }
        }

        // Legacy migration: uniquement en mode anonyme (pas connecté)
        if (!userId) {
          const saved = await storage.getItem('ayna_chat_history');
          if (cancelled) return;
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })));
            }
          }
        }
      } catch {
        // silent
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Sauvegarder la conversation actuelle (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    if (messages.length > 1) {
      saveTimerRef.current = setTimeout(async () => {
        try {
          const conversationId = currentConversationId || `conv_${Date.now()}`;
          const title = generateConversationTitle(messages.map(m => ({
            id: m.id,
            text: m.text,
            sender: m.sender,
            timestamp: m.timestamp.toISOString(),
          })));
          
          const conversation: Conversation = {
            id: conversationId,
            title,
            messages: messages.map(m => ({
              id: m.id,
              text: m.text,
              sender: m.sender,
              timestamp: m.timestamp.toISOString(),
            })),
            createdAt: currentConversationId 
              ? (await loadConversation(currentConversationId, user?.id))?.createdAt || new Date().toISOString()
              : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          await saveConversation(conversation, user?.id);
          await saveCurrentConversationId(conversationId, user?.id);
          setCurrentConversationId(conversationId);
          
          // Mettre à jour la liste localement (évite reload/merge en boucle sur iOS)
          setConversations(prev => {
            const next = [...prev];
            const idx = next.findIndex(c => c.id === conversation.id);
            if (idx >= 0) next[idx] = conversation;
            else next.unshift(conversation);
            next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            return next;
          });
        } catch (error) {
          // Erreur silencieuse en production
        }
        saveTimerRef.current = null;
      }, 1000);
    }
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [messages, currentConversationId, user?.id]);

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

  // Scroller vers le bas uniquement quand de nouveaux messages sont ajoutés (pas quand l'utilisateur scroll)
  useEffect(() => {
    const currentMessageCount = messages.length;
    const previousMessageCount = lastMessageCountRef.current;
    
    // Seulement scroller si on a ajouté des messages ET si on doit scroller
    if (currentMessageCount > previousMessageCount && shouldScrollToEndRef.current) {
      // Petit délai pour laisser le rendu se terminer
      const timeoutId = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
      
      lastMessageCountRef.current = currentMessageCount;
      
      return () => clearTimeout(timeoutId);
    } else {
      lastMessageCountRef.current = currentMessageCount;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    // S'assurer qu'on scroll vers le bas quand on envoie un message
    shouldScrollToEndRef.current = true;
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setHasError(false);

    try {
      // Construire l'historique pour AYNA
      const history: ChatMessage[] = [...messages, userMessage].map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      // Envoyer à AYNA avec la langue de l'utilisateur
      const userLanguage = i18n.language || 'fr';
      const response = await sendToAyna(history, userLanguage, user?.id);
      
      // Apprendre des préférences de l'utilisateur
      if (user?.id) {
        const { learnFromConversation } = await import('@/services/aiPersonalized');
        learnFromConversation(user.id, inputText, response.content).catch(() => {
          // Erreur silencieuse
        });
      }

      const aynaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.content || 'Désolé, je n\'ai pas pu générer de réponse.',
        sender: 'ayna',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aynaMessage]);
      
      // Tracker l'événement
      trackEvent('chat_message_sent', {
        message_length: inputText.trim().length,
        response_length: response.content?.length || 0,
      });
    } catch (error: any) {
      console.error('[Chat] Error sending message:', error);
      
      // Gérer l'erreur de rate limiting
      if (error.message === 'RATE_LIMIT_EXCEEDED' && error.rateLimitData) {
        // ⚠️ Ne pas activer hasError ici, sinon on affiche l'écran d'erreur et on cache le PaywallModal
        setHasError(false);
        setRateLimitData({
          resetAt: error.rateLimitData.resetAt,
          messagesUsed: error.rateLimitData.messagesUsed,
        });
        setShowPaywall(true);
        // Retirer le message utilisateur qui n'a pas pu être envoyé
        setMessages(prev => prev.slice(0, -1));
        return;
      }
      
      // Pour les autres erreurs, on active l'état d'erreur UI
      setHasError(true);
      
      // Gérer l'erreur de subscription
      let errorText = '';
      
      // Extraire le message d'erreur
      if (error.message) {
        errorText = error.message;
      } else if (error.error) {
        errorText = error.error;
      } else if (typeof error === 'string') {
        errorText = error;
      } else {
        errorText = t('chat.error.serviceUnavailable');
      }
      
      // Messages d'erreur spécifiques
      if (errorText === 'SUBSCRIPTION_REQUIRED') {
        errorText = t('subscription.required') || 'This feature requires an active account.';
      } else if (errorText.includes('Authentication required')) {
        errorText = 'Veuillez vous connecter pour utiliser cette fonctionnalité.';
      } else if (errorText.includes('Configuration serveur manquante')) {
        errorText = 'Erreur de configuration serveur. Veuillez contacter le support.';
      } else if (errorText.includes('Erreur lors de l\'appel à Ollama Cloud')) {
        // Garder le message original qui est déjà informatif
        // Ne rien changer
      } else if (!errorText || errorText === t('chat.error.serviceUnavailable')) {
        // Si le message est vide ou générique, essayer d'obtenir plus d'infos
        console.warn('[Chat] Generic error, checking error object:', error);
        if (error.details) {
          errorText = `Erreur: ${error.details}`;
        } else {
          errorText = t('chat.error.serviceUnavailable');
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'ayna',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Vérifier le rate limit (jamais afficher pour abonnés)
  useEffect(() => {
    const checkRateLimitInfo = async () => {
      try {
        // Vérifier l'abonnement
        const subscriptionStatus = await getSubscriptionStatus();
        if (subscriptionStatus.isActive) {
          // Utilisateur abonné, pas de limite
          setRateLimitInfo(null);
          return;
        }

        // Utilisateur non abonné, vérifier le rate limit
        const limit = await checkRateLimit();
        setRateLimitInfo({
          remainingMessages: limit.remainingMessages,
          resetAt: limit.resetAt,
        });
      } catch (error) {
        console.error('[Chat] Error checking rate limit:', error);
        // En cas d'erreur de check (réseau), ne pas afficher de bannière (évite UX cassée)
        setRateLimitInfo(null);
      }
    };

    if (user?.id) {
      checkRateLimitInfo();
    }
  }, [user?.id]);

  // Format reset time for banner
  const formatResetTime = useCallback((date: Date | null): string => {
    if (!date) return t('rateLimit.now') || 'maintenant';
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) {
      return t('rateLimit.now') || 'maintenant';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return t('rateLimit.inHours', { hours, minutes: minutes > 0 ? ` ${minutes}min` : '' }) || `dans ${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } else {
      return t('rateLimit.inMinutes', { minutes }) || `dans ${minutes}min`;
    }
  }, [t]);

  // Tous les hooks doivent être appelés avant tout early return
  const formatTime = useCallback((date: Date) => {
    const locale = i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'en' ? 'en-US' : 'fr-FR';
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Mémoriser le rendu des messages avec composant optimisé et animations staggerées
  const renderMessage = useCallback(({ item: message, index }: { item: Message; index: number }) => (
    <MessageItem
      message={message}
      theme={theme}
      formatTime={formatTime}
      index={index}
    />
  ), [theme, formatTime]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const ListFooterComponent = useMemo(() => {
    if (!loading) return null;
    return (
      <Animated.View 
        style={styles.loadingContainer}
        entering={FadeInDown.duration(300)}
      >
        <View style={styles.typingRow}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {t('chat.thinking')}
          </Text>
          <TypingDots color={theme.colors.textSecondary} />
        </View>
      </Animated.View>
    );
  }, [loading, theme, t]);

  // Gestion d'erreur de rendu - APRÈS tous les hooks
  if (hasError) {
    return (
      <View style={styles.wrapper}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.text }]}>
              {t('chat.error.serviceUnavailable')}
            </Text>
            <Pressable
              onPress={() => {
                setHasError(false);
                setMessages([{
                  id: '1',
                  text: t('chat.welcomeMessage'),
                  sender: 'ayna',
                  timestamp: new Date(),
                }]);
              }}
              style={styles.retryButton}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.accent }]}>
                Réessayer
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const handleNewChat = async () => {
    setMessages([
      {
        id: '1',
        text: t('chat.welcomeMessage'),
        sender: 'ayna',
        timestamp: new Date(),
      },
    ]);
    
    setCurrentConversationId(null);
    await saveCurrentConversationId(null, user?.id);
    
    trackEvent('chat_new_conversation');
  };

  const handleLoadConversation = async (conversationId: string) => {
    const conversation = await loadConversation(conversationId, user?.id);
    if (conversation) {
      setMessages(conversation.messages.map((m: any) => ({
        id: m.id,
        text: m.text,
        sender: m.sender,
        timestamp: new Date(m.timestamp),
      })));
      setCurrentConversationId(conversationId);
      await saveCurrentConversationId(conversationId, user?.id);
      trackEvent('chat_conversation_loaded', { conversationId });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      // Supprimer la conversation
      await deleteConversation(conversationId, user?.id);
      
      // Si c'est la conversation actuelle, réinitialiser
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        await saveCurrentConversationId(null, user?.id);
        setMessages([
          {
            id: '1',
            text: t('chat.welcomeMessage'),
            sender: 'ayna',
            timestamp: new Date(),
          },
        ]);
      }
      
      // Recharger les conversations
      const loadedConversations = await loadConversations(user?.id || undefined, true);
      setConversations(loadedConversations);
      
      trackEvent('chat_conversation_deleted');
    } catch (error) {
      console.error('[Chat] Erreur suppression conversation:', error);
    }
  };

  const menuItems: StaggeredMenuItem[] = conversations.map(conv => ({
    id: conv.id,
    title: conv.title,
    subtitle: conv.messages.length > 0 
      ? conv.messages[conv.messages.length - 1].text.substring(0, 50) + '...'
      : undefined,
    timestamp: new Date(conv.updatedAt),
    onPress: () => handleLoadConversation(conv.id),
    onDelete: () => handleDeleteConversation(conv.id),
  }));

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
              outputFormat: 2 as any, // MPEG_4
              audioEncoder: 3 as any, // AAC
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
          Alert.alert(t('common.error'), t('chat.error.startRecordingFailed', { message: error.message }));
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
                
                // Note: Le fichier temporaire sera nettoyé automatiquement par le système
              } catch (transcribeError: any) {
                Alert.alert(
                  t('chat.error.transcriptionError'),
                  transcribeError.message || t('chat.error.transcriptionFailed')
                );
              }
            }
          } catch (error: any) {
            Alert.alert(t('common.error'), t('chat.error.stopRecordingFailed'));
          } finally {
            recordingRef.current = null;
            setIsTranscribing(false);
          }
        }
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('chat.error.recordingFailed'));
      setRecording(false);
      setIsTranscribing(false);
    }
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
              onPress={() => setShowMenu(true)}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <Menu size={20} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Rate Limit Banner */}
        {rateLimitInfo && rateLimitInfo.remainingMessages >= 0 && (
          <View style={[styles.rateLimitBanner, { backgroundColor: theme.colors.accent + '15', borderBottomColor: theme.colors.accent + '30' }]}>
            <View style={styles.rateLimitContent}>
              <Text style={[styles.rateLimitText, { color: theme.colors.text }]}>
                {t('rateLimit.info', {
                  remaining: rateLimitInfo.remainingMessages,
                  resetTime: formatResetTime(rateLimitInfo.resetAt)
                }) || `${rateLimitInfo.remainingMessages} messages restants. Réinitialisation ${formatResetTime(rateLimitInfo.resetAt)}`}
              </Text>
            </View>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            Platform.OS === 'ios' && { paddingBottom: 100 }
          ]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          updateCellsBatchingPeriod={50}
          inverted={false}
          ListFooterComponent={ListFooterComponent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => {
            // Scroller vers le bas seulement si on était déjà en bas
            if (shouldScrollToEndRef.current) {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }}
          onScrollBeginDrag={() => {
            // L'utilisateur scroll manuellement, ne pas forcer le scroll auto
            shouldScrollToEndRef.current = false;
          }}
          onScroll={(event) => {
            // Détecter si l'utilisateur est proche du bas (dans les 100px)
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const distanceFromEnd = contentSize.height - layoutMeasurement.height - contentOffset.y;
            
            // Si l'utilisateur est proche du bas (moins de 100px), réactiver le scroll auto
            if (distanceFromEnd < 100) {
              shouldScrollToEndRef.current = true;
            }
          }}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            // L'utilisateur est arrivé en bas, réactiver le scroll auto
            shouldScrollToEndRef.current = true;
          }}
        />

        {/* Input */}
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: theme.colors.backgroundSecondary,
            paddingBottom: Platform.OS === 'ios' ? 0 : 12,
          }
        ]}>
          <Pressable
            onPress={toggleVoiceRecording}
            disabled={isTranscribing || loading}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.voiceButton,
              {
                backgroundColor: recording
                  ? '#EF4444'
                  : isTranscribing
                  ? theme.colors.accent
                  : 'rgba(255, 255, 255, 0.08)',
              },
              (pressed || isTranscribing || loading) && styles.voiceButtonPressed,
            ]}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color={recording ? 'white' : theme.colors.background} />
            ) : (
              <Mic size={20} color={recording ? 'white' : '#FFFFFF'} />
            )}
          </Pressable>
          
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              Platform.OS === 'ios' && {
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '400',
              },
              Platform.OS !== 'ios' && { color: '#FFFFFF' }
            ]}
            placeholder={t('chat.inputPlaceholder')}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!loading && !isTranscribing}
            onSubmitEditing={handleSend}
            textAlignVertical="top"
            selectionColor="#FFD369"
            cursorColor="#FFFFFF"
            autoCorrect={true}
            autoCapitalize="sentences"
            underlineColorAndroid="transparent"
            onFocus={() => {
              // Scroller vers le bas quand l'input est focus pour le rendre visible
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || loading || isTranscribing}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: inputText.trim() && !loading && !isTranscribing ? theme.colors.accent : 'rgba(255, 255, 255, 0.08)',
              },
              pressed && styles.sendButtonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#0A0F2C" />
            ) : (
              <Send size={20} color={inputText.trim() && !isTranscribing ? '#0A0F2C' : '#FFFFFF'} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Menu des conversations */}
      <StaggeredMenu
        visible={showMenu}
        items={menuItems}
        onClose={() => setShowMenu(false)}
        theme={theme}
        emptyMessage={t('chat.noConversations') || 'Aucune conversation'}
        onNewConversation={handleNewChat}
        showNewConversationButton={true}
      />
    </SafeAreaView>
    
    {/* Paywall Modal */}
    <PaywallModal
      visible={showPaywall}
      onClose={() => setShowPaywall(false)}
      resetAt={rateLimitData?.resetAt || null}
      messagesUsed={rateLimitData?.messagesUsed || 0}
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
  rateLimitBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rateLimitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateLimitText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'System',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 0 : 0,
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
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    paddingBottom: Platform.OS === 'ios' ? 80 : 0,
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
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.9,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    borderTopWidth: 0,
    gap: 8,
    zIndex: 10,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  voiceButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    fontSize: 16,
    fontFamily: 'System',
    color: '#FFFFFF',
    textAlignVertical: 'top',
    includeFontPadding: Platform.OS === 'android' ? false : undefined,
    textAlign: 'left',
    borderWidth: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  sendButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  quickRepliesBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: 80,
  },
  quickRepliesContent: {
    gap: 8,
    paddingRight: 16,
  },
  quickReplyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  quickReplyText: {
    fontSize: 13,
    fontFamily: 'System',
  },
  quickRepliesToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quickRepliesTogglePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
  },
});
