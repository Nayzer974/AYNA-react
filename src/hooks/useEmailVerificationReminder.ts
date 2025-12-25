import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { storage } from '@/utils/storage';

const REMINDER_COOLDOWN_DAYS = 7; // Cooldown de 7 jours entre les rappels
const LAST_REMINDER_KEY = '@ayna_email_verification_last_reminder';

interface UseEmailVerificationReminderReturn {
  shouldShowReminder: boolean;
  markReminderShown: () => void;
}

/**
 * Hook pour gérer les rappels de vérification d'email
 * 
 * Affiche un rappel si :
 * - L'utilisateur est connecté
 * - L'email n'est pas vérifié
 * - Le dernier rappel date de plus de 7 jours (ou n'a jamais été affiché)
 */
export function useEmailVerificationReminder(): UseEmailVerificationReminderReturn {
  const { user } = useUser();
  const [shouldShowReminder, setShouldShowReminder] = useState(false);

  // Vérifier si on doit afficher le rappel
  useEffect(() => {
    const checkReminder = async () => {
      // Ne pas afficher si l'utilisateur n'est pas connecté
      if (!user?.id) {
        setShouldShowReminder(false);
        return;
      }

      // Ne pas afficher si l'email est déjà vérifié
      if (user.emailVerified) {
        setShouldShowReminder(false);
        return;
      }

      try {
        // Récupérer la date du dernier rappel
        const lastReminderStr = await storage.getItem(LAST_REMINDER_KEY);
        
        if (!lastReminderStr) {
          // Aucun rappel n'a jamais été affiché, on peut afficher
          setShouldShowReminder(true);
          return;
        }

        const lastReminderDate = new Date(lastReminderStr);
        const now = new Date();
        const daysSinceLastReminder = Math.floor(
          (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Afficher si le cooldown est passé
        if (daysSinceLastReminder >= REMINDER_COOLDOWN_DAYS) {
          setShouldShowReminder(true);
        } else {
          setShouldShowReminder(false);
        }
      } catch (error) {
        // En cas d'erreur, ne pas afficher le rappel
        console.error('Erreur lors de la vérification du rappel:', error);
        setShouldShowReminder(false);
      }
    };

    checkReminder();
  }, [user?.id, user?.emailVerified]);

  // Marquer le rappel comme affiché
  const markReminderShown = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      await storage.setItem(LAST_REMINDER_KEY, now);
      setShouldShowReminder(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du rappel:', error);
    }
  }, []);

  return {
    shouldShowReminder,
    markReminderShown,
  };
}
