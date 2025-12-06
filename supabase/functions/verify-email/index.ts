// Supabase Edge Function pour vérifier l'email de manière sécurisée
// Cette fonction utilise la clé service_role qui reste sur le serveur

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer les variables d'environnement (configurées dans Supabase Dashboard)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuration manquante. Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Créer un client Supabase avec la clé service_role (seulement côté serveur)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Récupérer les paramètres de la requête
    const { token, token_hash, type, type_hash } = await req.json();

    if (!token && !token_hash) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token manquant' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérifier l'email avec Supabase
    let verifyResponse;
    
    if (token_hash && type_hash) {
      // Méthode recommandée avec token_hash (PKCE flow)
      verifyResponse = await supabase.auth.verifyOtp({
        token_hash: token_hash,
        type: type_hash as any,
      });
    } else if (token && type) {
      // Méthode alternative avec token (fallback pour anciens liens)
      verifyResponse = await supabase.auth.verifyOtp({
        token: token,
        type: type as any,
      });
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token invalide' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (verifyResponse.error) {
      console.error('Erreur vérification email:', verifyResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: verifyResponse.error.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Succès
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: verifyResponse.data.user?.id,
          email: verifyResponse.data.user?.email,
          email_confirmed_at: verifyResponse.data.user?.email_confirmed_at,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Erreur Edge Function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Erreur serveur inattendue' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

