/**
 * Hook pour replanifier automatiquement les notifications intelligentes
 * S'exécute au démarrage de l'app et quand l'app revient au premier plan
 */

import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { useSmartNotifications } from './useSmartNotifications';

export function useNotificationScheduler() {
  const { user } = useUser();
  const { rescheduleNotifications, settings } = useSmartNotifications();

  // Replanifier au démarrage si l'utilisateur est connecté
  useEffect(() => {
    if (user?.id && settings?.enabled) {
      // Attendre un peu pour que tout soit initialisé
      const timer = setTimeout(() => {
        rescheduleNotifications().catch(() => {
          // Erreur silencieuse
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user?.id, settings?.enabled, rescheduleNotifications]);

  // Replanifier quand l'app revient au premier plan
  useEffect(() => {
    if (!user?.id || !settings?.enabled) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Replanifier quand l'app revient au premier plan
        rescheduleNotifications().catch(() => {
          // Erreur silencieuse
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.id, settings?.enabled, rescheduleNotifications]);
}

