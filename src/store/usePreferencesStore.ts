import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { changeLanguage } from '@/i18n';

export type ThemeType = 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy';
export type LanguageType = 'fr' | 'ar' | 'en';

interface PreferencesState {
    theme: ThemeType;
    language: LanguageType;
    hapticsEnabled: boolean;

    // Actions
    setTheme: (theme: ThemeType) => void;
    setLanguage: (language: LanguageType) => Promise<void>;
    setHapticsEnabled: (enabled: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            theme: 'default',
            language: (i18n.language as LanguageType) || 'fr',
            hapticsEnabled: true,

            setTheme: (theme) => set({ theme }),

            setLanguage: async (language) => {
                await changeLanguage(language);
                set({ language });
            },

            setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
        }),
        {
            name: 'ayna-preferences',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
