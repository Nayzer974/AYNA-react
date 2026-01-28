import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, InteractionManager, Share, Clipboard, Image } from 'react-native';
import { useDimensions } from '@/hooks/useDimensions';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Users, Plus, LogOut, Trash2, Share2 } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

// Import de l'image de cœur
const heartImage = require('../../coeur.png');
import * as Haptics from 'expo-haptics';
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
} from '@/services/content/dhikrSessions';
import { checkAndUpdateAllAutoWorldSessions } from '@/services/system/autoWorldSessionManager';
import { getAuthenticDhikrByIndex, AUTHENTIC_DHIKR, type AuthenticDhikr } from '@/data/authenticDhikr';
import { getDuahRabanahByIndex } from '@/data/duahRabanah';
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
} from '@/services/content/privateDhikrSessions';
import { supabase } from '@/services/auth/supabase';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@/config';
import { logger } from '@/utils/logger';
import { hasActiveSubscription } from '@/services/system/subscription';
import { analyzeIntentionForDhikr, DhikrSuggestionResult } from '@/services/ai/intentionAI';
import { StarAnimation } from '@/components/icons/StarAnimation';
import { ModuleIntroductionModal } from '@/components/ModuleIntroductionModal';
import { hasSeenModuleIntroduction, markModuleIntroductionAsSeen, MODULE_KEYS } from '@/utils/moduleIntroduction';
import { MODULE_INTRODUCTIONS } from '@/data/moduleIntroductions';
import { Sparkles } from 'lucide-react-native';
import { dhikrDatabase, type Dhikr } from '@/data/dhikrDatabase';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { trackEvent } from '@/services/analytics/analytics-migration-wrapper';
import { useHeartSound } from '@/hooks/useHeartSound';

/**
 * Composant pour l'icône de cœur utilisant l'image coeur.png
 */
const HeartIcon = React.memo(({ size, color, active }: { size: number; color: string; active?: boolean }) => (
  <Image
    source={heartImage}
    style={{
      width: size,
      height: size,
      tintColor: active ? color : undefined,
      opacity: active ? 1 : 0.5,
    }}
    resizeMode="contain"
  />
));

/**
 * Composant pour le bouton Mode Cœur avec son spécial
 */
const HeartModeButton = React.memo(({
  heartModeActive,
  setHeartModeActive,
  theme
}: {
  heartModeActive: boolean;
  setHeartModeActive: (active: boolean) => void;
  theme: any;
}) => {
  const { startHeartSoundLoop, stopHeartSoundLoop } = useHeartSound();

  // Gérer la lecture en boucle selon l'état du mode cœur
  useEffect(() => {
    if (heartModeActive) {
      // Démarrer la lecture en boucle quand le mode cœur est activé
      startHeartSoundLoop();
    } else {
      // Arrêter la lecture quand le mode cœur est désactivé
      stopHeartSoundLoop();
    }

    // Nettoyer à la désactivation
    return () => {
      if (!heartModeActive) {
        stopHeartSoundLoop();
      }
    };
  }, [heartModeActive, startHeartSoundLoop, stopHeartSoundLoop]);

  const handlePress = () => {
    setHeartModeActive(!heartModeActive);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.heartModeButton,
        {
          backgroundColor: heartModeActive ? theme.colors.accent + '30' : theme.colors.backgroundSecondary,
          borderColor: heartModeActive ? theme.colors.accent : theme.colors.textSecondary + '30',
          transform: [{ scale: pressed ? 0.95 : 1 }],
        }
      ]}
    >
      <HeartIcon
        size={24}
        color={theme.colors.accent}
        active={heartModeActive}
      />
      <Text style={[
        styles.heartModeText,
        { color: heartModeActive ? theme.colors.accent : theme.colors.textSecondary }
      ]}>
        Mode cœur
      </Text>
    </Pressable>
  );
});

HeartModeButton.displayName = 'HeartModeButton';

