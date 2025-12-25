/**
 * Composant YearSelector - Sélecteur d'année avec défilement fluide
 * Permet de naviguer entre les années sans modifier le calendrier actuel
 */

import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Modal } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

interface YearSelectorProps {
  visible: boolean;
  currentYear: number;
  onYearSelect: (year: number) => void;
  onClose: () => void;
  textColor: string;
  accentColor: string;
  theme: any;
}

export function YearSelector({
  visible,
  currentYear,
  onYearSelect,
  onClose,
  textColor,
  accentColor,
  theme,
}: YearSelectorProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Générer les années (100 ans avant et après l'année actuelle)
  const years = useMemo(() => {
    const today = new Date();
    const currentYearNum = today.getFullYear();
    const startYear = currentYearNum - 100;
    const endYear = currentYearNum + 100;
    const yearsList: number[] = [];
    
    for (let year = startYear; year <= endYear; year++) {
      yearsList.push(year);
    }
    
    return yearsList;
  }, []);

  // Scroll vers l'année actuelle quand le modal s'ouvre
  React.useEffect(() => {
    if (visible && scrollViewRef.current) {
      const currentYearIndex = years.findIndex(y => y === currentYear);
      if (currentYearIndex >= 0) {
        // Attendre un peu pour que le ScrollView soit monté
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: currentYearIndex * 50, // 50px par année
            animated: false,
          });
        }, 100);
      }
    }
  }, [visible, currentYear, years]);

  if (!visible) return null;

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
          style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={{ flex: 1 }}>
            {/* En-tête */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>
                Sélectionner une année
              </Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeText, { color: accentColor }]}>
                  Fermer
                </Text>
              </Pressable>
            </View>

            {/* Indicateurs de défilement */}
            <View style={styles.scrollIndicators}>
              <ChevronUp size={20} color={accentColor} />
              <Text style={[styles.scrollHint, { color: theme.colors.textSecondary }]}>
                Faites défiler pour voir plus d'années
              </Text>
              <ChevronDown size={20} color={accentColor} />
            </View>

            {/* Liste des années */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              snapToInterval={50}
              decelerationRate="fast"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {years.map((year) => {
                const isSelected = year === currentYear;
                const isCurrentYear = year === new Date().getFullYear();
                
                return (
                  <Pressable
                    key={year}
                    onPress={() => {
                      onYearSelect(year);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.yearItem,
                      isSelected && { backgroundColor: accentColor + '30' },
                      { opacity: pressed ? 0.7 : 1 }
                    ]}
                  >
                    <Text
                      style={[
                        styles.yearText,
                        { color: isSelected ? accentColor : textColor },
                        isSelected && { fontWeight: '700' },
                        isCurrentYear && !isSelected && { color: accentColor + 'CC' }
                      ]}
                    >
                      {year}
                    </Text>
                    {isCurrentYear && (
                      <View style={[styles.currentYearBadge, { backgroundColor: accentColor + '20' }]}>
                        <Text style={[styles.currentYearText, { color: accentColor }]}>
                          Aujourd'hui
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
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
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: Platform.OS === 'android' ? 20 : 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeText: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  scrollIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollHint: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  yearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  yearText: {
    fontSize: Platform.OS === 'android' ? 18 : 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  currentYearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentYearText: {
    fontSize: Platform.OS === 'android' ? 11 : 10,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
