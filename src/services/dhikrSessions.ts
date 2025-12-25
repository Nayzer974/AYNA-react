import { supabase } from './supabase';
import { getRandomDhikr } from '@/data/dhikrDatabase';

export interface DhikrSession {
  id: string;
  created_by: string;
  dhikr_text: string;
  target_count: number | null;
  current_count: number;
  is_active: boolean;
  is_open: boolean;
  max_participants: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  session_name?: string | null;
  prayer_period?: string | null;
  is_auto?: boolean;
}

export interface DhikrSessionParticipant {
  id: string;
  session_id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  joined_at: string;
  click_count: number;
}

/**
 * Obtient l'ID utilisateur de manière fiable
 * Essaie plusieurs méthodes pour récupérer l'ID utilisateur
 */
async function getUserId(): Promise<string | null> {
  if (!supabase) {
    // Supabase n'est pas configuré
    return null;
  }

  // Méthode 1 : Essayer getSession() (plus fiable, fonctionne même sans email vérifié)
  try {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (!sessionError && session?.user?.id) {
    return session.user.id;
    }
  } catch (error: any) {
    // Erreur silencieuse
  }
  
  // Méthode 2 : Essayer getUser()
  try {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!userError && user?.id) {
    return user.id;
  }
  } catch (error: any) {
    // Erreur silencieuse
  }
  
  // Méthode 3 : Retry avec getSession()
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!sessionError && session?.user?.id) {
      return session.user.id;
    }
  } catch (error: any) {
    // Erreur silencieuse
  }
  return null;
}

/**
 * Crée une nouvelle session de dhikr
 * Utilise la nouvelle fonction RPC qui accepte l'ID utilisateur directement
 * @param targetCount - Nombre de clics cible (optionnel, aléatoire entre 100-999 si non spécifié)
 * @param maxParticipants - Nombre maximum de participants (défaut: 100)
 * @param userIdOverride - ID utilisateur à utiliser directement (optionnel, pour contourner getUserId())
 */
export async function createDhikrSession(
  targetCount?: number,
  maxParticipants: number = 100,
  userIdOverride?: string,
  isAdmin?: boolean
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  // Vérifier que l'utilisateur est admin pour créer une session publique
  // Note: Cette vérification est aussi faite dans le frontend, mais on la refait ici pour plus de sécurité
  if (isAdmin === false) {
    throw new Error('Seuls les administrateurs peuvent créer des sessions publiques.');
  }

  // Obtenir l'ID utilisateur avec plusieurs tentatives
  // Si userIdOverride est fourni, l'utiliser directement (depuis le contexte par exemple)
  let userId = userIdOverride || await getUserId();
  
  // Si getUserId() échoue, essayer une dernière fois avec getSession() directement
  if (!userId) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.user?.id) {
        throw new Error('Aucune session active trouvée. Veuillez vous reconnecter.');
      }
      
      userId = session.user.id;
    } catch (sessionError: any) {
      throw new Error('Vous devez être connecté pour créer une session de dhikr. Veuillez vous reconnecter.');
    }
  }
  
  if (!userId) {
    throw new Error('Vous devez être connecté pour créer une session de dhikr. Veuillez vous reconnecter.');
  }

  // Obtenir un dhikr aléatoire
  const randomDhikr = getRandomDhikr();
  const dhikrText = randomDhikr.arabic || randomDhikr.transliteration;

  // Target aléatoire entre 100 et 999 si non spécifié
  const finalTarget = targetCount || Math.floor(Math.random() * 900) + 100;

  // Appeler la nouvelle fonction RPC
  // IMPORTANT: Pour les sessions publiques (créées par les admins), 
  // on passe explicitement p_is_private = false pour s'assurer qu'elles sont bien publiques
  const { data, error } = await supabase.rpc('create_dhikr_session', {
    p_user_id: userId,
    p_dhikr_text: dhikrText,
    p_target_count: finalTarget,
    p_max_participants: maxParticipants,
    p_is_private: false  // Explicitement définir comme session publique
  });

  if (error) {
    // Erreur silencieuse en production
    
    // Messages d'erreur personnalisés
    if (error.message?.includes('déjà dans une autre session')) {
      throw new Error(error.message);
    }
    
    if (error.message?.includes('n\'existe pas')) {
      throw new Error('Erreur d\'authentification. Veuillez vous reconnecter.');
    }
    
    if (error.message?.includes('doit être entre')) {
      throw new Error(error.message);
    }
    
    throw new Error(error.message || 'Erreur lors de la création de la session');
  }

  if (!data) {
    throw new Error('Impossible de créer la session. Aucune donnée retournée.');
  }

  return data;
}

/**
 * Rejoint une session de dhikr
 */