/**
 * Parse le texte du dhikr qui peut être en format JSON ou texte simple
 * Gère les JSON malformés et extrait les valeurs même si le format n'est pas parfait
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

  // Nettoyer le texte (supprimer les espaces superflus dans les clés JSON)
  let cleanedText = dhikrText.trim();

  // Essayer de réparer les clés JSON avec des espaces (ex: "ref erence" -> "reference")
  cleanedText = cleanedText.replace(/"ref\s+erence"/gi, '"reference"');
  cleanedText = cleanedText.replace(/"ref\s+erence"/gi, '"reference"');

  // Essayer de parser comme JSON valide
  try {
    const parsed = JSON.parse(cleanedText);
    if (parsed && typeof parsed === 'object') {
      return {
        arabic: parsed.arabic || '',
        transliteration: parsed.transliteration || parsed.translit || undefined,
        translation: parsed.translation || parsed.trans || undefined,
        reference: parsed.reference || parsed.ref || undefined
      };
    }
  } catch (e) {
    // JSON invalide, essayer d'extraire les valeurs avec des regex
    try {
      // Fonction helper pour extraire une valeur JSON même si malformée
      const extractValue = (key: string, text: string): string | undefined => {
        // Essayer plusieurs patterns pour gérer différents formats
        const patterns = [
          new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 'i'),
          new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'i'), // Gère les échappements
          new RegExp(`${key}["\\s]*:["\\s]*([^",}]+)`, 'i'),
          new RegExp(`"${key.replace(/\s+/g, '\\s+')}"\\s*:\\s*"([^"]*)"`, 'i'), // Gère les espaces dans la clé
        ];

        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            // Nettoyer les échappements JSON
            return match[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\')
              .trim();
          }
        }
        return undefined;
      };

      // Extraire les valeurs
      const arabic = extractValue('arabic', cleanedText) || '';
      const transliteration = extractValue('transliteration', cleanedText) ||
        extractValue('translit', cleanedText) ||
        undefined;
      const translation = extractValue('translation', cleanedText) ||
        extractValue('trans', cleanedText) ||
        undefined;
      const reference = extractValue('reference', cleanedText) ||
        extractValue('ref', cleanedText) ||
        extractValue('ref erence', cleanedText) || // Gère "ref erence" avec espace
        undefined;

      // Si on a trouvé au moins l'arabe, retourner les valeurs extraites
      if (arabic) {
        return {
          arabic,
          transliteration: transliteration || undefined,
          translation: translation || undefined,
          reference: reference || undefined
        };
      }
    } catch (regexError) {
      // Si même l'extraction regex échoue, continuer
    }
  }

  // Si le texte ne contient pas de JSON ou de structure reconnaissable,
  // vérifier s'il contient des caractères arabes
  const hasArabic = /[\u0600-\u06FF]/.test(cleanedText);

  // Si c'est du texte simple avec de l'arabe, le retourner tel quel
  if (hasArabic && cleanedText.length < 500) {
    return { arabic: cleanedText };
  }

  // Sinon, retourner le texte tel quel
  return { arabic: cleanedText };
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
  const [userParticipantSessions, setUserParticipantSessions] = useState<Set<string>>(new Set());
  const [participantsCountMap, setParticipantsCountMap] = useState<Record<string, number>>({});

  // États pour le mode intention IA (abonnés uniquement)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [showIntentionMode, setShowIntentionMode] = useState<boolean>(false);
  const [intention, setIntention] = useState<string>('');
  const [isAnalyzingIntention, setIsAnalyzingIntention] = useState<boolean>(false);
  const [suggestedDhikr, setSuggestedDhikr] = useState<DhikrSuggestionResult | null>(null);
  const [selectedDhikrIndex, setSelectedDhikrIndex] = useState<number>(0); // Index du dhikr sélectionné parmi ceux suggérés

  // États pour le mode cœur
  const [heartModeActive, setHeartModeActive] = useState<boolean>(false);
  const heartSoundRef = useRef<any>(null); // Audio.Sound from expo-av (type any pour éviter l'erreur)

  // État pour le modal d'introduction
  const [showModuleIntroduction, setShowModuleIntroduction] = useState(false);
  const [showIntroductionPage, setShowIntroductionPage] = useState(true);

  // États pour la liste des dhikr
  const [expandedDhikrCategory, setExpandedDhikrCategory] = useState<string | null>(null);
  const [expandedAuthenticSubCategory, setExpandedAuthenticSubCategory] = useState<string | null>(null);

  const channelRef = useRef<any>(null);
  const processIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedSessionRef = useRef<DhikrSession | null>(null);
  const isReloadingSessionRef = useRef<boolean>(false);

  // Vérifier le statut d'abonnement au montage
  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.id) {
        try {
          const hasSubscription = await hasActiveSubscription();
          // Les admins et utilisateurs spéciaux ont aussi accès à l'IA
          setIsSubscribed(hasSubscription || user?.isAdmin === true || user?.isSpecial === true);
        } catch (error) {
          logger.warn('[CercleDhikr] Erreur lors de la vérification de l\'abonnement:', error);
          setIsSubscribed(false);
        }
      }
    };
    checkSubscription();
  }, [user?.id, user?.isAdmin, user?.isSpecial]);

  // Toujours afficher la page de présentation
  useEffect(() => {
    setShowIntroductionPage(true);
  }, []);

  // Charger les sessions actives et la session de l'utilisateur (différé après interactions)
  useEffect(() => {
    // Afficher immédiatement l'écran, puis charger les données
    setLoading(false);

    InteractionManager.runAfterInteractions(() => {
      async function init() {
        const params = route.params as any;

        // Vérifier si on doit créer une session privée depuis AsmaUlHusna
        if (params?.createPrivateSession && params?.dhikrText && user?.id) {
          try {
            // Créer une session privée avec le nom choisi depuis AsmaUlHusna
            const finalTarget = params.targetCount || 99;
            const newPrivateSession = await createPrivateSession(user.id, finalTarget, params.dhikrText);

            // Recharger les sessions privées
            await loadPrivateSessions();

            // Sélectionner la session créée et afficher la vue active
            setSelectedPrivateSession(newPrivateSession);
            setSelectedSession(null);
            setActiveView('active');

            // Note: On ne nettoie pas les paramètres avec setParams car cela peut causer des erreurs
            // Les paramètres seront ignorés lors des prochains rendus grâce à la vérification ci-dessus
            return;
          } catch (error: any) {
            logger.warn('[CercleDhikr] Erreur lors de la création de la session privée depuis AsmaUlHusna:', error);
            // Continuer avec le chargement normal
          }
        }

        // Vérifier si on doit créer/rejoindre une session commune depuis la page d'accueil
        if (params?.createSession && params?.dhikrText && user?.id) {
          try {
            // Charger d'abord les sessions pour chercher une session commune existante avec ce dhikr
            await loadPrivateSessions();
            const allSessions = await getActiveDhikrSessions();

            // Chercher une session commune existante avec le même dhikr_text
            // Comparer en normalisant les JSON pour éviter les duplications (comparer le texte arabe)
            const existingSession = allSessions.find((s: any) => {
              if (s.is_private === true) return false;
              if (!s.dhikr_text || !params.dhikrText) return false;
              try {
                const parsed = JSON.parse(s.dhikr_text);
                const currentParsed = JSON.parse(params.dhikrText);
                return parsed.arabic === currentParsed.arabic;
              } catch {
                return s.dhikr_text === params.dhikrText;
              }
            });

            // Ne pas rejoindre automatiquement, juste afficher la vue "sessions"
            // L'utilisateur pourra cliquer pour rejoindre s'il le souhaite
            setActiveView('sessions');

            // Si la session n'existe pas, la créer (mais ne pas rejoindre automatiquement)
            if (!existingSession) {
              // Créer une nouvelle session commune avec le dhikr sélectionné
              // Utiliser directement la fonction RPC pour pouvoir spécifier le dhikr_text
              try {
                const finalTarget = params.targetCount || 99;
                const { data: sessionId, error: createError } = supabase ? await supabase.rpc('create_dhikr_session', {
                  p_user_id: user.id,
                  p_dhikr_text: params.dhikrText,
                  p_target_count: finalTarget,
                  p_max_participants: 100,
                  p_is_private: false  // Session publique (commune)
                }) : { data: null, error: new Error('Supabase not available') };

                if (createError) {
                  // Si l'erreur est "déjà dans une autre session", ignorer (l'utilisateur peut être dans plusieurs sessions communes)
                  const errorMessage = createError.message || '';
                  const errorCode = 'code' in createError ? (createError as any).code : null;
                  if (errorMessage.includes('déjà dans une autre session') ||
                    errorCode === 'P0001' ||
                    errorMessage.includes('une seule session publique')) {
                    logger.info('[CercleDhikr] Utilisateur déjà dans une session, continuation...');
                  } else {
                    logger.warn('[CercleDhikr] Erreur lors de la création de la session commune:', createError);
                  }
                }
                // Ne pas rejoindre automatiquement, juste créer la session
              } catch (createError: any) {
                // Si la création échoue (par exemple, l'utilisateur n'est pas admin),
                // on affiche un message et on continue avec le chargement normal
                logger.warn('[CercleDhikr] Erreur lors de la création de la session commune:', createError);
                // Continuer avec le chargement normal
              }
            }

            // Recharger les sessions pour mettre à jour la liste
            await loadSessions();
            // Note: On ne nettoie pas les paramètres avec setParams car cela peut causer des erreurs
            // Les paramètres seront ignorés lors des prochains rendus grâce à la vérification ci-dessus
            return;
          } catch (error: any) {
            logger.warn('[CercleDhikr] Erreur lors de la création/rejoindre automatique de la session:', error);
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
            const { data: sharedSession } = supabase ? await supabase
              .from('dhikr_sessions')
              .select('*')
              .eq('is_private', true)
              .eq('private_session_id', params.inviteSessionId)
              .single() : { data: null };

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
              } as any;

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

        // Créer automatiquement les 2 sessions communes (mêmes dhikr que la carte de l'accueil)
        // - Session duah rabanah du jour
        // - Session dhikr du jour
        // Ces sessions changent toutes les 24h
        if (user?.id) {
          try {
            logger.info('[CercleDhikr] Création des sessions communes pour user:', user.id);
            await checkAndUpdateAllAutoWorldSessions(user.id);
            logger.info('[CercleDhikr] Sessions communes créées/mises à jour');
          } catch (error) {
            logger.warn('[CercleDhikr] Erreur lors de la création des sessions communes:', error);
          }
        } else {
          logger.info('[CercleDhikr] Pas d\'utilisateur connecté, pas de création de sessions communes');
        }

        // Recharger les sessions après création pour afficher les nouvelles sessions
        await loadSessions();

        // Afficher automatiquement la vue des sessions communes si elle contient des sessions
        // pour que l'utilisateur voie les sessions communes dès l'ouverture
        setActiveView('sessions');

        // Ne pas rediriger automatiquement vers une session active
        // L'utilisateur reste sur la vue par défaut (my-sessions ou sessions selon le contexte)
        // Il peut choisir de rejoindre une session s'il le souhaite
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
      const targetDigits = calculatePlaces(selectedSession.target_count ?? 0).length;
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

  // Gérer le mode cœur : arrêter le mode cœur si on quitte la session
  useEffect(() => {
    // Si on n'est plus dans une session active, arrêter le mode cœur
    // Le son sera arrêté automatiquement par HeartModeButton via useEffect
    if (!selectedSession && !selectedPrivateSession) {
      if (heartModeActive) {
        setHeartModeActive(false);
      }
    }
  }, [selectedSession, selectedPrivateSession, heartModeActive]);

  // Gérer le son de battement de cœur
  useEffect(() => {
    if (!heartModeActive) {
      // Arrêter le son si le mode cœur est désactivé
      if (heartSoundRef.current) {
        heartSoundRef.current.pause();
        heartSoundRef.current = null;
      }
      return;
    }

    // Si le mode cœur est activé et qu'on est dans une session
    if ((selectedSession || selectedPrivateSession) && heartModeActive) {
      // Créer un son de battement de cœur simple
      // Note: Pour un vrai son de battement, il faudrait un fichier audio
      // Ici on utilise un intervalle pour simuler le battement
      const heartbeatInterval = setInterval(() => {
        // Utiliser les haptics pour simuler le battement
        try {
          if (Haptics?.impactAsync) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        } catch (error) {
          // Erreur silencieuse
        }
      }, 800); // Battement toutes les 800ms (environ 75 bpm)

      return () => {
        clearInterval(heartbeatInterval);
      };
    }
  }, [heartModeActive, selectedSession, selectedPrivateSession]);

  async function loadSessions() {
    try {
      // Charger toutes les sessions actives
      const data = await getActiveDhikrSessions();
      logger.info(`[CercleDhikr] loadSessions: ${data?.length || 0} session(s) récupérée(s) depuis Supabase`);

      // Log des sessions récupérées pour debug
      if (data && data.length > 0) {
        data.forEach((s: any, idx: number) => {
          logger.info(`[CercleDhikr] Session ${idx + 1}: id=${s.id}, is_auto=${s.is_auto}, is_private=${s.is_private}, is_active=${s.is_active}, is_open=${s.is_open}`);
        });
      }

      // Filtrer pour ne garder que les sessions publiques (is_private = false ou undefined/null)
      // IMPORTANT: Les sessions publiques créées par l'admin doivent apparaître ici,
      // même si l'admin est le créateur. On ne filtre PAS par created_by.
      // IMPORTANT: Pour les sessions automatiques (is_auto = true), garder toutes les sessions actives
      // pour afficher les dhikr du jour (dua rabana et dhikr) dans les sessions communes
      const publicSessions = Array.isArray(data)
        ? data.filter(s => {
          if (!s) return false;
          // Une session est publique si is_private est explicitement false ou n'est pas défini
          const isPrivate = (s as any).is_private;
          const isPublic = isPrivate === false || isPrivate === null || isPrivate === undefined;

          // Pour les sessions automatiques, garder toutes les sessions actives
          // (pas seulement la plus récente, pour afficher les dhikr du jour)
          if ((s as any).is_auto === true) {
            // Garder toutes les sessions automatiques actives
            return isPublic && s.is_active !== false;
          }

          return isPublic;
        })
        : [];

      logger.info(`[CercleDhikr] loadSessions: ${publicSessions.length} session(s) publique(s) après filtrage`);

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

          const allSessions = [...publicSessions, ...invitedAsPublic];
          logger.info(`[CercleDhikr] loadSessions: Total ${allSessions.length} session(s) (${publicSessions.length} publiques + ${invitedAsPublic.length} invitées)`);
          setSessions(allSessions);
        } catch (error) {
          // Erreur silencieuse, utiliser seulement les sessions publiques
          logger.info(`[CercleDhikr] loadSessions: Erreur chargement invitées, ${publicSessions.length} session(s) publiques`);
          setSessions(publicSessions);
        }
      } else {
        logger.info(`[CercleDhikr] loadSessions: Pas d'utilisateur, ${publicSessions.length} session(s) publiques`);
        setSessions(publicSessions);
      }
    } catch (error) {
      logger.error('[CercleDhikr] loadSessions: Erreur globale', error);
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

  // Fonction pour analyser l'intention avec l'IA et créer une session
  async function handleAnalyzeIntention() {
    if (!intention.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre intention');
      return;
    }

    setIsAnalyzingIntention(true);
    setSelectedDhikrIndex(0); // Réinitialiser la sélection
    try {
      const result = await analyzeIntentionForDhikr(intention.trim(), undefined, user?.id);
      setSuggestedDhikr(result);
      trackEvent('dairat_intention_analyzed', {
        dhikrCount: result.dhikrs?.length || 1,
      });
    } catch (error: any) {
      logger.warn('[CercleDhikr] Erreur lors de l\'analyse de l\'intention:', error);
      Alert.alert('Erreur', 'Impossible d\'analyser l\'intention. Veuillez réessayer.');
    } finally {
      setIsAnalyzingIntention(false);
    }
  }

  // Fonction pour créer une session avec le dhikr suggéré par l'IA
  async function createSessionWithSuggestedDhikr() {
    if (!suggestedDhikr || !user?.id || !suggestedDhikr.dhikrs || suggestedDhikr.dhikrs.length === 0) return;

    setIsCreating(true);
    try {
      const target = useCustomTarget && customTarget
        ? parseInt(customTarget)
        : 99;

      // Utiliser le dhikr sélectionné parmi ceux suggérés
      const selectedDhikr = suggestedDhikr.dhikrs[selectedDhikrIndex] || suggestedDhikr.dhikrs[0];

      // Créer le texte dhikr en format JSON pour inclure toutes les infos
      const dhikrText = JSON.stringify({
        arabic: selectedDhikr.arabic,
        transliteration: selectedDhikr.transliteration,
        translation: selectedDhikr.translation,
        reference: selectedDhikr.reference,
      });

      const newPrivateSession = await createPrivateSession(user.id, target, dhikrText);
      setSelectedPrivateSession(newPrivateSession);
      setSelectedSession(null);
      setActiveView('active');

      // Réinitialiser le mode intention
      setShowIntentionMode(false);
      setIntention('');
      setSuggestedDhikr(null);

      // Recharger les sessions privées
      await loadPrivateSessions();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la création de la session');
    } finally {
      setIsCreating(false);
      setCustomTarget('');
      setUseCustomTarget(false);
    }
  }

  // Fonction pour créer une session avec un dhikr spécifique
  async function handleCreateSessionWithDhikr(dhikrText: string) {
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
      // Créer une session privée avec le dhikr donné
      const newPrivateSession = await createPrivateSession(user.id, undefined, dhikrText);

      setPrivateSessions(prev => {
        const updated = Array.isArray(prev) ? [...prev, newPrivateSession] : [newPrivateSession];
        return updated;
      });

      setSelectedPrivateSession(newPrivateSession);
      setActiveView('active');
      setShowIntentionMode(false);
      setSuggestedDhikr(null);
      setIntention('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de créer la session');
    } finally {
      setIsCreating(false);
    }
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

    // Pour les sessions communes (publiques), permettre de rejoindre plusieurs sessions
    // Sans demander de quitter la session actuelle
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

  // Page de présentation complète (avant le module)
  if (showIntroductionPage) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.backgroundSecondary]}
          style={StyleSheet.absoluteFill}
        />
        <GalaxyBackground starCount={80} minSize={1} maxSize={2} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}>
            {/* Header avec bouton retour */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Pressable onPress={() => navigation.goBack()} style={{ padding: 8 }}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </Pressable>
              <View style={{ flex: 1 }} />
            </View>

            {/* Icône centrale */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#A78BFA' + '20',
                borderWidth: 2,
                borderColor: '#A78BFA' + '40',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Sparkles size={40} color="#A78BFA" />
              </View>

              <Text style={{
                fontSize: 28,
                fontWeight: '700',
                color: '#A78BFA',
                textAlign: 'center',
                marginBottom: 4,
              }}>
                🌙 Da'irat an-Nûr ✨
              </Text>
              <Text style={{
                fontSize: 18,
                fontWeight: '500',
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}>
                Le cercle de lumière
              </Text>
            </View>

            {/* Contenu de présentation */}
            <View
              style={{
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 20,
                padding: 24,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Section 1: Introduction */}
              <Text style={{
                fontSize: 16,
                lineHeight: 26,
                color: theme.colors.text,
                marginBottom: 24,
              }}>
                Da'irat an-Nûr est un espace de rappel et de présence, où les cœurs se relient autour du dhikr d'Allah.
              </Text>

              {/* Section 2: Ma session */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#A78BFA', marginBottom: 8 }}>
                  📿 Ma session
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary }}>
                  Tu peux y pratiquer seul(e), à ton rythme, avec le dhikr de ton choix.{'\n'}
                  Choisis un dhikr parmi les formules authentiques issues du Coran et de la Sunna.
                </Text>
              </View>

              {/* Section 3: Session commune */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#A78BFA', marginBottom: 8 }}>
                  🌍 Session commune
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary }}>
                  Tu peux aussi rejoindre une session commune, où des cœurs du monde entier se retrouvent pour réciter ensemble.{'\n'}
                  Chaque compteur s'ajoute à un objectif partagé.
                </Text>
              </View>

              {/* Section 4: Compteur */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#A78BFA', marginBottom: 8 }}>
                  🫀 Le compteur du cœur
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary }}>
                  Un compteur simple t'accompagne : à chaque pression, un dhikr.{'\n'}
                  Ce qui compte, ce n'est pas le nombre, mais la présence du cœur.
                </Text>
              </View>

              {/* Section 5: Types de sessions */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#A78BFA', marginBottom: 8 }}>
                  ✨ Deux modes de session
                </Text>
                <View style={{ marginLeft: 8 }}>
                  <Text style={{ fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary, marginBottom: 8 }}>
                    👉 <Text style={{ fontWeight: '500', color: theme.colors.text }}>Ma session</Text> — Ta pratique personnelle
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary }}>
                    👉 <Text style={{ fontWeight: '500', color: theme.colors.text }}>Session commune</Text> — Rejoindre un cercle mondial
                  </Text>
                </View>
              </View>

              {/* Section 6: Conclusion */}
              <View style={{
                backgroundColor: '#A78BFA' + '15',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: '#A78BFA' + '30',
              }}>
                <Text style={{
                  fontSize: 16,
                  lineHeight: 24,
                  color: theme.colors.text,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}>
                  🤍 Ce n'est pas la quantité qui élève,{'\n'}
                  mais la qualité de la présence.{'\n\n'}
                  Entre dans le cercle avec sincérité,{'\n'}
                  et laisse le dhikr faire son œuvre.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bouton Continuer fixé en bas */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: 24,
          paddingTop: 16,
          backgroundColor: theme.colors.background + 'F0',
        }}>
          <Pressable
            onPress={() => {
              setShowModuleIntroduction(false);
              setShowIntroductionPage(false);
            }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <LinearGradient
              colors={['#A78BFA', '#A78BFADD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#FFFFFF',
              }}>
                Entrer
              </Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
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

                  {/* Mode intention IA pour les abonnés */}
                  {isSubscribed && !showIntentionMode && !suggestedDhikr && (
                    <View style={styles.intentionModeContainer}>
                      <View style={styles.intentionModeHeader}>
                        <StarAnimation size={20} />
                        <Text style={[styles.intentionModeTitle, { color: theme.colors.accent }]}>
                          ✨ Mode Intention
                        </Text>
                      </View>
                      <Text style={[styles.intentionModeDesc, { color: theme.colors.textSecondary }]}>
                        Décrivez votre intention et nous vous suggérerons un dhikr/du'a approprié.
                      </Text>
                      <Pressable
                        onPress={() => setShowIntentionMode(true)}
                        style={({ pressed }) => [
                          styles.intentionModeButton,
                          { backgroundColor: theme.colors.accent + '20', borderColor: theme.colors.accent },
                          pressed && styles.buttonPressed
                        ]}
                      >
                        <StarAnimation size={16} />
                        <Text style={[styles.intentionModeButtonText, { color: theme.colors.accent }]}>
                          ✨ Utiliser
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Formulaire d'intention IA */}
                  {isSubscribed && showIntentionMode && !suggestedDhikr && (
                    <View style={styles.intentionFormContainer}>
                      <View style={styles.intentionFormHeader}>
                        <StarAnimation size={20} />
                        <Text style={[styles.intentionFormTitle, { color: theme.colors.text }]}>
                          Quelle est ton intention ?
                        </Text>
                      </View>
                      <TextInput
                        value={intention}
                        onChangeText={setIntention}
                        placeholder="Ex : me calmer, avoir la force face à une épreuve, remercier Allah..."
                        placeholderTextColor={theme.colors.textSecondary}
                        multiline
                        numberOfLines={3}
                        style={[
                          styles.intentionInput,
                          {
                            backgroundColor: theme.colors.background,
                            color: theme.colors.text,
                            borderColor: theme.colors.textSecondary + '30'
                          }
                        ]}
                        textAlignVertical="top"
                      />
                      <View style={styles.intentionFormButtons}>
                        <Pressable
                          onPress={() => {
                            setShowIntentionMode(false);
                            setIntention('');
                          }}
                          style={({ pressed }) => [
                            styles.intentionCancelButton,
                            { backgroundColor: theme.colors.textSecondary + '20' },
                            pressed && styles.buttonPressed
                          ]}
                        >
                          <Text style={[styles.intentionCancelButtonText, { color: theme.colors.textSecondary }]}>
                            Annuler
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={handleAnalyzeIntention}
                          disabled={isAnalyzingIntention || !intention.trim()}
                          style={({ pressed }) => [
                            styles.intentionSubmitButton,
                            { backgroundColor: theme.colors.accent, opacity: intention.trim() ? 1 : 0.5 },
                            pressed && styles.buttonPressed
                          ]}
                        >
                          {isAnalyzingIntention ? (
                            <ActivityIndicator size="small" color={theme.colors.background} />
                          ) : (
                            <>
                              <StarAnimation size={16} />
                              <Text style={[styles.intentionSubmitButtonText, { color: theme.colors.background }]}>
                                Analyser
                              </Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* Affichage du dhikr suggéré par l'IA */}
                  {isSubscribed && suggestedDhikr && suggestedDhikr.dhikrs && suggestedDhikr.dhikrs.length > 0 && (
                    <View style={styles.suggestedDhikrContainer}>
                      <View style={styles.suggestedDhikrHeader}>
                        <StarAnimation size={20} />
                        <Text style={[styles.suggestedDhikrTitle, { color: theme.colors.accent }]}>
                          Dhikr suggéré par Da'irat an-Nûr
                        </Text>
                      </View>

                      {/* Intention reformulée */}
                      {suggestedDhikr.intentionReformulated && (
                        <View style={[styles.intentionReformulatedBox, { backgroundColor: theme.colors.background, borderLeftColor: theme.colors.accent }]}>
                          <Text style={[styles.intentionReformulatedText, { color: theme.colors.text }]}>
                            {suggestedDhikr.intentionReformulated}
                          </Text>
                        </View>
                      )}

                      {/* Sélection des dhikr (1-3) */}
                      {suggestedDhikr.dhikrs.length > 1 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.dhikrsSelectionContainer}
                          contentContainerStyle={styles.dhikrsSelectionContent}
                        >
                          {suggestedDhikr.dhikrs.map((dhikr, index) => (
                            <Pressable
                              key={index}
                              onPress={() => setSelectedDhikrIndex(index)}
                              style={({ pressed }) => [
                                styles.dhikrOptionCard,
                                {
                                  backgroundColor: theme.colors.background,
                                  borderColor: selectedDhikrIndex === index ? theme.colors.accent : theme.colors.textSecondary + '30',
                                  borderWidth: selectedDhikrIndex === index ? 2 : 1,
                                  opacity: pressed ? 0.8 : 1,
                                }
                              ]}
                            >
                              <View style={styles.dhikrOptionHeader}>
                                <Text style={[styles.dhikrOptionNumber, { color: theme.colors.accent }]}>
                                  {index + 1}
                                </Text>
                                {selectedDhikrIndex === index && (
                                  <View style={[styles.dhikrOptionSelectedBadge, { backgroundColor: theme.colors.accent }]}>
                                    <Text style={[styles.dhikrOptionSelectedText, { color: theme.colors.background }]}>
                                      ✓
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text style={[styles.dhikrOptionArabic, { color: theme.colors.text }]} numberOfLines={2}>
                                {dhikr.arabic}
                              </Text>
                              <Text style={[styles.dhikrOptionTranslation, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                {dhikr.translation.substring(0, 50)}...
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      ) : null}

                      {/* Carte du dhikr sélectionné */}
                      <View style={[styles.suggestedDhikrCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.accent + '40' }]}>
                        <Text style={[styles.suggestedDhikrArabic, { color: theme.colors.text }]}>
                          {suggestedDhikr.dhikrs[selectedDhikrIndex]?.arabic || suggestedDhikr.dhikrs[0].arabic}
                        </Text>
                        {(suggestedDhikr.dhikrs[selectedDhikrIndex]?.transliteration || suggestedDhikr.dhikrs[0].transliteration) && (
                          <Text style={[styles.suggestedDhikrTranslit, { color: theme.colors.textSecondary }]}>
                            {suggestedDhikr.dhikrs[selectedDhikrIndex]?.transliteration || suggestedDhikr.dhikrs[0].transliteration}
                          </Text>
                        )}
                        <Text style={[styles.suggestedDhikrTranslation, { color: theme.colors.text }]}>
                          {suggestedDhikr.dhikrs[selectedDhikrIndex]?.translation || suggestedDhikr.dhikrs[0].translation}
                        </Text>
                        <Text style={[styles.suggestedDhikrReference, { color: theme.colors.accent }]}>
                          {suggestedDhikr.dhikrs[selectedDhikrIndex]?.reference || suggestedDhikr.dhikrs[0].reference}
                        </Text>
                      </View>

                      {/* Conseil de présence */}
                      {suggestedDhikr.presenceAdvice && (
                        <View style={[styles.presenceAdviceBox, { backgroundColor: theme.colors.accent + '10', borderLeftColor: theme.colors.accent }]}>
                          <Text style={[styles.presenceAdviceTitle, { color: theme.colors.accent }]}>
                            💫 Conseil de présence
                          </Text>
                          <Text style={[styles.presenceAdviceText, { color: theme.colors.text }]}>
                            {suggestedDhikr.presenceAdvice}
                          </Text>
                        </View>
                      )}

                      {/* Suggestion de pratique */}
                      {suggestedDhikr.practiceSuggestion && (
                        <View style={[styles.practiceSuggestionBox, { backgroundColor: theme.colors.background }]}>
                          <Text style={[styles.practiceSuggestionText, { color: theme.colors.textSecondary }]}>
                            📿 {suggestedDhikr.practiceSuggestion}
                          </Text>
                        </View>
                      )}

                      <View style={styles.suggestedDhikrButtons}>
                        <Pressable
                          onPress={async () => {
                            if (!intention.trim() || !suggestedDhikr) return;

                            setIsAnalyzingIntention(true);
                            setSelectedDhikrIndex(0); // Réinitialiser la sélection
                            try {
                              // Relancer l'analyse en excluant tous les dhikr déjà suggérés
                              const result = await analyzeIntentionForDhikr(intention.trim(), suggestedDhikr, user?.id);
                              setSuggestedDhikr(result);
                              trackEvent('dairat_intention_alternative', {
                                originalCount: suggestedDhikr.dhikrs?.length || 0,
                                newCount: result.dhikrs?.length || 0,
                              });
                            } catch (error: any) {
                              logger.warn('[CercleDhikr] Erreur lors de l\'analyse de l\'intention:', error);
                              Alert.alert('Erreur', 'Impossible d\'analyser l\'intention. Veuillez réessayer.');
                            } finally {
                              setIsAnalyzingIntention(false);
                            }
                          }}
                          disabled={isAnalyzingIntention || !suggestedDhikr || !intention.trim()}
                          style={({ pressed }) => [
                            styles.suggestedDhikrRetryButton,
                            {
                              backgroundColor: theme.colors.textSecondary + '20',
                              opacity: (isAnalyzingIntention || !suggestedDhikr || !intention.trim()) ? 0.5 : 1
                            },
                            pressed && styles.buttonPressed
                          ]}
                        >
                          {isAnalyzingIntention ? (
                            <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                          ) : (
                            <Text style={[styles.suggestedDhikrRetryButtonText, { color: theme.colors.textSecondary }]}>
                              Autre suggestion
                            </Text>
                          )}
                        </Pressable>
                        <Pressable
                          onPress={createSessionWithSuggestedDhikr}
                          disabled={isCreating || (privateSessions && Array.isArray(privateSessions) && privateSessions.length >= 2)}
                          style={({ pressed }) => [
                            styles.suggestedDhikrConfirmButton,
                            {
                              backgroundColor: (privateSessions && Array.isArray(privateSessions) && privateSessions.length >= 2)
                                ? theme.colors.textSecondary + '30'
                                : theme.colors.accent
                            },
                            pressed && styles.buttonPressed
                          ]}
                        >
                          {isCreating ? (
                            <ActivityIndicator size="small" color={theme.colors.background} />
                          ) : (
                            <Text style={[styles.suggestedDhikrConfirmButtonText, { color: theme.colors.background }]}>
                              Créer la session
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* Séparateur si mode intention non actif */}
                  {isSubscribed && !showIntentionMode && !suggestedDhikr && (
                    <View style={styles.orSeparator}>
                      <View style={[styles.orLine, { backgroundColor: theme.colors.textSecondary + '30' }]} />
                      <Text style={[styles.orText, { color: theme.colors.textSecondary }]}>ou</Text>
                      <View style={[styles.orLine, { backgroundColor: theme.colors.textSecondary + '30' }]} />
                    </View>
                  )}

                  {/* Création classique de session (cachée si mode IA actif) */}
                  {(!isSubscribed || (!showIntentionMode && !suggestedDhikr)) && (
                    <>
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
                    </>
                  )}

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
                          {(() => {
                            const dhikr = parseDhikrText(session.dhikr_text);
                            return (
                              <View>
                                <Text style={[styles.sessionDhikr, { color: theme.colors.text }]} numberOfLines={3} ellipsizeMode="tail">
                                  {dhikr.arabic}
                                </Text>
                                {dhikr.translation && (
                                  <Text style={[styles.sessionDhikrTranslation, { color: theme.colors.textSecondary, fontSize: 11, marginTop: 4, fontStyle: 'italic' }]} numberOfLines={2} ellipsizeMode="tail">
                                    {dhikr.translation}
                                  </Text>
                                )}
                              </View>
                            );
                          })()}
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

              {/* Liste des dhikr disponibles - Dans "Ma Session" */}
              <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary, marginTop: 24 }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 16 }]}>
                  📿 Dhikr disponibles
                </Text>
                <Text style={[styles.helpText, { color: theme.colors.textSecondary, marginBottom: 16, fontSize: 13 }]}>
                  Choisissez un dhikr pour créer une session
                </Text>

                {/* Catégories de dhikr */}
                {(() => {
                  // Catégories de dhikrDatabase
                  const categories: Record<string, { label: string; emoji: string; dhikrs: Dhikr[] }> = {
                    salawat: { label: 'Salat Nabi', emoji: '🌙', dhikrs: [] },
                    morning: { label: 'Matin', emoji: '🌅', dhikrs: [] },
                    evening: { label: 'Soir', emoji: '🌆', dhikrs: [] },
                  };

                  // Organiser les dhikr par catégorie
                  dhikrDatabase.forEach((dhikr) => {
                    if (categories[dhikr.category]) {
                      categories[dhikr.category].dhikrs.push(dhikr);
                    }
                  });

                  // Catégories de dhikr authentiques avec sous-catégories
                  const authenticSubCategories: Record<string, { label: string; emoji: string; dhikrs: AuthenticDhikr[] }> = {
                    base: { label: 'Dhikr de base', emoji: '🕊️', dhikrs: [] },
                    coranique: { label: 'Dhikr coraniques explicites', emoji: '📖', dhikrs: [] },
                    tawhid: { label: 'Dhikr de tawḥīd et de confiance', emoji: '🤍', dhikrs: [] },
                    pardon: { label: 'Dhikr de pardon et purification', emoji: '🌧️', dhikrs: [] },
                    paix: { label: 'Dhikr de paix et d\'apaisement', emoji: '🕊️', dhikrs: [] },
                    lumiere: { label: 'Dhikr de lumière et de guidance', emoji: '✨', dhikrs: [] },
                    protection: { label: 'Dhikr de protection', emoji: '🛡️', dhikrs: [] },
                    cloture: { label: 'Dhikr de clôture et remise', emoji: '🌙', dhikrs: [] },
                  };

                  // Organiser les dhikr authentiques par sous-catégorie
                  AUTHENTIC_DHIKR.forEach((dhikr) => {
                    if (authenticSubCategories[dhikr.category]) {
                      authenticSubCategories[dhikr.category].dhikrs.push(dhikr);
                    }
                  });

                  // Filtrer les catégories vides
                  const categoriesWithDhikr = Object.entries(categories).filter(([_, category]) => category.dhikrs.length > 0);
                  const authenticCategoriesWithDhikr = Object.entries(authenticSubCategories).filter(([_, category]) => category.dhikrs.length > 0);

                  return (
                    <>
                      {/* Catégorie principale : Dhikr authentiques */}
                      {authenticCategoriesWithDhikr.length > 0 && (
                        <View style={styles.dhikrCategoryContainer}>
                          <View style={[styles.dhikrCategoryHeader, { backgroundColor: theme.colors.background }]}>
                            <View style={styles.dhikrCategoryHeaderContent}>
                              <Text style={[styles.dhikrCategoryEmoji, { fontSize: 20 }]}>
                                📿
                              </Text>
                              <Text style={[styles.dhikrCategoryLabel, { color: theme.colors.text, fontSize: 16, fontWeight: '700' }]} numberOfLines={1} ellipsizeMode="tail">
                                Dhikr authentiques
                              </Text>

                            </View>
                          </View>

                          {/* Sous-catégories des dhikr authentiques */}
                          {authenticCategoriesWithDhikr.map(([subCategoryKey, subCategory]) => {
                            const isSubExpanded = expandedAuthenticSubCategory === subCategoryKey;

                            return (
                              <View key={subCategoryKey} style={styles.dhikrSubCategoryContainer}>
                                <Pressable
                                  onPress={() => setExpandedAuthenticSubCategory(isSubExpanded ? null : subCategoryKey)}
                                  style={({ pressed }) => [
                                    styles.dhikrCategoryHeader,
                                    {
                                      backgroundColor: theme.colors.background,
                                      marginLeft: 12,
                                      marginTop: 8
                                    },
                                    pressed && styles.buttonPressed
                                  ]}
                                >
                                  <View style={styles.dhikrCategoryHeaderContent}>
                                    <Text style={[styles.dhikrCategoryEmoji, { fontSize: 18 }]}>
                                      {subCategory.emoji}
                                    </Text>
                                    <Text style={[styles.dhikrCategoryLabel, { color: theme.colors.text, fontSize: 14 }]} numberOfLines={1} ellipsizeMode="tail">
                                      {subCategory.label}
                                    </Text>
                                    <Text style={[styles.dhikrCategoryCount, { color: theme.colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                                      ({subCategory.dhikrs.length})
                                    </Text>
                                  </View>
                                  {isSubExpanded ? (
                                    <ChevronUp size={18} color={theme.colors.textSecondary} />
                                  ) : (
                                    <ChevronDown size={18} color={theme.colors.textSecondary} />
                                  )}
                                </Pressable>

                                {isSubExpanded && (
                                  <View style={styles.dhikrListContainer}>
                                    {subCategory.dhikrs.map((dhikr, index) => {
                                      const dhikrText = JSON.stringify({
                                        arabic: dhikr.arabic,
                                        transliteration: dhikr.transliteration,
                                        translation: dhikr.translation,
                                      });

                                      return (
                                        <Pressable
                                          key={`${subCategoryKey}-${index}`}
                                          onPress={() => handleCreateSessionWithDhikr(dhikrText)}
                                          style={({ pressed }) => [
                                            styles.dhikrItem,
                                            {
                                              backgroundColor: theme.colors.background,
                                              borderColor: theme.colors.textSecondary + '20',
                                              opacity: pressed ? 0.7 : 1,
                                              marginLeft: 12
                                            }
                                          ]}
                                        >
                                          <View style={styles.dhikrItemContent}>
                                            <Text style={[styles.dhikrItemArabic, { color: theme.colors.text }]} numberOfLines={3} ellipsizeMode="tail">
                                              {dhikr.arabic}
                                            </Text>
                                            {dhikr.transliteration && (
                                              <Text style={[styles.dhikrItemTranslit, { color: theme.colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                                                {dhikr.transliteration}
                                              </Text>
                                            )}
                                            {dhikr.translation && (
                                              <Text style={[styles.dhikrItemTranslation, { color: theme.colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                                                {dhikr.translation}
                                              </Text>
                                            )}
                                          </View>
                                          <View style={styles.dhikrItemAction}>
                                            <Plus size={16} color={theme.colors.accent} />
                                          </View>
                                        </Pressable>
                                      );
                                    })}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Catégories de dhikrDatabase */}
                      {categoriesWithDhikr.map(([categoryKey, category]) => {
                        const isExpanded = expandedDhikrCategory === categoryKey;

                        return (
                          <View key={categoryKey} style={styles.dhikrCategoryContainer}>
                            <Pressable
                              onPress={() => setExpandedDhikrCategory(isExpanded ? null : categoryKey)}
                              style={({ pressed }) => [
                                styles.dhikrCategoryHeader,
                                { backgroundColor: theme.colors.background },
                                pressed && styles.buttonPressed
                              ]}
                            >
                              <View style={styles.dhikrCategoryHeaderContent}>
                                <Text style={[styles.dhikrCategoryEmoji, { fontSize: 20 }]}>
                                  {category.emoji}
                                </Text>
                                <Text style={[styles.dhikrCategoryLabel, { color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                                  {category.label}
                                </Text>
                                <Text style={[styles.dhikrCategoryCount, { color: theme.colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                                  ({category.dhikrs.length})
                                </Text>
                              </View>
                              {isExpanded ? (
                                <ChevronUp size={20} color={theme.colors.textSecondary} />
                              ) : (
                                <ChevronDown size={20} color={theme.colors.textSecondary} />
                              )}
                            </Pressable>

                            {isExpanded && (
                              <View style={styles.dhikrListContainer}>
                                {category.dhikrs.map((dhikr) => {
                                  const dhikrText = JSON.stringify({
                                    arabic: dhikr.arabic,
                                    transliteration: dhikr.transliteration,
                                    translation: dhikr.translation,
                                  });

                                  return (
                                    <Pressable
                                      key={dhikr.id}
                                      onPress={() => handleCreateSessionWithDhikr(dhikrText)}
                                      style={({ pressed }) => [
                                        styles.dhikrItem,
                                        {
                                          backgroundColor: theme.colors.background,
                                          borderColor: theme.colors.textSecondary + '20',
                                          opacity: pressed ? 0.7 : 1
                                        }
                                      ]}
                                    >
                                      <View style={styles.dhikrItemContent}>
                                        <Text style={[styles.dhikrItemArabic, { color: theme.colors.text }]} numberOfLines={3} ellipsizeMode="tail">
                                          {dhikr.arabic}
                                        </Text>
                                        {dhikr.transliteration && (
                                          <Text style={[styles.dhikrItemTranslit, { color: theme.colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                                            {dhikr.transliteration}
                                          </Text>
                                        )}
                                        {dhikr.translation && (
                                          <Text style={[styles.dhikrItemTranslation, { color: theme.colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                                            {dhikr.translation}
                                          </Text>
                                        )}
                                      </View>
                                      <View style={styles.dhikrItemAction}>
                                        <Text style={[styles.dhikrItemCount, { color: theme.colors.accent }]} numberOfLines={1} ellipsizeMode="tail">
                                          {dhikr.count}x
                                        </Text>
                                        <Plus size={16} color={theme.colors.accent} />
                                      </View>
                                    </Pressable>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </>
                  );
                })()}
              </View>
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

              {/* Message si aucune session */}
              {(!sessions || sessions.length === 0) && (
                <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary, alignItems: 'center', padding: 24 }]}>
                  <Text style={[styles.cardTitle, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
                    Aucune session commune disponible
                  </Text>
                  <Text style={[{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 14 }]}>
                    Les sessions communes sont créées automatiquement. Veuillez patienter ou réessayer.
                  </Text>
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
                const isCommonSession = (session as any).is_auto === true;

                return (
                  <View key={session.id} style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionInfo}>
                        <View style={styles.sessionTitleRow}>
                          {/* Ne pas afficher session_name pour les sessions communes (is_auto) */}
                          {session.session_name && !isCommonSession && (
                            <Text style={[styles.sessionName, { color: theme.colors.accent, marginBottom: 4, fontSize: 16, fontWeight: '600' }]} numberOfLines={1} ellipsizeMode="tail">
                              {session.session_name}
                            </Text>
                          )}
                          {/* Badge pour distinguer session commune */}
                          {isCommonSession && (
                            <View style={[styles.commonSessionBadge, { backgroundColor: theme.colors.accent + '20', borderColor: theme.colors.accent }]}>
                              <Text style={[styles.commonSessionBadgeText, { color: theme.colors.accent }]} numberOfLines={1} ellipsizeMode="tail">
                                🌍 {session.session_name || 'Session commune'}
                              </Text>
                            </View>
                          )}
                        </View>
                        {(() => {
                          const dhikr = parseDhikrText(session.dhikr_text);
                          return (
                            <View>
                              <Text style={[styles.sessionDhikr, { color: theme.colors.text }]} numberOfLines={3} ellipsizeMode="tail">
                                {dhikr.arabic}
                              </Text>
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
                    {/* Afficher session_name même pour les sessions communes (is_auto) */}
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
                    {/* Bouton Quitter - Caché pour les sessions automatiques (communes) */}
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

                {/* Mode Cœur Button */}
                <View style={styles.heartModeContainer}>
                  <HeartModeButton
                    heartModeActive={heartModeActive}
                    setHeartModeActive={setHeartModeActive}
                    theme={theme}
                  />
                </View>

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
                    {(() => {
                      const dhikr = parseDhikrText(selectedPrivateSession.dhikr_text);
                      return (
                        <View>
                          <Text style={[styles.sessionDhikr, { color: theme.colors.text, fontSize: 20 }]}>
                            {dhikr.arabic}
                          </Text>
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
                    <Text style={[styles.sessionMeta, { color: theme.colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
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
                          // Format: https://nurayna.com/dhikr/invite/SESSION_ID?token=TOKEN
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
                {/* Mode Cœur Button pour session privée */}
                <View style={styles.heartModeContainer}>
                  <HeartModeButton
                    heartModeActive={heartModeActive}
                    setHeartModeActive={setHeartModeActive}
                    theme={theme}
                  />
                </View>

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

      {/* Modal d'introduction du module Da'irat an-Nûr */}
      <ModuleIntroductionModal
        visible={showModuleIntroduction}
        onClose={async () => {
          await markModuleIntroductionAsSeen(MODULE_KEYS.DAIRAT_AN_NUR);
          setShowModuleIntroduction(false);
        }}
        title="🌙 Da'irat an-Nûr ✨"
        icon={<Sparkles size={36} color="#A78BFA" />}
        color="#A78BFA"
        content={MODULE_INTRODUCTIONS.DAIRAT_AN_NUR}
        buttonText="Commencer"
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
    textAlign: 'right', // Alignement à droite pour l'arabe
    lineHeight: 32, // Meilleure lisibilité pour l'arabe
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
  heartModeContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  heartModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  heartModeText: {
    fontSize: 16,
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
  // Styles pour le mode intention IA
  intentionModeContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  intentionModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  intentionModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  intentionModeDesc: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 12,
    lineHeight: 20,
  },
  intentionModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  intentionModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  intentionFormContainer: {
    marginBottom: 16,
  },
  intentionFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  intentionFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  intentionInput: {
    minHeight: 80,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 12,
  },
  intentionFormButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  intentionCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  intentionCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  intentionSubmitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  intentionSubmitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  suggestedDhikrContainer: {
    marginBottom: 16,
  },
  suggestedDhikrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestedDhikrTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  suggestedDhikrCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  suggestedDhikrArabic: {
    fontSize: 24,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
    writingDirection: 'rtl',
  },
  suggestedDhikrTranslit: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  suggestedDhikrTranslation: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  suggestedDhikrReference: {
    fontSize: 12,
    fontFamily: 'System',
    textAlign: 'center',
    fontWeight: '600',
  },
  suggestedDhikrExplanation: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  dhikrCategoryContainer: {
    marginBottom: 12,
  },
  dhikrCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dhikrCategoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dhikrCategoryEmoji: {
    fontSize: 20,
  },
  dhikrCategoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
  dhikrCategoryCount: {
    fontSize: 13,
    fontFamily: 'System',
  },
  dhikrListContainer: {
    gap: 8,
    marginTop: 4,
  },
  dhikrItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  dhikrItemContent: {
    flex: 1,
    marginRight: 12,
  },
  dhikrItemArabic: {
    fontSize: 18,
    fontFamily: 'System',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dhikrItemTranslit: {
    fontSize: 13,
    fontFamily: 'System',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  dhikrItemTranslation: {
    fontSize: 12,
    fontFamily: 'System',
    lineHeight: 16,
  },
  dhikrItemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dhikrItemCount: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  dhikrSubCategoryContainer: {
    marginTop: 4,
  },
  suggestedDhikrExplanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  suggestedDhikrExplanationText: {
    fontSize: 14,
    fontFamily: 'System',
    lineHeight: 20,
  },
  suggestedDhikrButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  suggestedDhikrRetryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  suggestedDhikrRetryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  suggestedDhikrConfirmButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  suggestedDhikrConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  // Nouveaux styles pour Da'irat an-Nûr
  intentionReformulatedBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  intentionReformulatedText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  dhikrsSelectionContainer: {
    marginBottom: 12,
  },
  dhikrsSelectionContent: {
    gap: 12,
    paddingHorizontal: 4,
  },
  dhikrOptionCard: {
    width: 160,
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  dhikrOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dhikrOptionNumber: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  dhikrOptionSelectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhikrOptionSelectedText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  dhikrOptionArabic: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 6,
    fontFamily: 'System',
  },
  dhikrOptionTranslation: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'System',
  },
  presenceAdviceBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  presenceAdviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'System',
  },
  presenceAdviceText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  practiceSuggestionBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  practiceSuggestionText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'System',
  },
  orSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  sessionDhikrTranslit: {
    fontFamily: 'System',
    lineHeight: 22,
    textAlign: 'left',
  },
  sessionDhikrTranslation: {
    fontFamily: 'System',
    lineHeight: 22,
    textAlign: 'left',
  },
  sessionDhikrReference: {
    fontFamily: 'System',
    lineHeight: 18,
    textAlign: 'left',
    fontWeight: '500',
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  sessionName: {
    // Style déjà défini inline
  },
  commonSessionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  commonSessionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

