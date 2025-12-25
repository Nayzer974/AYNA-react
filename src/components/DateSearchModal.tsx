/**
 * Modal de recherche de dates
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, Platform } from 'react-native';
import { X, Search } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';

interface DateSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (year: number, month: number, day: number) => void;
  textColor: string;
  accentColor: string;
  theme: any;
}

const GREGORIAN_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
] as const;

export function DateSearchModal({ visible, onClose, onDateSelect, textColor, accentColor, theme }: DateSearchModalProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const handleSearch = () => {
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
      onDateSelect(yearNum, monthNum, dayNum);
      setDay('');
      setMonth('');
      setYear('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border || 'rgba(255, 255, 255, 0.1)',
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>
                Rechercher une date
              </Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={24} color={textColor} />
              </Pressable>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Jour
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: accentColor + '40' }]}
                  placeholder="JJ"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={day}
                  onChangeText={setDay}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Mois
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: accentColor + '40' }]}
                  placeholder="MM"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={month}
                  onChangeText={setMonth}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Année
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: accentColor + '40' }]}
                  placeholder="AAAA"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>

            <Pressable
              onPress={handleSearch}
              style={[styles.searchButton, { backgroundColor: accentColor }]}
            >
              <Search size={18} color="#000" />
              <Text style={[styles.searchButtonText, { color: '#000' }]}>
                Rechercher
              </Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: Platform.OS === 'android' ? 20 : 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 20,
  },
  inputRow: {
    gap: 8,
  },
  label: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: Platform.OS === 'android' ? 16 : 15,
    fontFamily: 'System',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchButtonText: {
    fontSize: Platform.OS === 'android' ? 16 : 15,
    fontWeight: '700',
    fontFamily: 'System',
  },
});

