// Service Supabase pour l'authentification et la base de donnÃ©es
import { createClient } from '@supabase/supabase-js';
import { secureStorage } from '@/utils/secureStorage';
import { APP_CONFIG } from '@/config';
import { logger } from '@/utils/logger';

const supabaseUrl = APP_CONFIG.supabaseUrl || '';
const supabaseAnonKey = APP_CONFIG.supabaseAnonKey || '';

// SÉCURITÉ : Adaptateur pour utiliser SecureStore (chiffré) au lieu de AsyncStorage (non chiffré)
const SecureStoreAdapter = {
  getItem: (key: string) => secureStorage.getItem(key),
  setItem: (key: string, value: string) => secureStorage.setItem(key, value),
  removeItem: (key: string) => secureStorage.removeItem(key),
};

if (!supabaseUrl || !supabaseAnonKey) {
  // Supabase n'est pas configurÃ©
}

// CRITICAL: Configurer Supabase avec SecureStore pour React Native
// Cela garantit que les sessions sont stockées de manière chiffrée
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Activé pour faciliter la détection OAuth
    },
  })
  : null;

// âš ï¸ SÃ‰CURITÃ‰ : Cette fonction a Ã©tÃ© supprimÃ©e pour des raisons de sÃ©curitÃ©
// La vÃ©rification admin doit se faire uniquement cÃ´tÃ© serveur via la fonction RPC check_user_is_admin
// Ne jamais vÃ©rifier le statut admin cÃ´tÃ© client avec des emails hardcodÃ©s

// Fonctions d'authentification avec Supabase
// NOUVEAU SYSTÃˆME : Utilise Brevo SMTP configurÃ© dans Supabase Dashboard
export async function signUpWithSupabase(
  email: string,
  password: string,
  name?: string,
  gender?: string,
  avatarId?: string
) {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configurÃ©');
  }

  // URL de redirection vers le domaine officiel de l'app
  // Supabase redirigera vers ce lien après vérification de l'email
  const emailRedirectTo = 'https://nurayna.com/auth/callback';

  logger.log('[signUpWithSupabase] Inscription en cours...');
  // Ne jamais logger l'email directement
  logger.log('[signUpWithSupabase] Inscription en cours...');
  // Ne jamais logger l'email directement
  logger.log('[signUpWithSupabase] Email redirect to:', emailRedirectTo);

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

  console.log('[signUpWithSupabase] RÃ©ponse reÃ§ue');
  console.log('[signUpWithSupabase] Error:', error);
  // Logs data removed for security

  if (error) {
    logger.secureError('[signUpWithSupabase] Erreur lors de l\'inscription', error);

    // Gestion des erreurs spÃ©cifiques
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorMessage.includes('already registered') ||
      errorMessage.includes('user already exists') ||
      errorMessage.includes('email already')) {
      throw new Error('Cet email est dÃ©jÃ  utilisÃ©. Veuillez utiliser un autre email ou vous connecter.');
    }

    if (errorMessage.includes('invalid email')) {
      throw new Error('L\'email n\'est pas valide. Veuillez vÃ©rifier votre adresse email.');
    }

    if (errorMessage.includes('password')) {
      throw new Error('Le mot de passe ne respecte pas les critÃ¨res requis.');
    }

    // Erreur gÃ©nÃ©rique
    throw new Error(error.message || 'Erreur lors de l\'inscription. Veuillez rÃ©essayer.');
  }

  logger.log('[signUpWithSupabase] Inscription rÃ©ussie');
  logger.log('[signUpWithSupabase] User crÃ©Ã©:', !!data?.user);
  logger.log('[signUpWithSupabase] Session:', !!data?.session);
  logger.log('[signUpWithSupabase] Email vÃ©rifiÃ©:', !!data?.user?.email_confirmed_at);

  // Retourner les donnÃ©es (peut ne pas avoir de session si email non vÃ©rifiÃ©)
  return data;
}

