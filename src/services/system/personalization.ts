/**
 * Service de personnalisation avancÃ©e
 * Gestion des thÃ¨mes personnalisÃ©s, prÃ©fÃ©rences utilisateur, etc.
 */

import { supabase } from '@/services/auth/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSONALIZATION_KEY = '@ayna_personalization';

export interface UserPreferences {
  spaceAudioEnabled?: boolean;
  theme?: string;
  language?: string;
  fontSize?: 'small' | 'medium' | 'large';
  notificationsEnabled?: boolean;
  prayerReminders?: boolean;
  challengeReminders?: boolean;
  starsEnabled?: boolean; // Option pour activer/dÃ©sactiver les Ã©toiles
  analyticsConsent?: boolean; // Consentement analytics (GDPR)
  hapticsEnabled?: boolean; // Haptic feedback for interactions
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  customThemes?: Record<string, any>; // Custom theme definitions
  customAvatar?: string;
  widgets?: string[]; // Liste des widgets activÃ©s
}

/**
 * Charge les prÃ©fÃ©rences utilisateur
 */
export async function loadUserPreferences(): Promise<UserPreferences> {
  try {
    if (!supabase) {
      const stored = await AsyncStorage.getItem(PERSONALIZATION_KEY);
      return stored ? JSON.parse(stored) : {};
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Charger depuis le stockage local
      const stored = await AsyncStorage.getItem(PERSONALIZATION_KEY);
      return stored ? JSON.parse(stored) : {};
    }

    // Charger depuis Supabase
    if (!supabase) return {};
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
    // Retourner les prÃ©fÃ©rences locales en fallback
    const stored = await AsyncStorage.getItem(PERSONALIZATION_KEY);
    return stored ? JSON.parse(stored) : {};
  }
}

/**
 * Sauvegarde les prÃ©fÃ©rences utilisateur
 */
export async function saveUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<void> {
  try {
    if (!supabase) {
      const current = await loadUserPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(updated));
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();

    // Sauvegarder localement
    const current = await loadUserPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(updated));

    if (user && supabase) {
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
 * CrÃ©e un thÃ¨me personnalisÃ©
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
 * Active/dÃ©sactive un widget
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
 * Upload un avatar personnalisÃ©
 */
export async function uploadCustomAvatar(imageUri: string): Promise<string> {
  try {
    if (!supabase) throw new Error('Supabase non configuré');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connectÃ©');

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

    // Sauvegarder dans les prÃ©fÃ©rences
    await saveUserPreferences({ customAvatar: publicUrl });

    return publicUrl;
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}



