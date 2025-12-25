/**
 * Hook pour gérer les notifications intelligentes
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import {
  loadUserHabits,
  saveUserHabits,
  updateHabitsFromActivity,
  loadNotificationSettings,
  saveNotificationSettings,
  scheduleAllSmartNotifications,
  getScheduledNotifications,
  type UserHabits,
  type NotificationSettings,
  type SmartNotification,
} from '@/services/smartNotifications';

export function useSmartNotifications() {
  const { user } = useUser();
  const [habits, setHabits] = useState<UserHabits | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les habitudes et paramètres
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const [loadedHabits, loadedSettings, notifications] = await Promise.all([
          loadUserHabits(user.id),
          loadNotificationSettings(),
          getScheduledNotifications(),
        ]);

        setHabits(loadedHabits);
        setSettings(loadedSettings);
        setScheduledNotifications(notifications);
      } catch (error) {
        // Erreur silencieuse
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Mettre à jour les habitudes après une activité
  const recordActivity = useCallback(async (
    activityType: 'prayer' | 'dhikr' | 'journal' | 'quran' | 'meditation',
    metadata?: {
      prayerName?: string;
      time?: string;
      duration?: number;
    }
  ) => {
    if (!user?.id) return;

    try {
      await updateHabitsFromActivity(user.id, activityType, metadata);
      
      // Recharger les habitudes
      const updatedHabits = await loadUserHabits(user.id);
      setHabits(updatedHabits);
      
      // Replanifier les notifications si nécessaire
      if (settings?.enabled) {
        await scheduleAllSmartNotifications(user.id);
        const notifications = await getScheduledNotifications();
        setScheduledNotifications(notifications);
      }
    } catch (error) {
      // Erreur silencieuse
    }
  }, [user?.id, settings]);

  // Mettre à jour les paramètres
  const updateSettings = useCallback(async (newSettings: NotificationSettings) => {
    try {
      await saveNotificationSettings(newSettings);
      setSettings(newSettings);
      
      // Replanifier les notifications
      if (user?.id && newSettings.enabled) {
        await scheduleAllSmartNotifications(user.id);
        const notifications = await getScheduledNotifications();
        setScheduledNotifications(notifications);
      }
    } catch (error) {
      // Erreur silencieuse
    }
  }, [user?.id]);

  // Replanifier les notifications
  const rescheduleNotifications = useCallback(async () => {
    if (!user?.id || !settings?.enabled) return;

    try {
      await scheduleAllSmartNotifications(user.id);
      const notifications = await getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      // Erreur silencieuse
    }
  }, [user?.id, settings]);

  return {
    habits,
    settings,
    scheduledNotifications,
    loading,
    recordActivity,
    updateSettings,
    rescheduleNotifications,
  };
}

