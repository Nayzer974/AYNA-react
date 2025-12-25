import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Star } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { getSubscriptionStatus } from '@/services/subscription';
import { useTranslation } from 'react-i18next';
import { useSessionRestored } from '@/hooks/useSessionRestored';

/**
 * SubscriptionBadge Component
 * 
 * Displays a premium badge/star indicator when user has an active subscription
 */
export function SubscriptionBadge() {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
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
        console.error('[SubscriptionBadge] Error checking subscription:', error);
        setIsActive(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user?.id, session]);

  if (loading) {
    return null; // Ne rien afficher pendant le chargement
  }

  if (!isActive) {
    return null; // Ne rien afficher si pas d'abonnement actif
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <View style={[styles.badge, { 
        backgroundColor: theme.colors.accent + '25', 
        borderColor: theme.colors.accent,
        shadowColor: theme.colors.accent,
      }]}>
        <Star 
          size={16} 
          color={theme.colors.accent} 
          fill={theme.colors.accent}
        />
        <Text style={[styles.text, { color: theme.colors.accent }]}>
          {t('subscription.active') || 'Abonné'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
});

