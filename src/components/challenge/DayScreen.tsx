import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Alert } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { VerseBlock } from './VerseBlock';
import { ActionChecklist } from './ActionChecklist';
import { DhikrCounter } from './DhikrCounter';
import { JournalEntry } from './JournalEntry';
import { Challenge, getDayByChallengeAndDay } from '@/data/challenges';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

type Phase = '3' | '6' | '9' | 'portal' | 'return';

interface DayScreenProps {
  day: number;
  phase: Phase;
  onNextDay: () => void;
  challenge: Challenge;
}

const phaseColors = {
  '3': '#FFD369',
  '6': '#FFA500',
  '9': '#FF6B6B',
  portal: '#9B59B6',
  return: '#3498DB'
};

const phaseNames = {
  '3': 'Intention',
  '6': 'Transformation',
  '9': 'Illumination',
  portal: 'Portail',
  return: 'Retour'
};

export function DayScreen({
  day,
  phase,
  onNextDay,
  challenge
}: DayScreenProps) {
  const { user, addJournalEntry, addDhikrCount } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [allActionsCompleted, setAllActionsCompleted] = useState(false);
  const [dhikrTargetReached, setDhikrTargetReached] = useState(false);
  const [hasJournalEntry, setHasJournalEntry] = useState(false);
  const [dhikrCount, setDhikrCount] = useState(0);
  const [journalText, setJournalText] = useState('');
  const [resetDhikrTrigger, setResetDhikrTrigger] = useState(0);
  const progress = day / 40 * 100;
  
  const journalTextRef = useRef('');
  const dhikrCountRef = useRef(0);

  useEffect(() => {
    setAllActionsCompleted(false);
    setDhikrTargetReached(false);
    setHasJournalEntry(false);
    setShowCloseModal(false);
  }, [day, challenge.id]);

  const dhikrRequired = phase !== 'portal' && phase !== 'return';
  const canCloseDay = allActionsCompleted && (!dhikrRequired || dhikrTargetReached) && hasJournalEntry;

  const dayData = challenge.days.find(d => d.day === day);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  const handleCloseDay = () => {
    if (journalTextRef.current.trim()) {
      addJournalEntry(day, journalTextRef.current.trim());
    }
    if (dhikrCountRef.current >= 33) {
      addDhikrCount(day, dhikrCountRef.current, 'Subhanallah');
    }
    setResetDhikrTrigger(prev => prev + 1);
    setShowCloseModal(false);
    onNextDay();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header with progress ring */}
      <Animated.View entering={FadeInDown.duration(500)} style={[styles.headerCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.dayTitle, { color: theme.colors.text }]}>
              Jour {day}/40
            </Text>
            <View style={styles.phaseInfo}>
              <View style={[styles.phaseDot, { backgroundColor: phaseColors[phase] }]} />
              <Text style={[styles.phaseText, { color: theme.colors.textSecondary }]}>
                Phase {phase} • {phaseNames[phase]}
              </Text>
            </View>
          </View>
          <View style={styles.progressRing}>
            <Svg width={80} height={80} style={[styles.svg, { overflow: 'visible' }]}>
              <Circle
                cx={40}
                cy={40}
                r={radius}
                stroke="#1E1E2F"
                strokeWidth={8}
                fill="none"
              />
              <Circle
                cx={40}
                cy={40}
                r={radius}
                stroke={phaseColors[phase]}
                strokeWidth={8}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </Svg>
            <View style={styles.progressTextContainer}>
              <Text style={[styles.progressText, { color: theme.colors.text }]}>
                {Math.round(progress)}%
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Day Title and Block */}
      {dayData && (
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={[styles.dayTitleCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          {dayData.block && (
            <Text style={[styles.blockText, { color: theme.colors.textSecondary }]}>
              {dayData.block}
            </Text>
          )}
          <Text style={[styles.dayTitleText, { color: challenge.color }]}>
            {dayData.title}
          </Text>
        </Animated.View>
      )}

      {/* Verse Block */}
      <VerseBlock day={day} challenge={challenge} />

      {/* Actions Checklist */}
      <ActionChecklist 
        phase={phase} 
        challenge={challenge} 
        day={day} 
        onCompletionChange={setAllActionsCompleted}
      />

      {/* Dhikr Counter */}
      <DhikrCounter 
        phase={phase}
        day={day}
        resetTrigger={resetDhikrTrigger}
        onTargetReached={setDhikrTargetReached}
        onCountChange={(count) => {
          dhikrCountRef.current = count;
          setDhikrCount(count);
        }}
      />

      {/* Journal Entry */}
      <JournalEntry 
        day={day} 
        onEntryChange={(hasEntry, text) => {
          if (text) journalTextRef.current = text;
          setHasJournalEntry(hasEntry);
        }}
      />

      {/* Validation Status */}
      {!canCloseDay && (
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={[styles.validationCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <Text style={[styles.validationTitle, { color: theme.colors.text }]}>
            <Text style={{ color: '#FFD369', fontWeight: 'bold' }}>Pour clôturer ce jour, vous devez :</Text>
          </Text>
          <View style={styles.validationList}>
            <Text style={[styles.validationItem, { color: allActionsCompleted ? '#4ECDC4' : theme.colors.textSecondary }]}>
              {allActionsCompleted ? '✓' : '○'} Valider toutes les actions du jour
            </Text>
            {dhikrRequired && (
              <Text style={[styles.validationItem, { color: dhikrTargetReached ? '#4ECDC4' : theme.colors.textSecondary }]}>
                {dhikrTargetReached ? '✓' : '○'} Faire au moins 33 dhikr
              </Text>
            )}
            <Text style={[styles.validationItem, { color: hasJournalEntry ? '#4ECDC4' : theme.colors.textSecondary }]}>
              {hasJournalEntry ? '✓' : '○'} Écrire dans le journal du cœur
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Close Day Button */}
      <Pressable
        onPress={() => {
          if (canCloseDay) {
            setShowCloseModal(true);
          }
        }}
        disabled={!canCloseDay}
        style={({ pressed }) => [
          styles.closeButton,
          {
            backgroundColor: canCloseDay ? undefined : 'rgba(30, 30, 47, 0.5)',
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {canCloseDay ? (
          <LinearGradient
            colors={['#FFD369', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.closeButtonGradient}
          >
            <Text style={styles.closeButtonText}>
              Clôturer le jour {day}
            </Text>
          </LinearGradient>
        ) : (
          <Text style={[styles.closeButtonTextDisabled, { color: theme.colors.textSecondary }]}>
            Complétez toutes les tâches pour clôturer le jour
          </Text>
        )}
      </Pressable>

      {/* Close Modal */}
      <Modal
        visible={showCloseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCloseModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCloseModal(false)}>
          <Animated.View entering={FadeIn.duration(300)} style={[styles.modalContent, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Clôturer le jour {day}
            </Text>
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Vous avez complété toutes les conditions requises pour clôturer ce jour.
            </Text>
            <View style={styles.modalChecklist}>
              <Text style={[styles.modalCheckItem, { color: theme.colors.textSecondary }]}>
                ✓ Toutes les actions validées
              </Text>
              {dhikrRequired && (
                <Text style={[styles.modalCheckItem, { color: theme.colors.textSecondary }]}>
                  ✓ Dhikr complété (au moins 33 fois)
                </Text>
              )}
              <Text style={[styles.modalCheckItem, { color: theme.colors.textSecondary }]}>
                ✓ Journal du cœur rempli
              </Text>
              {(() => {
                const dayData = getDayByChallengeAndDay(challenge.id, day);
                const closingPhrase = dayData?.closingPhrase;
                if (closingPhrase) {
                  return (
                    <View style={styles.closingPhraseContainer}>
                      <Text style={[styles.closingPhraseLabel, { color: '#FFD369' }]}>
                        🌙 Phrase de fin :
                      </Text>
                      <Text style={[styles.closingPhraseText, { color: theme.colors.text }]}>
                        {closingPhrase}
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
            </View>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowCloseModal(false)}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Annuler
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCloseDay}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.modalButtonTextConfirm}>
                  Confirmer
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  headerCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'visible',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerLeft: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  phaseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  phaseText: {
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  progressRing: {
    width: 80,
    height: 80,
    position: 'relative',
    overflow: 'visible',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  dayTitleCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  blockText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  dayTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  validationCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  validationTitle: {
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Poppins',
  },
  validationList: {
    gap: 8,
  },
  validationItem: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  closeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  closeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A0F2C',
    fontFamily: 'Poppins',
  },
  closeButtonTextDisabled: {
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 16,
    textAlign: 'center',
    fontFamily: 'Poppins',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Poppins',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'Poppins',
  },
  modalChecklist: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  modalCheckItem: {
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  closingPhraseContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  closingPhraseLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  closingPhraseText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonConfirm: {
    backgroundColor: '#FFD369',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0F2C',
    fontFamily: 'Poppins',
  },
});

