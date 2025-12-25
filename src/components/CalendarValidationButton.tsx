/**
 * Bouton de validation du calendrier
 * 
 * Permet de vérifier la précision des conversions de dates
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable, ScrollView, Platform } from 'react-native';
import { generateValidationReport, validateMonth } from '@/utils/calendarValidator';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

interface CalendarValidationButtonProps {
  year: number;
  month: number;
}

export function CalendarValidationButton({ year, month }: CalendarValidationButtonProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [isValidating, setIsValidating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const accentColor = theme.colors.accent || '#FFD700';
  const textColor = theme.colors.text || '#FFFFFF';
  const backgroundColor = theme.colors.backgroundSecondary || '#1A1A1A';

  const handleValidate = async () => {
    setIsValidating(true);
    setReport(null);
    
    try {
      const validationReport = await generateValidationReport(year, month);
      setReport(validationReport);
      setShowReport(true);
    } catch (error: any) {
      setReport(`Erreur lors de la validation: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  if (!showReport) {
    return (
      <Pressable
        onPress={handleValidate}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed ? accentColor + '30' : accentColor + '20',
            borderColor: accentColor,
          },
        ]}
        disabled={isValidating}
      >
        <Text style={[styles.buttonText, { color: accentColor }]}>
          {isValidating ? 'Validation en cours...' : '🔍 Valider le calendrier'}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.reportContainer, { backgroundColor }]}>
      <Pressable
        onPress={() => setShowReport(false)}
        style={({ pressed }) => [
          styles.closeButton,
          { backgroundColor: pressed ? accentColor + '20' : 'transparent' },
        ]}
      >
        <Text style={[styles.closeButtonText, { color: accentColor }]}>✕ Fermer</Text>
      </Pressable>
      
      <ScrollView style={styles.reportScroll}>
        <Text style={[styles.reportText, { color: textColor }]}>
          {report || 'Aucun rapport disponible'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  reportContainer: {
    marginVertical: 8,
    borderRadius: 8,
    padding: 16,
    maxHeight: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  reportScroll: {
    maxHeight: 350,
  },
  reportText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});


