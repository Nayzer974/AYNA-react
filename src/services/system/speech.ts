/**
 * Service de synthèse vocale (TTS) et reconnaissance vocale (STT)
 * Utilise expo-speech pour TTS
 * Note: STT nécessite une API externe ou expo-speech (limité)
 */

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

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
 * Note: Speech.speak() démarre la lecture de manière non-bloquante
 * La Promise se résout quand la lecture est terminée (ou est arrêtée)
 */
export async function speak(
  text: string,
  options: TTSOptions = {}
): Promise<void> {
  try {
    logger.debug('[Speech] speak appelé avec:', { text: text.substring(0, 50) + '...', options });

    if (!text || text.trim() === '') {
      logger.warn('[Speech] Texte vide, pas de lecture');
      return;
    }

    const {
      language = 'fr-FR',
      pitch = 1.0,
      rate = 0.75,
      quality = Speech.VoiceQuality.Default,
      volume = 1.0,
    } = options;

    logger.debug('[Speech] Paramètres de lecture:', { language, pitch, rate, quality, volume });

    // Speech.speak() démarre la lecture de manière non-bloquante
    // Construire les options de manière sécurisée
    const speechOptions: any = {
      language,
      pitch,
      quality,
      volume,
    };

    // Ajouter rate seulement s'il est dans une plage valide
    // Certaines plateformes peuvent avoir des problèmes avec rate < 0.5
    // iOS nécessite généralement rate >= 0.5
    if (rate !== undefined) {
      if (rate >= 0.5 && rate <= 1.0) {
        speechOptions.rate = rate;
      } else if (rate < 0.5) {
        // Si rate est trop bas, utiliser 0.5 comme minimum
        speechOptions.rate = 0.5;
        logger.warn('[Speech] Rate trop bas, utilisation de 0.5 comme minimum');
      } else {
        // Si rate est trop haut, utiliser 1.0 comme maximum
        speechOptions.rate = 1.0;
        logger.warn('[Speech] Rate trop haut, utilisation de 1.0 comme maximum');
      }
    }

    logger.debug('[Speech] Options finales pour Speech.speak:', speechOptions);
    logger.debug('[Speech] Texte à lire:', text.substring(0, 50) + '...');

    try {
      // Appeler Speech.speak() directement
      Speech.speak(text, speechOptions);
      logger.debug('[Speech] Speech.speak() appelé avec succès');

      // Vérifier immédiatement si la lecture a commencé (sans attendre)
      Speech.isSpeakingAsync().then((isSpeaking) => {
        logger.debug('[Speech] État de la lecture immédiatement après l\'appel:', isSpeaking);
      }).catch((error) => {
        logger.error('[Speech] Erreur lors de la vérification immédiate:', error);
      });
    } catch (speakError) {
      logger.error('[Speech] Erreur lors de l\'appel de Speech.speak():', speakError);
      throw speakError;
    }

    // Vérifier immédiatement si la lecture a commencé
    setTimeout(async () => {
      try {
        const isSpeaking = await Speech.isSpeakingAsync();
        logger.debug('[Speech] État de la lecture après 500ms:', isSpeaking);
        if (!isSpeaking) {
          logger.warn('[Speech] ATTENTION: La lecture n\'a pas commencé après 500ms');
        }
      } catch (error) {
        logger.error('[Speech] Erreur lors de la vérification de l\'état:', error);
      }
    }, 500);

    // Vérifier périodiquement si la lecture est terminée
    return new Promise<void>((resolve) => {
      let hasStarted = false;
      const checkInterval = setInterval(async () => {
        try {
          const isSpeaking = await Speech.isSpeakingAsync();
          if (!hasStarted && isSpeaking) {
            hasStarted = true;
            logger.debug('[Speech] Lecture démarrée avec succès');
          }
          if (!isSpeaking && hasStarted) {
            logger.debug('[Speech] Lecture terminée');
            clearInterval(checkInterval);
            resolve();
          }
        } catch (error) {
          logger.error('[Speech] Erreur lors de la vérification:', error);
          clearInterval(checkInterval);
          resolve();
        }
      }, 200); // Vérifier toutes les 200ms

      // Timeout de sécurité (10 minutes max)
      setTimeout(() => {
        logger.warn('[Speech] Timeout de sécurité atteint');
        clearInterval(checkInterval);
        resolve();
      }, 10 * 60 * 1000);
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Arrête la synthèse vocale en cours
 */
export async function stopSpeaking(): Promise<void> {
  try {
    // Speech.stop() est synchrone et arrête immédiatement la lecture
    Speech.stop();
  } catch (error) {
    // Erreur silencieuse en production
    logger.error('Erreur lors de l\'arrêt de la lecture:', error);
  }
}

/**
 * Vérifie si la synthèse vocale est en cours
 */
export async function isSpeaking(): Promise<boolean> {
  return await Speech.isSpeakingAsync();
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
    // Erreur silencieuse en production
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


