import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing,
} from 'react-native-reanimated';

interface AnimatedCardProps {
    children: React.ReactNode;
    delay?: number;
    style?: ViewStyle;
    onPress?: () => void;
}

/**
 * Carte avec animations d'entrée et interactions
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    delay = 0,
    style,
    onPress,
}) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const scale = useSharedValue(0.95);
    const elevation = useSharedValue(2);

    useEffect(() => {
        // Entrance animation with delay
        const timer = setTimeout(() => {
            opacity.value = withTiming(1, {
                duration: 400,
                easing: Easing.out(Easing.cubic),
            });
            translateY.value = withSpring(0, {
                damping: 15,
                stiffness: 100,
            });
            scale.value = withSpring(1, {
                damping: 15,
                stiffness: 100,
            });
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    const shadowStyle = useAnimatedStyle(() => ({
        shadowOpacity: 0.1,
        shadowRadius: elevation.value,
        shadowOffset: {
            width: 0,
            height: elevation.value / 2,
        },
        elevation: elevation.value,
    }));

    const handlePressIn = () => {
        if (!onPress) return;
        scale.value = withSpring(0.98, { damping: 15 });
        elevation.value = withTiming(1, { duration: 100 });
    };

    const handlePressOut = () => {
        if (!onPress) return;
        scale.value = withSpring(1, { damping: 15 });
        elevation.value = withSpring(2, { damping: 15 });
    };

    const content = (
        <Animated.View
            style={[
                styles.card,
                animatedStyle,
                shadowStyle,
                style,
            ]}
        >
            {children}
        </Animated.View>
    );

    if (onPress) {
        return (
            <Animated.View
                onTouchStart={handlePressIn}
                onTouchEnd={handlePressOut}
                onTouchCancel={handlePressOut}
            >
                {content}
            </Animated.View>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
    },
});
