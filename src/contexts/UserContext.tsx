import React, { useEffect, useState, createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { signInWithSupabase, signUpWithSupabase, signOutWithSupabase, getCurrentUser, signInWithGoogle, isCurrentUserAdmin, supabase } from '@/services/supabase';
import { signInWithApple } from '@/services/appleAuth';
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
} from '@/services/userAnalytics';
import { isUserSpecial } from '@/services/userRoles';
import { logger } from '@/utils/logger';
import { InteractionManager } from 'react-native';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  isSpecial?: boolean; // Utilisateur avec rôle spécial (accès aux fonctionnalités exclusives)
  avatar?: string;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
  };
  gender?: 'male' | 'female' | 'other' | null;
  theme: 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy';
  emailVerified?: boolean;
  sabilaNurProgress?: {
    challengeId: string;
    currentDay: number;
    startDate: string;
    intention?: string;
    completedTasks: Array<{
      day: number;
      taskIndices: number[];
    }>;
    completed?: boolean;
    completedAt?: string;
  };
  analytics: {
    totalDhikr: number;
    totalNotes: number;
    totalPrayers: number;
    totalDays: number;
    streak: number;
    lastActive: string;
    firstActive?: string;
  };
}

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
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ OPTIMISÉ : Combiner les chargements en un seul useEffect
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const loadUser = async () => {
      try {
        // Timeout de sécurité : forcer la fin du chargement après 2 secondes max
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        }, 2000);

        // 1. Charger depuis secureStorage (données sensibles) et AsyncStorage (données non sensibles)
        try {
          // Charger les données sensibles depuis secureStorage
          const userId = await secureStorage.getItem('user_id');
          const userEmail = await secureStorage.getItem('user_email');
          
          // Charger les données non sensibles depuis AsyncStorage
          const saved = await storage.getItem('ayna_user_preferences');
          
          // ✅ IMPORTANT (iOS/prod): SecureStore peut survivre à une réinstall/update alors que AsyncStorage est vidé.
          // Cela crée un état "connecté" dans UserContext alors que Supabase n'a plus de session → casse AYNA/Edge Functions.
          // On refuse donc de considérer l'utilisateur comme authentifié si Supabase n'a pas de session active.
          let validatedUserId = userId || undefined;
          let validatedUserEmail = userEmail || '';
          if (validatedUserId && APP_CONFIG.useSupabase && supabase) {
            try {
              if (!supabase) return;
              const { data: sessionData } = await supabase.auth.getSession();
              const session = sessionData?.session || null;
              if (!session || session.user.id !== validatedUserId) {
                logger.warn('[UserContext] Stored user_id but no matching Supabase session. Clearing local auth markers.');
                await secureStorage.clear();
                validatedUserId = undefined;
                validatedUserEmail = '';
              }
            } catch {
              // En cas d'erreur, on préfère éviter un faux état connecté
              await secureStorage.clear();
              validatedUserId = undefined;
              validatedUserEmail = '';
            }
          }

          if (isMounted && (validatedUserId || saved)) {
            try {
              const preferences = saved ? JSON.parse(saved) : {};
              
              // Construire l'objet utilisateur avec données sensibles + non sensibles
              const parsed: UserProfile = {
                id: validatedUserId,
                email: validatedUserEmail,
                name: preferences.name || '',
                theme: preferences.theme || 'default',
                analytics: preferences.analytics || defaultUser.analytics,
                avatar: preferences.avatar,
                gender: preferences.gender,
                location: preferences.location,
                isAdmin: preferences.isAdmin || false,
                isSpecial: preferences.isSpecial || false,
                emailVerified: preferences.emailVerified || false,
              };
              
              setUser(parsed);
              setIsLoading(false);
            } catch (parseError) {
              // Erreur silencieuse en production
            }
          }
        } catch (error) {
          // Erreur silencieuse en production
        }

        // 2. Charger depuis Supabase en arrière-plan (différé)
        if (APP_CONFIG.useSupabase && supabase) {
          InteractionManager.runAfterInteractions(async () => {
            if (!isMounted) return;
            
            try {
              const currentUser = await getCurrentUser();
              if (!isMounted || !currentUser) return;
              
              const userData = currentUser.user_metadata || {};
              // ✅ SÉCURISÉ : Vérification admin uniquement via fonction RPC côté serveur
              const adminStatus = await isCurrentUserAdmin();
              
              // Mettre à jour l'état de vérification d'email
              const emailVerified = currentUser.email_confirmed_at !== null;
              
              // Charger TOUTES les données depuis la table profiles (pas seulement analytics)
              let analytics = {
                totalDhikr: 0,
                totalNotes: 0,
                totalPrayers: 0,
                totalDays: 0,
                streak: 0,
                lastActive: new Date().toISOString(),
                firstActive: new Date().toISOString()
              };
              
              let profileAvatar: string | undefined = undefined;
              let profileTheme: 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy' = 'default';
              let profileGender: 'male' | 'female' | 'other' | null = null;
              let profileLocation: { latitude: number; longitude: number; city: string } | undefined = undefined;
              
              try {
                if (!supabase) return;
                // Charger TOUTES les données du profil depuis la table profiles
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('analytics, avatar, avatar_url, theme, gender, location, challenge_40_days')
                  .eq('id', currentUser.id)
                  .single();
                
                if (!profileError && profileData) {
                  // Analytics
                  if (profileData.analytics) {
                    analytics = {
                      totalDhikr: profileData.analytics.totalDhikr || 0,
                      totalNotes: profileData.analytics.totalNotes || 0,
                      totalPrayers: profileData.analytics.totalPrayers || 0,
                      totalDays: profileData.analytics.totalDays || 0,
                      streak: profileData.analytics.streak || 0,
                      lastActive: profileData.analytics.lastActive || new Date().toISOString(),
                      firstActive: profileData.analytics.firstActive || profileData.analytics.lastActive || new Date().toISOString()
                    };
                  }
                  
                  // Avatar depuis profiles (priorité sur user_metadata)
                  profileAvatar = profileData.avatar_url || profileData.avatar || undefined;
                  
                  // Theme depuis profiles
                  if (profileData.theme && ['default', 'ocean', 'sunset', 'forest', 'royal', 'galaxy'].includes(profileData.theme)) {
                    profileTheme = profileData.theme as 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy';
                  }
                  
                  // Gender depuis profiles
                  if (profileData.gender && ['male', 'female', 'other'].includes(profileData.gender)) {
                    profileGender = profileData.gender as 'male' | 'female' | 'other';
                  }
                  
                  // Location depuis profiles
                  if (profileData.location && typeof profileData.location === 'object') {
                    const loc = profileData.location as any;
                    if (loc.latitude && loc.longitude) {
                      profileLocation = {
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        city: loc.city || ''
                      };
                    }
                  }
                  
                }
              } catch (e) {
                // Erreur silencieuse en production
              }
              
              // Charger la bannière depuis user_metadata (banner_url)
              // La bannière est gérée par profileAdvanced.ts et stockée dans user_metadata
              const bannerUrl = userData.banner_url || undefined;
              
              // Vérifier si l'utilisateur a le rôle spécial
              let isSpecialUser = false;
              try {
                isSpecialUser = await isUserSpecial(currentUser.id);
              } catch (e) {
                // Erreur silencieuse en production
              }
              
              if (!isMounted) return;
              
              // Mettre à jour l'utilisateur en une seule fois
              setUser(prev => {
                // Déterminer l'avatar final (priorité : profiles > user_metadata > prev)
                const finalAvatar = profileAvatar || 
                                   (userData.avatar_id ? userData.avatar_id : (userData.avatar_url || userData.picture)) || 
                                   prev.avatar;
                
                // Déterminer le theme final (priorité : profiles > user_metadata > prev)
                const finalTheme = profileTheme !== 'default' ? profileTheme : 
                                  (userData.theme && ['default', 'ocean', 'sunset', 'forest', 'royal', 'galaxy'].includes(userData.theme) 
                                    ? userData.theme as 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy'
                                    : prev.theme);
                
                // Déterminer le gender final (priorité : profiles > user_metadata > prev)
                const finalGender = profileGender || userData.gender || prev.gender;
                
                // Déterminer la location finale (priorité : profiles > prev)
                const finalLocation = profileLocation || prev.location;
                
                return {
                  ...prev,
                  id: currentUser.id,
                  name: userData.name || prev.name,
                  email: currentUser.email || prev.email,
                  isAdmin: adminStatus,
                  isSpecial: isSpecialUser || adminStatus, // Les admins ont automatiquement accès aux fonctionnalités spéciales
                  avatar: finalAvatar,
                  gender: finalGender,
                  theme: finalTheme,
                  location: finalLocation,
                  emailVerified: emailVerified,
                  analytics: analytics,
                } as UserProfile;
              });

              // Sauvegarder en local (séparer données sensibles et non sensibles)
              if (isMounted) {
                const userId = currentUser.id;
                const userEmail = currentUser.email || user.email;
                const userName = userData.name || user.name;
                
                // ✅ SÉCURISÉ : Données sensibles dans secureStorage
                if (userId) {
                  await secureStorage.setItem('user_id', userId).catch(() => {});
                }
                if (userEmail) {
                  await secureStorage.setItem('user_email', userEmail).catch(() => {});
                }
                
                // ✅ Données non sensibles dans AsyncStorage
                const preferences = {
                  name: userName,
                  theme: profileTheme !== 'default' ? profileTheme : (userData.theme || user.theme),
                  avatar: profileAvatar || (userData.avatar_id ? userData.avatar_id : (userData.avatar_url || userData.picture)) || user.avatar,
                  gender: profileGender || userData.gender || user.gender,
                  location: profileLocation || user.location,
                  emailVerified: emailVerified,
                  analytics: analytics,
                  isAdmin: adminStatus,
                  isSpecial: isSpecialUser || adminStatus,
                };
                await storage.setItem('ayna_user_preferences', JSON.stringify(preferences)).catch(() => {});
              }
            } catch (e) {
              // Erreur silencieuse en production
            }
          });
        }
      } catch (error) {
        // Erreur silencieuse en production
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
  }, []); // ✅ Un seul useEffect au lieu de 3

  // Recalculer le streak au démarrage et mettre à jour lastActive
  useEffect(() => {
    if (user?.id && user.analytics?.lastActive) {
      // Mettre à jour lastActive et totalDays
      Promise.all([
        updateLastActive(user.id, user.analytics),
        updateTotalDays(user.id, user.analytics)
      ]).then(([analyticsWithLastActive, analyticsWithDays]) => {
        const analytics = {
          ...analyticsWithLastActive,
          totalDays: analyticsWithDays.totalDays,
          firstActive: analyticsWithDays.firstActive || analyticsWithLastActive.firstActive
        };
        setUser(prev => {
          if (prev.id === user.id) {
            const updated = {
              ...prev,
              analytics
            } as UserProfile;
            if (prev.id) {
              syncAnalyticsToSupabase(prev.id, analytics).catch(() => {});
            }
            return updated;
          }
          return prev;
        });
      }).catch(() => {});
    }
  }, [user?.id]); // Seulement au chargement initial

  // Vérifier le rôle spécial de l'utilisateur
  useEffect(() => {
    if (user?.id && !user.isSpecial && !user.isAdmin) {
      // Vérifier seulement si on n'a pas déjà le statut spécial ou admin
      isUserSpecial(user.id).then(isSpecial => {
        setUser(prev => {
          if (prev.id === user.id && prev.isSpecial !== isSpecial) {
            return {
              ...prev,
              isSpecial: isSpecial
            } as UserProfile;
          }
          return prev;
        });
      }).catch(() => {
        // Erreur silencieuse en production
      });
    }
  }, [user?.id, user?.isAdmin]);

  // Sauvegarder dans secureStorage (données sensibles) et AsyncStorage (données non sensibles) quand l'utilisateur change (debounced)
  // Ne pas sauvegarder immédiatement pour éviter les re-renders en cascade
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      // ✅ SÉCURISÉ : Données sensibles dans secureStorage
      if (user.id) {
        secureStorage.setItem('user_id', user.id).catch(() => {});
      }
      if (user.email) {
        secureStorage.setItem('user_email', user.email).catch(() => {});
      }
      
      // ✅ Données non sensibles dans AsyncStorage
      const preferences = {
        name: user.name,
        theme: user.theme,
        avatar: user.avatar,
        gender: user.gender,
        location: user.location,
        emailVerified: user.emailVerified,
        analytics: user.analytics,
        isAdmin: user.isAdmin,
        isSpecial: user.isSpecial,
      };
      storage.setItem('ayna_user_preferences', JSON.stringify(preferences)).catch(() => {
        // Erreur silencieuse en production
      });
      saveTimerRef.current = null;
    }, 500); // Debounce de 500ms
    
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [user]);

  // Debounced remote save (utilisé uniquement pour les mises à jour spécifiques)
  const remoteSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRemoteSave = useCallback((nextUser: UserProfile) => {
    if (remoteSaveTimerRef.current) {
      clearTimeout(remoteSaveTimerRef.current);
    }
    remoteSaveTimerRef.current = setTimeout(() => {
      try {
      } catch (e) {
        // Erreur silencieuse en production
      }
      remoteSaveTimerRef.current = null;
    }, 1000);
  }, []);

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => {
      const next = {
        ...prev,
        ...updates
      } as UserProfile;
      
      // Synchroniser avec Supabase si configuré
      if (APP_CONFIG.useSupabase && supabase && next.id) {
        // Synchroniser l'avatar
        if (updates.avatar !== undefined) {
        // Si c'est un avatar_id (format: 'male-1', 'female-1', etc.), sauvegarder comme avatar_id
        // Sinon, c'est une URL de photo, sauvegarder comme avatar_url
        const isAvatarId = updates.avatar && !updates.avatar.startsWith('http') && !updates.avatar.startsWith('/') && !updates.avatar.includes('/storage/');
          
          const avatarUpdate = isAvatarId 
            ? { avatar_id: updates.avatar, avatar_url: null }
            : { avatar_url: updates.avatar || null, avatar_id: updates.avatar ? null : undefined };
          
          // Mettre à jour user_metadata
          Promise.resolve(supabase.auth.updateUser({
            data: avatarUpdate
          })).then(() => {
            // Synchroniser aussi dans la table profiles
            const profileUpdate = isAvatarId 
              ? { avatar: updates.avatar, avatar_url: null }
              : { avatar_url: updates.avatar || null, avatar: null };
            
            if (supabase) {
            Promise.resolve(supabase.from('profiles')
              .update(profileUpdate)
              .eq('id', next.id)).then(() => { /* Succès silencieux */ })
              .catch(() => { /* Erreur silencieuse */ });
            }
        }).catch(() => {
          // Erreur silencieuse en production
        });
        }
        
        // Synchroniser le theme
        if (updates.theme !== undefined && supabase) {
          Promise.resolve(supabase.auth.updateUser({
            data: { theme: updates.theme }
          })).then(() => {
            // Synchroniser aussi dans la table profiles
            if (supabase) {
            Promise.resolve(supabase.from('profiles')
              .update({ theme: updates.theme })
              .eq('id', next.id)).then(() => { /* Succès silencieux */ })
              .catch(() => { /* Erreur silencieuse */ });
            }
          }).catch(() => { /* Erreur silencieuse en production */ });
        }
        
        // Synchroniser le gender
        if (updates.gender !== undefined && supabase) {
          Promise.resolve(supabase.auth.updateUser({
            data: { gender: updates.gender }
          })).then(() => {
            // Synchroniser aussi dans la table profiles
            if (supabase) {
            Promise.resolve(supabase.from('profiles')
              .update({ gender: updates.gender })
              .eq('id', next.id)).then(() => { /* Succès silencieux */ })
              .catch(() => { /* Erreur silencieuse */ });
            }
          }).catch(() => { /* Erreur silencieuse en production */ });
        }
        
        // Synchroniser le name
        if (updates.name !== undefined && supabase) {
          Promise.resolve(supabase.auth.updateUser({
            data: { name: updates.name }
          })).then(() => {
            // Synchroniser aussi dans la table profiles
            if (supabase) {
            Promise.resolve(supabase.from('profiles')
              .update({ name: updates.name })
              .eq('id', next.id)).then(() => { /* Succès silencieux */ })
              .catch(() => { /* Erreur silencieuse */ });
            }
          }).catch(() => { /* Erreur silencieuse en production */ });
        }
        
        // Synchroniser la location
        if (updates.location !== undefined && supabase) {
          Promise.resolve(supabase.from('profiles')
            .update({ location: updates.location || null })
            .eq('id', next.id)).then(() => { /* Succès silencieux */ })
            .catch(() => { /* Erreur silencieuse */ });
        }
        
      }
      
      scheduleRemoteSave(next);
      return next;
    });
  }, [scheduleRemoteSave]);


  // Fonction pour incrémenter les dhikr depuis n'importe où (sessions, cercle, etc.)
  const incrementUserDhikr = useCallback((count: number = 1) => {
    setUser(prev => {
      if (!prev.id) return prev;
      
      const now = new Date().toISOString();
      
      // Mettre à jour les analytics de manière asynchrone
      incrementDhikr(prev.id, prev.analytics, count).then(analytics => {
        setUser(current => {
          if (current.id === prev.id) {
            const updated = {
              ...current,
              analytics
            } as UserProfile;
            scheduleRemoteSave(updated);
            if (current.id) {
              syncAnalyticsToSupabase(current.id, analytics).catch(() => {});
            }
            return updated;
          }
          return current;
        });
      }).catch(() => {});
      
      return {
        ...prev,
        analytics: {
          ...prev.analytics,
          totalDhikr: prev.analytics.totalDhikr + count,
          lastActive: now
        }
      } as UserProfile;
    });
  }, [scheduleRemoteSave]);

  // Fonction pour incrémenter les prières depuis n'importe où
  const incrementUserPrayer = useCallback((count: number = 1) => {
    setUser(prev => {
      if (!prev.id) return prev;
      
      // Mettre à jour les analytics de manière asynchrone
      incrementPrayer(prev.id, prev.analytics, count).then(analytics => {
        setUser(current => {
          if (current.id === prev.id) {
            const updated = {
              ...current,
              analytics
            } as UserProfile;
            scheduleRemoteSave(updated);
            if (current.id) {
              syncAnalyticsToSupabase(current.id, analytics).catch(() => {});
            }
            return updated;
          }
          return current;
        });
      }).catch(() => {});
      
      return {
        ...prev,
        analytics: {
          ...prev.analytics,
          totalPrayers: (prev.analytics.totalPrayers || 0) + count,
        },
      } as UserProfile;
    });
  }, [scheduleRemoteSave]);


  const login = useCallback(async (email: string, password: string): Promise<void> => {
    if (!APP_CONFIG.useSupabase || !supabase) {
      throw new Error('Supabase n\'est pas configuré');
    }

    try {
      logger.info('UserContext', '[LOGIN] Starting login process...');
      const result = await signInWithSupabase(email, password);
      
      // LOGS DEBUG: Vérifier la session après connexion
      if (result?.session) {
        logger.info('UserContext', '[LOGIN] ✅ Session created:', {
          userId: result.session.user.id,
          hasToken: !!result.session.access_token,
          tokenLength: result.session.access_token?.length || 0,
        });
      } else {
        logger.warn('[UserContext] [LOGIN] ⚠️ No session in signIn response');
      }
      
      if (!result) {
        throw new Error('Aucune réponse de connexion');
      }
      
      if (!result.user) {
        throw new Error('Aucun utilisateur retourné');
      }
      
      // CRITICAL: Vérifier que la session est bien stockée
      // Si result.session est null, essayer de récupérer la session depuis Supabase
      let session = result.session;
      if (!session && supabase) {
        logger.warn('[UserContext] [LOGIN] No session in response, trying to get session...');
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session || null;
        
        if (session) {
          logger.info('UserContext', '[LOGIN] ✅ Session retrieved from Supabase:', {
            userId: session.user.id,
            hasToken: !!session.access_token,
          });
        } else {
          logger.error('[UserContext] [LOGIN] ❌ No session available after login');
          // Ne pas bloquer la connexion, mais logger l'erreur
        }
      }
      
      const userData = result.user.user_metadata || {};
      // ✅ SÉCURISÉ : Vérification admin uniquement via fonction RPC côté serveur
      const adminStatus = await isCurrentUserAdmin();
      const emailVerified = result.user.email_confirmed_at !== null;
      
      const nextUser = {
        id: result.user.id,
        name: userData.name || email.split('@')[0],
        email: result.user.email || email,
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
      
      setUser(nextUser);
      scheduleRemoteSave(nextUser);
      
      // LOGS DEBUG: Vérifier la session après mise à jour de l'utilisateur
      if (session) {
        logger.info('UserContext', '[LOGIN] ✅ Login successful with session');
      } else {
        logger.warn('[UserContext] [LOGIN] ⚠️ Login successful but no session available');
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.error?.message || 'Échec de la connexion';
      throw new Error(errorMessage);
    }
  }, [scheduleRemoteSave]);

  const register = useCallback(async (name: string, email: string, password: string, gender?: string, avatarId?: string) => {
    logger.log('[UserContext] ===== DÉBUT REGISTER =====');
    logger.log('[UserContext] Registration attempt'); // Ne jamais logger name, email directement
    logger.log('[UserContext] Gender:', gender);
    logger.log('[UserContext] useSupabase:', APP_CONFIG.useSupabase);
    logger.log('[UserContext] supabase:', !!supabase);
    
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        logger.log('[UserContext] Appel signUpWithSupabase...');
        // signUpWithSupabase retourne directement data, pas { data, error }
        const data = await signUpWithSupabase(email, password, name, gender, avatarId);
        logger.log('[UserContext] signUpWithSupabase terminé');
        logger.log('[UserContext] Data reçue:', data ? {
          hasUser: !!data.user,
          hasSession: !!data.session,
          userId: data.user?.id,
          userEmail: data.user?.email,
          emailConfirmed: !!data.user?.email_confirmed_at,
        } : null);
        
        // Si l'utilisateur est créé mais n'a pas de session (email non vérifié),
        // on ne définit pas encore l'utilisateur dans le contexte
        // L'utilisateur sera défini après vérification de l'email
        if (data?.user && !data?.session) {
          logger.log('[UserContext] ✅ Utilisateur créé mais email non vérifié, pas de session');
          logger.log('[UserContext] L\'utilisateur sera redirigé vers l\'écran VerifyEmail');
          // Ne pas définir l'utilisateur dans le contexte pour l'instant
          // L'écran VerifyEmail sera affiché
          return;
        }
        
        if (!data?.user) {
          logger.warn('[UserContext] ⚠️ Aucun utilisateur créé après signUp');
          throw new Error('L\'inscription a échoué. Aucun utilisateur n\'a été créé.');
        }
        logger.log('[UserContext] SignUp terminé');
        logger.log('[UserContext] Data:', data);
        logger.log('[UserContext] Data type:', typeof data);
        logger.log('[UserContext] Data?.user:', data?.user);
        logger.log('[UserContext] Data?.session:', data?.session);
        
        // Vérifier que data existe
        if (!data) {
          logger.warn('[UserContext] Data est null/undefined après signUp');
          // Ne pas throw, continuer avec data = undefined
          // Le code suivant gérera le cas où data est undefined
        }
        
        if (data?.user) {
          // Vérifier la session actuelle
          let session = data.session;
          if (!session && supabase) {
            // Essayer de récupérer la session actuelle
            const { data: sessionData } = await supabase.auth.getSession();
            session = sessionData?.session || null;
          }
          
          // Si on n'a toujours pas de session, essayer de se connecter
          if (!session) {
            try {
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              if (!signInError && signInData?.session) {
                session = signInData.session;
              }
            } catch (signInErr) {
              // Ignorer l'erreur de connexion, on utilisera les données d'inscription
            }
          }
          
          // Attendre un peu pour que le profil soit créé dans la base de données
          // par le trigger handle_new_user
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Charger l'utilisateur depuis Supabase pour s'assurer qu'il est bien connecté
          // Réessayer plusieurs fois si nécessaire
          let currentUser = await getCurrentUser();
          let retries = 0;
          const maxRetries = 3;
          
          while (!currentUser && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
            currentUser = await getCurrentUser();
            retries++;
          }
          
          if (currentUser) {
            const userData = currentUser.user_metadata || {};
            // ✅ SÉCURISÉ : Vérification admin uniquement via fonction RPC côté serveur
            const adminStatus = await isCurrentUserAdmin();
            // IMPORTANT : Lors de l'inscription, l'email n'est PAS vérifié
            // Même si Supabase définit email_confirmed_at automatiquement quand la vérification est désactivée,
            // on force emailVerified à false lors de l'inscription car l'utilisateur n'a pas encore cliqué sur le lien
            // dans l'email de vérification envoyé via Brevo
            const emailConfirmedAt = currentUser.email_confirmed_at;
            // Si email_confirmed_at existe mais qu'on est dans le flux d'inscription,
            // c'est probablement parce que Supabase a désactivé la vérification d'email
            // Dans ce cas, on considère que l'email n'est PAS vérifié car l'utilisateur n'a pas cliqué sur le lien
            const emailVerified = false; // Toujours false lors de l'inscription, même si email_confirmed_at est défini
            
            logger.log('[UserContext] Email verification status lors de l\'inscription:', {
              email_confirmed_at: emailConfirmedAt,
              emailVerified: emailVerified,
              note: 'Forcé à false lors de l\'inscription car l\'utilisateur n\'a pas encore cliqué sur le lien de vérification',
            });
            
            const nextUser = {
              id: currentUser.id,
              name: userData.name || name || email.split('@')[0],
              email: currentUser.email || email,
              isAdmin: adminStatus,
              avatar: userData.avatar_id ? userData.avatar_id : (userData.avatar_url || userData.picture || undefined),
              gender: gender || userData.gender || undefined,
              emailVerified: emailVerified, // Toujours false lors de l'inscription
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
            
            // Vérifier que la session est bien établie après la mise à jour
            if (supabase) {
            const { data: finalSession } = await supabase.auth.getSession();
            if (!finalSession?.session) {
              // Si pas de session, essayer une dernière fois de se connecter
              try {
                await supabase.auth.signInWithPassword({ email, password });
              } catch (finalErr) {
                // Ignorer l'erreur, on continue quand même
                }
              }
            }
          } else {
            // Fallback si getCurrentUser ne retourne toujours pas l'utilisateur
            // Utiliser les données de l'inscription
            const userData = data.user.user_metadata || {};
            // ✅ SÉCURISÉ : Vérification admin uniquement via fonction RPC côté serveur
            const adminStatus = await isCurrentUserAdmin();
            const emailVerified = data.user.email_confirmed_at !== null;
            
            const nextUser = {
              id: data.user.id,
              name: userData.name || name || email.split('@')[0],
              email: data.user.email || email,
              isAdmin: adminStatus,
              avatar: userData.avatar_id ? userData.avatar_id : (userData.avatar_url || userData.picture || undefined),
              gender: gender || null,
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
          }
        }
      } catch (err: any) {
        throw new Error(err.message || 'Échec de l\'inscription');
      }
    } else {
      throw new Error('Supabase n\'est pas configuré');
    }
  }, [scheduleRemoteSave]);

  const loginWithGoogle = useCallback(async () => {
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        await signInWithGoogle();
      } catch (err: any) {
        throw new Error(err.message || 'Échec de la connexion avec Google');
      }
    } else {
      throw new Error('Connexion Google uniquement disponible avec Supabase');
    }
  }, []);

  const loginWithApple = useCallback(async () => {
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
  }, []);

  const logout = useCallback(async () => {
    if (APP_CONFIG.useSupabase && supabase) {
      await signOutWithSupabase().catch(() => {});
      setUser(defaultUser);
      // ✅ SÉCURISÉ : Nettoyer secureStorage (données sensibles)
      await secureStorage.clear();
      // ✅ Nettoyer AsyncStorage (données non sensibles)
      await storage.removeItem('ayna_user_preferences');
      // Nettoyer aussi l'ancienne clé pour migration
      await storage.removeItem('ayna_user');
      // Vider le cache du rôle spécial
      const { clearRoleCache } = await import('@/services/userRoles');
      await clearRoleCache();
    }
  }, []);

  // Écouter les changements de session Supabase (pour OAuth callback et vérification email)
  useEffect(() => {
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        if (!supabase) return;
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          try {
            if (event === 'SIGNED_IN' && session?.user) {
              const userData = session.user.user_metadata || {};
              // ✅ SÉCURISÉ : Vérification admin uniquement via fonction RPC côté serveur
              const adminStatus = await isCurrentUserAdmin();
              
              // Vérifier si l'utilisateur a le rôle spécial
              let isSpecialUser = false;
              try {
                isSpecialUser = await isUserSpecial(session.user.id);
              } catch (e) {
                // Erreur silencieuse en production
              }
              
              // Mettre à jour l'état de vérification d'email
              const emailVerified = session.user.email_confirmed_at !== null;
              
              setUser(prev => ({
                ...prev,
                id: session.user.id,
                name: userData.name || userData.full_name || prev.name,
                email: session.user.email || prev.email,
                isAdmin: adminStatus,
                isSpecial: isSpecialUser || adminStatus, // Les admins ont automatiquement accès aux fonctionnalités spéciales
                avatar: userData.avatar_id ? userData.avatar_id : (userData.avatar_url || userData.picture || prev.avatar),
                emailVerified: emailVerified,
              } as UserProfile));
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              // Mettre à jour l'état de vérification d'email lors du refresh du token
              // (utile si l'utilisateur vérifie son email dans un autre onglet)
              const emailVerified = session.user.email_confirmed_at !== null;
              setUser(prev => {
                if (prev.id === session.user.id) {
                  return {
                    ...prev,
                    emailVerified: emailVerified,
                  } as UserProfile;
                }
                return prev;
              });
            } else if (event === 'SIGNED_OUT') {
              setUser(defaultUser);
              // ✅ SÉCURISÉ : Utiliser secureStorage pour les données sensibles
              await secureStorage.clear();
              await storage.removeItem('ayna_user');
              // Vider le cache du rôle spécial
              const { clearRoleCache } = await import('@/services/userRoles');
              await clearRoleCache();
            }
          } catch (error) {
            // Erreur silencieuse en production
          }
        });

        return () => {
          try {
            subscription.unsubscribe();
          } catch (error) {
            // Erreur silencieuse en production
          }
        };
      } catch (error) {
        // Erreur silencieuse en production
      }
    }
  }, []);

  const isAuthenticated = useMemo(() => !!user.id, [user.id]);

  // Mémoriser la valeur du context pour éviter les re-renders inutiles
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
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
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      updateUser: () => {},
      loginWithGoogle: async () => {},
      loginWithApple: async () => {},
      incrementUserDhikr: () => {},
      incrementUserPrayer: () => {},
    };
  }
  return context;
}

