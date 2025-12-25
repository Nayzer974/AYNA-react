/**
 * Supabase Edge Function: stripe-webhook
 * 
 * Handles Stripe webhook events for subscription management
 * 
 * EVENTS HANDLED:
 * - checkout.session.completed: Activate subscription
 * - customer.subscription.deleted: Deactivate subscription
 * - customer.subscription.updated: Update subscription
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  // IMPORTANT: Webhooks Stripe n'ont PAS besoin d'authentification JWT
  // Ils utilisent uniquement la signature Stripe pour la sécurité
  // Cette fonction doit être accessible publiquement (sans Authorization header)
  // 
  // NOTE: Supabase Edge Functions nécessitent soit:
  // - Header "apikey" OU
  // - Header "Authorization: Bearer <token>" OU  
  // - Paramètre "apikey" dans l'URL (mais cela ne fonctionne pas toujours)
  //
  // SOLUTION: Vérifier la signature Stripe AVANT toute autre vérification
  // Si la signature Stripe est valide, on accepte la requête même sans header Supabase
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'stripe-signature, content-type, apikey, authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('[stripe-webhook] Webhook received');
    console.log('[stripe-webhook] Method:', req.method);
    console.log('[stripe-webhook] URL:', req.url);
    console.log('[stripe-webhook] Headers:', Object.fromEntries(req.headers.entries()));
    
    // Extract apikey from URL if present
    const url = new URL(req.url);
    const apikeyFromUrl = url.searchParams.get('apikey');
    console.log('[stripe-webhook] apikey from URL:', !!apikeyFromUrl);
    
    // Check if we have stripe-signature header (required for Stripe webhooks)
    const stripeSignature = req.headers.get('stripe-signature');
    console.log('[stripe-webhook] Stripe signature present:', !!stripeSignature);
    
    // If no stripe signature, this is not a valid Stripe webhook
    if (!stripeSignature) {
      console.error('[stripe-webhook] Missing stripe-signature header');
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    // Validate Stripe configuration
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      console.error('[stripe-webhook] Stripe configuration missing');
      console.error('[stripe-webhook] STRIPE_SECRET_KEY present:', !!STRIPE_SECRET_KEY);
      console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET present:', !!STRIPE_WEBHOOK_SECRET);
      return new Response('Server configuration error', { status: 500 });
    }

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    console.log('[stripe-webhook] Body length:', body.length);
    console.log('[stripe-webhook] Stripe signature present:', !!signature);

    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verify webhook signature
    // IMPORTANT: In Deno, we must use constructEventAsync instead of constructEvent
    let event: Stripe.Event;
    try {
      console.log('[stripe-webhook] Verifying signature with secret:', STRIPE_WEBHOOK_SECRET ? 'present' : 'missing');
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
      console.log('[stripe-webhook] ✅ Stripe signature verified successfully');
      console.log('[stripe-webhook] Event type:', event.type);
      console.log('[stripe-webhook] Event ID:', event.id);
    } catch (err: any) {
      console.error('[stripe-webhook] ❌ Webhook signature verification failed');
      console.error('[stripe-webhook] Error type:', err?.constructor?.name);
      console.error('[stripe-webhook] Error message:', err?.message);
      console.error('[stripe-webhook] Error stack:', err?.stack);
      console.error('[stripe-webhook] Body preview (first 200 chars):', body.substring(0, 200));
      console.error('[stripe-webhook] Signature preview:', signature?.substring(0, 50));
      return new Response(
        JSON.stringify({ 
          error: 'Webhook signature verification failed', 
          message: err?.message || 'Unknown error',
          details: 'Check logs for more information'
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase Admin Client (service role for database access)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('[stripe-webhook] checkout.session.completed received');
        console.log('[stripe-webhook] Session ID:', session.id);
        console.log('[stripe-webhook] Session mode:', session.mode);
        console.log('[stripe-webhook] Client reference ID:', session.client_reference_id);
        console.log('[stripe-webhook] Subscription ID:', session.subscription);
        console.log('[stripe-webhook] Customer email:', session.customer_email);

        // CRITICAL: Get userId from client_reference_id (not email)
        const userId = session.client_reference_id;

        if (!userId) {
          console.error('[stripe-webhook] Missing client_reference_id in checkout session');
          console.error('[stripe-webhook] Session data:', JSON.stringify(session, null, 2));
          return new Response('Missing user reference', { status: 400 });
        }

        console.log('[stripe-webhook] User ID from client_reference_id:', userId);

        // Get subscription details from Stripe
        const subscriptionId = session.subscription as string;
        if (!subscriptionId) {
          console.error('[stripe-webhook] Missing subscription ID in checkout session');
          return new Response('Missing subscription ID', { status: 400 });
        }

        console.log('[stripe-webhook] Retrieving subscription from Stripe:', subscriptionId);
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;

        console.log('[stripe-webhook] Subscription status:', subscription.status);
        console.log('[stripe-webhook] Customer ID:', customerId);
        console.log('[stripe-webhook] Current period end:', subscription.current_period_end);

        // Calculate expiration date (current_period_end)
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

        console.log('[stripe-webhook] Expires at:', expiresAt);

        // Create or update subscription in database
        const subscriptionData = {
          user_id: userId,
          status: 'active',
          source: 'web',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          expires_at: expiresAt,
        };

        console.log('[stripe-webhook] Upserting subscription:', JSON.stringify(subscriptionData, null, 2));

        const { data: upsertData, error: dbError } = await supabaseAdmin
          .from('subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'user_id',
          })
          .select();

        if (dbError) {
          console.error('[stripe-webhook] Database error:', dbError);
          console.error('[stripe-webhook] Error details:', JSON.stringify(dbError, null, 2));
          return new Response('Database error', { status: 500 });
        }

        console.log('[stripe-webhook] ✅ Subscription activated for user:', userId);
        console.log('[stripe-webhook] ✅ Upsert result:', JSON.stringify(upsertData, null, 2));
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Find subscription by stripe_subscription_id
        const { data: subData, error: findError } = await supabaseAdmin
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (findError || !subData) {
          console.error('Subscription not found:', findError);
          // Not a critical error - subscription might have been deleted already
          break;
        }

        // Deactivate subscription
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'inactive',
            expires_at: new Date().toISOString(),
          })
          .eq('id', subData.id);

        if (updateError) {
          console.error('Database error:', updateError);
          return new Response('Database error', { status: 500 });
        }

        console.log(`Subscription deactivated for user ${subData.user_id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Find subscription by stripe_subscription_id
        const { data: subData, error: findError } = await supabaseAdmin
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (findError || !subData) {
          console.error('Subscription not found:', findError);
          break;
        }

        // Update subscription status and expiration
        const status = subscription.status === 'active' ? 'active' : 'inactive';
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status,
            expires_at: expiresAt,
          })
          .eq('id', subData.id);

        if (updateError) {
          console.error('Database error:', updateError);
          return new Response('Database error', { status: 500 });
        }

        console.log(`Subscription updated for user ${subData.user_id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'stripe-signature, content-type',
      },
    });
  } catch (error) {
    console.error('[stripe-webhook] Webhook error:', error);
    console.error('[stripe-webhook] Error details:', JSON.stringify(error, null, 2));
    return new Response(
      JSON.stringify({ error: 'Webhook error', details: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

