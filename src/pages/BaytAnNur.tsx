import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDimensions } from '@/hooks/useDimensions';
import { useAudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Play,
  Pause,
  X,
  Trees,
  CloudRain,
  Flame,
  Sun,
  VolumeX,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { BackButton } from '@/components/BackButton';
import { AmbianceCard } from '@/components/AmbianceCard';
import { KhalwaToast, useKhalwaToast } from '@/components/KhalwaToast';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import {
  divineNames,
  DivineName,
  suggestDivineName,
  getRandomDivineName,
  soundAmbiances,
  soundAmbianceFiles,
  availableDurations,
  BreathingType,
  getAmbianceTheme,
  AmbianceTheme,
} from '@/data/khalwaData';
import { saveKhalwaSession } from '@/services/khalwaStorage';

type Screen =
  | 'welcome'
  | 'intention'
  | 'divine-name'
  | 'sound'
  | 'duration'
  | 'breathing'
  | 'guidance'
  | 'preparation'
  | 'session'
  | 'completion';

interface KhalwaSession {
  intention: string;
  divineName: DivineName;
  soundAmbiance: string;
  duration: number; // en minutes
  breathingType: BreathingType;
  guided: boolean;
  suggestedDivineName?: DivineName;
}

// Mapping des IDs d'ambiance vers les icônes Lucide React Native
const ambianceIconMap: Record<string, typeof Trees> = {
  forest: Trees,
  pluie: CloudRain,
  'feu-de-bois': Flame,
  desert: Sun,
  'neige-faina': CloudRain, // Utiliser CloudRain pour la neige (icône similaire)
  silence: VolumeX,
};

/**
 * Page principale Bayt An Nûr - Mode Khalwa
 * Module complet de retraite intérieure avec guidage
 */
export function BaytAnNur() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, saveCompletedTasks } = useUser();
  const theme = getTheme(user?.theme || 'default');
  
  // Thème d'ambiance actuel - basé sur l'ambiance sélectionnée ou silence par défaut
  // Utiliser l'ambiance sélectionnée même si elle n'est pas encore validée pour changer le thème immédiatement
  const [selectedAmbianceForTheme, setSelectedAmbianceForTheme] = React.useState<string>('silence');
  

  // Paramètres depuis la navigation (pour les défis)
  const routeParams = (route.params as any) || {};
  const fromChallenge = routeParams.fromChallenge === true;
  const challengeId = routeParams.challengeId;
  const dayParam = routeParams.day;
  const taskIndexParam = routeParams.taskIndex;
  const divineNameId = routeParams.divineNameId;
  const khalwaName = routeParams.khalwaName; // Nom original du khalwa depuis la tâche

  // Initialiser l'écran et la session directement depuis les paramètres
  const getInitialScreen = (): Screen => {
    // Si on vient d'un défi avec un nom divin, passer directement à la durée
    if (fromChallenge && divineNameId) {
      const divineName = divineNames.find((n) => n.id === divineNameId);
      if (divineName) {
        return 'duration';
      }
    }
    // Si on vient d'un défi sans nom divin (ne devrait pas arriver pour une tâche kalwa)
    if (fromChallenge) {
      return 'intention';
    }
    // Si on a un nom divin mais qu'on ne vient pas d'un défi
    if (divineNameId) {
      const divineName = divineNames.find((n) => n.id === divineNameId);
      if (divineName) {
        return 'divine-name';
      }
    }
    return 'welcome';
  };

  const getInitialDivineName = (): DivineName | undefined => {
    if (divineNameId) {
      const baseDivineName = divineNames.find((n) => n.id === divineNameId);
      if (baseDivineName && khalwaName) {
        // Si on a un nom original de khalwa, créer une copie avec la transliteration du nom original
        // S'assurer que toutes les propriétés sont copiées, y compris meaning et meaningEn
        return {
          ...baseDivineName,
          transliteration: khalwaName, // Utiliser le nom original pour l'affichage
          meaning: baseDivineName.meaning, // Conserver la traduction française
          meaningEn: baseDivineName.meaningEn, // Conserver la traduction anglaise
        };
      }
      return baseDivineName;
    }
    return undefined;
  };

  const [currentScreen, setCurrentScreen] = useState<Screen>(getInitialScreen());
  const initialDivineName = getInitialDivineName();
  const [session, setSession] = useState<Partial<KhalwaSession>>({
    divineName: initialDivineName ? {
      ...initialDivineName,
      meaning: initialDivineName.meaning || '',
      meaningEn: initialDivineName.meaningEn || '',
    } : undefined,
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // en secondes
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [feeling, setFeeling] = useState('');
  const [audioSource, setAudioSource] = useState<string | number | null>(null);

  // Thème d'ambiance actuel - basé sur l'ambiance sélectionnée ou silence par défaut
  // Déplacé après la déclaration de session pour éviter l'erreur "used before declaration"
  const currentAmbianceTheme = React.useMemo(() => {
    // Utiliser l'ambiance sélectionnée pour le thème, ou celle de la session si elle existe
    const ambianceId = session?.soundAmbiance || selectedAmbianceForTheme || 'silence';
    return getAmbianceTheme(ambianceId);
  }, [session?.soundAmbiance, selectedAmbianceForTheme]);

  // Utiliser useAudioPlayer au niveau du composant (hook React)
  // On utilise une source vide initialement, puis on la met à jour via setAudioSource
  const audioPlayer = useAudioPlayer(audioSource || '');

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const guidanceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastGuidanceTimeRef = useRef<number>(0);
  const sessionStartedRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const { currentMessage, showMessage, closeMessage } = useKhalwaToast();
  const [showStopModal, setShowStopModal] = useState(false);

  // Nettoyer les timers et l'audio au démontage
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (guidanceIntervalRef.current) {
        clearInterval(guidanceIntervalRef.current);
      }
      // Mettre à jour les refs pour empêcher le gestionnaire ended de relancer l'audio
      sessionStartedRef.current = false;
      isPausedRef.current = false;
      // Libérer l'audio en mettant la source à null
      // useAudioPlayer gère automatiquement la libération du player
      setAudioSource(null);
    };
  }, []);

  // Gérer le player audio quand la source change
  useEffect(() => {
    if (audioPlayer && audioSource) {
      try {
        audioPlayer.loop = true;
        audioPlayer.volume = 0.5;
        if (sessionStarted && !isPaused) {
          audioPlayer.play();
        }
      } catch (error) {
        // Erreur silencieuse en production
        // Le player peut être invalide si la source a changé
      }
    }
  }, [audioSource, audioPlayer, sessionStarted, isPaused]);

  const saveSession = React.useCallback(async () => {
    if (!user?.id || !session?.divineName || !session?.duration) {
      // Session incomplète, impossible de sauvegarder
      return;
    }

    try {
      // Calculer la durée réelle en secondes
      const initialDurationSeconds = (session.duration || 10) * 60;
      const actualDurationSeconds = initialDurationSeconds - timeRemaining;
      // Convertir en minutes pour la compatibilité avec la base de données
      // On stocke en minutes mais avec précision décimale pour les secondes
      const actualDurationMinutes = actualDurationSeconds / 60;

      // Sauvegarder la session dans Supabase
      const sessionId = await saveKhalwaSession(user.id, {
        intention: session.intention,
        divineName: session.divineName,
        soundAmbiance: session?.soundAmbiance || 'silence',
        duration: actualDurationMinutes, // Durée réelle en minutes (avec décimales pour les secondes)
        breathingType: session.breathingType || 'libre',
        guided: session.guided ?? true,
        feeling: feeling || undefined,
        completed: true,
      });

      if (sessionId) {
        // Session sauvegardée avec succès
      }

      // Si on vient d'un défi, marquer la tâche comme complétée
      if (fromChallenge && challengeId && dayParam !== undefined && taskIndexParam !== undefined) {
        const day = typeof dayParam === 'number' ? dayParam : parseInt(String(dayParam), 10);
        const taskIndex =
          typeof taskIndexParam === 'number'
            ? taskIndexParam
            : parseInt(String(taskIndexParam), 10);
        if (!isNaN(day) && !isNaN(taskIndex)) {
          // Récupérer les tâches complétées actuelles pour ce jour
          const savedTasks = user?.challenge40Days?.completedTasks?.find((t) => t.day === day);
          const taskIndices = savedTasks ? [...savedTasks.taskIndices] : [];

          // Ajouter la tâche si elle n'est pas déjà complétée
          if (!taskIndices.includes(taskIndex)) {
            taskIndices.push(taskIndex);
            saveCompletedTasks(day, taskIndices);
          }
        }
      }
    } catch (error) {
      // Erreur silencieuse en production
    }
  }, [user, session, feeling, timeRemaining, fromChallenge, challengeId, dayParam, taskIndexParam, saveCompletedTasks]);

  const handleSessionEnd = React.useCallback(() => {
    setSessionStarted(false);
    sessionStartedRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    // Arrêter l'audio en mettant la source à null
    // useAudioPlayer gère automatiquement la libération du player
    setAudioSource(null);
    setCurrentScreen('completion');

    // Sauvegarder la session
    saveSession();
  }, [saveSession]);

  // Gérer le timer de session
  useEffect(() => {
    if (currentScreen === 'session' && sessionStarted && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Fin de session
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [currentScreen, sessionStarted, isPaused, handleSessionEnd]);

  // Gérer le guidage audio pendant la session
  useEffect(() => {
    if (
      currentScreen === 'session' &&
      sessionStarted &&
      session.guided &&
      !isPaused &&
      timeRemaining > 0
    ) {
      const duration = session.duration || 10;
      const totalSeconds = duration * 60;
      const guidanceInterval = 150; // Toutes les 2 minutes 30 (150 secondes)

      const checkGuidance = () => {
        const elapsed = totalSeconds - timeRemaining;

        // Messages de guidage selon le temps écoulé
        if (elapsed > 0 && elapsed < 30 && lastGuidanceTimeRef.current === 0) {
          // Début de session (0-30 sec) - une seule fois
          showGuidanceMessage(
            'Ferme doucement les yeux… Rappelle ton intention… Inspire… expire… tu es en sécurité avec Allah.'
          );
          lastGuidanceTimeRef.current = elapsed;
        } else if (
          elapsed >= guidanceInterval &&
          elapsed - lastGuidanceTimeRef.current >= guidanceInterval
        ) {
          // Rappels réguliers
          const messages = [
            'Reste avec ton souffle.',
            `Rappelle le Nom : ${session.divineName?.transliteration || 'Allah'}.`,
            'Allah voit tes efforts, reste présent.',
            'Laisse-toi porter par la paix.',
            'Tu es dans un espace de sécurité.',
          ];
          const message = messages[Math.floor(Math.random() * messages.length)];
          showGuidanceMessage(message);
          lastGuidanceTimeRef.current = elapsed;
        } else if (
          timeRemaining <= 30 &&
          timeRemaining > 0 &&
          lastGuidanceTimeRef.current < totalSeconds - 30
        ) {
          // 30 secondes avant la fin - une seule fois
          showGuidanceMessage(
            'Ta session se termine dans quelques instants. Remercie Allah pour ce moment de paix et de connexion.'
          );
          lastGuidanceTimeRef.current = totalSeconds - 30;
        } else if (
          timeRemaining <= 60 &&
          timeRemaining > 30 &&
          lastGuidanceTimeRef.current < totalSeconds - 60
        ) {
          // 1 minute avant la fin - une seule fois
          showGuidanceMessage(
            'On arrive à la fin de ce moment. Reprends conscience de ton corps, de la pièce où tu es. Remercie Allah pour ces instants. Quand tu seras prêt, tu pourras ouvrir les yeux.'
          );
          lastGuidanceTimeRef.current = totalSeconds - 60;
        }
      };

      guidanceIntervalRef.current = setInterval(checkGuidance, 1000);
    } else {
      if (guidanceIntervalRef.current) {
        clearInterval(guidanceIntervalRef.current);
        guidanceIntervalRef.current = null;
      }
      if (currentScreen !== 'session') {
        lastGuidanceTimeRef.current = 0;
      }
    }

    return () => {
      if (guidanceIntervalRef.current) {
        clearInterval(guidanceIntervalRef.current);
      }
    };
  }, [
    currentScreen,
    sessionStarted,
    session.guided,
    isPaused,
    timeRemaining,
    session.divineName,
    session.duration,
    showMessage,
  ]);

  const showGuidanceMessage = (message: string) => {
    showMessage(message);
  };

  // Fonction helper pour obtenir l'URI du fichier audio
  const getAudioUri = async (ambianceId: string): Promise<number | string | null> => {
    const audioFile = soundAmbianceFiles[ambianceId];
    if (!audioFile) return null;

    // Si c'est déjà une URI complète (http/https), l'utiliser directement
    if (audioFile.startsWith('http://') || audioFile.startsWith('https://')) {
      return audioFile;
    }

    // Pour les fichiers locaux dans assets/sounds/, utiliser require()
    // Mapping des fichiers audio
    try {
      const audioMap: Record<string, any> = {
        'pluie': require('../../assets/sounds/pluie.mp4'),
        'forest': require('../../assets/sounds/forêt.mp4'),
        'desert': require('../../assets/sounds/desert.mp4'),
        'feu-de-bois': require('../../assets/sounds/feu de bois.mp4'),
        'neige-faina': require('../../assets/sounds/faina.mp3'),
      };

      const audioModule = audioMap[ambianceId];
      if (!audioModule) return null;

      // Charger l'asset et obtenir son URI local
      const asset = Asset.fromModule(audioModule);
      await asset.downloadAsync();
      return asset.localUri || audioModule;
    } catch (error) {
      // Erreur silencieuse en production
      return null;
    }
  };

  const handleStartSession = async () => {
    if (!session?.duration || !session?.divineName) return;

    setTimeRemaining((session?.duration || 10) * 60);
    setSessionStarted(true);
    sessionStartedRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    lastGuidanceTimeRef.current = 0;
    setCurrentScreen('session');

    // Démarrer l'ambiance sonore si sélectionnée
    if (session?.soundAmbiance && session.soundAmbiance !== 'silence') {
      const audioUri = await getAudioUri(session.soundAmbiance);
      if (audioUri) {
        try {
          // Libérer l'ancien player en mettant la source à null
          // useAudioPlayer gère automatiquement la libération
          setAudioSource(null);
          
          // Attendre un peu pour que le player soit libéré
          await new Promise(resolve => setTimeout(resolve, 100));

          // Mettre à jour la source audio (le hook useAudioPlayer se mettra à jour automatiquement)
          const source = typeof audioUri === 'number' ? audioUri : audioUri;
          setAudioSource(source);
        } catch (err) {
          // Erreur silencieuse en production
          // Continuer même si l'audio ne peut pas être chargé
        }
      }
    }
  };

  const handlePause = async () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    isPausedRef.current = newPausedState;
    if (audioPlayer && audioSource) {
      try {
        if (newPausedState) {
          // Mettre en pause
          audioPlayer.pause();
        } else {
          // Reprendre la lecture
          audioPlayer.play();
        }
      } catch (err) {
        // Erreur silencieuse en production
      }
    }
  };

  const handleStop = () => {
    setShowStopModal(true);
  };

  const confirmStop = () => {
    setShowStopModal(false);
    setSessionStarted(false);
    sessionStartedRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    setTimeRemaining(0);
    // Libérer l'audio en mettant la source à null
    // useAudioPlayer gère automatiquement la libération du player
    setAudioSource(null);
    setCurrentScreen('completion');
  };

  const cancelStop = () => {
    setShowStopModal(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleIntentionSubmit = (intention: string) => {
    setSession((prev) => ({ ...prev, intention }));
    // Suggérer un nom divin basé sur l'intention
    const suggestedName = suggestDivineName(intention);
    setSession((prev) => ({ ...prev, suggestedDivineName: suggestedName }));
    setCurrentScreen('divine-name');
  };

  const handleDivineNameConfirm = (name: DivineName) => {
    // Trouver le nom divin complet dans la liste pour s'assurer d'avoir toutes les propriétés
    const completeNameFromList = divineNames.find(n => n.id === name.id);
    const completeName: DivineName = completeNameFromList || {
      ...name,
      meaning: name.meaning || '',
      meaningEn: name.meaningEn || '',
    };
    setSession((prev) => ({ ...prev, divineName: completeName }));
    setCurrentScreen('sound');
  };

  const handleSoundSelect = (soundId: string) => {
    setSelectedAmbianceForTheme(soundId); // Mettre à jour le thème immédiatement
    setSession((prev) => ({ ...prev, soundAmbiance: soundId }));
  };

  const handleValidateTheme = () => {
    if (session?.soundAmbiance) {
      setCurrentScreen('duration');
    }
  };

  const handleDurationSelect = (duration: number) => {
    setSession((prev) => ({ ...prev, duration }));
    // Si on vient d'un défi, passer directement à la préparation
    if (fromChallenge && session?.divineName) {
      const finalAmbiance = session?.soundAmbiance || 'silence';
      setSession((prev) => ({
        ...prev,
        duration,
        soundAmbiance: finalAmbiance,
        breathingType: prev.breathingType || 'libre',
        guided: prev.guided ?? false,
      }));
      setCurrentScreen('preparation');
    } else {
      setCurrentScreen('breathing');
    }
  };

  const handleBreathingSelect = (breathing: BreathingType) => {
    setSession((prev) => ({ ...prev, breathingType: breathing }));
    setCurrentScreen('guidance');
  };

  const handleGuidanceSelect = (guided: boolean) => {
    setSession((prev) => ({ ...prev, guided }));
    setCurrentScreen('preparation');
  };

  // Rendre l'écran approprié
  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onStart={() => setCurrentScreen('intention')} ambianceTheme={currentAmbianceTheme} />;
      case 'intention':
        if (fromChallenge && session.divineName) {
          // Si on vient d'un défi avec un nom divin, passer à l'écran suivant
          return null;
        }
        return (
          <IntentionScreen
            onNext={handleIntentionSubmit}
            initialIntention={session.intention || ''}
            ambianceTheme={currentAmbianceTheme}
          />
        );
      case 'divine-name':
        if (fromChallenge && session.divineName) {
          // Si on vient d'un défi avec un nom divin, passer à l'écran suivant
          return null;
        }
        return (
          <DivineNameScreen
            suggestedName={session.suggestedDivineName || getRandomDivineName()}
            onConfirm={handleDivineNameConfirm}
            onRequestAnother={() => {
              const newName = getRandomDivineName();
              setSession((prev) => ({ ...prev, suggestedDivineName: newName }));
            }}
            ambianceTheme={currentAmbianceTheme}
          />
        );
      case 'sound':
        return (
          <SoundScreen
            selectedSound={session?.soundAmbiance}
            onSelect={handleSoundSelect}
            onValidate={handleValidateTheme}
            ambianceTheme={currentAmbianceTheme}
          />
        );
      case 'duration':
        return (
          <DurationScreen
            selectedDuration={session.duration}
            onSelect={handleDurationSelect}
            skipToSession={fromChallenge && !!session.divineName}
            divineName={session.divineName}
            ambianceTheme={currentAmbianceTheme}
          />
        );
      case 'breathing':
        return (
          <BreathingScreen
            selectedBreathing={session.breathingType}
            onSelect={handleBreathingSelect}
            ambianceTheme={currentAmbianceTheme}
          />
        );
      case 'guidance':
        return (
          <GuidanceScreen
            guided={session.guided ?? true}
            onSelect={handleGuidanceSelect}
            ambianceTheme={currentAmbianceTheme}
          />
        );
      case 'preparation':
        return (
          <PreparationScreen
            onReady={handleStartSession}
            onCancel={() => setCurrentScreen('guidance')}
            ambianceTheme={currentAmbianceTheme}
          />
        );
      case 'session':
        return (
          <SessionScreen
            session={session as KhalwaSession}
            timeRemaining={timeRemaining}
            isPaused={isPaused}
            onPause={handlePause}
            onStop={handleStop}
            breathingType={session.breathingType || 'libre'}
            guidanceMessage={currentMessage}
          />
        );
      case 'completion':
        return (
          <CompletionScreen
            feeling={feeling}
            onFeelingChange={setFeeling}
            onFinish={() => {
              // Si on vient d'un défi, retourner vers le défi
              if (fromChallenge && challengeId) {
                navigation.navigate('Challenge40Days' as never);
              } else {
                navigation.goBack();
              }
            }}
            onRestart={() => {
              setSession({});
              setFeeling('');
              setCurrentScreen('welcome');
            }}
            onViewStats={() => navigation.navigate('KhalwaStats' as never)}
            ambianceTheme={currentAmbianceTheme}
          />
        );
      default:
        return null;
    }
  };

  // Si on est sur l'écran de session, ne pas afficher le wrapper normal
  if (currentScreen === 'session') {
    return (
      <>
        {renderScreen()}
        {/* Toast pour les messages de guidage - masqué pendant la session */}
        {(currentScreen as Screen) !== 'session' && (
          <KhalwaToast message={currentMessage} onClose={closeMessage} />
        )}
        
        {/* Modal personnalisé pour arrêter la session - doit être rendu même en session */}
        <Modal
          visible={showStopModal}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelStop}
          statusBarTranslucent={true}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={cancelStop}
            activeOpacity={1}
          >
            <Pressable 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                style={[
                  styles.modalContainer,
                  {
                    backgroundColor: currentAmbianceTheme.cardBackground,
                    borderColor: currentAmbianceTheme.cardBorderColor,
                  },
                ]}
              >
                <Text style={[styles.modalTitle, { color: currentAmbianceTheme.textColor }]}>
                  Arrêter la session
                </Text>
                <Text style={[styles.modalMessage, { color: currentAmbianceTheme.textSecondaryColor }]}>
                  Voulez-vous vraiment arrêter la session ?
                </Text>
                <View style={styles.modalButtons}>
                  <Pressable
                    onPress={cancelStop}
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.modalButtonCancel,
                      {
                        backgroundColor: currentAmbianceTheme.buttonBackground,
                        borderColor: currentAmbianceTheme.cardBorderColor,
                      },
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={[styles.modalButtonText, { color: currentAmbianceTheme.buttonTextColor }]}>
                      Annuler
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={confirmStop}
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.modalButtonConfirm,
                      {
                        backgroundColor: 'rgba(220, 38, 38, 0.2)',
                        borderColor: 'rgba(220, 38, 38, 0.4)',
                      },
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={[styles.modalButtonText, { color: '#fca5a5' }]}>
                      Arrêter
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  // Convertir le gradient CSS en couleurs pour LinearGradient
  const getGradientColors = (gradientString: string): [string, string, ...string[]] => {
    const colors = gradientString.match(/#[0-9A-Fa-f]{6}/g) || ['#0A0F2C', '#1E1E2F'];
    // S'assurer qu'on a au moins 2 couleurs pour LinearGradient
    if (colors.length < 2) {
      return ['#0A0F2C', '#1E1E2F'];
    }
    return colors as [string, string, ...string[]];
  };

  const gradientColors = getGradientColors(currentAmbianceTheme.backgroundGradient);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />

      <SafeAreaView style={styles.container} edges={['top']}>
        {(currentScreen as Screen) !== 'session' && (
          <View style={styles.header}>
            <BackButton />
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderScreen()}
        </ScrollView>
      </SafeAreaView>

      {/* Toast pour les messages de guidage - masqué pendant la session */}
      {(currentScreen as Screen) !== 'session' && (
        <KhalwaToast message={currentMessage} onClose={closeMessage} />
      )}

      {/* Modal personnalisé pour arrêter la session */}
      <Modal
        visible={showStopModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelStop}
        statusBarTranslucent={true}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={cancelStop}
          activeOpacity={1}
        >
          <Pressable 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              style={[
                styles.modalContainer,
                {
                  backgroundColor: currentAmbianceTheme.cardBackground,
                  borderColor: currentAmbianceTheme.cardBorderColor,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: currentAmbianceTheme.textColor }]}>
                Arrêter la session
              </Text>
              <Text style={[styles.modalMessage, { color: currentAmbianceTheme.textSecondaryColor }]}>
                Voulez-vous vraiment arrêter la session ?
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  onPress={cancelStop}
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalButtonCancel,
                    {
                      backgroundColor: currentAmbianceTheme.buttonBackground,
                      borderColor: currentAmbianceTheme.cardBorderColor,
                    },
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.modalButtonText, { color: currentAmbianceTheme.buttonTextColor }]}>
                    Annuler
                  </Text>
                </Pressable>
                <Pressable
                  onPress={confirmStop}
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalButtonConfirm,
                    {
                      backgroundColor: 'rgba(220, 38, 38, 0.2)',
                      borderColor: 'rgba(220, 38, 38, 0.4)',
                    },
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.modalButtonText, { color: '#fca5a5' }]}>
                    Arrêter
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Composants pour chaque écran

