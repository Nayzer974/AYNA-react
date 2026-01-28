import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Leaf, ChevronDown, ChevronUp, CheckCircle, Circle, Heart, Sparkles, Calendar, Droplets } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight, Layout } from 'react-native-reanimated';
import { spacing, borderRadius, fontSize, fontWeight } from '@/utils/designTokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Les 10 remèdes prophétiques
const REMEDIES = [
  {
    id: 1,
    name: 'Le Miel',
    emoji: '🍯',
    color: '#F59E0B',
    origin: 'Coran 16:69 – Ibn al-Qayyim',
    understanding: 'Nourrit, répare et renforce le corps',
    benefits: [
      'Renforce l\'estomac',
      'Purifie les intestins',
      'Apaise la fatigue générale',
      'Soutient la récupération',
    ],
    usage: '1 cuillère à soupe, diluée dans de l\'eau tiède, à jeun le matin',
    precautions: 'Éviter l\'excès ; déconseillé aux nourrissons',
  },
  {
    id: 2,
    name: 'La Nigelle (Ḥabba Sawdāʾ)',
    emoji: '🌱',
    color: '#059669',
    origin: 'Hadith authentique – Bukhari & Muslim',
    understanding: 'Utile pour maladies chroniques et déséquilibres internes',
    benefits: [
      'Renforce les défenses naturelles',
      'Apaise certaines douleurs',
      'Soutient les organes',
    ],
    usage: 'Graines moulues avec miel ou huile en petite quantité',
    precautions: 'Cures courtes recommandées',
  },
  {
    id: 3,
    name: 'La Hijāma (Saignée thérapeutique)',
    emoji: '🩸',
    color: '#DC2626',
    origin: 'Sunna confirmée',
    understanding: 'Élimine les excès et rétablit l\'équilibre du sang',
    benefits: [
      'Soulage tensions et douleurs',
      'Améliore la circulation',
    ],
    usage: 'Par un praticien qualifié ; jours recommandés : 17, 19, 21 du calendrier lunaire',
    precautions: 'Éviter en cas de grande faiblesse',
  },
  {
    id: 4,
    name: 'Le Costus Indien (Qusṭ al-Hindī)',
    emoji: '🌿',
    color: '#16A34A',
    origin: 'Hadith authentique',
    understanding: 'Remède traditionnel pour les voies respiratoires',
    benefits: [
      'Soutient voies respiratoires',
      'Apaise inflammations internes',
    ],
    usage: 'Poudre avec miel ou inhalation douce',
    precautions: 'Quantité faible ; goût fort',
  },
  {
    id: 5,
    name: 'L\'Eau potable',
    emoji: '💧',
    color: '#0EA5E9',
    origin: 'Pratique prophétique',
    understanding: 'L\'eau est source naturelle de bien-être',
    benefits: [
      'Hydrate et soutient l\'organisme',
      'Favorise le bon fonctionnement général',
    ],
    usage: 'Consommation régulière, quantité adaptée',
    precautions: null,
  },
  {
    id: 6,
    name: 'Le Jeûne',
    emoji: '🕊️',
    color: '#8B5CF6',
    origin: 'Sunna',
    understanding: 'Repose le système digestif et équilibre le corps',
    benefits: [
      'Régule l\'organisme',
      'Clarifie l\'esprit',
      'Allège la digestion',
    ],
    usage: 'Jeûnes surérogatoires réguliers (lundi/jeudi)',
    precautions: null,
  },
  {
    id: 7,
    name: 'L\'Huile d\'Olive',
    emoji: '🫒',
    color: '#84CC16',
    origin: 'Hadith authentique',
    understanding: 'Huile bénie mentionnée dans le Coran',
    benefits: [
      'Nourrit et protège le corps',
      'Adoucit la peau',
      'Apporte vitalité',
    ],
    usage: 'En alimentation ou application externe',
    precautions: null,
  },
  {
    id: 8,
    name: 'La Datte',
    emoji: '🌴',
    color: '#92400E',
    origin: 'Sunna',
    understanding: 'Fruit béni du palmier',
    benefits: [
      'Fournit énergie et nutriments',
      'Soutient l\'équilibre général',
    ],
    usage: '2 à 7 dattes le matin',
    precautions: null,
  },
  {
    id: 9,
    name: 'Le Sommeil Équilibré',
    emoji: '😴',
    color: '#6366F1',
    origin: 'Pratique prophétique',
    understanding: 'Le repos est essentiel à la régénération',
    benefits: [
      'Régénère le corps',
      'Favorise clarté mentale',
      'Apaise l\'organisme',
    ],
    usage: 'Sommeil régulier, rythme stable',
    precautions: null,
  },
  {
    id: 10,
    name: 'L\'Équilibre de Vie',
    emoji: '⚖️',
    color: '#14B8A6',
    origin: 'Principe général de la Sunna',
    understanding: 'La modération en toute chose',
    benefits: [
      'Prévention naturelle',
      'Bien-être durable',
      'Stabilité de l\'organisme',
    ],
    usage: 'Modération dans alimentation, activité physique et repos',
    precautions: null,
  },
];

