import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordInput, Button } from '@/components/ui';
import { Lock, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/services/auth/supabase';
import { APP_CONFIG } from '@/config';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import { isValidPassword } from '@/utils/validation';
import { useRateLimit, RATE_LIMIT_CONFIGS } from '@/utils/rateLimiter';
import { logPasswordResetSuccess, logRateLimitExceeded } from '@/services/analytics/securityLogger';

/**
 * Page ResetPassword
 * Permet à l'utilisateur de réinitialiser son mot de passe après avoir reçu un lien par email
 */
export function ResetPassword() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  useEffect(() => {
    trackPageView('ResetPassword');
  }, []);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [checkingToken, setCheckingToken] = useState(true);

  // Vérifier le token de réinitialisation
  useEffect(() => {
    if (!APP_CONFIG.useSupabase || !supabase) {
      setError(t('resetPassword.error.supabaseOnly'));
      setCheckingToken(false);
      setIsValidToken(false);
      return;
    }

    // Écouter les changements d'état d'authentification pour détecter PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Auth state change
      
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidToken(true);
        setCheckingToken(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Si on a une session après un événement de récupération, c'est valide
        setIsValidToken(true);
        setCheckingToken(false);
      } else if (!session && event !== 'PASSWORD_RECOVERY') {
        // Pas de session et pas d'événement de récupération
        setIsValidToken(false);
        setCheckingToken(false);
        setError(t('resetPassword.error.noToken'));
      }
    });

    // Vérifier la session actuelle
    const checkInitialState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Si l'utilisateur a une session, vérifier si c'est une session de récupération
        // En React Native, on peut vérifier via les paramètres de route ou deep links
        setIsValidToken(true);
      } else {
        // Pas de session, attendre l'événement PASSWORD_RECOVERY
        // En React Native, le deep link devrait déclencher cet événement
        setTimeout(() => {
          if (checkingToken) {
            setIsValidToken(false);
            setError(t('resetPassword.error.noToken'));
          }
          setCheckingToken(false);
        }, 2000);
      }
    };

    checkInitialState();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ✅ SÉCURITÉ : Rate limiting pour la réinitialisation de mot de passe
  const { isAllowed: isResetAllowed, getWaitTime } = useRateLimit(
    'password_reset_attempts',
    RATE_LIMIT_CONFIGS.passwordReset
  );

  const handleSubmit = async () => {
    setError(null);

    // ✅ SÉCURITÉ : Validations avec fonctions sécurisées
    if (!password) {
      return setError(t('resetPassword.error.passwordRequired'));
    }

    // ✅ SÉCURITÉ : Validation du mot de passe avec fonction sécurisée
    if (!isValidPassword(password)) {
      return setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.');
    }

    if (password !== confirmPassword) {
      return setError(t('resetPassword.error.passwordsDontMatch'));
    }

    // ✅ SÉCURITÉ : Rate limiting
    if (!isResetAllowed()) {
      const waitTime = getWaitTime();
      const waitMinutes = Math.ceil(waitTime / 1000 / 60);
      setError(`Trop de tentatives. Veuillez réessayer dans ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''}.`);
      // ✅ SÉCURITÉ : Logger le dépassement de rate limit
      await logRateLimitExceeded('password_reset');
      return;
    }

    if (!APP_CONFIG.useSupabase || !supabase) {
      return setError(t('resetPassword.error.supabaseOnly'));
    }

    try {
      setLoading(true);

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Déconnecter l'utilisateur après la mise à jour du mot de passe
      await supabase.auth.signOut();

      // ✅ SÉCURITÉ : Logger la réinitialisation réussie
      await logPasswordResetSuccess();
      
      Alert.alert(
        t('common.success'),
        t('resetPassword.success.passwordReset'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              trackEvent('password_reset_success');
              navigation.navigate('Login' as never);
            },
          },
        ]
      );
    } catch (err: any) {
      // Erreur silencieuse en production
      const errorMsg = err?.message || t('resetPassword.error.resetFailed');
      setError(errorMsg);
      trackEvent('password_reset_failed', { error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Afficher un loader pendant la vérification du token
  if (checkingToken) {
    return (
      <View style={styles.wrapper}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.backgroundSecondary]}
          style={StyleSheet.absoluteFill}
        />
        <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              {t('resetPassword.checkingToken')}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Si le token n'est pas valide, afficher un message d'erreur
  if (isValidToken === false) {
    return (
      <View style={styles.wrapper}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.backgroundSecondary]}
          style={StyleSheet.absoluteFill}
        />
        <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={[styles.errorCard, { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)' }]}>
                <Text style={[styles.errorTitle, { color: '#ef4444' }]}>
                  {t('resetPassword.error.invalidLink')}
                </Text>
                <Text style={[styles.errorText, { color: '#fca5a5' }]}>
                  {error || t('resetPassword.error.linkExpired')}
                </Text>
              </View>
              <Button
                variant="default"
                onPress={() => navigation.navigate('ForgotPassword' as never)}
                style={styles.button}
              >
                {t('resetPassword.requestNewLink')}
              </Button>
              <Button
                variant="outline"
                onPress={() => navigation.navigate('Login' as never)}
                style={styles.button}
              >
                {t('forgotPassword.backToLogin')}
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Formulaire de réinitialisation
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
      
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
              <Lock size={64} color={theme.colors.accent} />
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('resetPassword.title')}
            </Text>

            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('resetPassword.subtitle')}
            </Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('resetPassword.newPassword')}
                  containerStyle={styles.inputContainer}
                />
                <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                  {t('resetPassword.minLength')}
                </Text>
              </View>

              <PasswordInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('auth.confirmPassword')}
                containerStyle={styles.inputContainer}
              />

              {error && (
                <View style={[styles.errorCard, { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)' }]}>
                  <Text style={[styles.errorText, { color: '#ef4444' }]}>
                    {error}
                  </Text>
                </View>
              )}

              <Button
                variant="default"
                onPress={handleSubmit}
                disabled={loading}
                loading={loading}
                style={styles.submitButton}
              >
                {loading ? t('resetPassword.resetting') : t('resetPassword.resetButton')}
              </Button>

              <Button
                variant="outline"
                onPress={() => navigation.navigate('Login' as never)}
                style={styles.cancelButton}
              >
                {t('common.cancel')}
              </Button>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'System',
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
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 0,
  },
  inputContainer: {
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 4,
    marginLeft: 4,
  },
  errorCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  submitButton: {
    width: '100%',
    marginTop: 8,
  },
  cancelButton: {
    width: '100%',
  },
  button: {
    width: '100%',
    marginBottom: 12,
  },
});


