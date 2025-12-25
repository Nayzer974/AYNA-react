// Edge Function Supabase pour envoyer les données analytics par email via Brevo
// Permet aux utilisateurs d'exporter leurs données analytics par email

// @ts-ignore - Deno types are available at runtime in Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Fonction helper pour encoder en base64 dans Deno
function encodeBase64(str: string): string {
  // @ts-ignore - Deno est disponible dans l'environnement Edge Functions
  if (typeof btoa !== 'undefined') {
    // @ts-ignore
    return btoa(unescape(encodeURIComponent(str)));
  }
  // Fallback pour Deno
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // @ts-ignore
  return btoa(binary);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsExportRequest {
  userEmail: string;
  userName?: string;
  userId: string;
  format: 'json' | 'csv';
  data: any; // Les données analytics à exporter
}

serve(async (req: Request) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Try/catch global pour capturer toutes les erreurs
  try {
    // Log de la méthode et de l'URL pour diagnostic
    console.log('[send-analytics-export] Méthode:', req.method);
    console.log('[send-analytics-export] URL:', req.url);

    // Vérifier que c'est bien un POST
    if (req.method !== 'POST') {
      console.error('[send-analytics-export] Méthode non autorisée:', req.method);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Méthode non autorisée. Utilisez POST.' 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Récupérer la clé API Brevo depuis les variables d'environnement
    // @ts-ignore - Deno est disponible dans l'environnement Edge Functions
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    
    if (!brevoApiKey) {
      console.error('[send-analytics-export] BREVO_API_KEY non configurée');
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

    // Lire et parser le body
    let exportData: AnalyticsExportRequest;
    try {
      const bodyText = await req.text();
      console.log('[send-analytics-export] Body reçu (premiers 500 caractères):', bodyText.substring(0, 500));
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('[send-analytics-export] Body vide');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Le body de la requête est vide' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      exportData = JSON.parse(bodyText);
      console.log('[send-analytics-export] Body parsé:', {
        userEmail: exportData.userEmail,
        userName: exportData.userName,
        userId: exportData.userId,
        format: exportData.format,
        hasData: !!exportData.data
      });
    } catch (parseError: any) {
      console.error('[send-analytics-export] Erreur parsing JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erreur de parsing JSON: ${parseError.message}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Valider les données
    if (!exportData.userEmail || !exportData.userEmail.trim()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'L\'email de l\'utilisateur est requis' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!exportData.format || !['json', 'csv'].includes(exportData.format)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Le format doit être "json" ou "csv"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!exportData.data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Les données à exporter sont requises' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Préparer le contenu selon le format
    let fileContent: string;
    let fileName: string;
    
    if (exportData.format === 'json') {
      fileContent = JSON.stringify(exportData.data, null, 2);
      // Brevo n'accepte pas .json, on utilise .txt à la place (le contenu reste du JSON)
      fileName = `ayna_analytics_${exportData.userId}_${Date.now()}.txt`;
      console.log('[send-analytics-export] Fichier JSON créé avec extension .txt:', fileName);
    } else {
      // CSV - convertir les données en CSV
      fileContent = convertToCSV(exportData.data);
      fileName = `ayna_analytics_${exportData.userId}_${Date.now()}.csv`;
      console.log('[send-analytics-export] Fichier CSV créé:', fileName);
    }
    
    console.log('[send-analytics-export] Taille du fichier:', fileContent.length, 'caractères');

    // Encoder le fichier en base64 pour l'attacher à l'email
    const fileBase64 = encodeBase64(fileContent);

    // Construire le contenu HTML de l'email
    const userName = exportData.userName || exportData.userEmail.split('@')[0];
    const currentDate = new Date().toLocaleString('fr-FR', { 
      dateStyle: 'full', 
      timeStyle: 'long',
      timeZone: 'Europe/Paris'
    });
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export de vos données analytics - AYNA</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">📊 Export de vos données analytics</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Vous avez demandé l'export de vos données analytics au format <strong>${exportData.format.toUpperCase()}</strong>.
                Vos données sont jointes à cet email.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: 600;">
                  📅 Date d'export :
                </p>
                <p style="margin: 0; color: #666666; font-size: 14px;">
                  ${currentDate}
                </p>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>Note importante :</strong> Vos données sont confidentielles. Ne partagez ce fichier qu'avec des personnes de confiance.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px;">
                Cet email a été envoyé automatiquement depuis l'application AYNA.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} AYNA - Application spirituelle
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Préparer la requête pour Brevo API
    const brevoPayload = {
      sender: {
        name: 'AYNA',
        email: 'noreply@nurayna.com', // Remplacez par votre email d'expéditeur configuré dans Brevo
      },
      to: [
        {
          email: exportData.userEmail,
          name: userName,
        },
      ],
      subject: `📊 Export de vos données analytics - ${exportData.format.toUpperCase()}`,
      htmlContent: emailHtml,
      attachment: [
        {
          name: fileName,
          content: fileBase64,
        },
      ],
    };

    // Log avant envoi
    console.log('[send-analytics-export] Envoi à Brevo:', {
      to: exportData.userEmail,
      subject: brevoPayload.subject,
      fileName: fileName,
      fileSizeBase64: fileBase64.length,
      attachmentCount: brevoPayload.attachment.length
    });

    // Envoyer l'email via Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify(brevoPayload),
    });

    let brevoResult: any;
    try {
      brevoResult = await brevoResponse.json();
    } catch (parseError) {
      // Si la réponse n'est pas du JSON, lire le texte brut
      const errorText = await brevoResponse.text();
      console.error('[send-analytics-export] Erreur parsing Brevo response:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erreur API Brevo: ${brevoResponse.status} ${brevoResponse.statusText}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!brevoResponse.ok) {
      console.error('[send-analytics-export] Erreur Brevo:', brevoResult);
      const errorMessage = brevoResult?.message || brevoResult?.error || `Erreur ${brevoResponse.status}: ${brevoResponse.statusText}`;
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: brevoResult.messageId,
        message: 'Email envoyé avec succès' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('[send-analytics-export] Erreur:', error);
    const errorMessage = error?.message || error?.toString() || 'Erreur lors de l\'envoi de l\'email';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Convertit les données analytics en format CSV
 */
function convertToCSV(data: any): string {
  let csv = 'Date,Type,Catégorie,Description,Durée (min),Nombre,Score\n';
  
  // Si les données contiennent eventHistory
  if (data.eventHistory && Array.isArray(data.eventHistory)) {
    data.eventHistory.forEach((event: any) => {
      const date = event.date || new Date(event.timestamp).toISOString();
      const duration = event.duration ? Math.round(event.duration / 60) : '';
      const count = event.count || '';
      const score = event.score || '';
      
      csv += `"${date}","${event.type}","${event.category}","${event.description.replace(/"/g, '""')}","${duration}","${count}","${score}"\n`;
    });
  }
  
  // Ajouter les statistiques d'utilisation
  if (data.usageStats?.moduleStats) {
    csv += '\n\n=== STATISTIQUES D\'UTILISATION ===\n';
    csv += 'Module,Temps (heures),Sessions\n';
    
    Object.entries(data.usageStats.moduleStats).forEach(([module, stats]: [string, any]) => {
      const hours = (stats.totalTimeSeconds / 3600).toFixed(2);
      csv += `"${module}","${hours}","${stats.sessions}"\n`;
    });
  }
  
  return csv;
}

