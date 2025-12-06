/**
 * Service de synthèse vocale (TTS) et reconnaissance vocale (STT)
 * Utilise expo-speech pour TTS
 * Note: STT nécessite une API externe ou expo-speech (limité)
 */

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * Options de synthèse vocale
 */
export interface TTSOptions {
  language?: string;
  pitch?: number; // 0.0 à 2.0
  rate?: number; // 0.0 à 1.0
  quality?: Speech.VoiceQuality;
  volume?: number; // 0.0 à 1.0
}

/**
 * Parle un texte (Text-to-Speech)
 */
export async function speak(
  text: string,
  options: TTSOptions = {}
): Promise<void> {
  try {
    const {
      language = 'fr-FR',
      pitch = 1.0,
      rate = 0.75,
      quality = Speech.VoiceQuality.Default,
      volume = 1.0,
    } = options;

    await Speech.speak(text, {
      language,
      pitch,
      rate,
      quality,
      volume,
    });
  } catch (error) {
    console.error('Erreur lors de la synthèse vocale:', error);
    throw error;
  }
}

/**
 * Arrête la synthèse vocale en cours
 */
export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Erreur lors de l\'arrêt de la synthèse vocale:', error);
  }
}

/**
 * Vérifie si la synthèse vocale est en cours
 */
export function isSpeaking(): boolean {
  return Speech.isSpeakingAsync();
}

/**
 * Obtient les langues disponibles pour la synthèse vocale
 */
export async function getAvailableLanguages(): Promise<string[]> {
  try {
    // Note: expo-speech ne fournit pas directement cette fonction
    // Retourner les langues courantes supportées
    return [
      'fr-FR', // Français
      'ar-SA', // Arabe
      'en-US', // Anglais
      'en-GB', // Anglais (UK)
    ];
  } catch (error) {
    console.error('Erreur lors de la récupération des langues:', error);
    return ['fr-FR'];
  }
}

/**
 * Parle un texte en arabe
 */
export async function speakArabic(text: string): Promise<void> {
  return speak(text, { language: 'ar-SA', rate: 0.7 });
}

/**
 * Parle un texte en français
 */
export async function speakFrench(text: string): Promise<void> {
  return speak(text, { language: 'fr-FR', rate: 0.75 });
}

/**
 * Parle un texte en anglais
 */
export async function speakEnglish(text: string): Promise<void> {
  return speak(text, { language: 'en-US', rate: 0.75 });
}

/**
 * Note: Pour Speech-to-Text (STT), expo-speech ne le supporte pas directement.
 * Il faudrait utiliser:
 * - @react-native-voice/voice (pour React Native)
 * - Une API externe (Google Speech-to-Text, Azure Speech, etc.)
 * - expo-speech avec une limitation (iOS uniquement, limité)
 * 
 * Pour l'instant, on laisse cette fonctionnalité pour une implémentation future.
 */