function WelcomeScreen({ onStart, ambianceTheme }: { onStart: () => void; ambianceTheme: AmbianceTheme }) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withSpring(0, { damping: 20 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.screenContainer, animatedStyle]}>
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeEmoji}>🕯️</Text>
        <Text style={[styles.welcomeTitle, { color: ambianceTheme.textColor }]}>Bayt An Nûr</Text>
        <Text style={[styles.welcomeSubtitle, { color: ambianceTheme.textSecondaryColor }]}>
          Mode Khalwa
        </Text>

        <View style={[styles.welcomeCard, { backgroundColor: ambianceTheme.cardBackground }]}>
          <Text style={[styles.welcomeText, { color: ambianceTheme.textColor }]}>
            Bienvenue dans Bayt An Nûr, ton refuge intérieur.{'\n'}
            On va créer ensemble un moment rien que pour toi.
          </Text>
        </View>

        <Pressable
          onPress={onStart}
          style={({ pressed }) => [
            styles.startButton,
            { backgroundColor: ambianceTheme.buttonBackground },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.startButtonText, { color: ambianceTheme.buttonTextColor }]}>Commencer</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function IntentionScreen({
  onNext,
  initialIntention,
  ambianceTheme,
}: {
  onNext: (intention: string) => void;
  initialIntention: string;
  ambianceTheme: AmbianceTheme;
}) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [intention, setIntention] = useState(initialIntention);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withSpring(0, { damping: 20 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.screenContainer, animatedStyle]}>
      <Text style={[styles.screenTitle, { color: ambianceTheme.textColor }]}>
        Avant de commencer, dis-moi :
      </Text>

      <Text style={[styles.screenSubtitle, { color: ambianceTheme.textSecondaryColor }]}>
        Quelle est ton intention pour ce moment ?
      </Text>

      <View style={[styles.intentionCard, { backgroundColor: ambianceTheme.cardBackground }]}>
        <TextInput
          value={intention}
          onChangeText={setIntention}
          placeholder="Ex : me calmer, lâcher une peur, remercier Allah…"
          placeholderTextColor={ambianceTheme.textSecondaryColor}
          multiline
          numberOfLines={4}
          style={[styles.intentionInput, { color: ambianceTheme.textColor }]}
          textAlignVertical="top"
        />
      </View>

          <Pressable
        onPress={() => intention.trim() && onNext(intention.trim())}
        disabled={!intention.trim()}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: ambianceTheme.buttonBackground, opacity: intention.trim() ? 1 : 0.5 },
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.primaryButtonText, { color: ambianceTheme.buttonTextColor }]}>Valider l'intention</Text>
          </Pressable>
    </Animated.View>
  );
}

