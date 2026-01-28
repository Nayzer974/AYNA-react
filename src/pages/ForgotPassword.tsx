import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button } from '@/components/ui';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/services/auth/supabase';
import { APP_CONFIG } from '@/config';
import { requestPasswordChange } from '@/services/auth/passwordChange';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';

/**
 * Page ForgotPassword
 * 
 * Permet à l'utilisateur de réinitialiser son mot de passe
 */
export function ForgotPassword() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  useEffect(() => {
    trackPageView('ForgotPassword');
  }, []);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('forgotPassword.error.emailRequired'));
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('auth.error.invalidEmail'));
      return;
    }

    if (!APP_CONFIG.useSupabase || !supabase) {
      Alert.alert(t('common.error'), t('forgotPassword.error.supabaseNotConfigured'));
      return;
    }

    try {
      setLoading(true);
      
      // Utiliser le service de changement de mot de passe avec Brevo
      const result = await requestPasswordChange(
        email.trim(),
        undefined,
        undefined,
        'forgot'
      );

      if (!result.success) {
        throw new Error(result.error || t('forgotPassword.error.sendFailed'));
      }

      setSent(true);
      Alert.alert(
        t('forgotPassword.emailSent'),
        t('forgotPassword.emailSentMessage')
      );
      trackEvent('password_reset_requested', { email });
    } catch (error: any) {
      // Erreur silencieuse en production
      Alert.alert(
        t('common.error'),
        error.message || t('forgotPassword.error.sendFailed')
      );
      trackEvent('password_reset_failed', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
      
      <SafeAreaView 
        style={styles.container}
        edges={['top', 'bottom']}
      >
        <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </Pressable>

          <View style={styles.iconContainer}>
            <Mail size={64} color={theme.colors.accent} />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('forgotPassword.title')}
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('forgotPassword.subtitle')}
          </Text>

          {sent ? (
            <View style={styles.successContainer}>
              <Text style={[styles.successText, { color: theme.colors.accent }]}>
                ✅ {t('forgotPassword.emailSent')}
              </Text>
              <Text style={[styles.successSubtext, { color: theme.colors.textSecondary }]}>
                {t('forgotPassword.checkInbox')}
              </Text>
            </View>
          ) : (
            <View style={styles.form}>
              <Input
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Mail size={20} color={theme.colors.textSecondary} />}
                containerStyle={styles.inputContainer}
              />

              <Button
                variant="default"
                onPress={handleReset}
                disabled={loading}
                loading={loading}
                style={styles.resetButton}
              >
                {loading ? t('forgotPassword.sending') : t('forgotPassword.sendLink')}
              </Button>
            </View>
          )}

          <Pressable
            onPress={() => navigation.navigate('Login' as never)}
            style={styles.loginLink}
          >
            <Text style={[styles.loginLinkText, { color: theme.colors.accent }]}>
              {t('forgotPassword.backToLogin')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    marginBottom: 24,
    padding: 8,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 0,
  },
  resetButton: {
    width: '100%',
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginLink: {
    marginTop: 24,
    alignSelf: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
});

