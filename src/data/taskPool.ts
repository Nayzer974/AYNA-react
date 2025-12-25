/**
 * Pool de tâches par thème pour sélection aléatoire
 * Utilisé pour remplir les jours où les tâches ne sont pas explicitement définies
 */

export type TaskTheme = 'spirituelle' | 'discipline' | 'action' | 'introspection' | 'ancrage_concret';

export interface TaskPool {
  spirituelle: string[];
  discipline: string[];
  action: string[];
  introspection: string[];
  ancrage_concret: string[];
}

/**
 * Pool de tâches disponibles par thème
 */
export const TASK_POOL: TaskPool = {
  spirituelle: [
    'Dhikr court et conscient',
    'Lecture d\'un verset avec silence',
    'Demande de protection',
    'Retour à Allah après distraction',
    'Invocation simple',
    'Lecture méditée',
    'Dhikr plus posé',
    'Du\'ā orientée',
    'Présence dans l\'adoration',
    'Silence après le rappel'
  ],
  discipline: [
    'Réduire une habitude nuisible',
    'Ne pas réagir immédiatement',
    'Se lever à heure fixe',
    'Couper une distraction majeure',
    'Respecter une règle simple',
    'Dire non une fois consciemment',
    'Simplifier la journée',
    'Tenir une petite constance',
    'Éviter l\'excès',
    'Accepter l\'inconfort léger',
    'Respecter une direction claire',
    'Éviter la dispersion',
    'Ne pas revenir en arrière',
    'Honorer un engagement',
    'Stabiliser un rythme',
    'Dire non au superflu',
    'Maintenir la constance',
    'Éviter l\'orgueil spirituel',
    'Rester humble',
    'Continuer même sans émotion'
  ],
  action: [
    'Arrêter une action nocive',
    'Ranger un espace',
    'Faire une démarche repoussée',
    'Corriger un comportement visible',
    'Demander pardon',
    'S\'éloigner d\'une tentation',
    'Remplacer une mauvaise habitude',
    'Poser un acte de droiture',
    'Boire de l\'eau en conscience',
    'Marcher pour calmer le corps',
    'Poser un acte aligné',
    'Servir sans se montrer',
    'Corriger une incohérence',
    'Choisir la droiture coûteuse',
    'Aider sans attendre',
    'Avancer sur un projet juste',
    'Finaliser une tâche',
    'Partager un bien',
    'Tenir une promesse',
    'Agir avec sobriété'
  ],
  introspection: [
    'Observer ses intentions',
    'Identifier une peur subtile',
    'Voir où l\'ego se cache',
    'Reconnaître un attachement',
    'Clarifier une confusion',
    'Accueillir une limite',
    'Accepter de ne pas comprendre',
    'Revenir à l\'essentiel',
    'Voir ce qui résiste',
    'Se recentrer'
  ],
  ancrage_concret: [
    'Marche consciente',
    'Respiration lente',
    'Ancrage des pieds',
    'Immobilité volontaire',
    'Boire lentement',
    'Toucher un élément réel',
    'Se redresser',
    'S\'asseoir en silence',
    'Ralentir les gestes',
    'Habiter le corps'
  ]
};

/**
 * Sélectionne aléatoirement une tâche pour un thème donné
 * @param theme Le thème de la tâche
 * @param seed Optionnel : seed pour la reproductibilité (basé sur le jour et l'ID utilisateur)
 * @param excludeTasks Optionnel : liste des tâches à exclure (pour éviter les répétitions)
 * @returns Une tâche aléatoire du pool
 */
export function getRandomTask(theme: TaskTheme, seed?: number, excludeTasks: string[] = []): string {
  const tasks = TASK_POOL[theme];
  if (!tasks || tasks.length === 0) {
    return `Tâche ${theme} non disponible`;
  }

  // Filtrer les tâches exclues
  const availableTasks = tasks.filter(task => !excludeTasks.includes(task));
  
  if (availableTasks.length === 0) {
    // Si toutes les tâches sont exclues, utiliser toutes les tâches
    return tasks[seed !== undefined ? seed % tasks.length : Math.floor(Math.random() * tasks.length)];
  }

  if (seed !== undefined) {
    // Utiliser le seed pour une sélection déterministe mais aléatoire
    const index = seed % availableTasks.length;
    return availableTasks[index];
  }

  // Sélection vraiment aléatoire
  const randomIndex = Math.floor(Math.random() * availableTasks.length);
  return availableTasks[randomIndex];
}

/**
 * Génère un seed unique basé sur le jour, l'ID du défi et l'ID utilisateur
 * Cela permet d'avoir la même tâche pour le même jour/défi/utilisateur
 * Utilise une fonction de hash simple pour plus de variété
 */
export function generateTaskSeed(day: number, challengeId: string, userId?: string): number {
  // Créer un hash plus varié en combinant tous les caractères
  let challengeHash = 0;
  for (let i = 0; i < challengeId.length; i++) {
    challengeHash = ((challengeHash << 5) - challengeHash) + challengeId.charCodeAt(i);
    challengeHash = challengeHash & challengeHash; // Convert to 32bit integer
  }
  
  let userHash = 0;
  if (userId) {
    for (let i = 0; i < userId.length; i++) {
      userHash = ((userHash << 5) - userHash) + userId.charCodeAt(i);
      userHash = userHash & userHash;
    }
  }
  
  // Combiner avec le jour de manière non-linéaire
  const dayMultiplier = day * 7919; // Nombre premier pour plus de variété
  return Math.abs(dayMultiplier + challengeHash * 100 + userHash * 10);
}

/**
 * Sélectionne une tâche aléatoire avec seed pour reproductibilité
 * @param excludeTasks Optionnel : liste des tâches à exclure (pour éviter les répétitions)
 */
export function getRandomTaskWithSeed(
  theme: TaskTheme, 
  day: number, 
  challengeId: string, 
  userId?: string,
  excludeTasks: string[] = []
): string {
  const seed = generateTaskSeed(day, challengeId, userId);
  return getRandomTask(theme, seed, excludeTasks);
}

