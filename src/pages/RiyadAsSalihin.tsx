/**
 * RiyadAsSalihin - Page Hadith avec design iOS-level
 * Design sobre, calme et respectueux pour la lecture des hadiths
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  Heart,
  Clock,
  Sparkles,
  Star,
  X,
  BookOpen,
  ChevronRight,
} from 'lucide-react-native';

import { hadiths, Hadith } from '@/data/hadiths';
import { getTheme } from '@/data/themes';
import { useUser } from '@/contexts/UserContext';
import { getSubscriptionStatus } from '@/services/system/subscription';
import { sendToAyna } from '@/services/content/ayna';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import { PaywallModal } from '@/components/PaywallModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@hadith_favorites';
const LAST_VIEWED_KEY = '@hadith_last_viewed';

// ============================================
// CONSTANTES ET CONFIGURATION
// ============================================

const SKELETON_DURATION = 400;

// Fonction pour générer les couleurs basées sur le thème
const getColors = (theme: ReturnType<typeof getTheme>) => ({
  background: theme.colors.background,
  cardBackground: theme.colors.backgroundSecondary,
  cardBorder: theme.colors.border || 'rgba(255, 255, 255, 0.06)',
  textPrimary: theme.colors.text,
  textSecondary: theme.colors.textSecondary,
  textTertiary: theme.colors.textSecondary + '80',
  accent: theme.colors.accent,
  accentSubtle: theme.colors.accent + '25',
  searchBackground: theme.colors.backgroundSecondary,
  separator: theme.colors.border || 'rgba(255, 255, 255, 0.08)',
});

// Thèmes disponibles avec mots-clés pour le filtrage
const THEMES = [
  { id: 'faith', name: 'La Foi', icon: Heart, keywords: ['foi', 'intention', 'sincérité', 'fondements', 'croyance'] },
  { id: 'prayer', name: 'La Prière', icon: BookOpen, keywords: ['prière', 'dhikr', 'invocation', 'adoration'] },
  { id: 'conduct', name: 'La Conduite', icon: Star, keywords: ['caractère', 'comportement', 'douceur', 'humilité', 'pudeur', 'véracité'] },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function RiyadAsSalihin() {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const navigation = useNavigation();
  const currentLang = i18n.language;
  
  // Couleurs dynamiques basées sur le thème
  const COLORS = useMemo(() => getColors(theme), [theme]);
  
  // Styles dynamiques basés sur les couleurs
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  // États
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [expandedHadithId, setExpandedHadithId] = useState<string | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const [aiExplanation, setAIExplanation] = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastViewedId, setLastViewedId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Hadith du jour
  const hadithOfTheDay = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    return hadiths[dayOfYear % hadiths.length];
  }, []);

  // Filtrage par recherche, thème et favoris
  const filteredHadiths = useMemo(() => {
    let result = hadiths;
    
    // Filtrer par favoris uniquement si activé
    if (showFavoritesOnly) {
      result = result.filter(h => favorites.includes(h.id));
    }
    
    // Filtrer par thème si sélectionné
    if (selectedTheme) {
      const themeConfig = THEMES.find(t => t.id === selectedTheme);
      if (themeConfig) {
        result = result.filter(h => 
          h.themes.some(theme => 
            themeConfig.keywords.some(keyword => 
              theme.toLowerCase().includes(keyword.toLowerCase())
            )
          )
        );
      }
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (h) =>
          h.arabic.includes(searchQuery) ||
          h.translation.fr.toLowerCase().includes(query) ||
          h.translation.en.toLowerCase().includes(query) ||
          h.narrator.toLowerCase().includes(query) ||
          h.chapter.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [searchQuery, selectedTheme, showFavoritesOnly, favorites]);

  // Charger les favoris, dernier consulté et skeleton loading
  useEffect(() => {
    trackPageView('RiyadAsSalihin');
    
    const loadData = async () => {
      try {
        // Charger les favoris
        const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
        
        // Charger le dernier hadith consulté
        const storedLastViewed = await AsyncStorage.getItem(LAST_VIEWED_KEY);
        if (storedLastViewed) {
          setLastViewedId(storedLastViewed);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };
    loadData();
    
    const timer = setTimeout(() => setIsLoading(false), SKELETON_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleToggleHadith = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedHadithId((prev) => (prev === id ? null : id));
    trackEvent('hadith_toggle', { hadithId: id });
    
    // Sauvegarder comme dernier hadith consulté
    setLastViewedId(id);
    try {
      await AsyncStorage.setItem(LAST_VIEWED_KEY, id);
    } catch (error) {
      console.error('Erreur sauvegarde dernier consulté:', error);
    }
  }, []);

  const handleThemeSelect = useCallback((themeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTheme((prev) => (prev === themeId ? null : themeId));
    trackEvent('hadith_theme_select', { theme: themeId });
  }, []);

  const handleToggleFavorite = useCallback(async (hadithId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newFavorites = favorites.includes(hadithId)
      ? favorites.filter(id => id !== hadithId)
      : [...favorites, hadithId];
    
    setFavorites(newFavorites);
    
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      trackEvent('hadith_favorite_toggle', { 
        hadithId, 
        isFavorite: !favorites.includes(hadithId) 
      });
    } catch (error) {
      console.error('Erreur sauvegarde favoris:', error);
    }
  }, [favorites]);

  const handleUnderstandHadith = useCallback(async (hadith: Hadith) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const status = await getSubscriptionStatus();
    if (!status.isActive) {
      setShowPaywall(true);
      return;
    }

    setSelectedHadith(hadith);
    setShowAIModal(true);
    setAILoading(true);
    setAIExplanation('');

    trackEvent('hadith_understand_request', { hadithId: hadith.id });

    try {
      const prompt = `En tant qu'expert en sciences islamiques, explique ce hadith de manière claire et accessible. 

Hadith : "${hadith.translation.fr}"
Narrateur : ${hadith.narrator}
Source : ${hadith.source}
Chapitre : ${hadith.chapter}

Fournis :
1. Le contexte historique de ce hadith
2. Son explication détaillée
3. Les leçons pratiques à en tirer
4. Son importance dans la vie quotidienne du musulman

Réponds de manière respectueuse, éducative et accessible.`;

      const messages = [{ role: 'user' as const, content: prompt }];
      const response = await sendToAyna(messages, currentLang, user?.id);
      setAIExplanation(response.content);
    } catch (error) {
      console.error('Erreur IA:', error);
      setAIExplanation(t('hadith.aiError') || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setAILoading(false);
    }
  }, [user, t]);

  // Pas de handleBack - c'est un onglet principal

  // ============================================
  // RENDER HADITH CARD
  // ============================================

  const renderHadithCard = useCallback(({ item, index }: { item: Hadith; index: number }) => {
    const isExpanded = expandedHadithId === item.id;
    
    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 50, 200)).duration(300)}
        layout={Layout.springify().damping(15)}
        style={styles.hadithCardWrapper}
      >
        <Pressable
          onPress={() => handleToggleHadith(item.id)}
          style={({ pressed }) => [
            styles.hadithCard,
            pressed && styles.hadithCardPressed,
          ]}
        >
          {/* Header */}
          <View style={styles.hadithHeader}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{item.number}</Text>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.chapterText} numberOfLines={1}>
                {item.chapter}
              </Text>
              <Text style={styles.sourceText}>{item.source}</Text>
            </View>
            {/* Bouton Favoris */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleToggleFavorite(item.id);
              }}
              style={({ pressed }) => [
                styles.favoriteButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Heart 
                size={18} 
                color={favorites.includes(item.id) ? '#FF6B6B' : COLORS.textTertiary}
                fill={favorites.includes(item.id) ? '#FF6B6B' : 'transparent'}
                strokeWidth={1.8} 
              />
            </Pressable>
            <ChevronRight
              size={16}
              color={COLORS.textTertiary}
              style={{
                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
              }}
            />
          </View>

          {/* Texte arabe */}
          <View style={styles.arabicContainer}>
            <Text
              style={styles.arabicText}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {item.arabic}
            </Text>
          </View>

          {/* Traduction */}
          <Text
            style={styles.translationText}
            numberOfLines={isExpanded ? undefined : 3}
          >
            {currentLang === 'en' ? item.translation.en : item.translation.fr}
          </Text>

          {/* Narrateur */}
          <Text style={styles.narratorText}>— {item.narrator}</Text>

          {/* Bouton IA */}
          {isExpanded && (
            <Animated.View entering={FadeIn.duration(200)}>
              <Pressable
                onPress={() => handleUnderstandHadith(item)}
                style={({ pressed }) => [
                  styles.understandButton,
                  pressed && styles.understandButtonPressed,
                ]}
              >
                <Sparkles size={14} color={COLORS.textPrimary} strokeWidth={1.5} />
                <Text style={styles.understandButtonText}>
                  Comprendre ce hadith
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
    );
  }, [expandedHadithId, currentLang, handleToggleHadith, handleUnderstandHadith, favorites, handleToggleFavorite]);

  // ============================================
  // HEADER
  // ============================================

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Riyad as-Salihin</Text>
        <Text style={styles.subtitle}>
          {hadiths.length} hadiths • Imam An-Nawawi
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={16} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un hadith..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          selectionColor={COLORS.accent}
        />
      </View>
    </View>
  );

  // ============================================
  // BENTO SECTION
  // ============================================

  const renderBentoSection = () => (
    <View style={styles.bentoSection}>
      {/* Hadith du jour - Full width */}
      <View style={styles.bentoCardFull}>
        <View style={styles.bentoHeader}>
          <View style={[styles.bentoIconContainer, { backgroundColor: COLORS.accentSubtle }]}>
            <Star size={18} color={COLORS.accent} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bentoTitle}>Hadith du jour</Text>
            <Text style={styles.bentoSubtitle}>{hadithOfTheDay.chapter}</Text>
          </View>
          {/* Bouton Favoris */}
          <Pressable
            onPress={() => handleToggleFavorite(hadithOfTheDay.id)}
            style={({ pressed }) => [
              styles.actionIconButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Heart 
              size={20} 
              color={favorites.includes(hadithOfTheDay.id) ? '#FF6B6B' : COLORS.textSecondary}
              fill={favorites.includes(hadithOfTheDay.id) ? '#FF6B6B' : 'transparent'}
              strokeWidth={1.8} 
            />
          </Pressable>
        </View>
        
        {/* Texte arabe */}
        <View style={styles.hadithDayArabicContainer}>
          <Text style={styles.bentoArabicFull}>
            {hadithOfTheDay.arabic}
          </Text>
        </View>
        
        {/* Traduction */}
        <Text style={styles.hadithDayTranslation}>
          {currentLang === 'en' ? hadithOfTheDay.translation.en : hadithOfTheDay.translation.fr}
        </Text>
        
        {/* Narrateur et source */}
        <View style={styles.hadithDayFooter}>
          <Text style={styles.bentoNarrator}>— {hadithOfTheDay.narrator}</Text>
          <Text style={styles.hadithDaySource}>{hadithOfTheDay.source}</Text>
        </View>
        
        {/* Boutons d'action */}
        <View style={styles.hadithDayActions}>
          <Pressable
            onPress={() => handleUnderstandHadith(hadithOfTheDay)}
            style={({ pressed }) => [
              styles.hadithDayButton,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Sparkles size={16} color={COLORS.accent} strokeWidth={1.5} />
            <Text style={styles.hadithDayButtonText}>Analyser</Text>
          </Pressable>
        </View>
      </View>

      {/* Row: Dernier consulté + Favoris */}
      <View style={styles.bentoRow}>
        {/* Dernier consulté */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (lastViewedId) {
              // Réinitialiser les filtres et ouvrir le hadith
              setSearchQuery('');
              setSelectedTheme(null);
              setShowFavoritesOnly(false);
              setExpandedHadithId(lastViewedId);
              trackEvent('hadith_last_viewed_click', { hadithId: lastViewedId });
            }
          }}
          style={({ pressed }) => [
            styles.bentoCardHalf,
            pressed && styles.bentoCardPressed,
            !lastViewedId && { opacity: 0.5 },
          ]}
        >
          <View style={[styles.bentoIconContainer, lastViewedId && { backgroundColor: 'rgba(100, 200, 255, 0.15)' }]}>
            <Clock size={16} color={lastViewedId ? '#64C8FF' : COLORS.textSecondary} strokeWidth={1.5} />
          </View>
          <Text style={styles.bentoSmallTitle}>Dernier consulté</Text>
          <Text style={styles.bentoSmallValue}>
            {lastViewedId 
              ? `Hadith #${hadiths.find(h => h.id === lastViewedId)?.number || '?'}`
              : 'Aucun'
            }
          </Text>
        </Pressable>

        {/* Mes favoris */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (favorites.length > 0) {
              // Toggle le mode favoris
              setSearchQuery('');
              setSelectedTheme(null);
              setShowFavoritesOnly(!showFavoritesOnly);
              trackEvent('hadith_favorites_toggle', { showFavorites: !showFavoritesOnly });
            }
          }}
          style={({ pressed }) => [
            styles.bentoCardHalf,
            pressed && styles.bentoCardPressed,
            showFavoritesOnly && styles.bentoCardActive,
            favorites.length === 0 && { opacity: 0.5 },
          ]}
        >
          <View style={[styles.bentoIconContainer, favorites.length > 0 && { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
            <Heart 
              size={16} 
              color={favorites.length > 0 ? '#FF6B6B' : COLORS.textSecondary} 
              fill={favorites.length > 0 ? '#FF6B6B' : 'transparent'}
              strokeWidth={1.5} 
            />
          </View>
          <Text style={styles.bentoSmallTitle}>
            {showFavoritesOnly ? '← Tous les hadiths' : 'Mes favoris'}
          </Text>
          <Text style={styles.bentoLargeValue}>{favorites.length}</Text>
        </Pressable>
      </View>

      {/* Thèmes */}
      <Text style={styles.sectionTitle}>Explorer par thème</Text>
      <View style={styles.themesRow}>
        {THEMES.map((themeItem) => {
          const IconComponent = themeItem.icon;
          const isActive = selectedTheme === themeItem.id;
          // Compter les hadiths pour ce thème
          const count = hadiths.filter(h => 
            h.themes.some(theme => 
              themeItem.keywords.some(keyword => 
                theme.toLowerCase().includes(keyword.toLowerCase())
              )
            )
          ).length;
          return (
            <Pressable
              key={themeItem.id}
              onPress={() => handleThemeSelect(themeItem.id)}
              style={({ pressed }) => [
                styles.themeButton,
                isActive && styles.themeButtonActive,
                pressed && styles.themeButtonPressed,
              ]}
            >
              <IconComponent 
                size={14} 
                color={isActive ? COLORS.accent : COLORS.textSecondary} 
                strokeWidth={1.5} 
              />
              <Text style={[styles.themeName, isActive && styles.themeNameActive]}>
                {themeItem.name}
              </Text>
              <Text style={[styles.themeCount, isActive && styles.themeCountActive]}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>
      
      {/* Bouton pour effacer le filtre de thème */}
      {selectedTheme && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedTheme(null);
          }}
          style={({ pressed }) => [
            styles.clearFilterButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <X size={14} color={COLORS.accent} strokeWidth={2} />
          <Text style={styles.clearFilterText}>Effacer le filtre</Text>
        </Pressable>
      )}
    </View>
  );

  // ============================================
  // SKELETON
  // ============================================

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonCard} />
          <View style={styles.bentoRow}>
            <View style={[styles.skeletonCard, { width: '48%', height: 100 }]} />
            <View style={[styles.skeletonCard, { width: '48%', height: 100 }]} />
          </View>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </View>
      </SafeAreaView>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={filteredHadiths}
        keyExtractor={(item) => item.id}
        renderItem={renderHadithCard}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {!searchQuery && !showFavoritesOnly && renderBentoSection()}
            {showFavoritesOnly && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFavoritesOnly(false);
                }}
                style={styles.favoritesHeader}
              >
                <Heart size={18} color="#FF6B6B" fill="#FF6B6B" strokeWidth={1.5} />
                <Text style={styles.favoritesHeaderTitle}>Mes favoris</Text>
                <Text style={styles.favoritesHeaderClose}>✕ Fermer</Text>
              </Pressable>
            )}
            <Text style={styles.sectionTitle}>
              {showFavoritesOnly 
                ? `${filteredHadiths.length} hadith${filteredHadiths.length > 1 ? 's' : ''} en favoris`
                : searchQuery 
                  ? `${filteredHadiths.length} résultats` 
                  : 'Tous les hadiths'
              }
            </Text>
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
      />

      {/* Modal IA */}
      <Modal
        visible={showAIModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowAIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Sparkles size={18} color={COLORS.accent} strokeWidth={1.5} />
                <Text style={styles.modalTitle}>Explication</Text>
              </View>
              <Pressable
                onPress={() => setShowAIModal(false)}
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <X size={20} color={COLORS.textSecondary} strokeWidth={1.5} />
              </Pressable>
            </View>

            {/* Hadith preview */}
            {selectedHadith && (
              <View style={styles.modalHadithPreview}>
                <Text style={styles.modalArabic} numberOfLines={2}>
                  {selectedHadith.arabic}
                </Text>
                <Text style={styles.modalNarrator}>— {selectedHadith.narrator}</Text>
              </View>
            )}

            {/* Content */}
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {aiLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={styles.loadingText}>Analyse en cours...</Text>
                </View>
              ) : (
                <Text style={styles.explanationText}>{aiExplanation}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Paywall */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        resetAt={null}
        messagesUsed={0}
        mode="subscription"
      />
    </SafeAreaView>
  );
}

// ============================================
// STYLES DYNAMIQUES
// ============================================

// Fonction pour créer les styles avec les couleurs du thème
const createStyles = (COLORS: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.searchBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },

  // Bento
  bentoSection: {
    marginBottom: 24,
  },
  bentoCardFull: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  bentoCardHalf: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 14,
    width: '48%',
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  bentoCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hadithDayActions: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
    paddingTop: 12,
  },
  hadithDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSubtle,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  hadithDayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  bentoCardActive: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  favoritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  favoritesHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  favoritesHeaderClose: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bentoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  bentoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bentoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bentoSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  bentoArabic: {
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'right',
    lineHeight: 26,
    writingDirection: 'rtl',
  },
  bentoArabicFull: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'right',
    lineHeight: 32,
    writingDirection: 'rtl',
  },
  hadithDayArabicContainer: {
    backgroundColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  hadithDayTranslation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  hadithDayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hadithDaySource: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '500',
  },
  bentoNarrator: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  bentoSmallTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bentoSmallValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  bentoLargeValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
  },

  // Section title
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 14,
    marginTop: 8,
  },

  // Themes
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  themeButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.8,
  },
  themeName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  themeCount: {
    fontSize: 11,
    color: COLORS.textTertiary,
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  themeButtonActive: {
    backgroundColor: COLORS.accentSubtle,
    borderColor: COLORS.accent,
  },
  themeNameActive: {
    color: COLORS.accent,
  },
  themeCountActive: {
    backgroundColor: COLORS.accent,
    color: '#000',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  clearFilterText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '500',
  },

  // Hadith cards
  hadithCardWrapper: {
    marginBottom: 10,
  },
  hadithCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  hadithCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  hadithHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  headerMeta: {
    flex: 1,
  },
  chapterText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  sourceText: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  arabicContainer: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.separator,
    paddingLeft: 12,
    marginBottom: 12,
  },
  arabicText: {
    fontSize: 17,
    color: COLORS.textPrimary,
    textAlign: 'right',
    lineHeight: 30,
    writingDirection: 'rtl',
  },
  translationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  narratorText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  understandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 14,
    gap: 8,
  },
  understandButtonPressed: {
    opacity: 0.7,
  },
  understandButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Skeleton
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    height: 140,
    marginBottom: 10,
    opacity: 0.5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHadithPreview: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  modalArabic: {
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'right',
    lineHeight: 28,
    writingDirection: 'rtl',
  },
  modalNarrator: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  explanationText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
});
