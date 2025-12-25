import * as SecureStore from 'expo-secure-store';
import { APP_CONFIG } from '@/config';

/**
 * Stockage sécurisé pour données sensibles
 * Utilise expo-secure-store (chiffrement natif)
 * 
 * ⚠️ IMPORTANT : Utiliser uniquement pour les données sensibles :
 * - Tokens d'authentification
 * - Sessions
 * - Clés de chiffrement
 * - Données personnelles sensibles
 * 
 * Pour les données non sensibles (préférences, thème), utiliser storage.ts
 */
/**
 * Valide et normalise une clé pour SecureStore
 * SecureStore n'accepte que des caractères alphanumériques, ".", "-", et "_"
 * @param key - Clé à valider
 * @returns Clé normalisée et valide
 */
function normalizeKey(key: string): string {
  if (!key || key.trim() === '') {
    throw new Error('La clé ne peut pas être vide');
  }
  
  // Remplacer les caractères non autorisés par des underscores
  // Préfixe sans @ (caractère non autorisé)
  const prefixedKey = `ayna_secure_${key}`;
  
  // Remplacer tous les caractères non autorisés par des underscores
  const normalized = prefixedKey.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  return normalized;
}

export const secureStorage = {

  /**
   * Stocke une valeur de manière sécurisée
   * @param key - Clé de stockage
   * @param value - Valeur à stocker (sera automatiquement chiffrée)
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (!key || key.trim() === '') {
        throw new Error('La clé ne peut pas être vide');
      }
      
      const normalizedKey = normalizeKey(key);
      await SecureStore.setItemAsync(normalizedKey, value);
    } catch (error) {
      console.error(`[SecureStorage] Erreur lors du stockage sécurisé de ${key}:`, error);
      throw new Error(`Impossible de stocker ${key} de manière sécurisée`);
    }
  },

  /**
   * Récupère une valeur de manière sécurisée
   * @param key - Clé de stockage
   * @returns La valeur stockée ou null si elle n'existe pas
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (!key || key.trim() === '') {
        return null;
      }
      
      const normalizedKey = normalizeKey(key);
      return await SecureStore.getItemAsync(normalizedKey);
    } catch (error) {
      console.error(`[SecureStorage] Erreur lors de la récupération sécurisée de ${key}:`, error);
      return null;
    }
  },

  /**
   * Supprime une valeur de manière sécurisée
   * @param key - Clé de stockage
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (!key || key.trim() === '') {
        // Ignorer silencieusement si la clé est vide
        return;
      }
      
      const normalizedKey = normalizeKey(key);
      await SecureStore.deleteItemAsync(normalizedKey);
    } catch (error) {
      // Ne pas logger l'erreur si c'est juste une clé invalide
      // pour éviter le spam dans les logs
      if (error instanceof Error && error.message.includes('Invalid key')) {
        // Ignorer silencieusement les clés invalides
        return;
      }
      console.error(`[SecureStorage] Erreur lors de la suppression sécurisée de ${key}:`, error);
      // Ne pas throw pour éviter de bloquer la déconnexion
    }
  },

  /**
   * Vide tout le stockage sécurisé
   * ⚠️ À utiliser uniquement lors de la déconnexion
   */
  async clear(): Promise<void> {
    // SecureStore ne supporte pas clear(), il faut supprimer manuellement
    // Liste des clés à supprimer (uniquement des clés valides)
    const keys = [
      'user_token',
      'refresh_token',
      'session_data',
      'analytics_data',
      'push_token',
    ];
    
    for (const key of keys) {
      // Vérifier que la clé n'est pas vide avant de la supprimer
      if (key && key.trim() !== '') {
        try {
          await this.removeItem(key);
        } catch (error) {
          // Ignorer les erreurs silencieusement lors du clear
          // pour ne pas bloquer la déconnexion
        }
      }
    }
  },

  /**
   * Vérifie si une clé existe
   * @param key - Clé à vérifier
   * @returns true si la clé existe, false sinon
   */
  async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  },
};



