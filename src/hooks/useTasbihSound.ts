// hooks/useTasbihSound.ts
import * as Haptics from 'expo-haptics';

export const useTasbihSound = () => {
  const playClick = async () => {
    try {
      // Toujours jouer les haptics même si le son n'est pas disponible
      if (Haptics.impactAsync) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Vibration légère
      }
    } catch (error) {
      // Erreur silencieuse si haptics n'est pas disponible
    }
  };

  const playChime = async () => {
    try {
      // Toujours jouer les haptics même si le son n'est pas disponible
      if (Haptics.notificationAsync) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Vibration de succès
      }
    } catch (error) {
      // Erreur silencieuse si haptics n'est pas disponible
    }
  };

  return { playClick, playChime };
};