// Parcours 7 jours
const PARCOURS_7_JOURS = [
  {
    day: 1,
    remedies: 'Miel, eau',
    objective: 'Hydratation et stimulation digestive',
    emoji: '🍯💧',
  },
  {
    day: 2,
    remedies: 'Datte, huile d\'olive',
    objective: 'Énergie et nutriments',
    emoji: '🌴🫒',
  },
  {
    day: 3,
    remedies: 'Jeûne léger / alimentation simple',
    objective: 'Repos du système digestif',
    emoji: '🕊️',
  },
  {
    day: 4,
    remedies: 'Nigelle ou huile',
    objective: 'Renforcement des défenses naturelles',
    emoji: '🌱',
  },
  {
    day: 5,
    remedies: 'Sommeil régulier',
    objective: 'Régénération physique et mentale',
    emoji: '😴',
  },
  {
    day: 6,
    remedies: 'Eau, modération alimentaire',
    objective: 'Équilibre interne',
    emoji: '💧⚖️',
  },
  {
    day: 7,
    remedies: 'Miel + dattes + repos',
    objective: 'Consolidation des acquis, rééquilibrage complet',
    emoji: '🍯🌴✨',
  },
];

/**
 * Page Nûr al-ʿĀfiyah
 * Les 10 remèdes prophétiques et le parcours de 7 jours
 */
