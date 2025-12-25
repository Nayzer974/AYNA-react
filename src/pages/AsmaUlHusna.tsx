import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDimensions } from '@/hooks/useDimensions';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ArrowLeft } from 'lucide-react-native';
import { asmaUlHusna, AsmaName } from '@/data/asmaData';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics';
import { speak, stopSpeaking, isSpeaking } from '@/services/speech';
import { Volume2 } from 'lucide-react-native';
import { useEffect } from 'react';


/**
 * Page Asma ul Husna - Les 99 noms d'Allah
 */
export function AsmaUlHusna() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const { width: SCREEN_WIDTH } = useDimensions();
  const CARD_WIDTH = React.useMemo(() => (SCREEN_WIDTH - 48) / 2, [SCREEN_WIDTH]); // 2 colonnes avec padding
  const [selectedName, setSelectedName] = useState<AsmaName | null>(null);
  const [readingName, setReadingName] = useState<number | null>(null);

  useEffect(() => {
    trackPageView('AsmaUlHusna');
  }, []);

  const handleReadName = async (name: AsmaName) => {
    if (isSpeaking() && readingName === name.number) {
      stopSpeaking();
      setReadingName(null);
      return;
    }
    
    try {
      setReadingName(name.number);
      const textToRead = `${name.arabic}\n${name.transliteration}\n${name.meaning}`;
      await speak(textToRead, 'ar');
      trackEvent('asma_name_read', { nameNumber: name.number, name: name.transliteration });
    } catch (error) {
      // Erreur silencieuse en production
      setReadingName(null);
    }
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
      
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('asma.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('asma.subtitle')}
            </Text>
          </View>

          {/* Grid of names */}
          <View style={styles.grid}>
            {asmaUlHusna.map((name, index) => (
              <Pressable
                key={name.number}
                onPress={() => {
                  setSelectedName(name);
                  trackEvent('asma_name_opened', { nameNumber: name.number });
                }}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: theme.colors.backgroundSecondary,
                    opacity: pressed ? 0.9 : 0.8,
                    width: CARD_WIDTH,
                  },
                ]}
              >
                <View style={styles.cardContent}>
                  <Text style={[styles.cardNumber, { color: theme.colors.accent }]}>
                    {name.number}
                  </Text>
                  <Text style={[styles.cardArabic, { color: theme.colors.text }]}>
                    {name.arabic}
                  </Text>
                  <Text style={[styles.cardTransliteration, { color: theme.colors.accent }]}>
                    {name.transliteration}
                  </Text>
                  <Text style={[styles.cardMeaning, { color: theme.colors.textSecondary }]}>
                    {name.meaning}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal for detailed view */}
      <Modal
        visible={selectedName !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedName(null)}
        statusBarTranslucent={true}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedName(null)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
          >
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border || 'rgba(255, 255, 255, 0.1)',
                },
              ]}
            >
            {selectedName && (
              <>
                {/* Close button */}
                <Pressable
                  style={[styles.closeButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                  onPress={() => setSelectedName(null)}
                >
                  <X size={24} color={theme.colors.text} />
                </Pressable>

                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalNumber, { color: theme.colors.accent }]}>
                    {selectedName.number}
                  </Text>
                  <Text style={[styles.modalArabic, { color: theme.colors.text }]}>
                    {selectedName.arabic}
                  </Text>
                  <Text style={[styles.modalTransliteration, { color: theme.colors.accent }]}>
                    {selectedName.transliteration}
                  </Text>
                  <Text style={[styles.modalMeaning, { color: theme.colors.text }]}>
                    {selectedName.meaning}
                  </Text>
                  
                  {/* TTS Button */}
                  <Pressable
                    onPress={() => handleReadName(selectedName)}
                    style={({ pressed }) => [
                      styles.readButton,
                      { 
                        backgroundColor: readingName === selectedName.number ? theme.colors.accent : 'rgba(255, 255, 255, 0.1)' 
                      },
                      pressed && styles.readButtonPressed
                    ]}
                  >
                    <Volume2 size={18} color={readingName === selectedName.number ? theme.colors.background : theme.colors.text} />
                    <Text style={[
                      styles.readButtonText,
                      { color: readingName === selectedName.number ? theme.colors.background : theme.colors.text }
                    ]}>
                      {readingName === selectedName.number ? t('asma.stopReading') : t('asma.pronounce')}
                    </Text>
                  </Pressable>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />

                {/* Description */}
                <ScrollView style={styles.modalDescription} showsVerticalScrollIndicator={false}>
                  {selectedName.description.split('\n\n').map((paragraph, index) => (
                    <Text
                      key={index}
                      style={[styles.descriptionText, { color: theme.colors.textSecondary }]}
                    >
                      {paragraph}
                    </Text>
                  ))}
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  scrollContent: {
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'System',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardNumber: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  cardArabic: {
    fontSize: 24,
    fontFamily: 'System',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardTransliteration: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  cardMeaning: {
    fontSize: 12,
    fontFamily: 'System',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  readButtonPressed: {
    opacity: 0.7,
  },
  readButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  modalNumber: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 16,
  },
  modalArabic: {
    fontSize: 48,
    fontFamily: 'System',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalTransliteration: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  modalMeaning: {
    fontSize: 18,
    fontFamily: 'System',
  },
  divider: {
    height: 1,
    marginBottom: 24,
  },
  modalDescription: {
    maxHeight: 400,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    marginBottom: 16,
    textAlign: 'justify',
  },
});

