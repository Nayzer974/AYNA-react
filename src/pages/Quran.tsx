import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { surahs } from '@/data/quranData';
import { getPrayerTimesByCoords } from '@/services/hijri';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useModuleTracker } from '@/hooks/useModuleTracker';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { trackPageView, trackEvent } from '@/services/analytics';

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

  useEffect(() => {
    const loadPrayerTimes = async () => {
      try {
        setLoadingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission de localisation refusée');
          setLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { data } = await getPrayerTimesByCoords(
          location.coords.latitude,
          location.coords.longitude
        );
        setTimings(data.timings);
      } catch (error) {
        console.warn('Erreur lors du chargement des heures de prière:', error);
      } finally {
        setLoadingLocation(false);
      }
    };

    loadPrayerTimes();
  }, []);

  const prayerTimes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Sunrise'];

  const renderSurah = useCallback(({ item: surah, index }: { item: typeof surahs[0]; index: number }) => (
    <Pressable
      key={surah.number}
      onPress={() => {
        trackEvent('surah_opened', { surahNumber: surah.number, surahName: surah.name });
        navigation.navigate('QuranReader' as never, { surahNumber: surah.number } as never);
      }}
      style={({ pressed }) => [
        styles.surahCard,
        { backgroundColor: theme.colors.backgroundSecondary },
        pressed && styles.surahCardPressed
      ]}
    >
      <View style={styles.surahContent}>
        <View style={styles.surahLeft}>
          <View style={[styles.surahNumberBadge, { backgroundColor: theme.colors.accent }]}>
            <Text style={styles.surahNumberText}>{surah.number}</Text>
          </View>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('quran.title')}
          </Text>

          {/* Prayer times widget */}
          {loadingLocation ? (
            <View style={[styles.prayerTimesCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
            </View>
          ) : timings ? (
            <View style={[styles.prayerTimesCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <View style={styles.prayerTimesGrid}>
                {prayerTimes.map((key) => (
                  <View key={key} style={[styles.prayerTimeItem, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <Text style={[styles.prayerTimeLabel, { color: theme.colors.text }]}>
                      {t(`prayer.${key.toLowerCase()}`)}
                    </Text>
                    <Text style={[styles.prayerTimeValue, { color: theme.colors.text }]}>
                      {timings[key]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Liste des sourates */}
          <FlatList
            data={surahs}
            renderItem={renderSurah}
            keyExtractor={(item) => item.number.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.surahsList}
          />
        </ScrollView>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  prayerTimesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  prayerTimeItem: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerTimeLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  prayerTimeValue: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'System',
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
  surahNumberBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surahNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
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
});
