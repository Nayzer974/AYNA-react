/**
 * Supabase Edge Function: get-subscription
 * 
 * Returns the current user's subscription status
 * Used by mobile app to check if user has active subscription
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    
    // Log pour debug (temporaire)
    console.log('[get-subscription] Authorization header present:', !!authHeader);
    console.log('[get-subscription] Authorization header preview:', authHeader?.substring(0, 30) + '...');
    console.log('[get-subscription] All headers:', Object.fromEntries(req.headers.entries()));
    
    if (!authHeader) {
      console.error('[get-subscription] No Authorization header received');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Vérifier que le header commence par "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      console.error('[get-subscription] Invalid Authorization header format (should start with "Bearer ")');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid authorization header format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError) {
      console.error('[get-subscription] Auth error:', authError.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: ' + authError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user) {
      console.error('[get-subscription] No user found after auth');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-subscription] ✅ User authenticated:', user.id);
    console.log('[get-subscription] ✅ User email:', user.email);

    // Get user's subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected if no subscription)
      console.error('Error fetching subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log subscription details for debugging
    console.log('[get-subscription] Subscription query result:', {
      hasSubscription: !!subscription,
      subscriptionId: subscription?.id,
      status: subscription?.status,
      expiresAt: subscription?.expires_at,
      now: new Date().toISOString(),
      isExpired: subscription?.expires_at ? new Date(subscription.expires_at) < new Date() : null,
    });

    // Calculate isActive
    const isActive = subscription?.status === 'active' && 
                     subscription?.expires_at && 
                     new Date(subscription.expires_at) > new Date();

    console.log('[get-subscription] Final isActive:', isActive);

    // Return subscription or null
    return new Response(
      JSON.stringify({
        subscription: subscription || null,
        isActive,
        hasSubscription: !!subscription,
        subscriptionStatus: subscription?.status || null,
        expiresAt: subscription?.expires_at || null,
        now: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

