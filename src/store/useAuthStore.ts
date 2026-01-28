import { create } from 'zustand';
import {
    signInWithSupabase,
    signUpWithSupabase,
    signOutWithSupabase,
    getCurrentUser,
    signInWithGoogle,
    isCurrentUserAdmin,
    supabase
} from '@/services/auth/supabase';
import { signInWithApple } from '@/services/auth/appleAuth';
import { APP_CONFIG } from '@/config';
import { storage } from '@/utils/storage';
import { secureStorage } from '@/utils/secureStorage';
import { logger } from '@/utils/logger';
import { InteractionManager } from 'react-native';
import { UserProfile } from '@/types/user';

interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: UserProfile | null) => void;
    setLoading: (isLoading: boolean) => void;
    initialize: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, gender?: string, avatarId?: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithApple: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => void;
}

const defaultAnalytics = {
    totalDhikr: 0,
    totalNotes: 0,
    totalPrayers: 0,
    totalDays: 0,
    streak: 0,
    lastActive: new Date().toISOString(),
    firstActive: new Date().toISOString()
};

const defaultUser: UserProfile = {
    name: '',
    email: '',
    theme: 'default',
    analytics: defaultAnalytics
};

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    setUser: (user) => set({
        user,
        isAuthenticated: !!user?.id,
        isLoading: false
    }),

    setLoading: (isLoading) => set({ isLoading }),

    initialize: async () => {
        set({ isLoading: true });
        try {
            // 1. Charger depuis secureStorage
            const userId = await secureStorage.getItem('user_id');
            const userEmail = await secureStorage.getItem('user_email');
            const saved = await storage.getItem('ayna_user_preferences');

            let validatedUserId = userId || undefined;
            let validatedUserEmail = userEmail || '';

            if (validatedUserId && APP_CONFIG.useSupabase && supabase) {
                try {
                    const { data: sessionData } = await supabase.auth.getSession();
                    const session = sessionData?.session || null;

                    if (!session || session.user.id !== validatedUserId) {
                        logger.warn('[AuthStore] Session invalid or missing. Clearing local storage.');
                        await secureStorage.clear();
                        validatedUserId = undefined;
                        validatedUserEmail = '';
                    }
                } catch (error) {
                    if (__DEV__) logger.error('[AuthStore] Session validation error:', error);
                    await secureStorage.clear();
                    validatedUserId = undefined;
                    validatedUserEmail = '';
                }
            }

            if (validatedUserId || saved) {
                try {
                    const preferences = saved ? JSON.parse(saved) : {};
                    const parsedUser: UserProfile = {
                        id: validatedUserId,
                        email: validatedUserEmail,
                        name: preferences.name || '',
                        theme: preferences.theme || 'default',
                        analytics: preferences.analytics || defaultAnalytics,
                        avatar: preferences.avatar,
                        gender: preferences.gender,
                        location: preferences.location,
                        isAdmin: preferences.isAdmin || false,
                        isSpecial: preferences.isSpecial || false,
                        emailVerified: preferences.emailVerified || false,
                    };
                    set({ user: parsedUser, isAuthenticated: !!validatedUserId, isLoading: false });
                } catch (e) {
                    if (__DEV__) logger.error('[AuthStore] Parse preferences error:', e);
                    set({ isLoading: false });
                }
            } else {
                set({ isLoading: false });
            }

            // Background sync with Supabase
            if (APP_CONFIG.useSupabase && supabase) {
                InteractionManager.runAfterInteractions(async () => {
                    try {
                        const currentUser = await getCurrentUser();
                        if (currentUser) {
                            const adminStatus = await isCurrentUserAdmin();
                            const userData = currentUser.user_metadata || {};

                            set((state) => {
                                if (!state.user) return state;
                                return {
                                    user: {
                                        ...state.user,
                                        id: currentUser.id,
                                        email: currentUser.email || state.user.email,
                                        isAdmin: adminStatus,
                                        emailVerified: currentUser.email_confirmed_at !== null,
                                    },
                                    isAuthenticated: true
                                };
                            });
                        }
                    } catch (e) {
                        if (__DEV__) logger.error('[AuthStore] Background sync error:', e);
                    }
                });
            }

        } catch (error) {
            if (__DEV__) logger.error('[AuthStore] Initialization error:', error);
            set({ isLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { user: sbUser, session } = await signInWithSupabase(email, password);

            if (sbUser) {
                const isAdmin = await isCurrentUserAdmin();
                const profile: UserProfile = {
                    ...defaultUser,
                    id: sbUser.id,
                    email: sbUser.email || email,
                    name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || '',
                    isAdmin,
                    emailVerified: sbUser.email_confirmed_at !== null,
                };

                await secureStorage.setItem('user_id', sbUser.id);
                await secureStorage.setItem('user_email', sbUser.email || email);

                set({ user: profile, isAuthenticated: true, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    register: async (name, email, password, gender, avatarId) => {
        set({ isLoading: true, error: null });
        try {
            const { user: sbUser } = await signUpWithSupabase(email, password, name, gender, avatarId);

            if (sbUser) {
                const profile: UserProfile = {
                    ...defaultUser,
                    id: sbUser.id,
                    email: sbUser.email || email,
                    name: name,
                    gender: gender as any,
                    avatar: avatarId,
                    emailVerified: sbUser.email_confirmed_at !== null,
                };

                await secureStorage.setItem('user_id', sbUser.id);
                await secureStorage.setItem('user_email', sbUser.email || email);

                set({ user: profile, isAuthenticated: true, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await signOutWithSupabase();
            await secureStorage.clear();
            set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
            if (__DEV__) logger.error('[AuthStore] Logout error:', error);
            set({ isLoading: false });
        }
    },

    loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
            await signInWithGoogle();
            // Le rechargement de l'état se fera via l'initialisation ou le changement de session Supabase si géré globalement
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    loginWithApple: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await signInWithApple();
            const sbUser = result?.user;
            if (sbUser) {
                const profile: UserProfile = {
                    ...defaultUser,
                    id: sbUser.id,
                    email: sbUser.email || '',
                    name: sbUser.user_metadata?.full_name || '',
                    emailVerified: true
                };
                set({ user: profile, isAuthenticated: true, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateProfile: (updates) => {
        set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null
        }));
    }
}));
