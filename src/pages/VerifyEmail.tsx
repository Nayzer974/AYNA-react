/**
 * Écran "Vérifie ton email"
 * 
 * S'affiche après l'inscription pour informer l'utilisateur
 * qu'un email de vérification a été envoyé.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { Button } from '@/components/ui';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/services/auth/supabase';

type VerifyEmailRouteParams = {
  email?: string;
};

export function VerifyEmail() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: VerifyEmailRouteParams }>>();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  const email = route.params?.email || user?.email || '';
  const [isChecking, setIsChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Vérifier périodiquement si l'email a été vérifié
  useEffect(() => {
    if (!email || isVerified) return;

    const checkEmailVerification = async () => {
      try {
        if (!supabase) return;

        const { data: { user: currentUser }, error } = await supabase.auth.getUser();

        if (!error && currentUser?.email_confirmed_at) {
          setIsVerified(true);
          // Attendre 2 secondes puis rediriger vers l'accueil
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' as never }],
            });
          }, 2000);
        }
      } catch (error) {
        // Erreur silencieuse
      }
    };

    // Vérifier immédiatement
    checkEmailVerification();

    // Vérifier toutes les 5 secondes
    const interval = setInterval(checkEmailVerification, 5000);

    return () => clearInterval(interval);
  }, [email, isVerified, navigation]);

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.error.emailRequired'));
      return;
    }

    if (!supabase) {
      Alert.alert(t('common.error'), t('settings.supabaseNotConfigured'));
      return;
    }

    try {
      setIsChecking(true);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'https://nurayna.com/auth/callback',
        },
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        t('auth.emailSent') || 'Email envoyé',
        t('auth.emailSentMessage') || 'Un nouvel email de vérification a été envoyé. Vérifiez votre boîte mail.'
      );
    } catch (error: any) {
      const errorMessage = error?.message || t('auth.error.sendEmailFailed');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsChecking(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />

      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {isVerified ? (
            <>
              <CheckCircle size={80} color="#10B981" style={styles.icon} />
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {t('auth.emailVerified') || 'Email vérifié !'}
              </Text>
              <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                {t('auth.emailVerifiedMessage') || 'Votre email a été vérifié avec succès. Redirection en cours...'}
              </Text>
            </>
          ) : (
            <>
              <Mail size={80} color={theme.colors.accent} style={styles.icon} />
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {t('auth.verifyEmail') || 'Vérifie ton email'}
              </Text>
              <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                {t('auth.verifyEmailMessage') || 'Nous avons envoyé un email de vérification à :'}
              </Text>
              <Text style={[styles.email, { color: theme.colors.accent }]}>
                {email}
              </Text>
              <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>
                {t('auth.verifyEmailInstructions') || 'Cliquez sur le lien dans l\'email pour vérifier votre compte. Une fois vérifié, vous serez automatiquement connecté.'}
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  variant="default"
                  onPress={handleResendEmail}
                  disabled={isChecking}
                  loading={isChecking}
                  style={styles.button}
                >
                  {isChecking ? (
                    <>
                      <RefreshCw size={16} color="#0A0F2C" style={styles.buttonIcon} />
                      {t('auth.sending') || 'Envoi en cours...'}
                    </>
                  ) : (
                    <>
                      <Mail size={16} color="#0A0F2C" style={styles.buttonIcon} />
                      {t('auth.resendEmail') || 'Renvoyer l\'email'}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onPress={handleGoToLogin}
                  style={styles.button}
                >
                  {t('auth.backToLogin') || 'Retour à la connexion'}
                </Button>
              </View>
            </>
          )}
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructions: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

