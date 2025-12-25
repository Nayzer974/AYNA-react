/**
 * Composant CalendrierBottomSheet
 * 
 * Bottom sheet iOS-style pour le calendrier Hijri
 * - Apparaît progressivement lors du scroll vers le haut (pull up)
 * - Peut être masqué en glissant vers le bas
 * - Animation fluide style iOS
 * - FIX ANDROID: Utilise react-native-gesture-handler pour détecter le swipe up
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HijriCalendarBottomSheet as HijriCalendarContent } from './HijriCalendarBottomSheet';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

// Constantes optimisées (calculées une seule fois)
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.90;
const MIN_TRANSLATE_Y = SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT;
const OPEN_THRESHOLD = BOTTOM_SHEET_HEIGHT - 10;

// Configuration du gesture (constantes)
const SWIPE_UP_THRESHOLD = -12; // Seuil réduit pour une détection plus facile et rapide
const SPRING_CONFIG = { 
  damping: 28, 
  stiffness: 110,
  mass: 0.9,
};
const CLOSE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 0.5;

interface CalendrierBottomSheetProps {
  scrollY: SharedValue<number> | undefined;
  onSwipeUp?: (openFn: () => void) => void; // Callback pour exposer la fonction d'ouverture
}

export function CalendrierBottomSheet({ scrollY, onSwipeUp }: CalendrierBottomSheetProps) {
  const { user } = useUser();
  const theme = useMemo(() => getTheme(user?.theme || 'default'), [user?.theme]);
  const insets = useSafeAreaInsets();
  
  const translateY = useSharedValue(BOTTOM_SHEET_HEIGHT);
  const startY = useRef(0);
  
  // Exposer la fonction d'ouverture à l'extérieur
  useEffect(() => {
    if (onSwipeUp) {
      const openFn = () => {
        if (translateY.value >= OPEN_THRESHOLD) {
          translateY.value = withSpring(MIN_TRANSLATE_Y, SPRING_CONFIG);
        }
      };
      onSwipeUp(openFn);
    }
  }, [onSwipeUp]);
  
  // Valeur dérivée pour vérifier si le sheet est ouvert (optimisé)
  const isSheetOpen = useDerivedValue(() => {
    return translateY.value < OPEN_THRESHOLD;
  }, []);

  // Fonction pour ouvrir le bottom sheet (worklet optimisé)
  const openBottomSheet = () => {
    'worklet';
    if (translateY.value >= OPEN_THRESHOLD) {
      translateY.value = withSpring(MIN_TRANSLATE_Y, SPRING_CONFIG);
    }
  };

  // Fonction pour fermer le bottom sheet (worklet optimisé)
  const closeBottomSheet = () => {
    'worklet';
    if (translateY.value < OPEN_THRESHOLD) {
      translateY.value = withSpring(BOTTOM_SHEET_HEIGHT, SPRING_CONFIG);
    }
  };

  // Gesture pour détecter le swipe up sur toute la page d'accueil
  const swipeUpGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-3, 3]) // Détecter les mouvements verticaux (sensible)
        .failOffsetX([-100, 100]) // Permettre les mouvements horizontaux
        .minDistance(5) // Distance minimale réduite
        .onStart(() => {
          'worklet';
          // Gesture démarré
        })
        .onUpdate((event) => {
          'worklet';
          // Détecter les swipes vers le haut (translationY négatif)
          // Vérifier que le sheet est fermé avant d'ouvrir
          if (event.translationY < SWIPE_UP_THRESHOLD && translateY.value >= OPEN_THRESHOLD) {
            openBottomSheet();
          }
        })
        .onEnd(() => {
          'worklet';
          // Gesture terminé
        })
        .enabled(true)
        .simultaneousWithExternalGesture(scrollY as any), // Permettre les gestes simultanés
    []
  );

  // PanResponder optimisé pour fermer le sheet (créé une seule fois)
  const panResponder = useRef(
    require('react-native').PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return translateY.value < OPEN_THRESHOLD;
      },
      onMoveShouldSetPanResponder: (_: any, gestureState: any) => {
        if (translateY.value >= OPEN_THRESHOLD) return false;
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        startY.current = translateY.value;
      },
      onPanResponderMove: (_: any, gestureState: any) => {
        if (gestureState.dy > 0) {
          // Ajouter une résistance naturelle lors du glissement vers le bas
          const resistance = 0.98;
          translateY.value = startY.current + gestureState.dy * resistance;
        }
      },
      onPanResponderRelease: (_: any, gestureState: any) => {
        const shouldClose =
          gestureState.dy > CLOSE_THRESHOLD || gestureState.vy > VELOCITY_THRESHOLD;
        if (shouldClose) {
          closeBottomSheet();
        } else {
          // Animation de retour plus douce
          translateY.value = withSpring(MIN_TRANSLATE_Y, {
            ...SPRING_CONFIG,
            damping: 30, // Plus de damping pour un retour plus doux
          });
        }
      },
    })
  ).current;

  // Styles animés optimisés (utilisent useDerivedValue pour éviter les recalculs)
  const bottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1,
  }));

  const overlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [BOTTOM_SHEET_HEIGHT, MIN_TRANSLATE_Y],
      [0, 0.5],
      Extrapolate.CLAMP
    );
    const isOpen = translateY.value < OPEN_THRESHOLD;
    return {
      opacity,
      pointerEvents: opacity > 0.1 && isOpen ? 'auto' : 'none',
    };
  });

  const swipeZoneStyle = useAnimatedStyle(() => {
    const isOpen = translateY.value < OPEN_THRESHOLD;
    return {
      // Utiliser 'box-none' pour permettre aux clics de passer à travers
      // Le GestureDetector capturera quand même les gestes de swipe
      pointerEvents: isOpen ? 'none' : 'box-none',
      opacity: 0, // Toujours invisible
    };
  });

  return (
    <>
      {/* Zone de détection du swipe up (invisible, couvre tout l'écran) */}
      <GestureDetector gesture={swipeUpGesture}>
        <Animated.View
          style={[
            styles.swipeUpZone,
            StyleSheet.absoluteFillObject,
            swipeZoneStyle,
          ]}
          collapsable={false}
        />
      </GestureDetector>

      {/* Overlay sombre */}
      <Animated.View
        style={[
          styles.overlay,
          overlayStyle,
        ]}
        pointerEvents="box-none"
      />

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { backgroundColor: theme.colors.backgroundSecondary },
          bottomSheetStyle,
          { paddingBottom: insets.bottom },
        ]}
        {...panResponder.panHandlers}
        collapsable={false}
      >
        {/* Handle (barre de glissement) */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: theme.colors.textSecondary + '40' }]} />
        </View>

        {/* Contenu du calendrier */}
        <View style={styles.content}>
          <HijriCalendarContent scrollY={scrollY} />
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  swipeUpZone: {
    position: 'absolute',
    width: '100%',
    zIndex: 1, // zIndex réduit pour ne pas bloquer les icônes
    backgroundColor: 'transparent', // Zone invisible pour détecter le swipe up
    // Important: cette zone couvre tout l'écran pour détecter les swipes depuis n'importe où
    // Mais avec pointerEvents: 'box-none', les clics passent à travers
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
  },
  bottomSheet: {
    position: 'absolute',
    height: BOTTOM_SHEET_HEIGHT,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    bottom: 0,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
