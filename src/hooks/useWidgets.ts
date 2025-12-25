/**
 * Hook React pour gérer les données des widgets
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import {
  syncWidgetsData,
  updateAllWidgetsData,
  getStoredWidgetsData,
  type AllWidgetsData,
} from '@/services/widgetManager';
import i18n from '@/i18n';

export function useWidgets() {
  const { user } = useUser();
  const [widgetsData, setWidgetsData] = useState<AllWidgetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadWidgetsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userLocation = user?.location
        ? { latitude: user.location.latitude, longitude: user.location.longitude }
        : undefined;

      const language = (i18n.language || 'fr') as 'fr' | 'en' | 'ar';

      const data = await syncWidgetsData(userLocation, language);
      setWidgetsData(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors du chargement des widgets');
      setError(error);
      console.error('Erreur useWidgets:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.location]);

  const refreshWidgetsData = useCallback(async () => {
    try {
      setError(null);
      const userLocation = user?.location
        ? { latitude: user.location.latitude, longitude: user.location.longitude }
        : undefined;

      const language = (i18n.language || 'fr') as 'fr' | 'en' | 'ar';

      const data = await updateAllWidgetsData(userLocation, language);
      setWidgetsData(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la mise à jour des widgets');
      setError(error);
      console.error('Erreur refreshWidgets:', error);
    }
  }, [user?.location]);

  useEffect(() => {
    loadWidgetsData();
  }, [loadWidgetsData]);

  return {
    widgetsData,
    loading,
    error,
    refreshWidgetsData,
    reload: loadWidgetsData,
  };
}








