import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, InteractionManager, ScrollView, Platform, PanResponder } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { TouchableOpacityWithSound } from '@/components/ui/TouchableOpacityWithSound';
import { useDimensions } from '@/hooks/useDimensions';
import { useResponsive } from '@/hooks/useResponsive';
import { useHomeLayout } from '@/hooks/useHomeLayout';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDhikrOfDay, getMultipleDhikr } from '@/services/content/dhikr';
import { getActiveDhikrSessions } from '@/services/content/dhikrSessions';
import { getCurrentDuahIndex } from '@/services/system/autoWorldSessionManager';
import { getAuthenticDhikrByIndex } from '@/data/authenticDhikr';
import { getTodayPrayerTimes } from '@/services/content/PrayerTimeManager';
import { dhikrDatabase } from '@/data/dhikrDatabase';
import { getDuahRabanahByIndex } from '@/data/duahRabanah';
import { Carousel } from '@/components/Carousel';
import { getQiblaByCoords } from '@/services/content/prayerServices';
import { MessageCircle, Share2, Circle as CircleIcon, X } from 'lucide-react-native';
import { Share, Modal } from 'react-native';
// Notifications désactivées - expo-notifications supprimé
import { analytics } from '@/analytics';
import Svg, { Circle, Path, Line, Ellipse, G, Rect } from 'react-native-svg';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, withRepeat, withSequence, FadeIn, SlideInDown, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { EmailVerificationModal } from '@/components/EmailVerificationModal';
import { PrayerTimesCardSlide } from '@/components/PrayerTimesCardSlide';

import { SalatNabiModal } from '@/components/SalatNabiModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmailVerificationReminder } from '@/hooks/useEmailVerificationReminder';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { storage } from '@/utils/storage';
import { usePulse } from '@/hooks/usePulse';
import { SPRING_CONFIGS } from '@/utils/animations';
import { getShortcuts, type Shortcut } from '@/services/system/shortcuts';
import { Skeleton } from '@/components/ui';
import { createAccessibilityProps } from '@/utils/accessibility';


/**
 * Page d'accueil principale
 * 
 * Affiche :
 * - Logo AYNA et "99 noms d'Allah" en haut
 * - Salutation (As-salâmu âlaykum) avec nom d'utilisateur
 * - Carte "Dhikr du jour"
 * - Icônes circulaires pour navigation (AYNA au centre, 6 modules autour)
 */
