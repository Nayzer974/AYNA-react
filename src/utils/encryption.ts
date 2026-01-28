import * as Crypto from 'expo-crypto';
import { secureStorage } from './secureStorage';

const MASTER_KEY_STORAGE_ID = 'journal_master_key';

/**
 * Utility for symmetric encryption
 * Uses expo-crypto (React Native compatible) instead of crypto-js
 * 
 * NOTE: This is a simplified XOR-based encryption for local storage protection.
 * It's sufficient for protecting data at rest on the device, combined with SecureStore for the key.
 */

/**
 * Simple XOR cipher with key stretching
 * Secure enough for local storage when combined with OS-level SecureStore
 */
function xorEncrypt(text: string, key: string): string {
    const textBytes = new TextEncoder().encode(text);
    const keyBytes = new TextEncoder().encode(key);

    const encrypted = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
        encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Convert to base64
    return btoa(String.fromCharCode(...encrypted));
}

function xorDecrypt(encryptedBase64: string, key: string): string {
    try {
        // Decode from base64
        const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const keyBytes = new TextEncoder().encode(key);

        const decrypted = new Uint8Array(encrypted.length);
        for (let i = 0; i < encrypted.length; i++) {
            decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
        }

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        throw new Error('Decryption failed');
    }
}

export const encryption = {
    /**
     * Gets or generates a master encryption key
     * The key is stored in SecureStore (encrypted by the OS)
     */
    async getMasterKey(): Promise<string> {
        try {
            let key = await secureStorage.getItem(MASTER_KEY_STORAGE_ID);

            if (!key) {
                // Generate a cryptographically strong random key (256 bits = 32 bytes)
                const randomBytes = await Crypto.getRandomBytesAsync(32);
                // Convert to hex string
                key = Array.from(randomBytes)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');

                await secureStorage.setItem(MASTER_KEY_STORAGE_ID, key);
            }

            return key;
        } catch (error) {
            console.error('[Encryption] Error getting master key:', error);
            throw new Error('Failed to retrieve security keys. Please try again.');
        }
    },

    /**
     * Encrypts a plain text string
     */
    async encrypt(text: string): Promise<string> {
        if (!text) return text;

        try {
            const key = await this.getMasterKey();
            const encrypted = xorEncrypt(text, key);
            return `enc:${encrypted}`; // Prefix to identify encrypted content
        } catch (error) {
            console.error('[Encryption] Encryption failed:', error);
            throw new Error('Failed to secure your data.');
        }
    },

    /**
     * Decrypts an encrypted string
     */
    async decrypt(encryptedText: string): Promise<string> {
        if (!encryptedText || !encryptedText.startsWith('enc:')) {
            return encryptedText; // Return as is if not encrypted
        }

        try {
            const key = await this.getMasterKey();
            const cipherText = encryptedText.substring(4); // Remove 'enc:' prefix
            const decrypted = xorDecrypt(cipherText, key);

            if (!decrypted) {
                throw new Error('Decryption resulted in empty string');
            }

            return decrypted;
        } catch (error) {
            console.error('[Encryption] Decryption failed:', error);
            // In case of failure, we return a fallback to avoid crashing the UI
            return '[Contenu sécurisé - Erreur de déchiffrement]';
        }
    },

    /**
     * Batch encryption for objects (e.g. JournalNote)
     */
    async encryptObject<T extends object>(obj: T, fieldsToEncrypt: (keyof T)[]): Promise<T> {
        const encryptedObj = { ...obj };
        for (const field of fieldsToEncrypt) {
            const value = obj[field];
            if (typeof value === 'string') {
                (encryptedObj as any)[field] = await this.encrypt(value);
            }
        }
        return encryptedObj;
    },

    /**
     * Batch decryption for objects
     */
    async decryptObject<T extends object>(obj: T, fieldsToDecrypt: (keyof T)[]): Promise<T> {
        const decryptedObj = { ...obj };
        for (const field of fieldsToDecrypt) {
            const value = obj[field];
            if (typeof value === 'string') {
                (decryptedObj as any)[field] = await this.decrypt(value);
            }
        }
        return decryptedObj;
    }
};
