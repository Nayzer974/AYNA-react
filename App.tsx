import 'react-native-gesture-handler';
import React from 'react';
import './src/i18n'; // Initialiser i18n
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { UserProvider, useUser } from './src/contexts/UserContext';
import { QuranProvider } from './src/contexts/QuranContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { getTheme } from './src/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAutoSync } from './src/hooks/useAutoSync';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';

function AppContent() {
  const { user, isLoading } = useUser();
  const theme = getTheme(user?.theme || 'default');
  
  // Activer la synchronisation automatique offline/online
  useAutoSync();

  // Afficher un écran de chargement pendant l'initialisation
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <UserProvider>
        <QuranProvider>
          <AppContent />
        </QuranProvider>
      </UserProvider>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'System',
  },
});
