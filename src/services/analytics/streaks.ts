/**
 * Service de gestion des streaks (sÃ©ries)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/auth/supabase';

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;
}

const STREAK_KEY = '@ayna_streak';

export async function updateStreak(userId: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stored = await AsyncStorage.getItem(`${STREAK_KEY}_${userId}`);
    
    let streakData: StreakData = stored
      ? JSON.parse(stored)
      : { current: 0, longest: 0, lastActiveDate: '' };
    
    const lastDate = streakData.lastActiveDate.split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastDate === today) {
      // DÃ©jÃ  actif aujourd'hui
      return streakData.current;
    } else if (lastDate === yesterdayStr) {
      // Continue la sÃ©rie
      streakData.current += 1;
    } else {
      // Nouvelle sÃ©rie
      streakData.current = 1;
    }
    
    streakData.longest = Math.max(streakData.longest, streakData.current);
    streakData.lastActiveDate = today;
    
    await AsyncStorage.setItem(`${STREAK_KEY}_${userId}`, JSON.stringify(streakData));
    
    // Synchroniser avec Supabase
    if (supabase) {
      await supabase.from('profiles').update({
        analytics: {
          streak: streakData.current,
          longestStreak: streakData.longest,
        },
      }).eq('id', userId);
    }
    
    return streakData.current;
  } catch {
    return 0;
  }
}

export async function getStreak(userId: string): Promise<StreakData> {
  try {
    const stored = await AsyncStorage.getItem(`${STREAK_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return { current: 0, longest: 0, lastActiveDate: '' };
  } catch {
    return { current: 0, longest: 0, lastActiveDate: '' };
  }
}









