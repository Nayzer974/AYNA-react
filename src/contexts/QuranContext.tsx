import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getSurahWithTranslation, getSurahTransliteration, SurahData } from '@/services/content/quranApi';
import {
  Bookmark,
  BookmarkType,
  saveBookmark,
  removeBookmark,
  getBookmarks,
  generateBookmarkId,
  isBookmarked as checkIsBookmarked
} from '@/services/content/quranBookmarks';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';

export interface Verse {
  number: number;
  numberInSurah: number;
  arabic: string;
  french: string;
  juz?: number;
  page?: number;
}

// Fonction pour normaliser le texte arabe (retirer diacritiques, espaces, etc.)
function normalizeArabic(input?: string): string {
  if (!input) return '';
  // Retirer tatweel (kashida)
  let t = input.replace(/\u0640/g, '');
  // Retirer les diacritiques arabes
  t = t.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
  // Garder seulement les lettres arabes
  t = t.replace(/[^\u0600-\u06FF]/g, '');
  return t;
}

// Fonction pour détecter si un texte contient le Bismillah
function containsBasmala(text?: string): boolean {
  const norm = normalizeArabic(text);
  // Détecter بسمالله ou بسم suivi de الله
  return /بسمالله/.test(norm) || /بسم.*?الله/.test(norm);
}

/**
 * Fonction utilitaire pour retirer la Basmala du début d'un texte arabe
 * Gère toutes les variantes possibles (espaces, diacritiques, etc.)
 * Basmala exacte : بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
 */
function removeBasmalaFromText(text: string): string {
  if (!text || text.trim().length === 0) return text;

  const originalText = text;

  // Patterns complets de la Basmala avec toutes les variantes possibles
  // La Basmala se termine toujours par "الرَّحِيمِ" ou "الرحيم"
  const basmalaPatterns = [
    // Pattern exact avec diacritiques complets
    /بِسْمِ\s*ٱ?للَّٰهِ\s*ٱ?لرَّحْمَٰنِ\s*ٱ?لرَّحِيمِ\s*/g,
    /بِسْمِ\s*اللَّهِ\s*الرَّحْمَٰنِ\s*الرَّحِيمِ\s*/g,
    /بِسْمِ\s*اللَّهِ\s*الرَّحْمَنِ\s*الرَّحِيمِ\s*/g,
    /بِسْمِ\s*الله\s*الرَّحْمَٰنِ\s*الرَّحِيمِ\s*/g,
    /بِسْمِ\s*الله\s*الرَّحْمَنِ\s*الرَّحِيمِ\s*/g,
    // Sans diacritiques
    /بسم\s*الله\s*الرحمن\s*الرحيم\s*/g,
    /بسم\s*اللَّه\s*الرحمن\s*الرحيم\s*/g,
    // Avec espaces variables
    /بِسْمِ\s+ٱ?للَّٰهِ\s+ٱ?لرَّحْمَٰنِ\s+ٱ?لرَّحِيمِ\s+/g,
    /بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s+/g,
  ];

  let cleaned = text;

  // Essayer chaque pattern complet
  for (const pattern of basmalaPatterns) {
    cleaned = cleaned.replace(pattern, '');
    if (cleaned !== text) {
      // Un pattern a fonctionné, nettoyer et retourner
      cleaned = cleaned.trim().replace(/^[\s\u060C\u061B\u061F\u0640\u064B-\u065F\u0670\u06D6-\u06ED]+/, '');
      if (cleaned.length >= 3) {
        return cleaned;
      }
      // Si le texte nettoyé est trop court, réessayer avec d'autres patterns
      cleaned = text;
    }
  }

  // Si aucun pattern complet n'a fonctionné, chercher la fin de la Basmala
  // "الرَّحِيمِ" ou "الرحيم" marque TOUJOURS la fin de la Basmala
  const basmalaEndPatterns = [
    /ٱ?لرَّحِيمِ/,
    /الرَّحِيمِ/,
    /الرحيم/,
    /لرَّحِيمِ/,
  ];

  for (const endPattern of basmalaEndPatterns) {
    const match = text.match(endPattern);
    if (match && match.index !== undefined && match.index < 200) {
      // Vérifier que c'est bien la fin de la Basmala (doit être dans les 200 premiers caractères)
      // Retirer tout jusqu'à la fin du pattern inclus
      const endPos = match.index + match[0].length;
      let tempCleaned = text.substring(endPos).trim();

      // Nettoyer les espaces, ponctuations et diacritiques au début
      tempCleaned = tempCleaned.replace(/^[\s\u060C\u061B\u061F\u0640\u064B-\u065F\u0670\u06D6-\u06ED]+/, '');

      // Vérifier que le texte nettoyé est valide (au moins 3 caractères arabes)
      const cleanedNormalized = normalizeArabic(tempCleaned);
      if (cleanedNormalized.length >= 3) {
        return tempCleaned;
      }
    }
  }

  // Si rien n'a fonctionné, retourner le texte original
  return originalText;
}

