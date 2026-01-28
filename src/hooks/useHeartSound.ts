// hooks/useHeartSound.ts
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';

// Charger l'asset une seule fois
let heartSoundAsset: Asset | null = null;
let heartSoundUri: string | null = null;
let isInitialized = false;

const initializeHeartSound = async (): Promise<string | null> => {
  if (isInitialized && heartSoundUri) {
    return heartSoundUri;
  }
  
  try {
    // Charger l'asset depuis assets/sounds/heart.mp4
    const soundModule = require('../../assets/sounds/heart.mp4');
    heartSoundAsset = Asset.fromModule(soundModule);
    await heartSoundAsset.downloadAsync();
    
    if (heartSoundAsset.localUri) {
      heartSoundUri = heartSoundAsset.localUri;
      isInitialized = true;
      return heartSoundUri;
    }
  } catch (error) {
    // Erreur silencieuse si le son ne peut pas être chargé (en production, ne pas logger)
    if (__DEV__) {
      console.warn('Impossible de charger le son de cœur:', error);
    }
  }
  
  return null;
};

/**
 * Hook pour jouer le son de cœur pour le mode cœur dans Dairat An Nur
 * Le son se répète en boucle tant que le mode cœur est activé
 */
export const useHeartSound = () => {
  const [audioUri, setAudioUri] = useState<string>('');
  const audioPlayer = useAudioPlayer(audioUri);
  const isPlayingRef = useRef(false);

  // Initialiser le son au montage
  useEffect(() => {
    initializeHeartSound().then((uri) => {
      if (uri) {
        setAudioUri(uri);
      }
    });
  }, []);

  // Démarrer la lecture en boucle
  const startHeartSoundLoop = useCallback(async () => {
    try {
      // Attendre que l'URI soit disponible
      if (!audioUri || !audioPlayer) {
        return;
      }

      if (isPlayingRef.current) {
        return; // Déjà en cours de lecture
      }

      isPlayingRef.current = true;
      
      // Configurer la lecture en boucle
      if (audioPlayer.loop !== undefined) {
        audioPlayer.loop = true;
      }
      
      // Configurer le volume
      if (audioPlayer.volume !== undefined) {
        audioPlayer.volume = 0.5;
      }
      
      // Réinitialiser la position si possible
      if (audioPlayer.seekTo) {
        try {
          await audioPlayer.seekTo(0);
        } catch (e) {
          // Ignorer les erreurs de seekTo
        }
      }
      
      // Jouer le son en boucle
      if (audioPlayer.play) {
        await audioPlayer.play();
      }
    } catch (error) {
      // Erreur silencieuse en production
      if (__DEV__) {
        console.warn('Erreur lors du démarrage du son de cœur:', error);
      }
      isPlayingRef.current = false;
    }
  }, [audioUri, audioPlayer]);

  // Arrêter la lecture
  const stopHeartSoundLoop = useCallback(async () => {
    try {
      if (!audioPlayer || !isPlayingRef.current) {
        return;
      }

      isPlayingRef.current = false;
      
      // Arrêter la lecture
      if (audioPlayer.pause) {
        await audioPlayer.pause();
      }
      
      // Réinitialiser la position
      if (audioPlayer.seekTo) {
        try {
          await audioPlayer.seekTo(0);
        } catch (e) {
          // Ignorer les erreurs
        }
      }
    } catch (error) {
      // Erreur silencieuse en production
      if (__DEV__) {
        console.warn('Erreur lors de l\'arrêt du son de cœur:', error);
      }
      isPlayingRef.current = false;
    }
  }, [audioPlayer]);

  return { startHeartSoundLoop, stopHeartSoundLoop };
};

