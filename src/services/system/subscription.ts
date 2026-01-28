/**
 * Subscription Service
 * 
 * Handles subscription-related API calls
 * 
 * RULES:
 * - No pricing displayed in mobile
 * - No payment buttons in mobile
 * - Only "Activate my account" button that opens web checkout
 */

import { supabase } from '@/services/auth/supabase';
import { logger } from '@/utils/logger';

export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'inactive';
  source: 'web';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  subscription: Subscription | null;
  isActive: boolean;
}

/**
 * Request activation link with explicit session (to avoid getSession() issues)
 */
export async function requestActivationLinkWithSession(session: any): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }

  if (!session?.access_token) {
    throw new Error('No access token available. Please log in again.');
  }

  // Secure token handling
  try {
    const { APP_CONFIG } = await import('@/config');
    const functionUrl = `${APP_CONFIG.supabaseUrl}/functions/v1/account-activation-link`;
    const authHeader = `Bearer ${session.access_token}`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': APP_CONFIG.supabaseAnonKey || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;

      if (response.status === 401) {
        throw new Error('Unauthorized: Please log in to activate your account.');
      } else if (response.status === 404) {
        throw new Error('Edge Function not found. Please deploy account-activation-link function.');
      } else if (response.status === 500) {
        throw new Error('Server configuration error: Please check that Stripe secrets are configured.');
      }

      throw error;
    }

    const data = await response.json();

    if (!data.checkoutUrl) {
      throw new Error('No checkout URL received from server.');
    }

    return data.checkoutUrl;
  } catch (err: any) {
    throw err;
  }
}

/**
 * Request activation link (Stripe Checkout URL)
 * Opens in external browser for payment
 * Falls back to getSession() if no session provided
 */
export async function requestActivationLink(): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }

  // Vérifier que l'utilisateur est authentifié
  // IMPORTANT: Essayer d'abord getUser() qui peut récupérer l'utilisateur même si getSession() échoue
  let session = null;
  let user = null;

  // Méthode 1: Essayer getSession() (session complète avec token)
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  session = sessionData?.session || null;

  // Méthode 2: Si pas de session, essayer getUser() (peut récupérer depuis le token stocké)
  if (!session) {
    logger.warn('[subscription] No session from getSession(), trying getUser()...');
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      logger.error('[subscription] No user found:', userError?.message);
      throw new Error('You must be logged in to activate your account. Please log in and try again.');
    }

    user = userData.user;

    // Essayer de récupérer la session après getUser()
    const { data: sessionData2 } = await supabase.auth.getSession();
    session = sessionData2?.session || null;

    if (!session) {
      logger.error('[subscription] No session available even after getUser()');
      throw new Error('Session expired. Please log in again.');
    }
  }

  // Secure token handling
  try {
    const { APP_CONFIG } = await import('@/config');
    const functionUrl = `${APP_CONFIG.supabaseUrl}/functions/v1/account-activation-link`;
    const authHeader = `Bearer ${session.access_token}`;
    logger.log('[subscription] Authorization header format:', authHeader.substring(0, 10) + '...[REDACTED]');

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': APP_CONFIG.supabaseAnonKey || '',
      },
    });

    logger.log('[subscription] Response status:', response.status);
    // logger.log('[subscription] Response headers:', Object.fromEntries(response.headers.entries())); // Removed to prevent header leakage

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;

      logger.error('[subscription] Edge Function error:', response.status, errorMessage);

      if (response.status === 401) {
        throw new Error('Unauthorized: Please log in to activate your account.');
      } else if (response.status === 404) {
        throw new Error('Edge Function not found. Please deploy account-activation-link function.');
      } else if (response.status === 500) {
        throw new Error('Server configuration error: Please check that Stripe secrets are configured.');
      }

      throw error;
    }

    const data = await response.json();

    logger.log('[subscription] ✅ Edge Function response received');

    if (!data) {
      logger.error('[subscription] No data returned from account-activation-link');
      throw new Error('No data returned from server');
    }

    if (!data.checkoutUrl) {
      logger.error('[subscription] No checkoutUrl in response:', data);
      throw new Error('No checkout URL returned');
    }

    return data.checkoutUrl;
  } catch (err: any) {
    logger.error('[subscription] Error in requestActivationLink:', err);

    // Améliorer les messages d'erreur
    if (err.message?.includes('non-2xx')) {
      throw new Error('Server error: Please check that the Edge Function is deployed and configured correctly.');
    }

    throw err;
  }
}

