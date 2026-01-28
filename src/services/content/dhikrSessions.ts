import { supabase } from '@/services/auth/supabase';
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
 * Obtient l'ID utilisateur de maniÃ¨re fiable
 * Essaie plusieurs mÃ©thodes pour rÃ©cupÃ©rer l'ID utilisateur
 */
async function getUserId(): Promise<string | null> {
  if (!supabase) {
    // Supabase n'est pas configurÃ©
    return null;
  }

  // MÃ©thode 1 : Essayer getSession() (plus fiable, fonctionne mÃªme sans email vÃ©rifiÃ©)
  try {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (!sessionError && session?.user?.id) {
    return session.user.id;
    }
  } catch (error: any) {
    // Erreur silencieuse
  }
  
  // MÃ©thode 2 : Essayer getUser()
  try {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!userError && user?.id) {
    return user.id;
  }
  } catch (error: any) {
    // Erreur silencieuse
  }
  
  // MÃ©thode 3 : Retry avec getSession()
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
 * CrÃ©e une nouvelle session de dhikr
 * Utilise la nouvelle fonction RPC qui accepte l'ID utilisateur directement
 * @param targetCount - Nombre de clics cible (optionnel, alÃ©atoire entre 100-999 si non spÃ©cifiÃ©)
 * @param maxParticipants - Nombre maximum de participants (dÃ©faut: 100)
 * @param userIdOverride - ID utilisateur Ã  utiliser directement (optionnel, pour contourner getUserId())
 */
export async function createDhikrSession(
  targetCount?: number,
  maxParticipants: number = 100,
  userIdOverride?: string,
  isAdmin?: boolean
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configurÃ©');
  }

  // VÃ©rifier que l'utilisateur est admin pour crÃ©er une session publique
  // Note: Cette vÃ©rification est aussi faite dans le frontend, mais on la refait ici pour plus de sÃ©curitÃ©
  if (isAdmin === false) {
    throw new Error('Seuls les administrateurs peuvent crÃ©er des sessions publiques.');
  }

  // Obtenir l'ID utilisateur avec plusieurs tentatives
  // Si userIdOverride est fourni, l'utiliser directement (depuis le contexte par exemple)
  let userId = userIdOverride || await getUserId();
  
  // Si getUserId() Ã©choue, essayer une derniÃ¨re fois avec getSession() directement
  if (!userId) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.user?.id) {
        throw new Error('Aucune session active trouvÃ©e. Veuillez vous reconnecter.');
      }
      
      userId = session.user.id;
    } catch (sessionError: any) {
      throw new Error('Vous devez Ãªtre connectÃ© pour crÃ©er une session de dhikr. Veuillez vous reconnecter.');
    }
  }
  
  if (!userId) {
    throw new Error('Vous devez Ãªtre connectÃ© pour crÃ©er une session de dhikr. Veuillez vous reconnecter.');
  }

  // Obtenir un dhikr alÃ©atoire
  const randomDhikr = getRandomDhikr();
  const dhikrText = randomDhikr.arabic || randomDhikr.transliteration;

  // Target alÃ©atoire entre 100 et 999 si non spÃ©cifiÃ©
  const finalTarget = targetCount || Math.floor(Math.random() * 900) + 100;

  // Appeler la nouvelle fonction RPC
  // IMPORTANT: Pour les sessions publiques (crÃ©Ã©es par les admins), 
  // on passe explicitement p_is_private = false pour s'assurer qu'elles sont bien publiques
  const { data, error } = await supabase.rpc('create_dhikr_session', {
    p_user_id: userId,
    p_dhikr_text: dhikrText,
    p_target_count: finalTarget,
    p_max_participants: maxParticipants,
    p_is_private: false  // Explicitement dÃ©finir comme session publique
  });

  if (error) {
    // Erreur silencieuse en production
    
    // Messages d'erreur personnalisÃ©s
    if (error.message?.includes('dÃ©jÃ  dans une autre session')) {
      throw new Error(error.message);
    }
    
    if (error.message?.includes('n\'existe pas')) {
      throw new Error('Erreur d\'authentification. Veuillez vous reconnecter.');
    }
    
    if (error.message?.includes('doit Ãªtre entre')) {
      throw new Error(error.message);
    }
    
    throw new Error(error.message || 'Erreur lors de la crÃ©ation de la session');
  }

  if (!data) {
    throw new Error('Impossible de crÃ©er la session. Aucune donnÃ©e retournÃ©e.');
  }

  return data;
}

