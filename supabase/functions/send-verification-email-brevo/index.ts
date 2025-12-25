// Edge Function Supabase pour envoyer un email de vérification via Brevo
// Génère un token de vérification et l'envoie via Brevo

// Déclaration de type pour Deno (disponible à l'exécution dans Supabase Edge Functions)
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

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

    const { email, redirectUrl, userName, userId } = await req.json();

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

    // Créer un client Supabase admin pour générer le token
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Chercher l'utilisateur - utiliser userId si fourni, sinon chercher par email
    let user = null;
    const maxRetries = 5;
    let retryCount = 0;
    
    // Si userId est fourni, essayer de récupérer l'utilisateur directement par ID
    if (userId) {
      console.log(`[send-verification-email-brevo] Tentative de récupération de l'utilisateur par ID: ${userId}`);
      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (!getUserError && userData?.user) {
        user = userData.user;
        console.log(`[send-verification-email-brevo] Utilisateur trouvé par ID:`, user.id);
      } else {
        console.warn(`[send-verification-email-brevo] Utilisateur non trouvé par ID, erreur:`, getUserError);
      }
    }
    
    // Si l'utilisateur n'a pas été trouvé par ID, chercher par email avec retry
    if (!user) {
      console.log(`[send-verification-email-brevo] Recherche de l'utilisateur par email: ${email}`);
      
      while (!user && retryCount < maxRetries) {
        // Essayer de trouver l'utilisateur par email
        // Note: listUsers() peut être paginé, donc on cherche dans toutes les pages
        let page = 1;
        let hasMore = true;
        
        while (hasMore && !user) {
          const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers({
            page: page,
            perPage: 50, // Nombre max d'utilisateurs par page
          });
          
          if (userError) {
            console.error(`[send-verification-email-brevo] Erreur listUsers (page ${page}, tentative ${retryCount + 1}):`, userError);
            if (retryCount === maxRetries - 1) {
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
            break;
          } else {
            user = users.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
            
            // Si on a trouvé l'utilisateur ou s'il n'y a plus d'utilisateurs, arrêter
            if (user || users.users.length === 0) {
              hasMore = false;
            } else {
              page++;
            }
          }
        }
        
        if (!user && retryCount < maxRetries - 1) {
          console.log(`[send-verification-email-brevo] Utilisateur non trouvé (tentative ${retryCount + 1}/${maxRetries}), attente de 1 seconde...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
          retryCount++;
        } else {
          break;
        }
      }
    }
    
    if (!user) {
      console.error('[send-verification-email-brevo] Utilisateur non trouvé après toutes les tentatives');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun compte trouvé avec cet email. Veuillez réessayer dans quelques instants.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`[send-verification-email-brevo] Utilisateur trouvé:`, user.id, user.email);

    // Vérifier si l'email est déjà vérifié
    // TEMPORAIRE : Ne pas bloquer si l'email est déjà vérifié lors d'une inscription
    // L'utilisateur peut demander un nouvel email de vérification même si déjà vérifié
    // (pour les cas où l'email a été vérifié mais l'utilisateur veut renvoyer l'email)
    if (false && user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cet email est déjà vérifié' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Log pour debug
    if (user.email_confirmed_at) {
      console.log('[send-verification-email-brevo] Email déjà vérifié mais on continue quand même pour les tests');
    }

    // Générer un lien de confirmation
    // IMPORTANT : Utiliser 'signup' pour générer un lien même si l'utilisateur existe déjà
    // Cela génère un nouveau token de vérification pour l'utilisateur existant
    const finalRedirectUrl = redirectUrl || 'https://www.nurayna.com/verify-email.html';
    
    console.log('[send-verification-email-brevo] Génération du lien de vérification...');
    console.log('[send-verification-email-brevo] Email:', email);
    console.log('[send-verification-email-brevo] User ID:', user.id);
    console.log('[send-verification-email-brevo] Redirect URL:', finalRedirectUrl);
    
    let generateData: any = null;
    let generateError: any = null;
    
    // Première tentative - utiliser 'signup' pour générer un lien même si l'utilisateur existe
    // Cela fonctionne pour les utilisateurs existants et génère un nouveau token
    const firstAttempt = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: finalRedirectUrl,
      },
    });
    
    generateData = firstAttempt.data;
    generateError = firstAttempt.error;
    
    console.log('[send-verification-email-brevo] Résultat generateLink:', {
      hasData: !!generateData,
      hasError: !!generateError,
      errorMessage: generateError?.message,
    });

    // Gérer les erreurs de generateLink
    if (generateError) {
      const errorMessage = generateError.message?.toLowerCase() || '';
      console.error('[send-verification-email-brevo] Erreur generateLink:', generateError);
      
      // Si l'erreur est "already registered", c'est normal - l'utilisateur existe déjà
      // On peut quand même générer un lien de vérification en utilisant 'recovery' ou 'magiclink'
      if (errorMessage.includes('already registered') || 
          errorMessage.includes('user already exists') ||
          errorMessage.includes('email already')) {
        console.log('[send-verification-email-brevo] Utilisateur existe déjà, tentative avec type "magiclink"...');
        
        // Essayer avec 'magiclink' qui fonctionne pour les utilisateurs existants
        const magicLinkAttempt = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: finalRedirectUrl,
          },
        });
        
        if (!magicLinkAttempt.error && magicLinkAttempt.data) {
          console.log('[send-verification-email-brevo] Lien généré avec succès via magiclink');
          generateData = magicLinkAttempt.data;
          generateError = null;
        } else {
          console.warn('[send-verification-email-brevo] Erreur avec magiclink, tentative avec recovery...');
          
          // Essayer avec 'recovery' comme dernier recours
          const recoveryAttempt = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
              redirectTo: finalRedirectUrl,
            },
          });
          
          if (!recoveryAttempt.error && recoveryAttempt.data) {
            console.log('[send-verification-email-brevo] Lien généré avec succès via recovery');
            generateData = recoveryAttempt.data;
            generateError = null;
          } else {
            console.error('[send-verification-email-brevo] Impossible de générer un lien avec toutes les méthodes');
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Impossible de générer un lien de vérification. Veuillez réessayer plus tard.' 
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }
      } else if (errorMessage.includes('rate limit') || 
          errorMessage.includes('too many') ||
          errorMessage.includes('429')) {
        console.warn('[send-verification-email-brevo] Rate limit détecté, réessai après 2 secondes...');
        
        // Attendre 2 secondes avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Réessayer une fois
        const retryAttempt = await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email: email,
          options: {
            redirectTo: finalRedirectUrl,
          },
        });
        
        if (retryAttempt.error) {
          console.error('[send-verification-email-brevo] Erreur après retry:', retryAttempt.error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' 
            }),
            { 
              status: 429, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          // Utiliser les données du retry
          generateData = retryAttempt.data;
          generateError = null;
        }
      } else {
        // Autre erreur
        console.error('[send-verification-email-brevo] Erreur inconnue:', generateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: generateError.message || 'Erreur lors de la génération du lien de vérification' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Le lien de vérification est dans generateData.properties.action_link
    let verificationLink = generateData?.properties?.action_link;

    if (!verificationLink) {
      console.error('[send-verification-email-brevo] Impossible de générer le lien de vérification');
      
      // Essayer une dernière fois après un délai plus long (5 secondes)
      console.log('[send-verification-email-brevo] Dernière tentative après 5 secondes...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const finalAttempt = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          redirectTo: finalRedirectUrl,
        },
      });
      
      if (finalAttempt.error || !finalAttempt.data?.properties?.action_link) {
        console.error('[send-verification-email-brevo] Échec final de génération du lien');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Impossible de générer le lien de vérification. Veuillez réessayer plus tard.' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Utiliser le lien de la dernière tentative
      verificationLink = finalAttempt.data.properties.action_link;
      console.log('[send-verification-email-brevo] Lien généré avec succès après retry');
    }

    // Préparer l'email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérification de votre email - AYNA</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">AYNA</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Vérification de votre email</h2>
          ${userName ? `<p>Bonjour ${userName},</p>` : '<p>Bonjour,</p>'}
          <p>Merci de vous être inscrit sur AYNA. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Vérifier mon email
            </a>
          </div>
          <p>Ou copiez-collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Si vous n'avez pas créé de compte sur AYNA, vous pouvez ignorer cet email.
          </p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Vérification de votre email - AYNA
      
      ${userName ? `Bonjour ${userName},` : 'Bonjour,'}
      
      Merci de vous être inscrit sur AYNA. Pour activer votre compte, veuillez cliquer sur le lien suivant :
      
      ${verificationLink}
      
      Si vous n'avez pas créé de compte sur AYNA, vous pouvez ignorer cet email.
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
        subject: 'Vérification de votre email - AYNA',
        htmlContent: htmlContent,
        textContent: textContent,
        tags: ['verification', 'signup'],
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