export async function joinDhikrSession(sessionId: string, userIdOverride?: string): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  // Obtenir l'ID utilisateur (peut être null pour les utilisateurs non authentifiés)
  let userId = userIdOverride || await getUserId();

  // Si getUserId() échoue, essayer une dernière fois avec getSession() directement
  if (!userId) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.user?.id) {
        throw new Error('Aucune session active trouvée. Veuillez vous reconnecter.');
      }
      
      userId = session.user.id;
    } catch (sessionError: any) {
      throw new Error('Vous devez être connecté pour rejoindre une session.');
    }
  }

  if (!userId) {
    throw new Error('Vous devez être connecté pour rejoindre une session.');
  }

  // Vérifier si l'utilisateur est déjà participant
    const { data: existingParticipant } = await supabase
      .from('dhikr_session_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (existingParticipant) {
      // L'utilisateur est déjà participant
      return true;
  }

  // Utiliser la fonction RPC
    const { error } = await supabase.rpc('join_dhikr_session', {
      p_user_id: userId,
      p_session_id: sessionId
    });

    if (error) {
      // Erreur silencieuse en production
      throw new Error(error.message || 'Impossible de rejoindre la session');
    }

    return true;
}

/**
 * Quitte une session de dhikr
 */
export async function leaveDhikrSession(sessionId: string): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  // Obtenir l'ID utilisateur
  const userId = await getUserId();

  // Si pas d'utilisateur, on ne peut pas quitter une session spécifique
  if (!userId) {
    throw new Error('Vous devez être connecté pour quitter une session.');
  }

  // Utiliser la fonction RPC
  const { error } = await supabase.rpc('leave_dhikr_session', {
    p_user_id: userId,
    p_session_id: sessionId
  });

  if (error) {
    // Erreur silencieuse en production
    throw new Error(error.message || 'Erreur lors de la sortie de la session');
  }

  return true;
}

/**
 * Ajoute un clic à une session de dhikr
 * Met à jour directement le compteur (pas de queue pour simplifier)
 */
