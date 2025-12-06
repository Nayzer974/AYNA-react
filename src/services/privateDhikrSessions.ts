// Service pour les sessions de dhikr privées (stockage local)
import { storage } from '@/utils/storage';
import { getRandomDhikr } from '@/data/dhikrDatabase';
import { supabase } from './supabase';
import { APP_CONFIG } from '@/config';

const PRIVATE_SESSIONS_STORAGE_KEY = 'ayna_private_dhikr_sessions';
const MAX_PRIVATE_SESSIONS = 2;

export interface PrivateDhikrSession {
  id: string;
  userId: string;
  dhikr_text: string;
  target_count: number;
  current_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  invited_users?: string[]; // IDs des utilisateurs invités
}

export interface PrivateSessionParticipant {
  userId: string;
  userName?: string;
  userEmail?: string;
  clickCount: number;
  joinedAt: string;
}

/**
 * Charge toutes les sessions privées d'un utilisateur
 */
export async function loadPrivateSessions(userId: string): Promise<PrivateDhikrSession[]> {
  try {
    if (!userId) {
      return [];
    }
    
    const key = `${PRIVATE_SESSIONS_STORAGE_KEY}_${userId}`;
    const data = await storage.getItem(key);
    
    if (!data) {
      return [];
    }
    
    const sessions = JSON.parse(data);
    if (!Array.isArray(sessions)) {
      return [];
    }
    
    return sessions.filter(s => s && s.userId === userId);
  } catch (error) {
    // Erreur silencieuse
    return [];
  }
}

/**
 * Charge une session privée par ID
 */
export async function getPrivateSession(userId: string, sessionId: string): Promise<PrivateDhikrSession | null> {
  const sessions = await loadPrivateSessions(userId);
  return sessions.find(s => s.id === sessionId) || null;
}

/**
 * Crée une nouvelle session privée
 */
