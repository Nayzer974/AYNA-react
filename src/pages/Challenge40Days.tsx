import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, CheckCircle, Circle, ExternalLink, Menu, X } from 'lucide-react-native';
import { SABILA_NUR_CHALLENGES, getChallengeById, getDayByNumber, type Challenge, type Day, type Task } from '@/data/sabilaNur';
import { useTranslation } from 'react-i18next';
// Génération IA désactivée - utilisation directe des tâches définies
import { divineNames, soundAmbiances, type SoundAmbiance } from '@/data/khalwaData';
import { speak, stopSpeaking, isSpeaking } from '@/services/speech';
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
import { getSubscriptionStatus } from '@/services/subscription';

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
          <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
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

// Composant NavButton avec animation de scale
function NavButton({
  children,
  onPress,
  disabled,
  backgroundColor,
  opacity,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled: boolean;
  backgroundColor?: string;
  opacity: number;
}) {
  const buttonScale = useSharedValue(1);
  
  const handlePressIn = () => {
    if (!disabled) {
      buttonScale.value = withSpring(0.95, { damping: 15 });
    }
  };
  
  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15 });
  };
  
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: opacity,
  }));
  
  return (
    <Animated.View style={[styles.navButton, buttonAnimatedStyle, backgroundColor && { backgroundColor }]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.navButtonPressable}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function Challenge40Days() {
  const navigation = useNavigation();
  const { user, updateUser } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
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
  
  // Défis premium (derrière paywall)
  const PREMIUM_CHALLENGES = ['voyage-du-coeur', 'liberation-spirituelle'];

  // Charger la progression sauvegardée
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedProgress = user?.sabilaNurProgress;
        
        if (savedProgress && savedProgress.challengeId) {
          const challenge = getChallengeById(savedProgress.challengeId);
          if (challenge) {
            // Si c'est un défi premium et que l'utilisateur n'est pas abonné, vérifier s'il a déjà commencé
            // Si oui, permettre de continuer (pour éviter de perdre la progression)
            // Si non, bloquer l'accès
            if (PREMIUM_CHALLENGES.includes(challenge.id)) {
              try {
                const subscriptionStatus = await getSubscriptionStatus();
                // Si l'utilisateur n'est pas abonné ET n'a pas encore commencé le défi, bloquer
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
  }, [user?.sabilaNurProgress]);

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

  // Quitter le défi (supprimer la progression)
  const handleQuitChallenge = useCallback(() => {
    Alert.alert(
      'Quitter le défi',
      'Êtes-vous sûr de vouloir quitter ce défi ? Toute votre progression sera supprimée et ne pourra pas être récupérée.',
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

  // Démarrer un défi
  const handleStartChallenge = useCallback(async (challenge: Challenge) => {
    // Vérifier si le défi est premium et si l'utilisateur est abonné
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
    
    setSelectedChallenge(challenge);
    setCurrentDay(1);
    setCurrentScreen('day');
    
    const progress: ChallengeProgress = {
      challengeId: challenge.id,
      currentDay: 1,
      startDate: new Date().toISOString(),
      intention: '',
      completedTasks: []
    };
    
    saveProgress(progress);
    
    // Plus besoin d'ouvrir le modal d'intention car elle est maintenant directement dans la page
  }, [saveProgress]);

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

  // Gérer le clic sur une tâche
  const handleTaskPress = useCallback((task: Task, taskIndex: number) => {
    const taskType = task.type;
    
    // Kalwa : Afficher le modal de sélection d'ambiance
    if (taskType === 'kalwa') {
      setPendingKalwaTask({ task, taskIndex });
      setShowAmbianceModal(true);
      return;
    }
    
    // Nur Shifa : Naviguer vers NurShifa
    if (taskType === 'nur_shifa') {
      navigation.navigate('NurShifa' as never, {
        fromChallenge: true,
        challengeId: selectedChallenge?.id,
        day: currentDay,
        taskIndex: taskIndex
      } as never);
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
  }, [selectedChallenge, currentDay, navigation, intention, completedTasks, user?.sabilaNurProgress, saveProgress]);

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

  // Valider le défi (jour 40)
  const handleCompleteChallenge = useCallback(() => {
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
    
    Alert.alert(
      'Défi complété !',
      'Félicitations ! Vous avez terminé le défi de 40 jours. Vous pouvez le refaire à tout moment depuis le menu.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Revenir à l'écran d'onboarding
            setCurrentScreen('onboarding');
            setSelectedChallenge(null);
            setCurrentDay(1);
            setCompletedTasks(new Set());
          }
        }
      ]
    );
  }, [selectedChallenge, currentDay, intention, completedTasks, user?.sabilaNurProgress, saveProgress]);

  // Aller au jour suivant
  const handleNextDay = useCallback(() => {
    if (!selectedChallenge || currentDay >= 40) return;
    
    const nextDay = currentDay + 1;
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
  }, [selectedChallenge, currentDay, intention, completedTasks, user?.sabilaNurProgress, saveProgress]);

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
    setCurrentDay(day);
    setShowDayMenu(false);
    // Charger l'intention si on va au jour 1
    if (day === 1 && user?.sabilaNurProgress?.intention) {
      setIntention(user.sabilaNurProgress.intention);
    }
  }, [selectedChallenge, user?.sabilaNurProgress?.intention]);

  // Confirmer la sélection d'ambiance et naviguer vers BaytAnNur
  const handleConfirmAmbiance = useCallback(() => {
    if (!pendingKalwaTask || !selectedChallenge) return;
    
    const { task, taskIndex } = pendingKalwaTask;
    const divineAttribute = task.divineAttribute || 'Allah';
    const divineName = divineNames.find(n => 
      n.transliteration.toLowerCase().includes(divineAttribute.toLowerCase()) ||
      n.meaning.toLowerCase().includes(divineAttribute.toLowerCase())
    );
    
    setShowAmbianceModal(false);
    
    if (divineName) {
      navigation.navigate('BaytAnNur' as never, {
        fromChallenge: true,
        challengeId: selectedChallenge.id,
        day: currentDay,
        taskIndex: taskIndex,
        divineNameId: divineName.id,
        khalwaName: task.description,
        selectedAmbiance: selectedAmbiance
      } as never);
    } else {
      navigation.navigate('BaytAnNur' as never, {
        fromChallenge: true,
        challengeId: selectedChallenge.id,
        day: currentDay,
        taskIndex: taskIndex,
        selectedAmbiance: selectedAmbiance
      } as never);
    }
    
    setPendingKalwaTask(null);
  }, [pendingKalwaTask, selectedChallenge, currentDay, selectedAmbiance, navigation]);

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
  // Pour les jours avec intention, compter seulement Nur Shifa et Kalwa (pas l'intention)
  const tasksCompleted = dayData ? currentTasks.filter((task, index) => {
    // Pour les jours avec intention, ne compter que Nur Shifa et Kalwa
    if (dayData.hasIntention) {
      if (task.type !== 'nur_shifa' && task.type !== 'kalwa') return false;
    }
    return completedTasks.has(`${currentDay}-${index}`);
  }).length : 0;
  const tasksToCount = dayData?.hasIntention 
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

  // Écran de chargement
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // Écran de sélection du défi
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

            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Choisissez votre défi de 40 jours
            </Text>

            <View style={styles.challengesContainer}>
              {SABILA_NUR_CHALLENGES.map((challenge, index) => {
                const savedProgress = user?.sabilaNurProgress as ChallengeProgress | undefined;
                const isCompleted = savedProgress?.challengeId === challenge.id && savedProgress?.completed;
                const isPremium = PREMIUM_CHALLENGES.includes(challenge.id);
                
                return (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    isCompleted={isCompleted}
                    onPress={() => handleStartChallenge(challenge)}
                    index={index}
                    isPremium={isPremium}
                  />
                );
              })}
            </View>
            </View>
          </ScrollView>
        </LinearGradient>
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
            entering={SlideInDown.duration(300).springify()}
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
            entering={FadeIn.duration(400).delay(100)}
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
            entering={FadeIn.duration(400).delay(150)}
            style={styles.challengeInfo}
          >
            <Text style={[styles.challengeName, { color: selectedChallenge.color }]}>
              {selectedChallenge.emoji} {selectedChallenge.title}
            </Text>
            <Text style={[styles.challengeAttribute, { color: theme.colors.textSecondary }]}>
              {selectedChallenge.attribute} — {selectedChallenge.attributeArabic}
            </Text>
          </Animated.View>

          {/* Verse Block */}
          {dayData.verse && (
            <Animated.View
              entering={FadeIn.duration(400).delay(200)}
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
            entering={FadeIn.duration(400).delay(250)}
            style={styles.tasksContainer}
          >
            <View style={styles.tasksHeader}>
              <Text style={[styles.tasksTitle, { color: theme.colors.text }]}>
                {dayData?.hasIntention ? 'Définir votre intention' : `Tâches du jour (${tasksCompleted}/${tasksToCount})`}
              </Text>
            </View>
            
            {/* Affichage spécial pour les jours avec intention (jour 1) */}
            {dayData?.hasIntention ? (
              <>
                {/* Champ de texte pour l'intention */}
                <Animated.View
                  entering={FadeIn.duration(300).delay(300).springify()}
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
                      entering={FadeIn.duration(300).delay(350 + index * 50).springify()}
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
                    entering={FadeIn.duration(300).delay(300 + index * 50).springify()}
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

          {/* Navigation */}
          <Animated.View 
            entering={FadeIn.duration(400).delay(400)}
            style={styles.navigationContainer}
          >
            {currentDay === 40 && allTasksCompleted ? (
              // Bouton Valider au jour 40 si toutes les tâches sont complétées
              <Pressable
                onPress={handleCompleteChallenge}
                style={styles.validateButton}
              >
                <LinearGradient
                  colors={[selectedChallenge.color, `${selectedChallenge.color}DD`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.validateButtonGradient}
                >
                  <CheckCircle size={24} color="#FFFFFF" />
                  <Text style={[styles.validateButtonText, { color: '#FFFFFF' }]}>
                    Valider le défi
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <>
                <NavButton
                  onPress={handlePreviousDay}
                  disabled={currentDay <= 1}
                  backgroundColor={currentDay > 1 ? theme.colors.backgroundSecondary : 'transparent'}
                  opacity={currentDay > 1 ? 1 : 0.5}
                >
                  <ArrowLeft size={20} color={theme.colors.text} />
                  <Text style={[styles.navButtonText, { color: theme.colors.text }]}>
                    Précédent
                  </Text>
                </NavButton>

                <NavButton
                  onPress={handleNextDay}
                  disabled={currentDay >= 40}
                  opacity={currentDay < 40 ? 1 : 0.5}
                >
                  {currentDay < 40 ? (
                    <LinearGradient
                      colors={[selectedChallenge.color, `${selectedChallenge.color}DD`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.navButtonGradient}
                    >
                      <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>
                        Jour suivant
                      </Text>
                      <ArrowRight size={20} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.navButtonContent, { backgroundColor: theme.colors.backgroundSecondary }]}>
                      <Text style={[styles.navButtonText, { color: theme.colors.text }]}>
                        Jour suivant
                      </Text>
                      <ArrowRight size={20} color={theme.colors.text} />
                    </View>
                  )}
                </NavButton>
              </>
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
                    Écrivez votre intention pour ce défi de 40 jours
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
                    Quitter le défi
                  </Text>
                  <Text style={[styles.quitModalText, { color: theme.colors.textSecondary }]}>
                    Êtes-vous sûr de vouloir quitter ce défi ?{'\n\n'}
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

        {/* Paywall Modal pour les défis premium */}
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          resetAt={null}
          messagesUsed={0}
          mode="subscription"
        />
      </LinearGradient>
    </SafeAreaView>
  );
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
  challengeEmoji: {
    fontSize: fontSize['5xl'],
    textAlign: 'center',
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
  navigationContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  validateButton: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  validateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  validateButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
  },
  navButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  navButtonPressable: {
    width: '100%',
    height: '100%',
  },
  navButtonPrimary: {
    // Styles spécifiques pour le bouton principal
  },
  navButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    gap: spacing.sm,
  },
  navButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    gap: spacing.sm,
  },
  navButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: 'System',
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
});
