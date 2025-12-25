/**
 * Hook pour gérer l'orientation du téléphone (heading)
 * Implémentation simple : capteurs uniquement (Android)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import { calculateOrientation } from '@/services/orientation.service';

type AccelerometerData = { x: number; y: number; z: number };
type MagnetometerData = { x: number; y: number; z: number };

export interface UseHeadingReturn {
  heading: number | null; // 0-360, heading magnétique
  pitch: number | null;
  roll: number | null;
  loading: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

export function useHeading(): UseHeadingReturn {
  const [heading, setHeading] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number | null>(null);
  const [roll, setRoll] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscriptionsRef = useRef<Array<{ remove: () => void }>>([]);
  const isMountedRef = useRef(true);

  // Mettre à jour le heading depuis les capteurs
  const updateHeading = useCallback((
    magnetometer: MagnetometerData,
    accelerometer: AccelerometerData
  ) => {
    if (!isMountedRef.current) return;

    // Calculer l'orientation
    const orientation = calculateOrientation(accelerometer, magnetometer);

    if (isMountedRef.current && Number.isFinite(orientation.yaw)) {
      setHeading(orientation.yaw);
      setPitch(orientation.pitch);
      setRoll(orientation.roll);
    }
  }, []);

  const start = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Vérifier la disponibilité des capteurs
      const [magAvailable, accAvailable] = await Promise.all([
        Magnetometer.isAvailableAsync(),
        Accelerometer.isAvailableAsync(),
      ]);

      if (!magAvailable || !accAvailable) {
        throw new Error('Les capteurs d\'orientation ne sont pas disponibles');
      }

      // Demander les permissions
      await Promise.all([
        Magnetometer.requestPermissionsAsync(),
        Accelerometer.requestPermissionsAsync(),
      ]);

      // Configurer la fréquence d'update (~30fps pour économiser la batterie)
      Magnetometer.setUpdateInterval(33);
      Accelerometer.setUpdateInterval(33);

      // Stocker les dernières valeurs
      let lastMagnetometer: MagnetometerData | null = null;
      let lastAccelerometer: AccelerometerData | null = null;

      // Abonner aux capteurs
      const magSub = Magnetometer.addListener((data) => {
        lastMagnetometer = data;
        if (lastAccelerometer) {
          updateHeading(data, lastAccelerometer);
        }
      });

      const accSub = Accelerometer.addListener((data) => {
        lastAccelerometer = data;
        if (lastMagnetometer) {
          updateHeading(lastMagnetometer, data);
        }
      });

      subscriptionsRef.current = [magSub, accSub];

      if (isMountedRef.current) {
        setLoading(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors du démarrage des capteurs');
        setLoading(false);
      }
    }
  }, [updateHeading]);

  const stop = useCallback(() => {
    subscriptionsRef.current.forEach(sub => sub.remove());
    subscriptionsRef.current = [];
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stop();
    };
  }, [stop]);

  return {
    heading,
    pitch,
    roll,
    loading,
    error,
    start,
    stop,
  };
}
