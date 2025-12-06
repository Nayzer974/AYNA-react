import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

interface ReturnScreenProps {
  onRestart: () => void;
}

export function ReturnScreen({
  onRestart
}: ReturnScreenProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [tasks, setTasks] = useState([
    {
      id: 1,
      text: 'Lire la sourate Yâ-Sîn complète',
      completed: false
    },
    {
      id: 2,
      text: "Accomplir 2 rak'a de shukr (gratitude)",
      completed: false
    },
    {
      id: 3,
      text: 'Écrire votre bilan des 40 jours',
      completed: false
    }
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => task.id === id ? {
      ...task,
      completed: !task.completed
    } : task));
  };

  const allCompleted = tasks.every(task => task.completed);

  // Animation pour l'emoji
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1,
      false
    );
  }, []);

  const animatedEmojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <LinearGradient
          colors={['#3498DB', '#2C3E50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.returnCard}
        >
          <Animated.View style={[styles.emojiContainer, animatedEmojiStyle]}>
            <Text style={styles.emoji}>🌟</Text>
          </Animated.View>
          <Text style={styles.title}>Le Retour</Text>
          <Text style={styles.subtitle}>Jour 40 • Accomplissement</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.tasksCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.tasksTitle, { color: theme.colors.text }]}>
          Tâches finales
        </Text>
        <View style={styles.tasksList}>
          {tasks.map((task, index) => (
            <Animated.View
              key={task.id}
              entering={FadeInDown.delay(300 + index * 100).duration(500)}
            >
              <Pressable
                onPress={() => toggleTask(task.id)}
                style={({ pressed }) => [
                  styles.taskItem,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={[
                  styles.checkbox,
                  task.completed && { backgroundColor: '#FFD369', borderColor: '#FFD369' }
                ]}>
                  {task.completed && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={[
                  styles.taskText,
                  { color: theme.colors.text },
                  task.completed && { textDecorationLine: 'line-through', opacity: 0.6 }
                ]}>
                  {task.text}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
        {allCompleted && (
          <Animated.View entering={FadeIn.duration(500)}>
            <LinearGradient
              colors={['#FFD369', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.congratulationsBox}
            >
              <Text style={styles.congratulationsTitle}>
                Félicitations ! 🎉
              </Text>
              <Text style={styles.congratulationsText}>
                Vous avez complété le Vortex 3•6•9 Nouraniya. Votre transformation
                spirituelle est accomplie.
              </Text>
              <Pressable
                onPress={onRestart}
                style={({ pressed }) => [
                  styles.restartButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.restartButtonText}>
                  Relancer un nouveau vortex
                </Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 24,
  },
  returnCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emojiContainer: {
    marginBottom: 24,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Poppins',
  },
  tasksCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    fontFamily: 'Poppins',
  },
  tasksList: {
    gap: 16,
    marginBottom: 24,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#0A0F2C',
    fontWeight: 'bold',
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  congratulationsBox: {
    borderRadius: 12,
    padding: 24,
    marginTop: 16,
  },
  congratulationsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A0F2C',
    marginBottom: 12,
    fontFamily: 'Poppins',
  },
  congratulationsText: {
    fontSize: 14,
    color: '#0A0F2C',
    marginBottom: 16,
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0A0F2C',
    paddingVertical: 14,
    borderRadius: 12,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});

