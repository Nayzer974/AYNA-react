/**
 * Hook principal pour la boussole Qibla
 * Implémente la logique Google Maps : rotation = bearingKaaba - heading
 */

import { useEffect, useMemo } from 'react';
import { useLocation } from './useLocation';
import { useHeading } from './useHeading';
import { calculateBearing, KAABA_LAT, KAABA_LNG } from '@/services/qibla.service';

export interface UseQiblaReturn {
  // Position
  location: ReturnType<typeof useLocation>['location'];
  
  // Heading
  heading: number | null; // 0-360, heading magnétique
  
  // Qibla
  bearingKaaba: number | null; // Bearing vers la Kaaba (0-360)
  rotation: number | null; // Rotation finale : bearingKaaba - heading
  
  // Orientation
  pitch: number | null;
  roll: number | null;
  
  // États
  loading: boolean;
  error: string | null;
  
  // Actions
  start: () => Promise<void>;
  stop: () => void;
  refreshLocation: () => Promise<void>;
}

export function useQibla(): UseQiblaReturn {
  const { location, loading: locationLoading, error: locationError, refresh: refreshLocation } = useLocation(true);
  const { 
    heading, 
    pitch,
    roll,
    loading: headingLoading, 
    error: headingError, 
    start: startHeading, 
    stop: stopHeading 
  } = useHeading();

  // Calculer le bearing vers la Kaaba
  const bearingKaaba = useMemo(() => {
    if (!location) return null;
    
    try {
      return calculateBearing(location.latitude, location.longitude, KAABA_LAT, KAABA_LNG);
    } catch {
      return null;
    }
  }, [location]);

  // Calculer la rotation finale
  // RÈGLE FONDAMENTALE : rotation = bearingKaaba - heading
  const rotation = useMemo(() => {
    if (bearingKaaba === null || heading === null) {
      return null;
    }

    // Rotation = bearingKaaba - heading
    let rot = bearingKaaba - heading;
    
    // Normaliser entre -180 et 180 pour une rotation plus naturelle
    rot = ((rot + 180) % 360) - 180;
    
    return rot;
  }, [bearingKaaba, heading]);

  const start = async () => {
    await startHeading();
  };

  const stop = () => {
    stopHeading();
  };

  // Démarrer automatiquement les capteurs
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, []);

  // États combinés
  const loading = locationLoading || headingLoading;
  const error = locationError || headingError;

  return {
    location,
    heading,
    bearingKaaba,
    rotation,
    pitch,
    roll,
    loading,
    error,
    start,
    stop,
    refreshLocation,
  };
}
