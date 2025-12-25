/**
 * Supabase Edge Function: check-subscription
 * 
 * Middleware function to check if user has active subscription
 * Returns 403 if subscription is inactive
 * 
 * USAGE: Call this before any AI feature endpoint
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Checks if user has active subscription
 * Returns { isActive: boolean, subscription: object | null }
 */
export async function checkUserSubscription(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authToken: string
): Promise<{ isActive: boolean; subscription: any | null }> {
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authToken },
    },
  });

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    return { isActive: false, subscription: null };
  }

  // Get subscription
  const { data: subscription, error: subError } = await supabaseClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (subError || !subscription) {
    return { isActive: false, subscription: null };
  }

  // Check if subscription is active and not expired
  const isActive =
    subscription.status === 'active' &&
    subscription.expires_at &&
    new Date(subscription.expires_at) > new Date();

  return { isActive, subscription };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authToken = req.headers.get('Authorization');
    if (!authToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', isActive: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await checkUserSubscription(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      authToken
    );

    if (!result.isActive) {
      return new Response(
        JSON.stringify({
          error: 'Active subscription required',
          isActive: false,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        isActive: true,
        subscription: result.subscription,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error checking subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', isActive: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


