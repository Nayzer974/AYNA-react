/**
 * Service de raccourcis depuis l'écran d'accueil
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

export interface Shortcut {
  id: string;
  name: string;
  icon: string;
  route: string;
  params?: Record<string, any>;
  enabled: boolean;
  order: number;
}

const SHORTCUTS_KEY = '@ayna_shortcuts';

const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'prayer_times',
    name: 'Heures de Prière',
    icon: '🕌',
    route: 'PrayerTimes',
    enabled: true,
    order: 0,
  },
  {
    id: 'dhikr',
    name: 'Dhikr',
    icon: '📿',
    route: 'DairatAnNur',
    enabled: true,
    order: 1,
  },
  {
    id: 'quran',
    name: 'Coran',
    icon: '📖',
    route: 'QuranReader',
    enabled: true,
    order: 2,
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: '📝',
    route: 'Journal',
    enabled: true,
    order: 3,
  },
  {
    id: 'chat',
    name: 'AYNA',
    icon: '💬',
    route: 'Chat',
    enabled: true,
    order: 4,
  },
  {
    id: 'qibla',
    name: 'Qibla',
    icon: '🧭',
    route: 'QiblaPage',
    enabled: false,
    order: 5,
  },
];

/**
 * Récupère les raccourcis de l'utilisateur
 */
export async function getShortcuts(userId: string): Promise<Shortcut[]> {
  try {
    const stored = await AsyncStorage.getItem(`${SHORTCUTS_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_SHORTCUTS;
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

/**
 * Sauvegarde les raccourcis
 */
export async function saveShortcuts(userId: string, shortcuts: Shortcut[]): Promise<void> {
  try {
    await AsyncStorage.setItem(`${SHORTCUTS_KEY}_${userId}`, JSON.stringify(shortcuts));
  } catch {
    // Erreur silencieuse
  }
}

/**
 * Active/désactive un raccourci
 */
export async function toggleShortcut(
  userId: string,
  shortcutId: string,
  enabled: boolean
): Promise<void> {
  try {
    const shortcuts = await getShortcuts(userId);
    const updated = shortcuts.map(s => 
      s.id === shortcutId ? { ...s, enabled } : s
    );
    await saveShortcuts(userId, updated);
  } catch {
    // Erreur silencieuse
  }
}

/**
 * Réorganise les raccourcis
 */
export async function reorderShortcuts(
  userId: string,
  shortcutIds: string[]
): Promise<void> {
  try {
    const shortcuts = await getShortcuts(userId);
    const reordered = shortcutIds.map((id, index) => {
      const shortcut = shortcuts.find(s => s.id === id);
      return shortcut ? { ...shortcut, order: index } : null;
    }).filter((s): s is Shortcut => s !== null);
    
    // Ajouter les raccourcis non réordonnés
    shortcuts.forEach(shortcut => {
      if (!shortcutIds.includes(shortcut.id)) {
        reordered.push({ ...shortcut, order: reordered.length });
      }
    });
    
    await saveShortcuts(userId, reordered);
  } catch {
    // Erreur silencieuse
  }
}

/**
 * Configure les raccourcis iOS/Android (deep links)
 */
export async function configureSystemShortcuts(userId: string): Promise<void> {
  try {
    const shortcuts = await getShortcuts(userId);
    const enabledShortcuts = shortcuts.filter(s => s.enabled);
    
    // Pour iOS: Utiliser Siri Shortcuts
    // Pour Android: Utiliser App Shortcuts
    // Note: Nécessite une configuration native
    
    // Pour l'instant, on stocke juste les données
    // L'implémentation native devra lire depuis AsyncStorage
  } catch {
    // Erreur silencieuse
  }
}






