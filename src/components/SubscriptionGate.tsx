/**
 * SubscriptionGate Component
 * 
 * Protects AI features behind subscription check
 * 
 * RULES:
 * - Shows "This feature requires an active account" if no subscription
 * - Shows "Activate my account" button (opens web checkout)
 * - No pricing, no payment language
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { Linking } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { getSubscriptionStatus, getSubscriptionStatusWithSession, requestActivationLink, requestActivationLinkWithSession } from '@/services/system/subscription';
import { useTranslation } from 'react-i18next';
import { useSessionRestored } from '@/hooks/useSessionRestored';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { user } = useUser();
  const navigation = useNavigation();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // CRITICAL: Utiliser le hook pour gérer la restauration de session
  const { session, loading: sessionLoading, error: sessionError } = useSessionRestored();
  const appState = useRef(AppState.currentState);
  const lastCheckTime = useRef<number>(0);
  
  // ✅ ÉTAPE 4 : Timeout de sécurité pour loading initial
  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      if (loading) {
        setLoading(false); // Forcer la fin du chargement après 5 secondes
      }
    }, 5000);
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Détecter quand l'app revient au premier plan (après retour de Stripe)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[SubscriptionGate] App has come to the foreground - checking subscription status');
        // Vérifier le statut quand l'app revient au premier plan
        // (l'utilisateur peut revenir de Stripe)
        if (session && Date.now() - lastCheckTime.current > 2000) {
          lastCheckTime.current = Date.now();
          checkStatusWithSession(session);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [session]);

  // Vérifier le statut quand l'écran revient au focus (navigation)
  useFocusEffect(
    React.useCallback(() => {
      console.log('[SubscriptionGate] Screen focused - checking subscription status');
      if (session && Date.now() - lastCheckTime.current > 2000) {
        lastCheckTime.current = Date.now();
        checkStatusWithSession(session);
      }
    }, [session])
  );

  // Vérifier le statut quand la session est disponible ET que l'utilisateur est connecté
  useEffect(() => {
    // Ne rien faire tant que la session est en cours de restauration
    if (sessionLoading) {
      console.log('[SubscriptionGate] Waiting for session to be restored...');
      return;
    }

    if (sessionError) {
      console.error('[SubscriptionGate] Session error:', sessionError);
      setError('Session error. Please log in again.');
      setLoading(false);
      setIsActive(false);
      return;
    }

    if (!user?.id) {
      setLoading(false);
      setIsActive(false);
      setError('Please log in to check your subscription status.');
      return;
    }

    // Si la session est disponible, vérifier le statut
    if (session) {
      console.log('[SubscriptionGate] Session available, checking subscription status');
      console.log('[SubscriptionGate] Session details:', {
        userId: session.user.id,
        email: session.user.email,
        hasToken: !!session.access_token,
        tokenLength: session.access_token?.length || 0,
      });
      
      // Vérifier le statut immédiatement
      checkStatusWithSession(session);
      
      // Vérifier à nouveau après 2 secondes (pour laisser le temps au webhook de s'exécuter)
      setTimeout(() => {
        console.log('[SubscriptionGate] Re-checking subscription status after delay (webhook may have updated)');
        checkStatusWithSession(session);
      }, 2000);
      
      // Vérifier à nouveau après 5 secondes (au cas où le webhook prend plus de temps)
      setTimeout(() => {
        console.log('[SubscriptionGate] Final subscription status check');
        checkStatusWithSession(session);
      }, 5000);
      
      checkPendingActivation();
    } else {
      // Pas de session = utilisateur non connecté via Supabase Auth
      console.log('[SubscriptionGate] No session available');
      console.log('[SubscriptionGate] User ID from UserContext:', user?.id);
      console.log('[SubscriptionGate] This means user is logged in via UserContext but not via Supabase Auth');
      console.log('[SubscriptionGate] User must log in again to create a Supabase session');
      setLoading(false);
      setIsActive(false);
      setError('Session expired. Please log in again to activate your account.');
      
      // Rediriger automatiquement vers Login après 2 secondes
      setTimeout(() => {
        try {
          navigation.navigate('Login' as never);
        } catch (navError) {
          console.error('[SubscriptionGate] Navigation error:', navError);
        }
      }, 2000);
    }
  }, [user?.id, session, sessionLoading, sessionError]);

  const checkPendingActivation = async () => {
    try {
      const { storage } = await import('@/utils/storage');
      const pending = await storage.getItem('pending_subscription_activation');
      
      if (pending === 'true') {
        // Supprimer le flag
        await storage.removeItem('pending_subscription_activation');
        
        // Attendre un peu pour que la session soit bien établie
        setTimeout(() => {
          handleActivate();
        }, 1000);
      }
    } catch (error) {
      console.error('[SubscriptionGate] Error checking pending activation:', error);
    }
  };

  const checkStatusWithSession = async (currentSession: any) => {
    if (!currentSession?.access_token) {
      console.error('[SubscriptionGate] No access token in session');
      setError('No access token available. Please log in again.');
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setLoading(false);
      setIsActive(false);
      return;
    }

    try {
      setError(null);
      const status = await getSubscriptionStatusWithSession(currentSession);
      setIsActive(status.isActive);
      setError(null);
    } catch (err: any) {
      // ✅ ÉTAPE 4 : Logger toutes les erreurs en DEV
      if (__DEV__) {
        console.error('[SubscriptionGate] Error checking subscription:', err);
      }
      setError(err.message || 'Failed to check subscription status');
      setIsActive(false);
    } finally {
      // ✅ ÉTAPE 4 : FINALLY GARANTI - Toujours désactiver loading
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!session) {
      console.warn('[SubscriptionGate] No session available for checkStatus');
      return;
    }
    await checkStatusWithSession(session);
  };

  const handleActivate = async () => {
    // CRITICAL: Ne pas appeler si la session est en cours de restauration
    if (sessionLoading || loading) {
      console.warn('[SubscriptionGate] Session not restored yet, please wait...');
      setError('Please wait, session is being restored...');
      return;
    }

    // Si l'utilisateur n'est pas connecté, stocker l'intention et rediriger vers Login
    if (!user?.id) {
      try {
        // Stocker l'intention d'activer l'abonnement pour après la connexion
        const { storage } = await import('@/utils/storage');
        await storage.setItem('pending_subscription_activation', 'true');
        
        navigation.navigate('Login' as never);
      } catch (navError) {
        console.error('[SubscriptionGate] Navigation error:', navError);
        setError('Please log in to activate your account.');
      }
      return;
    }

    // Vérifier que la session est disponible
    if (!session?.access_token) {
      console.error('[SubscriptionGate] No access token available');
      console.error('[SubscriptionGate] Session state:', {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        sessionLoading,
        loading,
      });
      setError('Session expired. Please log in again.');
      setTimeout(() => {
        navigation.navigate('Login' as never);
      }, 2000);
      return;
    }

    // LOGS DEBUG: État de la session au moment du clic
    console.log('[SubscriptionGate] [DEBUG] Activate button clicked');
    console.log('[SubscriptionGate] [DEBUG] Session state:', {
      userId: session.user.id,
      email: session.user.email,
      hasToken: !!session.access_token,
      tokenLength: session.access_token?.length || 0,
      tokenPreview: session.access_token?.substring(0, 20) + '...',
    });

    try {
      setError(null);
      console.log('[SubscriptionGate] [DEBUG] Calling requestActivationLinkWithSession...');
      const checkoutUrl = await requestActivationLinkWithSession(session);
      
      console.log('[SubscriptionGate] [DEBUG] Checkout URL received:', checkoutUrl?.substring(0, 50) + '...');
      
      if (!checkoutUrl) {
        setError('No activation link received. Please check server configuration.');
        return;
      }
      
      const canOpen = await Linking.canOpenURL(checkoutUrl);
      
      if (canOpen) {
        await Linking.openURL(checkoutUrl);
        // Re-check status after a delay (user might complete checkout)
        setTimeout(() => {
          checkStatus();
        }, 3000);
      } else {
        setError('Cannot open activation link. Please check your browser settings.');
      }
    } catch (err: any) {
      console.error('[SubscriptionGate] Error requesting activation link:', err);
      
      // Messages d'erreur plus clairs
      let errorMessage = err.message || 'Failed to create activation link';
      
      if (errorMessage.includes('Server error')) {
        errorMessage = 'Server configuration error. Please contact support or try again later.';
      } else if (errorMessage.includes('Edge Function')) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('must be logged in')) {
        // Si erreur d'authentification, rediriger vers Login
        try {
          navigation.navigate('Login' as never);
        } catch (navError) {
          console.error('[SubscriptionGate] Navigation error:', navError);
          errorMessage = 'Please log in to activate your account.';
        }
      }
      
      setError(errorMessage);
    }
  };

  // Afficher un loader si la session est en cours de restauration OU si on vérifie le statut
  if (sessionLoading || loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {sessionLoading ? 'Restoring session...' : 'Checking subscription...'}
        </Text>
        {sessionError && (
          <Text style={[styles.errorText, { color: '#ef4444', marginTop: 10 }]}>
            {sessionError.message}
          </Text>
        )}
      </View>
    );
  }

  if (!isActive) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.messageCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.messageTitle, { color: theme.colors.text }]}>
            {t('subscription.required') || 'This feature requires an active account.'}
          </Text>
          
          {error && (
            <Text style={[styles.errorText, { color: '#ef4444' }]}>
              {error}
            </Text>
          )}

          <Pressable
            onPress={handleActivate}
            disabled={sessionLoading || loading || !session?.access_token}
            style={[
              styles.activateButton, 
              { 
                backgroundColor: (sessionLoading || loading || !session?.access_token) 
                  ? theme.colors.textSecondary 
                  : theme.colors.accent,
                opacity: (sessionLoading || loading || !session?.access_token) ? 0.5 : 1,
              }
            ]}
          >
            <Text style={[styles.activateButtonText, { color: theme.colors.background }]}>
              {sessionLoading || loading 
                ? (t('subscription.loading') || 'Please wait...')
                : (t('subscription.activate') || 'Activate my account')
              }
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  messageCard: {
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  activateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'System',
  },
});

