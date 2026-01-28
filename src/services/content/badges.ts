/**
 * Service de gestion des badges et rÃ©compenses
 */

import { supabase } from '@/services/auth/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'dhikr' | 'journal' | 'streak' | 'challenge' | 'special';
  requirement: number;
  unlockedAt?: string;
}

export const BADGES: Badge[] = [
  // Badges Dhikr
  { id: 'dhikr-10', name: 'Premier pas', description: '10 dhikr complÃ©tÃ©s', icon: 'ðŸŒŸ', color: '#FFD700', category: 'dhikr', requirement: 10 },
  { id: 'dhikr-100', name: 'DÃ©votion', description: '100 dhikr complÃ©tÃ©s', icon: 'âœ¨', color: '#FFA500', category: 'dhikr', requirement: 100 },
  { id: 'dhikr-1000', name: 'MaÃ®tre du Dhikr', description: '1000 dhikr complÃ©tÃ©s', icon: 'ðŸ’«', color: '#FF6347', category: 'dhikr', requirement: 1000 },
  
  // Badges Streak
  { id: 'streak-7', name: 'Une semaine', description: '7 jours consÃ©cutifs', icon: 'ðŸ”¥', color: '#FF4500', category: 'streak', requirement: 7 },
  { id: 'streak-30', name: 'Mois complet', description: '30 jours consÃ©cutifs', icon: 'ðŸ”¥ðŸ”¥', color: '#FF1493', category: 'streak', requirement: 30 },
  { id: 'streak-100', name: 'LÃ©gende', description: '100 jours consÃ©cutifs', icon: 'ðŸ”¥ðŸ”¥ðŸ”¥', color: '#DC143C', category: 'streak', requirement: 100 },
  
  // Badges Journal
  { id: 'journal-10', name: 'Scribe', description: '10 entrÃ©es de journal', icon: 'ðŸ“', color: '#4B0082', category: 'journal', requirement: 10 },
  { id: 'journal-50', name: 'Historien', description: '50 entrÃ©es de journal', icon: 'ðŸ“š', color: '#8A2BE2', category: 'journal', requirement: 50 },
  
  // Badges Challenge
  { id: 'challenge-complete', name: 'Acompli', description: 'Challenge 40 jours terminÃ©', icon: 'ðŸ†', color: '#FFD700', category: 'challenge', requirement: 1 },
];

export async function checkAndUnlockBadges(
  userId: string,
  analytics: { totalDhikr: number; totalNotes: number; streak: number }
): Promise<Badge[]> {
  const unlocked: Badge[] = [];
  
  for (const badge of BADGES) {
    let shouldUnlock = false;
    
    switch (badge.category) {
      case 'dhikr':
        shouldUnlock = analytics.totalDhikr >= badge.requirement;
        break;
      case 'journal':
        shouldUnlock = analytics.totalNotes >= badge.requirement;
        break;
      case 'streak':
        shouldUnlock = analytics.streak >= badge.requirement;
        break;
    }
    
    if (shouldUnlock) {
      const alreadyUnlocked = await isBadgeUnlocked(userId, badge.id);
      if (!alreadyUnlocked) {
        await unlockBadge(userId, badge.id);
        unlocked.push(badge);
      }
    }
  }
  
  return unlocked;
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  try {
    const stored = await AsyncStorage.getItem(`@ayna_badges_${userId}`);
    if (stored) {
      const badgeIds: string[] = JSON.parse(stored);
      return BADGES.filter(b => badgeIds.includes(b.id)).map(badge => ({
        ...badge,
        unlockedAt: new Date().toISOString(),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

async function isBadgeUnlocked(userId: string, badgeId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(`@ayna_badges_${userId}`);
    if (stored) {
      const badgeIds: string[] = JSON.parse(stored);
      return badgeIds.includes(badgeId);
    }
    return false;
  } catch {
    return false;
  }
}

async function unlockBadge(userId: string, badgeId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(`@ayna_badges_${userId}`);
    const badgeIds: string[] = stored ? JSON.parse(stored) : [];
    if (!badgeIds.includes(badgeId)) {
      badgeIds.push(badgeId);
      await AsyncStorage.setItem(`@ayna_badges_${userId}`, JSON.stringify(badgeIds));
      
      // Synchroniser avec Supabase
      if (supabase) {
        await supabase.from('user_badges').insert({
          user_id: userId,
          badge_id: badgeId,
          unlocked_at: new Date().toISOString(),
        });
      }
    }
  } catch {
    // Erreur silencieuse
  }
}