export async function signInWithSupabase(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configurÃ©');
  }

  // âš ï¸ SÃ‰CURITÃ‰ : La logique de bypass admin a Ã©tÃ© supprimÃ©e
  // L'administration doit se faire uniquement via Supabase Dashboard
  // ou via des fonctions RPC sÃ©curisÃ©es cÃ´tÃ© serveur

  console.log('[signInWithSupabase] Attempting sign in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Permettre la connexion mÃªme si l'email n'est pas vÃ©rifiÃ©
  if (error) {
    const errorMessage = error.message?.toLowerCase() || '';

    // Si l'erreur est "Email not confirmed", on essaie de contourner en rÃ©cupÃ©rant l'utilisateur
    if (errorMessage.includes('email not confirmed') ||
      errorMessage.includes('email_not_confirmed') ||
      error.code === 'email_not_confirmed') {

      // Essayer de rÃ©cupÃ©rer l'utilisateur directement par email
      // Note: Cette mÃ©thode nÃ©cessite que la vÃ©rification d'email soit dÃ©sactivÃ©e dans Supabase
      // Si elle est toujours activÃ©e, il faut la dÃ©sactiver dans Authentication > Settings

      // Essayer de rÃ©cupÃ©rer une session existante
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session && sessionData.session.user.email === email) {
        return { user: sessionData.session.user, session: sessionData.session };
      }

      // Si pas de session, essayer de rÃ©cupÃ©rer l'utilisateur
      // Cela fonctionnera si la vÃ©rification d'email est dÃ©sactivÃ©e dans Supabase
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user && userData.user.email === email) {
        // CrÃ©er une session manuelle (nÃ©cessite que la vÃ©rification soit dÃ©sactivÃ©e)
        // Si cela ne fonctionne pas, l'utilisateur devra vÃ©rifier son email
        return { user: userData.user, session: null };
      }

      // Si on ne peut pas rÃ©cupÃ©rer l'utilisateur, lancer une erreur plus claire
      throw new Error('Votre email n\'a pas Ã©tÃ© vÃ©rifiÃ©. Veuillez vÃ©rifier votre boÃ®te mail ou contacter le support. Si vous venez de crÃ©er votre compte, attendez quelques instants et rÃ©essayez.');
    }

    throw error;
  }
  return data;
}

export async function signOutWithSupabase() {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configurÃ©');
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

// VÃ©rifier si l'utilisateur actuel est admin
// âœ… SÃ‰CURISÃ‰ : VÃ©rification uniquement via la table profiles cÃ´tÃ© serveur
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const user = await getCurrentUser();
  if (!user) return false;

  try {
    // âœ… VÃ©rifier via la fonction RPC sÃ©curisÃ©e cÃ´tÃ© serveur
    const { data, error } = await supabase.rpc('check_user_is_admin', {
      p_user_id: user.id
    });

    if (error) {
      console.error('[Security] Erreur lors de la vÃ©rification admin:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('[Security] Erreur lors de la vÃ©rification admin:', error);
    return false;
  }
}

// Connexion avec Google OAuth
export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configurÃ©');
  }

  // âœ… PRODUCTION: en React Native, la redirection OAuth doit pointer vers le deep link de l'app
  // IMPORTANT: Configurer cette URL dans Supabase Dashboard > Authentication > URL Configuration
  const redirectTo = 'https://nurayna.com/auth/callback';

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
      // skipBrowserRedirect: true permet de rÃ©cupÃ©rer l'URL sans l'ouvrir automatiquement
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

      // VÃ©rifier que l'URL peut Ãªtre ouverte
      const canOpen = await Linking.canOpenURL(data.url);

      if (!canOpen) {
        throw new Error('Impossible d\'ouvrir l\'URL d\'authentification. VÃ©rifiez que le navigateur est disponible.');
      }

      // Ouvrir l'URL dans le navigateur
      // AprÃ¨s l'authentification Google, l'utilisateur sera redirigÃ© vers redirectTo (deep link)
      // Supabase dÃ©tectera automatiquement la redirection et crÃ©era la session
      await Linking.openURL(data.url);

      console.log('[Google OAuth] URL ouverte avec succÃ¨s. Attente de la redirection...');

      // Retourner les donnÃ©es (l'URL a Ã©tÃ© ouverte)
      // La session sera crÃ©Ã©e automatiquement quand l'utilisateur reviendra via le deep link
      // et onAuthStateChange dans UserContext dÃ©tectera la connexion
      return data;
    } catch (linkError: any) {
      console.error('[Google OAuth] Erreur lors de l\'ouverture:', linkError);
      throw new Error(`Erreur lors de l'ouverture du navigateur: ${linkError.message || 'Erreur inconnue'}`);
    }
  }

  throw new Error('Aucune URL d\'authentification retournÃ©e par Supabase');
}

// VÃ©rifier le statut de bannissement de l'utilisateur actuel
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

    // VÃ©rifier dans user_bans
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

    // VÃ©rifier si le bannissement est expirÃ© (pour les bannissements temporaires)
    if (banData.ban_type === 'temporary' && banData.expires_at) {
      const expiresAt = new Date(banData.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        // Le bannissement est expirÃ©
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


