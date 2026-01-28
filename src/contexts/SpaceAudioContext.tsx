import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { NavigationState } from '@react-navigation/native';
import { useAudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';

// Charger l'asset une seule fois
let spaceSoundAsset: Asset | null = null;
let spaceSoundUri: string | null = null;
let isInitialized = false;

const initializeSpaceSound = async (): Promise<string | null> => {
  if (isInitialized && spaceSoundUri) {
    return spaceSoundUri;
  }

  try {
    const soundModule = require('../../assets/sounds/space.mp4');
    spaceSoundAsset = Asset.fromModule(soundModule);
    await spaceSoundAsset.downloadAsync();

    if (spaceSoundAsset.localUri) {
      spaceSoundUri = spaceSoundAsset.localUri;
      isInitialized = true;
      return spaceSoundUri;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Impossible de charger le son space:', error);
    }
  }

  return null;
};

interface SpaceAudioContextType {
  isPlaying: boolean;
  isEnabled: boolean;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  toggle: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  onNavigationStateChange: (state: NavigationState | undefined) => void;
}

const SpaceAudioContext = createContext<SpaceAudioContextType | undefined>(undefined);

// Fonction helper pour extraire la route actuelle depuis l'état de navigation
function getCurrentRouteName(state: any): string | null {
  if (!state) return null;

  const route = state.routes[state.index];
  if (route.state) {
    return getCurrentRouteName(route.state);
  }
  return route.name;
}

export function SpaceAudioProvider({ children }: { children: ReactNode }) {
  const [audioUri, setAudioUri] = useState<string>('');
  const audioPlayer = useAudioPlayer(audioUri);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const isInitializedRef = useRef(false);

  // Initialiser le son au montage
  useEffect(() => {
    if (!isInitializedRef.current) {
      initializeSpaceSound().then((uri) => {
        if (uri) {
          setAudioUri(uri);
          isInitializedRef.current = true;
        }
      });
    }
  }, []);

  // Réagir aux changements de isEnabled pour arrêter le son immédiatement
  useEffect(() => {
    if (!isEnabled && isPlaying && audioPlayer?.pause) {
      audioPlayer.pause();
      setIsPlaying(false);
    }
  }, [isEnabled, isPlaying, audioPlayer]);

  // Fonction appelée par le NavigationContainer pour détecter les changements de route
  const onNavigationStateChange = (state: NavigationState | undefined) => {
    const routeName = getCurrentRouteName(state);

    // Liste des routes où le son space doit être coupé
    const restrictedRoutes = ['BaytAnNur', 'Sabilanur', 'Quran', 'QuranReader'];

    // Si on navigue vers une route restreinte
    if (restrictedRoutes.includes(routeName || '')) {
      if (isPlaying && audioPlayer?.pause) {
        audioPlayer.pause();
        setIsPlaying(false);
      }
    }
    // Si on sort d'une route restreinte et que le son est activé
    // Ne pas redémarrer si l'utilisateur a mis en pause manuellement
    else if (!restrictedRoutes.includes(routeName || '') && !isPlaying && isEnabled && !isPausedByUser) {
      const resumeAudio = async () => {
        try {
          if (audioPlayer && !audioPlayer.playing) {
            (audioPlayer as any).loop = true;
            audioPlayer.volume = 0.5;
            await audioPlayer.play();
            setIsPlaying(true);
          }
        } catch (error) {
          console.warn('Erreur lors de la reprise du son:', error);
        }
      };

      // Petit délai pour laisser la navigation se terminer
      setTimeout(resumeAudio, 500);
    }
  };

  const play = async () => {
    try {
      if (!audioPlayer || !audioUri || !isEnabled) return;

      if (audioPlayer.play) {
        (audioPlayer as any).loop = true;
        audioPlayer.volume = 0.5;
        await audioPlayer.play();
        setIsPlaying(true);
        setIsPausedByUser(false); // Réinitialiser l'état de pause manuelle
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Erreur lors de la lecture:', error);
      }
    }
  };

  const pause = async () => {
    try {
      if (!audioPlayer || !isPlaying) return;

      if (audioPlayer.pause) {
        await audioPlayer.pause();
        setIsPlaying(false);
        setIsPausedByUser(true); // Marquer comme pause manuelle
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Erreur lors de la pause:', error);
      }
    }
  };

  const toggle = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  const value: SpaceAudioContextType = {
    isPlaying,
    isEnabled,
    play,
    pause,
    toggle,
    setEnabled: setIsEnabled,
    onNavigationStateChange,
  };

  return (
    <SpaceAudioContext.Provider value={value}>
      {children}
    </SpaceAudioContext.Provider>
  );
}

export function useSpaceAudio(): SpaceAudioContextType {
  const context = useContext(SpaceAudioContext);
  if (context === undefined) {
    throw new Error('useSpaceAudio must be used within a SpaceAudioProvider');
  }
  return context;
}

