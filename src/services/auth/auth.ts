/**
 * Service d'authentification simplifiÃ©
 * Utilise Supabase Auth avec Brevo SMTP configurÃ© dans Supabase Dashboard
 */

import { supabase } from '@/services/auth/supabase';
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
 * @returns DonnÃ©es de l'inscription (user et session si email non vÃ©rifiÃ© requis)
 */
export async function signUp(
  email: string,
  password: string,
  name?: string,
  gender?: string,
  avatarId?: string
): Promise<{ user: any; session: any } | null> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configurÃ©');
  }

  // URL de redirection vers le domaine officiel de l'app
  // Supabase redirigera vers ce lien après vérification de l'email
  const emailRedirectTo = 'https://nurayna.com/auth/callback';

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

  logger.log('[auth] Inscription rÃ©ussie');
  logger.log('[auth] User crÃ©Ã©:', !!data?.user);
  logger.log('[auth] Session:', !!data?.session);
  logger.log('[auth] Email vÃ©rifiÃ©:', !!data?.user?.email_confirmed_at);

  // Si l'utilisateur est crÃ©Ã© mais n'a pas de session (email non vÃ©rifiÃ©),
  // on retourne quand mÃªme les donnÃ©es pour afficher l'Ã©cran de vÃ©rification
  return data;
}

/**
 * Renvoie un email de vÃ©rification
 * 
 * @param email - Email de l'utilisateur
 * @returns SuccÃ¨s ou erreur
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase n\'est pas configurÃ©' };
  }

  try {
    const emailRedirectTo = 'https://nurayna.com/auth/callback';

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
        return { success: false, error: 'Cet email est dÃ©jÃ  vÃ©rifiÃ©.' };
      }

      if (errorMessage.includes('user not found')) {
        return { success: false, error: 'Aucun compte trouvÃ© avec cet email.' };
      }

      return { success: false, error: error.message || 'Erreur lors de l\'envoi de l\'email' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erreur inattendue' };
  }
}

/**
 * VÃ©rifie si l'email de l'utilisateur actuel est vÃ©rifiÃ©
 * 
 * @returns true si l'email est vÃ©rifiÃ©
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





