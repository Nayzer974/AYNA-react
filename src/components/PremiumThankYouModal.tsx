import React, { useCallback } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { X, HeartHandshake } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface PremiumThankYouModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PremiumThankYouModal({ visible, onClose }: PremiumThankYouModalProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

        <Animated.View
          entering={SlideInDown.duration(260)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}
        >
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: theme.colors.accent + '20' }]}>
              <HeartHandshake size={22} color={theme.colors.accent} />
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <X size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('subscription.thankYou.title') || 'Merci pour votre confiance 🤍'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('subscription.thankYou.subtitle') || 'Votre abonnement change plus que votre expérience.'}
            </Text>

            <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
              {t('subscription.thankYou.body') ||
                'Merci d’avoir activé AYNA Premium. Votre contribution de 7,99\u202f€ par mois ne débloque pas seulement des fonctionnalités avancées\u202f: elle soutient directement des actions humanitaires concrètes.\n\nUne partie de votre abonnement est reversée à des associations qui viennent en aide aux plus démunis. Grâce à vous, des familles reçoivent un soutien essentiel, des repas sont distribués, et des projets solidaires voient le jour.\n\nEn rejoignant AYNA Premium, vous améliorez votre expérience et vous participez à un mouvement de partage, de bienveillance et d’entraide. Votre geste compte. Votre geste aide. Votre geste change des vies.'}
            </Text>

            <Pressable
              onPress={handleClose}
              style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
            >
              <Text style={[styles.primaryButtonText, { color: theme.colors.background }]}>
                {t('common.continue') || 'Continuer'}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'left',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
    marginBottom: 14,
    lineHeight: 20,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});


