/**
 * Composant de configuration des notifications intelligentes
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { Bell, Clock, Moon, Sparkles, Zap } from 'lucide-react-native';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import type { NotificationSettings } from '@/services/system/smartNotifications';

interface SmartNotificationsSettingsProps {
  theme: ReturnType<typeof getTheme>;
}

export function SmartNotificationsSettings({ theme }: SmartNotificationsSettingsProps) {
  const { user } = useUser();
  const { t } = useTranslation();
  const { settings, updateSettings, rescheduleNotifications } = useSmartNotifications();
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  if (!localSettings || !user) {
    return null;
  }

  const handleToggle = async (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    await updateSettings(newSettings);
  };

  const handleNestedToggle = async (
    section: 'prayerReminders' | 'dhikrReminders' | 'journalReminders' | 'suggestions' | 'quietHours',
    key: string,
    value: any
  ) => {
    const newSettings = {
      ...localSettings,
      [section]: {
        ...localSettings[section],
        [key]: value,
      },
    };
    setLocalSettings(newSettings);
    await updateSettings(newSettings);
    
    // Replanifier si nécessaire
    if (newSettings.enabled) {
      await rescheduleNotifications();
    }
  };

  const handleOffsetChange = async (index: number, value: number) => {
    const newOffsets = [...localSettings.prayerReminders.offsets];
    newOffsets[index] = Math.max(0, Math.min(30, value));
    await handleNestedToggle('prayerReminders', 'offsets', newOffsets);
  };

  return (
    <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
      <View style={styles.sectionHeader}>
        <View>
          <Bell size={24} color={theme.colors.accent} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('settings.smartNotifications.title') || 'Notifications intelligentes'}
        </Text>
      </View>

      {/* Toggle principal */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelContainer}>
          <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
            {t('settings.smartNotifications.enable') || 'Activer les notifications'}
          </Text>
          <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
            {t('settings.smartNotifications.enableDesc') || 'Recevez des rappels personnalisés basés sur vos habitudes'}
          </Text>
        </View>
        <Switch
          value={localSettings.enabled}
          onValueChange={(value) => handleToggle('enabled', value)}
          trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
          thumbColor="#fff"
        />
      </View>

      {localSettings.enabled && (
        <>
          {/* Rappels de Prières */}
          <View style={styles.subsection}>
            <View style={styles.subsectionHeader}>
              <Clock size={20} color={theme.colors.accent} />
              <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                {t('settings.smartNotifications.prayerReminders.title') || 'Rappels de prières'}
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
                {t('settings.smartNotifications.enableReminders') || 'Activer les rappels'}
              </Text>
              <Switch
                value={localSettings.prayerReminders.enabled}
                onValueChange={(value) => handleNestedToggle('prayerReminders', 'enabled', value)}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>

            {localSettings.prayerReminders.enabled && (
              <>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelContainer}>
                    <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
                      {t('settings.smartNotifications.adaptiveMode') || 'Mode adaptatif'}
                    </Text>
                    <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
                      {t('settings.smartNotifications.prayerReminders.adaptiveDesc') || 'S\'adapte à vos habitudes de prière'}
                    </Text>
                  </View>
                  <Switch
                    value={localSettings.prayerReminders.adaptive}
                    onValueChange={(value) => handleNestedToggle('prayerReminders', 'adaptive', value)}
                    trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                    thumbColor="#fff"
                  />
                </View>

                {!localSettings.prayerReminders.adaptive && (
                  <View style={styles.offsetsContainer}>
                    <Text style={[styles.offsetsLabel, { color: theme.colors.textSecondary }]}>
                      {t('settings.smartNotifications.prayerReminders.reminderTime') || 'Rappels (minutes avant)'}
                    </Text>
                    <View style={styles.offsetsList}>
                      {localSettings.prayerReminders.offsets.map((offset, index) => (
                        <View key={index} style={styles.offsetItem}>
                          <Text style={[styles.offsetText, { color: theme.colors.text }]}>
                            {offset} min
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Rappels de Dhikr */}
          <View style={styles.subsection}>
            <View style={styles.subsectionHeader}>
              <Sparkles size={20} color={theme.colors.accent} />
              <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                {t('settings.smartNotifications.dhikrReminders.title') || 'Rappels de dhikr'}
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
                {t('settings.smartNotifications.enableReminders') || 'Activer les rappels'}
              </Text>
              <Switch
                value={localSettings.dhikrReminders.enabled}
                onValueChange={(value) => handleNestedToggle('dhikrReminders', 'enabled', value)}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>

            {localSettings.dhikrReminders.enabled && (
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
                    {t('settings.smartNotifications.adaptiveMode') || 'Mode adaptatif'}
                  </Text>
                  <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
                    {t('settings.smartNotifications.dhikrReminders.adaptiveDesc') || 'S\'adapte à vos moments préférés de dhikr'}
                  </Text>
                </View>
                <Switch
                  value={localSettings.dhikrReminders.adaptive}
                  onValueChange={(value) => handleNestedToggle('dhikrReminders', 'adaptive', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                  thumbColor="#fff"
                />
              </View>
            )}
          </View>

          {/* Rappels de Journal */}
          <View style={styles.subsection}>
            <View style={styles.subsectionHeader}>
              <Zap size={20} color={theme.colors.accent} />
              <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                {t('settings.smartNotifications.journalReminders.title') || 'Rappels de journal'}
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
                {t('settings.smartNotifications.enableReminders') || 'Activer les rappels'}
              </Text>
              <Switch
                value={localSettings.journalReminders.enabled}
                onValueChange={(value) => handleNestedToggle('journalReminders', 'enabled', value)}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>

            {localSettings.journalReminders.enabled && (
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
                    {t('settings.smartNotifications.adaptiveMode') || 'Mode adaptatif'}
                  </Text>
                  <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
                    {t('settings.smartNotifications.journalReminders.adaptiveDesc') || 'S\'adapte à vos moments préférés d\'écriture'}
                  </Text>
                </View>
                <Switch
                  value={localSettings.journalReminders.adaptive}
                  onValueChange={(value) => handleNestedToggle('journalReminders', 'adaptive', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                  thumbColor="#fff"
                />
              </View>
            )}
          </View>

          {/* Suggestions */}
          <View style={styles.subsection}>
            <View style={styles.subsectionHeader}>
              <Sparkles size={20} color={theme.colors.accent} />
              <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                {t('settings.smartNotifications.suggestions.title') || 'Suggestions intelligentes'}
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
                {t('settings.smartNotifications.suggestions.enable') || 'Activer les suggestions'}
              </Text>
              <Switch
                value={localSettings.suggestions.enabled}
                onValueChange={(value) => handleNestedToggle('suggestions', 'enabled', value)}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>

            {localSettings.suggestions.enabled && (
              <View style={styles.frequencyContainer}>
                <Text style={[styles.frequencyLabel, { color: theme.colors.textSecondary }]}>
                  {t('settings.smartNotifications.suggestions.frequencyLabel') || 'Fréquence'}
                </Text>
                <View style={styles.frequencyOptions}>
                  {(['low', 'medium', 'high'] as const).map((freq) => (
                    <Pressable
                      key={freq}
                      onPress={() => handleNestedToggle('suggestions', 'frequency', freq)}
                      style={[
                        styles.frequencyOption,
                        localSettings.suggestions.frequency === freq && {
                          backgroundColor: theme.colors.accent + '40',
                          borderColor: theme.colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.frequencyOptionText,
                          { color: theme.colors.text },
                          localSettings.suggestions.frequency === freq && { color: theme.colors.accent },
                        ]}
                      >
                        {freq === 'low' ? t('settings.smartNotifications.suggestions.frequency.low') || 'Faible' :
                         freq === 'medium' ? t('settings.smartNotifications.suggestions.frequency.medium') || 'Moyenne' :
                         t('settings.smartNotifications.suggestions.frequency.high') || 'Élevée'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Heures Silencieuses */}
          <View style={styles.subsection}>
            <View style={styles.subsectionHeader}>
              <Moon size={20} color={theme.colors.accent} />
              <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                {t('settings.smartNotifications.quietHours.title') || 'Heures silencieuses'}
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelContainer}>
                <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
                  {t('settings.smartNotifications.quietHours.enable') || 'Activer les heures silencieuses'}
                </Text>
                <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
                  {t('settings.smartNotifications.quietHours.desc') || 'Aucune notification pendant ces heures'}
                </Text>
              </View>
              <Switch
                value={localSettings.quietHours.enabled}
                onValueChange={(value) => handleNestedToggle('quietHours', 'enabled', value)}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>

            {localSettings.quietHours.enabled && (
              <View style={styles.quietHoursContainer}>
                <Text style={[styles.quietHoursText, { color: theme.colors.text }]}>
                  {(t('settings.smartNotifications.from') || 'De')} {localSettings.quietHours.start} {(t('settings.smartNotifications.to') || 'à')} {localSettings.quietHours.end}
                </Text>
              </View>
            )}
          </View>

          {/* Respecter le temps de prière */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelContainer}>
              <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
                {t('settings.smartNotifications.respectPrayerTime.title') || 'Respecter le temps de prière'}
              </Text>
              <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
                {t('settings.smartNotifications.respectPrayerTime.desc') || 'Ne pas notifier pendant les 30 minutes autour des heures de prière'}
              </Text>
            </View>
            <Switch
              value={localSettings.respectPrayerTime}
              onValueChange={(value) => handleToggle('respectPrayerTime', value)}
              trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
              thumbColor="#fff"
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    fontFamily: 'System',
    lineHeight: 16,
  },
  subsection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  offsetsContainer: {
    marginTop: 12,
  },
  offsetsLabel: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 8,
  },
  offsetsList: {
    flexDirection: 'row',
    gap: 8,
  },
  offsetItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  offsetText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  frequencyContainer: {
    marginTop: 12,
  },
  frequencyLabel: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 8,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  frequencyOptionText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
  },
  quietHoursContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  quietHoursText: {
    fontSize: 14,
    fontFamily: 'System',
  },
});

