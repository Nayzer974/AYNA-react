import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Modal, Alert, ScrollView } from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideInUp } from 'react-native-reanimated';
import { X, Check, Compass } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { getPrayerTimesByCoords } from '@/services/content/prayerServices';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';

interface PrayerTimesCardSlideProps {
  visible: boolean;
  onClose: () => void;
}

const prayerTimes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Ce fichier utilise des valeurs littérales directement dans les animations
// pour garantir qu'aucune valeur undefined ne soit jamais passée à Reanimated

// Helper pour créer une animation d'entrée avec delay garanti
// Utilise des valeurs numériques garanties pour éviter undefined
const createEnteringAnimation = (index: number) => {
  // S'assurer que index est un nombre valide
  const safeIndex = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;

  // Utiliser des valeurs littérales uniquement - pas de calculs dynamiques
  // Garantir que toutes les valeurs sont des nombres
  const duration = 200;
  if (safeIndex === 0) return FadeIn.duration(duration);
  if (safeIndex === 1) return FadeIn.duration(duration).delay(50);
  if (safeIndex === 2) return FadeIn.duration(duration).delay(100);
  if (safeIndex === 3) return FadeIn.duration(duration).delay(150);
  if (safeIndex === 4) return FadeIn.duration(duration).delay(200);
  // Fallback avec valeur garantie
  return FadeIn.duration(duration);
};

