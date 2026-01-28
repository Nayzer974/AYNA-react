/**
 * Service d'assistant IA personnalisÃ© avec apprentissage des prÃ©fÃ©rences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/auth/supabase';
import { UserProfile } from '@/types/user';

export interface UserPreferences {
  preferredTopics: string[];
  preferredLanguage: 'fr' | 'en' | 'ar';
  communicationStyle: 'formal' | 'casual' | 'friendly';
  interests: string[];
  learningGoals: string[];
}

export interface ConversationContext {
  userId: string;
  recentTopics: string[];
  frequentlyAsked: string[];
  preferences: UserPreferences;
  lastInteraction: string;
}

const PREFERENCES_KEY = '@ayna_ai_preferences';
const CONVERSATION_HISTORY_KEY = '@ayna_conversation_history';

/**
 * RÃ©cupÃ¨re les prÃ©fÃ©rences de l'utilisateur
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const stored = await AsyncStorage.getItem(`${PREFERENCES_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      preferredTopics: [],
      preferredLanguage: 'fr',
      communicationStyle: 'friendly',
      interests: [],
      learningGoals: [],
    };
  } catch {
    return {
      preferredTopics: [],
      preferredLanguage: 'fr',
      communicationStyle: 'friendly',
      interests: [],
      learningGoals: [],
    };
  }
}

/**
 * Sauvegarde les prÃ©fÃ©rences de l'utilisateur
 */
export async function saveUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  try {
    const current = await getUserPreferences(userId);
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(`${PREFERENCES_KEY}_${userId}`, JSON.stringify(updated));

    // Synchroniser avec Supabase
    if (supabase) {
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        preferences: updated,
        updated_at: new Date().toISOString(),
      });
    }
  } catch {
    // Erreur silencieuse
  }
}

/**
 * Analyse les conversations pour apprendre les prÃ©fÃ©rences
 */
export async function learnFromConversation(
  userId: string,
  message: string,
  response: string
): Promise<void> {
  try {
    // Extraire les sujets mentionnÃ©s
    const topics = extractTopics(message);

    // Mettre Ã  jour les prÃ©fÃ©rences
    const preferences = await getUserPreferences(userId);
    const updatedTopics = [...new Set([...preferences.preferredTopics, ...topics])];

    await saveUserPreferences(userId, {
      preferredTopics: updatedTopics.slice(0, 20), // Limiter Ã  20 sujets
    });

    // Sauvegarder dans l'historique
    const history = await getConversationHistory(userId);
    history.push({
      message,
      response,
      timestamp: new Date().toISOString(),
      topics,
    });

    // Garder seulement les 100 derniÃ¨res conversations
    const recentHistory = history.slice(-100);
    await AsyncStorage.setItem(
      `${CONVERSATION_HISTORY_KEY}_${userId}`,
      JSON.stringify(recentHistory)
    );
  } catch {
    // Erreur silencieuse
  }
}

/**
 * RÃ©cupÃ¨re l'historique des conversations
 */
export async function getConversationHistory(userId: string): Promise<Array<{
  message: string;
  response: string;
  timestamp: string;
  topics: string[];
}>> {
  try {
    const stored = await AsyncStorage.getItem(`${CONVERSATION_HISTORY_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * GÃ©nÃ¨re le contexte personnalisÃ© pour l'IA
 */
export async function generatePersonalizedContext(
  userId: string,
  user: UserProfile
): Promise<ConversationContext> {
  const preferences = await getUserPreferences(userId);
  const history = await getConversationHistory(userId);

  // Extraire les sujets frÃ©quents
  const topicCounts: Record<string, number> = {};
  history.forEach(conv => {
    conv.topics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });

  const frequentlyAsked = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  const recentTopics = history
    .slice(-10)
    .flatMap(conv => conv.topics)
    .filter((topic, index, arr) => arr.indexOf(topic) === index);

  return {
    userId,
    recentTopics,
    frequentlyAsked,
    preferences,
    lastInteraction: history[history.length - 1]?.timestamp || new Date().toISOString(),
  };
}

/**
 * Extrait les sujets d'un message
 */
function extractTopics(message: string): string[] {
  const topics: string[] = [];
  const lowerMessage = message.toLowerCase();

  // Mots-clÃ©s pour diffÃ©rents sujets
  const topicKeywords: Record<string, string[]> = {
    'priÃ¨re': ['priÃ¨re', 'salat', 'salah', 'namaz', 'prayer'],
    'dhikr': ['dhikr', 'zikr', 'remembrance', 'souvenir'],
    'coran': ['coran', 'quran', 'verset', 'ayah', 'sourate', 'surah'],
    'hadith': ['hadith', 'hadÃ®th', 'sunnah'],
    'ramadan': ['ramadan', 'jeÃ»ne', 'fasting', 'iftar', 'suhoor'],
    'hajj': ['hajj', 'haj', 'omra', 'umrah', 'pÃ¨lerinage'],
    'zakat': ['zakat', 'zakÃ¢t', 'charity', 'charitÃ©'],
    'tawhid': ['tawhid', 'unicitÃ©', 'oneness'],
    'prophÃ¨tes': ['prophÃ¨te', 'prophet', 'muhammad', 'mohammed'],
    'soufisme': ['soufisme', 'tasawwuf', 'sufism'],
  };

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      topics.push(topic);
    }
  });

  return topics;
}







