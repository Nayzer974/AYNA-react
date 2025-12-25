import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface DimensionsState {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

/**
 * Hook mémorisé pour obtenir les dimensions de l'écran
 * Évite les appels répétés à Dimensions.get('window')
 */
export function useDimensions(): DimensionsState {
  const [dimensions, setDimensions] = useState<DimensionsState>(() => {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return { width, height, scale, fontScale };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setDimensions({
        width: window.width,
        height: window.height,
        scale: window.scale,
        fontScale: window.fontScale,
      });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return dimensions;
}

