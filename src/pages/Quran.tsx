import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { surahs } from '@/data/quranData';
import { getPrayerTimesByCoords } from '@/services/content/prayerServices';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useModuleTracker } from '@/hooks/useModuleTracker';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import { logger } from '@/utils/logger';

/**
 * Page Quran
 * 
 * Affiche :
 * - Widget des heures de prière (si géolocalisation disponible)
 * - Liste de toutes les sourates avec leurs informations
 */
export function Quran() {
  useModuleTracker('Quran');
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  useEffect(() => {
    trackPageView('Quran');
  }, []);
  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadPrayerTimes = async () => {
      try {
        setLoadingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          logger.warn('[Quran] Permission de localisation refusée');
          setErrorMessage(t('settings.permissionDenied') || 'Permission de localisation refusée');
          setLoadingLocation(false);
          return;
        }

        setErrorMessage(null);

        const location = await Location.getCurrentPositionAsync({});
        logger.log('[Quran] Localisation obtenue:', location.coords.latitude, location.coords.longitude);

        const response = await getPrayerTimesByCoords(
          location.coords.latitude,
          location.coords.longitude
        );
        logger.log('[Quran] Réponse API reçue');

        if (response?.data?.timings) {
          // Parser les heures pour extraire uniquement HH:MM (l'API peut retourner "HH:MM (GMT+XX)")
          const parsedTimings: Record<string, string> = {};
          Object.keys(response.data.timings).forEach((key) => {
            const time = response.data.timings[key];
            if (time) {
              // Extraire uniquement HH:MM (enlever le fuseau horaire si présent)
              parsedTimings[key] = time.split(' ')[0];
            }
          });
          logger.log('[Quran] Heures parsées avec succès');
          setTimings(parsedTimings);
        } else {
          logger.warn('[Quran] Format de réponse inattendu');
          setErrorMessage('Format de réponse inattendu de l\'API');
        }
      } catch (error: any) {
        logger.error('[Quran] Erreur lors du chargement des heures de prière:', error);
        setErrorMessage(error?.message || 'Erreur lors du chargement des heures de prière');
      } finally {
        setLoadingLocation(false);
      }
    };

    loadPrayerTimes();
  }, []);

  const prayerTimes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  // Header mémorisé pour FlatList
  const ListHeaderComponent = useMemo(() => (
    <>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('quran.title')}
      </Text>

      {/* Prayer times widget */}
      {loadingLocation ? (
        <View style={[styles.prayerTimesCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
        </View>
      ) : errorMessage ? (
        <View style={[styles.prayerTimesCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {errorMessage}
          </Text>
        </View>
      ) : timings ? (
        <View style={[styles.prayerTimesCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.prayerTimesTitle, { color: theme.colors.text }]}>
            {t('home.prayerTimes') || 'Heures de prière'}
          </Text>
          <View style={styles.prayerTimesContainer}>
            {prayerTimes.map((key, index) => {
              const time = timings[key];
              if (!time) return null;
              const prayerName = t(`prayer.${key.toLowerCase()}`);
              return (
                <Animated.View
                  key={key}
                  entering={FadeIn.delay(index * 50).duration(300)}
                  style={styles.prayerTimeRow}
                >
                  <View style={styles.prayerTimeLeft}>
                    <Text
                      style={[styles.prayerTimeLabel, { color: theme.colors.text }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {prayerName}
                    </Text>
                  </View>
                  <View style={styles.prayerTimeRight}>
                    <Text
                      style={[styles.prayerTimeValue, { color: theme.colors.accent }]}
                      numberOfLines={1}
                    >
                      {time}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>
      ) : null}
    </>
  ), [loadingLocation, errorMessage, timings, theme, t, prayerTimes]);

  // Composant mémorisé pour les sourates
  const SurahItem = React.memo(({ item: surah, index }: { item: typeof surahs[0]; index: number }) => (
    <Pressable
      onPress={() => {
        trackEvent('surah_opened', { surahNumber: surah.number, surahName: surah.name });
        (navigation as any).navigate('QuranReader', { surahNumber: surah.number });
      }}
      style={({ pressed }) => [
        styles.surahCard,
        { backgroundColor: theme.colors.backgroundSecondary },
        pressed && styles.surahCardPressed
      ]}
    >
      <View style={styles.surahContent}>
        <View style={styles.surahLeft}>
          <Animated.View
            entering={FadeIn.delay(index * 50).duration(400)}
            style={styles.surahNumberBadgeContainer}
          >
            <LinearGradient
              colors={[
                theme.colors.accent,
                theme.colors.accent + 'DD',
                theme.colors.accent + 'CC'
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.surahNumberBadge}
            >
              <View style={[styles.surahNumberBadgeInner, { borderColor: 'rgba(255, 255, 255, 0.3)' }]}>
                <Text style={styles.surahNumberText}>{surah.number}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
          <View style={styles.surahInfo}>
            {i18n.language !== 'ar' && (
              <Text style={[styles.surahFrenchName, { color: theme.colors.text }]}>
                {surah.frenchName}
              </Text>
            )}
            <Text style={[styles.surahName, { color: theme.colors.textSecondary }]}>
              {surah.name}
            </Text>
            <Text style={[styles.surahMeta, { color: theme.colors.textSecondary }]}>
              {i18n.t('quran.verses', { count: surah.verses })} •{' '}
              {surah.revelation === 'Meccan' ? i18n.t('quran.meccan') : i18n.t('quran.medinan')}
            </Text>
          </View>
        </View>
        <View style={styles.surahRight}>
          <Text style={[styles.surahArabicName, { color: theme.colors.text }]}>
            {surah.arabicName}
          </Text>
          {i18n.language !== 'ar' && (
            <Text style={[styles.surahFrenchNameSmall, { color: theme.colors.textSecondary }]}>
              {surah.frenchName}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  ));

  const renderSurah = useCallback(({ item, index }: { item: typeof surahs[0]; index: number }) => (
    <SurahItem item={item} index={index} />
  ), [theme, navigation]);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />

      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <FlashList
          data={surahs}
          renderItem={renderSurah}
          keyExtractor={(item) => item.number.toString()}
          ListHeaderComponent={ListHeaderComponent}
          contentContainerStyle={styles.surahsList}
          // @ts-ignore - False positive: estimatedItemSize exists on FlashList
          estimatedItemSize={112}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 24,
  },
  prayerTimesCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  prayerTimesTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 16,
    textAlign: 'center',
  },
  prayerTimesContainer: {
    width: '100%',
  },
  prayerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 56,
  },
  prayerTimeLeft: {
    flex: 1,
    paddingRight: 16,
    justifyContent: 'center',
  },
  prayerTimeRight: {
    minWidth: 75,
    alignItems: 'flex-end',
    justifyContent: 'center',
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
  surahsList: {
    gap: 12,
  },
  surahCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  surahCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  surahContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
  },
  surahLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  surahNumberBadgeContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  surahNumberBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  surahNumberBadgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  surahNumberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  surahInfo: {
    flex: 1,
  },
  surahFrenchName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  surahName: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 4,
    opacity: 0.7,
  },
  surahMeta: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'System',
    opacity: 0.6,
  },
  surahRight: {
    alignItems: 'flex-end',
    minWidth: 120,
    maxWidth: '40%',
  },
  surahArabicName: {
    fontSize: 24,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  surahFrenchNameSmall: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'right',
    opacity: 0.7,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    opacity: 0.7,
  },
});
