/**
 * Service pour gérer les rôles utilisateurs
 * Vérifie si un utilisateur est spécial (admin ou role 'special')
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ayna_user_role';

export type UserRole = 'admin' | 'special' | 'normal';

export interface UserRoleData {
  role: UserRole;
  cachedAt: string;
}

/**
 * Vérifie si un utilisateur est spécial (admin ou role 'special')
 */
export async function isUserSpecial(userId?: string): Promise<boolean> {
  if (!supabase || !userId) {
    return false;
  }

  try {
    // Vérifier d'abord depuis le cache local
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      const roleData: UserRoleData = JSON.parse(cached);
      // Cache valide pendant 1 heure
      const cacheAge = Date.now() - new Date(roleData.cachedAt).getTime();
      if (cacheAge < 3600000 && roleData.role !== 'normal') {
        return roleData.role === 'admin' || roleData.role === 'special';
      }
    }

    // Appeler la fonction RPC Supabase
    const { data, error } = await supabase.rpc('is_user_special', {
      p_user_id: userId
    });

    if (error) {
      // Si la fonction n'existe pas encore, vérifier manuellement
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        return await checkSpecialRoleManually(userId);
      }
      return false;
    }

    const isSpecial = data === true;

    // Mettre en cache
    if (isSpecial) {
      const roleData: UserRoleData = {
        role: 'special', // On ne sait pas si c'est admin ou special, mais on sait que c'est spécial
        cachedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(roleData));
    } else {
      // Mettre en cache comme normal
      const roleData: UserRoleData = {
        role: 'normal',
        cachedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(roleData));
    }

    return isSpecial;
  } catch (error) {
    // Erreur silencieuse en production
    return false;
  }
}

/**
 * Vérification manuelle du rôle spécial (fallback)
 */
async function checkSpecialRoleManually(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_type')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role_type === 'special' || data.role_type === 'admin';
  } catch (error) {
    return false;
  }
}

/**
 * Attribuer le rôle spécial à un utilisateur (admin uniquement)
 */
export async function grantSpecialRole(userEmail: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc('grant_special_role', {
      p_user_email: userEmail
    });

    if (error) {
      return false;
    }

    return data === true;
  } catch (error) {
    return false;
  }
}

/**
 * Retirer le rôle spécial d'un utilisateur (admin uniquement)
 */
export async function revokeSpecialRole(userEmail: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc('revoke_special_role', {
      p_user_email: userEmail
    });

    if (error) {
      return false;
    }

    return data === true;
  } catch (error) {
    return false;
  }
}

/**
 * Vider le cache du rôle utilisateur
 */
export async function clearRoleCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Erreur silencieuse
  }
}










