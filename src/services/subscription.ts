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

import { supabase } from '@/services/supabase';

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

  // LOGS DEBUG: État de la session et du token
  console.log('[subscription] [DEBUG] requestActivationLinkWithSession called');
  console.log('[subscription] [DEBUG] Session state:', {
    userId: session.user.id,
    email: session.user.email,
    hasToken: !!session.access_token,
    tokenLength: session.access_token?.length || 0,
  });
  console.log('[subscription] ✅ Using provided session, user ID:', session.user.id);
  console.log('[subscription] ✅ Access token present:', !!session.access_token);
  console.log('[subscription] ✅ Token preview:', session.access_token.substring(0, 20) + '...');

  try {
    const { APP_CONFIG } = await import('@/config');
    const functionUrl = `${APP_CONFIG.supabaseUrl}/functions/v1/account-activation-link`;
    
    console.log('[subscription] [DEBUG] Calling Edge Function:', functionUrl);
    
    const authHeader = `Bearer ${session.access_token}`;
    console.log('[subscription] [DEBUG] Authorization header format:', authHeader.substring(0, 30) + '...');
    console.log('[subscription] [DEBUG] Authorization header full length:', authHeader.length);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': APP_CONFIG.supabaseAnonKey || '',
      },
    });
    
    console.log('[subscription] [DEBUG] Response status:', response.status);
    console.log('[subscription] [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      
      console.error('[subscription] Edge Function error:', response.status, errorMessage);
      
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
    
    console.log('[subscription] [DEBUG] Edge Function response:', {
      hasCheckoutUrl: !!data.checkoutUrl,
      hasSessionId: !!data.sessionId,
      checkoutUrlPreview: data.checkoutUrl?.substring(0, 50) + '...',
    });
    
    if (!data.checkoutUrl) {
      console.error('[subscription] [DEBUG] No checkoutUrl in response:', data);
      throw new Error('No checkout URL received from server.');
    }

    console.log('[subscription] ✅ Checkout URL received');
    console.log('[subscription] [DEBUG] Full checkout URL:', data.checkoutUrl);
    return data.checkoutUrl;
  } catch (err: any) {
    console.error('[subscription] Error requesting activation link:', err);
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
    console.warn('[subscription] No session from getSession(), trying getUser()...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error('[subscription] No user found:', userError?.message);
      throw new Error('You must be logged in to activate your account. Please log in and try again.');
    }
    
    user = userData.user;
    
    // Essayer de récupérer la session après getUser()
    const { data: sessionData2 } = await supabase.auth.getSession();
    session = sessionData2?.session || null;
    
    if (!session) {
      console.error('[subscription] No session available even after getUser()');
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  if (!session.access_token) {
    console.error('[subscription] Session exists but no access token');
    throw new Error('Invalid session. Please log in again.');
  }

  console.log('[subscription] ✅ Session active, user ID:', session.user.id);
  console.log('[subscription] ✅ Access token present:', !!session.access_token);
  console.log('[subscription] ✅ Token length:', session.access_token.length);
  console.log('[subscription] ✅ Token preview:', session.access_token.substring(0, 20) + '...');

  try {
    // CRITICAL FIX: Utiliser fetch directement avec le token pour garantir la transmission
    const { APP_CONFIG } = await import('@/config');
    const functionUrl = `${APP_CONFIG.supabaseUrl}/functions/v1/account-activation-link`;
    
    console.log('[subscription] Calling Edge Function:', functionUrl);
    
    // Vérifier que le token est bien formaté
    const authHeader = `Bearer ${session.access_token}`;
    console.log('[subscription] Authorization header format:', authHeader.substring(0, 30) + '...');
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': APP_CONFIG.supabaseAnonKey || '',
      },
    });
    
    console.log('[subscription] Response status:', response.status);
    console.log('[subscription] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      
      console.error('[subscription] Edge Function error:', response.status, errorMessage);
      
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
    
    console.log('[subscription] ✅ Edge Function response received');

    if (!data) {
      console.error('[subscription] No data returned from account-activation-link');
      throw new Error('No data returned from server');
    }

    if (!data.checkoutUrl) {
      console.error('[subscription] No checkoutUrl in response:', data);
      throw new Error('No checkout URL returned');
    }

    return data.checkoutUrl;
  } catch (err: any) {
    console.error('[subscription] Error in requestActivationLink:', err);
    
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
    console.warn('[subscription] No access token in session');
    return {
      subscription: null,
      isActive: false,
    };
  }

  console.log('[subscription] ✅ Using provided session, user ID:', session.user.id);
  console.log('[subscription] ✅ Access token present:', !!session.access_token);

  try {
    const { APP_CONFIG } = await import('@/config');
    const functionUrl = `${APP_CONFIG.supabaseUrl}/functions/v1/get-subscription`;
    
    console.log('[subscription] Calling Edge Function:', functionUrl);
    
    const authHeader = `Bearer ${session.access_token}`;
    console.log('[subscription] [getStatus] Authorization header format:', authHeader.substring(0, 30) + '...');
    
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': APP_CONFIG.supabaseAnonKey || '',
      },
    });
    
    console.log('[subscription] [getStatus] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      
      console.error('[subscription] Edge Function error:', response.status, errorMessage);
      
      if (response.status === 401) {
        return {
          subscription: null,
          isActive: false,
        };
      } else if (response.status === 404) {
        console.warn('[subscription] Edge Function not found');
        return {
          subscription: null,
          isActive: false,
        };
      } else if (response.status === 500) {
        console.error('[subscription] Server error');
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
    
    console.log('[subscription] [getStatus] Response data:', {
      hasSubscription: !!data.subscription,
      subscriptionStatus: data.subscription?.status,
      isActive: data.isActive,
      expiresAt: data.subscription?.expires_at,
      now: new Date().toISOString(),
    });
    
    return {
      subscription: data.subscription || null,
      isActive: data.isActive || false,
    };
  } catch (error) {
    console.error('[subscription] Error getting subscription status:', error);
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
  
  if (!session.access_token) {
    console.warn('[subscription] Session exists but no access token');
    return {
      subscription: null,
      isActive: false,
    };
  }

  console.log('[subscription] ✅ Session active, user ID:', session.user.id);
  console.log('[subscription] ✅ Access token present:', !!session.access_token);

  try {
    // CRITICAL FIX: Utiliser fetch directement avec le token pour garantir la transmission
    const { APP_CONFIG } = await import('@/config');
    const functionUrl = `${APP_CONFIG.supabaseUrl}/functions/v1/get-subscription`;
    
    console.log('[subscription] Calling Edge Function:', functionUrl);
    
    // Vérifier que le token est bien formaté
    const authHeader = `Bearer ${session.access_token}`;
    console.log('[subscription] [getStatus] Authorization header format:', authHeader.substring(0, 30) + '...');
    
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': APP_CONFIG.supabaseAnonKey || '',
      },
    });
    
    console.log('[subscription] [getStatus] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      
      console.error('[subscription] Edge Function error:', response.status, errorMessage);
      
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
    
    console.log('[subscription] ✅ Edge Function response received');

    if (!data) {
      console.error('[subscription] No data returned from get-subscription');
      // Si pas de données, considérer comme pas d'abonnement (pas une erreur)
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
    console.error('[subscription] Error in getSubscriptionStatus:', err);
    
    // Améliorer les messages d'erreur
    if (err.message?.includes('non-2xx')) {
      // Si l'Edge Function n'est pas déployée ou retourne une erreur, considérer comme pas d'abonnement
      console.warn('[subscription] Edge Function error, assuming no subscription');
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
    console.error('Error checking subscription:', error);
    return false;
  }
}

