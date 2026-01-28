/**
 * Service pour envoyer l'email de remerciement après activation
 */

import { Session } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface SendActivationEmailParams {
  email: string;
  name?: string;
  activationDate?: string;
  expirationDate?: string | null;
  language?: 'fr' | 'en' | 'ar';
}

/**
 * Envoie un email de remerciement après activation du compte
 */
export async function sendActivationThankYouEmail(
  params: SendActivationEmailParams,
  session?: Session
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };

    // Ajouter le token d'auth si disponible
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-activation-thank-you`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mode: 'single',
        email: params.email,
        name: params.name,
        activationDate: params.activationDate || new Date().toISOString(),
        expirationDate: params.expirationDate,
        language: params.language || 'fr',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[activationEmail] Error:', errorData);
      return { success: false, error: errorData };
    }

    const result = await response.json();
    console.log('[activationEmail] Email sent successfully');
    return { success: result.success, error: result.error };
  } catch (error: any) {
    console.error('[activationEmail] Error sending email:', error);
    return { success: false, error: error.message };
  }
}
