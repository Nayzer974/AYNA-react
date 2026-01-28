import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { X, BookOpen, Sparkles } from 'lucide-react-native';
import { getSoulDegreeBlock, SoulDegreeBlock } from '@/data/soulDegrees';
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

interface SoulDegreeModalProps {
  visible: boolean;
  blockId: number;
  isEntry: boolean; // true = entrée du bloc, false = sortie du bloc
  onClose: () => void;
  onContinue: () => void;
  theme: {
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    accent: string;
  };
}

/**
 * Modal affichant le texte d'entrée ou de sortie d'un bloc (degré de l'âme)
 */
export function SoulDegreeModal({
  visible,
  blockId,
  isEntry,
  onClose,
  onContinue,
  theme,
}: SoulDegreeModalProps) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language?.substring(0, 2) || 'fr') as 'fr' | 'en' | 'ar';
  
  const block = getSoulDegreeBlock(blockId);
  
  if (!block) {
    return null;
  }
  
  const textData = isEntry ? block.entry : block.exit;
  const text = textData[currentLang] || textData.fr;
  const buttonText = isEntry
    ? block.buttonText.entry[currentLang] || block.buttonText.entry.fr
    : block.buttonText.exit[currentLang] || block.buttonText.exit.fr;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInUp.duration(400).springify()}
          style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
            >
              <X size={20} color={theme.text} />
            </Pressable>
          </View>
          
          {/* Icône et titre du bloc */}
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={styles.iconContainer}
          >
            <Text style={styles.blockIcon}>{block.icon}</Text>
          </Animated.View>
          
          <Animated.View
            entering={FadeIn.delay(300).duration(400)}
            style={styles.titleContainer}
          >
            <Text style={[styles.blockNameAr, { color: theme.accent }]}>
              {block.nameAr}
            </Text>
            <Text style={[styles.blockNameFr, { color: theme.text }]}>
              {block.nameFr}
            </Text>
            <Text style={[styles.blockNameEn, { color: theme.textSecondary }]}>
              {block.nameEn}
            </Text>
          </Animated.View>
          
          {/* Badge entrée/sortie */}
          <View style={[styles.badge, { backgroundColor: block.color + '30' }]}>
            {isEntry ? (
              <BookOpen size={14} color={block.color} />
            ) : (
              <Sparkles size={14} color={block.color} />
            )}
            <Text style={[styles.badgeText, { color: block.color }]}>
              {isEntry ? `Bloc ${blockId} — Entrée` : `Bloc ${blockId} — Sortie`}
            </Text>
          </View>
          
          {/* Contenu principal */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.mainText, { color: theme.text }]}>
              {text}
            </Text>
            
            {/* Verset pour la sortie */}
            {!isEntry && block.exit.verse && (
              <View style={[styles.verseContainer, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
                <Text style={[styles.verseReference, { color: theme.accent }]}>
                  {block.exit.verse.reference}
                </Text>
                <Text style={[styles.verseArabic, { color: theme.text }]}>
                  {block.exit.verse.arabic}
                </Text>
                <Text style={[styles.verseTranslation, { color: theme.textSecondary }]}>
                  {block.exit.verse.translation[currentLang] || block.exit.verse.translation.fr}
                </Text>
              </View>
            )}
          </ScrollView>
          
          {/* Bouton d'action */}
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              styles.continueButton,
              { backgroundColor: block.color },
              pressed && styles.continueButtonPressed,
            ]}
          >
            <Text style={styles.continueButtonText}>
              {buttonText}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    height: height * 0.9,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  blockIcon: {
    fontSize: 64,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  blockNameAr: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  blockNameFr: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  blockNameEn: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mainText: {
    fontSize: 17,
    lineHeight: 30,
    textAlign: 'center',
  },
  verseContainer: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  verseReference: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  verseArabic: {
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 36,
    marginBottom: 12,
  },
  verseTranslation: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  continueButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonPressed: {
    opacity: 0.8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

/**
 * Fonction utilitaire pour déterminer le bloc en fonction du jour
 * Bloc 1 : Jours 1-3
 * Bloc 2 : Jours 4-9
 * Bloc 3 : Jours 10-18
 * Bloc 4 : Jours 19-21
 * Bloc 5 : Jours 22-27
 * Bloc 6 : Jours 28-36
 * Bloc 7 : Jours 37-40
 */
export function getBlockForDay(day: number): number {
  if (day >= 1 && day <= 3) return 1;
  if (day >= 4 && day <= 9) return 2;
  if (day >= 10 && day <= 18) return 3;
  if (day >= 19 && day <= 21) return 4;
  if (day >= 22 && day <= 27) return 5;
  if (day >= 28 && day <= 36) return 6;
  if (day >= 37 && day <= 40) return 7;
  return 1; // Par défaut
}

/**
 * Détermine si c'est le premier jour d'un bloc
 * Bloc 1 : Jour 1
 * Bloc 2 : Jour 4
 * Bloc 3 : Jour 10
 * Bloc 4 : Jour 19
 * Bloc 5 : Jour 22
 * Bloc 6 : Jour 28
 * Bloc 7 : Jour 37
 */
export function isFirstDayOfBlock(day: number): boolean {
  return day === 1 || day === 4 || day === 10 || day === 19 || day === 22 || day === 28 || day === 37;
}

/**
 * Détermine si c'est le dernier jour d'un bloc
 * Bloc 1 : Jour 3
 * Bloc 2 : Jour 9
 * Bloc 3 : Jour 18
 * Bloc 4 : Jour 21
 * Bloc 5 : Jour 27
 * Bloc 6 : Jour 36
 * Bloc 7 : Jour 40
 */
export function isLastDayOfBlock(day: number): boolean {
  return day === 3 || day === 9 || day === 18 || day === 21 || day === 27 || day === 36 || day === 40;
}

export default SoulDegreeModal;

