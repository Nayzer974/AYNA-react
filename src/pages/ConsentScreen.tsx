/**
 * ConsentScreen - Écran de consentement analytics (GDPR)
 * 
 * HARD OPT-IN: L'application ne peut pas être utilisée tant que
 * l'utilisateur n'a pas fait un choix explicite.
 * 
 * Aucun analytics n'est envoyé avant consent === true
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Check, X } from 'lucide-react-native';
import { analytics } from '@/analytics';
import { saveUserPreferences } from '@/services/personalization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@ayna_analytics_consent';
const CONSENT_CHOICE_MADE_KEY = '@ayna_analytics_consent_choice_made';

interface ConsentScreenProps {
  onConsentChoice: (consented: boolean) => void;
}

export function ConsentScreen({ onConsentChoice }: ConsentScreenProps) {
  const { t, i18n } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  // Déterminer la langue actuelle
  const isEnglish = i18n.language === 'en';
  const isArabic = i18n.language === 'ar';

  // Texte FR (défaut)
  let title = 'Respect de votre vie privée';
  let mainText = `Nous souhaitons améliorer AYNA tout en respectant pleinement votre vie privée.

Avec votre accord, nous collectons des données d'utilisation anonymes et limitées, telles que :
• les fonctionnalités utilisées,
• la navigation dans l'application,
• des informations techniques générales (type d'appareil, version de l'application).

Ce que nous ne collectons jamais :
• le contenu de votre journal,
• vos messages,
• vos intentions ou pratiques spirituelles,
• votre localisation précise,
• vos données personnelles sensibles.

L'activation des statistiques est entièrement optionnelle.

Vous pouvez changer d'avis à tout moment dans les paramètres.`;
  let enableButton = 'Activer les statistiques';
  let declineButton = 'Continuer sans statistiques';
  let footerText = 'En continuant, vous acceptez notre';
  let privacyLink = 'Politique de confidentialité';
  let termsLink = 'Conditions d\'utilisation';
  let andText = 'et nos';

  // Texte EN
  if (isEnglish) {
    title = 'Respect for Your Privacy';
    mainText = `We want to improve AYNA while fully respecting your privacy.

With your consent, we collect limited and anonymous usage data, such as:
• features used,
• navigation within the application,
• general technical information (device type, application version).

What we never collect:
• your journal content,
• your messages,
• your intentions or spiritual practices,
• your precise location,
• your sensitive personal data.

Enabling statistics is entirely optional.

You can change your mind at any time in settings.`;
    enableButton = 'Enable Statistics';
    declineButton = 'Continue Without Statistics';
    footerText = 'By continuing, you accept our';
    privacyLink = 'Privacy Policy';
    termsLink = 'Terms & Conditions';
    andText = 'and our';
  }

  // Texte AR (si nécessaire - utiliser FR comme fallback)
  if (isArabic) {
    // TODO: Traduction arabe si nécessaire
    // Pour l'instant, utiliser le français
  }

  const handleEnable = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // CRITICAL: Set consent FIRST before any analytics operations
      analytics.setConsent(true);
      
      // Enregistrer le choix
      await AsyncStorage.setItem(CONSENT_KEY, 'true');
      await AsyncStorage.setItem(CONSENT_CHOICE_MADE_KEY, 'true');

      // Sauvegarder dans les préférences
      await saveUserPreferences({ analyticsConsent: true });

      // Notifier le parent
      onConsentChoice(true);
    } catch (error) {
      console.error('[ConsentScreen] Error enabling analytics:', error);
      Alert.alert(
        isEnglish ? 'Error' : 'Erreur',
        isEnglish
          ? 'An error occurred. Please try again.'
          : 'Une erreur est survenue. Veuillez réessayer.'
      );
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // CRITICAL: Set consent to false FIRST
      analytics.setConsent(false);
      
      // Enregistrer le choix
      await AsyncStorage.setItem(CONSENT_KEY, 'false');
      await AsyncStorage.setItem(CONSENT_CHOICE_MADE_KEY, 'true');

      // Sauvegarder dans les préférences
      await saveUserPreferences({ analyticsConsent: false });

      // Notifier le parent
      onConsentChoice(false);
    } catch (error) {
      console.error('[ConsentScreen] Error declining analytics:', error);
      Alert.alert(
        isEnglish ? 'Error' : 'Erreur',
        isEnglish
          ? 'An error occurred. Please try again.'
          : 'Une erreur est survenue. Veuillez réessayer.'
      );
      setIsProcessing(false);
    }
  };

  const handlePrivacyPolicy = () => {
    const url = 'https://www.nurayna.com/privacy-policy.html';
    Linking.openURL(url).catch((err) => {
      console.error('[ConsentScreen] Failed to open privacy policy:', err);
      Alert.alert(
        isEnglish ? 'Error' : 'Erreur',
        isEnglish
          ? 'Could not open the privacy policy.'
          : 'Impossible d\'ouvrir la politique de confidentialité.'
      );
    });
  };

  const handleTerms = () => {
    const url = 'https://www.nurayna.com/terms.html';
    Linking.openURL(url).catch((err) => {
      console.error('[ConsentScreen] Failed to open terms:', err);
      Alert.alert(
        isEnglish ? 'Error' : 'Erreur',
        isEnglish
          ? 'Could not open the terms & conditions.'
          : 'Impossible d\'ouvrir les conditions d\'utilisation.'
      );
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#0A0F2C', '#1A1F3C', '#2A2F4C']}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Shield size={64} color="#FFD369" />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Main Text */}
          <Text style={styles.mainText}>{mainText}</Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Enable Button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.enableButton,
                pressed && styles.buttonPressed,
                isProcessing && styles.buttonDisabled,
              ]}
              onPress={handleEnable}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={['#FFD369', '#FFA500']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Check size={20} color="#000" style={styles.buttonIcon} />
                <Text style={styles.enableButtonText}>{enableButton}</Text>
              </LinearGradient>
            </Pressable>

            {/* Decline Button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.declineButton,
                pressed && styles.buttonPressed,
                isProcessing && styles.buttonDisabled,
              ]}
              onPress={handleDecline}
              disabled={isProcessing}
            >
              <X size={20} color="#FFD369" style={styles.buttonIcon} />
              <Text style={styles.declineButtonText}>{declineButton}</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            {footerText}{' '}
            <Text style={styles.link} onPress={handlePrivacyPolicy}>
              {privacyLink}
            </Text>{' '}
            {andText}{' '}
            <Text style={styles.link} onPress={handleTerms}>
              {termsLink}
            </Text>
            .
          </Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 211, 105, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 36,
  },
  mainText: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 32,
    width: '100%',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGradient: {
    width: '100%',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
  },
  enableButton: {
    elevation: 4,
    shadowColor: '#FFD369',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#FFD369',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD369',
  },
  footerText: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
  link: {
    color: '#FFD369',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});

/**
 * Helper function to check if consent has been given
 */
export async function hasAnalyticsConsent(): Promise<boolean> {
  try {
    const consent = await AsyncStorage.getItem(CONSENT_KEY);
    return consent === 'true';
  } catch {
    return false;
  }
}

/**
 * Helper function to check if user has made a choice (even if declined)
 */
export async function hasConsentChoiceBeenMade(): Promise<boolean> {
  try {
    const choiceMade = await AsyncStorage.getItem(CONSENT_CHOICE_MADE_KEY);
    return choiceMade === 'true';
  } catch {
    return false;
  }
}

