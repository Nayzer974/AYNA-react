/**
 * SubscriptionBenefitsModal Component
 * 
 * Modal affichant les avantages de l'abonnement Premium
 * avec accentuation sur la Zakaat
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Dimensions } from 'react-native';
import { X, Crown, Sparkles, Infinity, Brain, Star, Heart, Gift } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { useTranslation } from 'react-i18next';
import Animated, { SlideInDown, SlideOutDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface SubscriptionBenefitsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SubscriptionBenefitsModal({ visible, onClose }: SubscriptionBenefitsModalProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Infinity,
      title: t('subscription.benefits.unlimited') || 'Chat IA illimité',
      description: t('subscription.benefits.unlimitedDesc') || 'Accès illimité à AYNA, votre assistant spirituel IA',
    },
    {
      icon: Brain,
      title: t('subscription.benefits.analyses') || 'Analyses spirituelles avancées',
      description: t('subscription.benefits.analysesDesc') || 'Analyses approfondies de votre journal, intentions et parcours spirituel',
    },
    {
      icon: Sparkles,
      title: t('subscription.benefits.features') || 'Toutes les fonctionnalités premium',
      description: t('subscription.benefits.featuresDesc') || 'Accès à toutes les fonctionnalités exclusives de l\'application',
    },
    {
      icon: Star,
      title: t('subscription.benefits.support') || 'Support prioritaire',
      description: t('subscription.benefits.supportDesc') || 'Assistance en priorité pour toutes vos questions',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
          style={[styles.modalContainer, { backgroundColor: theme.colors.backgroundSecondary }]}
        >
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <LinearGradient
                  colors={['#c9a227', '#f4d03f', '#c9a227']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.crownContainer}
                >
                  <Crown size={24} color="#0a0f1a" fill="#0a0f1a" strokeWidth={2.5} />
                </LinearGradient>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                  {t('subscription.benefits.title') || 'Vos avantages Premium'}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: theme.colors.backgroundSecondary + '80' }]}
              >
                <X size={20} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Section Zakaat - Mise en avant */}
              <Animated.View entering={FadeIn.delay(100)}>
                <View style={[styles.zakaatCard, { 
                  backgroundColor: theme.colors.accent + '15',
                  borderColor: theme.colors.accent + '40',
                }]}>
                  <View style={styles.zakaatHeader}>
                    <View style={[styles.zakaatIconContainer, { backgroundColor: theme.colors.accent }]}>
                      <Heart size={24} color={theme.colors.background} />
                    </View>
                    <View style={styles.zakaatHeaderText}>
                      <Text style={[styles.zakaatTitle, { color: theme.colors.accent }]}>
                        {t('subscription.benefits.zakaatTitle') || '🤲 Votre contribution fait la différence'}
                      </Text>
                      <View style={[styles.zakaatBadge, { backgroundColor: theme.colors.accent }]}>
                        <Text style={[styles.zakaatBadgeText, { color: theme.colors.background }]}>
                          Zakaat
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.zakaatText, { color: theme.colors.textSecondary }]}>
                    {t('subscription.zakaatMessage') ||
                      'L\'abonnement AYNA Premium est à la fois un accès complet aux outils IA et un acte de solidarité. Plus de 10% des fonds récoltés par l\'activation des comptes premium sont reversés à des associations humanitaires sous forme de Zakaat, afin de soutenir directement les plus démunis. En activant votre compte, vous contribuez à un projet où tout le monde y gagne : vous bénéficiez de l\'IA avancée et, en même temps, vous participez à une action concrète pour aider ceux qui en ont le plus besoin.'}
                  </Text>
                </View>
              </Animated.View>

              {/* Liste des avantages */}
              <View style={styles.benefitsSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {t('subscription.benefits.sectionTitle') || 'Tous vos avantages'}
                </Text>
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <Animated.View
                      key={index}
                      entering={FadeIn.delay(200 + index * 100)}
                      style={[styles.benefitCard, { 
                        backgroundColor: theme.colors.backgroundSecondary,
                        borderColor: theme.colors.accent + '20',
                      }]}
                    >
                      <View style={[styles.benefitIconContainer, { backgroundColor: theme.colors.accent + '20' }]}>
                        <IconComponent size={24} color={theme.colors.accent} />
                      </View>
                      <View style={styles.benefitContent}>
                        <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                          {benefit.title}
                        </Text>
                        <Text style={[styles.benefitDescription, { color: theme.colors.textSecondary }]}>
                          {benefit.description}
                        </Text>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Message de clôture */}
              <View style={[styles.closingCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Gift size={20} color={theme.colors.accent} />
                <Text style={[styles.closingText, { color: theme.colors.textSecondary }]}>
                  {t('subscription.benefits.closing') ||
                    'Merci de faire partie de cette initiative qui combine technologie et solidarité. Votre contribution fait une réelle différence.'}
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    maxHeight: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  crownContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  zakaatCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
  },
  zakaatHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  zakaatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zakaatHeaderText: {
    flex: 1,
    gap: 8,
  },
  zakaatTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  zakaatBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  zakaatBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 1,
  },
  zakaatText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'System',
  },
  benefitsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
  },
  benefitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
    gap: 4,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'System',
  },
  closingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  closingText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
});
