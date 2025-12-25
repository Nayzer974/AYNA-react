import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './src/i18n'; // Initialiser i18n
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text, AppState, AppStateStatus, Linking } from 'react-native';
import { UserProvider, useUser } from './src/contexts/UserContext';
import { QuranProvider } from './src/contexts/QuranContext';
import { PreferencesProvider } from './src/contexts/PreferencesContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { getTheme } from './src/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAutoSync } from './src/hooks/useAutoSync';
import { useNotificationScheduler } from './src/hooks/useNotificationScheduler';
import { I18nextProvider } from 'react-i18next';
import i18n, { initializeRTL } from './src/i18n';
import { useNavigationContainerRef } from '@react-navigation/native';
import { supabase } from './src/services/supabase';
import { ConsentScreen, hasConsentChoiceBeenMade } from './src/pages/ConsentScreen';
import { analytics } from './src/analytics';
import { usePreferences } from './src/contexts/PreferencesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSubscriptionStatus } from './src/services/subscription';
import { PremiumThankYouModal } from './src/components/PremiumThankYouModal';
import { logger } from './src/utils/logger';
import { initializeNotifications } from './src/services/expoNotifications';

function AppContent() {
  const { user, isLoading } = useUser();
  const { preferences } = usePreferences();
  const theme = getTheme(user?.theme || 'default');
  const navigationRef = useNavigationContainerRef();
  const [showConsentScreen, setShowConsentScreen] = React.useState<boolean | null>(null);
  const [isCheckingConsent, setIsCheckingConsent] = React.useState(true);
  const [showPremiumThankYou, setShowPremiumThankYou] = React.useState(false);
  
  // Initialiser RTL au démarrage
  useEffect(() => {
    initializeRTL().catch(console.error);
  }, []);

  // Initialiser les notifications au démarrage
  useEffect(() => {
    initializeNotifications().catch(console.error);
  }, []);

  // Vérifier le consentement analytics au démarrage
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const choiceMade = await hasConsentChoiceBeenMade();
        
        if (!choiceMade) {
          // Aucun choix n'a été fait - afficher l'écran de consentement
          setShowConsentScreen(true);
          // CRITICAL: Ensure analytics is disabled until consent
          analytics.setConsent(false);
        } else {
          // Choix déjà fait - utiliser la préférence
          const consent = preferences.analyticsConsent ?? false;
          // CRITICAL: Set consent in analytics system
          analytics.setConsent(consent);
          setShowConsentScreen(false);
        }
      } catch (error) {
        console.error('[App] Error checking consent:', error);
        // En cas d'erreur, afficher l'écran de consentement par sécurité
        setShowConsentScreen(true);
        // Ensure analytics is disabled on error
        analytics.setConsent(false);
      } finally {
        setIsCheckingConsent(false);
      }
    };

    // Attendre que les préférences soient chargées
    if (!isLoading) {
      checkConsent();
    }
  }, [isLoading, preferences]);

  // Initialiser analytics (sans consentement - sera activé après choix)
  useEffect(() => {
    analytics.initialize().catch(error => {
      if (__DEV__) {
        console.error('[App] Analytics initialization failed:', error);
      }
    });
  }, []);

  // Activer la synchronisation automatique offline/online
  useAutoSync();

  // Replanifier les notifications intelligentes
  useNotificationScheduler();

  // ✅ Show thank-you screen once after user becomes subscribed (first app open after subscription)
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;

    const key = `@ayna_premium_thankyou_shown_${user.id}`;

    const check = async () => {
      try {
        const alreadyShown = await AsyncStorage.getItem(key);
        if (alreadyShown === '1') return;

        const status = await getSubscriptionStatus();
        if (cancelled) return;
        if (status.isActive) {
          setShowPremiumThankYou(true);
        }
      } catch {
        // ignore
      }
    };

    // check once after auth/user is available
    const timer = setTimeout(check, 800);

    // also check when app becomes active (webhook might have updated)
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        check();
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      sub.remove();
    };
  }, [user?.id]);

  // Gestion du deep link pour le callback de vérification d'email
  useEffect(() => {
    if (!supabase) return;

    // Écouter les deep links entrants
    const handleDeepLink = async (url: string) => {
      logger.info('App', 'Deep link reçu:', url);
      
      // Vérifier si c'est le callback de vérification d'email
      if (url.startsWith('ayna://auth/callback')) {
        logger.info('App', 'Callback de vérification d\'email détecté');
        
        try {
          // Extraire les paramètres de l'URL manuellement
          const urlObj = new URL(url.replace('ayna://', 'https://'));
          const queryParams: Record<string, string> = {};
          urlObj.searchParams.forEach((value, key) => {
            queryParams[key] = value;
          });
          
          logger.info('App', 'Paramètres du callback:', queryParams);
          
          // Vérifier si on a un token_hash ou token
          if (queryParams?.token_hash || queryParams?.token) {
            logger.info('App', 'Token trouvé, vérification de l\'email...');
            
            // Vérifier l'email avec Supabase
            if (!supabase) return;
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: queryParams.token_hash as string,
              type: (queryParams.type_hash as any) || 'signup',
            });

            if (error) {
              logger.error('[App] Erreur lors de la vérification:', error);
              // Rediriger vers l'écran de vérification avec une erreur
              if (navigationRef.isReady()) {
                navigationRef.navigate('VerifyEmail' as never, {
                  error: error.message || 'Erreur lors de la vérification de l\'email',
                } as never);
              }
              return;
            }

            logger.info('App', 'Email vérifié avec succès');
            
            // Rediriger vers l'accueil
            if (navigationRef.isReady()) {
              navigationRef.reset({
                index: 0,
                routes: [{ name: 'Main' as never }],
              });
            }
          } else {
            logger.warn('[App] Aucun token trouvé dans le callback');
          }
        } catch (error: any) {
          logger.error('[App] Erreur lors du traitement du deep link:', error);
        }
        return;
      }

      // Vérifier si c'est une invitation à une session privée
      if (url.startsWith('ayna://dhikr/invite/')) {
        logger.info('App', 'Invitation à une session privée détectée');
        
        try {
          // Parser l'URL : ayna://dhikr/invite/SESSION_ID?token=TOKEN
          const match = url.match(/ayna:\/\/dhikr\/invite\/([^?]+)\?token=([^&]+)/);
          
          if (match && match[1] && match[2]) {
            const sessionId = match[1];
            const token = match[2];
            
            logger.info('App', 'Session ID:', sessionId);
            logger.info('App', 'Token:', token);
            
            // Naviguer vers DairatAnNur avec les paramètres d'invitation
            if (navigationRef.isReady()) {
              navigationRef.navigate('DairatAnNur' as never, {
                inviteSessionId: sessionId,
                inviteToken: token,
              } as never);
            }
          } else {
            logger.warn('[App] Format d\'URL d\'invitation invalide:', url);
          }
        } catch (error: any) {
          logger.error('[App] Erreur lors du traitement de l\'invitation:', error);
        }
        return;
      }
    };

    // Écouter les deep links quand l'app est déjà ouverte
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Vérifier si l'app a été ouverte via un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Écouter les changements d'état d'authentification Supabase
    // (pour gérer les callbacks même si le deep link n'est pas capturé)
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('App', 'Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session) {
        // Si l'utilisateur vient de se connecter (après vérification d'email)
        // et qu'on est sur l'écran VerifyEmail, rediriger vers l'accueil
        if (navigationRef.isReady() && session.user.email_confirmed_at) {
          // Attendre un peu pour que le contexte utilisateur soit mis à jour
          setTimeout(() => {
            navigationRef.reset({
              index: 0,
              routes: [{ name: 'Main' as never }],
            });
          }, 500);
        }
      }
    });

    return () => {
      subscription.remove();
      authSubscription.unsubscribe();
    };
  }, [navigationRef]);

  // Notifications supprimées - plus de nettoyage nécessaire

  // Notifications de prière supprimées - plus de système de notifications

  // Afficher un écran de chargement pendant l'initialisation
  if (isLoading || isCheckingConsent) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Afficher l'écran de consentement si nécessaire
  if (showConsentScreen === true) {
    return (
      <>
        <StatusBar style="light" />
        <ConsentScreen
          onConsentChoice={async (consented: boolean) => {
            setShowConsentScreen(false);
            // Analytics est déjà activé/désactivé dans ConsentScreen
          }}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator ref={navigationRef} />

      <PremiumThankYouModal
        visible={showPremiumThankYou}
        onClose={async () => {
          try {
            if (user?.id) {
              await AsyncStorage.setItem(`@ayna_premium_thankyou_shown_${user.id}`, '1');
            }
          } catch {
            // ignore
          }
          setShowPremiumThankYou(false);
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <I18nextProvider i18n={i18n}>
      <UserProvider>
        <PreferencesProvider>
          <QuranProvider>
            <AppContent />
          </QuranProvider>
        </PreferencesProvider>
      </UserProvider>
    </I18nextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'System',
  },
});
