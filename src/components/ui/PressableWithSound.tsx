// components/ui/PressableWithSound.tsx
import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { useClickSound } from '@/hooks/useClickSound';

/**
 * Composant Pressable qui joue automatiquement un son de clic
 * Utilise le même API que Pressable de React Native
 */
export const PressableWithSound = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  PressableProps
>(({ onPress, ...props }, ref) => {
  const { playClickSound } = useClickSound();

  const handlePress = (event: any) => {
    playClickSound();
    onPress?.(event);
  };

  return <Pressable ref={ref} {...props} onPress={handlePress} />;
});

PressableWithSound.displayName = 'PressableWithSound';

