import React, { useEffect, useState, createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { signInWithSupabase, signUpWithSupabase, signOutWithSupabase, getCurrentUser, signInWithGoogle, isCurrentUserAdmin, supabase } from '@/services/auth/supabase';
import { signInWithApple } from '@/services/auth/appleAuth';
import { APP_CONFIG } from '@/config';
import { storage } from '@/utils/storage';
import { secureStorage } from '@/utils/secureStorage';
import {
  incrementDhikr,
  incrementNotes,
  incrementPrayer,
  updateLastActive,
  updateTotalDays,
  syncAnalyticsToSupabase,
  type UserAnalytics,
} from '@/services/analytics/userAnalytics';
import { isUserSpecial } from '@/services/auth/userRoles';
import { logger } from '@/utils/logger';
import { InteractionManager } from 'react-native';
import { UserProfile } from '@/types/user';
import { useAuthStore } from '@/store/useAuthStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useProgressStore } from '@/store/useProgressStore';

// La définition de UserProfile a été déplacée dans @/types/user.ts

interface UserContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUser: (updates: Partial<UserProfile>) => void;
  incrementUserDhikr: (count?: number) => void; // Nouvelle fonction pour incrémenter les dhikr depuis n'importe où
  incrementUserPrayer: (count?: number) => void; // Fonction pour incrémenter les prières
  login?: (email: string, password: string) => Promise<void>;
  loginWithGoogle?: () => Promise<void>;
  loginWithApple?: () => Promise<void>;
  register?: (name: string, email: string, password: string, gender?: string, avatarId?: string) => Promise<void>;
  logout?: () => void;
}

const defaultUser: UserProfile = {
  name: '',
  email: '',
  theme: 'default',
  analytics: {
    totalDhikr: 0,
    totalNotes: 0,
    totalPrayers: 0,
    totalDays: 0,
    streak: 0,
    lastActive: new Date().toISOString(),
    firstActive: new Date().toISOString()
  }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const {
    user: authUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithApple,
    updateProfile,
    initialize
  } = useAuthStore();

  const { theme, setTheme } = usePreferencesStore();
  const { analytics, addDhikr, addPrayer, setAnalytics } = useProgressStore();

  const [isInitializing, setIsInitializing] = useState(true);

  // Initialisation unique au montage
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        await initialize();
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [initialize]);

  // ✅ Pont de compatibilité pour updateUser
  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    updateProfile(updates);
    if (updates.theme) setTheme(updates.theme as any);
    if (updates.analytics) setAnalytics(updates.analytics);
  }, [updateProfile, setTheme, setAnalytics]);

  // ✅ Pont de compatibilité pour les compteurs
  const incrementUserDhikr = useCallback((count: number = 1) => {
    addDhikr(count);
  }, [addDhikr]);

  const incrementUserPrayer = useCallback((count: number = 1) => {
    addPrayer(count);
  }, [addPrayer]);

  // Fusionner l'utilisateur auth avec les préférences et analytics du store
  const user = useMemo(() => {
    const base = authUser || defaultUser;
    return {
      ...base,
      theme: base.theme || theme,
      analytics: base.analytics || analytics
    } as UserProfile;
  }, [authUser, theme, analytics]);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading: isLoading || isInitializing,
    updateUser,
    incrementUserDhikr,
    incrementUserPrayer,
    login,
    loginWithGoogle,
    loginWithApple,
    register,
    logout
  }), [
    user,
    isAuthenticated,
    isLoading,
    isInitializing,
    updateUser,
    incrementUserDhikr,
    incrementUserPrayer,
    login,
    loginWithGoogle,
    loginWithApple,
    register,
    logout
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    // Retourner un contexte par défaut au lieu de lancer une erreur
    // Cela permet aux composants UI d'être utilisés même en dehors du UserProvider
    return {
      user: defaultUser,
      isLoading: false,
      isAuthenticated: false,
      login: async () => { },
      register: async () => { },
      logout: async () => { },
      updateUser: () => { },
      loginWithGoogle: async () => { },
      loginWithApple: async () => { },
      incrementUserDhikr: async () => { },
      incrementUserPrayer: async () => { },
    };
  }
  return context;
}

