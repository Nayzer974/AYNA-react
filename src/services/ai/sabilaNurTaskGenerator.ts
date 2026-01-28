/**
 * Service de gÃ©nÃ©ration automatique des tÃ¢ches IA pour Sabila Nur
 * 
 * GÃ©nÃ¨re des tÃ¢ches contextuelles selon le type et le jour du challenge
 */

import { sendToAyna, ChatMessage } from '@/services/content/ayna';
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
 * GÃ©nÃ¨re une tÃ¢che IA selon le type et le contexte
 */
export async function generateIATask(
  context: TaskGenerationContext,
  userId?: string
): Promise<string> {
  const { day, taskType, challengeTitle, challengeAttribute, userIntention, verse } = context;
  
  // Prompts spÃ©cifiques selon le type de tÃ¢che
  const taskPrompts: Partial<Record<TaskType, string>> = {
    spirituelle_ia: `GÃ©nÃ¨re une tÃ¢che spirituelle pour le jour ${day} du challenge "${challengeTitle || 'Sabila Nur'}".
L'attribut divin du challenge est : ${challengeAttribute || 'YÃ¢ NÃ»r'}.

La tÃ¢che doit Ãªtre :
- ConcrÃ¨te et rÃ©alisable en 10-15 minutes
- En lien avec la spiritualitÃ© musulmane et l'attribut ${challengeAttribute || 'YÃ¢ NÃ»r'}
- AdaptÃ©e Ã  un dÃ©butant
- Inspirante et apaisante
- Progressive selon le jour (jour ${day} sur 40)

RÃ©ponds UNIQUEMENT avec la description de la tÃ¢che en une phrase, sans explication supplÃ©mentaire.`,
    
    discipline_ia: `GÃ©nÃ¨re une tÃ¢che de discipline spirituelle pour le jour ${day} du challenge "${challengeTitle || 'Sabila Nur'}".
L'attribut divin du challenge est : ${challengeAttribute || 'YÃ¢ NÃ»r'}.

La tÃ¢che doit Ãªtre :
- Une pratique quotidienne de discipline (dhikr, priÃ¨re, lecture du Coran, etc.)
- RÃ©alisable en 5-10 minutes
- En lien avec l'islam et la spiritualitÃ©
- Progressive selon le jour (jour ${day} sur 40)
- AdaptÃ©e au niveau dÃ©butant
- En harmonie avec l'attribut ${challengeAttribute || 'YÃ¢ NÃ»r'}

RÃ©ponds UNIQUEMENT avec la description de la tÃ¢che en une phrase, sans explication supplÃ©mentaire.`,
    
    action_ia: `GÃ©nÃ¨re une tÃ¢che d'action concrÃ¨te pour le jour ${day} du challenge "${challengeTitle || 'Sabila Nur'}".
L'attribut divin du challenge est : ${challengeAttribute || 'YÃ¢ NÃ»r'}.

La tÃ¢che doit Ãªtre :
- Une action bienveillante envers soi-mÃªme ou les autres
- RÃ©alisable dans la journÃ©e
- Simple et accessible
- En lien avec les valeurs islamiques
- Progressive selon le jour (jour ${day} sur 40)
- InspirÃ©e par l'attribut ${challengeAttribute || 'YÃ¢ NÃ»r'}

RÃ©ponds UNIQUEMENT avec la description de la tÃ¢che en une phrase, sans explication supplÃ©mentaire.`,
    
    introspection: `GÃ©nÃ¨re une question d'introspection pour le jour ${day} du challenge "${challengeTitle || 'Sabila Nur'}".
L'attribut divin du challenge est : ${challengeAttribute || 'YÃ¢ NÃ»r'}.

La question doit :
- Inviter Ã  la rÃ©flexion personnelle profonde
- ÃŠtre en lien avec la spiritualitÃ© musulmane
- ÃŠtre ouverte et bienveillante
- Aider Ã  la croissance personnelle et spirituelle
- ÃŠtre adaptÃ©e au jour ${day} sur 40
- RÃ©sonner avec l'attribut ${challengeAttribute || 'YÃ¢ NÃ»r'}

RÃ©ponds UNIQUEMENT avec la question d'introspection, sans explication supplÃ©mentaire.`,
    
    ancrage_concret: `GÃ©nÃ¨re une tÃ¢che d'ancrage concret pour le jour ${day} du challenge "${challengeTitle || 'Sabila Nur'}".
L'attribut divin du challenge est : ${challengeAttribute || 'YÃ¢ NÃ»r'}.

La tÃ¢che doit Ãªtre :
- Une action concrÃ¨te et tangible
- Qui ancre dans le prÃ©sent
- RÃ©alisable immÃ©diatement
- Qui renforce la connexion spirituelle
- Qui aide Ã  intÃ©grer les enseignements du jour
- En lien avec l'attribut ${challengeAttribute || 'YÃ¢ NÃ»r'}

RÃ©ponds UNIQUEMENT avec la description de la tÃ¢che en une phrase, sans explication supplÃ©mentaire.`
  };

  // Si le type n'a pas de prompt, retourner une description par dÃ©faut
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
    
    // Nettoyer la rÃ©ponse (enlever les guillemets, les astÃ©risques, etc.)
    let cleanedResponse = response.content.trim();
    
    // Enlever les guillemets si prÃ©sents
    if (cleanedResponse.startsWith('"') && cleanedResponse.endsWith('"')) {
      cleanedResponse = cleanedResponse.slice(1, -1);
    }
    if (cleanedResponse.startsWith("'") && cleanedResponse.endsWith("'")) {
      cleanedResponse = cleanedResponse.slice(1, -1);
    }
    
    // Enlever les astÃ©risques
    cleanedResponse = cleanedResponse.replace(/\*/g, '');
    
    // Prendre seulement la premiÃ¨re phrase si plusieurs phrases
    const firstSentence = cleanedResponse.split(/[.!?]/)[0].trim();
    
    return firstSentence || cleanedResponse || getDefaultTaskDescription(taskType, day);
  } catch (error) {
    console.warn('Erreur lors de la gÃ©nÃ©ration IA, utilisation de la description par dÃ©faut', error);
    return getDefaultTaskDescription(taskType, day);
  }
}

