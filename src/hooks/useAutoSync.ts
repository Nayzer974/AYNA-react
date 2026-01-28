/**
 * Hook pour la synchronisation automatique offline/online
 * 
 * Ce hook :
 * - Détecte les changements de connexion réseau
 * - Synchronise automatiquement quand la connexion revient
 * - Peut être utilisé dans n'importe quel composant
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { setupNetworkListener, startAutoSync, getSyncStatus } from '@/services/storage/syncService';

export function useAutoSync() {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Synchroniser au démarrage si en ligne
    startAutoSync().catch(error => {
      console.error('Erreur lors de la synchronisation initiale:', error);
    });

    // Écouter les changements de connexion réseau
    unsubscribeRef.current = setupNetworkListener((isOnline) => {
      if (isOnline) {
        console.log('Connexion rétablie, synchronisation en cours...');
        startAutoSync().catch(error => {
          console.error('Erreur lors de la synchronisation automatique:', error);
        });
      } else {
        console.log('Connexion perdue, données sauvegardées localement');
      }
    });

    // Écouter les changements d'état de l'application
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // L'app revient au premier plan, synchroniser si en ligne
        startAutoSync().catch(error => {
          console.error('Erreur lors de la synchronisation au retour:', error);
        });
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      subscription.remove();
    };
  }, []);

  // Fonction pour synchroniser manuellement
  const syncNow = async () => {
    try {
      await startAutoSync();
      const status = await getSyncStatus();
      return status;
    } catch (error) {
      console.error('Erreur lors de la synchronisation manuelle:', error);
      throw error;
    }
  };

  return { syncNow };
}

