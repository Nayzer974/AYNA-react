/**
 * Hook pour gérer la localisation GPS
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { getCurrentLocation, watchPosition, LocationData, isGPSHeadingReliable } from '@/services/location.service';

export interface UseLocationReturn {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startWatching: () => void;
  stopWatching: () => void;
}

export function useLocation(autoStart: boolean = true): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchStopRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const currentLocation = await getCurrentLocation();
      if (isMountedRef.current) {
        setLocation(currentLocation);
        setLoading(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors de la récupération de la localisation');
        setLoading(false);
      }
    }
  }, []);

  const startWatching = useCallback(() => {
    if (watchStopRef.current) {
      watchStopRef.current();
    }

    watchStopRef.current = watchPosition(
      (newLocation) => {
        if (isMountedRef.current) {
          setLocation(newLocation);
        }
      },
      {
        accuracy: Platform.OS === 'ios' ? 1 : 2, // High accuracy
        timeInterval: 1000, // 1 seconde
        distanceInterval: 1, // 1 mètre
      }
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchStopRef.current) {
      watchStopRef.current();
      watchStopRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (autoStart) {
      refresh();
    }

    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [autoStart, refresh, stopWatching]);

  return {
    location,
    loading,
    error,
    refresh,
    startWatching,
    stopWatching,
  };
}