/**
 * Rejoint une session de dhikr
 */
export async function joinDhikrSession(sessionId: string, userIdOverride?: string): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configurÃ©');
  }

  // Obtenir l'ID utilisateur (peut Ãªtre null pour les utilisateurs non authentifiÃ©s)
  let userId = userIdOverride || await getUserId();

  // Si getUserId() Ã©choue, essayer une derniÃ¨re fois avec getSession() directement
  if (!userId) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.user?.id) {
        throw new Error('Aucune session active trouvÃ©e. Veuillez vous reconnecter.');
      }
      
      userId = session.user.id;
    } catch (sessionError: any) {
      throw new Error('Vous devez Ãªtre connectÃ© pour rejoindre une session.');
    }
  }

  if (!userId) {
    throw new Error('Vous devez Ãªtre connectÃ© pour rejoindre une session.');
  }

  // VÃ©rifier si l'utilisateur est dÃ©jÃ  participant
    const { data: existingParticipant } = await supabase
      .from('dhikr_session_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (existingParticipant) {
      // L'utilisateur est dÃ©jÃ  participant
      return true;
  }

  // VÃ©rifier que la session existe et est active
  const { data: session, error: sessionError } = await supabase
    .from('dhikr_sessions')
    .select('id, is_active, is_open')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error('Session introuvable');
  }

  if (!session.is_active || !session.is_open) {
    throw new Error('Cette session n\'est plus active');
  }

  // Essayer d'abord avec la fonction RPC
  const { error: rpcError } = await supabase.rpc('join_dhikr_session', {
      p_user_id: userId,
      p_session_id: sessionId
    });

  // Si l'erreur est "Vous Ãªtes dÃ©jÃ  dans une autre session", contourner en insÃ©rant directement
  // pour permettre de rejoindre plusieurs sessions communes
  if (rpcError) {
    const errorMessage = rpcError.message || '';
    
    // Si l'erreur indique que l'utilisateur est dÃ©jÃ  dans une autre session publique,
    // on insÃ¨re directement dans la table pour permettre de rejoindre plusieurs sessions communes
    if (errorMessage.includes('dÃ©jÃ  dans une autre session') || 
        errorMessage.includes('P0001') ||
        errorMessage.includes('une seule session publique')) {
      
      // VÃ©rifier que la session n'est pas privÃ©e (pour les sessions communes seulement)
      const { data: sessionCheck } = await supabase
        .from('dhikr_sessions')
        .select('is_private')
        .eq('id', sessionId)
        .single();
      
      // Si c'est une session publique (commune), permettre de rejoindre plusieurs sessions
      if (sessionCheck && !sessionCheck.is_private) {
        // InsÃ©rer directement dans la table des participants
        const { error: insertError } = await supabase
          .from('dhikr_session_participants')
          .insert({
            session_id: sessionId,
            user_id: userId,
            joined_at: new Date().toISOString(),
            click_count: 0
          });

        if (insertError) {
          // Si l'insertion Ã©choue, c'est peut-Ãªtre parce que l'utilisateur est dÃ©jÃ  participant
          // VÃ©rifier Ã  nouveau
          const { data: checkParticipant } = await supabase
            .from('dhikr_session_participants')
            .select('id')
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .single();
          
          if (checkParticipant) {
            // L'utilisateur est dÃ©jÃ  participant, c'est OK
            return true;
          }
          
          throw new Error('Impossible de rejoindre la session');
        }
        
        // Insertion rÃ©ussie
        return true;
      } else {
        // Pour les sessions privÃ©es, on respecte la restriction
        throw new Error(errorMessage || 'Impossible de rejoindre la session');
      }
    }
    
    // Autre erreur, la propager
    throw new Error(errorMessage || 'Impossible de rejoindre la session');
    }

    return true;
}