export async function createPrivateSession(
  userId: string,
  targetCount?: number
): Promise<PrivateDhikrSession> {
  // Vérifier le nombre maximum de sessions privées
  const existingSessions = await loadPrivateSessions(userId);
  if (existingSessions.length >= MAX_PRIVATE_SESSIONS) {
    throw new Error(`Vous ne pouvez avoir que ${MAX_PRIVATE_SESSIONS} sessions privées maximum.`);
  }

  // Obtenir un dhikr aléatoire
  const randomDhikr = getRandomDhikr();
  const dhikrText = randomDhikr.arabic || randomDhikr.transliteration;

  // Target aléatoire entre 100 et 999 si non spécifié
  const finalTarget = targetCount || Math.floor(Math.random() * 900) + 100;

  const newSession: PrivateDhikrSession = {
    id: `private_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    dhikr_text: dhikrText,
    target_count: finalTarget,
    current_count: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    invited_users: [],
  };

  // Sauvegarder
  existingSessions.push(newSession);
  await savePrivateSessions(userId, existingSessions);

  // Ne pas synchroniser avec le serveur lors de la création
  // La synchronisation se fera uniquement si l'utilisateur invite d'autres utilisateurs

  return newSession;
}

/**
 * Sauvegarde les sessions privées
 */
async function savePrivateSessions(userId: string, sessions: PrivateDhikrSession[]): Promise<void> {
  try {
    const key = `${PRIVATE_SESSIONS_STORAGE_KEY}_${userId}`;
    await storage.setItem(key, JSON.stringify(sessions));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des sessions privées:', error);
    throw error;
  }
}

/**
 * Ajoute un clic à une session privée
 */
export async function addPrivateSessionClick(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const sessions = await loadPrivateSessions(userId);
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);

  if (sessionIndex === -1) {
    throw new Error('Session introuvable');
  }

  const session = sessions[sessionIndex];

  if (!session.is_active || session.current_count >= session.target_count) {
    return false;
  }

  // Incrémenter le compteur
  session.current_count = Math.min(session.current_count + 1, session.target_count);
  session.is_active = session.current_count < session.target_count;
  
  if (session.current_count >= session.target_count) {
    session.completed_at = new Date().toISOString();
  }
  
  session.updated_at = new Date().toISOString();

  // Sauvegarder
  sessions[sessionIndex] = session;
  await savePrivateSessions(userId, sessions);

  // Synchroniser avec le serveur seulement si des utilisateurs sont invités
  if (session.invited_users && session.invited_users.length > 0 && APP_CONFIG.useSupabase && supabase) {
    try {
      // Synchroniser le compteur avec le serveur pour les utilisateurs invités
      await syncPrivateSessionToServer(session);
    } catch (error) {
      console.warn('Erreur lors de la synchronisation avec le serveur:', error);
      // Ne pas échouer si la synchronisation échoue
    }
  }

  return true;
}

/**
 * Synchronise une session privée avec le serveur (pour les utilisateurs invités)
 */
async function syncPrivateSessionToServer(session: PrivateDhikrSession): Promise<void> {
  if (!supabase || !APP_CONFIG.useSupabase) {
    return;
  }

  // Créer ou mettre à jour une session partagée sur le serveur
  // Cette session sera visible uniquement par les utilisateurs invités
  try {
    // Vérifier si une session partagée existe déjà
    const { data: existingShared } = await supabase
      .from('dhikr_sessions')
      .select('id')
      .eq('created_by', session.userId)
      .eq('is_private', true)
      .eq('private_session_id', session.id)
      .single();

    if (existingShared) {
      // Mettre à jour la session existante
      await supabase
        .from('dhikr_sessions')
        .update({
          current_count: session.current_count,
          is_active: session.is_active,
          completed_at: session.completed_at,
          updated_at: session.updated_at,
        })
        .eq('id', existingShared.id);
    } else {
      // Créer une nouvelle session partagée
      await supabase
        .from('dhikr_sessions')
        .insert({
          created_by: session.userId,
          dhikr_text: session.dhikr_text,
          target_count: session.target_count,
          current_count: session.current_count,
          is_active: session.is_active,
          is_open: false, // Session privée, pas ouverte publiquement
          is_private: true,
          private_session_id: session.id,
          max_participants: session.invited_users?.length || 0,
          completed_at: session.completed_at,
        });
    }
  } catch (error) {
    console.warn('Erreur lors de la synchronisation de la session privée:', error);
  }
}

/**
 * Invite un utilisateur à une session privée
 */
export async function inviteUserToPrivateSession(
  userId: string,
  sessionId: string,
  invitedUserId: string
): Promise<void> {
  const sessions = await loadPrivateSessions(userId);
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);

  if (sessionIndex === -1) {
    throw new Error('Session introuvable');
  }

  const session = sessions[sessionIndex];

  if (!session.invited_users) {
    session.invited_users = [];
  }

  if (session.invited_users.includes(invitedUserId)) {
    return; // Déjà invité
  }

  session.invited_users.push(invitedUserId);
  session.updated_at = new Date().toISOString();

  sessions[sessionIndex] = session;
  await savePrivateSessions(userId, sessions);

  // Synchroniser avec le serveur pour que l'utilisateur invité puisse voir la session
  if (APP_CONFIG.useSupabase && supabase) {
    await syncPrivateSessionToServer(session);
  }
}

/**
 * Supprime une session privée
 */
export async function deletePrivateSession(userId: string, sessionId: string): Promise<void> {
  const sessions = await loadPrivateSessions(userId);
  const filtered = sessions.filter(s => s.id !== sessionId);
  await savePrivateSessions(userId, filtered);

  // Supprimer aussi la session partagée sur le serveur si elle existe
  if (APP_CONFIG.useSupabase && supabase) {
    try {
      await supabase
        .from('dhikr_sessions')
        .delete()
        .eq('private_session_id', sessionId);
    } catch (error) {
      console.warn('Erreur lors de la suppression de la session partagée:', error);
    }
  }
}

/**
 * Charge les sessions privées auxquelles l'utilisateur a été invité
 */
export async function loadInvitedPrivateSessions(userId: string): Promise<PrivateDhikrSession[]> {
  if (!APP_CONFIG.useSupabase || !supabase || !userId) {
    return [];
  }

  try {
    // Chercher les sessions privées où l'utilisateur est participant
    const { data: sharedSessions, error } = await supabase
      .from('dhikr_sessions')
      .select(`
        *,
        dhikr_session_participants!inner(user_id)
      `)
      .eq('is_private', true)
      .not('private_session_id', 'is', null)
      .eq('dhikr_session_participants.user_id', userId);

    if (error) {
      console.warn('Erreur lors de la récupération des sessions invitées:', error);
      return [];
    }

    if (!sharedSessions || !Array.isArray(sharedSessions)) {
      return [];
    }

    // Convertir les sessions partagées en sessions privées
    const invitedSessions: PrivateDhikrSession[] = sharedSessions
      .filter(shared => shared && shared.private_session_id && shared.created_by !== userId)
      .map(shared => ({
        id: shared.private_session_id || shared.id,
        userId: shared.created_by || '',
        dhikr_text: shared.dhikr_text || '',
        target_count: shared.target_count || 0,
        current_count: shared.current_count || 0,
        is_active: shared.is_active !== undefined ? shared.is_active : true,
        created_at: shared.created_at || new Date().toISOString(),
        updated_at: shared.updated_at || new Date().toISOString(),
        completed_at: shared.completed_at || undefined,
        invited_users: [],
      }));

    return invitedSessions;
  } catch (error) {
    console.error('Erreur lors du chargement des sessions invitées:', error);
    return [];
  }
}

