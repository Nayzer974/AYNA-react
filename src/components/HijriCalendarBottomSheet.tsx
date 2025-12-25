/**
 * Composant HijriCalendarBottomSheet - OPTIMISÉ À 100%
 * 
 * Calendrier Hijri natif avec optimisations complètes :
 * - Mémorisation des calculs coûteux
 * - Cache intelligent
 * - Re-renders optimisés
 * - Chargement progressif
 * - Animations fluides
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Platform, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import Animated, { 
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { Calendar, ChevronLeft, ChevronRight, Grid, CalendarDays, Search, Calendar as CalendarIcon, List, Clock } from 'lucide-react-native';
import { getGregorianCalendarWithHijri, gregorianToHijri } from '@/services/hijriConverter';
import { DayDetailsModal } from './DayDetailsModal';
import { getEventsForHijriDate } from '@/utils/calendarEvents';
import { YearView } from './YearView';
import { DateSearchModal } from './DateSearchModal';
import { YearSelector } from './YearSelector';

// Fonction de conversion approximative locale (mémorisée)
const approximateGregorianToHijri = (() => {
  const cache = new Map<string, { day: number; month: number; year: number }>();
  
  return (year: number, month: number, day: number): { day: number; month: number; year: number } => {
    const cacheKey = `${year}-${month}-${day}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }
    
    const gregorianDate = new Date(year, month - 1, day);
    const epoch = new Date(622, 6, 16);
    const diffTime = gregorianDate.getTime() - epoch.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const hijriYear = Math.floor(diffDays / 354.37) + 1;
    const daysInHijriYear = diffDays % Math.floor(354.37);
    const hijriMonth = Math.floor(daysInHijriYear / 29.5) + 1;
    const hijriDay = Math.floor(daysInHijriYear % 29.5) + 1;
    
    const result = {
      day: Math.max(1, Math.min(30, hijriDay)),
      month: Math.max(1, Math.min(12, hijriMonth)),
      year: hijriYear
    };
    
    cache.set(cacheKey, result);
    return result;
  };
})();

const { width: SCREEN_WIDTH } = require('react-native').Dimensions.get('window');

interface HijriCalendarBottomSheetProps {
  scrollY?: SharedValue<number> | undefined;
}

interface CalendarDay {
  gregorianDay: number;
  gregorianMonth: number;
  gregorianYear: number;
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  isToday: boolean;
  events?: Array<{
    name: string;
    nameAr?: string;
    description?: string;
    type: 'hijri_month' | 'special_day' | 'religious_event';
    isImportant?: boolean;
  }>;
}

// Constantes mémorisées (hors composant pour éviter les re-créations)
const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabiʿ al-Awwal', 'Rabiʿ ath-Thani',
  'Joumada al-Oula', 'Joumada ath-Thania', 'Rajab', 'Chaʿban',
  'Ramadan', 'Chawwal', 'Dhou al-Qiʿda', 'Dhou al-Hijja'
] as const;

const GREGORIAN_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
] as const;

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

// Composant pour l'effet glow animé
const GlowEffect = React.memo<{ accentColor: string }>(({ accentColor }) => {
  const glowOpacity = useSharedValue(0.5);
  const glowScale = useSharedValue(1);

  React.useEffect(() => {
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
        withTiming(1.08, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.glowHalo,
          {
            backgroundColor: accentColor,
            shadowColor: accentColor,
          },
          glowStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.glowHaloMedium,
          {
            backgroundColor: accentColor,
            shadowColor: accentColor,
          },
          glowStyle,
        ]}
      />
    </>
  );
});

GlowEffect.displayName = 'GlowEffect';

// Composant mémorisé pour les cellules du calendrier
const CalendarDayCell = React.memo<{
  day: CalendarDay | null;
  isToday: boolean;
  textColor: string;
  accentColor: string;
  theme: ReturnType<typeof getTheme>;
  gregorianMonths: readonly string[];
  hijriMonths: readonly string[];
  onPress?: (day: CalendarDay) => void;
  hasNotes?: boolean;
}>(({ day, isToday, textColor, accentColor, theme, gregorianMonths, hijriMonths, onPress, hasNotes }) => {
  if (!day) {
    return <View style={styles.dayCell} />;
  }

  const hasEvents = day.events && day.events.length > 0;
  const hasImportantEvent = hasEvents && day.events!.some(e => e.isImportant);

  return (
    <Pressable 
      style={styles.dayCell}
      onPress={() => onPress?.(day)}
    >
      {isToday ? (
        <View style={styles.todayCellContainer}>
          {/* Effet glow */}
          <GlowEffect accentColor={accentColor} />
          {/* Contenu */}
          <View style={[styles.todayContent, { shadowColor: accentColor }]}>
          <View style={styles.normalCell}>
            <Text style={[styles.gregorianDate, { 
              color: textColor, 
              fontWeight: '700', 
              fontSize: Platform.OS === 'android' ? 19 : 18 
            }]}>
              {day.gregorianDay}
            </Text>
            <Text style={[styles.hijriDate, { 
              color: theme.colors.textSecondary, 
              fontSize: Platform.OS === 'android' ? 12 : 11, 
              fontWeight: '500' 
            }]}>
              {day.hijriDay}
            </Text>
          </View>
          <View style={[styles.dayIndicatorDot, { backgroundColor: accentColor }]} />
          </View>
        </View>
      ) : (
        <View style={styles.normalCell}>
          <Text style={[styles.gregorianDate, { color: textColor }]}>
            {day.gregorianDay}
          </Text>
          <Text style={[styles.hijriDate, { color: theme.colors.textSecondary }]}>
            {day.hijriDay}
          </Text>
        </View>
      )}
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Comparaison optimisée pour éviter les re-renders inutiles
  return (
    prevProps.day?.gregorianDay === nextProps.day?.gregorianDay &&
    prevProps.day?.hijriDay === nextProps.day?.hijriDay &&
    prevProps.day?.events?.length === nextProps.day?.events?.length &&
    prevProps.hasNotes === nextProps.hasNotes &&
    prevProps.isToday === nextProps.isToday &&
    prevProps.textColor === nextProps.textColor &&
    prevProps.accentColor === nextProps.accentColor &&
    prevProps.onPress === nextProps.onPress
  );
});

