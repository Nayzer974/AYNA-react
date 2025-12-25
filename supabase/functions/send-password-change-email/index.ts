// Edge Function Supabase pour envoyer des emails de changement de mot de passe via Brevo
// Utilise un lien de confirmation sécurisé avec token

// @ts-ignore - Deno types are available at runtime in Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordChangeRequest {
  userEmail: string;
  userName?: string;
  userId?: string;
  changeType: 'forgot' | 'settings'; // 'forgot' = mot de passe oublié, 'settings' = changement depuis paramètres
}

serve(async (req: Request) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[send-password-change-email] Requête reçue:', req.method);

  try {
    // Récupérer la clé API Brevo depuis les variables d'environnement
    // @ts-ignore - Deno est disponible dans l'environnement Edge Functions
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

    // Récupérer les variables Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuration Supabase manquante' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérifier que la requête contient du JSON
    let requestData: PasswordChangeRequest;
    try {
      const requestBody = await req.text();
      if (!requestBody || !requestBody.trim()) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Le corps de la requête est vide' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      requestData = JSON.parse(requestBody);
    } catch (parseError: any) {
      console.error('Erreur parsing JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Format JSON invalide dans la requête: ' + (parseError?.message || 'Erreur inconnue')
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Valider les données
    if (!requestData.userEmail || !requestData.userEmail.trim()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'L\'email est requis' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!requestData.changeType || !['forgot', 'settings'].includes(requestData.changeType)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Le type de changement est requis et doit être "forgot" ou "settings"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Créer un client Supabase avec la clé service_role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Construire l'URL de redirection correcte
    // Supabase attend une URL complète pour le redirectTo
    const baseUrl = supabaseUrl.replace('/rest/v1', '').replace('/functions/v1', '');
    const redirectTo = `ayna://auth/change-password`;

    // Générer un lien de réinitialisation de mot de passe via Supabase
    // Note: generateLink peut échouer si l'email n'existe pas, mais on ne veut pas le révéler
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: requestData.userEmail,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (error) {
      console.error('Erreur génération lien:', error);
      console.error('Détails erreur:', JSON.stringify(error, null, 2));
      
      // Si l'email n'existe pas, generateLink peut retourner une erreur
      // Pour des raisons de sécurité, on retourne toujours un succès
      // mais on ne révèle pas si l'email existe ou non
      const errorMessage = error.message || '';
      
      // Si l'erreur indique que l'utilisateur n'existe pas, on retourne un succès factice
      if (errorMessage.includes('User not found') || 
          errorMessage.includes('No user found') ||
          errorMessage.includes('does not exist')) {
        // Retourner un succès pour ne pas révéler que l'email n'existe pas
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Si cet email existe dans notre système, un lien de réinitialisation sera envoyé.'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || 'Erreur lors de la génération du lien de réinitialisation'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!data) {
      console.error('Aucune donnée retournée par generateLink');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucune donnée retournée lors de la génération du lien' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construire l'URL de réinitialisation
    // Utiliser le lien généré par Supabase qui contient le token
    let recoveryLink = '';
    
    if (data.properties?.action_link) {
      // Si Supabase fournit un action_link, l'utiliser directement
      recoveryLink = data.properties.action_link;
    } else if (data.properties?.hashed_token) {
      // Sinon, construire le deep link avec le token
      recoveryLink = `ayna://auth/change-password?token=${encodeURIComponent(data.properties.hashed_token)}&type=recovery`;
    } else {
      // Si aucun lien n'est disponible, retourner une erreur
      console.error('Aucun lien de réinitialisation généré:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Impossible de générer le lien de réinitialisation. Vérifiez que l\'email existe dans votre base de données.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!recoveryLink || !recoveryLink.trim()) {
      console.error('Lien de réinitialisation vide');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Le lien de réinitialisation est vide' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construire le contenu HTML de l'email
    const isForgot = requestData.changeType === 'forgot';
    const title = isForgot ? 'Réinitialisation de votre mot de passe' : 'Changement de votre mot de passe';
    const subtitle = isForgot 
      ? 'Vous avez demandé à réinitialiser votre mot de passe pour votre compte AYNA.'
      : 'Vous avez demandé à changer votre mot de passe depuis les paramètres de votre compte AYNA.';
    const buttonText = isForgot ? 'Réinitialiser mon mot de passe' : 'Changer mon mot de passe';
    const userName = requestData.userName || 'Utilisateur';
    const currentDate = new Date().toLocaleString('fr-FR', { 
      dateStyle: 'full', 
      timeStyle: 'long',
      timeZone: 'Europe/Paris'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - AYNA</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            background-color: #f3f4f6;
            padding: 20px;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #0A0F2C 0%, #1a1f3a 100%);
            color: white; 
            padding: 40px 25px;
            text-align: center;
          }
          .header-icon {
            font-size: 64px;
            margin-bottom: 15px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 26px; 
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .content { 
            padding: 40px 30px;
          }
          .greeting {
            font-size: 16px;
            color: #374151;
            margin-bottom: 20px;
            line-height: 1.8;
          }
          .message-box {
            background: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            color: #374151;
            font-size: 15px;
            line-height: 1.8;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .link-fallback {
            margin-top: 20px;
            padding: 15px;
            background: #f3f4f6;
            border-radius: 8px;
            word-break: break-all;
            font-size: 12px;
            color: #6b7280;
            font-family: monospace;
          }
          .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin: 25px 0;
            color: #92400e;
            font-size: 14px;
          }
          .footer { 
            background: #f9fafb;
            text-align: center; 
            color: #6b7280; 
            font-size: 12px; 
            padding: 25px;
            border-top: 1px solid #e5e7eb;
          }
          .footer-logo {
            font-size: 18px;
            font-weight: 700;
            color: #0A0F2C;
            margin-bottom: 8px;
          }
          .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e5e7eb, transparent);
            margin: 20px 0;
          }
          @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .content { padding: 30px 20px; }
            .button { padding: 14px 28px; font-size: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-icon">🔐</div>
            <h1>${title}</h1>
            <p>Application AYNA</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <p>Bonjour <strong>${userName}</strong>,</p>
              <p>${subtitle}</p>
            </div>
            
            <div class="message-box">
              <p>Pour ${isForgot ? 'réinitialiser' : 'changer'} votre mot de passe, cliquez sur le bouton ci-dessous. Ce lien est valide pendant <strong>1 heure</strong>.</p>
            </div>
            
            <div class="button-container">
              <a href="${recoveryLink}" class="button">${buttonText}</a>
            </div>
            
            <div class="link-fallback">
              <strong>Si le bouton ne fonctionne pas, copiez ce lien :</strong><br>
              ${recoveryLink}
            </div>
            
            <div class="warning-box">
              <strong>⚠️ Important :</strong> Si vous n'avez pas demandé ce changement, ignorez cet email. Votre mot de passe ne sera pas modifié.
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
              <p><strong>Date de la demande :</strong> ${currentDate}</p>
              <p style="margin-top: 8px;"><strong>Email concerné :</strong> ${requestData.userEmail}</p>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-logo">AYNA</div>
            <p style="margin: 8px 0;">Application de spiritualité musulmane</p>
            <p style="margin: 4px 0; color: #9ca3af;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <div class="divider"></div>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">© ${new Date().getFullYear()} AYNA - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
═══════════════════════════════════════════════════════════
  ${title.toUpperCase()} - APPLICATION AYNA
═══════════════════════════════════════════════════════════

Bonjour ${userName},

${subtitle}

Pour ${isForgot ? 'réinitialiser' : 'changer'} votre mot de passe, cliquez sur le lien ci-dessous ou copiez-le dans votre navigateur :

${recoveryLink}

⚠️ IMPORTANT :
- Ce lien est valide pendant 1 heure
- Si vous n'avez pas demandé ce changement, ignorez cet email
- Votre mot de passe ne sera pas modifié si vous n'utilisez pas ce lien

Date de la demande : ${currentDate}
Email concerné : ${requestData.userEmail}

═══════════════════════════════════════════════════════════
© ${new Date().getFullYear()} AYNA - Application de spiritualité musulmane
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
═══════════════════════════════════════════════════════════
    `.trim();

    // Préparer le payload pour l'API Brevo
    const brevoPayload: any = {
      sender: {
        name: 'AYNA - Sécurité',
        email: 'noreply@nurayna.com',
      },
      to: [
        { email: requestData.userEmail }
      ],
      subject: `${title} - AYNA`,
      htmlContent: htmlContent,
      textContent: textContent,
      tags: ['password_change', requestData.changeType],
    };

    console.log('[send-password-change-email] Envoi de l\'email via Brevo à:', requestData.userEmail);
    console.log('[send-password-change-email] Lien de réinitialisation:', recoveryLink);

    // Appeler l'API Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify(brevoPayload),
    });

    console.log('[send-password-change-email] Réponse Brevo status:', brevoResponse.status);

    let brevoData: any;
    try {
      const brevoText = await brevoResponse.text();
      if (brevoText) {
        brevoData = JSON.parse(brevoText);
      } else {
        brevoData = {};
      }
    } catch (parseError) {
      console.error('Erreur parsing réponse Brevo:', parseError);
      brevoData = { message: 'Erreur lors de la lecture de la réponse Brevo' };
    }

    if (!brevoResponse.ok) {
      console.error('[send-password-change-email] Erreur Brevo API:', {
        status: brevoResponse.status,
        statusText: brevoResponse.statusText,
        data: brevoData
      });
      
      let errorMessage = `Erreur Brevo: ${brevoResponse.status}`;
      if (brevoData?.message) {
        errorMessage = brevoData.message;
      } else if (brevoData?.error) {
        errorMessage = brevoData.error;
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          details: brevoData
        }),
        { 
          status: brevoResponse.status >= 400 && brevoResponse.status < 500 ? brevoResponse.status : 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[send-password-change-email] Email envoyé avec succès via Brevo');
    console.log('[send-password-change-email] Message ID:', brevoData.messageId || brevoData.id);

    // Succès
    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: brevoData.messageId || brevoData.id,
        recoveryLink: recoveryLink, // Pour le debug, ne pas exposer en production
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

