/**
 * Service de génération automatique des tâches IA pour Sabila Nur
 * 
 * Génère des tâches contextuelles selon le type et le jour du challenge
 */

import { sendToAyna, ChatMessage } from './ayna';
import { TaskType } from '@/data/sabilaNur';
import i18n from '@/i18n';

export interface TaskGenerationContext {
  day: number;
  taskType: TaskType;
  challengeTitle?: string;
  challengeAttribute?: string;
  userIntention?: string;
  verse?: {
    reference: string;
    translation: string;
  };
}

/**
 * Génère une tâche IA selon le type et le contexte
 */
export async function generateIATask(
  context: TaskGenerationContext,
  userId?: string
): Promise<string> {
  const { day, taskType, challengeTitle, challengeAttribute, userIntention, verse } = context;
  
  // Prompts spécifiques selon le type de tâche
  const taskPrompts: Partial<Record<TaskType, string>> = {
    spirituelle_ia: `Génère une tâche spirituelle pour le jour ${day} du challenge "${challengeTitle || 'Sabila Nur'}".
L'attribut divin du challenge est : ${challengeAttribute || 'Yâ Nûr'}.

La tâche doit être :
- Concrète et réalisable en 10-15 minutes
- En lien avec la spiritualité musulmane et l'attribut ${challengeAttribute || 'Yâ Nûr'}
- Adaptée à un débutant
- Inspirante et apaisante
- Progressive selon le jour (jour ${day} sur 40)

Réponds UNIQUEMENT avec la description de la tâche en une phrase, sans explication supplémentaire.`,
    
    discipline_ia: `Génère une tâche de discipline spirituelle pour le jour ${day} du challenge "${challengeTitle || 'Sabila Nur'}".
L'attribut divin du challenge est : ${challengeAttribute || 'Yâ Nûr'}.

La tâche doit être :
- Une pratique quotidienne de discipline (dhikr, prière, lecture du Coran, etc.)
- Réalisable en 5-10 minutes
- En lien avec l'islam et la spiritualité
- Progressive selon le jour (jour ${day} sur 40)
- Adaptée au niveau débutant
- En harmonie avec l'attribut ${challengeAttribute || 'Yâ Nûr'}

Réponds UNIQUEMENT avec la description de la tâche en une phrase, sans explication supplémentaire.`,
    
    action_ia: `Génère une tâche d'action concrète pour le jour ${day} du challenge "${challengeTitle || 'Sabila Nur'}".
L'attribut divin du challenge est : ${challengeAttribute || 'Yâ Nûr'}.

La tâche doit être :
- Une action bienveillante envers soi-même ou les autres
- Réalisable dans la journée
- Simple et accessible
- En lien avec les valeurs islamiques
- Progressive selon le jour (jour ${day} sur 40)
- Inspirée par l'attribut ${challengeAttribute || 'Yâ Nûr'}

Réponds UNIQUEMENT avec la description de la tâche en une phrase, sans explication supplémentaire.`,
    
    introspection: `Génère une question d'introspection pour le jour ${day} du challenge "${challengeTitle || 'Sabila Nur'}".
L'attribut divin du challenge est : ${challengeAttribute || 'Yâ Nûr'}.

La question doit :
- Inviter à la réflexion personnelle profonde
- Être en lien avec la spiritualité musulmane
- Être ouverte et bienveillante
- Aider à la croissance personnelle et spirituelle
- Être adaptée au jour ${day} sur 40
- Résonner avec l'attribut ${challengeAttribute || 'Yâ Nûr'}

Réponds UNIQUEMENT avec la question d'introspection, sans explication supplémentaire.`,
    
    ancrage_concret: `Génère une tâche d'ancrage concret pour le jour ${day} du challenge "${challengeTitle || 'Sabila Nur'}".
L'attribut divin du challenge est : ${challengeAttribute || 'Yâ Nûr'}.

La tâche doit être :
- Une action concrète et tangible
- Qui ancre dans le présent
- Réalisable immédiatement
- Qui renforce la connexion spirituelle
- Qui aide à intégrer les enseignements du jour
- En lien avec l'attribut ${challengeAttribute || 'Yâ Nûr'}

Réponds UNIQUEMENT avec la description de la tâche en une phrase, sans explication supplémentaire.`
  };

  // Si le type n'a pas de prompt, retourner une description par défaut
  if (!taskPrompts[taskType] || taskPrompts[taskType] === '') {
    return getDefaultTaskDescription(taskType, day);
  }
  
  const basePrompt = taskPrompts[taskType]!;
  
  // Construire le prompt avec le contexte
  let prompt = basePrompt;
  
  // Ajouter le contexte du verset si disponible
  if (verse) {
    prompt += `\n\nContexte : Le verset du jour est "${verse.reference}" : "${verse.translation}".`;
  }
  
  // Ajouter l'intention de l'utilisateur si disponible
  if (userIntention) {
    prompt += `\n\nIntention de l'utilisateur pour ce challenge : "${userIntention}".`;
  }

  try {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await sendToAyna(messages, i18n.language, userId);
    
    // Nettoyer la réponse (enlever les guillemets, les astérisques, etc.)
    let cleanedResponse = response.content.trim();
    
    // Enlever les guillemets si présents
    if (cleanedResponse.startsWith('"') && cleanedResponse.endsWith('"')) {
      cleanedResponse = cleanedResponse.slice(1, -1);
    }
    if (cleanedResponse.startsWith("'") && cleanedResponse.endsWith("'")) {
      cleanedResponse = cleanedResponse.slice(1, -1);
    }
    
    // Enlever les astérisques
    cleanedResponse = cleanedResponse.replace(/\*/g, '');
    
    // Prendre seulement la première phrase si plusieurs phrases
    const firstSentence = cleanedResponse.split(/[.!?]/)[0].trim();
    
    return firstSentence || cleanedResponse || getDefaultTaskDescription(taskType, day);
  } catch (error) {
    console.warn('Erreur lors de la génération IA, utilisation de la description par défaut', error);
    return getDefaultTaskDescription(taskType, day);
  }
}

