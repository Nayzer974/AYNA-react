/**
 * Service pour la gestion des codes cadeaux
 */

import { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/auth/supabase';

interface RedeemGiftCodeResult {
  success: boolean;
  error?: string;
  message: string;
  code_type?: '1_week' | '1_month' | '1_year' | 'lifetime';
  subscription_expires_at?: string | null;
}

/**
 * Utilise un code cadeau pour activer l'abonnement
 * Appelle directement la fonction RPC Supabase
 */
export async function redeemGiftCode(
  code: string,
  session: Session
): Promise<RedeemGiftCodeResult> {
  try {
    // RÃ©cupÃ©rer l'ID de l'utilisateur depuis la session
    const userId = session.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Session invalide. Veuillez vous reconnecter.',
      };
    }

    // Appeler directement la fonction RPC
    const { data, error } = await supabase.rpc('redeem_gift_code', {
      p_code: code.trim(),
      p_user_id: userId,
    });

    if (error) {
      console.error('[giftCode] RPC error:', error);
      return {
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Erreur serveur. Veuillez rÃ©essayer.',
      };
    }

    // La fonction RPC retourne directement le rÃ©sultat JSONB
    return data as RedeemGiftCodeResult;
  } catch (error: any) {
    console.error('[giftCode] Error redeeming code:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Erreur de connexion. Veuillez vÃ©rifier votre connexion internet.',
    };
  }
}

/**
 * VÃ©rifie si l'utilisateur a dÃ©jÃ  un abonnement actif via code cadeau
 */
export async function hasActiveGiftSubscription(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('gift_code_redemptions')
      .select('subscription_expires_at')
      .eq('user_id', userId)
      .gt('subscription_expires_at', new Date().toISOString())
      .limit(1);

    if (error) {
      console.error('[giftCode] Error checking gift subscription:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('[giftCode] Error:', error);
    return false;
  }
}


