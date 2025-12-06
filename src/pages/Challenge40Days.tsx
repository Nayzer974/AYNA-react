import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme, themes } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Sparkles, LogOut, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { Challenge, getChallengeById } from '@/data/challenges';
import { DayScreen } from '@/components/challenge/DayScreen';
import { OnboardingScreen } from '@/components/challenge/OnboardingScreen';
import { PortalScreen } from '@/components/challenge/PortalScreen';
import { ReturnScreen } from '@/components/challenge/ReturnScreen';
import { HistoryScreen } from '@/components/challenge/HistoryScreen';
import { NiyyaScreen } from '@/components/challenge/NiyyaScreen';
import { deleteChallengeData } from '@/services/challengeStorage';
import { sendToAyna } from '@/services/ayna';
import { RequireAuth } from '@/components/RequireAuth';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolateColor, Easing } from 'react-native-reanimated';

type Phase = '3' | '6' | '9' | 'portal' | 'return';
type Screen = 'onboarding' | 'day' | 'portal' | 'return' | 'history' | 'niyya';

export function Challenge40Days() {
  const navigation = useNavigation();
  const { user, updateChallenge, isAuthenticated, updateUser } = useUser();
  const theme = getTheme(user?.theme || 'default');
  
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [currentDay, setCurrentDay] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [intention, setIntention] = useState<string>('');
  const [showQuitModal, setShowQuitModal] = useState(false);

  // Animation pour le changement de thème
  const themeAnimationProgress = useSharedValue(0);
  const previousThemeIdRef = useRef(user?.theme || 'default');
  const currentThemeId = user?.theme || 'default';

  useEffect(() => {
    // Démarrer l'animation quand le thème change
    if (previousThemeIdRef.current !== currentThemeId) {
      themeAnimationProgress.value = 0;
      themeAnimationProgress.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      previousThemeIdRef.current = currentThemeId;
    }
  }, [currentThemeId]);

  // Styles animés pour la transition de couleur
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const oldTheme = themes[previousThemeIdRef.current] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    
    return {
      backgroundColor: interpolateColor(
        themeAnimationProgress.value,
        [0, 1],
        [oldTheme.colors.background, newTheme.colors.background]
      ),
    };
  });

  const animatedBackgroundSecondaryStyle = useAnimatedStyle(() => {
    const oldTheme = themes[previousThemeIdRef.current] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    
    return {
      backgroundColor: interpolateColor(
        themeAnimationProgress.value,
        [0, 1],
        [oldTheme.colors.backgroundSecondary, newTheme.colors.backgroundSecondary]
      ),
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const oldTheme = themes[previousThemeIdRef.current] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    
    return {
      color: interpolateColor(
        themeAnimationProgress.value,
        [0, 1],
        [oldTheme.colors.text, newTheme.colors.text]
      ),
    };
  });

  // Rediriger si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Login' as never);
    }
  }, [isAuthenticated, navigation]);

  // Charger automatiquement le défi sauvegardé au démarrage
  useEffect(() => {
    if (user?.challenge40Days?.selectedChallengeId && user?.challenge40Days?.startDate) {
      const savedChallenge = getChallengeById(user.challenge40Days.selectedChallengeId);
      if (savedChallenge) {
        setSelectedChallenge(savedChallenge);
        setHasStarted(true);
        setCurrentDay(user.challenge40Days.currentDay || 1);
        setCurrentScreen('day');
        setIntention(user.challenge40Days.intention || '');
      }
    }
  }, [user?.challenge40Days?.selectedChallengeId]);

  const getPhase = (day: number): Phase => {
    if (day === 13 || day === 26) return 'portal';
    if (day === 40) return 'return';
    if (day <= 13) return '3';
    if (day <= 26) return '6';
    if (day <= 39) return '9';
    return 'return';
  };

  const handleStartChallenge = (challenge: Challenge) => {
    if (!isAuthenticated || !user?.id) {
      navigation.navigate('Login' as never);
      return;
    }

    // Vérifier si un défi est déjà en cours
    if (user.challenge40Days?.selectedChallengeId && user.challenge40Days?.startDate) {
      return;
    }

    setSelectedChallenge(challenge);
    setHasStarted(true);
    setCurrentDay(1);
    setCurrentScreen('day');

    // Sauvegarder le challenge sélectionné
    updateChallenge(1, {
      startDate: new Date().toISOString(),
      journalEntries: [],
      dhikrCounts: [],
      selectedChallengeId: challenge.id,
      intention: intention
    });
  };

  const handleNextDay = () => {
    const next = currentDay + 1;

    // Si on vient de clôturer un jour portail (13 ou 26), afficher l'écran portail
    if (currentDay === 13 || currentDay === 26) {
      setCurrentScreen('portal');
    } else if (currentDay === 40) {
      setCurrentScreen('return');
    } else {
      // Vérifier si le prochain jour est un portail
      if (next === 13 || next === 26) {
        setCurrentDay(next);
        setCurrentScreen('portal');
      } else if (next === 40) {
        setCurrentDay(next);
        setCurrentScreen('return');
      } else {
        setCurrentDay(next);
      }
    }

    // Sauvegarder le jour actuel
    try {
      const dayToUpdate = currentDay === 13 || currentDay === 26 ? currentDay : next;
      updateChallenge(dayToUpdate, {
        ...user?.challenge40Days,
        currentDay: dayToUpdate,
        selectedChallengeId: selectedChallenge?.id || user?.challenge40Days?.selectedChallengeId,
        intention: intention || user?.challenge40Days?.intention
      });
      sendToAyna([
        { role: 'system', content: 'Mise à jour du défi 40 jours' },
        { role: 'user', content: `${user?.name || user?.email} a avancé au jour ${dayToUpdate}` }
      ]).catch(() => null);
    } catch (e) {
      // ignore
    }
  };

  const handleRestart = () => {
    setCurrentDay(1);
    setCurrentScreen('onboarding');
    setHasStarted(false);
  };

  const handleSaveIntention = (newIntention: string) => {
    if (!isAuthenticated || !user?.id) {
      navigation.navigate('Login' as never);
      return;
    }
    setIntention(newIntention);
    setCurrentScreen('day');
    if (user.challenge40Days) {
      updateChallenge(user.challenge40Days.currentDay || currentDay, {
        ...user.challenge40Days,
        intention: newIntention
      });
    }
  };

  const handleQuitChallenge = async () => {
    if (!user?.id || !isAuthenticated) {
      return;
    }

    try {
      await deleteChallengeData(user.id);
      setSelectedChallenge(null);
      setHasStarted(false);
      setCurrentDay(1);
      setCurrentScreen('onboarding');
      setIntention('');
      updateUser({
        challenge40Days: undefined
      });
      setShowQuitModal(false);
    } catch (error) {
      console.error('Erreur lors de la suppression du défi:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression du défi. Veuillez réessayer.');
    }
  };

  if (!isAuthenticated) {
    return null; // RequireAuth gère la redirection
  }

  return (
    <RequireAuth>
      <Animated.View style={[styles.wrapper, animatedBackgroundStyle]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            animatedBackgroundSecondaryStyle,
            { opacity: 0.5 }
          ]}
        />
        <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
        
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* Header */}
          {hasStarted && currentScreen !== 'onboarding' && (
            <View style={styles.header}>
              {currentScreen !== 'day' && (
                <Pressable
                  onPress={() => setCurrentScreen('day')}
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.buttonPressed
                  ]}
                >
                  <Animated.View style={animatedTextStyle}>
                    <ArrowLeft size={24} />
                  </Animated.View>
                  <Animated.Text style={[styles.backText, animatedTextStyle]}>
                    Retour
                  </Animated.Text>
                </Pressable>
              )}
              <View style={styles.headerRight}>
                <Pressable
                  onPress={() => setShowQuitModal(true)}
                  style={({ pressed }) => [
                    styles.quitButton,
                    { backgroundColor: 'rgba(255, 107, 107, 0.2)', borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.3)' },
                    pressed && styles.buttonPressed
                  ]}
                >
                  <LogOut size={20} color="#ff6b6b" />
                  <Text style={styles.quitButtonText}>Quitter le défi</Text>
                </Pressable>
                {false && ( // Niyya button hidden for now
                  <Pressable
                    onPress={() => setCurrentScreen('niyya')}
                    style={({ pressed }) => [
                      styles.headerButton,
                      { backgroundColor: theme.colors.backgroundSecondary },
                      pressed && styles.buttonPressed
                    ]}
                  >
                    <Sparkles size={20} color={theme.colors.accent} />
                    <Text style={[styles.headerButtonText, { color: theme.colors.text }]}>
                      {intention ? 'Modifier Niyya' : 'Votre Niyya'}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => setCurrentScreen('history')}
                  style={({ pressed }) => [
                    styles.headerButton,
                    { backgroundColor: theme.colors.backgroundSecondary },
                    pressed && styles.buttonPressed
                  ]}
                >
                  <Calendar size={20} color={theme.colors.accent} />
                  <Text style={[styles.headerButtonText, { color: theme.colors.text }]}>
                    Historique
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Content */}
            {currentScreen === 'onboarding' && !hasStarted && !(user?.challenge40Days?.selectedChallengeId && user?.challenge40Days?.startDate) && (
              <OnboardingScreen
                onStart={handleStartChallenge}
                hasActiveChallenge={!!(user?.challenge40Days?.selectedChallengeId && user?.challenge40Days?.startDate)}
              />
            )}

            {currentScreen === 'day' && selectedChallenge && (
              <DayScreen
                day={currentDay}
                phase={getPhase(currentDay)}
                onNextDay={handleNextDay}
                challenge={selectedChallenge}
              />
            )}

            {currentScreen === 'portal' && (
              <PortalScreen
                day={currentDay}
                onContinue={() => {
                  const nextDay = currentDay === 13 ? 14 : 27;
                  setCurrentDay(nextDay);
                  setCurrentScreen('day');
                }}
              />
            )}

            {currentScreen === 'return' && (
              <ReturnScreen onRestart={handleRestart} />
            )}

            {currentScreen === 'niyya' && (
              <NiyyaScreen
                onSave={handleSaveIntention}
                onClose={() => setCurrentScreen('day')}
                initialIntention={intention}
              />
            )}
            {currentScreen === 'history' && (
              <HistoryScreen currentDay={currentDay} />
            )}
          </ScrollView>

          {/* Modal de confirmation pour quitter le défi */}
          <Modal
            visible={showQuitModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowQuitModal(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowQuitModal(false)}
            >
              <Pressable
                style={[styles.modalContent, { backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <AlertTriangle size={32} color="#ff6b6b" />
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    Quitter le défi
                  </Text>
                </View>

                <View style={[styles.warningBox, { backgroundColor: '#ff6b6b33', borderColor: '#ff6b6b4d' }]}>
                  <Text style={[styles.warningText, { color: theme.colors.text }]}>
                    <Text style={{ color: '#ff6b6b', fontWeight: '600' }}>Attention !</Text> Si vous quittez ce défi, toutes vos données de progression seront définitivement supprimées :
                  </Text>
                  <View style={styles.warningList}>
                    <Text style={[styles.warningItem, { color: theme.colors.textSecondary }]}>
                      • Votre progression (jour actuel)
                    </Text>
                    <Text style={[styles.warningItem, { color: theme.colors.textSecondary }]}>
                      • Toutes vos entrées de journal
                    </Text>
                    <Text style={[styles.warningItem, { color: theme.colors.textSecondary }]}>
                      • Tous vos compteurs de dhikr
                    </Text>
                    <Text style={[styles.warningItem, { color: theme.colors.textSecondary }]}>
                      • Votre intention (niyya)
                    </Text>
                    <Text style={[styles.warningItem, { color: theme.colors.textSecondary }]}>
                      • Votre historique et badges
                    </Text>
                  </View>
                  <Text style={[styles.warningText, { color: theme.colors.text }]}>
                    Cette action est <Text style={{ fontWeight: '600' }}>irréversible</Text>. Êtes-vous sûr de vouloir continuer ?
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    onPress={() => setShowQuitModal(false)}
                    style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.background }]}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                      Annuler
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleQuitChallenge}
                    style={[styles.modalButton, styles.confirmButton, { backgroundColor: '#ff6b6b' }]}
                  >
                    <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                      Oui, quitter le défi
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </SafeAreaView>
      </Animated.View>
    </RequireAuth>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quitButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  headerButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
  },
  warningBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'System',
    lineHeight: 20,
    marginBottom: 12,
  },
  warningList: {
    marginLeft: 16,
    marginBottom: 12,
  },
  warningItem: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