/**
 * Retourne une description par dÃ©faut si la gÃ©nÃ©ration IA Ã©choue
 */
function getDefaultTaskDescription(taskType: TaskType, day: number): string {
  const defaults: Record<TaskType, string> = {
    kalwa: 'Kalwa : MÃ©ditation',
    nur_shifa: 'Nur Shifa : GuÃ©rison',
    intention: 'DÃ©finir votre intention',
    yassine_reading: 'Lire les versets de Yassine',
    yassine_final: 'Lire les derniers versets de Yassine',
    connexion_soi: 'RÃ©flexion sur votre parcours',
    projection: 'Projeter votre intention future',
    spirituelle_ia: `Pratique spirituelle du jour ${day}`,
    discipline_ia: `Discipline spirituelle du jour ${day}`,
    action_ia: `Action bienveillante du jour ${day}`,
    introspection: `RÃ©flexion personnelle du jour ${day}`,
    ancrage_concret: `Ancrage concret du jour ${day}`,
    discipline: 'Discipline spirituelle',
    action: 'Action bienveillante'
  };
  
  return defaults[taskType] || `TÃ¢che du jour ${day}`;
}

/**
 * GÃ©nÃ¨re toutes les tÃ¢ches IA pour un jour donnÃ©
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
        console.warn(`Erreur lors de la gÃ©nÃ©ration de la tÃ¢che ${task.type} pour le jour ${day}`, error);
        // Utiliser la description par dÃ©faut
        generatedTasks.push({
          ...task,
          description: getDefaultTaskDescription(task.type, day)
        });
      }
    } else {
      // TÃ¢che non-IA, garder telle quelle
      generatedTasks.push(task);
    }
  }
  
  return generatedTasks;
}

/**
 * GÃ©nÃ¨re une tÃ¢che IA avec cache pour Ã©viter les appels multiples
 */
const taskCache = new Map<string, string>();

export async function generateIATaskWithCache(
  context: TaskGenerationContext,
  userId?: string
): Promise<string> {
  const cacheKey = `${context.day}-${context.taskType}-${userId || 'anonymous'}-${context.challengeTitle || ''}`;
  
  // VÃ©rifier le cache
  if (taskCache.has(cacheKey)) {
    return taskCache.get(cacheKey)!;
  }
  
  // GÃ©nÃ©rer la tÃ¢che
  const description = await generateIATask(context, userId);
  
  // Mettre en cache
  taskCache.set(cacheKey, description);
  
  return description;
}

/**
 * Nettoie le cache (utile pour forcer la rÃ©gÃ©nÃ©ration)
 */
export function clearTaskCache(): void {
  taskCache.clear();
}

/**
 * Nettoie le cache pour un jour spÃ©cifique
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





