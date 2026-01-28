/**
 * Service de gestion des widgets personnalisables sur l'écran d'accueil
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HomeWidget {
  id: string;
  type: 'prayer_times' | 'dhikr' | 'verse' | 'stats' | 'streak' | 'quick_action';
  position: number; // Ordre d'affichage
  enabled: boolean;
  size: 'small' | 'medium' | 'large';
  config?: Record<string, any>;
}

const HOME_WIDGETS_KEY = '@ayna_home_widgets';

const DEFAULT_WIDGETS: HomeWidget[] = [
  {
    id: 'dhikr_carousel',
    type: 'dhikr',
    position: 0,
    enabled: true,
    size: 'medium',
  },
  {
    id: 'prayer_times_quick',
    type: 'prayer_times',
    position: 1,
    enabled: false,
    size: 'small',
  },
  {
    id: 'verse_of_day',
    type: 'verse',
    position: 2,
    enabled: false,
    size: 'medium',
  },
  {
    id: 'stats_summary',
    type: 'stats',
    position: 3,
    enabled: false,
    size: 'small',
  },
  {
    id: 'streak_display',
    type: 'streak',
    position: 4,
    enabled: false,
    size: 'small',
  },
];

export async function getHomeWidgets(userId: string): Promise<HomeWidget[]> {
  try {
    const stored = await AsyncStorage.getItem(`${HOME_WIDGETS_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_WIDGETS;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export async function saveHomeWidgets(userId: string, widgets: HomeWidget[]): Promise<void> {
  try {
    await AsyncStorage.setItem(`${HOME_WIDGETS_KEY}_${userId}`, JSON.stringify(widgets));
  } catch {
    // Erreur silencieuse
  }
}

export async function updateHomeWidget(
  userId: string,
  widgetId: string,
  updates: Partial<HomeWidget>
): Promise<void> {
  try {
    const widgets = await getHomeWidgets(userId);
    const index = widgets.findIndex((w) => w.id === widgetId);
    if (index >= 0) {
      widgets[index] = { ...widgets[index], ...updates };
      await saveHomeWidgets(userId, widgets);
    }
  } catch {
    // Erreur silencieuse
  }
}

export async function reorderHomeWidgets(
  userId: string,
  widgetIds: string[]
): Promise<void> {
  try {
    const widgets = await getHomeWidgets(userId);
    const reordered = widgetIds.map((id, index) => {
      const widget = widgets.find((w) => w.id === id);
      return widget ? { ...widget, position: index } : null;
    }).filter((w): w is HomeWidget => w !== null);
    
    // Ajouter les widgets non réordonnés
    widgets.forEach((widget) => {
      if (!widgetIds.includes(widget.id)) {
        reordered.push({ ...widget, position: reordered.length });
      }
    });
    
    await saveHomeWidgets(userId, reordered);
  } catch {
    // Erreur silencieuse
  }
}






