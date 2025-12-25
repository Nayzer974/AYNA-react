// Service Supabase pour l'authentification et la base de données
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../config';
import { logger } from '../utils/logger';

const supabaseUrl = APP_CONFIG.supabaseUrl || '';
const supabaseAnonKey = APP_CONFIG.supabaseAnonKey || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Supabase n'est pas configuré
}

// CRITICAL: Configurer Supabase avec AsyncStorage pour React Native
// Cela garantit que les sessions sont stockées et récupérées correctement
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Pas de détection d'URL en React Native
      },
    })
  : null;

// ⚠️ SÉCURITÉ : Cette fonction a été supprimée pour des raisons de sécurité
// La vérification admin doit se faire uniquement côté serveur via la fonction RPC check_user_is_admin
// Ne jamais vérifier le statut admin côté client avec des emails hardcodés

// Fonctions d'authentification avec Supabase
// NOUVEAU SYSTÈME : Utilise Brevo SMTP configuré dans Supabase Dashboard
export async function signUpWithSupabase(
  email: string, 
  password: string, 
  name?: string, 
  gender?: string, 
  avatarId?: string
) {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  // Deep link vers l'app pour le callback après vérification
  // Supabase redirigera vers ce deep link après vérification de l'email
  const emailRedirectTo = 'ayna://auth/callback';

  logger.log('[signUpWithSupabase] Inscription en cours...');
  // Ne jamais logger l'email directement
  logger.log('[signUpWithSupabase] Email redirect to:', emailRedirectTo);
  logger.log('[signUpWithSupabase] Options:', {
    emailRedirectTo: emailRedirectTo,
    data: {
      // Ne jamais logger name, email directement
      hasName: !!name,
      hasGender: !!gender,
      hasAvatarId: !!avatarId,
    },
  });

  logger.log('[signUpWithSupabase] Appel supabase.auth.signUp()...');
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password,
    options: {
      emailRedirectTo: emailRedirectTo,
      data: {
        name: name || email.split('@')[0],
        gender: gender || null,
        avatar_id: avatarId || null,
      },
    },
  });

  console.log('[signUpWithSupabase] Réponse reçue');
  console.log('[signUpWithSupabase] Error:', error);
  console.log('[signUpWithSupabase] Data:', data ? {
    hasUser: !!data.user,
    hasSession: !!data.session,
    userId: data.user?.id,
    userEmail: data.user?.email,
    emailConfirmed: !!data.user?.email_confirmed_at,
  } : null);

  if (error) {
    logger.secureError('[signUpWithSupabase] Erreur lors de l\'inscription', error);
    
    // Gestion des erreurs spécifiques
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('already registered') || 
        errorMessage.includes('user already exists') ||
        errorMessage.includes('email already')) {
      throw new Error('Cet email est déjà utilisé. Veuillez utiliser un autre email ou vous connecter.');
    }
    
    if (errorMessage.includes('invalid email')) {
      throw new Error('L\'email n\'est pas valide. Veuillez vérifier votre adresse email.');
    }
    
    if (errorMessage.includes('password')) {
      throw new Error('Le mot de passe ne respecte pas les critères requis.');
    }
    
    // Erreur générique
    throw new Error(error.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
  }

  logger.log('[signUpWithSupabase] Inscription réussie');
  logger.log('[signUpWithSupabase] User créé:', !!data?.user);
  logger.log('[signUpWithSupabase] Session:', !!data?.session);
  logger.log('[signUpWithSupabase] Email vérifié:', !!data?.user?.email_confirmed_at);

  // Retourner les données (peut ne pas avoir de session si email non vérifié)
  return data;
}

export async function signInWithSupabase(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  // ⚠️ SÉCURITÉ : La logique de bypass admin a été supprimée
  // L'administration doit se faire uniquement via Supabase Dashboard
  // ou via des fonctions RPC sécurisées côté serveur

  console.log('[signInWithSupabase] Attempting sign in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // LOGS DEBUG: Vérifier la session après signInWithPassword
  if (data?.session) {
    console.log('[signInWithSupabase] ✅ Session created:', {
      userId: data.session.user.id,
      hasToken: !!data.session.access_token,
      tokenLength: data.session.access_token?.length || 0,
    });
  } else {
    console.warn('[signInWithSupabase] ⚠️ No session in signIn response');
  }

  // Permettre la connexion même si l'email n'est pas vérifié
  if (error) {
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Si l'erreur est "Email not confirmed", on essaie de contourner en récupérant l'utilisateur
    if (errorMessage.includes('email not confirmed') || 
        errorMessage.includes('email_not_confirmed') ||
        error.code === 'email_not_confirmed') {
      
      // Essayer de récupérer l'utilisateur directement par email
      // Note: Cette méthode nécessite que la vérification d'email soit désactivée dans Supabase
      // Si elle est toujours activée, il faut la désactiver dans Authentication > Settings
      
      // Essayer de récupérer une session existante
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session && sessionData.session.user.email === email) {
        return { user: sessionData.session.user, session: sessionData.session };
      }
      
      // Si pas de session, essayer de récupérer l'utilisateur
      // Cela fonctionnera si la vérification d'email est désactivée dans Supabase
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user && userData.user.email === email) {
        // Créer une session manuelle (nécessite que la vérification soit désactivée)
        // Si cela ne fonctionne pas, l'utilisateur devra vérifier son email
        return { user: userData.user, session: null };
      }
      
      // Si on ne peut pas récupérer l'utilisateur, lancer une erreur plus claire
      throw new Error('Votre email n\'a pas été vérifié. Veuillez vérifier votre boîte mail ou contacter le support. Si vous venez de créer votre compte, attendez quelques instants et réessayez.');
    }
    
    throw error;
  }
  return data;
}

