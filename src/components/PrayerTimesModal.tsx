import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { X, Check, Compass, Clock } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { getTodayPrayerTimes, initialize as initializePrayerTimes } from '@/services/content/PrayerTimeManager';
import Svg, { Rect, Line } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '@/components/ui/GlassCard';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '@/utils/designTokens';

interface PrayerTimesModalProps {
  visible: boolean;
  onClose: () => void;
}

const prayerNames: Record<string, string> = {
  Fajr: 'Fajr',
  Dhuhr: 'Dhuhr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
  Sunrise: 'Lever du soleil',
};

/**
 * Modal pour afficher les heures de prière
 * Style identique à la webapp avec animations et grille 2 colonnes
 */
export function PrayerTimesModal({ visible, onClose }: PrayerTimesModalProps) {
  const navigation = useNavigation();
  const { user, incrementUserPrayer } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedPrayers, setCompletedPrayers] = useState<Set<string>>(new Set());
  const isAuthenticated = Boolean(user?.id);

  // Fonction pour obtenir la clé de stockage pour la date actuelle
  const getStorageKey = (): string => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return `@ayna_completed_prayers_${dateStr}`;
  };

  // Charger les prières complétées depuis AsyncStorage
  const loadCompletedPrayers = async () => {
    try {
      const key = getStorageKey();
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const prayers = JSON.parse(stored);
        setCompletedPrayers(new Set(prayers));
      } else {
        setCompletedPrayers(new Set());
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prières complétées:', error);
      setCompletedPrayers(new Set());
    }
  };

  // Sauvegarder les prières complétées dans AsyncStorage
  const saveCompletedPrayers = async (prayers: Set<string>) => {
    try {
      const key = getStorageKey();
      const prayersArray = Array.from(prayers);
      await AsyncStorage.setItem(key, JSON.stringify(prayersArray));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des prières complétées:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      // Réinitialiser les états quand le modal s'ouvre
      setLoading(true);
      setError(null);
      setTimings(null);
      loadPrayerTimes();
      loadCompletedPrayers(); // Charger les prières complétées
    } else {
      // Réinitialiser quand le modal se ferme
      setLoading(false);
      setError(null);
      setTimings(null);
    }
  }, [visible]);

  const loadPrayerTimes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les heures de prière du jour depuis le stockage
      const todayTimings = await getTodayPrayerTimes();

      if (todayTimings) {
        // Si les heures sont déjà stockées, les utiliser
        setTimings(todayTimings);
        console.log('Heures de prière chargées depuis le stockage:', todayTimings);
      } else {
        // Si pas de données stockées, initialiser le gestionnaire
        // Cela va récupérer et stocker les heures de prière
        const userLocation = user?.location
          ? {
              latitude: user.location.latitude,
              longitude: user.location.longitude,
            }
          : undefined;

        await initializePrayerTimes(userLocation);

        // Réessayer de récupérer les heures après l'initialisation
        const updatedTimings = await getTodayPrayerTimes();
        if (updatedTimings) {
          setTimings(updatedTimings);
        } else {
          throw new Error('Impossible de charger les heures de prière après l\'initialisation');
        }
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des heures de prière:', err);
      setError(err.message || 'Impossible de charger les heures de prière');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour vérifier si une prière peut être cochée (heure arrivée ou dépassée)
  const canCheckPrayer = (prayerName: string): boolean => {
    if (!timings || !timings[prayerName]) {
      return false;
    }

    const prayerTime = timings[prayerName];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Comparer les heures au format HH:MM
    const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
    const [prayerHours, prayerMinutes] = prayerTime.split(':').map(Number);
    
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const prayerTotalMinutes = prayerHours * 60 + prayerMinutes;
    
    // Gérer le cas spécial de Fajr (première prière de la journée)
    // Si on est après Isha (dernière prière), on ne peut pas cocher Fajr car c'est le Fajr d'hier
    if (prayerName === 'Fajr' && timings['Isha']) {
      const [ishaHours, ishaMinutes] = timings['Isha'].split(':').map(Number);
      const ishaTotalMinutes = ishaHours * 60 + ishaMinutes;
      
      // Si on est après Isha, on ne peut pas cocher Fajr (c'est le Fajr d'hier)
      if (currentTotalMinutes >= ishaTotalMinutes) {
        return false;
      }
    }
    
    // Pour toutes les autres prières, on peut cocher si l'heure actuelle >= heure de la prière
    return currentTotalMinutes >= prayerTotalMinutes;
  };

  const togglePrayer = async (prayerName: string) => {
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
    
    setCompletedPrayers(prev => {
      const next = new Set(prev);
      
      if (wasCompleted) {
        // Décochée - ne rien faire pour les stats
        next.delete(prayerName);
      } else {
        // Cochée
        next.add(prayerName);
      }
      // Sauvegarder immédiatement
      saveCompletedPrayers(next);
      return next;
    });
    
    // Appeler incrementUserPrayer APRÈS la mise à jour de l'état local, en dehors de la fonction de mise à jour
    if (!wasCompleted && incrementUserPrayer) {
      incrementUserPrayer(1);
    }
  };

  const mainPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib'];
  const ishaPrayer = 'Isha';

  // Composant pour l'icône Kaaba SVG
  const KaabaIcon = ({ size = 32 }: { size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Base de la Kaaba */}
      <Rect
        x="20"
        y="40"
        width="60"
        height="50"
        fill={theme.colors.accent}
        stroke={theme.colors.text}
        strokeWidth="2"
        rx="2"
      />
      {/* Toit */}
      <Rect
        x="15"
        y="35"
        width="70"
        height="10"
        fill="rgba(255, 255, 255, 0.3)"
        stroke={theme.colors.text}
        strokeWidth="2"
        rx="2"
      />
      {/* Porte */}
      <Rect
        x="40"
        y="55"
        width="20"
        height="35"
        fill={theme.colors.background}
        stroke={theme.colors.text}
        strokeWidth="1.5"
        rx="1"
      />
      {/* Détails décoratifs */}
      <Line x1="30" y1="50" x2="30" y2="90" stroke={theme.colors.text} strokeWidth="1" opacity={0.5} />
      <Line x1="50" y1="50" x2="50" y2="90" stroke={theme.colors.text} strokeWidth="1" opacity={0.5} />
      <Line x1="70" y1="50" x2="70" y2="90" stroke={theme.colors.text} strokeWidth="1" opacity={0.5} />
    </Svg>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.backgroundSecondary }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Heures de prière
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed
              ]}
            >
              <X size={24} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.scrollContainer}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.accent} />
                  <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Chargement des heures de prière...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: '#ef4444' }]}>
                    {error}
                  </Text>
                  <Pressable
                    onPress={loadPrayerTimes}
                    style={({ pressed }) => [
                      styles.retryButton,
                      { backgroundColor: theme.colors.accent },
                      pressed && styles.retryButtonPressed
                    ]}
                  >
                    <Text style={[styles.retryButtonText, { color: theme.colors.background }]}>
                      Réessayer
                    </Text>
                  </Pressable>
                </View>
              ) : timings ? (
                <>
                  {/* Bouton Boussole Qibla - Plus visible */}
                  <Animated.View 
                    entering={SlideInDown.delay(50).duration(400)}
                    style={styles.qiblaButtonContainer}
                  >
                    <Pressable
                      onPress={() => {
                        onClose();
                        navigation.navigate('QiblaPage' as never);
                      }}
                      style={({ pressed }) => [
                        styles.qiblaButton,
                        pressed && styles.qiblaButtonPressed
                      ]}
                    >
                      <LinearGradient
                        colors={[
                          theme.colors.accent + '30',
                          theme.colors.accent + '20',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.qiblaButtonGradient}
                      >
                        <View style={styles.qiblaButtonContent}>
                          <View style={[styles.qiblaIconContainer, { backgroundColor: theme.colors.accent + '40' }]}>
                            <Compass size={24} color={theme.colors.accent} />
                          </View>
                          <View style={styles.qiblaButtonTextContainer}>
                            <Text style={[styles.qiblaButtonText, { color: theme.colors.text }]}>
                              Trouver la Qibla
                            </Text>
                            <Text style={[styles.qiblaButtonSubtext, { color: theme.colors.textSecondary }]}>
                              Boussole directionnelle
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>

                  {/* Grille des heures de prière - 2 colonnes */}
                  <View style={styles.prayerTimesGrid}>
                    {mainPrayers.map((key, index) => {
                      const isCompleted = completedPrayers.has(key);
                      const canCheck = canCheckPrayer(key);
                      const canToggle = isAuthenticated && canCheck;
                      
                      return (
                        <Animated.View
                          key={key}
                          entering={FadeIn.delay(index * 100).duration(400)}
                          style={styles.prayerTimeCardWrapper}
                        >
                          <Pressable
                            onPress={() => canToggle && togglePrayer(key)}
                            disabled={!canToggle}
                            style={({ pressed }) => [
                              styles.prayerTimeCard,
                              pressed && canToggle && styles.prayerTimeCardPressed
                            ]}
                          >
                            {isCompleted ? (
                              <LinearGradient
                                colors={[
                                  theme.colors.accent + '30',
                                  theme.colors.accent + '20',
                                  theme.colors.accent + '15'
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.prayerTimeCardGradient}
                              >
                                <View style={styles.prayerTimeCardContent}>
                                  <View style={styles.prayerTimeLeft}>
                                    {isAuthenticated && (
                                      <View
                                        style={[
                                          styles.checkbox,
                                          {
                                            backgroundColor: theme.colors.accent,
                                            borderColor: theme.colors.accent,
                                            ...shadows.sm,
                                          }
                                        ]}
                                      >
                                        <Check size={14} color={theme.colors.background} />
                                      </View>
                                    )}
                                    <Text 
                                      style={[
                                        styles.prayerTimeLabel, 
                                        { 
                                          color: theme.colors.text,
                                          textDecorationLine: 'none',
                                        }
                                      ]}
                                      numberOfLines={1}
                                      adjustsFontSizeToFit={false}
                                      minimumFontScale={0.85}
                                    >
                                      {prayerNames[key] || key}
                                    </Text>
                                  </View>
                                  <View style={styles.prayerTimeValueContainer}>
                                    <Clock size={16} color={theme.colors.accent} style={styles.clockIcon} />
                                    <Text style={[styles.prayerTimeValue, { color: theme.colors.accent }]}>
                                      {timings[key] || '—'}
                                    </Text>
                                  </View>
                                </View>
                              </LinearGradient>
                            ) : (
                              <GlassCard 
                                intensity={canCheck ? 20 : 10}
                                blurType="dark"
                                style={styles.prayerTimeCardGlass}
                              >
                                <View style={styles.prayerTimeCardContent}>
                                  <View style={styles.prayerTimeLeft}>
                                    {isAuthenticated && (
                                      <View
                                        style={[
                                          styles.checkbox,
                                          {
                                            backgroundColor: 'transparent',
                                            borderColor: canCheck
                                              ? 'rgba(255, 255, 255, 0.4)'
                                              : 'rgba(255, 255, 255, 0.2)',
                                            opacity: canCheck ? 1 : 0.5,
                                          }
                                        ]}
                                      />
                                    )}
                                    <Text 
                                      style={[
                                        styles.prayerTimeLabel, 
                                        { 
                                          color: theme.colors.textSecondary,
                                        }
                                      ]}
                                      numberOfLines={1}
                                      adjustsFontSizeToFit={false}
                                      minimumFontScale={0.85}
                                    >
                                      {prayerNames[key] || key}
                                    </Text>
                                  </View>
                                  <View style={styles.prayerTimeValueContainer}>
                                    <Clock size={16} color={theme.colors.textSecondary} style={styles.clockIcon} />
                                    <Text style={[styles.prayerTimeValue, { color: theme.colors.text }]}>
                                      {timings[key] || '—'}
                                    </Text>
                                  </View>
                                </View>
                              </GlassCard>
                            )}
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>

                  {/* Isha centrée en bas */}
                  <Animated.View 
                    entering={FadeIn.delay(400).duration(400)}
                    style={styles.ishaContainer}
                  >
                    <Pressable
                      onPress={() => {
                        const canCheck = canCheckPrayer(ishaPrayer);
                        if (isAuthenticated && canCheck) {
                          togglePrayer(ishaPrayer);
                        }
                      }}
                      disabled={!isAuthenticated || !canCheckPrayer(ishaPrayer)}
                      style={({ pressed }) => {
                        const canCheck = canCheckPrayer(ishaPrayer);
                        const isCompleted = completedPrayers.has(ishaPrayer);
                        return [
                          styles.ishaCard,
                          pressed && isAuthenticated && canCheck && styles.ishaCardPressed
                        ];
                      }}
                    >
                      {completedPrayers.has(ishaPrayer) ? (
                        <LinearGradient
                          colors={[
                            theme.colors.accent + '40',
                            theme.colors.accent + '30',
                            theme.colors.accent + '25'
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.ishaCardGradient}
                        >
                          <View style={styles.ishaCardContent}>
                            <View style={styles.prayerTimeLeft}>
                              {isAuthenticated && (
                                <View
                                  style={[
                                    styles.checkbox,
                                    styles.checkboxLarge,
                                    {
                                      backgroundColor: theme.colors.accent,
                                      borderColor: theme.colors.accent,
                                      ...shadows.md,
                                    }
                                  ]}
                                >
                                  <Check size={16} color={theme.colors.background} />
                                </View>
                              )}
                              <Text 
                                style={[
                                  styles.ishaLabel, 
                                  { 
                                    color: theme.colors.text,
                                  }
                                ]}
                              >
                                {prayerNames[ishaPrayer] || ishaPrayer}
                              </Text>
                            </View>
                            <View style={styles.prayerTimeValueContainer}>
                              <Clock size={18} color={theme.colors.accent} style={styles.clockIcon} />
                              <Text style={[styles.ishaValue, { color: theme.colors.accent }]}>
                                {timings[ishaPrayer] || '—'}
                              </Text>
                            </View>
                          </View>
                        </LinearGradient>
                      ) : (
                        <GlassCard 
                          intensity={canCheckPrayer(ishaPrayer) ? 25 : 15}
                          blurType="dark"
                          style={styles.ishaCardGlass}
                        >
                          <View style={styles.ishaCardContent}>
                            <View style={styles.prayerTimeLeft}>
                              {isAuthenticated && (
                                <View
                                  style={[
                                    styles.checkbox,
                                    styles.checkboxLarge,
                                    {
                                      backgroundColor: 'transparent',
                                      borderColor: canCheckPrayer(ishaPrayer)
                                        ? 'rgba(255, 255, 255, 0.4)'
                                        : 'rgba(255, 255, 255, 0.2)',
                                      opacity: canCheckPrayer(ishaPrayer) ? 1 : 0.5,
                                    }
                                  ]}
                                />
                              )}
                              <Text 
                                style={[
                                  styles.ishaLabel, 
                                  { 
                                    color: theme.colors.text,
                                  }
                                ]}
                              >
                                {prayerNames[ishaPrayer] || ishaPrayer}
                              </Text>
                            </View>
                            <View style={styles.prayerTimeValueContainer}>
                              <Clock size={18} color={theme.colors.textSecondary} style={styles.clockIcon} />
                              <Text style={[styles.ishaValue, { color: theme.colors.text }]}>
                                {timings[ishaPrayer] || '—'}
                              </Text>
                            </View>
                          </View>
                        </GlassCard>
                      )}
                    </Pressable>
                  </Animated.View>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    height: '85%',
    maxHeight: 600,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 20,
    position: 'relative',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  closeButtonPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'System',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonPressed: {
    opacity: 0.7,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  qiblaButtonContainer: {
    marginBottom: 24,
    marginTop: 8,
  },
  qiblaButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  qiblaButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  qiblaButtonGradient: {
    paddingVertical: spacing.base + 2,
    paddingHorizontal: spacing.base + 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qiblaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.base,
  },
  qiblaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  qiblaButtonTextContainer: {
    flex: 1,
    gap: 4,
  },
  qiblaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  qiblaButtonSubtext: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
  },
  prayerTimesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  prayerTimeCardWrapper: {
    width: '48%',
  },
  prayerTimeCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  prayerTimeCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  prayerTimeCardGradient: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  prayerTimeCardGlass: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  prayerTimeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0, // Permet aux enfants flex de se rétrécir
  },
  prayerTimeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0, // Empêche le container de l'heure de rétrécir
  },
  clockIcon: {
    opacity: 0.7,
  },
  prayerTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0, // Permet au texte de se rétrécir si nécessaire
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Empêche la checkbox de rétrécir
  },
  checkboxLarge: {
    width: 24,
    height: 24,
    flexShrink: 0,
  },
  prayerTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    flex: 1,
    flexShrink: 1, // Permet au texte de se rétrécir
    minWidth: 0, // Important pour flexShrink
  },
  prayerTimeValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontFamily: 'System',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  ishaContainer: {
    marginTop: 4,
  },
  ishaCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  ishaCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  ishaCardGradient: {
    padding: spacing.base + 4,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  ishaCardGlass: {
    padding: spacing.base + 4,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ishaCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  ishaLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
    flex: 1,
  },
  ishaValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System',
    fontVariant: ['tabular-nums'],
  },
});
