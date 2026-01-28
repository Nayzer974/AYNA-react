/**
 * Rate Limiting Service
 * 
 * Gère les limites d'utilisation pour les utilisateurs non abonnés
 * - 15 messages toutes les 10 heures
 * - Les utilisateurs abonnés n'ont pas de limite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RATE_LIMIT_KEY = 'ayna_chat_rate_limit';
const MESSAGE_LIMIT = 15; // 15 messages maximum
const TIME_WINDOW_MS = 10 * 60 * 60 * 1000; // 10 heures en millisecondes

interface RateLimitData {
  messages: number;
  firstMessageTime: number; // Timestamp du premier message de la période
  lastMessageTime: number; // Timestamp du dernier message
}

/**
 * Vérifie si l'utilisateur peut envoyer un message
 * @returns { canSend: boolean, remainingMessages: number, resetAt: Date | null }
 */
export async function checkRateLimit(): Promise<{
  canSend: boolean;
  remainingMessages: number;
  resetAt: Date | null;
  messagesUsed: number;
}> {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();

    if (!stored) {
      // Première utilisation
      return {
        canSend: true,
        remainingMessages: MESSAGE_LIMIT - 1,
        resetAt: new Date(now + TIME_WINDOW_MS),
        messagesUsed: 0,
      };
    }

    const data: RateLimitData = JSON.parse(stored);
    const timeSinceFirstMessage = now - data.firstMessageTime;

    // Si la fenêtre de 10 heures est expirée, réinitialiser
    if (timeSinceFirstMessage >= TIME_WINDOW_MS) {
      return {
        canSend: true,
        remainingMessages: MESSAGE_LIMIT - 1,
        resetAt: new Date(now + TIME_WINDOW_MS),
        messagesUsed: 0,
      };
    }

    // Vérifier si la limite est atteinte
    if (data.messages >= MESSAGE_LIMIT) {
      const resetAt = new Date(data.firstMessageTime + TIME_WINDOW_MS);
      return {
        canSend: false,
        remainingMessages: 0,
        resetAt,
        messagesUsed: data.messages,
      };
    }

    // L'utilisateur peut encore envoyer des messages
    const remainingMessages = MESSAGE_LIMIT - data.messages - 1;
    const resetAt = new Date(data.firstMessageTime + TIME_WINDOW_MS);
    return {
      canSend: true,
      remainingMessages,
      resetAt,
      messagesUsed: data.messages,
    };
  } catch (error) {
    console.error('[rateLimiting] Error checking rate limit:', error);
    // En cas d'erreur, autoriser l'envoi (fail-open)
    return {
      canSend: true,
      remainingMessages: MESSAGE_LIMIT - 1,
      resetAt: new Date(Date.now() + TIME_WINDOW_MS),
      messagesUsed: 0,
    };
  }
}

/**
 * Enregistre l'envoi d'un message
 */
export async function recordMessage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();

    if (!stored) {
      // Première utilisation
      const data: RateLimitData = {
        messages: 1,
        firstMessageTime: now,
        lastMessageTime: now,
      };
      await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
      return;
    }

    const data: RateLimitData = JSON.parse(stored);
    const timeSinceFirstMessage = now - data.firstMessageTime;

    // Si la fenêtre de 10 heures est expirée, réinitialiser
    if (timeSinceFirstMessage >= TIME_WINDOW_MS) {
      const newData: RateLimitData = {
        messages: 1,
        firstMessageTime: now,
        lastMessageTime: now,
      };
      await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newData));
      return;
    }

    // Incrémenter le compteur
    data.messages += 1;
    data.lastMessageTime = now;
    await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[rateLimiting] Error recording message:', error);
  }
}

/**
 * Réinitialise le rate limit (utile pour les tests ou après activation d'abonnement)
 */
export async function resetRateLimit(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RATE_LIMIT_KEY);
  } catch (error) {
    console.error('[rateLimiting] Error resetting rate limit:', error);
  }
}

/**
 * Formate la date de réinitialisation pour l'affichage
 */
export function formatResetTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff <= 0) {
    return 'maintenant';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `dans ${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  } else {
    return `dans ${minutes}min`;
  }
}

