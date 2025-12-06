import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, Check } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { getPrayerTimesByCoords } from '@/services/hijri';
import * as Location from 'expo-location';
import Svg, { Rect, Line } from 'react-native-svg';

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
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedPrayers, setCompletedPrayers] = useState<Set<string>>(new Set());
  const isAuthenticated = Boolean(user?.id);

  useEffect(() => {
    if (visible) {
      // Réinitialiser les états quand le modal s'ouvre
      setLoading(true);
      setError(null);
      setTimings(null);
      loadPrayerTimes();
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
      
      let latitude: number;
      let longitude: number;
      
      // Essayer d'abord d'obtenir la localisation actuelle
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Permission de localisation refusée');
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000,
        });
        
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      } catch (locationError: any) {
        // Si la géolocalisation échoue, utiliser la localisation de l'utilisateur stockée
        console.warn('Géolocalisation échouée, utilisation de la localisation du profil:', locationError);
        
        const userLocation = user?.location;
        if (userLocation?.latitude && userLocation?.longitude) {
          latitude = userLocation.latitude;
          longitude = userLocation.longitude;
        } else {
          throw new Error('Localisation non disponible. Veuillez activer la localisation ou définir votre position dans les paramètres.');
        }
      }

      // Charger les heures de prière avec les coordonnées obtenues
      const { data } = await getPrayerTimesByCoords(latitude, longitude);
      console.log('Heures de prière chargées:', data.timings);
      setTimings(data.timings);
    } catch (err: any) {
      console.error('Erreur lors du chargement des heures de prière:', err);
      setError(err.message || 'Impossible de charger les heures de prière');
    } finally {
      setLoading(false);
    }
  };

  const togglePrayer = (prayerName: string) => {
    // Permettre de voir les prières même sans authentification
    // Mais ne pas permettre de les cocher sans être connecté
    if (!isAuthenticated || !user?.id) {
      Alert.alert('Information', 'Connectez-vous pour marquer les prières comme complétées');
      return;
    }
    
    setCompletedPrayers(prev => {
      const next = new Set(prev);
      if (next.has(prayerName)) {
        next.delete(prayerName);
      } else {
        next.add(prayerName);
      }
      return next;
    });
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
        <Pressable 
          style={styles.modalContent} 
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.gradient, { backgroundColor: theme.colors.backgroundSecondary }]}>
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
                  {/* Bouton Boussole Qibla */}
                  <View style={styles.qiblaButtonContainer}>
                    <Pressable
                      onPress={() => {
                        onClose();
                        navigation.navigate('QiblaPage' as never);
                      }}
                      style={({ pressed }) => [
                        styles.qiblaButton,
                        {
                          backgroundColor: theme.colors.backgroundSecondary,
                          borderColor: theme.colors.accent,
                        },
                        pressed && styles.qiblaButtonPressed
                      ]}
                    >
                      <KaabaIcon size={32} />
                      <Text style={[styles.qiblaButtonText, { color: theme.colors.text }]}>
                        Boussole Qibla
                      </Text>
                    </Pressable>
                  </View>

                  {/* Grille des heures de prière - 2 colonnes */}
                  <View style={styles.prayerTimesGrid}>
                    {mainPrayers.map((key, index) => {
                      const isCompleted = completedPrayers.has(key);
                      const canToggle = isAuthenticated;
                      
                      return (
                        <View
                          key={key}
                          style={styles.prayerTimeCardWrapper}
                        >
                          <Pressable
                            onPress={() => canToggle && togglePrayer(key)}
                            disabled={!canToggle}
                            style={({ pressed }) => [
                              styles.prayerTimeCard,
                              {
                                backgroundColor: isCompleted 
                                  ? 'rgba(106, 79, 182, 0.2)' 
                                  : 'rgba(255, 255, 255, 0.05)',
                                borderColor: isCompleted 
                                  ? theme.colors.accent 
                                  : 'rgba(255, 255, 255, 0.1)',
                                opacity: canToggle ? 1 : 0.6,
                              },
                              pressed && canToggle && styles.prayerTimeCardPressed
                            ]}
                          >
                            <View style={styles.prayerTimeCardContent}>
                              <View style={styles.prayerTimeLeft}>
                                {isAuthenticated && (
                                  <View
                                    style={[
                                      styles.checkbox,
                                      {
                                        backgroundColor: isCompleted 
                                          ? theme.colors.accent 
                                          : 'transparent',
                                        borderColor: isCompleted 
                                          ? theme.colors.accent 
                                          : 'rgba(255, 255, 255, 0.3)',
                                      }
                                    ]}
                                  >
                                    {isCompleted && (
                                      <Check size={12} color={theme.colors.background} />
                                    )}
                                  </View>
                                )}
                                <Text 
                                  style={[
                                    styles.prayerTimeLabel, 
                                    { 
                                      color: theme.colors.textSecondary,
                                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                                      opacity: isCompleted ? 0.6 : 1,
                                    }
                                  ]}
                                  numberOfLines={1}
                                >
                                  {prayerNames[key] || key}
                                </Text>
                              </View>
                              <Text style={[styles.prayerTimeValue, { color: theme.colors.text }]}>
                                {timings[key] || '—'}
                              </Text>
                            </View>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>

                  {/* Isha centrée en bas */}
                  <View style={styles.ishaContainer}>
                    <Pressable
                      onPress={() => isAuthenticated && togglePrayer(ishaPrayer)}
                      disabled={!isAuthenticated}
                      style={({ pressed }) => [
                        styles.ishaCard,
                        {
                          borderColor: completedPrayers.has(ishaPrayer)
                            ? theme.colors.accent
                            : theme.colors.accent,
                          borderOpacity: completedPrayers.has(ishaPrayer) ? 1 : 0.3,
                          opacity: isAuthenticated ? 1 : 0.6,
                        },
                        pressed && isAuthenticated && styles.ishaCardPressed
                      ]}
                    >
                      <View style={styles.ishaCardContent}>
                        <View style={styles.prayerTimeLeft}>
                          {isAuthenticated && (
                            <View
                              style={[
                                styles.checkbox,
                                {
                                  backgroundColor: completedPrayers.has(ishaPrayer)
                                    ? theme.colors.accent
                                    : 'transparent',
                                  borderColor: completedPrayers.has(ishaPrayer)
                                    ? theme.colors.accent
                                    : 'rgba(255, 255, 255, 0.3)',
                                }
                              ]}
                            >
                              {completedPrayers.has(ishaPrayer) && (
                                <Check size={12} color={theme.colors.background} />
                              )}
                            </View>
                          )}
                          <Text 
                            style={[
                              styles.ishaLabel, 
                              { 
                                color: theme.colors.text,
                                textDecorationLine: completedPrayers.has(ishaPrayer) ? 'line-through' : 'none',
                                opacity: completedPrayers.has(ishaPrayer) ? 0.6 : 1,
                              }
                            ]}
                          >
                            {prayerNames[ishaPrayer] || ishaPrayer}
                          </Text>
                        </View>
                        <Text style={[styles.ishaValue, { color: theme.colors.text }]}>
                          {timings[ishaPrayer] || '—'}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </>
              ) : null}
            </ScrollView>
          </View>
        </Pressable>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 20,
    backgroundColor: 'transparent',
  },
  gradient: {
    width: '100%',
    flex: 1,
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
    marginBottom: 20,
  },
  qiblaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
  },
  qiblaButtonPressed: {
    opacity: 0.7,
  },
  qiblaButtonText: {
    fontSize: 18,
    fontWeight: '600',
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  prayerTimeCardPressed: {
    opacity: 0.7,
  },
  prayerTimeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  prayerTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    flex: 1,
  },
  prayerTimeValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
    fontVariant: ['tabular-nums'],
  },
  ishaContainer: {
    marginTop: 4,
  },
  ishaCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
  },
  ishaCardPressed: {
    opacity: 0.7,
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
