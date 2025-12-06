import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Camera, LogOut, Save, Settings, X } from 'lucide-react-native';
import { Input, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
// Note: expo-file-system n'est pas utilisé directement, on utilise fetch à la place
import { supabase } from '@/services/supabase';
import { APP_CONFIG } from '@/config';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { getAvatarById, getAvatarsByGender, type Avatar } from '@/data/avatars';
import { useTranslation } from 'react-i18next';
import { trackPageView, trackEvent } from '@/services/analytics';

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

  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

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
      console.error('Erreur lors de la sauvegarde:', error);
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
          const urlParts = user.avatar.split('/avatars/');
          if (urlParts.length > 1) {
            const oldFileName = urlParts[1].split('?')[0];
            await supabase.storage.from('avatars').remove([oldFileName]);
          }
        } catch (err) {
          console.warn('Erreur lors de la suppression de l\'ancienne photo:', err);
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
      console.error('Erreur sélection avatar:', error);
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
                  const urlParts = user.avatar.split('/avatars/');
                  if (urlParts.length > 1) {
                    const oldFileName = urlParts[1].split('?')[0];
                    await supabase.storage.from('avatars').remove([oldFileName]);
                  }
                } catch (err) {
                  console.warn('Erreur lors de la suppression de la photo:', err);
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
              console.error('Erreur suppression photo:', error);
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
      // Note: Dans expo-image-picker v17, MediaTypeOptions est déprécié
      // On peut utiliser soit MediaTypeOptions (si disponible) soit omettre mediaTypes (par défaut: images)
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };
      
      // Ajouter mediaTypes seulement si MediaTypeOptions est disponible
      if ((ImagePicker as any).MediaTypeOptions) {
        pickerOptions.mediaTypes = (ImagePicker as any).MediaTypeOptions.Images;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

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
          // Essayer d'obtenir l'utilisateur Supabase, mais utiliser user.id du contexte si échec
          let userId = user.id;
          
          try {
            const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
            if (!userError && supabaseUser) {
              userId = supabaseUser.id;
              console.log('Upload avatar - Utilisation de l\'ID Supabase:', userId);
            } else {
              console.warn('Impossible d\'obtenir l\'utilisateur Supabase, utilisation de user.id du contexte:', userId);
            }
          } catch (err) {
            console.warn('Erreur lors de la récupération de l\'utilisateur Supabase, utilisation de user.id:', userId);
          }
          
          if (!userId) {
            throw new Error('ID utilisateur manquant');
          }
          
          console.log('Upload avatar - User ID utilisé:', userId);
          console.log('Upload avatar - File path will be:', `${userId}-${Date.now()}.jpg`);
          
          // Le nom du fichier doit commencer par l'UUID pour correspondre aux politiques RLS
          const fileName = `${userId}-${Date.now()}.jpg`;
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
                  await supabase.storage.from('avatars').remove([oldFileName]);
                }
              } catch (err) {
                console.warn('Erreur lors de la suppression de l\'ancien avatar:', err);
              }
            }
            // Supprimer aussi l'avatar_id dans user_metadata si présent
            if (APP_CONFIG.useSupabase && supabase && user?.id) {
              await supabase.auth.updateUser({
                data: { avatar_id: null }
              }).catch(console.warn);
            }
          }

          // En React Native, lire le fichier directement en ArrayBuffer
          // Utiliser fetch pour lire le fichier depuis l'URI
          const response = await fetch(manipulatedImage.uri);
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // Upload vers Supabase Storage avec Uint8Array
          console.log('Tentative d\'upload vers:', filePath);
          console.log('User ID utilisé:', userId);
          const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, uint8Array, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (error) {
            console.error('Erreur upload Supabase:', error);
            console.error('Détails:', {
              message: error.message,
              statusCode: error.statusCode,
              error: error.error,
            });
            throw error;
          }
          
          console.log('Upload réussi:', data);

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
          }
        } catch (error: any) {
          console.error('Erreur upload avatar:', error);
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
      console.error('Erreur sélection image:', error);
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
        {/* Header avec avatar */}
        <View style={styles.header}>
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
                    />
                  );
                }
                // Si l'avatar est une URL d'image, l'afficher
                if (user.avatar.startsWith('http') || user.avatar.startsWith('/')) {
                  return (
                    <Image
                      source={{ uri: user.avatar }}
                      style={styles.avatar}
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
              <Text style={[styles.name, { color: theme.colors.text }]}>
                {user?.name || t('profile.defaultUser')}
              </Text>
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

        {/* Statistiques */}
        <Card style={{ backgroundColor: theme.colors.backgroundSecondary }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.text }}>
              {t('profile.statistics')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                  {user?.analytics?.totalDhikr || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {t('profile.dhikr')}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                  {user?.analytics?.totalNotes || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {t('profile.notes')}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                  {user?.analytics?.streak || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {t('profile.days')}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Thème */}
        <Card style={{ backgroundColor: theme.colors.backgroundSecondary }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.text }}>
              {t('settings.theme')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={[styles.themeName, { color: theme.colors.textSecondary }]}>
              {theme.name}
            </Text>
          </CardContent>
        </Card>

        {/* Bouton Paramètres */}
        <Button
          variant="outline"
          onPress={() => {
            trackEvent('settings_opened', { from: 'profile' });
            navigation.navigate('Settings' as never);
          }}
          icon={Settings}
          iconPosition="left"
          style={styles.settingsButton}
        >
          {t('settings.title')}
        </Button>

        {/* Bouton de déconnexion */}
        {user?.id && (
          <Button
            variant="destructive"
            onPress={handleLogout}
            icon={LogOut}
            iconPosition="left"
            style={styles.logoutButton}
          >
            {t('auth.logout')}
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>

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
                    resizeMode="cover"
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
  themeName: {
    fontSize: 16,
    fontFamily: 'System',
  },
  settingsButton: {
    marginTop: 24,
    width: '100%',
  },
  logoutButton: {
    marginTop: 12,
    width: '100%',
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
});