export async function addDhikrSessionClick(sessionId: string, userIdOverride?: string): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  try {
    // Obtenir l'ID utilisateur
    let userId: string | null = userIdOverride || null;
    if (!userId) {
      userId = await getUserId();
    }

    // Utiliser la fonction RPC add_dhikr_click_simple qui enregistre les clics
    const { data, error: rpcError } = await supabase.rpc('add_dhikr_click_simple', {
      p_session_id: sessionId,
      p_user_id: userId
    });

    if (rpcError) {
      // Si la fonction RPC n'existe pas, utiliser la méthode manuelle
      if (rpcError.message?.includes('Could not find the function') || 
          rpcError.message?.includes('function') && rpcError.message?.includes('not found')) {
        console.warn('[dhikrSessions] Fonction RPC add_dhikr_click_simple non trouvée, utilisation de la méthode manuelle');
        
        // Méthode manuelle de fallback
        const { data: session, error: fetchError } = await supabase
          .from('dhikr_sessions')
          .select('current_count, target_count, is_active')
          .eq('id', sessionId)
          .single();

        if (fetchError || !session) {
          throw new Error('Session introuvable');
        }

        if (!session.is_active) {
          return false;
        }

        if (session.target_count !== null && session.current_count >= session.target_count) {
          return false;
        }

        const newCount = session.target_count !== null 
          ? Math.min(session.current_count + 1, session.target_count)
          : session.current_count + 1;
        const isCompleted = session.target_count !== null && newCount >= session.target_count;

        // Enregistrer le clic dans dhikr_session_clicks
        await supabase
          .from('dhikr_session_clicks')
          .insert({
            session_id: sessionId,
            user_id: userId,
            clicked_at: new Date().toISOString()
          });

        // Mettre à jour la session
        const { error: updateError } = await supabase
          .from('dhikr_sessions')
          .update({
            current_count: newCount,
            is_active: !isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (updateError) {
          throw updateError;
        }

        return true;
      }
      
      // Autre erreur RPC
      throw rpcError;
    }

    // La fonction RPC a réussi
    return data === true;
  } catch (error: any) {
    console.error('[dhikrSessions] Erreur lors de l\'enregistrement du clic:', error);
    throw error;
  }
}

/**
 * Obtient toutes les sessions actives
 */
export async function getActiveDhikrSessions(): Promise<DhikrSession[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('dhikr_sessions')
    .select('*')
    .eq('is_active', true)
    .eq('is_open', true)
    .order('created_at', { ascending: false });

  if (error) {
    // Erreur silencieuse en production
    return [];
  }

  // Filtrer les sessions automatiques : ne garder que celles de la période actuelle
  // Les sessions automatiques des périodes précédentes doivent être supprimées
  const sessions = data || [];
  
  // Si aucune session n'est automatique, retourner toutes les sessions
  const autoSessions = sessions.filter((s: any) => s.is_auto === true);
  if (autoSessions.length === 0) {
    return sessions;
  }

  // Pour les sessions automatiques, on les retourne toutes pour l'instant
  // Le système de suppression automatique devrait les gérer
  // Mais on peut aussi filtrer ici si nécessaire
  return sessions;
}

/**
 * Obtient une session par ID
 * Force le rechargement depuis le serveur (pas de cache)
 */
export async function getDhikrSession(sessionId: string): Promise<DhikrSession | null> {
  if (!supabase) {
    return null;
  }

  // Forcer le rechargement depuis le serveur en ajoutant un timestamp
  // pour éviter le cache
  const { data, error } = await supabase
    .from('dhikr_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    // Erreur silencieuse en production
    console.warn('[dhikrSessions] Erreur lors de la récupération de la session:', error);
    return null;
  }

  // S'assurer que current_count est toujours défini
  if (data && (data.current_count === undefined || data.current_count === null)) {
    data.current_count = 0;
  }

  return data;
}

/**
 * Obtient les participants d'une session
 */
export async function getDhikrSessionParticipants(sessionId: string): Promise<DhikrSessionParticipant[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('dhikr_session_participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true });

  if (error) {
    // Erreur silencieuse en production
    return [];
  }

  return data || [];
}

/**
 * Vérifie si l'utilisateur est participant d'une session
 */
export async function isUserParticipant(sessionId: string, userId: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from('dhikr_session_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  return !error && data !== null;
}

/**
 * Obtient la session active actuelle de l'utilisateur
 */
export async function getUserActiveSession(userId: string): Promise<DhikrSession | null> {
  if (!supabase) {
    return null;
  }

  // Trouver la session active de l'utilisateur
  const { data: participantData, error: participantError } = await supabase
    .from('dhikr_session_participants')
    .select('session_id')
    .eq('user_id', userId)
    .limit(1);

  if (participantError || !participantData || participantData.length === 0) {
    return null;
  }

  const sessionId = participantData[0].session_id;

  // Récupérer la session si elle est active
  const { data: sessionData, error: sessionError } = await supabase
    .from('dhikr_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('is_active', true)
    .single();

  if (sessionError || !sessionData) {
    return null;
  }

  return sessionData as DhikrSession;
}

/**
 * Traite les clics en queue (fonction de compatibilité, ne fait plus rien)
 */
export async function processDhikrSessionClicks(): Promise<number> {
  // Les clics sont maintenant traités directement dans addDhikrSessionClick
  // Cette fonction est gardée pour compatibilité mais ne fait plus rien
  return 0;
}

/**
 * Supprime une session de dhikr spécifique
 * L'utilisateur ne peut supprimer que ses propres sessions (ou admin peut supprimer toutes)
 */
export async function deleteDhikrSession(sessionId: string, userId?: string, isAdmin: boolean = false): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  if (!userId) {
    throw new Error('Vous devez être connecté pour supprimer une session');
  }

  try {
    // Essayer d'abord d'utiliser la fonction RPC (si elle existe)
    // Sinon, utiliser la méthode manuelle
    try {
      const { data, error } = await supabase.rpc('delete_dhikr_session', {
        p_session_id: sessionId,
        p_user_id: userId
      });

      if (error) {
        // Si la fonction n'existe pas, utiliser la méthode manuelle
        if (error.message?.includes('Could not find the function') || 
            error.message?.includes('function') && error.message?.includes('not found')) {
          // Fonction RPC non trouvée, utilisation de la méthode manuelle
          // Continuer avec la méthode manuelle ci-dessous
        } else {
          // Autre erreur de la fonction RPC
          // Erreur silencieuse en production
          
          if (error.message?.includes('ne peut supprimer') || error.message?.includes('permissions')) {
            throw new Error(error.message);
          }
          
          if (error.message?.includes("n'existe pas")) {
            throw new Error('La session n\'existe pas');
          }
          
          if (error.message?.includes('administrateur')) {
            throw new Error('Vous n\'avez pas les permissions nécessaires pour supprimer cette session. Vérifiez que vous êtes bien administrateur.');
          }
          
          throw new Error(error.message || 'Erreur lors de la suppression de la session');
        }
      } else {
        // La fonction RPC a réussi
        return data === true;
      }
    } catch (rpcError: any) {
      // Si la fonction RPC n'existe pas, continuer avec la méthode manuelle
      if (rpcError.message?.includes('Could not find the function') || 
          rpcError.message?.includes('function') && rpcError.message?.includes('not found')) {
        // Fonction RPC non trouvée, utilisation de la méthode manuelle
        // Continuer avec la méthode manuelle ci-dessous
      } else {
        throw rpcError;
      }
    }

    // Méthode manuelle (fallback si la fonction RPC n'existe pas encore)
    // Vérifier que l'utilisateur est le créateur de la session (sauf si admin)
    if (!isAdmin) {
      const { data: session, error: fetchError } = await supabase
        .from('dhikr_sessions')
        .select('created_by')
        .eq('id', sessionId)
        .single();

      if (fetchError || !session) {
        throw new Error('Session introuvable');
      }

      // Vérifier que l'utilisateur est le créateur
      if (session.created_by !== userId) {
        throw new Error('Vous ne pouvez supprimer que vos propres sessions');
      }
    }

    // Récupérer d'abord tous les participants pour les notifier (optionnel, pour logging)
    const { data: participantsData } = await supabase
      .from('dhikr_session_participants')
      .select('user_id, user_name, user_email')
      .eq('session_id', sessionId);

    // Supprimer tous les participants (ils seront automatiquement éjectés)
    const { error: participantsError } = await supabase
      .from('dhikr_session_participants')
      .delete()
      .eq('session_id', sessionId);

    if (participantsError) {
      // Erreur silencieuse en production
      throw new Error('Impossible de supprimer les participants de la session');
    }

    // Log pour debug (optionnel)
    if (participantsData && participantsData.length > 0) {
      // Session supprimée
    }

    // Supprimer les clics en queue
    const { error: clicksError } = await supabase
      .from('dhikr_session_clicks')
      .delete()
      .eq('session_id', sessionId);

    if (clicksError) {
      // Erreur silencieuse en production
    }

    // Supprimer la session
    const { data: deletedData, error: deleteError } = await supabase
      .from('dhikr_sessions')
      .delete()
      .eq('id', sessionId)
      .select('id');

    if (deleteError) {
      // Erreur silencieuse en production
      throw deleteError;
    }

    // Vérifier que la session a bien été supprimée
    if (!deletedData || deletedData.length === 0) {
      // La session n'existe peut-être pas ou a déjà été supprimée
      // Vérifier si elle existe encore
      const { data: checkData } = await supabase
        .from('dhikr_sessions')
        .select('id, is_private, private_session_id')
        .eq('id', sessionId)
        .single();
      
      if (checkData) {
        // La session existe encore, peut-être une session privée synchronisée
        if (checkData.is_private && checkData.private_session_id) {
          throw new Error('Cette session est une session privée synchronisée. Elle ne peut pas être supprimée depuis ici.');
        }
        throw new Error('La session n\'a pas pu être supprimée. Vérifiez vos permissions.');
      }
      
      // La session n'existe plus, considérer comme supprimée
      return true;
    }

    return true;
  } catch (err: any) {
    // Erreur silencieuse en production
    throw new Error(err.message || 'Impossible de supprimer la session');
  }
}

/**
 * Supprime toutes les sessions actives (admin uniquement)
 */
export async function deleteAllActiveDhikrSessions(): Promise<number> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  try {
    // D'abord, récupérer les IDs des sessions actives
    const { data: activeSessions, error: fetchError } = await supabase
      .from('dhikr_sessions')
      .select('id')
      .eq('is_active', true);

    if (fetchError) {
      // Erreur silencieuse en production
      throw fetchError;
    }

    if (!activeSessions || activeSessions.length === 0) {
      return 0;
    }

    const sessionIds = activeSessions.map(s => s.id);

    // Supprimer tous les participants des sessions actives
    if (sessionIds.length > 0) {
      const { error: participantsError } = await supabase
        .from('dhikr_session_participants')
        .delete()
        .in('session_id', sessionIds);

      if (participantsError) {
        // Erreur silencieuse en production
        // Continuer même si la suppression des participants échoue
      }
    }

    // Supprimer tous les clics en queue des sessions actives
    if (sessionIds.length > 0) {
      const { error: clicksError } = await supabase
        .from('dhikr_session_clicks')
        .delete()
        .in('session_id', sessionIds);

      if (clicksError) {
        // Erreur silencieuse en production
        // Continuer même si la suppression des clics échoue
      }
    }

    // Enfin, supprimer toutes les sessions actives
    const { data: deletedSessions, error: deleteError } = await supabase
      .from('dhikr_sessions')
      .delete()
      .eq('is_active', true)
      .select('id');

    if (deleteError) {
      // Erreur silencieuse en production
      throw deleteError;
    }

    return deletedSessions?.length || 0;
  } catch (err: any) {
    // Erreur silencieuse en production
    throw new Error(err.message || 'Impossible de supprimer les sessions');
  }
}
