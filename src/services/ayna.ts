/**
 * Service AYNA pour le chat
 * 
 * Utilise Ollama Cloud via Supabase Edge Function
 * Les appels directs à Ollama Cloud depuis le frontend sont bloqués par CORS
 */

import { APP_CONFIG } from '@/config';
import { generatePersonalizedContext, learnFromConversation } from './aiPersonalized';
import { AYNA_SYSTEM_PROMPT } from '@/config/aynaSystemPrompt';
import i18n from '@/i18n';
import { supabase } from '@/services/supabase';
import { checkRateLimit, recordMessage } from '@/services/rateLimiting';
import { getSubscriptionStatus } from '@/services/subscription';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface AynaResponse {
  content: string;
}

/**
 * Génère le prompt système AYNA avec la langue de l'utilisateur
 */
function getSystemPromptWithLanguage(language: string = 'fr'): string {
  const languageInstructions: Record<string, string> = {
    fr: 'IMPORTANT : Tu dois TOUJOURS répondre en français. Toutes tes réponses doivent être en français, sans exception.',
    ar: 'مهم جداً: يجب أن ترد دائماً بالعربية. جميع ردودك يجب أن تكون بالعربية، بدون استثناء.',
    en: 'IMPORTANT: You must ALWAYS respond in English. All your responses must be in English, without exception.',
  };
  
  const languageInstruction = languageInstructions[language] || languageInstructions.fr;
  
  return `${AYNA_SYSTEM_PROMPT}\n\n---------------------------------------------------------------------\n\nLANGUE DE RÉPONSE (OBLIGATOIRE)\n\n${languageInstruction}\n\nTu détectes automatiquement la langue de l'utilisateur et tu réponds dans la même langue. Si l'utilisateur écrit en français, tu réponds en français. Si l'utilisateur écrit en arabe, tu réponds en arabe. Si l'utilisateur écrit en anglais, tu réponds en anglais.\n\nMais par défaut, si aucune instruction spécifique n'est donnée, tu réponds dans la langue configurée ci-dessus.`;
}

/**
 * Injecte automatiquement le prompt système AYNA UNE SEULE FOIS au début de la conversation
 * Optimisé pour éviter de renvoyer le prompt à chaque message - améliore la vitesse de réponse
 */
