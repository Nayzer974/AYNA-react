/**
 * Service de gestion des sessions communes automatiques
 * 
 * GÃ¨re la crÃ©ation des sessions communes automatiques pour les dhikr de la page d'accueil.
 * Ces sessions sont crÃ©Ã©es via une fonction RPC Supabase pour contourner les politiques RLS.
 * 
 * Il y a 2 sessions communes (les mÃªmes dhikr que la carte de l'accueil) :
 * 1. Session duah rabanah du jour (rotation toutes les 24h)
 * 2. Session dhikr du jour (rotation toutes les 24h)
 */

import { supabase } from '@/services/auth/supabase';
import { getDuahRabanahByIndex } from '@/data/duahRabanah';
import { dhikrDatabase } from '@/data/dhikrDatabase';

/**
 * Date de rÃ©fÃ©rence pour calculer l'index du duah (1er janvier 2024)
 */
const REFERENCE_DATE = new Date('2024-01-01T00:00:00Z').getTime();

/**
 * Calcule l'index du duah rabanah basÃ© sur le nombre de jours Ã©coulÃ©s depuis la date de rÃ©fÃ©rence
 * Chaque jour correspond Ã  un nouvel index, crÃ©ant une rotation sur 24h
 */
export function getCurrentDuahIndex(): number {
  const now = new Date();
  const nowTime = now.getTime();

  // Calculer le nombre de jours Ã©coulÃ©s depuis la date de rÃ©fÃ©rence
  const daysSinceReference = Math.floor((nowTime - REFERENCE_DATE) / (24 * 60 * 60 * 1000));

  return daysSinceReference;
}

/**
 * Types de sessions communes (2 sessions : duah rabanah et dhikr)
 */
export type AutoSessionType = 'home_duah' | 'home_dhikr';

/**
 * Obtient les dhikr du jour pour la page d'accueil
 * Retourne exactement les mÃªmes dhikr que ceux affichÃ©s dans la carte de l'accueil
 */
export function getHomeDhikrOfDay(): {
  duahRabanah: { arabic: string; transliteration: string; translation: string; reference?: string };
  dhikr: { arabic: string; transliteration: string; translation: string };
} {
  const currentDayIndex = getCurrentDuahIndex();

  // Duah rabanah du jour (exactement comme dans Home.tsx)
  const duahRabanah = getDuahRabanahByIndex(currentDayIndex);

  // Dhikr du jour (exactement comme dans Home.tsx)
  const dhikr = dhikrDatabase[currentDayIndex % dhikrDatabase.length];

  return {
    duahRabanah: {
      arabic: duahRabanah.arabic,
      transliteration: duahRabanah.transliteration,
      translation: duahRabanah.translation,
      reference: duahRabanah.reference
    },
    dhikr: {
      arabic: dhikr.arabic,
      transliteration: dhikr.transliteration,
      translation: dhikr.translation
    }
  };
}

/**
 * CrÃ©e une session automatique via la fonction RPC Supabase
 * Utilise la fonction create_home_dhikr_session qui ne supprime pas les sessions existantes
 */
async function createAutoSessionViaRPC(
  userId: string,
  dhikrText: string,
  sessionName: string = 'Session commune'
): Promise<string | null> {
  if (!supabase) {
    console.error('[AutoWorldSessionManager] Supabase non disponible');
    return null;
  }

  try {
    console.log('[AutoWorldSessionManager] Appel RPC create_home_dhikr_session...');

    const { data: sessionId, error } = await supabase.rpc('create_home_dhikr_session', {
      p_user_id: userId,
      p_dhikr_text: dhikrText,
      p_session_name: sessionName
    });

    if (error) {
      console.error('[AutoWorldSessionManager] Erreur RPC:', error);
      return null;
    }

    console.log('[AutoWorldSessionManager] Session crÃ©Ã©e via RPC:', sessionId);
    return sessionId;
  } catch (error: any) {
    console.error('[AutoWorldSessionManager] Erreur lors de l\'appel RPC:', error);
    return null;
  }
}

/**
 * CrÃ©e ou rÃ©cupÃ¨re une session commune automatique spÃ©cifique
 */
