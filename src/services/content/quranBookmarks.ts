import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const BOOKMARKS_KEY = '@quran_bookmarks';

export type BookmarkType = 'verse' | 'nur_day' | 'nur_category' | 'nur_parcours_step' | 'verse_reference';

export interface Bookmark {
    id: string;
    type: BookmarkType;
    timestamp: number;
    // Verse specific
    surahNumber?: number;
    verseNumber?: number;
    surahName?: string;
    // Nur Quran specific
    category?: string;
    day?: number;
    title?: string;
    // Parcours specific
    stepId?: string;
    // Verse reference specific (e.g. "2:152-157")
    verseRef?: string;
}

/**
 * Generate a unique ID for a bookmark
 */
export function generateBookmarkId(type: BookmarkType, params: { surah?: number, verse?: number, category?: string, day?: number, stepId?: string, verseRef?: string }): string {
    if (type === 'verse') {
        return `verse-${params.surah}-${params.verse}`;
    } else if (type === 'nur_category') {
        return `nur-cat-${params.category}`;
    } else if (type === 'nur_parcours_step') {
        return `nur-step-${params.stepId}`;
    } else if (type === 'verse_reference') {
        return `verse-ref-${params.verseRef}`;
    } else {
        return `nur-${params.category}-${params.day}`;
    }
}

/**
 * Save a new bookmark
 */
export async function saveBookmark(bookmark: Bookmark): Promise<Bookmark[]> {
    try {
        const existing = await getBookmarks();
        // Check if already exists to avoid duplicates
        if (existing.some(b => b.id === bookmark.id)) {
            return existing;
        }

        const updated = [bookmark, ...existing];
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
        return updated;
    } catch (error) {
        logger.error('Error saving bookmark:', error);
        return [];
    }
}

/**
 * Remove a bookmark by ID
 */
export async function removeBookmark(bookmarkId: string): Promise<Bookmark[]> {
    try {
        const existing = await getBookmarks();
        const updated = existing.filter(b => b.id !== bookmarkId);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
        return updated;
    } catch (error) {
        logger.error('Error removing bookmark:', error);
        return [];
    }
}

/**
 * Get all bookmarks
 */
export async function getBookmarks(): Promise<Bookmark[]> {
    try {
        const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch (error) {
        logger.error('Error loading bookmarks:', error);
        return [];
    }
}

/**
 * Check if a specific item is bookmarked
 */
export async function isBookmarked(id: string): Promise<boolean> {
    try {
        const bookmarks = await getBookmarks();
        return bookmarks.some(b => b.id === id);
    } catch (error) {
        return false;
    }
}

