/**
 * Service d'authentification Apple
 * Utilise expo-apple-authentication pour iOS
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from '@/services/auth/supabase';

/**
 * VÃ©rifie si l'authentification Apple est disponible
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
export async function signInWithApple(): Promise<{ user: any; session: any } | null> {
  try {
    // VÃ©rifier la disponibilitÃ©
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
      throw new Error('Token d\'identitÃ© Apple manquant');
    }

    // Connexion avec Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      // L'utilisateur a annulÃ©
      return null;
    }
    // Erreur silencieuse en production
    throw error;
  }
}

/**
 * Inscription avec Apple
 */
export async function signUpWithApple(): Promise<{ user: any; session: any } | null> {
  // L'inscription et la connexion utilisent la mÃªme mÃ©thode avec Apple
  return signInWithApple();
}



