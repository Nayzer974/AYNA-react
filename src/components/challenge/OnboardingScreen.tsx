import React from 'react';
import { ChallengeSelectionScreen } from './ChallengeSelectionScreen';
import { Challenge } from '@/data/challenges';

interface OnboardingScreenProps {
  onStart: (challenge: Challenge) => void;
  hasActiveChallenge?: boolean;
}

export function OnboardingScreen({
  onStart,
  hasActiveChallenge = false
}: OnboardingScreenProps) {
  // Si un défi est déjà actif, ne pas afficher la sélection
  if (hasActiveChallenge) {
    return null; // Le parent gérera l'affichage du défi actif
  }

  return (
    <ChallengeSelectionScreen
      onSelect={(challenge) => {
        // Démarrer directement le défi sans passer par l'intention
        onStart(challenge);
      }}
    />
  );
}