async function createOrUpdateAutoSessionByType(
  userId: string,
  type: AutoSessionType
): Promise<string | null> {
  if (!supabase) {
    console.error(`[AutoWorldSessionManager] Supabase non disponible pour crÃ©er la session "${type}"`);
    return null;
  }

  try {
    console.log(`[AutoWorldSessionManager] DÃ©but crÃ©ation session "${type}" pour user:`, userId);

    // Obtenir les dhikr du jour (les mÃªmes que la page d'accueil)
    const homeDhikr = getHomeDhikrOfDay();

    // PrÃ©parer le texte du dhikr selon le type
    let dhikrText: string;
    let sessionName: string;

    if (type === 'home_duah') {
      // Duah rabanah du jour (mÃªme que la carte de l'accueil)
      dhikrText = JSON.stringify(homeDhikr.duahRabanah);
      sessionName = 'Session commune - Duah';
      console.log('[AutoWorldSessionManager] Duah rabanah:', homeDhikr.duahRabanah.arabic.substring(0, 30) + '...');
    } else if (type === 'home_dhikr') {
      // Dhikr du jour (mÃªme que la carte de l'accueil)
      dhikrText = JSON.stringify(homeDhikr.dhikr);
      sessionName = 'Session commune - Dhikr';
      console.log('[AutoWorldSessionManager] Dhikr:', homeDhikr.dhikr.arabic.substring(0, 30) + '...');
    } else {
      console.error('[AutoWorldSessionManager] Type de session inconnu:', type);
      return null;
    }

    // Utiliser la fonction RPC pour crÃ©er la session
    const sessionId = await createAutoSessionViaRPC(userId, dhikrText, sessionName);

    if (sessionId) {
      console.log(`[AutoWorldSessionManager] Session "${type}" crÃ©Ã©e/rÃ©cupÃ©rÃ©e: ${sessionId}`);
    } else {
      console.error(`[AutoWorldSessionManager] Ã‰chec crÃ©ation session "${type}"`);
    }

    return sessionId;
  } catch (error: any) {
    console.error(`[AutoWorldSessionManager] Erreur crÃ©ation session "${type}":`, error);
    return null;
  }
}

/**
 * CrÃ©e ou met Ã  jour les 2 sessions communes automatiques
 * - Session duah rabanah du jour (mÃªme que la carte de l'accueil)
 * - Session dhikr du jour (mÃªme que la carte de l'accueil)
 */
export async function createOrUpdateAllAutoWorldSessions(
  userId: string
): Promise<{ homeDuah: string | null; homeDhikr: string | null }> {
  try {
    console.log('[AutoWorldSessionManager] Création des 2 sessions communes (mêmes dhikr que l\'accueil)...');

    // Nettoyer d'abord les sessions obsolètes pour éviter les duplications ou incohérences
    await cleanupInvalidAutoSessions();

    // Créer les 2 sessions communes en séquence
    const homeDuah = await createOrUpdateAutoSessionByType(userId, 'home_duah');
    const homeDhikr = await createOrUpdateAutoSessionByType(userId, 'home_dhikr');

    console.log('[AutoWorldSessionManager] Résultat:', {
      homeDuah: homeDuah ? `OK (${homeDuah})` : 'ÉCHEC',
      homeDhikr: homeDhikr ? `OK (${homeDhikr})` : 'ÉCHEC',
    });

    return { homeDuah, homeDhikr };
  } catch (error: any) {
    console.error('[AutoWorldSessionManager] Erreur lors de la crÃ©ation des sessions communes:', error);
    return { homeDuah: null, homeDhikr: null };
  }
}

/**
 * VÃ©rifie et met Ã  jour toutes les sessions communes automatiques
 * Ã€ appeler au dÃ©marrage de la page Dairat an-Nur
 */
export async function checkAndUpdateAllAutoWorldSessions(
  userId: string
): Promise<void> {
  try {
    await createOrUpdateAllAutoWorldSessions(userId);
  } catch (error) {
    console.error('[AutoWorldSessionManager] Erreur lors de la vÃ©rification des sessions:', error);
  }
}

/**
 * Nettoie les sessions automatiques invalides (qui ne correspondent pas aux dhikr du jour)
 * Cela garantit que seules les sessions correspondant exactement à la page d'accueil sont actives
 */
