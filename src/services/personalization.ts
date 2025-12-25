/**
 * Service de personnalisation avancée
 * Gestion des thèmes personnalisés, préférences utilisateur, etc.
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSONALIZATION_KEY = '@ayna_personalization';

export interface UserPreferences {
  theme?: string;
  language?: string;
  fontSize?: 'small' | 'medium' | 'large';
  notificationsEnabled?: boolean;
  prayerReminders?: boolean;
  challengeReminders?: boolean;
  starsEnabled?: boolean; // Option pour activer/désactiver les étoiles
  analyticsConsent?: boolean; // Consentement analytics (GDPR)
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  customAvatar?: string;
  widgets?: string[]; // Liste des widgets activés
}

/**
 * Charge les préférences utilisateur
 */
export async function loadUserPreferences(): Promise<UserPreferences> {
  try {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Charger depuis le stockage local
      const stored = await AsyncStorage.getItem(PERSONALIZATION_KEY);
      return stored ? JSON.parse(stored) : {};
    }

    // Charger depuis Supabase
    const { data, error } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, ce qui est OK
      throw error;
    }

    const preferences = data?.preferences || {};
    
    // Sauvegarder localement aussi
    await AsyncStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(preferences));
    
    return preferences;
  } catch (error) {
    // Erreur silencieuse en production
    // Retourner les préférences locales en fallback
    const stored = await AsyncStorage.getItem(PERSONALIZATION_KEY);
    return stored ? JSON.parse(stored) : {};
  }
}

/**
 * Sauvegarde les préférences utilisateur
 */
export async function saveUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<void> {
  try {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    
    // Sauvegarder localement
    const current = await loadUserPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(updated));

    if (user) {
      // Sauvegarder dans Supabase
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: updated,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    }
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}

/**
 * Crée un thème personnalisé
 */
export async function createCustomTheme(
  themeName: string,
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  }
): Promise<void> {
  const preferences = await loadUserPreferences();
  const customThemes = preferences.customThemes || {};
  customThemes[themeName] = colors;
  
  await saveUserPreferences({
    customThemes,
  });
}

/**
 * Active/désactive un widget
 */
export async function toggleWidget(widgetId: string, enabled: boolean): Promise<void> {
  const preferences = await loadUserPreferences();
  const widgets = preferences.widgets || [];
  
  if (enabled && !widgets.includes(widgetId)) {
    widgets.push(widgetId);
  } else if (!enabled) {
    const index = widgets.indexOf(widgetId);
    if (index > -1) {
      widgets.splice(index, 1);
    }
  }
  
  await saveUserPreferences({ widgets });
}

/**
 * Upload un avatar personnalisé
 */
export async function uploadCustomAvatar(imageUri: string): Promise<string> {
  try {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    // Convertir l'image en blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload vers Supabase Storage
    // Format: {userId}-{timestamp}.jpg pour correspondre aux politiques RLS
    const fileName = `${user.id}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Sauvegarder dans les préférences
    await saveUserPreferences({ customAvatar: publicUrl });

    return publicUrl;
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}


