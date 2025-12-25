/**
 * Service pour le profil avancé (bannière, bio, statut)
 * Utilise Supabase Storage pour les images et user_metadata pour les données
 */

import { supabase } from './supabase';
import { APP_CONFIG } from '@/config';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export interface AdvancedProfile {
  userId: string;
  bio?: string;
  status?: string;
  bannerUrl?: string;
}

/**
 * Récupère le profil avancé de l'utilisateur
 */
export async function getAdvancedProfile(userId: string): Promise<AdvancedProfile | null> {
  try {
    // Essayer Supabase d'abord
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user) {
          const metadata = user.user_metadata || {};
          return {
            userId: user.id,
            bio: metadata.bio || undefined,
            status: metadata.status || undefined,
            bannerUrl: metadata.banner_url || undefined,
          };
        }
      } catch (error) {
        console.error('Erreur récupération profil depuis Supabase:', error);
      }
    }

    // Fallback: AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const stored = await AsyncStorage.getItem(`@ayna_advanced_profile_${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        userId,
        bio: parsed.bio || undefined,
        status: parsed.status || undefined,
        bannerUrl: parsed.bannerUrl || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur getAdvancedProfile:', error);
    return null;
  }
}

/**
 * Sauvegarde le profil avancé
 */
export async function saveAdvancedProfile(profile: Partial<AdvancedProfile>): Promise<boolean> {
  try {
    if (!profile.userId) {
      throw new Error('userId requis');
    }

    // Essayer Supabase d'abord
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user) {
          const currentMetadata = user.user_metadata || {};
          const updatedMetadata = {
            ...currentMetadata,
            ...(profile.bio !== undefined && { bio: profile.bio || null }),
            ...(profile.status !== undefined && { status: profile.status || null }),
            ...(profile.bannerUrl !== undefined && { banner_url: profile.bannerUrl || null }),
          };

          const { error: updateError } = await supabase.auth.updateUser({
            data: updatedMetadata,
          });

          if (!updateError) {
            // IMPORTANT : Synchroniser aussi dans la table profiles si elle existe
            // La bannière est stockée dans user_metadata mais on peut aussi la mettre dans profiles
            // pour faciliter la récupération
            try {
              // Vérifier si la table profiles existe et a une colonne pour la bannière
              // Pour l'instant, on garde la bannière dans user_metadata uniquement
              // car elle est chargée depuis user_metadata dans UserContext
            } catch (profileError) {
              // Erreur silencieuse - la table profiles peut ne pas avoir de colonne banner
            }
            
            // Sauvegarder aussi localement pour le fallback
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const current = await getAdvancedProfile(profile.userId);
            const updated: AdvancedProfile = {
              userId: profile.userId,
              ...current,
              ...profile,
            };
            await AsyncStorage.setItem(
              `@ayna_advanced_profile_${profile.userId}`,
              JSON.stringify(updated)
            );
            return true;
          }
        }
      } catch (error) {
        console.error('Erreur sauvegarde profil dans Supabase:', error);
      }
    }

    // Fallback: AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const current = await getAdvancedProfile(profile.userId);
    const updated: AdvancedProfile = {
      userId: profile.userId,
      ...current,
      ...profile,
    };
    await AsyncStorage.setItem(
      `@ayna_advanced_profile_${profile.userId}`,
      JSON.stringify(updated)
    );
    return true;
  } catch (error) {
    console.error('Erreur saveAdvancedProfile:', error);
    return false;
  }
}

/**
 * Sélectionne une image de bannière
 */
export async function pickBannerImage(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    // Redimensionner l'image
    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    return manipulated.uri;
  } catch (error) {
    console.error('Erreur pickBannerImage:', error);
    return null;
  }
}

/**
 * Upload une bannière vers Supabase Storage
 */
export async function uploadBanner(userId: string, imageUri: string): Promise<string | null> {
  try {
    if (!imageUri) {
      return null;
    }

    // Essayer Supabase Storage d'abord
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        // ✅ Permettre l'accès anonyme - Utiliser userId fourni ou générer un ID temporaire
        let authenticatedUserId: string;
        
        // Essayer d'obtenir l'utilisateur Supabase authentifié
        const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
        
        if (supabaseUser) {
          // Utilisateur authentifié - utiliser son ID
          authenticatedUserId = supabaseUser.id;
        } else if (userId) {
          // Utilisateur non authentifié mais userId fourni (depuis le contexte local)
          authenticatedUserId = userId;
        } else {
          // Utilisateur complètement anonyme - générer un ID temporaire basé sur le timestamp
          // Format: anonymous-{timestamp} pour permettre l'upload
          authenticatedUserId = `anonymous-${Date.now()}`;
        }

        // Vérifier si le bucket existe en essayant de lister les buckets
        // Si le bucket n'existe pas, on utilisera l'URI locale
        try {
          const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
          const bannersBucketExists = buckets?.some(b => b.name === 'banners');
          
          if (!bannersBucketExists) {
            console.warn('Bucket "banners" n\'existe pas encore, utilisation de l\'URI locale');
            return imageUri;
          }
        } catch (bucketCheckError) {
          console.warn('Impossible de vérifier l\'existence du bucket, utilisation de l\'URI locale');
          return imageUri;
        }

        // Supprimer l'ancienne bannière si elle existe
        const currentProfile = await getAdvancedProfile(authenticatedUserId);
        if (currentProfile?.bannerUrl && currentProfile.bannerUrl.includes('/storage/v1/object/public/banners/')) {
          try {
            const urlParts = currentProfile.bannerUrl.split('/banners/');
            if (urlParts.length > 1) {
              const oldFileName = urlParts[1].split('?')[0];
              await supabase.storage.from('banners').remove([oldFileName]);
            }
          } catch (err) {
            // Erreur silencieuse lors de la suppression
          }
        }

        // Lire le fichier en ArrayBuffer
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error('Impossible de lire le fichier image');
        }
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Le nom du fichier doit commencer par l'UUID pour correspondre aux politiques RLS
        const fileName = `${authenticatedUserId}-${Date.now()}.jpg`;

        // Upload vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('banners')
          .upload(fileName, uint8Array, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          // Si l'erreur est liée au réseau ou au bucket, utiliser l'URI locale
          if (uploadError.message?.includes('Network') || 
              uploadError.message?.includes('bucket') ||
              uploadError.message?.includes('not found')) {
            console.warn('Erreur réseau ou bucket non disponible, utilisation de l\'URI locale:', uploadError.message);
            return imageUri;
          }
          throw uploadError;
        }

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
          .from('banners')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      } catch (error: any) {
        // Si c'est une erreur réseau ou de connexion, utiliser l'URI locale
        if (error?.message?.includes('Network') || 
            error?.message?.includes('Failed to fetch') ||
            error?.code === 'PGRST301') {
          console.warn('Erreur réseau lors de l\'upload, utilisation de l\'URI locale:', error.message);
          return imageUri;
        }
        console.error('Erreur upload bannière vers Supabase:', error);
        // Fallback vers URI locale en cas d'erreur
        return imageUri;
      }
    }

    // Fallback: retourner l'URI locale si Supabase n'est pas disponible
    return imageUri;
  } catch (error) {
    console.error('Erreur uploadBanner:', error);
    // En cas d'erreur, retourner l'URI locale pour que l'utilisateur puisse quand même utiliser l'image
    return imageUri;
  }
}
