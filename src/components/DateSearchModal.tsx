/**
 * Modal de recherche de dates
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, Platform } from 'react-native';
import { X, Search } from 'lucide-react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

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
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          style={[styles.modalContent, { backgroundColor: theme.colors.backgroundSecondary }]}
          onStartShouldSetResponder={() => true}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
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
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
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

