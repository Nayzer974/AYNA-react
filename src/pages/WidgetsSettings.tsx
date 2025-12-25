/**
 * Page de configuration des widgets
 * Permet de prévisualiser et configurer les widgets
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { ArrowLeft, Smartphone, RefreshCw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useWidgets } from '@/hooks/useWidgets';
import { PrayerTimesWidget } from '@/components/widgets/PrayerTimesWidget';
import { DhikrWidget } from '@/components/widgets/DhikrWidget';
import { VerseWidget } from '@/components/widgets/VerseWidget';
import Animated, { FadeIn } from 'react-native-reanimated';

export function WidgetsSettings() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  const { widgetsData, loading, refreshWidgetsData } = useWidgets();

  const [enabledWidgets, setEnabledWidgets] = useState({
    prayerTimes: true,
    dhikr: true,
    verse: true,
  });

  const handleRefresh = async () => {
    await refreshWidgetsData();
    Alert.alert('Succès', 'Les widgets ont été mis à jour');
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
            <Smartphone size={24} color={theme.colors.accent} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Configuration Widgets
            </Text>
          </View>
          <Pressable onPress={handleRefresh} disabled={loading}>
            <RefreshCw size={24} color={loading ? theme.colors.textSecondary : theme.colors.accent} />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Prévisualisez et configurez les widgets disponibles pour l'écran d'accueil de votre appareil.
          </Text>

          {/* Widget Heures de Prière */}
          <Animated.View entering={FadeIn.delay(100).duration(600)}>
            <View style={styles.widgetSection}>
              <View style={styles.widgetHeader}>
                <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>
                  Heures de Prière
                </Text>
                <Switch
                  value={enabledWidgets.prayerTimes}
                  onValueChange={(value) =>
                    setEnabledWidgets((prev) => ({ ...prev, prayerTimes: value }))
                  }
                  trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                  thumbColor="#fff"
                />
              </View>
              {enabledWidgets.prayerTimes && widgetsData?.prayerTimes && (
                <View style={[styles.widgetPreview, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <PrayerTimesWidget data={widgetsData.prayerTimes} themeId={user?.theme} />
                </View>
              )}
            </View>
          </Animated.View>

          {/* Widget Dhikr */}
          <Animated.View entering={FadeIn.delay(200).duration(600)}>
            <View style={styles.widgetSection}>
              <View style={styles.widgetHeader}>
                <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>
                  Dhikr du Jour
                </Text>
                <Switch
                  value={enabledWidgets.dhikr}
                  onValueChange={(value) =>
                    setEnabledWidgets((prev) => ({ ...prev, dhikr: value }))
                  }
                  trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                  thumbColor="#fff"
                />
              </View>
              {enabledWidgets.dhikr && widgetsData?.dhikr && (
                <View style={[styles.widgetPreview, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <DhikrWidget data={widgetsData.dhikr} themeId={user?.theme} />
                </View>
              )}
            </View>
          </Animated.View>

          {/* Widget Verset */}
          <Animated.View entering={FadeIn.delay(300).duration(600)}>
            <View style={styles.widgetSection}>
              <View style={styles.widgetHeader}>
                <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>
                  Verset du Jour
                </Text>
                <Switch
                  value={enabledWidgets.verse}
                  onValueChange={(value) =>
                    setEnabledWidgets((prev) => ({ ...prev, verse: value }))
                  }
                  trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                  thumbColor="#fff"
                />
              </View>
              {enabledWidgets.verse && widgetsData?.verse && (
                <View style={[styles.widgetPreview, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <VerseWidget data={widgetsData.verse} themeId={user?.theme} />
                </View>
              )}
            </View>
          </Animated.View>

          {/* Instructions */}
          <Animated.View
            entering={FadeIn.delay(400).duration(600)}
            style={[styles.instructions, { backgroundColor: theme.colors.backgroundSecondary }]}
          >
            <Text style={[styles.instructionsTitle, { color: theme.colors.text }]}>
              Comment ajouter les widgets ?
            </Text>
            <Text style={[styles.instructionsText, { color: theme.colors.textSecondary }]}>
              • iOS : Maintenez l'écran d'accueil, appuyez sur "+" et recherchez "AYNA"{'\n'}
              • Android : Maintenez l'écran d'accueil, appuyez sur "Widgets" et recherchez "AYNA"
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
    paddingBottom: 32,
  },
  description: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 24,
    lineHeight: 20,
  },
  widgetSection: {
    marginBottom: 24,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  widgetPreview: {
    borderRadius: 16,
    padding: 8,
    overflow: 'hidden',
  },
  instructions: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
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








