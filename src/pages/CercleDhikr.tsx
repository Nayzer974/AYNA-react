import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, Plus, LogOut, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import Counter from '@/components/Counter';
import SimpleCounter from '@/components/SimpleCounter';
import {
  createDhikrSession,
  joinDhikrSession,
  leaveDhikrSession,
  addDhikrSessionClick,
  getActiveDhikrSessions,
  getDhikrSession,
  getDhikrSessionParticipants,
  getUserActiveSession,
  processDhikrSessionClicks,
  deleteAllActiveDhikrSessions,
  deleteDhikrSession,
  type DhikrSession,
  type DhikrSessionParticipant,
} from '@/services/dhikrSessions';
import {
  createPrivateSession,
  loadPrivateSessions as loadPrivateSessionsFromService,
  addPrivateSessionClick,
  deletePrivateSession,
  loadInvitedPrivateSessions,
  type PrivateDhikrSession,
} from '@/services/privateDhikrSessions';
import { supabase } from '@/services/supabase';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Page CercleDhikr (Da'Irat an-Nûr)
 * 
 * Permet de :
 * - Voir les sessions actives
 * - Créer une nouvelle session
 * - Rejoindre une session
 * - Voir le compteur et ajouter des clics
 * - Voir les participants
 */
export function CercleDhikr() {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  const [activeView, setActiveView] = useState<'my-sessions' | 'sessions' | 'active'>('my-sessions');
  const [sessions, setSessions] = useState<DhikrSession[]>([]);
  const [privateSessions, setPrivateSessions] = useState<PrivateDhikrSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<DhikrSession | null>(null);
  const [selectedPrivateSession, setSelectedPrivateSession] = useState<PrivateDhikrSession | null>(null);
  const [participants, setParticipants] = useState<DhikrSessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [customTarget, setCustomTarget] = useState('');
  const [useCustomTarget, setUseCustomTarget] = useState(false);
  const [counterFontSize, setCounterFontSize] = useState(80);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [sessionType, setSessionType] = useState<'private' | 'public'>('private');

  const channelRef = useRef<any>(null);
  const processIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les sessions actives et la session de l'utilisateur
  useEffect(() => {
    async function init() {
      // Charger d'abord les sessions privées pour pouvoir les filtrer dans loadSessions
      await loadPrivateSessions();
      await loadSessions();
      
      // Charger la session de l'utilisateur si connecté
      if (user?.id) {
        // Vérifier d'abord les sessions privées
        try {
          const privSessions = await loadPrivateSessionsFromService(user.id);
          if (privSessions && Array.isArray(privSessions) && privSessions.length > 0) {
            const activePrivate = privSessions.find(s => s.is_active);
            if (activePrivate) {
              setSelectedPrivateSession(activePrivate);
              setActiveView('active');
              return;
            }
          }
        } catch (error) {
          // Erreur silencieuse
        }
        
        // Sinon vérifier les sessions publiques
        try {
          const userSession = await getUserActiveSession(user.id);
          if (userSession) {
            setSelectedSession(userSession);
            const sessionParticipants = await getDhikrSessionParticipants(userSession.id);
            setParticipants(Array.isArray(sessionParticipants) ? sessionParticipants : []);
            setActiveView('active');
          }
        } catch (error) {
          // Erreur silencieuse
        }
      }
    }
    
    init();
    
    // Traiter les clics toutes les 0.5 secondes (seulement pour les sessions publiques)
    processIntervalRef.current = setInterval(async () => {
      try {
        await processDhikrSessionClicks();
      } catch (error) {
        console.error('Erreur lors du traitement des clics:', error);
      }
    }, 500);

    return () => {
      if (processIntervalRef.current) {
        clearInterval(processIntervalRef.current);
      }
    };
  }, [user?.id]);

  // Abonnement en temps réel aux sessions
  useEffect(() => {
    if (!supabase) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('dhikr_sessions_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dhikr_sessions'
        },
        async (payload) => {
          const updatedSession = payload.new as DhikrSession;
          
          setSelectedSession(prev => {
            if (prev && prev.id === updatedSession.id) {
              return updatedSession;
            }
            return prev;
          });
          
          setSessions(prev => {
            const index = prev.findIndex(s => s.id === updatedSession.id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = updatedSession;
              return updated;
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'dhikr_sessions'
        },
        async (payload) => {
          const deletedSessionId = payload.old.id;
          
          // Vérifier si l'utilisateur est actuellement dans cette session
          // Utiliser une fonction pour capturer la valeur actuelle
          setSelectedSession(prev => {
            const wasInSession = prev?.id === deletedSessionId;
            
            if (wasInSession) {
              // Afficher une alerte si l'utilisateur était dans la session supprimée
              setTimeout(() => {
                Alert.alert(
                  'Session supprimée',
                  'La session à laquelle vous participiez a été supprimée. Vous avez été automatiquement déconnecté.',
                  [{ text: 'OK' }]
                );
              }, 100);
            }
            
            return prev?.id === deletedSessionId ? null : prev;
          });
          
          setSelectedPrivateSession(prev => {
            return prev?.id === deletedSessionId ? null : prev;
          });
          
          setParticipants([]);
          setActiveView('sessions');
          setSessions(prev => prev.filter(s => s.id !== deletedSessionId));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dhikr_session_participants'
        },
        async (payload) => {
          const sessionId = payload.new?.session_id || payload.old?.session_id;
          
          if (selectedSession && selectedSession.id === sessionId) {
            const sessionParticipants = await getDhikrSessionParticipants(sessionId);
            setParticipants(sessionParticipants);
          }
          
          loadSessions();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (supabase && channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [selectedSession?.id]);

  // Ajuster la taille du compteur pour qu'il reste dans le conteneur
  useEffect(() => {
    if (selectedSession) {
      const currentDigits = calculatePlaces(selectedSession.current_count).length;
      const targetDigits = calculatePlaces(selectedSession.target_count).length;
      const maxDigits = Math.max(currentDigits, targetDigits);
      
      // Largeur disponible dans le conteneur (écran - padding card - padding container - marge de sécurité)
      const cardPadding = 24 * 2; // padding horizontal de counterCard
      const containerPadding = 16 * 2; // padding du scrollContent
      const counterWrapperPadding = 4 * 2 * 2; // padding horizontal de chaque counterWrapper (2 wrappers)
      const digitPadding = 4 * 2 * maxDigits * 2; // padding horizontal de chaque chiffre (2 compteurs)
      const safetyMargin = 30; // Marge de sécurité pour éviter les coupures
      const availableWidth = SCREEN_WIDTH - cardPadding - containerPadding - counterWrapperPadding - digitPadding - safetyMargin;
      
      // Calculer la largeur nécessaire :
      // - 2 compteurs (maxDigits chiffres chacun)
      // - 1 slash
      // - gaps entre les éléments (12px * 2)
      // - Largeur d'un chiffre = fontSize * 0.7 (d'après Counter.tsx avec padding)
      // - Largeur du slash = fontSize * 0.5 * 0.5 (environ)
      const gapBetween = 12; // gap dans counterContainer
      const digitWidthRatio = 0.7; // ratio largeur chiffre / fontSize (augmenté pour plus d'espace)
      const slashWidthRatio = 0.3; // ratio largeur slash / fontSize
      
      // Largeur totale nécessaire pour un fontSize donné
      // totalWidth = (maxDigits * digitWidthRatio * fontSize) * 2 + (slashWidthRatio * fontSize) + (gapBetween * 2)
      // Résoudre pour fontSize : fontSize = (availableWidth - gapBetween * 2) / (maxDigits * digitWidthRatio * 2 + slashWidthRatio)
      const totalDigitWidth = maxDigits * digitWidthRatio * 2;
      const totalSlashWidth = slashWidthRatio;
      const totalGaps = gapBetween * 2;
      
      const calculatedFontSize = (availableWidth - totalGaps) / (totalDigitWidth + totalSlashWidth);
      
      // Limiter la taille entre 40 et 100 pour une meilleure lisibilité
      const fontSize = Math.min(100, Math.max(40, calculatedFontSize));
      
      setCounterFontSize(fontSize);
    }
    
    // Ajuster aussi pour les sessions privées
    if (selectedPrivateSession) {
      const currentDigits = calculatePlaces(selectedPrivateSession.current_count).length;
      const targetDigits = calculatePlaces(selectedPrivateSession.target_count).length;
      const maxDigits = Math.max(currentDigits, targetDigits);
      
      const cardPadding = 24 * 2;
      const containerPadding = 16 * 2;
      const counterWrapperPadding = 4 * 2 * 2;
      const digitPadding = 4 * 2 * maxDigits * 2;
      const safetyMargin = 30;
      const availableWidth = SCREEN_WIDTH - cardPadding - containerPadding - counterWrapperPadding - digitPadding - safetyMargin;
      
      const gapBetween = 12;
      const digitWidthRatio = 0.7;
      const slashWidthRatio = 0.3;
      
      const totalDigitWidth = maxDigits * digitWidthRatio * 2;
      const totalSlashWidth = slashWidthRatio;
      const totalGaps = gapBetween * 2;
      
      const calculatedFontSize = (availableWidth - totalGaps) / (totalDigitWidth + totalSlashWidth);
      const fontSize = Math.min(100, Math.max(40, calculatedFontSize));
      
      setCounterFontSize(fontSize);
    }
  }, [selectedSession?.current_count, selectedSession?.target_count, selectedPrivateSession?.current_count, selectedPrivateSession?.target_count]);

  async function loadSessions() {
    try {
      // Charger toutes les sessions actives
      const data = await getActiveDhikrSessions();
      // Filtrer pour ne garder que les sessions publiques (is_private = false ou undefined/null)
      // IMPORTANT: Les sessions publiques créées par l'admin doivent apparaître ici,
      // même si l'admin est le créateur. On ne filtre PAS par created_by.
      const publicSessions = Array.isArray(data) 
        ? data.filter(s => {
            if (!s) return false;
            // Une session est publique si is_private est explicitement false ou n'est pas défini
            const isPrivate = (s as any).is_private;
            return isPrivate === false || isPrivate === null || isPrivate === undefined;
          })
        : [];
      
      // Ajouter aussi les sessions privées auxquelles l'utilisateur est invité
      // MAIS PAS les sessions privées créées par l'utilisateur lui-même
      if (user?.id) {
        try {
          const invitedSessions = await loadInvitedSessions();
          // Récupérer les IDs des sessions privées créées par l'utilisateur
          const myPrivateSessionIds = privateSessions && Array.isArray(privateSessions)
            ? privateSessions.map(s => s.id)
            : [];
          
          // Convertir les sessions privées invitées en format DhikrSession pour l'affichage
          // Exclure les sessions créées par l'utilisateur
          // Récupérer les IDs des sessions partagées sur le serveur pour ces sessions privées
          const invitedAsPublic = Array.isArray(invitedSessions)
            ? await Promise.all(
                invitedSessions
                  .filter(invited => invited.userId !== user.id && !myPrivateSessionIds.includes(invited.id))
                  .map(async (invited) => {
                    // Chercher l'ID de la session partagée sur le serveur
                    let serverSessionId = invited.id;
                    if (APP_CONFIG.useSupabase && supabase) {
                      try {
                        const { data: sharedSession } = await supabase
                          .from('dhikr_sessions')
                          .select('id')
                          .eq('is_private', true)
                          .eq('private_session_id', invited.id)
                          .single();
                        
                        if (sharedSession) {
                          serverSessionId = sharedSession.id;
                        }
                      } catch (error) {
                        // Ignorer l'erreur, utiliser l'ID local
                      }
                    }
                    
                    return {
                      id: serverSessionId, // Utiliser l'ID de la session serveur si disponible
                      created_by: invited.userId,
                      dhikr_text: invited.dhikr_text,
                      target_count: invited.target_count,
                      current_count: invited.current_count,
                      is_active: invited.is_active,
                      is_open: false, // Sessions privées invitées
                      max_participants: 100,
                      created_at: invited.created_at,
                      updated_at: invited.updated_at,
                      completed_at: invited.completed_at,
                      _isInvitedPrivate: true, // Marqueur pour identifier les sessions privées invitées
                      _privateSessionId: invited.id, // ID de la session privée locale
                    } as DhikrSession & { _isInvitedPrivate?: boolean; _privateSessionId?: string };
                  })
              )
            : [];
          
          setSessions([...publicSessions, ...invitedAsPublic]);
        } catch (error) {
          // Erreur silencieuse, utiliser seulement les sessions publiques
          setSessions(publicSessions);
        }
      } else {
        setSessions(publicSessions);
      }
    } catch (error) {
      // Erreur silencieuse
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPrivateSessions() {
    if (!user?.id) {
      setPrivateSessions([]);
      return;
    }

    try {
      // Charger uniquement les sessions créées par l'utilisateur (pas les invitées)
      const mySessions = await loadPrivateSessionsFromService(user.id);
      console.log('Sessions privées chargées:', mySessions);
      setPrivateSessions(Array.isArray(mySessions) ? mySessions : []);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions privées:', error);
      setPrivateSessions([]);
    }
  }
  
  // Fonction séparée pour charger les sessions invitées (affichées dans "Sessions actives")
  async function loadInvitedSessions() {
    if (!user?.id) {
      return [];
    }

    try {
      return await loadInvitedPrivateSessions(user.id);
    } catch (error) {
      return [];
    }
  }

  function calculatePlaces(maxValue: number): number[] {
    const digits = Math.max(3, Math.ceil(Math.log10(maxValue + 1)));
    const places: number[] = [];
    for (let i = digits - 1; i >= 0; i--) {
      places.push(Math.pow(10, i));
    }
    return places;
  }

  async function handleCreateSession() {
    // Plus besoin de vérifier l'authentification - fonctionne sans authentification
    const currentSession = user?.id ? await getUserActiveSession(user.id) : null;
    if (currentSession) {
      Alert.alert(
        'Session existante',
        'Vous êtes déjà dans une session. Voulez-vous quitter votre session actuelle pour en créer une nouvelle ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Quitter et créer',
            onPress: async () => {
              try {
                await leaveDhikrSession(currentSession.id);
                if (selectedSession && selectedSession.id === currentSession.id) {
                  setSelectedSession(null);
                  setParticipants([]);
                }
                await createNewSession();
              } catch (error) {
                console.error('Erreur:', error);
                Alert.alert('Erreur', 'Impossible de quitter la session actuelle');
              }
            },
          },
        ]
      );
      return;
    }

    await createNewSession();
  }

  async function createNewSession() {
    if (!user?.id) {
      Alert.alert(
        'Authentification requise',
        'Vous devez être connecté pour créer une session. Voulez-vous vous connecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
      return;
    }

    setIsCreating(true);
    try {
      const target = useCustomTarget && customTarget 
        ? parseInt(customTarget) 
        : undefined;

      if (useCustomTarget && (!target || target < 100 || target > 999)) {
        Alert.alert('Erreur', 'Le nombre de clics doit être entre 100 et 999');
        setIsCreating(false);
        return;
      }

      if (sessionType === 'private') {
        // Créer une session privée
        const newPrivateSession = await createPrivateSession(user.id, target);
        console.log('Nouvelle session privée créée:', newPrivateSession);
        setSelectedPrivateSession(newPrivateSession);
        setSelectedSession(null);
        setActiveView('active');
        // Recharger les sessions privées pour mettre à jour la liste
        await loadPrivateSessions();
        console.log('Sessions privées après création:', privateSessions);
      } else {
        // Créer une session publique - Seulement pour les admins
        if (user?.isAdmin !== true) {
          Alert.alert('Erreur', 'Seuls les administrateurs peuvent créer des sessions publiques.');
          setIsCreating(false);
          return;
        }
        const sessionId = await createDhikrSession(target, 100, user.id, user.isAdmin === true);
        const newSession = await getDhikrSession(sessionId);
        
        if (newSession) {
          setSelectedSession(newSession);
          setSelectedPrivateSession(null);
          const sessionParticipants = await getDhikrSessionParticipants(sessionId);
          setParticipants(sessionParticipants);
          setActiveView('active');
          await loadSessions();
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la session:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la création de la session');
    } finally {
      setIsCreating(false);
      setCustomTarget('');
      setUseCustomTarget(false);
    }
  }

  async function handleJoinSession(session: DhikrSession) {
    // Plus besoin de vérifier l'authentification - fonctionne sans authentification
    const currentSession = user?.id ? await getUserActiveSession(user.id) : null;
    if (currentSession && currentSession.id !== session.id) {
      Alert.alert(
        'Session existante',
        'Vous êtes déjà dans une session. Voulez-vous quitter votre session actuelle pour rejoindre cette nouvelle session ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Quitter et rejoindre',
            onPress: async () => {
              try {
                await leaveDhikrSession(currentSession.id);
                if (selectedSession && selectedSession.id === currentSession.id) {
                  setSelectedSession(null);
                  setParticipants([]);
                }
                await joinSession(session);
              } catch (error) {
                console.error('Erreur:', error);
                Alert.alert('Erreur', 'Impossible de quitter la session actuelle');
              }
            },
          },
        ]
      );
      return;
    }

    await joinSession(session);
  }

  async function joinSession(session: DhikrSession) {
    try {
      // Passer l'ID utilisateur depuis le contexte si disponible
      await joinDhikrSession(session.id, user?.id);
      const updatedSession = await getDhikrSession(session.id);
      if (updatedSession) {
        setSelectedSession(updatedSession);
        const sessionParticipants = await getDhikrSessionParticipants(updatedSession.id);
        setParticipants(sessionParticipants);
        setActiveView('active');
        await loadSessions();
      }
    } catch (error: any) {
      console.error('Erreur lors de la jonction à la session:', error);
      Alert.alert('Erreur', error.message || 'Impossible de rejoindre la session');
    }
  }

  async function handleLeaveSession() {
    if (!selectedSession) {
      return;
    }
    
    // Si pas d'utilisateur, simplement quitter la vue
    if (!user?.id) {
      setSelectedSession(null);
      setParticipants([]);
      setActiveView('sessions');
      return;
    }

    try {
      await leaveDhikrSession(selectedSession.id);
      setSelectedSession(null);
      setParticipants([]);
      setActiveView('sessions');
      setTimeout(async () => {
        await loadSessions();
      }, 500);
    } catch (error: any) {
      console.error('Erreur lors de la sortie de la session:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la sortie de la session');
    }
  }

  async function handleClick() {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour ajouter un clic');
      return;
    }

    // Gérer les sessions privées
    if (selectedPrivateSession) {
      if (selectedPrivateSession.current_count >= selectedPrivateSession.target_count) {
        return;
      }

      if (!selectedPrivateSession.is_active) {
        return;
      }

      try {
        // Mettre à jour immédiatement l'état local pour un feedback visuel instantané
        const newCount = Math.min(selectedPrivateSession.current_count + 1, selectedPrivateSession.target_count);
        const isStillActive = newCount < selectedPrivateSession.target_count;
        
        setSelectedPrivateSession({
          ...selectedPrivateSession,
          current_count: newCount,
          is_active: isStillActive,
          updated_at: new Date().toISOString(),
          completed_at: newCount >= selectedPrivateSession.target_count ? new Date().toISOString() : selectedPrivateSession.completed_at,
        });
        
        // Ensuite sauvegarder
        const success = await addPrivateSessionClick(user.id, selectedPrivateSession.id);
        
        if (!success) {
          // Si l'ajout a échoué, recharger depuis le stockage
          const updated = await loadPrivateSessionsFromService(user.id);
          const updatedSession = updated.find(s => s.id === selectedPrivateSession.id);
          if (updatedSession) {
            setSelectedPrivateSession({ ...updatedSession });
          }
        }
      } catch (error: any) {
        console.error('Erreur lors de l\'ajout du clic:', error);
        // En cas d'erreur, recharger depuis le stockage
        try {
          const updated = await loadPrivateSessionsFromService(user.id);
          const updatedSession = updated.find(s => s.id === selectedPrivateSession.id);
          if (updatedSession) {
            setSelectedPrivateSession({ ...updatedSession });
          }
        } catch (reloadError) {
          // Ignorer l'erreur de rechargement
        }
        Alert.alert('Erreur', error.message || 'Erreur lors de l\'ajout du clic');
      }
      return;
    }

    // Gérer les sessions publiques
    if (!selectedSession) {
      return;
    }

    if (selectedSession.current_count >= selectedSession.target_count) {
      return;
    }

    if (!selectedSession.is_active) {
      return;
    }

    try {
      await addDhikrSessionClick(selectedSession.id);
      await processDhikrSessionClicks();
      
      // Recharger la session pour mettre à jour le compteur
      const updatedSession = await getDhikrSession(selectedSession.id);
      if (updatedSession) {
        setSelectedSession({ ...updatedSession }); // Créer un nouvel objet pour forcer le re-render
        // Recharger aussi les participants
        const sessionParticipants = await getDhikrSessionParticipants(selectedSession.id);
        setParticipants(Array.isArray(sessionParticipants) ? sessionParticipants : []);
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du clic:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de l\'ajout du clic');
    }
  }

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
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Chargement...
            </Text>
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
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Da'Irat an-Nûr
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Cercle de Dhikr - Pratiquez le dhikr en communauté
            </Text>
          </View>
          {/* Bouton admin : Supprimer toutes les sessions - Invisible pour les non-admins */}
          {user?.isAdmin === true && (
            <Pressable
              onPress={async () => {
                Alert.alert(
                  'Supprimer toutes les sessions',
                  'Êtes-vous sûr de vouloir supprimer toutes les sessions actives ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Supprimer',
                      style: 'destructive',
                      onPress: async () => {
                        setIsDeletingAll(true);
                        try {
                          const deletedCount = await deleteAllActiveDhikrSessions();
                          Alert.alert('Succès', `${deletedCount} session(s) supprimée(s)`);
                          setSelectedSession(null);
                          setParticipants([]);
                          setActiveView('sessions');
                          await loadSessions();
                        } catch (error: any) {
                          Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
                        } finally {
                          setIsDeletingAll(false);
                        }
                      },
                    },
                  ]
                );
              }}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.buttonPressed
              ]}
            >
              <Trash2 size={20} color="#ff6b6b" />
            </Pressable>
          )}
        </View>

        {/* View Toggle */}
        <View style={styles.toggleContainer}>
          <Pressable
            onPress={() => {
              setActiveView('my-sessions');
              setSelectedSession(null);
              setSelectedPrivateSession(null);
            }}
            style={({ pressed }) => [
              styles.toggleButton,
              activeView === 'my-sessions' && { backgroundColor: theme.colors.accent },
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={[
              styles.toggleText,
              { color: activeView === 'my-sessions' ? theme.colors.background : theme.colors.textSecondary }
            ]}>
              {t('cercleDhikr.mySession')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setActiveView('sessions');
              setSelectedSession(null);
              setSelectedPrivateSession(null);
            }}
            style={({ pressed }) => [
              styles.toggleButton,
              activeView === 'sessions' && { backgroundColor: theme.colors.accent },
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={[
              styles.toggleText,
              { color: activeView === 'sessions' ? theme.colors.background : theme.colors.textSecondary }
            ]}>
              {t('cercleDhikr.activeSessions')}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* My Sessions (Private) */}
          {activeView === 'my-sessions' && (
            <View style={styles.sessionsContainer}>
              {/* Create New Private Session */}
              {user?.id && (
                <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    {t('cercleDhikr.createPrivateSession')}
                  </Text>
                  
                  <View style={styles.checkboxContainer}>
                    <Pressable
                      onPress={() => setUseCustomTarget(!useCustomTarget)}
                      style={styles.checkbox}
                    >
                      <View style={[
                        styles.checkboxBox,
                        { borderColor: theme.colors.textSecondary },
                        useCustomTarget && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }
                      ]}>
                        {useCustomTarget && <View style={styles.checkboxCheck} />}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: theme.colors.textSecondary }]}>
                        Personnaliser le nombre de clics (100-999)
                      </Text>
                    </Pressable>
                  </View>
                  
                  {useCustomTarget && (
                    <TextInput
                      value={customTarget}
                      onChangeText={setCustomTarget}
                      placeholder="Nombre de clics (100-999)"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                      style={[
                        styles.input,
                        { 
                          backgroundColor: theme.colors.background,
                          color: theme.colors.text,
                          borderColor: theme.colors.textSecondary + '30'
                        }
                      ]}
                    />
                  )}

                  <Pressable
                    onPress={() => {
                      setSessionType('private');
                      createNewSession();
                    }}
                    disabled={isCreating || (privateSessions && Array.isArray(privateSessions) && privateSessions.length >= 2)}
                    style={({ pressed }) => [
                      styles.createButton,
                      { 
                        backgroundColor: (privateSessions && Array.isArray(privateSessions) && privateSessions.length >= 2)
                          ? theme.colors.textSecondary + '30' 
                          : theme.colors.accent 
                      },
                      (isCreating || pressed) && styles.buttonPressed
                    ]}
                  >
                    {isCreating ? (
                      <ActivityIndicator size="small" color={theme.colors.background} />
                    ) : (
                      <>
                        <Plus size={20} color={theme.colors.background} />
                        <Text style={[styles.createButtonText, { color: theme.colors.background }]}>
                          {(privateSessions && Array.isArray(privateSessions) && privateSessions.length >= 2)
                            ? 'Maximum 2 sessions privées' 
                            : 'Créer une session privée'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                  
                  {privateSessions && Array.isArray(privateSessions) && privateSessions.length >= 2 && (
                    <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                      Vous avez atteint la limite de 2 sessions privées
                    </Text>
                  )}
                </View>
              )}

              {/* Private Sessions List */}
              {!privateSessions || !Array.isArray(privateSessions) || privateSessions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    {user?.id 
                      ? t('cercleDhikr.noPrivateSessions')
                      : t('cercleDhikr.loginToCreate')}
                  </Text>
                </View>
              ) : (
                privateSessions.map((session) => {
                  const progress = (session.current_count / session.target_count) * 100;
                  return (
                    <View key={session.id} style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionInfo}>
                          <Text style={[styles.sessionDhikr, { color: theme.colors.text }]}>
                            {session.dhikr_text}
                          </Text>
                          <View style={styles.sessionMeta}>
                            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                              {session.current_count} / {session.target_count}
                            </Text>
                            <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontSize: 12 }]}>
                              Privée
                            </Text>
                          </View>
                        </View>
                        {session.is_active && (
                          <View style={styles.activeBadge}>
                            <View style={[styles.activeDot, { backgroundColor: '#10b981' }]} />
                            <Text style={styles.activeText}>En cours</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: theme.colors.textSecondary + '20' }]}>
                          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.accent }]} />
                        </View>
                      </View>

                      <View style={styles.sessionActions}>
                        <Pressable
                          onPress={() => {
                            setSelectedPrivateSession(session);
                            setSelectedSession(null);
                            setActiveView('active');
                          }}
                          style={({ pressed }) => [
                            styles.joinButton,
                            { backgroundColor: theme.colors.accent, flex: 1 },
                            pressed && styles.buttonPressed
                          ]}
                        >
                          <Text style={[styles.joinButtonText, { color: theme.colors.background }]}>
                            Continuer
                          </Text>
                        </Pressable>
                        
                        {user?.id && session.userId === user.id && (
                          <Pressable
                            onPress={() => {
                              Alert.alert(
                                'Supprimer la session',
                                'Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible.',
                                [
                                  { text: 'Annuler', style: 'cancel' },
                                  {
                                    text: 'Supprimer',
                                    style: 'destructive',
                                    onPress: async () => {
                                      try {
                                        await deletePrivateSession(user.id, session.id);
                                        await loadPrivateSessions();
                                        if (selectedPrivateSession?.id === session.id) {
                                          setSelectedPrivateSession(null);
                                          setActiveView('my-sessions');
                                        }
                                        Alert.alert('Succès', 'Session supprimée');
                                      } catch (error: any) {
                                        Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
                                      }
                                    },
                                  },
                                ]
                              );
                            }}
                            style={({ pressed }) => [
                              styles.deleteSessionButton,
                              pressed && styles.buttonPressed
                            ]}
                          >
                            <Trash2 size={18} color="#ff6b6b" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Public Sessions List */}
          {activeView === 'sessions' && (
            <View style={styles.sessionsContainer}>
              {/* Create New Public Session - Invisible pour les non-admins */}
              {user?.id && user.isAdmin === true && (
                <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    Créer une session publique
                  </Text>
                  
                  <View style={styles.checkboxContainer}>
                    <Pressable
                      onPress={() => setUseCustomTarget(!useCustomTarget)}
                      style={styles.checkbox}
                    >
                      <View style={[
                        styles.checkboxBox,
                        { borderColor: theme.colors.textSecondary },
                        useCustomTarget && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }
                      ]}>
                        {useCustomTarget && <View style={styles.checkboxCheck} />}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: theme.colors.textSecondary }]}>
                        Personnaliser le nombre de clics (100-999)
                      </Text>
                    </Pressable>
                  </View>
                  
                  {useCustomTarget && (
                    <TextInput
                      value={customTarget}
                      onChangeText={setCustomTarget}
                      placeholder="Nombre de clics (100-999)"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                      style={[
                        styles.input,
                        { 
                          backgroundColor: theme.colors.background,
                          color: theme.colors.text,
                          borderColor: theme.colors.textSecondary + '30'
                        }
                      ]}
                    />
                  )}

                  <Pressable
                    onPress={() => {
                      setSessionType('public');
                      createNewSession();
                    }}
                    disabled={isCreating}
                    style={({ pressed }) => [
                      styles.createButton,
                      { backgroundColor: theme.colors.accent },
                      (isCreating || pressed) && styles.buttonPressed
                    ]}
                  >
                    {isCreating ? (
                      <ActivityIndicator size="small" color={theme.colors.background} />
                    ) : (
                      <>
                        <Plus size={20} color={theme.colors.background} />
                        <Text style={[styles.createButtonText, { color: theme.colors.background }]}>
                          Créer une session publique
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}

              {/* Active Sessions */}
              {sessions && Array.isArray(sessions) && sessions.length > 0 && sessions.map((session) => {
                const sessionParticipants = (participants && Array.isArray(participants)) 
                  ? participants.filter(p => p.session_id === session.id)
                  : [];
                const participantCount = sessionParticipants.length;
                const isFull = participantCount >= session.max_participants;
                const progress = (session.current_count / session.target_count) * 100;

                return (
                  <View key={session.id} style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionInfo}>
                        <Text style={[styles.sessionDhikr, { color: theme.colors.text }]}>
                          {session.dhikr_text}
                        </Text>
                        <View style={styles.sessionMeta}>
                          <View style={styles.metaItem}>
                            <Users size={16} color={theme.colors.textSecondary} />
                            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                              {participantCount} / {session.max_participants}
                            </Text>
                          </View>
                          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                            {session.current_count} / {session.target_count}
                          </Text>
                        </View>
                      </View>
                      {session.is_active && (
                        <View style={styles.activeBadge}>
                          <View style={[styles.activeDot, { backgroundColor: '#10b981' }]} />
                          <Text style={styles.activeText}>En cours</Text>
                        </View>
                      )}
                    </View>

                    {/* Progress */}
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { backgroundColor: theme.colors.textSecondary + '20' }]}>
                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.accent }]} />
                      </View>
                    </View>

                    <View style={styles.sessionActions}>
                      <Pressable
                        onPress={() => handleJoinSession(session)}
                        disabled={isFull}
                        style={({ pressed }) => [
                          styles.joinButton,
                          { 
                            backgroundColor: isFull ? theme.colors.textSecondary + '30' : theme.colors.accent,
                            opacity: isFull ? 0.5 : 1,
                            flex: 1
                          },
                          pressed && !isFull && styles.buttonPressed
                        ]}
                      >
                        <Text style={[
                          styles.joinButtonText,
                          { color: isFull ? theme.colors.textSecondary : theme.colors.background }
                        ]}>
                          {isFull ? 'Session pleine' : 'Rejoindre'}
                        </Text>
                      </Pressable>
                      
                      {/* Bouton de suppression pour le créateur ou l'admin - Invisible pour les non-admins */}
                      {user?.id && (session.created_by === user.id || user.isAdmin === true) && (
                        <Pressable
                          onPress={() => {
                            Alert.alert(
                              'Supprimer la session',
                              'Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible.',
                              [
                                { text: 'Annuler', style: 'cancel' },
                                {
                                  text: 'Supprimer',
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      // Vérifier si c'est une session privée invitée (convertie en format public)
                                      const isInvitedPrivate = (session as any)._isInvitedPrivate === true;
                                      
                                      if (isInvitedPrivate) {
                                        Alert.alert(
                                          'Information',
                                          'Cette session est une session privée à laquelle vous avez été invité. Vous ne pouvez pas la supprimer, seulement la quitter en utilisant le bouton "Quitter" dans la vue active.'
                                        );
                                        return;
                                      }
                                      
                                      await deleteDhikrSession(session.id, user.id, user.isAdmin === true);
                                      
                                      // Mettre à jour l'état local immédiatement
                                      if (selectedSession?.id === session.id) {
                                        setSelectedSession(null);
                                        setParticipants([]);
                                        setActiveView('sessions');
                                      }
                                      
                                      // Recharger les sessions pour mettre à jour la liste
                                      await loadSessions();
                                      
                                      Alert.alert(
                                        'Succès', 
                                        'Session supprimée. Tous les participants ont été automatiquement déconnectés.'
                                      );
                                    } catch (error: any) {
                                      console.error('Erreur détaillée lors de la suppression:', error);
                                      Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
                                    }
                                  },
                                },
                              ]
                            );
                          }}
                          style={({ pressed }) => [
                            styles.deleteSessionButton,
                            pressed && styles.buttonPressed
                          ]}
                        >
                          <Trash2 size={18} color="#ff6b6b" />
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Active Session View - Public */}
          {activeView === 'active' && selectedSession && !selectedPrivateSession && (
            <View style={styles.activeContainer}>
              {/* Session Info */}
              <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionDhikr, { color: theme.colors.text }]}>
                      {selectedSession.dhikr_text}
                    </Text>
                    <View style={styles.sessionMeta}>
                      <View style={styles.metaItem}>
                        <Users size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                          {participants && Array.isArray(participants) ? participants.length : 0} participants
                        </Text>
                      </View>
                      {selectedSession.is_active && (
                        <View style={styles.activeBadge}>
                          <View style={[styles.activeDot, { backgroundColor: '#10b981' }]} />
                          <Text style={styles.activeText}>En cours</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.sessionHeaderActions}>
                    <Pressable
                      onPress={handleLeaveSession}
                      style={({ pressed }) => [
                        styles.leaveButton,
                        pressed && styles.buttonPressed
                      ]}
                    >
                      <LogOut size={16} color="#ff6b6b" />
                      <Text style={styles.leaveButtonText}>Quitter</Text>
                    </Pressable>
                    
                    {/* Bouton de suppression pour le créateur ou l'admin - Invisible pour les non-admins */}
                    {/* Ne pas afficher pour les sessions privées invitées */}
                    {user?.id && !(selectedSession as any)._isInvitedPrivate && (selectedSession.created_by === user.id || user.isAdmin === true) && (
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            'Supprimer la session',
                            'Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible.',
                            [
                              { text: 'Annuler', style: 'cancel' },
                              {
                                text: 'Supprimer',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    await deleteDhikrSession(selectedSession.id, user.id, user.isAdmin === true);
                                    
                                    // Mettre à jour l'état local immédiatement
                                    setSelectedSession(null);
                                    setParticipants([]);
                                    setActiveView('sessions');
                                    
                                    // Recharger les sessions pour mettre à jour la liste
                                    await loadSessions();
                                    
                                    Alert.alert(
                                      'Succès', 
                                      'Session supprimée. Tous les participants ont été automatiquement déconnectés.'
                                    );
                                  } catch (error: any) {
                                    Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        style={({ pressed }) => [
                          styles.deleteSessionButton,
                          pressed && styles.buttonPressed
                        ]}
                      >
                        <Trash2 size={18} color="#ff6b6b" />
                        <Text style={styles.deleteSessionButtonText}>Supprimer</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>

              {/* Counter Display */}
              <View style={[styles.counterCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <SimpleCounter
                  value={selectedSession.current_count}
                  target={selectedSession.target_count}
                  fontSize={counterFontSize}
                  textColor={theme.colors.text}
                  targetColor={theme.colors.textSecondary}
                />

                {/* Click Button */}
                {selectedSession.is_active && selectedSession.current_count < selectedSession.target_count && (
                  <Pressable
                    onPress={handleClick}
                    style={({ pressed }) => [
                      styles.clickButton,
                      { backgroundColor: theme.colors.accent },
                      pressed && styles.buttonPressed
                    ]}
                  >
                    <Text style={[styles.clickButtonText, { color: theme.colors.background }]}>
                      +
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Participants List */}
              <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                      Participants ({participants && Array.isArray(participants) ? participants.length : 0})
                    </Text>
                    {participants && Array.isArray(participants) && participants.map((participant) => (
                  <View key={participant.id} style={styles.participantItem}>
                    <View style={[styles.participantAvatar, { backgroundColor: theme.colors.accent }]}>
                      <Text style={[styles.participantInitial, { color: theme.colors.background }]}>
                        {(participant.user_name || participant.user_email || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={[styles.participantName, { color: theme.colors.text }]}>
                        {participant.user_name || participant.user_email || 'Utilisateur'}
                      </Text>
                    </View>
                    <Text style={[styles.participantCount, { color: theme.colors.accent }]}>
                      {participant.click_count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Active Session View - Private */}
          {activeView === 'active' && selectedPrivateSession && !selectedSession && (
            <View style={styles.activeContainer}>
              {/* Session Info */}
              <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionDhikr, { color: theme.colors.text }]}>
                      {selectedPrivateSession.dhikr_text}
                    </Text>
                    <Text style={[styles.sessionMeta, { color: theme.colors.textSecondary, fontSize: 12 }]}>
                      Session privée
                    </Text>
                  </View>
                  {selectedPrivateSession.is_active && (
                    <View style={styles.activeBadge}>
                      <View style={[styles.activeDot, { backgroundColor: '#10b981' }]} />
                      <Text style={styles.activeText}>En cours</Text>
                    </View>
                  )}
                </View>
                
                {/* Bouton de suppression pour le créateur */}
                {user?.id && selectedPrivateSession.userId === user.id && (
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        'Supprimer la session',
                        'Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible.',
                        [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Supprimer',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await deletePrivateSession(user.id, selectedPrivateSession.id);
                                setSelectedPrivateSession(null);
                                setActiveView('my-sessions');
                                await loadPrivateSessions();
                                Alert.alert('Succès', 'Session supprimée');
                              } catch (error: any) {
                                Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
                              }
                            },
                          },
                        ]
                      );
                    }}
                    style={({ pressed }) => [
                      styles.deleteSessionButton,
                      pressed && styles.buttonPressed
                    ]}
                  >
                    <Trash2 size={18} color="#ff6b6b" />
                    <Text style={styles.deleteSessionButtonText}>Supprimer</Text>
                  </Pressable>
                )}
              </View>

              {/* Counter Display */}
              <View style={[styles.counterCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <SimpleCounter
                  value={selectedPrivateSession.current_count}
                  target={selectedPrivateSession.target_count}
                  fontSize={counterFontSize}
                  textColor={theme.colors.text}
                  targetColor={theme.colors.textSecondary}
                />

                {/* Click Button */}
                {selectedPrivateSession.is_active && selectedPrivateSession.current_count < selectedPrivateSession.target_count && (
                  <Pressable
                    onPress={handleClick}
                    style={({ pressed }) => [
                      styles.clickButton,
                      { backgroundColor: theme.colors.accent },
                      pressed && styles.buttonPressed
                    ]}
                  >
                    <Text style={[styles.clickButtonText, { color: theme.colors.background }]}>
                      +
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {activeView === 'active' && !selectedSession && !selectedPrivateSession && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('cercleDhikr.noSessionSelected')}
              </Text>
              <Pressable
                onPress={() => setActiveView('my-sessions')}
                style={({ pressed }) => [
                  styles.emptyButton,
                  { backgroundColor: theme.colors.accent },
                  pressed && styles.buttonPressed
                ]}
              >
                <Text style={[styles.emptyButtonText, { color: theme.colors.background }]}>
                  {t('cercleDhikr.viewMySessions')}
                </Text>
              </Pressable>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'System',
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'System',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  sessionsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 16,
  },
  checkboxContainer: {
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'System',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDhikr: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    fontFamily: 'System',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  joinButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  activeContainer: {
    gap: 16,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
    fontFamily: 'System',
  },
  counterCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    overflow: 'visible',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    width: '100%',
    flexWrap: 'nowrap',
    overflow: 'visible',
    paddingHorizontal: 8,
  },
  counterWrapper: {
    flexShrink: 1,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  counterSlash: {
    fontFamily: 'System',
    fontWeight: '900',
    flexShrink: 0,
    includeFontPadding: false,
  },
  clickButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickButtonText: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'System',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantInitial: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  participantCount: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 16,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  deleteSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  deleteSessionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
    fontFamily: 'System',
  },
  sessionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

