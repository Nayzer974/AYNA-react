/**
 * Service de synchronisation offline/online
 * 
 * Ce service gère :
 * - La détection de la connexion réseau
 * - La sauvegarde locale quand hors ligne
 * - La synchronisation vers Supabase quand en ligne
 * - Le nettoyage des données locales après synchronisation réussie
 */

import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { storage } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage pour les données en attente de synchronisation
const SYNC_QUEUE_KEY = 'ayna_sync_queue';
const SYNC_STATUS_KEY = 'ayna_sync_status';

export interface SyncItem {
  id: string;
  type: 'khalwa_session' | 'journal_note' | 'challenge_entry' | 'dhikr_click' | 'usage_tracking';
  data: any;
  timestamp: number;
  userId: string;
  retryCount?: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number | null;
  pendingItems: number;
  isSyncing: boolean;
}

/**
 * Vérifie si l'appareil est connecté à Internet
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    console.error('Erreur lors de la vérification de la connexion:', error);
    return false;
  }
}

/**
 * Ajoute un élément à la file d'attente de synchronisation
 */
export async function addToSyncQueue(item: Omit<SyncItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const newItem: SyncItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    queue.push(newItem);
    await saveSyncQueue(queue);
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la file de synchronisation:', error);
  }
}

/**
 * Récupère la file d'attente de synchronisation
 */
export async function getSyncQueue(): Promise<SyncItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erreur lors de la récupération de la file de synchronisation:', error);
    return [];
  }
}

/**
 * Sauvegarde la file d'attente de synchronisation
 */
async function saveSyncQueue(queue: SyncItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la file de synchronisation:', error);
  }
}

/**
 * Supprime un élément de la file d'attente après synchronisation réussie
 */
async function removeFromSyncQueue(itemId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter(item => item.id !== itemId);
    await saveSyncQueue(filtered);
  } catch (error) {
    console.error('Erreur lors de la suppression de la file de synchronisation:', error);
  }
}

/**
 * Synchronise un élément vers Supabase selon son type
 */
async function syncItemToSupabase(item: SyncItem): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase n\'est pas configuré, impossible de synchroniser');
    return false;
  }

  try {
    switch (item.type) {
      case 'khalwa_session':
        // CRITIQUE : Récupérer l'ID utilisateur directement depuis Supabase auth
        // Cela garantit que l'ID correspond bien à auth.uid() utilisé dans les politiques RLS
        const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !supabaseUser?.id) {
          console.error('Erreur lors de la récupération de l\'utilisateur Supabase pour la synchronisation:', userError);
          return false;
        }

        // Utiliser l'ID Supabase authentifié (qui correspond à auth.uid())
        const authenticatedUserId = supabaseUser.id;

        const { error: khalwaError } = await supabase
          .from('khalwa_sessions')
          .insert({
            user_id: authenticatedUserId, // Utiliser l'ID Supabase authentifié
            intention: item.data.intention || null,
            divine_name_id: item.data.divineName.id,
            divine_name_arabic: item.data.divineName.arabic,
            divine_name_transliteration: item.data.divineName.transliteration,
            sound_ambiance: item.data.soundAmbiance,
            duration_minutes: item.data.duration,
            breathing_type: item.data.breathingType,
            guided: item.data.guided,
            feeling: item.data.feeling || null,
            completed: item.data.completed !== false,
            created_at: new Date(item.timestamp).toISOString(),
          });
        
        if (khalwaError) {
          console.error('Erreur lors de la synchronisation de la session Khalwa:', khalwaError);
          // Si c'est une erreur RLS, donner plus de détails
          if (khalwaError.code === '42501') {
            console.error('❌ Erreur RLS lors de la synchronisation - Vérifiez que :');
            console.error('  1. Les politiques RLS sont correctement configurées (exécutez fix-all-rls-and-missing-tables.sql)');
            console.error('  2. L\'utilisateur est bien authentifié dans Supabase');
            console.error('  3. L\'ID utilisateur correspond à auth.uid()');
          }
          return false;
        }
        return true;

      case 'journal_note':
        // Les notes de journal sont déjà gérées localement, pas besoin de synchronisation Supabase
        // Mais on peut les synchroniser si nécessaire dans le futur
        return true;

      case 'challenge_entry':
        // Les entrées du challenge sont synchronisées via UserContext
        return true;

      case 'dhikr_click':
        // Les clics de dhikr sont déjà gérés en temps réel
        return true;

      case 'usage_tracking':
        // Synchroniser une visite de module ou une session de tracking
        // Le format peut varier selon la source (moduleTracking ou usageTracking)
        if (item.data.moduleId) {
          // Format depuis moduleTracking (ModuleVisit)
          try {
            const { error: moduleError } = await supabase
              .from('module_visits')
              .insert({
                user_id: item.userId,
                module_id: item.data.moduleId,
                timestamp: new Date(item.data.timestamp).toISOString(),
                created_at: new Date().toISOString()
              });
            
            if (moduleError) {
              // Si la table n'existe pas, utiliser user_metadata comme fallback
              if (moduleError.code === '42P01' || moduleError.message?.includes('does not exist')) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const currentMetadata = user.user_metadata || {};
                  const moduleVisits = currentMetadata.module_visits || [];
                  const updatedVisits = [
                    { moduleId: item.data.moduleId, timestamp: item.data.timestamp },
                    ...moduleVisits
                  ].slice(0, 1000);
                  
                  await supabase.auth.updateUser({
                    data: { ...currentMetadata, module_visits: updatedVisits }
                  });
                }
                return true;
              }
              console.error('Erreur lors de la synchronisation du module visit:', moduleError);
              return false;
            }
            return true;
          } catch (error) {
            console.error('Erreur lors de la synchronisation du module visit:', error);
            return false;
          }
        } else if (item.data.module) {
          // Format depuis usageTracking (UsageSession)
          const { error: usageError } = await supabase
            .from('user_usage_tracking')
            .insert({
              user_id: item.userId,
              module: item.data.module,
              start_time: item.data.start_time,
              date: item.data.date,
              has_interaction: item.data.has_interaction || false,
              is_valid: item.data.is_valid || false,
            });
          
          if (usageError) {
            console.error('Erreur lors de la synchronisation du tracking:', usageError);
            return false;
          }
          return true;
        }
        return false;

      default:
        console.warn('Type de synchronisation non reconnu:', item.type);
        return false;
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    return false;
  }
}

