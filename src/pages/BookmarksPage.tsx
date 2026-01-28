import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, BookOpen, Trash2, ArrowRight, Bookmark as BookmarkIcon, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { GlassCard, Button, EmptyState } from '@/components/ui';
import { getBookmarks, removeBookmark, type Bookmark } from '@/services/content/quranBookmarks';
import { surahs } from '@/data/quranData';
import { trackPageView, trackEvent } from '@/services/analytics/analytics';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

export function BookmarksPage() {
    const navigation = useNavigation();
    const { user } = useUser();
    const theme = getTheme(user?.theme || 'default');
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<'verses' | 'nur'>('verses');
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);

    // Charger les favoris à chaque fois que l'écran est focus
    useFocusEffect(
        useCallback(() => {
            loadBookmarks();
            trackPageView('Bookmarks');
        }, [])
    );

    const loadBookmarks = async () => {
        try {
            setLoading(true);
            const data = await getBookmarks();
            // Trier par date décroissante (plus récent en premier)
            setBookmarks(data.sort((a, b) => b.timestamp - a.timestamp));
        } catch (error) {
            console.error('Erreur chargement favoris:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const updated = await removeBookmark(id);
            setBookmarks(updated.sort((a, b) => b.timestamp - a.timestamp));
            trackEvent('bookmark_removed', { type: activeTab });
        } catch (error) {
            Alert.alert(t('common.error'), t('common.errorOccurred'));
        }
    };

    const confirmDelete = (id: string) => {
        Alert.alert(
            t('common.delete'),
            t('bookmarks.confirmDelete'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => handleDelete(id)
                }
            ]
        );
    };

    const handlePress = (item: Bookmark) => {
        if (item.type === 'verse') {
            // Naviguer vers le lecteur de Coran
            // On suppose que QuranReader accepte surah et verse ou initialVerse
            (navigation as any).navigate('QuranReader', {
                surah: item.surahNumber,
                verse: item.verseNumber
            });
        } else if (item.type === 'nur_day') {
            // Naviguer vers Nur Quran Lumière
            (navigation as any).navigate('NurQuranLumiere', {
                day: item.day
            });
        }
    };

    const filteredBookmarks = bookmarks.filter(b =>
        activeTab === 'verses' ? b.type === 'verse' : b.type === 'nur_day'
    );

    const renderItem = ({ item, index }: { item: Bookmark; index: number }) => {
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).duration(400)}
                layout={Layout.springify()}
            >
                <GlassCard
                    style={styles.card}
                    intensity={20}
                >
                    <Pressable
                        style={styles.cardContent}
                        onPress={() => handlePress(item)}
                        android_ripple={{ color: theme.colors.accent + '20' }}
                    >
                        <View style={styles.cardIcon}>
                            {item.type === 'verse' ? (
                                <BookOpen size={24} color={theme.colors.accent} />
                            ) : (
                                <Calendar size={24} color={theme.colors.accent} />
                            )}
                        </View>

                        <View style={styles.cardTextContainer}>
                            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                {item.type === 'verse'
                                    ? `${t('quran.surah')} ${item.surahName || item.surahNumber} : ${item.verseNumber}`
                                    : item.title || `${t('nur.day')} ${item.day}`
                                }
                            </Text>
                            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                                {new Date(item.timestamp).toLocaleDateString()}
                            </Text>
                        </View>

                        <Pressable
                            onPress={() => confirmDelete(item.id)}
                            style={({ pressed }) => [
                                styles.deleteButton,
                                pressed && { opacity: 0.7 }
                            ]}
                            hitSlop={10}
                        >
                            <Trash2 size={20} color={theme.colors.textSecondary} />
                        </Pressable>

                        <View style={styles.arrowContainer}>
                            <ArrowRight size={20} color={theme.colors.accent} />
                        </View>
                    </Pressable>
                </GlassCard>
            </Animated.View>
        );
    };

    return (
        <View style={styles.wrapper}>
            <LinearGradient
                colors={[theme.colors.background, theme.colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />
            <GalaxyBackground starCount={80} />

            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </Pressable>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {t('profile.bookmarks') || 'Favoris'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <Pressable
                        style={[
                            styles.tab,
                            activeTab === 'verses' && {
                                backgroundColor: theme.colors.accent + '20',
                                borderColor: theme.colors.accent,
                            }
                        ]}
                        onPress={() => setActiveTab('verses')}
                    >
                        <BookOpen size={20} color={activeTab === 'verses' ? theme.colors.accent : theme.colors.textSecondary} />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'verses' ? theme.colors.accent : theme.colors.textSecondary }
                        ]}>
                            {t('quran.verses') || 'Versets'}
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.tab,
                            activeTab === 'nur' && {
                                backgroundColor: theme.colors.accent + '20',
                                borderColor: theme.colors.accent,
                            }
                        ]}
                        onPress={() => setActiveTab('nur')}
                    >
                        <Calendar size={20} color={activeTab === 'nur' ? theme.colors.accent : theme.colors.textSecondary} />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'nur' ? theme.colors.accent : theme.colors.textSecondary }
                        ]}>
                            {t('nur.days') || 'Jours Nur'}
                        </Text>
                    </Pressable>
                </View>

                {/* Content */}
                <FlatList
                    data={filteredBookmarks}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <EmptyState
                            icon={BookmarkIcon}
                            title={t('bookmarks.emptyTitle') || 'Aucun favori'}
                            description={
                                activeTab === 'verses'
                                    ? (t('bookmarks.emptyVerses') || 'Vos versets favoris apparaîtront ici')
                                    : (t('bookmarks.emptyNur') || 'Vos jours Nur favoris apparaîtront ici')
                            }
                        />
                    }
                />

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        fontFamily: 'System',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        gap: 8,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'System',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'System',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
        fontFamily: 'System',
    },
    deleteButton: {
        padding: 8,
        marginRight: 8,
    },
    arrowContainer: {
        padding: 4,
    },
});