export function NurAfiyahPage() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  const [expandedRemedy, setExpandedRemedy] = useState<number | null>(null);
  const [showParcours, setShowParcours] = useState(false);
  const [validatedRemedies, setValidatedRemedies] = useState<Set<number>>(new Set());
  const [validatedDays, setValidatedDays] = useState<Set<number>>(new Set());

  // Analytics
  useEffect(() => {
    trackPageView('NurAfiyahPage');
  }, []);

  const toggleRemedyValidation = (remedyId: number) => {
    setValidatedRemedies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(remedyId)) {
        newSet.delete(remedyId);
      } else {
        newSet.add(remedyId);
      }
      return newSet;
    });
    trackEvent('nurafiyah_remedy_validated', { remedyId });
  };

  const toggleDayValidation = (day: number) => {
    setValidatedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
    trackEvent('nurafiyah_day_validated', { day });
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
            <Leaf size={24} color="#10B981" />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Nūr al-ʿĀfiyah
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
              colors={['#10B98120', '#10B98105']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroCard, { borderColor: '#10B98130' }]}
            >
              <Leaf size={48} color="#10B981" />
              <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
                Médecine Prophétique
              </Text>
              <Text style={[styles.heroSubtitle, { color: '#10B981' }]}>
                Les remèdes authentiques
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Introduction */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(300)}
            style={[styles.introCard, { backgroundColor: theme.colors.backgroundSecondary }]}
          >
            <Text style={[styles.introTitle, { color: '#10B981' }]}>
              🟢 Introduction
            </Text>
            <Text style={[styles.introText, { color: theme.colors.text }]}>
              La guérison est un bienfait que Allah a placé dans la création. Certaines substances, habitudes et pratiques favorisent l'équilibre et le bon fonctionnement du corps.
            </Text>
            <Text style={[styles.introText, { color: theme.colors.textSecondary, marginTop: spacing.sm }]}>
              Ibn al-Qayyim dans Zād al-Maʿād explique que la médecine prophétique repose sur la sagesse et l'observation : elle traite le corps dans son ensemble et tient compte de l'alimentation, du repos et du rythme de vie.
            </Text>
            <View style={[styles.introHighlight, { backgroundColor: '#10B98115', borderLeftColor: '#10B981' }]}>
              <Text style={[styles.introHighlightText, { color: theme.colors.text }]}>
                Ce module complète la médecine moderne et ne la remplace pas.
              </Text>
            </View>
          </Animated.View>

          {/* Section Titre Remèdes */}
          <Animated.View
            entering={FadeIn.duration(400).delay(400)}
            style={styles.sectionHeader}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🌿 Les 10 Remèdes Prophétiques
            </Text>
          </Animated.View>

          {/* Les 10 remèdes */}
          {REMEDIES.map((remedy, index) => {
            const isExpanded = expandedRemedy === remedy.id;
            const isValidated = validatedRemedies.has(remedy.id);

            return (
              <Animated.View
                key={remedy.id}
                entering={SlideInRight.duration(400).delay(450 + index * 50)}
                layout={Layout.springify()}
                style={styles.remedyContainer}
              >
                <Pressable
                  onPress={() => {
                    setExpandedRemedy(isExpanded ? null : remedy.id);
                    if (!isExpanded) {
                      trackEvent('nurafiyah_remedy_expanded', { remedyId: remedy.id, name: remedy.name });
                    }
                  }}
                  style={({ pressed }) => [
                    styles.remedyHeader,
                    {
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderLeftColor: isValidated ? remedy.color : remedy.color + '60',
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={styles.remedyHeaderLeft}>
                    <View style={[styles.remedyIconContainer, { backgroundColor: remedy.color + '20' }]}>
                      <Text style={styles.remedyEmoji}>{remedy.emoji}</Text>
                    </View>
                    <View style={styles.remedyTitleContainer}>
                      <View style={styles.remedyTitleRow}>
                        <View style={[styles.remedyBadge, { backgroundColor: remedy.color + '20' }]}>
                          <Text style={[styles.remedyBadgeText, { color: remedy.color }]}>
                            {remedy.id}
                          </Text>
                        </View>
                        <Text style={[styles.remedyName, { color: theme.colors.text }]} numberOfLines={1}>
                          {remedy.name}
                        </Text>
                      </View>
                      <Text style={[styles.remedyUnderstanding, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                        {remedy.understanding}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.remedyHeaderRight}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleRemedyValidation(remedy.id);
                      }}
                      style={({ pressed }) => [
                        styles.validateBtn,
                        {
                          backgroundColor: isValidated ? remedy.color + '20' : 'transparent',
                          borderColor: isValidated ? remedy.color : theme.colors.textSecondary + '20',
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      {isValidated ? (
                        <CheckCircle size={20} color={remedy.color} />
                      ) : (
                        <Circle size={20} color={theme.colors.textSecondary} />
                      )}
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
                    style={styles.remedyContent}
                  >
                    {/* Origine */}
                    <View style={[styles.infoBlock, { backgroundColor: theme.colors.background }]}>
                      <Text style={[styles.infoLabel, { color: remedy.color }]}>
                        📖 Origine
                      </Text>
                      <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        {remedy.origin}
                      </Text>
                    </View>

                    {/* Bienfaits */}
                    <View style={[styles.infoBlock, { backgroundColor: theme.colors.background }]}>
                      <Text style={[styles.infoLabel, { color: '#10B981' }]}>
                        ✨ Bienfaits
                      </Text>
                      {remedy.benefits.map((benefit, i) => (
                        <View key={i} style={styles.benefitRow}>
                          <Text style={[styles.benefitBullet, { color: remedy.color }]}>•</Text>
                          <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                            {benefit}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Utilisation */}
                    <View style={[styles.infoBlock, {
                      backgroundColor: remedy.color + '10',
                      borderLeftWidth: 3,
                      borderLeftColor: remedy.color,
                    }]}>
                      <Text style={[styles.infoLabel, { color: remedy.color }]}>
                        🌿 Utilisation
                      </Text>
                      <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        {remedy.usage}
                      </Text>
                    </View>

                    {/* Précautions */}
                    {remedy.precautions && (
                      <View style={[styles.infoBlock, { backgroundColor: '#F59E0B10' }]}>
                        <Text style={[styles.infoLabel, { color: '#F59E0B' }]}>
                          ⚠️ Précautions
                        </Text>
                        <Text style={[styles.infoText, { color: theme.colors.text }]}>
                          {remedy.precautions}
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}

          {/* Parcours 7 jours */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(900)}
            style={styles.parcoursSection}
          >
            <Pressable
              onPress={() => {
                setShowParcours(!showParcours);
                trackEvent('nurafiyah_parcours_toggled', { expanded: !showParcours });
              }}
              style={({ pressed }) => [
                styles.parcoursHeader,
                { backgroundColor: theme.colors.backgroundSecondary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.parcoursHeaderLeft}>
                <View style={[styles.parcoursIconContainer, { backgroundColor: '#8B5CF620' }]}>
                  <Calendar size={28} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={[styles.parcoursTitle, { color: theme.colors.text }]}>
                    🌿 Parcours "Rééquilibrage"
                  </Text>
                  <Text style={[styles.parcoursSubtitle, { color: '#8B5CF6' }]}>
                    7 jours pour retrouver l'équilibre
                  </Text>
                </View>
              </View>
              {showParcours ? (
                <ChevronUp size={24} color={theme.colors.textSecondary} />
              ) : (
                <ChevronDown size={24} color={theme.colors.textSecondary} />
              )}
            </Pressable>

            {showParcours && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                layout={Layout.springify()}
                style={styles.parcoursContent}
              >
                <Text style={[styles.parcoursDescription, { color: theme.colors.textSecondary }]}>
                  Le parcours est conçu pour réactiver l'équilibre général et s'appuie sur les remèdes précédents.
                </Text>

                {PARCOURS_7_JOURS.map((day, index) => {
                  const isValidated = validatedDays.has(day.day);

                  return (
                    <Animated.View
                      key={day.day}
                      entering={FadeInUp.duration(300).delay(index * 60)}
                      style={[styles.dayCard, {
                        backgroundColor: theme.colors.background,
                        borderLeftColor: isValidated ? '#8B5CF6' : '#8B5CF640',
                      }]}
                    >
                      <View style={styles.dayHeader}>
                        <View style={styles.dayTitleRow}>
                          <View style={[styles.dayBadge, { backgroundColor: '#8B5CF620' }]}>
                            <Text style={[styles.dayBadgeText, { color: '#8B5CF6' }]}>
                              Jour {day.day}
                            </Text>
                          </View>
                          <Text style={styles.dayEmoji}>{day.emoji}</Text>
                        </View>
                        <Pressable
                          onPress={() => toggleDayValidation(day.day)}
                          style={({ pressed }) => [
                            styles.validateBtn,
                            {
                              backgroundColor: isValidated ? '#8B5CF620' : 'transparent',
                              borderColor: isValidated ? '#8B5CF6' : theme.colors.textSecondary + '20',
                            },
                            pressed && { opacity: 0.7 },
                          ]}
                        >
                          {isValidated ? (
                            <CheckCircle size={20} color="#8B5CF6" />
                          ) : (
                            <Circle size={20} color={theme.colors.textSecondary} />
                          )}
                        </Pressable>
                      </View>

                      <View style={styles.dayBody}>
                        <View style={[styles.dayInfoRow, { backgroundColor: theme.colors.backgroundSecondary }]}>
                          <Text style={[styles.dayInfoLabel, { color: '#8B5CF6' }]}>Remèdes</Text>
                          <Text style={[styles.dayInfoText, { color: theme.colors.text }]}>{day.remedies}</Text>
                        </View>
                        <View style={[styles.dayInfoRow, { backgroundColor: '#8B5CF610' }]}>
                          <Text style={[styles.dayInfoLabel, { color: '#10B981' }]}>Objectif</Text>
                          <Text style={[styles.dayInfoText, { color: theme.colors.text }]}>{day.objective}</Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}

                <View style={[styles.parcoursAdvice, { backgroundColor: '#F59E0B15', borderLeftColor: '#F59E0B' }]}>
                  <Text style={[styles.parcoursAdviceText, { color: theme.colors.text }]}>
                    💡 Conseil : suivre ce parcours à raison d'un rythme stable, éviter excès et improvisation, respecter le corps et ses besoins.
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Conclusion */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(1000)}
            style={[styles.conclusionCard, { backgroundColor: theme.colors.backgroundSecondary }]}
          >
            <Text style={[styles.conclusionTitle, { color: '#10B981' }]}>
              🟢 Conclusion
            </Text>
            <Text style={[styles.conclusionText, { color: theme.colors.text }]}>
              La médecine prophétique selon Ibn al-Qayyim repose sur l'observation et la sagesse.
            </Text>
            <Text style={[styles.conclusionText, { color: theme.colors.textSecondary, marginTop: spacing.sm }]}>
              Elle n'est ni magique, ni exclusive, mais un guide pour retrouver un équilibre naturel et durable.
            </Text>
            <View style={[styles.conclusionHighlight, { backgroundColor: '#10B98115' }]}>
              <Text style={[styles.conclusionHighlightText, { color: theme.colors.text }]}>
                🌿 La santé est un dépôt confié à l'être humain : prendre soin de son corps est un acte de responsabilité et de prévoyance.
              </Text>
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
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
  introCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  introTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  introText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  introHighlight: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
  },
  introHighlightText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  remedyContainer: {
    marginBottom: spacing.sm,
  },
  remedyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
  },
  remedyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  remedyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remedyEmoji: {
    fontSize: 24,
  },
  remedyTitleContainer: {
    flex: 1,
  },
  remedyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  remedyBadge: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remedyBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  remedyName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  remedyUnderstanding: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  remedyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  validateBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  remedyContent: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
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
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: 4,
  },
  benefitBullet: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  benefitText: {
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 22,
  },
  parcoursSection: {
    marginTop: spacing.lg,
  },
  parcoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  parcoursHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  parcoursIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parcoursTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  parcoursSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  parcoursContent: {
    paddingTop: spacing.md,
  },
  parcoursDescription: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  dayCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  dayBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  dayEmoji: {
    fontSize: 20,
  },
  dayBody: {
    gap: spacing.xs,
  },
  dayInfoRow: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  dayInfoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  dayInfoText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  parcoursAdvice: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    marginTop: spacing.sm,
  },
  parcoursAdviceText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  conclusionCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  conclusionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  conclusionText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  conclusionHighlight: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  conclusionHighlightText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default NurAfiyahPage;

