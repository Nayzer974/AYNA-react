/**
 * Composant Heatmap pour visualiser la pratique spirituelle
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getTheme } from '@/data/themes';

interface HeatmapProps {
  data: Array<{ date: string; value: number }>; // Valeur 0-4 pour intensité
  theme: ReturnType<typeof getTheme>;
}

export function Heatmap({ data, theme }: HeatmapProps) {
  const weeks: Array<Array<{ date: string; value: number }>> = [];
  
  // Organiser les données par semaines (7 jours)
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const getColor = (value: number) => {
    const colors = [
      theme.colors.backgroundSecondary,
      theme.colors.accent + '30',
      theme.colors.accent + '60',
      theme.colors.accent + '90',
      theme.colors.accent,
    ];
    return colors[Math.min(value, 4)];
  };

  return (
    <View style={styles.container}>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((day, dayIndex) => (
            <View
              key={`${weekIndex}-${dayIndex}`}
              style={[
                styles.day,
                { backgroundColor: getColor(day.value) },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
  },
  week: {
    flexDirection: 'column',
    gap: 4,
  },
  day: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});








