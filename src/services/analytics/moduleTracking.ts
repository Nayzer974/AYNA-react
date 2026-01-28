// Service de tracking des modules avec la rÃ¨gle des 10 secondes
import { storage } from '@/utils/storage';
import { supabase } from '@/services/auth/supabase';
import { APP_CONFIG } from '@/config';
import { isOnline, addToSyncQueue } from '@/services/storage/syncService';

const MODULE_TRACKING_KEY = 'ayna_module_visits';

export type TrackedModule = 
  | 'AYNA'
  | 'Bayt an Nur'
  | 'Sabila Nur'
  | 'Dairat an Nur'
  | 'Nur & Shifa'
  | 'Ummayna'
  | 'Quran'
  | 'Journal';

export interface ModuleVisit {
  moduleId: string;
  timestamp: number; // Unix timestamp en millisecondes
}

/**
 * Enregistre une visite validÃ©e d'un module (aprÃ¨s 10 secondes)
 * Sauvegarde toujours localement, puis synchronise vers Supabase si en ligne
 * 
 * @param moduleName - Le nom du module visitÃ©
 */
export async function logModuleVisit(moduleName: TrackedModule): Promise<void> {
  try {
    const visit: ModuleVisit = {
      moduleId: moduleName,
      timestamp: Date.now()
    };

    // TOUJOURS sauvegarder localement d'abord
    await saveModuleVisitLocal(visit);

    // VÃ©rifier si on est en ligne et si Supabase est configurÃ©
    const online = await isOnline();
    
    if (!online || !APP_CONFIG.useSupabase || !supabase) {
      // Hors ligne : ajouter Ã  la queue de synchronisation si utilisateur connectÃ©
      try {
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await addToSyncQueue({
              type: 'usage_tracking',
              data: visit,
              userId: user.id,
            });
          }
        }
      } catch (error) {
        // Ignorer les erreurs si pas d'utilisateur connectÃ©
      }
      return;
    }

    // En ligne : essayer de sauvegarder directement dans Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await saveModuleVisitRemote(user.id, visit);
      }
    } catch (error) {
      // Si erreur, ajouter Ã  la queue pour synchronisation ultÃ©rieure
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await addToSyncQueue({
            type: 'usage_tracking',
            data: visit,
            userId: user.id,
          });
        }
      } catch (queueError) {
        // Ignorer les erreurs de queue
        // Erreur silencieuse en production
      }
    }
  } catch (error) {
    // Erreur silencieuse en production
    // Ne pas throw pour Ã©viter de casser l'application
  }
}

/**
 * Sauvegarde une visite localement dans AsyncStorage
 */