CalendarDayCell.displayName = 'CalendarDayCell';

// Composant pour la vue hebdomadaire
const WeekView = React.memo<{
  calendarDays: CalendarDay[];
  currentYear: number;
  currentMonth: number;
  textColor: string;
  accentColor: string;
  theme: ReturnType<typeof getTheme>;
  onDayPress: (day: CalendarDay) => void;
  gregorianMonths: readonly string[];
  hijriMonths: readonly string[];
}>(({ calendarDays, currentYear, currentMonth, textColor, accentColor, theme, onDayPress, gregorianMonths, hijriMonths }) => {
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();
  
  // Trouver la semaine actuelle
  const todayIndex = calendarDays.findIndex(day => 
    day.gregorianDay === todayDate && 
    day.gregorianMonth === todayMonth && 
    day.gregorianYear === todayYear
  );
  
  // Obtenir les 7 jours de la semaine actuelle
  const weekStart = Math.max(0, todayIndex - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  const weekDays = calendarDays.slice(weekStart, weekStart + 7);
  
  // Compléter avec des jours vides si nécessaire
  while (weekDays.length < 7) {
    weekDays.push(null);
  }
  
  return (
    <View style={styles.weekViewContainer}>
      {weekDays.map((day, index) => {
        if (!day) {
          return <View key={`empty-${index}`} style={styles.weekDayCell} />;
        }
        
        const isToday = day.isToday;
        const hasEvents = day.events && day.events.length > 0;
        const hasImportantEvent = hasEvents && day.events!.some(e => e.isImportant);
        
        return (
          <Pressable
            key={`${day.gregorianDay}-${day.gregorianMonth}-${day.gregorianYear}`}
            style={styles.weekDayCell}
            onPress={() => onDayPress(day)}
          >
            <View style={[
              styles.weekDayContent,
              isToday && { backgroundColor: accentColor + '20' }
            ]}>
              <Text style={[styles.weekDayNumber, { 
                color: isToday ? accentColor : textColor,
                fontWeight: isToday ? '700' : '600'
              }]}>
                {day.gregorianDay}
              </Text>
              <Text style={[styles.weekDayHijri, { color: theme.colors.textSecondary }]}>
                {day.hijriDay}
              </Text>
              {hasEvents && (
                <View style={[styles.weekEventIndicator, { 
                  backgroundColor: hasImportantEvent ? accentColor : accentColor + '60' 
                }]} />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
});

WeekView.displayName = 'WeekView';

export function HijriCalendarBottomSheet({ scrollY }: HijriCalendarBottomSheetProps = {}) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [hijriDate, setHijriDate] = useState<{ day: number; month: string; year: number; isRamadan: boolean } | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<CalendarDay | null>(null);
  const [daysWithNotes, setDaysWithNotes] = useState<Set<string>>(new Set());
  const [showYearSelector, setShowYearSelector] = useState(false);
  
  // Cache local pour éviter les rechargements
  const calendarCache = useRef(new Map<string, CalendarDay[]>());
  const loadingRef = useRef(false);

  // Mémoriser les couleurs pour éviter les recalculs
  const { textColor, accentColor } = useMemo(() => ({
    textColor: theme.colors.text || '#FFFFFF',
    accentColor: theme.colors.accent || '#FFD700',
  }), [theme.colors.text, theme.colors.accent]);

  // Fonction pour charger le calendrier d'un mois spécifique (optimisée)
  const loadCalendar = useCallback(async (year: number, month: number) => {
    // Éviter les chargements multiples simultanés
    if (loadingRef.current) {
      return;
    }

    // Valider les paramètres
    if (!year || !month || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      // Erreur silencieuse en production
      return;
    }

    // Vérifier le cache local
    const cacheKey = `${year}-${month}`;
    if (calendarCache.current.has(cacheKey)) {
      const cachedDays = calendarCache.current.get(cacheKey)!;
      setCalendarDays(cachedDays);
      setCurrentYear(year);
      setCurrentMonth(month);
      
      // Récupérer la date Hijri du premier jour depuis le cache
      if (cachedDays.length > 0) {
        const firstDay = cachedDays[0];
        const hijriMonthNum = firstDay.hijriMonth;
        setHijriDate({
          day: firstDay.hijriDay,
          month: HIJRI_MONTHS[hijriMonthNum - 1] || '',
          year: firstDay.hijriYear,
          isRamadan: hijriMonthNum === 9
        });
      }
      setLoading(false);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    
    try {
      setCurrentYear(year);
      setCurrentMonth(month);
      
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      // Charger en parallèle : date Hijri du premier jour + calendrier complet
      const [firstDayHijri, calendarData] = await Promise.allSettled([
        gregorianToHijri(year, month, 1),
        getGregorianCalendarWithHijri(year, month)
      ]);

      // Traiter la date Hijri du premier jour
      if (firstDayHijri.status === 'fulfilled' && firstDayHijri.value) {
        const hijri = firstDayHijri.value;
        if (hijri.month && hijri.month.number) {
          const hijriMonthNum = hijri.month.number;
          setHijriDate({
            day: parseInt(hijri.day || '1', 10),
            month: HIJRI_MONTHS[hijriMonthNum - 1] || '',
            year: parseInt(hijri.year || '1445', 10),
            isRamadan: hijriMonthNum === 9
          });
        }
      }

      // Traiter les données du calendrier
      if (calendarData.status === 'fulfilled' && calendarData.value && Array.isArray(calendarData.value) && calendarData.value.length > 0) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const daysMap = new Map<number, CalendarDay>();
        
        // Mapper les données reçues (optimisé)
        calendarData.value
          .filter((dayData: unknown) => 
            dayData && 
            typeof dayData === 'object' &&
            dayData !== null &&
            'gregorian' in dayData && 
            typeof dayData.gregorian === 'object' &&
            dayData.gregorian !== null &&
            'hijri' in dayData && 
            typeof dayData.hijri === 'object' &&
            dayData.hijri !== null
          )
          .forEach((dayData) => {
            const dayDataObj = dayData as { gregorian: unknown; hijri: unknown };
            try {
              const gregorian = dayDataObj.gregorian as { day?: unknown; month?: { number?: unknown }; year?: unknown } | null;
              const hijri = dayDataObj.hijri as { day?: unknown; month?: { number?: unknown } | number; year?: unknown } | null;
              
              const gregorianDay = parseInt(String(gregorian?.day || '0'), 10);
              const gregorianMonthNum = parseInt(String(gregorian?.month?.number || '0'), 10);
              const gregorianYearNum = parseInt(String(gregorian?.year || '0'), 10);
              
              if (gregorianDay > 0 && 
                  gregorianDay <= 31 &&
                  gregorianMonthNum === month && 
                  gregorianYearNum === year &&
                  !isNaN(gregorianDay) &&
                  !isNaN(gregorianMonthNum) &&
                  !isNaN(gregorianYearNum)) {
                const isToday = 
                  gregorianDay === todayDay &&
                  gregorianMonthNum === todayMonth &&
                  gregorianYearNum === todayYear;

                const hijriDay = parseInt(String(hijri?.day || '1'), 10);
                const hijriMonthNum = typeof hijri?.month === 'object' && hijri?.month !== null && 'number' in hijri.month 
                  ? (hijri.month as { number?: unknown }).number 
                  : (typeof hijri?.month === 'number' ? hijri.month : hijri?.month);
                const hijriMonth = typeof hijriMonthNum === 'number' ? hijriMonthNum : parseInt(String(hijriMonthNum || '1'), 10);
                const hijriYear = parseInt(String(hijri?.year || '1445'), 10);

                if (!isNaN(hijriDay) && !isNaN(hijriMonth) && !isNaN(hijriYear) &&
                    hijriDay >= 1 && hijriDay <= 30 &&
                    hijriMonth >= 1 && hijriMonth <= 12) {
                  // Récupérer les événements pour ce jour
                  const events = getEventsForHijriDate(hijriDay, hijriMonth, hijriYear);
                  
                  daysMap.set(gregorianDay, {
                    gregorianDay,
                    gregorianMonth: gregorianMonthNum,
                    gregorianYear: gregorianYearNum,
                    hijriDay,
                    hijriMonth,
                    hijriYear,
                    isToday,
                    events: events.length > 0 ? events : undefined,
                  });
                }
              }
            } catch (dayError) {
              // Ignorer les erreurs individuelles
            }
          });

        // Construire le tableau complet avec TOUS les jours du mois
        const days: CalendarDay[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          if (daysMap.has(day)) {
            days.push(daysMap.get(day)!);
          } else {
            const approxHijri = approximateGregorianToHijri(year, month, day);
            const isToday = 
              day === todayDay &&
              month === todayMonth &&
              year === todayYear;

            // Récupérer les événements pour ce jour
            const events = getEventsForHijriDate(approxHijri.day, approxHijri.month, approxHijri.year);
            
            days.push({
              gregorianDay: day,
              gregorianMonth: month,
              gregorianYear: year,
              hijriDay: approxHijri.day,
              hijriMonth: approxHijri.month,
              hijriYear: approxHijri.year,
              isToday,
              events: events.length > 0 ? events : undefined,
            });
          }
        }

        // Trier par jour grégorien
        days.sort((a, b) => a.gregorianDay - b.gregorianDay);

        if (days.length > 0) {
          // Mettre en cache
          calendarCache.current.set(cacheKey, days);
          setCalendarDays(days);
        }
      } else {
        // Fallback : créer un calendrier approximatif
        const daysInMonth = new Date(year, month, 0).getDate();
        const days: CalendarDay[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const approxHijri = approximateGregorianToHijri(year, month, day);
          const isToday = 
            day === todayDay &&
            month === todayMonth &&
            year === todayYear;
          
          days.push({
            gregorianDay: day,
            gregorianMonth: month,
            gregorianYear: year,
            hijriDay: approxHijri.day,
            hijriMonth: approxHijri.month,
            hijriYear: approxHijri.year,
            isToday,
          });
        }
        
        if (days.length > 0) {
          calendarCache.current.set(cacheKey, days);
          setCalendarDays(days);
        }
      }
    } catch (error: unknown) {
      // Erreur silencieuse en production
      // Fallback en cas d'erreur
      const daysInMonth = new Date(year, month, 0).getDate();
      const days: CalendarDay[] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const approxHijri = approximateGregorianToHijri(year, month, day);
        // Récupérer les événements pour ce jour
        const events = getEventsForHijriDate(approxHijri.day, approxHijri.month, approxHijri.year);
        
        days.push({
          gregorianDay: day,
          gregorianMonth: month,
          gregorianYear: year,
          hijriDay: approxHijri.day,
          hijriMonth: approxHijri.month,
          hijriYear: approxHijri.year,
          isToday: false,
          events: events.length > 0 ? events : undefined,
        });
      }
      
      if (days.length > 0) {
        calendarCache.current.set(cacheKey, days);
        setCalendarDays(days);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Charger les notes pour le mois actuel
  useEffect(() => {
    const loadNotesForMonth = async () => {
      try {
        const { getAllNotes, formatDateForStorage } = await import('@/services/calendarNotes');
        const allNotes = await getAllNotes();
        const notesSet = new Set<string>();
        
        allNotes.forEach(note => {
          const [year, month] = note.date.split('-').map(Number);
          if (year === currentYear && month === currentMonth) {
            notesSet.add(note.date);
          }
        });
        
        setDaysWithNotes(notesSet);
      } catch (error) {
        // Erreur silencieuse en production
      }
    };
    
    if (currentYear && currentMonth) {
      loadNotesForMonth();
    }
  }, [currentYear, currentMonth]);

  // Charger le calendrier du mois actuel au montage
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    loadCalendar(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fonctions de navigation (mémorisées)
  const goToPreviousMonth = useCallback(() => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear = currentYear - 1;
    }
    
    loadCalendar(newYear, newMonth);
  }, [currentYear, currentMonth, loadCalendar]);

  const goToNextMonth = useCallback(() => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear = currentYear + 1;
    }
    
    loadCalendar(newYear, newMonth);
  }, [currentYear, currentMonth, loadCalendar]);

  // Construire la grille du calendrier (mémorisée)
  const grid = useMemo(() => {
    if (calendarDays.length === 0) return [];

    const grid: (CalendarDay | null)[][] = [];
    const firstDay = calendarDays[0];
    if (!firstDay) return [];

    const firstDate = new Date(firstDay.gregorianYear, firstDay.gregorianMonth - 1, 1);
    const jsDayOfWeek = firstDate.getDay();
    const startIndex = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1;

    let dayIndex = 0;
    for (let week = 0; week < 6; week++) {
      const weekRow: (CalendarDay | null)[] = [];
      for (let day = 0; day < 7; day++) {
        const gridIndex = week * 7 + day;
        if (gridIndex < startIndex || dayIndex >= calendarDays.length) {
          weekRow.push(null);
        } else {
          weekRow.push(calendarDays[dayIndex]);
          dayIndex++;
        }
      }
      grid.push(weekRow);
    }

    return grid;
  }, [calendarDays]);

  // Trouver le jour actuel (mémorisé)
  const today = useMemo(() => {
    return calendarDays.find(day => day.isToday) || null;
  }, [calendarDays]);

  // Gérer le clic sur un jour
  const handleDayPress = useCallback((day: CalendarDay) => {
    setSelectedDay(day);
    setShowDayDetails(true);
  }, []);

  // Fermer la modal de détails
  const handleCloseDayDetails = useCallback(() => {
    setShowDayDetails(false);
    setSelectedDay(null);
  }, []);

  // Gérer la recherche de date
  const handleDateSearch = useCallback((year: number, month: number, day: number) => {
    loadCalendar(year, month);
    setViewMode('month');
    // TODO: Scroll vers le jour sélectionné
  }, [loadCalendar]);

  if (loading && calendarDays.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Chargement du calendrier...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête avec icône et titre */}
      <Animated.View 
        style={styles.header}
        entering={FadeIn
          .duration(400)
          .springify()
          .damping(20)}
      >
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
            <Calendar size={20} color={accentColor} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: textColor }]}>
              Calendrier Hijri
            </Text>
          </View>
        </View>
        
        {/* Navigation mois avec flèches et mois/année au centre */}
        <View style={styles.monthNavigation}>
          <Pressable
            onPress={goToPreviousMonth}
            style={({ pressed }) => [
              styles.navButton,
              { backgroundColor: pressed ? accentColor + '20' : 'transparent' }
            ]}
          >
            <ChevronLeft size={24} color={accentColor} />
          </Pressable>
          
          {/* Mois et année entre les flèches */}
          <View style={styles.monthYearContainer}>
            <Pressable
              onPress={() => setShowYearSelector(true)}
              style={({ pressed }) => [
                styles.yearPressable,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={[styles.monthYearText, { color: textColor }]}>
                {GREGORIAN_MONTHS[currentMonth - 1]} {currentYear}
              </Text>
            </Pressable>
            {hijriDate && (
              <Text style={[styles.hijriMonthYearText, { color: accentColor }]} numberOfLines={1}>
                {hijriDate.month} {hijriDate.year} هـ
              </Text>
            )}
          </View>
          
          <Pressable
            onPress={goToNextMonth}
            style={({ pressed }) => [
              styles.navButton,
              { backgroundColor: pressed ? accentColor + '20' : 'transparent' }
            ]}
          >
            <ChevronRight size={24} color={accentColor} />
          </Pressable>
        </View>
        
        {/* Contrôles : Vue et Aujourd'hui */}
        <View style={styles.controlsRow}>
          <View style={styles.viewModeSelectorCentered}>
            <Pressable
              onPress={() => setViewMode('week')}
              style={({ pressed }) => [
                styles.viewModeButton,
                viewMode === 'week' && { backgroundColor: accentColor + '30' },
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <CalendarDays size={16} color={viewMode === 'week' ? accentColor : textColor} />
              <Text style={[styles.viewModeText, { 
                color: viewMode === 'week' ? accentColor : theme.colors.textSecondary 
              }]}>
                Semaine
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('month')}
              style={({ pressed }) => [
                styles.viewModeButton,
                viewMode === 'month' && { backgroundColor: accentColor + '30' },
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Grid size={16} color={viewMode === 'month' ? accentColor : textColor} />
              <Text style={[styles.viewModeText, { 
                color: viewMode === 'month' ? accentColor : theme.colors.textSecondary 
              }]}>
                Mois
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* Calendrier */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={Platform.OS === 'android'}
      >
        {/* Grille du calendrier */}
        {loading && calendarDays.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Chargement du calendrier...
            </Text>
          </View>
        ) : viewMode === 'week' ? (
          <>
            {/* Jours de la semaine */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((day, index) => (
                <View key={index} style={styles.weekdayCell}>
                  <Text style={[styles.weekdayText, { color: theme.colors.textSecondary }]}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.calendarGrid}>
              {grid.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.weekRow}>
                  {week.map((day, dayIndex) => (
                    <CalendarDayCell
                      key={day ? `${day.gregorianDay}-${day.gregorianMonth}-${day.gregorianYear}` : `empty-${weekIndex}-${dayIndex}`}
                      day={day}
                      isToday={day?.isToday || false}
                      textColor={textColor}
                      accentColor={accentColor}
                      theme={theme}
                      gregorianMonths={GREGORIAN_MONTHS}
                      hijriMonths={HIJRI_MONTHS}
                      onPress={handleDayPress}
                      hasNotes={day ? daysWithNotes.has(
                        `${day.gregorianYear}-${String(day.gregorianMonth).padStart(2, '0')}-${String(day.gregorianDay).padStart(2, '0')}`
                      ) : false}
                    />
                  ))}
                </View>
              ))}
            </View>
            
            {/* Footer NUR AYNA juste en bas des numéros */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: accentColor }]}>
                NUR AYNA
              </Text>
            </View>
          </>
        ) : (
          <YearView
            year={currentYear}
            textColor={textColor}
            accentColor={accentColor}
            theme={theme}
            onMonthPress={(month) => {
              loadCalendar(currentYear, month);
              setViewMode('month');
            }}
            onDayPress={handleDayPress}
          />
        )}
      </ScrollView>

      {/* Modal de détails du jour */}
      <DayDetailsModal
        visible={showDayDetails}
        onClose={handleCloseDayDetails}
        day={selectedDay}
      />

      {/* Modal de recherche de date */}
      <DateSearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onDateSelect={handleDateSearch}
        textColor={textColor}
        accentColor={accentColor}
        theme={theme}
      />

      {/* Sélecteur d'année */}
      <YearSelector
        visible={showYearSelector}
        currentYear={currentYear}
        onYearSelect={(year) => {
          loadCalendar(year, currentMonth);
        }}
        onClose={() => setShowYearSelector(false)}
        textColor={textColor}
        accentColor={accentColor}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingVertical: 4,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  yearPressable: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  monthYearText: {
    fontSize: Platform.OS === 'android' ? 20 : 18,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 4,
  },
  hijriMonthYearText: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    fontWeight: '600',
    fontFamily: 'System',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingVertical: Platform.OS === 'android' ? 10 : 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  calendarGrid: {
    paddingHorizontal: 4,
    marginBottom: Platform.OS === 'android' ? -16 : -14,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Platform.OS === 'android' ? 6 : 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? 6 : 4,
    paddingHorizontal: 3,
  },
  normalCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCellContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowHalo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },
  glowHaloMedium: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.45,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  todayContent: {
    position: 'relative',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  gregorianDate: {
    fontSize: Platform.OS === 'android' ? 15 : 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 2,
  },
  hijriDate: {
    fontSize: Platform.OS === 'android' ? 10 : 9,
    fontWeight: '500',
    fontFamily: 'System',
  },
  dayIndicatorDot: {
    position: 'absolute',
    width: Platform.OS === 'android' ? 8 : 7,
    height: Platform.OS === 'android' ? 8 : 7,
    borderRadius: Platform.OS === 'android' ? 4 : 3.5,
    bottom: Platform.OS === 'android' ? -10 : -8,
    left: '50%',
    marginLeft: Platform.OS === 'android' ? -4 : -3.5,
  },
  indicatorsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 4 : 3,
    right: Platform.OS === 'android' ? 4 : 3,
    flexDirection: 'row',
    gap: 3,
  },
  eventIndicator: {
    width: Platform.OS === 'android' ? 6 : 5,
    height: Platform.OS === 'android' ? 6 : 5,
    borderRadius: Platform.OS === 'android' ? 3 : 2.5,
  },
  noteIndicator: {
    width: Platform.OS === 'android' ? 6 : 5,
    height: Platform.OS === 'android' ? 6 : 5,
    borderRadius: Platform.OS === 'android' ? 3 : 2.5,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    gap: 6,
  },
  todayButtonText: {
    fontSize: Platform.OS === 'android' ? 13 : 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'System',
  },
  footer: {
    marginTop: Platform.OS === 'android' ? -20 : -18,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
    paddingBottom: Platform.OS === 'android' ? 8 : 6,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Platform.OS === 'android' ? 18 : 16,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: Platform.OS === 'android' ? 2 : 1.5,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  viewModeSelector: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 4,
  },
  viewModeSelectorCentered: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 4,
    alignSelf: 'center',
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewModeText: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    fontWeight: '600',
    fontFamily: 'System',
  },
  yearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  yearText: {
    fontSize: Platform.OS === 'android' ? 16 : 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
  hijriYearText: {
    fontSize: Platform.OS === 'android' ? 14 : 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  weekViewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  weekDayCell: {
    flex: 1,
    minHeight: 120,
  },
  weekDayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    position: 'relative',
  },
  weekDayName: {
    fontSize: Platform.OS === 'android' ? 11 : 10,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  weekDayNumber: {
    fontSize: Platform.OS === 'android' ? 24 : 22,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 4,
  },
  weekDayHijri: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    fontWeight: '500',
    fontFamily: 'System',
  },
  weekEventIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: Platform.OS === 'android' ? 16 : 14,
    fontFamily: 'System',
  },
});
