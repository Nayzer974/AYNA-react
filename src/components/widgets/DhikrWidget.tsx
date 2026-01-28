/**
 * Composant Widget Dhikr
 * Affiche le dhikr du jour avec texte arabe et traduction
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DhikrWidgetData } from '@/services/system/widgetManager';
import { getTheme } from '@/data/themes';
import { Heart } from 'lucide-react-native';

interface DhikrWidgetProps {
  data: DhikrWidgetData;
  themeId?: string;
  compact?: boolean;
}

export function DhikrWidget({ data, themeId = 'default', compact = false }: DhikrWidgetProps) {
  const theme = getTheme(themeId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Heart size={compact ? 16 : 20} color={theme.colors.accent} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Dhikr du Jour
        </Text>
      </View>

      {/* Texte arabe */}
      <Text style={[styles.arabic, { color: theme.colors.text }]}>
        {data.arabic}
      </Text>

      {/* Translittération */}
      {data.transliteration && !compact && (
        <Text style={[styles.transliteration, { color: theme.colors.textSecondary }]}>
          {data.transliteration}
        </Text>
      )}

      {/* Traduction */}
      {data.translation && (
        <Text style={[styles.translation, { color: theme.colors.textSecondary }]}>
          {data.translation}
        </Text>
      )}

      {/* Référence */}
      {data.reference && !compact && (
        <Text style={[styles.reference, { color: theme.colors.accent }]}>
          {data.reference}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    minHeight: 150,
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
  arabic: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 36,
  },
  transliteration: {
    fontSize: 14,
    fontFamily: 'System',
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  translation: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 8,
    lineHeight: 20,
  },
  reference: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 'auto',
    textAlign: 'right',
  },
});








