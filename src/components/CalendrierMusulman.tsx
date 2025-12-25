/**
 * Composant CalendrierMusulman
 * 
 * Affiche un calendrier Hijri officiel adapté au pays de l'utilisateur.
 * 
 * Fonctionnalités :
 * - Détection automatique du pays
 * - Adaptation du calendrier selon les calendriers officiels (Umm al-Qura, etc.)
 * - Affichage de la date Hijri du jour
 * - Affichage du mois Hijri avec les jours de la semaine
 * - Affichage des événements religieux majeurs (Ramadan, Aïd, etc.)
 * - Section scrollable verticalement
 * - Design moderne et discret
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { useTranslation } from 'react-i18next';
import { Calendar, Star, ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  getTodayHijriDate,
  getCurrentHijriCalendar,
  getHijriCalendarForMonth,
  detectUserCountry,
  getCalendarMethodForCountry,
  type CalendarMonth,
  type CalendarDay,
  MAJOR_RELIGIOUS_EVENTS,
} from '@/services/hijriCalendar';

/**
 * Noms des jours de la semaine en arabe et français
 */
const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const WEEKDAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Composant principal du calendrier musulman
 */
export function CalendrierMusulman() {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t, i18n } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [todayHijri, setTodayHijri] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<CalendarMonth | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentHijriYear, setCurrentHijriYear] = useState<number | null>(null);
  const [currentHijriMonth, setCurrentHijriMonth] = useState<number | null>(null);
  
  // Animation glow pour la date actuelle
  const glowOpacity = useSharedValue(0.5);
  const glowScale = useSharedValue(1);

  // Animation glow pulsante pour la date actuelle
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
    
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  // Style animé pour le glow
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  // Charger les données du calendrier
  useEffect(() => {
    let mounted = true;

    const loadCalendar = async () => {
      try {
        setLoading(true);
        setError(null);

        // Détecter le pays de l'utilisateur
        const detectedCountry = await detectUserCountry();
        if (mounted) {
          setCountryCode(detectedCountry);
        }

        // Obtenir la date Hijri d'aujourd'hui
        const hijriDate = await getTodayHijriDate(detectedCountry);
        if (mounted && hijriDate) {
          const dateStr = `${hijriDate.day} ${hijriDate.month.ar} ${hijriDate.year}`;
          setTodayHijri(dateStr);
        }

        // Obtenir le calendrier complet du mois
        const calendarData = await getCurrentHijriCalendar(detectedCountry);
        if (mounted && calendarData) {
          setCalendar(calendarData);
          setCurrentHijriYear(calendarData.hijriYear);
          setCurrentHijriMonth(calendarData.hijriMonth);
        }
      } catch (err: unknown) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du calendrier';
          setError(errorMessage);
          console.error('[CalendrierMusulman] Erreur:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCalendar();

    return () => {
      mounted = false;
    };
  }, []);

  // Obtenir les noms des jours selon la langue
  const getWeekdays = () => {
    const lang = i18n.language || 'fr';
    if (lang === 'ar') return WEEKDAYS_AR;
    if (lang === 'en') return WEEKDAYS_EN;
    return WEEKDAYS_FR;
  };

  // Charger un mois spécifique
  const loadMonth = async (hijriYear: number, hijriMonth: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const calendarData = await getHijriCalendarForMonth(hijriYear, hijriMonth, countryCode);
      if (calendarData) {
        setCalendar(calendarData);
        setCurrentHijriYear(hijriYear);
        setCurrentHijriMonth(hijriMonth);
      } else {
        setError('Impossible de charger le calendrier pour ce mois');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du calendrier';
      setError(errorMessage);
      console.error('[CalendrierMusulman] Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation vers le mois précédent
  const goToPreviousMonth = () => {
    if (!currentHijriYear || !currentHijriMonth) return;
    
    let newMonth = currentHijriMonth - 1;
    let newYear = currentHijriYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear = currentHijriYear - 1;
    }
    
    loadMonth(newYear, newMonth);
  };

  // Navigation vers le mois suivant
  const goToNextMonth = () => {
    if (!currentHijriYear || !currentHijriMonth) return;
    
    let newMonth = currentHijriMonth + 1;
    let newYear = currentHijriYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear = currentHijriYear + 1;
    }
    
    loadMonth(newYear, newMonth);
  };

  // Retourner au mois actuel
  const goToCurrentMonth = async () => {
    if (!countryCode) return;
    const todayHijri = await getTodayHijriDate(countryCode);
    if (todayHijri) {
      const year = parseInt(String(todayHijri.year));
      const monthNum = typeof todayHijri.month === 'object' && todayHijri.month !== null && 'number' in todayHijri.month
        ? (todayHijri.month as { number?: unknown }).number
        : (typeof todayHijri.month === 'number' ? todayHijri.month : todayHijri.month);
      const month = parseInt(String(monthNum || '1'));
      loadMonth(year, month);
    }
  };

  // Obtenir les événements religieux du mois
  const getMonthEvents = (): typeof MAJOR_RELIGIOUS_EVENTS => {
    if (!calendar) return [];
    return MAJOR_RELIGIOUS_EVENTS.filter(
      event => event.hijriMonth === calendar.hijriMonth
    );
  };

  // Rendre un jour du calendrier
  const renderDay = (day: CalendarDay, index: number) => {
    const weekdays = getWeekdays();
    const weekdayIndex = index % 7;
    const isWeekend = weekdayIndex === 5 || weekdayIndex === 6; // Vendredi et Samedi
    const hasEvent = day.events && day.events.length > 0;

    return (
      <Animated.View
        key={`${day.hijriDay}-${day.hijriMonth}-${day.hijriYear}`}
        entering={FadeInDown
          .delay(index * 8)
          .duration(400)
          .springify()
          .damping(20)}
        style={[
          styles.dayContainer,
          day.isToday && styles.todayDayContainer,
          isWeekend && styles.weekendDay,
        ]}
      >
        {day.isToday ? (
          <View style={styles.todayDayWrapper}>
            {/* Halo glow externe */}
            <Animated.View
              style={[
                styles.glowHalo,
                {
                  backgroundColor: theme.colors.accent,
                  shadowColor: theme.colors.accent,
                },
                glowAnimatedStyle,
              ]}
            />
            {/* Halo glow moyen */}
            <Animated.View
              style={[
                styles.glowHaloMedium,
                {
                  backgroundColor: theme.colors.accent,
                  shadowColor: theme.colors.accent,
                },
                glowAnimatedStyle,
              ]}
            />
            {/* Gradient de fond avec glow */}
          <LinearGradient
              colors={[
                theme.colors.accent + '40',
                theme.colors.accent + '25',
                theme.colors.accent + '10',
              ]}
              style={[styles.dayGradient, { shadowColor: theme.colors.accent }]}
          >
            <View style={styles.dayHeader}>
                <Animated.View
                  style={[
                    styles.todayBadge,
                    {
                      backgroundColor: theme.colors.accent,
                      shadowColor: theme.colors.accent,
                    },
                    glowAnimatedStyle,
                  ]}
                >
                <Text style={[styles.dayNumber, { color: '#0A0F2C' }]}>
                  {day.hijriDay}
                </Text>
                </Animated.View>
            </View>
            <Text style={[styles.gregorianDate, { color: theme.colors.accent }]}>
              {day.gregorianDay}/{day.gregorianMonth}
            </Text>
            {hasEvent && (
              <View style={styles.eventDotContainer}>
                <View style={[styles.eventDot, { backgroundColor: theme.colors.accent }]} />
              </View>
            )}
          </LinearGradient>
          </View>
        ) : (
          <>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayNumber, { color: theme.colors.text }]}>
                {day.hijriDay}
              </Text>
            </View>
            <Text style={[styles.gregorianDate, { color: theme.colors.textSecondary }]}>
              {day.gregorianDay}/{day.gregorianMonth}
            </Text>
            {hasEvent && (
              <View style={styles.eventDotContainer}>
                <View style={[styles.eventDot, { backgroundColor: theme.colors.accent }]} />
              </View>
            )}
          </>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {t('calendar.loading') || 'Chargement du calendrier...'}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.errorText, { color: theme.colors.error || '#EF4444' }]}>
          {error}
        </Text>
      </View>
    );
  }

  const monthEvents = getMonthEvents();
  const weekdays = getWeekdays();

  return (
    <Animated.View 
      entering={FadeIn
        .duration(500)
        .springify()
        .damping(22)}
      style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}
    >
      {/* En-tête avec date du jour */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent + '20' }]}>
            <Calendar size={20} color={theme.colors.accent} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t('calendar.title') || 'Calendrier Hijri'}
            </Text>
            {todayHijri && (
              <Text style={[styles.todayDate, { color: theme.colors.accent }]}>
                {todayHijri}
              </Text>
            )}
          </View>
        </View>
        {countryCode && (
          <View style={[styles.countryBadge, { backgroundColor: theme.colors.accent + '15', borderColor: theme.colors.accent + '30' }]}>
            <Text style={[styles.countryInfo, { color: theme.colors.accent }]}>
              {countryCode}
            </Text>
          </View>
        )}
      </View>

      {/* Section scrollable du calendrier */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
            {/* Mois actuel */}
            {calendar && (
              <>
                <Animated.View 
                  entering={SlideInDown
                    .delay(50)
                    .duration(500)
                    .springify()
                    .damping(22)}
                  style={styles.monthHeader}
                >
                  <LinearGradient
                    colors={[theme.colors.accent + '20', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.monthGradient}
                  >
                    <View style={styles.monthNavigation}>
                      <Pressable
                        onPress={goToPreviousMonth}
                        style={({ pressed }) => [
                          styles.navButton,
                          { backgroundColor: theme.colors.accent + '15' },
                          pressed && { opacity: 0.7 }
                        ]}
                      >
                        <ChevronLeft size={20} color={theme.colors.accent} />
                      </Pressable>
                      
                      <Pressable
                        onPress={goToCurrentMonth}
                        style={styles.monthTitleContainer}
                      >
                        <Text style={[styles.monthName, { color: theme.colors.text }]}>
                          {calendar.monthNameAr || calendar.monthName} {calendar.hijriYear}
                        </Text>
                        <Text style={[styles.monthSubtitle, { color: theme.colors.textSecondary }]}>
                          {i18n.language === 'ar' ? 'اضغط للعودة إلى اليوم' : 'Appuyez pour revenir à aujourd\'hui'}
                        </Text>
                      </Pressable>
                      
                      <Pressable
                        onPress={goToNextMonth}
                        style={({ pressed }) => [
                          styles.navButton,
                          { backgroundColor: theme.colors.accent + '15' },
                          pressed && { opacity: 0.7 }
                        ]}
                      >
                        <ChevronRight size={20} color={theme.colors.accent} />
                      </Pressable>
                    </View>
                  </LinearGradient>
                </Animated.View>

            {/* Jours de la semaine */}
            <View style={styles.weekdaysContainer}>
              {weekdays.map((day, index) => (
                <View key={index} style={styles.weekday}>
                  <Text style={[styles.weekdayText, { color: theme.colors.textSecondary }]}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Grille des jours */}
            <View style={styles.daysGrid}>
              {calendar.days.map((day, index) => renderDay(day, index))}
            </View>

            {/* Événements religieux du mois */}
            {monthEvents.length > 0 && (
              <Animated.View 
                entering={FadeInDown
                  .delay(150)
                  .duration(450)
                  .springify()
                  .damping(20)}
                style={styles.eventsSection}
              >
                <View style={styles.eventsTitleContainer}>
                  <Star size={18} color={theme.colors.accent} />
                  <Text style={[styles.eventsTitle, { color: theme.colors.text }]}>
                    {t('calendar.events') || 'Événements religieux'}
                  </Text>
                </View>
                {monthEvents.map((event, index) => (
                  <Animated.View
                    key={index}
                    entering={FadeInDown
                      .delay(200 + index * 40)
                      .duration(400)
                      .springify()
                      .damping(18)}
                    style={[
                      styles.eventItem,
                      { 
                        borderColor: theme.colors.accent + '30',
                        backgroundColor: theme.colors.accent + '08',
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={[theme.colors.accent + '25', theme.colors.accent + '10']}
                      style={styles.eventDateGradient}
                    >
                      <Text style={[styles.eventDateText, { color: theme.colors.accent }]}>
                        {event.hijriDay}
                      </Text>
                      <Text style={[styles.eventMonthText, { color: theme.colors.accent + '80' }]}>
                        /{event.hijriMonth}
                      </Text>
                    </LinearGradient>
                    <View style={styles.eventContent}>
                      <Text style={[styles.eventName, { color: theme.colors.text }]}>
                        {i18n.language === 'ar' && event.nameAr ? event.nameAr : event.name}
                      </Text>
                      {event.description && (
                        <Text style={[styles.eventDescription, { color: theme.colors.textSecondary }]}>
                          {event.description}
                        </Text>
                      )}
                    </View>
                  </Animated.View>
                ))}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12, // Cohérent avec les autres cartes de l'app
    padding: 16, // Cohérent avec les autres cartes
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', // Identique aux autres cartes
    maxHeight: 500,
    overflow: 'hidden',
    elevation: 2, // Identique aux autres cartes
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 6,
  },
  todayDate: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  countryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  countryInfo: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24, // Plus d'espace en bas pour permettre un scroll complet
    flexGrow: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'System',
  },
  errorText: {
    padding: 16,
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
  },
  monthHeader: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  monthGradient: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  monthName: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System',
    textAlign: 'center',
  },
  monthSubtitle: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'System',
    marginTop: 2,
    textAlign: 'center',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginBottom: 6,
  },
  todayDayContainer: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  todayDayWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowHalo: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },
  glowHaloMedium: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    opacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  dayGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
    zIndex: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  weekendDay: {
    opacity: 0.6,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 4,
  },
  todayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 12,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'System',
  },
  gregorianDate: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '500',
    marginTop: 2,
  },
  eventDotContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventsSection: {
    marginTop: 20,
    paddingTop: 20,
    paddingBottom: 8, // Espace supplémentaire en bas de la section événements
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  eventItem: {
    flexDirection: 'row',
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventDateGradient: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  eventDateText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  eventMonthText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 12,
    fontFamily: 'System',
  },
});

