import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, CheckCircle, Circle, ExternalLink, Menu, X, ChevronRight, Clock, Target, Heart, Sparkles, Shield, Flame } from 'lucide-react-native';
import { SABILA_NUR_CHALLENGES, getChallengeById, getDayByNumber, type Challenge, type Day, type Task } from '@/data/sabilaNur';
import { useTranslation } from 'react-i18next';
// Génération IA désactivée - utilisation directe des tâches définies
import { divineNames, soundAmbiances, type SoundAmbiance } from '@/data/khalwaData';
import { AL_FATIHA_VERSES, getAllAlFatihaVerses, getAlFatihaVersesRange, getAlFatihaVerse } from '@/data/quranVerses';
import { useQuran } from '@/contexts/QuranContext';
import { speak, stopSpeaking, isSpeaking } from '@/services/system/speech';
import { Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react-native';
import { getRandomTaskWithSeed, generateTaskSeed, TASK_POOL, type TaskTheme } from '@/data/taskPool';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { spacing, borderRadius, fontSize, fontWeight, shadows, letterSpacing } from '@/utils/designTokens';
import { useResponsive } from '@/hooks/useResponsive';
import { PaywallModal } from '@/components/PaywallModal';
import { getSubscriptionStatus } from '@/services/system/subscription';
import { SoulDegreeModal, getBlockForDay, isFirstDayOfBlock, isLastDayOfBlock } from '@/components/SoulDegreeModal';
import { BlockUnavailableModal } from '@/components/BlockUnavailableModal';
import { ModuleIntroductionModal } from '@/components/ModuleIntroductionModal';
import { hasSeenModuleIntroduction, markModuleIntroductionAsSeen, MODULE_KEYS } from '@/utils/moduleIntroduction';
import { MODULE_INTRODUCTIONS } from '@/data/moduleIntroductions';

type Screen = 'onboarding' | 'day';

interface ChallengeProgress {
  challengeId: string;
  currentDay: number;
  startDate: string;
  intention?: string;
  completedTasks: Array<{
    day: number;
    taskIndices: number[];
  }>;
  completed?: boolean;
  completedAt?: string;
}

// Helper function pour obtenir l'icône selon le nom
function getChallengeIcon(iconName: 'Heart' | 'Shield' | 'Flame' | 'Sparkles', size: number = 36, color: string) {
  switch (iconName) {
    case 'Heart':
      return <Heart size={size} color={color} fill={color} />;
    case 'Shield':
      return <Shield size={size} color={color} fill={color} />;
    case 'Flame':
      return <Flame size={size} color={color} fill={color} />;
    case 'Sparkles':
      return <Sparkles size={size} color={color} />;
    default:
      return <Heart size={size} color={color} />;
  }
}

// Composant ChallengeCard avec animation de scale
function ChallengeCard({
  challenge,
  isCompleted,
  onPress,
  index,
  isPremium,
}: {
  challenge: Challenge;
  isCompleted: boolean;
  onPress: () => void;
  index: number;
  isPremium?: boolean;
}) {
  const { isTablet } = useResponsive();
  const cardScale = useSharedValue(1);
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  
  const handlePressIn = () => {
    cardScale.value = withSpring(0.97, { damping: 15 });
  };
  
  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15 });
  };
  
  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(index * 100).springify()}
      style={cardAnimatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.challengeCard,
          { width: isTablet ? '48%' : '100%' },
          isCompleted && { 
            borderColor: challenge.color, 
            borderWidth: 2,
            shadowColor: challenge.color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }
        ]}
      >
        <LinearGradient
          colors={[challenge.color, `${challenge.color}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.challengeGradient}
        >
          <View style={styles.challengeIconContainer}>
            {getChallengeIcon(challenge.iconName, 36, '#FFFFFF')}
          </View>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeAttribute}>
            {challenge.attribute} — {challenge.attributeArabic}
          </Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>
          {isPremium && (
            <Animated.View
              entering={FadeIn.duration(300).springify()}
              style={[styles.completedBadge, { backgroundColor: 'rgba(255, 211, 105, 0.3)', marginTop: spacing.sm }]}
            >
              <Text style={[styles.completedBadgeText, { fontSize: fontSize.xs }]}>⭐ Premium</Text>
            </Animated.View>
          )}
          {isCompleted && (
            <Animated.View
              entering={FadeIn.duration(300).springify()}
              style={styles.completedBadge}
            >
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.completedBadgeText}>Complété</Text>
            </Animated.View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function Challenge40Days() {
  const navigation = useNavigation();
  const { user, updateUser } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { adaptiveValue, isTablet } = useResponsive();

  // Responsive layout helpers
  const pagePaddingH = adaptiveValue(16, 20, 24, 32);
  const pagePaddingV = adaptiveValue(16, 20, 24, 28);
  const contentMaxWidth = adaptiveValue(560, 680, 820, 980);
  const dayMenuItemSize = adaptiveValue(72, 78, 86, 94);

  // Local card (no glass / no blur) – keeps existing JSX unchanged
  const GlassCard = ({ style, children }: { style?: any; children: React.ReactNode }) => (
    <View
      style={[
        styles.solidCard,
        {
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  // Fonction pour générer les couleurs basées sur le thème (style Hadith)
  const getColors = () => ({
    background: theme.colors.background,
    cardBackground: theme.colors.backgroundSecondary,
    cardBorder: theme.colors.border || 'rgba(255, 255, 255, 0.06)',
    textPrimary: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    textTertiary: theme.colors.textSecondary + '80',
    accent: theme.colors.accent,
    accentSubtle: theme.colors.accent + '25',
    separator: theme.colors.border || 'rgba(255, 255, 255, 0.08)',
  });

  const COLORS = getColors();
  
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [intention, setIntention] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [intentionText, setIntentionText] = useState('');
  const [showDayMenu, setShowDayMenu] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [expandedVerse, setExpandedVerse] = useState(false);
  const [readingVerse, setReadingVerse] = useState(false);
  const [showAmbianceModal, setShowAmbianceModal] = useState(false);
  const [pendingKalwaTask, setPendingKalwaTask] = useState<{ task: Task; taskIndex: number } | null>(null);
  const [selectedAmbiance, setSelectedAmbiance] = useState<string>('silence');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBlockUnavailable, setShowBlockUnavailable] = useState(false);
  const [unavailableBlockName, setUnavailableBlockName] = useState<string | undefined>();
  
  // États pour les blocs des degrés de l'âme
  const [showSoulDegreeModal, setShowSoulDegreeModal] = useState(false);
  const [soulDegreeBlockId, setSoulDegreeBlockId] = useState(1);
  const [isSoulDegreeEntry, setIsSoulDegreeEntry] = useState(true);
  const [lastShownBlock, setLastShownBlock] = useState<{ block: number; type: 'entry' | 'exit' } | null>(null);
  
  // État pour le modal d'explication du chemin (avant d'entrer)
  const [showChallengeExplanation, setShowChallengeExplanation] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState<Challenge | null>(null);
  const [isStartingChallenge, setIsStartingChallenge] = useState(false);
  
  // État pour le modal d'accueil du chemin (après être entré)
  const [showChallengeWelcome, setShowChallengeWelcome] = useState(false);
  
  // État pour le modal de validation du chemin
  const [showChallengeComplete, setShowChallengeComplete] = useState(false);
  
  // État pour le modal de phrase de clôture du jour
  const [showDayClosingPhrase, setShowDayClosingPhrase] = useState(false);
  const [dayClosingPhrase, setDayClosingPhrase] = useState<string | null>(null);
  const [pendingNextDay, setPendingNextDay] = useState<number | null>(null);
  
  // État pour les modals Al-Fatiha
  const [showAlFatihaIntro, setShowAlFatihaIntro] = useState(false);
  const [showAlFatihaCompletion, setShowAlFatihaCompletion] = useState(false);
  
  // État pour le modal d'introduction du module
  const [showModuleIntroduction, setShowModuleIntroduction] = useState(false);
  // État pour contrôler l'affichage de la page de présentation avant les défis
  const [showIntroductionPage, setShowIntroductionPage] = useState(true);
  
  // État pour le modal de verset NurShifa
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [verseModalData, setVerseModalData] = useState<{
    task: Task;
    taskIndex: number;
    surahNumber: number;
    verseStart?: number;
    verseEnd?: number;
  } | null>(null);
  
  // État pour le modal de verset Al-Fatiha
  const [showAlFatihaVerseModal, setShowAlFatihaVerseModal] = useState(false);
  const [alFatihaVerseModalData, setAlFatihaVerseModalData] = useState<{
    task: Task;
    taskIndex: number;
    verseNumber: number;
  } | null>(null);
  
  // Context Quran pour charger les versets
  // Note: Le provider doit être disponible dans App.tsx
  const { loadSurah, state: quranState } = useQuran();
  
  // Chemins premium (derrière paywall)
  const PREMIUM_CHALLENGES = ['voyage-du-coeur', 'liberation-spirituelle'];

  // Afficher l'introduction du module à chaque ouverture
  useEffect(() => {
    // Afficher la page de présentation à chaque fois que la page s'ouvre
    setShowIntroductionPage(true);
    setShowModuleIntroduction(true);
  }, []);

  // Charger la progression sauvegardée (seulement après que la page de présentation soit fermée)
  useEffect(() => {
    // Ne pas charger la progression tant que la page de présentation est affichée
    if (showIntroductionPage) {
      return;
    }
    
    const loadProgress = async () => {
      try {
        
        const savedProgress = user?.sabilaNurProgress;
        
        if (savedProgress && savedProgress.challengeId) {
          const challenge = getChallengeById(savedProgress.challengeId);
          if (challenge) {
            // Si c'est un chemin premium et que l'utilisateur n'est pas abonné, vérifier s'il a déjà commencé
            // Si oui, permettre de continuer (pour éviter de perdre la progression)
            // Si non, bloquer l'accès
            if (PREMIUM_CHALLENGES.includes(challenge.id)) {
              try {
                const subscriptionStatus = await getSubscriptionStatus();
                // Si l'utilisateur n'est pas abonné ET n'a pas encore commencé le chemin, bloquer
                if (!subscriptionStatus.isActive && (!savedProgress.currentDay || savedProgress.currentDay <= 1)) {
                  setIsLoading(false);
                  setShowPaywall(true);
                  return;
                }
                // Sinon, permettre de continuer (pour préserver la progression)
              } catch (error) {
                // Si on ne peut pas vérifier, permettre de continuer si progression existe
                if (!savedProgress.currentDay || savedProgress.currentDay <= 1) {
                  setIsLoading(false);
                  setShowPaywall(true);
                  return;
                }
              }
            }
            
            // Si le chemin est complété, ne pas le charger automatiquement
            if (savedProgress.completed) {
              setIsLoading(false);
              // Rester sur l'écran d'onboarding
              return;
            }
            
            setSelectedChallenge(challenge);
            setCurrentDay(savedProgress.currentDay || 1);
            setIntention(savedProgress.intention || '');
            
            const completed = new Set<string>();
            if (savedProgress.completedTasks && Array.isArray(savedProgress.completedTasks)) {
              savedProgress.completedTasks.forEach(task => {
                if (task && task.taskIndices && Array.isArray(task.taskIndices)) {
                  task.taskIndices.forEach(index => {
                    completed.add(`${task.day}-${index}`);
                  });
                }
              });
            }
            setCompletedTasks(completed);
            setCurrentScreen('day');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la progression:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user?.sabilaNurProgress, currentScreen, showIntroductionPage]);

  // Charger l'intention quand on change vers le jour 1
  useEffect(() => {
    if (currentDay === 1 && user?.sabilaNurProgress?.intention) {
      setIntention(user.sabilaNurProgress.intention);
    }
  }, [currentDay, user?.sabilaNurProgress?.intention]);

  // Génération IA désactivée - utilisation directe des tâches définies dans la structure

  // Obtenir les données du jour actuel
  const dayData = useMemo(() => {
    return selectedChallenge ? getDayByNumber(selectedChallenge, currentDay) : null;
  }, [selectedChallenge, currentDay]);

  // Obtenir les tâches des 3 jours précédents pour éviter les répétitions
  const getPreviousDaysTasks = useCallback((day: number, theme: TaskTheme, taskType: string): string[] => {
    if (!selectedChallenge || day <= 1) return [];
    
    const excludeTasks: string[] = [];
    // Vérifier les 3 jours précédents
    for (let prevDay = Math.max(1, day - 3); prevDay < day; prevDay++) {
      const prevDayData = getDayByNumber(selectedChallenge, prevDay);
      if (!prevDayData) continue;
      
      prevDayData.tasks.forEach((prevTask) => {
        // Vérifier si c'est le même type de tâche
        if (prevTask.type !== taskType) return;
        
        // Déterminer le thème de la tâche précédente
        let prevTheme: TaskTheme | null = null;
        if (prevTask.type === 'spirituelle_ia') prevTheme = 'spirituelle';
        else if (prevTask.type === 'discipline_ia') prevTheme = 'discipline';
        else if (prevTask.type === 'action_ia') prevTheme = 'action';
        else if (prevTask.type === 'introspection' || prevTask.type === 'connexion_soi') prevTheme = 'introspection';
        else if (prevTask.type === 'ancrage_concret') prevTheme = 'ancrage_concret';
        
        // Si c'est le même thème, extraire la tâche réelle
        if (prevTheme === theme) {
          let taskText = prevTask.description;
          // Enlever les emojis et préfixes
          taskText = taskText.replace(/^[🌿🧭🔥🤍🪨]\s*[^\n]*\n\n?/g, '');
          taskText = taskText.replace(/^[^\n]*\n\n?/g, ''); // Enlever première ligne si c'est un titre
          taskText = taskText.trim();
          
          // Si la tâche précédente avait des options, on doit recalculer quelle option a été sélectionnée
          if (prevTask.options) {
            const prevTaskIndex = prevDayData.tasks.indexOf(prevTask);
            const prevBaseSeed = generateTaskSeed(prevDay, selectedChallenge.id, user?.id);
            const prevCombinedSeed = prevBaseSeed + prevTaskIndex * 1000;
            const prevIndex = prevCombinedSeed % prevTask.options.length;
            taskText = prevTask.options[prevIndex];
          } else {
            // Extraire le texte réel de la description (sans titre)
            const lines = taskText.split('\n');
            // Prendre la dernière ligne qui contient généralement la tâche réelle
            if (lines.length > 1) {
              taskText = lines[lines.length - 1].trim();
            }
          }
          
          if (taskText && !excludeTasks.includes(taskText)) {
            excludeTasks.push(taskText);
          }
        }
      });
    }
    
    return excludeTasks;
  }, [selectedChallenge, user?.id]);

  // Obtenir les tâches avec sélection aléatoire des options (sans emojis, avec anti-répétition)
  const currentTasks = useMemo(() => {
    if (!dayData || !selectedChallenge) return [];
    
    return dayData.tasks.map((task) => {
      // Si la tâche a des options, sélectionner aléatoirement une seule option (avec anti-répétition)
      if (task.options && task.options.length > 0) {
        // Déterminer le thème pour l'anti-répétition
        let theme: TaskTheme | null = null;
        if (task.type === 'spirituelle_ia') theme = 'spirituelle';
        else if (task.type === 'discipline_ia') theme = 'discipline';
        else if (task.type === 'action_ia') theme = 'action';
        else if (task.type === 'introspection' || task.type === 'connexion_soi') theme = 'introspection';
        else if (task.type === 'ancrage_concret') theme = 'ancrage_concret';
        
        // Récupérer les options des 3 jours précédents
        const excludeOptions = theme ? getPreviousDaysTasks(currentDay, theme, task.type) : [];
        
        // Filtrer les options exclues
        const availableOptions = task.options.filter(opt => !excludeOptions.includes(opt));
        const optionsToUse = availableOptions.length > 0 ? availableOptions : task.options;
        
        // Utiliser un seed plus varié qui inclut aussi l'index de la tâche dans le jour
        const taskIndex = dayData.tasks.indexOf(task);
        const seed = generateTaskSeed(currentDay, selectedChallenge.id, user?.id);
        const combinedSeed = seed + taskIndex * 1000; // Ajouter l'index de la tâche pour plus de variété
        const randomIndex = combinedSeed % optionsToUse.length;
        const selectedOption = optionsToUse[randomIndex];
        
        // Enlever les emojis du préfixe si présent
        let newDescription = selectedOption;
        const descriptionLines = task.description.split('\n');
        const prefix = descriptionLines[0] || '';
        const hasPrefix = prefix.includes('🧭') || prefix.includes('🔥') || prefix.includes('🤍') || prefix.includes('🪨') || prefix.includes('🌿');
        
        if (hasPrefix) {
          // Extraire le titre sans emoji
          const titleMatch = prefix.match(/[^\u{1F300}-\u{1F9FF}]+/u);
          const title = titleMatch ? titleMatch[0].trim() : '';
          
          // Trouver où commence la liste numérotée dans la description originale
          const listStartIndex = task.description.indexOf('1.');
          if (listStartIndex > 0) {
            const beforeList = task.description.substring(0, listStartIndex).trim();
            // Enlever les emojis du préfixe
            const cleanPrefix = beforeList.replace(/[🌿🧭🔥🤍🪨]\s*/g, '').trim();
            newDescription = title ? `${title}\n\n${selectedOption}` : selectedOption;
          } else {
            newDescription = title ? `${title}\n\n${selectedOption}` : selectedOption;
          }
        }
        
        // Remplacer la description par l'option sélectionnée
        return {
          ...task,
          description: newDescription,
          options: undefined // Retirer les options après sélection
        };
      }
      
      // Si la tâche n'a pas d'options mais a une description générique, utiliser le pool
      const isGenericDescription = 
        task.description.includes('Tâche spirituelle du jour') ||
        task.description.includes('Tâche discipline du jour') ||
        task.description.includes('Tâche action du jour') ||
        task.description.includes('Connexion à soi du jour') ||
        task.description.includes('Ancrage concret du jour') ||
        (task.generatedByIA && task.description.length < 50); // Descriptions courtes et génériques
      
      if (isGenericDescription) {
        // Déterminer le thème selon le type de tâche
        let theme: TaskTheme | null = null;
        if (task.type === 'spirituelle_ia') theme = 'spirituelle';
        else if (task.type === 'discipline_ia') theme = 'discipline';
        else if (task.type === 'action_ia') theme = 'action';
        else if (task.type === 'introspection') theme = 'introspection';
        else if (task.type === 'connexion_soi') theme = 'introspection'; // Connexion à soi = introspection
        else if (task.type === 'ancrage_concret') theme = 'ancrage_concret';
        
        if (theme) {
          // Récupérer les tâches des 3 jours précédents pour ce thème
          const excludeTasks = getPreviousDaysTasks(currentDay, theme, task.type);
          
          // Utiliser un seed qui inclut aussi l'index de la tâche pour plus de variété
          const taskIndex = dayData.tasks.indexOf(task);
          const baseSeed = generateTaskSeed(currentDay, selectedChallenge.id, user?.id);
          const combinedSeed = baseSeed + taskIndex * 1000;
          
          // Sélectionner une tâche en excluant celles des 3 jours précédents
          let selectedTask = getRandomTaskWithSeed(
            theme,
            currentDay,
            selectedChallenge.id,
            user?.id,
            excludeTasks
          );
          
          // Si la tâche sélectionnée est dans les exclusions, forcer une autre sélection
          if (excludeTasks.includes(selectedTask)) {
            const availableTasks = TASK_POOL[theme].filter(t => !excludeTasks.includes(t));
            if (availableTasks.length > 0) {
              const altIndex = combinedSeed % availableTasks.length;
              selectedTask = availableTasks[altIndex];
            }
          }
          
          // Formater la description selon le type (sans emoji)
          let formattedDescription = selectedTask;
          if (task.type === 'spirituelle_ia') {
            formattedDescription = `Spiritualité\n\n${selectedTask}`;
          } else if (task.type === 'discipline_ia') {
            formattedDescription = `Discipline\n\n${selectedTask}`;
          } else if (task.type === 'action_ia') {
            formattedDescription = `Action\n\n${selectedTask}`;
          } else if (task.type === 'introspection' || task.type === 'connexion_soi') {
            formattedDescription = `Introspection\n\n${selectedTask}`;
          } else if (task.type === 'ancrage_concret') {
            formattedDescription = `Ancrage concret\n\n${selectedTask}`;
          }
          
          return {
            ...task,
            description: formattedDescription,
            generatedByIA: false
          };
        }
      }
      
      // Enlever les emojis des descriptions existantes
      let cleanDescription = task.description;
      cleanDescription = cleanDescription.replace(/[🌿🧭🔥🤍🪨]\s*/g, '');
      
      return {
        ...task,
        description: cleanDescription
      };
    });
  }, [dayData, selectedChallenge, currentDay, user?.id, getPreviousDaysTasks]);

  // Sauvegarder la progression
  const saveProgress = useCallback((progress: ChallengeProgress) => {
    updateUser({
      sabilaNurProgress: progress
    });
  }, [updateUser]);

  // Quitter le chemin (supprimer la progression)
  const handleQuitChallenge = useCallback(() => {
    Alert.alert(
      'Quitter le chemin',
      'Êtes-vous sûr de vouloir quitter ce chemin ? Toute votre progression sera supprimée et ne pourra pas être récupérée.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => setShowQuitModal(false)
        },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => {
            // Supprimer la progression
            updateUser({
              sabilaNurProgress: undefined
            });
            
            // Réinitialiser l'état
            setSelectedChallenge(null);
            setCurrentDay(1);
            setCurrentScreen('onboarding');
            setIntention('');
            setCompletedTasks(new Set());
            setShowQuitModal(false);
          }
        }
      ]
    );
  }, [updateUser]);

  // Démarrer un chemin
  // Afficher le modal d'explication du chemin
  const handleStartChallenge = useCallback(async (challenge: Challenge) => {
    // Vérifier si le chemin est déjà complété
    const savedProgress = user?.sabilaNurProgress as ChallengeProgress | undefined;
    const isCompleted = savedProgress?.challengeId === challenge.id && savedProgress?.completed;
    
    if (isCompleted) {
      // Si le chemin est complété, proposer de recommencer
      Alert.alert(
        'Chemin déjà complété',
        'Ce chemin a déjà été complété. Voulez-vous le recommencer depuis le début ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Recommencer',
            style: 'default',
            onPress: () => {
              // Supprimer la progression pour recommencer
              updateUser({
                sabilaNurProgress: undefined
              });
              // Continuer avec le démarrage normal
              setPendingChallenge(challenge);
              setShowChallengeExplanation(true);
            }
          }
        ]
      );
      return;
    }
    
    // Vérifier si le chemin est premium et si l'utilisateur est abonné
    if (PREMIUM_CHALLENGES.includes(challenge.id)) {
      try {
        const subscriptionStatus = await getSubscriptionStatus();
        if (!subscriptionStatus.isActive) {
          setShowPaywall(true);
          return;
        }
      } catch (error) {
        // Si on ne peut pas vérifier, on bloque par défaut (évite fuite premium)
        setShowPaywall(true);
        return;
      }
    }
    
    // Afficher le modal d'explication AVANT d'entrer dans le chemin
    setPendingChallenge(challenge);
    setShowChallengeExplanation(true);
  }, [user?.sabilaNurProgress, updateUser]);

  // Entrer réellement dans le chemin après validation du modal d'explication
  const enterChallenge = useCallback(async () => {
    if (!pendingChallenge || isStartingChallenge) return;
    
    setIsStartingChallenge(true);
    
    // Petit délai pour le feedback visuel
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setShowChallengeExplanation(false);
    
    setSelectedChallenge(pendingChallenge);
    setCurrentDay(1);
    setCurrentScreen('day');
    
    const progress: ChallengeProgress = {
      challengeId: pendingChallenge.id,
      currentDay: 1,
      startDate: new Date().toISOString(),
      intention: '',
      completedTasks: []
    };
    
    saveProgress(progress);
    
    setIsStartingChallenge(false);
    
    // Afficher le modal d'accueil du chemin après être entré
    setShowChallengeWelcome(true);
    
    setPendingChallenge(null);
  }, [pendingChallenge, saveProgress, isStartingChallenge]);

  // Sauvegarder l'intention
  const handleSaveIntention = useCallback(() => {
    if (!selectedChallenge) return;
    
    const newIntention = intentionText.trim();
    setIntention(newIntention);
    setShowIntentionModal(false);
    
    const progress: ChallengeProgress = {
      challengeId: selectedChallenge.id,
      currentDay,
      startDate: user?.sabilaNurProgress?.startDate || new Date().toISOString(),
      intention: newIntention,
      completedTasks: Array.from(completedTasks).reduce((acc, key) => {
        const [day, idx] = key.split('-').map(Number);
        if (!acc[day]) acc[day] = [];
        acc[day].push(idx);
        return acc;
      }, {} as Record<number, number[]>)
    };
    
    saveProgress(progress);
  }, [intentionText, selectedChallenge, currentDay, completedTasks, user?.sabilaNurProgress, saveProgress]);

  // Parser la référence de verset (ex: "Al-Fâtiha (1:1-7)" ou "1:1-7" ou "Ayat al-Kursi + 3 Qul")
  const parseVerseReference = useCallback((verseRef: string | undefined): { surahNumber: number; verseStart?: number; verseEnd?: number; special?: string } | null => {
    if (!verseRef) return null;
    
    try {
      // Cas spécial : "Ayat al-Kursi + 3 Qul" (jour 40)
      if (verseRef.includes('Ayat al-Kursi') || verseRef.includes('3 Qul')) {
        return { surahNumber: 2, verseStart: 255, verseEnd: 255, special: 'ayat-kursi-3qul' };
      }
      
      // Format "Al-Fâtiha (1:1-7)" ou "1:1-7"
      const match = verseRef.match(/\(?(\d+):(\d+)(?:-(\d+))?\)?/);
      if (match) {
        const surahNumber = parseInt(match[1], 10);
        const verseStart = parseInt(match[2], 10);
        const verseEnd = match[3] ? parseInt(match[3], 10) : verseStart;
        return { surahNumber, verseStart, verseEnd };
      }
      
      // Format simple "1" (sourate uniquement)
      const simpleMatch = verseRef.match(/^(\d+)$/);
      if (simpleMatch) {
        return { surahNumber: parseInt(simpleMatch[1], 10) };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  // Gérer le clic sur une tâche
  const handleTaskPress = useCallback((task: Task, taskIndex: number) => {
    const taskType = task.type;
    
    // Kalwa : Afficher le modal de sélection d'ambiance
    if (taskType === 'kalwa') {
      setPendingKalwaTask({ task, taskIndex });
      setShowAmbianceModal(true);
      return;
    }
    
    // Al-Fatiha verse : Afficher le verset dans un modal et valider automatiquement
    if (taskType === 'alfatiha_verse') {
      const parsed = parseVerseReference(task.verseReference);
      if (parsed && parsed.surahNumber === 1 && parsed.verseStart) {
        setAlFatihaVerseModalData({
          task,
          taskIndex,
          verseNumber: parsed.verseStart
        });
        setShowAlFatihaVerseModal(true);
      }
      return;
    }
    
    // Nur Shifa : Afficher le verset dans un modal
    if (taskType === 'nur_shifa') {
      const parsed = parseVerseReference(task.verseReference);
      if (parsed) {
        setVerseModalData({
          task,
          taskIndex,
          surahNumber: parsed.surahNumber,
          verseStart: parsed.verseStart,
          verseEnd: parsed.verseEnd,
          special: parsed.special
        });
        setShowVerseModal(true);
        
        // Charger la sourate si ce n'est pas Al-Fatiha
        if (parsed.surahNumber !== 1) {
          loadSurah(parsed.surahNumber);
        }
        
        // Cas spécial : charger les 4 sourates pour Ayat al-Kursi + 3 Qul
        if (parsed.special === 'ayat-kursi-3qul') {
          loadSurah(2);   // Al-Baqara pour Ayat al-Kursi
          loadSurah(112); // Al-Ikhlas
          loadSurah(113); // Al-Falaq
          loadSurah(114); // An-Nas
        }
      } else {
        // Si on ne peut pas parser, naviguer vers NurShifa comme avant
      navigation.navigate('NurShifa' as never, {
        fromChallenge: true,
        challengeId: selectedChallenge?.id,
        day: currentDay,
        taskIndex: taskIndex
      } as never);
      }
      return;
    }
    
    // Intention : Afficher le modal
    if (taskType === 'intention') {
      setIntentionText(intention || '');
      setShowIntentionModal(true);
      return;
    }
    
    // Autres tâches : Toggle complétion
    const taskKey = `${currentDay}-${taskIndex}`;
    const newCompleted = new Set(completedTasks);
    
    if (newCompleted.has(taskKey)) {
      newCompleted.delete(taskKey);
    } else {
      newCompleted.add(taskKey);
    }
    
    setCompletedTasks(newCompleted);
    
    if (selectedChallenge) {
      const tasksByDay: Record<number, number[]> = {};
      newCompleted.forEach(key => {
        const [d, idx] = key.split('-').map(Number);
        if (!tasksByDay[d]) tasksByDay[d] = [];
        tasksByDay[d].push(idx);
      });
      
      const completedTasksArray = Object.entries(tasksByDay).map(([day, indices]) => ({
        day: Number(day),
        taskIndices: indices
      }));
      
      const progress: ChallengeProgress = {
        challengeId: selectedChallenge.id,
        currentDay,
        startDate: user?.sabilaNurProgress?.startDate || new Date().toISOString(),
        intention: intention || user?.sabilaNurProgress?.intention || '',
        completedTasks: completedTasksArray
      };
      
      saveProgress(progress);
    }
  }, [selectedChallenge, currentDay, navigation, intention, completedTasks, user?.sabilaNurProgress, saveProgress, parseVerseReference, loadSurah]);

  // Fonction helper pour marquer une tâche comme complétée et sauvegarder
  const markTaskAsCompleted = useCallback((day: number, taskIndex: number) => {
    const taskKey = `${day}-${taskIndex}`;
    const newCompleted = new Set(completedTasks);
    
    // Si la tâche est déjà complétée, ne rien faire
    if (newCompleted.has(taskKey)) {
      return;
    }
    
    newCompleted.add(taskKey);
    setCompletedTasks(newCompleted);
    
    if (selectedChallenge) {
      const tasksByDay: Record<number, number[]> = {};
      newCompleted.forEach(key => {
        const [d, idx] = key.split('-').map(Number);
        if (!tasksByDay[d]) tasksByDay[d] = [];
        tasksByDay[d].push(idx);
      });
      
      const completedTasksArray = Object.entries(tasksByDay).map(([day, indices]) => ({
        day: Number(day),
        taskIndices: indices
      }));
      
      const progress: ChallengeProgress = {
        challengeId: selectedChallenge.id,
        currentDay: day,
        startDate: user?.sabilaNurProgress?.startDate || new Date().toISOString(),
        intention: intention || user?.sabilaNurProgress?.intention || '',
        completedTasks: completedTasksArray
      };
      
      saveProgress(progress);
    }
  }, [completedTasks, selectedChallenge, intention, user?.sabilaNurProgress, saveProgress]);

  // Marquer une tâche comme complétée
  const handleToggleTask = useCallback((day: number, taskIndex: number) => {
    const taskKey = `${day}-${taskIndex}`;
    const newCompleted = new Set(completedTasks);
    
    if (newCompleted.has(taskKey)) {
      newCompleted.delete(taskKey);
    } else {
      newCompleted.add(taskKey);
    }
    
    setCompletedTasks(newCompleted);
    
    if (selectedChallenge) {
      const tasksByDay: Record<number, number[]> = {};
      newCompleted.forEach(key => {
        const [d, idx] = key.split('-').map(Number);
        if (!tasksByDay[d]) tasksByDay[d] = [];
        tasksByDay[d].push(idx);
      });
      
      const completedTasksArray = Object.entries(tasksByDay).map(([day, indices]) => ({
        day: Number(day),
        taskIndices: indices
      }));
      
      const progress: ChallengeProgress = {
        challengeId: selectedChallenge.id,
        currentDay,
        startDate: user?.sabilaNurProgress?.startDate || new Date().toISOString(),
        intention: intention || user?.sabilaNurProgress?.intention || '',
        completedTasks: completedTasksArray
      };
      
      saveProgress(progress);
    }
  }, [completedTasks, selectedChallenge, currentDay, intention, user?.sabilaNurProgress, saveProgress]);

  // Valider le chemin (fonction interne, sans vérification du modal)
  const completeChallengeInternal = useCallback(() => {
    if (!selectedChallenge || currentDay !== 40) return;
    
    const tasksByDay: Record<number, number[]> = {};
    completedTasks.forEach(key => {
      const [day, idx] = key.split('-').map(Number);
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(idx);
    });
    
    const completedTasksArray = Object.entries(tasksByDay).map(([day, indices]) => ({
      day: Number(day),
      taskIndices: indices
    }));
    
    const progress: ChallengeProgress = {
      challengeId: selectedChallenge.id,
      currentDay: 40,
      startDate: user?.sabilaNurProgress?.startDate || new Date().toISOString(),
      intention: intention || user?.sabilaNurProgress?.intention || '',
      completedTasks: completedTasksArray,
      completed: true,
      completedAt: new Date().toISOString()
    };
    
    saveProgress(progress);
    
    // Afficher le modal de validation du chemin
    setShowChallengeComplete(true);
  }, [selectedChallenge, currentDay, intention, completedTasks, user?.sabilaNurProgress, saveProgress]);
  
  // Valider le chemin (jour 40) - vérifie d'abord le modal de sortie
  const handleCompleteChallenge = useCallback(() => {
    if (!selectedChallenge || currentDay !== 40) return;
    
    // Vérifier si c'est le dernier jour du bloc 7 et afficher le modal de sortie AVANT la validation
    const currentBlock = getBlockForDay(40); // Bloc 7
    if (isLastDayOfBlock(40) && (!lastShownBlock || lastShownBlock.block !== currentBlock || lastShownBlock.type !== 'exit')) {
      // Afficher le modal de sortie du bloc 7
      setSoulDegreeBlockId(currentBlock);
      setIsSoulDegreeEntry(false);
      setShowSoulDegreeModal(true);
      setLastShownBlock({ block: currentBlock, type: 'exit' });
      // Ne pas valider maintenant, attendre que l'utilisateur ferme le modal
      return;
    }
    
    // Si le modal de sortie a déjà été affiché, valider directement
    completeChallengeInternal();
  }, [selectedChallenge, currentDay, lastShownBlock, completeChallengeInternal]);

  // Vérifier si un bloc est disponible
  const isBlockAvailable = useCallback((blockNumber: number): boolean => {
    // Pour l'instant, tous les blocs sont disponibles
    // Vous pouvez ajouter une logique ici pour vérifier si un bloc est disponible
    // Exemple: return blockNumber <= 3; // Seuls les blocs 1-3 sont disponibles
    return true;
  }, []);

  // Fonction pour passer effectivement au jour suivant (après les modals)
  const proceedToNextDay = useCallback((nextDay: number) => {
    if (!selectedChallenge) return;
    
    const dayData = getDayByNumber(selectedChallenge, nextDay);
    
    // Vérifier si le bloc du jour suivant est disponible
    if (dayData?.blockNumber && !isBlockAvailable(dayData.blockNumber)) {
      const blockInfo = selectedChallenge.blocks.find(b => b.number === dayData.blockNumber);
      setUnavailableBlockName(blockInfo?.name || `Bloc ${dayData.blockNumber}`);
      setShowBlockUnavailable(true);
      return;
    }
    
    // Réinitialiser lastShownBlock quand on change de jour pour permettre l'affichage du nouveau bloc
    const nextBlock = getBlockForDay(nextDay);
    if (isFirstDayOfBlock(nextDay)) {
      // Réinitialiser pour permettre l'affichage du modal d'entrée du nouveau bloc
      setLastShownBlock(null);
    }
    
    setCurrentDay(nextDay);
    
    const tasksByDay: Record<number, number[]> = {};
    completedTasks.forEach(key => {
      const [day, idx] = key.split('-').map(Number);
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(idx);
    });
    
    const completedTasksArray = Object.entries(tasksByDay).map(([day, indices]) => ({
      day: Number(day),
      taskIndices: indices
    }));
    
    const progress: ChallengeProgress = {
      challengeId: selectedChallenge.id,
      currentDay: nextDay,
      startDate: user?.sabilaNurProgress?.startDate || new Date().toISOString(),
      intention: intention || user?.sabilaNurProgress?.intention || '',
      completedTasks: completedTasksArray
    };
    
    saveProgress(progress);
  }, [selectedChallenge, completedTasks, intention, user?.sabilaNurProgress, saveProgress, isBlockAvailable]);
  
  // Aller au jour suivant
  const handleNextDay = useCallback(() => {
    if (!selectedChallenge || currentDay >= 40) return;
    
    const dayData = getDayByNumber(selectedChallenge, currentDay);
    if (!dayData) return;
    
    // Vérifier si c'est le dernier jour d'un bloc et afficher le modal de sortie AVANT de passer au jour suivant
    if (isLastDayOfBlock(currentDay)) {
      const currentBlock = getBlockForDay(currentDay);
      if (!lastShownBlock || lastShownBlock.block !== currentBlock || lastShownBlock.type !== 'exit') {
        setSoulDegreeBlockId(currentBlock);
        setIsSoulDegreeEntry(false);
        setShowSoulDegreeModal(true);
        setLastShownBlock({ block: currentBlock, type: 'exit' });
        // Ne pas passer au jour suivant maintenant, attendre que l'utilisateur ferme le modal
        return;
      }
    }
    
    const nextDay = currentDay + 1;
    
    // Vérifier si le jour actuel a une phrase de clôture
    if (dayData.closingPhrase) {
      setDayClosingPhrase(dayData.closingPhrase);
      setPendingNextDay(nextDay);
      setShowDayClosingPhrase(true);
      return;
    }
    
    // Sinon, passer directement au jour suivant
    proceedToNextDay(nextDay);
  }, [selectedChallenge, currentDay, completedTasks, proceedToNextDay, lastShownBlock]);

  // Aller au jour précédent
  const handlePreviousDay = useCallback(() => {
    if (currentDay <= 1) return;
    setCurrentDay(currentDay - 1);
    // Charger l'intention si on revient au jour 1
    if (currentDay === 2 && user?.sabilaNurProgress?.intention) {
      setIntention(user.sabilaNurProgress.intention);
    }
  }, [currentDay, user?.sabilaNurProgress?.intention]);

  // Naviguer vers un jour spécifique
  const handleGoToDay = useCallback((day: number) => {
    if (!selectedChallenge || day < 1 || day > 40) return;
    
    // Vérifier si le bloc du jour est disponible
    const dayData = getDayByNumber(selectedChallenge, day);
    if (dayData?.blockNumber && !isBlockAvailable(dayData.blockNumber)) {
      const blockInfo = selectedChallenge.blocks.find(b => b.number === dayData.blockNumber);
      setUnavailableBlockName(blockInfo?.name || `Bloc ${dayData.blockNumber}`);
      setShowBlockUnavailable(true);
      setShowDayMenu(false);
      return;
    }
    
    // Réinitialiser lastShownBlock pour permettre l'affichage du modal si c'est le premier jour d'un bloc
    const targetBlock = getBlockForDay(day);
    if (isFirstDayOfBlock(day)) {
      setLastShownBlock(null);
    }
    
    setCurrentDay(day);
    setShowDayMenu(false);
    // Charger l'intention si on va au jour 1
    if (day === 1 && user?.sabilaNurProgress?.intention) {
      setIntention(user.sabilaNurProgress.intention);
    }
  }, [selectedChallenge, user?.sabilaNurProgress?.intention, isBlockAvailable]);

  // Effet pour afficher le modal des degrés de l'âme au premier jour de chaque bloc
  useEffect(() => {
    if (currentScreen !== 'day' || !selectedChallenge) return;
    
    const currentBlock = getBlockForDay(currentDay);
    
    // Vérifier si c'est le jour 11 (début Al-Fatiha) - afficher le modal d'introduction Al-Fatiha
    if (currentDay === 11) {
      const shouldShow = !lastShownBlock || lastShownBlock.block !== currentBlock || lastShownBlock.type !== 'entry';
      if (shouldShow) {
        setShowAlFatihaIntro(true);
        setLastShownBlock({ block: currentBlock, type: 'entry' });
        return;
      }
    }
    
    // Vérifier si c'est le jour 18 (après Al-Fatiha) - afficher le modal de complétion Al-Fatiha
    if (currentDay === 18) {
      const shouldShow = !lastShownBlock || lastShownBlock.block !== currentBlock || lastShownBlock.type !== 'entry';
      if (shouldShow) {
        setShowAlFatihaCompletion(true);
        setLastShownBlock({ block: currentBlock, type: 'entry' });
        return;
      }
    }
    
    // Vérifier si c'est le premier jour d'un bloc
    if (isFirstDayOfBlock(currentDay)) {
      // Toujours afficher le modal d'entrée si c'est le premier jour d'un bloc
      // Utiliser une référence stable pour éviter les boucles infinies
      const shouldShow = !lastShownBlock || lastShownBlock.block !== currentBlock || lastShownBlock.type !== 'entry';
      
      if (shouldShow) {
        setSoulDegreeBlockId(currentBlock);
        setIsSoulDegreeEntry(true);
        setShowSoulDegreeModal(true);
        setLastShownBlock({ block: currentBlock, type: 'entry' });
      }
    }
  }, [currentDay, currentScreen, selectedChallenge]); // Retirer lastShownBlock des dépendances

  
  // Fonction pour afficher le modal de sortie de bloc
  const showBlockExitModal = useCallback(() => {
    if (!isLastDayOfBlock(currentDay)) return;
    
    const currentBlock = getBlockForDay(currentDay);
    if (!lastShownBlock || lastShownBlock.block !== currentBlock || lastShownBlock.type !== 'exit') {
      setSoulDegreeBlockId(currentBlock);
      setIsSoulDegreeEntry(false);
      setShowSoulDegreeModal(true);
      setLastShownBlock({ block: currentBlock, type: 'exit' });
    }
  }, [currentDay, lastShownBlock]);

  // Confirmer la sélection d'ambiance et naviguer vers BaytAnNur
  const handleConfirmAmbiance = useCallback(() => {
    if (!pendingKalwaTask || !selectedChallenge) return;
    
    const { task, taskIndex } = pendingKalwaTask;
    const divineAttribute = task.divineAttribute || 'Allah';
    const divineName = divineNames.find(n => 
      n.transliteration.toLowerCase().includes(divineAttribute.toLowerCase()) ||
      n.meaning.toLowerCase().includes(divineAttribute.toLowerCase())
    );
    
    // Marquer la tâche Khalwa comme complétée
    markTaskAsCompleted(currentDay, taskIndex);
    
    setShowAmbianceModal(false);
    
    if (divineName) {
      navigation.navigate('BaytAnNur' as never, {
        fromChallenge: true,
        challengeId: selectedChallenge.id,
        day: currentDay,
        taskIndex: taskIndex,
        divineNameId: divineName.id,
        khalwaName: task.description,
        divineAttribute: divineAttribute,
        selectedAmbiance: selectedAmbiance
      } as never);
    } else {
      navigation.navigate('BaytAnNur' as never, {
        fromChallenge: true,
        challengeId: selectedChallenge.id,
        day: currentDay,
        taskIndex: taskIndex,
        divineAttribute: divineAttribute,
        selectedAmbiance: selectedAmbiance
      } as never);
    }
    
    setPendingKalwaTask(null);
  }, [pendingKalwaTask, selectedChallenge, currentDay, selectedAmbiance, navigation, completedTasks, intention, user?.sabilaNurProgress, saveProgress]);

  // Calculer la progression pour chaque jour (tâches statiques)
  const getDayProgress = useCallback((day: number) => {
    if (!selectedChallenge) return { completed: 0, total: 0, percentage: 0 };
    const dayData = getDayByNumber(selectedChallenge, day);
    if (!dayData) return { completed: 0, total: 0, percentage: 0 };
    
    const dayTasks = dayData.tasks;
    const completed = dayTasks.filter((_, index) => 
      completedTasks.has(`${day}-${index}`)
    ).length;
    
    return {
      completed,
      total: dayTasks.length,
      percentage: dayTasks.length > 0 ? (completed / dayTasks.length) * 100 : 0
    };
  }, [selectedChallenge, completedTasks]);

  // Animation de la barre de progression (doit être avant tous les retours conditionnels)
  const progressAnim = useSharedValue(0);
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  // Calculer la progression (doit être après les hooks)
  const progress = selectedChallenge && dayData ? (currentDay / 40) * 100 : 0;
  // Pour le jour 1 (intention), compter seulement Nur Shifa et Kalwa (pas l'intention)
  const tasksCompleted = dayData ? currentTasks.filter((task, index) => {
    // Pour le jour 1, ne compter que Nur Shifa et Kalwa
    if (currentDay === 1) {
      if (task.type !== 'nur_shifa' && task.type !== 'kalwa') return false;
    }
    return completedTasks.has(`${currentDay}-${index}`);
  }).length : 0;
  const tasksToCount = currentDay === 1 
    ? currentTasks.filter(task => task.type === 'nur_shifa' || task.type === 'kalwa').length
    : currentTasks.length;
  const allTasksCompleted = dayData ? tasksCompleted === tasksToCount : false;

  // Mettre à jour l'animation de progression
  useEffect(() => {
    if (selectedChallenge && dayData) {
      progressAnim.value = withTiming(progress, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [progress, progressAnim, selectedChallenge, dayData]);

  // Page de présentation complète (avant les défis)
  if (showIntroductionPage) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.backgroundSecondary]}
          style={styles.gradient}
        >
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.pageContent,
                {
                  paddingHorizontal: pagePaddingH,
                  paddingTop: pagePaddingV,
                  paddingBottom: spacing['2xl'],
                  maxWidth: contentMaxWidth,
                },
              ]}
            >
              {/* Header avec bouton retour */}
              <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                  <ArrowLeft size={24} color={theme.colors.text} />
                </Pressable>
                <View style={{ width: 40 }} />
              </View>

              {/* Icône centrale */}
              <Animated.View
                entering={FadeIn.duration(600).delay(100)}
                style={{ alignItems: 'center', marginBottom: spacing.xl }}
              >
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#FFD369' + '20',
                  borderWidth: 2,
                  borderColor: '#FFD369' + '40',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: spacing.lg,
                }}>
                  <Sparkles size={40} color="#FFD369" />
                </View>
                
                <Text style={{
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.bold,
                  color: '#FFD369',
                  textAlign: 'center',
                  marginBottom: spacing.xs,
                }}>
                  🌙 Sabilat Nûr
                </Text>
                <Text style={{
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.medium,
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}>
                  Le chemin des 40 jours
                </Text>
              </Animated.View>

              {/* Contenu de présentation */}
              <Animated.View
                entering={FadeIn.duration(600).delay(200)}
                style={{
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderRadius: borderRadius.xl,
                  padding: spacing.xl,
                  borderWidth: 1,
                  borderColor: theme.colors.border || 'rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Section 1: Introduction */}
                <Text style={{
                  fontSize: fontSize.base,
                  lineHeight: 26,
                  color: theme.colors.text,
                  marginBottom: spacing.xl,
                }}>
                  Sabilat Nûr n'est pas un défi à relever.{'\n'}
                  C'est un chemin intérieur, un temps accordé pour ralentir, se recentrer et se réaligner.
                </Text>

                {/* Section 2: Durée */}
                <View style={{ marginBottom: spacing.xl }}>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: '#FFD369', marginBottom: spacing.sm }}>
                    🕰️ Le parcours dure 40 jours
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, lineHeight: 22, color: theme.colors.textSecondary }}>
                    Les 36 premiers jours suivent le rythme 3-6-9, un cycle progressif qui installe la constance sans pression.
                  </Text>
                </View>

                {/* Section 3: Khalwa */}
                <View style={{ marginBottom: spacing.xl }}>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: '#FFD369', marginBottom: spacing.sm }}>
                    🌿 Temps de khalwa
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, lineHeight: 22, color: theme.colors.textSecondary }}>
                    Des moments de silence, de contemplation, de tafakkur et de tadabbur, pour écouter ce qui se passe en soi.
                  </Text>
                </View>

                {/* Section 4: 7 degrés */}
                <View style={{ marginBottom: spacing.xl }}>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: '#FFD369', marginBottom: spacing.sm }}>
                    🧭 Les 7 degrés de l'âme
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, lineHeight: 22, color: theme.colors.textSecondary }}>
                    Le parcours traverse les 7 degrés de l'âme, en lien avec des versets spécifiques, principalement issus de la Sourate Yā Sīn.
                  </Text>
                </View>

                {/* Section 5: Sourates */}
                <View style={{ marginBottom: spacing.xl }}>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: '#FFD369', marginBottom: spacing.sm }}>
                    📖 Vivre les sourates au bon moment
                  </Text>
                  <View style={{ marginLeft: spacing.sm }}>
                    <Text style={{ fontSize: fontSize.sm, lineHeight: 22, color: theme.colors.textSecondary, marginBottom: spacing.sm }}>
                      ✨ <Text style={{ fontWeight: fontWeight.medium, color: theme.colors.text }}>Jours 11 à 17</Text> — Sourate Al-Fātiḥa
                    </Text>
                    <Text style={{ fontSize: fontSize.sm, lineHeight: 22, color: theme.colors.textSecondary }}>
                      🌌 <Text style={{ fontWeight: fontWeight.medium, color: theme.colors.text }}>Jours 28 à 35</Text> — Vortex de Yā Sīn
                    </Text>
                  </View>
                </View>

                {/* Section 6: Points énergétiques */}
                <View style={{ marginBottom: spacing.xl }}>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: '#FFD369', marginBottom: spacing.sm }}>
                    🔋 Points énergétiques
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, lineHeight: 22, color: theme.colors.textSecondary }}>
                    Certains jours sont dédiés à la concentration sur des points énergétiques, pour favoriser l'ancrage, l'équilibre et la circulation intérieure.
                  </Text>
                </View>

                {/* Section 7: Kun fa-yakūn */}
                <View style={{ marginBottom: spacing.xl }}>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: '#FFD369', marginBottom: spacing.sm }}>
                    ✨ Kun fa-yakūn — Les 4 derniers jours
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, lineHeight: 22, color: theme.colors.textSecondary }}>
                    Les 4 derniers jours viennent sceller le parcours. Ce temps marque une redescente consciente :{'\n'}
                    🕊️ intégrer ce qui a été vécu{'\n'}
                    🌱 l'ancrer dans le réel{'\n'}
                    et avancer avec plus de clarté et de justesse.
                  </Text>
                </View>

                {/* Section 8: Conclusion */}
                <View style={{
                  backgroundColor: '#FFD369' + '15',
                  borderRadius: borderRadius.lg,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: '#FFD369' + '30',
                }}>
                  <Text style={{
                    fontSize: fontSize.base,
                    lineHeight: 24,
                    color: theme.colors.text,
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}>
                    🤍 Sabilat Nûr est un chemin à parcourir sans contrainte, avec douceur, sincérité et présence.{'\n\n'}
                    Un chemin pour se réaligner intérieurement, avant de continuer sa route.
                  </Text>
                </View>
              </Animated.View>
            </View>
          </ScrollView>

          {/* Bouton Continuer fixé en bas */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xl,
            paddingTop: spacing.lg,
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
                colors={['#FFD369', '#FFD369DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.xl,
                  borderRadius: borderRadius.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                }}
              >
                <Text style={{
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.bold,
                  color: '#1A1A2E',
                }}>
                  Continuer
                </Text>
                <ArrowRight size={20} color="#1A1A2E" />
              </LinearGradient>
            </Pressable>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Écran de chargement (après la page de présentation)
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // Écran de sélection du chemin
  if (currentScreen === 'onboarding') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.backgroundSecondary]}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View
              style={[
                styles.pageContent,
                {
                  paddingHorizontal: pagePaddingH,
                  paddingTop: pagePaddingV,
                  paddingBottom: spacing['2xl'],
                  maxWidth: contentMaxWidth,
                },
              ]}
            >
              <View style={styles.header}>
              <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                SABILA NUR
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
              Choisissez votre chemin de 40 jours
            </Text>

            {/* Bento Grid Section */}
            <View style={createBentoStyles(COLORS).bentoSection}>
              {/* Premier chemin - Full width */}
              {SABILA_NUR_CHALLENGES.length > 0 && (() => {
                const challenge = SABILA_NUR_CHALLENGES[0];
                const savedProgress = user?.sabilaNurProgress as ChallengeProgress | undefined;
                const isCompleted = savedProgress?.challengeId === challenge.id && savedProgress?.completed;
                const isPremium = PREMIUM_CHALLENGES.includes(challenge.id);
                
                return (
                  <Animated.View
                    entering={FadeIn.duration(400).delay(0).springify()}
                  >
                    <Pressable
                      onPress={() => handleStartChallenge(challenge)}
                      style={({ pressed }) => [
                        createBentoStyles(COLORS).bentoCardFull,
                        pressed && createBentoStyles(COLORS).bentoCardPressed,
                        isCompleted && createBentoStyles(COLORS).bentoCardActive,
                      ]}
                    >
                      <LinearGradient
                        colors={[challenge.color + '08', challenge.color + '03', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={createBentoStyles(COLORS).bentoGradient}
                      >
                        <View style={createBentoStyles(COLORS).bentoHeader}>
                          <View style={[createBentoStyles(COLORS).bentoIconContainer, { 
                            backgroundColor: challenge.color + '15',
                            borderWidth: 1.5,
                            borderColor: challenge.color + '30'
                          }]}>
                            {getChallengeIcon(challenge.iconName, 24, challenge.color)}
                          </View>
                          <View style={{ flex: 1, marginLeft: spacing.sm }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 }}>
                              <Text style={[createBentoStyles(COLORS).bentoTitle, { color: COLORS.textPrimary }]}>{challenge.title}</Text>
                              {isPremium && (
                                <Text style={[createBentoStyles(COLORS).premiumBadge, { color: challenge.color }]}>⭐</Text>
                              )}
                              {isCompleted && (
                                <View style={[styles.validatedBadge, { backgroundColor: challenge.color + '20', borderColor: challenge.color }]}>
                                  <Text style={[styles.validatedBadgeText, { color: challenge.color }]}>Validé</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[createBentoStyles(COLORS).bentoSubtitle, { color: COLORS.textTertiary }]}>
                              {challenge.attribute} — {challenge.attributeArabic}
                            </Text>
                          </View>
                          <ChevronRight size={20} color={COLORS.textTertiary} />
                        </View>
                        
                        <Text style={[createBentoStyles(COLORS).bentoDescription, { color: COLORS.textSecondary, marginTop: spacing.xs, marginBottom: spacing.sm }]}>
                          {challenge.description}
                        </Text>
                        
                        {/* Badges */}
                        <View style={createBentoStyles(COLORS).bentoBadgesContainer}>
                          <View style={[createBentoStyles(COLORS).bentoBadge, { backgroundColor: challenge.color + '15' }]}>
                            <Clock size={12} color={challenge.color} />
                            <Text style={[createBentoStyles(COLORS).bentoBadgeText, { color: challenge.color }]}>40 jours</Text>
                          </View>
                          <View style={[createBentoStyles(COLORS).bentoBadge, { backgroundColor: challenge.color + '15' }]}>
                            <Target size={12} color={challenge.color} />
                            <Text style={[createBentoStyles(COLORS).bentoBadgeText, { color: challenge.color }]}>Personnel</Text>
                          </View>
                          <View style={[createBentoStyles(COLORS).bentoBadge, { backgroundColor: challenge.color + '15' }]}>
                            <Heart size={12} color={challenge.color} />
                            <Text style={[createBentoStyles(COLORS).bentoBadgeText, { color: challenge.color }]}>Débutant</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                );
              })()}

              {/* Autres chemins - Row de 2 */}
              {SABILA_NUR_CHALLENGES.length > 1 && (
                <View style={createBentoStyles(COLORS).bentoRow}>
                  {SABILA_NUR_CHALLENGES.slice(1, 3).map((challenge, index) => {
                    const savedProgress = user?.sabilaNurProgress as ChallengeProgress | undefined;
                    const isCompleted = savedProgress?.challengeId === challenge.id && savedProgress?.completed;
                    const isPremium = PREMIUM_CHALLENGES.includes(challenge.id);
                    
                    return (
                      <Animated.View
                    key={challenge.id}
                        entering={FadeIn.duration(400).delay((index + 1) * 100).springify()}
                        style={{ width: '48%' }}
                      >
                        <Pressable
                    onPress={() => handleStartChallenge(challenge)}
                          style={({ pressed }) => [
                            createBentoStyles(COLORS).bentoCardHalf,
                            pressed && createBentoStyles(COLORS).bentoCardPressed,
                            isCompleted && createBentoStyles(COLORS).bentoCardActive,
                          ]}
                        >
                          <LinearGradient
                            colors={[challenge.color + '08', challenge.color + '03', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={createBentoStyles(COLORS).bentoGradientHalf}
                          >
                            <View style={createBentoStyles(COLORS).bentoHeaderHalf}>
                              <View style={[createBentoStyles(COLORS).bentoIconContainerSmall, { 
                                backgroundColor: challenge.color + '15',
                                borderWidth: 1,
                                borderColor: challenge.color + '30'
                              }]}>
                                {getChallengeIcon(challenge.iconName, 20, challenge.color)}
                              </View>
                              <View style={{ flex: 1, marginLeft: spacing.xs }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Text style={[createBentoStyles(COLORS).bentoTitleSmall, { color: COLORS.textPrimary, flex: 1 }]} numberOfLines={1}>{challenge.title}</Text>
                                  {isPremium && (
                                    <Text style={[createBentoStyles(COLORS).premiumBadgeSmall, { color: challenge.color }]}>⭐</Text>
                                  )}
                                  {isCompleted && (
                                    <CheckCircle size={14} color={challenge.color} />
                                  )}
                                </View>
                                <Text style={[createBentoStyles(COLORS).bentoSubtitleSmall, { color: COLORS.textTertiary }]} numberOfLines={1}>
                                  {challenge.attribute}
                                </Text>
                              </View>
                              <ChevronRight size={16} color={COLORS.textTertiary} />
                            </View>
                            
                            {/* Badges compacts */}
                            <View style={[createBentoStyles(COLORS).bentoBadgesContainer, { marginTop: spacing.xs }]}>
                              <View style={[createBentoStyles(COLORS).bentoBadgeSmall, { backgroundColor: challenge.color + '15' }]}>
                                <Clock size={10} color={challenge.color} />
                                <Text style={[createBentoStyles(COLORS).bentoBadgeTextSmall, { color: challenge.color }]}>40j</Text>
                              </View>
                              <View style={[createBentoStyles(COLORS).bentoBadgeSmall, { backgroundColor: challenge.color + '15' }]}>
                                <Heart size={10} color={challenge.color} />
                                <Text style={[createBentoStyles(COLORS).bentoBadgeTextSmall, { color: challenge.color }]}>Perso</Text>
                              </View>
                            </View>
                          </LinearGradient>
                        </Pressable>
                      </Animated.View>
                );
              })}
                </View>
              )}

              {/* Dernier chemin si impair - Full width */}
              {SABILA_NUR_CHALLENGES.length === 4 && (() => {
                const challenge = SABILA_NUR_CHALLENGES[3];
                const savedProgress = user?.sabilaNurProgress as ChallengeProgress | undefined;
                const isCompleted = savedProgress?.challengeId === challenge.id && savedProgress?.completed;
                const isPremium = PREMIUM_CHALLENGES.includes(challenge.id);
                
                return (
                  <Animated.View
                    entering={FadeIn.duration(400).delay(300).springify()}
                  >
                    <Pressable
                      onPress={() => handleStartChallenge(challenge)}
                      style={({ pressed }) => [
                        createBentoStyles(COLORS).bentoCardFull,
                        pressed && createBentoStyles(COLORS).bentoCardPressed,
                        isCompleted && createBentoStyles(COLORS).bentoCardActive,
                      ]}
                    >
                      <LinearGradient
                        colors={[challenge.color + '08', challenge.color + '03', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={createBentoStyles(COLORS).bentoGradient}
                      >
                        <View style={createBentoStyles(COLORS).bentoHeader}>
                          <View style={[createBentoStyles(COLORS).bentoIconContainer, { 
                            backgroundColor: challenge.color + '15',
                            borderWidth: 1.5,
                            borderColor: challenge.color + '30'
                          }]}>
                            {getChallengeIcon(challenge.iconName, 24, challenge.color)}
                          </View>
                          <View style={{ flex: 1, marginLeft: spacing.sm }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 }}>
                              <Text style={[createBentoStyles(COLORS).bentoTitle, { color: COLORS.textPrimary }]}>{challenge.title}</Text>
                              {isPremium && (
                                <Text style={[createBentoStyles(COLORS).premiumBadge, { color: challenge.color }]}>⭐</Text>
                              )}
                              {isCompleted && (
                                <View style={[styles.validatedBadge, { backgroundColor: challenge.color + '20', borderColor: challenge.color }]}>
                                  <Text style={[styles.validatedBadgeText, { color: challenge.color }]}>Validé</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[createBentoStyles(COLORS).bentoSubtitle, { color: COLORS.textTertiary }]}>
                              {challenge.attribute} — {challenge.attributeArabic}
                            </Text>
                          </View>
                          <ChevronRight size={20} color={COLORS.textTertiary} />
                        </View>
                        
                        <Text style={[createBentoStyles(COLORS).bentoDescription, { color: COLORS.textSecondary, marginTop: spacing.xs, marginBottom: spacing.sm }]}>
                          {challenge.description}
                        </Text>
                        
                        {/* Badges */}
                        <View style={createBentoStyles(COLORS).bentoBadgesContainer}>
                          <View style={[createBentoStyles(COLORS).bentoBadge, { backgroundColor: challenge.color + '15' }]}>
                            <Clock size={12} color={challenge.color} />
                            <Text style={[createBentoStyles(COLORS).bentoBadgeText, { color: challenge.color }]}>40 jours</Text>
                          </View>
                          <View style={[createBentoStyles(COLORS).bentoBadge, { backgroundColor: challenge.color + '15' }]}>
                            <Target size={12} color={challenge.color} />
                            <Text style={[createBentoStyles(COLORS).bentoBadgeText, { color: challenge.color }]}>Personnel</Text>
                          </View>
                          <View style={[createBentoStyles(COLORS).bentoBadge, { backgroundColor: challenge.color + '15' }]}>
                            <Heart size={12} color={challenge.color} />
                            <Text style={[createBentoStyles(COLORS).bentoBadgeText, { color: challenge.color }]}>Débutant</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                );
              })()}
            </View>
            </View>
          </ScrollView>
        </LinearGradient>

        {/* Modal Premium d'explication du chemin (avant d'entrer) - Onboarding */}
        <Modal
          visible={showChallengeExplanation}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!isStartingChallenge) {
              setShowChallengeExplanation(false);
              setPendingChallenge(null);
            }
          }}
        >
          <View style={styles.premiumModalSafeArea}>
            <Pressable 
              style={styles.premiumModalBackdrop}
              onPress={() => {
                if (!isStartingChallenge) {
                  setShowChallengeExplanation(false);
                  setPendingChallenge(null);
                }
              }}
            >
              <SafeAreaView style={styles.premiumModalSafeAreaInner}>
                <Animated.View
                  entering={SlideInUp.duration(500).easing(Easing.out(Easing.ease))}
                  style={styles.premiumModalContainer}
                >
                  <Pressable onPress={(e) => e.stopPropagation()}>
                    <GlassCard style={styles.premiumModalContent}>
                    {/* 1️⃣ Header - Zone d'ancrage émotionnel */}
                    <View style={styles.premiumModalHeader}>
                      {/* Icône centrée */}
                      <View style={[styles.premiumModalIconContainer, { 
                        backgroundColor: pendingChallenge?.color + '15' || theme.colors.accent + '15',
                        borderColor: pendingChallenge?.color + '30' || theme.colors.accent + '30'
                      }]}>
                        {pendingChallenge?.iconName && getChallengeIcon(
                          pendingChallenge.iconName, 
                          36, 
                          pendingChallenge.color || theme.colors.accent
                        )}
                      </View>
                      
                      {/* Titre et sous-titre */}
                      <Text style={[styles.premiumModalTitle, { color: pendingChallenge?.color || theme.colors.accent }]}>
                        {pendingChallenge?.title}
                      </Text>
                      <Text style={[styles.premiumModalSubtitle, { color: theme.colors.textSecondary }]}>
                        {pendingChallenge?.attribute} — {pendingChallenge?.attributeArabic}
                      </Text>
                      
                      {/* Bouton fermer intégré dans le header */}
                      <Pressable
                        onPress={() => {
                          if (!isStartingChallenge) {
                            setShowChallengeExplanation(false);
                            setPendingChallenge(null);
                          }
                        }}
                        style={[styles.premiumModalCloseButton, { 
                          backgroundColor: theme.colors.backgroundSecondary + '80',
                          opacity: isStartingChallenge ? 0.5 : 1
                        }]}
                        disabled={isStartingChallenge}
                      >
                        <X size={18} color={theme.colors.text} />
                      </Pressable>
                    </View>
                  
                    {/* 2️⃣ Body - Contenu structuré */}
                    <ScrollView 
                      style={styles.premiumModalScroll}
                      contentContainerStyle={styles.premiumModalScrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {/* Description courte - Toujours affichée */}
                      {pendingChallenge?.description && (
                        <View style={styles.premiumModalDescriptionContainer}>
                          <Text style={[styles.premiumModalDescription, { color: theme.colors.text }]}>
                            {pendingChallenge.description}
                          </Text>
                        </View>
                      )}
                      
                      {/* Introduction complète */}
                      {pendingChallenge?.introduction && (
                        <View style={styles.premiumModalIntroductionContainer}>
                          <Text style={[styles.premiumModalIntention, { color: theme.colors.text, opacity: 0.85 }]}>
                            {pendingChallenge.introduction}
                          </Text>
                        </View>
                      )}
                      
                      {/* Ce que tu vas vivre (liste claire) */}
                      <View style={styles.premiumModalSection}>
                        <View style={styles.premiumModalSectionHeader}>
                          <Sparkles size={20} color={pendingChallenge?.color || theme.colors.accent} />
                          <Text style={[styles.premiumModalSectionTitle, { color: theme.colors.text }]}>
                            Ce que tu vas vivre
                          </Text>
                        </View>
                        <View style={styles.premiumModalList}>
                          <View style={styles.premiumModalListItem}>
                            <Text style={styles.premiumModalListIcon}>🌙</Text>
                            <Text style={[styles.premiumModalListText, { color: theme.colors.text }]}>
                              Pratiques quotidiennes guidées
                            </Text>
                          </View>
                          <View style={styles.premiumModalListItem}>
                            <Text style={styles.premiumModalListIcon}>✨</Text>
                            <Text style={[styles.premiumModalListText, { color: theme.colors.text }]}>
                              Exercices de purification intérieure
                            </Text>
                          </View>
                          <View style={styles.premiumModalListItem}>
                            <Text style={styles.premiumModalListIcon}>📖</Text>
                            <Text style={[styles.premiumModalListText, { color: theme.colors.text }]}>
                              Rappels spirituels et intentions
                            </Text>
                          </View>
                          <View style={styles.premiumModalListItem}>
                            <Text style={styles.premiumModalListIcon}>🧠</Text>
                            <Text style={[styles.premiumModalListText, { color: theme.colors.text }]}>
                              Discipline douce et consciente
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Badges metadata */}
                      <View style={styles.premiumModalBadgesContainer}>
                        <View style={[styles.premiumModalBadge, { backgroundColor: pendingChallenge?.color + '15' || theme.colors.accent + '15' }]}>
                          <Clock size={14} color={pendingChallenge?.color || theme.colors.accent} />
                          <Text style={[styles.premiumModalBadgeText, { color: pendingChallenge?.color || theme.colors.accent }]}>
                            40 jours
                          </Text>
                        </View>
                        <View style={[styles.premiumModalBadge, { backgroundColor: pendingChallenge?.color + '15' || theme.colors.accent + '15' }]}>
                          <Target size={14} color={pendingChallenge?.color || theme.colors.accent} />
                          <Text style={[styles.premiumModalBadgeText, { color: pendingChallenge?.color || theme.colors.accent }]}>
                            Personnel
                          </Text>
                        </View>
                        <View style={[styles.premiumModalBadge, { backgroundColor: pendingChallenge?.color + '15' || theme.colors.accent + '15' }]}>
                          <Heart size={14} color={pendingChallenge?.color || theme.colors.accent} />
                          <Text style={[styles.premiumModalBadgeText, { color: pendingChallenge?.color || theme.colors.accent }]}>
                            Débutant
                          </Text>
                        </View>
                      </View>
                    </ScrollView>
                  
                    {/* 3️⃣ Footer - Zone d'action */}
                    <View style={styles.premiumModalFooter}>
                      {/* Séparation visuelle */}
                      <View style={[styles.premiumModalFooterSeparator, { backgroundColor: theme.colors.backgroundSecondary }]} />
                      
                      {/* Bouton principal CTA */}
                      <Pressable
                        onPress={enterChallenge}
                        style={[styles.premiumModalPrimaryButton, { opacity: isStartingChallenge ? 0.7 : 1 }]}
                        disabled={isStartingChallenge}
                      >
                        <LinearGradient
                          colors={[pendingChallenge?.color || theme.colors.accent, `${pendingChallenge?.color || theme.colors.accent}DD`]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.premiumModalPrimaryButtonGradient}
                        >
                          {isStartingChallenge ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Text style={[styles.premiumModalPrimaryButtonText, { color: '#FFFFFF' }]}>
                                Commencer le chemin
                              </Text>
                              <ArrowRight size={20} color="#FFFFFF" />
                            </>
                          )}
                        </LinearGradient>
                      </Pressable>
                      
                      {/* Bouton secondaire discret */}
                      <Pressable
                        onPress={() => {
                          if (!isStartingChallenge) {
                            setShowChallengeExplanation(false);
                            setPendingChallenge(null);
                          }
                        }}
                        style={[styles.premiumModalSecondaryButton, { opacity: isStartingChallenge ? 0.5 : 1 }]}
                        disabled={isStartingChallenge}
                      >
                        <Text style={[styles.premiumModalSecondaryButtonText, { color: theme.colors.textSecondary }]}>
                          Plus tard
                        </Text>
                      </Pressable>
                    </View>
                  </GlassCard>
                </Pressable>
              </Animated.View>
              </SafeAreaView>
            </Pressable>
          </View>
        </Modal>

        {/* Paywall Modal pour les chemins premium */}
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          resetAt={null}
          messagesUsed={0}
          mode="subscription"
        />
        
        {/* Modal d'introduction du module Sabilat Nûr */}
        <ModuleIntroductionModal
          visible={showModuleIntroduction}
          onClose={() => {
            // Ne pas marquer comme vu, pour que le modal puisse s'afficher à nouveau
            setShowModuleIntroduction(false);
          }}
          title="🌙 Sabilat Nûr — Le chemin des 40 jours"
          icon={<Sparkles size={36} color="#FFD369" />}
          color="#FFD369"
          content={MODULE_INTRODUCTIONS.SABILAT_NUR}
          buttonText="Commencer"
        />
      </SafeAreaView>
    );
  }

  // Écran du jour actuel
  if (!dayData || !selectedChallenge) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Jour non trouvé
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View
            style={[
              styles.pageContent,
              {
                paddingHorizontal: pagePaddingH,
                paddingTop: pagePaddingV,
                paddingBottom: spacing['2xl'],
                maxWidth: contentMaxWidth,
              },
            ]}
          >
          {/* Header */}
          <Animated.View 
            entering={FadeIn.duration(500).easing(Easing.out(Easing.ease))}
            style={styles.dayHeader}
          >
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={[styles.dayTitle, { color: theme.colors.text }]}>
                {dayData.title}
              </Text>
              {dayData.block && (
                <Text style={[styles.dayBlock, { color: theme.colors.textSecondary }]}>
                  {dayData.block}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <Pressable onPress={() => setShowDayMenu(true)} style={styles.menuButton}>
                <Menu size={24} color={theme.colors.text} />
              </Pressable>
              <Pressable onPress={() => setShowQuitModal(true)} style={styles.quitButton}>
                <X size={20} color="#ef4444" />
              </Pressable>
            </View>
          </Animated.View>

          {/* Progress Bar */}
          <Animated.View 
            entering={FadeIn.duration(500).delay(100).easing(Easing.out(Easing.ease))}
            style={styles.progressContainer}
          >
            <View style={[styles.progressBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  progressAnimatedStyle,
                  { 
                    backgroundColor: selectedChallenge.color,
                    shadowColor: selectedChallenge.color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 4,
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              Jour {currentDay} / 40
            </Text>
          </Animated.View>

          {/* Challenge Info */}
          <Animated.View 
            entering={FadeIn.duration(500).delay(150).easing(Easing.out(Easing.ease))}
            style={styles.challengeInfo}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {getChallengeIcon(selectedChallenge.iconName, 24, selectedChallenge.color)}
            <Text style={[styles.challengeName, { color: selectedChallenge.color }]}>
                {selectedChallenge.title}
            </Text>
            </View>
            <Text style={[styles.challengeAttribute, { color: theme.colors.textSecondary }]}>
              {selectedChallenge.attribute} — {selectedChallenge.attributeArabic}
            </Text>
          </Animated.View>

          {/* Verse Block */}
          {dayData.verse && (
            <Animated.View
              entering={FadeIn.duration(500).delay(200).easing(Easing.out(Easing.ease))}
            >
              <Pressable
                onPress={() => setExpandedVerse(!expandedVerse)}
                style={styles.verseBlockPressable}
              >
                <GlassCard style={styles.verseBlock}>
                  <View style={styles.verseHeader}>
                    <Text style={[styles.verseReference, { color: theme.colors.accent }]}>
                      {dayData.verse.reference}
                    </Text>
                    <View style={styles.verseActions}>
                      <Pressable
                        onPress={async (e) => {
                          e.stopPropagation();
                          if (readingVerse) {
                            stopSpeaking();
                            setReadingVerse(false);
                          } else {
                            const textToRead = dayData.verse.arabic 
                              ? `${dayData.verse.arabic}\n${dayData.verse.translation || ''}`
                              : dayData.verse.translation || '';
                            if (textToRead.trim()) {
                              setReadingVerse(true);
                              try {
                                await speak(textToRead, { language: 'ar-SA', rate: 0.7 });
                              } catch (error) {
                                console.error('Erreur lecture verset:', error);
                              } finally {
                                setReadingVerse(false);
                              }
                            }
                          }
                        }}
                        style={styles.verseActionButton}
                      >
                        {readingVerse ? (
                          <VolumeX size={20} color={theme.colors.accent} />
                        ) : (
                          <Volume2 size={20} color={theme.colors.accent} />
                        )}
                      </Pressable>
                      {expandedVerse ? (
                        <ChevronUp size={20} color={theme.colors.textSecondary} />
                      ) : (
                        <ChevronDown size={20} color={theme.colors.textSecondary} />
                      )}
                    </View>
                  </View>
                  {expandedVerse && (
                    <Animated.View entering={FadeIn.duration(200)}>
                      {dayData.verse.arabic && (
                        <Text style={[styles.verseArabic, { color: theme.colors.text }]}>
                          {dayData.verse.arabic}
                        </Text>
                      )}
                      <Text style={[styles.verseTranslation, { color: theme.colors.textSecondary }]}>
                        {dayData.verse.translation}
                      </Text>
                    </Animated.View>
                  )}
                </GlassCard>
              </Pressable>
            </Animated.View>
          )}

          {/* Tasks */}
          <Animated.View 
            entering={FadeIn.duration(500).delay(250).easing(Easing.out(Easing.ease))}
            style={styles.tasksContainer}
          >
            <View style={styles.tasksHeader}>
              <Text style={[styles.tasksTitle, { color: theme.colors.text }]}>
                {currentDay === 1 ? 'Définir votre intention' : `Tâches du jour (${tasksCompleted}/${tasksToCount})`}
              </Text>
            </View>
            
            {/* Affichage spécial pour le jour 1 uniquement (intention) */}
            {currentDay === 1 ? (
              <>
                {/* Champ de texte pour l'intention */}
                <Animated.View
                  entering={FadeIn.duration(500).delay(300).easing(Easing.out(Easing.ease))}
                >
                  <GlassCard style={styles.intentionCard}>
                    <Text style={[styles.intentionLabel, { color: theme.colors.textSecondary }]}>
                      🤍 Intention guidée
                    </Text>
                    <Text style={[styles.intentionHelper, { color: theme.colors.textSecondary }]}>
                      Questionne ton cœur, simplement :
                    </Text>
                    <Text style={[styles.intentionQuestion, { color: theme.colors.text }]}>
                      • Qu'est-ce que je veux apaiser en moi ?{'\n'}
                      • Qu'est-ce qui me pèse le plus aujourd'hui ?{'\n'}
                      • Quelle gêne revient souvent dans mon cœur ?
                    </Text>
                    <TextInput
                      style={[styles.intentionInput, { 
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.backgroundSecondary
                      }]}
                      value={intention}
                      onChangeText={(text) => {
                        setIntention(text);
                        // Sauvegarder automatiquement
                        if (selectedChallenge) {
                          const tasksByDay: Record<number, number[]> = {};
                          completedTasks.forEach(key => {
                            const [d, idx] = key.split('-').map(Number);
                            if (!tasksByDay[d]) tasksByDay[d] = [];
                            tasksByDay[d].push(idx);
                          });
                          
                          const completedTasksArray = Object.entries(tasksByDay).map(([day, indices]) => ({
                            day: Number(day),
                            taskIndices: indices
                          }));
                          
                          const progress: ChallengeProgress = {
                            challengeId: selectedChallenge.id,
                            currentDay,
                            startDate: user?.sabilaNurProgress?.startDate || new Date().toISOString(),
                            intention: text,
                            completedTasks: completedTasksArray
                          };
                          
                          saveProgress(progress);
                        }
                      }}
                      placeholder="Ô Allah, je fais ce chemin pour apaiser mon cœur de..."
                      placeholderTextColor={theme.colors.textSecondary}
                      multiline
                      numberOfLines={8}
                      textAlignVertical="top"
                    />
                  </GlassCard>
                </Animated.View>

                {/* Checkboxes pour Nur Shifa et Kalwa */}
                {currentTasks.map((task, index) => {
                  if (task.type === 'intention') return null; // Ne pas afficher la tâche intention
                  
                  const isCompleted = completedTasks.has(`${currentDay}-${index}`);
                  const taskType = task.type;
                  const isNurShifa = taskType === 'nur_shifa';
                  const isKalwa = taskType === 'kalwa';
                  
                  if (!isNurShifa && !isKalwa) return null; // Ne montrer que Nur Shifa et Kalwa
                  
                  return (
                    <Animated.View
                      key={index}
                      entering={FadeIn.duration(500).delay(350 + index * 50).easing(Easing.out(Easing.ease))}
                    >
                      <Pressable
                        onPress={() => handleTaskPress(task, index)}
                        style={[
                          styles.checkboxTaskItem,
                          { 
                            borderColor: isCompleted ? selectedChallenge.color : theme.colors.backgroundSecondary,
                            borderWidth: 2,
                            backgroundColor: isCompleted ? selectedChallenge.color + '10' : 'transparent',
                          }
                        ]}
                      >
                        <GlassCard style={styles.checkboxTaskCard}>
                          <View style={styles.checkboxTaskContent}>
                            {isCompleted ? (
                              <Animated.View entering={FadeIn.duration(200).springify()}>
                                <CheckCircle size={28} color={selectedChallenge.color} fill={selectedChallenge.color + '20'} />
                              </Animated.View>
                            ) : (
                              <Circle size={28} color={theme.colors.textSecondary} strokeWidth={2} />
                            )}
                            <View style={styles.checkboxTaskTextContainer}>
                              <Text style={[styles.checkboxTaskType, { color: theme.colors.textSecondary }]}>
                                {getTaskTypeLabel(taskType)}
                              </Text>
                              <Text style={[styles.checkboxTaskDescription, { color: theme.colors.text }]}>
                                {task.description.split('\n')[0]} {/* Première ligne seulement */}
                              </Text>
                            </View>
                            <ExternalLink size={20} color={selectedChallenge.color} />
                          </View>
                        </GlassCard>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </>
            ) : (
              /* Affichage normal pour les autres jours */
              currentTasks.map((task, index) => {
                const isCompleted = completedTasks.has(`${currentDay}-${index}`);
                const taskType = task.type;
                const isActionable = taskType === 'kalwa' || taskType === 'nur_shifa' || taskType === 'intention';
                
                return (
                  <Animated.View
                    key={index}
                    entering={FadeIn.duration(500).delay(300 + index * 50).easing(Easing.out(Easing.ease))}
                  >
                    <Pressable
                      onPress={() => handleTaskPress(task, index)}
                      style={[
                        styles.taskItem,
                        { 
                          borderColor: isCompleted ? selectedChallenge.color : 'transparent',
                          borderWidth: isCompleted ? 2 : 0,
                          shadowColor: isCompleted ? selectedChallenge.color : 'transparent',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isCompleted ? 0.3 : 0,
                          shadowRadius: isCompleted ? 8 : 0,
                          elevation: isCompleted ? 4 : 0,
                        }
                      ]}
                    >
                      <GlassCard style={styles.taskCard}>
                        <View style={styles.taskContent}>
                          {/* Checkbox pour toutes les tâches */}
                          <Pressable
                            onPress={() => {
                              // Toggle completion pour toutes les tâches
                              const taskKey = `${currentDay}-${index}`;
                              const newCompleted = new Set(completedTasks);
                              
                              if (newCompleted.has(taskKey)) {
                                newCompleted.delete(taskKey);
                              } else {
                                newCompleted.add(taskKey);
                              }
                              
                              setCompletedTasks(newCompleted);
                              
                              if (selectedChallenge) {
                                const tasksByDay: Record<number, number[]> = {};
                                newCompleted.forEach(key => {
                                  const [d, idx] = key.split('-').map(Number);
                                  if (!tasksByDay[d]) tasksByDay[d] = [];
                                  tasksByDay[d].push(idx);
                                });
                                
                                const completedTasksArray = Object.entries(tasksByDay).map(([day, indices]) => ({
                                  day: Number(day),
                                  taskIndices: indices
                                }));
                                
                                const progress: ChallengeProgress = {
                                  challengeId: selectedChallenge.id,
                                  currentDay,
                                  startDate: user?.sabilaNurProgress?.startDate || new Date().toISOString(),
                                  intention: intention || user?.sabilaNurProgress?.intention || '',
                                  completedTasks: completedTasksArray
                                };
                                
                                saveProgress(progress);
                              }
                            }}
                            style={styles.checkboxPressable}
                          >
                            {isCompleted ? (
                              <Animated.View entering={FadeIn.duration(200).springify()}>
                                <CheckCircle size={24} color={selectedChallenge.color} fill={selectedChallenge.color + '20'} />
                              </Animated.View>
                            ) : (
                              <Circle size={24} color={theme.colors.textSecondary} />
                            )}
                          </Pressable>
                          <View style={styles.taskTextContainer}>
                            <View style={styles.taskTypeRow}>
                              <Text style={[styles.taskType, { color: theme.colors.textSecondary }]}>
                                {getTaskTypeLabel(taskType)}
                              </Text>
                              {isActionable && (
                                <ExternalLink size={16} color={selectedChallenge.color} />
                              )}
                            </View>
                            <Text style={[styles.taskDescription, { color: theme.colors.text }]}>
                              {task.description}
                            </Text>
                          </View>
                        </View>
                      </GlassCard>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>

          </View>
        </ScrollView>

        {/* Modal Intention */}
        <Modal
          visible={showIntentionModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowIntentionModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowIntentionModal(false)}
          >
            <Animated.View
              entering={SlideInUp.duration(300).springify()}
              exiting={SlideOutDown.duration(200)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <GlassCard style={styles.modalContent}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    Définir votre intention
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                    Écrivez votre intention pour ce chemin de 40 jours
                  </Text>
                  <TextInput
                    style={[styles.modalInput, { 
                      backgroundColor: theme.colors.backgroundSecondary,
                      color: theme.colors.text,
                      borderColor: theme.colors.backgroundSecondary
                    }]}
                    value={intentionText}
                    onChangeText={setIntentionText}
                    placeholder="Mon intention est..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  <View style={styles.modalButtons}>
                    <Pressable
                      onPress={() => setShowIntentionModal(false)}
                      style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: theme.colors.backgroundSecondary }]}
                    >
                      <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                        Annuler
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSaveIntention}
                      style={styles.modalButton}
                    >
                      <LinearGradient
                        colors={[selectedChallenge?.color || theme.colors.accent, `${selectedChallenge?.color || theme.colors.accent}DD`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                          Sauvegarder
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Boutons flottants de navigation */}
        {currentScreen === 'day' && selectedChallenge && (
          <>
            {currentDay === 40 ? (
              // Bouton Valider flottant au jour 40 (toujours visible)
              <Animated.View
                entering={FadeIn.duration(400).delay(400)}
                style={[
                  styles.floatingButton,
                  styles.floatingButtonCenter,
                  { bottom: insets.bottom + spacing.lg }
                ]}
              >
                <Pressable
                  onPress={handleCompleteChallenge}
                  style={styles.floatingButtonPressable}
                >
                  <LinearGradient
                    colors={[selectedChallenge.color, `${selectedChallenge.color}DD`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.floatingButtonGradient, { 
                      width: 200,
                      flexDirection: 'row',
                      paddingHorizontal: spacing.lg,
                      gap: spacing.sm
                    }]}
                  >
                    <CheckCircle size={24} color="#FFFFFF" />
                    <Text style={[styles.floatingButtonText, { color: '#FFFFFF' }]}>
                      Valider le chemin
                    </Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : isLastDayOfBlock(currentDay) && currentDay < 40 ? (
              // Bouton Valider le bloc pour les derniers jours de chaque bloc
              <Animated.View
                entering={FadeIn.duration(400).delay(400)}
                style={[
                  styles.floatingButton,
                  styles.floatingButtonCenter,
                  { bottom: insets.bottom + spacing.lg }
                ]}
              >
                <Pressable
                  onPress={handleNextDay}
                  style={styles.floatingButtonPressable}
                >
                  <LinearGradient
                    colors={[selectedChallenge.color, `${selectedChallenge.color}DD`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.floatingButtonGradient, { 
                      width: 200,
                      flexDirection: 'row',
                      paddingHorizontal: spacing.lg,
                      gap: spacing.sm
                    }]}
                  >
                    <CheckCircle size={24} color="#FFFFFF" />
                    <Text style={[styles.floatingButtonText, { color: '#FFFFFF' }]}>
                      Valider le bloc
                    </Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : (
              <>
                {/* Bouton Précédent (gauche) */}
                {currentDay > 1 && (
                  <Animated.View
                    entering={FadeIn.duration(400).delay(400)}
                    style={[
                      styles.floatingButton,
                      styles.floatingButtonLeft,
                      { bottom: insets.bottom + spacing.lg }
                    ]}
                  >
                    <Pressable
                      onPress={handlePreviousDay}
                      style={styles.floatingButtonPressable}
                    >
                      <View style={[styles.floatingButtonContent, { backgroundColor: theme.colors.backgroundSecondary }]}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                      </View>
                    </Pressable>
                  </Animated.View>
                )}

                {/* Bouton Suivant (droite) */}
                {currentDay < 40 && (
                  <Animated.View
                    entering={FadeIn.duration(400).delay(400)}
                    style={[
                      styles.floatingButton,
                      styles.floatingButtonRight,
                      { bottom: insets.bottom + spacing.lg }
                    ]}
                  >
                    <Pressable
                      onPress={handleNextDay}
                      style={styles.floatingButtonPressable}
                    >
                      <LinearGradient
                        colors={[selectedChallenge.color, `${selectedChallenge.color}DD`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.floatingButtonGradient}
                      >
                        <ArrowRight size={24} color="#FFFFFF" />
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                )}
              </>
            )}
          </>
        )}

        {/* Modal Confirmation Quitter */}
        <Modal
          visible={showQuitModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQuitModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowQuitModal(false)}
          >
            <Animated.View
              entering={SlideInUp.duration(300).springify()}
              exiting={SlideOutDown.duration(200)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <GlassCard style={styles.quitModalContent}>
                  <Text style={[styles.quitModalTitle, { color: theme.colors.text }]}>
                    Quitter le chemin
                  </Text>
                  <Text style={[styles.quitModalText, { color: theme.colors.textSecondary }]}>
                    Êtes-vous sûr de vouloir quitter ce chemin ?{'\n\n'}
                    Toute votre progression sera supprimée et ne pourra pas être récupérée.
                  </Text>
                  <View style={styles.quitModalButtons}>
                    <Pressable
                      onPress={() => setShowQuitModal(false)}
                      style={[styles.quitModalButton, styles.quitModalButtonCancel, { backgroundColor: theme.colors.backgroundSecondary }]}
                    >
                      <Text style={[styles.quitModalButtonText, { color: theme.colors.text }]}>
                        Annuler
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleQuitChallenge}
                      style={styles.quitModalButton}
                    >
                      <LinearGradient
                        colors={['#ef4444', '#dc2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.quitModalButtonGradient}
                      >
                        <Text style={[styles.quitModalButtonText, { color: '#FFFFFF' }]}>
                          Quitter
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Modal Menu des jours */}
        <Modal
          visible={showDayMenu}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDayMenu(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowDayMenu(false)}
          >
            <Animated.View
              entering={SlideInUp.duration(300).springify()}
              exiting={SlideOutDown.duration(200)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <GlassCard style={styles.dayMenuContent}>
                  <View style={styles.dayMenuHeader}>
                    <Text style={[styles.dayMenuTitle, { color: theme.colors.text }]}>
                      Navigation — Tous les jours
                    </Text>
                    <Pressable onPress={() => setShowDayMenu(false)} style={styles.closeButton}>
                      <X size={20} color={theme.colors.text} />
                    </Pressable>
                  </View>
                  
                  <ScrollView style={styles.dayMenuScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.daysGrid}>
                      {Array.from({ length: 40 }, (_, i) => i + 1).map((day, index) => {
                        const progress = getDayProgress(day);
                        const isCurrentDay = day === currentDay;
                        const dayData = selectedChallenge ? getDayByNumber(selectedChallenge, day) : null;
                        const isCompleted = progress.percentage === 100;
                        
                        return (
                          <Animated.View
                            key={day}
                            entering={FadeIn.duration(200).delay(index * 10)}
                          >
                            <Pressable
                              onPress={() => handleGoToDay(day)}
                              style={[
                                styles.dayMenuItem,
                                { width: dayMenuItemSize, height: dayMenuItemSize },
                                {
                                  backgroundColor: isCurrentDay 
                                    ? selectedChallenge?.color || theme.colors.accent
                                    : theme.colors.backgroundSecondary,
                                  borderColor: isCurrentDay 
                                    ? selectedChallenge?.color || theme.colors.accent
                                    : 'transparent',
                                  borderWidth: isCurrentDay ? 2 : 0,
                                  shadowColor: isCurrentDay ? selectedChallenge?.color : 'transparent',
                                  shadowOffset: { width: 0, height: 4 },
                                  shadowOpacity: isCurrentDay ? 0.4 : 0,
                                  shadowRadius: isCurrentDay ? 8 : 0,
                                  elevation: isCurrentDay ? 6 : 0,
                                }
                              ]}
                            >
                              <View style={styles.dayMenuItemContent}>
                                <Text style={[
                                  styles.dayMenuItemNumber,
                                  { 
                                    color: isCurrentDay ? '#FFFFFF' : theme.colors.text,
                                    fontWeight: isCurrentDay ? 'bold' : 'normal'
                                  }
                                ]}>
                                  {day}
                                </Text>
                                {isCompleted && (
                                  <Animated.View entering={FadeIn.duration(200)}>
                                    <CheckCircle size={16} color={isCurrentDay ? '#FFFFFF' : selectedChallenge?.color || theme.colors.accent} />
                                  </Animated.View>
                                )}
                              </View>
                              {progress.total > 0 && (
                                <View style={styles.dayMenuProgress}>
                                  <View style={[
                                    styles.dayMenuProgressBar,
                                    {
                                      backgroundColor: isCurrentDay 
                                        ? 'rgba(255, 255, 255, 0.3)'
                                        : theme.colors.background
                                    }
                                  ]}>
                                    <View style={[
                                      styles.dayMenuProgressFill,
                                      {
                                        width: `${progress.percentage}%`,
                                        backgroundColor: isCurrentDay 
                                          ? '#FFFFFF'
                                          : selectedChallenge?.color || theme.colors.accent,
                                        shadowColor: isCurrentDay ? 'transparent' : selectedChallenge?.color,
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: 0.6,
                                        shadowRadius: 4,
                                      }
                                    ]} />
                                  </View>
                                </View>
                              )}
                              {dayData?.blockNumber && (
                                <Text style={[
                                  styles.dayMenuBlock,
                                  { color: isCurrentDay ? 'rgba(255, 255, 255, 0.7)' : theme.colors.textSecondary }
                                ]}>
                                  Bloc {dayData.blockNumber}
                                </Text>
                              )}
                            </Pressable>
                          </Animated.View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </GlassCard>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Modal Sélection Ambiance pour Kalwa */}
        <Modal
          visible={showAmbianceModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowAmbianceModal(false);
            setPendingKalwaTask(null);
          }}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => {
              setShowAmbianceModal(false);
              setPendingKalwaTask(null);
            }}
          >
            <Animated.View
              entering={SlideInUp.duration(300).springify()}
              exiting={SlideOutDown.duration(200)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <GlassCard style={styles.modalContent}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    Choisir une ambiance
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                    Sélectionnez l'ambiance sonore pour votre kalwa
                  </Text>
                  
                  <ScrollView style={styles.ambianceScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.ambianceGrid}>
                      {soundAmbiances
                        .filter(a => {
                          // Filtrer l'ambiance neige-faina si l'utilisateur n'est pas admin
                          if (a.id === 'neige-faina') {
                            return user?.isAdmin === true || user?.isSpecial === true;
                          }
                          return true;
                        })
                        .map((ambiance) => {
                          const isSelected = selectedAmbiance === ambiance.id;
                          return (
                            <Pressable
                              key={ambiance.id}
                              onPress={() => setSelectedAmbiance(ambiance.id)}
                              style={[
                                styles.ambianceCard,
                                {
                                  backgroundColor: isSelected 
                                    ? selectedChallenge?.color + '20' || theme.colors.accent + '20'
                                    : theme.colors.backgroundSecondary,
                                  borderColor: isSelected 
                                    ? selectedChallenge?.color || theme.colors.accent
                                    : 'transparent',
                                  borderWidth: isSelected ? 2 : 1,
                                }
                              ]}
                            >
                              <Text style={styles.ambianceIcon}>{ambiance.icon}</Text>
                              <Text style={[styles.ambianceName, { color: theme.colors.text }]}>
                                {ambiance.name}
                              </Text>
                              <Text style={[styles.ambianceDescription, { color: theme.colors.textSecondary }]}>
                                {ambiance.description}
                              </Text>
                              {isSelected && (
                                <Animated.View entering={FadeIn.duration(200)} style={styles.ambianceCheck}>
                                  <CheckCircle size={20} color={selectedChallenge?.color || theme.colors.accent} />
                                </Animated.View>
                              )}
                            </Pressable>
                          );
                        })}
                    </View>
                  </ScrollView>
                  
                  <View style={styles.modalButtons}>
                    <Pressable
                      onPress={() => {
                        setShowAmbianceModal(false);
                        setPendingKalwaTask(null);
                      }}
                      style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: theme.colors.backgroundSecondary }]}
                    >
                      <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                        Annuler
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleConfirmAmbiance}
                      style={styles.modalButton}
                    >
                      <LinearGradient
                        colors={[selectedChallenge?.color || theme.colors.accent, `${selectedChallenge?.color || theme.colors.accent}DD`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                          Continuer
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Modal Verset NurShifa */}
        <Modal
          visible={showVerseModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            // Marquer la tâche Nur Shifa comme complétée quand on ferme le modal
            if (verseModalData) {
              markTaskAsCompleted(currentDay, verseModalData.taskIndex);
            }
            setShowVerseModal(false);
            setVerseModalData(null);
          }}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => {
              // Marquer la tâche Nur Shifa comme complétée quand on ferme le modal
              if (verseModalData) {
                markTaskAsCompleted(currentDay, verseModalData.taskIndex);
              }
              setShowVerseModal(false);
              setVerseModalData(null);
            }}
          >
            <Animated.View
              entering={SlideInUp.duration(300).springify()}
              exiting={SlideOutDown.duration(200)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <GlassCard style={[styles.modalContent, { maxHeight: '85%' }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                      {verseModalData?.task.description || 'Nur Shifa'}
                    </Text>
                    <Pressable
                      onPress={() => {
                        // Marquer la tâche Nur Shifa comme complétée quand on ferme le modal
                        if (verseModalData) {
                          markTaskAsCompleted(currentDay, verseModalData.taskIndex);
                        }
                        setShowVerseModal(false);
                        setVerseModalData(null);
                      }}
                      style={styles.closeButton}
                    >
                      <X size={24} color={theme.colors.text} />
                    </Pressable>
                  </View>
                  
                  <ScrollView 
                    style={styles.verseModalScroll} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: spacing.xl }}
                  >
                    {(() => {
                      if (!verseModalData) return null;
                      
                      const { surahNumber, verseStart, verseEnd, special } = verseModalData;
                      
                      // Cas spécial : Ayat al-Kursi + 3 Qul (jour 40)
                      if (special === 'ayat-kursi-3qul') {
                        return (
                          <View>
                            <Text style={[styles.verseReference, { color: theme.colors.accent, marginBottom: spacing.lg }]}>
                              Ayat al-Kursi + 3 Qul
                            </Text>
                            <Text style={[styles.verseSpecialNote, { color: theme.colors.textSecondary, marginBottom: spacing.lg, fontStyle: 'italic', textAlign: 'center' }]}>
                              Récitez ces versets avec présence et intention
                            </Text>
                            <Text style={[styles.verseSpecialText, { color: theme.colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
                              Pour lire ces versets :
                              {'\n\n'}
                              • Ayat al-Kursi : Sourate 2 (Al-Baqara), verset 255
                              {'\n'}
                              • Al-Ikhlas : Sourate 112
                              {'\n'}
                              • Al-Falaq : Sourate 113
                              {'\n'}
                              • An-Nas : Sourate 114
                              {'\n\n'}
                              Utilisez le bouton "Ouvrir dans le Coran" pour accéder à ces versets.
                            </Text>
                          </View>
                        );
                      }
                      
                      // Al-Fatiha : utiliser les données locales
                      if (surahNumber === 1) {
                        const verses = verseStart && verseEnd 
                          ? getAlFatihaVersesRange(verseStart, verseEnd)
                          : getAllAlFatihaVerses();
                        
                        return (
                          <View>
                            <Text style={[styles.verseReference, { color: theme.colors.accent, marginBottom: spacing.lg }]}>
                              Sourate Al-Fâtiha (1)
                            </Text>
                            {verses.map((verse, index) => (
                              <View key={verse.number} style={[styles.verseContainer, { marginBottom: spacing.lg }]}>
                                <Text style={[styles.verseNumber, { color: theme.colors.accent }]}>
                                  {verse.number}
                                </Text>
                                <View style={styles.verseContent}>
                                  <Text style={[styles.verseArabic, { color: theme.colors.text, textAlign: 'right' }]}>
                                    {verse.arabic}
                                  </Text>
                                  <Text style={[styles.verseTranslation, { color: theme.colors.textSecondary, marginTop: spacing.md }]}>
                                    {verse.translation}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        );
                      }
                      
                      // Autres sourates : utiliser le contexte Quran
                      if (quranState.loading) {
                        return (
                          <View style={styles.verseLoadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.accent} />
                            <Text style={[styles.verseLoadingText, { color: theme.colors.textSecondary }]}>
                              Chargement du verset...
                            </Text>
                          </View>
                        );
                      }
                      
                      if (quranState.error) {
                        return (
                          <View style={styles.verseErrorContainer}>
                            <Text style={[styles.verseErrorText, { color: theme.colors.textSecondary }]}>
                              {quranState.error}
                            </Text>
                            <Pressable
                              onPress={() => loadSurah(surahNumber)}
                              style={[styles.verseRetryButton, { backgroundColor: theme.colors.accent }]}
                            >
                              <Text style={[styles.verseRetryText, { color: '#FFFFFF' }]}>
                                Réessayer
                              </Text>
                            </Pressable>
                          </View>
                        );
                      }
                      
                      if (quranState.verses.length === 0) {
                        return (
                          <View style={styles.verseErrorContainer}>
                            <Text style={[styles.verseErrorText, { color: theme.colors.textSecondary }]}>
                              Aucun verset disponible
                            </Text>
                          </View>
                        );
                      }
                      
                      // Filtrer les versets selon la plage
                      const filteredVerses = verseStart && verseEnd
                        ? quranState.verses.filter(v => {
                            const num = v.numberInSurah || v.number;
                            return num >= verseStart && num <= verseEnd;
                          })
                        : quranState.verses;
                      
                      const surah = quranState.arabicData;
                      
                      return (
                        <View>
                          <Text style={[styles.verseReference, { color: theme.colors.accent, marginBottom: spacing.lg }]}>
                            {surah?.name || `Sourate ${surahNumber}`}
                            {verseStart && verseEnd && ` (${verseStart}-${verseEnd})`}
                          </Text>
                          {filteredVerses.map((verse, index) => (
                            <View key={verse.number} style={[styles.verseContainer, { marginBottom: spacing.lg }]}>
                              <Text style={[styles.verseNumber, { color: theme.colors.accent }]}>
                                {verse.numberInSurah || verse.number}
                              </Text>
                              <View style={styles.verseContent}>
                                <Text style={[styles.verseArabic, { color: theme.colors.text, textAlign: 'right' }]}>
                                  {verse.arabic}
                                </Text>
                                <Text style={[styles.verseTranslation, { color: theme.colors.textSecondary, marginTop: spacing.md }]}>
                                  {verse.french}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })()}
                  </ScrollView>
                  
                  <View style={styles.modalButtons}>
                      <Pressable
                      onPress={() => {
                        // Marquer la tâche Nur Shifa comme complétée quand on ferme le modal
                        if (verseModalData) {
                          markTaskAsCompleted(currentDay, verseModalData.taskIndex);
                        }
                        setShowVerseModal(false);
                        setVerseModalData(null);
                      }}
                      style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: theme.colors.backgroundSecondary }]}
                    >
                      <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                        Fermer
                      </Text>
                    </Pressable>
                    {verseModalData && (
                      <Pressable
                        onPress={() => {
                          // Marquer la tâche Nur Shifa comme complétée
                          if (verseModalData) {
                            markTaskAsCompleted(currentDay, verseModalData.taskIndex);
                          }
                          
                          setShowVerseModal(false);
                          const { surahNumber, verseStart, special } = verseModalData;
                          
                          // Cas spécial : pour Ayat al-Kursi + 3 Qul, ouvrir la sourate 2 (Ayat al-Kursi)
                          if (special === 'ayat-kursi-3qul') {
                            navigation.navigate('QuranReader' as never, {
                              surahNumber: 2,
                              verseNumber: 255
                            } as never);
                          } else {
                            navigation.navigate('QuranReader' as never, {
                              surahNumber,
                              verseNumber: verseStart
                            } as never);
                          }
                          setVerseModalData(null);
                        }}
                        style={styles.modalButton}
                      >
                        <LinearGradient
                          colors={[selectedChallenge?.color || theme.colors.accent, `${selectedChallenge?.color || theme.colors.accent}DD`]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.modalButtonGradient}
                        >
                          <ExternalLink size={16} color="#FFFFFF" />
                          <Text style={[styles.modalButtonText, { color: '#FFFFFF', marginLeft: spacing.sm }]}>
                            Ouvrir dans le Coran
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    )}
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
        
        {/* Modal Verset Al-Fatiha */}
        {alFatihaVerseModalData && (
          <Modal
            visible={showAlFatihaVerseModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
              // Valider automatiquement la tâche quand on ferme le modal
              markTaskAsCompleted(currentDay, alFatihaVerseModalData.taskIndex);
              setShowAlFatihaVerseModal(false);
              setAlFatihaVerseModalData(null);
            }}
          >
            <Pressable 
              style={styles.modalOverlay}
              onPress={() => {
                // Valider automatiquement la tâche quand on ferme le modal
                markTaskAsCompleted(currentDay, alFatihaVerseModalData.taskIndex);
                setShowAlFatihaVerseModal(false);
                setAlFatihaVerseModalData(null);
              }}
            >
              <Animated.View
                entering={SlideInUp.duration(300).springify()}
                exiting={SlideOutDown.duration(200)}
              >
                <Pressable onPress={(e) => e.stopPropagation()}>
                  <GlassCard style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                        Al-Fâtiha — Verset {alFatihaVerseModalData.verseNumber}
                      </Text>
                      <Pressable
                        onPress={() => {
                          // Valider automatiquement la tâche quand on ferme le modal
                          markTaskAsCompleted(currentDay, alFatihaVerseModalData.taskIndex);
                          setShowAlFatihaVerseModal(false);
                          setAlFatihaVerseModalData(null);
                        }}
                        style={styles.closeButton}
                      >
                        <X size={24} color={theme.colors.text} />
                      </Pressable>
                    </View>
                    
                    <ScrollView 
                      style={styles.verseModalScroll} 
                      showsVerticalScrollIndicator={false}
                    >
                      {(() => {
                        const verse = getAlFatihaVerse(alFatihaVerseModalData.verseNumber);
                        if (!verse) return null;
                        
                        return (
                          <View style={styles.verseContent}>
                            <Text style={[styles.verseArabic, { color: theme.colors.text }]}>
                              {verse.arabic}
                            </Text>
                            <Text style={[styles.verseTranslation, { color: theme.colors.textSecondary }]}>
                              {verse.translation}
                            </Text>
                          </View>
                        );
                      })()}
                    </ScrollView>
                    
                    <Pressable
                      onPress={() => {
                        // Valider automatiquement la tâche quand on ferme le modal
                        markTaskAsCompleted(currentDay, alFatihaVerseModalData.taskIndex);
                        setShowAlFatihaVerseModal(false);
                        setAlFatihaVerseModalData(null);
                      }}
                      style={styles.modalButton}
                    >
                      <LinearGradient
                        colors={[selectedChallenge?.color || theme.colors.accent, `${selectedChallenge?.color || theme.colors.accent}DD`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                          J'ai lu le verset
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </GlassCard>
                </Pressable>
              </Animated.View>
            </Pressable>
          </Modal>
        )}

        {/* Paywall Modal pour les chemins premium */}
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          resetAt={null}
          messagesUsed={0}
          mode="subscription"
        />
        
        {/* Modal des degrés de l'âme */}
        <SoulDegreeModal
          visible={showSoulDegreeModal}
          blockId={soulDegreeBlockId}
          isEntry={isSoulDegreeEntry}
          onClose={() => {
            setShowSoulDegreeModal(false);
            // Si c'est la sortie du bloc 7 (jour 40), valider le chemin directement
            if (!isSoulDegreeEntry && isLastDayOfBlock(currentDay) && currentDay === 40) {
              // Appeler completeChallengeInternal pour valider le chemin sans vérifier le modal
              completeChallengeInternal();
            } else if (!isSoulDegreeEntry && isLastDayOfBlock(currentDay) && currentDay < 40) {
              // Si c'est la sortie d'un autre bloc, passer au jour suivant
              const nextDay = currentDay + 1;
              proceedToNextDay(nextDay);
            }
          }}
          onContinue={() => {
            setShowSoulDegreeModal(false);
            // Si c'est la sortie du bloc 7 (jour 40), valider le chemin directement
            if (!isSoulDegreeEntry && isLastDayOfBlock(currentDay) && currentDay === 40) {
              // Appeler completeChallengeInternal pour valider le chemin sans vérifier le modal
              completeChallengeInternal();
            } else if (!isSoulDegreeEntry && isLastDayOfBlock(currentDay) && currentDay < 40) {
              // Si c'est la sortie d'un autre bloc, passer au jour suivant
              const nextDay = currentDay + 1;
              proceedToNextDay(nextDay);
            }
          }}
          theme={{
            background: theme.colors.background,
            backgroundSecondary: theme.colors.backgroundSecondary,
            text: theme.colors.text,
            textSecondary: theme.colors.textSecondary,
            accent: theme.colors.accent,
          }}
        />

        {/* Modal Bloc non disponible */}
        <BlockUnavailableModal
          visible={showBlockUnavailable}
          onClose={() => setShowBlockUnavailable(false)}
          blockName={unavailableBlockName}
          theme={{
            background: theme.colors.background,
            backgroundSecondary: theme.colors.backgroundSecondary,
            text: theme.colors.text,
            textSecondary: theme.colors.textSecondary,
            accent: theme.colors.accent,
          }}
        />

        {/* Modal d'entrée Al-Fatiha (avant jour 11) */}
        <Modal
          visible={showAlFatihaIntro}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAlFatihaIntro(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowAlFatihaIntro(false)}
          >
            <Animated.View
              entering={SlideInUp.duration(400).springify()}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <GlassCard style={[styles.modalContent, { maxHeight: '85%' }]}>
                  <View style={styles.welcomeHeader}>
                    <Text style={[styles.welcomeEmoji, { fontSize: 48 }]}>
                      🌿
                    </Text>
                    <Text style={[styles.welcomeTitle, { color: selectedChallenge?.color || theme.colors.accent, fontSize: fontSize.xl, marginTop: spacing.md }]}>
                      Phrase d'entrée – Avant le Jour 11
                    </Text>
                  </View>
                  
                  <ScrollView 
                    style={styles.welcomeScroll}
                    contentContainerStyle={styles.welcomeScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={[styles.welcomeDescription, { color: theme.colors.text, lineHeight: 24 }]}>
                      Entrer dans l'expérience de la sourate Al-Fâtiha{'\n\n'}
                      À partir de maintenant, tu entres dans l'Ouverture.{'\n\n'}
                      Al-Fâtiha n'est pas une simple sourate que l'on connaît par cœur.{'\n'}
                      C'est une porte.{'\n'}
                      Une orientation.{'\n'}
                      Un dialogue entre toi et ton Seigneur.{'\n\n'}
                      Durant ces jours, tu ne vas pas chercher à réciter mieux,{'\n'}
                      mais à être présent à chaque mot.{'\n\n'}
                      Al-Fâtiha t'apprend comment te tenir :{'\n'}
                      avec reconnaissance,{'\n'}
                      humilité,{'\n'}
                      clarté dans la demande.{'\n\n'}
                      Avance sans précipitation.{'\n'}
                      Laisse chaque verset remettre de l'ordre,{'\n'}
                      à l'intérieur.{'\n\n'}
                      Tu es à l'entrée.{'\n'}
                      L'Ouverture commence maintenant.
                    </Text>
                  </ScrollView>
                  
                  <Pressable
                    onPress={() => setShowAlFatihaIntro(false)}
                    style={styles.modalButton}
                  >
                    <LinearGradient
                      colors={[selectedChallenge?.color || theme.colors.accent, `${selectedChallenge?.color || theme.colors.accent}DD`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                        Valider pour avancer
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </GlassCard>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Modal de sortie Al-Fatiha (après jour 17) */}
        <Modal
          visible={showAlFatihaCompletion}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAlFatihaCompletion(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowAlFatihaCompletion(false)}
          >
            <Animated.View
              entering={SlideInUp.duration(400).springify()}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <GlassCard style={[styles.modalContent, { maxHeight: '85%' }]}>
                  <View style={styles.welcomeHeader}>
                    <Text style={[styles.welcomeEmoji, { fontSize: 48 }]}>
                      🌙
                    </Text>
                    <Text style={[styles.welcomeTitle, { color: selectedChallenge?.color || theme.colors.accent, fontSize: fontSize.xl, marginTop: spacing.md }]}>
                      Phrase de sortie – Après le Jour 17
                    </Text>
                  </View>
                  
                  <ScrollView 
                    style={styles.welcomeScroll}
                    contentContainerStyle={styles.welcomeScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={[styles.welcomeDescription, { color: theme.colors.text, lineHeight: 24 }]}>
                      Sortir de Al-Fâtiha comme d'une ouverture vécue{'\n\n'}
                      Tu viens de vivre Al-Fâtiha.{'\n'}
                      Tu as traversé l'Ouverture,{'\n'}
                      non pas comme une récitation automatique,{'\n'}
                      mais comme un chemin conscient.{'\n\n'}
                      Ces jours t'ont appris à commencer juste :{'\n'}
                      par la gratitude,{'\n'}
                      par la reconnaissance,{'\n'}
                      par une demande claire et sincère.{'\n\n'}
                      Al-Fâtiha n'est pas derrière toi.{'\n'}
                      Elle t'accompagne désormais dans chaque pas.{'\n\n'}
                      Prends un instant pour reconnaître ce que tu as fait :{'\n'}
                      tu as posé une base.{'\n'}
                      La suite du parcours peut maintenant s'appuyer sur quelque chose de solide.{'\n\n'}
                      Tu as ouvert.{'\n'}
                      Avance.
                    </Text>
                  </ScrollView>
                  
                  <Pressable
                    onPress={() => setShowAlFatihaCompletion(false)}
                    style={styles.modalButton}
                  >
                    <LinearGradient
                      colors={[selectedChallenge?.color || theme.colors.accent, `${selectedChallenge?.color || theme.colors.accent}DD`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                        Appuyer pour avancer
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </GlassCard>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Modal de phrase de clôture du jour */}
        <Modal
          visible={showDayClosingPhrase}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowDayClosingPhrase(false);
            if (pendingNextDay !== null) {
              proceedToNextDay(pendingNextDay);
              setPendingNextDay(null);
            }
          }}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => {
              setShowDayClosingPhrase(false);
              if (pendingNextDay !== null) {
                proceedToNextDay(pendingNextDay);
                setPendingNextDay(null);
              }
            }}
          >
            <Animated.View
              entering={SlideInUp.duration(400).springify()}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <GlassCard style={styles.modalContent}>
                  <View style={styles.closingPhraseHeader}>
                    <Text style={[styles.closingPhraseEmoji, { fontSize: 48 }]}>
                      ✨
                    </Text>
                    <Text style={[styles.closingPhraseTitle, { color: selectedChallenge?.color || theme.colors.accent }]}>
                      Jour {currentDay} complété
                    </Text>
                  </View>
                  
                  <View style={[styles.closingPhraseBox, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Text style={[styles.closingPhraseText, { color: theme.colors.text }]}>
                      {dayClosingPhrase}
                    </Text>
                  </View>
                  
                  <Pressable
                    onPress={() => {
                      setShowDayClosingPhrase(false);
                      if (pendingNextDay !== null) {
                        proceedToNextDay(pendingNextDay);
                        setPendingNextDay(null);
                      }
                    }}
                    style={styles.modalButton}
                  >
                    <LinearGradient
                      colors={[selectedChallenge?.color || theme.colors.accent, `${selectedChallenge?.color || theme.colors.accent}DD`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                        Continuer
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </GlassCard>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Modal Premium d'explication du chemin (avant d'entrer) */}
        <Modal
          visible={showChallengeExplanation}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!isStartingChallenge) {
              setShowChallengeExplanation(false);
              setPendingChallenge(null);
            }
          }}
        >
          <View style={styles.premiumModalSafeArea}>
            <Pressable 
              style={styles.premiumModalBackdrop}
              onPress={() => {
                if (!isStartingChallenge) {
                  setShowChallengeExplanation(false);
                  setPendingChallenge(null);
                }
              }}
            >
              <SafeAreaView style={styles.premiumModalSafeAreaInner}>
                <Animated.View
                  entering={SlideInUp.duration(500).easing(Easing.out(Easing.ease))}
                  style={styles.premiumModalContainer}
                >
                  <Pressable onPress={(e) => e.stopPropagation()}>
                    <GlassCard style={styles.premiumModalContent}>
                    {/* 1️⃣ Header - Zone d'ancrage émotionnel */}
                    <View style={styles.premiumModalHeader}>
                      {/* Icône centrée */}
                      <View style={[styles.premiumModalIconContainer, { 
                        backgroundColor: pendingChallenge?.color + '15' || theme.colors.accent + '15',
                        borderColor: pendingChallenge?.color + '30' || theme.colors.accent + '30'
                      }]}>
                        {pendingChallenge?.iconName && getChallengeIcon(
                          pendingChallenge.iconName, 
                          36, 
                          pendingChallenge.color || theme.colors.accent
                        )}
                      </View>
                      
                      {/* Titre et sous-titre */}
                      <Text style={[styles.premiumModalTitle, { color: pendingChallenge?.color || theme.colors.accent }]}>
                        {pendingChallenge?.title}
                      </Text>
                      <Text style={[styles.premiumModalSubtitle, { color: theme.colors.textSecondary }]}>
                        {pendingChallenge?.attribute} — {pendingChallenge?.attributeArabic}
                      </Text>
                      
                      {/* Bouton fermer intégré dans le header */}
                      <Pressable
                        onPress={() => {
                          if (!isStartingChallenge) {
                            setShowChallengeExplanation(false);
                            setPendingChallenge(null);
                          }
                        }}
                        style={[styles.premiumModalCloseButton, { 
                          backgroundColor: theme.colors.backgroundSecondary + '80',
                          opacity: isStartingChallenge ? 0.5 : 1
                        }]}
                        disabled={isStartingChallenge}
                      >
                        <X size={18} color={theme.colors.text} />
                      </Pressable>
                    </View>
                  
                    {/* 2️⃣ Body - Contenu structuré */}
                    <ScrollView 
                      style={styles.premiumModalScroll}
                      contentContainerStyle={styles.premiumModalScrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {/* Description courte - Toujours affichée */}
                      {pendingChallenge?.description && (
                        <View style={styles.premiumModalDescriptionContainer}>
                          <Text style={[styles.premiumModalDescription, { color: theme.colors.text }]}>
                            {pendingChallenge.description}
                          </Text>
                        </View>
                      )}
                      
                      {/* Introduction complète */}
                      {pendingChallenge?.introduction && (
                        <View style={styles.premiumModalIntroductionContainer}>
                          <Text style={[styles.premiumModalIntention, { color: theme.colors.text, opacity: 0.85 }]}>
                            {pendingChallenge.introduction}
                          </Text>
                        </View>
                      )}
                      
                      {/* Ce que tu vas vivre (liste claire) */}
                      <View style={styles.premiumModalSection}>
                        <View style={styles.premiumModalSectionHeader}>
                          <Sparkles size={20} color={pendingChallenge?.color || theme.colors.accent} />
                          <Text style={[styles.premiumModalSectionTitle, { color: theme.colors.text }]}>
                            Ce que tu vas vivre
                          </Text>
                        </View>
                        <View style={styles.premiumModalList}>
                          <View style={styles.premiumModalListItem}>
                            <Text style={styles.premiumModalListIcon}>🌙</Text>
                            <Text style={[styles.premiumModalListText, { color: theme.colors.text }]}>
                              Pratiques quotidiennes guidées
                            </Text>
                          </View>
                          <View style={styles.premiumModalListItem}>
                            <Text style={styles.premiumModalListIcon}>✨</Text>
                            <Text style={[styles.premiumModalListText, { color: theme.colors.text }]}>
                              Exercices de purification intérieure
                            </Text>
                          </View>
                          <View style={styles.premiumModalListItem}>
                            <Text style={styles.premiumModalListIcon}>📖</Text>
                            <Text style={[styles.premiumModalListText, { color: theme.colors.text }]}>
                              Rappels spirituels et intentions
                            </Text>
                          </View>
                          <View style={styles.premiumModalListItem}>
                            <Text style={styles.premiumModalListIcon}>🧠</Text>
                            <Text style={[styles.premiumModalListText, { color: theme.colors.text }]}>
                              Discipline douce et consciente
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Badges metadata */}
                      <View style={styles.premiumModalBadgesContainer}>
                        <View style={[styles.premiumModalBadge, { backgroundColor: pendingChallenge?.color + '15' || theme.colors.accent + '15' }]}>
                          <Clock size={14} color={pendingChallenge?.color || theme.colors.accent} />
                          <Text style={[styles.premiumModalBadgeText, { color: pendingChallenge?.color || theme.colors.accent }]}>
                            40 jours
                          </Text>
                        </View>
                        <View style={[styles.premiumModalBadge, { backgroundColor: pendingChallenge?.color + '15' || theme.colors.accent + '15' }]}>
                          <Target size={14} color={pendingChallenge?.color || theme.colors.accent} />
                          <Text style={[styles.premiumModalBadgeText, { color: pendingChallenge?.color || theme.colors.accent }]}>
                            Personnel
                          </Text>
                        </View>
                        <View style={[styles.premiumModalBadge, { backgroundColor: pendingChallenge?.color + '15' || theme.colors.accent + '15' }]}>
                          <Heart size={14} color={pendingChallenge?.color || theme.colors.accent} />
                          <Text style={[styles.premiumModalBadgeText, { color: pendingChallenge?.color || theme.colors.accent }]}>
                            Débutant
                          </Text>
                        </View>
                      </View>
                    </ScrollView>
                  
                    {/* 3️⃣ Footer - Zone d'action */}
                    <View style={styles.premiumModalFooter}>
                      {/* Séparation visuelle */}
                      <View style={[styles.premiumModalFooterSeparator, { backgroundColor: theme.colors.backgroundSecondary }]} />
                      
                      {/* Bouton principal CTA */}
                      <Pressable
                        onPress={enterChallenge}
                        style={[styles.premiumModalPrimaryButton, { opacity: isStartingChallenge ? 0.7 : 1 }]}
                        disabled={isStartingChallenge}
                      >
                        <LinearGradient
                          colors={[pendingChallenge?.color || theme.colors.accent, `${pendingChallenge?.color || theme.colors.accent}DD`]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.premiumModalPrimaryButtonGradient}
                        >
                          {isStartingChallenge ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Text style={[styles.premiumModalPrimaryButtonText, { color: '#FFFFFF' }]}>
                                Commencer le chemin
                              </Text>
                              <ArrowRight size={20} color="#FFFFFF" />
                            </>
                          )}
                        </LinearGradient>
                      </Pressable>
                      
                      {/* Bouton secondaire discret */}
                      <Pressable
                        onPress={() => {
                          if (!isStartingChallenge) {
                            setShowChallengeExplanation(false);
                            setPendingChallenge(null);
                          }
                        }}
                        style={[styles.premiumModalSecondaryButton, { opacity: isStartingChallenge ? 0.5 : 1 }]}
                        disabled={isStartingChallenge}
                      >
                        <Text style={[styles.premiumModalSecondaryButtonText, { color: theme.colors.textSecondary }]}>
                          Plus tard
                        </Text>
                      </Pressable>
                    </View>
                  </GlassCard>
                </Pressable>
              </Animated.View>
              </SafeAreaView>
            </Pressable>
          </View>
        </Modal>

        {/* Modal d'accueil du chemin */}
        <Modal
          visible={showChallengeWelcome}
          transparent
          animationType="fade"
          onRequestClose={() => setShowChallengeWelcome(false)}
        >
          <View style={styles.premiumModalSafeArea}>
            <Pressable 
              style={styles.premiumModalBackdrop}
              onPress={() => setShowChallengeWelcome(false)}
            >
              <SafeAreaView style={styles.premiumModalSafeAreaInner}>
                <Animated.View
                  entering={SlideInUp.duration(500).easing(Easing.out(Easing.ease))}
                  style={styles.premiumModalContainer}
                >
                  <Pressable onPress={(e) => e.stopPropagation()}>
                    <GlassCard style={styles.premiumModalContent}>
                      {/* Header */}
                      <View style={styles.premiumModalHeader}>
                        <View style={[styles.premiumModalIconContainer, { 
                          backgroundColor: selectedChallenge?.color + '15' || theme.colors.accent + '15',
                          borderColor: selectedChallenge?.color + '30' || theme.colors.accent + '30'
                        }]}>
                          {selectedChallenge?.iconName && getChallengeIcon(
                            selectedChallenge.iconName, 
                            36, 
                            selectedChallenge.color || theme.colors.accent
                          )}
                        </View>
                        <Text style={[styles.premiumModalTitle, { color: selectedChallenge?.color || theme.colors.accent }]}>
                          {selectedChallenge?.title}
                        </Text>
                        <Text style={[styles.premiumModalSubtitle, { color: theme.colors.textSecondary }]}>
                          {selectedChallenge?.attribute} — {selectedChallenge?.attributeArabic}
                        </Text>
                        
                        {/* Bouton fermer */}
                        <Pressable
                          onPress={() => setShowChallengeWelcome(false)}
                          style={[styles.premiumModalCloseButton, { 
                            backgroundColor: theme.colors.backgroundSecondary + '80'
                          }]}
                        >
                          <X size={18} color={theme.colors.text} />
                        </Pressable>
                      </View>
                      
                      {/* Body */}
                      <ScrollView 
                        style={styles.premiumModalScroll}
                        contentContainerStyle={styles.premiumModalScrollContent}
                        showsVerticalScrollIndicator={false}
                      >
                        {/* Description */}
                        {selectedChallenge?.description && (
                          <View style={styles.premiumModalDescriptionContainer}>
                            <Text style={[styles.premiumModalDescription, { color: theme.colors.text }]}>
                              {selectedChallenge.description}
                            </Text>
                          </View>
                        )}
                        
                        {/* Introduction */}
                        {selectedChallenge?.introduction && (
                          <View style={styles.premiumModalIntroductionContainer}>
                            <Text style={[styles.premiumModalIntention, { color: theme.colors.text, opacity: 0.85 }]}>
                              {selectedChallenge.introduction}
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                      
                      {/* Footer avec bouton */}
                      <View style={styles.premiumModalFooter}>
                        <View style={[styles.premiumModalFooterSeparator, { backgroundColor: theme.colors.backgroundSecondary }]} />
                        <Pressable
                          onPress={() => setShowChallengeWelcome(false)}
                          style={styles.premiumModalPrimaryButton}
                        >
                          <LinearGradient
                            colors={[selectedChallenge?.color || theme.colors.accent, `${selectedChallenge?.color || theme.colors.accent}DD`]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.premiumModalPrimaryButtonGradient}
                          >
                            <Text style={[styles.premiumModalPrimaryButtonText, { color: '#FFFFFF' }]}>
                              Commencer le chemin
                            </Text>
                            <ArrowRight size={20} color="#FFFFFF" />
                          </LinearGradient>
                        </Pressable>
                      </View>
                    </GlassCard>
                  </Pressable>
                </Animated.View>
              </SafeAreaView>
            </Pressable>
          </View>
        </Modal>

        {/* Modal de validation du chemin */}
        <Modal
          visible={showChallengeComplete}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowChallengeComplete(false);
            // Revenir à l'écran d'onboarding
            setCurrentScreen('onboarding');
            setSelectedChallenge(null);
            setCurrentDay(1);
            setCompletedTasks(new Set());
          }}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => {
              // Ne pas fermer en cliquant sur l'overlay, seulement avec le bouton
            }}
          >
            <Animated.View
              entering={SlideInUp.duration(400).springify()}
              style={styles.completeModalContainer}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={[styles.completeModalContent, { 
                  backgroundColor: theme.colors.background,
                  borderColor: selectedChallenge?.color || theme.colors.accent,
                }]}>
                  <View style={styles.completeHeader}>
                    <Text style={[styles.completeEmoji, { fontSize: 64 }]}>
                      ✨
                    </Text>
                    <Text style={[styles.completeTitle, { color: selectedChallenge?.color || theme.colors.accent }]}>
                      Chemin complété !
                    </Text>
                    <Text style={[styles.completeSubtitle, { color: theme.colors.textSecondary }]}>
                      Félicitations pour avoir terminé ce chemin de 40 jours
                    </Text>
                  </View>
                  
                  <View style={[styles.completeMessageBox, { 
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: selectedChallenge?.color || theme.colors.accent,
                    maxHeight: 200,
                  }]}>
                    <ScrollView 
                      style={styles.completeMessageScroll}
                      contentContainerStyle={styles.completeMessageScrollContent}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      <Text style={[styles.completeMessage, { color: theme.colors.text, lineHeight: 22 }]}>
                        Tu as accompli un chemin précieux.{'\n\n'}
                        Tu as traversé 40 jours de pratique,{'\n'}
                        de présence,{'\n'}
                        de transformation.{'\n\n'}
                        Que les fruits de cette pratique continuent à grandir en toi,{'\n'}
                        jour après jour.{'\n\n'}
                        Ce que tu as semé durant ces 40 jours{'\n'}
                        continuera à porter ses fruits.{'\n'}
                        La lumière que tu as cultivée{'\n'}
                        t'accompagne désormais.{'\n\n'}
                        Tu peux refaire ce chemin à tout moment depuis le menu,{'\n'}
                        ou simplement continuer à vivre ce que tu as appris.{'\n\n'}
                        Prends un instant pour reconnaître ce que tu as accompli.{'\n'}
                        Alhamdulillah.
                      </Text>
                    </ScrollView>
                  </View>
                  
                  <Pressable
                    onPress={() => {
                      setShowChallengeComplete(false);
                      // Revenir à l'écran d'onboarding (début de SabilaNur) - le chemin est complété
                      setCurrentScreen('onboarding');
                      setSelectedChallenge(null);
                      setCurrentDay(1);
                      setCompletedTasks(new Set());
                      setIntention('');
                    }}
                    style={styles.completeModalButton}
                  >
                    <LinearGradient
                      colors={[selectedChallenge?.color || theme.colors.accent, `${selectedChallenge?.color || theme.colors.accent}DD`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.completeModalButtonGradient}
                    >
                      <Text style={[styles.completeModalButtonText, { color: '#FFFFFF' }]}>
                        Valider
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
        
        {/* Modal d'introduction du module Sabilat Nûr */}
        <ModuleIntroductionModal
          visible={showModuleIntroduction}
          onClose={() => {
            // Ne pas marquer comme vu, pour que le modal puisse s'afficher à nouveau
            setShowModuleIntroduction(false);
          }}
          title="🌙 Sabilat Nûr — Le chemin des 40 jours"
          icon={<Sparkles size={36} color="#FFD369" />}
          color="#FFD369"
          content={MODULE_INTRODUCTIONS.SABILAT_NUR}
          buttonText="Commencer"
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

// Fonction pour créer les styles bento avec les couleurs du thème
function createBentoStyles(colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    bentoSection: {
      marginBottom: 24,
    },
    bentoCardFull: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    bentoCardHalf: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 14,
      minHeight: 120,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    bentoCardPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
    },
    bentoCardActive: {
      borderColor: '#FF6B6B',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
    },
    bentoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    bentoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 10,
    },
    bentoIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bentoEmoji: {
      fontSize: 24,
    },
    bentoEmojiSmall: {
      fontSize: 20,
    },
    bentoTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    bentoTitleSmall: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 8,
    },
    bentoSubtitle: {
      fontSize: 13,
      marginTop: 4,
    },
    bentoSubtitleSmall: {
      fontSize: 11,
      marginTop: 4,
    },
    bentoDescription: {
      fontSize: 14,
      lineHeight: 20,
    },
    premiumBadge: {
      fontSize: 16,
    },
    premiumBadgeSmall: {
      fontSize: 12,
    },
    bentoGradient: {
      borderRadius: 16,
      padding: spacing.md,
      overflow: 'hidden',
    },
    bentoGradientHalf: {
      borderRadius: 16,
      padding: spacing.sm,
      overflow: 'hidden',
      minHeight: 120,
    },
    bentoIconContainerSmall: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bentoHeaderHalf: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
      gap: spacing.xs,
    },
    bentoBadgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    bentoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 8,
    },
    bentoBadgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    bentoBadgeSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },
    bentoBadgeTextSmall: {
      fontSize: 9,
      fontWeight: '600',
    },
  });
}

function getTaskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    kalwa: 'Kalwa',
    nur_shifa: 'Nur Shifa',
    spirituelle_ia: 'Spirituelle',
    discipline: 'Discipline',
    discipline_ia: 'Discipline',
    action: 'Action',
    action_ia: 'Action',
    introspection: 'Introspection',
    ancrage_concret: 'Ancrage',
    intention: 'Intention',
    yassine_reading: 'Yassine',
    yassine_final: 'Yassine',
    connexion_soi: 'Connexion',
    projection: 'Projection'
  };
  return labels[type] || type;
}

// Styles Bento Grid seront créés dynamiquement avec les couleurs du thème

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  pageContent: {
    width: '100%',
    alignSelf: 'center',
  },
  solidCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  menuButton: {
    padding: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quitButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
    letterSpacing: letterSpacing.tighter,
  },
  subtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontFamily: 'System',
  },
  challengesContainer: {
    gap: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: spacing.xs,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System'
  },
  challengeCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.base,
    ...shadows.lg,
  },
  challengeGradient: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  challengeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  challengeTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: 'System',
  },
  challengeAttribute: {
    fontSize: fontSize.lg,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: 'System',
  },
  challengeDescription: {
    fontSize: fontSize.sm,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: 'System',
    lineHeight: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
  },
  dayBlock: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    fontFamily: 'System',
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    fontFamily: 'System',
  },
  challengeInfo: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  challengeName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
    fontFamily: 'System',
  },
  verseBlockPressable: {
    marginBottom: spacing.xl,
  },
  verseBlock: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  verseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  verseActionButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  verseReference: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
    fontFamily: 'System',
  },
  verseArabic: {
    fontSize: fontSize.xl,
    textAlign: 'right',
    marginBottom: spacing.md,
    fontFamily: 'System',
    lineHeight: 36,
    letterSpacing: 1,
  },
  verseTranslation: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    fontFamily: 'System',
  },
  tasksContainer: {
    marginBottom: spacing.xl,
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  tasksTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
  },
  generatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  generatingText: {
    fontSize: 12,
    fontFamily: 'System',
  },
  taskItem: {
    marginBottom: spacing.md,
  },
  taskCard: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkboxPressable: {
    padding: spacing.xs,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  taskType: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    fontFamily: 'System',
  },
  taskDescription: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontFamily: 'System',
  },
  floatingButton: {
    position: 'absolute',
    zIndex: 1000,
    ...shadows.lg,
  },
  floatingButtonLeft: {
    left: spacing.lg,
  },
  floatingButtonRight: {
    right: spacing.lg,
  },
  floatingButtonCenter: {
    left: '50%',
    marginLeft: -100, // Moitié de la largeur du bouton (200px / 2)
    width: 200,
  },
  floatingButtonPressable: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  floatingButtonContent: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
    marginLeft: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    fontFamily: 'System',
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xl,
    fontFamily: 'System',
  },
  modalInput: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    fontSize: fontSize.base,
    minHeight: 120,
    marginBottom: spacing.xl,
    fontFamily: 'System',
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  modalButtonCancel: {
    // Styles pour le bouton annuler
  },
  modalButtonGradient: {
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
  },
  alFatihaHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  alFatihaEmoji: {
    marginBottom: spacing.md,
  },
  alFatihaTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  alFatihaSubtitle: {
    fontSize: fontSize.base,
    fontFamily: 'System',
    textAlign: 'center',
  },
  alFatihaMessageBox: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  alFatihaMessage: {
    fontSize: fontSize.base,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'System',
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeEmoji: {
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
    fontFamily: 'System',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: fontSize.base,
    fontFamily: 'System',
    textAlign: 'center',
  },
  welcomeScroll: {
    maxHeight: 300,
    marginBottom: spacing.lg,
  },
  welcomeScrollContent: {
    paddingBottom: spacing.md,
  },
  welcomeDescription: {
    fontSize: fontSize.base,
    lineHeight: 24,
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontFamily: 'System',
  },
  welcomeIntroBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  welcomeIntroTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
    fontFamily: 'System',
  },
  welcomeIntroText: {
    fontSize: fontSize.base,
    lineHeight: 24,
    fontFamily: 'System',
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  completeEmoji: {
    marginBottom: spacing.md,
  },
  completeTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
    fontFamily: 'System',
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: fontSize.base,
    fontFamily: 'System',
    textAlign: 'center',
  },
  completeMessageBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    flex: 1,
  },
  completeMessageScroll: {
    flex: 1,
  },
  completeMessageScrollContent: {
    paddingBottom: spacing.sm,
  },
  completeMessage: {
    fontSize: fontSize.base,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'System',
  },
  closingPhraseHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  closingPhraseEmoji: {
    marginBottom: spacing.md,
  },
  closingPhraseTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
    textAlign: 'center',
  },
  closingPhraseBox: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  closingPhraseText: {
    fontSize: fontSize.lg,
    lineHeight: 28,
    textAlign: 'center',
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  alFatihaHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  alFatihaEmoji: {
    marginBottom: spacing.md,
  },
  alFatihaTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  alFatihaSubtitle: {
    fontSize: fontSize.base,
    fontFamily: 'System',
    textAlign: 'center',
  },
  alFatihaMessageBox: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  alFatihaMessage: {
    fontSize: fontSize.base,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'System',
  },
  quitModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  quitModalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.base,
    fontFamily: 'System',
    textAlign: 'center',
  },
  quitModalText: {
    fontSize: fontSize.base,
    marginBottom: spacing.xl,
    fontFamily: 'System',
    textAlign: 'center',
    lineHeight: 24,
  },
  quitModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  quitModalButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  quitModalButtonCancel: {
    // Styles pour le bouton annuler
  },
  quitModalButtonGradient: {
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitModalButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
  },
  dayMenuContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  dayMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  dayMenuTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeButtonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
  },
  dayMenuScroll: {
    maxHeight: 500,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.base,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  dayMenuItem: {
    minWidth: 70,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  dayMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayMenuItemNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
  },
  dayMenuProgress: {
    marginTop: spacing.xs,
  },
  dayMenuProgressBar: {
    height: 3,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  dayMenuProgressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  dayMenuBlock: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    fontFamily: 'System',
  },
  intentionCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  intentionLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
    fontFamily: 'System',
  },
  intentionHelper: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    fontFamily: 'System',
    lineHeight: 20,
  },
  intentionQuestion: {
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
    fontFamily: 'System',
    lineHeight: 22,
  },
  intentionInput: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    fontSize: fontSize.base,
    minHeight: 150,
    fontFamily: 'System',
    borderWidth: 1,
    lineHeight: 22,
  },
  checkboxTaskItem: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  checkboxTaskCard: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  verseModalScroll: {
    maxHeight: 400,
  },
  verseReference: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
    textAlign: 'center',
  },
  verseContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  verseNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
    minWidth: 30,
    textAlign: 'center',
  },
  verseContent: {
    flex: 1,
  },
  verseArabic: {
    fontSize: fontSize.xl,
    fontFamily: 'System',
    lineHeight: 40,
    marginBottom: spacing.sm,
  },
  verseTranslation: {
    fontSize: fontSize.base,
    fontFamily: 'System',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  verseLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  verseLoadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    fontFamily: 'System',
  },
  verseErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  verseErrorText: {
    fontSize: fontSize.base,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  verseRetryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  verseRetryText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
  },
  verseSpecialNote: {
    fontSize: fontSize.base,
    fontFamily: 'System',
    textAlign: 'center',
  },
  verseSpecialText: {
    fontSize: fontSize.base,
    fontFamily: 'System',
    textAlign: 'left',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  checkboxTaskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkboxTaskTextContainer: {
    flex: 1,
  },
  checkboxTaskType: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    fontFamily: 'System',
  },
  checkboxTaskDescription: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontFamily: 'System',
  },
  ambianceScroll: {
    maxHeight: 400,
    marginBottom: spacing.xl,
  },
  ambianceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  ambianceCard: {
    width: '45%',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    position: 'relative',
    minHeight: 120,
    justifyContent: 'center',
  },
  ambianceIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  ambianceName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
    fontFamily: 'System',
    textAlign: 'center',
  },
  ambianceDescription: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    fontFamily: 'System',
  },
  ambianceCheck: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  // Styles Premium Modal
  premiumModalSafeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumModalSafeAreaInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  premiumModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  premiumModalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    justifyContent: 'center',
  },
  premiumModalContent: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  premiumModalHeader: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  premiumModalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  premiumModalIcon: {
    fontSize: 36,
  },
  premiumModalCloseButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumModalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
    fontFamily: 'System',
    textAlign: 'center',
  },
  premiumModalSubtitle: {
    fontSize: fontSize.base,
    fontFamily: 'System',
    textAlign: 'center',
    opacity: 0.7,
  },
  premiumModalScroll: {
    flex: 1,
  },
  premiumModalScrollContent: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  premiumModalDescriptionContainer: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  premiumModalDescription: {
    fontSize: fontSize.base,
    lineHeight: 24,
    fontFamily: 'System',
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  premiumModalIntroductionContainer: {
    marginBottom: spacing.xl,
  },
  premiumModalIntention: {
    fontSize: fontSize.lg,
    lineHeight: 28,
    fontFamily: 'System',
    fontStyle: 'italic',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  premiumModalSection: {
    marginBottom: spacing.xl,
  },
  premiumModalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  premiumModalSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
  },
  premiumModalList: {
    gap: spacing.md,
  },
  premiumModalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  premiumModalListIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  premiumModalListText: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 22,
    fontFamily: 'System',
  },
  premiumModalBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  premiumModalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  premiumModalBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontFamily: 'System',
  },
  premiumModalFooter: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  premiumModalFooterSeparator: {
    height: 1,
    marginBottom: spacing.lg,
  },
  premiumModalSecondaryButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  premiumModalSecondaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    fontFamily: 'System',
  },
  premiumModalPrimaryButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
    minHeight: 56,
  },
  premiumModalPrimaryButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 56,
  },
  premiumModalPrimaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
  },
  validatedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  validatedBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
  },
  completeModalContainer: {
    width: '90%',
    maxWidth: 500,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  completeModalContent: {
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    borderWidth: 2,
    maxHeight: '85%',
    ...shadows.xl,
    flex: 1,
    justifyContent: 'space-between',
  },
  completeModalButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.lg,
    ...shadows.md,
  },
  completeModalButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  completeModalButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
  },
});

