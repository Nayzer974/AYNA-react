import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, InteractionManager, ScrollView, Platform, PanResponder } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useDimensions } from '@/hooks/useDimensions';
import { useResponsive } from '@/hooks/useResponsive';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDhikrOfDay, getMultipleDhikr } from '@/services/dhikr';
import { Carousel } from '@/components/Carousel';
import { getQiblaByCoords } from '@/services/hijri';
import { MessageCircle } from 'lucide-react-native';
// Notifications désactivées - expo-notifications supprimé
import { analytics } from '@/analytics';
import Svg, { Circle, Path, Line, Ellipse, G, Rect } from 'react-native-svg';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, withRepeat, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { EmailVerificationModal } from '@/components/EmailVerificationModal';
import { PrayerTimesCardSlide } from '@/components/PrayerTimesCardSlide';
import { CalendrierBottomSheet } from '@/components/CalendrierBottomSheet';
import { useEmailVerificationReminder } from '@/hooks/useEmailVerificationReminder';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { storage } from '@/utils/storage';
import { usePulse } from '@/hooks/usePulse';
import { SPRING_CONFIGS, ANIMATION_DURATION } from '@/utils/animations';
import { getShortcuts, type Shortcut } from '@/services/shortcuts';
import { Skeleton } from '@/components/ui';
import { createAccessibilityProps } from '@/utils/accessibility';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useFadeIn } from '@/hooks/useFadeIn';
import { useSlideIn } from '@/hooks/useSlideIn';
import { usePressScale } from '@/hooks/useScale';


/**
 * Page d'accueil principale
 * 
 * Affiche :
 * - Logo AYNA et "99 noms d'Allah" en haut
 * - Salutation (As-salâmu âlaykum) avec nom d'utilisateur
 * - Carte "Dhikr du jour"
 * - Icônes circulaires pour navigation (AYNA au centre, 6 modules autour)
 */
