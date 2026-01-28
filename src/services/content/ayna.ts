/**
 * Service AYNA pour le chat
 * 
 * Utilise Ollama Cloud via Supabase Edge Function
 * Les appels directs Ã  Ollama Cloud depuis le frontend sont bloquÃ©s par CORS
 */

import { APP_CONFIG } from '@/config';
import { generatePersonalizedContext, learnFromConversation } from '@/services/ai/aiPersonalized';
import { AYNA_SYSTEM_PROMPT } from '@/config/aynaSystemPrompt';
import i18n from '@/i18n';
import { supabase } from '@/services/auth/supabase';
import { checkRateLimit, recordMessage } from '@/services/system/rateLimiting';
import { getSubscriptionStatus } from '@/services/system/subscription';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface AynaResponse {
  content: string;
}

/**
 * GÃ©nÃ¨re le prompt systÃ¨me AYNA avec la langue de l'utilisateur
 */
function getSystemPromptWithLanguage(language: string = 'fr'): string {
  const languageInstructions: Record<string, string> = {
    fr: 'IMPORTANT : Tu dois TOUJOURS rÃ©pondre en franÃ§ais. Toutes tes rÃ©ponses doivent Ãªtre en franÃ§ais, sans exception.',
    ar: 'Ù…Ù‡Ù… Ø¬Ø¯Ø§Ù‹: ÙŠØ¬Ø¨ Ø£Ù† ØªØ±Ø¯ Ø¯Ø§Ø¦Ù…Ø§Ù‹ Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©. Ø¬Ù…ÙŠØ¹ Ø±Ø¯ÙˆØ¯Ùƒ ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©ØŒ Ø¨Ø¯ÙˆÙ† Ø§Ø³ØªØ«Ù†Ø§Ø¡.',
    en: 'IMPORTANT: You must ALWAYS respond in English. All your responses must be in English, without exception.',
  };
  
  const languageInstruction = languageInstructions[language] || languageInstructions.fr;
  
  return `${AYNA_SYSTEM_PROMPT}\n\n---------------------------------------------------------------------\n\nLANGUE DE RÃ‰PONSE (OBLIGATOIRE)\n\n${languageInstruction}\n\nTu dÃ©tectes automatiquement la langue de l'utilisateur et tu rÃ©ponds dans la mÃªme langue. Si l'utilisateur Ã©crit en franÃ§ais, tu rÃ©ponds en franÃ§ais. Si l'utilisateur Ã©crit en arabe, tu rÃ©ponds en arabe. Si l'utilisateur Ã©crit en anglais, tu rÃ©ponds en anglais.\n\nMais par dÃ©faut, si aucune instruction spÃ©cifique n'est donnÃ©e, tu rÃ©ponds dans la langue configurÃ©e ci-dessus.`;
}

/**
 * Injecte automatiquement le prompt systÃ¨me AYNA UNE SEULE FOIS au dÃ©but de la conversation
 * OptimisÃ© pour Ã©viter de renvoyer le prompt Ã  chaque message - amÃ©liore la vitesse de rÃ©ponse
 */
