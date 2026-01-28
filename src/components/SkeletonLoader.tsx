import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

interface SkeletonLoaderProps {
    type?: 'text' | 'circle' | 'rectangle' | 'card';
    width?: number | string;
    height?: number;
    lines?: number;
    style?: ViewStyle;
}

/**
 * Composant de skeleton loader avec animation shimmer
 * Utilisé pour les états de chargement
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    type = 'rectangle',
    width = '100%',
    height = 20,
    lines = 1,
    style,
}) => {
    const { user } = useUser();
    const theme = getTheme(user?.theme || 'default');

    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, {
                duration: 1500,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            shimmer.value,
            [0, 1],
            [-200, 200]
        );

        return {
            transform: [{ translateX }],
        };
    });

    const baseColor = theme.colors.backgroundSecondary || 'rgba(255, 255, 255, 0.1)';
    const highlightColor = theme.colors.primary + '20'; // Add 20% opacity

    const renderSkeleton = () => {
        switch (type) {
            case 'circle':
                return (
                    <View
                        style={[
                            styles.skeleton,
                            {
                                width: height,
                                height: height,
                                borderRadius: height / 2,
                                backgroundColor: baseColor,
                            },
                            style,
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.shimmer,
                                {
                                    backgroundColor: highlightColor,
                                },
                                animatedStyle,
                            ]}
                        />
                    </View>
                );

            case 'text':
                return (
                    <View style={style}>
                        {Array.from({ length: lines }).map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.skeleton,
                                    {
                                        width: (index === lines - 1 ? '70%' : width) as any,
                                        height: height,
                                        borderRadius: 4,
                                        backgroundColor: baseColor,
                                        marginBottom: index < lines - 1 ? 8 : 0,
                                    },
                                ]}
                            >
                                <Animated.View
                                    style={[
                                        styles.shimmer,
                                        {
                                            backgroundColor: highlightColor,
                                        },
                                        animatedStyle,
                                    ]}
                                />
                            </View>
                        ))}
                    </View>
                );

            case 'card':
                return (
                    <View style={[styles.card, { backgroundColor: baseColor }, style]}>
                        <View style={styles.cardHeader}>
                            <View
                                style={[
                                    styles.skeleton,
                                    {
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: baseColor,
                                    },
                                ]}
                            >
                                <Animated.View
                                    style={[
                                        styles.shimmer,
                                        { backgroundColor: highlightColor },
                                        animatedStyle,
                                    ]}
                                />
                            </View>
                            <View style={styles.cardHeaderText}>
                                {Array.from({ length: 2 }).map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.skeleton,
                                            {
                                                width: index === 0 ? '60%' : '40%',
                                                height: 12,
                                                borderRadius: 4,
                                                backgroundColor: baseColor,
                                                marginBottom: index === 0 ? 6 : 0,
                                            },
                                        ]}
                                    >
                                        <Animated.View
                                            style={[
                                                styles.shimmer,
                                                { backgroundColor: highlightColor },
                                                animatedStyle,
                                            ]}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View
                            style={[
                                styles.skeleton,
                                {
                                    width: '100%',
                                    height: 60,
                                    borderRadius: 8,
                                    backgroundColor: baseColor,
                                    marginTop: 12,
                                },
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.shimmer,
                                    { backgroundColor: highlightColor },
                                    animatedStyle,
                                ]}
                            />
                        </View>
                    </View>
                );

            default: // rectangle
                return (
                    <View
                        style={[
                            styles.skeleton,
                            {
                                width: width as any,
                                height,
                                borderRadius: 8,
                                backgroundColor: baseColor,
                            },
                            style,
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.shimmer,
                                {
                                    backgroundColor: highlightColor,
                                },
                                animatedStyle,
                            ]}
                        />
                    </View>
                );
        }
    };

    return renderSkeleton();
};

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
        position: 'relative',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.5,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeaderText: {
        marginLeft: 12,
        flex: 1,
    },
});