function DivineNameScreen({
  suggestedName,
  onConfirm,
  onRequestAnother,
  ambianceTheme,
}: {
  suggestedName: DivineName;
  onConfirm: (name: DivineName) => void;
  onRequestAnother: () => void;
  ambianceTheme: AmbianceTheme;
}) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withSpring(0, { damping: 20 });
  }, [suggestedName]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  // Convertir le gradient CSS en couleurs pour LinearGradient
  const getGradientColors = (gradientString: string): [string, string, ...string[]] => {
    const colors = gradientString.match(/#[0-9A-Fa-f]{6}/g) || [ambianceTheme.primaryColor, ambianceTheme.accentColor];
    // S'assurer qu'on a au moins 2 couleurs pour LinearGradient
    if (colors.length < 2) {
      return [ambianceTheme.primaryColor, ambianceTheme.accentColor];
    }
    return colors as [string, string, ...string[]];
  };

  const gradientColors = getGradientColors(ambianceTheme.backgroundGradient);

  return (
    <Animated.View style={[styles.screenContainer, animatedStyle]}>
      <Text style={[styles.screenTitle, { color: ambianceTheme.textColor }]}>
        Pour ce moment, je te propose de t'accompagner avec :
      </Text>

      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.divineNameCard, { backgroundColor: ambianceTheme.cardBackground }]}
      >
        <View style={styles.divineNameRow}>
          <Text style={[styles.divineNameArabic, { color: ambianceTheme.textColor }]}>{suggestedName.arabic}</Text>
          <Text style={[styles.divineNameSeparator, { color: ambianceTheme.accentColor }]}>–</Text>
          <Text style={[styles.divineNameTransliteration, { color: ambianceTheme.accentColor }]}>{suggestedName.transliteration}</Text>
        </View>
        <Text style={[styles.divineNameMeaning, { color: ambianceTheme.textSecondaryColor }]}>{suggestedName.meaning}</Text>
      </LinearGradient>

      <View style={styles.buttonGroup}>
        <Pressable
          onPress={() => onConfirm(suggestedName)}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: ambianceTheme.buttonBackground },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: ambianceTheme.buttonTextColor }]}>Je confirme ce Nom</Text>
        </Pressable>

              <Pressable
          onPress={onRequestAnother}
                style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: ambianceTheme.cardBackground, borderColor: ambianceTheme.cardBorderColor },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: ambianceTheme.textColor }]}>
            Propose-moi un autre Nom
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function SoundScreen({
  selectedSound,
  onSelect,
  onValidate,
  ambianceTheme,
}: {
  selectedSound?: string;
  onSelect: (soundId: string) => void;
  onValidate: () => void;
  ambianceTheme: AmbianceTheme;
}) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  
  // Filtrer les ambiances selon le rôle utilisateur
  // L'ambiance "Neige (ambiance Faïna)" est réservée aux admins et utilisateurs spéciaux
  const availableAmbiances = soundAmbiances.filter((a) => {
    // Ambiance secrète : seulement pour admins et utilisateurs spéciaux
    if (a.id === 'neige-faina') {
      return user?.isAdmin === true || user?.isSpecial === true;
    }
    
    // Toutes les autres ambiances (y compris silence) : pour tous
    return true;
  });
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withSpring(0, { damping: 20 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  // Obtenir le thème de l'ambiance sélectionnée ou utiliser le thème par défaut
  const getAmbianceThemeForCard = (ambianceId: string) => {
    return getAmbianceTheme(ambianceId);
  };

  return (
    <Animated.View style={[styles.screenContainer, animatedStyle]}>
      <View style={styles.soundHeader}>
        <Text style={[styles.soundTitle, { color: ambianceTheme.textColor }]}>بيت النور</Text>
        <Text style={[styles.soundSubtitle, { color: ambianceTheme.textSecondaryColor }]}>
          Mode Khalwa
        </Text>
        <Text style={[styles.soundDescription, { color: ambianceTheme.textSecondaryColor }]}>
          Retraite Spirituelle
        </Text>
      </View>

      <Text style={[styles.soundSectionTitle, { color: ambianceTheme.textColor }]}>
        Choisissez votre ambiance
      </Text>

      <View style={styles.ambianceGrid}>
        {availableAmbiances.map((ambiance) => {
          const Icon = ambianceIconMap[ambiance.id] || Trees;
          const isActive = selectedSound === ambiance.id;
          const cardTheme = getAmbianceThemeForCard(ambiance.id);

          return (
            <AmbianceCard
              key={ambiance.id}
              title={ambiance.name}
              description={ambiance.description}
              icon={Icon}
              isActive={isActive}
              onClick={() => onSelect(ambiance.id)}
              ambianceTheme={cardTheme}
            />
          );
        })}
      </View>

      {selectedSound && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.validateButtonContainer}>
          <Pressable
            onPress={onValidate}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: ambianceTheme.buttonBackground },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: ambianceTheme.buttonTextColor }]}>Valider le thème</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function DurationScreen({
  selectedDuration,
  onSelect,
  skipToSession = false,
  divineName,
  ambianceTheme,
}: {
  selectedDuration?: number;
  onSelect: (duration: number) => void;
  skipToSession?: boolean;
  divineName?: DivineName;
  ambianceTheme: AmbianceTheme;
}) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  
  // Convertir le gradient CSS en couleurs pour LinearGradient
  const getGradientColors = (gradientString: string): [string, string, ...string[]] => {
    const colors = gradientString.match(/#[0-9A-Fa-f]{6}/g) || [ambianceTheme.primaryColor, ambianceTheme.accentColor];
    // S'assurer qu'on a au moins 2 couleurs pour LinearGradient
    if (colors.length < 2) {
      return [ambianceTheme.primaryColor, ambianceTheme.accentColor];
    }
    return colors as [string, string, ...string[]];
  };
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withSpring(0, { damping: 20 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.screenContainer, animatedStyle]}>
      {skipToSession && divineName && (
        <View style={styles.divineNamePreview}>
          <Text style={[styles.divineNamePreviewText, { color: ambianceTheme.textSecondaryColor }]}>
            Pour ce moment, tu seras accompagné avec :
          </Text>
          <LinearGradient
            colors={getGradientColors(ambianceTheme.backgroundGradient)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.divineNamePreviewCard, { backgroundColor: ambianceTheme.cardBackground }]}
          >
            {divineName.arabic && divineName.arabic !== divineName.transliteration && (
              <Text style={[styles.divineNamePreviewArabic, { color: ambianceTheme.textColor }]}>{divineName.arabic}</Text>
            )}
            <Text style={[styles.divineNamePreviewTransliteration, { color: ambianceTheme.accentColor }]}>
              {divineName.transliteration}
            </Text>
          </LinearGradient>
        </View>
      )}

      <Text style={[styles.screenTitle, { color: ambianceTheme.textColor }]}>
        {skipToSession
          ? 'Choisis la durée de ta khalwa :'
          : 'Combien de temps veux-tu rester dans Bayt An Nûr ?'}
      </Text>

      <View style={styles.durationGrid}>
        {availableDurations.map((duration) => (
          <Pressable
            key={duration}
            onPress={() => onSelect(duration)}
            style={({ pressed }) => [
              styles.durationButton,
                  {
                    backgroundColor:
                  selectedDuration === duration
                    ? ambianceTheme.buttonBackground
                    : ambianceTheme.cardBackground,
                borderColor:
                  selectedDuration === duration
                    ? ambianceTheme.cardBorderColor
                    : ambianceTheme.cardBorderColor,
                  },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                styles.durationButtonText,
                    {
                      color:
                    selectedDuration === duration ? ambianceTheme.buttonTextColor : ambianceTheme.textColor,
                    },
                  ]}
                >
              {duration} min
                </Text>
              </Pressable>
            ))}
          </View>

      {selectedDuration && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Pressable
            onPress={() => onSelect(selectedDuration)}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: ambianceTheme.buttonBackground },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: ambianceTheme.buttonTextColor }]}>Continuer</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function BreathingScreen({
  selectedBreathing,
  onSelect,
  ambianceTheme,
}: {
  selectedBreathing?: BreathingType;
  onSelect: (breathing: BreathingType) => void;
  ambianceTheme: AmbianceTheme;
}) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withSpring(0, { damping: 20 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const breathingOptions = [
    {
      type: 'libre' as BreathingType,
      icon: '🟢',
      title: 'Souffle libre',
      description: 'Tu respires à ton rythme, sans compter.',
    },
    {
      type: '4-4' as BreathingType,
      icon: '🔵',
      title: 'Souffle 4–4',
      description: 'Inspire 4 secondes… expire 4 secondes.',
    },
    {
      type: '3-6-9' as BreathingType,
      icon: '🟣',
      title: 'Souffle 3–6–9',
      description: 'Inspire 3… retiens 6… expire 9, pour un calme profond.',
    },
  ];

  return (
    <Animated.View style={[styles.screenContainer, animatedStyle]}>
      <Text style={[styles.screenTitle, { color: ambianceTheme.textColor }]}>
        Choisis ton rythme de souffle :
      </Text>

      <View style={styles.breathingOptions}>
        {breathingOptions.map((option) => (
          <Pressable
            key={option.type}
            onPress={() => onSelect(option.type)}
            style={({ pressed }) => [
              styles.breathingOption,
              {
                backgroundColor:
                  selectedBreathing === option.type
                    ? ambianceTheme.buttonBackground
                    : ambianceTheme.cardBackground,
                borderColor:
                  selectedBreathing === option.type
                    ? ambianceTheme.cardBorderColor
                    : ambianceTheme.cardBorderColor,
              },
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.breathingOptionContent}>
              <Text style={styles.breathingOptionIcon}>{option.icon}</Text>
              <View style={styles.breathingOptionText}>
                <Text
            style={[
                    styles.breathingOptionTitle,
              {
                      color:
                        selectedBreathing === option.type ? ambianceTheme.buttonTextColor : ambianceTheme.textColor,
              },
            ]}
          >
                  {option.title}
            </Text>
                <Text
                  style={[
                    styles.breathingOptionDescription,
                    {
                      color:
                        selectedBreathing === option.type
                          ? ambianceTheme.textSecondaryColor
                          : ambianceTheme.textSecondaryColor,
                    },
                  ]}
                >
                  {option.description}
                </Text>
              </View>
              {selectedBreathing === option.type && (
                <View style={styles.breathingOptionCheck}>
                  <View style={styles.breathingOptionCheckInner} />
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>

      {selectedBreathing && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Pressable
            onPress={() => onSelect(selectedBreathing)}
              style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: ambianceTheme.buttonBackground },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: ambianceTheme.buttonTextColor }]}>Continuer</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function GuidanceScreen({
  guided,
  onSelect,
  ambianceTheme,
}: {
  guided: boolean;
  onSelect: (guided: boolean) => void;
  ambianceTheme: AmbianceTheme;
}) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withSpring(0, { damping: 20 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.screenContainer, animatedStyle]}>
      <Text style={[styles.screenTitle, { color: ambianceTheme.textColor }]}>
        Veux-tu que je te guide pendant la session ?
      </Text>

      <View style={styles.guidanceOptions}>
        <Pressable
          onPress={() => onSelect(true)}
          style={({ pressed }) => [
            styles.guidanceOption,
            {
              backgroundColor: guided ? ambianceTheme.buttonBackground : ambianceTheme.cardBackground,
              borderColor: guided ? ambianceTheme.cardBorderColor : ambianceTheme.cardBorderColor,
                },
                pressed && styles.buttonPressed,
              ]}
            >
          <View style={styles.guidanceOptionContent}>
            <Text style={styles.guidanceOptionIcon}>✅</Text>
            <View style={styles.guidanceOptionText}>
              <Text
                style={[
                  styles.guidanceOptionTitle,
                  { color: guided ? ambianceTheme.buttonTextColor : ambianceTheme.textColor },
                ]}
              >
                Oui, je veux un guidage d'Ayna.
                  </Text>
              <Text
                style={[
                  styles.guidanceOptionDescription,
                  {
                    color: guided
                      ? ambianceTheme.textSecondaryColor
                      : ambianceTheme.textSecondaryColor,
                  },
                ]}
              >
                Ayna parle au début + rappels toutes les X minutes.
                  </Text>
            </View>
            {guided && (
              <View style={styles.guidanceOptionCheck}>
                <View style={styles.guidanceOptionCheckInner} />
              </View>
            )}
          </View>
        </Pressable>

        <Pressable
          onPress={() => onSelect(false)}
          style={({ pressed }) => [
            styles.guidanceOption,
            {
              backgroundColor: !guided ? ambianceTheme.buttonBackground : ambianceTheme.cardBackground,
              borderColor: !guided ? ambianceTheme.cardBorderColor : ambianceTheme.cardBorderColor,
            },
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.guidanceOptionContent}>
            <Text style={styles.guidanceOptionIcon}>⭕</Text>
            <View style={styles.guidanceOptionText}>
              <Text
            style={[
                  styles.guidanceOptionTitle,
                  { color: !guided ? ambianceTheme.buttonTextColor : ambianceTheme.textColor },
                ]}
              >
                Non, je préfère être en silence.
              </Text>
              <Text
                style={[
                  styles.guidanceOptionDescription,
                  {
                    color: !guided
                      ? ambianceTheme.textSecondaryColor
                      : ambianceTheme.textSecondaryColor,
              },
            ]}
          >
                Seulement son d'ambiance + timer discret.
              </Text>
            </View>
            {!guided && (
              <View style={styles.guidanceOptionCheck}>
                <View style={styles.guidanceOptionCheckInner} />
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <Pressable
        onPress={() => onSelect(guided)}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: ambianceTheme.buttonBackground },
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.primaryButtonText, { color: ambianceTheme.buttonTextColor }]}>Continuer</Text>
      </Pressable>
    </Animated.View>
  );
}

function PreparationScreen({
  onReady,
  onCancel,
  ambianceTheme,
}: {
  onReady: () => void;
  onCancel: () => void;
  ambianceTheme: AmbianceTheme;
}) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withSpring(0, { damping: 20 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.screenContainer, animatedStyle]}>
      <Text style={[styles.screenTitle, { color: ambianceTheme.textColor }]}>
        Prépare-toi pour ta khalwa
      </Text>

      <View style={[styles.preparationCard, { backgroundColor: ambianceTheme.cardBackground }]}>
        <View style={styles.preparationList}>
          <View style={styles.preparationItem}>
            <Text style={styles.preparationBullet}>•</Text>
            <Text style={[styles.preparationText, { color: ambianceTheme.textColor }]}>
              Mets-toi dans un endroit calme
            </Text>
          </View>
          <View style={styles.preparationItem}>
            <Text style={styles.preparationBullet}>•</Text>
            <Text style={[styles.preparationText, { color: ambianceTheme.textColor }]}>
              Fais tes ablutions si possible
            </Text>
          </View>
          <View style={styles.preparationItem}>
            <Text style={styles.preparationBullet}>•</Text>
            <Text style={[styles.preparationText, { color: ambianceTheme.textColor }]}>
              Désactive les notifications
            </Text>
          </View>
          <View style={styles.preparationItem}>
            <Text style={styles.preparationBullet}>•</Text>
            <Text style={[styles.preparationText, { color: ambianceTheme.textColor }]}>
              L'expérience est encore plus forte avec des écouteurs ou un casque
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.preparationHint, { color: ambianceTheme.textSecondaryColor }]}>
        Quand tu es prêt, on commence.
      </Text>

      <View style={styles.buttonGroup}>
        <Pressable
          onPress={onReady}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: ambianceTheme.buttonBackground },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: ambianceTheme.buttonTextColor }]}>Je suis prêt</Text>
        </Pressable>

        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: ambianceTheme.cardBackground, borderColor: ambianceTheme.cardBorderColor },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: ambianceTheme.textColor }]}>
            Annuler / Revenir
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function SessionScreen({
  session,
  timeRemaining,
  isPaused,
  onPause,
  onStop,
  breathingType,
  guidanceMessage,
}: {
  session: KhalwaSession;
  timeRemaining: number;
  isPaused: boolean;
  onPause: () => void;
  onStop: () => void;
  breathingType: BreathingType;
  guidanceMessage: string | null;
}) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { width, height } = useDimensions();
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | null>(null);
  const [breathingCount, setBreathingCount] = useState(0);
  const breathingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Vérifier que session existe
  if (!session) {
    return null;
  }

  // Obtenir le thème selon l'ambiance sélectionnée
  const ambianceTheme = getAmbianceTheme(session?.soundAmbiance || 'silence');

  // S'assurer que le nom divin a toutes les propriétés en le récupérant depuis la liste complète
  const completeDivineName = React.useMemo(() => {
    if (!session?.divineName) return null;
    // Toujours récupérer le nom divin complet depuis la liste pour garantir toutes les propriétés
    const fullName = divineNames.find(n => n.id === session.divineName.id);
    if (fullName) {
      // Conserver la transliteration de la session si elle est différente (pour les noms personnalisés)
      return {
        ...fullName,
        transliteration: session.divineName.transliteration || fullName.transliteration,
      };
    }
    return session.divineName;
  }, [session?.divineName]);

  // Convertir le gradient CSS en couleurs pour LinearGradient
  const getGradientColors = (gradientString: string): [string, string, ...string[]] => {
    // Extraire les couleurs du gradient CSS
    const colors = gradientString.match(/#[0-9A-Fa-f]{6}/g) || ['#0A0F2C', '#1E1E2F'];
    // S'assurer qu'on a au moins 2 couleurs pour LinearGradient
    if (colors.length < 2) {
      return ['#0A0F2C', '#1E1E2F'];
    }
    return colors as [string, string, ...string[]];
  };

  const gradientColors = getGradientColors(ambianceTheme.backgroundGradient);

  // Gérer le cycle de respiration selon le type
  useEffect(() => {
    if (isPaused) {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
        breathingIntervalRef.current = null;
      }
      return;
    }

    if (breathingType === '4-4') {
      let phase: 'inhale' | 'exhale' = 'inhale';
      let count = 0;

      breathingIntervalRef.current = setInterval(() => {
        count++;
        if (phase === 'inhale' && count >= 4) {
          phase = 'exhale';
          count = 0;
        } else if (phase === 'exhale' && count >= 4) {
          phase = 'inhale';
          count = 0;
        }
        setBreathingPhase(phase);
        setBreathingCount(count);
      }, 1000);
    } else if (breathingType === '3-6-9') {
      let phase: 'inhale' | 'hold' | 'exhale' = 'inhale';
      let count = 0;

      breathingIntervalRef.current = setInterval(() => {
        count++;
        if (phase === 'inhale' && count >= 3) {
          phase = 'hold';
          count = 0;
        } else if (phase === 'hold' && count >= 6) {
          phase = 'exhale';
          count = 0;
        } else if (phase === 'exhale' && count >= 9) {
          phase = 'inhale';
          count = 0;
        }
        setBreathingPhase(phase);
        setBreathingCount(count);
      }, 1000);
    } else {
      setBreathingPhase(null);
    }

    return () => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
      }
    };
  }, [breathingType, isPaused]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingText = () => {
    if (breathingType === 'libre') return null;
    if (breathingType === '4-4') {
      if (breathingPhase === 'inhale') return `Inspire... ${breathingCount}`;
      if (breathingPhase === 'exhale') return `Expire... ${breathingCount}`;
    }
    if (breathingType === '3-6-9') {
      if (breathingPhase === 'inhale') return `Inspire... ${breathingCount}`;
      if (breathingPhase === 'hold') return `Retiens... ${breathingCount}`;
      if (breathingPhase === 'exhale') return `Expire... ${breathingCount}`;
    }
    return null;
  };

  const breathingScale = useSharedValue(1);
  const breathingOpacity = useSharedValue(1);

  useEffect(() => {
    if (breathingPhase === 'inhale') {
      breathingScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    } else if (breathingPhase === 'exhale') {
      breathingScale.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      breathingScale.value = 1;
    }
  }, [breathingPhase]);

  const breathingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }],
    opacity: breathingOpacity.value,
  }));

  // Animation pour les icônes décoratives
  const decorativeIcons = ambianceTheme.decorativeIcons;
  const iconAnimations = useRef(
    decorativeIcons.map(() => ({
      translateY: useSharedValue(0),
      opacity: useSharedValue(0.1),
      scale: useSharedValue(1),
    }))
  ).current;

  useEffect(() => {
    iconAnimations.forEach((anim, index) => {
      anim.translateY.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: 3000 + index * 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 3000 + index * 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      anim.opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 3000 + index * 500 }),
          withTiming(0.1, { duration: 3000 + index * 500 })
        ),
        -1,
        false
      );
      anim.scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 3000 + index * 500 }),
          withTiming(1, { duration: 3000 + index * 500 })
        ),
        -1,
        false
      );
    });
  }, []);

  return (
    <View style={styles.sessionWrapper}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

      {/* Icônes décoratives animées selon le thème */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {decorativeIcons.map((icon, index) => {
          const anim = iconAnimations[index];
          // Calculer les positions en pixels au lieu de pourcentages pour éviter l'erreur d'animation native
          const leftPercent = 10 + (index * 15) % 80;
          const topPercent = 10 + (index * 20) % 70;
          const leftPx = (width * leftPercent) / 100;
          const topPx = (height * topPercent) / 100;
          
          const iconStyle = useAnimatedStyle(() => ({
            transform: [
              { translateY: anim.translateY.value },
              { scale: anim.scale.value },
            ],
            opacity: anim.opacity.value,
          }));

          return (
            <Animated.View
              key={index}
              style={[
                styles.decorativeIcon,
                {
                  left: leftPx,
                  top: topPx,
                },
                iconStyle,
              ]}
            >
              <Text style={styles.decorativeIconText}>{icon}</Text>
            </Animated.View>
          );
        })}
          </View>

      <SafeAreaView style={styles.sessionContainer} edges={['top', 'bottom']}>
        <View style={styles.sessionContent}>
          {/* Nom divin - au-dessus du minuteur */}
          {completeDivineName && (
            <View style={styles.divineNameSessionContainer}>
              <Text
            style={[
                  styles.divineNameSessionLabel,
                  { color: ambianceTheme.textSecondaryColor },
                ]}
              >
                Avec :
              </Text>
              {completeDivineName.arabic &&
                completeDivineName.arabic !== completeDivineName.transliteration && (
                  <Text
                    style={[
                      styles.divineNameSessionArabic,
                      { color: ambianceTheme.textColor },
                    ]}
                  >
                    {completeDivineName.arabic}
                  </Text>
                )}
              <Text style={[styles.divineNameSessionTransliteration, { color: ambianceTheme.accentColor }]}>
                {completeDivineName.transliteration}
              </Text>
              {/* Traductions FR et EN */}
              {(completeDivineName.meaning || completeDivineName.meaningEn) && (
                <View style={styles.divineNameTranslations}>
                  {completeDivineName.meaning && (
                    <Text style={[styles.divineNameTranslation, { color: ambianceTheme.textSecondaryColor }]}>
                      {completeDivineName.meaning}
                    </Text>
                  )}
                  {completeDivineName.meaningEn && (
                    <Text style={[styles.divineNameTranslation, { color: ambianceTheme.textSecondaryColor }]}>
                      {completeDivineName.meaningEn}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { color: ambianceTheme.textColor }]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>

          {/* Visualisation selon l'ambiance et le nom divin */}
          {session?.divineName?.visualizations && session?.soundAmbiance && (
            (() => {
              const visualization = session.divineName.visualizations[session.soundAmbiance];
              if (visualization) {
                return (
                  <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={[
                      styles.guidanceMessageContainer,
                      {
                        backgroundColor: ambianceTheme.cardBackground,
                        borderColor: ambianceTheme.cardBorderColor,
                        marginBottom: guidanceMessage ? 12 : 0,
                      },
                    ]}
                  >
                    <Text style={[styles.guidanceMessageText, { color: ambianceTheme.textColor }]}>
                      {visualization}
                    </Text>
                  </Animated.View>
                );
              }
              return null;
            })()
          )}

          {/* Message de guidage de l'IA */}
          {guidanceMessage && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              style={[
                styles.guidanceMessageContainer,
                {
                  backgroundColor: ambianceTheme.cardBackground,
                  borderColor: ambianceTheme.cardBorderColor,
                },
              ]}
            >
              <Text style={[styles.guidanceMessageText, { color: ambianceTheme.textColor }]}>
                {guidanceMessage}
              </Text>
            </Animated.View>
          )}

          {/* Indicateur de respiration */}
          {breathingType !== 'libre' && breathingPhase && (
            <View style={styles.breathingIndicator}>
              <Animated.View style={breathingAnimatedStyle}>
                <Text style={styles.breathingEmoji}>
                  {breathingPhase === 'inhale'
                    ? '🌬️'
                    : breathingPhase === 'exhale'
                    ? '💨'
                    : '⏸️'}
                </Text>
              </Animated.View>
              {getBreathingText() && (
              <Text
                  style={[
                    styles.breathingText,
                    { color: ambianceTheme.textSecondaryColor },
                  ]}
                >
                  {getBreathingText()}
              </Text>
              )}
          </View>
          )}
        </View>

        {/* Boutons de contrôle - fixés en bas */}
        <View style={styles.sessionControls}>
          <Pressable
            onPress={onPause}
            style={({ pressed }) => [
              styles.sessionControlButton,
              {
                backgroundColor: ambianceTheme.buttonBackground,
                borderColor: ambianceTheme.cardBorderColor,
              },
              pressed && styles.buttonPressed,
            ]}
          >
            {isPaused ? (
              <Play size={16} color={ambianceTheme.buttonTextColor} />
            ) : (
              <Pause size={16} color={ambianceTheme.buttonTextColor} />
            )}
            <Text
              style={[
                styles.sessionControlButtonText,
                { color: ambianceTheme.buttonTextColor },
              ]}
            >
              {isPaused ? 'Reprendre' : 'Pause'}
            </Text>
          </Pressable>

          <Pressable
            onPress={onStop}
            style={({ pressed }) => [
              styles.sessionControlButton,
              {
                backgroundColor: 'rgba(220, 38, 38, 0.2)',
                borderColor: 'rgba(220, 38, 38, 0.4)',
              },
              pressed && styles.buttonPressed,
            ]}
          >
            <X size={16} color="#fca5a5" />
            <Text style={[styles.sessionControlButtonText, { color: '#fca5a5' }]}>Arrêter</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function CompletionScreen({
  feeling,
  onFeelingChange,
  onFinish,
  onRestart,
  onViewStats,
  ambianceTheme,
}: {
  feeling: string;
  onFeelingChange: (feeling: string) => void;
  onFinish: () => void;
  onRestart: () => void;
  onViewStats: () => void;
  ambianceTheme: AmbianceTheme;
}) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withSpring(0, { damping: 20 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.screenContainer, animatedStyle]}>
      <View style={styles.completionHeader}>
        <Text style={styles.completionEmoji}>🕯️</Text>
        <Text style={[styles.completionTitle, { color: ambianceTheme.textColor }]}>
          Ta session dans Bayt An Nûr est terminée
        </Text>
      </View>

      <View style={[styles.completionCard, { backgroundColor: ambianceTheme.cardBackground }]}>
        <Text style={[styles.completionText, { color: ambianceTheme.textColor }]}>
          Prends un instant pour dire Alhamdulillah pour ce moment.{'\n\n'}
          Si tu veux, tu peux noter en un mot comment tu te sens maintenant.
        </Text>

        <TextInput
          value={feeling}
          onChangeText={onFeelingChange}
          placeholder="Je me sens…"
          placeholderTextColor={ambianceTheme.textSecondaryColor}
          style={[styles.completionInput, { color: ambianceTheme.textColor, borderColor: ambianceTheme.cardBorderColor }]}
        />
      </View>

      <View style={styles.buttonGroup}>
        <Pressable
          onPress={onFinish}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: ambianceTheme.buttonBackground },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: ambianceTheme.buttonTextColor }]}>Terminer</Text>
        </Pressable>

        <Pressable
          onPress={onViewStats}
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: ambianceTheme.cardBackground, borderColor: ambianceTheme.cardBorderColor },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: ambianceTheme.textColor }]}>
            Voir mes statistiques
          </Text>
        </Pressable>

        <Pressable
          onPress={onRestart}
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: ambianceTheme.cardBackground, borderColor: ambianceTheme.cardBorderColor },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: ambianceTheme.textSecondaryColor }]}>
            Relancer une session
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  screenContainer: {
    flex: 1,
    padding: 20,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 20,
    fontFamily: 'System',
    marginBottom: 32,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    maxWidth: 400,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    textAlign: 'center',
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 24,
  },
  screenSubtitle: {
    fontSize: 18,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 32,
  },
  intentionCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  intentionInput: {
    minHeight: 120,
    fontSize: 16,
    fontFamily: 'System',
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  buttonGroup: {
    gap: 12,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  divineNameCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  divineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  divineNameArabic: {
    fontSize: 32,
    fontFamily: 'System',
    color: '#ffffff',
    writingDirection: 'rtl',
  },
  divineNameSeparator: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFD369',
    fontFamily: 'System',
  },
  divineNameTransliteration: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFD369',
    fontFamily: 'System',
  },
  divineNameMeaning: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'System',
    textAlign: 'center',
  },
  soundHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  soundTitle: {
    fontSize: 40,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  soundSubtitle: {
    fontSize: 20,
    fontFamily: 'System',
    marginBottom: 4,
  },
  soundDescription: {
    fontSize: 14,
    fontFamily: 'System',
  },
  soundSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 24,
  },
  ambianceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  validateButtonContainer: {
    width: '100%',
  },
  divineNamePreview: {
    marginBottom: 24,
    alignItems: 'center',
  },
  divineNamePreviewText: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 8,
  },
  divineNamePreviewCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  divineNamePreviewArabic: {
    fontSize: 24,
    fontFamily: 'System',
    color: '#ffffff',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  divineNamePreviewTransliteration: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFD369',
    fontFamily: 'System',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  durationButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  breathingOptions: {
    gap: 16,
    marginBottom: 24,
  },
  breathingOption: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  breathingOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  breathingOptionIcon: {
    fontSize: 24,
  },
  breathingOptionText: {
    flex: 1,
  },
  breathingOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  breathingOptionDescription: {
    fontSize: 14,
    fontFamily: 'System',
  },
  breathingOptionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0A0F2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingOptionCheckInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD369',
  },
  guidanceOptions: {
    gap: 16,
    marginBottom: 24,
  },
  guidanceOption: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  guidanceOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  guidanceOptionIcon: {
    fontSize: 24,
  },
  guidanceOptionText: {
    flex: 1,
  },
  guidanceOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  guidanceOptionDescription: {
    fontSize: 14,
    fontFamily: 'System',
  },
  guidanceOptionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0A0F2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidanceOptionCheckInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD369',
  },
  preparationCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  preparationList: {
    gap: 16,
  },
  preparationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  preparationBullet: {
    fontSize: 18,
    color: '#FFD369',
    marginTop: 2,
  },
  preparationText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    flex: 1,
  },
  preparationHint: {
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 32,
  },
  sessionWrapper: {
    flex: 1,
  },
  sessionContainer: {
    flex: 1,
  },
  sessionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  decorativeIcon: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  decorativeIconText: {
    fontSize: 24,
  },
  divineNameSessionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  divineNameSessionLabel: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 8,
  },
  divineNameSessionArabic: {
    fontSize: 32,
    fontFamily: 'System',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  divineNameSessionTransliteration: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  divineNameTranslations: {
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
    width: '100%',
    paddingHorizontal: 20,
  },
  divineNameTranslation: {
    fontSize: 16,
    fontFamily: 'System',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerContainer: {
    marginBottom: 20,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
  },
  guidanceMessageContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    maxWidth: 600,
    width: '100%',
  },
  guidanceMessageText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'System',
    textAlign: 'center',
  },
  breathingIndicator: {
    alignItems: 'center',
    marginTop: 16,
  },
  breathingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  breathingText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  sessionControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sessionControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionControlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  completionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
  },
  completionCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  completionText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    marginBottom: 16,
  },
  completionInput: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'System',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonCancel: {
    // Styles déjà définis dans modalButton
  },
  modalButtonConfirm: {
    // Styles déjà définis dans modalButton
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
