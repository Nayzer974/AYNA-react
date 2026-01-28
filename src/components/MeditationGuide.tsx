import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { Volume2, VolumeX } from 'lucide-react-native';
import { speak, stopSpeaking, isSpeaking } from '@/services/system/speech';
import { getSessionSteps, getVisualizationForAmbiance, MeditationStep, getYaAllahKhalwaSteps } from '@/data/meditationTexts';
import { useTranslation } from 'react-i18next';

interface MeditationGuideProps {
  duration: 5 | 10 | 15;
  ambianceId: string;
  timeRemaining: number;
  totalDuration: number;
  isGuided: boolean;
  isPaused: boolean;
  textColor: string;
  accentColor: string;
  cardBackground: string;
  cardBorderColor: string;
  isYaAllahKhalwa?: boolean; // Flag pour utiliser le format spécial Ya Allah
}

export function MeditationGuide({
  duration,
  ambianceId,
  timeRemaining,
  totalDuration,
  isGuided,
  isPaused,
  textColor,
  accentColor,
  cardBackground,
  cardBorderColor,
  isYaAllahKhalwa = false,
}: MeditationGuideProps) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language?.substring(0, 2) || 'fr') as 'fr' | 'en' | 'ar';
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isSpeakingActive, setIsSpeakingActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(isGuided);
  
  const stepsRef = useRef<MeditationStep[]>([]);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Initialiser les steps
  useEffect(() => {
    if (isYaAllahKhalwa) {
      // Utiliser le format spécial pour le khalwa Ya Allah de Sabilat Nûr
      stepsRef.current = getYaAllahKhalwaSteps(currentLang);
    } else {
      const vizId = getVisualizationForAmbiance(ambianceId);
      stepsRef.current = getSessionSteps(duration, vizId, currentLang);
    }
    if (stepsRef.current.length > 0) {
      setCurrentText(stepsRef.current[0].text);
    }
  }, [duration, ambianceId, currentLang, isYaAllahKhalwa]);
  
  // Calculer quel step afficher basé sur le temps écoulé
  useEffect(() => {
    if (stepsRef.current.length === 0) return;
    
    const timeElapsed = totalDuration - timeRemaining;
    let accumulatedTime = 0;
    let targetIndex = 0;
    
    for (let i = 0; i < stepsRef.current.length; i++) {
      accumulatedTime += stepsRef.current[i].duration;
      if (timeElapsed < accumulatedTime) {
        targetIndex = i;
        break;
      }
      if (i === stepsRef.current.length - 1) {
        targetIndex = i;
      }
    }
    
    if (targetIndex !== currentStepIndex) {
      setCurrentStepIndex(targetIndex);
      const step = stepsRef.current[targetIndex];
      setCurrentText(step.text);
      
      // Lire le texte si le mode voix est activé et pas en pause
      if (voiceEnabled && !isPaused && step.text && !step.isSilence) {
        // Petit délai pour éviter les coupures
        speakTimeoutRef.current = setTimeout(() => {
          speakText(step.text);
        }, 500);
      }
    }
  }, [timeRemaining, totalDuration, currentStepIndex, voiceEnabled, isPaused]);
  
  // Arrêter la lecture si en pause
  useEffect(() => {
    if (isPaused) {
      stopSpeaking();
      setIsSpeakingActive(false);
    }
  }, [isPaused]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
    };
  }, []);
  
  const speakText = useCallback(async (text: string) => {
    try {
      setIsSpeakingActive(true);
      await speak(text, currentLang);
      setIsSpeakingActive(false);
    } catch (error) {
      setIsSpeakingActive(false);
    }
  }, [currentLang]);
  
  const toggleVoice = useCallback(() => {
    if (voiceEnabled) {
      stopSpeaking();
      setIsSpeakingActive(false);
    } else if (currentText && !isPaused) {
      speakText(currentText);
    }
    setVoiceEnabled(!voiceEnabled);
  }, [voiceEnabled, currentText, isPaused, speakText]);
  
  // Si pas de texte ou silence, ne rien afficher
  if (!currentText && !stepsRef.current[currentStepIndex]?.isSilence) {
    return null;
  }
  
  const currentStep = stepsRef.current[currentStepIndex];
  
  return (
    <View style={styles.container}>
      {/* Bouton pour activer/désactiver la voix */}
      <Pressable
        onPress={toggleVoice}
        style={[
          styles.voiceToggle,
          { 
            backgroundColor: voiceEnabled ? accentColor + '30' : cardBackground,
            borderColor: voiceEnabled ? accentColor : cardBorderColor,
          },
        ]}
      >
        {voiceEnabled ? (
          <Volume2 size={20} color={accentColor} />
        ) : (
          <VolumeX size={20} color={textColor} />
        )}
      </Pressable>

      {/* Titre spécial pour le khalwa Ya Allah */}
      {isYaAllahKhalwa && currentStepIndex === 0 && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.yaAllahHeaderContainer}
        >
          <Text style={[styles.yaAllahDuration, { color: textColor }]}>
            Durée totale : 5 minutes
          </Text>
          <Text style={[styles.yaAllahSubtitle, { color: accentColor }]}>
            Présence • Invocation • Cœur
          </Text>
        </Animated.View>
      )}
      
      {/* Titre du step */}
      {currentStep && !currentStep.isSilence && (
        <Animated.View
          key={`title-${currentStepIndex}`}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.stepTitleContainer}
        >
          <Text style={[styles.stepTitle, { color: accentColor }]}>
            {currentStep.title}
          </Text>
          {/* Afficher le timestamp pour le khalwa Ya Allah */}
          {isYaAllahKhalwa && currentStep && (
            <Text style={[styles.timestamp, { color: textColor }]}>
              {(() => {
                let accumulatedTime = 0;
                for (let i = 0; i < stepsRef.current.length; i++) {
                  if (i === currentStepIndex) {
                    const startMinutes = Math.floor(accumulatedTime / 60);
                    const startSeconds = accumulatedTime % 60;
                    const endTime = accumulatedTime + stepsRef.current[i].duration;
                    const endMinutes = Math.floor(endTime / 60);
                    const endSeconds = endTime % 60;
                    return `⏱️ ${String(startMinutes).padStart(2, '0')}:${String(startSeconds).padStart(2, '0')} – ${String(endMinutes).padStart(2, '0')}:${String(endSeconds).padStart(2, '0')}`;
                  }
                  accumulatedTime += stepsRef.current[i].duration;
                }
                return '';
              })()}
            </Text>
          )}
        </Animated.View>
      )}
      
      {/* Texte de méditation */}
      {currentStep?.isSilence ? (
        <Animated.View
          key={`silence-${currentStepIndex}`}
          entering={FadeIn.duration(500)}
          style={[styles.silenceContainer, { backgroundColor: cardBackground, borderColor: cardBorderColor }]}
        >
          <Text style={[styles.silenceText, { color: textColor }]}>
            ✨
          </Text>
          <Text style={[styles.silenceLabel, { color: textColor }]}>
            Silence habité
          </Text>
        </Animated.View>
      ) : (
        <Animated.View
          key={`text-${currentStepIndex}`}
          entering={SlideInUp.duration(400).springify()}
          exiting={FadeOut.duration(200)}
          style={[styles.textCard, { backgroundColor: cardBackground, borderColor: cardBorderColor }]}
        >
          <Text style={[styles.meditationText, { color: textColor }]}>
            {currentText}
          </Text>
        </Animated.View>
      )}
      
      {/* Indicateur de lecture vocale */}
      {isSpeakingActive && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.speakingIndicator, { backgroundColor: accentColor + '20' }]}
        >
          <Volume2 size={14} color={accentColor} />
          <Text style={[styles.speakingText, { color: accentColor }]}>
            Lecture en cours...
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 16,
    minHeight: 200,
  },
  voiceToggle: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  yaAllahHeaderContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 60,
  },
  yaAllahDuration: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  yaAllahSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 1,
  },
  stepTitleContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.7,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  textCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxHeight: '60%',
  },
  meditationText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '400',
  },
  silenceContainer: {
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  silenceText: {
    fontSize: 48,
    marginBottom: 16,
  },
  silenceLabel: {
    fontSize: 18,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 16,
  },
  speakingText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MeditationGuide;

