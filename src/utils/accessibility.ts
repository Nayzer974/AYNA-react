/**
 * Utilitaires pour l'accessibilité
 * Vérification des contrastes, génération de labels, etc.
 */

/**
 * Calcule le ratio de contraste entre deux couleurs selon WCAG
 * @param color1 - Première couleur (hex ou rgb)
 * @param color2 - Seconde couleur (hex ou rgb)
 * @returns Ratio de contraste (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calcule la luminance relative d'une couleur selon WCAG
 * @param color - Couleur (hex ou rgb)
 * @returns Luminance relative (0-1)
 */
function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  
  // Conversion en valeurs relatives
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Convertit une couleur hex en RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Supprimer le # si présent
  hex = hex.replace('#', '');
  
  // Gérer les formats courts (#FFF) et longs (#FFFFFF)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  if (hex.length !== 6) return null;
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Vérifie si le contraste respecte les standards WCAG
 * @param color1 - Première couleur
 * @param color2 - Seconde couleur
 * @param level - Niveau WCAG ('AA' | 'AAA')
 * @param size - Taille du texte ('normal' | 'large')
 * @returns true si le contraste est suffisant
 */
export function meetsWCAGContrast(
  color1: string,
  color2: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(color1, color2);
  
  if (level === 'AAA') {
    // AAA: 7:1 pour texte normal, 4.5:1 pour texte large
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  } else {
    // AA: 4.5:1 pour texte normal, 3:1 pour texte large
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  }
}

/**
 * Trouve une couleur de texte lisible pour un fond donné
 * @param backgroundColor - Couleur de fond
 * @param lightText - Couleur de texte clair (par défaut blanc)
 * @param darkText - Couleur de texte sombre (par défaut noir)
 * @returns La couleur de texte la plus lisible
 */
export function getReadableTextColor(
  backgroundColor: string,
  lightText: string = '#FFFFFF',
  darkText: string = '#000000'
): string {
  const contrastWithLight = getContrastRatio(backgroundColor, lightText);
  const contrastWithDark = getContrastRatio(backgroundColor, darkText);
  
  return contrastWithLight > contrastWithDark ? lightText : darkText;
}

/**
 * Génère un label d'accessibilité à partir d'un texte
 * @param text - Texte source
 * @param context - Contexte supplémentaire
 * @returns Label d'accessibilité
 */
export function generateAccessibilityLabel(
  text: string,
  context?: string
): string {
  if (context) {
    return `${text}, ${context}`;
  }
  return text;
}

/**
 * Vérifie si une taille de touch target respecte les standards
 * @param width - Largeur
 * @param height - Hauteur
 * @returns true si la taille est suffisante (minimum 44x44px recommandé)
 */
export function meetsTouchTargetSize(
  width: number,
  height: number
): boolean {
  const minSize = 44; // Minimum recommandé par Apple et Google
  return width >= minSize && height >= minSize;
}

/**
 * Crée des propriétés d'accessibilité standardisées
 */
export interface AccessibilityProps {
  accessibilityRole?: 'button' | 'link' | 'header' | 'text' | 'image' | 'none';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };
}

export function createAccessibilityProps(
  label: string,
  hint?: string,
  role: AccessibilityProps['accessibilityRole'] = 'button',
  state?: AccessibilityProps['accessibilityState']
): AccessibilityProps {
  return {
    accessibilityRole: role,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: state,
  };
}