export function PrayerTimesCardSlide({ visible, onClose }: PrayerTimesCardSlideProps) {
  const navigation = useNavigation();
  const { user, incrementUserPrayer } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const { recordActivity } = useSmartNotifications();
  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedPrayers, setCompletedPrayers] = useState<Set<string>>(new Set());
  const isAuthenticated = Boolean(user?.id);

  // Ref pour vérifier si le composant est monté (éviter setState après unmount)
  const isMountedRef = useRef(true);

  // Fonction pour obtenir la clé de stockage pour la date actuelle
  const getStorageKey = useCallback((): string => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return `@ayna_completed_prayers_${dateStr}`;
  }, []);

  // Charger les prières complétées depuis AsyncStorage
  const loadCompletedPrayers = useCallback(async () => {
    try {
      const key = getStorageKey();
      const stored = await AsyncStorage.getItem(key);
      if (!isMountedRef.current) return; // Ne pas setState si démonté

      if (stored) {
        const prayers = JSON.parse(stored);
        if (isMountedRef.current) {
          setCompletedPrayers(new Set(prayers));
        }
      } else {
        if (isMountedRef.current) {
          setCompletedPrayers(new Set());
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prières complétées:', error);
      if (isMountedRef.current) {
        setCompletedPrayers(new Set());
      }
    }
  }, [getStorageKey]);

  // Sauvegarder les prières complétées dans AsyncStorage
  const saveCompletedPrayers = useCallback(async (prayers: Set<string>) => {
    if (!isMountedRef.current) return; // Ne pas sauvegarder si démonté
    try {
      const key = getStorageKey();
      const prayersArray = Array.from(prayers);
      await AsyncStorage.setItem(key, JSON.stringify(prayersArray));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des prières complétées:', error);
    }
  }, [getStorageKey]);

  // Fonction pour vérifier si une prière peut être cochée (heure arrivée ou dépassée)
  const canCheckPrayer = useCallback((prayerName: string): boolean => {
    if (!timings || !timings[prayerName]) {
      return false;
    }

    const prayerTime = timings[prayerName];
    if (!prayerTime) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Comparer les heures au format HH:MM
    const currentParts = currentTime.split(':').map(Number);
    const prayerParts = prayerTime.split(':').map(Number);

    if (currentParts.length !== 2 || prayerParts.length !== 2) return false;
    if (!Number.isFinite(currentParts[0]) || !Number.isFinite(currentParts[1])) return false;
    if (!Number.isFinite(prayerParts[0]) || !Number.isFinite(prayerParts[1])) return false;

    const currentTotalMinutes = currentParts[0] * 60 + currentParts[1];
    const prayerTotalMinutes = prayerParts[0] * 60 + prayerParts[1];

    // Gérer le cas spécial de Fajr (première prière de la journée)
    // Si on est après Isha (dernière prière), on ne peut pas cocher Fajr car c'est le Fajr d'hier
    if (prayerName === 'Fajr' && timings['Isha']) {
      const ishaParts = timings['Isha'].split(':').map(Number);
      if (ishaParts.length === 2 && Number.isFinite(ishaParts[0]) && Number.isFinite(ishaParts[1])) {
        const ishaTotalMinutes = ishaParts[0] * 60 + ishaParts[1];
        // Si on est après Isha, on ne peut pas cocher Fajr (c'est le Fajr d'hier)
        if (currentTotalMinutes >= ishaTotalMinutes) {
          return false;
        }
      }
    }

    // Pour toutes les autres prières, on peut cocher si l'heure actuelle >= heure de la prière
    return currentTotalMinutes >= prayerTotalMinutes;
  }, [timings]);

  const togglePrayer = useCallback(async (prayerName: string) => {
    if (!isMountedRef.current) return; // Ne pas traiter si démonté

    // Permettre de voir les prières même sans authentification
    // Mais ne pas permettre de les cocher sans être connecté
    if (!isAuthenticated || !user?.id) {
      Alert.alert('Information', 'Connectez-vous pour marquer les prières comme complétées');
      return;
    }

    // Vérifier si l'heure de la prière est arrivée
    if (!canCheckPrayer(prayerName)) {
      Alert.alert(
        'Information',
        `Vous ne pouvez cocher cette prière qu'après ${timings?.[prayerName] || "l'heure de la prière"}.`
      );
      return;
    }

    // Vérifier si la prière était déjà complétée AVANT la mise à jour
    const wasCompleted = completedPrayers.has(prayerName);

    if (!isMountedRef.current) return; // Vérifier à nouveau avant setState

    setCompletedPrayers(prev => {
      if (!isMountedRef.current) return prev; // Ne pas modifier si démonté

      const next = new Set(prev);

      if (wasCompleted) {
        // Décochée - ne rien faire pour les stats
        next.delete(prayerName);
      } else {
        // Cochée
        next.add(prayerName);
      }
      // Sauvegarder immédiatement (mais de manière asynchrone pour ne pas bloquer)
      saveCompletedPrayers(next).catch(err => {
        console.error('Erreur lors de la sauvegarde:', err);
      });
      return next;
    });

    // Appeler incrementUserPrayer APRÈS la mise à jour de l'état local
    if (!wasCompleted && incrementUserPrayer && isMountedRef.current) {
      try {
        incrementUserPrayer(1);

        // Enregistrer l'activité pour les notifications intelligentes
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        await recordActivity('prayer', {
          prayerName,
          time: currentTime,
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
      }
    }
  }, [isAuthenticated, user?.id, canCheckPrayer, timings, completedPrayers, saveCompletedPrayers, incrementUserPrayer, recordActivity]);

  const loadPrayerTimes = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (!isMountedRef.current) {
        setLoading(false);
        return;
      }

      if (status !== 'granted') {
        setError(t('settings.permissionDenied') || 'Permission de localisation refusée');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      if (!isMountedRef.current) {
        setLoading(false);
        return;
      }

      const response = await getPrayerTimesByCoords(
        location.coords.latitude,
        location.coords.longitude
      );

      if (!isMountedRef.current) {
        setLoading(false);
        return;
      }

      if (response?.data?.timings) {
        const parsedTimings: Record<string, string> = {};
        Object.keys(response.data.timings).forEach((key) => {
          const time = response.data.timings[key];
          if (time) {
            parsedTimings[key] = time.split(' ')[0];
          }
        });
        setTimings(parsedTimings);
        setLoading(false);
      } else {
        setError('Aucune heure de prière disponible');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[PrayerTimesCardSlide] Error loading prayer times:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors du chargement des heures de prière');
        setLoading(false);
      }
    } finally {
      // Garantir que loading est toujours mis à false
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    // Marquer le composant comme monté
    isMountedRef.current = true;

    if (visible) {
      // Réinitialiser les états quand le modal s'ouvre
      setLoading(true);
      setError(null);
      setTimings(null); // Réinitialiser les timings

      // Appeler les fonctions de chargement
      loadPrayerTimes().catch(err => {
        console.error('[PrayerTimesCardSlide] Error in loadPrayerTimes:', err);
        if (isMountedRef.current) {
          setError('Erreur lors du chargement des heures de prière');
          setLoading(false);
        }
      });

      loadCompletedPrayers().catch(err => {
        console.error('[PrayerTimesCardSlide] Error in loadCompletedPrayers:', err);
      });
    }

    // Cleanup
    return () => {
      // Ne marquer comme démonté que si le modal n'est plus visible
      if (!visible) {
        isMountedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]); // Ne mettre que visible comme dépendance pour éviter les re-renders infinis

  // Handler sécurisé pour fermer le modal (évite les crashes sur iPhone)
  const handleClose = useCallback(() => {
    if (!isMountedRef.current) return;
    try {
      // Ne pas fermer si on est en train de charger
      if (loading) {
        console.log('[PrayerTimesCardSlide] Ignoring close during loading');
        return;
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de la fermeture du modal:', error);
    }
  }, [onClose, loading]);

  const handleQiblaPress = useCallback(() => {
    handleClose();
    // Navigation immédiate pour meilleure performance
    if (isMountedRef.current) {
      navigation.navigate('QiblaPage' as never);
    }
  }, [handleClose, navigation]);

  // Filtrer les prières valides
  const validPrayerTimes = useMemo(() => {
    if (!timings) return [];
    return prayerTimes.filter(key => timings[key]);
  }, [timings]);


  // Ne pas retourner null conditionnellement - cela change l'ordre des Hooks
  // À la place, toujours rendre le Modal mais le cacher avec visible={false}
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
        />

        {/* Carte qui slide depuis le bas */}
        <Animated.View
          entering={visible ? SlideInUp.duration(300) : undefined}
          style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary || '#1E1E2F' }]}
        >
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {t('home.prayerTimes') || 'Heures de prière'}
              </Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <X size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Content avec ScrollView pour iPhone mini */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
              nestedScrollEnabled={true}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.accent || '#4A90E2'} />
                  <Text style={[styles.errorText, { color: theme.colors.textSecondary || '#999', marginTop: 12 }]}>
                    Chargement des heures de prière...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: theme.colors.textSecondary || '#999' }]}>
                    {error}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setLoading(true);
                      setError(null);
                      loadPrayerTimes();
                    }}
                    style={({ pressed }) => [
                      styles.retryButton,
                      { opacity: pressed ? 0.7 : 1 }
                    ]}
                  >
                    <Text style={[styles.retryButtonText, { color: theme.colors.accent || '#4A90E2' }]}>
                      Réessayer
                    </Text>
                  </Pressable>
                </View>
              ) : timings ? (
                validPrayerTimes.length > 0 ? (
                  <>
                    <View style={styles.prayerTimesContainer}>
                      {validPrayerTimes.map((key, index) => {
                        const time = timings[key];
                        if (!time) return null;

                        const prayerName = t(`prayer.${key.toLowerCase()}`);
                        const isCompleted = completedPrayers.has(key);
                        const canCheck = canCheckPrayer(key);
                        const canToggle = isAuthenticated && canCheck;

                        // Utiliser le helper pour créer l'animation avec des valeurs garanties
                        const safeIndex = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;
                        const enteringAnimation = visible ? createEnteringAnimation(safeIndex) : undefined;

                        return (
                          <Animated.View
                            key={key}
                            entering={enteringAnimation}
                          >
                            <Pressable
                              onPress={() => canToggle && togglePrayer(key)}
                              disabled={!canToggle}
                              style={[
                                styles.prayerTimeRow,
                                {
                                  borderBottomColor: 'rgba(255, 255, 255, 0.08)',
                                }
                              ]}
                            >
                              <View style={styles.prayerTimeLeft}>
                                <Text
                                  style={[styles.prayerTimeLabel, { color: theme.colors.text }]}
                                  numberOfLines={2}
                                >
                                  {prayerName}
                                </Text>
                              </View>
                              <View style={styles.prayerTimeRight}>
                                <Text style={[styles.prayerTimeValue, { color: theme.colors.accent || '#4A90E2' }]}>
                                  {time}
                                </Text>
                                {/* Checkbox - seulement si l'heure est passée */}
                                {canCheck && (
                                  <View
                                    style={[
                                      styles.checkbox,
                                      {
                                        backgroundColor: isCompleted ? (theme.colors.accent || '#4A90E2') : 'transparent',
                                        borderColor: isCompleted ? (theme.colors.accent || '#4A90E2') : (theme.colors.accent || '#4A90E2'),
                                      }
                                    ]}
                                  >
                                    {isCompleted && (
                                      <Check size={14} color={theme.colors.background || '#FFFFFF'} />
                                    )}
                                  </View>
                                )}
                              </View>
                            </Pressable>
                          </Animated.View>
                        );
                      })}
                    </View>

                    {/* Bouton Boussole Qibla */}
                    <Animated.View
                      entering={visible ? SlideInUp.duration(300).delay(250) : undefined}
                      style={styles.qiblaButtonContainer}
                    >
                      <Pressable
                        onPress={handleQiblaPress}
                        style={({ pressed }) => [
                          styles.qiblaButton,
                          pressed && styles.qiblaButtonPressed
                        ]}
                      >
                        <LinearGradient
                          colors={[
                            (theme.colors.accent || '#4A90E2') + '20',
                            (theme.colors.accent || '#4A90E2') + '10'
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.qiblaButtonGradient}
                        >
                          <View style={styles.qiblaButtonContent}>
                            <View style={[styles.qiblaIconContainer, { backgroundColor: (theme.colors.accent || '#4A90E2') + '40' }]}>
                              <Compass size={24} color={theme.colors.accent || '#4A90E2'} />
                            </View>
                            <View style={styles.qiblaButtonTextContainer}>
                              <Text style={[styles.qiblaButtonText, { color: theme.colors.text || '#FFFFFF' }]}>
                                {t('qibla.title') || 'Trouver la Qibla'}
                              </Text>
                              <Text style={[styles.qiblaButtonSubtext, { color: theme.colors.textSecondary || '#999' }]}>
                                {t('qibla.subtitle') || 'Boussole directionnelle'}
                              </Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>
                  </>
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: theme.colors.textSecondary || '#999' }]}>
                      Aucune heure de prière disponible pour votre localisation
                    </Text>
                  </View>
                )
              ) : (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: theme.colors.textSecondary || '#999' }]}>
                    En attente des heures de prière...
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%', // Augmenté pour iPhone mini
    minHeight: 400, // Hauteur minimale pour garantir l'affichage
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    minHeight: 0, // Important pour que flex fonctionne correctement
  },
  scrollView: {
    flex: 1,
    minHeight: 200, // Hauteur minimale pour garantir l'affichage
  },
  scrollContent: {
    paddingBottom: 20, // Espace en bas pour le scroll
    flexGrow: 1, // Permet au contenu de grandir
    minHeight: 300, // Hauteur minimale pour garantir l'affichage
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'System',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200, // Hauteur minimale pour le loader
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  prayerTimesContainer: {
    width: '100%',
    minHeight: 200, // Hauteur minimale pour garantir l'affichage
  },
  prayerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  prayerTimeLeft: {
    flex: 1,
    paddingRight: 16,
    justifyContent: 'center',
  },
  prayerTimeRight: {
    minWidth: 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  prayerTimeLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
    flexShrink: 1,
  },
  prayerTimeValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  qiblaButtonContainer: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  qiblaButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  qiblaButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  qiblaButtonGradient: {
    padding: 16,
  },
  qiblaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qiblaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  qiblaButtonTextContainer: {
    flex: 1,
  },
  qiblaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 2,
  },
  qiblaButtonSubtext: {
    fontSize: 12,
    fontFamily: 'System',
  },
});
