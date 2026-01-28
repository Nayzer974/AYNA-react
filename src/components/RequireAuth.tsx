import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { View, ActivityIndicator } from 'react-native';
import { getTheme } from '@/data/themes';

interface RequireAuthProps {
  children: React.ReactElement;
}

/**
 * Composant qui vérifie l'authentification et redirige vers Login si nécessaire
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, user, isLoading } = useUser();
  const navigation = useNavigation();
  const theme = getTheme(user?.theme || 'default');
  const [authTimeout, setAuthTimeout] = React.useState(false);

  // ✅ ÉTAPE 3 : Timeout de sécurité OBLIGATOIRE - Ne jamais bloquer indéfiniment
  React.useEffect(() => {
    const timer = setTimeout(() => setAuthTimeout(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Attendre que le chargement soit terminé avant de vérifier l'authentification
    if (!isLoading && !isAuthenticated) {
      // Navigation immédiate sans délai pour meilleure performance
        try {
          navigation.navigate('Login' as never);
        } catch (error) {
          console.warn('Erreur lors de la navigation vers Login:', error);
        }
    }
  }, [isAuthenticated, isLoading, navigation]);

  // ✅ ÉTAPE 3 : Afficher un loader UNIQUEMENT si timeout non atteint
  // Après timeout, permettre le render même si isLoading est true
  if (isLoading && !authTimeout) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  // ✅ ÉTAPE 3 : Après timeout, continuer même si isLoading est true
  // Ne rien afficher si l'utilisateur n'est pas authentifié (redirection en cours)
  if (!isAuthenticated) {
    return null;
  }

  return children;
}

