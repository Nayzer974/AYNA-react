// Service de stockage local pour les notes du journal
import { storage } from '@/utils/storage';
import { supabase } from '@/services/supabase';
import { APP_CONFIG } from '@/config';

function getJournalStorageKey(userId?: string): string {
  return userId ? `ayna_journal_${userId}` : 'ayna_journal_anonymous';
}
// Ancien stockage (avant séparation par utilisateur)
const LEGACY_JOURNAL_STORAGE_KEY = 'ayna_journal';
const CHALLENGE_JOURNAL_STORAGE_KEY = 'ayna_challenge_journal';

export interface JournalNote {
  id?: string; // ID Supabase (optionnel pour compatibilité avec anciennes notes)
  text: string;
  createdAt: string;
}

export interface ChallengeJournalEntry {
  day: number;
  entry: string;
  createdAt: string;
  analysis?: string;
}

/**
 * Supprime une note dans Supabase
 */
async function deleteJournalNoteRemote(noteId: string, userId: string): Promise<void> {
  if (!APP_CONFIG.useSupabase || !supabase || !userId || !noteId) return;

  try {
    const { error } = await supabase
      .from('journal_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) {
      console.error('[notesStorage] Erreur suppression Supabase:', error);
    }
  } catch (error) {
    console.error('[notesStorage] Erreur suppression Supabase:', error);
  }
}

/**
 * Supprime une note du journal (local et Supabase)
 */
