/**
 * Utilitaires de validation sécurisés
 * Protection contre les injections, XSS, et données malformées
 */

/**
 * Valide un email selon les standards RFC 5322
 * @param email - Email à valider
 * @returns true si l'email est valide
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Longueur maximale
  if (email.length > 255) return false;
  
  // Regex basique (pour une validation plus stricte, utiliser une librairie)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un mot de passe selon les critères de sécurité
 * - Minimum 8 caractères
 * - Maximum 128 caractères
 * - Au moins 1 majuscule
 * - Au moins 1 minuscule
 * - Au moins 1 chiffre
 * - Optionnel : au moins 1 caractère spécial
 * 
 * @param password - Mot de passe à valider
 * @param requireSpecialChar - Exiger un caractère spécial (optionnel)
 * @returns true si le mot de passe est valide
 */
export function isValidPassword(
  password: string, 
  requireSpecialChar: boolean = false
): boolean {
  if (!password || typeof password !== 'string') return false;
  
  // Longueur
  if (password.length < 8 || password.length > 128) return false;
  
  // Au moins une majuscule
  if (!/[A-Z]/.test(password)) return false;
  
  // Au moins une minuscule
  if (!/[a-z]/.test(password)) return false;
  
  // Au moins un chiffre
  if (!/[0-9]/.test(password)) return false;
  
  // Caractère spécial (optionnel)
  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return false;
  }
  
  return true;
}

/**
 * Sanitise un texte pour éviter les injections XSS
 * - Limite la longueur
 * - Supprime les caractères dangereux
 * - Normalise les espaces
 * 
 * @param text - Texte à sanitiser
 * @param maxLength - Longueur maximale (défaut: 1000)
 * @returns Texte sanitisé
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text || typeof text !== 'string') return '';
  
  // Limiter la longueur
  let sanitized = text.substring(0, maxLength);
  
  // Supprimer les caractères dangereux pour XSS
  sanitized = sanitized.replace(/[<>]/g, '');
  
  // Normaliser les espaces (éviter les attaques par whitespace)
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Valide un UUID v4
 * @param uuid - UUID à valider
 * @returns true si l'UUID est valide
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valide un nombre dans une plage donnée
 * @param value - Valeur à valider
 * @param min - Valeur minimale
 * @param max - Valeur maximale
 * @returns true si le nombre est dans la plage
 */
export function isValidNumber(
  value: number, 
  min: number, 
  max: number
): boolean {
  return typeof value === 'number' && 
         !isNaN(value) && 
         isFinite(value) &&
         value >= min && 
         value <= max;
}

/**
 * Valide un texte de dhikr
 * - Longueur entre 1 et 500 caractères
 * - Pas de caractères dangereux
 * 
 * @param text - Texte à valider
 * @returns true si le texte est valide
 */
export function isValidDhikrText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const sanitized = sanitizeText(text, 500);
  return sanitized.length >= 1 && sanitized.length <= 500;
}

/**
 * Valide un nom d'utilisateur
 * - Longueur entre 1 et 50 caractères
 * - Caractères alphanumériques et espaces uniquement
 * 
 * @param name - Nom à valider
 * @returns true si le nom est valide
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  
  if (name.length < 1 || name.length > 50) return false;
  
  // Caractères alphanumériques, espaces, tirets, apostrophes
  const nameRegex = /^[a-zA-Z0-9\s\-'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+$/;
  return nameRegex.test(name);
}

/**
 * Valide une URL
 * @param url - URL à valider
 * @returns true si l'URL est valide
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Échappe les caractères spéciaux pour SQL (prévention injection SQL)
 * ⚠️ Note : Supabase utilise des requêtes paramétrées, mais cette fonction
 * peut être utile pour d'autres cas d'usage
 * 
 * @param str - Chaîne à échapper
 * @returns Chaîne échappée
 */
export function escapeSQL(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .replace(/'/g, "''")  // Échapper les apostrophes
    .replace(/\\/g, '\\\\') // Échapper les backslashes
    .replace(/;/g, '')      // Supprimer les points-virgules
    .replace(/--/g, '')     // Supprimer les commentaires SQL
    .replace(/\/\*/g, '')  // Supprimer les commentaires multi-lignes
    .replace(/\*\//g, '');
}










