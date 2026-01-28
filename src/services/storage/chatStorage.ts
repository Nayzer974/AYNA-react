/**
 * Service pour gÃ©rer le stockage des conversations de chat
 */

import { storage } from '@/utils/storage';
import { supabase } from '@/services/auth/supabase';
import { APP_CONFIG } from '@/config';

export interface Conversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    text: string;
    sender: 'user' | 'ayna';
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

function getConversationsKey(userId?: string): string {
  return userId ? `@ayna_conversations_${userId}` : '@ayna_conversations_anonymous';
}

function getCurrentConversationKey(userId?: string): string {
  return userId ? `@ayna_current_conversation_id_${userId}` : '@ayna_current_conversation_id_anonymous';
}

// Legacy keys (before per-user scoping)
const LEGACY_CONVERSATIONS_KEY = '@ayna_conversations';
const LEGACY_CURRENT_CONVERSATION_KEY = '@ayna_current_conversation_id';

/**
 * Charge toutes les conversations sauvegardÃ©es
 */
async function fetchRemoteConversations(userId: string): Promise<Conversation[]> {
  if (!APP_CONFIG.useSupabase || !supabase) return [];

  try {
    // RÃ©cupÃ©rer les conversations de l'utilisateur
    const { data: conversations, error: convError } = await supabase
      .from('chat_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (convError || !conversations) return [];

    const conversationIds = conversations.map((c) => c.id);
    if (conversationIds.length === 0) return [];

    // RÃ©cupÃ©rer les messages associÃ©s
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('id, conversation_id, sender, text, timestamp')
      .in('conversation_id', conversationIds)
      .order('timestamp', { ascending: true });

    if (msgError || !messages) return [];

    // Regrouper par conversation
    const grouped: Record<string, Conversation['messages']> = {};
    for (const msg of messages) {
      if (!grouped[msg.conversation_id]) grouped[msg.conversation_id] = [];
      grouped[msg.conversation_id].push({
        id: msg.id,
        text: msg.text,
        sender: msg.sender as 'user' | 'ayna',
        timestamp: msg.timestamp,
      });
    }

    return conversations.map((c) => ({
      id: c.id,
      title: c.title || 'Conversation',
      messages: grouped[c.id] || [],
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  } catch (error) {
    return [];
  }
}

function mergeConversations(local: Conversation[], remote: Conversation[]): Conversation[] {
  const map = new Map<string, Conversation>();
  for (const conv of local) {
    map.set(conv.id, conv);
  }
  for (const conv of remote) {
    const existing = map.get(conv.id);
    if (!existing) {
      map.set(conv.id, conv);
      continue;
    }
    const existingDate = new Date(existing.updatedAt).getTime();
    const remoteDate = new Date(conv.updatedAt).getTime();
    map.set(conv.id, remoteDate > existingDate ? conv : existing);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function loadConversations(userId?: string, syncRemote: boolean = false): Promise<Conversation[]> {
  try {
    // Migrate legacy global keys -> anonymous bucket once (prevents cross-account leakage)
    try {
      const legacy = await storage.getItem(LEGACY_CONVERSATIONS_KEY);
      if (legacy) {
        const anonKey = getConversationsKey(undefined);
        const anonExisting = await storage.getItem(anonKey);
        if (!anonExisting) {
          await storage.setItem(anonKey, legacy);
        }
        await storage.removeItem(LEGACY_CONVERSATIONS_KEY);
      }
      const legacyCurrent = await storage.getItem(LEGACY_CURRENT_CONVERSATION_KEY);
      if (legacyCurrent) {
        const anonCurrentKey = getCurrentConversationKey(undefined);
        const anonExistingCurrent = await storage.getItem(anonCurrentKey);
        if (!anonExistingCurrent) {
          await storage.setItem(anonCurrentKey, legacyCurrent);
        }
        await storage.removeItem(LEGACY_CURRENT_CONVERSATION_KEY);
      }
    } catch {
      // ignore
    }

    const saved = await storage.getItem(getConversationsKey(userId));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        let localConversations: Conversation[] = parsed.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        if (syncRemote && userId) {
          const remoteConversations = await fetchRemoteConversations(userId);
          const merged = mergeConversations(localConversations, remoteConversations);
          // Sauvegarder le merge pour le mode hors ligne
          await storage.setItem(getConversationsKey(userId), JSON.stringify(merged));
          return merged;
        }

        return localConversations;
      }
    }

    // Rien en local, tenter le cloud si demandÃ©
    if (syncRemote && userId) {
      const remoteConversations = await fetchRemoteConversations(userId);
      await storage.setItem(getConversationsKey(userId), JSON.stringify(remoteConversations));
      return remoteConversations;
    }

    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Sauvegarde une conversation
 */
async function saveConversationRemote(conversation: Conversation, userId?: string): Promise<void> {
  if (!userId || !APP_CONFIG.useSupabase || !supabase) return;

  try {
    // Upsert conversation
    await supabase
      .from('chat_conversations')
      .upsert([
        {
          id: conversation.id,
          user_id: userId,
          title: conversation.title,
          created_at: conversation.createdAt,
          updated_at: conversation.updatedAt,
        },
      ]);

    // Upsert messages
    if (conversation.messages?.length) {
      const rows = conversation.messages.map((m) => ({
        id: m.id,
        conversation_id: conversation.id,
        user_id: userId,
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp,
      }));
      await supabase.from('chat_messages').upsert(rows);
    }
  } catch (error) {
    // Erreur silencieuse en production
  }
}

export async function saveConversation(conversation: Conversation, userId?: string): Promise<void> {
  try {
    const conversations = await loadConversations(userId, false);
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      // Mettre Ã  jour la conversation existante
      conversations[existingIndex] = conversation;
    } else {
      // Ajouter une nouvelle conversation
      conversations.push(conversation);
    }
    
    // Trier par date de mise Ã  jour
    conversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    await storage.setItem(getConversationsKey(userId), JSON.stringify(conversations));

    // Sauvegarde cloud si possible
    await saveConversationRemote(conversation, userId);
  } catch (error) {
    // Erreur silencieuse en production
  }
}

/**
 * Supprime une conversation
 */
async function deleteConversationRemote(conversationId: string, userId?: string): Promise<void> {
  if (!userId || !APP_CONFIG.useSupabase || !supabase) return;
  try {
    await supabase.from('chat_messages').delete().eq('conversation_id', conversationId).eq('user_id', userId);
    await supabase.from('chat_conversations').delete().eq('id', conversationId).eq('user_id', userId);
  } catch (error) {
    // Erreur silencieuse en production
  }
}

export async function deleteConversation(conversationId: string, userId?: string): Promise<void> {
  try {
    const conversations = await loadConversations(userId, false);
    const filtered = conversations.filter(c => c.id !== conversationId);
    await storage.setItem(getConversationsKey(userId), JSON.stringify(filtered));

    await deleteConversationRemote(conversationId, userId);
  } catch (error) {
    // Erreur silencieuse en production
  }
}

/**
 * Charge une conversation par son ID
 */
export async function loadConversation(conversationId: string, userId?: string): Promise<Conversation | null> {
  try {
    const conversations = await loadConversations(userId, false);
    return conversations.find(c => c.id === conversationId) || null;
  } catch (error) {
    return null;
  }
}

/**
 * GÃ©nÃ¨re un titre automatique pour une conversation basÃ© sur le premier message utilisateur
 */
export function generateConversationTitle(messages: Conversation['messages']): string {
  const firstUserMessage = messages.find(m => m.sender === 'user');
  if (firstUserMessage) {
    const text = firstUserMessage.text.trim();
    // Prendre les 50 premiers caractÃ¨res
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }
  return 'Nouvelle conversation';
}

/**
 * Sauvegarde l'ID de la conversation actuelle
 */
export async function saveCurrentConversationId(conversationId: string | null, userId?: string): Promise<void> {
  try {
    if (conversationId) {
      await storage.setItem(getCurrentConversationKey(userId), conversationId);
    } else {
      await storage.removeItem(getCurrentConversationKey(userId));
    }
  } catch (error) {
    // Erreur silencieuse en production
  }
}

/**
 * Charge l'ID de la conversation actuelle
 */
export async function loadCurrentConversationId(userId?: string): Promise<string | null> {
  try {
    const saved = await storage.getItem(getCurrentConversationKey(userId));
    return saved || null;
  } catch (error) {
    return null;
  }
}



