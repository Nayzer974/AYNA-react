/**
 * Supabase Edge Function: account-activation-link
 * 
 * Creates a Stripe Checkout Session for subscription activation
 * 
 * RULES:
 * - Payments occur ONLY in web browser
 * - Uses client_reference_id = userId for account linking
 * - Returns checkout URL to open in external browser
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Stripe configuration
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_PRICE_ID = Deno.env.get('STRIPE_PRICE_ID'); // Your Stripe Price ID
const WEB_BASE_URL = Deno.env.get('WEB_BASE_URL') || 'https://yourdomain.com'; // Your web domain

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    
    // Log pour debug (temporaire)
    console.log('[account-activation-link] Authorization header present:', !!authHeader);
    console.log('[account-activation-link] Authorization header preview:', authHeader?.substring(0, 30) + '...');
    console.log('[account-activation-link] All headers:', Object.fromEntries(req.headers.entries()));
    
    if (!authHeader) {
      console.error('[account-activation-link] No Authorization header received');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Vérifier que le header commence par "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      console.error('[account-activation-link] Invalid Authorization header format (should start with "Bearer ")');
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
      console.error('[account-activation-link] Auth error:', authError.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: ' + authError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user) {
      console.error('[account-activation-link] No user found after auth');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[account-activation-link] ✅ User authenticated:', user.id);
    console.log('[account-activation-link] ✅ User email:', user.email);

    // Validate Stripe configuration
    if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
      console.error('Stripe configuration missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: user.email || undefined,
      client_reference_id: user.id, // CRITICAL: Links subscription to user
      success_url: `${WEB_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${WEB_BASE_URL}/cancel`,
      metadata: {
        userId: user.id,
        userEmail: user.email || '',
      },
    });

    // Return checkout URL
    return new Response(
      JSON.stringify({
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating activation link:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create activation link' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

