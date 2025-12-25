/**
 * Service d'authentification Apple
 * Utilise expo-apple-authentication pour iOS
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Vérifie si l'authentification Apple est disponible
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    // Erreur silencieuse en production
    return false;
  }
}

/**
 * Connexion avec Apple
 */
export async function signInWithApple(): Promise<{ user: User; session: Session } | null> {
  try {
    // Vérifier la disponibilité
    const available = await isAppleAuthAvailable();
    if (!available) {
      throw new Error('Apple Authentication n\'est pas disponible sur cet appareil');
    }

    // Lancer l'authentification Apple
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Token d\'identité Apple manquant');
    }

    // Connexion avec Supabase
    if (!supabase) throw new Error('Supabase n\'est pas configuré');
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
      // L'utilisateur a annulé
      return null;
    }
    // Erreur silencieuse en production
    throw error;
  }
}

/**
 * Inscription avec Apple
 */
export async function signUpWithApple(): Promise<{ user: User; session: Session } | null> {
  // L'inscription et la connexion utilisent la même méthode avec Apple
  return signInWithApple();
}


