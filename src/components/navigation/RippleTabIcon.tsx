import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { TabBadge } from './TabBadge';

interface RippleTabIconProps {
  icon: React.ReactNode;
  focused: boolean;
  tabName: string;
  badgeCount?: number;
  showBadge?: boolean;
}

export interface RippleTabIconRef {
  triggerRipple: () => void;
}

export const RippleTabIcon = forwardRef<RippleTabIconRef, RippleTabIconProps>(
  ({ icon, focused, tabName, badgeCount = 0, showBadge = false }, ref) => {
    const { user } = useUser();
    const theme = getTheme(user?.theme || 'default');

    // Valeurs animées pour l'effet ripple
    const scale = useSharedValue(1);           // Taille de l'icône
    const rippleScale = useSharedValue(0);     // Taille du cercle ripple
    const rippleOpacity = useSharedValue(0);   // Opacité du cercle ripple

    // Animation de l'icône (grossit quand focused, reste légèrement agrandie)
    const iconAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    // Animation du ripple (cercle qui s'étend)
    const rippleAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: rippleScale.value }],
        opacity: rippleOpacity.value,
      };
    });

    // Animation de l'icône quand elle devient focused (reste agrandie)
    useEffect(() => {
      if (focused) {
        // Animation fluide pour grossir l'icône quand elle est active
        scale.value = withSpring(1.2, {
          damping: 12,      // Résistance (plus élevé = moins de rebond)
          stiffness: 150,   // Rigidité (plus élevé = plus rapide)
          mass: 1,          // Masse (affecte l'inertie)
        });
      } else {
        // Retour à la taille normale quand non focused
        scale.value = withSpring(1, {
          damping: 12,
          stiffness: 150,
          mass: 1,
        });
      }
    }, [focused, scale]);

    // Fonction pour déclencher l'effet ripple au clic
    const triggerRipple = React.useCallback(() => {
      // Réinitialiser les valeurs immédiatement
      rippleScale.value = 0;
      rippleOpacity.value = 0.8; // Opacité initiale (0.8 = 80% visible)

      // Animation de l'icône au clic (pulsation rapide puis retour à la taille focused)
      const targetScale = focused ? 1.2 : 1; // Taille cible selon l'état focused

      // Pulsation rapide au clic
      scale.value = withSpring(1.4, {
        damping: 7,       // Moins de résistance pour un effet plus dynamique
        stiffness: 400,   // Animation très rapide
        mass: 0.5,        // Masse légère pour réactivité
      }, () => {
        // Callback : retour à la taille cible après la pulsation
        scale.value = withSpring(targetScale, {
          damping: 12,
          stiffness: 150,
          mass: 1,
        });
      });

      // Animation du ripple (cercle qui s'étend - plus visible)
      rippleScale.value = withTiming(4.5, {
        duration: 450, // Durée en millisecondes
      });

      // L'opacité diminue progressivement jusqu'à 0
      rippleOpacity.value = withTiming(0, {
        duration: 450,
      });
    }, [focused, scale, rippleScale, rippleOpacity]);

    // Exposer la fonction triggerRipple via la ref
    useImperativeHandle(ref, () => ({
      triggerRipple: () => {
        triggerRipple();
      },
    }), [triggerRipple]);

    const accentColor = theme.colors.accent || '#FFA500';
    const rippleColor = focused
      ? accentColor
      : theme.colors.textSecondary || 'rgba(255, 255, 255, 0.6)';

    return (
      <Animated.View
        style={styles.container}
        pointerEvents="box-none"
      >
        {/* Cercle ripple animé */}
        <Animated.View
          style={[
            styles.ripple,
            {
              backgroundColor: rippleColor,
            },
            rippleAnimatedStyle,
          ]}
          pointerEvents="none"
        />

        {/* Icône animée */}
        <Animated.View style={iconAnimatedStyle} pointerEvents="none">
          {icon}
        </Animated.View>

        {/* Badge de notification */}
        <TabBadge count={badgeCount} visible={showBadge} />
      </Animated.View>
    );
  }
);

RippleTabIcon.displayName = 'RippleTabIcon';

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible', // Important pour que le ripple soit visible
  },
  ripple: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20, // Cercle parfait
    alignSelf: 'center',
  },
});

