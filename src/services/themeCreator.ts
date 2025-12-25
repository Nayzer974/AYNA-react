/**
 * Service de création de thèmes personnalisés
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '@/data/themes';
import { supabase } from './supabase';

export interface CustomTheme extends Theme {
  userId?: string;
  isCustom: boolean;
}

const CUSTOM_THEMES_KEY = '@ayna_custom_themes';

export async function saveCustomTheme(userId: string, theme: CustomTheme): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(`${CUSTOM_THEMES_KEY}_${userId}`);
    const themes: CustomTheme[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = themes.findIndex(t => t.id === theme.id);
    if (existingIndex >= 0) {
      themes[existingIndex] = theme;
    } else {
      themes.push(theme);
    }
    
    await AsyncStorage.setItem(`${CUSTOM_THEMES_KEY}_${userId}`, JSON.stringify(themes));
    
    // Synchroniser avec Supabase
    if (supabase) {
      await supabase.from('user_themes').upsert({
        user_id: userId,
        theme_id: theme.id,
        theme_data: theme,
        updated_at: new Date().toISOString(),
      });
    }
  } catch {
    // Erreur silencieuse
  }
}

export async function getCustomThemes(userId: string): Promise<CustomTheme[]> {
  try {
    const stored = await AsyncStorage.getItem(`${CUSTOM_THEMES_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
}

export async function deleteCustomTheme(userId: string, themeId: string): Promise<void> {
  try {
    const themes = await getCustomThemes(userId);
    const filtered = themes.filter(t => t.id !== themeId);
    await AsyncStorage.setItem(`${CUSTOM_THEMES_KEY}_${userId}`, JSON.stringify(filtered));
    
    if (supabase) {
      await supabase.from('user_themes').delete().eq('user_id', userId).eq('theme_id', themeId);
    }
  } catch {
    // Erreur silencieuse
  }
}

export function generateThemeId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}








