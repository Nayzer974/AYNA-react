import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    incrementDhikr,
    incrementPrayer,
    incrementNotes,
    syncAnalyticsToSupabase
} from '@/services/analytics/userAnalytics';
import { useAuthStore } from './useAuthStore';

interface AnalyticsData {
    totalDhikr: number;
    totalNotes: number;
    totalPrayers: number;
    totalDays: number;
    streak: number;
    lastActive: string;
    firstActive?: string;
}

interface ProgressState {
    analytics: AnalyticsData;

    // Actions
    addDhikr: (count?: number) => Promise<void>;
    addPrayer: (count?: number) => Promise<void>;
    addNote: () => Promise<void>;
    updateStats: (updates: Partial<AnalyticsData>) => void;
    syncWithSupabase: () => Promise<void>;
    setAnalytics: (analytics: AnalyticsData) => void;
}

const defaultAnalytics: AnalyticsData = {
    totalDhikr: 0,
    totalNotes: 0,
    totalPrayers: 0,
    totalDays: 0,
    streak: 0,
    lastActive: new Date().toISOString(),
    firstActive: new Date().toISOString(),
};

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            analytics: defaultAnalytics,

            setAnalytics: (analytics) => set({ analytics }),

            addDhikr: async (count = 1) => {
                const userId = useAuthStore.getState().user?.id;
                const currentAnalytics = get().analytics;
                if (userId) {
                    const newAnalytics = await incrementDhikr(userId, currentAnalytics, count);
                    set({ analytics: newAnalytics });
                } else {
                    // Fallback local increment if no user (offline/guest)
                    set(state => ({
                        analytics: {
                            ...state.analytics,
                            totalDhikr: state.analytics.totalDhikr + count,
                            lastActive: new Date().toISOString()
                        }
                    }));
                }
            },

            addPrayer: async (count = 1) => {
                const userId = useAuthStore.getState().user?.id;
                const currentAnalytics = get().analytics;
                if (userId) {
                    const newAnalytics = await incrementPrayer(userId, currentAnalytics, count);
                    set({ analytics: newAnalytics });
                } else {
                    set(state => ({
                        analytics: {
                            ...state.analytics,
                            totalPrayers: state.analytics.totalPrayers + count,
                            lastActive: new Date().toISOString()
                        }
                    }));
                }
            },

            addNote: async () => {
                const userId = useAuthStore.getState().user?.id;
                const currentAnalytics = get().analytics;
                if (userId) {
                    const newAnalytics = await incrementNotes(userId, currentAnalytics);
                    set({ analytics: newAnalytics });
                } else {
                    set(state => ({
                        analytics: {
                            ...state.analytics,
                            totalNotes: state.analytics.totalNotes + 1,
                            lastActive: new Date().toISOString()
                        }
                    }));
                }
            },

            updateStats: (updates) => {
                set(state => ({
                    analytics: { ...state.analytics, ...updates }
                }));
            },

            syncWithSupabase: async () => {
                const userId = useAuthStore.getState().user?.id;
                if (userId) {
                    await syncAnalyticsToSupabase(userId, get().analytics);
                }
            }
        }),
        {
            name: 'ayna-progress',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
