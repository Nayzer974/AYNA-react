// Edge Function Supabase pour envoyer des feedbacks (avis/bugs) avec images via Brevo
// Permet aux utilisateurs d'envoyer des feedbacks formatés avec des images

// @ts-ignore - Deno types are available at runtime in Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeedbackRequest {
  type: 'feedback' | 'bug';
  subject: string;
  message: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
  imageUrls?: string[]; // URLs des images uploadées dans Supabase Storage
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

    const feedbackData: FeedbackRequest = await req.json();

    // Valider les données
    if (!feedbackData.type || !['feedback', 'bug'].includes(feedbackData.type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Le type de feedback est requis et doit être "feedback" ou "bug"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!feedbackData.subject || !feedbackData.subject.trim()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Le sujet est requis' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!feedbackData.message || !feedbackData.message.trim()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Le message est requis' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construire le contenu HTML de l'email avec un design professionnel
    const typeLabel = feedbackData.type === 'bug' ? '🐛 Signalement de bug' : '💬 Avis/Feedback';
    const typeColor = feedbackData.type === 'bug' ? '#ef4444' : '#3b82f6';
    const typeBgColor = feedbackData.type === 'bug' ? '#fee2e2' : '#dbeafe';
    const userInfo = feedbackData.userName || feedbackData.userEmail || feedbackData.userId || 'Utilisateur anonyme';
    const userEmail = feedbackData.userEmail || 'Non fourni';
    const currentDate = new Date().toLocaleString('fr-FR', { 
      dateStyle: 'full', 
      timeStyle: 'long',
      timeZone: 'Europe/Paris'
    });
    
    let imagesHtml = '';
    if (feedbackData.imageUrls && feedbackData.imageUrls.length > 0) {
      imagesHtml = `
        <div style="margin-top: 30px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
          <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">📷</span>
            Images jointes (${feedbackData.imageUrls.length})
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${feedbackData.imageUrls.map((url, index) => `
              <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="background: #f9fafb; padding: 8px; border-bottom: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px; font-weight: 500;">Image ${index + 1}</p>
                </div>
                <a href="${url}" target="_blank" style="display: block; text-decoration: none;">
                  <img src="${url}" alt="Image ${index + 1}" style="width: 100%; height: auto; display: block; max-height: 300px; object-fit: cover;" />
                </a>
                <div style="padding: 10px; background: #f9fafb;">
                  <a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 11px; word-break: break-all; display: block;">Voir l'image complète</a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${typeLabel} - AYNA</title>
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
            max-width: 650px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #0A0F2C 0%, #1a1f3a 100%);
            color: white; 
            padding: 30px 25px;
            text-align: center;
          }
          .header-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .header-badge {
            display: inline-block;
            margin-top: 12px;
            padding: 6px 16px;
            background: ${typeBgColor};
            color: ${typeColor};
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
          }
          .content { 
            padding: 30px 25px;
          }
          .info-card { 
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          .info-row {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 14px;
          }
          .info-row:last-child {
            margin-bottom: 0;
          }
          .info-label {
            font-weight: 600;
            color: #1e40af;
            min-width: 120px;
            display: inline-block;
          }
          .info-value {
            color: #1f2937;
            flex: 1;
          }
          .subject-box { 
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .subject-box h2 {
            color: #0A0F2C;
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 15px 0;
            padding-bottom: 15px;
            border-bottom: 2px solid #f3f4f6;
          }
          .message-box { 
            background: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            white-space: pre-wrap;
            color: #374151;
            font-size: 15px;
            line-height: 1.8;
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
            margin: 25px 0;
          }
          @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .content { padding: 20px 15px; }
            .info-row { flex-direction: column; align-items: flex-start; }
            .info-label { min-width: auto; margin-bottom: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-icon">${feedbackData.type === 'bug' ? '🐛' : '💬'}</div>
            <h1>${typeLabel}</h1>
            <div class="header-badge">${feedbackData.type === 'bug' ? 'URGENT' : 'FEEDBACK'}</div>
          </div>
          
          <div class="content">
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">👤 Utilisateur:</span>
                <span class="info-value">${userInfo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📧 Email:</span>
                <span class="info-value">${userEmail}</span>
              </div>
              ${feedbackData.userId ? `
              <div class="info-row">
                <span class="info-label">🆔 ID Utilisateur:</span>
                <span class="info-value" style="font-family: monospace; font-size: 12px;">${feedbackData.userId}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">📅 Date:</span>
                <span class="info-value">${currentDate}</span>
              </div>
            </div>
            
            <div class="subject-box">
              <h2>${feedbackData.subject}</h2>
            </div>
            
            <div class="message-box">
              ${feedbackData.message.replace(/\n/g, '<br>')}
            </div>
            
            ${imagesHtml}
          </div>
          
          <div class="footer">
            <div class="footer-logo">AYNA</div>
            <p style="margin: 8px 0;">Ce message a été envoyé depuis l'application mobile AYNA</p>
            <p style="margin: 4px 0; color: #9ca3af;">Une réponse vous sera envoyée par email dans les 24 heures</p>
            <div class="divider"></div>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">© ${new Date().getFullYear()} AYNA - Application de spiritualité musulmane</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
═══════════════════════════════════════════════════════════
  ${typeLabel.toUpperCase()} - APPLICATION AYNA
═══════════════════════════════════════════════════════════

📋 INFORMATIONS UTILISATEUR
───────────────────────────────────────────────────────────
👤 Utilisateur: ${userInfo}
📧 Email: ${userEmail}
${feedbackData.userId ? `🆔 ID Utilisateur: ${feedbackData.userId}\n` : ''}📅 Date: ${currentDate}

📝 CONTENU DU MESSAGE
───────────────────────────────────────────────────────────
Sujet: ${feedbackData.subject}

Message:
${feedbackData.message}

${feedbackData.imageUrls && feedbackData.imageUrls.length > 0 ? `\n📷 IMAGES JOINTES (${feedbackData.imageUrls.length})\n───────────────────────────────────────────────────────────\n${feedbackData.imageUrls.map((url, i) => `  ${i + 1}. ${url}`).join('\n')}\n` : ''}

═══════════════════════════════════════════════════════════
Ce message a été envoyé depuis l'application mobile AYNA
Vous pouvez répondre directement à cet email pour contacter l'utilisateur
© ${new Date().getFullYear()} AYNA - Application de spiritualité musulmane
═══════════════════════════════════════════════════════════
    `.trim();

    // Préparer le payload pour l'API Brevo
    const brevoPayload: any = {
      sender: {
        name: 'AYNA Feedback',
        email: 'noreply@nurayna.com',
      },
      to: [
        { email: 'pro.ibrahima00@gmail.com' }
      ],
      subject: `[AYNA ${feedbackData.type === 'bug' ? 'BUG' : 'FEEDBACK'}] ${feedbackData.subject}`,
      htmlContent: htmlContent,
      textContent: textContent,
      replyTo: feedbackData.userEmail ? { email: feedbackData.userEmail } : undefined,
      tags: ['feedback', feedbackData.type],
    };

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

