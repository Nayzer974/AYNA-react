import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { Magnetometer, MagnetometerData } from 'expo-sensors';

interface QiblaState {
  userLat: number | null;
  userLon: number | null;
  qiblaAngle: number | null;
  deviceHeading: number | null;
  rotation: number | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
  isSupported: boolean;
}

/**
 * Hook personnalisé pour gérer la Qibla en React Native
 * - Récupère la géolocalisation via expo-location
 * - Calcule la direction Qibla via une formule géodésique
 * - Gère l'orientation du device via expo-sensors (Magnetometer)
 * - Calcule la rotation finale pour pointer vers la Kaaba
 */
export function useQibla() {
  const [state, setState] = useState<QiblaState>({
    userLat: null,
    userLon: null,
    qiblaAngle: null,
    deviceHeading: null,
    rotation: null,
    loading: false,
    error: null,
    permissionGranted: false,
    isSupported: false,
  });

  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Vérifier le support des capteurs
  useEffect(() => {
    const checkSupport = async () => {
      const isAvailable = await Magnetometer.isAvailableAsync();
      setState(prev => ({ ...prev, isSupported: isAvailable }));
    };
    checkSupport();
  }, []);

  /**
   * Calcule l'angle Qibla via une formule géodésique
   * Utilise les coordonnées fixes de la Kaaba
   */
  const calculateQiblaAngle = useCallback((userLat: number, userLon: number): number => {
    const kaabaLat = 21.422534 * Math.PI / 180;
    const kaabaLon = 39.826353 * Math.PI / 180;

    const lat = userLat * Math.PI / 180;
    const lon = userLon * Math.PI / 180;

    const numerator = Math.sin(kaabaLon - lon);
    const denominator =
      Math.cos(lat) * Math.tan(kaabaLat) -
      Math.sin(lat) * Math.cos(kaabaLon - lon);

    let angle = Math.atan2(numerator, denominator) * 180 / Math.PI;

    if (angle < 0) angle += 360;
    return angle;
  }, []);

  /**
   * Normalise un angle entre 0 et 360 degrés
   */
  const normalizeAngle = useCallback((angle: number): number => {
    let normalized = angle % 360;
    if (normalized < 0) {
      normalized += 360;
    }
    return normalized;
  }, []);

  /**
   * Calcule la rotation finale pour que la flèche pointe vers la Qibla
   * La flèche doit tourner pour compenser la rotation du téléphone
   */
  const calculateRotation = useCallback((qiblaAngle: number, deviceHeading: number): number => {
    // Calculer la différence d'angle
    let rotation = qiblaAngle - deviceHeading;
    // Normaliser entre 0 et 360
    rotation = (rotation + 360) % 360;
    return rotation;
  }, []);

  /**
   * Gère les données du magnétomètre pour obtenir l'orientation
   */
  const handleMagnetometer = useCallback((data: MagnetometerData) => {
    const now = Date.now();
    // Limiter les mises à jour à ~60fps
    if (now - lastUpdateRef.current < 16) return;
    lastUpdateRef.current = now;

    // Calculer le heading (direction) à partir des données du magnétomètre
    // x et y sont les composantes du champ magnétique
    const { x, y } = data;
    
    // Calculer l'angle en degrés (0° = Nord)
    let heading = Math.atan2(y, x) * (180 / Math.PI);
    heading = normalizeAngle(heading);

    // Mettre à jour le deviceHeading et recalculer la rotation
    setState(prev => {
      // Si on n'a pas encore l'angle Qibla, juste stocker le heading
      if (prev.qiblaAngle === null) {
        return { ...prev, deviceHeading: heading };
      }

      // Calculer la rotation de la flèche
      const rotation = calculateRotation(prev.qiblaAngle, heading);
      
      return {
        ...prev,
        deviceHeading: heading,
        rotation,
      };
    });
  }, [calculateRotation, normalizeAngle]);

  /**
   * Récupère la géolocalisation et la direction Qibla
   */
  const fetchLocationAndQibla = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Demander la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission de localisation refusée');
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const qiblaAngle = calculateQiblaAngle(latitude, longitude);

      setState(prev => {
        // Si on a déjà un deviceHeading, calculer la rotation
        if (prev.deviceHeading !== null) {
          const rotation = calculateRotation(qiblaAngle, prev.deviceHeading);
          return {
            ...prev,
            userLat: latitude,
            userLon: longitude,
            qiblaAngle,
            rotation,
            loading: false,
            error: null,
          };
        }
        return {
          ...prev,
          userLat: latitude,
          userLon: longitude,
          qiblaAngle,
          loading: false,
          error: null,
        };
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur lors de la récupération de la géolocalisation ou du calcul de la Qibla',
      }));
    }
  }, [calculateQiblaAngle, calculateRotation]);

  /**
   * Demande les permissions et démarre le suivi
   */
  const requestPermissionsAndStart = useCallback(async () => {
    try {
      // Vérifier le support
      const isAvailable = await Magnetometer.isAvailableAsync();
      if (!isAvailable) {
        setState(prev => ({
          ...prev,
          error: 'Les capteurs d\'orientation ne sont pas disponibles sur cet appareil.',
        }));
        return;
      }

      // Demander la permission pour le magnétomètre
      await Magnetometer.requestPermissionsAsync();

      // Récupérer la géolocalisation et calculer la Qibla
      await fetchLocationAndQibla();

      // Démarrer l'écoute du magnétomètre
      Magnetometer.setUpdateInterval(16); // ~60fps
      const subscription = Magnetometer.addListener(handleMagnetometer);
      subscriptionRef.current = subscription;

      setState(prev => ({ ...prev, permissionGranted: true }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Erreur lors de la demande de permissions',
        permissionGranted: false,
      }));
    }
  }, [fetchLocationAndQibla, handleMagnetometer]);

  // Nettoyer les listeners au démontage
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return {
    userLat: state.userLat,
    userLon: state.userLon,
    qiblaAngle: state.qiblaAngle,
    deviceHeading: state.deviceHeading,
    rotation: state.rotation,
    loading: state.loading,
    error: state.error,
    iosPermissionRequired: false, // Pas nécessaire en React Native
    permissionGranted: state.permissionGranted,
    isSupported: state.isSupported,
    requestIOSPermission: requestPermissionsAndStart, // Alias pour compatibilité
    requestPermissionsAndStart,
  };
}


