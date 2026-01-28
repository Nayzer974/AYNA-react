import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';
import { Crown, Sparkles, Star } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { getSubscriptionStatus } from '@/services/system/subscription';
import { useTranslation } from 'react-i18next';
import { useSessionRestored } from '@/hooks/useSessionRestored';
import { LinearGradient } from 'expo-linear-gradient';

interface SubscriptionBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onPress?: () => void;
}

/**
 * SubscriptionBadge Component
 * 
 * Displays a premium badge with animation when user has an active subscription
 * (via Stripe or gift code)
 * Can be made clickable with onPress prop
 */
export function SubscriptionBadge({ size = 'medium', showLabel = true, onPress }: SubscriptionBadgeProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const { session } = useSessionRestored();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animation de brillance
  const shimmerPosition = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Animation de brillance continue
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    // Animation de pulse subtile
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id || !session) {
        setLoading(false);
        setIsActive(false);
        return;
      }

      try {
        const status = await getSubscriptionStatus();
        setIsActive(status.isActive);
      } catch (error) {
        console.error('[SubscriptionBadge] Error checking subscription:', error);
        setIsActive(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user?.id, session]);

  if (loading) {
    return null;
  }

  if (!isActive) {
    return null;
  }

  // Tailles selon le prop size
  const sizes = {
    small: { icon: 12, text: 11, paddingH: 10, paddingV: 5, gap: 4 },
    medium: { icon: 16, text: 13, paddingH: 14, paddingV: 8, gap: 6 },
    large: { icon: 20, text: 15, paddingH: 18, paddingV: 10, gap: 8 },
  };

  const currentSize = sizes[size];

  const BadgeContent = (
    <>
      <LinearGradient
        colors={['#c9a227', '#f4d03f', '#c9a227']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            paddingHorizontal: currentSize.paddingH,
            paddingVertical: currentSize.paddingV,
            gap: currentSize.gap,
          },
        ]}
      >
        {/* Icône couronne */}
        <View style={styles.iconContainer}>
          <Crown 
            size={currentSize.icon} 
            color="#0a0f1a" 
            fill="#0a0f1a"
            strokeWidth={2.5}
          />
        </View>

        {/* Texte */}
        {showLabel && (
          <Text 
            style={[
              styles.text, 
              { fontSize: currentSize.text }
            ]}
          >
            {t('subscription.active') || 'Premium'}
          </Text>
        )}

        {/* Étoile décorative */}
        <Sparkles 
          size={currentSize.icon - 2} 
          color="#0a0f1a" 
          strokeWidth={2}
        />
      </LinearGradient>

      {/* Effet de glow */}
      <View 
        style={[
          styles.glowEffect,
          {
            backgroundColor: '#c9a227',
            opacity: 0.3,
          },
        ]} 
      />
    </>
  );

  return (
    <Animated.View
      entering={FadeIn.duration(400).springify()}
      exiting={FadeOut.duration(200)}
      style={[styles.container, animatedPulseStyle]}
    >
      {onPress ? (
        <Pressable onPress={onPress} style={styles.pressable}>
          {BadgeContent}
        </Pressable>
      ) : (
        BadgeContent
      )}
    </Animated.View>
  );
}

/**
 * Petit badge Premium à afficher à côté du nom
 * (Version compacte pour les listes, headers, etc.)
 */
export function PremiumBadgeSmall() {
  return <SubscriptionBadge size="small" showLabel={false} />;
}

/**
 * Badge Premium avec étoile uniquement
 */
export function PremiumStar() {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { session } = useSessionRestored();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id || !session) {
        setLoading(false);
        setIsActive(false);
        return;
      }

      try {
        const status = await getSubscriptionStatus();
        setIsActive(status.isActive);
      } catch (error) {
        setIsActive(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user?.id, session]);

  if (loading || !isActive) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.starContainer}
    >
      <Star 
        size={18} 
        color="#c9a227" 
        fill="#c9a227"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'center',
  },
  pressable: {
    borderRadius: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    shadowColor: '#c9a227',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
    fontFamily: 'System',
    letterSpacing: 1,
    color: '#0a0f1a',
    textTransform: 'uppercase',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    zIndex: -1,
  },
  starContainer: {
    marginLeft: 6,
  },
});
