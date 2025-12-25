import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Languages } from 'lucide-react-native';
import { surahs } from '@/data/quranData';
import { useQuran } from '@/contexts/QuranContext';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { trackPageView, trackEvent } from '@/services/analytics';
import { speak, stopSpeaking, isSpeaking } from '@/services/speech';
import { Volume2 } from 'lucide-react-native';

const PAGE_SIZE = 10;

/**
 * Page QuranReader
 * 
 * Affiche une sourate avec ses versets en arabe et français
 */
export function QuranReader() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { state, loadSurah } = useQuran();
  const { t } = useTranslation();
  
  const surahNumber = (route.params as any)?.surahNumber || 1;
  // Si la langue est l'arabe, ne pas afficher la traduction par défaut
  const currentLang = i18n.language || 'fr';
  const [showTranslation, setShowTranslation] = useState(currentLang !== 'ar');
  const [page, setPage] = useState(0);
  const [readingVerse, setReadingVerse] = useState<number | null>(null);
  
  const surah = surahs.find(s => s.number === surahNumber);

  useEffect(() => {
    trackPageView('QuranReader', { surahNumber });
    if (surahNumber) {
      loadSurah(surahNumber);
    }
  }, [surahNumber, loadSurah]);

  // ✅ OPTIMISÉ : Mémoriser handleReadVerse
  const handleReadVerse = useCallback(async (verse: any) => {
    if (isSpeaking()) {
      stopSpeaking();
      setReadingVerse(null);
      return;
    }
    
    try {
      const verseNumber = (typeof verse?.numberInSurah === 'number' ? verse.numberInSurah : verse.number);
      setReadingVerse(verseNumber);
      // En arabe, lire seulement le texte arabe
      const textToRead = (currentLang === 'ar' || !showTranslation)
        ? verse.arabic
        : `${verse.arabic}\n${verse.french}`;
      const langToUse = currentLang === 'ar' ? 'ar' : (showTranslation ? currentLang : 'ar');
      await speak(textToRead, langToUse);
      trackEvent('verse_read', { surahNumber, verseNumber });
    } catch (error) {
      // Erreur silencieuse en production
      setReadingVerse(null);
    }
  }, [currentLang, showTranslation, surahNumber]);

  if (!surah) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
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

  // ✅ OPTIMISÉ : Mémoriser renderVerse avec toutes les dépendances
  const renderVerse = useCallback(({ item: verse, index }: { item: any; index: number }) => {
    const verseNumber = (typeof verse?.numberInSurah === 'number' ? verse.numberInSurah : index + 1);
    return (
    <View
      style={[styles.verseCard, { backgroundColor: theme.colors.backgroundSecondary }]}
    >
      <View style={styles.verseContent}>
        {/* Traduction - masquée si langue arabe */}
        {currentLang !== 'ar' && (
          <View style={styles.frenchSection}>
            {showTranslation ? (
              <View style={[styles.translationBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <Text style={[styles.translationText, { color: theme.colors.text }]}>
                  {verse.french || '—'}
                </Text>
              </View>
            ) : (
              <Text style={[styles.hiddenText, { color: theme.colors.textSecondary }]}>
                {t('quran.translationHidden')}
              </Text>
            )}
          </View>
        )}

        {/* Texte arabe */}
        <View style={styles.arabicSection}>
          <View style={styles.verseHeader}>
            <View style={[styles.verseNumberBadge, { backgroundColor: theme.colors.accent }]}>
              <Text style={[styles.verseNumberText, { color: theme.colors.background }]}>
                {verseNumber}
              </Text>
            </View>
            <Pressable
              onPress={() => handleReadVerse(verse)}
              style={({ pressed }) => [
                styles.readButton,
                { backgroundColor: readingVerse === verseNumber ? theme.colors.accent : 'rgba(255, 255, 255, 0.1)' },
                pressed && styles.readButtonPressed
              ]}
            >
              <Volume2 size={16} color={readingVerse === verseNumber ? theme.colors.background : theme.colors.text} />
              <Text style={[
                styles.readButtonText,
                { color: readingVerse === verseNumber ? theme.colors.background : theme.colors.text }
              ]}>
                {readingVerse === verseNumber ? t('quran.stopReading') : t('quran.readVerse')}
              </Text>
            </Pressable>
          </View>
          <View style={styles.arabicTextContainer}>
            <Text style={[styles.arabicText, { color: theme.colors.text }]}>
              {verse.arabic}
            </Text>
          </View>
        </View>
      </View>
    </View>
    );
  }, [theme, currentLang, showTranslation, readingVerse, t, handleReadVerse]);

  // ✅ OPTIMISÉ : keyExtractor
  const keyExtractor = useCallback((item: any) => `${item.number}-${item.numberInSurah}`, []);

  // ✅ OPTIMISÉ : getItemLayout
  const getItemLayout = useCallback((data: ArrayLike<any> | null | undefined, index: number) => ({
    length: 250, // Hauteur approximative d'un verset
    offset: 250 * index,
    index,
  }), []);

  // ✅ OPTIMISÉ : ListHeaderComponent mémorisé
  const ListHeaderComponent = useMemo(() => (
    <>
      {/* Informations de la sourate */}
      {state.arabicData && (
        <View style={[styles.surahInfoCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.surahArabicName, { color: theme.colors.text }]}>
            {state.arabicData.name}
          </Text>
          {surah && i18n.language !== 'ar' && (
            <Text style={[styles.surahFrenchName, { color: theme.colors.accent }]}>
              {surah.frenchName}
            </Text>
          )}
          {i18n.language !== 'ar' && (
            <Text style={[styles.surahEnglishName, { color: theme.colors.textSecondary }]}>
              {surah?.name}
            </Text>
          )}
          <Text style={[styles.surahMeta, { color: theme.colors.textSecondary }]}>
            {t('quran.verses', { count: state.arabicData.numberOfAyahs })} •{' '}
            {state.arabicData.revelationType === 'Meccan' ? t('quran.meccan') : t('quran.medinan')}
          </Text>
        </View>
      )}

      {/* Bismillah pour les sourates (sauf Al-Fatihah et At-Tawbah) */}
      {surahNumber !== 1 && surahNumber !== 9 && state.arabicData && (
        <View style={[styles.basmalaCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.basmalaArabic, { color: theme.colors.text }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
          {showTranslation && currentLang !== 'ar' && (
            <Text style={[styles.basmalaFrench, { color: theme.colors.accent }]}>
              {t('quran.basmala')}
            </Text>
          )}
        </View>
      )}
    </>
  ), [state.arabicData, surahNumber, theme, showTranslation, currentLang, t, i18n.language, surah]);

  // ✅ OPTIMISÉ : ListFooterComponent mémorisé
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
            { backgroundColor: theme.colors.backgroundSecondary },
            (page === 0 || pressed) && styles.paginationButtonDisabled
          ]}
        >
          <Text style={[
            styles.paginationButtonText,
            { color: page === 0 ? theme.colors.textSecondary : theme.colors.text }
          ]}>
            {t('common.previous')}
          </Text>
        </Pressable>
        
        <Text style={[styles.paginationInfo, { color: theme.colors.text }]}>
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
            { backgroundColor: theme.colors.backgroundSecondary },
            (page >= totalPages - 1 || pressed) && styles.paginationButtonDisabled
          ]}
        >
          <Text style={[
            styles.paginationButtonText,
            { color: page >= totalPages - 1 ? theme.colors.textSecondary : theme.colors.text }
          ]}>
            {t('common.next')}
          </Text>
        </Pressable>
      </View>
    );
  }, [state.verses.length, page, totalPages, theme, t]);

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
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed
            ]}
          >
            <ArrowLeft size={20} color={theme.colors.text} />
            <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
              {t('common.back')}
            </Text>
          </Pressable>
          
          {/* Bouton de bascule traduction - masqué si langue arabe */}
          {currentLang !== 'ar' && (
            <Pressable
              onPress={() => {
                setShowTranslation(!showTranslation);
                trackEvent('quran_translation_toggled', { showTranslation: !showTranslation });
              }}
              style={({ pressed }) => [
                styles.toggleButton,
                { 
                  backgroundColor: showTranslation ? theme.colors.accent : theme.colors.backgroundSecondary,
                },
                pressed && styles.buttonPressed
              ]}
            >
              <Languages size={18} color={showTranslation ? theme.colors.background : theme.colors.text} />
              <Text style={[
                styles.toggleButtonText,
                { color: showTranslation ? theme.colors.background : theme.colors.text }
              ]}>
                {showTranslation 
                  ? t('quran.arabic') 
                  : (i18n.language === 'en' ? t('quran.english') : t('quran.french'))}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Chargement */}
        {state.loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              {t('quran.loadingVerses')}
            </Text>
          </View>
        ) : state.error ? (
          <View style={[styles.errorContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Text style={[styles.errorText, { color: '#ef4444' }]}>
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
            getItemLayout={getItemLayout}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
          />
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'System',
  },
  errorContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
  },
  surahInfoCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  surahArabicName: {
    fontSize: 36,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  surahFrenchName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 8,
    textAlign: 'center',
  },
  surahEnglishName: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 8,
    textAlign: 'center',
  },
  surahMeta: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'center',
  },
  basmalaCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  basmalaArabic: {
    fontSize: 28,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 40,
  },
  basmalaFrench: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'center',
  },
  versesContainer: {
    gap: 24,
  },
  verseCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  verseContent: {
    gap: 16,
  },
  frenchSection: {
    width: '100%',
  },
  translationBox: {
    borderRadius: 12,
    padding: 16,
  },
  translationText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    lineHeight: 24,
  },
  hiddenText: {
    fontSize: 14,
    fontStyle: 'italic',
    fontFamily: 'System',
    paddingVertical: 16,
  },
  arabicSection: {
    width: '100%',
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  verseNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  verseNumberText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  readButtonPressed: {
    opacity: 0.7,
  },
  readButtonText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  arabicTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  arabicText: {
    fontSize: 24,
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 8,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  paginationInfo: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
});