function injectSystemPrompt(
  messages: ChatMessage[],
  language: string = 'fr',
  personalizedContext: string = ''
): ChatMessage[] {
  // VÃ©rifier si le prompt systÃ¨me AYNA est dÃ©jÃ  prÃ©sent
  // On cherche un message systÃ¨me qui contient le dÃ©but du prompt AYNA
  const hasSystemMessage = messages.some(msg => msg.role === 'system');
  
  // Si aucun message systÃ¨me n'est prÃ©sent, ajouter le prompt AYNA avec la langue
  // Cela garantit que le prompt est toujours prÃ©sent au dÃ©but de la conversation
  if (!hasSystemMessage) {
    return [
      { role: 'system', content: getSystemPromptWithLanguage(language) + personalizedContext },
      ...messages
    ];
  }
  
  // Le prompt est dÃ©jÃ  prÃ©sent, on retourne les messages tels quels
  // Cela permet des rÃ©ponses plus rapides car le modÃ¨le n'a pas besoin de relire le prompt
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
 * Envoie un message Ã  AYNA et rÃ©cupÃ¨re la rÃ©ponse
 * 
 * Utilise Ollama Cloud via Supabase Edge Function
 * Les appels directs Ã  Ollama Cloud depuis le frontend sont bloquÃ©s par CORS
 * 
 * @param messages Historique des messages
 * @param language Langue de l'utilisateur (fr, ar, en) - par dÃ©faut rÃ©cupÃ©rÃ©e depuis i18n
 * @returns RÃ©ponse d'AYNA
 */
export async function sendToAyna(
  messages: ChatMessage[],
  language?: string,
  userId?: string
): Promise<ChatMessage> {
  // RÃ©cupÃ©rer la langue de l'utilisateur depuis i18n si non fournie
  const userLanguage = language || i18n.language || 'fr';
  // Normaliser la langue (fr, ar, en)
  const normalizedLanguage = ['fr', 'ar', 'en'].includes(userLanguage) ? userLanguage : 'fr';
  
  // GÃ©nÃ©rer le contexte personnalisÃ© si userId fourni
  let personalizedContext = '';
  if (userId) {
    try {
      const { UserProfile } = await import('@/contexts/UserContext');
      const context = await generatePersonalizedContext(userId, {} as UserProfile);
      personalizedContext = `\n\nCONTEXTE UTILISATEUR:\n- Sujets prÃ©fÃ©rÃ©s: ${context.preferredTopics.join(', ') || 'Aucun'}\n- Sujets frÃ©quents: ${context.frequentlyAsked.join(', ') || 'Aucun'}\n- Style de communication: ${context.preferences.communicationStyle}\n- IntÃ©rÃªts: ${context.preferences.interests.join(', ') || 'Aucun'}\n`;
    } catch (error) {
      // Erreur silencieuse
    }
  }
  
  // Injecter le prompt systÃ¨me AYNA avec la langue de l'utilisateur et le contexte personnalisÃ©
  const messagesWithSystem = injectSystemPrompt(messages, normalizedLanguage, personalizedContext);
  
  // Debug: Afficher la configuration
  // Configuration Ollama Cloud
  
  // UNIQUEMENT Supabase Edge Function - Les appels directs Ã  Ollama Cloud depuis le frontend sont bloquÃ©s par CORS
  // Ollama Cloud ne supporte pas les requÃªtes CORS depuis des domaines externes
  // Il est OBLIGATOIRE d'utiliser Supabase Edge Function comme proxy
  if (!APP_CONFIG.supabaseUrl || !APP_CONFIG.supabaseAnonKey) {
    throw new Error('Configuration Supabase requise. EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY doivent Ãªtre dÃ©finis dans votre fichier .env. Les appels directs Ã  Ollama Cloud depuis le frontend sont bloquÃ©s par CORS.');
  }

  // Utilisation de Supabase Edge Function
  
  try {
    // RÃ©cupÃ©rer la session Supabase pour l'authentification
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required: Please log in to use AI features.');
    }

    // VÃ©rifier l'abonnement
    let hasActiveSubscription = false;
    try {
      const subscriptionStatus = await getSubscriptionStatus();
      hasActiveSubscription = subscriptionStatus.isActive;
    } catch (error) {
      console.warn('[ayna] Error checking subscription, assuming no subscription:', error);
    }

    // Si l'utilisateur n'a pas d'abonnement actif, vÃ©rifier le rate limiting
    if (!hasActiveSubscription) {
      const rateLimit = await checkRateLimit();
      
      if (!rateLimit.canSend) {
        // CrÃ©er une erreur spÃ©ciale pour le rate limiting
        const error = new Error('RATE_LIMIT_EXCEEDED') as any;
        error.rateLimitData = {
          resetAt: rateLimit.resetAt,
          messagesUsed: rateLimit.messagesUsed,
        };
        throw error;
      }
    }
    
    const ollamaMessages = messagesToOllamaFormat(messagesWithSystem);
    
    const response = await fetch(`${APP_CONFIG.supabaseUrl}/functions/v1/llama-proxy-ollama-cloud`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': APP_CONFIG.supabaseAnonKey || '',
      },
      body: JSON.stringify({
        messages: ollamaMessages,
        useTools: true,
      }),
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        if (text) {
          errorData = JSON.parse(text);
        }
      } catch (parseError) {
        console.warn('[ayna] Failed to parse error response:', parseError);
        errorData = {};
      }
      
      const errorMessage = errorData?.error || `Erreur Supabase Edge Function: ${response.status}`;
      const errorDetails = errorData?.details || '';
      
      console.error('[ayna] Edge Function error:', {
        status: response.status,
        error: errorMessage,
        details: errorDetails,
      });
      
      // GÃ©rer l'erreur 401 (authentication required)
      if (response.status === 401) {
        throw new Error('Authentication required: Please log in to use AI features.');
      }
      
      // GÃ©rer l'erreur 403 (subscription required)
      if (response.status === 403) {
        throw new Error('SUBSCRIPTION_REQUIRED');
      }
      
      // GÃ©rer l'erreur 429 (rate limit Ollama)
      if (response.status === 429) {
        const rateLimitError = new Error('OLLAMA_RATE_LIMIT') as any;
        rateLimitError.isOllamaRateLimit = true;
        rateLimitError.status = 429;
        throw rateLimitError;
      }
      
      // Message d'erreur plus informatif
      let finalErrorMessage = errorMessage;
      if (errorDetails && !errorMessage.includes(errorDetails)) {
        finalErrorMessage += ` (${errorDetails.substring(0, 100)})`;
      }
      
      // Messages d'erreur spÃ©cifiques selon le type
      if (errorMessage.includes('Configuration serveur manquante')) {
        finalErrorMessage = 'Erreur lors de l\'appel Ã  Ollama Cloud: Configuration serveur manquante. VÃ©rifiez que OLLAMA_API_KEY est configurÃ© dans Supabase Secrets.';
      } else if (errorMessage.includes('DNS') || errorMessage.includes('hostname')) {
        finalErrorMessage = 'Erreur lors de l\'appel Ã  Ollama Cloud: ProblÃ¨me de connexion. VÃ©rifiez que l\'Edge Function est correctement dÃ©ployÃ©e et que OLLAMA_HOST est configurÃ© avec la bonne URL (https://ollama.com).';
      } else if (errorMessage.includes('Erreur lors de l\'appel Ã  Ollama Cloud')) {
        finalErrorMessage = errorMessage; // Garder le message original
      } else if (errorMessage.includes('Erreur serveur interne')) {
        finalErrorMessage = errorMessage; // Garder le message original
      } else {
        finalErrorMessage = `Erreur lors de l'appel Ã  Ollama Cloud: ${errorMessage}`;
      }
      
      const error = new Error(finalErrorMessage) as any;
      error.details = errorDetails;
      throw error;
    }

    const data = await response.json();
    const content = data?.response || '';

    if (!content) {
      throw new Error('RÃ©ponse vide d\'Ollama Cloud via Supabase');
    }

    // Enregistrer le message seulement aprÃ¨s succÃ¨s (pour les non-abonnÃ©s)
    if (!hasActiveSubscription) {
      await recordMessage();
    }

    return {
      role: 'assistant',
      content: content,
    };
  } catch (error: any) {
    console.error('[ayna] Error in sendToAyna:', error);
    
    // Si l'erreur a dÃ©jÃ  un message informatif, la propager telle quelle
    if (error.message) {
      // VÃ©rifier si c'est une erreur de rate limiting
      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        throw error; // Propager avec rateLimitData
      }
      
      // VÃ©rifier si c'est une erreur d'authentification
      if (error.message.includes('Authentication required')) {
        throw error;
      }
      
      // VÃ©rifier si c'est une erreur de subscription
      if (error.message === 'SUBSCRIPTION_REQUIRED') {
        throw error;
      }
      
      // VÃ©rifier si c'est une erreur de rate limit Ollama
      if (error.message === 'OLLAMA_RATE_LIMIT' || error.isOllamaRateLimit || error.status === 429) {
        const rateLimitError = new Error('OLLAMA_RATE_LIMIT') as any;
        rateLimitError.isOllamaRateLimit = true;
        rateLimitError.message = 'Trop de requÃªtes envoyÃ©es Ã  l\'IA. Veuillez patienter quelques instants avant de rÃ©essayer.';
        throw rateLimitError;
      }
      
      // Si l'erreur contient dÃ©jÃ  "Erreur lors de l'appel Ã  Ollama Cloud", la propager telle quelle
      if (error.message.includes('Erreur lors de l\'appel Ã  Ollama Cloud') || 
          error.message.includes('Erreur serveur interne') ||
          error.message.includes('Configuration serveur manquante')) {
        throw error;
      }
    }
    
    // Ne pas faire de fallback vers Ollama Cloud direct (bloquÃ© par CORS)
    // Propager l'erreur avec un message clair
    if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
      throw new Error('Erreur de connexion Ã  Supabase Edge Function. VÃ©rifiez que la fonction est dÃ©ployÃ©e et que votre connexion internet fonctionne. Les appels directs Ã  Ollama Cloud sont bloquÃ©s par CORS.');
    }
    
    // Sinon, wrapper l'erreur avec un message plus clair
    const errorMessage = error?.message || String(error);
    const wrappedError = new Error(`Erreur lors de l'appel Ã  Ollama Cloud: ${errorMessage}`) as any;
    if (error.details) {
      wrappedError.details = error.details;
    }
    throw wrappedError;
  }
}