export async function signOutWithSupabase() {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Vérifier si l'utilisateur actuel est admin
// ✅ SÉCURISÉ : Vérification uniquement via la table profiles côté serveur
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const user = await getCurrentUser();
  if (!user) return false;

  try {
    // ✅ Vérifier via la fonction RPC sécurisée côté serveur
    const { data, error } = await supabase.rpc('check_user_is_admin', {
      p_user_id: user.id
    });

    if (error) {
      console.error('[Security] Erreur lors de la vérification admin:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('[Security] Erreur lors de la vérification admin:', error);
    return false;
  }
}

// Connexion avec Google OAuth
export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  // ✅ PRODUCTION: en React Native, la redirection OAuth doit pointer vers le deep link de l'app
  // IMPORTANT: Configurer cette URL dans Supabase Dashboard > Authentication > URL Configuration
  const redirectTo = 'ayna://auth/callback';

  // Obtenir l'URL d'authentification OAuth
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      // En React Native, on doit ouvrir l'URL manuellement
      // skipBrowserRedirect: true permet de récupérer l'URL sans l'ouvrir automatiquement
      skipBrowserRedirect: true,
    }
  });

  if (error) {
    console.error('[Google OAuth] Erreur:', error);
    throw error;
  }

  // Si on a une URL, l'ouvrir avec Linking (React Native)
  if (data?.url) {
    const { Linking } = require('react-native');
    
    try {
      console.log('[Google OAuth] Ouverture de l\'URL:', data.url);
      
      // Vérifier que l'URL peut être ouverte
      const canOpen = await Linking.canOpenURL(data.url);
      
      if (!canOpen) {
        throw new Error('Impossible d\'ouvrir l\'URL d\'authentification. Vérifiez que le navigateur est disponible.');
      }
      
      // Ouvrir l'URL dans le navigateur
      // Après l'authentification Google, l'utilisateur sera redirigé vers redirectTo (deep link)
      // Supabase détectera automatiquement la redirection et créera la session
      await Linking.openURL(data.url);
      
      console.log('[Google OAuth] URL ouverte avec succès. Attente de la redirection...');
      
      // Retourner les données (l'URL a été ouverte)
      // La session sera créée automatiquement quand l'utilisateur reviendra via le deep link
      // et onAuthStateChange dans UserContext détectera la connexion
  return data;
    } catch (linkError: any) {
      console.error('[Google OAuth] Erreur lors de l\'ouverture:', linkError);
      throw new Error(`Erreur lors de l'ouverture du navigateur: ${linkError.message || 'Erreur inconnue'}`);
    }
  }

  throw new Error('Aucune URL d\'authentification retournée par Supabase');
}

// Vérifier le statut de bannissement de l'utilisateur actuel
export async function checkUserBanStatus(): Promise<{
  isBanned: boolean;
  expiresAt?: string;
  reason?: string;
} | null> {
  if (!supabase) {
    return null;
  }

  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { isBanned: false };
    }

    // Vérifier dans user_bans
    const { data: banData, error: banError } = await supabase
      .from('user_bans')
      .select('*')
      .eq('user_id', user.id)
      .order('banned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (banError) {
      // Si la table n'existe pas, retourner non banni
      if (banError.message?.includes('does not exist') || banError.code === '42P01') {
        return { isBanned: false };
      }
      // Erreur silencieuse en production
      return { isBanned: false };
    }

    if (!banData) {
      return { isBanned: false };
    }

    // Vérifier si le bannissement est expiré (pour les bannissements temporaires)
    if (banData.ban_type === 'temporary' && banData.expires_at) {
      const expiresAt = new Date(banData.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        // Le bannissement est expiré
        return { isBanned: false };
      }
      return {
        isBanned: true,
        expiresAt: banData.expires_at,
        reason: banData.reason || undefined,
      };
    }

    // Bannissement permanent
    if (banData.ban_type === 'permanent') {
      return {
        isBanned: true,
        reason: banData.reason || undefined,
      };
    }

    return { isBanned: false };
  } catch (error) {
    // Erreur silencieuse en production
    return { isBanned: false };
  }
}

