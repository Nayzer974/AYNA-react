import { supabase } from './supabase';

export interface UserAnalytics {
  totalDhikr: number;
  totalNotes: number;
  totalPrayers: number;
  totalDays: number; // Nombre de jours depuis la première activité
  streak: number;
  lastActive: string;
  firstActive?: string; // Date de première activité pour calculer totalDays
}

/**
 * Calcule le streak (série de jours consécutifs)
 * Un streak est maintenu si l'utilisateur est actif dans les 24 dernières heures
 */
function calculateStreak(lastActive: string, currentStreak: number): number {
  if (!lastActive) {
    return 0;
  }

  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const hoursSinceLastActive = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);

  // Si l'utilisateur a été actif dans les 24 dernières heures, maintenir ou incrémenter le streak
  if (hoursSinceLastActive <= 24) {
    // Vérifier si c'est un nouveau jour (streak à incrémenter)
    const lastActiveDay = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysDiff = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Nouveau jour, incrémenter le streak
      return currentStreak + 1;
    } else if (daysDiff === 0) {
      // Même jour, maintenir le streak
      return currentStreak;
    } else {
      // Plus d'un jour de différence, réinitialiser le streak
      return 1;
    }
  } else {
    // Plus de 24h d'inactivité, réinitialiser le streak
    return 1;
  }
}

/**
 * Met à jour la date de dernière activité et recalcule le streak
 */
export async function updateLastActive(
  userId: string,
  currentAnalytics: UserAnalytics
): Promise<UserAnalytics> {
  const now = new Date().toISOString();
  const newStreak = calculateStreak(currentAnalytics.lastActive, currentAnalytics.streak);
  const firstActive = currentAnalytics.firstActive || currentAnalytics.lastActive || now;
  const totalDays = calculateTotalDays(firstActive, now);

  const updatedAnalytics: UserAnalytics = {
    ...currentAnalytics,
    totalDays,
    lastActive: now,
    streak: newStreak,
    firstActive: currentAnalytics.firstActive || firstActive,
  };

  return updatedAnalytics;
}

/**
 * Incrémente le compteur de dhikr
 */
export async function incrementDhikr(
  userId: string,
  currentAnalytics: UserAnalytics,
  count: number = 1
): Promise<UserAnalytics> {
  const now = new Date().toISOString();
  const newStreak = calculateStreak(currentAnalytics.lastActive, currentAnalytics.streak);

  const firstActive = currentAnalytics.firstActive || now;
  
  // Tracker l'événement analytics (non-bloquant)
  try {
    const { trackEvent } = await import('./analytics');
    trackEvent('dhikr_completed', { count }).catch(() => {});
  } catch (error) {
    // Erreur silencieuse
  }
  
  const updatedAnalytics: UserAnalytics = {
    totalDhikr: currentAnalytics.totalDhikr + count,
    totalNotes: currentAnalytics.totalNotes,
    totalPrayers: currentAnalytics.totalPrayers || 0,
    totalDays: currentAnalytics.totalDays || 0,
    streak: newStreak,
    lastActive: now,
    firstActive,
  };

  return updatedAnalytics;
}

/**
 * Incrémente le compteur de notes/journal
 */
export async function incrementNotes(
  userId: string,
  currentAnalytics: UserAnalytics
): Promise<UserAnalytics> {
  const now = new Date().toISOString();
  const newStreak = calculateStreak(currentAnalytics.lastActive, currentAnalytics.streak);

  const firstActive = currentAnalytics.firstActive || now;
  
  // Tracker l'événement analytics (non-bloquant)
  try {
    const { trackEvent } = await import('./analytics');
    trackEvent('journal_entry_created', {}).catch(() => {});
  } catch (error) {
    // Erreur silencieuse
  }
  
  const updatedAnalytics: UserAnalytics = {
    totalDhikr: currentAnalytics.totalDhikr,
    totalNotes: currentAnalytics.totalNotes + 1,
    totalPrayers: currentAnalytics.totalPrayers || 0,
    totalDays: currentAnalytics.totalDays || 0,
    streak: newStreak,
    lastActive: now,
    firstActive,
  };

  return updatedAnalytics;
}

/**
 * Incrémente le compteur de prières
 */
export async function incrementPrayer(
  userId: string,
  currentAnalytics: UserAnalytics,
  count: number = 1
): Promise<UserAnalytics> {
  const now = new Date().toISOString();
  const newStreak = calculateStreak(currentAnalytics.lastActive, currentAnalytics.streak);
  const firstActive = currentAnalytics.firstActive || now;
  
  // Tracker l'événement analytics (non-bloquant)
  try {
    const { trackEvent } = await import('./analytics');
    trackEvent('prayer_completed', { count }).catch(() => {});
  } catch (error) {
    // Erreur silencieuse
  }
  
  // Calculer le nombre de jours total
  const totalDays = calculateTotalDays(firstActive, now);
  
  const updatedAnalytics: UserAnalytics = {
    totalDhikr: currentAnalytics.totalDhikr,
    totalNotes: currentAnalytics.totalNotes,
    totalPrayers: (currentAnalytics.totalPrayers || 0) + count,
    totalDays,
    streak: newStreak,
    lastActive: now,
    firstActive,
  };

  return updatedAnalytics;
}

/**
 * Calcule le nombre de jours total depuis la première activité
 */
export function calculateTotalDays(firstActive: string, lastActive: string): number {
  if (!firstActive) return 1;
  
  const firstDate = new Date(firstActive);
  const lastDate = new Date(lastActive);
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays); // Au moins 1 jour
}

/**
 * Met à jour le nombre de jours total (appelé périodiquement)
 */
export async function updateTotalDays(
  userId: string,
  currentAnalytics: UserAnalytics
): Promise<UserAnalytics> {
  const now = new Date().toISOString();
  const firstActive = currentAnalytics.firstActive || currentAnalytics.lastActive || now;
  const totalDays = calculateTotalDays(firstActive, now);
  
  const updatedAnalytics: UserAnalytics = {
    ...currentAnalytics,
    totalDays,
    firstActive: currentAnalytics.firstActive || firstActive,
    lastActive: now,
  };

  return updatedAnalytics;
}

/**
 * Synchronise les analytics avec Supabase
 * Utilise UPDATE uniquement (pas INSERT) car le profil doit déjà exister
 * Le profil est créé automatiquement par le trigger handle_new_user lors de l'inscription
 */
export async function syncAnalyticsToSupabase(
  userId: string,
  analytics: UserAnalytics
): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    // Vérifier que l'utilisateur est bien authentifié
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !currentUser || currentUser.id !== userId) {
      // L'utilisateur n'est pas authentifié ou l'ID ne correspond pas
      // Ne pas synchroniser pour éviter les erreurs RLS
      return;
    }

    // Utiliser UPDATE uniquement (pas UPSERT)
    // Le profil doit déjà exister (créé par handle_new_user trigger)
    // Si le profil n'existe pas, on ne fait rien (il sera créé lors de la prochaine action)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        analytics: analytics,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      // Si l'erreur est "no rows returned", c'est que le profil n'existe pas encore
      // C'est OK, il sera créé par le trigger handle_new_user lors de la prochaine action
      if (updateError.code !== 'PGRST116') {
        // Autre erreur (comme RLS), on log silencieusement
        console.error('Erreur lors de la synchronisation des analytics:', updateError);
      }
    }
  } catch (error) {
    // Erreur silencieuse en production
    console.error('Erreur lors de la synchronisation des analytics:', error);
  }
}
