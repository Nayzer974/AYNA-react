/**
 * Hook pour gérer le dark mode avec détection système
 */

import { useEffect, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

export type DarkModePreference = 'system' | 'light' | 'dark';

interface UseDarkModeResult {
  isDarkMode: boolean;
  systemPrefersDark: boolean;
  preference: DarkModePreference;
  setPreference: (pref: DarkModePreference) => void;
}

/**
 * Hook pour gérer le dark mode
 * Détecte les préférences système et permet de les override
 */
export function useDarkMode(): UseDarkModeResult {
  const systemColorScheme = useColorScheme();
  const { user, updateUser } = useUser();
  const [preference, setPreferenceState] = useState<DarkModePreference>(
    (user as any)?.darkModePreference || 'system'
  );

  const systemPrefersDark = systemColorScheme === 'dark';

  // Calculer si on est en dark mode selon la préférence
  const isDarkMode = useMemo(() => {
    if (preference === 'system') {
      return systemPrefersDark;
    }
    return preference === 'dark';
  }, [preference, systemPrefersDark]);

  // Sauvegarder la préférence quand elle change
  const setPreference = async (pref: DarkModePreference) => {
    setPreferenceState(pref);
    // Sauvegarder dans les préférences utilisateur
    // Note: Il faudrait ajouter darkModePreference au UserProfile
    try {
      // updateUser({ darkModePreference: pref });
      // Pour l'instant, on pourrait utiliser storage directement
      const { storage } = await import('@/utils/storage');
      await storage.setItem('ayna_dark_mode_preference', pref);
    } catch (error) {
      // Erreur silencieuse
    }
  };

  // Charger la préférence au démarrage
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const { storage } = await import('@/utils/storage');
        const saved = await storage.getItem('ayna_dark_mode_preference');
        if (saved && ['system', 'light', 'dark'].includes(saved)) {
          setPreferenceState(saved as DarkModePreference);
        }
      } catch (error) {
        // Erreur silencieuse
      }
    };
    loadPreference();
  }, []);

  return {
    isDarkMode,
    systemPrefersDark,
    preference,
    setPreference,
  };
}

/**
 * Hook pour obtenir le thème adapté au dark mode
 */
export function useAdaptiveTheme() {
  const { isDarkMode } = useDarkMode();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  // Pour l'instant, on retourne le thème actuel
  // Dans le futur, on pourrait adapter les couleurs selon isDarkMode
  return {
    theme,
    isDarkMode,
    // Couleurs adaptatives (pourrait être étendu)
    adaptiveColors: {
      background: theme.colors.background,
      text: theme.colors.text,
    },
  };
}