export function Home() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useDimensions();
  const { isTablet, adaptiveValue } = useResponsive();
  
  const isAuthenticated = Boolean(user?.id);
  const hasName = Boolean(isAuthenticated && user?.name && user.name.trim().length > 0);
  
  const [dhikrList, setDhikrList] = useState<Array<{ arabic: string; translation: string }>>([]);
  const [currentDhikrIndex, setCurrentDhikrIndex] = useState(0);
  const [isLoadingDhikr, setIsLoadingDhikr] = useState(true);
  const [buttonSize, setButtonSize] = useState(56);
  const [containerSize, setContainerSize] = useState(300);
  const [radius, setRadius] = useState(100);
  const [qibla, setQibla] = useState<number | null>(null);
  const [sensorQibla, setSensorQibla] = useState<number | null>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  
  // Shared value pour le scroll (pour le bottom sheet)
  const scrollY = useSharedValue(0);
  
  // Référence pour ouvrir le calendrier depuis la page
  const openCalendarRef = useRef<(() => void) | null>(null);
  
  // PanResponder pour détecter le swipe vers le haut sur la page d'accueil
  const swipeUpResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Détecter uniquement les swipes vers le haut (dy négatif)
        return gestureState.dy < -10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Si le swipe vers le haut est assez fort, ouvrir le calendrier
        if (gestureState.dy < -20 || gestureState.vy < -0.5) {
          if (openCalendarRef.current) {
            openCalendarRef.current();
          }
        }
      },
    })
  ).current;

  // Animation pulse pour le bouton AYNA central - optimisée pour performance
  const centerButtonPulse = usePulse({ minScale: 0.98, maxScale: 1.02, duration: 2000, repeat: true });
  
  // Haptic feedback pour les interactions
  const haptic = useHapticFeedback();
  
  // Animations d'entrée staggerées pour rendre la page plus vivante
  const logoFadeIn = useFadeIn({ delay: 0, duration: ANIMATION_DURATION.NORMAL });
  const greetingSlideIn = useSlideIn({ direction: 'down', delay: 100, useSpring: true });
  const cardSlideIn = useSlideIn({ direction: 'up', delay: 200, useSpring: true });
  const iconsFadeIn = useFadeIn({ delay: 300, duration: ANIMATION_DURATION.SLOW });
  
  // Animation scale pour les boutons au press (6 boutons périphériques)
  const centerButtonScale = usePressScale();
  const peripheralButtonScales = Array.from({ length: 6 }, () => usePressScale());

  // Calculer la taille des boutons et le rayon selon la taille de l'écran (mémorisé)
  const { buttonSize: calculatedButtonSize, containerSize: calculatedContainerSize, radius: calculatedRadius } = useMemo(() => {
    const screenHeight = SCREEN_HEIGHT;
    const screenWidth = SCREEN_WIDTH;
    
    // Calculer l'espace disponible en tenant compte de tous les éléments
    // SafeArea top: ~44px, Logo: ~80px, Salutation: ~60px, Carte: ~200px, Marges: ~40px
    const reservedSpace = 424;
    const availableHeight = screenHeight - reservedSpace;
    
    // Taille des boutons adaptative selon l'espace disponible
    let newButtonSize = 64;
    if (availableHeight > 400) {
      newButtonSize = 72;
    } else if (availableHeight > 320) {
      newButtonSize = 64;
    } else if (availableHeight > 250) {
      newButtonSize = 56;
    } else {
      newButtonSize = 48;
    }
    
    // Taille du conteneur adaptée à l'espace disponible
    const maxContainerByHeight = availableHeight * 0.95;
    const maxContainerByWidth = screenWidth * 0.9;
    const maxContainerSize = Math.min(maxContainerByHeight, maxContainerByWidth);
    const minContainerSize = 220;
    const calculatedContainerSize = Math.max(minContainerSize, Math.min(maxContainerSize, 380));
    
    // Rayon pour les boutons périphériques
    const calculatedRadius = (calculatedContainerSize / 2) - (newButtonSize / 2) - 4;
    
    return {
      buttonSize: newButtonSize,
      containerSize: calculatedContainerSize,
      radius: Math.max(80, calculatedRadius)
    };
  }, [SCREEN_WIDTH, SCREEN_HEIGHT]);

  useEffect(() => {
    setButtonSize(calculatedButtonSize);
    setContainerSize(calculatedContainerSize);
    setRadius(calculatedRadius);
  }, [calculatedButtonSize, calculatedContainerSize, calculatedRadius]);

  // Utiliser le hook pour gérer le rappel quotidien de vérification d'email
  const { shouldShowReminder, markReminderShown } = useEmailVerificationReminder();

  // Afficher le popup si le hook indique qu'on doit le montrer
  useEffect(() => {
    if (shouldShowReminder) {
      setShowEmailVerificationModal(true);
    }
  }, [shouldShowReminder]);

  // Marquer le rappel comme affiché quand l'utilisateur ferme le popup
  const handleCloseEmailModal = useCallback(() => {
    setShowEmailVerificationModal(false);
    markReminderShown();
  }, [markReminderShown]);

  // Charger 3 dhikr pour le carrousel (différé après interactions)
  useEffect(() => {
    // Afficher des valeurs par défaut immédiatement
    setDhikrList([
      { arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', translation: "Il n'y a de divinité qu'Allah" },
      { arabic: 'سُبْحَانَ اللَّهِ', translation: 'Gloire à Allah' },
      { arabic: 'الْحَمْدُ لِلَّهِ', translation: 'Louange à Allah' }
    ]);
    
    // Charger immédiatement pour éviter les latences
    const loadDhikr = async () => {
      try {
        setIsLoadingDhikr(true);
        const dhikrArray = await getMultipleDhikr(3, i18n.language || 'fr');
        
        if (dhikrArray && dhikrArray.length > 0) {
          const formatted = dhikrArray.map(d => ({
            arabic: d.text || '',
            translation: d.translation || ''
          }));
          setDhikrList(formatted);
        }
      } catch (error) {
        // Erreur silencieuse en production
      } finally {
        setIsLoadingDhikr(false);
      }
    };
    
    loadDhikr();
  }, []);


  // Charger la direction Qibla (chargement différé pour ne pas bloquer l'UI)
  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    
    // Utiliser un timeout court au lieu de InteractionManager pour éviter les latences
    timer = setTimeout(() => {
      const loadQibla = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return;

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          const { data } = await getQiblaByCoords(
            location.coords.latitude,
            location.coords.longitude
          );
          
          if (mounted && data?.direction) {
            setQibla(data.direction);
          }
        } catch (error) {
          // Erreur silencieuse en production
        }
      };

      loadQibla();
    }, 100);

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Démarrer le tracking du magnétomètre pour sensorQibla
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let mounted = true;

    const startTracking = async () => {
      try {
        const isAvailable = await Magnetometer.isAvailableAsync();
        if (!isAvailable) return;

        await Magnetometer.requestPermissionsAsync();
        Magnetometer.setUpdateInterval(100);

        subscription = Magnetometer.addListener((data: { x: number; y: number; z: number }) => {
          if (!mounted) return;
          
          const { x, y } = data;
          let heading = Math.atan2(y, x) * (180 / Math.PI);
          heading = (heading + 360) % 360;
          
          setSensorQibla(heading);
        });
      } catch (error) {
        // Erreur silencieuse en production
      }
    };

    startTracking();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // ✅ OPTIMISÉ : Mémoriser handleLogoPress avec haptic feedback
  const handleLogoPress = useCallback(() => {
    haptic.light();
    navigation.navigate('AsmaUlHusna' as never);
  }, [navigation, haptic]);

  // Configuration des nœuds avec leurs angles (0° = haut, sens horaire) - mémorisé
  const nodes = useMemo(() => [
    { name: t('home.modules.baytAnNur'), angle: 0, route: 'BaytAnNur', icon: 'baytnur' },
    { name: t('home.modules.sabilanur'), angle: 300, route: 'Sabilanur', icon: 'sabilanur' },
    { name: t('home.modules.ummayna'), angle: 60, route: 'UmmAyna', icon: 'ummayna' },
    { name: t('home.modules.nurShifa'), angle: 120, route: 'NurShifa', icon: 'nurshifa' },
    { name: t('home.modules.salat'), angle: 180, route: null, icon: 'salat', action: 'modal' },
    { name: t('home.modules.dairatAnNur'), angle: 240, route: 'DairatAnNur', icon: 'dairat' }
  ], [t]);

  // Fonction pour calculer la position depuis l'angle (en pixels) - mémorisée
  // Garantit que toutes les icônes (sauf Sabila'Nûr et Umm'Ayna) ont exactement la même distance du centre
  // Bayt An Nûr (0°) et Salât (180°) doivent avoir exactement la même distance d'AYNA
  const getPosition = useCallback((angleDeg: number) => {
    // Convertir angle en radians : 0° = haut, donc soustraire 90° pour aligner avec math standard
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    
    // Centre du conteneur en pixels - exactement au centre
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;
    
    // Rayon de base en pixels - utilisé pour Bayt An Nûr (0°), Nur & Shifa (120°), Salât (180°), Da'Irat (240°)
    // Ce rayon garantit EXACTEMENT la même distance du centre pour toutes ces icônes
    let radiusPx = radius;
    
    // Augmenter le rayon pour Sabila'Nûr (300°) et Umm'Ayna (60°) pour les rapprocher des côtés
    if (angleDeg === 300 || angleDeg === 60) {
      radiusPx = radius * 1.35;
      // Limiter pour éviter de sortir du conteneur
      radiusPx = Math.min(radiusPx, (containerSize / 2) * 0.9);
    }
    
    // Calculer la position en pixels depuis le centre avec le rayon uniforme
    // Pour Bayt An Nûr (0°) et Salât (180°), le rayon est identique, donc la distance est identique
    let xPx = centerX + (radiusPx * Math.cos(angleRad));
    let yPx = centerY + (radiusPx * Math.sin(angleRad));
    
    // Pour Salât (180°), baisser légèrement l'icône
    if (angleDeg === 180) {
      const offsetY = radiusPx * 0.1; // 10% du rayon vers le bas
      yPx = yPx + offsetY;
    }
    
    // Convertir en pourcentage pour le positionnement absolu
    const x = (xPx / containerSize) * 100;
    const y = (yPx / containerSize) * 100;
    
    // Clamp les valeurs pour garantir qu'elles restent dans [0, 100]
    return { 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)),
      // Retourner aussi les valeurs en pixels pour vérification
      xPx,
      yPx,
      radiusPx
    };
  }, [containerSize, radius]);

  // ✅ OPTIMISÉ : Composants SVG mémorisés AVANT le composant Home
  const BaytAnNurIcon = React.memo(({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x="14" y="8" width="4" height="12" stroke="white" strokeWidth="2" fill="none" rx="1" />
      <Line x1="16" y1="8" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 6 Q15 4 16 2 Q17 4 16 6" stroke="white" strokeWidth="2" fill="white" fillOpacity="0.3" />
      <Ellipse cx="16" cy="20" rx="3" ry="1.5" stroke="white" strokeWidth="2" fill="none" />
      {[...Array(6)].map((_, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const x1 = 16 + 10 * Math.cos(angle);
        const y1 = 14 + 10 * Math.sin(angle);
        const x2 = 16 + 12 * Math.cos(angle);
        const y2 = 14 + 12 * Math.sin(angle);
        return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1" opacity="0.6" />;
      })}
    </Svg>
  ));

  const SabilanurIcon = React.memo(({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x="8" y="8" width="16" height="16" stroke="white" strokeWidth="2" fill="none" />
      <Rect x="12" y="12" width="8" height="8" stroke="white" strokeWidth="2" fill="none" />
    </Svg>
  ));

  const UmmAynaIcon = React.memo(({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none" />
      <Circle cx="20" cy="12" r="4" stroke="white" strokeWidth="2" fill="none" />
      <Path d="M8 22C8 19 10 17 12 17C14 17 16 19 16 22" stroke="white" strokeWidth="2" fill="none" />
      <Path d="M16 22C16 19 18 17 20 17C22 17 24 19 24 22" stroke="white" strokeWidth="2" fill="none" />
    </Svg>
  ));

  const NurShifaIcon = React.memo(({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M16 6 L20 14 L28 16 L20 18 L16 26 L12 18 L4 16 L12 14 Z" stroke="white" strokeWidth="2" fill="none" />
    </Svg>
  ));

  const DairatIcon = React.memo(({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2" fill="none" />
      <Circle cx="16" cy="16" r="6" stroke="white" strokeWidth="2" fill="none" />
      <Circle cx="16" cy="16" r="2" fill="white" />
    </Svg>
  ));

  // ✅ OPTIMISÉ : SalatIcon avec comparaison personnalisée
  const SalatIcon = React.memo(({ size, angle }: { size: number; angle: number }) => {
    const { user } = useUser();
    const currentTheme = getTheme(user?.theme || 'default');
    
    const rotation = useSharedValue(angle);
    
    useEffect(() => {
      rotation.value = withTiming(angle, { duration: 100 });
    }, [angle, rotation]);
    
    const animatedStyle = useAnimatedStyle(() => {
      'worklet'; // ✅ Forcer worklet pour performance
      return {
        transform: [{ rotate: `${rotation.value}deg` }],
      };
    });

    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="10" stroke="white" opacity="0.2" strokeWidth="2" fill="none" />
        </Svg>
        <Animated.View style={[{ position: 'absolute', width: size, height: size, justifyContent: 'center', alignItems: 'center' }, animatedStyle]}>
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <G x="12" y="12">
              <Path d="M0 -8 L2 0 L0 -2 L-2 0 Z" fill={currentTheme.colors.accent} />
            </G>
          </Svg>
        </Animated.View>
      </View>
    );
  }, (prevProps, nextProps) => {
    // Comparaison personnalisée pour éviter les re-renders inutiles
    return prevProps.size === nextProps.size && 
           Math.abs(prevProps.angle - nextProps.angle) < 1; // Tolérance de 1 degré
  });

  // ✅ OPTIMISÉ : Mémoriser renderIcon
  const renderIcon = useCallback((iconType: string, size: number) => {
    switch (iconType) {
      case 'baytnur':
        return <BaytAnNurIcon size={size} />;
      case 'sabilanur':
        return <SabilanurIcon size={size} />;
      case 'ummayna':
        return <UmmAynaIcon size={size} />;
      case 'nurshifa':
        return <NurShifaIcon size={size} />;
      case 'salat':
        return <SalatIcon size={size} angle={sensorQibla ?? qibla ?? 0} />;
      case 'dairat':
        return <DairatIcon size={size} />;
      default:
        return null;
    }
  }, [sensorQibla, qibla]);

  return (
    <View 
      style={styles.wrapper}
      {...swipeUpResponder.panHandlers}
    >
      {/* Background avec gradient et étoiles */}
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={50} minSize={1} maxSize={2} themeId={user?.theme} />
      
      <SafeAreaView 
        style={styles.container}
        edges={['top', 'bottom']}
      >
        <View
          style={styles.scrollView}
      >
          <View style={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo AYNA et "99 noms d'Allah" en haut */}
          <Animated.View style={[styles.logoSection, logoFadeIn.animatedStyle]}>
            <Pressable
              onPress={handleLogoPress}
              style={({ pressed }) => [
                styles.logoContainer,
                { borderColor: theme.colors.accent },
                pressed && styles.logoPressed
              ]}
            >
              <Image
                source={require('../../assets/images/ayna.png')}
                style={styles.logo}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={200}
                priority="high"
                recyclingKey="ayna-logo"
              />
            </Pressable>
            <Text style={[styles.asmaText, { color: theme.colors.text }]}>
              {t('home.asma99')}
            </Text>
          </Animated.View>

          {/* Salutation */}
          <Animated.View style={[styles.greetingSection, greetingSlideIn.animatedStyle]}>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              {t('home.greeting')}
            </Text>
            {hasName && (
              <Text 
                style={[styles.username, { color: theme.colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user!.name}
              </Text>
            )}
          </Animated.View>

          {/* Carte Dhikr Carrousel */}
          <Animated.View 
            style={[
              styles.card, 
              { backgroundColor: theme.colors.backgroundSecondary },
              cardSlideIn.animatedStyle
            ]}
          >
            {isLoadingDhikr ? (
              <View style={styles.dhikrContent}>
                <Skeleton width="80%" height={24} style={{ marginBottom: 8 }} />
                <Skeleton width="60%" height={16} />
              </View>
            ) : dhikrList.length > 0 ? (
              <Carousel
                data={dhikrList}
                renderItem={(item) => (
                  <View style={styles.dhikrContent}>
                    <Text style={[styles.dhikrArabic, { color: theme.colors.text }]}>
                      {item.arabic}
                    </Text>
                    {item.translation && i18n.language !== 'ar' && (
                      <Text style={[styles.dhikrTranslation, { color: theme.colors.textSecondary }]}>
                        {item.translation}
                      </Text>
                    )}
                  </View>
                )}
                itemWidth={Math.min(SCREEN_WIDTH - 64, 476)}
                onIndexChange={setCurrentDhikrIndex}
                onItemPress={(item) => {
                  // Naviguer vers DairatAnNur avec le dhikr sélectionné
                  (navigation as any).navigate('DairatAnNur', {
                    createSession: true,
                    dhikrText: item.arabic,
                    targetCount: 99,
                  });
                }}
                showIndicators={true}
                indicatorActiveColor={theme.colors.accent}
                indicatorInactiveColor="rgba(255, 255, 255, 0.3)"
              />
            ) : null}
          </Animated.View>


          {/* Icônes circulaires - Layout optimisé avec centrage parfait */}
          <Animated.View 
            style={[
              styles.iconsContainer, 
              { width: containerSize, height: containerSize },
              iconsFadeIn.animatedStyle
            ]} 
            pointerEvents="box-none"
          >
            {/* Bouton central AYNA - Centré exactement au centre du conteneur */}
            <Animated.View 
              style={[
                styles.centerButtonContainer,
                {
                  marginLeft: -(buttonSize * 1.3) / 2,
                  marginTop: -(buttonSize * 1.3) / 2, // Centrer parfaitement
                }
              ]}
            >
              <Animated.View style={centerButtonPulse.animatedStyle} pointerEvents="box-none">
                <Animated.View style={centerButtonScale.animatedStyle}>
                  <TouchableOpacity
                    onPress={useCallback(() => {
                      haptic.medium();
                      navigation.navigate('Chat' as never);
                    }, [navigation, haptic])}
                    onPressIn={centerButtonScale.handlePressIn}
                    onPressOut={centerButtonScale.handlePressOut}
                    activeOpacity={0.7}
                    style={[
                      styles.centerButton,
                      {
                        width: buttonSize * 1.3,
                        height: buttonSize * 1.3,
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                    ]}
                  >
                    <MessageCircle 
                      size={buttonSize * 0.5} 
                      color="white" 
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
              <Text style={[styles.centerLabel, { color: theme.colors.text }]}>
                AYNA
              </Text>
            </Animated.View>

            {/* Boutons périphériques - Positionnés avec pourcentages pour centrage parfait */}
            {nodes.map((node, index) => {
              const { x, y } = getPosition(node.angle);
              // Convertir les pourcentages en pixels et centrer parfaitement
              const leftPx = (x / 100) * containerSize - buttonSize / 2;
              const topPx = (y / 100) * containerSize - buttonSize / 2;
              // L'icône Salât doit toujours être au-dessus de la navbar
              const isSalat = node.icon === 'salat';
              
              // ✅ OPTIMISÉ : handlePress mémorisé avec toutes les dépendances et haptic feedback
              const buttonScale = peripheralButtonScales[index];
              const handlePress = useCallback(() => {
                haptic.light();
                if (node.action === 'modal') {
                  setShowPrayerModal(true);
                } else if (node.route) {
                  navigation.navigate(node.route as never);
                }
              }, [node.action, node.route, navigation, haptic]);
              
              return (
                <View
                  key={node.name}
                  style={[
                    styles.peripheralButtonContainer,
                    {
                      left: leftPx,
                      top: topPx,
                      // zIndex élevé pour être au-dessus de la zone de swipe du calendrier
                      zIndex: isSalat ? 100 : 10,
                      elevation: isSalat ? 100 : 10,
                    }
                  ]}
                  pointerEvents="box-none"
                >
                  <Animated.View style={buttonScale.animatedStyle}>
                    <TouchableOpacity
                      onPress={handlePress}
                      onPressIn={buttonScale.handlePressIn}
                      onPressOut={buttonScale.handlePressOut}
                      activeOpacity={0.7}
                      style={[
                        styles.peripheralButton,
                        {
                          width: buttonSize,
                          height: buttonSize,
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                      ]}
                      {...createAccessibilityProps(
                        node.name,
                        `Double-tap pour ${node.action === 'modal' ? 'ouvrir' : 'naviguer vers'} ${node.name}`,
                        'button'
                      )}
                    >
                      {renderIcon(node.icon, buttonSize * 0.5)}
                    </TouchableOpacity>
                  </Animated.View>
                  <Text 
                    style={[
                      styles.peripheralLabel, 
                      { color: theme.colors.text },
                      isSalat && styles.salatLabel
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {node.name}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Sheet Calendrier */}
      <CalendrierBottomSheet 
        scrollY={scrollY} 
        onSwipeUp={(openFn) => {
          openCalendarRef.current = openFn;
        }}
      />

      {/* Carte des heures de prière qui slide depuis le bas */}
      <PrayerTimesCardSlide
        visible={showPrayerModal}
        onClose={() => setShowPrayerModal(false)}
      />

      {/* Modal de vérification d'email */}
      <EmailVerificationModal
        visible={showEmailVerificationModal}
        onClose={handleCloseEmailModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'visible',
  },
  logoPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  logo: {
    width: 54,
    height: 54,
  },
  asmaText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  greetingSection: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 4,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
    // Ombres simplifiées pour Android - elevation réduite
    elevation: 2, // Réduit de 4 à 2 pour alléger le GPU
  },
  dhikrContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  dhikrTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 10,
  },
  dhikrLoader: {
    marginVertical: 12,
  },
  dhikrArabic: {
    fontSize: 22,
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  dhikrTranslation: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 0,
  },
  iconsContainer: {
    position: 'relative',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    maxHeight: 400,
  },
  centerButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // Au-dessus de la zone de swipe
    elevation: 10,
  },
  centerButton: {
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  centerLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 14.4,
  },
  peripheralButtonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // Centrer parfaitement en utilisant transform (simulé avec margin négatif)
    // Le margin sera calculé dynamiquement dans le style inline
  },
  peripheralButton: {
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  peripheralLabel: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'System',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 12,
    maxWidth: 70,
  },
  salatLabel: {
    marginBottom: 80, // Espace supplémentaire pour éviter que le texte soit caché par la navbar
  },
});
