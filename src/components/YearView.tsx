/**
 * Vue annuelle - Affiche tous les mois de l'année en mini-calendriers
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { getEventsForHijriDate } from '@/utils/calendarEvents';
import { getAllNotes, formatDateForStorage } from '@/services/storage/calendarNotes';

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

interface YearViewProps {
  year: number;
  textColor: string;
  accentColor: string;
  theme: any;
  onMonthPress: (month: number) => void;
  onDayPress: (day: CalendarDay) => void;
}

const GREGORIAN_MONTHS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
] as const;

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

export function YearView({ year, textColor, accentColor, theme, onMonthPress, onDayPress }: YearViewProps) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  // Générer les mini-calendriers pour chaque mois
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const month = monthIndex + 1;
      const firstDay = new Date(year, monthIndex, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
      
      const days: (CalendarDay | null)[] = [];
      
      // Jours vides au début
      for (let i = 0; i < startDay; i++) {
        days.push(null);
      }
      
      // Jours du mois
      for (let day = 1; day <= daysInMonth; day++) {
        // Conversion approximative Hijri
        const gregorianDate = new Date(year, monthIndex, day);
        const epoch = new Date(622, 6, 16);
        const diffTime = gregorianDate.getTime() - epoch.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const hijriYear = Math.floor(diffDays / 354.37) + 1;
        const daysInHijriYear = diffDays % Math.floor(354.37);
        const hijriMonth = Math.floor(daysInHijriYear / 29.5) + 1;
        const hijriDay = Math.floor(daysInHijriYear % 29.5) + 1;
        
        const isToday = day === todayDay && month === todayMonth && year === todayYear;
        const events = getEventsForHijriDate(
          Math.max(1, Math.min(30, hijriDay)),
          Math.max(1, Math.min(12, hijriMonth)),
          hijriYear
        );
        
        days.push({
          gregorianDay: day,
          gregorianMonth: month,
          gregorianYear: year,
          hijriDay: Math.max(1, Math.min(30, hijriDay)),
          hijriMonth: Math.max(1, Math.min(12, hijriMonth)),
          hijriYear,
          isToday,
          events: events.length > 0 ? events : undefined,
        });
      }
      
      return { month, days };
    });
  }, [year, todayYear, todayMonth, todayDay]);

  return (
    <View style={styles.container}>
      {months.map(({ month, days }) => (
        <View key={month} style={styles.monthContainer}>
          <Pressable
            onPress={() => onMonthPress(month)}
            style={styles.monthHeader}
          >
            <Text style={[styles.monthTitle, { color: accentColor }]}>
              {GREGORIAN_MONTHS[month - 1]}
            </Text>
          </Pressable>
          
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text style={[styles.weekdayText, { color: theme.colors.textSecondary }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              
              const hasEvents = day.events && day.events.length > 0;
              const hasNotes = false; // TODO: Vérifier les notes
              
              return (
                <Pressable
                  key={`${day.gregorianDay}-${month}`}
                  style={styles.dayCell}
                  onPress={() => onDayPress(day)}
                >
                  <View style={[
                    styles.dayContent,
                    day.isToday && { backgroundColor: accentColor + '30' }
                  ]}>
                    <Text style={[styles.dayText, { 
                      color: day.isToday ? accentColor : textColor,
                      fontWeight: day.isToday ? '700' : '400'
                    }]}>
                      {day.gregorianDay}
                    </Text>
                    {(hasEvents || hasNotes) && (
                      <View style={[styles.indicator, { 
                        backgroundColor: hasEvents ? accentColor : theme.colors.textSecondary 
                      }]} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 12,
  },
  monthContainer: {
    width: '30%',
    marginBottom: 16,
  },
  monthHeader: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  monthTitle: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    fontWeight: '700',
    fontFamily: 'System',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: Platform.OS === 'android' ? 9 : 8,
    fontWeight: '600',
    fontFamily: 'System',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 1,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    position: 'relative',
  },
  dayText: {
    fontSize: Platform.OS === 'android' ? 10 : 9,
    fontFamily: 'System',
  },
  indicator: {
    position: 'absolute',
    bottom: 1,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});

