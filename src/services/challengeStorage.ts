// Service de stockage pour les données du Challenge 40 jours
import { storage } from '@/utils/storage';
import { supabase } from './supabase';
import { APP_CONFIG } from '@/config';
import type { UserProfile } from '@/contexts/UserContext';

const CHALLENGE_STORAGE_KEY = 'ayna_challenge_40days';

export interface ChallengeData {
  currentDay: number;
  startDate: string;
  journalEntries: Array<{
    day: number;
    entry: string;
    analysis?: string;
  }>;
  dhikrCounts: Array<{
    day: number;
    count: number;
    dhikr: string;
  }>;
  selectedChallengeId?: string;
  intention?: string;
  completedTasks?: Array<{
    day: number;
    taskIndices: number[];
  }>;
  currentDhikrCounts?: Array<{
    day: number;
    count: number;
  }>;
}

/**
 * Charge les données du challenge depuis le stockage local
 */
export async function loadChallengeData(userId: string): Promise<ChallengeData | null> {
  try {
    const key = `${CHALLENGE_STORAGE_KEY}_${userId}`;
    const data = await storage.getItem(key);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as ChallengeData;
  } catch (error) {
    console.error('Erreur lors du chargement des données du challenge:', error);
    return null;
  }
}

/**
 * Sauvegarde les données du challenge dans le stockage local
 */
export async function saveChallengeData(userId: string, challengeData: ChallengeData): Promise<void> {
  try {
    const key = `${CHALLENGE_STORAGE_KEY}_${userId}`;
    await storage.setItem(key, JSON.stringify(challengeData));
    
    // Si Supabase est configuré, sauvegarder aussi dans la base de données
    if (APP_CONFIG.useSupabase && supabase && userId) {
      try {
        // Mettre à jour les métadonnées utilisateur dans Supabase
        const { error } = await supabase.auth.updateUser({
          data: {
            challenge40Days: challengeData
          }
        });
        
        if (error) {
          console.warn('Erreur lors de la sauvegarde Supabase du challenge:', error);
          // Ne pas échouer si Supabase échoue, le stockage local est suffisant
        }
      } catch (supabaseError) {
        console.warn('Exception lors de la sauvegarde Supabase du challenge:', supabaseError);
        // Ne pas échouer si Supabase échoue
      }
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données du challenge:', error);
    throw error;
  }
}

/**
 * Supprime toutes les données du challenge pour un utilisateur
 */
export async function deleteChallengeData(userId: string): Promise<void> {
  try {
    const key = `${CHALLENGE_STORAGE_KEY}_${userId}`;
    await storage.removeItem(key);
    
    // Si Supabase est configuré, supprimer aussi de la base de données
    if (APP_CONFIG.useSupabase && supabase && userId) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: {
            challenge40Days: null
          }
        });
        
        if (error) {
          console.warn('Erreur lors de la suppression Supabase du challenge:', error);
          // Ne pas échouer si Supabase échoue
        }
      } catch (supabaseError) {
        console.warn('Exception lors de la suppression Supabase du challenge:', supabaseError);
        // Ne pas échouer si Supabase échoue
      }
    }
  } catch (error) {
    console.error('Erreur lors de la suppression des données du challenge:', error);
    throw error;
  }
}

/**
 * Charge les données du challenge depuis le profil utilisateur (UserContext)
 * Utile pour synchroniser avec les données déjà chargées
 */
export function getChallengeDataFromUser(user: UserProfile | null | undefined): ChallengeData | null {
  if (!user?.challenge40Days) {
    return null;
  }
  
  return {
    currentDay: user.challenge40Days.currentDay || 1,
    startDate: user.challenge40Days.startDate || new Date().toISOString(),
    journalEntries: user.challenge40Days.journalEntries || [],
    dhikrCounts: user.challenge40Days.dhikrCounts || [],
    selectedChallengeId: user.challenge40Days.selectedChallengeId,
    intention: user.challenge40Days.intention,
    completedTasks: user.challenge40Days.completedTasks || [],
    currentDhikrCounts: user.challenge40Days.currentDhikrCounts || [],
  };
}

/**
 * Synchronise les données du challenge entre le stockage local et Supabase
 */
export async function syncChallengeData(userId: string, userProfile?: UserProfile | null): Promise<ChallengeData | null> {
  try {
    // Charger depuis le stockage local
    const localData = await loadChallengeData(userId);
    
    // Charger depuis le profil utilisateur si disponible
    const userData = userProfile ? getChallengeDataFromUser(userProfile) : null;
    
    // Priorité : données locales > données utilisateur
    const challengeData = localData || userData;
    
    // Si on a des données et que Supabase est configuré, synchroniser
    if (challengeData && APP_CONFIG.useSupabase && supabase && userId) {
      try {
        await supabase.auth.updateUser({
          data: {
            challenge40Days: challengeData
          }
        });
      } catch (error) {
        console.warn('Erreur lors de la synchronisation Supabase:', error);
      }
    }
    
    return challengeData;
  } catch (error) {
    console.error('Erreur lors de la synchronisation des données du challenge:', error);
    return null;
  }
}

