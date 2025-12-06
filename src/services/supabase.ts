// Service Supabase pour l'authentification et la base de données
import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../config';

const supabaseUrl = APP_CONFIG.supabaseUrl || '';
const supabaseAnonKey = APP_CONFIG.supabaseAnonKey || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase n\'est pas configuré. Définissez les variables d\'environnement.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Fonction pour vérifier si un utilisateur est admin
export function isAdminUser(email: string): boolean {
  return email === 'admin' || 
         email === 'admin@admin.com' || 
         email === 'pro.ibrahima00@gmail.com';
}

// Fonctions d'authentification avec Supabase
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

  // Gestion spéciale pour le compte admin
  if (email === 'admin' && password === 'admin') {
    const adminEmail = 'pro.ibrahima00@gmail.com';
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: 'admin123456',
      options: {
        data: {
          name: name || 'Admin',
          is_admin: true,
          original_email: 'admin',
          gender: gender || null,
          avatar_id: avatarId || null,
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return await signInWithSupabase('admin', 'admin');
      }
      throw error;
    }
    return data;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Utiliser le domaine nurayna.com pour la vérification d'email
      emailRedirectTo: 'http://nurayna.com/oauth/consent',
      data: {
        name: name || email.split('@')[0],
        gender: gender || null,
        avatar_id: avatarId || null,
      }
    }
  });

  if (error) {
    const errorMessage = error.message?.toLowerCase() || '';
    if (errorMessage.includes('already registered') || 
        errorMessage.includes('user already exists') ||
        errorMessage.includes('email already') ||
        error.code === 'signup_disabled' ||
        error.status === 422) {
      throw new Error('Cet email est déjà utilisé. Veuillez utiliser un autre email ou vous connecter.');
    }
    throw error;
  }
  
  return data;
}

export async function signInWithSupabase(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  // Gestion spéciale pour le compte admin
  if (email === 'admin' && password === 'admin') {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'pro.ibrahima00@gmail.com',
      password: 'admin123456',
    });

    if (error) {
      if (error.message.includes('Invalid login credentials') || error.message.includes('User not found')) {
        return await signUpWithSupabase('admin', 'admin', 'Admin');
      }
      throw error;
    }
    return data;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Permettre la connexion même si l'email n'est pas vérifié
  if (error) {
    // Si l'erreur est "Email not confirmed", on permet quand même la connexion
    // en récupérant la session directement
    if (error.message?.includes('Email not confirmed') || error.message?.includes('email not confirmed')) {
      // Essayer de récupérer la session actuelle
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        return { user: sessionData.session.user, session: sessionData.session };
      }
      // Si pas de session, on permet quand même en créant une session temporaire
      // L'utilisateur pourra utiliser l'app mais verra le popup de vérification
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        return { user: userData.user, session: null };
      }
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
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const user = await getCurrentUser();
  if (!user) return false;

  const isAdmin = user.user_metadata?.is_admin === true || 
                  user.user_metadata?.original_email === 'admin' ||
                  user.email === 'admin@admin.com' ||
                  user.email === 'pro.ibrahima00@gmail.com';
  
  return isAdmin;
}

// Connexion avec Google OAuth
export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  // Pour React Native, utiliser un deep link pour la redirection
  const redirectTo = APP_CONFIG.apiBaseUrl || 'ayna://';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });

  if (error) throw error;
  return data;
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
      console.warn('Erreur lors de la vérification du bannissement:', banError);
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
    console.warn('Erreur lors de la vérification du bannissement:', error);
    return { isBanned: false };
  }
}

