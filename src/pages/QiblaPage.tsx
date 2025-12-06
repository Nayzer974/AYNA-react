import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Compass, AlertCircle, Loader, ArrowLeft } from 'lucide-react-native';
import { useQibla } from '@/hooks/useQibla';
import { QiblaCompass } from '@/components/QiblaCompass';
import { QiblaInfo } from '@/components/QiblaInfo';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { useTranslation } from 'react-i18next';

/**
 * Page Qibla complète
 * Affiche une boussole qui pointe vers la Kaaba en utilisant :
 * - L'API AlAdhan pour obtenir la direction Qibla
 * - Les capteurs du téléphone (magnétomètre) pour l'orientation
 * - Une rotation calculée pour pointer vers la Kaaba
 */
export function QiblaPage() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();
  
  const {
    qiblaAngle,
    deviceHeading,
    rotation,
    loading,
    error,
    permissionGranted,
    isSupported,
    requestPermissionsAndStart,
  } = useQibla();

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
      
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </Pressable>

          {/* Titre */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('qibla.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('qibla.subtitle')}
            </Text>
          </View>

          {/* Message d'erreur */}
          {error && (
            <View style={[styles.errorCard, { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)' }]}>
              <AlertCircle size={20} color="#ef4444" />
              <View style={styles.errorContent}>
                <Text style={[styles.errorTitle, { color: '#ef4444' }]}>
                  {t('qibla.error')}
                </Text>
                <Text style={[styles.errorText, { color: '#fca5a5' }]}>
                  {error}
                </Text>
              </View>
            </View>
          )}

          {/* Message de support */}
          {!isSupported && !error && (
            <View style={[styles.warningCard, { backgroundColor: 'rgba(234, 179, 8, 0.2)', borderColor: 'rgba(234, 179, 8, 0.5)' }]}>
              <AlertCircle size={20} color="#eab308" />
              <View style={styles.warningContent}>
                <Text style={[styles.warningTitle, { color: '#eab308' }]}>
                  {t('qibla.sensorNotAvailable')}
                </Text>
                <Text style={[styles.warningText, { color: '#fde047' }]}>
                  {t('qibla.sensorNotAvailableMessage')}
                </Text>
              </View>
            </View>
          )}

          {/* État de chargement */}
          {loading && (
            <View style={styles.loadingContainer}>
              <Loader size={32} color={theme.colors.textSecondary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                {t('qibla.loading')}
              </Text>
            </View>
          )}

          {/* Bouton d'activation */}
          {!permissionGranted && isSupported && !error && !loading && (
            <View style={styles.activationContainer}>
              <Pressable
                onPress={requestPermissionsAndStart}
                style={[styles.activateButton, { backgroundColor: theme.colors.accent }]}
              >
                <Compass size={20} color={theme.colors.background} />
                <Text style={[styles.activateButtonText, { color: theme.colors.background }]}>
                  {t('qibla.grantPermission')}
                </Text>
              </Pressable>
              <Text style={[styles.activateHint, { color: theme.colors.textSecondary }]}>
                {t('qibla.permissionMessage')}
              </Text>
            </View>
          )}

          {/* Interface principale de la boussole */}
          {permissionGranted && !error && !loading && (
            <>
              {/* Boussole avec flèche */}
              <View style={styles.compassContainer}>
                <QiblaCompass rotation={rotation} />
              </View>

              {/* Informations détaillées */}
              <View style={styles.infoContainer}>
                <QiblaInfo
                  qiblaAngle={qiblaAngle}
                  deviceHeading={deviceHeading}
                  rotation={rotation}
                />
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={[styles.instructionsText, { color: theme.colors.textSecondary }]}>
                  {t('qibla.subtitle')}
                </Text>
              </View>
            </>
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
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'System',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'System',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'System',
    marginTop: 12,
  },
  activationContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    maxWidth: 600,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  activateHint: {
    fontSize: 12,
    fontFamily: 'System',
    textAlign: 'center',
  },
  compassContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 24,
  },
  instructionsContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
  },
  instructionsText: {
    fontSize: 12,
    fontFamily: 'System',
    textAlign: 'center',
  },
});


