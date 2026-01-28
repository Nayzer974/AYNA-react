/**
 * Composant Widget Heures de Prière
 * Affiche les heures de prière du jour avec la prochaine prière en évidence
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrayerTimesWidgetData } from '@/services/system/widgetManager';
import { getTheme } from '@/data/themes';
import { Clock } from 'lucide-react-native';

interface PrayerTimesWidgetProps {
  data: PrayerTimesWidgetData;
  themeId?: string;
  compact?: boolean; // Mode compact pour petit widget
}

export function PrayerTimesWidget({ data, themeId = 'default', compact = false }: PrayerTimesWidgetProps) {
  const theme = getTheme(themeId);
  const prayers = [
    { name: 'Fajr', label: 'Fajr', time: data.timings.Fajr },
    { name: 'Dhuhr', label: 'Dhuhr', time: data.timings.Dhuhr },
    { name: 'Asr', label: 'Asr', time: data.timings.Asr },
    { name: 'Maghrib', label: 'Maghrib', time: data.timings.Maghrib },
    { name: 'Isha', label: 'Isha', time: data.timings.Isha },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Clock size={compact ? 16 : 20} color={theme.colors.accent} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Heures de Prière
        </Text>
      </View>

      {/* Prochaine prière en évidence */}
      {data.nextPrayer && !compact && (
        <View style={[styles.nextPrayer, { backgroundColor: theme.colors.accent + '20' }]}>
          <Text style={[styles.nextPrayerLabel, { color: theme.colors.textSecondary }]}>
            Prochaine prière
          </Text>
          <View style={styles.nextPrayerContent}>
            <Text style={[styles.nextPrayerName, { color: theme.colors.accent }]}>
              {data.nextPrayer.name}
            </Text>
            <Text style={[styles.nextPrayerTime, { color: theme.colors.text }]}>
              {data.nextPrayer.time}
            </Text>
            <Text style={[styles.nextPrayerUntil, { color: theme.colors.textSecondary }]}>
              dans {data.nextPrayer.timeUntil}
            </Text>
          </View>
        </View>
      )}

      {/* Liste des prières */}
      <View style={styles.prayersList}>
        {prayers.map((prayer, index) => {
          const isNext = data.nextPrayer?.name === prayer.name && !compact;
          return (
            <View
              key={prayer.name}
              style={[
                styles.prayerRow,
                isNext && { backgroundColor: theme.colors.accent + '10' },
              ]}
            >
              <Text style={[styles.prayerName, { color: theme.colors.text }]}>
                {prayer.label}
              </Text>
              <Text
                style={[
                  styles.prayerTime,
                  { color: isNext ? theme.colors.accent : theme.colors.textSecondary },
                ]}
              >
                {prayer.time}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  nextPrayer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  nextPrayerLabel: {
    fontSize: 12,
    fontFamily: 'System',
    marginBottom: 4,
  },
  nextPrayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextPrayerName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  nextPrayerTime: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System',
    marginLeft: 'auto',
  },
  nextPrayerUntil: {
    fontSize: 12,
    fontFamily: 'System',
  },
  prayersList: {
    gap: 8,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  prayerName: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
  prayerTime: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});