async function saveModuleVisitLocal(visit: ModuleVisit): Promise<void> {
  try {
    const existingVisits = await loadModuleVisitsLocal();
    const updatedVisits = [visit, ...existingVisits];
    
    // Limiter Ã  10000 visites pour Ã©viter de saturer le stockage
    const limitedVisits = updatedVisits.slice(0, 10000);
    
    await storage.setItem(MODULE_TRACKING_KEY, JSON.stringify(limitedVisits));
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}

/**
 * Charge toutes les visites depuis le stockage local
 */
export async function loadModuleVisitsLocal(): Promise<ModuleVisit[]> {
  try {
    const raw = await storage.getItem(MODULE_TRACKING_KEY);
    if (!raw) return [];
    
    const visits = JSON.parse(raw);
    if (!Array.isArray(visits)) return [];
    
    return visits;
  } catch (error) {
    // Erreur silencieuse en production
    return [];
  }
}

/**
 * Sauvegarde une visite sur le serveur (Supabase)
 */
async function saveModuleVisitRemote(userId: string, visit: ModuleVisit): Promise<void> {
  if (!supabase) return;

  try {
    // VÃ©rifier si la table existe, sinon crÃ©er une entrÃ©e dans user_metadata
    const { error } = await supabase
      .from('module_visits')
      .insert({
        user_id: userId,
        module_id: visit.moduleId,
        timestamp: new Date(visit.timestamp).toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Si la table n'existe pas, sauvegarder dans user_metadata comme fallback
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        // Table non disponible, utilisation du fallback
        await saveModuleVisitToUserMetadata(userId, visit);
      } else {
        throw error;
      }
    }
  } catch (error) {
    // Erreur silencieuse en production
    // Fallback : sauvegarder dans user_metadata
    await saveModuleVisitToUserMetadata(userId, visit);
  }
}

/**
 * Fallback : Sauvegarde dans user_metadata si la table n'existe pas
 */
async function saveModuleVisitToUserMetadata(userId: string, visit: ModuleVisit): Promise<void> {
  if (!supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentMetadata = user.user_metadata || {};
    const moduleVisits = currentMetadata.module_visits || [];
    
    const updatedVisits = [
      {
        moduleId: visit.moduleId,
        timestamp: visit.timestamp
      },
      ...moduleVisits
    ].slice(0, 1000); // Limiter Ã  1000 dans les mÃ©tadonnÃ©es

    await supabase.auth.updateUser({
      data: {
        ...currentMetadata,
        module_visits: updatedVisits
      }
    });
  } catch (error) {
    // Erreur silencieuse en production
  }
}

/**
 * Filtre les visites selon une pÃ©riode donnÃ©e
 * 
 * @param visits - Liste des visites
 * @param periodHours - Nombre d'heures Ã  remonter (24, 168 pour 7 jours, 720 pour 30 jours)
 */
export function filterVisitsByPeriod(
  visits: ModuleVisit[],
  periodHours: number
): ModuleVisit[] {
  const now = Date.now();
  const periodMs = periodHours * 60 * 60 * 1000;
  const cutoffTime = now - periodMs;

  return visits.filter(visit => visit.timestamp >= cutoffTime);
}

/**
 * Calcule la frÃ©quence d'utilisation par module pour une pÃ©riode donnÃ©e
 * 
 * @param visits - Liste des visites filtrÃ©es
 * @returns Objet avec le nombre de visites par module
 */
export function calculateModuleFrequency(
  visits: ModuleVisit[]
): Record<string, number> {
  const frequency: Record<string, number> = {};

  visits.forEach(visit => {
    frequency[visit.moduleId] = (frequency[visit.moduleId] || 0) + 1;
  });

  return frequency;
}

/**
 * Charge les visites depuis le serveur (Supabase)
 */
export async function loadModuleVisitsRemote(userId: string): Promise<ModuleVisit[]> {
  if (!supabase) return [];

  try {
    // Essayer de charger depuis la table
    const { data, error } = await supabase
      .from('module_visits')
      .select('module_id, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10000);

    if (error) {
      // Si la table n'existe pas, charger depuis user_metadata
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return await loadModuleVisitsFromUserMetadata();
      }
      throw error;
    }

    if (!data) return [];

    return data.map(row => ({
      moduleId: row.module_id,
      timestamp: new Date(row.timestamp).getTime()
    }));
  } catch (error) {
    // Erreur silencieuse en production
    return await loadModuleVisitsFromUserMetadata();
  }
}

/**
 * Charge les visites depuis user_metadata (fallback)
 */
async function loadModuleVisitsFromUserMetadata(): Promise<ModuleVisit[]> {
  if (!supabase) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const moduleVisits = user.user_metadata?.module_visits || [];
    
    return moduleVisits.map((visit: any) => ({
      moduleId: visit.moduleId,
      timestamp: visit.timestamp
    }));
  } catch (error) {
    // Erreur silencieuse en production
    return [];
  }
}

/**
 * Charge toutes les visites (local + remote) et les fusionne
 */
export async function loadAllModuleVisits(userId?: string): Promise<ModuleVisit[]> {
  const localVisits = await loadModuleVisitsLocal();
  
  if (userId && APP_CONFIG.useSupabase && supabase) {
    try {
      const remoteVisits = await loadModuleVisitsRemote(userId);
      
      // Fusionner les deux sources en Ã©vitant les doublons (basÃ© sur timestamp + moduleId)
      const visitMap = new Map<string, ModuleVisit>();
      
      // Ajouter les visites distantes d'abord
      remoteVisits.forEach(visit => {
        const key = `${visit.moduleId}_${visit.timestamp}`;
        visitMap.set(key, visit);
      });
      
      // Ajouter les visites locales (elles peuvent Ãªtre plus rÃ©centes)
      localVisits.forEach(visit => {
        const key = `${visit.moduleId}_${visit.timestamp}`;
        if (!visitMap.has(key)) {
          visitMap.set(key, visit);
        }
      });
      
      // Convertir en tableau et trier par timestamp (plus rÃ©cent en premier)
      return Array.from(visitMap.values()).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      // Erreur silencieuse en production
    }
  }
  
  return localVisits;
}



