/**
 * Page de création de thèmes personnalisés
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { saveCustomTheme, generateThemeId, type CustomTheme } from '@/services/themeCreator';
import { ArrowLeft, Save, Palette, Eye } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ColorPicker } from '@/components/ColorPicker';

export function ThemeCreator() {
  const navigation = useNavigation();
  const { user, updateUser } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  
  const [themeName, setThemeName] = useState('');
  const [colors, setColors] = useState({
    primary: '#FFD369',
    secondary: '#5A2D82',
    accent: '#FFA500',
    background: '#0A0F2C',
    backgroundSecondary: '#1E1E2F',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
  });
  const [showPreview, setShowPreview] = useState(true);

  const handleSave = async () => {
    if (!themeName.trim() || !user?.id) return;
    
    try {
      const customTheme: CustomTheme = {
        id: generateThemeId(),
        name: themeName.trim(),
        colors,
        userId: user.id,
        isCustom: true,
      };
      
      await saveCustomTheme(user.id, customTheme);
      updateUser({ theme: customTheme.id as any });
      Alert.alert(t('common.success'), 'Thème créé avec succès !');
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), 'Erreur lors de la création du thème');
    }
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
            <Palette size={24} color={theme.colors.accent} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Créer un thème
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeIn.delay(100).duration(600)}>
            <Card style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>Nom du thème</CardTitle>
              </CardHeader>
              <CardContent>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.accent }]}
                  placeholder="Ex: Mon thème personnalisé"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={themeName}
                  onChangeText={setThemeName}
                />
              </CardContent>
            </Card>
          </Animated.View>
          
          {/* Sélection des couleurs */}
          <Animated.View entering={FadeIn.delay(200).duration(600)}>
            <Card style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>Couleurs du thème</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorPicker
                  label="Primary"
                  value={colors.primary}
                  onChange={(color) => setColors((prev) => ({ ...prev, primary: color }))}
                  themeId={user?.theme}
                />
                <ColorPicker
                  label="Secondary"
                  value={colors.secondary}
                  onChange={(color) => setColors((prev) => ({ ...prev, secondary: color }))}
                  themeId={user?.theme}
                />
                <ColorPicker
                  label="Accent"
                  value={colors.accent}
                  onChange={(color) => setColors((prev) => ({ ...prev, accent: color }))}
                  themeId={user?.theme}
                />
                <ColorPicker
                  label="Background"
                  value={colors.background}
                  onChange={(color) => setColors((prev) => ({ ...prev, background: color }))}
                  themeId={user?.theme}
                />
                <ColorPicker
                  label="Background Secondary"
                  value={colors.backgroundSecondary}
                  onChange={(color) => setColors((prev) => ({ ...prev, backgroundSecondary: color }))}
                  themeId={user?.theme}
                />
                <ColorPicker
                  label="Text"
                  value={colors.text}
                  onChange={(color) => setColors((prev) => ({ ...prev, text: color }))}
                  themeId={user?.theme}
                />
                <ColorPicker
                  label="Text Secondary"
                  value={colors.textSecondary}
                  onChange={(color) => setColors((prev) => ({ ...prev, textSecondary: color }))}
                  themeId={user?.theme}
                />
              </CardContent>
            </Card>
          </Animated.View>

          {/* Aperçu du thème */}
          <Animated.View entering={FadeIn.delay(300).duration(600)}>
            <Card style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <CardHeader>
                <Pressable
                  onPress={() => setShowPreview(!showPreview)}
                  style={styles.previewHeader}
                >
                  <Eye size={20} color={theme.colors.accent} />
                  <CardTitle style={{ color: theme.colors.text, marginLeft: 8 }}>
                    Aperçu
                  </CardTitle>
                </Pressable>
              </CardHeader>
              {showPreview && (
                <CardContent>
                  <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.previewCard, { backgroundColor: colors.backgroundSecondary }]}>
                      <View style={styles.previewHeaderRow}>
                        <View style={[styles.previewIcon, { backgroundColor: colors.accent }]} />
                        <Text style={[styles.previewTitle, { color: colors.text }]}>
                          Exemple de carte
                        </Text>
                      </View>
                      <Text style={[styles.previewText, { color: colors.textSecondary }]}>
                        Ceci est un aperçu de votre thème personnalisé.
                      </Text>
                      <View style={[styles.previewButton, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.previewButtonText, { color: colors.background }]}>
                          Bouton
                        </Text>
                      </View>
                    </View>
                  </View>
                </CardContent>
              )}
            </Card>
          </Animated.View>
          
          <Button
            onPress={handleSave}
            disabled={!themeName.trim()}
          >
            <Save size={20} color="#0A0F2C" />
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </Button>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  saveButtonText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewContainer: {
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
  },
  previewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  previewText: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 12,
    lineHeight: 20,
  },
  previewButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});



