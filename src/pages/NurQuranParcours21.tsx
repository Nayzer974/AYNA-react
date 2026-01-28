import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Modal, ActivityIndicator } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, BookOpen, X, Bookmark as BookmarkIcon, Square, CheckSquare, Info, Sparkles, Wind } from 'lucide-react-native';
import { StarAnimation } from '@/components/icons/StarAnimation';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import { PARCOURS_STEPS, PARCOURS_INTRO } from '@/data/nurQuranParcours';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight, Layout, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '@/utils/designTokens';
import { useQuran } from '@/contexts/QuranContext';
import { saveBookmark, removeBookmark, getBookmarks, generateBookmarkId } from '@/services/content/quranBookmarks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Page Parcours Nûr al-Qur'ân - 21 jours
 * Un parcours guidé de 21 jours avec versets du Coran
 */
export function NurQuranParcours21() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  const [showParcoursIntro, setShowParcoursIntro] = useState(false);
  const [expandedParcoursStep, setExpandedParcoursStep] = useState<string | null>(null);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [verseModalData, setVerseModalData] = useState<{
    stepId: string;
    stepTitle: string;
    verseReferences: string[];
    initialIndex: number;
  } | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  // Charger les favoris
  useEffect(() => {
    getBookmarks().then(setBookmarks);
  }, []);

  const { state: quranState, loadSurah } = useQuran();

  // Analytics
  useEffect(() => {
    trackPageView('NurQuranParcours21');
  }, []);

  // Charger les versets quand le modal s'ouvre
  // Charger les versets quand le modal s'ouvre ou change de page
  useEffect(() => {
    if (showVerseModal && verseModalData) {
      const currentRef = verseModalData.verseReferences[activePageIndex];
      const parsed = parseVerseReference(currentRef);

      if (parsed) {
        // Si la sourate n'est pas chargée ou ne correspond pas, la charger
        if (quranState.currentSurah !== parsed.surahNumber && !quranState.loading) {
          loadSurah(parsed.surahNumber);
        }
      }
    }
  }, [showVerseModal, verseModalData, activePageIndex, quranState.currentSurah, quranState.loading, loadSurah]);

  // Fonction pour parser les références de versets
  const parseVerseReference = (verse: string) => {
    try {
      // Format: "2:102" (sourate:verset)
      const match1 = verse.match(/^(\d+):(\d+)$/);
      if (match1) {
        const surahNumber = parseInt(match1[1], 10);
        const verseStart = parseInt(match1[2], 10);
        return { surahNumber, verseStart, verseEnd: verseStart };
      }

      // Format: "7:104–122" ou "7:104-122" (sourate:verset début–verset fin)
      const match2 = verse.match(/^(\d+):(\d+)[–-](\d+)$/);
      if (match2) {
        const surahNumber = parseInt(match2[1], 10);
        const verseStart = parseInt(match2[2], 10);
        const verseEnd = parseInt(match2[3], 10);
        return { surahNumber, verseStart, verseEnd };
      }

      // Format: "112" (juste le numéro de sourate)
      const match3 = verse.match(/^(\d+)$/);
      if (match3) {
        const surahNumber = parseInt(match3[1], 10);
        if (surahNumber >= 1 && surahNumber <= 114) {
          return { surahNumber };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Gestion du clic sur un verset
  // Gestion du clic sur un verset
  const handleVersePress = async (stepId: string, stepTitle: string, verseReferences: string[], index: number) => {
    const verse = verseReferences[index];
    const parsed = parseVerseReference(verse);

    if (parsed && parsed.surahNumber >= 1 && parsed.surahNumber <= 114) {
      trackEvent('nurshifa_verse_pressed', { verse, surahNumber: parsed.surahNumber });

      // Ouvrir le modal avec la liste complète
      setVerseModalData({
        stepId,
        stepTitle,
        verseReferences,
        initialIndex: index,
      });
      setActivePageIndex(index);
      setShowVerseModal(true);

      // Charger la sourate si elle n'est pas déjà chargée
      if (quranState.currentSurah !== parsed.surahNumber && !quranState.loading) {
        try {
          await loadSurah(parsed.surahNumber);
        } catch (error) {
          console.error('Erreur lors du chargement de la sourate:', error);
        }
      }
    }
  };

  const toggleStepBookmark = async (stepId: string, stepTitle: string) => {
    const id = generateBookmarkId('nur_parcours_step', { stepId });
    const isBookmarked = bookmarks.some(b => b.id === id);

    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = await removeBookmark(id);
    } else {
      newBookmarks = await saveBookmark({
        id,
        type: 'nur_parcours_step',
        timestamp: Date.now(),
        stepId,
        title: stepTitle
      });
    }
    setBookmarks(newBookmarks);
    trackEvent('bookmark_toggled', { stepId, type: 'nur_parcours_step' });
  };

  const isStepBookmarked = (stepId: string) => {
    const id = generateBookmarkId('nur_parcours_step', { stepId });
    return bookmarks.some(b => b.id === id);
  };

  const toggleVerseRefBookmark = async (verseRef: string, title: string) => {
    const id = generateBookmarkId('verse_reference', { verseRef });
    const isBookmarked = bookmarks.some(b => b.id === id);

    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = await removeBookmark(id);
    } else {
      newBookmarks = await saveBookmark({
        id,
        type: 'verse_reference',
        timestamp: Date.now(),
        verseRef,
        title
      });
    }
    setBookmarks(newBookmarks);
    trackEvent('bookmark_toggled', { verseRef, type: 'verse_reference' });
  };

  const isVerseRefBookmarked = (verseRef: string) => {
    const id = generateBookmarkId('verse_reference', { verseRef });
    return bookmarks.some(b => b.id === id);
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={80} minSize={1} maxSize={2} themeId={user?.theme} />

      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header avec animation */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <StarAnimation size={24} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Parcours 21 jours
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View
            entering={FadeIn.duration(600).delay(200)}
            style={styles.heroSection}
          >
            <LinearGradient
              colors={[theme.colors.accent + '20', theme.colors.accent + '05']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroCard, { borderColor: theme.colors.accent + '30' }]}
            >
              <StarAnimation size={48} />
              <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
                {PARCOURS_INTRO.title}
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.colors.accent }]}>
                {PARCOURS_INTRO.subtitle}
              </Text>
              <View style={[styles.heroBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                <Calendar size={16} color={theme.colors.accent} />
                <Text style={[styles.heroBadgeText, { color: theme.colors.accent }]}>
                  21 jours de parcours guidé
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Introduction */}
          <Animated.View entering={SlideInRight.duration(400).delay(300)}>
            <Pressable
              onPress={() => {
                setShowParcoursIntro(!showParcoursIntro);
                trackEvent('nurquran_parcours_intro_toggled', { expanded: !showParcoursIntro });
              }}
              style={({ pressed }) => [
                styles.introButton,
                { backgroundColor: theme.colors.backgroundSecondary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.introButtonContent}>
                <View style={[styles.introIconContainer, { backgroundColor: theme.colors.accent + '20' }]}>
                  <Calendar size={20} color={theme.colors.accent} />
                </View>
                <Text style={[styles.introButtonText, { color: theme.colors.text }]}>
                  🌙 Introduction du parcours
                </Text>
              </View>
              {showParcoursIntro ? (
                <ChevronUp size={20} color={theme.colors.textSecondary} />
              ) : (
                <ChevronDown size={20} color={theme.colors.textSecondary} />
              )}
            </Pressable>

            {showParcoursIntro && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                layout={Layout.springify()}
                style={styles.introContent}
              >
                <View style={[styles.introBox, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.introText, { color: theme.colors.textSecondary }]}>
                    {PARCOURS_INTRO.introduction}
                  </Text>
                </View>

                <View style={[styles.fonctionnementBox, {
                  backgroundColor: theme.colors.background,
                  borderLeftColor: theme.colors.accent
                }]}>
                  <Text style={[styles.fonctionnementTitle, { color: theme.colors.accent }]}>
                    🧭 Fonctionnement général
                  </Text>
                  <Text style={[styles.fonctionnementText, { color: theme.colors.textSecondary }]}>
                    {PARCOURS_INTRO.fonctionnement}
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Étapes du parcours */}
          <View style={styles.stepsSection}>
            <Animated.Text
              entering={FadeIn.duration(400).delay(400)}
              style={[styles.sectionTitle, { color: theme.colors.text }]}
            >
              📖 Les étapes du parcours
            </Animated.Text>

            {PARCOURS_STEPS.map((step, index) => {
              const isExpanded = expandedParcoursStep === step.id;
              return (
                <Animated.View
                  key={step.id}
                  entering={SlideInRight.duration(400).delay(450 + index * 80)}
                  layout={Layout.springify()}
                  style={styles.stepContainer}
                >
                  <Pressable
                    onPress={() => {
                      const newExpanded = isExpanded ? null : step.id;
                      setExpandedParcoursStep(newExpanded);
                      trackEvent('nurquran_parcours_day_expanded', {
                        day: step.day,
                        title: step.title,
                        expanded: !!newExpanded,
                      });
                    }}
                    style={({ pressed }) => [
                      styles.stepHeader,
                      {
                        backgroundColor: theme.colors.backgroundSecondary,
                        borderLeftColor: isExpanded ? theme.colors.accent : theme.colors.accent + '50',
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View style={styles.stepHeaderContent}>
                      <Text style={styles.stepEmoji}>{step.emoji}</Text>
                      <View style={styles.stepHeaderText}>
                        <View style={[styles.stepDaysBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                          <Text style={[styles.stepDays, { color: theme.colors.accent }]}>
                            Jour {step.day}
                          </Text>
                        </View>
                        <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
                          {step.title}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.stepHeaderRight}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleStepBookmark(step.id, `Jour ${step.day} - ${step.title}`);
                        }}
                        style={({ pressed }) => [
                          styles.bookmarkButton,
                          pressed && { opacity: 0.7 }
                        ]}
                      >
                        <BookmarkIcon
                          size={20}
                          color={isStepBookmarked(step.id) ? theme.colors.accent : theme.colors.textSecondary}
                          fill={isStepBookmarked(step.id) ? theme.colors.accent : 'transparent'}
                        />
                      </Pressable>
                      {isExpanded ? (
                        <ChevronUp size={20} color={theme.colors.textSecondary} />
                      ) : (
                        <ChevronDown size={20} color={theme.colors.textSecondary} />
                      )}
                    </View>
                  </Pressable>

                  {/* Versets - Seulement si présents pour ce jour (début de cycle) */}
                  {step.verses && step.verses.length > 0 && (
                    <View style={[styles.versesBoxInline, {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.accent + '20',
                    }]}>
                      <Text style={[styles.versesTitleInline, { color: theme.colors.accent }]}>
                        📖 Versets à lire et à méditer (Cycle actuel)
                      </Text>
                      <View style={styles.versesListInline}>
                        {step.verses.map((verse, verseIndex) => {
                          const parsed = parseVerseReference(verse);
                          const isClickable = parsed !== null && parsed.surahNumber >= 1 && parsed.surahNumber <= 114;

                          return (
                            <Pressable
                              key={verseIndex}
                              onPress={() => isClickable && step.verses && handleVersePress(step.id, `Jour ${step.day} - ${step.title}`, step.verses, verseIndex)}
                              disabled={!isClickable}
                              style={({ pressed }) => [
                                styles.verseItemInline,
                                {
                                  backgroundColor: theme.colors.backgroundSecondary,
                                  borderColor: isClickable ? theme.colors.accent + '30' : 'transparent',
                                },
                                isClickable && pressed && { backgroundColor: theme.colors.accent + '15' },
                              ]}
                            >
                              <BookOpen size={14} color={isClickable ? theme.colors.accent : theme.colors.textSecondary} />
                              <Text style={[
                                styles.verseTextInline,
                                { color: isClickable ? theme.colors.accent : theme.colors.text },
                              ]}>
                                {verse}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {isExpanded && (
                    <Animated.View
                      entering={FadeInDown.duration(300)}
                      layout={Layout.springify()}
                      style={styles.stepContent}
                    >
                      {/* Procédure (si présente) */}
                      {step.procedure && (
                        <View style={[styles.stepInfoBox, { backgroundColor: theme.colors.accent + '08', borderColor: theme.colors.accent + '20' }]}>
                          <View style={styles.stepInfoTitleRow}>
                            <Info size={16} color={theme.colors.accent} />
                            <Text style={[styles.stepInfoTitle, { color: theme.colors.accent }]}>Procédure de lecture (J1)</Text>
                          </View>
                          <Text style={[styles.stepInfoText, { color: theme.colors.textSecondary }]}>
                            {step.procedure}
                          </Text>
                        </View>
                      )}

                      {/* Actions quotidiennes */}
                      <View style={styles.actionsContainer}>
                        <View style={styles.stepInfoTitleRow}>
                          <CheckSquare size={16} color={theme.colors.accent} />
                          <Text style={[styles.stepInfoTitle, { color: theme.colors.accent }]}>Actions du jour</Text>
                        </View>
                        {step.actions.map((action, aIndex) => (
                          <View key={aIndex} style={styles.actionItem}>
                            <View style={{ width: 14, height: 14, borderRadius: 3, borderWidth: 1.2, borderColor: theme.colors.accent + '80', alignItems: 'center', justifyContent: 'center' }}>
                              <View style={{ width: 8, height: 8, borderRadius: 1.5, backgroundColor: theme.colors.accent }} />
                            </View>
                            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                              {action}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Dhikr */}
                      {step.dhikr && (
                        <View style={[styles.stepDhikrBox, { backgroundColor: theme.colors.accent + '12', borderColor: theme.colors.accent + '30' }]}>
                          <View style={styles.stepInfoTitleRow}>
                            <Sparkles size={16} color={theme.colors.accent} />
                            <Text style={[styles.stepInfoTitle, { color: theme.colors.accent }]}>Dhikr quotidien</Text>
                          </View>
                          <Text style={[styles.stepDhikrText, { color: theme.colors.text }]}>
                            {step.dhikr}
                          </Text>
                        </View>
                      )}

                      {/* Rappel */}
                      <View style={styles.remindersContainer}>
                        <View style={[styles.stepInfoTitleRow, { marginBottom: spacing.sm }]}>
                          <Wind size={16} color={theme.colors.accent} />
                          <Text style={[styles.stepInfoTitle, { color: theme.colors.accent }]}>Rappel précieux</Text>
                        </View>
                        <View style={[styles.reminderItem, { backgroundColor: theme.colors.background }]}>
                          <View style={[styles.reminderDayBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                            <Text style={[styles.reminderDayText, { color: theme.colors.accent }]}>NUR</Text>
                          </View>
                          <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>
                            {step.reminder}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  )}
                </Animated.View>
              );
            })}
          </View>

          {/* Clôture */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(800)}
            style={[styles.clotureBox, {
              backgroundColor: theme.colors.background,
              borderLeftColor: theme.colors.accent
            }]}
          >
            <Text style={[styles.clotureTitle, { color: theme.colors.accent }]}>
              🌙 Clôture du parcours
            </Text>
            <Text style={[styles.clotureText, { color: theme.colors.textSecondary }]}>
              {PARCOURS_INTRO.cloture}
            </Text>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modal pour afficher les versets */}
      <Modal
        visible={showVerseModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowVerseModal(false);
          setVerseModalData(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setShowVerseModal(false);
              setVerseModalData(null);
            }}
          />
          <Animated.View
            entering={SlideInUp.duration(300).springify()}
            exiting={SlideOutDown.duration(200)}
            style={styles.modalAnimatedContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {verseModalData ? verseModalData.stepTitle : 'Lecteur'}
                  </Text>
                </View>
                {verseModalData && (() => {
                  const currentRef = verseModalData.verseReferences[activePageIndex];
                  const parsed = parseVerseReference(currentRef);
                  return (
                    <Pressable
                      onPress={() => {
                        const title = quranState.arabicData && parsed
                          ? `${quranState.arabicData.name} (${parsed.verseStart}-${parsed.verseEnd})`
                          : currentRef;
                        toggleVerseRefBookmark(currentRef, title);
                      }}
                      style={({ pressed }) => [
                        styles.modalBookmarkButton,
                        pressed && { opacity: 0.7 }
                      ]}
                    >
                      <BookmarkIcon
                        size={20}
                        color={isVerseRefBookmarked(currentRef) ? theme.colors.accent : theme.colors.textSecondary}
                        fill={isVerseRefBookmarked(currentRef) ? theme.colors.accent : 'transparent'}
                      />
                    </Pressable>
                  );
                })()}
              </View>
              <Pressable
                onPress={() => {
                  setShowVerseModal(false);
                  setVerseModalData(null);
                }}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <X size={24} color={theme.colors.text} />
              </Pressable>

              {/* Contenu du modal avec PagerView pour swipe entre les blocs */}
              <View style={styles.modalContentContainer}>
                {(() => {
                  const data = verseModalData;
                  if (!data) return null;

                  return (
                    <View style={{ flex: 1 }}>
                      <PagerView
                        style={styles.pagerView}
                        initialPage={data.initialIndex}
                        overScrollMode="never"
                        onPageSelected={(e) => {
                          const newIndex = e.nativeEvent.position;
                          if (newIndex !== activePageIndex) {
                            setActivePageIndex(newIndex);
                          }
                        }}
                      >
                        {data.verseReferences.map((verseRef, index) => {
                          const parsed = parseVerseReference(verseRef);
                          if (!parsed) return <View key={index} />;

                          const isSurahLoaded = quranState.currentSurah === parsed.surahNumber &&
                            quranState.verses.length > 0 &&
                            !quranState.loading &&
                            !quranState.error;

                          const filteredVerses = isSurahLoaded
                            ? (parsed.verseStart && parsed.verseEnd
                              ? quranState.verses.filter(v => {
                                const num = v.numberInSurah || v.number;
                                return num >= parsed.verseStart! && num <= parsed.verseEnd!;
                              })
                              : quranState.verses)
                            : [];

                          const isBookmarked = isVerseRefBookmarked(verseRef);
                          const isActive = index === activePageIndex;

                          return (
                            <View key={`${verseRef}-${index}`} style={styles.pagerPage} collapsable={false}>
                              <ScrollView
                                style={{ flex: 1 }}
                                contentContainerStyle={styles.pagerScrollContent}
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled={true}
                                overScrollMode="never"
                                scrollEventThrottle={16}
                                directionalLockEnabled={true}
                                keyboardShouldPersistTaps="handled"
                              >
                                <View style={styles.blockHeader}>
                                  <Pressable
                                    onPress={() => toggleVerseRefBookmark(verseRef, verseRef)}
                                    style={styles.checkboxContainer}
                                  >
                                    {isBookmarked ? (
                                      <CheckSquare size={24} color={theme.colors.accent} />
                                    ) : (
                                      <Square size={24} color={theme.colors.textSecondary} />
                                    )}
                                    <View style={{ flex: 1 }}>
                                      <Text style={[styles.blockTitle, { color: theme.colors.text }]}>
                                        {verseRef}
                                      </Text>
                                    </View>
                                  </Pressable>
                                  <Text style={[styles.blockCount, { color: theme.colors.textSecondary }]}>
                                    {isSurahLoaded ? `${filteredVerses.length} versets` : ''}
                                  </Text>
                                </View>

                                {quranState.loading && isActive ? (
                                  <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={theme.colors.accent} />
                                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: spacing.md }]}>
                                      Chargement...
                                    </Text>
                                  </View>
                                ) : !isSurahLoaded && isActive ? (
                                  <View style={styles.loadingContainer}>
                                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                                      Chargement de la sourate {parsed.surahNumber}...
                                    </Text>
                                  </View>
                                ) : (
                                  <View>
                                    {filteredVerses.map((verse, vIndex) => (
                                      <View key={`${verse.number}-${vIndex}`} style={[styles.verseContainer, { marginBottom: spacing.lg }]}>
                                        <View style={[styles.verseNumberBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                                          <Text style={[styles.verseNumberText, { color: theme.colors.accent }]}>
                                            {verse.numberInSurah || verse.number}
                                          </Text>
                                        </View>
                                        <View style={styles.verseContent}>
                                          <Text style={[styles.verseArabic, { color: theme.colors.text, textAlign: 'right' }]}>
                                            {verse.arabic || 'Texte arabe non disponible'}
                                          </Text>
                                          {verse.french && (
                                            <Text style={[styles.verseTranslation, { color: theme.colors.textSecondary, marginTop: spacing.xs }]}>
                                              {verse.french}
                                            </Text>
                                          )}
                                        </View>
                                      </View>
                                    ))}
                                    <View style={{ height: 100 }} />
                                  </View>
                                )}
                              </ScrollView>
                            </View>
                          );
                        })}
                      </PagerView>

                      {/* Indicateur de position (points) */}
                      {data.verseReferences.length > 1 && (
                        <View style={styles.swipeIndicatorContainer}>
                          <View style={styles.swipeDots}>
                            {data.verseReferences.map((_, i) => (
                              <View
                                key={i}
                                style={[styles.swipeDot, { backgroundColor: i === activePageIndex ? theme.colors.accent : theme.colors.textSecondary + '40' }]}
                              />
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })()}
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal >
    </View >
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  heroSection: {
    marginBottom: spacing.lg,
  },
  heroCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  heroTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  heroBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  introButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  introButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  introIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  introContent: {
    marginBottom: spacing.lg,
  },
  introBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  introText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  fonctionnementBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
  },
  fonctionnementTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  fonctionnementText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  stepsSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  stepContainer: {
    marginBottom: spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
  },
  stepHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  stepHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bookmarkButton: {
    padding: 4,
  },
  stepEmoji: {
    fontSize: 24,
  },
  stepHeaderText: {
    flex: 1,
  },
  stepDaysBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  stepDays: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  stepTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  stepContent: {
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
  },
  stepDescriptionBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  stepInfoBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  stepInfoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  stepInfoTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  stepInfoText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  stepDhikrBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  stepDhikrText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    lineHeight: 24,
  },
  remindersContainer: {
    marginTop: spacing.md,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  reminderDayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 32,
    alignItems: 'center',
  },
  reminderDayText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  reminderText: {
    fontSize: fontSize.xs,
    flex: 1,
    lineHeight: 18,
  },
  actionsContainer: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  versesBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  versesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  versesList: {
    gap: spacing.xs,
  },
  verseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  verseText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  versesBoxInline: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    marginLeft: spacing.lg,
    borderWidth: 1,
  },
  versesTitleInline: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  versesListInline: {
    gap: 4,
  },
  verseItemInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  verseTextInline: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  clotureBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    marginTop: spacing.lg,
  },
  clotureTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  clotureText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalAnimatedContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.85,
  },
  modalPressableContainer: {
    width: '100%',
    height: '100%',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 60,
  },
  modalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalBookmarkButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  verseContainer: {
    marginBottom: spacing.lg,
  },
  verseNumberBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  verseNumberText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  verseContent: {
    marginTop: spacing.xs,
  },
  verseArabic: {
    fontSize: fontSize.lg,
    lineHeight: 32,
    fontFamily: 'AmiriQuran',
    marginBottom: spacing.sm,
  },
  verseTranslation: {
    fontSize: fontSize.base,
    lineHeight: 26,
  },
  modalContentContainer: {
    flex: 1,
    width: '100%',
  },
  pagerView: {
    flex: 1,
  },
  pagerPage: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  pagerScrollContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  verseHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  verseTotalText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  translationBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
  },
  swipeIndicatorContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: 8,
  },
  swipeDots: {
    flexDirection: 'row',
    gap: 6,
  },
  swipeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  swipeText: {
    fontSize: fontSize.xs,
  },
  slideIndicator: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  blockTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  blockCount: {
    fontSize: fontSize.xs,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.base,
  },
});

export default NurQuranParcours21;

