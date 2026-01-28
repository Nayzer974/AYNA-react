/**
 * GiftCodeModal Component
 * 
 * Modal pour entrer et valider un code cadeau
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Gift, Check, AlertCircle } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { useTranslation } from 'react-i18next';
import { useSessionRestored } from '@/hooks/useSessionRestored';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { redeemGiftCode } from '@/services/system/giftCode';
import { sendActivationThankYouEmail } from '@/services/auth/activationEmail';
import Animated, { FadeIn, FadeOut, BounceIn } from 'react-native-reanimated';

interface GiftCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GiftCodeModal({ visible, onClose, onSuccess }: GiftCodeModalProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t, i18n } = useTranslation();
  const { session } = useSessionRestored();
  const insets = useSafeAreaInsets();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError(t('giftCode.errorEmpty') || 'Veuillez entrer un code');
      return;
    }

    if (!session?.access_token) {
      setError(t('giftCode.errorSession') || 'Session expirée. Veuillez vous reconnecter.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      const result = await redeemGiftCode(code, session);

      if (result.success) {
        setSuccess(true);
        // Utiliser le message retourné par le serveur
        setSuccessMessage(result.message || t('giftCode.successGeneric') || 'Abonnement activé !');
        
        // Envoyer l'email de remerciement (en arrière-plan, ne pas bloquer)
        if (session?.user?.email) {
          sendActivationThankYouEmail({
            email: session.user.email,
            name: user?.name || undefined,
            activationDate: new Date().toISOString(),
            expirationDate: result.subscription_expires_at || null,
            subscriptionType: 'gift_code',
            codeType: result.code_type,
            language: (i18n.language as 'fr' | 'en' | 'ar') || 'fr',
          }, session).catch((err) => {
            console.log('[GiftCodeModal] Failed to send thank you email:', err);
          });
        }
        
        // Appeler onSuccess après un délai pour montrer le message
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 2500);
      } else {
        // Traduire le message d'erreur ou utiliser celui du serveur
        const errorKey = `giftCode.error${result.error}`;
        const translatedError = t(errorKey);
        // Si la traduction est la même que la clé, utiliser le message du serveur
        setError(translatedError !== errorKey ? translatedError : result.message);
      }
    } catch (err: any) {
      console.error('[GiftCodeModal] Error:', err);
      setError(t('giftCode.errorGeneric') || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    setSuccess(false);
    setSuccessMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[
            styles.overlay,
            {
              paddingTop: insets.top + 40,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={[styles.modal, { backgroundColor: theme.colors.backgroundSecondary }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconWrapper, { backgroundColor: theme.colors.accent + '20' }]}>
                <Gift size={28} color={theme.colors.accent} />
              </View>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <X size={22} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('giftCode.title') || 'Code cadeau'}
            </Text>
            
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('giftCode.subtitle') || 'Entrez votre code cadeau pour activer votre abonnement premium'}
            </Text>

            {/* Success State */}
            {success ? (
              <Animated.View 
                entering={BounceIn.duration(400)}
                style={styles.successContainer}
              >
                <View style={[styles.successIcon, { backgroundColor: '#22c55e20' }]}>
                  <Check size={40} color="#22c55e" />
                </View>
                <Text style={[styles.successText, { color: '#22c55e' }]}>
                  {successMessage}
                </Text>
              </Animated.View>
            ) : (
              <>
                {/* Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: error ? '#ef4444' : theme.colors.textSecondary + '30',
                      },
                    ]}
                    placeholder={t('giftCode.placeholder') || 'XXXX-XXXX-XXXX'}
                    placeholderTextColor={theme.colors.textSecondary + '80'}
                    value={code}
                    onChangeText={(text) => {
                      setCode(text.toUpperCase());
                      setError(null);
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={20}
                    editable={!loading}
                  />
                </View>

                {/* Error */}
                {error && (
                  <Animated.View 
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={styles.errorContainer}
                  >
                    <AlertCircle size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                )}

                {/* Button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={loading || !code.trim()}
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: (loading || !code.trim())
                        ? theme.colors.textSecondary
                        : theme.colors.accent,
                      opacity: (loading || !code.trim()) ? 0.5 : 1,
                    },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.background} />
                  ) : (
                    <Text style={[styles.submitButtonText, { color: theme.colors.background }]}>
                      {t('giftCode.submit') || 'Valider le code'}
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
    marginTop: -4,
    marginRight: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: 'center',
    letterSpacing: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
});

