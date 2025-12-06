// Supabase Edge Function pour réinitialiser le mot de passe de manière sécurisée
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
    const { token, token_hash, type, type_hash, password } = await req.json();

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Le mot de passe doit contenir au moins 6 caractères' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    // Vérifier le token et réinitialiser le mot de passe
    let verifyResponse;
    
    if (token_hash && type_hash) {
      // Méthode recommandée avec token_hash (PKCE flow)
      verifyResponse = await supabase.auth.verifyOtp({
        token_hash: token_hash,
        type: type_hash as any,
      });
    } else if (token) {
      // Méthode alternative avec token (fallback pour anciens liens)
      verifyResponse = await supabase.auth.verifyOtp({
        token: token,
        type: type || 'recovery',
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
      console.error('Erreur vérification token:', verifyResponse.error);
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

    // Si le token est valide, mettre à jour le mot de passe
    // Note: Supabase met automatiquement à jour le mot de passe après vérification du token
    // Mais on peut aussi le faire explicitement si nécessaire
    const userId = verifyResponse.data.user?.id;
    if (userId) {
      // Mettre à jour le mot de passe
      const updateResponse = await supabase.auth.admin.updateUserById(
        userId,
        { password: password }
      );

      if (updateResponse.error) {
        console.error('Erreur mise à jour mot de passe:', updateResponse.error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: updateResponse.error.message 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Succès
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mot de passe réinitialisé avec succès'
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

