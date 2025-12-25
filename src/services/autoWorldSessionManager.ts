/**
 * Service de gestion des sessions mondiales automatiques
 * 
 * Gère la création et la suppression automatique des sessions mondiales
 * entre les prières. Il ne doit y avoir qu'une seule session mondiale active
 * à la fois, et elle est supprimée (même avec des utilisateurs) quand une
 * nouvelle prière arrive.
 */

import { supabase } from './supabase';
import { getTodayPrayerTimes, type LocationCoords } from './PrayerTimeManager';
import { getRandomDhikrForPeriod } from '@/data/autoPrayerDhikr';

/**
 * Obtient le nom de la session selon la période de prière
 */
export function getSessionNameForPeriod(period: string): string {
  const periodNames: Record<string, string> = {
    'fajr-dhuhr': 'Éveil spirituel, protection et guidance',
    'dhuhr-asr': 'Concentration, productivité et réussite',
    'asr-maghrib': 'Patience, gratitude et purification du coeur',
    'maghrib-isha': 'Pardon, apaisement et rapprochement d\'Allah',
    'isha-fajr': 'Réflexion, méditation et préparation pour un nouveau jour'
  };
  
  return periodNames[period] || 'Session mondiale';
}

/**
 * Détermine la période de prière actuelle
 * Retourne: 'fajr-dhuhr' | 'dhuhr-asr' | 'asr-maghrib' | 'maghrib-isha' | 'isha-fajr'
 */
export async function getCurrentPrayerPeriod(userLocation?: LocationCoords): Promise<string | null> {
  try {
    const timings = await getTodayPrayerTimes(userLocation);
    if (!timings) return null;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Convertir les heures de prière en dates
    const prayerTimes: { name: string; date: Date }[] = [];
    for (const [name, time] of Object.entries(timings)) {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date(`${today}T${time}:00`);
      date.setHours(hours, minutes, 0, 0);
      prayerTimes.push({ name, date });
    }
    
    // Trier par heure
    prayerTimes.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Trouver la période actuelle
    for (let i = 0; i < prayerTimes.length; i++) {
      const current = prayerTimes[i];
      const next = prayerTimes[(i + 1) % prayerTimes.length];
      
      // Si on est entre cette prière et la suivante
      if (now.getTime() >= current.date.getTime() && now.getTime() < next.date.getTime()) {
        const periodName = `${current.name.toLowerCase()}-${next.name.toLowerCase()}`;
        return periodName;
      }
    }
    
    // Si on est après Isha et avant Fajr (nuit)
    const fajr = prayerTimes.find(p => p.name === 'Fajr');
    const isha = prayerTimes.find(p => p.name === 'Isha');
    if (fajr && isha && (now.getTime() >= isha.date.getTime() || now.getTime() < fajr.date.getTime())) {
      return 'isha-fajr';
    }
    
    return null;
  } catch (error) {
    console.error('[AutoWorldSessionManager] Erreur lors de la détermination de la période:', error);
    return null;
  }
}

/**
 * Crée ou met à jour la session mondiale automatique pour la période actuelle
 * Supprime toutes les sessions automatiques existantes avant de créer la nouvelle
 */
