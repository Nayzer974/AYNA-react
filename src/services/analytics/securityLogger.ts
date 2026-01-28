/**
 * Service de logging de sÃ©curitÃ©
 * 
 * Permet de logger tous les Ã©vÃ©nements de sÃ©curitÃ© importants :
 * - Tentatives de connexion (rÃ©ussies/Ã©chouÃ©es)
 * - Inscriptions
 * - RÃ©initialisations de mot de passe
 * - Actions administratives
 * - ActivitÃ©s suspectes
 * 
 * âš ï¸ IMPORTANT : Les logs sont accessibles uniquement aux admins
 */

import { supabase } from '@/services/auth/supabase';

export interface SecurityLogMetadata {
  method?: string; // 'email', 'google', 'apple'
  ip_address?: string;
  user_agent?: string;
  [key: string]: any; // Autres mÃ©tadonnÃ©es
}

/**
 * Log un Ã©vÃ©nement de sÃ©curitÃ©
 * 
 * @param action - Action effectuÃ©e (ex: 'login_attempt', 'login_success', 'login_failed')
 * @param success - Si l'action a rÃ©ussi
 * @param errorMessage - Message d'erreur si Ã©chec
 * @param metadata - MÃ©tadonnÃ©es supplÃ©mentaires
 */
export async function logSecurityEvent(
  action: string,
  success: boolean = true,
  errorMessage?: string | null,
  metadata: SecurityLogMetadata = {}
): Promise<void> {
  try {
    if (!supabase) {
      console.warn('[SecurityLogger] Supabase non configurÃ©, impossible de logger');
      return;
    }

    // Appeler la fonction RPC pour logger l'Ã©vÃ©nement
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
 * Log une demande de rÃ©initialisation de mot de passe
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
 * Log une rÃ©initialisation de mot de passe rÃ©ussie
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
 * Log une activitÃ© suspecte
 */
export async function logSuspiciousActivity(
  activity: string,
  metadata: SecurityLogMetadata = {}
): Promise<void> {
  await logSecurityEvent('suspicious_activity', false, activity, metadata);
}

/**
 * Log un dÃ©passement de rate limit
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