export async function deleteJournalNote(noteId: string | null, userId?: string): Promise<void> {
  try {
    const notes = await loadJournalNotes(userId, false);
    const filtered = notes.filter(n => {
      // Si on a un noteId, supprimer la note avec cet ID
      if (noteId) {
        return n.id !== noteId;
      }
      // Sinon, c'est une note sans ID (ancienne note), on ne peut pas la supprimer de Supabase
      return true;
    });
    
    await storage.setItem(getJournalStorageKey(userId), JSON.stringify(filtered));

    // Supprimer aussi dans Supabase si on a un ID et un userId
    if (noteId && userId) {
      await deleteJournalNoteRemote(noteId, userId);
    }
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}

/**
 * Sauvegarde une note dans Supabase
 */
async function saveJournalNoteRemote(note: JournalNote, userId: string): Promise<string | null> {
  if (!APP_CONFIG.useSupabase || !supabase || !userId) return null;

  try {
    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[notesStorage] Utilisateur non authentifié:', authError);
      return null;
    }
    
    // Vérifier que le userId correspond à l'utilisateur authentifié
    if (user.id !== userId) {
      console.error('[notesStorage] userId ne correspond pas à l\'utilisateur authentifié');
      return null;
    }

    const { data, error } = await supabase
      .from('journal_notes')
      .insert({
        user_id: userId,
        text: note.text,
        created_at: note.createdAt,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[notesStorage] Erreur sauvegarde Supabase:', error);
      // Si c'est une erreur RLS, donner plus de détails
      if (error.code === '42501') {
        console.error('[notesStorage] Erreur RLS - Vérifiez que les politiques RLS sont correctement configurées');
        console.error('[notesStorage] User ID:', userId);
        console.error('[notesStorage] Auth UID:', user.id);
      }
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('[notesStorage] Erreur sauvegarde Supabase:', error);
    return null;
  }
}

/**
 * Sauvegarde une note dans le journal local et Supabase
 */
export async function saveJournalNote(note: JournalNote, userId?: string): Promise<void> {
  try {
    const existingNotes = await loadJournalNotes(userId, false);
    
    // Si la note n'a pas d'ID et qu'on a un userId, sauvegarder dans Supabase
    let noteId = note.id;
    if (!noteId && userId) {
      noteId = await saveJournalNoteRemote(note, userId) || undefined;
    }
    
    const noteWithId: JournalNote = noteId ? { ...note, id: noteId } : note;
    const updatedNotes = [noteWithId, ...existingNotes].slice(0, 500); // Limiter à 500 notes
    
    await storage.setItem(getJournalStorageKey(userId), JSON.stringify(updatedNotes));
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}

/**
 * Charge les notes depuis Supabase
 */
async function loadJournalNotesRemote(userId: string): Promise<JournalNote[]> {
  if (!APP_CONFIG.useSupabase || !supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('journal_notes')
      .select('id, text, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[notesStorage] Erreur chargement Supabase:', error);
      return [];
    }

    return (data || []).map(note => ({
      id: note.id,
      text: note.text,
      createdAt: note.created_at,
    }));
  } catch (error) {
    console.error('[notesStorage] Erreur chargement Supabase:', error);
    return [];
  }
}

/**
 * Sauvegarde plusieurs notes dans le journal local et Supabase
 */
export async function saveJournalNotes(notes: JournalNote[], userId?: string): Promise<void> {
  try {
    const limitedNotes = notes.slice(0, 500); // Limiter à 500 notes
    
    // Sauvegarder les nouvelles notes (sans ID) dans Supabase
    if (userId) {
      const newNotes = limitedNotes.filter(n => !n.id);
      for (const note of newNotes) {
        const noteId = await saveJournalNoteRemote(note, userId);
        if (noteId) {
          const index = limitedNotes.indexOf(note);
          if (index >= 0) {
            limitedNotes[index] = { ...note, id: noteId };
          }
        }
      }
    }
    
    await storage.setItem(getJournalStorageKey(userId), JSON.stringify(limitedNotes));
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}

/**
 * Charge toutes les notes du journal depuis le stockage local et Supabase
 */
export async function loadJournalNotes(userId?: string, syncRemote: boolean = false): Promise<JournalNote[]> {
  try {
    // Migration simple: l'ancien key global est déplacé vers l'espace "anonyme"
    // pour éviter toute fuite entre comptes lorsqu'on change d'utilisateur sur le même appareil.
    try {
      const legacy = await storage.getItem(LEGACY_JOURNAL_STORAGE_KEY);
      if (legacy) {
        const anonKey = getJournalStorageKey(undefined);
        const anonExisting = await storage.getItem(anonKey);
        if (!anonExisting) {
          await storage.setItem(anonKey, legacy);
        }
        await storage.removeItem(LEGACY_JOURNAL_STORAGE_KEY);
      }
    } catch {
      // ignore
    }

    const saved = await storage.getItem(getJournalStorageKey(userId));
    let localNotes: JournalNote[] = [];
    
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        localNotes = parsed;
      }
    }

    // Si on a un userId et qu'on veut synchroniser, pousser d'abord les notes locales non synchronisées
    if (syncRemote && userId) {
      const unsynced = localNotes.filter(n => !n.id);
      if (unsynced.length > 0) {
        for (const note of unsynced) {
          const newId = await saveJournalNoteRemote(note, userId);
          if (newId) {
            const idx = localNotes.indexOf(note);
            if (idx >= 0) {
              localNotes[idx] = { ...note, id: newId };
            }
          }
        }
      }

      const remoteNotes = await loadJournalNotesRemote(userId);
      
      // Fusionner les notes locales et distantes
      const notesMap = new Map<string, JournalNote>();
      
      // Ajouter les notes distantes d'abord
      remoteNotes.forEach(note => {
        if (note.id) {
          notesMap.set(note.id, note);
        }
      });
      
      // Ajouter/mettre à jour avec les notes locales (plus récentes ou non synchronisées)
      localNotes.forEach(note => {
        if (note.id) {
          notesMap.set(note.id, note);
        } else {
          // Note locale sans ID, l'ajouter avec un timestamp comme clé temporaire
          notesMap.set(`local_${note.createdAt}`, note);
        }
      });
      
      const mergedNotes = Array.from(notesMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Sauvegarder le merge localement
      await storage.setItem(getJournalStorageKey(userId), JSON.stringify(mergedNotes));
      return mergedNotes;
    }

    return localNotes;
  } catch (error) {
    // Erreur silencieuse en production
    return [];
  }
}

/**
 * Charge les entrées du journal du challenge depuis le stockage local
 */
export async function loadChallengeJournalEntries(): Promise<ChallengeJournalEntry[]> {
  try {
    const raw = await storage.getItem(CHALLENGE_JOURNAL_STORAGE_KEY);
    if (!raw) return [];
    
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) return [];
    
    return entries;
  } catch (error) {
    // Erreur silencieuse en production
    return [];
  }
}

/**
 * Sauvegarde une entrée du journal du challenge localement
 */
export async function saveChallengeJournalEntry(entry: ChallengeJournalEntry): Promise<void> {
  try {
    const existingEntries = await loadChallengeJournalEntries();
    
    // Remplacer l'entrée existante pour ce jour si elle existe, sinon l'ajouter
    const entryIndex = existingEntries.findIndex(e => e.day === entry.day);
    let updatedEntries: ChallengeJournalEntry[];
    
    if (entryIndex >= 0) {
      // Mettre à jour l'entrée existante
      updatedEntries = [...existingEntries];
      updatedEntries[entryIndex] = entry;
    } else {
      // Ajouter une nouvelle entrée
      updatedEntries = [...existingEntries, entry];
    }
    
    // Trier par jour (plus récent en premier)
    updatedEntries.sort((a, b) => b.day - a.day);
    
    await storage.setItem(CHALLENGE_JOURNAL_STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}

/**
 * Récupère l'entrée du journal pour un jour spécifique
 */
export async function getChallengeJournalEntry(day: number): Promise<ChallengeJournalEntry | null> {
  try {
    const entries = await loadChallengeJournalEntries();
    return entries.find(e => e.day === day) || null;
  } catch (error) {
    // Erreur silencieuse en production
    return null;
  }
}

/**
 * Supprime toutes les notes du journal (utilisé pour le nettoyage)
 */
export async function clearJournalNotes(userId?: string): Promise<void> {
  try {
    await storage.removeItem(getJournalStorageKey(userId));
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}

/**
 * Supprime toutes les entrées du journal du challenge (utilisé pour le nettoyage)
 */
export async function clearChallengeJournalEntries(): Promise<void> {
  try {
    await storage.removeItem(CHALLENGE_JOURNAL_STORAGE_KEY);
  } catch (error) {
    // Erreur silencieuse en production
    throw error;
  }
}

