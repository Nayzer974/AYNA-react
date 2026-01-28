import { addToSyncQueue, getSyncQueue, syncQueue, isOnline } from '@/services/storage/syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/services/auth/supabase';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn(),
}));

jest.mock('@/services/auth/supabase', () => ({
    supabase: {
        auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
        from: jest.fn(() => ({
            insert: jest.fn().mockResolvedValue({ error: null }),
        })),
    },
}));

describe('syncService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isOnline', () => {
        it('should return true when connected to internet', async () => {
            (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true });
            const result = await isOnline();
            expect(result).toBe(true);
        });

        it('should return false when not connected', async () => {
            (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false, isInternetReachable: false });
            const result = await isOnline();
            expect(result).toBe(false);
        });
    });

    describe('addToSyncQueue', () => {
        it('should add an item to the queue in AsyncStorage', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            await addToSyncQueue({
                type: 'journal_note',
                data: { text: 'Test note' },
                userId: 'user-123'
            });

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                'ayna_sync_queue',
                expect.stringContaining('journal_note')
            );
        });
    });

    describe('syncQueue', () => {
        it('should sync items when online', async () => {
            (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true });
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([
                { id: '1', type: 'khalwa_session', data: { divineName: { id: 1, arabic: 'Test' }, duration: 10, soundAmbiance: 'nature', breathingType: 'box', guided: false }, timestamp: Date.now(), userId: 'user-123' }
            ]));
            (supabase!.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });

            const result = await syncQueue();

            expect(result.synced).toBe(1);
            expect(supabase!.from).toHaveBeenCalledWith('khalwa_sessions');
        });

        it('should not sync items when offline', async () => {
            (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false, isInternetReachable: false });

            const result = await syncQueue();

            expect(result.synced).toBe(0);
            expect(supabase!.from).not.toHaveBeenCalled();
        });
    });
});
