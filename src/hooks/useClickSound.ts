// hooks/useClickSound.ts
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';

// Charger l'asset une seule fois
let clickSoundAsset: Asset | null = null;
let clickSoundUri: string | null = null;
let isInitialized = false;

const initializeClickSound = async (): Promise<string | null> => {
  if (isInitialized && clickSoundUri) {
    return clickSoundUri;
  }
  
  try {
    // Charger l'asset depuis assets/sounds/click.wav
    const soundModule = require('../../assets/sounds/click.wav');
    clickSoundAsset = Asset.fromModule(soundModule);
    await clickSoundAsset.downloadAsync();
    
    if (clickSoundAsset.localUri) {
      clickSoundUri = clickSoundAsset.localUri;
      isInitialized = true;
      return clickSoundUri;
    }
  } catch (error) {
    // Erreur silencieuse si le son ne peut pas être chargé (en production, ne pas logger)
    if (__DEV__) {
      console.warn('Impossible de charger le son de clic:', error);
    }
  }
  
  return null;
};

/**
 * Hook pour jouer un son de clic sur les interactions utilisateur
 * Le son est chargé une seule fois et réutilisé pour toutes les interactions
 */
export const useClickSound = () => {
  const [audioUri, setAudioUri] = useState<string>('');
  const audioPlayer = useAudioPlayer(audioUri);
  const isPlayingRef = useRef(false);

  // Initialiser le son au montage
  useEffect(() => {
    initializeClickSound().then((uri) => {
      if (uri) {
        setAudioUri(uri);
      }
    });
  }, []);

  const playClickSound = useCallback(async () => {
    try {
      // Attendre que l'URI soit disponible
      if (!audioUri || isPlayingRef.current || !audioPlayer) {
        return;
      }

      isPlayingRef.current = true;
      
      // Réinitialiser la position si possible
      if (audioPlayer.seekTo) {
        try {
          await audioPlayer.seekTo(0);
        } catch (e) {
          // Ignorer les erreurs de seekTo
        }
      }
      
      // Jouer le son
      if (audioPlayer.play) {
        await audioPlayer.play();
      }
      
      // Réinitialiser le flag après un court délai
      setTimeout(() => {
        isPlayingRef.current = false;
      }, 100);
    } catch (error) {
      // Erreur silencieuse en production
      isPlayingRef.current = false;
    }
  }, [audioUri, audioPlayer]);

  return { playClickSound };
};

