/**
 * Service pour gérer l'envoi de feedbacks (avis/bugs) avec images
 */

import { supabase } from './supabase';
import { APP_CONFIG } from '@/config';

export type FeedbackType = 'feedback' | 'bug';

export interface FeedbackData {
  type: FeedbackType;
  subject: string;
  message: string;
  imageUris?: string[]; // URIs locales des images à uploader
}

export interface FeedbackResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Upload une image vers Supabase Storage dans le bucket feedback
 */
export async function uploadFeedbackImage(imageUri: string, userId: string): Promise<string> {
  if (!supabase || !APP_CONFIG.useSupabase) {
    throw new Error('Supabase n\'est pas configuré');
  }

  try {
    // Lire l'image depuis l'URI
    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Générer un nom de fichier unique
    // Format: {userId}/{timestamp}-{randomId}.jpg pour correspondre aux politiques RLS
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileName = `${userId}/${timestamp}-${randomId}.jpg`;

    // Upload vers Supabase Storage dans le bucket "feedback"
    const { data, error } = await supabase.storage
      .from('feedback')
      .upload(fileName, uint8Array, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('[Feedback] Erreur upload image:', error);
      throw error;
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('feedback')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Impossible d\'obtenir l\'URL publique de l\'image');
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('[Feedback] Erreur lors de l\'upload de l\'image:', error);
    throw new Error(error.message || 'Erreur lors de l\'upload de l\'image');
  }
}

/**
 * Envoyer un feedback avec images optionnelles
 */
export async function sendFeedback(
  feedbackData: FeedbackData,
  userEmail?: string,
  userName?: string,
  userId?: string
): Promise<FeedbackResult> {
  if (!supabase || !APP_CONFIG.useSupabase) {
    return {
      success: false,
      error: 'Supabase n\'est pas configuré',
    };
  }

  try {
    // Upload des images si présentes
    let imageUrls: string[] = [];
    if (feedbackData.imageUris && feedbackData.imageUris.length > 0 && userId) {
      try {
        const uploadPromises = feedbackData.imageUris.map(uri => 
          uploadFeedbackImage(uri, userId)
        );
        imageUrls = await Promise.all(uploadPromises);
      } catch (imageError: any) {
        console.error('[Feedback] Erreur upload images:', imageError);
        // Continuer même si l'upload d'images échoue
        return {
          success: false,
          error: `Erreur lors de l'upload des images: ${imageError.message}`,
        };
      }
    }

    // Appeler l'Edge Function pour envoyer l'email
    const { data, error } = await supabase.functions.invoke('send-feedback', {
      body: {
        type: feedbackData.type,
        subject: feedbackData.subject.trim(),
        message: feedbackData.message.trim(),
        userEmail: userEmail,
        userName: userName,
        userId: userId,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      },
    });

    if (error) {
      console.error('[Feedback] Erreur Edge Function:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi du feedback',
      };
    }

    if (!data || !data.success) {
      return {
        success: false,
        error: data?.error || 'Erreur lors de l\'envoi du feedback',
      };
    }

    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error: any) {
    console.error('[Feedback] Erreur:', error);
    return {
      success: false,
      error: error.message || 'Erreur inattendue lors de l\'envoi du feedback',
    };
  }
}

