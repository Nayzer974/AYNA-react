/**
 * PaywallModal Component
 * 
 * Modal affichée quand l'utilisateur non abonné atteint la limite de messages
 * (5 messages toutes les 5 heures)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Linking, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { X, Sparkles } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { useTranslation } from 'react-i18next';
import { requestActivationLinkWithSession } from '@/services/subscription';
import { useSessionRestored } from '@/hooks/useSessionRestored';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  resetAt: Date | null;
  messagesUsed: number;
  mode?: 'rateLimit' | 'subscription';
}

export function PaywallModal({ visible, onClose, resetAt, messagesUsed, mode = 'rateLimit' }: PaywallModalProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const { session } = useSessionRestored();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    if (!session?.access_token) {
      setError(t('subscription.sessionExpired') || 'Session expired. Please log in again.');
      setTimeout(() => {
        navigation.navigate('Login' as never);
      }, 2000);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const checkoutUrl = await requestActivationLinkWithSession(session);
      
      if (!checkoutUrl) {
        setError(t('subscription.noActivationLink') || 'No activation link received.');
        return;
      }
      
      const canOpen = await Linking.canOpenURL(checkoutUrl);
      
      if (canOpen) {
        await Linking.openURL(checkoutUrl);
        onClose(); // Fermer le modal après ouverture de Stripe
      } else {
        setError(t('subscription.cannotOpenLink') || 'Cannot open activation link.');
      }
    } catch (err: any) {
      console.error('[PaywallModal] Error requesting activation link:', err);
      setError(err.message || t('subscription.error') || 'Failed to create activation link');
    } finally {
      setLoading(false);
    }
  };

  const formatResetTime = (date: Date | null): string => {
    if (!date) return '';
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) {
      return t('rateLimit.now') || 'maintenant';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return t('rateLimit.inHours', { hours, minutes: minutes > 0 ? ` ${minutes}min` : '' }) || `dans ${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } else {
      return t('rateLimit.inMinutes', { minutes }) || `dans ${minutes}min`;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: 24 + (insets.top || 0),
            paddingBottom: 24 + Math.max(insets.bottom || 0, 12),
          },
        ]}
      >
        <Animated.View 
          style={[styles.modal, { backgroundColor: theme.colors.backgroundSecondary }]}
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.duration(200)}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Content (scrollable) */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.accent + '20' }]}>
              <Sparkles size={32} color={theme.colors.accent} />
            </View>
            
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {mode === 'subscription'
                ? (t('subscription.required') || 'Cette fonctionnalité nécessite un compte actif.')
                : (t('rateLimit.limitReached') || 'Limite de messages atteinte')}
            </Text>

            {mode === 'rateLimit' ? (
              <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                {t('rateLimit.message', { 
                  messagesUsed, 
                  resetTime: formatResetTime(resetAt) 
                }) || `Vous avez utilisé ${messagesUsed} messages gratuits. Vous pourrez à nouveau utiliser le chat ${formatResetTime(resetAt)}.`}
              </Text>
            ) : (
              <>
                <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                  {t('subscription.requiredMessage') ||
                    'Cette fonctionnalité nécessite un compte actif. Pour accéder au chat IA et à l’ensemble des fonctionnalités avancées, veuillez activer votre compte dès maintenant.'}
                </Text>

                <View
                  style={[
                    styles.zakaatCallout,
                    {
                      borderColor: theme.colors.accent + '55',
                      backgroundColor: theme.colors.accent + '12',
                    },
                  ]}
                >
                  <Text style={[styles.zakaatText, { color: theme.colors.textSecondary }]}>
                    {t('subscription.zakaatMessage') ||
                      'L’abonnement AYNA Premium est à la fois un accès complet aux outils IA et un acte de solidarité. Une partie de votre abonnement est reversée à des associations humanitaires dans le cadre de la Zakaat, afin de soutenir les plus démunis. En activant votre compte, vous débloquez toutes les fonctionnalités premium (analyses avancées, accès illimité, etc.) tout en contribuant à un projet fondé sur le partage, l’entraide et la bienveillance.'}
                  </Text>
                  <View style={styles.zakaatBadgeRow}>
                    <View style={[styles.zakaatBadge, { backgroundColor: theme.colors.accent }]}>
                      <Text style={[styles.zakaatBadgeText, { color: theme.colors.background }]}>
                        Zakaat
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            <View style={[styles.divider, { backgroundColor: theme.colors.textSecondary + '20' }]} />

            <Text style={[styles.subtitle, { color: theme.colors.text }]}>
              {t('rateLimit.upgradeTitle') || 'Activez votre compte pour un accès illimité'}
            </Text>

            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {t('rateLimit.upgradeDescription') || 'Profitez d\'un accès illimité au chat IA, aux analyses avancées et à toutes les fonctionnalités premium.'}
            </Text>

            {/* Section Carte Cadeau */}
            <View
              style={[
                styles.giftCardSection,
                {
                  borderColor: theme.colors.accent + '40',
                  backgroundColor: theme.colors.accent + '10',
                },
              ]}
            >
              <Text style={[styles.giftCardTitle, { color: theme.colors.text }]}>
                {t('subscription.giftCard.title') || '💳 Carte cadeau ou code promo'}
              </Text>
              <Text style={[styles.giftCardText, { color: theme.colors.textSecondary }]}>
                {t('subscription.giftCard.description') || 'Vous avez une carte cadeau ou un code promotionnel ? Vous pourrez l\'appliquer directement sur la page de paiement.'}
              </Text>
            </View>

            {error && (
              <Text style={[styles.errorText, { color: '#ef4444' }]}>
                {error}
              </Text>
            )}
            {/* Padding to ensure content isn't hidden behind sticky button */}
            <View style={styles.scrollBottomSpacer} />
          </ScrollView>

          {/* Sticky footer button */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: theme.colors.textSecondary + '15',
                paddingBottom: 12 + (insets.bottom || 0),
              },
            ]}
          >
            <Pressable
              onPress={handleActivate}
              disabled={loading || !session?.access_token}
              style={[
                styles.activateButton,
                {
                  backgroundColor: (loading || !session?.access_token)
                    ? theme.colors.textSecondary
                    : theme.colors.accent,
                  opacity: (loading || !session?.access_token) ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[styles.activateButtonText, { color: theme.colors.background }]}>
                {loading
                  ? (t('subscription.loading') || 'Chargement...')
                  : (t('subscription.activate') || 'Activer mon compte')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 12,
    height: '88%',
    maxHeight: '94%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  contentContainer: {
    paddingBottom: 0,
  },
  scrollBottomSpacer: {
    height: 12,
  },
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'System',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    fontFamily: 'System',
  },
  zakaatCallout: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 6,
  },
  zakaatText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'System',
    textAlign: 'left',
  },
  zakaatBadgeRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  zakaatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  zakaatBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: 'System',
  },
  divider: {
    height: 1,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 4,
    fontFamily: 'System',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    fontFamily: 'System',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  activateButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  activateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  giftCardSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  giftCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'System',
  },
  giftCardText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'System',
  },
});

