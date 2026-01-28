import { analyzeSingleNote } from '@/services/ai/journalAnalysis';
import { sendToAyna } from '@/services/content/ayna';

jest.mock('@/services/content/ayna', () => ({
    sendToAyna: jest.fn(),
}));

jest.mock('@/services/storage/notesStorage', () => ({
    loadJournalNotes: jest.fn(),
    saveJournalNotes: jest.fn(),
    deleteJournalNote: jest.fn(),
}));

jest.mock('@/services/auth/supabase', () => ({
    supabase: {
        auth: {
            getUser: jest.fn(),
        },
        from: jest.fn(),
    },
}));

jest.mock('@/contexts/UserContext', () => ({
    UserProfile: {},
}));

jest.mock('@/i18n', () => ({
    language: 'fr',
    t: (key: string) => key,
    default: {
        t: (key: string) => key,
    }
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

jest.mock('react-native', () => ({
    InteractionManager: {
        runAfterInteractions: (callback: () => void) => callback(),
    },
}));

describe('journalAnalysis', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('analyzeSingleNote', () => {
        it('should detect positive emotions correctly', async () => {
            (sendToAyna as jest.Mock).mockResolvedValue({
                content: JSON.stringify({
                    themes: ['Gratitude', 'Paix'],
                    insight: 'Vous semblez être dans un état de gratitude profonde.'
                })
            });

            const noteText = 'Alhamdulillah, je me sens très bien aujourd hui. Quelle bénédiction !';
            const result = await analyzeSingleNote(noteText, 'user-123');

            expect(result.sentiment).toBe('positive');
            expect(result.emotions).toContain('gratitude');
            expect(result.emotions).toContain('joie');
        });

        it('should detect negative emotions correctly', async () => {
            (sendToAyna as jest.Mock).mockResolvedValue({
                content: JSON.stringify({
                    themes: ['Tristesse', 'Difficultés'],
                    insight: 'Vous traversez une période difficile.'
                })
            });

            const noteText = 'C est très difficile en ce moment, je me sens triste et fatigué.';
            const result = await analyzeSingleNote(noteText, 'user-123');

            expect(result.sentiment).toBe('negative');
            expect(result.emotions).toContain('tristesse');
            expect(result.emotions).toContain('fatigue');
        });

        it('should handle AI service failure gracefully', async () => {
            (sendToAyna as jest.Mock).mockRejectedValue(new Error('AI Service Error'));

            const noteText = 'Une note simple.';
            const result = await analyzeSingleNote(noteText, 'user-123');

            expect(result.insight).toBe('Impossible d\'analyser cette note pour le moment.');
            expect(result.emotions).toBeDefined();
        });
    });
});
