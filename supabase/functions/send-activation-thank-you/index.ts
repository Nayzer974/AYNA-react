/**
 * Edge Function: send-activation-thank-you
 * 
 * Envoie un email de remerciement stylisé après activation du compte
 * 
 * Modes:
 * - single: Envoie à un seul utilisateur (nouveau)
 * - bulk: Envoie à tous les utilisateurs actifs qui n'ont pas reçu l'email
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@nurayna.com';
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') || 'AYNA';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface EmailParams {
  email: string;
  name?: string;
  activationDate: string;
  expirationDate: string | null;
  language?: string;
}

function formatDate(dateStr: string | null, lang: string = 'fr'): string {
  if (!dateStr) {
    return lang === 'fr' ? 'Illimité (à vie)' : 
           lang === 'ar' ? 'غير محدود (مدى الحياة)' : 
           'Unlimited (lifetime)';
  }
  
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-SA' : 'en-US';
  return date.toLocaleDateString(locale, options);
}

function generateEmailHTML(params: EmailParams): string {
  const lang = params.language || 'fr';
  const name = params.name;
  const activationFormatted = formatDate(params.activationDate, lang);
  const expirationFormatted = formatDate(params.expirationDate, lang);
  const isLifetime = !params.expirationDate;

  // Textes selon la langue
  const texts: Record<string, any> = {
    fr: {
      greeting: name ? `Assalamu alaykum ${name},` : 'Assalamu alaykum,',
      thankYou: 'Merci pour votre confiance !',
      intro: 'Votre compte AYNA Premium est maintenant actif. Vous avez désormais accès à toutes les fonctionnalités avancées.',
      detailsTitle: 'Détails de votre abonnement',
      type: 'Type',
      typeValue: 'Premium',
      activationDate: 'Activation',
      expirationDate: isLifetime ? 'Durée' : 'Renouvellement',
      features: 'Vos avantages',
      feature1: 'Chat IA illimité avec AYNA',
      feature2: 'Analyses spirituelles avancées',
      feature3: 'Toutes les fonctionnalités premium',
      feature4: 'Support prioritaire',
      zakaatTitle: '🤲 Votre contribution fait la différence',
      zakaatText: 'Une partie de votre abonnement est reversée à des associations humanitaires sous forme de Zakaat.',
      closing: 'Qu\'Allah vous bénisse et vous guide.',
      signature: 'L\'équipe AYNA',
    },
    en: {
      greeting: name ? `Assalamu alaykum ${name},` : 'Assalamu alaykum,',
      thankYou: 'Thank you for your trust!',
      intro: 'Your AYNA Premium account is now active. You now have access to all advanced features.',
      detailsTitle: 'Your subscription details',
      type: 'Type',
      typeValue: 'Premium',
      activationDate: 'Activation',
      expirationDate: isLifetime ? 'Duration' : 'Renewal',
      features: 'Your benefits',
      feature1: 'Unlimited AI chat with AYNA',
      feature2: 'Advanced spiritual analyses',
      feature3: 'All premium features',
      feature4: 'Priority support',
      zakaatTitle: '🤲 Your contribution makes a difference',
      zakaatText: 'Part of your subscription is donated to humanitarian organizations as Zakaat.',
      closing: 'May Allah bless you and guide you.',
      signature: 'The AYNA Team',
    },
    ar: {
      greeting: name ? `السلام عليكم ${name}،` : 'السلام عليكم،',
      thankYou: 'شكرًا لثقتك!',
      intro: 'حسابك AYNA Premium نشط الآن. لديك الآن حق الوصول إلى جميع الميزات المتقدمة.',
      detailsTitle: 'تفاصيل اشتراكك',
      type: 'النوع',
      typeValue: 'بريميوم',
      activationDate: 'التفعيل',
      expirationDate: isLifetime ? 'المدة' : 'التجديد',
      features: 'مزاياك',
      feature1: 'دردشة ذكاء اصطناعي غير محدودة',
      feature2: 'تحليلات روحية متقدمة',
      feature3: 'جميع ميزات بريميوم',
      feature4: 'دعم ذو أولوية',
      zakaatTitle: '🤲 مساهمتك تُحدث فرقًا',
      zakaatText: 'يتم التبرع بجزء من اشتراكك للمنظمات الإنسانية كزكاة.',
      closing: 'بارك الله فيك وهداك.',
      signature: 'فريق AYNA',
    },
  };

  const t = texts[lang] || texts.fr;
  const isRTL = lang === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AYNA Premium</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0a0f1a 0%,#1a1f2e 100%);min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" style="max-width:560px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:30px;">
              <div style="width:70px;height:70px;background:linear-gradient(135deg,#c9a227,#f4d03f);border-radius:50%;text-align:center;line-height:70px;font-size:32px;margin-bottom:12px;">🌙</div>
              <div style="color:#c9a227;font-size:26px;font-weight:bold;letter-spacing:4px;">AYNA</div>
              <div style="color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:2px;margin-top:6px;">PREMIUM ACTIVATED</div>
            </td>
          </tr>
          
          <!-- Card -->
          <tr>
            <td>
              <table width="100%" style="background:rgba(25,30,45,0.95);border-radius:20px;border:1px solid rgba(201,162,39,0.2);">
                <tr>
                  <td style="padding:35px;text-align:${textAlign};">
                    
                    <!-- Greeting -->
                    <div style="color:#fff;font-size:17px;margin-bottom:6px;">${t.greeting}</div>
                    <div style="color:#c9a227;font-size:22px;font-weight:bold;margin-bottom:20px;">${t.thankYou}</div>
                    <div style="color:rgba(255,255,255,0.8);font-size:14px;line-height:1.6;margin-bottom:28px;">${t.intro}</div>
                    
                    <!-- Details Box -->
                    <table width="100%" style="background:rgba(201,162,39,0.08);border:1px solid rgba(201,162,39,0.2);border-radius:14px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:20px;">
                          <div style="color:#c9a227;font-size:12px;font-weight:bold;letter-spacing:1px;margin-bottom:16px;text-transform:uppercase;">${t.detailsTitle}</div>
                          
                          <table width="100%">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:13px;">${t.type}</td>
                              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);color:#c9a227;font-size:13px;font-weight:bold;text-align:${isRTL ? 'left' : 'right'};">${t.typeValue}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:13px;">${t.activationDate}</td>
                              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);color:#fff;font-size:13px;text-align:${isRTL ? 'left' : 'right'};">${activationFormatted}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;color:rgba(255,255,255,0.6);font-size:13px;">${t.expirationDate}</td>
                              <td style="padding:10px 0;color:${isLifetime ? '#22c55e' : '#fff'};font-size:13px;font-weight:${isLifetime ? 'bold' : 'normal'};text-align:${isRTL ? 'left' : 'right'};">${expirationFormatted}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Features -->
                    <div style="color:#fff;font-size:15px;font-weight:bold;margin-bottom:14px;">${t.features}</div>
                    <table width="100%" style="margin-bottom:24px;">
                      <tr><td style="padding:6px 0;color:rgba(255,255,255,0.85);font-size:13px;"><span style="color:#c9a227;margin-${isRTL ? 'left' : 'right'}:10px;">✦</span>${t.feature1}</td></tr>
                      <tr><td style="padding:6px 0;color:rgba(255,255,255,0.85);font-size:13px;"><span style="color:#c9a227;margin-${isRTL ? 'left' : 'right'}:10px;">✦</span>${t.feature2}</td></tr>
                      <tr><td style="padding:6px 0;color:rgba(255,255,255,0.85);font-size:13px;"><span style="color:#c9a227;margin-${isRTL ? 'left' : 'right'}:10px;">✦</span>${t.feature3}</td></tr>
                      <tr><td style="padding:6px 0;color:rgba(255,255,255,0.85);font-size:13px;"><span style="color:#c9a227;margin-${isRTL ? 'left' : 'right'}:10px;">✦</span>${t.feature4}</td></tr>
                    </table>
                    
                    <!-- Zakaat -->
                    <table width="100%" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:10px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px;">
                          <div style="color:#22c55e;font-size:13px;font-weight:bold;margin-bottom:8px;">${t.zakaatTitle}</div>
                          <div style="color:rgba(255,255,255,0.7);font-size:12px;line-height:1.5;">${t.zakaatText}</div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Closing -->
                    <div style="color:rgba(255,255,255,0.8);font-size:14px;font-style:italic;margin-bottom:6px;">${t.closing}</div>
                    <div style="color:#c9a227;font-size:14px;font-weight:bold;margin-top:20px;">${t.signature}</div>
                    
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <div style="color:rgba(255,255,255,0.3);font-size:11px;">© ${new Date().getFullYear()} AYNA. All rights reserved.</div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  if (!BREVO_API_KEY) {
    console.error('[send-activation-thank-you] BREVO_API_KEY not configured');
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  const lang = params.language || 'fr';
  const subjects: Record<string, string> = {
    fr: 'Bienvenue dans AYNA Premium 🌙',
    en: 'Welcome to AYNA Premium 🌙',
    ar: 'مرحبًا بك في AYNA Premium 🌙',
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: params.email, name: params.name || undefined }],
        subject: subjects[lang] || subjects.fr,
        htmlContent: generateEmailHTML(params),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[send-activation-thank-you] Brevo error:', errorText);
      return { success: false, error: errorText };
    }

    console.log('[send-activation-thank-you] ✅ Email sent to:', params.email);
    return { success: true };
  } catch (err: any) {
    console.error('[send-activation-thank-you] Error:', err);
    return { success: false, error: err.message };
  }
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { mode = 'single' } = body;

    // Mode BULK: Envoyer à tous les utilisateurs actifs
    if (mode === 'bulk') {
      console.log('[send-activation-thank-you] Starting BULK mode...');
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Récupérer tous les utilisateurs avec abonnement actif
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id, expires_at, created_at')
        .eq('status', 'active');

      if (subError) {
        console.error('[send-activation-thank-you] Error fetching subscriptions:', subError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch subscriptions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!subscriptions || subscriptions.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No active subscriptions found', sent: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[send-activation-thank-you] Found ${subscriptions.length} active subscriptions`);

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const sub of subscriptions) {
        // Récupérer les infos utilisateur
        const { data: userData } = await supabase
          .from('users')
          .select('name, email, language')
          .eq('id', sub.user_id)
          .single();

        // Aussi essayer auth.users pour l'email
        const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id);

        const email = userData?.email || authUser?.user?.email;
        const name = userData?.name;
        const language = userData?.language || 'fr';

        if (!email) {
          console.log(`[send-activation-thank-you] No email for user ${sub.user_id}, skipping`);
          failed++;
          continue;
        }

        // Envoyer l'email
        const result = await sendEmail({
          email,
          name,
          activationDate: sub.created_at,
          expirationDate: sub.expires_at,
          language,
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`${email}: ${result.error}`);
        }

        // Pause de 100ms entre chaque email pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`[send-activation-thank-you] BULK complete: ${sent} sent, ${failed} failed`);

      return new Response(
        JSON.stringify({ 
          message: 'Bulk send complete', 
          total: subscriptions.length,
          sent, 
          failed,
          errors: errors.slice(0, 10) // Limiter les erreurs retournées
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode SINGLE: Envoyer à un seul utilisateur
    const { email, name, activationDate, expirationDate, language } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendEmail({
      email,
      name,
      activationDate: activationDate || new Date().toISOString(),
      expirationDate: expirationDate || null,
      language: language || 'fr',
    });

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (err: any) {
    console.error('[send-activation-thank-you] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
