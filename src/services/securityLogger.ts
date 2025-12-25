/**
 * Service de logging de sécurité
 * 
 * Permet de logger tous les événements de sécurité importants :
 * - Tentatives de connexion (réussies/échouées)
 * - Inscriptions
 * - Réinitialisations de mot de passe
 * - Actions administratives
 * - Activités suspectes
 * 
 * ⚠️ IMPORTANT : Les logs sont accessibles uniquement aux admins
 */

import { supabase } from './supabase';

export interface SecurityLogMetadata {
  method?: string; // 'email', 'google', 'apple'
  ip_address?: string;
  user_agent?: string;
  [key: string]: any; // Autres métadonnées
}

/**
 * Log un événement de sécurité
 * 
 * @param action - Action effectuée (ex: 'login_attempt', 'login_success', 'login_failed')
 * @param success - Si l'action a réussi
 * @param errorMessage - Message d'erreur si échec
 * @param metadata - Métadonnées supplémentaires
 */
export async function logSecurityEvent(
  action: string,
  success: boolean = true,
  errorMessage?: string | null,
  metadata: SecurityLogMetadata = {}
): Promise<void> {
  try {
    if (!supabase) {
      console.warn('[SecurityLogger] Supabase non configuré, impossible de logger');
      return;
    }

    // Appeler la fonction RPC pour logger l'événement
    const { error } = await supabase.rpc('log_security_event', {
      p_action: action,
      p_success: success,
      p_error_message: errorMessage || null,
      p_metadata: metadata,
    });

    if (error) {
      console.error('[SecurityLogger] Erreur lors du logging:', error);
      // Ne pas throw pour ne pas bloquer le flux principal
    }
  } catch (error) {
    console.error('[SecurityLogger] Erreur lors du logging:', error);
    // Ne pas throw pour ne pas bloquer le flux principal
  }
}

/**
 * Log une tentative de connexion
 */
export async function logLoginAttempt(
  success: boolean,
  method: string = 'email',
  errorMessage?: string
): Promise<void> {
  await logSecurityEvent(
    success ? 'login_success' : 'login_failed',
    success,
    errorMessage,
    { method }
  );
}

/**
 * Log une tentative d'inscription
 */
export async function logSignupAttempt(
  success: boolean,
  method: string = 'email',
  errorMessage?: string
): Promise<void> {
  await logSecurityEvent(
    success ? 'signup_success' : 'signup_failed',
    success,
    errorMessage,
    { method }
  );
}

/**
 * Log une demande de réinitialisation de mot de passe
 */
export async function logPasswordResetRequest(
  success: boolean,
  errorMessage?: string
): Promise<void> {
  await logSecurityEvent(
    'password_reset_request',
    success,
    errorMessage
  );
}

/**
 * Log une réinitialisation de mot de passe réussie
 */
export async function logPasswordResetSuccess(): Promise<void> {
  await logSecurityEvent('password_reset_success', true);
}

/**
 * Log un changement de mot de passe
 */
export async function logPasswordChange(success: boolean, errorMessage?: string): Promise<void> {
  await logSecurityEvent('password_change', success, errorMessage);
}

/**
 * Log une action administrative
 */
export async function logAdminAction(
  action: string,
  success: boolean = true,
  metadata: SecurityLogMetadata = {}
): Promise<void> {
  await logSecurityEvent(`admin_action_${action}`, success, undefined, {
    ...metadata,
    admin_action: action,
  });
}

/**
 * Log une activité suspecte
 */
export async function logSuspiciousActivity(
  activity: string,
  metadata: SecurityLogMetadata = {}
): Promise<void> {
  await logSecurityEvent('suspicious_activity', false, activity, metadata);
}

/**
 * Log un dépassement de rate limit
 */
export async function logRateLimitExceeded(
  action: string,
  metadata: SecurityLogMetadata = {}
): Promise<void> {
  await logSecurityEvent('rate_limit_exceeded', false, `Rate limit exceeded for: ${action}`, {
    ...metadata,
    action,
  });
}










