/**
 * Service de vérification d'email
 * NOUVEAU SYSTÈME : Utilise Brevo SMTP configuré directement dans Supabase Dashboard
 * Plus besoin d'Edge Functions - Supabase envoie automatiquement via Brevo SMTP
 */

import { supabase } from './supabase';

/**
 * Deep link vers l'app pour le callback après vérification
 */
const EMAIL_VERIFICATION_REDIRECT_URL = 'ayna://auth/callback';

/**
 * Envoie un email de confirmation à l'utilisateur
 * 
 * @param email - Email de l'utilisateur
 * @param type - Type d'email ('signup' pour inscription, 'email_change' pour changement d'email)
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function sendVerificationEmail(
  email: string,
  type: 'signup' | 'email_change' = 'signup'
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase n\'est pas configuré' };
  }

  try {
    // Vérifier que l'utilisateur est connecté et que l'email correspond
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour demander un email de vérification.',
      };
    }

    // Vérifier que l'email correspond à l'utilisateur connecté
    if (user.email && user.email.toLowerCase() !== email.toLowerCase()) {
      return {
        success: false,
        error: 'L\'email ne correspond pas à votre compte.',
      };
    }

    // Envoyer l'email via Supabase (qui utilise Brevo SMTP si configuré)
    const { error } = await supabase.auth.resend({
      type: type,
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: EMAIL_VERIFICATION_REDIRECT_URL,
      },
    });

    if (error) {
      const errorMessage = error.message?.toLowerCase() || '';
      
      // Email déjà vérifié
      if (errorMessage.includes('already confirmed') || 
          errorMessage.includes('already verified')) {
        return {
          success: false,
          error: 'Cet email est déjà vérifié.',
        };
      }
      
      // Utilisateur non trouvé
      if (errorMessage.includes('user not found') || 
          errorMessage.includes('no user found')) {
        return {
          success: false,
          error: 'Aucun compte trouvé avec cet email.',
        };
      }
      
      // Rate limiting
      if (errorMessage.includes('rate limit') || 
          errorMessage.includes('too many')) {
        return {
          success: false,
          error: 'Trop de demandes. Veuillez patienter quelques minutes avant de réessayer.',
        };
      }
      
      // Erreur générique
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi de l\'email de vérification',
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erreur inattendue lors de l\'envoi de l\'email',
    };
  }
}

/**
 * Vérifie si l'email de l'utilisateur actuel est vérifié
 * 
 * @returns Promise<boolean> - true si l'email est vérifié
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

/**
 * Récupère l'état de vérification de l'email de l'utilisateur actuel
 * 
 * @returns Promise<{ verified: boolean; email?: string }>
 */
export async function getEmailVerificationStatus(): Promise<{
  verified: boolean;
  email?: string;
}> {
  if (!supabase) {
    return { verified: false };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return { verified: false };
    }

    return {
      verified: user.email_confirmed_at !== null,
      email: user.email,
    };
  } catch (error) {
    return { verified: false };
  }
}

/**
 * Vérifie si l'utilisateur peut demander un nouvel email de vérification
 * 
 * @param email - Email de l'utilisateur
 * @returns Promise<boolean> - true si l'utilisateur peut demander un nouvel email
 */
export async function canRequestVerificationEmail(email: string): Promise<boolean> {
  // Vérifier d'abord si l'email est déjà vérifié
  const status = await getEmailVerificationStatus();
  if (status.verified && status.email === email) {
    return false; // Déjà vérifié, pas besoin d'envoyer un nouvel email
  }

  return true;
}
