import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme, themes } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Moon, Volume2, Globe, Shield, Info, ArrowLeft, Mail } from 'lucide-react-native';
import { Input, Button } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import i18n from '@/i18n';
import { trackPageView, trackEvent } from '@/services/analytics';
import { loadUserPreferences, saveUserPreferences } from '@/services/personalization';
import { supabase } from '@/services/supabase';
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
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(user?.theme || 'default');
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'ar' | 'en'>(i18n.language as 'fr' | 'ar' | 'en' || 'fr');
  
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
    setSelectedTheme(themeId as 'default' | 'ocean' | 'sunset' | 'forest' | 'royal');
    updateUser({ theme: themeId as 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' });
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
      console.error('Erreur lors du changement de langue:', error);
    }
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
              console.warn('Réponse non-JSON:', text.substring(0, 100));
              continue; // Essayer le prochain endpoint
            }

            if (!response.ok) {
              console.warn(`Erreur API ${response.status} pour ${url}`);
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
            console.warn('Erreur avec endpoint:', url, endpointError);
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
            console.warn('Dernière tentative échouée:', finalError);
          }
        }

        updateUser({ location: { latitude, longitude, city } });
        
        if (city) {
          Alert.alert(t('settings.success'), t('settings.locationUpdated', { city }));
        } else {
          Alert.alert(t('settings.success'), t('settings.locationUpdatedNoCity'));
        }
      } catch (error) {
        console.error('Erreur reverse geocoding:', error);
        // Sauvegarder quand même les coordonnées même si on n'a pas le nom de la ville
        updateUser({ location: { latitude, longitude, city: '' } });
        Alert.alert(t('settings.success'), t('settings.locationUpdatedNoCity'));
      }
    } catch (error: any) {
      console.error('Erreur localisation:', error);
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

  const handleLogout = () => {
    Alert.alert(
      t('settings.logoutTitle'),
      t('settings.logoutConfirm'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        { text: t('settings.logoutButton'), style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleVerifyEmail = async () => {
    if (!user?.email || !supabase) {
      Alert.alert(
        t('common.error'),
        t('settings.emailVerification.error.noEmail') || 'Email non disponible'
      );
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: 'https://www.nurayna.com/verify-email.html',
        },
      });

      if (error) throw error;

      Alert.alert(
        t('emailVerification.emailSent'),
        t('emailVerification.emailSentMessage')
      );
      
      trackEvent('email_verification_requested', { email: user.email });
    } catch (error: any) {
      console.error('Erreur envoi email de vérification:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('emailVerification.sendFailed')
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

          {/* Themes Section */}
          <Animated.View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Moon size={24} color={theme.colors.accent} />
              </View>
              <Animated.Text style={[styles.sectionTitle, animatedTextStyle]}>
                {t('settings.theme') || 'Thèmes'}
              </Animated.Text>
            </View>

            <View style={styles.themeSelector}>
              {Object.values(themes).map((themeOption) => (
                <Pressable
                  key={themeOption.id}
                  onPress={() => handleThemeChange(themeOption.id)}
                  style={[
                    styles.themeOption,
                    selectedTheme === themeOption.id && {
                      borderColor: theme.colors.accent,
                      borderWidth: 2,
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
                  <Animated.Text style={[styles.themeName, animatedTextStyle]}>
                    {themeOption.name}
                  </Animated.Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

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

          {/* Notifications */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
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
          </View>

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
                {t('settings.enableSound')}
              </Animated.Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
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
              {user?.location?.city || t('settings.notDefined')}
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
  themeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
  },
  themePreview: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  themeColorBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  themeName: {
    fontSize: 12,
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

