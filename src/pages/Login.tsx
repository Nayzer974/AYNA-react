import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { APP_CONFIG } from '@/config';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics';

/**
 * Page de connexion
 * 
 * Permet à l'utilisateur de :
 * - Se connecter avec email/mot de passe
 * - Se connecter avec Google (si Supabase configuré)
 * - Aller vers la page d'inscription
 * - Réinitialiser son mot de passe
 */
export function Login() {
  const navigation = useNavigation();
  const { user, login, loginWithGoogle, loginWithApple } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  // Navigation automatique après connexion réussie
  useEffect(() => {
    trackPageView('Login');
  }, []);

  useEffect(() => {
    if (user?.id) {
      // Naviguer vers la page principale après connexion
      navigation.navigate('Main' as never);
    }
  }, [user?.id, navigation]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    
    if (!email || !password) {
      setError(t('auth.error.emailPasswordRequired'));
      return;
    }

    if (!login) {
      setError(t('auth.error.loginFunctionUnavailable'));
      return;
    }

    try {
      setLoading(true);
      console.log('Tentative de connexion avec:', email);
      await login(email, password);
      console.log('Connexion réussie, user.id:', user?.id);
      trackEvent('login_success', { method: 'email' });
      // La navigation sera gérée automatiquement par useEffect quand user.id sera défini
    } catch (err: any) {
      // Ne pas afficher l'erreur si elle concerne juste la récupération des données utilisateur
      // L'authentification a réussi
      const errorMessage = err?.message || err?.error?.message || t('auth.error.loginFailed');
      if (!errorMessage.includes('Aucun utilisateur retourné') && !errorMessage.includes('utilisateur retourné')) {
        setError(errorMessage);
        Alert.alert(t('auth.error.loginError'), errorMessage);
        trackEvent('login_failed', { error: errorMessage });
        console.error('Erreur de connexion:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!loginWithApple) {
      Alert.alert(t('common.error'), t('auth.error.appleUnavailable'));
      return;
    }

    setError(null);
    setAppleLoading(true);

    try {
      await loginWithApple();
      trackEvent('login_success', { method: 'apple' });
      // La navigation se fera automatiquement via useEffect
    } catch (err: any) {
      if (err.message && !err.message.includes('annulé')) {
        const errorMsg = err.message || t('auth.error.appleLoginFailed');
        setError(errorMsg);
        trackEvent('login_failed', { method: 'apple', error: errorMsg });
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      setGoogleLoading(true);
      if (loginWithGoogle) {
        await loginWithGoogle();
        trackEvent('login_success', { method: 'google' });
        // La redirection sera gérée par Supabase OAuth
      }
    } catch (err: any) {
      const errorMsg = err?.message || t('auth.error.googleLoginFailed');
      setError(errorMsg);
      trackEvent('login_failed', { method: 'google', error: errorMsg });
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
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
          {/* Bouton retour vers l'accueil */}
          <Pressable
            onPress={() => navigation.navigate('Main' as never)}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color={theme.colors.text} />
            <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
              {t('common.back')}
            </Text>
          </Pressable>
          
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('auth.login')}
          </Text>

          <View style={styles.form}>
            <Input
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.inputContainer}
            />

            <View style={styles.inputContainer}>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.password')}
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <Button
                variant="default"
                onPress={handleSubmit}
                disabled={loading}
                loading={loading}
                style={styles.button}
              >
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </Button>

              <Button
                variant="outline"
                onPress={() => navigation.navigate('Signup' as never)}
                style={styles.button}
              >
                {t('auth.signup')}
              </Button>
            </View>

            {APP_CONFIG.useSupabase && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
                    {t('auth.or')}
                  </Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  variant="secondary"
                  onPress={handleGoogleLogin}
                  disabled={googleLoading}
                  loading={googleLoading}
                  style={styles.googleButton}
                >
                  {googleLoading ? t('auth.loggingIn') : t('auth.signInWithGoogle')}
                </Button>
              </>
            )}

            <Pressable
              onPress={handleForgotPassword}
              style={styles.forgotButton}
            >
              <Text style={[styles.forgotText, { color: theme.colors.textSecondary }]}>
                {t('auth.forgotPassword')}
              </Text>
            </Pressable>
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
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 0,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: 'System',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontFamily: 'System',
  },
  googleButton: {
    width: '100%',
    marginBottom: 12,
  },
  appleButton: {
    width: '100%',
  },
  forgotButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
  forgotText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'System',
  },
});

