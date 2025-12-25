import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

/**
 * Hook pour utiliser le haptic feedback (vibration tactile)
 * 
 * Usage:
 * const haptic = useHapticFeedback();
 * haptic.light(); // Pour les interactions légères
 * haptic.medium(); // Pour les interactions moyennes
 * haptic.heavy(); // Pour les interactions importantes
 * haptic.success(); // Pour les succès
 * haptic.error(); // Pour les erreurs
 */
export function useHapticFeedback() {
  const light = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      // Ignore les erreurs si le haptic n'est pas disponible
    });
  }, []);

  const medium = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
      // Ignore les erreurs si le haptic n'est pas disponible
    });
  }, []);

  const heavy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
      // Ignore les erreurs si le haptic n'est pas disponible
    });
  }, []);

  const success = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
      // Ignore les erreurs si le haptic n'est pas disponible
    });
  }, []);

  const error = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {
      // Ignore les erreurs si le haptic n'est pas disponible
    });
  }, []);

  const warning = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {
      // Ignore les erreurs si le haptic n'est pas disponible
    });
  }, []);

  const selection = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      // Ignore les erreurs si le haptic n'est pas disponible
    });
  }, []);

  return {
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    selection,
  };
}




