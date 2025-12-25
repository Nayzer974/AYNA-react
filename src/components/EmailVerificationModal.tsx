import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { X, Mail, CheckCircle } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { supabase } from '@/services/supabase';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

interface EmailVerificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EmailVerificationModal({ visible, onClose }: EmailVerificationModalProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);

  const handleResendEmail = async () => {
    if (!user?.email) return;

    try {
      setSending(true);
      
      // Utiliser le service dédié pour la vérification d'email
      const { sendVerificationEmail } = await import('@/services/emailVerification');
      const result = await sendVerificationEmail(user.email, 'signup');

      if (!result.success) {
        Alert.alert(
          t('common.error'),
          result.error || t('emailVerification.sendFailed')
        );
        return;
      }

      Alert.alert(
        t('emailVerification.emailSent') || 'Email envoyé',
        t('emailVerification.emailSentMessage') || 
        'Un email de vérification a été envoyé. Veuillez vérifier votre boîte mail.'
      );
    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('emailVerification.sendFailed')
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.modal, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <LinearGradient
            colors={[theme.colors.backgroundSecondary, theme.colors.background]}
            style={StyleSheet.absoluteFill}
          />
          
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
          >
            <X size={24} color={theme.colors.text} />
          </Pressable>

          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent + '20' }]}>
              <Mail size={48} color={theme.colors.accent} />
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('emailVerification.title')}
            </Text>

            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
              {t('emailVerification.message', { email: user?.email || '' })}
            </Text>

            <View style={styles.buttonContainer}>
              <Pressable
                onPress={handleResendEmail}
                disabled={sending}
                style={({ pressed }) => [
                  styles.resendButton,
                  { 
                    backgroundColor: theme.colors.accent,
                    opacity: sending ? 0.6 : pressed ? 0.8 : 1
                  }
                ]}
              >
                <Text style={[styles.resendButtonText, { color: theme.colors.background }]}>
                  {sending ? t('emailVerification.sending') : t('emailVerification.resend')}
                </Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButtonText,
                  { 
                    opacity: pressed ? 0.6 : 1
                  }
                ]}
              >
                <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>
                  {t('common.cancel')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  resendButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButtonText: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
  },
});