export async function createOrUpdateAutoWorldSession(
  userId: string,
  userLocation?: LocationCoords
): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  try {
    // Obtenir la période actuelle
    const currentPeriod = await getCurrentPrayerPeriod(userLocation);
    if (!currentPeriod) {
      console.log('[AutoWorldSessionManager] Impossible de déterminer la période actuelle');
      return null;
    }

    // Récupérer TOUTES les sessions automatiques existantes (pas seulement une)
    const { data: existingSessions } = await supabase
      .from('dhikr_sessions')
      .select('id, prayer_period')
      .eq('is_auto', true)
      .eq('is_active', true);

    // Vérifier s'il existe déjà une session pour la période actuelle
    const sessionForCurrentPeriod = existingSessions?.find(s => s.prayer_period === currentPeriod);
    
    // Si une session existe déjà pour la même période, ne rien faire
    if (sessionForCurrentPeriod) {
      console.log('[AutoWorldSessionManager] Session automatique déjà active pour cette période');
      return sessionForCurrentPeriod.id;
    }

    // Supprimer TOUTES les sessions automatiques existantes (même avec des utilisateurs)
    // C'est important : quand une nouvelle prière arrive, toutes les anciennes sessions doivent être supprimées
    if (existingSessions && existingSessions.length > 0) {
      const sessionIds = existingSessions.map(s => s.id);
      
      console.log(`[AutoWorldSessionManager] Suppression de ${sessionIds.length} session(s) automatique(s) existante(s)`);
      
      // Supprimer les participants et clics associés
      await supabase
        .from('dhikr_session_participants')
        .delete()
        .in('session_id', sessionIds);

      await supabase
        .from('dhikr_session_clicks')
        .delete()
        .in('session_id', sessionIds);

      // Supprimer toutes les sessions automatiques
      await supabase
        .from('dhikr_sessions')
        .delete()
        .in('id', sessionIds);
    }

    // Obtenir un dhikr aléatoire pour la période actuelle
    const randomDhikr = getRandomDhikrForPeriod(currentPeriod);
    if (!randomDhikr) {
      console.error('[AutoWorldSessionManager] Aucun dhikr trouvé pour la période:', currentPeriod);
      return null;
    }
    
    // Créer le texte du dhikr au format JSON pour stocker toutes les informations
    const dhikrText = JSON.stringify({
      arabic: randomDhikr.arabic,
      transliteration: randomDhikr.transliteration,
      translation: randomDhikr.translation,
      reference: randomDhikr.reference
    });
    
    // Obtenir le nom de la session selon la période
    const sessionName = getSessionNameForPeriod(currentPeriod);

    // Créer la nouvelle session automatique via la fonction RPC
    const { data: sessionId, error: rpcError } = await supabase.rpc('create_auto_world_session', {
      p_user_id: userId,
      p_dhikr_text: dhikrText,
      p_prayer_period: currentPeriod,
      p_session_name: sessionName
    });

    if (rpcError) {
      // Si la fonction RPC n'existe pas, créer manuellement
      if (rpcError.message?.includes('Could not find the function') || 
          rpcError.message?.includes('function') && rpcError.message?.includes('not found')) {
        console.warn('[AutoWorldSessionManager] Fonction RPC non trouvée, création manuelle');
        
        // Obtenir un dhikr aléatoire pour la période actuelle
        const randomDhikr = getRandomDhikrForPeriod(currentPeriod);
        if (!randomDhikr) {
          throw new Error('Aucun dhikr trouvé pour la période actuelle');
        }
        
        // Créer le texte du dhikr au format JSON
        const dhikrText = JSON.stringify({
          arabic: randomDhikr.arabic,
          transliteration: randomDhikr.transliteration,
          translation: randomDhikr.translation,
          reference: randomDhikr.reference
        });
        
        // Obtenir le nom de la session selon la période
        const sessionName = getSessionNameForPeriod(currentPeriod);
        
        // Créer manuellement
        const { data: newSession, error: insertError } = await supabase
          .from('dhikr_sessions')
          .insert({
            created_by: userId,
            dhikr_text: dhikrText,
            target_count: null, // Illimité pour sessions mondiales
            current_count: 0,
            is_active: true,
            is_open: true,
            max_participants: 100,
            is_auto: true,
            prayer_period: currentPeriod,
            session_name: sessionName
          })
          .select('id')
          .single();

        if (insertError || !newSession) {
          throw new Error(insertError?.message || 'Erreur lors de la création de la session');
        }

        return newSession.id;
      }
      
      throw rpcError;
    }

    return sessionId;
  } catch (error: any) {
    console.error('[AutoWorldSessionManager] Erreur lors de la création de la session automatique:', error);
    return null;
  }
}

/**
 * Supprime toutes les sessions automatiques existantes
 * Utile pour nettoyer les sessions obsolètes
 */
export async function deleteAllAutoWorldSessions(): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    // Récupérer toutes les sessions automatiques (actives ou non)
    const { data: autoSessions } = await supabase
      .from('dhikr_sessions')
      .select('id')
      .eq('is_auto', true);

    if (!autoSessions || autoSessions.length === 0) {
      return;
    }

    const sessionIds = autoSessions.map(s => s.id);

    console.log(`[AutoWorldSessionManager] Suppression de ${sessionIds.length} session(s) automatique(s) existante(s)`);

    // Supprimer les participants et clics associés
    await supabase
      .from('dhikr_session_participants')
      .delete()
      .in('session_id', sessionIds);

    await supabase
      .from('dhikr_session_clicks')
      .delete()
      .in('session_id', sessionIds);

    // Supprimer toutes les sessions automatiques
    await supabase
      .from('dhikr_sessions')
      .delete()
      .in('id', sessionIds);

    console.log(`[AutoWorldSessionManager] ${sessionIds.length} session(s) automatique(s) supprimée(s)`);
  } catch (error) {
    console.error('[AutoWorldSessionManager] Erreur lors de la suppression des sessions automatiques:', error);
  }
}

/**
 * Vérifie et met à jour la session mondiale automatique
 * À appeler périodiquement ou lors du changement de période de prière
 * Supprime d'abord toutes les anciennes sessions, puis crée la nouvelle
 */
export async function checkAndUpdateAutoWorldSession(
  userId: string,
  userLocation?: LocationCoords
): Promise<void> {
  try {
    // D'abord, supprimer toutes les sessions automatiques existantes
    // Cela garantit qu'il n'y a qu'une seule session mondiale à la fois
    await deleteAllAutoWorldSessions();
    
    // Ensuite, créer la nouvelle session pour la période actuelle
    await createOrUpdateAutoWorldSession(userId, userLocation);
  } catch (error) {
    console.error('[AutoWorldSessionManager] Erreur lors de la vérification:', error);
  }
}

