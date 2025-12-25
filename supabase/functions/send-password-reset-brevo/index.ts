// Edge Function Supabase pour envoyer un email de réinitialisation de mot de passe via Brevo

// @ts-ignore - Deno types are available at runtime in Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer les variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    
    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'BREVO_API_KEY n\'est pas configurée' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { email, redirectUrl, userName } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email manquant' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Créer un client Supabase admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier que l'utilisateur existe
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erreur lors de la vérification de l\'utilisateur' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Ne pas révéler que l'utilisateur n'existe pas (sécurité)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Si cet email existe, un lien de réinitialisation a été envoyé.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Générer un lien de réinitialisation
    const finalRedirectUrl = redirectUrl || 'https://www.nurayna.com/reset-password.html';
    
    const { data: generateData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: finalRedirectUrl,
      },
    });

    if (generateError) {
      console.error('Erreur génération lien:', generateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: generateError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Le lien de réinitialisation est dans generateData.properties.action_link
    const resetLink = generateData.properties?.action_link;

    if (!resetLink) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Impossible de générer le lien de réinitialisation' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Préparer l'email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de votre mot de passe - AYNA</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">AYNA</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Réinitialisation de votre mot de passe</h2>
          ${userName ? `<p>Bonjour ${userName},</p>` : '<p>Bonjour,</p>'}
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p>Ou copiez-collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Ce lien expirera dans 1 heure. Si vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet email.
          </p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Réinitialisation de votre mot de passe - AYNA
      
      ${userName ? `Bonjour ${userName},` : 'Bonjour,'}
      
      Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien suivant pour créer un nouveau mot de passe :
      
      ${resetLink}
      
      Ce lien expirera dans 1 heure. Si vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet email.
    `;

    // Envoyer l'email via Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'AYNA',
          email: 'noreply@nurayna.com',
        },
        to: [{ email: email }],
        subject: 'Réinitialisation de votre mot de passe - AYNA',
        htmlContent: htmlContent,
        textContent: textContent,
        tags: ['password-reset', 'security'],
      }),
    });

    const brevoData = await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error('Erreur Brevo API:', brevoData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: brevoData.message || `Erreur Brevo: ${brevoResponse.status}` 
        }),
        { 
          status: brevoResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Succès (ne pas révéler si l'email existe ou non)
    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: brevoData.messageId || brevoData.id,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
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






