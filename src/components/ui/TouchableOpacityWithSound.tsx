// components/ui/TouchableOpacityWithSound.tsx
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useClickSound } from '@/hooks/useClickSound';

/**
 * Composant TouchableOpacity qui joue automatiquement un son de clic
 * Utilise le même API que TouchableOpacity de React Native
 */
export const TouchableOpacityWithSound = React.forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  TouchableOpacityProps
>(({ onPress, ...props }, ref) => {
  const { playClickSound } = useClickSound();

  const handlePress = (event: any) => {
    playClickSound();
    onPress?.(event);
  };

  return <TouchableOpacity ref={ref} {...props} onPress={handlePress} />;
});

TouchableOpacityWithSound.displayName = 'TouchableOpacityWithSound';

