import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, Leaf, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { trackPageView, trackEvent } from '@/services/analytics';
import { speak, stopSpeaking } from '@/services/speech';

/**
 * Page Nur & Shifa
 * Module de guérison spirituelle
 * Deux parties : Nûr al-Qur'ân et Nûr al-'Āfiyah
 */
export function NurShifa() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t, i18n } = useTranslation();
  const [expandedRemedy, setExpandedRemedy] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [speakingVerse, setSpeakingVerse] = useState<string | null>(null);

  const afiyahCategories = ['corps', 'coeur', 'maux', 'alimentation', 'preventifs'];

  // Analytics: Track page view
  useEffect(() => {
    trackPageView('NurShifa');
  }, []);

  // Fonction pour lire un verset ou arrêter la lecture
  const handleSpeakVerse = async (verseData: any, verseKey: string) => {
    try {
      // Si ce verset est déjà en train de parler, on l'arrête
      if (speakingVerse === verseKey) {
        stopSpeaking(); // Appel synchrone pour arrêter immédiatement
        setSpeakingVerse(null);
        trackEvent('nurshifa_verse_stop', {
          category: expandedCategory,
          verse: verseKey,
        });
        return;
      }

      // Si un autre verset est en train de parler, on l'arrête d'abord
      if (speakingVerse) {
        stopSpeaking(); // Appel synchrone pour arrêter immédiatement
        setSpeakingVerse(null);
      }

      // Construire le texte à lire (uniquement l'arabe)
      const textToSpeak = verseData.arabic || '';

      if (!textToSpeak.trim()) return;

      // Toujours utiliser l'arabe pour la lecture des versets
      const ttsLang = 'ar-SA';

      setSpeakingVerse(verseKey);
      trackEvent('nurshifa_verse_speak', {
        category: expandedCategory,
        verse: verseKey,
      });

      // Démarrer la lecture (non-bloquant)
      speak(textToSpeak, {
        language: ttsLang,
        rate: 0.7,
        pitch: 1.0,
      }).then(() => {
        // Quand la lecture est terminée, réinitialiser l'état seulement si c'est toujours ce verset
        setSpeakingVerse((current) => {
          return current === verseKey ? null : current;
        });
      }).catch((error) => {
        console.error('Erreur lors de la lecture du verset:', error);
        setSpeakingVerse((current) => {
          return current === verseKey ? null : current;
        });
      });
    } catch (error) {
      console.error('Erreur lors de la lecture du verset:', error);
      setSpeakingVerse(null);
    }
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} themeId={user?.theme} />

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('nurshifa.title')}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section Nûr al-Qur'ân */}
          <Card style={[styles.sectionCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <BookOpen size={28} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('nurshifa.nurQuran.title')}
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              {t('nurshifa.nurQuran.intro')}
            </Text>

            {/* Catégories */}
            {['deblocage', 'protection', 'guerison', 'apaisement', 'espoir', 'tristesse', 'purification'].map((category) => {
              const isExpanded = expandedCategory === category;
              
              return (
                <View key={category} style={styles.categoryContainer}>
                  <Pressable
                    onPress={() => {
                      const newExpanded = isExpanded ? null : category;
                      setExpandedCategory(newExpanded);
                      if (newExpanded) {
                        trackEvent('nurshifa_category_expanded', {
                          category: newExpanded,
                        });
                      }
                    }}
                    style={({ pressed }) => [
                      styles.categoryHeader,
                      { backgroundColor: theme.colors.background },
                      pressed && styles.categoryHeaderPressed,
                    ]}
                  >
                    <View style={styles.categoryHeaderLeft}>
                      <Text style={[styles.categoryEmoji]}>
                        {t(`nurshifa.nurQuran.categories.${category}.emoji`)}
                      </Text>
                      <View style={styles.categoryTitleContainer}>
                        <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                          {t(`nurshifa.nurQuran.categories.${category}.title`)}
                        </Text>
                        <Text style={[styles.categorySubtitle, { color: theme.colors.textSecondary }]}>
                          {t(`nurshifa.nurQuran.categories.${category}.subtitle`)}
                        </Text>
                      </View>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color={theme.colors.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={theme.colors.textSecondary} />
                    )}
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.categoryContent}>
                      <Text style={[styles.categoryDescription, { color: theme.colors.textSecondary }]}>
                        {t(`nurshifa.nurQuran.categories.${category}.description`)}
                      </Text>
                      
                      {/* Intention de début */}
                      <View style={[styles.intentionContainer, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.intentionLabel, { color: theme.colors.primary }]}>
                          {t('nurshifa.nurQuran.intentionStart') || 'Intention de début'}
                        </Text>
                        <Text style={[styles.intentionText, { color: theme.colors.text }]}>
                          {t(`nurshifa.nurQuran.categories.${category}.intentionStart`)}
                        </Text>
                      </View>

                      {/* Versets */}
                      {Array.from({ length: 7 }, (_, i) => i + 1).map((verseNum) => {
                        const verseKey = `${category}.${verseNum}`;
                        const fullVerseKey = `nurshifa.nurQuran.categories.${verseKey}`;
                        const verseData = t(fullVerseKey, { returnObjects: true });
                        if (typeof verseData === 'object' && verseData !== null && 'title' in verseData) {
                          const isSpeaking = speakingVerse === fullVerseKey;
                          return (
                            <View
                              key={verseNum}
                              style={[styles.verseItem, { backgroundColor: theme.colors.background }]}
                            >
                              <Text style={[styles.verseNumber, { color: theme.colors.primary }]}>
                                {verseNum}️⃣
                              </Text>
                              <View style={styles.verseContent}>
                                <View style={styles.verseHeader}>
                                  <Text style={[styles.verseTitle, { color: theme.colors.text }]}>
                                    {verseData.title}
                                  </Text>
                                  {(verseData.arabic || verseData.translation) && (
                                    <Pressable
                                      onPress={() => handleSpeakVerse(verseData, fullVerseKey)}
                                      style={({ pressed }) => [
                                        styles.speakButton,
                                        { backgroundColor: theme.colors.primary + '20' },
                                        pressed && styles.speakButtonPressed,
                                      ]}
                                    >
                                      {isSpeaking ? (
                                        <VolumeX size={18} color={theme.colors.primary} />
                                      ) : (
                                        <Volume2 size={18} color={theme.colors.primary} />
                                      )}
                                    </Pressable>
                                  )}
                                </View>
                                {verseData.arabic && (
                                  <Text style={[styles.verseArabic, { color: theme.colors.text }]}>
                                    {verseData.arabic}
                                  </Text>
                                )}
                                {verseData.transliteration && (
                                  <Text style={[styles.verseTransliteration, { color: theme.colors.textSecondary }]}>
                                    {verseData.transliteration}
                                  </Text>
                                )}
                                {verseData.translation && (
                                  <Text style={[styles.verseTranslation, { color: theme.colors.textSecondary }]}>
                                    {verseData.translation}
                                  </Text>
                                )}
                                {verseData.note && (
                                  <Text style={[styles.verseNote, { color: theme.colors.textSecondary }]}>
                                    {verseData.note}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        }
                        return null;
                      })}

                      {/* Intention de fin */}
                      <View style={[styles.intentionContainer, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.intentionLabel, { color: theme.colors.primary }]}>
                          {t('nurshifa.nurQuran.intentionEnd') || 'Intention de fin'}
                        </Text>
                        <Text style={[styles.intentionText, { color: theme.colors.text }]}>
                          {t(`nurshifa.nurQuran.categories.${category}.intentionEnd`)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </Card>

          {/* Section Nûr al-'Āfiyah */}
          <Card style={[styles.sectionCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <Leaf size={28} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('nurshifa.nurAfiyah.title')}
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]} numberOfLines={0}>
              {t('nurshifa.nurAfiyah.description')}
            </Text>

            {/* Catégories de remèdes */}
            {afiyahCategories.map((category) => {
              const categoryKey = `nurshifa.nurAfiyah.categories.${category}`;
              const isExpanded = expandedRemedy === category;
              return (
                <View key={category} style={styles.categoryContainer}>
                  <Pressable
                    onPress={() => {
                      const newExpanded = isExpanded ? null : category;
                      setExpandedRemedy(newExpanded);
                      if (newExpanded) {
                        trackEvent('nurshifa_remedy_category_expanded', {
                          category: newExpanded,
                        });
                      }
                    }}
                    style={({ pressed }) => [
                      styles.categoryHeader,
                      { backgroundColor: theme.colors.background },
                      pressed && styles.categoryHeaderPressed,
                    ]}
                  >
                    <View style={styles.categoryHeaderLeft}>
                      <Text style={[styles.categoryEmoji]}>
                        {t(`${categoryKey}.emoji`)}
                      </Text>
                      <View style={styles.categoryTitleContainer}>
                        <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                          {t(`${categoryKey}.title`)}
                        </Text>
                        <Text style={[styles.categorySubtitle, { color: theme.colors.textSecondary }]}>
                          {t(`${categoryKey}.subtitle`)}
                        </Text>
                      </View>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color={theme.colors.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={theme.colors.textSecondary} />
                    )}
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.categoryContent}>
                      {Array.from({ length: 5 }, (_, i) => i + 1).map((remedyNum) => {
                        const remedyKey = `${categoryKey}.remedies.${remedyNum}`;
                        const remedyName = t(`${remedyKey}.name`);
                        if (!remedyName || remedyName === `${remedyKey}.name`) {
                          return null;
                        }
                        return (
                          <View
                            key={remedyNum}
                            style={[styles.remedyItem, { backgroundColor: theme.colors.background }]}
                          >
                            <Text style={[styles.remedyNumber, { color: theme.colors.primary }]}>
                              {remedyNum}️⃣
                            </Text>
                            <View style={styles.remedyContent}>
                              <Text style={[styles.remedyTitle, { color: theme.colors.text }]}>
                                {remedyName}
                              </Text>
                              <View style={styles.remedyInfoRow}>
                                <Text style={[styles.remedyLabel, { color: theme.colors.text }]}>
                                  {t('nurshifa.nurAfiyah.reference')}:
                                </Text>
                                <Text style={[styles.remedyValue, { color: theme.colors.textSecondary }]} numberOfLines={0}>
                                  {t(`${remedyKey}.reference`)}
                                </Text>
                              </View>
                              <View style={styles.remedyInfoRow}>
                                <Text style={[styles.remedyLabel, { color: theme.colors.text }]}>
                                  {t('nurshifa.nurAfiyah.benefits')}:
                                </Text>
                                <Text style={[styles.remedyValue, { color: theme.colors.textSecondary }]} numberOfLines={0}>
                                  {t(`${remedyKey}.benefits`)}
                                </Text>
                              </View>
                              <View style={styles.remedyInfoRow}>
                                <Text style={[styles.remedyLabel, { color: theme.colors.text }]}>
                                  {t('nurshifa.nurAfiyah.usage')}:
                                </Text>
                                <Text style={[styles.remedyValue, { color: theme.colors.textSecondary }]} numberOfLines={0}>
                                  {t(`${remedyKey}.usage`)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Rappel général */}
            <View style={[styles.reminderCard, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.reminderIcon]}>💡</Text>
              <Text style={[styles.reminderText, { color: theme.colors.text }]}>
                {t('nurshifa.nurAfiyah.reminder')}
              </Text>
            </View>
          </Card>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  versesList: {
    gap: 12,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryHeaderPressed: {
    opacity: 0.8,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  categoryContent: {
    gap: 12,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  intentionContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(106, 79, 182, 0.5)',
  },
  intentionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  intentionText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  verseItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  verseNumber: {
    fontSize: 20,
  },
  verseContent: {
    flex: 1,
    gap: 8,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  verseTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  speakButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  speakButtonPressed: {
    opacity: 0.7,
  },
  verseArabic: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'right',
    marginTop: 8,
    fontFamily: 'System',
  },
  verseTransliteration: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 4,
  },
  verseTranslation: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  verseNote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    fontStyle: 'italic',
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  remedyItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  remedyNumber: {
    fontSize: 20,
  },
  remedyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  remedyContent: {
    flex: 1,
    gap: 12,
    minWidth: 0, // Permet au flex de fonctionner correctement
  },
  remedyInfoRow: {
    gap: 8,
    flexWrap: 'wrap',
  },
  remedyLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    flexShrink: 0,
  },
  remedyValue: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    flexShrink: 1,
  },
  reminderCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  reminderIcon: {
    fontSize: 20,
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});