// Refreshed by fix script
export function Home() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useDimensions();
  const { isTablet, adaptiveValue } = useResponsive();

  const isAuthenticated = Boolean(user?.id);
  const hasName = Boolean(isAuthenticated && user?.name && user.name.trim().length > 0);

  const [dhikrList, setDhikrList] = useState<Array<{ arabic: string; translation: string; type?: 'dua' | 'dhikr' }>>([]);
  const [currentDhikrIndex, setCurrentDhikrIndex] = useState(0);

  const [isLoadingDhikr, setIsLoadingDhikr] = useState(true);

  // Utiliser le hook layout optimisé
  const { buttonSize, containerSize, radius, getPosition } = useHomeLayout();

  const [qibla, setQibla] = useState<number | null>(null);
  const [sensorQibla, setSensorQibla] = useState<number | null>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [showSalatNabiModal, setShowSalatNabiModal] = useState(false);



  // Swipe responder removed



  // Animation pulse pour le bouton AYNA central
  const centerButtonPulse = usePulse({ minScale: 0.95, maxScale: 1.05, duration: 1500, repeat: true });

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

  // Charger 1 dua rabana et 1 dhikr par jour
  useEffect(() => {
    // Afficher des valeurs par défaut immédiatement
    const currentDayIndex = getCurrentDuahIndex();
    const duahRabanah = getDuahRabanahByIndex(currentDayIndex);
    const dhikr = dhikrDatabase[currentDayIndex % dhikrDatabase.length];

    const initialList = [
      {
        arabic: duahRabanah.arabic,
        translation: duahRabanah.translation,
        type: 'dua' as const
      },
      {
        arabic: dhikr.arabic,
        translation: dhikr.translation,
        type: 'dhikr' as const
      }
    ];
    setDhikrList(initialList);

    InteractionManager.runAfterInteractions(() => {
      const loadDailyContent = async () => {
        try {
          setIsLoadingDhikr(true);

          // Vérifier si on est jeudi après isha jusqu'à vendredi après duhr
          const now = new Date();
          const dayOfWeek = now.getDay(); // 0 = dimanche, 4 = jeudi, 5 = vendredi
          let isSalatNabiTime = false;

          if (dayOfWeek === 4 || dayOfWeek === 5) {
            try {
              const timings = await getTodayPrayerTimes();
              if (timings) {
                const ishaTime = timings.Isha;
                const duhrTime = timings.Dhuhr;
                const [ishaHours, ishaMinutes] = ishaTime.split(':').map(Number);
                const [duhrHours, duhrMinutes] = duhrTime.split(':').map(Number);
                const nowHours = now.getHours();
                const nowMinutes = now.getMinutes();
                const nowTotalMinutes = nowHours * 60 + nowMinutes;
                const ishaTotalMinutes = ishaHours * 60 + ishaMinutes;
                const duhrTotalMinutes = duhrHours * 60 + duhrMinutes;

                // Jeudi après isha
                if (dayOfWeek === 4 && nowTotalMinutes >= ishaTotalMinutes) {
                  isSalatNabiTime = true;
                }
                // Vendredi jusqu'à après duhr
                if (dayOfWeek === 5 && nowTotalMinutes <= duhrTotalMinutes) {
                  isSalatNabiTime = true;
                }
              }
            } catch (error) {
              // Erreur silencieuse
            }
          }

          // Vérifier et afficher le modal Salat nabi si nécessaire
          if (isSalatNabiTime) {
            try {
              // Créer une clé basée sur la période (jeudi soir ou vendredi matin)
              const periodKey = dayOfWeek === 4
                ? `salat_nabi_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_thursday`
                : `salat_nabi_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_friday`;

              const hasSeenThisPeriod = await AsyncStorage.getItem(periodKey);
              if (!hasSeenThisPeriod) {
                setShowSalatNabiModal(true);
              }
            } catch (error) {
              // Erreur silencieuse
            }
          }

          // Obtenir le dua rabana et le dhikr du jour
          const dayIndex = getCurrentDuahIndex();
          const dailyDuahRabanah = getDuahRabanahByIndex(dayIndex);
          const dailyDhikr = dhikrDatabase[dayIndex % dhikrDatabase.length];

          const dailyList = [
            {
              arabic: dailyDuahRabanah.arabic,
              translation: dailyDuahRabanah.translation,
              type: 'dua' as const
            },
            {
              arabic: dailyDhikr.arabic,
              translation: dailyDhikr.translation,
              type: 'dhikr' as const
            }
          ];

          setDhikrList(dailyList);
        } catch (error) {
          // Erreur silencieuse en production
        } finally {
          setIsLoadingDhikr(false);
        }
      };

      loadDailyContent();
    });
  }, []);


  // Charger la direction Qibla (différé après interactions)
  useEffect(() => {
    let mounted = true;

    InteractionManager.runAfterInteractions(() => {
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
    });

    return () => {
      mounted = false;
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

  // ✅ OPTIMISÉ : Mémoriser handleLogoPress
  const handleLogoPress = useCallback(() => {
    navigation.navigate('AsmaUlHusna' as never);
  }, [navigation]);

  // Configuration des nœuds avec leurs angles (0° = haut, sens horaire) - mémorisé
  const nodes = useMemo(() => [
    { name: t('home.modules.baytAnNur'), angle: 0, route: 'BaytAnNur', icon: 'baytnur' },
    { name: t('home.modules.sabilanur'), angle: 300, route: 'Sabilanur', icon: 'sabilanur' },
    { name: t('home.modules.ummayna'), angle: 60, route: 'UmmAyna', icon: 'ummayna' },
    { name: t('home.modules.nurShifa'), angle: 120, route: 'NurShifa', icon: 'nurshifa' },
    { name: t('home.modules.salat'), angle: 180, route: null, icon: 'salat', action: 'modal' },
    { name: t('home.modules.dairatAnNur'), angle: 240, route: 'DairatAnNur', icon: 'dairat' }
  ], [t]);



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
    <View style={styles.wrapper}>
      {/* Background avec gradient et étoiles - pointerEvents="none" pour ne pas bloquer les touches */}
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} themeId={user?.theme} />

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
              <View style={styles.logoSection}>
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
              </View>

              {/* Salutation */}
              <View style={styles.greetingSection}>
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
              </View>

              {/* Carte Dhikr Carrousel */}
              <Animated.View
                style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}
                entering={FadeIn.delay(500).duration(600)}
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
                        {item.type && (
                          <Text style={[styles.dhikrType, { color: theme.colors.accent, marginBottom: 8, fontSize: 12, fontWeight: '600' }]}>
                            {item.type === 'dua' ? "📖 Du'a Rabana" : '📿 Dhikr'}
                          </Text>
                        )}
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
                    onItemPress={() => {
                      // Naviguer vers DairatAnNur avec le dhikr sélectionné
                      const selectedDhikr = dhikrList[currentDhikrIndex];
                      if (selectedDhikr) {
                        // Formater le dhikr en JSON comme dans les sessions
                        const dhikrText = JSON.stringify({
                          arabic: selectedDhikr.arabic,
                          translation: selectedDhikr.translation,
                        });
                        (navigation as any).navigate('DairatAnNur', {
                          createSession: true,
                          dhikrText: dhikrText,
                          targetCount: 99,
                        });
                      }
                    }}
                    showIndicators={true}
                    indicatorActiveColor={theme.colors.accent}
                    indicatorInactiveColor="rgba(255, 255, 255, 0.3)"
                  />
                ) : null}
              </Animated.View>


              {/* Icônes circulaires - Layout optimisé avec centrage parfait */}
              <View style={[styles.iconsContainer, { width: containerSize, height: containerSize }]}>
                {/* Bouton central AYNA - Centré exactement au centre du conteneur */}
                <Animated.View
                  style={[
                    styles.centerButtonContainer,
                    {
                      marginLeft: -(buttonSize * 1.3) / 2,
                      marginTop: -(buttonSize * 1.3) / 2, // Centrer parfaitement
                    }
                  ]}
                  entering={FadeIn.delay(700).duration(600).springify()}
                >
                  <Animated.View style={centerButtonPulse.animatedStyle}>
                    <TouchableOpacityWithSound
                      onPress={useCallback(() => {
                        InteractionManager.runAfterInteractions(() => {
                          navigation.navigate('Chat' as never);
                        });
                      }, [navigation])}
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
                    </TouchableOpacityWithSound>
                  </Animated.View>
                  <Text style={[styles.centerLabel, { color: theme.colors.text }]}>
                    AYNA
                  </Text>
                </Animated.View>

                {/* Boutons périphériques - Positionnés avec pourcentages pour centrage parfait */}
                {nodes.map((node, index) => {
                  const { x, y } = getPosition(node.angle);
                  // Convertir les pourcentages en pixels et centrer parfaitement
                  let leftPx = (x / 100) * containerSize - buttonSize / 2;
                  let topPx = (y / 100) * containerSize - buttonSize / 2;
                  // L'icône Salât doit toujours être au-dessus de la navbar
                  const isSalat = node.icon === 'salat';

                  // Pour Salat, s'assurer qu'elle ne dépasse pas 85% de la hauteur du conteneur
                  // pour laisser de l'espace pour la navbar
                  if (isSalat) {
                    const maxTopPx = containerSize * 0.85 - buttonSize / 2;
                    if (topPx > maxTopPx) {
                      topPx = maxTopPx;
                    }
                  }

                  // ✅ OPTIMISÉ : handlePress mémorisé avec toutes les dépendances
                  const handlePress = useCallback(() => {
                    if (node.action === 'modal') {
                      setShowPrayerModal(true);
                    } else if (node.route) {
                      InteractionManager.runAfterInteractions(() => {
                        navigation.navigate(node.route as never);
                      });
                    }
                  }, [node.action, node.route, navigation]);

                  return (
                    <View
                      key={node.name}
                      style={[
                        styles.peripheralButtonContainer,
                        {
                          left: leftPx,
                          top: topPx,
                          // zIndex élevé pour Salât pour qu'elle soit au-dessus de la navbar
                          zIndex: isSalat ? 100 : 10,
                          elevation: isSalat ? 100 : 10,
                        }
                      ]}
                    >
                      <TouchableOpacityWithSound
                        onPress={handlePress}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                      </TouchableOpacityWithSound>
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
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>



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

      {/* Modal Salat nabi */}
      <SalatNabiModal
        visible={showSalatNabiModal}
        onClose={async () => {
          try {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const periodKey = dayOfWeek === 4
              ? `salat_nabi_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_thursday`
              : `salat_nabi_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_friday`;
            await AsyncStorage.setItem(periodKey, 'true');
          } catch (error) {
            // Erreur silencieuse
          }
          setShowSalatNabiModal(false);
        }}
      />

    </View >
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
  dhikrType: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
    textAlign: 'center',
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
    zIndex: 50,
    elevation: 50,
  },
  centerButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
