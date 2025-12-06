import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, MessageCircle, Trash2, Ban, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { BackButton } from '@/components/BackButton';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { supabase, isCurrentUserAdmin } from '@/services/supabase';
import { APP_CONFIG } from '@/config';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  likes: number;
  liked: boolean;
  createdAt: string;
}

interface BanModalState {
  isOpen: boolean;
  userId: string | null;
  userName: string | null;
  banType: 'temporary' | 'permanent' | null;
  durationMinutes: number;
}

type Tab = 'feed' | 'groups' | 'events';

export function UmmAyna() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [banModal, setBanModal] = useState<BanModalState>({
    isOpen: false,
    userId: null,
    userName: null,
    banType: null,
    durationMinutes: 60,
  });
  const channelRef = useRef<any>(null);

  // Mettre à jour les avatars des posts quand l'avatar de l'utilisateur change
  useEffect(() => {
    if (user?.id && user?.avatar) {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.userId === user.id
            ? { ...post, userAvatar: user.avatar }
            : post
        )
      );
    }
  }, [user?.avatar, user?.id]);

  // Charger les posts depuis Supabase
  useEffect(() => {
    let mounted = true;

    async function init() {
      // Vérifier si l'utilisateur est admin
      if (user?.id) {
        const adminStatus = user.isAdmin !== undefined ? user.isAdmin : await isCurrentUserAdmin();
        if (mounted) {
          setIsAdmin(adminStatus);
        }
      }
      await loadPosts();

      // Abonnement en temps réel aux changements de posts
      if (APP_CONFIG.useSupabase && supabase && mounted) {
        // Nettoyer l'ancien channel s'il existe
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
          .channel('community_posts_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'community_posts',
            },
            async (payload) => {
              console.log('Changement détecté dans les posts:', payload.eventType);
              if (mounted) {
                await loadPosts();
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Abonnement en temps réel activé pour les posts');
            }
          });

        channelRef.current = channel;
      }
    }

    init();

    // Nettoyer l'abonnement au démontage
    return () => {
      mounted = false;
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, user?.isAdmin]);

  async function loadPosts() {
    if (!APP_CONFIG.useSupabase || !supabase) {
      // Fallback vers les posts statiques si Supabase n'est pas configuré
      setPosts([
        {
          id: '1',
          userId: '1',
          userName: 'Fatima',
          text: "Aujourd'hui, j'ai ressenti une paix profonde pendant ma prière du Fajr. Alhamdulillah 🤲",
          likes: 12,
          liked: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: '2',
          userName: 'Ahmed',
          text: "Quelqu'un aurait des conseils pour maintenir une routine spirituelle régulière?",
          likes: 8,
          liked: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          userId: '3',
          userName: 'Aisha',
          text: "La patience est vraiment une vertu. Chaque épreuve nous rapproche d'Allah ✨",
          likes: 15,
          liked: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Charger les likes de l'utilisateur actuel (si connecté)
        let likedPostIds = new Set<string>();
        if (user?.id) {
          const { data: userLikes } = await supabase
            .from('community_post_likes')
            .select('post_id')
            .eq('user_id', user.id);

          likedPostIds = new Set(userLikes?.map((like) => like.post_id) || []);
        }

        const formattedPosts: Post[] = data.map((post: any) => ({
          id: post.id,
          userId: post.user_id,
          userName: post.user_name || 'Utilisateur',
          userAvatar: post.user_id === user?.id ? user.avatar : post.user_avatar,
          text: post.text,
          likes: post.likes_count || 0,
          liked: likedPostIds.has(post.id),
          createdAt: post.created_at,
        }));

        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, []);

  async function publishPost() {
    if (!newPost.trim() || !user?.id) return;

    // Vérifier si l'utilisateur est banni (optionnel, ne bloque pas si la fonction n'existe pas)
    if (APP_CONFIG.useSupabase && supabase) {
      try {
        const supabaseModule = await import('@/services/supabase').catch(() => null);
        const checkUserBanStatus = supabaseModule?.checkUserBanStatus;
        if (checkUserBanStatus && typeof checkUserBanStatus === 'function') {
          const banStatus = await checkUserBanStatus();
          
          if (banStatus && banStatus.isBanned) {
            const message = banStatus.expiresAt 
              ? `Vous êtes banni temporairement jusqu'au ${new Date(banStatus.expiresAt).toLocaleString('fr-FR')}.`
              : 'Vous êtes banni définitivement.';
            Alert.alert(
              '❌ Publication impossible',
              `${message}${banStatus.reason ? `\n\nRaison: ${banStatus.reason}` : ''}`
            );
            return;
          }
        }
      } catch (error: any) {
        // Si la fonction RPC n'existe pas encore, on continue quand même
        if (error?.message?.includes('function') || error?.message?.includes('does not exist') || error?.code === '42883') {
          console.warn('Fonction de vérification de bannissement non disponible. Continuez...');
        } else {
          console.warn('Erreur lors de la vérification du bannissement:', error);
        }
      }
    }

    if (!APP_CONFIG.useSupabase || !supabase) {
      // Fallback local
      setPosts([
        {
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name || 'Vous',
          userAvatar: user.avatar,
          text: newPost,
          likes: 0,
          liked: false,
          createdAt: new Date().toISOString(),
        },
        ...posts,
      ]);
      setNewPost('');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([
          {
            user_id: user.id,
            user_name: user.name || 'Utilisateur',
            text: newPost,
            likes_count: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPosts([
          {
            id: data.id,
            userId: data.user_id,
            userName: data.user_name || user.name || 'Vous',
            userAvatar: data.user_id === user.id ? user.avatar : data.user_avatar,
            text: data.text,
            likes: 0,
            liked: false,
            createdAt: data.created_at,
          },
          ...posts,
        ]);
        setNewPost('');
      }
    } catch (error: any) {
      console.error('Erreur lors de la publication:', error);
      Alert.alert('Erreur', 'Erreur lors de la publication. Veuillez réessayer.');
    }
  }

  async function deletePost(postId: string, isAdminDelete: boolean = false) {
    if (!APP_CONFIG.useSupabase || !supabase) {
      // Fallback local
      setPosts(posts.filter((p) => p.id !== postId));
      return;
    }

    try {
      let query = supabase.from('community_posts').delete().eq('id', postId);

      // Si ce n'est pas un admin, vérifier que c'est le propriétaire
      if (!isAdminDelete && user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { error } = await query;

      if (error) throw error;

      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Alert.alert('Erreur', 'Erreur lors de la suppression. Veuillez réessayer.');
    }
  }

  function openBanModal(userId: string, userName: string) {
    setBanModal({
      isOpen: true,
      userId,
      userName,
      banType: null,
      durationMinutes: 60,
    });
  }

  function closeBanModal() {
    setBanModal({
      isOpen: false,
      userId: null,
      userName: null,
      banType: null,
      durationMinutes: 60,
    });
  }

  async function executeBan() {
    if (!APP_CONFIG.useSupabase || !supabase || !isAdmin || !banModal.userId || !banModal.userName || !banModal.banType) {
      return;
    }

    try {
      const userId = banModal.userId;
      const userName = banModal.userName;
      const banType = banModal.banType;
      const durationMinutes = banModal.durationMinutes;

      // Récupérer l'email de l'utilisateur via une fonction RPC
      let userEmail = 'unknown@example.com';
      
      try {
        const { data: emailData, error: emailError } = await supabase
          .rpc('get_user_email', { user_uuid: userId });
        
        if (!emailError && emailData) {
          userEmail = emailData;
        } else {
          // Si la fonction n'existe pas, utiliser un fallback
          if (emailError?.message?.includes('function') || emailError?.message?.includes('does not exist') || emailError?.code === '42883') {
            console.warn('Fonction get_user_email non disponible. Le système de bannissement n\'est pas encore configuré.');
            // Utiliser l'ID comme fallback pour l'email
            userEmail = `${userId}@banned.local`;
          } else {
            console.warn('Impossible de récupérer l\'email de l\'utilisateur:', emailError);
          }
        }
      } catch (e: any) {
        // Si la fonction n'existe pas, continuer avec le fallback
        if (e?.message?.includes('function') || e?.message?.includes('does not exist') || e?.code === '42883') {
          console.warn('Fonction get_user_email non disponible. Le système de bannissement n\'est pas encore configuré.');
          userEmail = `${userId}@banned.local`;
        } else {
          console.warn('Erreur lors de la récupération de l\'email:', e);
        }
      }

      if (banType === 'permanent') {
        // Bannissement définitif
        // 1. Supprimer tous les posts de l'utilisateur
        const { error: postsError } = await supabase
          .from('community_posts')
          .delete()
          .eq('user_id', userId);

        if (postsError) throw postsError;

        // 2. Supprimer tous les likes de l'utilisateur
        const { error: likesError } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('user_id', userId);

        if (likesError) {
          console.warn('Erreur lors de la suppression des likes:', likesError);
        }

        // 3. Créer un enregistrement de bannissement
        const { error: banError } = await supabase
          .from('user_bans')
          .insert([{
            user_id: userId,
            user_email: userEmail,
            ban_type: 'permanent',
            duration_minutes: null,
            expires_at: null,
            banned_by: user.id,
            reason: 'Bannissement définitif par admin'
          }]);

        if (banError) throw banError;

        // 4. Bannir l'email
        const { error: emailBanError } = await supabase
          .from('banned_emails')
          .insert([{
            email: userEmail.toLowerCase(),
            banned_by: user.id,
            reason: 'Bannissement définitif par admin'
          }])
          .select();

        if (emailBanError) {
          // Si l'email existe déjà, ignorer l'erreur
          if (!emailBanError.message?.includes('duplicate') && !emailBanError.code?.includes('23505')) {
            console.warn('Erreur lors du bannissement de l\'email:', emailBanError);
          }
        }

        Alert.alert(
          'Succès',
          `L'utilisateur "${userName}" a été banni définitivement.\n\nSon compte et son email ont été bannis.`
        );
      } else {
        // Bannissement temporaire
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

        // 1. Créer l'enregistrement de bannissement
        const { error: banError } = await supabase
          .from('user_bans')
          .insert([{
            user_id: userId,
            user_email: userEmail,
            ban_type: 'temporary',
            duration_minutes: durationMinutes,
            expires_at: expiresAt.toISOString(),
            banned_by: user.id,
            reason: `Bannissement temporaire de ${durationMinutes} minutes`
          }]);

        if (banError) throw banError;

        // 2. Supprimer tous les posts de l'utilisateur
        const { error: postsError } = await supabase
          .from('community_posts')
          .delete()
          .eq('user_id', userId);

        if (postsError) throw postsError;

        // 3. Supprimer tous les likes de l'utilisateur
        const { error: likesError } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('user_id', userId);

        if (likesError) {
          console.warn('Erreur lors de la suppression des likes:', likesError);
        }

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationText =
          hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}` : `${minutes}min`;

        Alert.alert(
          'Succès',
          `L'utilisateur "${userName}" a été banni temporairement pour ${durationText}.\n\nTous ses posts ont été supprimés.`
        );
      }

      // Recharger les posts
      await loadPosts();
      closeBanModal();
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      Alert.alert('Erreur', 'Erreur lors du bannissement. Veuillez réessayer.');
    }
  }

  async function toggleLike(post: Post) {
    if (!user?.id || !APP_CONFIG.useSupabase || !supabase) {
      // Fallback local
      setPosts(
        posts.map((p) =>
          p.id === post.id
            ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
            : p
        )
      );
      return;
    }

    try {
      if (post.liked) {
        // Retirer le like
        const { error } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Décrémenter le compteur
        await supabase
          .from('community_posts')
          .update({ likes_count: post.likes - 1 })
          .eq('id', post.id);
      } else {
        // Ajouter le like
        const { error } = await supabase
          .from('community_post_likes')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (error) throw error;

        // Incrémenter le compteur
        await supabase
          .from('community_posts')
          .update({ likes_count: post.likes + 1 })
          .eq('id', post.id);
      }

      // Mettre à jour l'état local
      setPosts(
        posts.map((p) =>
          p.id === post.id
            ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
            : p
        )
      );
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  }

  function renderPost({ item: post, index }: { item: Post; index: number }) {
    const avatarUrl = post.userId === user?.id ? user.avatar : post.userAvatar;
    const canDelete = user?.id && (post.userId === user.id || isAdmin === true);
    const canBan = isAdmin === true && post.userId !== user?.id;
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={[
          styles.postCard,
          {
            backgroundColor: 'rgba(30, 30, 47, 0.8)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          },
        ]}
      >
        <View style={styles.postHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#FFD369', '#5A2D82']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  onError={() => {
                    // L'image ne charge pas, le placeholder avec la première lettre sera affiché
                  }}
                />
              ) : null}
            </LinearGradient>
            {!avatarUrl && (
              <View style={StyleSheet.absoluteFill}>
                <Text style={styles.avatarText}>{post.userName[0].toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.postUserName, { color: '#ffffff' }]}>
            {post.userName}
          </Text>
        </View>

        <Text style={styles.postText}>{post.text}</Text>

        <View style={styles.postActions}>
          <View style={styles.postActionsLeft}>
            <Pressable
              onPress={() => {
                scale.value = withSpring(post.liked ? 1.2 : 1);
                toggleLike(post);
              }}
              disabled={!user?.id}
              style={({ pressed }) => [
                styles.likeButton,
                pressed && styles.buttonPressed,
                !user?.id && styles.buttonDisabled,
              ]}
            >
              <Animated.View style={animatedStyle}>
                <Heart
                  size={20}
                  color={post.liked ? '#ef4444' : 'rgba(255, 255, 255, 0.8)'}
                  fill={post.liked ? '#ef4444' : 'none'}
                />
              </Animated.View>
              <Text
                style={[
                  styles.likeCount,
                  {
                    color: post.liked ? '#ef4444' : 'rgba(255, 255, 255, 0.8)',
                  },
                ]}
              >
                {post.likes}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.commentButton, pressed && styles.buttonPressed]}
            >
              <MessageCircle size={20} color="rgba(255, 255, 255, 0.8)" />
            </Pressable>
          </View>

          {(canDelete || canBan) && (
            <View style={styles.postActionsRight}>
              {canDelete && (
                <Pressable
                  onPress={() => {
                    const isAdminAction = isAdmin === true && post.userId !== user?.id;
                    const message = isAdminAction
                      ? `Êtes-vous sûr de vouloir supprimer cette publication de ${post.userName} ?`
                      : 'Êtes-vous sûr de vouloir supprimer cette publication ?';
                    Alert.alert('Confirmation', message, [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: () => deletePost(post.id, isAdminAction),
                      },
                    ]);
                  }}
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
                >
                  <Trash2 size={20} color="#f87171" />
                </Pressable>
              )}
              {canBan && (
                <Pressable
                  onPress={() => openBanModal(post.userId, post.userName)}
                  style={({ pressed }) => [styles.banButton, pressed && styles.buttonPressed]}
                >
                  <Ban size={20} color="#fb923c" />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />

      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
        >
          <View style={styles.content}>
            <BackButton />
            
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Umm'Ayna</Text>
              {/* Bouton admin : Bannissements - Invisible pour les non-admins */}
              {isAdmin === true && (
                <Pressable
                  onPress={() => {
                    // Navigation vers AdminBans si la page existe
                    try {
                      (navigation as any).navigate('AdminBans');
                    } catch {
                      Alert.alert('Info', 'Page de gestion des bannissements à venir');
                    }
                  }}
                  style={({ pressed }) => [
                    styles.adminButton,
                    pressed && styles.buttonPressed,
                    {
                      backgroundColor: 'rgba(249, 115, 22, 0.2)',
                      borderColor: 'rgba(249, 115, 22, 0.3)',
                    },
                  ]}
                >
                  <ShieldCheck size={20} color="#fb923c" />
                  <Text style={[styles.adminButtonText, { color: '#fb923c' }]}>Bannissements</Text>
                </Pressable>
              )}
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {(['feed', 'groups', 'events'] as Tab[]).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={({ pressed }) => [
                    styles.tab,
                    activeTab === tab
                      ? { backgroundColor: '#FFD369' }
                      : { backgroundColor: 'rgba(30, 30, 47, 0.8)' },
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: activeTab === tab ? '#0A0F2C' : '#ffffff',
                      },
                    ]}
                  >
                    {tab === 'feed'
                      ? 'Fil'
                      : tab === 'groups'
                      ? 'Groupes'
                      : 'Ayna Fondation'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Feed Content */}
            {activeTab === 'feed' && (
              <View style={styles.feedContent}>
                {loading && !refreshing ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                      Chargement des publications...
                    </Text>
                  </View>
                ) : (
                  <>
                    {!loading && !user?.id && posts.length === 0 && (
                      <View
                        style={[
                          styles.emptyState,
                          {
                            backgroundColor: 'rgba(30, 30, 47, 0.8)',
                          },
                        ]}
                      >
                        <Text style={[styles.emptyStateText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                          Connectez-vous pour publier des messages dans Umm'Ayna
                        </Text>
                      </View>
                    )}

                    {/* New Post - visible uniquement si connecté */}
                    {user?.id && (
                      <Animated.View
                        entering={FadeIn.delay(100)}
                        style={[
                          styles.newPostCard,
                          {
                            backgroundColor: 'rgba(30, 30, 47, 0.8)',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            elevation: 4,
                          },
                        ]}
                      >
                        <TextInput
                          value={newPost}
                          onChangeText={setNewPost}
                          placeholder="Partagez une pensée bienveillante..."
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          multiline
                          numberOfLines={3}
                          style={[
                            styles.newPostInput,
                            { color: theme.colors.text },
                          ]}
                        />
                        <Pressable
                          onPress={publishPost}
                          disabled={!newPost.trim() || !user.id}
                          style={({ pressed }) => [
                            styles.publishButton,
                            {
                              backgroundColor: '#FFD369',
                              opacity: newPost.trim() && user.id ? 1 : 0.5,
                            },
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          <Text style={[styles.publishButtonText, { color: '#0A0F2C' }]}>
                            Publier
                          </Text>
                        </Pressable>
                      </Animated.View>
                    )}

                    {posts.length === 0 && !loading && user?.id && (
                      <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                          Aucune publication pour le moment
                        </Text>
                      </View>
                    )}

                    {posts.map((post, index) => renderPost({ item: post, index }))}
                  </>
                )}
              </View>
            )}

            {/* Groups & Events Placeholder */}
            {(activeTab === 'groups' || activeTab === 'events') && (
              <Animated.View
                entering={FadeIn}
                style={styles.placeholderContainer}
              >
                <View
                  style={[
                    styles.placeholderCard,
                    {
                      backgroundColor: 'rgba(30, 30, 47, 0.8)',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.3,
                      shadowRadius: 16,
                      elevation: 8,
                    },
                  ]}
                >
                  <Text style={[styles.placeholderText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                    Coming soon
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Modal de bannissement */}
            <Modal
              visible={banModal.isOpen}
              transparent
              animationType="fade"
              onRequestClose={closeBanModal}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={closeBanModal}
              >
                <Animated.View
                  entering={FadeIn}
                  style={[
                    styles.modalContent,
                    {
                      backgroundColor: 'rgba(30, 30, 47, 1)',
                    },
                  ]}
                  onStartShouldSetResponder={() => true}
                >
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    Bannir l'utilisateur
                  </Text>
                  <Text style={[styles.modalText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                    Vous êtes sur le point de bannir <Text style={{ fontWeight: 'bold' }}>{banModal.userName}</Text>
                  </Text>

                  {/* Type de bannissement */}
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: theme.colors.text }]}>
                      Type de bannissement
                    </Text>
                    <View style={styles.radioGroup}>
                      <Pressable
                        onPress={() => setBanModal({ ...banModal, banType: 'temporary' })}
                        style={styles.radioOption}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor:
                                banModal.banType === 'temporary'
                                  ? '#FFD369'
                                  : 'rgba(255, 255, 255, 0.2)',
                            },
                          ]}
                        >
                          {banModal.banType === 'temporary' && (
                            <View style={[styles.radioInner, { backgroundColor: '#FFD369' }]} />
                          )}
                        </View>
                        <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Temporaire</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setBanModal({ ...banModal, banType: 'permanent' })}
                        style={styles.radioOption}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor:
                                banModal.banType === 'permanent'
                                  ? '#FFD369'
                                  : 'rgba(255, 255, 255, 0.2)',
                            },
                          ]}
                        >
                          {banModal.banType === 'permanent' && (
                            <View style={[styles.radioInner, { backgroundColor: '#FFD369' }]} />
                          )}
                        </View>
                        <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Définitif</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Durée (si temporaire) */}
                  {banModal.banType === 'temporary' && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalLabel, { color: theme.colors.text }]}>
                        Durée (en minutes)
                      </Text>
                      <TextInput
                        value={banModal.durationMinutes.toString()}
                        onChangeText={(text) =>
                          setBanModal({ ...banModal, durationMinutes: parseInt(text) || 60 })
                        }
                        keyboardType="numeric"
                        style={[
                          styles.modalInput,
                          {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: theme.colors.text,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                          },
                        ]}
                      />
                      <Text style={[styles.modalHint, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                        {banModal.durationMinutes >= 60
                          ? `${Math.floor(banModal.durationMinutes / 60)}h${
                              banModal.durationMinutes % 60 > 0
                                ? ` ${banModal.durationMinutes % 60}min`
                                : ''
                            }`
                          : `${banModal.durationMinutes}min`}
                      </Text>
                    </View>
                  )}

                  {/* Avertissement pour bannissement définitif */}
                  {banModal.banType === 'permanent' && (
                    <View
                      style={[
                        styles.modalWarning,
                        {
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          borderColor: 'rgba(239, 68, 68, 0.5)',
                        },
                      ]}
                    >
                      <Text style={[styles.modalWarningText, { color: '#ef4444' }]}>
                        ⚠️ Le bannissement définitif supprimera le compte de l'utilisateur et bannira son email. Cette action est irréversible.
                      </Text>
                    </View>
                  )}

                  {/* Boutons */}
                  <View style={styles.modalButtons}>
                    <Pressable
                      onPress={closeBanModal}
                      style={({ pressed }) => [
                        styles.modalButton,
                        styles.modalButtonCancel,
                        {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                        Annuler
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={executeBan}
                      disabled={!banModal.banType || (banModal.banType === 'temporary' && banModal.durationMinutes < 1)}
                      style={({ pressed }) => [
                        styles.modalButton,
                        styles.modalButtonConfirm,
                        {
                          backgroundColor: '#ef4444',
                          opacity:
                            !banModal.banType ||
                            (banModal.banType === 'temporary' && banModal.durationMinutes < 1)
                              ? 0.5
                              : 1,
                        },
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                        {banModal.banType === 'permanent' ? 'Bannir définitivement' : 'Bannir temporairement'}
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              </Pressable>
            </Modal>
          </View>
        </ScrollView>
      </SafeAreaView>
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
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    fontFamily: 'System',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  feedContent: {
    gap: 16,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  newPostCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  newPostInput: {
    minHeight: 80,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    fontSize: 14,
    fontFamily: 'System',
    textAlignVertical: 'top',
  },
  publishButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  emptyState: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'System',
  },
  postCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    gap: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'System',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postActionsLeft: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  postActionsRight: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  banButton: {
    padding: 4,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
  placeholderContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderCard: {
    padding: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'System',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'System',
  },
  modalText: {
    fontSize: 14,
    marginBottom: 24,
    fontFamily: 'System',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: 'System',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
    fontFamily: 'System',
  },
  modalInput: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'System',
  },
  modalHint: {
    fontSize: 12,
    fontFamily: 'System',
  },
  modalWarning: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  modalWarningText: {
    fontSize: 12,
    fontFamily: 'System',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {},
  modalButtonConfirm: {},
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