/**
 * Get subscription status with explicit session (to avoid getSession() issues)
 */
export async function getSubscriptionStatusWithSession(session: any): Promise<SubscriptionStatus> {
  if (!supabase) {
    console.warn('[subscription] Supabase is not configured');
    return {
      subscription: null,
      isActive: false,
    };
  }

  if (!session?.access_token) {
    logger.warn('[subscription] No access token in session');
    return {
      subscription: null,
      isActive: false,
    };
  }

  logger.log('[subscription] ✅ Using provided session, user ID:', session.user.id);
  logger.log('[subscription] ✅ Access token present:', !!session.access_token);

  try {
    const { APP_CONFIG } = await import('@/config');
    const functionUrl = `${APP_CONFIG.supabaseUrl}/functions/v1/get-subscription`;
    const authHeader = `Bearer ${session.access_token}`;

    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': APP_CONFIG.supabaseAnonKey || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;

      if (response.status === 401) {
        return {
          subscription: null,
          isActive: false,
        };
      } else if (response.status === 404) {
        return {
          subscription: null,
          isActive: false,
        };
      } else if (response.status === 500) {
        return {
          subscription: null,
          isActive: false,
        };
      }

      return {
        subscription: null,
        isActive: false,
      };
    }

    const data = await response.json();

    return {
      subscription: data.subscription || null,
      isActive: data.isActive || false,
    };
  } catch (error) {
    return {
      subscription: null,
      isActive: false,
    };
  }
}

/**
 * Get current user's subscription status
 * Falls back to getSession() if no session provided
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (!supabase) {
    console.warn('[subscription] Supabase is not configured');
    return {
      subscription: null,
      isActive: false,
    };
  }

  // Vérifier que l'utilisateur est authentifié
  // IMPORTANT: Essayer d'abord getUser() qui peut récupérer l'utilisateur même si getSession() échoue
  let session = null;

  // Méthode 1: Essayer getSession() (session complète avec token)
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  session = sessionData?.session || null;

  // Méthode 2: Si pas de session, essayer getUser() (peut récupérer depuis le token stocké)
  if (!session) {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.warn('[subscription] User not authenticated, returning no subscription');
      return {
        subscription: null,
        isActive: false,
      };
    }

    // Essayer de récupérer la session après getUser()
    const { data: sessionData2 } = await supabase.auth.getSession();
    session = sessionData2?.session || null;

    if (!session) {
      console.warn('[subscription] No session available, returning no subscription');
      return {
        subscription: null,
        isActive: false,
      };
    }
  }

  // Secure session check 
  try {
    const { APP_CONFIG } = await import('@/config');
    const functionUrl = `${APP_CONFIG.supabaseUrl}/functions/v1/get-subscription`;
    const authHeader = `Bearer ${session.access_token}`;

    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': APP_CONFIG.supabaseAnonKey || '',
      },
    });

    logger.log('[subscription] [getStatus] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;

      logger.error('[subscription] Edge Function error:', response.status, errorMessage);

      if (response.status === 401) {
        throw new Error('Unauthorized: Please log in to check your subscription status.');
      } else if (response.status === 404) {
        throw new Error('Edge Function not found. Please deploy get-subscription function.');
      } else if (response.status === 500) {
        throw new Error('Server error: Please check server logs.');
      }

      throw error;
    }

    const data = await response.json();

    if (!data) {
      logger.error('[subscription] No data returned from get-subscription');
      return {
        subscription: null,
        isActive: false,
      };
    }

    return {
      subscription: data.subscription || null,
      isActive: data.isActive || false,
    };
  } catch (err: any) {
    logger.error('[subscription] Error in getSubscriptionStatus:', err);

    // Améliorer les messages d'erreur
    if (err.message?.includes('non-2xx')) {
      logger.warn('[subscription] Edge Function error, assuming no subscription');
      return {
        subscription: null,
        isActive: false,
      };
    }

    throw err;
  }
}

/**
 * Check if user has active subscription
 * Returns true if subscription is active and not expired
 */
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    const status = await getSubscriptionStatus();
    return status.isActive;
  } catch (error) {
    logger.error('Error checking subscription:', error);
    return false;
  }
}
