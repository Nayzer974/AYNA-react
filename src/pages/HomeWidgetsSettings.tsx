/**
 * Page de configuration des widgets personnalisables sur l'écran d'accueil
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { ArrowLeft, Layout, Move, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  getHomeWidgets,
  saveHomeWidgets,
  updateHomeWidget,
  type HomeWidget,
} from '@/services/system/homeWidgets';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
// Note: Pour le drag & drop, utiliser react-native-draggable-flatlist si installé
// Sinon, implémenter avec react-native-gesture-handler
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export function HomeWidgetsSettings() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const [widgets, setWidgets] = useState<HomeWidget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWidgets();
  }, [user?.id]);

  const loadWidgets = async () => {
    if (!user?.id) return;
    try {
      const loaded = await getHomeWidgets(user.id);
      setWidgets(loaded.sort((a, b) => a.position - b.position));
    } catch (error) {
      console.error('Erreur chargement widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (widgetId: string, enabled: boolean) => {
    if (!user?.id) return;
    await updateHomeWidget(user.id, widgetId, { enabled });
    await loadWidgets();
  };

  const handleSizeChange = async (widgetId: string, size: 'small' | 'medium' | 'large') => {
    if (!user?.id) return;
    await updateHomeWidget(user.id, widgetId, { size });
    await loadWidgets();
  };

  const handleDragEnd = async ({ data }: { data: HomeWidget[] }) => {
    if (!user?.id) return;
    const reordered = data.map((widget, index) => ({ ...widget, position: index }));
    await saveHomeWidgets(user.id, reordered);
    setWidgets(reordered);
  };

  const getWidgetLabel = (type: HomeWidget['type']): string => {
    const labels: Record<HomeWidget['type'], string> = {
      prayer_times: 'Heures de prière',
      dhikr: 'Dhikr du jour',
      verse: 'Verset du jour',
      stats: 'Statistiques',
      streak: 'Série quotidienne',
      quick_action: 'Actions rapides',
    };
    return labels[type] || type;
  };

  const renderWidget = ({ item, drag, isActive }: RenderItemParams<HomeWidget>) => {
    return (
      <Animated.View
        entering={SlideInRight.delay(item.position * 50).duration(300)}
        style={[
          styles.widgetItem,
          { backgroundColor: theme.colors.backgroundSecondary },
          isActive && styles.widgetItemActive,
        ]}
      >
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          style={styles.widgetContent}
        >
          <View style={styles.widgetHeader}>
            <View style={styles.widgetInfo}>
              <Move size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.widgetName, { color: theme.colors.text }]}>
                {getWidgetLabel(item.type)}
              </Text>
            </View>
            <Switch
              value={item.enabled}
              onValueChange={(enabled) => handleToggle(item.id, enabled)}
              trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
              thumbColor="#fff"
            />
          </View>

          {item.enabled && (
            <View style={styles.sizeSelector}>
              <Text style={[styles.sizeLabel, { color: theme.colors.textSecondary }]}>
                Taille:
              </Text>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <Pressable
                  key={size}
                  onPress={() => handleSizeChange(item.id, size)}
                  style={[
                    styles.sizeButton,
                    {
                      backgroundColor:
                        item.size === size
                          ? theme.colors.accent
                          : theme.colors.background,
                      borderColor: theme.colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sizeButtonText,
                      {
                        color:
                          item.size === size
                            ? theme.colors.background
                            : theme.colors.text,
                      },
                    ]}
                  >
                    {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />

      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Pressable onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerContent}>
            <Layout size={24} color={theme.colors.accent} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Widgets Accueil
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Personnalisez votre écran d'accueil en activant et réorganisant les widgets.
            Maintenez et glissez pour réorganiser.
          </Text>

          {loading ? (
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Chargement...
            </Text>
          ) : (
            <View>
              {widgets.map((widget, index) => (
                <View key={widget.id}>
                  {renderWidget({
                    item: widget,
                    drag: () => {},
                    isActive: false,
                    getIndex: () => index,
                  } as any)}
                </View>
              ))}
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 24,
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 24,
  },
  widgetItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  widgetItemActive: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  widgetContent: {
    flex: 1,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  widgetName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  sizeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  sizeLabel: {
    fontSize: 14,
    fontFamily: 'System',
    marginRight: 8,
  },
  sizeButton: {
    width: 40,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