function injectSystemPrompt(
  messages: ChatMessage[],
  language: string = 'fr',
  personalizedContext: string = ''
): ChatMessage[] {
  // Vérifier si le prompt système AYNA est déjà présent
  // On cherche un message système qui contient le début du prompt AYNA
  const hasSystemMessage = messages.some(msg => msg.role === 'system');
  
  // Si aucun message système n'est présent, ajouter le prompt AYNA avec la langue
  // Cela garantit que le prompt est toujours présent au début de la conversation
  if (!hasSystemMessage) {
    return [
      { role: 'system', content: getSystemPromptWithLanguage(language) + personalizedContext },
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
 * @param language Langue de l'utilisateur (fr, ar, en) - par défaut récupérée depuis i18n
 * @returns Réponse d'AYNA
 */
export async function sendToAyna(
  messages: ChatMessage[],
  language?: string,
  userId?: string
): Promise<ChatMessage> {
  // Récupérer la langue de l'utilisateur depuis i18n si non fournie
  const userLanguage = language || i18n.language || 'fr';
  // Normaliser la langue (fr, ar, en)
  const normalizedLanguage = ['fr', 'ar', 'en'].includes(userLanguage) ? userLanguage : 'fr';
  
  // Générer le contexte personnalisé si userId fourni
  let personalizedContext = '';
  if (userId) {
    try {
      const { UserProfile } = await import('@/contexts/UserContext');
      const context = await generatePersonalizedContext(userId, {} as UserProfile);
      personalizedContext = `\n\nCONTEXTE UTILISATEUR:\n- Sujets préférés: ${context.preferredTopics.join(', ') || 'Aucun'}\n- Sujets fréquents: ${context.frequentlyAsked.join(', ') || 'Aucun'}\n- Style de communication: ${context.preferences.communicationStyle}\n- Intérêts: ${context.preferences.interests.join(', ') || 'Aucun'}\n`;
    } catch (error) {
      // Erreur silencieuse
    }
  }
  
  // Injecter le prompt système AYNA avec la langue de l'utilisateur et le contexte personnalisé
  const messagesWithSystem = injectSystemPrompt(messages, normalizedLanguage, personalizedContext);
  
  // Debug: Afficher la configuration
  // Configuration Ollama Cloud
  
  // UNIQUEMENT Supabase Edge Function - Les appels directs à Ollama Cloud depuis le frontend sont bloqués par CORS
  // Ollama Cloud ne supporte pas les requêtes CORS depuis des domaines externes
  // Il est OBLIGATOIRE d'utiliser Supabase Edge Function comme proxy
  if (!APP_CONFIG.supabaseUrl || !APP_CONFIG.supabaseAnonKey) {
    throw new Error('Configuration Supabase requise. EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY doivent être définis dans votre fichier .env. Les appels directs à Ollama Cloud depuis le frontend sont bloqués par CORS.');
  }

  // Utilisation de Supabase Edge Function
  
  try {
    // Récupérer la session Supabase pour l'authentification
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required: Please log in to use AI features.');
    }

    // Vérifier l'abonnement
    let hasActiveSubscription = false;
    try {
      const subscriptionStatus = await getSubscriptionStatus();
      hasActiveSubscription = subscriptionStatus.isActive;
    } catch (error) {
      console.warn('[ayna] Error checking subscription, assuming no subscription:', error);
    }

    // Si l'utilisateur n'a pas d'abonnement actif, vérifier le rate limiting
    if (!hasActiveSubscription) {
      const rateLimit = await checkRateLimit();
      
      if (!rateLimit.canSend) {
        // Créer une erreur spéciale pour le rate limiting
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
      
      // Gérer l'erreur 401 (authentication required)
      if (response.status === 401) {
        throw new Error('Authentication required: Please log in to use AI features.');
      }
      
      // Gérer l'erreur 403 (subscription required)
      if (response.status === 403) {
        throw new Error('SUBSCRIPTION_REQUIRED');
      }
      
      // Message d'erreur plus informatif
      let finalErrorMessage = errorMessage;
      if (errorDetails && !errorMessage.includes(errorDetails)) {
        finalErrorMessage += ` (${errorDetails.substring(0, 100)})`;
      }
      
      // Messages d'erreur spécifiques selon le type
      if (errorMessage.includes('Configuration serveur manquante')) {
        finalErrorMessage = 'Erreur lors de l\'appel à Ollama Cloud: Configuration serveur manquante. Vérifiez que OLLAMA_API_KEY est configuré dans Supabase Secrets.';
      } else if (errorMessage.includes('DNS') || errorMessage.includes('hostname')) {
        finalErrorMessage = 'Erreur lors de l\'appel à Ollama Cloud: Problème de connexion. Vérifiez que l\'Edge Function est correctement déployée et que OLLAMA_HOST est configuré avec la bonne URL (https://ollama.com).';
      } else if (errorMessage.includes('Erreur lors de l\'appel à Ollama Cloud')) {
        finalErrorMessage = errorMessage; // Garder le message original
      } else if (errorMessage.includes('Erreur serveur interne')) {
        finalErrorMessage = errorMessage; // Garder le message original
      } else {
        finalErrorMessage = `Erreur lors de l'appel à Ollama Cloud: ${errorMessage}`;
      }
      
      const error = new Error(finalErrorMessage) as any;
      error.details = errorDetails;
      throw error;
    }

    const data = await response.json();
    const content = data?.response || '';

    if (!content) {
      throw new Error('Réponse vide d\'Ollama Cloud via Supabase');
    }

    // Enregistrer le message seulement après succès (pour les non-abonnés)
    if (!hasActiveSubscription) {
      await recordMessage();
    }

    return {
      role: 'assistant',
      content: content,
    };
  } catch (error: any) {
    console.error('[ayna] Error in sendToAyna:', error);
    
    // Si l'erreur a déjà un message informatif, la propager telle quelle
    if (error.message) {
      // Vérifier si c'est une erreur de rate limiting
      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        throw error; // Propager avec rateLimitData
      }
      
      // Vérifier si c'est une erreur d'authentification
      if (error.message.includes('Authentication required')) {
        throw error;
      }
      
      // Vérifier si c'est une erreur de subscription
      if (error.message === 'SUBSCRIPTION_REQUIRED') {
        throw error;
      }
      
      // Si l'erreur contient déjà "Erreur lors de l'appel à Ollama Cloud", la propager telle quelle
      if (error.message.includes('Erreur lors de l\'appel à Ollama Cloud') || 
          error.message.includes('Erreur serveur interne') ||
          error.message.includes('Configuration serveur manquante')) {
        throw error;
      }
    }
    
    // Ne pas faire de fallback vers Ollama Cloud direct (bloqué par CORS)
    // Propager l'erreur avec un message clair
    if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
      throw new Error('Erreur de connexion à Supabase Edge Function. Vérifiez que la fonction est déployée et que votre connexion internet fonctionne. Les appels directs à Ollama Cloud sont bloqués par CORS.');
    }
    
    // Sinon, wrapper l'erreur avec un message plus clair
    const errorMessage = error?.message || String(error);
    const wrappedError = new Error(`Erreur lors de l'appel à Ollama Cloud: ${errorMessage}`) as any;
    if (error.details) {
      wrappedError.details = error.details;
    }
    throw wrappedError;
  }
}
