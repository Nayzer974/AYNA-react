/**
 * Hook: useSessionRestored
 * 
 * Gère la restauration de session Supabase depuis AsyncStorage
 * 
 * RULES:
 * - Attend que la session soit restaurée avant de permettre les appels API
 * - Met à jour automatiquement via onAuthStateChange
 * - Retourne loading: true tant que la session n'est pas prête
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/services/auth/supabase';
import type { Session } from '@supabase/supabase-js';

interface UseSessionRestoredResult {
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export function useSessionRestored(): UseSessionRestoredResult {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!supabase) {
      console.warn('[useSessionRestored] Supabase not configured');
      setLoading(false);
      return;
    }

    let mounted = true;
    let sessionRestored = false;

    // 1. Récupérer la session initiale (restauration depuis AsyncStorage)
    const initSession = async () => {
      try {
        console.log('[useSessionRestored] Initializing session from AsyncStorage...');
        
        // DEBUG: Vérifier AsyncStorage directement
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const supabaseAuthToken = await AsyncStorage.getItem('supabase.auth.token');
        console.log('[useSessionRestored] [DEBUG] AsyncStorage supabase.auth.token:', !!supabaseAuthToken);
        
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[useSessionRestored] Error getting session:', sessionError);
          if (mounted) {
            setError(new Error(sessionError.message));
            setLoading(false);
          }
          return;
        }
        
        console.log('[useSessionRestored] Initial session restored:', !!initialSession);
        if (initialSession) {
          console.log('[useSessionRestored] Session user ID:', initialSession.user.id);
          console.log('[useSessionRestored] Session access token present:', !!initialSession.access_token);
          console.log('[useSessionRestored] Session access token length:', initialSession.access_token?.length || 0);
        } else {
          console.warn('[useSessionRestored] ⚠️ No session found in AsyncStorage');
          // Essayer getUser() pour voir si l'utilisateur est connecté mais sans session
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            console.warn('[useSessionRestored] ⚠️ User exists but no session:', userData.user.id);
            console.warn('[useSessionRestored] ⚠️ This means the user needs to log in again');
          } else {
            console.warn('[useSessionRestored] ⚠️ No user found in Supabase Auth');
            console.warn('[useSessionRestored] ⚠️ User may be logged in via UserContext but not via Supabase Auth');
          }
        }
        
        if (mounted) {
          setSession(initialSession);
          setLoading(false);
          sessionRestored = true;
        }
      } catch (err: any) {
        console.error('[useSessionRestored] Error initializing session:', err);
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    initSession();

    // 2. Écouter les changements de session (SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT, INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[useSessionRestored] Auth state change:', event, 'Session:', !!newSession);
      
      if (mounted) {
        setSession(newSession);
        
        // Si c'est INITIAL_SESSION ou SIGNED_IN, la session est prête
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (newSession) {
            console.log('[useSessionRestored] Session ready:', {
              userId: newSession.user.id,
              email: newSession.user.email,
              hasToken: !!newSession.access_token,
              tokenLength: newSession.access_token?.length || 0,
            });
          }
          setLoading(false);
          sessionRestored = true;
        } else if (event === 'SIGNED_OUT') {
          console.log('[useSessionRestored] User signed out');
          setSession(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          console.log('[useSessionRestored] Token refreshed');
          setSession(newSession);
          // La session est déjà prête, pas besoin de changer loading
        }
      }
    });

    // 3. Timeout de sécurité : si la session n'est pas restaurée après 5 secondes
    const timeout = setTimeout(() => {
      if (!sessionRestored && mounted) {
        console.warn('[useSessionRestored] Session not restored after 5 seconds');
        setLoading(false);
        // Ne pas mettre d'erreur, juste indiquer que la session n'est pas disponible
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    loading,
    error,
  };
}

