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

  useEffect(() => {
    // Attendre que le chargement soit terminé avant de vérifier l'authentification
    if (!isLoading && !isAuthenticated) {
      // Utiliser un petit délai pour s'assurer que la navigation est prête
      const timer = setTimeout(() => {
        try {
          navigation.navigate('Login' as never);
        } catch (error) {
          console.warn('Erreur lors de la navigation vers Login:', error);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigation]);

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  // Ne rien afficher si l'utilisateur n'est pas authentifié (redirection en cours)
  if (!isAuthenticated) {
    return null;
  }

  return children;
}

