import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, CheckCircle, Circle, Sparkles, Bookmark as BookmarkIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import { saveBookmark, removeBookmark, getBookmarks, generateBookmarkId } from '@/services/content/quranBookmarks';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight, Layout } from 'react-native-reanimated';
import { spacing, borderRadius, fontSize, fontWeight } from '@/utils/designTokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SURAH_COLORS = {
  yasin: '#F59E0B',
  rahman: '#10B981',
  waqiah: '#8B5CF6',
  mulk: '#3B82F6',
};

/**
 * Page Nûr al-Qur'ân - Lumière guérisseuse
 * Parcours de 7 jours avec les sourates majeures
 */
export function NurQuranLumiere() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [validatedDays, setValidatedDays] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  // Charger les favoris
  useEffect(() => {
    getBookmarks().then(setBookmarks);
  }, []);

  const categories = ['yasin', 'rahman', 'waqiah', 'mulk'];

  // Analytics
  useEffect(() => {
    trackPageView('NurQuranLumiere');
  }, []);

  const toggleDayValidation = (category: string, dayNum: number) => {
    const dayKey = `${category}-${dayNum}`;
    setValidatedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey);
      } else {
        newSet.add(dayKey);
      }
      return newSet;
    });
    trackEvent('nurquran_day_validated', { category, dayNum });
    trackEvent('nurquran_day_validated', { category, dayNum });
  };

  const toggleBookmark = async (category: string, dayNum: number, dayTitle: string) => {
    const id = generateBookmarkId('nur_day', { category, day: dayNum });
    const isBookmarked = bookmarks.some(b => b.id === id);

    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = await removeBookmark(id);
    } else {
      newBookmarks = await saveBookmark({
        id,
        type: 'nur_day',
        timestamp: Date.now(),
        category,
        day: dayNum,
        title: dayTitle
      });
    }
    setBookmarks(newBookmarks);
    trackEvent('bookmark_toggled', { category, dayNum, type: 'nur_day' });
  };

  const isBookmarked = (category: string, dayNum: number) => {
    const id = generateBookmarkId('nur_day', { category, day: dayNum });
    return bookmarks.some(b => b.id === id);
  };

  const toggleCategoryBookmark = async (category: string, categoryTitle: string) => {
    const id = generateBookmarkId('nur_category', { category });
    const isBookmarked = bookmarks.some(b => b.id === id);

    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = await removeBookmark(id);
    } else {
      newBookmarks = await saveBookmark({
        id,
        type: 'nur_category',
        timestamp: Date.now(),
        category,
        title: categoryTitle
      });
    }
    setBookmarks(newBookmarks);
    trackEvent('bookmark_toggled', { category, type: 'nur_category' });
  };

  const isCategoryBookmarked = (category: string) => {
    const id = generateBookmarkId('nur_category', { category });
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
        {/* Header */}
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
            <BookOpen size={24} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t('nurshifa.nurQuran.title')}
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
              colors={[theme.colors.primary + '20', theme.colors.primary + '05']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroCard, { borderColor: theme.colors.primary + '30' }]}
            >
              <BookOpen size={48} color={theme.colors.primary} />
              <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
                La Lumière Guérisseuse
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
                {t('nurshifa.nurQuran.intro')}
              </Text>
              <View style={styles.heroBadges}>
                <View style={[styles.heroBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Sparkles size={14} color={theme.colors.primary} />
                  <Text style={[styles.heroBadgeText, { color: theme.colors.primary }]}>
                    4 sourates
                  </Text>
                </View>
                <View style={[styles.heroBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                  <BookOpen size={14} color={theme.colors.accent} />
                  <Text style={[styles.heroBadgeText, { color: theme.colors.accent }]}>
                    7 jours chacune
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Sourates */}
          {categories.map((category, index) => {
            const isExpanded = expandedCategory === category;
            const categoryColor = SURAH_COLORS[category as keyof typeof SURAH_COLORS];

            return (
              <Animated.View
                key={category}
                entering={SlideInRight.duration(400).delay(300 + index * 100)}
                layout={Layout.springify()}
                style={styles.categoryContainer}
              >
                <Pressable
                  onPress={() => {
                    const newExpanded = isExpanded ? null : category;
                    setExpandedCategory(newExpanded);
                    if (newExpanded) {
                      trackEvent('nurquran_lumiere_category_expanded', { category });
                    }
                  }}
                  style={({ pressed }) => [
                    styles.categoryHeader,
                    {
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderLeftColor: categoryColor,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <View style={[styles.categoryIconContainer, { backgroundColor: categoryColor + '20' }]}>
                      <Text style={styles.categoryEmoji}>
                        {t(`nurshifa.nurQuran.categories.${category}.emoji`)}
                      </Text>
                    </View>
                    <View style={styles.categoryTitleContainer}>
                      <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                        {t(`nurshifa.nurQuran.categories.${category}.title`)}
                      </Text>
                      <Text style={[styles.categorySubtitle, { color: categoryColor }]}>
                        {t(`nurshifa.nurQuran.categories.${category}.subtitle`)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleCategoryBookmark(category, t(`nurshifa.nurQuran.categories.${category}.title`));
                      }}
                      style={({ pressed }) => [
                        styles.categoryBookmarkButton,
                        pressed && { opacity: 0.7 }
                      ]}
                    >
                      <BookmarkIcon
                        size={20}
                        color={isCategoryBookmarked(category) ? categoryColor : theme.colors.textSecondary}
                        fill={isCategoryBookmarked(category) ? categoryColor : 'transparent'}
                      />
                    </Pressable>

                    {isExpanded ? (
                      <ChevronUp size={20} color={theme.colors.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={theme.colors.textSecondary} />
                    )}
                  </View>
                </Pressable>

                {isExpanded && (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    layout={Layout.springify()}
                    style={styles.categoryContent}
                  >
                    {/* Description */}
                    <View style={[styles.descriptionBox, { backgroundColor: theme.colors.background }]}>
                      <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
                        {t(`nurshifa.nurQuran.categories.${category}.description`)}
                      </Text>
                    </View>

                    {/* Intention de début */}
                    <View style={[styles.intentionBox, {
                      backgroundColor: categoryColor + '10',
                      borderLeftColor: categoryColor,
                    }]}>
                      <Text style={[styles.intentionLabel, { color: categoryColor }]}>
                        🤲 Intention de début
                      </Text>
                      <Text style={[styles.intentionText, { color: theme.colors.text }]}>
                        {t(`nurshifa.nurQuran.categories.${category}.intentionStart`)}
                      </Text>
                    </View>

                    {/* Jours du parcours */}
                    <View style={styles.daysContainer}>
                      {Array.from({ length: 7 }, (_, i) => i + 1).map((dayNum) => {
                        const dayKey = `${category}.${dayNum}`;
                        const fullDayKey = `nurshifa.nurQuran.categories.${dayKey}`;
                        const dayData = t(fullDayKey, { returnObjects: true }) as any;
                        const isValidated = validatedDays.has(`${category}-${dayNum}`);

                        if (typeof dayData !== 'object' || !dayData?.title) {
                          return null;
                        }

                        return (
                          <Animated.View
                            key={dayNum}
                            entering={FadeInUp.duration(300).delay(dayNum * 50)}
                            style={[styles.dayCard, {
                              backgroundColor: theme.colors.background,
                              borderLeftColor: isValidated ? categoryColor : categoryColor + '40',
                            }]}
                          >
                            {/* Header du jour */}
                            <View style={styles.dayHeader}>
                              <View style={styles.dayTitleRow}>
                                <View style={[styles.dayBadge, { backgroundColor: categoryColor + '20' }]}>
                                  <Text style={[styles.dayBadgeText, { color: categoryColor }]}>
                                    Jour {dayNum}
                                  </Text>
                                </View>
                                <Text style={[styles.dayTitle, { color: theme.colors.text }]} numberOfLines={2}>
                                  {dayData.title}
                                </Text>
                              </View>

                              <View style={styles.actionButtons}>
                                <Pressable
                                  onPress={() => toggleBookmark(category, dayNum, dayData.title)}
                                  style={({ pressed }) => [
                                    styles.actionBtn,
                                    {
                                      backgroundColor: theme.colors.backgroundSecondary,
                                      borderColor: theme.colors.textSecondary + '20',
                                    },
                                    pressed && { opacity: 0.7 },
                                  ]}
                                >
                                  <BookmarkIcon
                                    size={20}
                                    color={isBookmarked(category, dayNum) ? categoryColor : theme.colors.textSecondary}
                                    fill={isBookmarked(category, dayNum) ? categoryColor : 'transparent'}
                                  />
                                </Pressable>

                                <Pressable
                                  onPress={() => toggleDayValidation(category, dayNum)}
                                  style={({ pressed }) => [
                                    styles.actionBtn,
                                    {
                                      backgroundColor: isValidated ? categoryColor + '20' : theme.colors.backgroundSecondary,
                                      borderColor: isValidated ? categoryColor : theme.colors.textSecondary + '20',
                                    },
                                    pressed && { opacity: 0.7 },
                                  ]}
                                >
                                  {isValidated ? (
                                    <CheckCircle size={20} color={categoryColor} />
                                  ) : (
                                    <Circle size={20} color={theme.colors.textSecondary} />
                                  )}
                                </Pressable>
                              </View>
                            </View>

                            {/* Contenu du jour */}
                            <View style={styles.dayBody}>
                              {dayData.versets && (
                                <View style={[styles.infoBlock, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                  <Text style={[styles.infoLabel, { color: categoryColor }]}>📖 Versets</Text>
                                  <Text style={[styles.infoText, { color: theme.colors.text }]}>{dayData.versets}</Text>
                                </View>
                              )}
                              {dayData.sensCentral && (
                                <View style={[styles.infoBlock, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                  <Text style={[styles.infoLabel, { color: categoryColor }]}>🔎 Sens central</Text>
                                  <Text style={[styles.infoText, { color: theme.colors.text }]}>{dayData.sensCentral}</Text>
                                </View>
                              )}
                              {dayData.lecon && (
                                <View style={[styles.infoBlock, {
                                  backgroundColor: categoryColor + '10',
                                  borderLeftWidth: 3,
                                  borderLeftColor: categoryColor,
                                }]}>
                                  <Text style={[styles.infoLabel, { color: categoryColor }]}>🧠 Leçon à retenir</Text>
                                  <Text style={[styles.infoText, { color: theme.colors.text, fontWeight: '600' }]}>
                                    👉 {dayData.lecon}
                                  </Text>
                                </View>
                              )}
                              {dayData.pratiqueQuotidienne && (
                                <View style={[styles.infoBlock, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                  <Text style={[styles.infoLabel, { color: categoryColor }]}>🛠️ Pratique quotidienne</Text>
                                  <Text style={[styles.infoText, { color: theme.colors.text }]}>{dayData.pratiqueQuotidienne}</Text>
                                </View>
                              )}
                              {dayData.pratiqueJour && (
                                <View style={[styles.infoBlock, { backgroundColor: categoryColor + '15' }]}>
                                  <Text style={[styles.infoLabel, { color: categoryColor }]}>📖 Pratique du jour</Text>
                                  <Text style={[styles.infoText, { color: theme.colors.text }]}>{dayData.pratiqueJour}</Text>
                                </View>
                              )}
                              {dayData.note && (
                                <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                                  💡 {dayData.note}
                                </Text>
                              )}
                            </View>
                          </Animated.View>
                        );
                      })}
                    </View>

                    {/* Intention de fin */}
                    <View style={[styles.intentionBox, {
                      backgroundColor: categoryColor + '10',
                      borderLeftColor: categoryColor,
                    }]}>
                      <Text style={[styles.intentionLabel, { color: categoryColor }]}>
                        🤲 Intention de fin
                      </Text>
                      <Text style={[styles.intentionText, { color: theme.colors.text }]}>
                        {t(`nurshifa.nurQuran.categories.${category}.intentionEnd`)}
                      </Text>
                    </View>
                  </Animated.View>
                )
                }
              </Animated.View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
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
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  heroBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  categoryContainer: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  categorySubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  categoryBookmarkButton: {
    padding: 8,
    marginRight: 4,
  },
  categoryContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  descriptionBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  intentionBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    marginBottom: spacing.md,
  },
  intentionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  intentionText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  daysContainer: {
    gap: spacing.md,
  },
  dayCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dayTitleRow: {
    flex: 1,
    marginRight: spacing.sm,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  dayBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  dayTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayBody: {
    gap: spacing.sm,
  },
  infoBlock: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  noteText: {
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});

export default NurQuranLumiere;

