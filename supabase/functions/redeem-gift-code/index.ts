/**
 * Edge Function: redeem-gift-code
 * 
 * Permet à un utilisateur authentifié d'utiliser un code cadeau
 * pour activer son abonnement.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier la méthode
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer le token d'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parser le body
    const { code } = await req.json()
    
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'MISSING_CODE',
          message: 'Le code est requis' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Client avec le token de l'utilisateur pour vérifier l'auth
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Vérifier l'utilisateur
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      console.error('[redeem-gift-code] Auth error:', userError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Session expirée. Veuillez vous reconnecter.' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[redeem-gift-code] User ${user.id} attempting to redeem code: ${code.substring(0, 4)}***`)

    // Client avec service_role pour appeler la fonction RPC
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Appeler la fonction RPC pour redemption
    const { data, error } = await supabaseAdmin.rpc('redeem_gift_code', {
      p_code: code.trim(),
      p_user_id: user.id
    })

    if (error) {
      console.error('[redeem-gift-code] RPC error:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'SERVER_ERROR',
          message: 'Erreur serveur. Veuillez réessayer.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[redeem-gift-code] Result for user ${user.id}:`, data)

    // La fonction RPC retourne déjà un objet JSON avec success, error, message
    return new Response(
      JSON.stringify(data),
      { 
        status: data.success ? 200 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (err) {
    console.error('[redeem-gift-code] Unexpected error:', err)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'SERVER_ERROR',
        message: 'Erreur inattendue. Veuillez réessayer.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

