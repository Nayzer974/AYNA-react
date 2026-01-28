import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeIn, SlideInRight } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Camera, LogOut, Save, Settings, X, Clock, Globe, Info, Ban, MessageSquare, Bug, Image as ImageIcon, Send, Volume2, Bookmark as BookmarkIcon } from 'lucide-react-native';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { SubscriptionBenefitsModal } from '@/components/SubscriptionBenefitsModal';
import { PaywallModal } from '@/components/PaywallModal';
import { getSubscriptionStatus } from '@/services/system/subscription';
import { isCurrentUserAdmin } from '@/services/auth/supabase';
import { Input, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
// Note: expo-file-system n'est pas utilisé directement, on utilise fetch à la place
import { supabase } from '@/services/auth/supabase';
import { APP_CONFIG } from '@/config';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { getAvatarById, getAvatarsByGender, type Avatar } from '@/data/avatars';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import { sendFeedback, type FeedbackType } from '@/services/system/feedback';
import { SPRING_CONFIGS } from '@/utils/animations';
import {
  getAdvancedProfile,
  saveAdvancedProfile,
  uploadBanner,
  pickBannerImage,
  type AdvancedProfile,
} from '@/services/storage/profileAdvanced';
import { SpaceAudioPlayer } from '@/components/SpaceAudioPlayer';
import { usePreferences } from '@/contexts/PreferencesContext';

// Composant pour compteur animé avec comptage progressif
const AnimatedCounterText = ({ value, style }: { value: number; style: any }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withSpring(value, SPRING_CONFIGS.GENTLE);
  }, [value, animatedValue]);

  // Animation de comptage progressif
  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const difference = endValue - startValue;
    const duration = 800; // ms
    const steps = 30;
    const increment = difference / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newValue = startValue + increment * currentStep;
      setDisplayValue(Math.floor(newValue));

      if (currentStep >= steps) {
        setDisplayValue(endValue);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Text style={style}>
      {Math.floor(displayValue).toLocaleString()}
    </Text>
  );
};

/**
 * Page Profile
 * 
 * Permet à l'utilisateur de :
 * - Voir et modifier son profil
 * - Changer son avatar
 * - Voir ses statistiques
 * - Se déconnecter
 */
