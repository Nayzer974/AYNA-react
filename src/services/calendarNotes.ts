/**
 * Service pour gérer les notes et événements personnels du calendrier
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_NOTES_KEY = '@ayna_calendar_notes';

export interface CalendarNote {
  id: string;
  date: string; // Format: YYYY-MM-DD
  title: string;
  description?: string;
  color?: string;
  reminder?: boolean;
  reminderTime?: string; // Format: HH:MM
  createdAt: string;
  updatedAt: string;
}

/**
 * Récupère toutes les notes
 */
export async function getAllNotes(): Promise<CalendarNote[]> {
  try {
    const notesJson = await AsyncStorage.getItem(CALENDAR_NOTES_KEY);
    if (!notesJson) return [];
    return JSON.parse(notesJson);
  } catch (error) {
    console.error('[calendarNotes] Erreur lors de la récupération des notes:', error);
    return [];
  }
}

/**
 * Récupère les notes pour une date spécifique
 */
export async function getNotesForDate(date: string): Promise<CalendarNote[]> {
  try {
    const allNotes = await getAllNotes();
    return allNotes.filter(note => note.date === date);
  } catch (error) {
    console.error('[calendarNotes] Erreur lors de la récupération des notes pour la date:', error);
    return [];
  }
}

/**
 * Sauvegarde une note
 */
export async function saveNote(note: CalendarNote): Promise<void> {
  try {
    const allNotes = await getAllNotes();
    const existingIndex = allNotes.findIndex(n => n.id === note.id);
    
    if (existingIndex >= 0) {
      // Mettre à jour
      allNotes[existingIndex] = {
        ...note,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Ajouter
      allNotes.push({
        ...note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    await AsyncStorage.setItem(CALENDAR_NOTES_KEY, JSON.stringify(allNotes));
  } catch (error) {
    console.error('[calendarNotes] Erreur lors de la sauvegarde de la note:', error);
    throw error;
  }
}

/**
 * Supprime une note
 */
export async function deleteNote(noteId: string): Promise<void> {
  try {
    const allNotes = await getAllNotes();
    const filteredNotes = allNotes.filter(note => note.id !== noteId);
    await AsyncStorage.setItem(CALENDAR_NOTES_KEY, JSON.stringify(filteredNotes));
  } catch (error) {
    console.error('[calendarNotes] Erreur lors de la suppression de la note:', error);
    throw error;
  }
}

/**
 * Génère un ID unique pour une note
 */
export function generateNoteId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formate une date au format YYYY-MM-DD
 */
export function formatDateForStorage(year: number, month: number, day: number): string {
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

