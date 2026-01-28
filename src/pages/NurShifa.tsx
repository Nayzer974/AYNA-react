import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, BookOpen, Leaf, ChevronRight, Sparkles, Heart, Calendar } from 'lucide-react-native';
import { StarAnimation } from '@/components/icons/StarAnimation';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { ModuleIntroductionModal } from '@/components/ModuleIntroductionModal';
import { hasSeenModuleIntroduction, markModuleIntroductionAsSeen, MODULE_KEYS } from '@/utils/moduleIntroduction';
import { MODULE_INTRODUCTIONS } from '@/data/moduleIntroductions';
import { spacing, borderRadius, fontSize, fontWeight } from '@/utils/designTokens';
import { Carousel } from '@/components/Carousel';
import { HEALING_VERSES } from '@/data/quranVerses';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Page Nur & Shifa
 * Hub principal pour accéder aux différents modules de guérison spirituelle
 */
export function NurShifa() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  // États pour les modals d'introduction
  const [showNurQuranIntroduction, setShowNurQuranIntroduction] = useState(false);
  const [showNurAfiyahIntroduction, setShowNurAfiyahIntroduction] = useState(false);
  const [showIntroductionPage, setShowIntroductionPage] = useState(true);

  // Analytics
  useEffect(() => {
    trackPageView('NurShifa');
  }, []);

  // Navigation vers les pages
  const navigateTo = (page: string, moduleName: string) => {
    trackEvent('nurshifa_navigate', { page, module: moduleName });
    navigation.navigate(page as never);
  };

  // Vérifier et afficher l'introduction si première visite
  const handleModulePress = async (moduleKey: string, page: string, moduleName: string) => {
    try {
      const hasSeenIntro = await hasSeenModuleIntroduction(moduleKey);
      if (!hasSeenIntro) {
        if (moduleKey === MODULE_KEYS.NUR_AL_QURAN) {
          setShowNurQuranIntroduction(true);
        } else if (moduleKey === MODULE_KEYS.NUR_AL_AFIYAH) {
          setShowNurAfiyahIntroduction(true);
        }
      } else {
        navigateTo(page, moduleName);
      }
    } catch (error) {
      console.error('[NurShifa] Erreur:', error);
      navigateTo(page, moduleName);
    }
  };

  // Page d'introduction initiale
  if (showIntroductionPage) {
    return (
      <SafeAreaView style={[styles.introContainer, { backgroundColor: theme.colors.background }]}>
        <GalaxyBackground starCount={100} minSize={1} maxSize={2} themeId={user?.theme} />

        <ScrollView
          style={styles.introScroll}
          contentContainerStyle={styles.introScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(600)} style={styles.introHeader}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.introContent}>
            <LinearGradient
              colors={['#34D39920', '#34D39905']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.introHeroCard, { borderColor: '#34D39930' }]}
            >
              <Leaf size={64} color="#34D399" />
              <Text style={[styles.introTitle, { color: theme.colors.text }]}>
                Nûr & Shifâ
              </Text>
              <Text style={[styles.introSubtitle, { color: '#34D399' }]}>
                Lumière & Guérison
              </Text>
            </LinearGradient>

            <View style={styles.introTextContainer}>
              <Text style={[styles.introDescription, { color: theme.colors.textSecondary }]}>
                Un espace dédié à la guérison par la lumière du Coran et les traditions prophétiques authentiques.
              </Text>

              <View style={[styles.introQuoteBox, {
                backgroundColor: '#34D39910',
                borderColor: '#34D39930',
              }]}>
                <Text style={[styles.introQuote, { color: theme.colors.text }]}>
                  🤍 "Et Nous faisons descendre du Coran{'\n'}
                  ce qui est guérison et miséricorde{'\n'}
                  pour les croyants."{'\n'}
                  <Text style={{ color: '#34D399' }}>— Al-Isrâ', verset 82</Text>
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bouton Continuer */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(600)}
          style={styles.introCTAContainer}
        >
          <Pressable
            onPress={() => setShowIntroductionPage(false)}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
          >
            <LinearGradient
              colors={['#34D399', '#34D399DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.introCTAButton}
            >
              <Text style={styles.introCTAText}>Découvrir</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

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
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Leaf size={24} color="#34D399" />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t('nurshifa.title')}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section Titre */}
          <Animated.View entering={FadeIn.duration(500).delay(100)} style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Choisissez votre parcours
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              Trois chemins de guérison spirituelle
            </Text>
          </Animated.View>

          {/* Carte 1: Parcours 21 jours */}
          <Animated.View entering={SlideInRight.duration(400).delay(200)}>
            <Pressable
              onPress={() => navigateTo('NurQuranParcours21', 'Parcours 21 jours')}
              style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            >
              <LinearGradient
                colors={[theme.colors.accent + '15', theme.colors.accent + '05']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.moduleCard, { borderColor: theme.colors.accent + '30' }]}
              >
                <View style={styles.moduleCardHeader}>
                  <View style={[styles.moduleIconContainer, { backgroundColor: theme.colors.accent + '20' }]}>
                    <StarAnimation size={32} />
                  </View>
                  <ChevronRight size={24} color={theme.colors.textSecondary} />
                </View>

                <View style={styles.moduleCardBody}>
                  <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
                    🌙 Parcours Nûr al-Qur'ân
                  </Text>
                  <Text style={[styles.moduleSubtitle, { color: theme.colors.accent }]}>
                    21 jours de méditation
                  </Text>
                  <Text style={[styles.moduleDescription, { color: theme.colors.textSecondary }]}>
                    Un parcours guidé à travers les versets du Coran pour une transformation spirituelle progressive.
                  </Text>
                </View>

                <View style={styles.moduleBadges}>
                  <View style={[styles.moduleBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                    <Calendar size={12} color={theme.colors.accent} />
                    <Text style={[styles.moduleBadgeText, { color: theme.colors.accent }]}>21 jours</Text>
                  </View>
                  <View style={[styles.moduleBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Sparkles size={12} color={theme.colors.primary} />
                    <Text style={[styles.moduleBadgeText, { color: theme.colors.primary }]}>Guidé</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Carte 2: Nûr al-Qur'ân Lumière */}
          <Animated.View entering={SlideInRight.duration(400).delay(350)}>
            <Pressable
              onPress={() => handleModulePress(MODULE_KEYS.NUR_AL_QURAN, 'NurQuranLumiere', 'Nûr al-Quran')}
              style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            >
              <LinearGradient
                colors={[theme.colors.primary + '15', theme.colors.primary + '05']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.moduleCard, { borderColor: theme.colors.primary + '30' }]}
              >
                <View style={styles.moduleCardHeader}>
                  <View style={[styles.moduleIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                    <BookOpen size={32} color={theme.colors.primary} />
                  </View>
                  <ChevronRight size={24} color={theme.colors.textSecondary} />
                </View>

                <View style={styles.moduleCardBody}>
                  <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
                    {t('nurshifa.nurQuran.title')}
                  </Text>
                  <Text style={[styles.moduleSubtitle, { color: theme.colors.primary }]}>
                    Lumière guérisseuse
                  </Text>
                  <Text style={[styles.moduleDescription, { color: theme.colors.textSecondary }]}>
                    {t('nurshifa.nurQuran.intro')}
                  </Text>
                </View>

                <View style={styles.moduleBadges}>
                  <View style={[styles.moduleBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <BookOpen size={12} color={theme.colors.primary} />
                    <Text style={[styles.moduleBadgeText, { color: theme.colors.primary }]}>4 sourates</Text>
                  </View>
                  <View style={[styles.moduleBadge, { backgroundColor: '#F59E0B20' }]}>
                    <Heart size={12} color="#F59E0B" />
                    <Text style={[styles.moduleBadgeText, { color: '#F59E0B' }]}>7 jours</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Carte 3: Nûr al-ʿĀfiyah */}
          <Animated.View entering={SlideInRight.duration(400).delay(500)}>
            <Pressable
              onPress={() => handleModulePress(MODULE_KEYS.NUR_AL_AFIYAH, 'NurAfiyahPage', 'Nûr al-Afiyah')}
              style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            >
              <LinearGradient
                colors={['#10B98115', '#10B98105']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.moduleCard, { borderColor: '#10B98130' }]}
              >
                <View style={styles.moduleCardHeader}>
                  <View style={[styles.moduleIconContainer, { backgroundColor: '#10B98120' }]}>
                    <Leaf size={32} color="#10B981" />
                  </View>
                  <ChevronRight size={24} color={theme.colors.textSecondary} />
                </View>

                <View style={styles.moduleCardBody}>
                  <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
                    {t('nurshifa.nurAfiyah.title')}
                  </Text>
                  <Text style={[styles.moduleSubtitle, { color: '#10B981' }]}>
                    Remèdes prophétiques
                  </Text>
                  <Text style={[styles.moduleDescription, { color: theme.colors.textSecondary }]}>
                    {t('nurshifa.nurAfiyah.description')}
                  </Text>
                </View>

                <View style={styles.moduleBadges}>
                  <View style={[styles.moduleBadge, { backgroundColor: '#10B98120' }]}>
                    <Leaf size={12} color="#10B981" />
                    <Text style={[styles.moduleBadgeText, { color: '#10B981' }]}>5 catégories</Text>
                  </View>
                  <View style={[styles.moduleBadge, { backgroundColor: '#EC489920' }]}>
                    <Sparkles size={12} color="#EC4899" />
                    <Text style={[styles.moduleBadgeText, { color: '#EC4899' }]}>Authentique</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Citation en bas */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(700)}
            style={[styles.quoteCard, { backgroundColor: theme.colors.backgroundSecondary }]}
          >
            <Text style={[styles.quoteText, { color: theme.colors.textSecondary }]}>
              💚 "La guérison réside dans trois choses : une gorgée de miel, une incision de ventouse, et la cautérisation par le feu. Mais j'interdis à ma communauté la cautérisation."
            </Text>
            <Text style={[styles.quoteSource, { color: theme.colors.accent }]}>
              — Sahih al-Bukhari
            </Text>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modal Introduction Nûr al-Qurʾān */}
      <ModuleIntroductionModal
        visible={showNurQuranIntroduction}
        onClose={async () => {
          await markModuleIntroductionAsSeen(MODULE_KEYS.NUR_AL_QURAN);
          setShowNurQuranIntroduction(false);
          navigateTo('NurQuranLumiere', 'Nûr al-Quran');
        }}
        title="Nûr al-Qurʾān"
        icon={<BookOpen size={36} color={theme.colors.primary} />}
        color={theme.colors.primary}
        content={MODULE_INTRODUCTIONS.NUR_AL_QURAN}
        buttonText="Commencer"
      />

      {/* Modal Introduction Nûr al-ʿĀfiyah */}
      <ModuleIntroductionModal
        visible={showNurAfiyahIntroduction}
        onClose={async () => {
          await markModuleIntroductionAsSeen(MODULE_KEYS.NUR_AL_AFIYAH);
          setShowNurAfiyahIntroduction(false);
          navigateTo('NurAfiyahPage', 'Nûr al-Afiyah');
        }}
        title="Nûr al-ʿĀfiyah"
        icon={<Leaf size={36} color="#10B981" />}
        color="#10B981"
        content={MODULE_INTRODUCTIONS.NUR_AL_AFIYAH}
        buttonText="Découvrir"
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
  },
  moduleCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  moduleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleCardBody: {
    marginBottom: spacing.md,
  },
  moduleTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  moduleSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  moduleDescription: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  moduleBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  moduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  moduleBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  quoteCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  quoteText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  quoteSource: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'right',
  },
  // Styles pour la page d'introduction
  introContainer: {
    flex: 1,
  },
  introScroll: {
    flex: 1,
  },
  introScrollContent: {
    paddingBottom: 120,
  },
  introHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  introContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  introHeroCard: {
    width: '100%',
    padding: spacing['2xl'],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  introTitle: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: fontSize.lg,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  introTextContainer: {
    width: '100%',
  },
  introDescription: {
    fontSize: fontSize.base,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  introQuoteBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  introQuote: {
    fontSize: fontSize.base,
    lineHeight: 26,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  introCTAContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  introCTAButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  introCTAText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  // Nouveaux styles pour le carousel supprimés
});

export default NurShifa;
