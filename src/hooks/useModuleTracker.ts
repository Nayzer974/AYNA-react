import React, { useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { logModuleVisit } from '@/services/analytics/moduleTracking';

/**
 * Types de modules à tracker
 */
export type TrackedModule = 
  | 'AYNA'
  | 'Bayt an Nur'
  | 'Sabila Nur'
  | 'Dairat an Nur'
  | 'Nur & Shifa'
  | 'Ummayna'
  | 'Quran'
  | 'Journal';

/**
 * Hook personnalisé pour tracker l'utilisation d'un module
 * 
 * Règle des 10 secondes : Une visite n'est comptabilisée que si l'utilisateur
 * reste sur l'écran plus de 10 secondes (pour filtrer les clics accidentels).
 * 
 * @param moduleName - Le nom du module à tracker
 * 
 * @example
 * ```tsx
 * function Chat() {
 *   useModuleTracker('AYNA');
 *   // ... reste du composant
 * }
 * ```
 */
export function useModuleTracker(moduleName: TrackedModule) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoggedRef = useRef<boolean>(false);

  // Utiliser useFocusEffect pour détecter quand l'écran est réellement visible
  // Cela fonctionne mieux avec React Navigation que useEffect seul
  useFocusEffect(
    React.useCallback(() => {
      // Réinitialiser le flag quand l'écran redevient visible
      hasLoggedRef.current = false;

      // Démarrer le chronomètre de 10 secondes
      timerRef.current = setTimeout(() => {
        // Vérifier que l'utilisateur est toujours sur l'écran
        if (!hasLoggedRef.current) {
          // Enregistrer l'événement
          logModuleVisit(moduleName);
          hasLoggedRef.current = true;
        }
      }, 10000); // 10 secondes

      // Nettoyage : annuler le timer si l'utilisateur quitte l'écran
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        // Réinitialiser le flag pour permettre un nouveau tracking si l'utilisateur revient
        hasLoggedRef.current = false;
      };
    }, [moduleName])
  );
}


