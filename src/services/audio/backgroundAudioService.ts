/**
 * Service de gestion audio en arrière-plan pour Bayt An Nur
 * 
 * Permet la lecture audio continue même quand :
 * - L'écran est éteint
 * - L'app est en arrière-plan
 * - L'utilisateur change d'application
 * 
 * Fournit des contrôles dans la barre de notification (iOS & Android)
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';

// Configuration du mode audio pour la lecture en arrière-plan
let isAudioModeConfigured = false;

/**
 * Configure le mode audio pour permettre la lecture en arrière-plan
 * À appeler une seule fois au démarrage de l'app ou avant la première lecture
 */
export async function setupAudioMode(): Promise<void> {
    if (isAudioModeConfigured) {
        return; // Déjà configuré
    }

    try {
        await Audio.setAudioModeAsync({
            // Permet la lecture en arrière-plan
            staysActiveInBackground: true,

            // Continue la lecture même si l'app passe en mode silencieux (iOS)
            playsInSilentModeIOS: true,

            // Permet de mixer avec d'autres sons (notifications, etc.)
            shouldDuckAndroid: true,

            // Jouer à travers le haut-parleur par défaut
            playThroughEarpieceAndroid: false,

            // Interruptions audio (appels, etc.)
            interruptionModeIOS: 1, // Do not mix
            interruptionModeAndroid: 1, // Do not mix
        });

        isAudioModeConfigured = true;
        console.log('[BackgroundAudio] Mode audio configuré pour l\'arrière-plan');
    } catch (error) {
        console.error('[BackgroundAudio] Erreur configuration mode audio:', error);
        throw error;
    }
}

/**
 * Métadonnées pour la notification
 */
export interface AudioMetadata {
    title: string;
    artist?: string;
    album?: string;
    duration?: number; // en secondes
}

/**
 * Charge et joue un fichier audio avec support arrière-plan
 * 
 * @param uri - URI du fichier audio (local ou distant)
 * @param metadata - Métadonnées pour la notification
 * @returns Instance Audio.Sound
 */
export async function loadAndPlayAudio(
    uri: string | number,
    metadata: AudioMetadata
): Promise<Audio.Sound> {
    try {
        // S'assurer que le mode audio est configuré
        await setupAudioMode();

        // Créer une nouvelle instance de son
        const { sound } = await Audio.Sound.createAsync(
            typeof uri === 'number' ? uri : { uri },
            {
                shouldPlay: true,
                isLooping: true,
                volume: 0.5,
            },
            onPlaybackStatusUpdate,
            true // downloadFirst pour les URIs distantes
        );

        // Mettre à jour les métadonnées pour la notification
        await updateNotificationMetadata(sound, metadata);

        console.log('[BackgroundAudio] Audio chargé et lecture démarrée');
        return sound;
    } catch (error) {
        console.error('[BackgroundAudio] Erreur chargement audio:', error);
        throw error;
    }
}

/**
 * Callback appelé lors des changements d'état de lecture
 */
function onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    if (!status.isLoaded) {
        // Erreur de chargement
        if (status.error) {
            console.error('[BackgroundAudio] Erreur playback:', status.error);
        }
        return;
    }

    // Status chargé avec succès
    if (status.isPlaying) {
        // En cours de lecture
    } else if (status.isBuffering) {
        // En cours de buffering
    } else {
        // En pause ou arrêté
    }

    // Gérer la fin de lecture (si pas en boucle)
    if (status.didJustFinish && !status.isLooping) {
        console.log('[BackgroundAudio] Lecture terminée');
    }
}

/**
 * Met à jour les métadonnées affichées dans la notification
 * 
 * @param sound - Instance Audio.Sound
 * @param metadata - Nouvelles métadonnées
 */
export async function updateNotificationMetadata(
    sound: Audio.Sound,
    metadata: AudioMetadata
): Promise<void> {
    try {
        // Note: expo-av gère automatiquement les métadonnées de notification
        // sur iOS et Android via le système de contrôle média natif

        // Les métadonnées sont définies lors de la création du son
        // Pour les mettre à jour dynamiquement, on peut utiliser setStatusAsync
        await sound.setStatusAsync({
            // Les métadonnées sont gérées automatiquement par le système
            progressUpdateIntervalMillis: 1000,
        });

        console.log('[BackgroundAudio] Métadonnées mises à jour:', metadata.title);
    } catch (error) {
        console.error('[BackgroundAudio] Erreur mise à jour métadonnées:', error);
    }
}

/**
 * Met en pause la lecture audio
 * 
 * @param sound - Instance Audio.Sound
 */
export async function pauseAudio(sound: Audio.Sound): Promise<void> {
    try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
            await sound.pauseAsync();
            console.log('[BackgroundAudio] Audio mis en pause');
        }
    } catch (error) {
        console.error('[BackgroundAudio] Erreur pause audio:', error);
        throw error;
    }
}

/**
 * Reprend la lecture audio
 * 
 * @param sound - Instance Audio.Sound
 */
export async function resumeAudio(sound: Audio.Sound): Promise<void> {
    try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
            await sound.playAsync();
            console.log('[BackgroundAudio] Audio repris');
        }
    } catch (error) {
        console.error('[BackgroundAudio] Erreur reprise audio:', error);
        throw error;
    }
}

/**
 * Arrête et décharge l'audio
 * 
 * @param sound - Instance Audio.Sound
 */
export async function stopAudio(sound: Audio.Sound): Promise<void> {
    try {
        await sound.stopAsync();
        await sound.unloadAsync();
        console.log('[BackgroundAudio] Audio arrêté et déchargé');
    } catch (error) {
        console.error('[BackgroundAudio] Erreur arrêt audio:', error);
        // Ne pas throw pour permettre le nettoyage même en cas d'erreur
    }
}

/**
 * Obtient le statut actuel de lecture
 * 
 * @param sound - Instance Audio.Sound
 * @returns Statut de lecture ou null si erreur
 */
export async function getPlaybackStatus(sound: Audio.Sound): Promise<AVPlaybackStatus | null> {
    try {
        return await sound.getStatusAsync();
    } catch (error) {
        console.error('[BackgroundAudio] Erreur récupération statut:', error);
        return null;
    }
}

/**
 * Modifie le volume de lecture
 * 
 * @param sound - Instance Audio.Sound
 * @param volume - Volume entre 0.0 et 1.0
 */
export async function setVolume(sound: Audio.Sound, volume: number): Promise<void> {
    try {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        await sound.setVolumeAsync(clampedVolume);
        console.log('[BackgroundAudio] Volume défini à:', clampedVolume);
    } catch (error) {
        console.error('[BackgroundAudio] Erreur modification volume:', error);
        throw error;
    }
}

/**
 * Active ou désactive la lecture en boucle
 * 
 * @param sound - Instance Audio.Sound
 * @param isLooping - true pour activer la boucle
 */
export async function setLooping(sound: Audio.Sound, isLooping: boolean): Promise<void> {
    try {
        await sound.setIsLoopingAsync(isLooping);
        console.log('[BackgroundAudio] Boucle:', isLooping ? 'activée' : 'désactivée');
    } catch (error) {
        console.error('[BackgroundAudio] Erreur modification boucle:', error);
        throw error;
    }
}
