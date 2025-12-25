/**
 * Composant HijriCalendarView
 * 
 * Calendrier Hijri classique avec grille de jours
 * - Affichage par mois avec grille 7x6
 * - Navigation entre les mois avec swipe horizontal
 * - Animations fluides style iOS
 * - Mise en évidence du jour actuel et des événements religieux
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { useTranslation } from 'react-i18next';
import {
  getTodayHijriDate,
  getHijriCalendarForMonth,
  detectUserCountry,
  type CalendarMonth,
  type CalendarDay,
  MAJOR_RELIGIOUS_EVENTS,
} from '@/services/hijriCalendar';
import { PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ANIMATION_DURATION, STAGGER_DELAY } from '@/utils/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Noms des jours de la semaine
 */
const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const WEEKDAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface HijriCalendarViewProps {
  initialYear?: number;
  initialMonth?: number;
}

export function HijriCalendarView({ initialYear, initialMonth }: HijriCalendarViewProps = {} as HijriCalendarViewProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t, i18n } = useTranslation();
  const haptic = useHapticFeedback();
  
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number | null>(null);
  const [calendar, setCalendar] = useState<CalendarMonth | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Animations pour le swipe horizontal
  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const isAnimating = useSharedValue(false);
  
  // Animation glow pour la date actuelle
  const glowOpacity = useSharedValue(0.6);
  const glowScale = useSharedValue(1);
  
  // Références pour la navigation
  const calendarsCache = useRef<Map<string, CalendarMonth>>(new Map());
  const todayHijri = useRef<{ year: number; month: number; day: number } | null>(null);

  // Animation glow pulsante pour la date actuelle
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
    
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);
  
  // Animation d'apparition pour la grille du calendrier
  const gridOpacity = useSharedValue(0);
  const gridScale = useSharedValue(0.95);
  
  useEffect(() => {
    if (calendar && calendar.days.length > 0) {
      gridOpacity.value = withTiming(1, { duration: ANIMATION_DURATION.NORMAL });
      gridScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }
  }, [calendar, gridOpacity, gridScale]);
  
  const gridAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: gridOpacity.value,
      transform: [{ scale: gridScale.value }],
    };
  });

  // Initialiser le calendrier
  useEffect(() => {
    let mounted = true;

    const initializeCalendar = async () => {
      try {
        setLoading(true);
        setError(null);

        // Détecter le pays
        const detectedCountry = await detectUserCountry();
        if (mounted) {
          setCountryCode(detectedCountry);
        }

        // Obtenir la date Hijri d'aujourd'hui
        const today = await getTodayHijriDate(detectedCountry);
        if (!today) {
          throw new Error('Impossible de charger la date Hijri');
        }

        const year = initialYear ?? parseInt(today.year, 10);
        const month = initialMonth ?? today.month.number;
        const day = parseInt(today.day, 10);

        if (mounted) {
          todayHijri.current = { year, month, day };
          setCurrentYear(year);
          setCurrentMonth(month);
        }

        // Charger le calendrier du mois
        const calendarData = await loadMonth(year, month, detectedCountry);
        if (mounted && calendarData) {
          setCalendar(calendarData);
        }
      } catch (err: unknown) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du calendrier';
          setError(errorMessage);
          // Erreur silencieuse en production
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeCalendar();

    return () => {
      mounted = false;
    };
  }, []);

  // Charger un mois spécifique
  const loadMonth = async (
    year: number,
    month: number,
    countryCode: string | null
  ): Promise<CalendarMonth | null> => {
    const cacheKey = `${year}-${month}`;
    
    // Vérifier le cache
    if (calendarsCache.current.has(cacheKey)) {
      return calendarsCache.current.get(cacheKey)!;
    }

    const calendarData = await getHijriCalendarForMonth(year, month, countryCode);
    if (calendarData) {
      calendarsCache.current.set(cacheKey, calendarData);
    }
    
    return calendarData;
  };

  // Navigation vers le mois précédent
  const goToPreviousMonth = async () => {
    if (!currentYear || !currentMonth || isAnimating.value) return;
    
    isAnimating.value = true;
    translateX.value = withSpring(SCREEN_WIDTH, {
      damping: 25,
      stiffness: 100,
      mass: 0.8,
    }, () => {
      runOnJS(changeMonth)(-1);
    });
  };

  // Navigation vers le mois suivant
  const goToNextMonth = async () => {
    if (!currentYear || !currentMonth || isAnimating.value) return;
    
    isAnimating.value = true;
    translateX.value = withSpring(-SCREEN_WIDTH, {
      damping: 25,
      stiffness: 100,
      mass: 0.8,
    }, () => {
      runOnJS(changeMonth)(1);
    });
  };

  // Changer de mois (appelé après l'animation)
  const changeMonth = async (direction: number) => {
    if (!currentYear || !currentMonth) return;

    let newMonth = currentMonth + direction;
    let newYear = currentYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear = currentYear - 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear = currentYear + 1;
    }

    // Charger le nouveau mois
    const calendarData = await loadMonth(newYear, newMonth, countryCode);
    if (calendarData) {
      setCurrentYear(newYear);
      setCurrentMonth(newMonth);
      setCalendar(calendarData);
      
      // Réinitialiser l'animation
      translateX.value = 0;
      isAnimating.value = false;
    }
  };

  // PanResponder pour le swipe horizontal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Ne capturer que les gestes horizontaux
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        if (isAnimating.value) return;
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (isAnimating.value) return;
        // Suivre le mouvement avec une résistance naturelle
        const resistance = 0.95; // Légère résistance pour un mouvement plus naturel
        translateX.value = gestureState.dx * resistance;
      },
      onPanResponderRelease: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (isAnimating.value) return;
        
        const swipeThreshold = SCREEN_WIDTH * 0.25; // 25% de l'écran
        const velocityThreshold = 0.5;

        if (gestureState.dx > swipeThreshold || gestureState.vx > velocityThreshold) {
          // Swipe vers la droite : mois précédent
          goToPreviousMonth();
        } else if (gestureState.dx < -swipeThreshold || gestureState.vx < -velocityThreshold) {
          // Swipe vers la gauche : mois suivant
          goToNextMonth();
        } else {
          // Revenir à la position initiale avec animation douce
          translateX.value = withSpring(0, {
            damping: 25,
            stiffness: 100,
            mass: 0.8,
          });
        }
      },
    })
  ).current;

  // Obtenir les noms des jours selon la langue
  const getWeekdays = () => {
    const lang = i18n.language || 'fr';
    if (lang === 'ar') return WEEKDAYS_AR;
    if (lang === 'en') return WEEKDAYS_EN;
    return WEEKDAYS_FR;
  };

  // Construire la grille du calendrier (7 colonnes x 6 lignes)
  const buildCalendarGrid = (): (CalendarDay | null)[][] => {
    if (!calendar || !calendar.days.length) return [];

    const grid: (CalendarDay | null)[][] = [];
    
    // Trouver le premier jour du mois
    const firstDay = calendar.days[0];
    if (!firstDay) return [];

    // Déterminer le jour de la semaine du premier jour
    // Utiliser le weekday en anglais pour trouver l'index
    let startIndex = 0;
    const firstDayWeekday = (firstDay.weekday || '').toLowerCase();
    
    // Mapping des jours de la semaine en anglais vers l'index (0 = Dimanche)
    const weekdayMap: Record<string, number> = {
      'sunday': 0, 'sun': 0,
      'monday': 1, 'mon': 1,
      'tuesday': 2, 'tue': 2,
      'wednesday': 3, 'wed': 3,
      'thursday': 4, 'thu': 4,
      'friday': 5, 'fri': 5,
      'saturday': 6, 'sat': 6,
    };
    
    // Essayer de trouver l'index depuis le weekday
    for (const [key, value] of Object.entries(weekdayMap)) {
      if (firstDayWeekday.includes(key)) {
        startIndex = value;
        break;
      }
    }
    
    // Fallback : calculer depuis la date grégorienne si weekday n'est pas disponible
    if (startIndex === 0 && (!firstDayWeekday || firstDayWeekday === '')) {
      try {
        const gregorianDate = new Date(
          firstDay.gregorianYear,
          firstDay.gregorianMonth - 1,
          firstDay.gregorianDay
        );
        startIndex = gregorianDate.getDay(); // 0 = Dimanche, 6 = Samedi
      } catch (_e: unknown) {
        // Si erreur, utiliser 0 par défaut
        startIndex = 0;
      }
    }

    // Créer 6 semaines (42 jours)
    let dayIndex = 0;
    for (let week = 0; week < 6; week++) {
      const weekDays: (CalendarDay | null)[] = [];
      
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const gridIndex = week * 7 + dayOfWeek;
        
        if (gridIndex < startIndex || dayIndex >= calendar.days.length) {
          // Jour vide (avant le début du mois ou après la fin)
          weekDays.push(null);
        } else {
          weekDays.push(calendar.days[dayIndex]);
          dayIndex++;
        }
      }
      
      // Ne garder que les semaines qui ont au moins un jour
      if (weekDays.some(day => day !== null)) {
        grid.push(weekDays);
      }
    }

    return grid;
  };

  // Vérifier si un jour a un événement religieux
  const hasEvent = (day: CalendarDay | null): boolean => {
    if (!day) return false;
    return day.events !== undefined && day.events.length > 0;
  };

  // Vérifier si c'est aujourd'hui
  const isToday = (day: CalendarDay | null): boolean => {
    if (!day || !todayHijri.current) return false;
    return (
      day.hijriDay === todayHijri.current.day &&
      day.hijriMonth === todayHijri.current.month &&
      day.hijriYear === todayHijri.current.year
    );
  };

  // Style animé pour le swipe
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Style animé pour le glow de la date actuelle
  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
      transform: [{ scale: glowScale.value }],
    };
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('calendar.loading') || 'Chargement du calendrier...'}
        </Text>
      </View>
    );
  }

  if (error || !calendar) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: '#EF4444' }]}>
          {error || 'Erreur lors du chargement du calendrier'}
        </Text>
      </View>
    );
  }

  const weekdays = getWeekdays();
  const grid = buildCalendarGrid();

  return (
    <View style={styles.container}>
      {/* En-tête avec année, mois et navigation */}
      <View style={styles.header}>
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

        <View style={styles.headerCenter}>
          <Text style={[styles.yearText, { color: theme.colors.text }]}>
            {calendar.hijriYear}
          </Text>
          <Text style={[styles.monthText, { color: theme.colors.accent }]}>
            {i18n.language === 'ar' ? (calendar.monthNameAr ?? calendar.monthName) : calendar.monthName}
          </Text>
        </View>

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

      {/* Jours de la semaine */}
      <View style={styles.weekdaysRow}>
        {weekdays.map((day, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: theme.colors.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Grille du calendrier avec swipe */}
      <Animated.View
        style={[styles.calendarGridContainer, animatedContainerStyle, gridAnimatedStyle]}
        {...panResponder.panHandlers}
      >
        {grid.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              if (!day) {
                return <View key={dayIndex} style={styles.dayCell} />;
              }

              const isTodayDay = isToday(day);
              const hasEventDay = hasEvent(day);

              return (
                <Pressable
                  key={`${day.hijriDay}-${day.hijriMonth}-${day.hijriYear}`}
                  style={styles.dayCell}
                  onPress={() => {
                    haptic.selection();
                  }}
                >
                  {isTodayDay ? (
                    <View style={styles.todayContainer}>
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
                      {/* Gradient de fond */}
                    <LinearGradient
                        colors={[
                          theme.colors.accent + '40',
                          theme.colors.accent + '20',
                          theme.colors.accent + '10',
                        ]}
                      style={styles.todayGradient}
                    >
                        {/* Badge principal avec glow */}
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
                      {hasEventDay && (
                        <View style={[styles.eventIndicator, { backgroundColor: theme.colors.accent }]} />
                      )}
                    </LinearGradient>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.dayNumber, { color: theme.colors.text }]}>
                        {day.hijriDay}
                      </Text>
                      {hasEventDay && (
                        <View style={[styles.eventIndicator, { backgroundColor: theme.colors.accent }]} />
                      )}
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  monthText: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'System',
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  calendarGridContainer: {
    flex: 1,
    paddingTop: 8,
    minHeight: 300, // Hauteur minimale pour la grille
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayCell: {
    flex: 1,
    minHeight: 40,
    aspectRatio: 1,
    maxWidth: (SCREEN_WIDTH - 32) / 7, // 7 colonnes avec padding
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    position: 'relative',
  },
  todayContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowHalo: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  glowHaloMedium: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    opacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  todayGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  todayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

