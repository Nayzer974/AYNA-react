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
  invite_token?: string; // Token unique pour l'invitation par lien
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
 * Génère un nouveau token d'invitation pour une session existante
 */
export async function regenerateInviteToken(userId: string, sessionId: string): Promise<string> {
  const sessions = await loadPrivateSessions(userId);
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);

  if (sessionIndex === -1) {
    throw new Error('Session introuvable');
  }

  const session = sessions[sessionIndex];
  const newToken = generateInviteToken();
  session.invite_token = newToken;
  session.updated_at = new Date().toISOString();

  sessions[sessionIndex] = session;
  await savePrivateSessions(userId, sessions);

  // Synchroniser avec le serveur si des utilisateurs sont invités
  if (session.invited_users && session.invited_users.length > 0 && APP_CONFIG.useSupabase && supabase) {
    try {
      await syncPrivateSessionToServer(session);
    } catch (error) {
      // Erreur silencieuse
    }
  }

  return newToken;
}

/**
 * Crée une nouvelle session privée
 */
export async function createPrivateSession(
  userId: string,
  targetCount?: number,
  dhikrText?: string
): Promise<PrivateDhikrSession> {
  // Vérifier le nombre maximum de sessions privées
  const existingSessions = await loadPrivateSessions(userId);
  if (existingSessions.length >= MAX_PRIVATE_SESSIONS) {
    throw new Error(`Vous ne pouvez avoir que ${MAX_PRIVATE_SESSIONS} sessions privées maximum.`);
  }

  // Utiliser le dhikr fourni ou obtenir un dhikr aléatoire
  const finalDhikrText = dhikrText || (() => {
  const randomDhikr = getRandomDhikr();
    return randomDhikr.arabic || randomDhikr.transliteration;
  })();

  // Target aléatoire entre 100 et 999 si non spécifié
  const finalTarget = targetCount || Math.floor(Math.random() * 900) + 100;

  // Générer un token d'invitation unique
  const inviteToken = generateInviteToken();

  const newSession: PrivateDhikrSession = {
    id: `private_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    dhikr_text: finalDhikrText,
    target_count: finalTarget,
    current_count: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    invited_users: [],
    invite_token: inviteToken,
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
    // Erreur silencieuse en production
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
      // Erreur silencieuse en production
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
      // Le token est stocké dans session_name pour référence (format: "Session privée - TOKEN")
      const sessionName = session.invite_token 
        ? `Session privée - ${session.invite_token}`
        : `Session privée - ${session.id.substring(0, 8)}`;
      
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
          max_participants: session.invited_users?.length || 100, // Limite par défaut si pas d'invités
          completed_at: session.completed_at,
          session_name: sessionName,
        });
    }
  } catch (error) {
    // Erreur silencieuse en production
  }
}

/**
 * Génère un token d'invitation unique
 */
function generateInviteToken(): string {
  // Générer un token unique basé sur timestamp + random
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}`;
}

/**
 * Génère un lien d'invitation pour une session privée (deep link)
 * Utilise le scheme de l'app (ayna://) pour la production
 * Pour Expo Go en développement, utiliser exp://localhost:8081
 */
export function generateInviteLink(sessionId: string, inviteToken: string): string {
  // Utiliser le scheme de l'app (ayna://) pour le deep linking
  // En développement avec Expo Go, cela ne fonctionnera pas, mais en production oui
  return `ayna://dhikr/invite/${sessionId}?token=${inviteToken}`;
}

/**
 * Génère un lien d'invitation partageable
 * Ce lien utilise le deep link directement car les apps modernes (WhatsApp, SMS, etc.) 
 * peuvent ouvrir les deep links si l'app est installée
 */
export function generateInviteLinkWeb(sessionId: string, inviteToken: string): string {
  // Utiliser directement le deep link pour le partage
  // Les apps modernes (WhatsApp, SMS, email, etc.) peuvent ouvrir les deep links
  // Si l'app n'est pas installée, l'utilisateur verra une erreur mais pourra copier le lien
  return generateInviteLink(sessionId, inviteToken);
  
  // Alternative future: créer une page web qui redirige vers l'app
  // const baseUrl = APP_CONFIG.openrouterSiteUrl || 'https://ayna.app';
  // return `${baseUrl}/dhikr/invite/${sessionId}?token=${inviteToken}`;
}

/**
 * Rejoint une session privée via un token d'invitation
 */
export async function joinPrivateSessionByToken(
  userId: string,
  sessionId: string,
  inviteToken: string
): Promise<PrivateDhikrSession> {
  if (!APP_CONFIG.useSupabase || !supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  try {
    // Chercher la session privée sur le serveur via le token
    const { data: sharedSession, error } = await supabase
      .from('dhikr_sessions')
      .select('*')
      .eq('is_private', true)
      .eq('private_session_id', sessionId)
      .single();

    if (error || !sharedSession) {
      throw new Error('Session introuvable ou lien invalide');
    }

    // Vérifier que l'utilisateur n'est pas déjà participant
    const { data: existingParticipant } = await supabase
      .from('dhikr_session_participants')
      .select('id')
      .eq('session_id', sharedSession.id)
      .eq('user_id', userId)
      .single();

    if (existingParticipant) {
      // L'utilisateur est déjà participant, retourner la session
      return {
        id: sharedSession.private_session_id || sharedSession.id,
        userId: sharedSession.created_by || '',
        dhikr_text: sharedSession.dhikr_text || '',
        target_count: sharedSession.target_count || 0,
        current_count: sharedSession.current_count || 0,
        is_active: sharedSession.is_active !== undefined ? sharedSession.is_active : true,
        created_at: sharedSession.created_at || new Date().toISOString(),
        updated_at: sharedSession.updated_at || new Date().toISOString(),
        completed_at: sharedSession.completed_at || undefined,
        invited_users: [],
      };
    }

    // Ajouter l'utilisateur comme participant via la fonction RPC
    const { error: joinError } = await supabase.rpc('join_dhikr_session', {
      p_user_id: userId,
      p_session_id: sharedSession.id
    });

    if (joinError) {
      throw new Error(joinError.message || 'Impossible de rejoindre la session');
    }

    // Ajouter l'utilisateur à la liste des invités dans la session locale du créateur
    // (cette partie sera gérée automatiquement lors de la synchronisation)

    // Retourner la session
    return {
      id: sharedSession.private_session_id || sharedSession.id,
      userId: sharedSession.created_by || '',
      dhikr_text: sharedSession.dhikr_text || '',
      target_count: sharedSession.target_count || 0,
      current_count: sharedSession.current_count || 0,
      is_active: sharedSession.is_active !== undefined ? sharedSession.is_active : true,
      created_at: sharedSession.created_at || new Date().toISOString(),
      updated_at: sharedSession.updated_at || new Date().toISOString(),
      completed_at: sharedSession.completed_at || undefined,
      invited_users: [],
    };
  } catch (error: any) {
    throw new Error(error.message || 'Erreur lors de la jointure à la session');
  }
}

/**
 * Invite un utilisateur à une session privée (ancienne méthode, gardée pour compatibilité)
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
      // Erreur silencieuse en production
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
      // Erreur silencieuse en production
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
    // Erreur silencieuse en production
    return [];
  }
}