export interface QuranState {
  currentSurah: number | null;
  arabicData: SurahData | null;
  frenchData: SurahData | null;
  transliterationData: SurahData | null;
  verses: Verse[];
  loading: boolean;
  error: string | null;
  language: 'arabic' | 'french' | 'both';
  showTransliteration: boolean;
  bookmarks: Bookmark[];
}

interface QuranContextType {
  state: QuranState;
  loadSurah: (surahNumber: number) => Promise<void>;
  loadTransliteration: (surahNumber: number) => Promise<void>;
  setLanguage: (lang: 'arabic' | 'french' | 'both') => void;
  toggleTransliteration: () => void;
  clearError: () => void;
  toggleBookmark: (type: BookmarkType, params: any) => Promise<void>;
  checkIsBookmarked: (id: string) => boolean;
}

const QuranContext = createContext<QuranContextType | undefined>(undefined);

const initialState: QuranState = {
  currentSurah: null,
  arabicData: null,
  frenchData: null,
  transliterationData: null,
  verses: [],
  loading: false,
  error: null,
  language: 'both',
  showTransliteration: false,
  bookmarks: []
};

export function QuranProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuranState>(initialState);

  // Charger les favoris au démarrage
  React.useEffect(() => {
    getBookmarks().then(bookmarks => {
      setState(prev => ({ ...prev, bookmarks }));
    });
  }, []);

  const toggleBookmark = useCallback(async (type: BookmarkType, params: any) => {
    const id = generateBookmarkId(type, params);
    // Utiliser l'état actuel pour vérifier si le favori existe
    const isBookmarked = state.bookmarks.some(b => b.id === id);

    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = await removeBookmark(id);
    } else {
      const bookmark: Bookmark = {
        id,
        type,
        timestamp: Date.now(),
        ...params
      };
      newBookmarks = await saveBookmark(bookmark);
    }

    setState(prev => ({ ...prev, bookmarks: newBookmarks }));
  }, [state.bookmarks]);

  const checkIsBookmarked = useCallback((id: string) => {
    return state.bookmarks.some(b => b.id === id);
  }, [state.bookmarks]);

  const loadSurah = useCallback(async (surahNumber: number) => {
    // Vérifier si la sourate est déjà chargée
    if (state.currentSurah === surahNumber && state.verses.length > 0) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Le cache est géré par la bibliothèque de l'API ou AsyncStorage.
      // Nettoyage proactif supprimé pour améliorer les performances.


      // Récupérer la langue de l'utilisateur depuis i18n
      const userLang = (i18n.language || 'fr') as 'fr' | 'en' | 'ar';
      const { arabic, translation: french } = await getSurahWithTranslation(surahNumber, userLang);

      // Combiner les versets arabes et français
      const verses: Verse[] = arabic.ayahs.map((arabicAyah, index) => {
        const frenchAyah = french.ayahs[index];

        let arabicText = arabicAyah.text;
        let frenchText = frenchAyah?.text || '';
        const numberInSurah =
          (arabicAyah as any).numberInSurah ??
          (arabicAyah as any).verse_number ??
          index + 1;

        // Nettoyer la Basmala du premier verset si nécessaire
        // Conditions : verset 1 ET pas Al-Fatiha (Sourate 1) car pour Al-Fatiha la Basmala est un verset à part entière
        if (numberInSurah === 1 && surahNumber !== 1) {
          const originalArabicText = arabicText;

          // Utiliser la fonction utilitaire pour retirer la Basmala
          arabicText = removeBasmalaFromText(arabicText);

          // Si la Basmala a été retirée avec succès, nettoyer aussi la traduction française
          if (arabicText !== originalArabicText && arabicText.length >= 3) {
            if (frenchText) {
              const originalFrench = frenchText;

              // Patterns pour retirer la traduction française de la Basmala
              const frenchBasmalaPatterns = [
                /^Au nom d'Allah[^.]*\.\s*/i,
                /^Au nom d'Allah[^,]*,\s*/i,
                /^Au nom d'Allah\s*/i,
                /^Au nom de Dieu[^.]*\.\s*/i,
                /^Au nom de Dieu[^,]*,\s*/i,
                /^Au nom de Dieu\s*/i,
                /^Au nom[^.]*\.\s*/i,
                /^Au nom[^,]*,\s*/i,
              ];

              for (const pattern of frenchBasmalaPatterns) {
                frenchText = frenchText.replace(pattern, '');
                if (frenchText !== originalFrench) {
                  break;
                }
              }

              // Nettoyer les espaces au début
              frenchText = frenchText.trim();
            }
          }
        }

        return {
          number: arabicAyah.number,
          numberInSurah,
          arabic: arabicText,
          french: frenchText,
          juz: arabicAyah.juz,
          page: arabicAyah.page
        };
      });

      setState({
        currentSurah: surahNumber,
        arabicData: arabic,
        frenchData: french,
        transliterationData: null, // Chargé à la demande
        verses,
        loading: false,
        error: null,
        language: state.language,
        showTransliteration: state.showTransliteration,
        bookmarks: state.bookmarks
      });
    } catch (error: any) {
      logger.error('Error loading surah:', error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: error?.message || 'Erreur lors du chargement de la sourate'
      }));
    }
  }, [state.currentSurah, state.verses.length, state.language]);

  const loadTransliteration = useCallback(async (surahNumber: number) => {
    // Si la translittération est déjà chargée pour cette sourate, ne rien faire
    if (state.currentSurah === surahNumber && state.transliterationData) {
      return;
    }

    try {
      const transliteration = await getSurahTransliteration(surahNumber);
      setState(prev => ({ ...prev, transliterationData: transliteration }));
    } catch (error: any) {
      logger.error('Error loading transliteration:', error);
      // Ne pas bloquer l'application si la translittération échoue
    }
  }, [state.currentSurah, state.transliterationData]);

  const toggleTransliteration = useCallback(() => {
    setState(prev => ({ ...prev, showTransliteration: !prev.showTransliteration }));
  }, []);

  const setLanguage = useCallback((lang: 'arabic' | 'french' | 'both') => {
    setState(prev => ({ ...prev, language: lang }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: QuranContextType = {
    state,
    loadSurah,
    loadTransliteration,
    setLanguage,
    toggleTransliteration,
    clearError,
    toggleBookmark,
    checkIsBookmarked
  };

  return (
    <QuranContext.Provider value={value}>
      {children}
    </QuranContext.Provider>
  );
}

export function useQuran(): QuranContextType {
  const context = useContext(QuranContext);
  if (context === undefined) {
    // Retourner un contexte par défaut au lieu de lancer une erreur
    // Cela permet aux composants lazy-loaded de fonctionner même si le provider n'est pas encore monté
    return {
      state: initialState,
      loadSurah: async () => { },
      loadTransliteration: async () => { },
      setLanguage: () => { },
      toggleTransliteration: () => { },
      clearError: () => { },
      toggleBookmark: async () => { },
      checkIsBookmarked: () => false,
    };
  }
  return context;
}


