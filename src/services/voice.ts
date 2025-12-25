import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const puterBaseUrl = Constants.expoConfig?.extra?.puterBaseUrl || "https://js.puter.com/v2/";

/**
 * Text-to-Speech (TTS)
 * Pour l'instant, non implémenté en React Native
 */
export async function ttsSpeak(text: string, voice = 'default'): Promise<void> {
  // TODO: Implémenter avec expo-speech ou une API TTS
  // TTS not yet implemented
}

/**
 * Speech-to-Text (STT)
 * Transcrit un fichier audio en texte
 */
export async function sttTranscribe(audioUri: string): Promise<string> {
  try {
    const url = `${puterBaseUrl}stt`;
    
    // Lire le fichier audio
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      throw new Error('Audio file not found');
    }

    // Créer un FormData pour React Native
    const formData = new FormData();
    
    // Pour React Native, on doit utiliser un objet avec les propriétés spécifiques
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a', // expo-audio enregistre en m4a par défaut
      name: 'audio.m4a',
    } as any);

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!res.ok) {
      throw new Error(`STT error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.text ?? '';
  } catch (error: any) {
    // Erreur silencieuse en production
    throw new Error(`Erreur de transcription: ${error.message || 'Service indisponible'}`);
  }
}


