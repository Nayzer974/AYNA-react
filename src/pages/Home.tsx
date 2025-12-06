import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDhikrOfDay } from '@/services/dhikr';
import { getQiblaByCoords } from '@/services/hijri';
import { MessageCircle } from 'lucide-react-native';
import { registerForPushNotifications } from '@/services/notifications';
import { trackPageView, trackEvent } from '@/services/analytics';
import Svg, { Circle, Path, Line, Ellipse, G, Rect } from 'react-native-svg';
import * as Location from 'expo-location';
import { Magnetometer, MagnetometerData } from 'expo-sensors';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, useEffect as reanimatedEffect } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { PrayerTimesModal } from '@/components/PrayerTimesModal';
import { EmailVerificationModal } from '@/components/EmailVerificationModal';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { storage } from '@/utils/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  
  const isAuthenticated = Boolean(user?.id);
  const hasName = Boolean(isAuthenticated && user?.name && user.name.trim().length > 0);
  
  const [dailyDhikr, setDailyDhikr] = useState<{ arabic: string; translation: string } | null>(null);
  const [isLoadingDhikr, setIsLoadingDhikr] = useState(true);
  const [buttonSize, setButtonSize] = useState(56);
  const [containerSize, setContainerSize] = useState(300);
  const [radius, setRadius] = useState(100);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [qibla, setQibla] = useState<number | null>(null);
  const [sensorQibla, setSensorQibla] = useState<number | null>(null);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);

  // Calculer la taille des boutons et le rayon selon la taille de l'écran
  // Responsive pour éviter le scroll et optimiser l'espace
  useEffect(() => {
    const calculateSizes = () => {
      const screenHeight = SCREEN_HEIGHT;
      const screenWidth = SCREEN_WIDTH;
      const screenSize = Math.min(screenWidth, screenHeight);
      
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
      setButtonSize(newButtonSize);
      
      // Taille du conteneur adaptée à l'espace disponible
      // Utiliser 90% de la largeur ou 95% de la hauteur disponible, selon le plus petit
      const maxContainerByHeight = availableHeight * 0.95;
      const maxContainerByWidth = screenWidth * 0.9;
      const maxContainerSize = Math.min(maxContainerByHeight, maxContainerByWidth);
      const minContainerSize = 220;
      const calculatedContainerSize = Math.max(minContainerSize, Math.min(maxContainerSize, 380));
      setContainerSize(calculatedContainerSize);
      
      // Rayon pour les boutons périphériques - optimisé pour un hexagone équilibré
      // Le rayon doit permettre aux icônes d'utiliser tout l'espace disponible
      // Utiliser presque tout l'espace en laissant juste une petite marge
      // Le rayon est calculé pour que toutes les icônes (sauf Sabila'Nûr et Umm'Ayna) aient le même espacement
      // Augmenter le rayon pour mieux remplir l'espace disponible et éloigner les icônes
      const calculatedRadius = (calculatedContainerSize / 2) - (newButtonSize / 2) - 4;
      setRadius(Math.max(80, calculatedRadius));
    };
    
    calculateSizes();
    
    const subscription = Dimensions.addEventListener('change', calculateSizes);
    return () => subscription?.remove();
  }, []);

  // Vérifier si on doit afficher le popup de vérification d'email
  useEffect(() => {
    const checkEmailVerification = async () => {
      // Seulement pour les utilisateurs authentifiés
      if (!user?.id) {
        // Utilisateurs non authentifiés : pas de popup, ils doivent se connecter/s'inscrire
        return;
      }

      // Si emailVerified est explicitement true, ne pas afficher
      if (user?.emailVerified === true) {
        return;
      }

      // Pour les utilisateurs authentifiés avec email non vérifié (false, undefined, null)
      try {
        // Vérifier si le popup a déjà été affiché aujourd'hui
        const lastShownDate = await storage.getItem('email_verification_popup_date');
        const today = new Date().toDateString();
        
        if (lastShownDate !== today) {
          // Afficher le popup et sauvegarder la date
          setShowEmailVerificationModal(true);
          await storage.setItem('email_verification_popup_date', today);
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification de la date du popup:', error);
      }
    };

    // Attendre un peu pour que l'utilisateur soit complètement chargé depuis Supabase
    const timer = setTimeout(() => {
      checkEmailVerification();
    }, 800);

    return () => clearTimeout(timer);
  }, [user?.id, user?.emailVerified]);

  // Charger le dhikr du jour
  useEffect(() => {
    const loadDhikr = async () => {
      try {
        setIsLoadingDhikr(true);
        const dhikr = await getDhikrOfDay('fr');
        
        if (dhikr) {
          setDailyDhikr({
            arabic: dhikr.text || '',
            translation: dhikr.translation || ''
          });
        } else {
          setDailyDhikr({
            arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
            translation: "Il n'y a de divinité qu'Allah"
          });
        }
      } catch (error) {
        console.warn('Erreur lors du chargement du dhikr:', error);
        setDailyDhikr({
          arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
          translation: "Il n'y a de divinité qu'Allah"
        });
      } finally {
        setIsLoadingDhikr(false);
      }
    };
    
    loadDhikr();
  }, []);

  // Charger la direction Qibla
  useEffect(() => {
    let mounted = true;
    
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
        console.warn('Erreur lors du chargement de la Qibla:', error);
      }
    };

    loadQibla();

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

        subscription = Magnetometer.addListener((data: MagnetometerData) => {
          if (!mounted) return;
          
          const { x, y } = data;
          let heading = Math.atan2(y, x) * (180 / Math.PI);
          heading = (heading + 360) % 360;
          
          setSensorQibla(heading);
        });
      } catch (error) {
        console.warn('Erreur lors du démarrage du tracking Qibla:', error);
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

  const handleLogoPress = () => {
    navigation.navigate('AsmaUlHusna' as never);
  };

  // Configuration des nœuds avec leurs angles (0° = haut, sens horaire)
  const nodes = [
    { name: t('home.modules.baytAnNur'), angle: 0, route: 'BaytAnNur', icon: 'baytnur' },
    { name: t('home.modules.sabilanur'), angle: 300, route: 'Sabilanur', icon: 'sabilanur' },
    { name: t('home.modules.ummayna'), angle: 60, route: 'UmmAyna', icon: 'ummayna' },
    { name: t('home.modules.nurShifa'), angle: 120, route: 'NurShifa', icon: 'nurshifa' },
    { name: t('home.modules.salat'), angle: 180, route: null, icon: 'salat', action: 'modal' },
    { name: t('home.modules.dairatAnNur'), angle: 240, route: 'DairatAnNur', icon: 'dairat' }
  ];

  // Fonction pour calculer la position depuis l'angle (en pixels)
  // Utilise un rayon uniforme pour toutes les icônes, sauf Sabila'Nûr et Umm'Ayna
  // Garantit que Salât (180°) a exactement la même distance d'AYNA que Bayt An Nûr (0°)
  const getPosition = (angleDeg: number) => {
    // Convertir angle en radians : 0° = haut, donc soustraire 90° pour aligner avec math standard
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    
    // Centre du conteneur en pixels (le bouton AYNA est centré avec un décalage de -20px en top)
    // Pour le calcul de distance, on utilise le vrai centre du conteneur
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;
    
    // Rayon de base en pixels - utilisé pour Bayt An Nûr, Nur & Shifa, Salât et Da'Irat
    // Ce rayon garantit la même distance du centre pour toutes ces icônes
    let radiusPx = radius;
    
    // Augmenter le rayon pour Sabila'Nûr (300°) et Umm'Ayna (60°) pour les rapprocher des côtés
    if (angleDeg === 300 || angleDeg === 60) {
      radiusPx = radius * 1.35;
      // Limiter pour éviter de sortir du conteneur
      radiusPx = Math.min(radiusPx, (containerSize / 2) * 0.9);
    }
    // Pour toutes les autres icônes (Bayt An Nûr 0°, Nur & Shifa 120°, Salât 180°, Da'Irat 240°)
    // Utiliser exactement le même rayon pour garantir la même distance du centre
    
    // Calculer la position en pixels depuis le centre
    let xPx = centerX + (radiusPx * Math.cos(angleRad));
    let yPx = centerY + (radiusPx * Math.sin(angleRad));
    
    // Pour Salât (180°), baisser légèrement l'icône tout en gardant la même distance du centre
    if (angleDeg === 180) {
      // Ajuster vers le bas (environ 15% du rayon pour baisser un peu plus)
      const offsetY = radiusPx * 0.15;
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
  };

  // Composant pour l'icône Bayt An Nûr (bougie)
  const BaytAnNurIcon = ({ size }: { size: number }) => (
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
  );

  // Composant pour l'icône Sabila'Nûr (carré)
  const SabilanurIcon = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x="8" y="8" width="16" height="16" stroke="white" strokeWidth="2" fill="none" />
      <Rect x="12" y="12" width="8" height="8" stroke="white" strokeWidth="2" fill="none" />
    </Svg>
  );

  // Composant pour l'icône Umm'Ayna (deux personnes)
  const UmmAynaIcon = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none" />
      <Circle cx="20" cy="12" r="4" stroke="white" strokeWidth="2" fill="none" />
      <Path d="M8 22C8 19 10 17 12 17C14 17 16 19 16 22" stroke="white" strokeWidth="2" fill="none" />
      <Path d="M16 22C16 19 18 17 20 17C22 17 24 19 24 22" stroke="white" strokeWidth="2" fill="none" />
    </Svg>
  );

  // Composant pour l'icône Nur & Shifa (étoile)
  const NurShifaIcon = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M16 6 L20 14 L28 16 L20 18 L16 26 L12 18 L4 16 L12 14 Z" stroke="white" strokeWidth="2" fill="none" />
    </Svg>
  );

  // Composant pour l'icône Salât (boussole animée)
  const SalatIcon = ({ size }: { size: number }) => {
    const { user } = useUser();
    const currentTheme = getTheme(user?.theme || 'default');
    const angle = (sensorQibla ?? qibla) || 0;
    
    const rotation = useSharedValue(angle);
    
    useEffect(() => {
      rotation.value = withTiming(angle, { duration: 100 });
    }, [angle, rotation]);
    
    const animatedStyle = useAnimatedStyle(() => {
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
  };

  // Composant pour l'icône Da'Irat an-Nûr (cercles concentriques)
  const DairatIcon = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2" fill="none" />
      <Circle cx="16" cy="16" r="6" stroke="white" strokeWidth="2" fill="none" />
      <Circle cx="16" cy="16" r="2" fill="white" />
    </Svg>
  );

  const renderIcon = (iconType: string, size: number) => {
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
        return <SalatIcon size={size} />;
      case 'dairat':
        return <DairatIcon size={size} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Background avec gradient et étoiles */}
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
      
      <SafeAreaView 
        style={styles.container}
        edges={['top', 'bottom']}
      >
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
                resizeMode="contain"
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

          {/* Carte Dhikr (sans logo) */}
          <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.dhikrContent}>
              <Text style={[styles.dhikrTitle, { color: theme.colors.text }]}>
                {t('home.dhikrOfTheDay')}
              </Text>
              
              {isLoadingDhikr ? (
                <ActivityIndicator size="small" color={theme.colors.accent} style={styles.dhikrLoader} />
              ) : dailyDhikr ? (
                <>
                  <Text style={[styles.dhikrArabic, { color: theme.colors.text }]}>
                    {dailyDhikr.arabic}
                  </Text>
                  {dailyDhikr.translation && i18n.language !== 'ar' && (
                    <Text style={[styles.dhikrTranslation, { color: theme.colors.textSecondary }]}>
                      {dailyDhikr.translation}
                    </Text>
                  )}
                </>
              ) : null}
            </View>
          </View>

          {/* Icônes circulaires - Layout optimisé avec centrage parfait */}
          <View style={[styles.iconsContainer, { width: containerSize, height: containerSize }]}>
            {/* Bouton central AYNA - Centré exactement au centre du conteneur */}
            <View 
              style={[
                styles.centerButtonContainer,
                {
                  marginLeft: -(buttonSize * 1.3) / 2,
                  marginTop: -(buttonSize * 1.3) / 2 - 15, // Monter un peu le bouton AYNA
                }
              ]}
            >
              <Pressable
                onPress={() => navigation.navigate('Chat' as never)}
                style={({ pressed }) => [
                  styles.centerButton,
                  {
                    width: buttonSize * 1.3,
                    height: buttonSize * 1.3,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  pressed && styles.iconButtonPressed
                ]}
              >
                <MessageCircle 
                  size={buttonSize * 0.5} 
                  color="white" 
                  strokeWidth={2}
                />
              </Pressable>
              <Text style={[styles.centerLabel, { color: theme.colors.text }]}>
                AYNA
              </Text>
            </View>

            {/* Boutons périphériques - Positionnés avec pourcentages pour centrage parfait */}
            {nodes.map((node) => {
              const { x, y } = getPosition(node.angle);
              // Convertir les pourcentages en pixels et centrer parfaitement
              const leftPx = (x / 100) * containerSize - buttonSize / 2;
              const topPx = (y / 100) * containerSize - buttonSize / 2;
              // L'icône Salât doit toujours être au-dessus de la navbar
              const isSalat = node.icon === 'salat';
              return (
                <View
                  key={node.name}
                  style={[
                    styles.peripheralButtonContainer,
                    {
                      left: leftPx,
                      top: topPx,
                      // zIndex élevé pour Salât pour qu'elle soit au-dessus de la navbar
                      zIndex: isSalat ? 100 : 1,
                      elevation: isSalat ? 100 : 1,
                    }
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      if (node.action === 'modal') {
                        setShowPrayerModal(true);
                      } else if (node.route) {
                        navigation.navigate(node.route as never);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.peripheralButton,
                      {
                        width: buttonSize,
                        height: buttonSize,
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      pressed && styles.iconButtonPressed
                    ]}
                  >
                    {renderIcon(node.icon, buttonSize * 0.5)}
                  </Pressable>
                  <Text 
                    style={[styles.peripheralLabel, { color: theme.colors.text }]}
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
      </SafeAreaView>

      {/* Modal des heures de prière */}
      <PrayerTimesModal
        visible={showPrayerModal}
        onClose={() => setShowPrayerModal(false)}
      />

      {/* Modal de vérification d'email */}
      <EmailVerificationModal
        visible={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
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
    overflow: 'hidden',
  },
  logoPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  logo: {
    width: '90%',
    height: '90%',
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  dhikrContent: {
    alignItems: 'center',
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
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
