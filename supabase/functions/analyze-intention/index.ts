/**
 * Supabase Edge Function: analyze-intention
 * 
 * Analyse l'intention de l'utilisateur avec Ollama (via API AYNA) et suggère le nom d'Allah le plus approprié
 * Utilisé par Bayt An Nûr pour suggérer un nom divin basé sur l'intention
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  intention: string;
  names: Array<{
    number: number;
    arabic: string;
    transliteration: string;
    meaning: string;
    description: string;
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
    const { intention, names } = body;

    if (!intention || !names || names.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: intention and names' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer la clé API Ollama depuis les secrets Supabase
    const ollamaApiKey = Deno.env.get('OLLAMA_API_KEY');
    if (!ollamaApiKey) {
      console.error('[analyze-intention] OLLAMA_API_KEY non configurée');
      return new Response(
        JSON.stringify({ error: 'Configuration serveur manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Préparer le prompt pour Ollama
    const namesList = names.map(n =>
      `${n.number}. ${n.transliteration} (${n.meaning}): ${n.description.substring(0, 150)}`
    ).join('\n');

    const systemPrompt = `Tu es un assistant spirituel spécialisé dans l'islam. Tu dois analyser l'intention d'une personne et suggérer 3 noms d'Allah (Asma Ul Husna) les plus appropriés parmi les 99 noms.

Réponds UNIQUEMENT au format JSON suivant (sans markdown, sans code block, juste du JSON brut) :
{
  "selectedNames": [
    {
      "number": <numéro du nom (1-99)>,
      "explanation": "<explication en français pour ce nom précis, en 1 phrase>"
    },
    {...},
    {...}
  ]
}

Soyez précis, spirituel et bienveillant dans votre réponse.`;

    const userPrompt = `Intention de l'utilisateur : "${intention}"

Voici les noms d'Allah disponibles (liste complète des 99 noms) :
${namesList}

Quels sont les 3 noms d'Allah les plus appropriés pour cette intention ? Réponds au format JSON demandé.`;

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
      console.error('[analyze-intention] Erreur Ollama:', ollamaResponse.status, errorText);
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
      console.error('[analyze-intention] Réponse Ollama vide:', JSON.stringify(ollamaData).substring(0, 500));
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
      console.error('[analyze-intention] Failed to parse AI response:', cleanedContent.substring(0, 500));
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

    // Vérifier que le résultat est valide (array de noms)
    let selectedNames = [];
    if (aiResult.selectedNames && Array.isArray(aiResult.selectedNames)) {
      selectedNames = aiResult.selectedNames;
    } else if (aiResult.selectedNameNumber) {
      // Backward compatibility for single result
      selectedNames = [{ number: aiResult.selectedNameNumber, explanation: aiResult.explanation }];
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid response format from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enrichir les noms sélectionnés
    const enrichedNames = selectedNames.map((item: any) => {
      const found = names.find(n => n.number === item.number);
      if (!found) return null;
      return {
        number: found.number,
        arabic: found.arabic,
        transliteration: found.transliteration,
        meaning: found.meaning,
        explanation: item.explanation || 'Ce nom est approprié pour votre intention.',
      };
    }).filter(Boolean);

    if (enrichedNames.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Selected names not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retourner le résultat
    return new Response(
      JSON.stringify({
        selectedNames: enrichedNames
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[analyze-intention] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage.substring(0, 200) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
