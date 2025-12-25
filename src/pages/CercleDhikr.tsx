import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, InteractionManager, Share, Clipboard } from 'react-native';
import { useDimensions } from '@/hooks/useDimensions';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, Plus, LogOut, Trash2, Share2 } from 'lucide-react-native';
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
  isUserParticipant,
  type DhikrSession,
  type DhikrSessionParticipant,
} from '@/services/dhikrSessions';
import { checkAndUpdateAutoWorldSession, createOrUpdateAutoWorldSession } from '@/services/autoWorldSessionManager';
import {
  createPrivateSession,
  loadPrivateSessions as loadPrivateSessionsFromService,
  addPrivateSessionClick,
  deletePrivateSession,
  loadInvitedPrivateSessions,
  generateInviteLink,
  generateInviteLinkWeb,
  joinPrivateSessionByToken,
  type PrivateDhikrSession,
} from '@/services/privateDhikrSessions';
import { supabase } from '@/services/supabase';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@/config';
import { logger } from '@/utils/logger';

/**
 * Parse le texte du dhikr qui peut être en format JSON ou texte simple
 */
function parseDhikrText(dhikrText: string | null | undefined): {
  arabic: string;
  transliteration?: string;
  translation?: string;
  reference?: string;
} {
  if (!dhikrText) {
    return { arabic: '' };
  }
  
  try {
    // Essayer de parser comme JSON
    const parsed = JSON.parse(dhikrText);
    if (parsed.arabic) {
      return {
        arabic: parsed.arabic,
        transliteration: parsed.transliteration,
        translation: parsed.translation,
        reference: parsed.reference
      };
    }
  } catch (e) {
    // Ce n'est pas du JSON, c'est du texte simple
  }
  
  // Retourner le texte tel quel si ce n'est pas du JSON
  return { arabic: dhikrText };
}

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
  const route = useRoute();
  const { user, isAuthenticated, incrementUserDhikr } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const { width: SCREEN_WIDTH } = useDimensions();

  const [activeView, setActiveView] = useState<'my-sessions' | 'sessions' | 'active'>('sessions');
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
  const [userParticipantSessions, setUserParticipantSessions] = useState<Set<string>>(new Set());
  const [participantsCountMap, setParticipantsCountMap] = useState<Record<string, number>>({});

  const channelRef = useRef<any>(null);
  const processIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedSessionRef = useRef<DhikrSession | null>(null);
  const isReloadingSessionRef = useRef<boolean>(false);

  // Charger les sessions actives et la session de l'utilisateur (différé après interactions)
  useEffect(() => {
    // Afficher immédiatement l'écran, puis charger les données
    setLoading(false);
    
    InteractionManager.runAfterInteractions(() => {
      async function init() {
        // Vérifier si on doit créer une session automatiquement depuis la page d'accueil
        const params = route.params as any;
        if (params?.createSession && params?.dhikrText && user?.id) {
          try {
            // Créer automatiquement une session privée avec le dhikr sélectionné
            const newPrivateSession = await createPrivateSession(
              user.id,
              params.targetCount || 99,
              params.dhikrText
            );
            setSelectedPrivateSession(newPrivateSession);
            setSelectedSession(null);
            setActiveView('active');
            // Recharger les sessions privées
            await loadPrivateSessions();
            // Note: On ne nettoie pas les paramètres avec setParams car cela peut causer des erreurs
            // Les paramètres seront ignorés lors des prochains rendus grâce à la vérification ci-dessus
            return;
          } catch (error: any) {
            logger.warn('[CercleDhikr] Erreur lors de la création automatique de la session:', error);
            // Continuer avec le chargement normal
          }
        }

        // Vérifier si on doit rejoindre une session via un lien d'invitation
        if (params?.inviteSessionId && params?.inviteToken && user?.id) {
          try {
            // Rejoindre la session privée via le token
            const joinedSession = await joinPrivateSessionByToken(
              user.id,
              params.inviteSessionId,
              params.inviteToken
            );
            
            // Charger la session depuis le serveur pour avoir les données à jour
            const { data: sharedSession } = await supabase
              .from('dhikr_sessions')
              .select('*')
              .eq('is_private', true)
              .eq('private_session_id', params.inviteSessionId)
              .single();

            if (sharedSession) {
              // Convertir en format DhikrSession pour l'affichage
              const sessionAsPublic: DhikrSession = {
                id: sharedSession.id,
                created_by: sharedSession.created_by || '',
                dhikr_text: sharedSession.dhikr_text || '',
                target_count: sharedSession.target_count,
                current_count: sharedSession.current_count || 0,
                is_active: sharedSession.is_active !== undefined ? sharedSession.is_active : true,
                is_open: false,
                max_participants: sharedSession.max_participants || 100,
                created_at: sharedSession.created_at || new Date().toISOString(),
                updated_at: sharedSession.updated_at || new Date().toISOString(),
                completed_at: sharedSession.completed_at || undefined,
                session_name: sharedSession.session_name || undefined,
                prayer_period: sharedSession.prayer_period || undefined,
                is_auto: sharedSession.is_auto || false,
                _isInvitedPrivate: true,
                _privateSessionId: params.inviteSessionId,
              };

              setSelectedSession(sessionAsPublic);
              setSelectedPrivateSession(null);
              const sessionParticipants = await getDhikrSessionParticipants(sharedSession.id);
              setParticipants(sessionParticipants);
              setActiveView('active');
              
              Alert.alert('Succès', 'Vous avez rejoint la session privée !');
              
              // Recharger les sessions pour mettre à jour la liste
              await loadSessions();
              return;
            }
          } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de rejoindre la session. Le lien peut être invalide ou expiré.');
            // Continuer avec le chargement normal
          }
        }

        // Charger d'abord les sessions privées pour pouvoir les filtrer dans loadSessions
        await loadPrivateSessions();
        
        // Créer automatiquement la session mondiale si elle n'existe pas
        // L'application crée automatiquement la session pour la période actuelle
        if (user?.id) {
          const userLocation = user.location
            ? { latitude: user.location.latitude, longitude: user.location.longitude }
            : undefined;
          
          // Vérifier d'abord si une session automatique existe déjà pour la période actuelle
          try {
            const { data: existingAutoSessions } = await supabase
              .from('dhikr_sessions')
              .select('id, prayer_period, is_active')
              .eq('is_auto', true)
              .eq('is_active', true)
              .limit(1);
            
            // Si aucune session automatique n'existe, en créer une automatiquement
            // L'application crée la session automatiquement, peu importe qui charge la page
            if (!existingAutoSessions || existingAutoSessions.length === 0) {
              try {
                await createOrUpdateAutoWorldSession(user.id, userLocation);
              } catch (error) {
                // Si la création échoue (par exemple permissions), essayer avec checkAndUpdateAutoWorldSession pour les admins
                if (user?.isAdmin) {
                  try {
                    await checkAndUpdateAutoWorldSession(user.id, userLocation);
                  } catch (adminError) {
                    logger.warn('[CercleDhikr] Erreur lors de la création automatique de la session:', adminError);
                  }
                } else {
                  logger.warn('[CercleDhikr] Impossible de créer la session automatique:', error);
                }
              }
            } else if (user?.isAdmin) {
              // Si l'utilisateur est admin et qu'une session existe, vérifier et mettre à jour si nécessaire
              // (pour s'assurer que la session correspond à la période actuelle)
              await checkAndUpdateAutoWorldSession(user.id, userLocation);
            }
          } catch (error) {
            // Erreur silencieuse
            logger.warn('[CercleDhikr] Erreur lors de la vérification des sessions automatiques:', error);
          }
        }
        
        await loadSessions();
        
        // Vérifier si l'utilisateur était déjà dans une session et la recharger
        if (user?.id) {
          try {
            isReloadingSessionRef.current = true;
            const activeSession = await getUserActiveSession(user.id);
            if (activeSession) {
              // Recharger la session avec les données à jour depuis le serveur
              // Utiliser directement activeSession qui vient de getUserActiveSession
              // car elle contient déjà les données à jour
              const updatedSession = await getDhikrSession(activeSession.id);
              if (updatedSession) {
                // S'assurer que current_count est bien défini
                if (updatedSession.current_count === undefined || updatedSession.current_count === null) {
                  updatedSession.current_count = 0;
                }
                
                setSelectedSession(updatedSession);
                selectedSessionRef.current = updatedSession;
                setSelectedPrivateSession(null);
                const sessionParticipants = await getDhikrSessionParticipants(updatedSession.id);
                setParticipants(sessionParticipants);
                setActiveView('active');
              } else if (activeSession) {
                // Si getDhikrSession échoue, utiliser activeSession directement
                if (activeSession.current_count === undefined || activeSession.current_count === null) {
                  activeSession.current_count = 0;
                }
                setSelectedSession(activeSession);
                selectedSessionRef.current = activeSession;
                setSelectedPrivateSession(null);
                const sessionParticipants = await getDhikrSessionParticipants(activeSession.id);
                setParticipants(sessionParticipants);
                setActiveView('active');
              }
            }
          } catch (error) {
            // Erreur silencieuse - l'utilisateur pourra simplement rejoindre une session
            logger.warn('[CercleDhikr] Erreur lors du rechargement de la session active:', error);
          } finally {
            // Attendre un peu avant de permettre les mises à jour Realtime
            setTimeout(() => {
              isReloadingSessionRef.current = false;
            }, 1000);
          }
        }
      }
      
      init();
    });
    
    // Traiter les clics toutes les 0.5 secondes (seulement pour les sessions publiques)
    processIntervalRef.current = setInterval(async () => {
      try {
        await processDhikrSessionClicks();
      } catch (error) {
        // Erreur silencieuse en production
      }
    }, 500);

    return () => {
      if (processIntervalRef.current) {
        clearInterval(processIntervalRef.current);
      }
    };
  }, [user?.id, route.params]);

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
          
          // Ne pas écraser si on est en train de recharger la session
          if (isReloadingSessionRef.current) {
            return;
          }
          
          setSelectedSession(prev => {
            if (prev && prev.id === updatedSession.id) {
              // Ne jamais écraser avec une valeur plus petite que celle actuelle
              // Cela peut arriver si Realtime reçoit une mise à jour obsolète
              const localCount = prev.current_count || 0;
              const serverCount = updatedSession.current_count || 0;
              
              // Si la valeur du serveur est plus petite, garder la valeur locale
              // (cela signifie qu'on a des clics locaux qui ne sont pas encore synchronisés)
              if (localCount > serverCount) {
                // Garder la valeur locale mais mettre à jour les autres champs
                const updated = {
                  ...updatedSession,
                  current_count: localCount
                };
                selectedSessionRef.current = updated;
                return updated;
              }
              
              // Si la valeur du serveur est plus grande ou égale, utiliser celle du serveur
              // (cela signifie que le serveur a la valeur la plus récente)
              selectedSessionRef.current = updatedSession;
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
          const sessionId = (payload.new as any)?.session_id || (payload.old as any)?.session_id;
          
          if (sessionId && selectedSession && selectedSession.id === sessionId) {
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
      // IMPORTANT: Pour les sessions automatiques (is_auto = true), ne garder que la plus récente
      // car il ne doit y avoir qu'une seule session mondiale à la fois
      const publicSessions = Array.isArray(data) 
        ? data.filter(s => {
            if (!s) return false;
            // Une session est publique si is_private est explicitement false ou n'est pas défini
            const isPrivate = (s as any).is_private;
            const isPublic = isPrivate === false || isPrivate === null || isPrivate === undefined;
            
            // Si c'est une session automatique, vérifier qu'elle est bien la plus récente
            if ((s as any).is_auto === true) {
              // Trouver toutes les sessions automatiques
              const autoSessions = data.filter((other: any) => other?.is_auto === true);
              if (autoSessions.length > 1) {
                // Garder uniquement la plus récente
                autoSessions.sort((a: any, b: any) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                return s.id === autoSessions[0].id;
              }
            }
            
            return isPublic;
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
      // Sessions privées chargées
      setPrivateSessions(Array.isArray(mySessions) ? mySessions : []);
    } catch (error) {
      // Erreur silencieuse en production
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
                // Erreur silencieuse en production
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
        const newPrivateSession = await createPrivateSession(user.id, target, undefined);
        // Nouvelle session privée créée
        setSelectedPrivateSession(newPrivateSession);
        setSelectedSession(null);
        setActiveView('active');
        // Recharger les sessions privées pour mettre à jour la liste
        await loadPrivateSessions();
        // Sessions privées mises à jour
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
      // Erreur silencieuse en production
      Alert.alert('Erreur', error.message || 'Erreur lors de la création de la session');
    } finally {
      setIsCreating(false);
      setCustomTarget('');
      setUseCustomTarget(false);
    }
  }

  async function handleJoinSession(session: DhikrSession) {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour rejoindre une session.');
      return;
    }
    
    // Vérifier si l'utilisateur est déjà participant de cette session
    const isAlreadyParticipant = await isUserParticipant(session.id, user.id);
    if (isAlreadyParticipant) {
      // L'utilisateur est déjà dans cette session, simplement l'afficher
      setSelectedSession(session);
      setSelectedPrivateSession(null);
      const sessionParticipants = await getDhikrSessionParticipants(session.id);
      setParticipants(sessionParticipants);
      setActiveView('active');
      return;
    }
    
    // Vérifier si l'utilisateur est dans une autre session
    const currentSession = await getUserActiveSession(user.id);
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
                // Erreur silencieuse en production
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
        // S'assurer que current_count est bien défini
        if (updatedSession.current_count === undefined || updatedSession.current_count === null) {
          updatedSession.current_count = 0;
        }
        setSelectedSession(updatedSession);
        selectedSessionRef.current = updatedSession;
        const sessionParticipants = await getDhikrSessionParticipants(updatedSession.id);
        setParticipants(sessionParticipants);
        setActiveView('active');
        // Mettre à jour la liste des sessions où l'utilisateur est participant
        if (user?.id) {
          setUserParticipantSessions(prev => new Set([...prev, session.id]));
        }
        await loadSessions();
      }
    } catch (error: any) {
      // Erreur silencieuse en production
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
      // Erreur silencieuse en production
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
        
        // Mettre à jour les statistiques utilisateur
        if (success && user?.id) {
          incrementUserDhikr(1);
        }
        
        if (!success) {
          // Si l'ajout a échoué, recharger depuis le stockage
          const updated = await loadPrivateSessionsFromService(user.id);
          const updatedSession = updated.find(s => s.id === selectedPrivateSession.id);
          if (updatedSession) {
            setSelectedPrivateSession({ ...updatedSession });
          }
        }
      } catch (error: any) {
        // Erreur silencieuse en production
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

    // Pour les sessions publiques illimitées, target_count peut être null
    if (selectedSession.target_count !== null && selectedSession.current_count >= selectedSession.target_count) {
      return;
    }

    if (!selectedSession.is_active) {
      return;
    }

    try {
      // Mise à jour optimiste de l'UI pour un feedback immédiat
      const currentCount = selectedSession.current_count || 0;
      const newCount = selectedSession.target_count !== null 
        ? Math.min(currentCount + 1, selectedSession.target_count)
        : currentCount + 1;
      
      // Mettre à jour l'état local immédiatement
      const updatedSession = {
        ...selectedSession,
        current_count: newCount,
        is_active: selectedSession.target_count === null || newCount < selectedSession.target_count
      };
      setSelectedSession(updatedSession);
      selectedSessionRef.current = updatedSession;
      
      // Ensuite enregistrer le clic (passer l'ID utilisateur pour fiabilité)
      await addDhikrSessionClick(selectedSession.id, user?.id);
      
      // Mettre à jour les statistiques utilisateur
      if (user?.id) {
        incrementUserDhikr(1);
      }
      
      // Ne pas recharger immédiatement pour éviter que le compteur retombe à 0
      // La synchronisation se fera via Realtime qui mettra à jour automatiquement
    } catch (error: any) {
      // En cas d'erreur, recharger la session depuis le serveur
      try {
        const updatedSession = await getDhikrSession(selectedSession.id);
        if (updatedSession) {
          setSelectedSession({ ...updatedSession });
        }
      } catch (reloadError) {
        // Ignorer l'erreur de rechargement
      }
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
                  const progress = session.target_count !== null 
                    ? (session.current_count / session.target_count) * 100 
                    : 0;
                  return (
                    <View key={session.id} style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionInfo}>
                          <Text style={[styles.sessionDhikr, { color: theme.colors.text }]}>
                            {session.dhikr_text}
                          </Text>
                          <View style={styles.sessionMeta}>
                            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                              {session.target_count !== null 
                                ? `${session.current_count} / ${session.target_count}`
                                : session.current_count}
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
                                        if (user.id) {
                                          await deletePrivateSession(user.id, session.id);
                                        }
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
                const participantCount = participantsCountMap[session.id] ?? sessionParticipants.length ?? 0;
                const isFull = participantCount >= session.max_participants;
                const progress = session.target_count ? (session.current_count / session.target_count) * 100 : 0;

                return (
                  <View key={session.id} style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionInfo}>
                        {session.session_name && (
                          <Text style={[styles.sessionName, { color: theme.colors.accent, marginBottom: 4, fontSize: 16, fontWeight: '600' }]}>
                            {session.session_name}
                          </Text>
                        )}
                        {(() => {
                          const dhikr = parseDhikrText(session.dhikr_text);
                          return (
                            <View>
                              <Text style={[styles.sessionDhikr, { color: theme.colors.text }]}>
                                {dhikr.arabic}
                              </Text>
                              {dhikr.transliteration && (
                                <Text style={[styles.sessionDhikrTranslit, { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }]}>
                                  {dhikr.transliteration}
                                </Text>
                              )}
                            </View>
                          );
                        })()}
                        <View style={styles.sessionMeta}>
                          <View style={styles.metaItem}>
                            <Users size={16} color={theme.colors.textSecondary} />
                          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                            {participantCount} {session.max_participants ? `/ ${session.max_participants}` : ''}
                          </Text>
                          </View>
                          {session.target_count !== null && (
                            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                              {session.target_count !== null 
                                ? `${session.current_count} / ${session.target_count}`
                                : session.current_count}
                            </Text>
                          )}
                          {session.target_count === null && (
                            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                              {session.current_count}
                            </Text>
                          )}
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
                          {isFull 
                            ? 'Session pleine' 
                            : (user?.id && userParticipantSessions.has(session.id)) 
                              ? 'Continuer' 
                              : 'Rejoindre'}
                        </Text>
                      </Pressable>
                      
                      {/* Bouton de suppression pour le créateur ou l'admin - Invisible pour les non-admins */}
                      {/* Pour les sessions automatiques (is_auto), seuls les admins peuvent supprimer */}
                      {user?.id && (
                        (session.is_auto === true && user.isAdmin === true) ||
                        (session.is_auto !== true && (session.created_by === user.id || user.isAdmin === true))
                      ) && (
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
                                      // Erreur silencieuse en production
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
                    {selectedSession.session_name && (
                      <Text style={[styles.sessionName, { color: theme.colors.accent, marginBottom: 8, fontSize: 18, fontWeight: 'bold' }]}>
                        {selectedSession.session_name}
                      </Text>
                    )}
                    {(() => {
                      const dhikr = parseDhikrText(selectedSession.dhikr_text);
                      return (
                        <View>
                          <Text style={[styles.sessionDhikr, { color: theme.colors.text, fontSize: 20 }]}>
                            {dhikr.arabic}
                          </Text>
                          {dhikr.transliteration && (
                            <Text style={[styles.sessionDhikrTranslit, { color: theme.colors.textSecondary, fontSize: 16, marginTop: 8 }]}>
                              {dhikr.transliteration}
                            </Text>
                          )}
                          {dhikr.translation && (
                            <Text style={[styles.sessionDhikrTranslation, { color: theme.colors.textSecondary, fontSize: 15, marginTop: 8, fontStyle: 'italic' }]}>
                              {dhikr.translation}
                            </Text>
                          )}
                          {dhikr.reference && (
                            <Text style={[styles.sessionDhikrReference, { color: theme.colors.accent, fontSize: 13, marginTop: 8 }]}>
                              {dhikr.reference}
                            </Text>
                          )}
                        </View>
                      );
                    })()}
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
                    {/* Bouton Quitter - Caché pour les sessions automatiques (mondiales) */}
                    {selectedSession.is_auto !== true && (
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
                    )}
                    
                    {/* Bouton de suppression pour le créateur ou l'admin - Invisible pour les non-admins */}
                    {/* Ne pas afficher pour les sessions privées invitées */}
                    {/* Pour les sessions automatiques (is_auto), seuls les admins peuvent supprimer */}
                    {user?.id && !(selectedSession as any)._isInvitedPrivate && (
                      (selectedSession.is_auto === true && user.isAdmin === true) ||
                      (selectedSession.is_auto !== true && (selectedSession.created_by === user.id || user.isAdmin === true))
                    ) && (
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

                {/* Click Button - Toujours visible si la session est active */}
                {selectedSession.is_active && (
                  (selectedSession.target_count === null) || 
                  (selectedSession.target_count !== null && selectedSession.current_count < selectedSession.target_count)
                ) && (
                  <Pressable
                    onPress={handleClick}
                    style={({ pressed }) => [
                      styles.clickButton,
                      { 
                        backgroundColor: theme.colors.accent,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                        shadowColor: theme.colors.accent,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        elevation: 8,
                      }
                    ]}
                  >
                    <Text style={[styles.clickButtonText, { color: theme.colors.background }]}>
                      +
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Participants - Afficher seulement le nombre */}
              <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View style={styles.participantsCountContainer}>
                  <Users size={24} color={theme.colors.accent} />
                  <Text style={[styles.participantsCountText, { color: theme.colors.text }]}>
                    {participants && Array.isArray(participants) ? participants.length : 0} participant{participants && participants.length > 1 ? 's' : ''}
                  </Text>
                </View>
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
                
                {/* Boutons d'action pour le créateur */}
                {user?.id && selectedPrivateSession.userId === user.id && (
                  <View style={styles.sessionHeaderActions}>
                    {/* Bouton Partager le lien */}
                    <Pressable
                      onPress={async () => {
                        try {
                          if (!selectedPrivateSession.invite_token) {
                            Alert.alert('Erreur', 'Token d\'invitation introuvable');
                            return;
                          }

                          const inviteLink = generateInviteLink(selectedPrivateSession.id, selectedPrivateSession.invite_token);
                          const inviteLinkWeb = generateInviteLinkWeb(selectedPrivateSession.id, selectedPrivateSession.invite_token);

                          // Partager via l'API native
                          // Le deep link fonctionnera si l'app est installée
                          // Format: ayna://dhikr/invite/SESSION_ID?token=TOKEN
                          try {
                            await Share.share({
                              message: `Rejoignez ma session de dhikr privée !\n\nCliquez sur ce lien pour rejoindre:\n${inviteLinkWeb}\n\n(Assurez-vous d'avoir l'app AYNA installée)`,
                              title: 'Invitation à une session de dhikr',
                            });
                          } catch (shareError) {
                            // Si le partage échoue, copier dans le presse-papiers
                            Clipboard.setString(inviteLinkWeb);
                            Alert.alert(
                              'Lien copié',
                              'Le lien d\'invitation a été copié dans le presse-papiers. Vous pouvez le partager avec vos contacts.',
                              [{ text: 'OK' }]
                            );
                          }
                        } catch (error: any) {
                          Alert.alert('Erreur', error.message || 'Erreur lors du partage du lien');
                        }
                      }}
                      style={({ pressed }) => [
                        styles.shareButton,
                        { backgroundColor: theme.colors.accent },
                        pressed && styles.buttonPressed
                      ]}
                    >
                      <Share2 size={18} color={theme.colors.background} />
                      <Text style={[styles.shareButtonText, { color: theme.colors.background }]}>
                        Partager
                      </Text>
                    </Pressable>

                    {/* Bouton de suppression */}
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
                                  if (user.id) {
                                    await deletePrivateSession(user.id, selectedPrivateSession.id);
                                  }
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
                  </View>
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

                {/* Click Button - Toujours visible si la session est active */}
                {selectedPrivateSession.is_active && selectedPrivateSession.current_count < selectedPrivateSession.target_count && (
                  <Pressable
                    onPress={handleClick}
                    style={({ pressed }) => [
                      styles.clickButton,
                      { 
                        backgroundColor: theme.colors.accent,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                        shadowColor: theme.colors.accent,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        elevation: 8,
                      }
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
    marginTop: 24,
  },
  clickButtonText: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'System',
  },
  participantsCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  participantsCountText: {
    fontSize: 18,
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
    marginTop: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 8,
    textAlign: 'center',
  },
});

