/**
 * Utilitaire de logging sécurisé pour production
 * 
 * ⚠️ SÉCURITÉ:
 * - En production, les logs sont désactivés sauf les erreurs
 * - Les logs d'erreur sont redactés pour éviter les fuites de données sensibles
 * - Aucun log ne contient de PII, tokens, ou données sensibles
 * 
 * En développement, tous les logs sont actifs pour le debugging
 */

const isDev = __DEV__;

/**
 * Liste des patterns à redacter dans les logs (PII, tokens, secrets)
 */
const SENSITIVE_PATTERNS = [
  // Emails
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // UUIDs
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  // Tokens (longues chaînes alphanumériques)
  /\b[A-Za-z0-9]{32,}\b/g,
  // Mots de passe (détection basique)
  /password["\s:=]+[^\s,}]+/gi,
  // Clés API
  /(api[_-]?key|secret|token)["\s:=]+[^\s,}]+/gi,
];

/**
 * Redacte les données sensibles d'une chaîne
 */
function redactSensitiveData(text: string): string {
  let redacted = text;
  
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  
  return redacted;
}

/**
 * Redacte les données sensibles d'un objet ou d'une valeur
 */
function redactValue(value: any): any {
  if (typeof value === 'string') {
    return redactSensitiveData(value);
  }
  
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(redactValue);
    }
    
    const redacted: any = {};
    for (const key in value) {
      // Ne pas logger les clés sensibles
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('key')) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactValue(value[key]);
      }
    }
    return redacted;
  }
  
  return value;
}

export const logger = {
  /**
   * Log d'information (désactivé en production)
   * ⚠️ Ne jamais logger de données sensibles
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
    // En production: silencieux (pas de log)
  },

  /**
   * Log d'avertissement (désactivé en production)
   * ⚠️ Ne jamais logger de données sensibles
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
    // En production: silencieux (pas de log)
  },

  /**
   * Log d'erreur (toujours actif mais redacté en production)
   * ⚠️ Les erreurs sont redactées pour éviter les fuites de données sensibles
   */
  error: (...args: any[]) => {
    if (isDev) {
      // En développement: logger tel quel
      console.error(...args);
    } else {
      // En production: redacter les données sensibles
      const redactedArgs = args.map(redactValue);
      console.error(...redactedArgs);
    }
  },

  /**
   * Log de debug (désactivé en production)
   * ⚠️ Ne jamais logger de données sensibles
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
    // En production: silencieux (pas de log)
  },

  /**
   * Log d'information avec tag (désactivé en production)
   * ⚠️ Ne jamais logger de données sensibles
   */
  info: (tag: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[${tag}]`, ...args);
    }
    // En production: silencieux (pas de log)
  },

  /**
   * Log d'erreur sécurisé (redaction agressive)
   * À utiliser pour les erreurs qui pourraient contenir des données sensibles
   */
  secureError: (message: string, error?: Error | any) => {
    const safeMessage = redactSensitiveData(message);
    
    if (error) {
      const safeError = {
        message: error.message ? redactSensitiveData(error.message) : '[Error]',
        name: error.name || 'Error',
        // Ne jamais logger error.stack en production (peut contenir des données sensibles)
        stack: isDev ? error.stack : '[REDACTED]',
      };
      
      if (isDev) {
        console.error(`[SECURE ERROR] ${safeMessage}`, safeError);
      } else {
        console.error(`[SECURE ERROR] ${safeMessage}`, safeError);
      }
    } else {
      if (isDev) {
        console.error(`[SECURE ERROR] ${safeMessage}`);
      } else {
        console.error(`[SECURE ERROR] ${safeMessage}`);
      }
    }
  },
};