/**
 * Retourne une description par défaut si la génération IA échoue
 */
function getDefaultTaskDescription(taskType: TaskType, day: number): string {
  const defaults: Record<TaskType, string> = {
    kalwa: 'Kalwa : Méditation',
    nur_shifa: 'Nur Shifa : Guérison',
    intention: 'Définir votre intention',
    yassine_reading: 'Lire les versets de Yassine',
    yassine_final: 'Lire les derniers versets de Yassine',
    connexion_soi: 'Réflexion sur votre parcours',
    projection: 'Projeter votre intention future',
    spirituelle_ia: `Pratique spirituelle du jour ${day}`,
    discipline_ia: `Discipline spirituelle du jour ${day}`,
    action_ia: `Action bienveillante du jour ${day}`,
    introspection: `Réflexion personnelle du jour ${day}`,
    ancrage_concret: `Ancrage concret du jour ${day}`,
    discipline: 'Discipline spirituelle',
    action: 'Action bienveillante'
  };
  
  return defaults[taskType] || `Tâche du jour ${day}`;
}

/**
 * Génère toutes les tâches IA pour un jour donné
 */
export async function generateAllIATasksForDay(
  day: number,
  tasks: Array<{ description: string; type: TaskType; generatedByIA?: boolean }>,
  context?: {
    challengeTitle?: string;
    challengeAttribute?: string;
    userIntention?: string;
    verse?: {
      reference: string;
      translation: string;
    };
  },
  userId?: string
): Promise<Array<{ description: string; type: TaskType; generatedByIA?: boolean }>> {
  const generatedTasks: Array<{ description: string; type: TaskType; generatedByIA?: boolean }> = [];
  
  for (const task of tasks) {
    if (task.generatedByIA) {
      try {
        const generatedDescription = await generateIATask(
          {
            day,
            taskType: task.type,
            challengeTitle: context?.challengeTitle,
            challengeAttribute: context?.challengeAttribute,
            userIntention: context?.userIntention,
            verse: context?.verse,
          },
          userId
        );
        
        generatedTasks.push({
          ...task,
          description: generatedDescription
        });
      } catch (error) {
        console.warn(`Erreur lors de la génération de la tâche ${task.type} pour le jour ${day}`, error);
        // Utiliser la description par défaut
        generatedTasks.push({
          ...task,
          description: getDefaultTaskDescription(task.type, day)
        });
      }
    } else {
      // Tâche non-IA, garder telle quelle
      generatedTasks.push(task);
    }
  }
  
  return generatedTasks;
}

/**
 * Génère une tâche IA avec cache pour éviter les appels multiples
 */
const taskCache = new Map<string, string>();

export async function generateIATaskWithCache(
  context: TaskGenerationContext,
  userId?: string
): Promise<string> {
  const cacheKey = `${context.day}-${context.taskType}-${userId || 'anonymous'}-${context.challengeTitle || ''}`;
  
  // Vérifier le cache
  if (taskCache.has(cacheKey)) {
    return taskCache.get(cacheKey)!;
  }
  
  // Générer la tâche
  const description = await generateIATask(context, userId);
  
  // Mettre en cache
  taskCache.set(cacheKey, description);
  
  return description;
}

/**
 * Nettoie le cache (utile pour forcer la régénération)
 */
export function clearTaskCache(): void {
  taskCache.clear();
}

/**
 * Nettoie le cache pour un jour spécifique
 */
export function clearTaskCacheForDay(day: number): void {
  const keysToDelete: string[] = [];
  taskCache.forEach((_, key) => {
    if (key.startsWith(`${day}-`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => taskCache.delete(key));
}




