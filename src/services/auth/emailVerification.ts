/**
 * Service de vÃ©rification d'email
 * NOUVEAU SYSTÃˆME : Utilise Brevo SMTP configurÃ© directement dans Supabase Dashboard
 * Plus besoin d'Edge Functions - Supabase envoie automatiquement via Brevo SMTP
 */

import { supabase } from '@/services/auth/supabase';

/**
 * Deep link vers l'app pour le callback aprÃ¨s vÃ©rification
 */
const EMAIL_VERIFICATION_REDIRECT_URL = 'https://nurayna.com/auth/callback';

/**
 * Envoie un email de confirmation Ã  l'utilisateur
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
    return { success: false, error: 'Supabase n\'est pas configurÃ©' };
  }

  try {
    // VÃ©rifier que l'utilisateur est connectÃ© et que l'email correspond
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Vous devez Ãªtre connectÃ© pour demander un email de vÃ©rification.',
      };
    }

    // VÃ©rifier que l'email correspond Ã  l'utilisateur connectÃ©
    if (user.email && user.email.toLowerCase() !== email.toLowerCase()) {
      return {
        success: false,
        error: 'L\'email ne correspond pas Ã  votre compte.',
      };
    }

    // Envoyer l'email via Supabase (qui utilise Brevo SMTP si configurÃ©)
    const { error } = await supabase.auth.resend({
      type: type,
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: EMAIL_VERIFICATION_REDIRECT_URL,
      },
    });

    if (error) {
      const errorMessage = error.message?.toLowerCase() || '';

      // Email dÃ©jÃ  vÃ©rifiÃ©
      if (errorMessage.includes('already confirmed') ||
        errorMessage.includes('already verified')) {
        return {
          success: false,
          error: 'Cet email est dÃ©jÃ  vÃ©rifiÃ©.',
        };
      }

      // Utilisateur non trouvÃ©
      if (errorMessage.includes('user not found') ||
        errorMessage.includes('no user found')) {
        return {
          success: false,
          error: 'Aucun compte trouvÃ© avec cet email.',
        };
      }

      // Rate limiting
      if (errorMessage.includes('rate limit') ||
        errorMessage.includes('too many')) {
        return {
          success: false,
          error: 'Trop de demandes. Veuillez patienter quelques minutes avant de rÃ©essayer.',
        };
      }

      // Erreur gÃ©nÃ©rique
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi de l\'email de vÃ©rification',
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
 * VÃ©rifie si l'email de l'utilisateur actuel est vÃ©rifiÃ©
 * 
 * @returns Promise<boolean> - true si l'email est vÃ©rifiÃ©
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
 * RÃ©cupÃ¨re l'Ã©tat de vÃ©rification de l'email de l'utilisateur actuel
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
 * VÃ©rifie si l'utilisateur peut demander un nouvel email de vÃ©rification
 * 
 * @param email - Email de l'utilisateur
 * @returns Promise<boolean> - true si l'utilisateur peut demander un nouvel email
 */
export async function canRequestVerificationEmail(email: string): Promise<boolean> {
  // VÃ©rifier d'abord si l'email est dÃ©jÃ  vÃ©rifiÃ©
  const status = await getEmailVerificationStatus();
  if (status.verified && status.email === email) {
    return false; // DÃ©jÃ  vÃ©rifiÃ©, pas besoin d'envoyer un nouvel email
  }

  return true;
}

