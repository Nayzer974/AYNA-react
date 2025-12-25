import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type MainTabsParamList = {
  Home: undefined;
  Journal: undefined;
  Quran: undefined;
  Profile: undefined;
};

type MainTabsNavigationProp = BottomTabNavigationProp<MainTabsParamList>;

interface SwipeableTabWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper pour ajouter la fonctionnalité de swipe entre les tabs
 * Utilise PanResponder natif pour éviter les conflits avec react-native-gesture-handler
 */
export function SwipeableTabWrapper({ children }: SwipeableTabWrapperProps) {
  const navigation = useNavigation<MainTabsNavigationProp>();
  const route = useRoute();
  
  // Ordre des tabs pour la navigation par swipe
  const tabOrder = ['Home', 'Journal', 'Quran', 'Profile'];

  // Obtenir le nom de la route actuelle
  const currentRouteName = route.name;

  // Référence pour stocker la position de départ
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);

  // Fonction pour naviguer
  const navigateToTab = useCallback((tabName: string) => {
    try {
      navigation.navigate(tabName as any);
    } catch (error) {
      console.warn('Erreur lors de la navigation:', error);
    }
  }, [navigation]);

  // PanResponder pour détecter les swipes horizontaux
  const panResponder = useRef(
    PanResponder.create({
      // Démarrer le gesture si le mouvement est principalement horizontal
      onStartShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        return false; // Ne pas capturer au démarrage
      },
      onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Ne capturer que si le mouvement est principalement horizontal
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Enregistrer la position de départ
        startX.current = evt.nativeEvent.pageX;
        startY.current = evt.nativeEvent.pageY;
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Ne rien faire pendant le mouvement, laisser les ScrollView fonctionner
      },
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { dx, vx } = gestureState;
        const swipeThreshold = 80; // Minimum de pixels pour déclencher la navigation
        const velocityThreshold = 0.5; // Vitesse minimale

        // Vérifier si le swipe est assez fort ou assez rapide
        const isStrongSwipe = Math.abs(dx) > swipeThreshold;
        const isFastSwipe = Math.abs(vx) > velocityThreshold && Math.abs(dx) > 40;

        if ((isStrongSwipe || isFastSwipe) && currentRouteName) {
          const currentTabIndex = tabOrder.indexOf(currentRouteName);

          if (currentTabIndex !== -1) {
            if (dx > 0) {
              // Swipe vers la droite (←) : onglet précédent
              if (currentTabIndex > 0) {
                const previousTab = tabOrder[currentTabIndex - 1];
                navigateToTab(previousTab);
              }
            } else {
              // Swipe vers la gauche (→) : onglet suivant
              if (currentTabIndex < tabOrder.length - 1) {
                const nextTab = tabOrder[currentTabIndex + 1];
                navigateToTab(nextTab);
              }
            }
          }
        }
      },
    })
  ).current;

  return (
    <View 
      style={styles.container} 
      collapsable={false}
      {...panResponder.panHandlers}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

