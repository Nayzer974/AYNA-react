import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Heart, MessageCircle, Trash2, Ban } from 'lucide-react-native';
import { Post } from '@/pages/UmmAyna';

interface PostItemProps {
  post: Post;
  index: number;
  user: { id: string; avatar?: string } | null;
  isAdmin: boolean;
  theme: {
    colors: {
      text: string;
      backgroundSecondary: string;
    };
  };
  onLike: (post: Post) => void;
  onDelete: (postId: string, isAdminAction: boolean) => void;
  onBan: (userId: string, userName: string) => void;
}

/**
 * Composant mémorisé pour afficher un post dans UmmAyna
 */
export const PostItem = React.memo<PostItemProps>(({ 
  post, 
  index, 
  user, 
  isAdmin, 
  theme, 
  onLike, 
  onDelete, 
  onBan 
}) => {
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
          // Ombres simplifiées pour Android - elevation réduite
          elevation: 3, // Réduit de 8 à 3 pour alléger le GPU
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
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
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
              onLike(post);
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
                      onPress: () => onDelete(post.id, isAdminAction),
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
                onPress={() => onBan(post.userId, post.userName)}
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

PostItem.displayName = 'PostItem';

const styles = StyleSheet.create({
  postCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  postActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },
});

