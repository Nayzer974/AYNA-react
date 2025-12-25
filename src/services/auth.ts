/**
 * Service d'authentification simplifié
 * Utilise Supabase Auth avec Brevo SMTP configuré dans Supabase Dashboard
 */

import { supabase } from './supabase';
import { APP_CONFIG } from '@/config';
import { logger } from '@/utils/logger';

/**
 * Inscription d'un nouvel utilisateur
 * 
 * @param email - Email de l'utilisateur
 * @param password - Mot de passe
 * @param name - Nom de l'utilisateur (optionnel)
 * @param gender - Genre (optionnel)
 * @param avatarId - ID de l'avatar (optionnel)
 * @returns Données de l'inscription (user et session si email non vérifié requis)
 */
export async function signUp(
  email: string,
  password: string,
  name?: string,
  gender?: string,
  avatarId?: string
): Promise<{ user: any; session: any } | null> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  // URL de redirection vers le deep link de l'app
  // Supabase redirigera vers ce deep link après vérification de l'email
  const emailRedirectTo = 'ayna://auth/callback';

  logger.log('[auth] Inscription en cours...');
  // Ne jamais logger l'email directement
  logger.log('[auth] Email redirect to:', emailRedirectTo);

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

  if (error) {
    console.error('[auth] Erreur lors de l\'inscription:', error);
    
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

  logger.log('[auth] Inscription réussie');
  logger.log('[auth] User créé:', !!data?.user);
  logger.log('[auth] Session:', !!data?.session);
  logger.log('[auth] Email vérifié:', !!data?.user?.email_confirmed_at);

  // Si l'utilisateur est créé mais n'a pas de session (email non vérifié),
  // on retourne quand même les données pour afficher l'écran de vérification
  return data;
}

/**
 * Renvoie un email de vérification
 * 
 * @param email - Email de l'utilisateur
 * @returns Succès ou erreur
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase n\'est pas configuré' };
  }

  try {
    const emailRedirectTo = 'ayna://auth/callback';

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: emailRedirectTo,
      },
    });

    if (error) {
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (errorMessage.includes('already confirmed') ||
          errorMessage.includes('already verified')) {
        return { success: false, error: 'Cet email est déjà vérifié.' };
      }
      
      if (errorMessage.includes('user not found')) {
        return { success: false, error: 'Aucun compte trouvé avec cet email.' };
      }
      
      return { success: false, error: error.message || 'Erreur lors de l\'envoi de l\'email' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erreur inattendue' };
  }
}

/**
 * Vérifie si l'email de l'utilisateur actuel est vérifié
 * 
 * @returns true si l'email est vérifié
 */
export async function isEmailVerified(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    return user.email_confirmed_at !== null;
  } catch (error) {
    return false;
  }
}




