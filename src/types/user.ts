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
    theme: 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy' | 'minimal';
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