export function Profile() {
  const navigation = useNavigation();
  const { user, updateUser, logout } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  // Track page view
  React.useEffect(() => {
    trackPageView('Profile');
  }, []);

  // Charger le profil avancé
  useEffect(() => {
    const loadAdvancedProfile = async () => {
      if (!user?.id) return;
      try {
        const profile = await getAdvancedProfile(user.id);
        setAdvancedProfile(profile);
      } catch (error) {
        console.error('Erreur chargement profil avancé:', error);
      } finally {
        setIsLoadingAdvanced(false);
      }
    };
    loadAdvancedProfile();
  }, [user?.id]);

  // Vérifier le statut d'abonnement
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) {
        setCheckingSubscription(false);
        setHasSubscription(false);
        return;
      }
      try {
        const status = await getSubscriptionStatus();
        setHasSubscription(status.isActive);
      } catch (error) {
        console.error('Erreur vérification abonnement:', error);
        setHasSubscription(false);
      } finally {
        setCheckingSubscription(false);
      }
    };
    checkSubscription();
  }, [user?.id]);

  // État pour vérifier le statut admin
  const [isAdmin, setIsAdmin] = useState(false);

  // Vérifier le statut admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }
      try {
        // Utiliser isAdmin du contexte si disponible, sinon vérifier via RPC
        if (user.isAdmin !== undefined) {
          setIsAdmin(user.isAdmin);
        } else {
          const adminStatus = await isCurrentUserAdmin();
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Erreur vérification statut admin:', error);
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user?.id, user?.isAdmin]);

  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [advancedProfile, setAdvancedProfile] = useState<AdvancedProfile | null>(null);
  const [isLoadingAdvanced, setIsLoadingAdvanced] = useState(true);

  // États pour le feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feedback');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackImages, setFeedbackImages] = useState<string[]>([]);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // États pour la biographie
  const [showBioModal, setShowBioModal] = useState(false);
  const [bioText, setBioText] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // État pour le modal des avantages de l'abonnement
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);

  // État pour le statut d'abonnement et le modal d'activation
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  // État pour le lecteur Space Audio
  const [showSpacePlayer, setShowSpacePlayer] = useState(false);
  const { preferences } = usePreferences();
  const spaceAudioEnabled = preferences.spaceAudioEnabled ?? true;

  // Mémoriser les styles basés sur le thème pour éviter les re-renders
  const cardStyle = useMemo(() => ({ backgroundColor: theme.colors.backgroundSecondary }), [theme.colors.backgroundSecondary]);
  const cardTitleStyle = useMemo(() => ({ color: theme.colors.text }), [theme.colors.text]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('profile.error.nameRequired'));
      return;
    }

    try {
      setSaving(true);
      updateUser({ name: name.trim() });
      setIsEditing(false);
      Alert.alert(t('common.success'), t('profile.success.profileUpdated'));
      trackEvent('profile_updated', { field: 'name' });
    } catch (error) {
      // Erreur silencieuse en production
      Alert.alert(t('common.error'), t('profile.error.saveFailed'));
      trackEvent('profile_update_failed', { error: 'save_error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAvatar = async (avatar: Avatar) => {
    try {
      setUploadingAvatar(true);

      // Supprimer l'ancienne photo de profil si elle existe (URL Supabase)
      if (user?.avatar && user.avatar.includes('/storage/v1/object/public/avatars/')) {
        try {
          if (supabase) {
            const urlParts = user.avatar.split('/avatars/');
            if (urlParts.length > 1) {
              const oldFileName = urlParts[1].split('?')[0];
              await supabase.storage.from('avatars').remove([oldFileName]);
            }
          }
        } catch (err) {
          // Erreur silencieuse en production
        }
      }

      // Mettre à jour avec l'avatar prédéfini
      if (APP_CONFIG.useSupabase && supabase && user?.id) {
        await supabase.auth.updateUser({
          data: { avatar_id: avatar.id, avatar_url: null }
        });
      }

      updateUser({ avatar: avatar.id });
      setShowAvatarModal(false);
      Alert.alert(t('common.success'), t('profile.success.avatarUpdated'));
      trackEvent('avatar_changed', { type: 'predefined', avatarId: avatar.id });
    } catch (error: any) {
      // Erreur silencieuse en production
      Alert.alert(t('common.error'), error.message || t('profile.error.avatarSelectFailed'));
      trackEvent('avatar_change_failed', { error: error.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert(
      t('profile.removePhoto'),
      t('profile.removePhotoConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingAvatar(true);

              // Supprimer la photo de Supabase Storage si elle existe
              if (user?.avatar && user.avatar.includes('/storage/v1/object/public/avatars/')) {
                try {
                  if (supabase) {
                    const urlParts = user.avatar.split('/avatars/');
                    if (urlParts.length > 1) {
                      const oldFileName = urlParts[1].split('?')[0];
                      await supabase.storage.from('avatars').remove([oldFileName]);
                    }
                  }
                } catch (err) {
                  // Erreur silencieuse en production
                }
              }

              // Supprimer l'avatar dans user_metadata
              if (APP_CONFIG.useSupabase && supabase && user?.id) {
                await supabase.auth.updateUser({
                  data: { avatar_url: null, avatar_id: null }
                });
              }

              updateUser({ avatar: undefined });
              Alert.alert(t('common.success'), t('profile.success.photoRemoved'));
              trackEvent('avatar_removed');
            } catch (error: any) {
              // Erreur silencieuse en production
              Alert.alert(t('common.error'), error.message || t('profile.error.photoRemoveFailed'));
              trackEvent('avatar_remove_failed', { error: error.message });
            } finally {
              setUploadingAvatar(false);
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      // Demander la permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('profile.permissionRequired'), t('profile.permissionMessage'));
        return;
      }

      // Ouvrir le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;
      setUploadingAvatar(true);

      // Redimensionner l'image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Upload vers Supabase Storage si configuré
      if (APP_CONFIG.useSupabase && supabase && user?.id) {
        try {
          // CRITIQUE : Récupérer l'ID utilisateur directement depuis Supabase auth
          // Cela garantit que l'ID correspond bien à auth.uid() utilisé dans les politiques RLS
          const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();

          if (userError || !supabaseUser?.id) {
            throw new Error('Utilisateur non authentifié dans Supabase');
          }

          // Utiliser l'ID Supabase authentifié (qui correspond à auth.uid())
          const authenticatedUserId = supabaseUser.id;

          // Le nom du fichier doit commencer par l'UUID pour correspondre aux politiques RLS
          // Format: {auth.uid()}-{timestamp}.jpg
          const fileName = `${authenticatedUserId}-${Date.now()}.jpg`;
          // Ne pas inclure 'avatars/' dans le chemin - Supabase l'ajoute automatiquement
          const filePath = fileName;

          // Supprimer l'ancien avatar s'il existe (photo ou avatar_id)
          if (user.avatar) {
            // Si c'est une photo dans Supabase Storage, la supprimer
            if (user.avatar.includes('/storage/v1/object/public/avatars/')) {
              try {
                const urlParts = user.avatar.split('/avatars/');
                if (urlParts.length > 1) {
                  const oldFileName = urlParts[1].split('?')[0];
                  // Vérifier que l'ancien fichier appartient bien à l'utilisateur avant de le supprimer
                  if (oldFileName.startsWith(authenticatedUserId + '-')) {
                    await supabase.storage.from('avatars').remove([oldFileName]);
                  }
                }
              } catch (err) {
                // Erreur silencieuse en production
              }
            }
            // Supprimer aussi l'avatar_id dans user_metadata si présent
            await supabase.auth.updateUser({
              data: { avatar_id: null }
            }).catch(() => { /* Erreur silencieuse en production */ });
          }

          // En React Native, lire le fichier directement en ArrayBuffer
          // Utiliser fetch pour lire le fichier depuis l'URI
          const response = await fetch(manipulatedImage.uri);
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // Upload vers Supabase Storage avec Uint8Array
          // Le nom de fichier commence par authenticatedUserId pour correspondre aux politiques RLS
          const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, uint8Array, {
              contentType: 'image/jpeg',
              upsert: false, // Ne pas utiliser upsert pour éviter les conflits
            });

          if (error) {
            // Afficher l'erreur complète pour le débogage
            console.error('Erreur upload avatar:', error);
            throw new Error(error.message || 'Erreur lors de l\'upload de l\'avatar');
          }

          // Upload réussi

          // Obtenir l'URL publique
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) {
            // Mettre à jour l'avatar dans user_metadata (supprimer avatar_id si présent)
            await supabase.auth.updateUser({
              data: { avatar_url: urlData.publicUrl, avatar_id: null }
            });

            updateUser({ avatar: urlData.publicUrl });
            Alert.alert(t('common.success'), t('profile.success.photoUpdated'));
            trackEvent('avatar_changed', { type: 'custom_upload' });
          } else {
            throw new Error('Impossible d\'obtenir l\'URL publique de l\'avatar');
          }
        } catch (error: any) {
          // Erreur silencieuse en production
          Alert.alert(t('common.error'), error.message || t('profile.error.uploadFailed'));
          trackEvent('avatar_upload_failed', { error: error.message });
        } finally {
          setUploadingAvatar(false);
        }
      } else {
        // Fallback : utiliser l'URI locale
        updateUser({ avatar: manipulatedImage.uri });
        Alert.alert(t('common.success'), t('profile.success.avatarUpdatedLocal'));
        trackEvent('avatar_changed', { type: 'local' });
        setUploadingAvatar(false);
      }
    } catch (error: any) {
      // Erreur silencieuse en production
      Alert.alert(t('common.error'), error.message || t('profile.error.imageSelectFailed'));
      trackEvent('image_select_failed', { error: error.message });
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: () => {
            trackEvent('logout');
            if (logout) logout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />

      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec bannière */}
          <View style={styles.header}>
            {/* Bannière */}
            {advancedProfile?.bannerUrl && (
              <View style={styles.bannerContainer}>
                <Image
                  source={{ uri: advancedProfile.bannerUrl }}
                  style={styles.banner}
                  contentFit="cover"
                />
                <Pressable
                  onPress={async () => {
                    const imageUri = await pickBannerImage();
                    if (imageUri) {
                      // ✅ Permettre l'accès anonyme - Utiliser un ID par défaut si user.id n'existe pas
                      const userId = user?.id || `anonymous-${Date.now()}`;
                      const bannerUrl = await uploadBanner(userId, imageUri);
                      if (bannerUrl && user?.id) {
                        await saveAdvancedProfile({ userId: user.id, bannerUrl });
                        const updated = await getAdvancedProfile(user.id);
                        setAdvancedProfile(updated);
                      } else if (bannerUrl) {
                        // Utilisateur anonyme - sauvegarder localement uniquement
                        setAdvancedProfile(prev => prev ? { ...prev, bannerUrl } : { userId: user?.id || '', bannerUrl, bio: '', status: '' });
                      }
                    }
                  }}
                  style={styles.bannerEditButton}
                >
                  <Camera size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            )}
            {!advancedProfile?.bannerUrl && (
              <Pressable
                onPress={async () => {
                  const imageUri = await pickBannerImage();
                  if (imageUri) {
                    // ✅ Permettre l'accès anonyme - Utiliser un ID par défaut si user.id n'existe pas
                    const userId = user?.id || `anonymous-${Date.now()}`;
                    const bannerUrl = await uploadBanner(userId, imageUri);
                    if (bannerUrl && user?.id) {
                      await saveAdvancedProfile({ userId: user.id, bannerUrl });
                      const updated = await getAdvancedProfile(user.id);
                      setAdvancedProfile(updated);
                    } else if (bannerUrl) {
                      // Utilisateur anonyme - sauvegarder localement uniquement
                      setAdvancedProfile(prev => prev ? { ...prev, bannerUrl } : { userId: user?.id || '', bannerUrl, bio: '', status: '' });
                    }
                  }
                }}
                style={[styles.addBannerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
              >
                <Camera size={20} color={theme.colors.accent} />
                <Text style={[styles.addBannerText, { color: theme.colors.textSecondary }]}>
                  Ajouter une bannière
                </Text>
              </Pressable>
            )}

            {/* Avatar */}
            <Pressable
              onPress={() => {
                Alert.alert(
                  t('profile.changePhoto'),
                  t('profile.chooseOption'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('profile.takePhoto'), onPress: handlePickImage },
                    { text: t('profile.chooseAvatar'), onPress: () => setShowAvatarModal(true) },
                    ...(user?.avatar ? [{ text: t('profile.removePhoto'), style: 'destructive' as const, onPress: handleRemovePhoto }] : []),
                  ]
                );
              }}
              disabled={uploadingAvatar}
              style={({ pressed }) => [
                styles.avatarContainer,
                { borderColor: theme.colors.accent },
                pressed && styles.avatarPressed,
              ]}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="large" color={theme.colors.accent} />
              ) : user?.avatar ? (
                (() => {
                  // Si l'avatar est un avatar_id prédéfini, utiliser l'image
                  const avatar = getAvatarById(user.avatar);
                  if (avatar) {
                    return (
                      <Image
                        source={avatar.image}
                        style={styles.avatar}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                        priority="high"
                        recyclingKey={`user-avatar-${user?.id}`}
                      />
                    );
                  }
                  // Si l'avatar est une URL d'image, l'afficher
                  if (user.avatar.startsWith('http') || user.avatar.startsWith('/')) {
                    return (
                      <Image
                        source={{ uri: user.avatar }}
                        style={styles.avatar}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                        priority="high"
                        recyclingKey={`user-avatar-${user?.id}`}
                      />
                    );
                  }
                  // Sinon, utiliser l'icône par défaut
                  return <User size={48} color={theme.colors.text} />;
                })()
              ) : (
                <User size={48} color={theme.colors.text} />
              )}
              <View style={[styles.cameraIcon, { backgroundColor: theme.colors.accent }]}>
                <Camera size={16} color="#0A0F2C" />
              </View>
            </Pressable>

            {isEditing ? (
              <View style={styles.editSection}>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder={t('profile.namePlaceholder')}
                  containerStyle={styles.nameInput}
                />
                <View style={styles.editButtons}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setIsEditing(false);
                      setName(user?.name || '');
                    }}
                    style={styles.editButton}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={styles.editButton}
                  >
                    <Save size={16} color="#0A0F2C" />
                    <Text style={styles.saveText}>{t('common.save')}</Text>
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.nameSection}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: theme.colors.text }]}>
                    {user?.name || t('profile.defaultUser')}
                  </Text>
                </View>

                {/* Badge d'abonnement ou bouton d'activation */}
                {!checkingSubscription && (
                  hasSubscription ? (
                    <SubscriptionBadge onPress={() => setShowBenefitsModal(true)} />
                  ) : (
                    <Pressable
                      onPress={() => setShowPaywallModal(true)}
                      style={({ pressed }) => [
                        styles.activateButton,
                        {
                          backgroundColor: theme.colors.accent,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.activateButtonText, { color: theme.colors.background }]}>
                        {t('subscription.activate') || 'Activer mon compte'}
                      </Text>
                    </Pressable>
                  )
                )}

                {/* Bio */}
                {advancedProfile?.bio ? (
                  <Pressable
                    onPress={() => {
                      setBioText(advancedProfile.bio || '');
                      setShowBioModal(true);
                    }}
                  >
                    <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>
                      {advancedProfile.bio}
                    </Text>
                    <Text style={[styles.bioEditHint, { color: theme.colors.accent }]}>
                      {t('profile.bio.editHint') || 'Appuyez pour modifier'}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => {
                      setBioText('');
                      setShowBioModal(true);
                    }}
                  >
                    <Text style={[styles.bioPlaceholder, { color: theme.colors.accent }]}>
                      + {t('profile.bio.add') || 'Ajouter une biographie'}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                >
                  <Text style={[styles.editText, { color: theme.colors.accent }]}>
                    {t('common.edit')}
                  </Text>
                </Pressable>
              </View>
            )}

            {user?.email && (
              <Text style={[styles.email, { color: theme.colors.textSecondary }]}>
                {user.email}
              </Text>
            )}
          </View>

          {/* Bouton Admin (visible uniquement pour les admins) */}
          {isAdmin && user?.id && (
            <Animated.View
              entering={FadeIn.delay(100).duration(600)}
            >
              <Button
                variant="outline"
                onPress={() => {
                  trackEvent('admin_bans_opened', { from: 'profile' });
                  navigation.navigate('AdminBans' as never);
                }}
                icon={Ban}
                iconPosition="left"
                style={StyleSheet.flatten([styles.adminButton, { borderColor: '#ef4444' }])}
              >
                <Text style={[styles.adminButtonText, { color: '#ef4444' }]}>
                  Gestion des bannissements
                </Text>
              </Button>
            </Animated.View>
          )}

          {/* Bouton de déconnexion */}
          {user?.id && (
            <Button
              variant="destructive"
              onPress={handleLogout}
              icon={LogOut}
              iconPosition="left"
              style={styles.logoutButton}
              textStyle={styles.logoutButtonText}
            >
              {t('auth.logout')}
            </Button>
          )}

          {/* Favoris */}
          <Animated.View
            entering={FadeIn.delay(150).duration(600)}
            style={styles.bookmarksContainer}
          >
            <Pressable
              onPress={() => navigation.navigate('BookmarksPage' as never)}
              style={({ pressed }) => [
                styles.bookmarksButton,
                pressed && styles.buttonPressed
              ]}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']} // Gold gradient for premium look
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bookmarksGradient}
              >
                <BookmarkIcon size={20} color="#0A0F2C" />
                <Text style={styles.bookmarksText}>
                  {t('profile.bookmarks') || 'Mes Favoris'}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Statistiques */}
          <Animated.View
            entering={FadeIn.delay(200).duration(600)}
          >
            <Card style={StyleSheet.flatten([cardStyle, styles.cardSpacing])}>
              <CardHeader>
                <CardTitle style={cardTitleStyle}>
                  {t('profile.statistics')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.statsRow}>
                  <Animated.View
                    style={styles.statItem}
                    entering={SlideInRight.delay(300).duration(500)}
                  >
                    <AnimatedCounterText
                      value={user?.analytics?.totalDhikr || 0}
                      style={[styles.statValue, { color: theme.colors.accent }]}
                    />
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      {t('profile.dhikr') || 'Dhikr'}
                    </Text>
                  </Animated.View>

                  <Animated.View
                    style={styles.statItem}
                    entering={SlideInRight.delay(400).duration(500)}
                  >
                    <AnimatedCounterText
                      value={user?.analytics?.totalPrayers || 0}
                      style={[styles.statValue, { color: theme.colors.accent }]}
                    />
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      {t('profile.prayers')}
                    </Text>
                  </Animated.View>

                  <Animated.View
                    style={styles.statItem}
                    entering={SlideInRight.delay(500).duration(500)}
                  >
                    <AnimatedCounterText
                      value={user?.analytics?.totalNotes || 0}
                      style={[styles.statValue, { color: theme.colors.accent }]}
                    />
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      {t('profile.notes')}
                    </Text>
                  </Animated.View>

                  <Animated.View
                    style={styles.statItem}
                    entering={SlideInRight.delay(700).duration(500)}
                  >
                    <AnimatedCounterText
                      value={user?.analytics?.totalDays || 0}
                      style={[styles.statValue, { color: theme.colors.accent }]}
                    />
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      {t('profile.days') || 'Jours'}
                    </Text>
                  </Animated.View>
                </View>
              </CardContent>
            </Card>
          </Animated.View>

          {/* Thème */}
          <Animated.View
            entering={FadeIn.delay(600).duration(600)}
          >
            <Card style={StyleSheet.flatten([cardStyle, styles.cardSpacing])}>
              <CardHeader>
                <CardTitle style={cardTitleStyle}>
                  {t('settings.theme')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.themeRow}>
                  <Text style={[styles.themeName, { color: theme.colors.textSecondary }]}>
                    {theme.name}
                  </Text>
                  <Pressable
                    onPress={() => navigation.navigate('Settings' as never)}
                    style={({ pressed }) => [
                      styles.themeSettingsButton,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[styles.themeSettingsText, { color: theme.colors.accent }]}>
                      Modifier
                    </Text>
                  </Pressable>
                </View>
                {/* Bouton Paramètres */}
                <Button
                  variant="outline"
                  onPress={() => {
                    trackEvent('settings_opened', { from: 'profile' });
                    navigation.navigate('Settings' as never);
                  }}
                  icon={Settings}
                  iconPosition="left"
                  style={styles.settingsButtonInCard}
                >
                  {t('settings.title')}
                </Button>

                {/* Lecteur Space Audio */}
                <Pressable
                  onPress={() => setShowSpacePlayer(true)}
                  style={({ pressed }) => [
                    styles.spaceAudioButton,
                    {
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    }
                  ]}
                >
                  <LinearGradient
                    colors={[
                      theme.colors.accent + '20',
                      theme.colors.accent + '10',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.spaceAudioGradient}
                  >
                    <View style={styles.spaceAudioContent}>
                      <View style={[styles.spaceAudioIconContainer, { backgroundColor: theme.colors.accent + '30' }]}>
                        <Volume2 size={24} color={theme.colors.accent} />
                      </View>
                      <View style={styles.spaceAudioTextContainer}>
                        <Text style={[styles.spaceAudioTitle, { color: theme.colors.text }]}>
                          Space Audio
                        </Text>
                        <Text style={[styles.spaceAudioSubtitle, { color: theme.colors.textSecondary }]}>
                          {spaceAudioEnabled ? '🟢 Activé' : '⚪ Désactivé'}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </CardContent>
            </Card>
          </Animated.View>

          {/* Informations du compte */}
          <Card style={StyleSheet.flatten([cardStyle, styles.cardSpacing])}>
            <CardHeader>
              <CardTitle style={cardTitleStyle}>
                {t('profile.accountInfo') || 'Informations du compte'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user?.analytics?.lastActive && (
                <View style={styles.infoRow}>
                  <Clock size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                    {t('profile.lastActive') || 'Dernière activité'}: {new Date(user.analytics.lastActive).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Globe size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                  {t('profile.language') || 'Langue'}: {i18n.language === 'fr' ? 'Français' : i18n.language === 'ar' ? 'العربية' : 'English'}
                </Text>
              </View>
              {user?.emailVerified !== undefined && (
                <View style={styles.infoRow}>
                  <User size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                    {user.emailVerified ? t('common.verified') || 'Vérifié' : t('common.notVerified') || 'Non vérifié'}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>

          {/* À propos */}
          <Card style={StyleSheet.flatten([cardStyle, styles.cardSpacing])}>
            <CardHeader>
              <CardTitle style={cardTitleStyle}>
                {t('profile.about') || 'À propos'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.infoRow}>
                <Info size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                  {t('profile.appVersion') || 'Version de l\'application'}: 1.0.0
                </Text>
              </View>
              <Button
                variant="outline"
                onPress={() => setShowFeedbackModal(true)}
                icon={MessageSquare}
                iconPosition="left"
                style={styles.feedbackButton}
              >
                {t('profile.sendFeedback') || 'Envoyer un avis / Signaler un bug'}
              </Button>
            </CardContent>
          </Card>

        </ScrollView>
      </SafeAreaView>

      {/* Modal de feedback */}
      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.feedbackModalContent, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.feedbackModalHeader}>
              <Text style={[styles.feedbackModalTitle, { color: theme.colors.text }]}>
                {t('profile.feedback.title') || 'Envoyer un avis / Signaler un bug'}
              </Text>
              <Pressable
                onPress={() => {
                  setShowFeedbackModal(false);
                  setFeedbackSubject('');
                  setFeedbackMessage('');
                  setFeedbackImages([]);
                  setFeedbackType('feedback');
                }}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && { opacity: 0.7 }
                ]}
              >
                <X size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.feedbackScrollView}
              contentContainerStyle={styles.feedbackScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Type de feedback */}
              <View style={styles.feedbackSection}>
                <Text style={[styles.feedbackLabel, { color: theme.colors.text }]}>
                  {t('profile.feedback.type') || 'Type'}
                </Text>
                <View style={styles.feedbackTypeButtons}>
                  <Pressable
                    onPress={() => setFeedbackType('feedback')}
                    style={({ pressed }) => [
                      styles.feedbackTypeButton,
                      feedbackType === 'feedback' && { backgroundColor: theme.colors.accent + '33', borderColor: theme.colors.accent },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <MessageSquare size={20} color={feedbackType === 'feedback' ? theme.colors.accent : theme.colors.textSecondary} />
                    <Text style={[
                      styles.feedbackTypeButtonText,
                      { color: feedbackType === 'feedback' ? theme.colors.accent : theme.colors.textSecondary }
                    ]}>
                      {t('profile.feedback.avis') || 'Avis'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setFeedbackType('bug')}
                    style={({ pressed }) => [
                      styles.feedbackTypeButton,
                      feedbackType === 'bug' && { backgroundColor: '#ef444433', borderColor: '#ef4444' },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <Bug size={20} color={feedbackType === 'bug' ? '#ef4444' : theme.colors.textSecondary} />
                    <Text style={[
                      styles.feedbackTypeButtonText,
                      { color: feedbackType === 'bug' ? '#ef4444' : theme.colors.textSecondary }
                    ]}>
                      {t('profile.feedback.bug') || 'Bug'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Sujet */}
              <View style={styles.feedbackSection}>
                <Text style={[styles.feedbackLabel, { color: theme.colors.text }]}>
                  {t('profile.feedback.subject') || 'Sujet'} *
                </Text>
                <Input
                  value={feedbackSubject}
                  onChangeText={setFeedbackSubject}
                  placeholder={t('profile.feedback.subjectPlaceholder') || 'Ex: Problème de connexion'}
                  placeholderTextColor={theme.colors.textSecondary + '80'}
                  style={[
                    styles.feedbackInput,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  ]}
                />
              </View>

              {/* Message */}
              <View style={styles.feedbackSection}>
                <Text style={[styles.feedbackLabel, { color: theme.colors.text }]}>
                  {t('profile.feedback.message') || 'Message'} *
                </Text>
                <Input
                  value={feedbackMessage}
                  onChangeText={setFeedbackMessage}
                  placeholder={t('profile.feedback.messagePlaceholder') || 'Décrivez votre avis ou le bug rencontré...'}
                  placeholderTextColor={theme.colors.textSecondary + '80'}
                  multiline
                  numberOfLines={6}
                  style={[
                    styles.feedbackInput,
                    styles.feedbackTextArea,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  ]}
                />
              </View>

              {/* Images */}
              <View style={styles.feedbackSection}>
                <Text style={[styles.feedbackLabel, { color: theme.colors.text }]}>
                  {t('profile.feedback.images') || 'Images (optionnel)'}
                </Text>
                <Pressable
                  onPress={async () => {
                    try {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== 'granted') {
                        Alert.alert(t('profile.permissionRequired'), t('profile.permissionMessage'));
                        return;
                      }

                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        allowsEditing: true,
                        quality: 0.8,
                        allowsMultipleSelection: true,
                      });

                      if (!result.canceled && result.assets) {
                        const newImages = result.assets.map(asset => asset.uri);
                        setFeedbackImages([...feedbackImages, ...newImages].slice(0, 5)); // Max 5 images
                      }
                    } catch (error: any) {
                      Alert.alert(t('common.error'), error.message || t('profile.error.imageSelectFailed'));
                    }
                  }}
                  style={({ pressed }) => [
                    styles.addImageButton,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <ImageIcon size={20} color={theme.colors.accent} />
                  <Text style={[styles.addImageButtonText, { color: theme.colors.accent }]}>
                    {t('profile.feedback.addImage') || 'Ajouter une image'}
                  </Text>
                </Pressable>

                {feedbackImages.length > 0 && (
                  <View style={styles.feedbackImagesContainer}>
                    {feedbackImages.map((uri, index) => (
                      <View key={index} style={styles.feedbackImageItem}>
                        <Image
                          source={{ uri }}
                          style={styles.feedbackImagePreview}
                          contentFit="cover"
                        />
                        <Pressable
                          onPress={() => {
                            const newImages = [...feedbackImages];
                            newImages.splice(index, 1);
                            setFeedbackImages(newImages);
                          }}
                          style={styles.removeImageButton}
                        >
                          <X size={16} color="#fff" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Boutons */}
            <View style={styles.feedbackModalFooter}>
              <Button
                variant="outline"
                onPress={() => {
                  setShowFeedbackModal(false);
                  setFeedbackSubject('');
                  setFeedbackMessage('');
                  setFeedbackImages([]);
                  setFeedbackType('feedback');
                }}
                disabled={sendingFeedback}
                style={styles.feedbackCancelButton}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="default"
                onPress={async () => {
                  if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
                    Alert.alert(t('common.error'), t('profile.feedback.error.required') || 'Veuillez remplir tous les champs obligatoires');
                    return;
                  }

                  try {
                    setSendingFeedback(true);
                    trackEvent('feedback_sent', { type: feedbackType });

                    const result = await sendFeedback(
                      {
                        type: feedbackType,
                        subject: feedbackSubject.trim(),
                        message: feedbackMessage.trim(),
                        imageUris: feedbackImages.length > 0 ? feedbackImages : undefined,
                      },
                      user?.email,
                      user?.name,
                      user?.id
                    );

                    if (result.success) {
                      Alert.alert(
                        t('common.success'),
                        t('profile.feedback.success') || 'Votre feedback a été envoyé avec succès ! Merci pour votre contribution.'
                      );
                      setShowFeedbackModal(false);
                      setFeedbackSubject('');
                      setFeedbackMessage('');
                      setFeedbackImages([]);
                      setFeedbackType('feedback');
                    } else {
                      Alert.alert(t('common.error'), result.error || t('profile.feedback.error.sendFailed'));
                    }
                  } catch (error: any) {
                    Alert.alert(t('common.error'), error.message || t('profile.feedback.error.sendFailed'));
                  } finally {
                    setSendingFeedback(false);
                  }
                }}
                disabled={sendingFeedback || !feedbackSubject.trim() || !feedbackMessage.trim()}
                icon={Send}
                iconPosition="left"
                style={styles.feedbackSendButton}
              >
                {sendingFeedback ? (t('common.loading') || 'Envoi...') : (t('profile.feedback.send') || 'Envoyer')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de sélection d'avatar */}
      <Modal
        visible={showAvatarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('profile.chooseAvatar')}
              </Text>
              <Pressable
                onPress={() => setShowAvatarModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {user?.gender && (user.gender === 'male' || user.gender === 'female') ? (
              <ScrollView
                contentContainerStyle={styles.avatarGrid}
                showsVerticalScrollIndicator={false}
              >
                {getAvatarsByGender(user.gender).map((avatar) => (
                  <Pressable
                    key={avatar.id}
                    onPress={() => handleSelectAvatar(avatar)}
                    style={[
                      styles.avatarOptionModal,
                      {
                        borderColor: user?.avatar === avatar.id
                          ? theme.colors.accent
                          : 'rgba(255, 255, 255, 0.2)',
                        backgroundColor: user?.avatar === avatar.id
                          ? theme.colors.accent + '33'
                          : 'rgba(255, 255, 255, 0.05)',
                      },
                    ]}
                  >
                    <Image
                      source={avatar.image}
                      style={styles.avatarImageModal}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                    />
                    {user?.avatar === avatar.id && (
                      <View style={[styles.avatarCheckModal, { backgroundColor: theme.colors.accent }]}>
                        <Text style={styles.avatarCheckTextModal}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.modalMessage}>
                <Text style={[styles.modalMessageText, { color: theme.colors.textSecondary }]}>
                  {t('profile.genderRequired')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de biographie */}
      <Modal
        visible={showBioModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBioModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.bioModalContent, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.bioModalHeader}>
              <Text style={[styles.bioModalTitle, { color: theme.colors.text }]}>
                {t('profile.bio.title') || 'Biographie'}
              </Text>
              <Pressable
                onPress={() => setShowBioModal(false)}
                style={styles.bioModalCloseButton}
              >
                <X size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.bioModalScrollView}
              contentContainerStyle={styles.bioModalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.bioModalLabel, { color: theme.colors.textSecondary }]}>
                {t('profile.bio.description') || 'Parlez-nous de vous...'}
              </Text>
              <View style={[styles.bioInputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.accent }]}>
                <TextInput
                  value={bioText}
                  onChangeText={setBioText}
                  placeholder={t('profile.bio.placeholder') || 'Écrivez votre biographie ici...'}
                  placeholderTextColor={theme.colors.textSecondary + '80'}
                  style={[styles.bioTextInput, { color: theme.colors.text }]}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  maxLength={500}
                  autoFocus
                />
                <Text style={[styles.bioCharCount, { color: theme.colors.textSecondary }]}>
                  {bioText.length}/500
                </Text>
              </View>
            </ScrollView>

            <View style={styles.bioModalFooter}>
              <Button
                variant="outline"
                onPress={() => setShowBioModal(false)}
                style={styles.bioCancelButton}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="default"
                onPress={async () => {
                  if (!user?.id) return;

                  setSavingBio(true);
                  try {
                    await saveAdvancedProfile({ userId: user.id, bio: bioText.trim() || undefined });
                    const updated = await getAdvancedProfile(user.id);
                    setAdvancedProfile(updated);
                    setShowBioModal(false);
                    Alert.alert(
                      t('common.success'),
                      t('profile.bio.saved') || 'Biographie enregistrée avec succès'
                    );
                    trackEvent('bio_updated');
                  } catch (error: any) {
                    Alert.alert(
                      t('common.error'),
                      error.message || t('profile.bio.error.saveFailed') || 'Erreur lors de l\'enregistrement'
                    );
                  } finally {
                    setSavingBio(false);
                  }
                }}
                loading={savingBio}
                disabled={savingBio}
                style={styles.bioSaveButton}
              >
                {t('common.save')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal des avantages de l'abonnement */}
      <SubscriptionBenefitsModal
        visible={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
      />

      {/* Modal d'activation de compte */}
      <PaywallModal
        visible={showPaywallModal}
        onClose={async () => {
          setShowPaywallModal(false);
          // Re-vérifier le statut d'abonnement après fermeture du modal
          if (user?.id) {
            try {
              const status = await getSubscriptionStatus();
              setHasSubscription(status.isActive);
            } catch (error) {
              console.error('Erreur vérification abonnement après activation:', error);
            }
          }
        }}
        resetAt={null}
        messagesUsed={0}
        mode="subscription"
      />

      {/* Lecteur Space Audio */}
      <SpaceAudioPlayer
        visible={showSpacePlayer}
        onClose={() => setShowSpacePlayer(false)}
        enabled={spaceAudioEnabled}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A0F2C',
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
    textAlign: 'center',
  },
  editButton: {
    padding: 4,
  },
  editText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
  editSection: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 8,
  },
  nameInput: {
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  saveText: {
    color: '#0A0F2C',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginLeft: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'System',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeName: {
    fontSize: 16,
    fontFamily: 'System',
    flex: 1,
  },
  themeSettingsButton: {
    padding: 8,
  },
  themeSettingsText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  settingsButton: {
    marginTop: 16,
    width: '100%',
  },
  settingsButtonInCard: {
    marginTop: 12,
    width: '100%',
  },
  adminButton: {
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'center',
    width: '80%',
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  logoutButton: {
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'center',
    minWidth: 140,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 0,
  },
  logoutButtonText: {
    flexShrink: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
  },
  modalCloseButton: {
    padding: 4,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  avatarOptionModal: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImageModal: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarCheckModal: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0F2C',
  },
  avatarCheckTextModal: {
    color: '#0A0F2C',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  modalMessage: {
    padding: 20,
    alignItems: 'center',
  },
  modalMessageText: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'System',
    flex: 1,
  },
  cardSpacing: {
    marginBottom: 16,
  },
  feedbackButton: {
    marginTop: 12,
    width: '100%',
  },
  feedbackModalContent: {
    width: '100%',
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },
  feedbackModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  feedbackScrollView: {
    flex: 1,
  },
  feedbackScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  feedbackSection: {
    marginBottom: 20,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  feedbackTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  feedbackTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'System',
  },
  feedbackTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  addImageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  feedbackImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  feedbackImageItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  feedbackImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackModalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  feedbackCancelButton: {
    flex: 1,
  },
  feedbackSendButton: {
    flex: 1,
  },
  bannerContainer: {
    width: '100%',
    height: 150,
    marginBottom: -60, // Chevauchement avec l'avatar
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerEditButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  addBannerButton: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  addBannerText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  bio: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 20,
  },
  bioPlaceholder: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  bioEditHint: {
    fontSize: 11,
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  activateButton: {
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  activateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  bioModalContent: {
    width: '90%',
    maxWidth: 500,
    height: '80%',
    borderRadius: 20,
    padding: 0,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    flexDirection: 'column',
  },
  bioModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  bioModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
  },
  bioModalCloseButton: {
    padding: 4,
  },
  bioModalScrollView: {
    flex: 1,
    minHeight: 0,
  },
  bioModalScrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 10,
  },
  bioModalLabel: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 12,
  },
  bioInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 200,
    maxHeight: 400,
  },
  bioTextInput: {
    fontSize: 15,
    fontFamily: 'System',
    minHeight: 180,
    maxHeight: 380,
    textAlignVertical: 'top',
  },
  bioCharCount: {
    fontSize: 12,
    fontFamily: 'System',
    textAlign: 'right',
    marginTop: 8,
    opacity: 0.7,
  },
  bioModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  bioCancelButton: {
    minWidth: 100,
  },
  bioSaveButton: {
    flex: 1,
  },
  // Space Audio Button Styles
  spaceAudioButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  spaceAudioGradient: {
    padding: 16,
    borderRadius: 16,
  },
  spaceAudioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  spaceAudioIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceAudioTextContainer: {
    flex: 1,
    gap: 4,
  },
  spaceAudioTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  spaceAudioSubtitle: {
    fontSize: 13,
    fontFamily: 'System',
  },
  // Bookmarks Button Styles
  bookmarksContainer: {
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  bookmarksButton: {
    width: '80%',
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bookmarksGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  bookmarksText: {
    color: '#0A0F2C',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
