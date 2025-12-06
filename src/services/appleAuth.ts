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
    console.error('Erreur lors de la vérification de disponibilité Apple Auth:', error);
    return false;
  }
}

/**
 * Connexion avec Apple
 */
export async function signInWithApple(): Promise<{ user: any; session: any } | null> {
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
      // L'utilisateur a annulé
      return null;
    }
    console.error('Erreur lors de la connexion avec Apple:', error);
    throw error;
  }
}

/**
 * Inscription avec Apple
 */
export async function signUpWithApple(): Promise<{ user: any; session: any } | null> {
  // L'inscription et la connexion utilisent la même méthode avec Apple
  return signInWithApple();
}