/**
 * Synchronise tous les éléments en attente vers Supabase
 */
export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const online = await isOnline();
  if (!online) {
    console.log('Hors ligne, synchronisation reportée');
    return { synced: 0, failed: 0 };
  }

  if (!supabase) {
    console.warn('Supabase n\'est pas configuré, synchronisation impossible');
    return { synced: 0, failed: 0 };
  }

  const queue = await getSyncQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  // Synchroniser chaque élément
  for (const item of queue) {
    const success = await syncItemToSupabase(item);
    
    if (success) {
      await removeFromSyncQueue(item.id);
      synced++;
    } else {
      // Incrémenter le compteur de tentatives
      item.retryCount = (item.retryCount || 0) + 1;
      
      // Si trop de tentatives, supprimer l'élément (pour éviter une queue infinie)
      if (item.retryCount > 5) {
        console.warn(`Élément ${item.id} supprimé après 5 tentatives échouées`);
        await removeFromSyncQueue(item.id);
        failed++;
      } else {
        // Mettre à jour la queue avec le nouveau retryCount
        const updatedQueue = await getSyncQueue();
        const itemIndex = updatedQueue.findIndex(i => i.id === item.id);
        if (itemIndex >= 0) {
          updatedQueue[itemIndex] = item;
          await saveSyncQueue(updatedQueue);
        }
        failed++;
      }
    }
  }

  // Mettre à jour le statut de synchronisation
  await updateSyncStatus({ lastSyncTime: Date.now() });

  return { synced, failed };
}

/**
 * Récupère le statut de synchronisation
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const online = await isOnline();
    const queue = await getSyncQueue();
    const raw = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    const status = raw ? JSON.parse(raw) : { lastSyncTime: null, isSyncing: false };

    return {
      isOnline: online,
      lastSyncTime: status.lastSyncTime,
      pendingItems: queue.length,
      isSyncing: status.isSyncing || false,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du statut de synchronisation:', error);
    return {
      isOnline: false,
      lastSyncTime: null,
      pendingItems: 0,
      isSyncing: false,
    };
  }
}

/**
 * Met à jour le statut de synchronisation
 */
async function updateSyncStatus(updates: Partial<SyncStatus>): Promise<void> {
  try {
    const current = await getSyncStatus();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
      lastSyncTime: updated.lastSyncTime,
      isSyncing: updated.isSyncing,
    }));
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de synchronisation:', error);
  }
}

/**
 * Démarre la synchronisation automatique
 * Appelée quand l'app démarre ou quand la connexion revient
 */
export async function startAutoSync(): Promise<void> {
  const online = await isOnline();
  if (!online) {
    return;
  }

  // Marquer comme en cours de synchronisation
  await updateSyncStatus({ isSyncing: true });

  try {
    await syncQueue();
  } finally {
    await updateSyncStatus({ isSyncing: false });
  }
}

/**
 * Écoute les changements de connexion réseau et synchronise automatiquement
 */
export function setupNetworkListener(onStatusChange?: (isOnline: boolean) => void): () => void {
  const unsubscribe = NetInfo.addEventListener(state => {
    const isConnected = state.isConnected === true && state.isInternetReachable === true;
    
    if (onStatusChange) {
      onStatusChange(isConnected);
    }

    // Si la connexion revient, synchroniser automatiquement
    if (isConnected) {
      startAutoSync().catch(error => {
        console.error('Erreur lors de la synchronisation automatique:', error);
      });
    }
  });

  return unsubscribe;
}

/**
 * Nettoie les données locales qui ont été synchronisées avec succès
 * Garde uniquement les données qui doivent rester locales par défaut
 */
export async function cleanupSyncedData(): Promise<void> {
  try {
    // Les données suivantes restent toujours locales :
    // - Préférences utilisateur (thème, etc.) - gérées par UserContext
    // - Cache temporaire
    // - Données de tracking module (peuvent rester locales)
    
    // Les données suivantes sont supprimées après synchronisation :
    // - Sessions Khalwa locales (si synchronisées avec Supabase)
    // - Notes de journal locales (si synchronisées avec Supabase)
    // - etc.
    
    // Pour l'instant, on ne supprime rien automatiquement car les services
    // gèrent déjà la priorité Supabase > Local
    // Cette fonction peut être étendue si nécessaire
    
    console.log('Nettoyage des données synchronisées effectué');
  } catch (error) {
    console.error('Erreur lors du nettoyage des données:', error);
  }
}

