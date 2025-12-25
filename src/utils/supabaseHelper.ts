/**
 * Helper pour vérifier que Supabase est configuré
 * Évite les erreurs "possibly null" partout dans le code
 */

import { supabase } from '@/services/supabase';

/**
 * Vérifie que Supabase est configuré et le retourne
 * @throws Error si Supabase n'est pas configuré
 */
export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré');
  }
  return supabase;
}

/**
 * Vérifie que Supabase est configuré, retourne null si non configuré
 */
export function getSupabase() {
  return supabase;
}




