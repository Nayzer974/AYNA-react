/**
 * Page de configuration des raccourcis
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { ArrowLeft, Zap, Move } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  getShortcuts,
  saveShortcuts,
  toggleShortcut,
  reorderShortcuts,
  type Shortcut,
} from '@/services/shortcuts';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

export function ShortcutsSettings() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShortcuts();
  }, [user?.id]);

  const loadShortcuts = async () => {
    if (!user?.id) return;
    try {
      const loaded = await getShortcuts(user.id);
      setShortcuts(loaded.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Erreur chargement raccourcis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (shortcutId: string, enabled: boolean) => {
    if (!user?.id) return;
    await toggleShortcut(user.id, shortcutId, enabled);
    await loadShortcuts();
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
            <Zap size={24} color={theme.colors.accent} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Raccourcis
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Configurez les raccourcis pour un accès rapide depuis l'écran d'accueil de votre appareil.
          </Text>

          {loading ? (
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Chargement...
            </Text>
          ) : (
            shortcuts.map((shortcut, index) => (
              <Animated.View
                key={shortcut.id}
                entering={SlideInRight.delay(index * 50).duration(300)}
                style={[styles.shortcutItem, { backgroundColor: theme.colors.backgroundSecondary }]}
              >
                <View style={styles.shortcutContent}>
                  <Text style={styles.shortcutIcon}>{shortcut.icon}</Text>
                  <View style={styles.shortcutInfo}>
                    <Text style={[styles.shortcutName, { color: theme.colors.text }]}>
                      {shortcut.name}
                    </Text>
                  </View>
                  <Switch
                    value={shortcut.enabled}
                    onValueChange={(enabled) => handleToggle(shortcut.id, enabled)}
                    trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                    thumbColor="#fff"
                  />
                </View>
              </Animated.View>
            ))
          )}

          <Animated.View
            entering={FadeIn.delay(300).duration(600)}
            style={[styles.instructions, { backgroundColor: theme.colors.backgroundSecondary }]}
          >
            <Text style={[styles.instructionsTitle, { color: theme.colors.text }]}>
              Comment utiliser les raccourcis ?
            </Text>
            <Text style={[styles.instructionsText, { color: theme.colors.textSecondary }]}>
              • iOS : Maintenez l'icône de l'app, puis sélectionnez un raccourci{'\n'}
              • Android : Maintenez l'icône de l'app, puis sélectionnez un raccourci
            </Text>
          </Animated.View>
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
  shortcutItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  shortcutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shortcutIcon: {
    fontSize: 24,
  },
  shortcutInfo: {
    flex: 1,
  },
  shortcutName: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  instructions: {
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: 'System',
    lineHeight: 22,
  },
});