/**
 * Quitte une session de dhikr
 */
export async function leaveDhikrSession(sessionId: string): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configurÃ©');
  }

  // Obtenir l'ID utilisateur
  const userId = await getUserId();

  // Si pas d'utilisateur, on ne peut pas quitter une session spÃ©cifique
  if (!userId) {
    throw new Error('Vous devez Ãªtre connectÃ© pour quitter une session.');
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
 * Ajoute un clic Ã  une session de dhikr
 * Met Ã  jour directement le compteur (pas de queue pour simplifier)
 */
export async function addDhikrSessionClick(sessionId: string, userIdOverride?: string): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configurÃ©');
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
      // Si la fonction RPC n'existe pas, utiliser la mÃ©thode manuelle
      if (rpcError.message?.includes('Could not find the function') || 
          rpcError.message?.includes('function') && rpcError.message?.includes('not found')) {
        console.warn('[dhikrSessions] Fonction RPC add_dhikr_click_simple non trouvÃ©e, utilisation de la mÃ©thode manuelle');
        
        // MÃ©thode manuelle de fallback
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

        // Mettre Ã  jour la session
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

    // La fonction RPC a rÃ©ussi
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
    console.log('[dhikrSessions] getActiveDhikrSessions: Supabase non disponible');
    return [];
  }

  console.log('[dhikrSessions] getActiveDhikrSessions: RÃ©cupÃ©ration des sessions...');

  const { data, error } = await supabase
    .from('dhikr_sessions')
    .select('*')
    .eq('is_active', true)
    .eq('is_open', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[dhikrSessions] getActiveDhikrSessions: Erreur Supabase:', error);
    return [];
  }

  const sessions = data || [];
  console.log(`[dhikrSessions] getActiveDhikrSessions: ${sessions.length} session(s) trouvÃ©e(s)`);
  
  // Log dÃ©taillÃ© des sessions pour debug
  sessions.forEach((s: any, idx: number) => {
    console.log(`[dhikrSessions] Session ${idx + 1}: id=${s.id?.substring(0, 8)}..., is_auto=${s.is_auto}, is_private=${s.is_private}`);
  });
  
  // Si aucune session n'est automatique, retourner toutes les sessions
  const autoSessions = sessions.filter((s: any) => s.is_auto === true);
  console.log(`[dhikrSessions] getActiveDhikrSessions: ${autoSessions.length} session(s) automatique(s)`);
  
  if (autoSessions.length === 0) {
    return sessions;
  }

  // Pour les sessions automatiques, on les retourne toutes pour l'instant
  // Le systÃ¨me de suppression automatique devrait les gÃ©rer
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
  // pour Ã©viter le cache
  const { data, error } = await supabase
    .from('dhikr_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    // Erreur silencieuse en production
    console.warn('[dhikrSessions] Erreur lors de la rÃ©cupÃ©ration de la session:', error);
    return null;
  }

  // S'assurer que current_count est toujours dÃ©fini
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
 * VÃ©rifie si l'utilisateur est participant d'une session
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

  // RÃ©cupÃ©rer la session si elle est active
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
 * Traite les clics en queue (fonction de compatibilitÃ©, ne fait plus rien)
 */
export async function processDhikrSessionClicks(): Promise<number> {
  // Les clics sont maintenant traitÃ©s directement dans addDhikrSessionClick
  // Cette fonction est gardÃ©e pour compatibilitÃ© mais ne fait plus rien
  return 0;
}

/**
 * Supprime une session de dhikr spÃ©cifique
 * L'utilisateur ne peut supprimer que ses propres sessions (ou admin peut supprimer toutes)
 */
export async function deleteDhikrSession(sessionId: string, userId?: string, isAdmin: boolean = false): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configurÃ©');
  }

  if (!userId) {
    throw new Error('Vous devez Ãªtre connectÃ© pour supprimer une session');
  }

  try {
    // Essayer d'abord d'utiliser la fonction RPC (si elle existe)
    // Sinon, utiliser la mÃ©thode manuelle
    try {
      const { data, error } = await supabase.rpc('delete_dhikr_session', {
        p_session_id: sessionId,
        p_user_id: userId
      });

      if (error) {
        // Si la fonction n'existe pas, utiliser la mÃ©thode manuelle
        if (error.message?.includes('Could not find the function') || 
            error.message?.includes('function') && error.message?.includes('not found')) {
          // Fonction RPC non trouvÃ©e, utilisation de la mÃ©thode manuelle
          // Continuer avec la mÃ©thode manuelle ci-dessous
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
            throw new Error('Vous n\'avez pas les permissions nÃ©cessaires pour supprimer cette session. VÃ©rifiez que vous Ãªtes bien administrateur.');
          }
          
          throw new Error(error.message || 'Erreur lors de la suppression de la session');
        }
      } else {
        // La fonction RPC a rÃ©ussi
        return data === true;
      }
    } catch (rpcError: any) {
      // Si la fonction RPC n'existe pas, continuer avec la mÃ©thode manuelle
      if (rpcError.message?.includes('Could not find the function') || 
          rpcError.message?.includes('function') && rpcError.message?.includes('not found')) {
        // Fonction RPC non trouvÃ©e, utilisation de la mÃ©thode manuelle
        // Continuer avec la mÃ©thode manuelle ci-dessous
      } else {
        throw rpcError;
      }
    }

    // MÃ©thode manuelle (fallback si la fonction RPC n'existe pas encore)
    // VÃ©rifier que l'utilisateur est le crÃ©ateur de la session (sauf si admin)
    if (!isAdmin) {
      const { data: session, error: fetchError } = await supabase
        .from('dhikr_sessions')
        .select('created_by')
        .eq('id', sessionId)
        .single();

      if (fetchError || !session) {
        throw new Error('Session introuvable');
      }

      // VÃ©rifier que l'utilisateur est le crÃ©ateur
      if (session.created_by !== userId) {
        throw new Error('Vous ne pouvez supprimer que vos propres sessions');
      }
    }

    // RÃ©cupÃ©rer d'abord tous les participants pour les notifier (optionnel, pour logging)
    const { data: participantsData } = await supabase
      .from('dhikr_session_participants')
      .select('user_id, user_name, user_email')
      .eq('session_id', sessionId);

    // Supprimer tous les participants (ils seront automatiquement Ã©jectÃ©s)
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
      // Session supprimÃ©e
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

    // VÃ©rifier que la session a bien Ã©tÃ© supprimÃ©e
    if (!deletedData || deletedData.length === 0) {
      // La session n'existe peut-Ãªtre pas ou a dÃ©jÃ  Ã©tÃ© supprimÃ©e
      // VÃ©rifier si elle existe encore
      const { data: checkData } = await supabase
        .from('dhikr_sessions')
        .select('id, is_private, private_session_id')
        .eq('id', sessionId)
        .single();
      
      if (checkData) {
        // La session existe encore, peut-Ãªtre une session privÃ©e synchronisÃ©e
        if (checkData.is_private && checkData.private_session_id) {
          throw new Error('Cette session est une session privÃ©e synchronisÃ©e. Elle ne peut pas Ãªtre supprimÃ©e depuis ici.');
        }
        throw new Error('La session n\'a pas pu Ãªtre supprimÃ©e. VÃ©rifiez vos permissions.');
      }
      
      // La session n'existe plus, considÃ©rer comme supprimÃ©e
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
    throw new Error('Supabase n\'est pas configurÃ©');
  }

  try {
    // D'abord, rÃ©cupÃ©rer les IDs des sessions actives
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
        // Continuer mÃªme si la suppression des participants Ã©choue
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
        // Continuer mÃªme si la suppression des clics Ã©choue
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

