/**
 * ⚠️ SERVICE OBSOLÈTE
 * 
 * Ce service n'est plus utilisé depuis la migration vers le nouveau système
 * d'envoi d'email via Brevo SMTP configuré directement dans Supabase Dashboard.
 * 
 * Le nouveau système utilise :
 * - Supabase Auth directement (supabase.auth.signUp(), supabase.auth.resend(), etc.)
 * - Brevo SMTP configuré dans Supabase Dashboard > Authentication > Email Templates > SMTP Settings
 * - Deep links (ayna://auth/callback) pour les callbacks
 * 
 * Ce fichier peut être supprimé en toute sécurité.
 * 
 * Date de migration : 2025-01-27
 */

// Ce fichier est conservé temporairement pour référence
// mais ne doit plus être utilisé dans le code.

export interface BrevoSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * @deprecated Utilisez supabase.auth.resend() avec emailRedirectTo: 'ayna://auth/callback'
 */
export async function sendVerificationEmailViaBrevo(
  toEmail: string,
  redirectUrl: string,
  userName: string,
  userId?: string
): Promise<BrevoSendResult> {
  console.warn('[brevo.ts] sendVerificationEmailViaBrevo est obsolète. Utilisez supabase.auth.resend() à la place.');
  return { success: false, error: 'Cette fonction est obsolète. Utilisez supabase.auth.resend() à la place.' };
}

/**
 * @deprecated Utilisez supabase.auth.resetPasswordForEmail() avec redirectTo: 'ayna://auth/callback'
 */
export async function sendPasswordResetEmailViaBrevo(
  toEmail: string,
  redirectUrl: string,
  userName: string
): Promise<BrevoSendResult> {
  console.warn('[brevo.ts] sendPasswordResetEmailViaBrevo est obsolète. Utilisez supabase.auth.resetPasswordForEmail() à la place.');
  return { success: false, error: 'Cette fonction est obsolète. Utilisez supabase.auth.resetPasswordForEmail() à la place.' };
}
