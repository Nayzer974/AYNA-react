import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, MessageCircle, Trash2, Ban, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeIn, FadeOut, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { BackButton } from '@/components/BackButton';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { supabase, isCurrentUserAdmin } from '@/services/supabase';
import { APP_CONFIG } from '@/config';
import { logger } from '@/utils/logger';

export interface Post {
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

type Tab = 'feed' | 'foundation' | 'groups' | 'events';

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
  const deletedPostIdsRef = useRef<Set<string>>(new Set()); // Track des posts supprimés pour éviter qu'ils reviennent
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

  // Charger les posts depuis Supabase (différé après interactions)
  useEffect(() => {
    let mounted = true;

    InteractionManager.runAfterInteractions(() => {
      async function init() {
        try {
          // Vérifier si l'utilisateur est admin
          if (user?.id) {
            try {
              const adminStatus = user.isAdmin !== undefined ? user.isAdmin : await isCurrentUserAdmin();
              if (mounted) {
                setIsAdmin(adminStatus);
              }
            } catch (adminError) {
              logger.error('[UmmAyna] Erreur lors de la vérification admin:', adminError);
              if (mounted) {
                setIsAdmin(false);
              }
            }
          }
          await loadPosts();
        } catch (error) {
          logger.error('[UmmAyna] Erreur dans init:', error);
          if (mounted) {
            setLoading(false);
            setPosts([]);
          }
        }

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
                // Changement détecté dans les posts
                // Ignorer les événements DELETE pour éviter de recharger immédiatement après suppression
                // (on gère déjà le rechargement manuellement dans deletePost)
                // Le payload.eventType peut être 'INSERT', 'UPDATE', ou 'DELETE'
                const eventType = (payload as any).eventType || (payload as any).type;
                if (mounted && eventType !== 'DELETE' && eventType !== 'delete') {
                  await loadPosts();
                }
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                // Abonnement en temps réel activé
              }
            });

          channelRef.current = channel;
        }
      }

