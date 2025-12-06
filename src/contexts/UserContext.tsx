import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { signInWithSupabase, signUpWithSupabase, signOutWithSupabase, getCurrentUser, signInWithGoogle, isCurrentUserAdmin, supabase } from '@/services/supabase';
import { signInWithApple } from '@/services/appleAuth';
import { APP_CONFIG } from '@/config';
import { storage } from '@/utils/storage';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  avatar?: string;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
  };
  gender?: 'male' | 'female' | 'other' | null;
  theme: 'default' | 'ocean' | 'sunset' | 'forest' | 'royal';
  emailVerified?: boolean;
  challenge40Days?: {
    currentDay: number;
    startDate: string;
    journalEntries: Array<{
      day: number;
      entry: string;
      analysis?: string;
    }>;
    dhikrCounts: Array<{
      day: number;
      count: number;
      dhikr: string;
    }>;
    selectedChallengeId?: string;
    intention?: string;
    completedTasks?: Array<{
      day: number;
      taskIndices: number[];
    }>;
    currentDhikrCounts?: Array<{
      day: number;
      count: number;
    }>;
  };
  analytics: {
    totalDhikr: number;
    totalNotes: number;
    streak: number;
    lastActive: string;
  };
}

interface UserContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateChallenge: (day: number, data: any) => void;
  addJournalEntry: (day: number, entry: string, analysis?: string) => void;
  addDhikrCount: (day: number, count: number, dhikr: string) => void;
  saveCompletedTasks: (day: number, taskIndices: number[]) => void;
  saveCurrentDhikrCount: (day: number, count: number) => void;
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
    streak: 0,
    lastActive: new Date().toISOString()
  }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [isLoading, setIsLoading] = useState(true);

  // Initialiser l'état avec AsyncStorage
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const loadUser = async () => {
      try {
        // Timeout de sécurité : forcer la fin du chargement après 2 secondes max
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Timeout lors du chargement AsyncStorage - forcer la fin');
            setIsLoading(false);
          }
        }, 2000);

        const saved = await storage.getItem('ayna_user');
        if (isMounted && saved) {
          try {
            const parsed = JSON.parse(saved);
            setUser(parsed);
          } catch (parseError) {
            console.warn('Erreur lors du parsing des données utilisateur:', parseError);
          }
        }
      } catch (error) {
        console.warn('Erreur lors du chargement de l\'utilisateur:', error);
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    };
    
    loadUser();
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Charger l'utilisateur depuis Supabase au démarrage
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    async function loadRemote() {
      try {
        // Timeout de sécurité pour Supabase : 5 secondes max
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Timeout Supabase - continuer sans attendre');
            mounted = false;
          }
        }, 5000);

        if (APP_CONFIG.useSupabase && supabase) {
          const currentUser = await getCurrentUser();
          if (!mounted) return;
          if (currentUser) {
            const userData = currentUser.user_metadata || {};
            const adminStatus = userData.is_admin === true || 
                               userData.original_email === 'admin' ||
                               currentUser.email === 'admin@admin.com' ||
                               currentUser.email === 'pro.ibrahima00@gmail.com';
            
            const emailVerified = currentUser.email_confirmed_at !== null;
            
            setUser(prev => ({
              ...prev,
              id: currentUser.id,
              name: userData.name || prev.name,
              email: currentUser.email || prev.email,
              isAdmin: adminStatus,
              avatar: userData.avatar_id ? userData.avatar_id : (userData.avatar_url || userData.picture || prev.avatar),
              gender: userData.gender || prev.gender,
              emailVerified: emailVerified,
            } as UserProfile));
          }
        }
      } catch (e) {
        console.warn('Erreur lors du chargement de l\'utilisateur distant:', e);
      } finally {
        clearTimeout(timeoutId);
        mounted = false;
      }
    }
    
    // Ne charger depuis Supabase que si le chargement initial est terminé
    // et seulement après un petit délai pour éviter les conflits
    const delay = setTimeout(() => {
      loadRemote();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(delay);
      mounted = false;
    };
  }, []);

  // Sauvegarder dans AsyncStorage quand l'utilisateur change
  useEffect(() => {
    const saveUser = async () => {
      try {
        await storage.setItem('ayna_user', JSON.stringify(user));
      } catch (error) {
        console.warn('Erreur lors de la sauvegarde de l\'utilisateur:', error);
      }
    };
    saveUser();
  }, [user]);

  // Debounced remote save
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scheduleRemoteSave = (nextUser: UserProfile) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      try {
        // Sauvegarder dans AsyncStorage
        storage.setItem('ayna_user', JSON.stringify(nextUser)).catch(console.warn);
        
        // Si Supabase est configuré, sauvegarder les données du challenge
        if (APP_CONFIG.useSupabase && supabase && nextUser.id && nextUser.challenge40Days) {
          // TODO: Implémenter saveChallengeData quand le service sera migré
          // saveChallengeData(nextUser.id, nextUser.challenge40Days).catch(console.warn);
        }
      } catch (e) {
        console.warn('Erreur lors de la sauvegarde distante:', e);
      }
      saveTimerRef.current = null;
    }, 1000);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => {
      const next = {
        ...prev,
        ...updates
      } as UserProfile;
      
      if (APP_CONFIG.useSupabase && supabase && updates.avatar !== undefined && next.id) {
        // Si c'est un avatar_id (format: 'male-1', 'female-1', etc.), sauvegarder comme avatar_id
        // Sinon, c'est une URL de photo, sauvegarder comme avatar_url
        const isAvatarId = updates.avatar && !updates.avatar.startsWith('http') && !updates.avatar.startsWith('/') && !updates.avatar.includes('/storage/');
        supabase.auth.updateUser({
          data: isAvatarId 
            ? { avatar_id: updates.avatar, avatar_url: null }
            : { avatar_url: updates.avatar || null, avatar_id: updates.avatar ? null : undefined }
        }).catch((err) => {
          console.warn('Erreur lors de la mise à jour de l\'avatar dans Supabase:', err);
        });
      }
      
      scheduleRemoteSave(next);
      return next;
    });
  };

  const updateChallenge = (day: number, data: any) => {
    setUser(prev => {
      const next = {
        ...prev,
        challenge40Days: {
          ...prev.challenge40Days,
          currentDay: day,
          ...data
        } as any
      };
      scheduleRemoteSave(next);
      return next;
    });
  };

  const addJournalEntry = (day: number, entry: string, analysis?: string) => {
    setUser(prev => {
      const entries = prev.challenge40Days?.journalEntries || [];
      const next = {
        ...prev,
        challenge40Days: {
          ...prev.challenge40Days,
          currentDay: day,
          startDate: prev.challenge40Days?.startDate || new Date().toISOString(),
          journalEntries: [...entries, { day, entry, analysis }],
          dhikrCounts: prev.challenge40Days?.dhikrCounts || []
        },
        analytics: {
          ...prev.analytics,
          totalNotes: prev.analytics.totalNotes + 1
        }
      } as UserProfile;
      scheduleRemoteSave(next);
      return next;
    });
  };

  const addDhikrCount = (day: number, count: number, dhikr: string) => {
    setUser(prev => {
      const counts = prev.challenge40Days?.dhikrCounts || [];
      const next = {
        ...prev,
        challenge40Days: {
          ...prev.challenge40Days,
          currentDay: day,
          startDate: prev.challenge40Days?.startDate || new Date().toISOString(),
          dhikrCounts: [...counts, { day, count, dhikr }],
          journalEntries: prev.challenge40Days?.journalEntries || []
        },
        analytics: {
          ...prev.analytics,
          totalDhikr: prev.analytics.totalDhikr + count
        }
      } as UserProfile;
      scheduleRemoteSave(next);
      return next;
    });
  };

  const saveCompletedTasks = (day: number, taskIndices: number[]) => {
    setUser(prev => {
      const completedTasks = prev.challenge40Days?.completedTasks || [];
      const filtered = completedTasks.filter(t => t.day !== day);
      const next = {
        ...prev,
        challenge40Days: {
          ...prev.challenge40Days,
          currentDay: prev.challenge40Days?.currentDay || day,
          startDate: prev.challenge40Days?.startDate || new Date().toISOString(),
          completedTasks: [...filtered, { day, taskIndices }],
          journalEntries: prev.challenge40Days?.journalEntries || [],
          dhikrCounts: prev.challenge40Days?.dhikrCounts || []
        }
      } as UserProfile;
      scheduleRemoteSave(next);
      return next;
    });
  };

  const saveCurrentDhikrCount = (day: number, count: number) => {
    setUser(prev => {
      const currentDhikrCounts = prev.challenge40Days?.currentDhikrCounts || [];
      const filtered = currentDhikrCounts.filter(c => c.day !== day);
      const next = {
        ...prev,
        challenge40Days: {
          ...prev.challenge40Days,
          currentDay: prev.challenge40Days?.currentDay || day,
          startDate: prev.challenge40Days?.startDate || new Date().toISOString(),
          currentDhikrCounts: [...filtered, { day, count }],
          journalEntries: prev.challenge40Days?.journalEntries || [],
          dhikrCounts: prev.challenge40Days?.dhikrCounts || []
        }
      } as UserProfile;
      scheduleRemoteSave(next);
      return next;
    });
  };

  const login = async (email: string, password: string): Promise<void> => {
    if (!APP_CONFIG.useSupabase || !supabase) {
      console.error('Supabase n\'est pas configuré');
      throw new Error('Supabase n\'est pas configuré');
    }

    try {
      console.log('Appel de signInWithSupabase...');
      const { data, error } = await signInWithSupabase(email, password);
      
      if (error) {
        // Permettre la connexion même si l'email n'est pas vérifié
        if (error.message?.includes('Email not confirmed') || error.message?.includes('email not confirmed')) {
          // Récupérer l'utilisateur même si l'email n'est pas vérifié
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            const userMetadata = userData.user.user_metadata || {};
            const adminStatus = userMetadata.is_admin === true || 
                               userMetadata.original_email === 'admin' ||
                               userData.user.email === 'admin@admin.com' ||
                               userData.user.email === 'pro.ibrahima00@gmail.com';
            const emailVerified = userData.user.email_confirmed_at !== null;
            
            const nextUser = {
              id: userData.user.id,
              name: userMetadata.name || email.split('@')[0],
              email: userData.user.email || email,
              isAdmin: adminStatus,
              avatar: userMetadata.avatar_id ? userMetadata.avatar_id : (userMetadata.avatar_url || userMetadata.picture || undefined),
              gender: userMetadata.gender || undefined,
              emailVerified: emailVerified,
              theme: 'default' as const,
              analytics: {
                totalDhikr: 0,
                totalNotes: 0,
                streak: 0,
                lastActive: new Date().toISOString()
              }
            } as UserProfile;
            
            setUser(nextUser);
            scheduleRemoteSave(nextUser);
            return; // Sortir sans erreur
          }
        }
        console.error('Erreur Supabase:', error);
        throw error;
      }
      
      if (!data?.user) {
        // Ne pas afficher d'erreur si la connexion a réussi mais qu'il y a juste un problème avec la récupération des données
        // L'authentification Supabase fonctionne déjà
        const errorMessage = 'Aucun utilisateur retourné';
        // Ne pas logger les erreurs liées à la table users si l'utilisateur est bien authentifié
        if (!errorMessage.includes('Aucun utilisateur retourné')) {
          console.error('Aucun utilisateur retourné par Supabase');
        }
        throw new Error(errorMessage);
      }
      
      console.log('Utilisateur connecté:', data.user.id);
      const userData = data.user.user_metadata || {};
      const adminStatus = userData.is_admin === true || 
                         userData.original_email === 'admin' ||
                         data.user.email === 'admin@admin.com' ||
                         data.user.email === 'pro.ibrahima00@gmail.com';
      const emailVerified = data.user.email_confirmed_at !== null;
      
      const nextUser = {
        id: data.user.id,
        name: userData.name || email.split('@')[0],
        email: data.user.email || email,
        isAdmin: adminStatus,
        avatar: userData.avatar_id ? userData.avatar_id : (userData.avatar_url || userData.picture || undefined),
        gender: userData.gender || undefined,
        emailVerified: emailVerified,
        theme: 'default' as const,
        analytics: {
          totalDhikr: 0,
          totalNotes: 0,
          streak: 0,
          lastActive: new Date().toISOString()
        }
      } as UserProfile;
      
      console.log('Mise à jour de l\'utilisateur:', nextUser.id);
      setUser(nextUser);
      scheduleRemoteSave(nextUser);
    } catch (err: any) {
      // Ne pas afficher d'erreur si la connexion a réussi mais qu'il y a juste un problème avec la récupération des données
      const errorMessage = err?.message || err?.error?.message || 'Échec de la connexion';
      // Ne pas logger les erreurs liées à la table users si l'utilisateur est bien authentifié
      if (!errorMessage.includes('Aucun utilisateur retourné') && !errorMessage.includes('utilisateur retourné')) {
        console.error('Erreur dans login:', err);
      }
      throw new Error(errorMessage);
    }
  };

  const register = async (name: string, email: string, password: string, gender?: string, avatarId?: string) => {
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        const { data, error } = await signUpWithSupabase(email, password, name, gender, avatarId);
        if (error) throw error;
        
        if (data?.user) {
          const userData = data.user.user_metadata || {};
          const adminStatus = userData.is_admin === true || 
                             userData.original_email === 'admin' ||
                             data.user.email === 'admin@admin.com' ||
                             data.user.email === 'pro.ibrahima00@gmail.com';
          const emailVerified = data.user.email_confirmed_at !== null;
          
          setUser(prev => {
            const next = {
              ...prev,
              id: data.user.id,
              name: userData.name || name || email.split('@')[0],
              email: data.user.email || email,
              isAdmin: adminStatus,
              gender: gender || null,
              emailVerified: emailVerified,
              avatar: userData.avatar_id ? userData.avatar_id : (userData.avatar_url || userData.picture || prev.avatar),
            } as UserProfile;
            scheduleRemoteSave(next);
            return next;
          });
        }
      } catch (err: any) {
        throw new Error(err.message || 'Échec de l\'inscription');
      }
    } else {
      throw new Error('Supabase n\'est pas configuré');
    }
  };

  const loginWithGoogle = async () => {
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        await signInWithGoogle();
      } catch (err: any) {
        throw new Error(err.message || 'Échec de la connexion avec Google');
      }
    } else {
      throw new Error('Connexion Google uniquement disponible avec Supabase');
    }
  };

  const loginWithApple = async () => {
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        const result = await signInWithApple();
        if (result) {
          // L'utilisateur sera mis à jour via onAuthStateChange
        }
      } catch (err: any) {
        if (err.code !== 'ERR_REQUEST_CANCELED') {
          throw new Error(err.message || 'Échec de la connexion avec Apple');
        }
      }
    } else {
      throw new Error('Connexion Apple uniquement disponible avec Supabase');
    }
  };

  const logout = async () => {
    if (APP_CONFIG.useSupabase && supabase) {
      await signOutWithSupabase().catch(console.error);
      setUser(defaultUser);
      await storage.removeItem('ayna_user');
    }
  };

  // Écouter les changements de session Supabase (pour OAuth callback)
  useEffect(() => {
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          try {
            if (event === 'SIGNED_IN' && session?.user) {
              const userData = session.user.user_metadata || {};
              const adminStatus = userData.is_admin === true || 
                                 userData.original_email === 'admin' ||
                                 session.user.email === 'admin@admin.com' ||
                                 session.user.email === 'pro.ibrahima00@gmail.com';
              setUser(prev => ({
                ...prev,
                id: session.user.id,
                name: userData.name || userData.full_name || prev.name,
                email: session.user.email || prev.email,
                isAdmin: adminStatus,
                avatar: userData.avatar_id ? userData.avatar_id : (userData.avatar_url || userData.picture || prev.avatar),
              } as UserProfile));
            } else if (event === 'SIGNED_OUT') {
              setUser(defaultUser);
              await storage.removeItem('ayna_user');
            }
          } catch (error) {
            console.error('Erreur lors du traitement de l\'événement auth:', error);
          }
        });

        return () => {
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.error('Erreur lors de la désinscription:', error);
          }
        };
      } catch (error) {
        console.error('Erreur lors de la configuration de l\'écouteur auth:', error);
      }
    }
  }, []);

  const isAuthenticated = !!user.id;

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      updateUser,
      updateChallenge,
      addJournalEntry,
      addDhikrCount,
      saveCompletedTasks,
      saveCurrentDhikrCount,
      login,
      loginWithGoogle,
      loginWithApple,
      register,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

