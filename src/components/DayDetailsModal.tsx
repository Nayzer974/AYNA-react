/**
 * Composant DayDetailsModal - Modal pour afficher les détails d'un jour sélectionné
 * Affiche : date grégorienne, date hijri, heures de prière, etc.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, Plus, Trash2, Edit2 } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { getPrayerTimesForDate } from '@/services/hijri';
import * as Location from 'expo-location';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { 
  getNotesForDate, 
  saveNote, 
  deleteNote, 
  generateNoteId, 
  formatDateForStorage,
  type CalendarNote 
} from '@/services/calendarNotes';
import { TextInput } from 'react-native';

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

interface DayDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  day: CalendarDay | null;
}

const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabiʿ al-Awwal', 'Rabiʿ ath-Thani',
  'Joumada al-Oula', 'Joumada ath-Thania', 'Rajab', 'Chaʿban',
  'Ramadan', 'Chawwal', 'Dhou al-Qiʿda', 'Dhou al-Hijja'
] as const;

const GREGORIAN_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
] as const;

const PRAYER_NAMES = {
  Fajr: 'Fajr',
  Dhuhr: 'Dhuhr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
} as const;

const PRAYER_LABELS = {
  Fajr: 'Fajr',
  Dhuhr: 'Dhuhr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
} as const;

export function DayDetailsModal({ visible, onClose, day }: DayDetailsModalProps) {
  const { user } = useUser();
  const theme = useMemo(() => getTheme(user?.theme || 'default'), [user?.theme]);
  
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteDescription, setNewNoteDescription] = useState('');

  const textColor = theme.colors.text || '#FFFFFF';
  const accentColor = theme.colors.accent || '#FFD700';
  const backgroundColor = theme.colors.background || '#000000';
  const cardBackground = theme.colors.backgroundSecondary || '#1A1A1A';

  // Charger les heures de prière et les notes quand le modal s'ouvre
  useEffect(() => {
    if (visible && day) {
      loadPrayerTimes();
      loadNotes();
    } else {
      // Réinitialiser l'état quand le modal se ferme
      setPrayerTimes(null);
      setError(null);
      setLoading(false);
      setNotes([]);
      setShowAddNote(false);
      setNewNoteTitle('');
      setNewNoteDescription('');
    }
  }, [visible, day]);

  const loadNotes = async () => {
    if (!day) return;
    try {
      const dateStr = formatDateForStorage(day.gregorianYear, day.gregorianMonth, day.gregorianDay);
      const dayNotes = await getNotesForDate(dateStr);
      setNotes(dayNotes);
    } catch (error) {
      console.error('[DayDetailsModal] Erreur lors du chargement des notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!day || !newNoteTitle.trim()) return;
    
    try {
      const dateStr = formatDateForStorage(day.gregorianYear, day.gregorianMonth, day.gregorianDay);
      const newNote: CalendarNote = {
        id: generateNoteId(),
        date: dateStr,
        title: newNoteTitle.trim(),
        description: newNoteDescription.trim() || undefined,
        color: accentColor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await saveNote(newNote);
      await loadNotes();
      setNewNoteTitle('');
      setNewNoteDescription('');
      setShowAddNote(false);
    } catch (error) {
      console.error('[DayDetailsModal] Erreur lors de l\'ajout de la note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      await loadNotes();
    } catch (error) {
      console.error('[DayDetailsModal] Erreur lors de la suppression de la note:', error);
    }
  };

  const loadPrayerTimes = async () => {
    if (!day) return;

    setLoading(true);
    setError(null);

    try {
      // Demander la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de localisation requise pour afficher les heures de prière');
        setLoading(false);
        return;
      }

      // Obtenir la localisation
      const location = await Location.getCurrentPositionAsync({});
      
      // Récupérer les heures de prière pour la date sélectionnée
      const response = await getPrayerTimesForDate(
        location.coords.latitude,
        location.coords.longitude,
        day.gregorianDay,
        day.gregorianMonth,
        day.gregorianYear
      );

      if (response?.data?.timings) {
        const timings: Record<string, string> = {};
        Object.keys(PRAYER_NAMES).forEach((prayerName) => {
          const time = response.data.timings[prayerName];
          if (time) {
            // Extraire uniquement HH:MM
            timings[prayerName] = time.split(' ')[0];
          }
        });
        setPrayerTimes(timings);
      } else {
        setError('Impossible de charger les heures de prière');
      }
    } catch (err: any) {
      console.error('[DayDetailsModal] Erreur lors du chargement des heures de prière:', err);
      setError(err.message || 'Erreur lors du chargement des heures de prière');
    } finally {
      setLoading(false);
    }
  };

  if (!day) return null;

  const gregorianDateStr = `${day.gregorianDay} ${GREGORIAN_MONTHS[day.gregorianMonth - 1]} ${day.gregorianYear}`;
  const hijriDateStr = `${day.hijriDay} ${HIJRI_MONTHS[day.hijriMonth - 1]} ${day.hijriYear} هـ`;
  const weekday = new Date(day.gregorianYear, day.gregorianMonth - 1, day.gregorianDay).toLocaleDateString('fr-FR', { weekday: 'long' });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[
              styles.modalContent,
              {
                backgroundColor: cardBackground,
                borderColor: theme.colors.border || 'rgba(255, 255, 255, 0.1)',
              },
            ]}
          >
            {/* En-tête */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View>
                  <Text style={[styles.weekday, { color: accentColor }]}>
                    {capitalizedWeekday}
                  </Text>
                  <Text style={[styles.gregorianDate, { color: textColor }]}>
                    {gregorianDateStr}
                  </Text>
                  <Text style={[styles.hijriDate, { color: theme.colors.textSecondary }]}>
                    {hijriDateStr}
                  </Text>
                </View>
                {day.isToday && (
                  <View style={[styles.todayBadge, { backgroundColor: accentColor + '20' }]}>
                    <Text style={[styles.todayBadgeText, { color: accentColor }]}>
                      Aujourd'hui
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: pressed ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }
                ]}
              >
                <X size={24} color={textColor} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Heures de prière */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Heures de prière
                </Text>
                
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={accentColor} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                      Chargement...
                    </Text>
                  </View>
                ) : error ? (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
                      {error}
                    </Text>
                  </View>
                ) : prayerTimes ? (
                  <View style={styles.prayerTimesContainer}>
                    {Object.entries(PRAYER_NAMES).map(([key, name]) => {
                      const time = prayerTimes[name];
                      if (!time) return null;
                      
                      return (
                        <View key={key} style={[styles.prayerTimeRow, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
                          <Text style={[styles.prayerName, { color: textColor }]}>
                            {PRAYER_LABELS[name as keyof typeof PRAYER_LABELS]}
                          </Text>
                          <Text style={[styles.prayerTime, { color: accentColor }]}>
                            {time}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              {/* Événements religieux */}
              {day.events && day.events.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    Événements
                  </Text>
                  {day.events.map((event, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.eventCard,
                        { 
                          backgroundColor: event.isImportant ? accentColor + '20' : 'rgba(255, 255, 255, 0.05)',
                          borderLeftColor: event.isImportant ? accentColor : theme.colors.textSecondary + '40',
                        }
                      ]}
                    >
                      <View style={styles.eventHeader}>
                        <Text style={[styles.eventName, { color: textColor }]}>
                          {event.name}
                        </Text>
                        {event.nameAr && (
                          <Text style={[styles.eventNameAr, { color: accentColor }]}>
                            {event.nameAr}
                          </Text>
                        )}
                      </View>
                      {event.description && (
                        <Text style={[styles.eventDescription, { color: theme.colors.textSecondary }]}>
                          {event.description}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Notes personnelles */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    Mes notes
                  </Text>
                  <Pressable
                    onPress={() => setShowAddNote(!showAddNote)}
                    style={({ pressed }) => [
                      styles.addNoteButton,
                      { backgroundColor: pressed ? accentColor + '30' : accentColor + '20' }
                    ]}
                  >
                    <Plus size={18} color={accentColor} />
                  </Pressable>
                </View>
                
                {showAddNote && (
                  <View style={[styles.addNoteContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <TextInput
                      style={[styles.noteInput, { color: textColor, borderColor: accentColor + '40' }]}
                      placeholder="Titre de la note"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={newNoteTitle}
                      onChangeText={setNewNoteTitle}
                    />
                    <TextInput
                      style={[styles.noteInput, styles.noteTextArea, { color: textColor, borderColor: accentColor + '40' }]}
                      placeholder="Description (optionnel)"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={newNoteDescription}
                      onChangeText={setNewNoteDescription}
                      multiline
                      numberOfLines={3}
                    />
                    <View style={styles.addNoteActions}>
                      <Pressable
                        onPress={() => {
                          setShowAddNote(false);
                          setNewNoteTitle('');
                          setNewNoteDescription('');
                        }}
                        style={styles.cancelButton}
                      >
                        <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                          Annuler
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleAddNote}
                        style={[styles.saveButton, { backgroundColor: accentColor }]}
                      >
                        <Text style={[styles.saveButtonText, { color: '#000' }]}>
                          Enregistrer
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
                
                {notes.length > 0 ? (
                  <View style={styles.notesContainer}>
                    {notes.map((note) => (
                      <View 
                        key={note.id} 
                        style={[
                          styles.noteCard,
                          { 
                            backgroundColor: note.color ? note.color + '20' : 'rgba(255, 255, 255, 0.05)',
                            borderLeftColor: note.color || accentColor,
                          }
                        ]}
                      >
                        <View style={styles.noteHeader}>
                          <Text style={[styles.noteTitle, { color: textColor }]}>
                            {note.title}
                          </Text>
                          <Pressable
                            onPress={() => handleDeleteNote(note.id)}
                            style={styles.deleteNoteButton}
                          >
                            <Trash2 size={16} color="#FF6B6B" />
                          </Pressable>
                        </View>
                        {note.description && (
                          <Text style={[styles.noteDescription, { color: theme.colors.textSecondary }]}>
                            {note.description}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                ) : !showAddNote && (
                  <Text style={[styles.emptyNotesText, { color: theme.colors.textSecondary }]}>
                    Aucune note pour ce jour
                  </Text>
                )}
              </View>

              {/* Informations supplémentaires */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Informations
                </Text>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                    Mois Hijri :
                  </Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>
                    {HIJRI_MONTHS[day.hijriMonth - 1]}
                  </Text>
                </View>
                {day.hijriMonth === 9 && (
                  <View style={[styles.ramadanBadge, { backgroundColor: accentColor + '20' }]}>
                    <Text style={[styles.ramadanText, { color: accentColor }]}>
                      🌙 Mois de Ramadan
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weekday: {
    fontSize: Platform.OS === 'android' ? 18 : 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  gregorianDate: {
    fontSize: Platform.OS === 'android' ? 24 : 22,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 4,
  },
  hijriDate: {
    fontSize: Platform.OS === 'android' ? 16 : 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
  todayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  todayBadgeText: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    fontWeight: '600',
    fontFamily: 'System',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'android' ? 18 : 16,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'System',
  },
  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
  },
  prayerTimesContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  prayerTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  prayerName: {
    fontSize: Platform.OS === 'android' ? 16 : 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
  prayerTime: {
    fontSize: Platform.OS === 'android' ? 18 : 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '500',
    fontFamily: 'System',
  },
  infoValue: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  ramadanBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ramadanText: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: Platform.OS === 'android' ? 16 : 15,
    fontWeight: '700',
    fontFamily: 'System',
    flex: 1,
  },
  eventNameAr: {
    fontSize: Platform.OS === 'android' ? 16 : 15,
    fontWeight: '600',
    fontFamily: 'System',
    marginLeft: 12,
  },
  eventDescription: {
    fontSize: Platform.OS === 'android' ? 13 : 12,
    fontWeight: '400',
    fontFamily: 'System',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addNoteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNoteContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontFamily: 'System',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  noteTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addNoteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '500',
    fontFamily: 'System',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  notesContainer: {
    gap: 12,
  },
  noteCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: Platform.OS === 'android' ? 16 : 15,
    fontWeight: '700',
    fontFamily: 'System',
    flex: 1,
  },
  deleteNoteButton: {
    padding: 4,
  },
  noteDescription: {
    fontSize: Platform.OS === 'android' ? 13 : 12,
    fontWeight: '400',
    fontFamily: 'System',
    lineHeight: 18,
  },
  emptyNotesText: {
    fontSize: Platform.OS === 'android' ? 13 : 12,
    fontFamily: 'System',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

