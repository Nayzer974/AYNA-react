/**
 * Rate limiter simple côté client
 * ⚠️ IMPORTANT : Ce rate limiter côté client est une protection supplémentaire.
 * Le rate limiting principal doit être implémenté côté serveur.
 * 
 * Utilisation :
 * - Protection contre les abus côté client
 * - Feedback immédiat à l'utilisateur
 * - Réduction de la charge serveur
 */

interface RateLimitConfig {
  maxRequests: number;  // Nombre maximum de requêtes
  windowMs: number;     // Fenêtre de temps en millisecondes
}

interface RateLimitEntry {
  requests: number[];
  lastReset: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();

  /**
   * Vérifie si une requête est autorisée
   * @param key - Clé unique pour identifier le type de requête (ex: 'login', 'signup')
   * @param config - Configuration du rate limit
   * @returns true si la requête est autorisée, false sinon
   */
  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.requests.get(key);
    
    // Si pas d'entrée ou fenêtre expirée, réinitialiser
    if (!entry || now - entry.lastReset > config.windowMs) {
      this.requests.set(key, {
        requests: [now],
        lastReset: now,
      });
      return true;
    }
    
    // Nettoyer les requêtes expirées
    const validRequests = entry.requests.filter(
      time => now - time < config.windowMs
    );
    
    // Vérifier si on a atteint la limite
    if (validRequests.length >= config.maxRequests) {
      return false;
    }
    
    // Ajouter la nouvelle requête
    validRequests.push(now);
    this.requests.set(key, {
      requests: validRequests,
      lastReset: entry.lastReset,
    });
    
    return true;
  }

  /**
   * Réinitialise le rate limiter pour une clé
   * @param key - Clé à réinitialiser
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Réinitialise tous les rate limiters
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Obtient le nombre de requêtes restantes pour une clé
   * @param key - Clé à vérifier
   * @param config - Configuration du rate limit
   * @returns Nombre de requêtes restantes
   */
  getRemainingRequests(key: string, config: RateLimitConfig): number {
    const now = Date.now();
    const entry = this.requests.get(key);
    
    if (!entry) {
      return config.maxRequests;
    }
    
    // Nettoyer les requêtes expirées
    const validRequests = entry.requests.filter(
      time => now - time < config.windowMs
    );
    
    return Math.max(0, config.maxRequests - validRequests.length);
  }

  /**
   * Obtient le temps d'attente avant la prochaine requête autorisée
   * @param key - Clé à vérifier
   * @param config - Configuration du rate limit
   * @returns Temps d'attente en millisecondes, ou 0 si aucune attente nécessaire
   */
  getWaitTime(key: string, config: RateLimitConfig): number {
    const now = Date.now();
    const entry = this.requests.get(key);
    
    if (!entry) {
      return 0;
    }
    
    // Nettoyer les requêtes expirées
    const validRequests = entry.requests.filter(
      time => now - time < config.windowMs
    );
    
    if (validRequests.length < config.maxRequests) {
      return 0;
    }
    
    // Calculer le temps d'attente jusqu'à ce que la plus ancienne requête expire
    const oldestRequest = Math.min(...validRequests);
    const waitTime = config.windowMs - (now - oldestRequest);
    
    return Math.max(0, waitTime);
  }
}

// Instance singleton
export const rateLimiter = new RateLimiter();

/**
 * Configurations prédéfinies pour différents types de requêtes
 */
export const RATE_LIMIT_CONFIGS = {
  // Connexion : 5 tentatives toutes les 15 minutes
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Inscription : 3 tentatives toutes les heures
  signup: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 heure
  },
  
  // Réinitialisation de mot de passe : 3 tentatives toutes les heures
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 heure
  },
  
  // Création de posts : 10 posts toutes les minutes
  createPost: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Création de sessions dhikr : 5 sessions toutes les heures
  createDhikrSession: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 heure
  },
  
  // Appels API généraux : 100 requêtes toutes les minutes
  apiCall: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Hook pour utiliser le rate limiter dans un composant React
 * 
 * @example
 * ```tsx
 * const { isAllowed, getRemainingRequests, getWaitTime } = useRateLimit('login', RATE_LIMIT_CONFIGS.login);
 * 
 * const handleLogin = async () => {
 *   if (!isAllowed()) {
 *     const waitTime = getWaitTime();
 *     Alert.alert('Erreur', `Trop de tentatives. Réessayez dans ${Math.ceil(waitTime / 1000 / 60)} minutes.`);
 *     return;
 *   }
 *   // ... logique de connexion
 * };
 * ```
 */
export function useRateLimit(key: string, config: RateLimitConfig) {
  return {
    /**
     * Vérifie si une requête est autorisée
     */
    isAllowed: () => rateLimiter.isAllowed(key, config),
    
    /**
     * Réinitialise le rate limiter
     */
    reset: () => rateLimiter.reset(key),
    
    /**
     * Obtient le nombre de requêtes restantes
     */
    getRemainingRequests: () => rateLimiter.getRemainingRequests(key, config),
    
    /**
     * Obtient le temps d'attente avant la prochaine requête autorisée
     */
    getWaitTime: () => rateLimiter.getWaitTime(key, config),
  };
}










