import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Modal, ScrollView, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Languages, Sparkles, X, Volume2, Pause, Bookmark as BookmarkIcon } from 'lucide-react-native';
import { generateBookmarkId } from '@/services/content/quranBookmarks';
import { surahs } from '@/data/quranData';
import { useQuran } from '@/contexts/QuranContext';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import { speak, stopSpeaking, isSpeaking } from '@/services/system/speech';
import { sendToAyna, type ChatMessage as AynaChatMessage } from '@/services/content/ayna';
import { getSubscriptionStatus } from '@/services/system/subscription';
import { PaywallModal } from '@/components/PaywallModal';
import Animated, { SlideInRight, FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';

const { height, width } = Dimensions.get('window');

const PAGE_SIZE = 10;

// Fonction pour générer les couleurs basées sur le thème (comme dans RiyadAsSalihin)
const getColors = (theme: ReturnType<typeof getTheme>) => ({
  background: theme.colors.background,
  cardBackground: theme.colors.backgroundSecondary,
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  textPrimary: theme.colors.text,
  textSecondary: theme.colors.textSecondary,
  textTertiary: theme.colors.textSecondary + '80',
  accent: theme.colors.accent,
  accentSubtle: theme.colors.accent + '25',
  separator: 'rgba(255, 255, 255, 0.08)',
});

/**
 * Page QuranReader
 * 
 * Affiche une sourate avec ses versets en arabe et français
 * Design moderne avec bento grid
 */
export function QuranReader() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const COLORS = getColors(theme);
  const [showPaywall, setShowPaywall] = useState(false);
  const { state, loadSurah, toggleBookmark, checkIsBookmarked } = useQuran();
  const { t } = useTranslation();

  const surahNumber = (route.params as any)?.surahNumber || 1;
  const currentLang = i18n.language || 'fr';
  const [showTranslation, setShowTranslation] = useState(currentLang !== 'ar');
  const [page, setPage] = useState(0);
  const [readingVerse, setReadingVerse] = useState<number | null>(null);

  // États pour l'IA
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [selectedVerse, setSelectedVerse] = useState<any>(null);

  const surah = surahs.find(s => s.number === surahNumber);

  // Fonction pour demander à l'IA d'expliquer un verset
  const handleExplainVerse = useCallback(async (verse: any) => {
    try {
      const subscriptionStatus = await getSubscriptionStatus();
      if (!subscriptionStatus.isActive) {
        setShowPaywall(true);
        return;
      }
    } catch (error) {
      // En cas d'erreur, permettre l'accès
    }

    setSelectedVerse(verse);
    setAiLoading(true);
    setShowAIModal(true);
    setAiResponse('');

    try {
      const verseNumber = typeof verse?.numberInSurah === 'number' ? verse.numberInSurah : verse.number;
      const prompt = `En tant qu'expert en sciences coraniques et tafsir, explique ce verset du Coran de manière claire et accessible :

**Sourate :** ${surah?.name || ''} (${surah?.frenchName || ''})
**Verset ${verseNumber} :**
"${verse.arabic}"

**Traduction :** "${verse.french || ''}"

S'il te plaît, fournis :
1. Le contexte de révélation (Asbab an-Nuzul) si connu
2. L'explication (Tafsir) des principaux savants
3. Les leçons spirituelles et pratiques
4. Comment appliquer ce verset dans notre vie quotidienne

Réponds en français de manière bienveillante et éducative.`;

      const messages: AynaChatMessage[] = [
        { role: 'user', content: prompt }
      ];

      const response = await sendToAyna(messages, currentLang, user?.id);
      setAiResponse(response.content || 'Désolé, je n\'ai pas pu générer de réponse.');
      trackEvent('verse_explained', { surahNumber, verseNumber });
    } catch (error) {
      setAiResponse(t('quran.aiError') || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setAiLoading(false);
    }
  }, [user?.id, surah, surahNumber, t, currentLang]);

  useEffect(() => {
    trackPageView('QuranReader');
    if (surahNumber) {
      loadSurah(surahNumber);
    }
  }, [surahNumber, loadSurah]);

  // Gestion de la lecture audio
  const handleReadVerse = useCallback(async (verse: any) => {
    if (await isSpeaking()) {
      stopSpeaking();
      setReadingVerse(null);
      return;
    }

    try {
      const verseNumber = (typeof verse?.numberInSurah === 'number' ? verse.numberInSurah : verse.number);
      setReadingVerse(verseNumber);
      const textToRead = (currentLang === 'ar' || !showTranslation)
        ? verse.arabic
        : `${verse.arabic}\n${verse.french}`;
      const langToUse = currentLang === 'ar' ? 'ar' : (showTranslation ? currentLang : 'ar');
      await speak(textToRead, { language: langToUse });
      setReadingVerse(null);
      trackEvent('verse_read', { surahNumber, verseNumber });
    } catch (error) {
      setReadingVerse(null);
    }
  }, [currentLang, showTranslation, surahNumber]);

  if (!surah) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
        <Text style={[styles.errorText, { color: COLORS.textPrimary }]}>
          {t('quran.error.surahNotFound')}
        </Text>
      </SafeAreaView>
    );
  }

  const displayedVerses = useMemo(() =>
    state.verses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [state.verses, page]
  );
  const totalPages = useMemo(() =>
    Math.ceil(state.verses.length / PAGE_SIZE),
    [state.verses.length]
  );

  // Mini-player audio visible si une lecture est en cours
  const isAudioPlaying = readingVerse !== null;
  const currentVerseForPlayer = useMemo(() => {
    if (readingVerse === null) return null;
    return state.verses.find(v => {
      const num = typeof v?.numberInSurah === 'number' ? v.numberInSurah : v.number;
      return num === readingVerse;
    });
  }, [readingVerse, state.verses]);

  // Render verset avec design bento
  const renderVerse = useCallback(({ item: verse, index }: { item: any; index: number }) => {
    const verseNumber = (typeof verse?.numberInSurah === 'number' ? verse.numberInSurah : index + 1);
    const isReading = readingVerse === verseNumber;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        style={styles.verseWrapper}
      >
        <View style={[styles.bentoCard, {
          backgroundColor: COLORS.cardBackground,
          borderColor: isReading ? COLORS.accent + '40' : COLORS.cardBorder,
        }]}>
          {/* Header avec numéro de verset */}
          <View style={styles.verseHeader}>
            <View style={[styles.verseNumberBadge, { backgroundColor: COLORS.accent }]}>
              <Text style={[styles.verseNumberText, { color: COLORS.background }]}>
                {verseNumber}
              </Text>
            </View>

            {/* Bouton lecture audio */}
            <Pressable
              onPress={() => handleReadVerse(verse)}
              style={({ pressed }) => [
                styles.readButton,
                {
                  backgroundColor: isReading ? COLORS.accent : COLORS.accentSubtle,
                },
                pressed && styles.buttonPressed
              ]}
            >
              {isReading ? (
                <Pause size={14} color={isReading ? COLORS.background : COLORS.accent} />
              ) : (
                <Volume2 size={14} color={COLORS.accent} />
              )}
            </Pressable>

            {/* Bookmark Button */}
            <Pressable
              onPress={() => {
                const bookmarkId = generateBookmarkId('verse', {
                  surah: surahNumber,
                  verse: verseNumber
                });
                toggleBookmark('verse', {
                  surah: surahNumber,
                  verse: verseNumber,
                  surahName: surah?.name
                });
                trackEvent('bookmark_toggled', { surahNumber, verseNumber, type: 'verse' });
              }}
              style={({ pressed }) => [
                styles.aiButton,
                {
                  backgroundColor: COLORS.cardBackground,
                  borderColor: COLORS.cardBorder,
                  marginLeft: 8
                },
                pressed && styles.buttonPressed
              ]}
            >
              <BookmarkIcon
                size={14}
                color={checkIsBookmarked(generateBookmarkId('verse', { surah: surahNumber, verse: verseNumber }))
                  ? COLORS.accent
                  : COLORS.textTertiary}
                fill={checkIsBookmarked(generateBookmarkId('verse', { surah: surahNumber, verse: verseNumber }))
                  ? COLORS.accent
                  : 'transparent'}
              />
            </Pressable>
          </View>

          {/* Texte arabe */}
          <View style={[styles.arabicContainer, { backgroundColor: COLORS.cardBorder }]}>
            <Text style={[styles.arabicText, { color: COLORS.textPrimary }]}>
              {verse.arabic}
            </Text>
          </View>

          {/* Traduction */}
          {currentLang !== 'ar' && showTranslation && (
            <View style={styles.translationContainer}>
              <Text style={[styles.translationText, { color: COLORS.textSecondary }]}>
                {verse.french || '—'}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.verseActions}>
            <Pressable
              onPress={() => handleExplainVerse(verse)}
              style={({ pressed }) => [
                styles.aiButton,
                {
                  backgroundColor: COLORS.accentSubtle,
                  borderColor: COLORS.accent + '30',
                },
                pressed && styles.buttonPressed
              ]}
            >
              <Sparkles size={14} color={COLORS.accent} />
              <Text style={[styles.aiButtonText, { color: COLORS.accent }]}>
                {t('quran.explainVerse') || 'Comprendre'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  }, [COLORS, theme, currentLang, showTranslation, readingVerse, t, handleReadVerse, handleExplainVerse]);

  const keyExtractor = useCallback((item: any) => `${item.number}-${item.numberInSurah}`, []);

  // Header de la sourate avec design bento
  const ListHeaderComponent = useMemo(() => (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Informations de la sourate - Bento card full */}
      {state.arabicData && (
        <View style={[styles.bentoCardFull, {
          backgroundColor: COLORS.cardBackground,
          borderColor: COLORS.cardBorder,
        }]}>
          <Text style={[styles.surahArabicName, { color: COLORS.textPrimary }]}>
            {state.arabicData.name}
          </Text>
          {surah && i18n.language !== 'ar' && (
            <Text style={[styles.surahFrenchName, { color: COLORS.accent }]}>
              {surah.frenchName}
            </Text>
          )}
          {i18n.language !== 'ar' && (
            <Text style={[styles.surahEnglishName, { color: COLORS.textTertiary }]}>
              {surah?.name}
            </Text>
          )}
          <View style={[styles.surahMetaContainer, { borderTopColor: COLORS.separator }]}>
            <Text style={[styles.surahMeta, { color: COLORS.textTertiary }]}>
              {t('quran.verses', { count: state.arabicData.numberOfAyahs })} •{' '}
              {state.arabicData.revelationType === 'Meccan' ? t('quran.meccan') : t('quran.medinan')}
            </Text>
          </View>
        </View>
      )}

      {/* Bismillah */}
      {surahNumber !== 1 && surahNumber !== 9 && state.arabicData && (
        <View style={[styles.basmalaCard, {
          backgroundColor: COLORS.cardBackground,
          borderColor: COLORS.cardBorder,
        }]}>
          <Text style={[styles.basmalaArabic, { color: COLORS.textPrimary }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
          {showTranslation && currentLang !== 'ar' && (
            <Text style={[styles.basmalaFrench, { color: COLORS.accent }]}>
              {t('quran.basmala')}
            </Text>
          )}
        </View>
      )}
    </Animated.View>
  ), [state.arabicData, surahNumber, COLORS, showTranslation, currentLang, t, i18n.language, surah]);

  // Footer avec pagination
  const ListFooterComponent = useMemo(() => {
    if (state.verses.length <= PAGE_SIZE) return null;

    return (
      <View style={styles.pagination}>
        <Pressable
          onPress={() => {
            setPage(p => Math.max(0, p - 1));
            trackEvent('quran_page_changed', { page: Math.max(0, page - 1) });
          }}
          disabled={page === 0}
          style={({ pressed }) => [
            styles.paginationButton,
            { backgroundColor: COLORS.cardBackground },
            (page === 0 || pressed) && styles.paginationButtonDisabled
          ]}
        >
          <Text style={[
            styles.paginationButtonText,
            { color: page === 0 ? COLORS.textTertiary : COLORS.textPrimary }
          ]}>
            {t('common.previous')}
          </Text>
        </Pressable>

        <Text style={[styles.paginationInfo, { color: COLORS.textPrimary }]}>
          {t('quran.page', { current: page + 1, total: totalPages })}
        </Text>

        <Pressable
          onPress={() => {
            setPage(p => Math.min(totalPages - 1, p + 1));
            trackEvent('quran_page_changed', { page: Math.min(totalPages - 1, page + 1) });
          }}
          disabled={page >= totalPages - 1}
          style={({ pressed }) => [
            styles.paginationButton,
            { backgroundColor: COLORS.cardBackground },
            (page >= totalPages - 1 || pressed) && styles.paginationButtonDisabled
          ]}
        >
          <Text style={[
            styles.paginationButtonText,
            { color: page >= totalPages - 1 ? COLORS.textTertiary : COLORS.textPrimary }
          ]}>
            {t('common.next')}
          </Text>
        </Pressable>
      </View>
    );
  }, [state.verses.length, page, totalPages, COLORS, t]);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[COLORS.background, COLORS.cardBackground]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />

      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        {/* Header minimaliste */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed
            ]}
          >
            <ArrowLeft size={20} color={COLORS.textPrimary} />
            <Text style={[styles.backButtonText, { color: COLORS.textPrimary }]}>
              {t('common.back')}
            </Text>
          </Pressable>

          {/* Bouton de bascule traduction */}
          {currentLang !== 'ar' && (
            <Pressable
              onPress={() => {
                setShowTranslation(!showTranslation);
                trackEvent('quran_translation_toggled', { showTranslation: !showTranslation });
              }}
              style={({ pressed }) => [
                styles.toggleButton,
                {
                  backgroundColor: showTranslation ? COLORS.accent : COLORS.cardBackground,
                  borderColor: COLORS.cardBorder,
                },
                pressed && styles.buttonPressed
              ]}
            >
              <Languages size={16} color={showTranslation ? COLORS.background : COLORS.textPrimary} />
              <Text style={[
                styles.toggleButtonText,
                { color: showTranslation ? COLORS.background : COLORS.textPrimary }
              ]}>
                {showTranslation
                  ? t('quran.arabic')
                  : (i18n.language === 'en' ? t('quran.english') : t('quran.french'))}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Contenu */}
        {state.loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={[styles.loadingText, { color: COLORS.textPrimary }]}>
              {t('quran.loadingVerses')}
            </Text>
          </View>
        ) : state.error ? (
          <View style={[styles.errorContainer, { backgroundColor: COLORS.cardBackground }]}>
            <Text style={[styles.errorText, { color: COLORS.accent }]}>
              {state.error}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayedVerses}
            renderItem={renderVerse}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            updateCellsBatchingPeriod={50}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
          />
        )}

        {/* Mini-player audio */}
        {isAudioPlaying && currentVerseForPlayer && (
          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            style={[styles.audioPlayer, {
              backgroundColor: COLORS.cardBackground,
              borderTopColor: COLORS.accent + '30',
            }]}
          >
            <View style={styles.audioPlayerContent}>
              <View style={styles.audioPlayerInfo}>
                <Text style={[styles.audioPlayerSurah, { color: COLORS.textPrimary }]} numberOfLines={1}>
                  {surah?.frenchName || surah?.name}
                </Text>
                <Text style={[styles.audioPlayerVerse, { color: COLORS.textTertiary }]}>
                  {t('quran.verse', { number: readingVerse, total: state.verses.length }) ||
                    `Verset ${readingVerse}/${state.verses.length}`}
                </Text>
              </View>
              <Pressable
                onPress={() => handleReadVerse(currentVerseForPlayer)}
                style={({ pressed }) => [
                  styles.audioPlayerButton,
                  { backgroundColor: COLORS.accent },
                  pressed && styles.buttonPressed
                ]}
              >
                <Pause size={20} color={COLORS.background} />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Modal IA - Explication du verset */}
        <Modal
          visible={showAIModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAIModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              entering={SlideInRight.duration(300)}
              style={[styles.aiModalContent, { backgroundColor: COLORS.cardBackground }]}
            >
              <View style={styles.aiModalHeader}>
                <View style={styles.aiModalHeaderLeft}>
                  <Sparkles size={24} color={COLORS.accent} />
                  <Text style={[styles.aiModalTitle, { color: COLORS.textPrimary }]}>
                    {t('quran.tafsir') || 'Tafsir - Explication'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowAIModal(false)}
                  style={[styles.closeButton, { backgroundColor: COLORS.cardBorder }]}
                >
                  <X size={20} color={COLORS.textPrimary} />
                </Pressable>
              </View>

              {selectedVerse && (
                <View style={[styles.selectedVerseCard, { backgroundColor: COLORS.accentSubtle }]}>
                  <Text style={[styles.selectedVerseArabic, { color: COLORS.textPrimary }]}>
                    {selectedVerse.arabic}
                  </Text>
                </View>
              )}

              <ScrollView
                style={styles.aiModalScroll}
                showsVerticalScrollIndicator={false}
              >
                {aiLoading ? (
                  <View style={styles.aiLoadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                    <Text style={[styles.aiLoadingText, { color: COLORS.textTertiary }]}>
                      {t('quran.aiLoading') || 'Analyse en cours...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.aiResponseText, { color: COLORS.textPrimary }]}>
                    {aiResponse}
                  </Text>
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* Paywall Modal */}
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          resetAt={null}
          messagesUsed={0}
          mode="subscription"
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'System',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Espace pour le mini-player
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: 'System',
  },
  errorContainer: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'System',
    textAlign: 'center',
  },
  // Bento cards
  bentoCardFull: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  bentoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  // Sourate info
  surahArabicName: {
    fontSize: 32,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  surahFrenchName: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 6,
    textAlign: 'center',
  },
  surahEnglishName: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 12,
    textAlign: 'center',
  },
  surahMetaContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  surahMeta: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'center',
  },
  // Basmala
  basmalaCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  basmalaArabic: {
    fontSize: 26,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 40,
  },
  basmalaFrench: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'center',
  },
  // Verset
  verseWrapper: {
    marginBottom: 4,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  verseNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumberText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  readButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arabicContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  arabicText: {
    fontSize: 22,
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 38,
  },
  translationContainer: {
    marginBottom: 12,
  },
  translationText: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'System',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  verseActions: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  aiButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 8,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  paginationInfo: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'System',
  },
  // Audio player
  audioPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  audioPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioPlayerInfo: {
    flex: 1,
    gap: 4,
  },
  audioPlayerSurah: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
  audioPlayerVerse: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  audioPlayerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal IA
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  aiModalContent: {
    height: height * 0.8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  aiModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedVerseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedVerseArabic: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 32,
    fontFamily: 'System',
  },
  aiModalScroll: {
    flex: 1,
  },
  aiLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  aiLoadingText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'System',
  },
  aiResponseText: {
    fontSize: 15,
    lineHeight: 26,
    fontFamily: 'System',
  },
});