/**
 * Composant Widget Verset du Jour
 * Affiche un verset du Coran avec traduction
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VerseWidgetData } from '@/services/widgetManager';
import { getTheme } from '@/data/themes';
import { BookOpen } from 'lucide-react-native';

interface VerseWidgetProps {
  data: VerseWidgetData;
  themeId?: string;
  compact?: boolean;
}

export function VerseWidget({ data, themeId = 'default', compact = false }: VerseWidgetProps) {
  const theme = getTheme(themeId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <BookOpen size={compact ? 16 : 20} color={theme.colors.accent} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Verset du Jour
        </Text>
      </View>

      {/* Informations de la sourate */}
      <Text style={[styles.surahInfo, { color: theme.colors.accent }]}>
        {data.surahName} - Verset {data.ayahNumber}
      </Text>

      {/* Texte arabe */}
      <Text style={[styles.arabic, { color: theme.colors.text }]}>
        {data.arabic}
      </Text>

      {/* Traduction */}
      {data.translation && (
        <Text style={[styles.translation, { color: theme.colors.textSecondary }]}>
          {data.translation}
        </Text>
      )}

      {/* Indicateur de date */}
      {!compact && (
        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
          {new Date(data.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      )}
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
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  surahInfo: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  arabic: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 34,
  },
  translation: {
    fontSize: 14,
    fontFamily: 'System',
    lineHeight: 22,
    marginBottom: 8,
  },
  date: {
    fontSize: 11,
    fontFamily: 'System',
    marginTop: 'auto',
    textAlign: 'right',
    fontStyle: 'italic',
  },
});