      init();
    });

    // Nettoyer l'abonnement au démontage
    return () => {
      mounted = false;
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, user?.isAdmin, activeTab]);

  const loadPosts = useCallback(async () => {
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
      // Filtrer selon l'onglet actif
      let query = supabase
        .from('community_posts')
        .select('*');
      
      // Si on est sur l'onglet Fondation, charger uniquement les posts Fondation
      if (activeTab === 'foundation') {
        query = query.eq('is_foundation', true);
      } else {
        // Sinon, charger uniquement les posts du feed (pas Fondation)
        // Utiliser une condition OR pour gérer les cas où is_foundation est NULL ou false
        query = query.or('is_foundation.is.null,is_foundation.eq.false');
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[UmmAyna] Erreur lors du chargement des posts:', error);
        logger.error('[UmmAyna] Détails de l\'erreur:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
      
      logger.log('[UmmAyna] Posts chargés:', data?.length || 0, 'posts');
      logger.log('[UmmAyna] Onglet actif:', activeTab);
      if (data && data.length > 0) {
        logger.log('[UmmAyna] Premier post:', {
          id: data[0].id,
          text: data[0].text?.substring(0, 50),
          is_foundation: data[0].is_foundation,
          user_id: data[0].user_id,
        });
      }

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

        // Filtrer les posts supprimés avant de les formater
        const formattedPosts: Post[] = data
          .filter((post: any) => !deletedPostIdsRef.current.has(post.id)) // Exclure les posts supprimés
          .map((post: any) => ({
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
    } catch (error: any) {
      logger.error('[UmmAyna] Erreur dans loadPosts:', error);
      // Afficher les posts vides en cas d'erreur pour éviter un écran blanc
      setPosts([]);
    } finally {
      // Toujours mettre à jour l'état de chargement, même en cas d'erreur
      // Cela évite que l'écran reste bloqué sur le chargement
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, user?.id, user?.avatar]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, [loadPosts]);

  async function publishPost() {
    // Permettre la publication même si l'utilisateur n'est pas connecté
    if (!newPost.trim()) return;

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
          // Fonction non disponible, continuer
        } else {
          // Erreur silencieuse en production
        }
      }
    }

    if (!APP_CONFIG.useSupabase || !supabase) {
      // Fallback local
      setPosts([
        {
          id: Date.now().toString(),
          userId: user?.id || 'anonymous',
          userName: user?.name || 'Utilisateur anonyme',
          userAvatar: user?.avatar,
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
      // Préparer les données du post
      // user_id sera automatiquement rempli par le DEFAULT auth.uid() si l'utilisateur est connecté
      // Sinon, il sera NULL pour les utilisateurs anonymes
      const postData: any = {
        // Ne pas spécifier user_id explicitement, laisser le DEFAULT auth.uid() le remplir
        // Si l'utilisateur est connecté, auth.uid() sera utilisé automatiquement
        // Si non connecté, user_id sera NULL
        user_name: user?.name || 'Utilisateur anonyme',
        text: newPost.trim(),
        likes_count: 0,
        is_foundation: activeTab === 'foundation', // Marquer comme post Fondation si on est sur l'onglet Fondation
      };

      // Ajouter user_avatar si disponible
      if (user?.avatar) {
        postData.user_avatar = user.avatar;
      }
      
      // Si l'utilisateur est connecté, on peut spécifier user_id explicitement
      // Sinon, on laisse le DEFAULT auth.uid() gérer (qui sera NULL si non connecté)
      if (user?.id) {
        postData.user_id = user.id;
      }

      const { data, error } = await supabase
        .from('community_posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        logger.error('Erreur Supabase lors de la publication:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      if (data) {
        logger.info('UmmAyna', 'Post inséré avec succès:', data);
        
        // Ajouter le nouveau post à l'état local immédiatement
        const newPost: Post = {
            id: data.id,
            userId: data.user_id,
          userName: data.user_name || user?.name || 'Utilisateur',
          userAvatar: data.user_avatar || user?.avatar,
            text: data.text,
            likes: data.likes_count || 0,
            liked: false,
            createdAt: data.created_at,
        };
        setPosts([newPost, ...posts]);
        setNewPost('');
        
        // Recharger les posts après un court délai pour s'assurer que tout est synchronisé
        // mais en excluant les posts supprimés (via le filtre dans loadPosts)
        setTimeout(async () => {
          await loadPosts();
        }, 500);
      } else {
        logger.error('[UmmAyna] Aucune donnée retournée après l\'insertion');
        throw new Error('Aucune donnée retournée après l\'insertion');
      }
    } catch (error: any) {
      logger.error('[UmmAyna] Erreur complète lors de la publication:', error);
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de la publication. Veuillez réessayer.';
      
      if (error?.message) {
        // Messages d'erreur spécifiques selon le type d'erreur
        if (error.message.includes('permission') || error.message.includes('policy') || error.code === '42501' || error.code === '401') {
          errorMessage = 'Permissions insuffisantes. Vérifiez que vous êtes bien connecté.';
        } else if (error.message.includes('duplicate') || error.code === '23505') {
          errorMessage = 'Cette publication existe déjà.';
        } else if (error.message.includes('null') || error.code === '23502') {
          errorMessage = 'Certaines informations sont manquantes. Veuillez réessayer.';
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          errorMessage = 'Problème de connexion. Vérifiez votre connexion internet.';
        } else if (error.code === 'PGRST116') {
          errorMessage = 'Aucune ligne retournée. Vérifiez vos permissions.';
        } else {
          // En mode développement, afficher le message d'erreur complet
          if (__DEV__) {
            errorMessage = `Erreur: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`;
          }
        }
      }
      
      Alert.alert('Erreur', errorMessage);
    }
  }

  async function deletePost(postId: string, isAdminDelete: boolean = false) {
    if (!APP_CONFIG.useSupabase || !supabase) {
      // Fallback local
      setPosts(posts.filter((p) => p.id !== postId));
      return;
    }

    try {
      logger.log('[UmmAyna] Tentative de suppression du post:', postId);
      logger.log('[UmmAyna] isAdminDelete:', isAdminDelete);
      // Ne jamais logger user?.id directement

      // Utiliser la fonction RPC pour supprimer le post (contourne RLS)
      // Cela garantit que la suppression fonctionne même si la politique RLS est restrictive
      // Passer user_id si disponible pour les utilisateurs connectes dans l'app mais pas dans Supabase
      let deleteResult: { data: any[] | null; error: any } = { data: null, error: null };
      
      // Passer toujours user?.id, même si NULL (pour les posts anonymes)
      // La fonction RPC gérera le cas où p_user_id est NULL
      const { data: deletedPostId, error: rpcError } = await supabase.rpc('delete_community_post', {
        p_post_id: postId,
        p_user_id: user?.id || null // Passer l'ID utilisateur du contexte, NULL si non connecté
      });
      
      // Si la fonction RPC n'existe pas, utiliser la méthode directe
      if (rpcError && (rpcError.message?.includes('function') || rpcError.message?.includes('not found'))) {
        logger.warn('[UmmAyna] Fonction RPC non trouvée, utilisation de la méthode directe');
        const result = await supabase
          .from('community_posts')
          .delete()
          .eq('id', postId)
          .select();
        
        deleteResult = { data: result.data, error: result.error };
      } else if (rpcError) {
        logger.error('[UmmAyna] Erreur RPC lors de la suppression:', rpcError);
        // Améliorer le message d'erreur pour les admins
        if (rpcError.message?.includes('permission') || rpcError.message?.includes("Vous n'avez pas")) {
          const errorMsg = isAdmin 
            ? 'Erreur de permissions. Vérifiez que votre statut admin est correctement configuré dans la base de données.'
            : rpcError.message;
          throw new Error(errorMsg);
        }
        throw rpcError;
      } else {
        // La fonction RPC a fonctionné, simuler data pour la compatibilité
        deleteResult = { 
          data: deletedPostId ? [{ id: deletedPostId }] : [], 
          error: null 
        };
      }

      const { data, error } = deleteResult;

      if (error) {
        logger.error('[UmmAyna] Erreur lors de la suppression:', error);
        throw error;
      }
      
      logger.info('UmmAyna', 'Post supprimé avec succès:', data);
      logger.info('UmmAyna', 'Nombre de lignes supprimées:', data?.length || 0);
      
      // Vérifier que la suppression a bien fonctionné
      if (!data || data.length === 0) {
        logger.warn('[UmmAyna] Aucune ligne supprimée - la suppression a peut-être échoué silencieusement');
        Alert.alert(
          'Erreur de suppression',
          'La suppression n\'a pas fonctionné. Vérifiez que vous avez les permissions nécessaires.'
        );
        return;
      }
      
      // Ajouter le post à la liste des posts supprimés pour éviter qu'il revienne
      deletedPostIdsRef.current.add(postId);
      logger.log('[UmmAyna] Post ajouté à la liste des supprimés. Total supprimés:', deletedPostIdsRef.current.size);
      
      // Mettre à jour l'état local immédiatement pour un feedback instantané
      setPosts(posts.filter((p) => p.id !== postId));
      
      // Ne PAS recharger les posts après suppression pour éviter que le post revienne
      // Le post est déjà retiré de l'état local et ajouté à la liste des supprimés
      // Le prochain chargement (via publication ou refresh) filtrera automatiquement ce post
      
      // Nettoyer la liste des posts supprimés après 10 minutes pour éviter qu'elle grandisse indéfiniment
      setTimeout(() => {
        deletedPostIdsRef.current.delete(postId);
        logger.info('UmmAyna', 'Post retiré de la liste des supprimés après timeout');
      }, 10 * 60 * 1000);
    } catch (error: any) {
      logger.error('[UmmAyna] Erreur complète lors de la suppression:', error);
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de la suppression. Veuillez réessayer.';
      
      if (error?.message) {
        if (error.message.includes('permission') || error.message.includes("Vous n'avez pas")) {
          errorMessage = isAdmin 
            ? 'Erreur de permissions. Vérifiez que votre statut admin est correctement configuré dans la base de données.'
            : 'Vous n\'avez pas la permission de supprimer ce post.';
        } else if (error.message.includes("n'existe pas") || error.message.includes("n'existe pas")) {
          errorMessage = 'Le post n\'existe pas ou a déjà été supprimé.';
        } else if (error.code === '42501' || error.code === 'PGRST301') {
          errorMessage = 'Permissions insuffisantes. Vérifiez que vous êtes bien connecté et que vous avez les droits nécessaires.';
        } else {
          // En mode développement, afficher le message d'erreur complet
          if (__DEV__) {
            errorMessage = `Erreur: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`;
          }
        }
      }
      
      Alert.alert('Erreur', errorMessage);
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
            // Fonction non disponible, utiliser fallback
            userEmail = `${userId}@banned.local`;
          } else {
            // Erreur silencieuse en production
          }
        }
      } catch (e: any) {
        // Si la fonction n'existe pas, continuer avec le fallback
        if (e?.message?.includes('function') || e?.message?.includes('does not exist') || e?.code === '42883') {
          // Fonction non disponible, utiliser fallback
          userEmail = `${userId}@banned.local`;
        } else {
          // Erreur silencieuse en production
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
          // Erreur silencieuse en production
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
            // Erreur silencieuse en production
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
          // Erreur silencieuse en production
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
      // Erreur silencieuse en production
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
      // Erreur silencieuse en production
    }
  }

  // Item de publication (extrait en composant pour éviter toute référence manquante en build)
  const PostItemComponent = React.memo(function PostItem({
  post,
  user,
  isAdmin,
  theme,
  onLike,
  onDelete,
  onBan,
}: {
  post: Post;
  index: number;
  user?: any;
  isAdmin: boolean;
  theme: ReturnType<typeof getTheme>;
  onLike: (post: Post) => void;
  onDelete: (postId: string, isAdminDelete?: boolean) => void;
  onBan: (userId: string, userName: string) => void;
}) {
  const initials = useMemo(() => {
    const name = post.userName || 'U';
    return name.substring(0, 1).toUpperCase();
  }, [post.userName]);

  const canDelete = user?.id && (user.id === post.userId || isAdmin);
  const canBan = isAdmin && user?.id !== post.userId;

  return (
    <View
      style={[
        styles.postCard,
        { backgroundColor: 'rgba(30, 30, 47, 0.8)', borderColor: 'rgba(255,255,255,0.05)' },
      ]}
    >
      <View style={styles.postHeader}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#FFD369', '#FB923C']}
            style={styles.avatarGradient}
          >
            {post.userAvatar ? (
              <Image 
                source={{ uri: post.userAvatar }} 
                style={styles.avatar} 
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="normal"
                recyclingKey={`avatar-${post.userId || post.id}`}
                placeholder={require('../../avatar/avatar1.png')}
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </LinearGradient>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.postUserName, { color: theme.colors.text }]}>
            {post.userName || 'Utilisateur'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            {new Date(post.createdAt).toLocaleString('fr-FR')}
          </Text>
        </View>
        {canDelete && (
          <Pressable
            onPress={() => onDelete(post.id, isAdmin)}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
          >
            <Trash2 size={18} color="#ef4444" />
          </Pressable>
        )}
        {canBan && (
          <Pressable
            onPress={() => onBan(post.userId, post.userName)}
            style={({ pressed }) => [styles.banButton, pressed && styles.buttonPressed]}
          >
            <Ban size={18} color="#fbbf24" />
          </Pressable>
        )}
      </View>

      <Text style={styles.postText}>{post.text}</Text>

      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <Pressable
            onPress={() => onLike(post)}
            style={({ pressed }) => [styles.likeButton, pressed && styles.buttonPressed]}
          >
            <Heart size={18} color={post.liked ? '#fb7185' : '#9ca3af'} fill={post.liked ? '#fb7185' : 'none'} />
            <Text style={[styles.likeCount, { color: theme.colors.text }]}>{post.likes}</Text>
          </Pressable>
          <Pressable style={styles.commentButton}>
            <MessageCircle size={18} color="#9ca3af" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.text === nextProps.post.text &&
    prevProps.post.likes === nextProps.post.likes &&
    prevProps.post.liked === nextProps.post.liked &&
    prevProps.user?.id === nextProps.user?.id &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.theme.colors.text === nextProps.theme.colors.text
  );
});

  PostItemComponent.displayName = 'PostItem';

  const renderPost = useCallback(({ item: post, index }: { item: Post; index: number }) => (
    <PostItemComponent
      post={post}
      index={index}
      user={user}
      isAdmin={isAdmin === true}
      theme={theme}
      onLike={toggleLike}
      onDelete={deletePost}
      onBan={openBanModal}
    />
  ), [user, isAdmin, theme, toggleLike, deletePost, openBanModal]);
  
  const keyExtractor = useCallback((item: Post) => item.id, []);

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
              {(['feed', 'foundation'] as Tab[]).map((tab) => (
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

                    <FlatList
                      data={posts}
                      renderItem={renderPost}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                      removeClippedSubviews={true}
                      initialNumToRender={5}
                      maxToRenderPerBatch={5}
                      windowSize={10}
                      updateCellsBatchingPeriod={50}
                      getItemLayout={(data, index) => ({
                        length: 200, // Hauteur approximative d'un post (padding 24*2 + header ~56 + text ~70 + actions ~40 + margin 16)
                        offset: 200 * index,
                        index,
                      })}
                      ListEmptyComponent={
                        posts.length === 0 && !loading && user?.id ? (
                          <View style={styles.emptyState}>
                            <Text style={[styles.emptyStateText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                              Aucune publication pour le moment
                            </Text>
                          </View>
                        ) : null
                      }
                    />
                  </>
                )}
              </View>
            )}

            {/* Fondation Tab - Admin Only */}
            {activeTab === 'foundation' && (
              <View style={styles.feedContent}>
                {!isAdmin ? (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                      Seuls les administrateurs peuvent publier sur Ayna Fondation
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* New Post for Foundation - Admin Only */}
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
                      <Text style={[styles.foundationLabel, { color: theme.colors.accent }]}>
                        Publication Fondation
                      </Text>
                      <TextInput
                        value={newPost}
                        onChangeText={setNewPost}
                        placeholder="Publier un message pour la Fondation..."
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

                    {/* Foundation Posts List */}
                    <FlatList
                      data={posts}
                      renderItem={renderPost}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                      removeClippedSubviews={true}
                      initialNumToRender={5}
                      maxToRenderPerBatch={5}
                      windowSize={10}
                      updateCellsBatchingPeriod={50}
                      getItemLayout={(data, index) => ({
                        length: 200,
                        offset: 200 * index,
                        index,
                      })}
                      ListEmptyComponent={
                        posts.length === 0 && !loading ? (
                          <View style={styles.emptyState}>
                            <Text style={[styles.emptyStateText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                              Aucune publication Fondation pour le moment
                            </Text>
                          </View>
                        ) : null
                      }
                    />
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
              statusBarTranslucent={true}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={closeBanModal}
              >
                <Pressable onPress={(e) => e.stopPropagation()}>
                  <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={[
                      styles.modalContent,
                      {
                        backgroundColor: theme.colors.backgroundSecondary,
                        borderColor: theme.colors.border || 'rgba(255, 255, 255, 0.1)',
                      },
                    ]}
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
  foundationLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'System',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonCancel: {},
  modalButtonConfirm: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
