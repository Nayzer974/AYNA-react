import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { usePreferences } from '@/contexts/PreferencesContext';

/**
 * Hook pour gérer les retours haptiques de manière centralisée
 * Respecte les préférences utilisateur
 */
export const useHaptics = () => {
    const { preferences } = usePreferences();

    const hapticsEnabled = preferences?.hapticsEnabled ?? true;

    const light = useCallback(() => {
        if (!hapticsEnabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    }, [hapticsEnabled]);

    const medium = useCallback(() => {
        if (!hapticsEnabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    }, [hapticsEnabled]);

    const heavy = useCallback(() => {
        if (!hapticsEnabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
    }, [hapticsEnabled]);

    const selection = useCallback(() => {
        if (!hapticsEnabled) return;
        Haptics.selectionAsync().catch(() => { });
    }, [hapticsEnabled]);

    const success = useCallback(() => {
        if (!hapticsEnabled) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    }, [hapticsEnabled]);

    const warning = useCallback(() => {
        if (!hapticsEnabled) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
    }, [hapticsEnabled]);

    const error = useCallback(() => {
        if (!hapticsEnabled) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
    }, [hapticsEnabled]);

    return {
        light,
        medium,
        heavy,
        selection,
        success,
        warning,
        error,
    };
};
