import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { CheckCircle, Circle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Challenge, getDayByChallengeAndDay } from '@/data/challenges';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

type Phase = '3' | '6' | '9' | 'portal' | 'return';

interface ActionChecklistProps {
  phase: Phase;
  challenge: Challenge;
  day: number;
  onCompletionChange?: (allCompleted: boolean) => void;
}

// Fonctions khalwa intégrées (temporaire, à déplacer dans khalwaData.ts plus tard)
function extractKhalwaName(taskDescription: string): string | null {
  let match = taskDescription.match(/Kalwa\s*:\s*["']([^"']+)(?:\s*×\s*\d+)?["']/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  match = taskDescription.match(/Kalwa\s*:\s*([^×]+?)(?:\s*×\s*\d+)?$/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

function mapKhalwaNameToDivineName(khalwaName: string): { id: string } | null {
  const normalizedName = khalwaName.toLowerCase().trim();
  const khalwaNameMapping: Record<string, string> = {
    'yâ allah': 'allah',
    'ya allah': 'allah',
    'allâh': 'allah',
    'allah': 'allah',
    'yâ nûr': 'as-salam',
    'ya nur': 'as-salam',
    'nûr': 'as-salam',
    'nur': 'as-salam',
    'yâ hafidh': 'al-hafiz',
    'ya hafidh': 'al-hafiz',
    'hafidh': 'al-hafiz',
    'yâ qawiyy': 'al-aziz',
    'ya qawiyy': 'al-aziz',
    'qawiyy': 'al-aziz',
    'yâ latîf': 'al-latif',
    'ya latif': 'al-latif',
    'yâ latif': 'al-latif',
    'latîf': 'al-latif',
    'latif': 'al-latif',
  };
  const mappedId = khalwaNameMapping[normalizedName];
  if (mappedId) {
    return { id: mappedId };
  }
  return null;
}

export function ActionChecklist({
  phase,
  challenge,
  day,
  onCompletionChange
}: ActionChecklistProps) {
  const { user, saveCompletedTasks } = useUser();
  const navigation = useNavigation();
  const theme = getTheme(user?.theme || 'default');
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const dayData = getDayByChallengeAndDay(challenge.id, day);
  const phaseActions = dayData?.tasks.map(t => t.description) || [];
  const phaseTasks = dayData?.tasks || [];
  
  // Charger les tâches complétées sauvegardées au démarrage
  useEffect(() => {
    const savedTasks = user?.challenge40Days?.completedTasks?.find(t => t.day === day);
    if (savedTasks) {
      setCompleted(new Set(savedTasks.taskIndices));
    } else {
      setCompleted(new Set());
    }
  }, [day, challenge.id, user?.challenge40Days?.completedTasks]);
  
  // Sauvegarder les tâches complétées quand elles changent (avec debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const taskIndices = Array.from(completed);
      saveCompletedTasks(day, taskIndices);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [completed, day, saveCompletedTasks]);

  const toggleAction = (index: number) => {
    const task = phaseTasks[index];
    
    // Si c'est une tâche kalwa, rediriger vers bayt-nur
    if (task?.type === 'kalwa') {
      const khalwaName = extractKhalwaName(task.description);
      if (khalwaName) {
        const divineName = mapKhalwaNameToDivineName(khalwaName);
        if (divineName) {
          // Rediriger vers bayt-nur avec les paramètres nécessaires
          navigation.navigate('BaytAnNur' as never, {
            divineNameId: divineName.id,
            khalwaName: khalwaName,
            fromChallenge: true,
            challengeId: challenge.id,
            day: day,
            taskIndex: index
          } as never);
          return;
        } else {
          Alert.alert(
            'Erreur',
            `Impossible de trouver le nom divin pour "${khalwaName}". Veuillez contacter le support.`
          );
          return;
        }
      } else {
        Alert.alert(
          'Erreur',
          'Impossible d\'extraire le nom de khalwa de la tâche. Veuillez contacter le support.'
        );
        return;
      }
    }
    
    // Pour les autres tâches, comportement normal
    const newCompleted = new Set(completed);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompleted(newCompleted);
  };

  // Notifier le parent quand toutes les actions sont complétées
  useEffect(() => {
    if (onCompletionChange) {
      if (phaseActions.length === 0) {
        onCompletionChange(true);
      } else {
        const allCompleted = completed.size === phaseActions.length;
        onCompletionChange(allCompleted);
      }
    }
  }, [completed, phaseActions.length, onCompletionChange]);

  if (phaseActions.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Actions du jour ({completed.size}/{phaseActions.length})
      </Text>
      <View style={styles.actionsList}>
        {phaseActions.map((action, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(400 + index * 100).duration(500)}
          >
            <Pressable
              onPress={() => toggleAction(index)}
              style={({ pressed }) => [
                styles.actionItem,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {completed.has(index) ? (
                <CheckCircle size={28} color="#FFD369" />
              ) : (
                <Circle size={28} color="rgba(255, 255, 255, 0.4)" />
              )}
              <Text style={[
                styles.actionText,
                { color: theme.colors.text },
                completed.has(index) && { textDecorationLine: 'line-through', opacity: 0.6 }
              ]}>
                {action}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    fontFamily: 'Poppins',
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins',
  },
});

