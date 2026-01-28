/**
 * CustomTabBar
 * 
 * Tab bar personnalisée avec blur effect et indicateur actif animé
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { RippleTabIcon, RippleTabIconRef } from './RippleTabIcon';
import { SPRING_CONFIGS } from '@/utils/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_WIDTH = SCREEN_WIDTH - 32; // Marges latérales de 16px
const TAB_COUNT = 5;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT; // 5 tabs

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const activeIndex = state.index;

  // Refs pour les icônes ripple
  const iconRefs = useRef<Map<string, React.RefObject<RippleTabIconRef>>>(new Map());
  // Debouncing pour éviter les double-clics
  const lastPressTime = useRef(0);
  
  // Positions réelles des tabs (mesurées avec onLayout)
  const [tabPositions, setTabPositions] = useState<number[]>([]);
  const [measuredTabWidth, setMeasuredTabWidth] = useState(0);
  const tabsContainerRef = useRef<View>(null);
  
  // Animation de la bulle qui se déplace
  const bubbleTranslateX = useSharedValue(0);
  const bubbleOpacity = useSharedValue(1);
  
  // Style animé pour la bulle
  const animatedBubbleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: bubbleTranslateX.value },
        { translateY: -28 }, // Centrer verticalement (moitié de la hauteur de 56px)
      ],
      opacity: bubbleOpacity.value,
    };
  });
  
  useEffect(() => {
    if (tabPositions.length > activeIndex && tabPositions[activeIndex] > 0 && measuredTabWidth > 0) {
      const tabCenterX = tabPositions[activeIndex];
      const bubbleWidth = measuredTabWidth * 0.75;
      // La bulle doit être centrée sous l'icône
      // tabCenterX est le centre du tab, on soustrait la moitié de la largeur de la bulle
      const targetX = tabCenterX - bubbleWidth / 2;
      
      bubbleTranslateX.value = withSpring(targetX, {
        damping: 25,
        stiffness: 120,
        mass: 0.8,
      });
    }
  }, [activeIndex, tabPositions, measuredTabWidth, bubbleTranslateX]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Blur effect background */}
      <BlurView
        intensity={20}
        tint="dark"
        style={[
          styles.blurContainer,
          {
            backgroundColor: theme.colors.backgroundSecondary + 'E6', // 90% opacity pour fallback
          },
        ]}
      >
        {/* Bulle animée qui se déplace entre les onglets */}
        {measuredTabWidth > 0 && (
          <View style={styles.indicatorContainer} pointerEvents="none">
            <Animated.View
              style={[
                styles.movingBubble,
                {
                  backgroundColor: theme.colors.accent + '20',
                  borderColor: theme.colors.accent,
                  width: measuredTabWidth * 0.75,
                },
                animatedBubbleStyle,
              ]}
              pointerEvents="none"
            />
          </View>
        )}

        {/* Tabs */}
        <View 
          ref={tabsContainerRef}
          style={styles.tabsContainer}
          onLayout={(event: LayoutChangeEvent) => {
            const { width, x } = event.nativeEvent.layout;
            if (width > 0) {
              // Calculer les positions basées sur la largeur réelle
              // Les positions sont calculées depuis le début du conteneur tabsContainer
              const tabWidth = width / TAB_COUNT;
              // Les positions doivent être ajustées avec le décalage x de tabsContainer
              // pour être relatives au blurContainer (où se trouve indicatorContainer)
              const positions = Array.from({ length: TAB_COUNT }, (_, i) => 
                x + i * tabWidth + tabWidth / 2
              );
              
              // Sauvegarder la largeur mesurée
              setMeasuredTabWidth(tabWidth);
              
              // Toujours mettre à jour les positions au cas où la taille change
              setTabPositions(positions);
              
              // Initialiser ou mettre à jour la position de la bulle
              if (positions.length > activeIndex && positions[activeIndex] > 0) {
                const tabCenterX = positions[activeIndex];
                const bubbleWidth = tabWidth * 0.75;
                // La position est maintenant relative au blurContainer grâce à l'ajustement avec x
                bubbleTranslateX.value = tabCenterX - bubbleWidth / 2;
              }
            }
          }}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const now = Date.now();
              // Debouncing : ignorer les clics trop rapides (< 200ms)
              if (now - lastPressTime.current < 200) {
                return;
              }
              lastPressTime.current = now;
              
              // Haptic feedback (désactivé pour améliorer les performances)
              // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            // Créer ou récupérer la ref pour cette icône
            if (!iconRefs.current.has(route.key)) {
              iconRefs.current.set(route.key, React.createRef<RippleTabIconRef>());
            }
            const iconRef = iconRefs.current.get(route.key)!;

            const iconElement = options.tabBarIcon
              ? options.tabBarIcon({
                  focused: isFocused,
                  color: isFocused ? theme.colors.accent : theme.colors.textSecondary,
                  size: 24,
                })
              : null;

            const enhancedOnPress = () => {
              // Déclencher l'effet ripple
              if (iconRef?.current) {
                iconRef.current.triggerRipple();
              }
              onPress();
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={enhancedOnPress}
                onLongPress={onLongPress}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  {iconElement && (
                    <RippleTabIcon
                      ref={iconRef}
                      icon={iconElement}
                      focused={isFocused}
                      tabName={route.name}
                    />
                  )}
                  {typeof label === 'string' && (
                    <Text
                      style={[
                        styles.label,
                        {
                          color: isFocused
                            ? theme.colors.accent
                            : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 70,
  },
  blurContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'visible', // Permettre au pill de dépasser légèrement
  },
  indicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    overflow: 'visible', // Permettre au pill de dépasser légèrement si nécessaire
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    zIndex: 1, // Au-dessus de la bulle
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'System',
    marginTop: -6, // Négatif pour rapprocher encore plus le texte de l'icône
  },
  movingBubble: {
    position: 'absolute',
    height: 56, // Hauteur légèrement augmentée pour éviter que le texte soit coupé
    borderRadius: 28,
    borderWidth: 1.5,
    top: '50%',
    left: 0, // Position de base, sera animée par translateX
    // translateY sera appliqué dans animatedBubbleStyle
  },
  activeTabBubble: {
    position: 'absolute',
    width: '75%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignSelf: 'center',
    top: '50%',
    // transform sera appliqué inline pour l'animation
  },
});