async function cleanupInvalidAutoSessions(): Promise<void> {
  if (!supabase) return;

  try {
    // 1. Obtenir les textes attendus pour aujourd'hui
    const homeDhikr = getHomeDhikrOfDay();
    const expectedDuahText = JSON.stringify(homeDhikr.duahRabanah);
    const expectedDhikrText = JSON.stringify(homeDhikr.dhikr);

    // 2. Récupérer toutes les sessions automatiques actives
    const { data: sessions, error } = await supabase
      .from('dhikr_sessions')
      .select('id, dhikr_text, session_name')
      .eq('is_auto', true)
      .eq('is_active', true);

    if (error || !sessions || sessions.length === 0) return;

    const sessionsToDelete: string[] = [];
    let keptDuahId: string | null = null;
    let keptDhikrId: string | null = null;

    // 3. Identifier les sessions obsolètes ou en double
    // On itère du plus récent au plus ancien (si on avait un champ de date, sinon on fait confiance à l'ordre de retour)
    // Mais ici on va juste marquer le premier trouvé comme "à garder" et le reste comme "à supprimer"
    for (const session of sessions) {
      let shouldDelete = false;

      if (session.session_name === 'Session commune - Duah') {
        if (keptDuahId === null && (session.dhikr_text === expectedDuahText || JSON.parse(session.dhikr_text).arabic === homeDhikr.duahRabanah.arabic)) {
          keptDuahId = session.id;
          continue;
        }
        shouldDelete = true;
      } else if (session.session_name === 'Session commune - Dhikr') {
        if (keptDhikrId === null && (session.dhikr_text === expectedDhikrText || JSON.parse(session.dhikr_text).arabic === homeDhikr.dhikr.arabic)) {
          keptDhikrId = session.id;
          continue;
        }
        shouldDelete = true;
      } else {
        // Autre session auto (nom obsolete ou inconnu)
        shouldDelete = true;
      }

      if (shouldDelete) {
        sessionsToDelete.push(session.id);
      }
    }

    // 4. Supprimer les sessions invalides ou excédentaires
    if (sessionsToDelete.length > 0) {
      console.log(`[AutoWorldSessionManager] Suppression de ${sessionsToDelete.length} session(s) obsolètes ou en double`);

      await supabase.from('dhikr_session_participants').delete().in('session_id', sessionsToDelete);
      await supabase.from('dhikr_session_clicks').delete().in('session_id', sessionsToDelete);
      await supabase.from('dhikr_sessions').delete().in('id', sessionsToDelete);
    }
  } catch (error) {
    console.error('[AutoWorldSessionManager] Erreur lors du nettoyage des sessions:', error);
  }
}

/**
 * Supprime toutes les sessions automatiques existantes
 * ATTENTION: Cette fonction supprime TOUTES les sessions automatiques
 */
export async function deleteAllAutoWorldSessions(): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    const { data: autoSessions } = await supabase
      .from('dhikr_sessions')
      .select('id')
      .eq('is_auto', true);

    if (!autoSessions || autoSessions.length === 0) {
      return;
    }

    const sessionIds = autoSessions.map(s => s.id);

    console.log(`[AutoWorldSessionManager] Suppression de ${sessionIds.length} session(s) automatique(s)`);

    await supabase
      .from('dhikr_session_participants')
      .delete()
      .in('session_id', sessionIds);

    await supabase
      .from('dhikr_session_clicks')
      .delete()
      .in('session_id', sessionIds);

    await supabase
      .from('dhikr_sessions')
      .delete()
      .in('id', sessionIds);

    console.log(`[AutoWorldSessionManager] ${sessionIds.length} session(s) automatique(s) supprimÃ©e(s)`);
  } catch (error) {
    console.error('[AutoWorldSessionManager] Erreur lors de la suppression:', error);
  }
}

// Anciennes fonctions pour compatibilitÃ©
/** @deprecated Utiliser createOrUpdateAllAutoWorldSessions Ã  la place */
export async function createOrUpdateAutoWorldSession(userId: string): Promise<string | null> {
  const result = await createOrUpdateAllAutoWorldSessions(userId);
  return result.homeDuah;
}

/** @deprecated Utiliser checkAndUpdateAllAutoWorldSessions Ã  la place */
export async function checkAndUpdateAutoWorldSession(userId: string): Promise<void> {
  await checkAndUpdateAllAutoWorldSessions(userId);
}

