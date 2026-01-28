/**
 * Service pour gÃ©rer le changement de mot de passe avec confirmation par email
 */

import { supabase } from '@/services/auth/supabase';
import { APP_CONFIG } from '@/config';

export type PasswordChangeType = 'forgot' | 'settings';

export interface PasswordChangeResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Demander un changement de mot de passe (envoie un email de confirmation)
 */
export async function requestPasswordChange(
  userEmail: string,
  userName?: string,
  userId?: string,
  changeType: PasswordChangeType = 'settings'
): Promise<PasswordChangeResult> {
  if (!supabase || !APP_CONFIG.useSupabase) {
    return {
      success: false,
      error: 'Supabase n\'est pas configurÃ©',
    };
  }

  try {
    console.log('[PasswordChange] Appel de l\'Edge Function avec:', {
      userEmail: userEmail.trim(),
      userName: userName,
      userId: userId,
      changeType: changeType,
    });

    // Appeler l'Edge Function pour envoyer l'email
    const { data, error } = await supabase.functions.invoke('send-password-change-email', {
      body: {
        userEmail: userEmail.trim(),
        userName: userName,
        userId: userId,
        changeType: changeType,
      },
    });

    console.log('[PasswordChange] RÃ©ponse Edge Function:', { data, error });

    if (error) {
      console.error('[PasswordChange] Erreur Edge Function:', error);
      console.error('[PasswordChange] DÃ©tails erreur:', JSON.stringify(error, null, 2));
      
      // Extraire le message d'erreur dÃ©taillÃ©
      let errorMessage = 'Erreur lors de l\'envoi de l\'email de confirmation';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.context?.message) {
        errorMessage = error.context.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // VÃ©rifier si data existe et contient une erreur
    if (!data) {
      console.error('[PasswordChange] Pas de donnÃ©es retournÃ©es par l\'Edge Function');
      return {
        success: false,
        error: 'Aucune rÃ©ponse de l\'Edge Function',
      };
    }

    if (!data.success) {
      console.error('[PasswordChange] Erreur dans la rÃ©ponse:', data);
      return {
        success: false,
        error: data?.error || 'Erreur lors de l\'envoi de l\'email de confirmation',
      };
    }

    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error: any) {
    console.error('[PasswordChange] Erreur exception:', error);
    console.error('[PasswordChange] Stack:', error?.stack);
    
    let errorMessage = 'Erreur inattendue lors de l\'envoi de l\'email de confirmation';
    
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Changer le mot de passe aprÃ¨s confirmation du lien
 */
export async function changePasswordWithToken(
  token: string,
  newPassword: string
): Promise<PasswordChangeResult> {
  if (!supabase || !APP_CONFIG.useSupabase) {
    return {
      success: false,
      error: 'Supabase n\'est pas configurÃ©',
    };
  }

  try {
    // VÃ©rifier le token et changer le mot de passe
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (verifyError) {
      return {
        success: false,
        error: verifyError.message || 'Lien de rÃ©initialisation invalide ou expirÃ©',
      };
    }

    // Mettre Ã  jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message || 'Erreur lors de la mise Ã  jour du mot de passe',
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[PasswordChange] Erreur:', error);
    return {
      success: false,
      error: error.message || 'Erreur inattendue lors du changement de mot de passe',
    };
  }
}


