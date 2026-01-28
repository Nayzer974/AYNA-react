/**
 * Supabase Edge Function: analyze-intention-dhikr
 * 
 * Analyse l'intention de l'utilisateur avec Ollama (via API AYNA) et suggère un dhikr/du'a approprié
 * Utilisé par Dairat An Nur pour suggérer un dhikr valide basé sur l'intention
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  intention: string;
  dhikrList: Array<{
    arabic: string;
    transliteration: string;
    translation: string;
    reference: string;
    keywords: string[];
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { intention, dhikrList } = body;

    if (!intention || !dhikrList || dhikrList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: intention and dhikrList' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer la clé API Ollama depuis les secrets Supabase
    const ollamaApiKey = Deno.env.get('OLLAMA_API_KEY');
    if (!ollamaApiKey) {
      console.error('[analyze-intention-dhikr] OLLAMA_API_KEY non configurée');
      return new Response(
        JSON.stringify({ error: 'Configuration serveur manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Préparer le prompt pour Ollama
    const dhikrListFormatted = dhikrList.map((d, idx) => 
      `${idx}. "${d.arabic}"\n   (${d.transliteration})\n   ${d.translation}\n   Référence: ${d.reference}\n`
    ).join('\n');

    const systemPrompt = `Tu es un assistant spirituel spécialisé dans l'islam. Tu dois analyser l'intention d'une personne et suggérer le dhikr/du'a le plus approprié parmi une liste de dhikr authentiques du Coran et des Hadiths.

Réponds UNIQUEMENT au format JSON suivant (sans markdown, sans code block, juste du JSON brut) :
{"selectedDhikrIndex": <index dans la liste (0-based)>, "explanation": "<explication en français expliquant pourquoi ce dhikr est approprié, en 2-3 phrases maximum, avec bienveillance et spiritualité>"}

Soyez précis, spirituel et bienveillant. Choisis le dhikr qui correspond le mieux à l'intention.`;

    const userPrompt = `Intention de l'utilisateur : "${intention}"

Voici les dhikr/du'a authentiques disponibles :
${dhikrListFormatted}

Quel dhikr/du'a est le plus approprié pour cette intention ? Réponds au format JSON demandé avec l'index (commence à 0).`;

    // Configuration Ollama
    const ollamaHost = Deno.env.get('OLLAMA_HOST') || 'https://ollama.com';
    const normalizedHost = ollamaHost.replace(/\/$/, '');
    const ollamaUrl = `${normalizedHost}/api/chat`;
    const model = Deno.env.get('OLLAMA_MODEL') || 'gpt-oss:120b-cloud';

    // Appeler Ollama API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ollamaApiKey}`,
    };

    const ollamaResponse = await fetch(ollamaUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error('[analyze-intention-dhikr] Erreur Ollama:', ollamaResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'appel à Ollama' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ollamaData = await ollamaResponse.json();
    
    // Ollama Cloud retourne la réponse dans différentes structures possibles
    const content = ollamaData?.choices?.[0]?.message?.content || 
                     ollamaData?.message?.content || 
                     ollamaData?.response || 
                     ollamaData?.content || 
                     '';
    
    if (!content) {
      console.error('[analyze-intention-dhikr] Réponse Ollama vide:', JSON.stringify(ollamaData).substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Réponse vide d\'Ollama' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Nettoyer le contenu (enlever markdown si présent)
    let cleanedContent = content.trim();
    // Enlever les code blocks markdown
    cleanedContent = cleanedContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    cleanedContent = cleanedContent.trim();

    // Parse JSON response
    let aiResult;
    try {
      aiResult = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('[analyze-intention-dhikr] Failed to parse AI response:', cleanedContent.substring(0, 500));
      // Essayer d'extraire le JSON si c'est dans du texte
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          aiResult = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          return new Response(
            JSON.stringify({ error: 'Invalid JSON from AI' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON from AI' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Vérifier que le résultat est valide
    const selectedIndex = aiResult.selectedDhikrIndex;
    if (selectedIndex === undefined || typeof selectedIndex !== 'number' || selectedIndex < 0 || selectedIndex >= dhikrList.length) {
      return new Response(
        JSON.stringify({ error: 'Invalid dhikr index selected' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le dhikr sélectionné
    const selectedDhikr = dhikrList[selectedIndex];

    // Retourner le résultat
    return new Response(
      JSON.stringify({
        selectedDhikr: {
          arabic: selectedDhikr.arabic,
          transliteration: selectedDhikr.transliteration,
          translation: selectedDhikr.translation,
          reference: selectedDhikr.reference,
        },
        explanation: aiResult.explanation || 'Ce dhikr est approprié pour votre intention.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[analyze-intention-dhikr] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage.substring(0, 200) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
