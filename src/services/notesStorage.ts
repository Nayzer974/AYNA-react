// Service de stockage local pour les notes du journal
import { storage } from '@/utils/storage';

const JOURNAL_STORAGE_KEY = 'ayna_journal';
const CHALLENGE_JOURNAL_STORAGE_KEY = 'ayna_challenge_journal';

export interface JournalNote {
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
 * Charge toutes les notes du journal depuis le stockage local
 */
export async function loadJournalNotes(): Promise<JournalNote[]> {
  try {
    const raw = await storage.getItem(JOURNAL_STORAGE_KEY);
    if (!raw) return [];
    
    const notes = JSON.parse(raw);
    if (!Array.isArray(notes)) return [];
    
    return notes;
  } catch (error) {
    console.error('Erreur lors du chargement des notes du journal:', error);
    return [];
  }
}

/**
 * Sauvegarde une note dans le journal local
 */
export async function saveJournalNote(note: JournalNote): Promise<void> {
  try {
    const existingNotes = await loadJournalNotes();
    const updatedNotes = [note, ...existingNotes].slice(0, 500); // Limiter à 500 notes
    
    await storage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updatedNotes));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la note:', error);
    throw error;
  }
}

/**
 * Sauvegarde plusieurs notes dans le journal local
 */
export async function saveJournalNotes(notes: JournalNote[]): Promise<void> {
  try {
    const limitedNotes = notes.slice(0, 500); // Limiter à 500 notes
    await storage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(limitedNotes));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des notes:', error);
    throw error;
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
    console.error('Erreur lors du chargement des entrées du challenge:', error);
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
    console.error('Erreur lors de la sauvegarde de l\'entrée du challenge:', error);
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
    console.error('Erreur lors de la récupération de l\'entrée:', error);
    return null;
  }
}

/**
 * Supprime toutes les notes du journal (utilisé pour le nettoyage)
 */
export async function clearJournalNotes(): Promise<void> {
  try {
    await storage.removeItem(JOURNAL_STORAGE_KEY);
  } catch (error) {
    console.error('Erreur lors de la suppression des notes:', error);
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
    console.error('Erreur lors de la suppression des entrées du challenge:', error);
    throw error;
  }
}

