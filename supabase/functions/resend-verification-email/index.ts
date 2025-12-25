// Edge Function Supabase pour renvoyer un email de vérification
// Permet d'envoyer l'email même si la session côté client est expirée

// @deno-types="https://deno.land/x/types/index.d.ts"
// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore - ESM import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore - Deno Request type
serve(async (req: Request) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer un client Supabase avec la clé service_role (seulement côté serveur)
    // @ts-ignore - Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore - Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email, redirectUrl } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email manquant' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérifier que l'utilisateur existe
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur lors de la vérification de l\'utilisateur' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const user = users.users.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun compte trouvé avec cet email' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérifier si l'email est déjà vérifié
    if (user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cet email est déjà vérifié' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Générer un token de confirmation et envoyer l'email
    const { data: generateData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: redirectUrl || 'https://www.nurayna.com/verify-email.html',
      },
    });

    if (generateError) {
      console.error('Erreur génération lien:', generateError);
      return new Response(
        JSON.stringify({ success: false, error: generateError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Le lien est généré, Supabase enverra automatiquement l'email
    // (si la configuration email est correcte)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email de vérification envoyé'
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

