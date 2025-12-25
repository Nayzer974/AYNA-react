import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadUserPreferences, saveUserPreferences, UserPreferences } from '@/services/personalization';

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  starsEnabled: boolean;
  setStarsEnabled: (enabled: boolean) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const defaultPreferences: UserPreferences = {
  starsEnabled: true,
  notificationsEnabled: false, // Désactivées par défaut - l'utilisateur doit les activer dans les paramètres
  prayerReminders: false, // Désactivées par défaut
  challengeReminders: false, // Désactivées par défaut
  analyticsConsent: false, // GDPR: Opt-in by default (no consent until explicitly given)
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences au démarrage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const loaded = await loadUserPreferences();
        setPreferences({ ...defaultPreferences, ...loaded });
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
        // Utiliser les préférences par défaut en cas d'erreur
        setPreferences(defaultPreferences);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Mettre à jour les préférences
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    
    try {
      await saveUserPreferences(updates);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
      // Revenir aux anciennes préférences en cas d'erreur
      setPreferences(preferences);
    }
  };

  // Fonction helper pour activer/désactiver les étoiles
  const setStarsEnabled = async (enabled: boolean) => {
    await updatePreferences({ starsEnabled: enabled });
  };

  const value: PreferencesContextType = {
    preferences,
    updatePreferences,
    starsEnabled: preferences.starsEnabled ?? true,
    setStarsEnabled,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    // Retourner des valeurs par défaut au lieu de throw pour éviter les erreurs
    // si le hook est utilisé avant que le provider soit monté
    console.warn('usePreferences used outside PreferencesProvider, using default values');
    return {
      preferences: defaultPreferences,
      updatePreferences: async () => {},
      starsEnabled: true,
      setStarsEnabled: async () => {},
    };
  }
  return context;
}
