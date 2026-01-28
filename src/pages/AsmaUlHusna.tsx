import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Share } from 'react-native';
import { useDimensions } from '@/hooks/useDimensions';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ArrowLeft, ArrowRight, Sparkles, Circle, Share2 } from 'lucide-react-native';
import { asmaUlHusna, AsmaName } from '@/data/asmaData';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import { speak, stopSpeaking, isSpeaking } from '@/services/system/speech';
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
  const [showIntroductionPage, setShowIntroductionPage] = useState(true);

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

  // Page de présentation complète (avant le module)
  if (showIntroductionPage) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.backgroundSecondary]}
          style={StyleSheet.absoluteFill}
        />
        <GalaxyBackground starCount={80} minSize={1} maxSize={2} />
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}>
            {/* Header avec bouton retour */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Pressable onPress={() => navigation.goBack()} style={{ padding: 8 }}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </Pressable>
              <View style={{ flex: 1 }} />
            </View>

            {/* Icône centrale */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#FFD369' + '20',
                borderWidth: 2,
                borderColor: '#FFD369' + '40',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Sparkles size={40} color="#FFD369" />
              </View>
              
              <Text style={{
                fontSize: 28,
                fontWeight: '700',
                color: '#FFD369',
                textAlign: 'center',
                marginBottom: 4,
              }}>
                ✨ Asmāʾ ul-Ḥusnā
              </Text>
              <Text style={{
                fontSize: 18,
                fontWeight: '500',
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}>
                Les 99 noms d'Allah
              </Text>
            </View>

            {/* Contenu de présentation - Le verset */}
            <View
              style={{
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 20,
                padding: 24,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Verset en arabe */}
              <Text style={{
                fontSize: 24,
                lineHeight: 42,
                color: theme.colors.text,
                textAlign: 'center',
                marginBottom: 24,
                fontFamily: 'System',
              }}>
                وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا ۖ وَذَرُوا الَّذِينَ يُلْحِدُونَ فِي أَسْمَائِهِ ۚ سَيُجْزَوْنَ مَا كَانُوا يَعْمَلُونَ
              </Text>

              {/* Traduction */}
              <View style={{
                backgroundColor: '#FFD369' + '15',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: '#FFD369' + '30',
                marginBottom: 24,
              }}>
                <Text style={{
                  fontSize: 16,
                  lineHeight: 26,
                  color: theme.colors.text,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}>
                  "À Allah appartiennent les plus beaux noms. Invoquez-Le donc par eux, et laissez ceux qui détournent de Ses noms ; ils seront rétribués pour ce qu'ils faisaient."
                </Text>
              </View>

              {/* Référence */}
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 14,
                  color: '#FFD369',
                  fontWeight: '600',
                  marginBottom: 4,
                }}>
                  📖 Sourate Al-A'raf
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: theme.colors.textSecondary,
                }}>
                  Chapitre 7 • Verset 180
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bouton Continuer fixé en bas */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: 24,
          paddingTop: 16,
          backgroundColor: theme.colors.background + 'F0',
        }}>
          <Pressable
            onPress={() => {
              setShowIntroductionPage(false);
            }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <LinearGradient
              colors={['#FFD369', '#FFD369DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#1A1A2E',
              }}>
                Découvrir les Noms
              </Text>
              <ArrowRight size={20} color="#1A1A2E" />
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedName(null)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={(e) => e.stopPropagation()}
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

                {/* Description + Invocation */}
                <ScrollView style={styles.modalDescription} showsVerticalScrollIndicator={false}>
                  {selectedName.description.split('\n\n').map((paragraph, index) => (
                    <Text
                      key={index}
                      style={[styles.descriptionText, { color: theme.colors.textSecondary }]}
                    >
                      {paragraph}
                    </Text>
                  ))}
                  
                  {/* Section Invocation */}
                  {selectedName.invocation && (
                    <View style={styles.invocationSection}>
                      <View style={[styles.invocationDivider, { backgroundColor: theme.colors.accent }]} />
                      {selectedName.invocation.split('\n\n').map((paragraph, index) => (
                        <Text
                          key={`inv-${index}`}
                          style={[
                            styles.invocationText,
                            { color: theme.colors.text },
                            index === 0 && styles.invocationTitle
                          ]}
                        >
                          {paragraph}
                        </Text>
                      ))}
                    </View>
                  )}
                </ScrollView>

                {/* Boutons d'action */}
                <View style={[styles.actionButtonsDivider, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
                
                <View style={styles.actionButtonsContainer}>
                  {/* Bouton Bayt an Nur (Khalwa) */}
                  <Pressable
                    onPress={() => {
                      trackEvent('asma_to_khalwa', { nameNumber: selectedName.number, name: selectedName.transliteration });
                      setSelectedName(null);
                      // Convertir "Al-X" en "Ya X" pour l'invocation dans Khalwa
                      const invocationForm = selectedName.transliteration.replace(/^(Al-|Ar-|Az-|As-)/i, 'Ya ');
                      const finalName = invocationForm === selectedName.transliteration && !selectedName.transliteration.startsWith('Ya ') 
                        ? `Ya ${selectedName.transliteration}` 
                        : invocationForm;
                      (navigation as any).navigate('BaytAnNur', {
                        divineNameId: selectedName.transliteration.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                        khalwaName: finalName,
                        khalwaArabic: selectedName.arabic,
                        khalwaMeaning: selectedName.meaning,
                        fromAsma: true,
                      });
                    }}
                    style={({ pressed }) => [
                      styles.actionButton,
                      { backgroundColor: theme.colors.accent },
                      pressed && styles.actionButtonPressed
                    ]}
                  >
                    <Sparkles size={18} color={theme.colors.background} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.background }]}>
                      {t('asma.toKhalwa')}
                    </Text>
                  </Pressable>

                  {/* Bouton Dhikr Privé */}
                  <Pressable
                    onPress={() => {
                      trackEvent('asma_to_dhikr', { nameNumber: selectedName.number, name: selectedName.transliteration });
                      setSelectedName(null);
                      // Formater le nom en JSON avec toutes les infos pour créer une session privée
                      const dhikrText = JSON.stringify({
                        arabic: selectedName.arabic,
                        transliteration: selectedName.transliteration,
                        translation: selectedName.meaning,
                      });
                      (navigation as any).navigate('DairatAnNur', {
                        createPrivateSession: true, // Créer une session privée (ma session)
                        dhikrText: dhikrText,
                        targetCount: 99,
                      });
                    }}
                    style={({ pressed }) => [
                      styles.actionButton,
                      { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: theme.colors.accent },
                      pressed && styles.actionButtonPressed
                    ]}
                  >
                    <Circle size={18} color={theme.colors.accent} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                      {t('asma.toDhikr')}
                    </Text>
                  </Pressable>

                  {/* Bouton Partager */}
                  <Pressable
                    onPress={async () => {
                      trackEvent('asma_share', { nameNumber: selectedName.number, name: selectedName.transliteration });
                      try {
                        // Format enrichi et complet du partage
                        const shareMessage = `✨ ${selectedName.arabic} ✨

📿 ${selectedName.transliteration}
${selectedName.meaning}

━━━━━━━━━━━━━━━━━━━━

${selectedName.description}

━━━━━━━━━━━━━━━━━━━━

${selectedName.invocation || ''}

━━━━━━━━━━━━━━━━━━━━

🌙 ${selectedName.number}/99 Noms d'Allah

— Partagé avec amour depuis Ayna 💫
L'application de spiritualité musulmane`;

                        await Share.share({
                          message: shareMessage,
                          title: `${selectedName.transliteration} - ${selectedName.meaning}`,
                        });
                      } catch (error) {
                        // Erreur silencieuse
                      }
                    }}
                    style={({ pressed }) => [
                      styles.actionButton,
                      { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
                      pressed && styles.actionButtonPressed
                    ]}
                  >
                    <Share2 size={18} color={theme.colors.textSecondary} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
                      {t('asma.share')}
                    </Text>
                  </Pressable>
                </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 10,
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
  invocationSection: {
    marginTop: 8,
    paddingTop: 16,
  },
  invocationDivider: {
    height: 2,
    borderRadius: 1,
    marginBottom: 16,
    opacity: 0.6,
  },
  invocationText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'System',
    marginBottom: 12,
  },
  invocationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonsDivider: {
    height: 1,
    marginTop: 16,
    marginBottom: 16,
  },
  actionButtonsContainer: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

