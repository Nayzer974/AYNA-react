import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ArrowRight } from 'lucide-react-native';
import Animated, { SlideInUp, Easing } from 'react-native-reanimated';
import { GlassCard } from '@/components/ui';
import { getTheme } from '@/data/themes';
import { useUser } from '@/contexts/UserContext';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '@/utils/designTokens';

interface ModuleIntroductionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  color?: string;
  content: string; // Contenu avec emojis et formatage
  buttonText?: string;
}

export function ModuleIntroductionModal({
  visible,
  onClose,
  title,
  icon,
  color,
  content,
  buttonText = 'Commencer',
}: ModuleIntroductionModalProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const accentColor = color || theme.colors.accent;

  // Fonction pour parser le contenu et formater les emojis et sections
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let currentTitle: string | null = null;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Détecter les titres (lignes qui commencent par un emoji)
      if (trimmedLine.match(/^[🌙🕰️🌿🧭📖✨🌌🔋🕊️🌱🤍📿🧘‍♂️🤲⏳🎯🔕🌍🤝🌬️🚫🫀👉📜📝🩺]/)) {
        // Si on a un paragraphe en cours, le fermer
        if (currentParagraph.length > 0) {
          if (currentTitle) {
            elements.push(
              <View key={`section-${elements.length}`} style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: accentColor }]}>
                  {currentTitle}
                </Text>
                <Text style={[styles.sectionText, { color: theme.colors.text }]}>
                  {currentParagraph.join('\n')}
                </Text>
              </View>
            );
          } else {
            elements.push(
              <Text key={`text-${elements.length}`} style={[styles.plainText, { color: theme.colors.text }]}>
                {currentParagraph.join('\n')}
              </Text>
            );
          }
          currentParagraph = [];
        }
        currentTitle = trimmedLine;
      } else if (trimmedLine.length > 0) {
        currentParagraph.push(trimmedLine);
      } else if (trimmedLine.length === 0) {
        // Ligne vide - fermer le paragraphe actuel si on a un titre
        if (currentParagraph.length > 0 && currentTitle) {
          elements.push(
            <View key={`section-${elements.length}`} style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: accentColor }]}>
                {currentTitle}
              </Text>
              <Text style={[styles.sectionText, { color: theme.colors.text }]}>
                {currentParagraph.join('\n')}
              </Text>
            </View>
          );
          currentParagraph = [];
          currentTitle = null;
        } else if (currentParagraph.length > 0 && !currentTitle) {
          // Paragraphe sans titre
          elements.push(
            <Text key={`text-${elements.length}`} style={[styles.plainText, { color: theme.colors.text }]}>
              {currentParagraph.join('\n')}
            </Text>
          );
          currentParagraph = [];
        }
      }
    });

    // Fermer le dernier paragraphe
    if (currentParagraph.length > 0) {
      if (currentTitle) {
        elements.push(
          <View key={`section-${elements.length}`} style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: accentColor }]}>
              {currentTitle}
            </Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              {currentParagraph.join('\n')}
            </Text>
          </View>
        );
      } else {
        elements.push(
          <Text key={`text-${elements.length}`} style={[styles.plainText, { color: theme.colors.text }]}>
            {currentParagraph.join('\n')}
          </Text>
        );
      }
    }

    return elements.length > 0 ? elements : [<Text key="default" style={[styles.plainText, { color: theme.colors.text }]}>{content}</Text>];
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.safeArea}>
        <Pressable 
          style={styles.backdrop}
          onPress={onClose}
        >
          <SafeAreaView style={styles.safeAreaInner}>
            <Animated.View
              entering={SlideInUp.duration(500).easing(Easing.out(Easing.ease))}
              style={styles.container}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <GlassCard style={styles.content}>
                  {/* Header */}
                  <View style={styles.header}>
                    {icon && (
                      <View style={[styles.iconContainer, { 
                        backgroundColor: accentColor + '15',
                        borderColor: accentColor + '30'
                      }]}>
                        {icon}
                      </View>
                    )}
                    <Text style={[styles.title, { color: accentColor }]}>
                      {title}
                    </Text>
                    
                    {/* Bouton fermer */}
                    <Pressable
                      onPress={onClose}
                      style={[styles.closeButton, { 
                        backgroundColor: theme.colors.backgroundSecondary + '80'
                      }]}
                    >
                      <X size={18} color={theme.colors.text} />
                    </Pressable>
                  </View>
                  
                  {/* Body */}
                  <ScrollView 
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {formatContent(content)}
                  </ScrollView>
                  
                  {/* Footer */}
                  <View style={styles.footer}>
                    <View style={[styles.footerSeparator, { backgroundColor: theme.colors.backgroundSecondary }]} />
                    <Pressable
                      onPress={onClose}
                      style={styles.primaryButton}
                    >
                      <LinearGradient
                        colors={[accentColor, `${accentColor}DD`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.primaryButtonGradient}
                      >
                        <Text style={styles.primaryButtonText}>
                          {buttonText}
                        </Text>
                        <ArrowRight size={20} color="#FFFFFF" />
                      </LinearGradient>
                    </Pressable>
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeAreaInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  container: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    justifyContent: 'center',
  },
  content: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
    fontFamily: 'System',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    fontFamily: 'System',
    lineHeight: 28,
  },
  sectionText: {
    fontSize: fontSize.base,
    lineHeight: 24,
    fontFamily: 'System',
  },
  plainText: {
    fontSize: fontSize.base,
    lineHeight: 24,
    fontFamily: 'System',
    marginBottom: spacing.lg,
  },
  footer: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  footerSeparator: {
    height: 1,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  primaryButtonGradient: {
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
});

