import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface StarAnimationProps {
  size?: number;
  style?: ViewStyle;
}

/**
 * Composant StarAnimation
 * 
 * NOTE: Temporairement désactivé car Metro ne peut pas résoudre les fichiers .webm
 * TODO: Convertir stars.webm en format supporté (MP4) ou utiliser une alternative (Lottie)
 */
export const StarAnimation: React.FC<StarAnimationProps> = ({ size = 20, style }) => {
  // Placeholder: retourne une View vide pour l'instant
  // L'animation vidéo sera réactivée une fois le format de fichier corrigé
  return <View style={[{ width: size, height: size }, style]} />;
};

