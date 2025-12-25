import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button } from '@/components/ui';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { APP_CONFIG } from '@/config';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics';
import { changePasswordWithToken } from '@/services/passwordChange';

/**
 * Page ChangePassword
 * Permet à l'utilisateur de changer son mot de passe après avoir cliqué sur le lien de confirmation
 */
export function ChangePassword() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  useEffect(() => {
    trackPageView('ChangePassword');
  }, []);

  // Récupérer le token depuis les paramètres de route ou de l'URL
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le token depuis les paramètres de route
    const routeParams = route.params as any;
    if (routeParams?.token) {
      setToken(routeParams.token);
    } else {
      // Essayer de récupérer depuis l'URL si c'est un deep link
      // Le token sera passé via le deep link ayna://auth/change-password?token=...
      setError('Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.');
    }
  }, [route]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins une majuscule';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins une minuscule';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins un chiffre';
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!token) {
      setError('Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.');
      return;
    }

    if (!password.trim()) {
      setError(t('changePassword.error.passwordRequired') || 'Le mot de passe est requis');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('changePassword.error.passwordsDontMatch') || 'Les mots de passe ne correspondent pas');
      return;
    }

    if (!APP_CONFIG.useSupabase || !supabase) {
      setError(t('changePassword.error.supabaseOnly') || 'La réinitialisation de mot de passe n\'est disponible qu\'avec Supabase');
      return;
    }

    try {
      setLoading(true);

      // Utiliser le service pour changer le mot de passe
      const result = await changePasswordWithToken(token, password);

      if (!result.success) {
        setError(result.error || t('changePassword.error.changeFailed') || 'Erreur lors du changement de mot de passe');
        trackEvent('password_change_failed', { error: result.error });
        return;
      }

      // Déconnecter l'utilisateur après le changement de mot de passe
      await supabase.auth.signOut();

      trackEvent('password_change_success');

      Alert.alert(
        t('common.success'),
        t('changePassword.success') || 'Votre mot de passe a été changé avec succès. Veuillez vous reconnecter avec votre nouveau mot de passe.',
        [
          {
            text: t('common.ok'),
            onPress: () => {
              navigation.navigate('Login' as never);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error);
      setError(error.message || t('changePassword.error.changeFailed') || 'Erreur lors du changement de mot de passe');
      trackEvent('password_change_failed', { error: error.message });
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
              <Lock size={64} color={theme.colors.accent} />
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('changePassword.title') || 'Changer votre mot de passe'}
            </Text>

            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('changePassword.subtitle') || 'Entrez votre nouveau mot de passe ci-dessous.'}
            </Text>

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }]}>
                <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Input
                  label={t('changePassword.newPassword') || 'Nouveau mot de passe'}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('changePassword.passwordPlaceholder') || 'Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre'}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={<Lock size={20} color={theme.colors.textSecondary} />}
                  rightIcon={
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff size={20} color={theme.colors.textSecondary} />
                      ) : (
                        <Eye size={20} color={theme.colors.textSecondary} />
                      )}
                    </Pressable>
                  }
                  containerStyle={styles.inputContainer}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Input
                  label={t('changePassword.confirmPassword') || 'Confirmer le mot de passe'}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('changePassword.confirmPasswordPlaceholder') || 'Répétez votre nouveau mot de passe'}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={<Lock size={20} color={theme.colors.textSecondary} />}
                  rightIcon={
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? (
                        <EyeOff size={20} color={theme.colors.textSecondary} />
                      ) : (
                        <Eye size={20} color={theme.colors.textSecondary} />
                      )}
                    </Pressable>
                  }
                  containerStyle={styles.inputContainer}
                />
              </View>

              <Button
                variant="default"
                onPress={handleSubmit}
                disabled={loading || !password.trim() || !confirmPassword.trim()}
                loading={loading}
                style={styles.submitButton}
              >
                {loading ? (t('common.loading') || 'Changement...') : (t('changePassword.changeButton') || 'Changer le mot de passe')}
              </Button>
            </View>

            <View style={styles.infoBox}>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {t('changePassword.info') || 'Votre mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.'}
              </Text>
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
    marginBottom: 24,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    marginBottom: 0,
  },
  inputContainer: {
    marginBottom: 0,
  },
  submitButton: {
    width: '100%',
    marginTop: 8,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'System',
    textAlign: 'center',
    lineHeight: 20,
  },
});





