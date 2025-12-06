/**
 * Service AYNA pour le chat
 * 
 * Utilise Ollama Cloud via Supabase Edge Function
 * Les appels directs à Ollama Cloud depuis le frontend sont bloqués par CORS
 */

import { APP_CONFIG } from '@/config';
import { AYNA_SYSTEM_PROMPT } from '@/config/aynaSystemPrompt';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface AynaResponse {
  content: string;
}

/**
 * Injecte automatiquement le prompt système AYNA UNE SEULE FOIS au début de la conversation
 * Optimisé pour éviter de renvoyer le prompt à chaque message - améliore la vitesse de réponse
 */
function injectSystemPrompt(messages: ChatMessage[]): ChatMessage[] {
  // Vérifier si le prompt système AYNA est déjà présent
  // On cherche un message système qui contient le début du prompt AYNA
  const hasSystemMessage = messages.some(msg => msg.role === 'system');
  
  // Si aucun message système n'est présent, ajouter le prompt AYNA
  // Cela garantit que le prompt est toujours présent au début de la conversation
  if (!hasSystemMessage) {
    return [
      { role: 'system', content: AYNA_SYSTEM_PROMPT },
      ...messages
    ];
  }
  
  // Le prompt est déjà présent, on retourne les messages tels quels
  // Cela permet des réponses plus rapides car le modèle n'a pas besoin de relire le prompt
  return messages;
}

/**
 * Convertit les messages au format Ollama Cloud (avec roles)
 */
function messagesToOllamaFormat(messages: ChatMessage[]): Array<{ role: string; content: string }> {
  return messages.map(msg => {
    // Convertir le role: 'system' devient 'system', 'assistant' reste 'assistant', 'user' reste 'user'
    let role = msg.role;
    if (msg.role === 'assistant') {
      role = 'assistant';
    } else if (msg.role === 'system') {
      role = 'system';
    } else {
      role = 'user';
    }
    return {
      role: role,
      content: msg.content,
    };
  });
}

/**
 * Envoie un message à AYNA et récupère la réponse
 * 
 * Utilise Ollama Cloud via Supabase Edge Function
 * Les appels directs à Ollama Cloud depuis le frontend sont bloqués par CORS
 * 
 * @param messages Historique des messages
 * @returns Réponse d'AYNA
 */
export async function sendToAyna(messages: ChatMessage[]): Promise<ChatMessage> {
  // Injecter le prompt système AYNA
  const messagesWithSystem = injectSystemPrompt(messages);
  
  // Debug: Afficher la configuration
  console.log('[AYNA] Configuration Ollama Cloud uniquement:', {
    supabaseUrl: APP_CONFIG.supabaseUrl ? 'défini' : 'non défini',
    supabaseAnonKey: APP_CONFIG.supabaseAnonKey ? 'défini (' + APP_CONFIG.supabaseAnonKey.length + ' chars)' : 'non défini',
    ollamaApiKey: APP_CONFIG.ollamaApiKey ? 'défini (' + APP_CONFIG.ollamaApiKey.length + ' chars)' : 'non défini',
  });
  
  // UNIQUEMENT Supabase Edge Function - Les appels directs à Ollama Cloud depuis le frontend sont bloqués par CORS
  // Ollama Cloud ne supporte pas les requêtes CORS depuis des domaines externes
  // Il est OBLIGATOIRE d'utiliser Supabase Edge Function comme proxy
  if (!APP_CONFIG.supabaseUrl || !APP_CONFIG.supabaseAnonKey) {
    throw new Error('Configuration Supabase requise. EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY doivent être définis dans votre fichier .env. Les appels directs à Ollama Cloud depuis le frontend sont bloqués par CORS.');
  }

  console.log('[AYNA] ✅ Utilisation de Supabase Edge Function:', APP_CONFIG.supabaseUrl);
  
  try {
    const ollamaMessages = messagesToOllamaFormat(messagesWithSystem);
    
    const response = await fetch(`${APP_CONFIG.supabaseUrl}/functions/v1/llama-proxy-ollama-cloud`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_CONFIG.supabaseAnonKey}`,
      },
      body: JSON.stringify({
        messages: ollamaMessages,
        useTools: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error || `Erreur Supabase Edge Function: ${response.status}`;
      console.error('[AYNA] Erreur Supabase Edge Function:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data?.response || '';

    if (!content) {
      throw new Error('Réponse vide d\'Ollama Cloud via Supabase');
    }

    return {
      role: 'assistant',
      content: content,
    };
  } catch (error: any) {
    // Ne pas faire de fallback vers Ollama Cloud direct (bloqué par CORS)
    // Propager l'erreur avec un message clair
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      throw new Error('Erreur de connexion à Supabase Edge Function. Vérifiez que la fonction est déployée et que votre connexion internet fonctionne. Les appels directs à Ollama Cloud sont bloqués par CORS.');
    }
    throw error;
  }
}
