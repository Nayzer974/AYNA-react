import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme, themes } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Moon, Volume2, Globe, Shield, Info, ArrowLeft, Mail, Sparkles, TrendingUp, Smartphone, Layout, Zap, Lock } from 'lucide-react-native';
import { Input, Button, ConfirmationModal } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { AnimatedList, type AnimatedListItem } from '@/components/AnimatedList';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useResponsive } from '@/hooks/useResponsive';
import { createAccessibilityProps } from '@/utils/accessibility';
import i18n from '@/i18n';
import { trackPageView, trackEvent } from '@/services/analytics';
import { loadUserPreferences, saveUserPreferences } from '@/services/personalization';
import { usePreferences } from '@/contexts/PreferencesContext';
import { supabase } from '@/services/supabase';
import { requestPasswordChange } from '@/services/passwordChange';
import { analytics } from '@/analytics';
import { Linking } from 'react-native';
import { SmartNotificationsSettings } from '@/components/SmartNotificationsSettings';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

/**
 * Page Settings
 * Paramètres de l'application
 */
export function Settings() {
  const navigation = useNavigation();
  const { user, updateUser, login, register, logout } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const translation = useTranslation();
  const t = translation?.t || ((key: string) => key); // Fallback si t n'existe pas
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [notifications, setNotifications] = useState(true); // Désactivé
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { starsEnabled, setStarsEnabled } = usePreferences();
  const [selectedTheme, setSelectedTheme] = useState<'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy' | 'minimal'>(user?.theme || 'default');
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'ar' | 'en'>(i18n.language as 'fr' | 'ar' | 'en' || 'fr');
  const { isDarkMode, preference: darkModePreference, setPreference: setDarkModePreference } = useDarkMode();
  const { isTablet } = useResponsive();
  const { preferences, updatePreferences } = usePreferences();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(preferences.analyticsConsent ?? false);
  
  // Charger les préférences utilisateur au démarrage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const loadedPreferences = await loadUserPreferences();
        setAnalyticsEnabled(loadedPreferences.analyticsConsent ?? false);
        // if (loadedPreferences.notificationsEnabled !== undefined) {
        //   setNotifications(loadedPreferences.notificationsEnabled);
        // }
      } catch (error) {
        // Erreur silencieuse
      }
    };
    loadPreferences();
  }, []);

  // Mettre à jour analyticsEnabled quand preferences change
  useEffect(() => {
    setAnalyticsEnabled(preferences.analyticsConsent ?? false);
  }, [preferences.analyticsConsent]);

  // Mettre à jour selectedLanguage quand la langue change
  useEffect(() => {
    const currentLang = i18n.language as 'fr' | 'ar' | 'en';
    if (currentLang && ['fr', 'ar', 'en'].includes(currentLang)) {
      setSelectedLanguage(currentLang);
    }
  }, [i18n.language]);
  
  // Animation pour le changement de thème
  const themeAnimationProgress = useSharedValue(0);
  const [previousThemeId, setPreviousThemeId] = useState(user?.theme || 'default');
  const currentThemeId = user?.theme || 'default';

  useEffect(() => {
    // Démarrer l'animation quand le thème change
    if (previousThemeId !== currentThemeId) {
      themeAnimationProgress.value = 0;
      themeAnimationProgress.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      setPreviousThemeId(currentThemeId);
    }
  }, [currentThemeId, previousThemeId]);

  // Styles animés pour la transition de couleur
  // Utiliser directement l'objet themes car getTheme ne peut pas être appelé dans un worklet
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const oldTheme = themes[previousThemeId] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    
    return {
      backgroundColor: interpolateColor(
        themeAnimationProgress.value,
        [0, 1],
        [oldTheme.colors.background, newTheme.colors.background]
      ),
    };
  });

  const animatedBackgroundSecondaryStyle = useAnimatedStyle(() => {
    const oldTheme = themes[previousThemeId] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    
    return {
      backgroundColor: interpolateColor(
        themeAnimationProgress.value,
        [0, 1],
        [oldTheme.colors.backgroundSecondary, newTheme.colors.backgroundSecondary]
      ),
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const oldTheme = themes[previousThemeId] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    
    return {
      color: interpolateColor(
        themeAnimationProgress.value,
        [0, 1],
        [oldTheme.colors.text, newTheme.colors.text]
      ),
    };
  });

  const animatedAccentStyle = useAnimatedStyle(() => {
    const oldTheme = themes[previousThemeId] || themes.default;
    const newTheme = themes[currentThemeId] || themes.default;
    
    return {
      color: interpolateColor(
        themeAnimationProgress.value,
        [0, 1],
        [oldTheme.colors.accent, newTheme.colors.accent]
      ),
    };
  });

  const handleThemeChange = async (themeId: string) => {
    setSelectedTheme(themeId as 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy' | 'minimal');
    updateUser({ theme: themeId as 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy' | 'minimal' });
    await saveUserPreferences({ theme: themeId });
    trackEvent('theme_changed', { theme: themeId });
  };

  const handleLanguageChange = async (lang: 'fr' | 'ar' | 'en') => {
    try {
      await changeLanguage(lang);
      setSelectedLanguage(lang);
      await saveUserPreferences({ language: lang });
      trackEvent('language_changed', { language: lang });
    } catch (error) {
      // Erreur silencieuse en production
    }
  };

  const handleStarsEnabledChange = async (enabled: boolean) => {
    await setStarsEnabled(enabled);
    trackEvent('stars_enabled_changed', { enabled });
  };

  const handleAnalyticsToggle = async (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    
    try {
      // Mettre à jour les préférences
      await saveUserPreferences({ analyticsConsent: enabled });
      
      // Mettre à jour analytics
      if (enabled) {
        analytics.optIn();
      } else {
        await analytics.optOut();
      }
      
      // Mettre à jour le contexte
      await updatePreferences({ analyticsConsent: enabled });
    } catch (error) {
      console.error('[Settings] Error toggling analytics:', error);
      // Revert toggle on error
      setAnalyticsEnabled(!enabled);
      Alert.alert(
        t('common.error') || 'Erreur',
        t('settings.analyticsToggleError') || 'Erreur lors de la modification des paramètres'
      );
    }
  };

  const handleOpenPrivacyPolicy = () => {
    const url = 'https://www.nurayna.com/privacy-policy.html';
    Linking.openURL(url).catch((err) => {
      console.error('[Settings] Failed to open privacy policy:', err);
      Alert.alert(
        t('common.error') || 'Erreur',
        t('settings.cannotOpenLink') || 'Impossible d\'ouvrir le lien'
      );
    });
  };

  const handleOpenTerms = () => {
    const url = 'https://www.nurayna.com/terms.html';
    Linking.openURL(url).catch((err) => {
      console.error('[Settings] Failed to open terms:', err);
      Alert.alert(
        t('common.error') || 'Erreur',
        t('settings.cannotOpenLink') || 'Impossible d\'ouvrir le lien'
      );
    });
  };

  const handleUpdateLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('settings.permissionDenied'), t('settings.permissionMessage'));
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // Récupérer le nom de la ville via reverse geocoding
      let city = '';
      try {
        // Essayer avec plusieurs endpoints et formats
        const endpoints = [
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`,
        ];

        for (const url of endpoints) {
          try {
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'AYNA Mobile App',
                'Accept': 'application/json',
              },
              timeout: 10000, // 10 secondes de timeout
            } as any);

            // Vérifier que la réponse est bien du JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const text = await response.text();
              // Réponse non-JSON
              continue; // Essayer le prochain endpoint
            }

            if (!response.ok) {
              // Erreur API
              continue;
            }

            const data = await response.json();
            
            // Essayer plusieurs champs possibles pour le nom de la ville
            const address = data.address || {};
            city = address.city || 
                   address.town || 
                   address.village || 
                   address.municipality ||
                   address.county ||
                   address.state_district ||
                   address.region ||
                   address.state ||
                   '';
            
            if (city) {
              break; // On a trouvé une ville, on peut arrêter
            }
          } catch (endpointError) {
            // Erreur avec endpoint
            continue; // Essayer le prochain endpoint
          }
        }

        if (!city) {
          // Si aucun endpoint n'a fonctionné, essayer une dernière fois avec une requête simplifiée
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              {
                headers: {
                  'User-Agent': 'AYNA Mobile App',
                  'Accept': 'application/json',
                },
              }
            );
            
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                const address = data.address || {};
                city = address.city || 
                       address.town || 
                       address.village || 
                       address.municipality ||
                       address.county ||
                       '';
              }
            }
          } catch (finalError) {
            // Dernière tentative échouée
          }
        }

        updateUser({ location: { latitude, longitude, city } });
        
        if (city) {
          Alert.alert(t('settings.success'), t('settings.locationUpdated', { city }));
        } else {
          Alert.alert(t('settings.success'), t('settings.locationUpdatedNoCity'));
        }
      } catch (error) {
        // Erreur silencieuse en production
        // Sauvegarder quand même les coordonnées même si on n'a pas le nom de la ville
        updateUser({ location: { latitude, longitude, city: '' } });
        Alert.alert(t('settings.success'), t('settings.locationUpdatedNoCity'));
      }
    } catch (error: any) {
      // Erreur silencieuse en production
      Alert.alert(t('settings.error'), t('settings.locationError'));
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('settings.error'), t('settings.fillAllFields'));
      return;
    }
    if (!login) {
      Alert.alert(t('settings.error'), t('settings.loginUnavailable'));
      return;
    }
    try {
      await login(email, password);
      Alert.alert(t('settings.success'), t('settings.loginSuccess'));
      setEmail('');
      setPassword('');
    } catch (error: any) {
      Alert.alert(t('settings.error'), error.message || t('settings.loginFailed'));
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('settings.error'), t('settings.fillAllFields'));
      return;
    }
    if (!register) {
      Alert.alert(t('settings.error'), t('settings.registerUnavailable'));
      return;
    }
    try {
      const name = email.split('@')[0];
      await register(name, email, password);
      Alert.alert(t('settings.success'), t('settings.registerSuccess'));
      setEmail('');
      setPassword('');
    } catch (error: any) {
      Alert.alert(t('settings.error'), error.message || t('settings.registerFailed'));
    }
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout?.();
  };

  const handleVerifyEmail = async () => {
    if (!user?.email) {
      Alert.alert(
        t('common.error'),
        t('settings.emailVerification.error.noEmail') || 'Email non disponible'
      );
      return;
    }

    if (!supabase) {
      Alert.alert(
        t('common.error'),
        t('settings.supabaseNotConfigured') || 'Supabase n\'est pas configuré.'
      );
      return;
    }

    try {
      console.log('[Settings] Demande de vérification email pour:', user.email);
      console.log('[Settings] User ID:', user?.id);
      
      // Vérifier et rafraîchir la session si nécessaire
      let sessionValid = false;
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        console.log('[Settings] Pas de session active, tentative de rafraîchissement');
        
        // Si pas de session, essayer de se reconnecter silencieusement
        // ou demander à l'utilisateur de se reconnecter
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous déconnecter et vous reconnecter, puis réessayez.',
          [
            {
              text: 'Annuler',
              style: 'cancel',
            },
            {
              text: 'Se déconnecter',
              onPress: () => {
                if (logout) logout();
              },
            },
          ]
        );
        return;
      }
      
      sessionValid = true;
      console.log('[Settings] Session valide trouvée');
      
      // Utiliser le service dédié pour la vérification d'email
      console.log('[Settings] Import du service emailVerification...');
      const { sendVerificationEmail } = await import('@/services/emailVerification');
      console.log('[Settings] Service importé, appel de sendVerificationEmail...');
      const result = await sendVerificationEmail(user.email, 'signup');
      console.log('[Settings] Résultat de sendVerificationEmail:', result);

      if (!result.success) {
        console.error('[Settings] Erreur envoi email:', result.error);
        
        // Si l'erreur est liée à la session, proposer de se reconnecter
        if (result.error?.includes('session') || result.error?.includes('connecté')) {
          Alert.alert(
            'Session expirée',
            'Votre session a expiré. Veuillez vous déconnecter et vous reconnecter, puis réessayez.',
            [
              {
                text: 'Annuler',
                style: 'cancel',
              },
              {
                text: 'Se déconnecter',
                onPress: () => {
                  if (logout) logout();
                },
              },
            ]
          );
          return;
        }
        
        Alert.alert(
          t('common.error') || 'Erreur',
          result.error || t('settings.emailVerification.sendFailed') || 'Erreur lors de l\'envoi de l\'email'
        );
        return;
      }

      console.log('[Settings] Email envoyé avec succès');
      Alert.alert(
        t('settings.emailVerification.emailSent') || 'Email envoyé',
        (t('settings.emailVerification.emailSentMessage') ||
          'Un email de vérification a été envoyé à {{email}}. Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.').replace('{{email}}', user.email)
      );
      
      trackEvent('email_verification_requested', { email: user.email });
    } catch (error: any) {
      console.error('[Settings] Erreur inattendue lors de l\'envoi de l\'email:', error);
      Alert.alert(
        t('common.error') || 'Erreur',
        error.message || t('settings.emailVerification.sendFailed') || 'Erreur lors de l\'envoi de l\'email'
      );
    }
  };

  return (
    <Animated.View style={[styles.wrapper, animatedBackgroundStyle]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          animatedBackgroundSecondaryStyle,
          { opacity: 0.5 }
        ]}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
      
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {/* Header */}
            <Animated.View style={styles.header}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <View>
                  <ArrowLeft size={24} color={theme.colors.text} />
                </View>
              </Pressable>
              <Animated.Text style={[styles.title, animatedTextStyle]}>
                {t('settings.title') || 'Paramètres'}
              </Animated.Text>
            </Animated.View>

          {/* Privacy Section */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Shield size={24} color={theme.colors.accent} />
              </View>
              <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                {t('settings.privacy') || 'Confidentialité'}
              </Animated.Text>
            </View>
            
            {/* Analytics Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelContainer}>
                <Animated.Text style={[styles.toggleLabel, animatedTextStyle]}>
                  {t('settings.analytics') || 'Statistiques d\'utilisation'}
                </Animated.Text>
                <Animated.Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
                  {t('settings.analyticsDesc') || 'Les statistiques nous aident à améliorer l\'application. Elles sont anonymes et optionnelles.'}
                </Animated.Text>
              </View>
              <Switch
                value={analyticsEnabled}
                onValueChange={handleAnalyticsToggle}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>

            {/* Privacy Policy Link */}
            <Pressable
              onPress={handleOpenPrivacyPolicy}
              style={({ pressed }) => [
                styles.linkRow,
                pressed && styles.linkRowPressed,
              ]}
            >
              <Animated.Text style={[styles.linkText, animatedTextStyle]}>
                {t('settings.privacyPolicy') || 'Politique de confidentialité'}
              </Animated.Text>
              <Animated.Text style={[styles.linkArrow, { color: theme.colors.textSecondary }]}>
                →
              </Animated.Text>
            </Pressable>

            {/* Terms Link */}
            <Pressable
              onPress={handleOpenTerms}
              style={({ pressed }) => [
                styles.linkRow,
                pressed && styles.linkRowPressed,
              ]}
            >
              <Animated.Text style={[styles.linkText, animatedTextStyle]}>
                {t('settings.terms') || 'Conditions d\'utilisation'}
              </Animated.Text>
              <Animated.Text style={[styles.linkArrow, { color: theme.colors.textSecondary }]}>
                →
              </Animated.Text>
            </Pressable>
          </View>

          {/* Smart Notifications Section */}
          <SmartNotificationsSettings theme={theme} />

          {/* Analytics Section */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Pressable
              onPress={() => navigation.navigate('Analytics' as never)}
              style={({ pressed }) => [
                pressed && styles.sectionRowPressed,
              ]}
            >
              <View style={styles.sectionHeader}>
                <View>
                  <TrendingUp size={24} color={theme.colors.accent} />
                </View>
                <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                  {t('settings.analyticsInsights') || 'Analyses & Statistiques'}
                </Animated.Text>
              </View>
            </Pressable>
          </View>
          
          {/* Theme Creator Section */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Pressable
              onPress={() => navigation.navigate('ThemeCreator' as never)}
              style={({ pressed }) => [
                pressed && styles.sectionRowPressed,
              ]}
            >
              <View style={styles.sectionHeader}>
                <View>
                  <Sparkles size={24} color={theme.colors.accent} />
                </View>
                <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                  {t('settings.themeCreator') || 'Créer un thème'}
                </Animated.Text>
              </View>
            </Pressable>
          </View>

          {/* Widgets Section */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Pressable
              onPress={() => navigation.navigate('WidgetsSettings' as never)}
              style={({ pressed }) => [
                pressed && styles.sectionRowPressed,
              ]}
            >
              <View style={styles.sectionHeader}>
                <View>
                  <Smartphone size={24} color={theme.colors.accent} />
                </View>
                <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                  {t('settings.widgets') || 'Widgets iOS/Android'}
                </Animated.Text>
              </View>
            </Pressable>
          </View>

          {/* Home Widgets Section */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Pressable
              onPress={() => navigation.navigate('HomeWidgetsSettings' as never)}
              style={({ pressed }) => [
                pressed && styles.sectionRowPressed,
              ]}
            >
              <View style={styles.sectionHeader}>
                <View>
                  <Layout size={24} color={theme.colors.accent} />
                </View>
                <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                  {t('settings.homeWidgets') || 'Widgets Accueil'}
                </Animated.Text>
              </View>
            </Pressable>
          </View>

          {/* Shortcuts Section */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Pressable
              onPress={() => navigation.navigate('ShortcutsSettings' as never)}
              style={({ pressed }) => [
                pressed && styles.sectionRowPressed,
              ]}
            >
              <View style={styles.sectionHeader}>
                <View>
                  <Zap size={24} color={theme.colors.accent} />
                </View>
                <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                  {t('settings.shortcuts') || 'Raccourcis'}
                </Animated.Text>
              </View>
            </Pressable>
          </View>

          {/* Themes Section */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Moon size={24} color={theme.colors.accent} />
              </View>
              <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                {t('settings.theme') || 'Thèmes'}
              </Animated.Text>
            </View>

            <View style={styles.themeListContainer}>
              <AnimatedList
                data={Object.values(themes).map((themeOption) => ({
                  id: themeOption.id,
                  label: themeOption.name,
                  value: themeOption,
                }))}
                selectedItemId={selectedTheme}
                onItemSelect={(item) => handleThemeChange(item.id)}
                itemHeight={80}
                gradientHeight={30}
                scrollEnabled={false}
                gradientColors={{
                  top: [theme.colors.backgroundSecondary, 'transparent'],
                  bottom: ['transparent', theme.colors.backgroundSecondary],
                }}
                renderItem={(item, index, isSelected) => {
                  const themeOption = item.value;
                  return (
                    <View
                      style={[
                        styles.themeListItem,
                        isSelected && {
                          borderColor: theme.colors.accent,
                          borderWidth: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      ]}
                    >
                      <View style={styles.themePreview}>
                        <View
                          style={[
                            styles.themeColorBox,
                            { backgroundColor: themeOption.colors.primary },
                          ]}
                        />
                        <View
                          style={[
                            styles.themeColorBox,
                            { backgroundColor: themeOption.colors.secondary },
                          ]}
                        />
                        <View
                          style={[
                            styles.themeColorBox,
                            { backgroundColor: themeOption.colors.accent },
                          ]}
                        />
                      </View>
                      <Text style={[styles.themeName, { color: theme.colors.text }]}>
                        {themeOption.name}
                      </Text>
                      {isSelected && (
                        <View style={[styles.checkmark, { backgroundColor: theme.colors.accent }]}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </View>
                  );
                }}
                contentContainerStyle={styles.themeListContent}
                style={styles.themeList}
              />
            </View>
          </View>

          {/* Language Section */}
          <Animated.View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Globe size={24} color={theme.colors.accent} />
              </View>
              <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                {t('settings.language') || 'Langue'}
              </Animated.Text>
            </View>
            <View style={styles.languageSelector}>
              {(['fr', 'ar', 'en'] as const).map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => handleLanguageChange(lang)}
                  style={[
                    styles.languageOption,
                    selectedLanguage === lang && {
                      borderColor: theme.colors.accent,
                      borderWidth: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  ]}
                >
                  <Animated.Text style={[styles.languageName, animatedTextStyle]}>
                    {lang === 'fr' ? 'Français' : lang === 'ar' ? 'العربية' : 'English'}
                  </Animated.Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Notifications - DÉSACTIVÉ */}
          {/* <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.sectionHeader}>
              <Animated.View>
                <Bell size={24} color={theme.colors.accent} />
              </Animated.View>
              <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                {t('settings.notifications') || 'Notifications'}
              </Animated.Text>
            </View>
            <View style={styles.toggleRow}>
              <Animated.Text style={[styles.toggleLabel, animatedTextStyle]}>
                {t('settings.prayerReminders')}
              </Animated.Text>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>
          </View> */}

          {/* Sound */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.sectionHeader}>
              <Animated.View>
                <Volume2 size={24} color={theme.colors.accent} />
              </Animated.View>
              <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                {t('settings.sound') || 'Son'}
              </Animated.Text>
            </View>
            <View style={styles.toggleRow}>
              <Animated.Text style={[styles.toggleLabel, animatedTextStyle]}>
                {t('settings.enableSound') || 'Activer le son'}
              </Animated.Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Stars Background */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.sectionHeader}>
              <Animated.View>
                <Sparkles size={24} color={theme.colors.accent} />
              </Animated.View>
              <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                {t('settings.stars') || 'Étoiles'}
              </Animated.Text>
            </View>
            <View style={styles.toggleRow}>
              <Animated.Text style={[styles.toggleLabel, animatedTextStyle]}>
                {t('settings.enableStars') || 'Afficher les étoiles'}
              </Animated.Text>
              <Switch
                value={starsEnabled}
                onValueChange={handleStarsEnabledChange}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Location */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.sectionHeader}>
              <Animated.View>
                <Globe size={24} color={theme.colors.accent} />
              </Animated.View>
              <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                {t('settings.location') || 'Localisation'}
              </Animated.Text>
            </View>
            <Animated.Text style={[styles.locationText, animatedTextStyle]}>
              {user?.location?.city || (t('settings.notDefined') || 'Non définie')}
            </Animated.Text>
            <Button
              variant="default"
              onPress={handleUpdateLocation}
              style={styles.updateButton}
            >
              {t('settings.updateLocation')}
            </Button>
          </View>

          {/* Synchronisation */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.sectionHeader}>
              <Animated.View>
                <Shield size={24} color={theme.colors.accent} />
              </Animated.View>
              <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                {t('settings.synchronization') || 'Synchronisation'}
              </Animated.Text>
            </View>
            <Animated.Text style={[styles.syncStatus, animatedTextStyle]}>
              {t('settings.status')}: {user?.id ? t('settings.connected') : t('settings.disconnected')}
            </Animated.Text>
            {!user?.id ? (
              <View style={styles.authForm}>
                <Input
                  label={t('auth.email')}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  containerStyle={styles.inputContainer}
                />
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.password')}
                  style={styles.inputContainer}
                />
                <View style={styles.authButtons}>
                  <View style={styles.authButtonWrapper}>
                    <Button
                      variant="default"
                      onPress={handleLogin}
                      style={styles.authButton}
                    >
                      {t('settings.login')}
                    </Button>
                  </View>
                  <View style={styles.authButtonWrapper}>
                    <Button
                      variant="default"
                      onPress={handleRegister}
                      style={styles.authButton}
                    >
                      {t('settings.signup')}
                    </Button>
                  </View>
                </View>
              </View>
            ) : (
              <Button
                variant="default"
                onPress={handleLogout}
                style={styles.logoutButton}
              >
                {t('settings.logout')}
              </Button>
            )}
          </View>

          {/* Email Verification */}
          {user?.id && user?.email && (
            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <View style={styles.sectionHeader}>
                <Animated.View>
                  <Mail size={24} color={theme.colors.accent} />
                </Animated.View>
                <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                  {t('settings.emailVerification.title') || 'Vérification Email'}
                </Animated.Text>
              </View>
              <Animated.Text style={[styles.emailText, animatedTextStyle]}>
                {user.email}
              </Animated.Text>
              <Animated.Text style={[styles.emailStatus, animatedTextStyle]}>
                {user.emailVerified 
                  ? t('settings.emailVerification.verified') || '✓ Email vérifié'
                  : t('settings.emailVerification.notVerified') || '⚠ Email non vérifié'}
              </Animated.Text>
              {!user.emailVerified && (
                <Button
                  variant="default"
                  onPress={handleVerifyEmail}
                  style={styles.verifyButton}
                >
                  {t('settings.emailVerification.verifyButton') || 'Vérifier l\'adresse email'}
                </Button>
              )}
            </View>
          )}

          {/* Change Password */}
          {user?.id && user?.email && (
            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <View style={styles.sectionHeader}>
                <Animated.View>
                  <Lock size={24} color={theme.colors.accent} />
                </Animated.View>
                <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                  {t('settings.changePassword.title') || 'Changer le mot de passe'}
                </Animated.Text>
              </View>
              <Animated.Text style={[styles.locationText, animatedTextStyle]}>
                {t('settings.changePassword.description') || 'Un email de confirmation vous sera envoyé pour changer votre mot de passe.'}
              </Animated.Text>
              <Button
                variant="outline"
                onPress={async () => {
                  try {
                    const result = await requestPasswordChange(
                      user.email!,
                      user.name,
                      user.id,
                      'settings'
                    );

                    if (result.success) {
                      Alert.alert(
                        t('common.success'),
                        (t('settings.changePassword.emailSent') || 'Un email de confirmation a été envoyé à {{email}}. Veuillez vérifier votre boîte mail et cliquer sur le lien pour changer votre mot de passe.').replace('{{email}}', user.email!)
                      );
                      trackEvent('password_change_requested', { from: 'settings' });
                    } else {
                      Alert.alert(
                        t('common.error'),
                        result.error || t('settings.changePassword.error.sendFailed') || 'Erreur lors de l\'envoi de l\'email de confirmation'
                      );
                    }
                  } catch (error: any) {
                    Alert.alert(
                      t('common.error'),
                      error.message || t('settings.changePassword.error.sendFailed') || 'Erreur lors de l\'envoi de l\'email de confirmation'
                    );
                  }
                }}
                style={styles.updateButton}
              >
                {t('settings.changePassword.button') || 'Demander un changement de mot de passe'}
              </Button>
            </View>
          )}

          {/* About */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.sectionHeader}>
              <Animated.View>
                <Info size={24} color={theme.colors.accent} />
              </Animated.View>
              <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                {t('settings.about') || 'À propos'}
              </Animated.Text>
            </View>
            <Animated.Text style={[styles.aboutText, animatedTextStyle]}>
              {t('settings.appName')}{'\n'}
              {t('settings.version')}
            </Animated.Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      
      <ConfirmationModal
        visible={showLogoutModal}
        title={t('settings.logoutTitle')}
        message={t('settings.logoutConfirm')}
        confirmText={t('settings.logoutButton')}
        cancelText={t('settings.cancel')}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        confirmVariant="destructive"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'System',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
  },
  themeListContainer: {
    height: 300,
    marginTop: 12,
  },
  themeList: {
    flex: 1,
  },
  themeListContent: {
    paddingHorizontal: 4,
  },
  themeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  themePreview: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 12,
  },
  themeColorBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  themeName: {
    fontSize: 16,
    fontFamily: 'System',
    flex: 1,
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  languageOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '500',
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 4,
    lineHeight: 16,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
    borderRadius: 8,
  },
  linkRowPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'System',
    textDecorationLine: 'underline',
    flex: 1,
  },
  linkArrow: {
    fontSize: 16,
    fontFamily: 'System',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 12,
  },
  updateButton: {
    width: '100%',
  },
  syncStatus: {
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 16,
  },
  authForm: {
    gap: 12,
  },
  inputContainer: {
    marginBottom: 0,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  authButtonWrapper: {
    flex: 1,
  },
  authButton: {
    width: '100%',
  },
  logoutButton: {
    width: '100%',
  },
  emailText: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 8,
    opacity: 0.9,
  },
  emailStatus: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 16,
  },
  verifyButton: {
    width: '100%',
  },
  aboutText: {
    fontSize: 14,
    fontFamily: 'System',
    lineHeight: 20,
  },
});

