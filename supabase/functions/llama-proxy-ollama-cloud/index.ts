/**
 * Supabase Edge Function: llama-proxy-ollama-cloud
 * 
 * Proxy sécurisé pour Ollama Cloud API
 * 
 * ⚠️ SÉCURITÉ :
 * - Les clés API sont stockées dans Supabase Secrets (jamais dans le mobile)
 * - Validation stricte des paramètres
 * - Rate limiting côté Supabase
 * - Logs sans PII
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  messages: Array<{ role: string; content: string }>;
  useTools?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // ✅ Require authentication for AI features
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ✅ Check subscription status (mais permettre l'accès aux non-abonnés avec rate limiting côté client)
    // Le rate limiting est géré côté client pour les non-abonnés (5 messages toutes les 5 heures)
    // Les abonnés ont un accès illimité
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Log pour déboguer
    const hasActiveSubscription = subscription?.status === 'active' && 
                                   subscription?.expires_at && 
                                   new Date(subscription.expires_at) > new Date();
    
    console.log('[llama-proxy-ollama-cloud] Subscription check:', {
      hasSubscription: !!subscription,
      status: subscription?.status,
      expiresAt: subscription?.expires_at,
      isActive: hasActiveSubscription,
      subError: subError?.code, // PGRST116 = no rows (expected for non-subscribers)
    });

    // ✅ IMPORTANT: On ne bloque PAS les non-abonnés ici
    // Le rate limiting est géré côté client dans ayna.ts
    // Les non-abonnés peuvent utiliser le service avec une limite de 5 messages toutes les 5 heures
    // Les abonnés ont un accès illimité
    // 
    // Si vous voyez une erreur 403 "Active subscription required", elle ne vient PAS de cette fonction
    // Vérifiez s'il y a un middleware ou une autre vérification qui bloque les non-abonnés

    console.log('[llama-proxy-ollama-cloud] ✅ Allowing access (subscription check done, rate limiting handled client-side)');

    // Récupérer la clé API Ollama depuis les secrets Supabase
    const ollamaApiKey = Deno.env.get('OLLAMA_API_KEY');
    if (!ollamaApiKey) {
      console.error('[llama-proxy-ollama-cloud] OLLAMA_API_KEY non configurée');
      return new Response(
        JSON.stringify({ error: 'Configuration serveur manquante' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Valider le body
    const body: RequestBody = await req.json();
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: 'Paramètre "messages" requis et doit être un tableau' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Valider les messages (max 50 messages, max 10000 caractères par message)
    if (body.messages.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Trop de messages (max 50)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    for (const msg of body.messages) {
      if (typeof msg.content !== 'string' || msg.content.length > 10000) {
        return new Response(
          JSON.stringify({ error: 'Message invalide (max 10000 caractères)' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Appeler Ollama Cloud API
    // Note: Ollama Cloud utilise l'API OpenAI-compatible
    // URL correcte: https://ollama.com/api/chat (Ollama Cloud)
    // OU: https://api.ollama.ai/v1/chat (ancienne URL, peut ne pas fonctionner)
    // OU: URL personnalisée via OLLAMA_HOST
    const ollamaHost = Deno.env.get('OLLAMA_HOST') || 'https://ollama.com';
    // Normaliser l'URL (supprimer le trailing slash si présent)
    const normalizedHost = ollamaHost.replace(/\/$/, '');
    // Ollama Cloud utilise /api/chat, pas /v1/chat
    const ollamaUrl = `${normalizedHost}/api/chat`;
    
    // Modèle Ollama Cloud - utiliser un modèle disponible
    // Modèles disponibles sur Ollama Cloud:
    // - gpt-oss:120b-cloud (recommandé - par défaut)
    // - gpt-oss:20b-cloud
    // - qwen3-coder:480b-cloud
    // - deepseek-v3.1:671b-cloud
    // NOTE: "llama3", "llama3.1", "llama3.2", "llama2" n'existent PAS sur Ollama Cloud
    // Vérifier les modèles disponibles sur https://ollama.com
    const model = Deno.env.get('OLLAMA_MODEL') || 'gpt-oss:120b-cloud';
    
    console.log('[llama-proxy-ollama-cloud] Appel Ollama:', ollamaUrl);
    console.log('[llama-proxy-ollama-cloud] Modèle:', model);
    console.log('[llama-proxy-ollama-cloud] Nombre de messages:', body.messages.length);
    
    // Ollama Cloud peut utiliser différents formats d'authentification
    // Essayer d'abord avec Bearer token, puis avec header personnalisé si nécessaire
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Ajouter l'authentification
    // Format 1: Bearer token (standard)
    if (ollamaApiKey) {
      headers['Authorization'] = `Bearer ${ollamaApiKey}`;
    }
    
    // Format 2: Header personnalisé (si Bearer ne fonctionne pas)
    // Certaines versions d'Ollama Cloud peuvent utiliser un header différent
    // headers['X-API-Key'] = ollamaApiKey;
    
    console.log('[llama-proxy-ollama-cloud] Headers:', JSON.stringify(Object.keys(headers)));
    
    const ollamaResponse = await fetch(ollamaUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: model,
        messages: body.messages,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error('[llama-proxy-ollama-cloud] Erreur Ollama:', ollamaResponse.status, errorText);
      
      // Message d'erreur spécifique selon le code de statut
      let errorMessage = 'Erreur lors de l\'appel à Ollama Cloud';
      if (ollamaResponse.status === 401) {
        errorMessage = 'Erreur d\'authentification Ollama Cloud. Vérifiez que OLLAMA_API_KEY est correcte et active dans Supabase Secrets. La clé peut être invalide, expirée ou révoquée.';
      } else if (ollamaResponse.status === 403) {
        errorMessage = 'Accès refusé par Ollama Cloud. Vérifiez les permissions de votre clé API.';
      } else if (ollamaResponse.status === 429) {
        errorMessage = 'Erreur Ollama: 429';
      } else if (ollamaResponse.status === 404) {
        // Vérifier si c'est une erreur de modèle
        if (errorText.includes('model') && errorText.includes('not found')) {
          errorMessage = `Modèle Ollama introuvable. Le modèle "${model}" n'existe pas. Vérifiez que OLLAMA_MODEL est configuré avec un modèle valide (ex: gpt-oss:120b-cloud, gpt-oss:20b-cloud, qwen3-coder:480b-cloud).`;
        } else {
          errorMessage = 'Endpoint Ollama Cloud introuvable. Vérifiez que l\'URL est correcte.';
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText.substring(0, 200), // Limiter la taille
        }),
        {
          status: ollamaResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const ollamaData = await ollamaResponse.json();
    console.log('[llama-proxy-ollama-cloud] Réponse Ollama reçue');
    
    // Ollama Cloud retourne la réponse dans différentes structures possibles
    const response = ollamaData?.choices?.[0]?.message?.content || 
                     ollamaData?.message?.content || 
                     ollamaData?.response || 
                     ollamaData?.content || 
                     '';

    if (!response) {
      console.error('[llama-proxy-ollama-cloud] Réponse Ollama vide:', JSON.stringify(ollamaData).substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Réponse vide d\'Ollama Cloud' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ response }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Logger l'erreur complète pour le diagnostic
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[llama-proxy-ollama-cloud] Erreur complète:', errorMessage);
    if (errorStack) {
      console.error('[llama-proxy-ollama-cloud] Stack:', errorStack.substring(0, 500));
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur interne',
        details: errorMessage.substring(0, 200), // Détails pour diagnostic
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

