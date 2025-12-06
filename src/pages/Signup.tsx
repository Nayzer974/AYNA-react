import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { APP_CONFIG } from '@/config';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { getAvatarsByGender, type Avatar } from '@/data/avatars';
import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics';

/**
 * Page d'inscription
 * 
 * Permet à l'utilisateur de :
 * - Créer un compte avec email/mot de passe
 * - Choisir un pseudo (optionnel)
 * - Choisir un genre (homme/femme)
 * - S'inscrire avec Google (si Supabase configuré)
 */
export function Signup() {
  const navigation = useNavigation();
  const { user, register, loginWithGoogle } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Obtenir les avatars disponibles selon le genre
  const availableAvatars = getAvatarsByGender(gender);
  
  // Track page view
  React.useEffect(() => {
    trackPageView('Signup');
  }, []);

  // Réinitialiser l'avatar sélectionné quand le genre change
  React.useEffect(() => {
    setSelectedAvatarId(null);
  }, [gender]);

  const handleSubmit = async () => {
    setError(null);

    if (!email || !password) {
      setError(t('auth.error.emailPasswordRequired'));
      return;
    }

    // Validation du mot de passe
    if (password.length < 8) {
      setError(t('auth.error.passwordMinLength'));
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('auth.error.invalidEmail'));
      return;
    }

    try {
      setLoading(true);
      if (register) {
        await register(
          name || email.split('@')[0],
          email,
          password,
          gender,
          selectedAvatarId || undefined
        );
        trackEvent('signup_success', { method: 'email', hasAvatar: !!selectedAvatarId });
        // La navigation sera gérée automatiquement par le contexte
        // navigation.navigate('Main');
      }
    } catch (err: any) {
      const errorMsg = err?.message || t('auth.error.signupFailed');
      setError(errorMsg);
      trackEvent('signup_failed', { error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      setGoogleLoading(true);
      if (loginWithGoogle) {
        await loginWithGoogle();
        trackEvent('signup_success', { method: 'google' });
        // La redirection sera gérée par Supabase OAuth
      }
    } catch (err: any) {
      const errorMsg = err?.message || t('auth.error.googleLoginFailed');
      setError(errorMsg);
      trackEvent('signup_failed', { method: 'google', error: errorMsg });
      setGoogleLoading(false);
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
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('auth.signup')}
          </Text>

          <View style={styles.form}>
            <Input
              label={t('auth.usernameOptional')}
              value={name}
              onChangeText={setName}
              placeholder={t('auth.usernamePlaceholder')}
              containerStyle={styles.inputContainer}
            />

            <View style={styles.genderContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('auth.gender')}
              </Text>
              <View style={styles.genderRow}>
                <Pressable
                  onPress={() => setGender('male')}
                  style={[
                    styles.genderOption,
                    gender === 'male' && {
                      backgroundColor: theme.colors.accent,
                      borderColor: theme.colors.accent,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radio,
                      gender === 'male' && styles.radioSelected,
                    ]}
                  >
                    {gender === 'male' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.genderText,
                      { color: gender === 'male' ? '#0A0F2C' : theme.colors.text },
                    ]}
                  >
                    {t('auth.genderMale')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setGender('female')}
                  style={[
                    styles.genderOption,
                    gender === 'female' && {
                      backgroundColor: theme.colors.accent,
                      borderColor: theme.colors.accent,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radio,
                      gender === 'female' && styles.radioSelected,
                    ]}
                  >
                    {gender === 'female' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.genderText,
                      { color: gender === 'female' ? '#0A0F2C' : theme.colors.text },
                    ]}
                  >
                    {t('auth.genderFemale')}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Sélection d'avatar */}
            <View style={styles.avatarContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('auth.chooseAvatar')}
              </Text>
              <View style={styles.avatarWrapper}>
                {availableAvatars.map((avatar) => (
                  <Pressable
                    key={avatar.id}
                    onPress={() => setSelectedAvatarId(avatar.id)}
                    style={[
                      styles.avatarOption,
                      {
                        borderColor: selectedAvatarId === avatar.id 
                          ? theme.colors.accent 
                          : 'rgba(255, 255, 255, 0.2)',
                        backgroundColor: selectedAvatarId === avatar.id
                          ? theme.colors.accent + '33'
                          : 'rgba(255, 255, 255, 0.05)',
                      },
                    ]}
                  >
                    <Image 
                      source={avatar.image} 
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                    {selectedAvatarId === avatar.id && (
                      <View style={[styles.avatarCheck, { backgroundColor: theme.colors.accent }]}>
                        <Text style={styles.avatarCheckText}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

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
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('auth.password')}
              </Text>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.passwordPlaceholder')}
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
                {loading ? t('auth.signingUp') : t('auth.createAccount')}
              </Button>

              <Button
                variant="outline"
                onPress={() => navigation.navigate('Login' as never)}
                style={styles.button}
              >
                {t('auth.login')}
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
  label: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 8,
  },
  genderContainer: {
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#0A0F2C',
    backgroundColor: '#0A0F2C',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFA500',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
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
  },
  avatarContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  avatarWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    width: '100%',
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  avatarCheck: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0F2C',
  },
  avatarCheckText: {
    color: '#0A0F2C',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

