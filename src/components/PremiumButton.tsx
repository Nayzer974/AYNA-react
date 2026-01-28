import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useHaptics } from '@/hooks/useHaptics';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

interface PremiumButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Bouton premium avec animations et retour haptique
 */
export const PremiumButton: React.FC<PremiumButtonProps> = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary',
    size = 'medium',
    style,
    textStyle,
}) => {
    const { user } = useUser();
    const theme = getTheme(user?.theme || 'default');
    const haptics = useHaptics();

    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const handlePressIn = () => {
        if (disabled || loading) return;
        scale.value = withSpring(0.95, { damping: 15 });
        haptics.light();
    };

    const handlePressOut = () => {
        if (disabled || loading) return;
        scale.value = withSpring(1, { damping: 15 });
    };

    const handlePress = () => {
        if (disabled || loading) return;
        haptics.medium();
        onPress();
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: disabled ? 0.5 : opacity.value,
    }));

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return { height: 36, paddingHorizontal: 16 };
            case 'large':
                return { height: 56, paddingHorizontal: 32 };
            default:
                return { height: 48, paddingHorizontal: 24 };
        }
    };

    const getTextSize = () => {
        switch (size) {
            case 'small':
                return 14;
            case 'large':
                return 18;
            default:
                return 16;
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <ActivityIndicator
                    color={variant === 'outline' ? theme.colors.accent : '#FFFFFF'}
                    size="small"
                />
            );
        }

        return (
            <Text
                style={[
                    styles.text,
                    {
                        fontSize: getTextSize(),
                        color: variant === 'outline' ? theme.colors.accent : '#FFFFFF',
                    },
                    textStyle,
                ]}
            >
                {title}
            </Text>
        );
    };

    if (variant === 'outline') {
        return (
            <AnimatedTouchable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[
                    styles.button,
                    getSizeStyles(),
                    {
                        borderWidth: 2,
                        borderColor: theme.colors.accent,
                        backgroundColor: 'transparent',
                    },
                    animatedStyle,
                    style,
                ]}
            >
                {renderContent()}
            </AnimatedTouchable>
        );
    }

    const gradientColors: readonly [string, string] =
        variant === 'secondary'
            ? [theme.colors.backgroundSecondary, theme.colors.primary + '40'] as const
            : [theme.colors.accent, theme.colors.primary] as const;

    return (
        <AnimatedTouchable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[styles.button, getSizeStyles(), animatedStyle, style]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {renderContent()}
            </LinearGradient>
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradient: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
