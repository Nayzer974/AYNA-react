// Edge Function Supabase pour envoyer des emails via Brevo
// Permet d'utiliser Brevo pour l'envoi d'emails transactionnels

// @ts-ignore - Deno types are available at runtime in Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrevoEmailRequest {
  to: string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, any>;
  tags?: string[];
  replyTo?: string;
  from?: {
    name?: string;
    email: string;
  };
}

serve(async (req: Request) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    const requestData: BrevoEmailRequest = await req.json();

    // Valider les données
    if (!requestData.to || !Array.isArray(requestData.to) || requestData.to.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Le champ "to" est requis et doit être un tableau non vide' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!requestData.subject) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Le champ "subject" est requis' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Préparer le payload pour l'API Brevo
    const brevoPayload: any = {
      sender: requestData.from || {
        name: 'AYNA',
        email: 'noreply@nurayna.com',
      },
      to: requestData.to.map(email => ({ email })),
      subject: requestData.subject,
    };

    // Ajouter le contenu HTML si fourni
    if (requestData.htmlContent) {
      brevoPayload.htmlContent = requestData.htmlContent;
    }

    // Ajouter le contenu texte si fourni
    if (requestData.textContent) {
      brevoPayload.textContent = requestData.textContent;
    }

    // Utiliser un template si fourni
    if (requestData.templateId) {
      brevoPayload.templateId = requestData.templateId;
      if (requestData.params) {
        brevoPayload.params = requestData.params;
      }
    }

    // Ajouter les tags si fournis
    if (requestData.tags && requestData.tags.length > 0) {
      brevoPayload.tags = requestData.tags;
    }

    // Ajouter l'adresse de réponse si fournie
    if (requestData.replyTo) {
      brevoPayload.replyTo = { email: requestData.replyTo };
    }

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

    // Succès
    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: brevoData.messageId || brevoData.id,
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

