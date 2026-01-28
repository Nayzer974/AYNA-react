/**
 * Parcours Nûr al-Qur'ân
 * Plusieurs parcours de récitation et de guérison spirituelle
 */

// ========== ANCIENNE STRUCTURE (rétrocompatibilité) ==========

export interface ParcoursStep {
      id: string;
      day: number;
      emoji: string;
      title: string;
      verses?: string[];
      procedure?: string;
      actions: string[];
      dhikr: string;
      reminder: string;
}

export const PARCOURS_STEPS: ParcoursStep[] = [
      // --- Cycle 1: Protection et Apaisement ---
      {
            id: 'day1',
            day: 1,
            emoji: '🌿',
            title: 'Protection et Apaisement',
            verses: ['2:102', '7:104–122', '10:79–82', '20:68–69', '26:42–48', '54:1–2', '112', '113', '114'],
            procedure: 'Ouvre 3 bouteilles d’eau. Lis tous les versets une seule fois, avec l’intention : “Ô Allah, coranise cette eau pour moi.” Chaque bouteille correspond à un jour : aujourd’hui → 1ʳᵉ bouteille, demain → 2ᵉ, après-demain → 3ᵉ.',
            actions: ['Boire toute la journée', 'Se laver une fois (visage, mains, nuque)'],
            dhikr: 'Main sur le sommet de la tête, Allāhu Akbar × 33',
            reminder: 'Laisse la confiance s’installer en toi. Tu es guidé, protégé, et soutenu.'
      },
      {
            id: 'day2',
            day: 2,
            emoji: '🌿',
            title: 'Protection et Apaisement',
            actions: ['Boire l’eau toute la journée (2ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur le sommet de la tête, Allāhu Akbar × 33',
            reminder: 'Ressens la protection divine. Chaque respiration est un lien avec Allah.'
      },
      {
            id: 'day3',
            day: 3,
            emoji: '🌿',
            title: 'Protection et Apaisement',
            actions: ['Boire l’eau toute la journée (3ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur le sommet de la tête, Allāhu Akbar × 33',
            reminder: 'La paix grandit en toi. Laisse ton esprit se reposer et se nourrir de cette lumière.'
      },
      // --- Cycle 2: Harmonie et Clarté Intérieure ---
      {
            id: 'day4',
            day: 4,
            emoji: '✨',
            title: 'Harmonie et Clarté Intérieure',
            verses: ['2:20', '2:105', '2:109', '4:54', '7:198', '9:59', '12:67', '67:1–4', '68:51–52', '69:38–40', '75:7–12'],
            procedure: 'Ouvre 3 bouteilles. Lis tous les versets une seule fois, en demandant à Allah : “Coranise cette eau et illumine ma clarté intérieure.”',
            actions: ['Boire toute la journée', 'Se laver une fois'],
            dhikr: 'Main sur le front, Yā Nūr × 33',
            reminder: 'Ta clarté intérieure s’éveille. Laisse la lumière guider tes pensées et décisions.'
      },
      {
            id: 'day5',
            day: 5,
            emoji: '✨',
            title: 'Harmonie et Clarté Intérieure',
            actions: ['Boire l’eau toute la journée (2ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur le front, Yā Nūr × 33',
            reminder: 'Observe tes pensées. Chaque geste te rapproche de la paix.'
      },
      {
            id: 'day6',
            day: 6,
            emoji: '✨',
            title: 'Harmonie et Clarté Intérieure',
            actions: ['Boire l’eau toute la journée (3ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur le front, Yā Nūr × 33',
            reminder: 'La lumière continue de grandir en toi. Sois patient et confiant.'
      },
      // --- Cycle 3: Équilibre et Libération ---
      {
            id: 'day7',
            day: 7,
            emoji: '🌤',
            title: 'Équilibre et Libération',
            verses: ['2:228', '4:1', '8:75', '3:5–6', '13:8–9', '31:34', '22:5', '14:26–27', '16:102', '25:32', '47:7', '14:24'],
            procedure: 'Ouvre 3 bouteilles. Lis tous les versets une seule fois, avec l’intention : “Ô Allah, coranise cette eau et apaise mon cœur et ma gorge.”',
            actions: ['Boire toute la journée', 'Se laver une fois'],
            dhikr: 'Main sur la gorge, Rabbi ishraḥ lī ṣadrī × 21',
            reminder: 'Laisse les tensions sortir. Respire et relâche ce qui pèse.'
      },
      {
            id: 'day8',
            day: 8,
            emoji: '🌤',
            title: 'Équilibre et Libération',
            actions: ['Boire l’eau toute la journée (2ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur la gorge, Rabbi ishraḥ lī ṣadrī × 21',
            reminder: 'L’apaisement s’installe. Ta voix intérieure se libère doucement.'
      },
      {
            id: 'day9',
            day: 9,
            emoji: '🌤',
            title: 'Équilibre et Libération',
            actions: ['Boire l’eau toute la journée (3ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur la gorge, Rabbi ishraḥ lī ṣadrī × 21',
            reminder: 'Laisse ton cœur parler et écouter. La sérénité prend racine.'
      },
      // --- Cycle 4: Vérité et Discernement du Cœur ---
      {
            id: 'day10',
            day: 10,
            emoji: '💎',
            title: 'Vérité et Discernement du Cœur',
            verses: ['2:42', '3:71', '9:48', '31:30', '42:24', '48:28', '53:28', '6:116', '9:118', '10:36', '10:66', '18:53', '48:12'],
            procedure: 'Ouvre 3 bouteilles, lis tous les versets une seule fois, avec l’intention : “Ô Allah, coranise cette eau et éclaire mon cœur et mon discernement.”',
            actions: ['Boire toute la journée', 'Se laver une fois'],
            dhikr: 'Main sur le cœur, Yā Ḥaqq × 33',
            reminder: 'Écoute ton cœur, laisse la clarté et la guidance y entrer doucement.'
      },
      {
            id: 'day11',
            day: 11,
            emoji: '💎',
            title: 'Vérité et Discernement du Cœur',
            actions: ['Boire l’eau toute la journée (2ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur le cœur, Yā Ḥaqq × 33',
            reminder: 'Ta lumière intérieure grandit à chaque souffle.'
      },
      {
            id: 'day12',
            day: 12,
            emoji: '💎',
            title: 'Vérité et Discernement du Cœur',
            actions: ['Boire l’eau toute la journée (3ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur le cœur, Yā Ḥaqq × 33',
            reminder: 'Laisse ton cœur guider tes pas avec sérénité et confiance.'
      },
      // --- Cycle 5: Force Vitale et Guérison ---
      {
            id: 'day13',
            day: 13,
            emoji: '🌼',
            title: 'Force Vitale et Guérison',
            verses: ['1:1–7', '9:14', '26:80', '10:57', '16:69', '17:82', '41:44'],
            procedure: 'Ouvre 3 bouteilles, lis tous les versets une seule fois, avec l’intention : “Ô Allah, coranise cette eau et renforce ma force vitale et ma guérison intérieure.”',
            actions: ['Boire toute la journée', 'Se laver une fois'],
            dhikr: 'Main sur le ventre, Yā Shāfī × 33',
            reminder: 'Accueille la force qui grandit en toi et laisse le réconfort t’envahir.'
      },
      {
            id: 'day14',
            day: 14,
            emoji: '🌼',
            title: 'Force Vitale et Guérison',
            actions: ['Boire l’eau toute la journée (2ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur le ventre, Yā Shāfī × 33',
            reminder: 'La guérison s’installe dans ton corps et ton esprit.'
      },
      {
            id: 'day15',
            day: 15,
            emoji: '🌼',
            title: 'Force Vitale et Guérison',
            actions: ['Boire l’eau toute la journée (3ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur le ventre, Yā Shāfī × 33',
            reminder: 'Sens la force intérieure circuler en toi et t’ancrer.'
      },
      // --- Cycle 6: Stabilité et Enracinement ---
      {
            id: 'day16',
            day: 16,
            emoji: '🌊',
            title: 'Stabilité et Enracinement',
            verses: ['1:1–7', '6:59', '8:19', '7:89', '7:96', '15:14', '21:96', '26:118', '34:26', '35:2', '2:280', '19:97', '20:25–28', '54:17', '64:7', '74:8–10', '87:6–8', '92:5–10', '94:5–6'],
            procedure: 'Ouvre 3 bouteilles, lis tous les versets une seule fois, avec l’intention : “Ô Allah, coranise cette eau et stabilise mes émotions et mon enracinement.”',
            actions: ['Boire toute la journée', 'Se laver une fois'],
            dhikr: 'Main sur le bas-ventre, Yā Kāfī × 33',
            reminder: 'Laisse tes émotions se poser et ton esprit trouver l’équilibre.'
      },
      {
            id: 'day17',
            day: 17,
            emoji: '🌊',
            title: 'Stabilité et Enracinement',
            actions: ['Boire l’eau toute la journée (2ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur le bas-ventre, Yā Kāfī × 33',
            reminder: 'Sens la stabilité s’installer doucement dans ton être.'
      },
      {
            id: 'day18',
            day: 18,
            emoji: '🌊',
            title: 'Stabilité et Enracinement',
            actions: ['Boire l’eau toute la journée (3ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur le bas-ventre, Yā Kāfī × 33',
            reminder: 'Tu es enraciné et équilibré, laisse ton cœur s’apaiser.'
      },
      // --- Cycle 7: Ancrage et Voyage Intégral ---
      {
            id: 'day19',
            day: 19,
            emoji: '🏔',
            title: 'Ancrage et Voyage Intégral',
            verses: ['2:36–38', '7:54–56', '37:1–10', '55:33–36', '55:35–44', '59:21–23'],
            procedure: 'Ouvre 3 bouteilles, lis tous les versets une seule fois, avec l’intention : “Ô Allah, coranise cette eau et ancre ma force et ma confiance.”',
            actions: ['Boire toute la journée', 'Se laver une fois'],
            dhikr: 'Main sur les pieds, Allāhu Akbar × 33',
            reminder: 'Chaque pas que tu fais est soutenu par la protection divine.'
      },
      {
            id: 'day20',
            day: 20,
            emoji: '🏔',
            title: 'Ancrage et Voyage Intégral',
            actions: ['Boire l’eau toute la journée (2ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur les pieds, Allāhu Akbar × 33',
            reminder: 'Ressens l’ancrage profond. Ta stabilité vient d’Allah.'
      },
      {
            id: 'day21',
            day: 21,
            emoji: '🏔',
            title: 'Ancrage et Voyage Intégral',
            actions: ['Boire l’eau toute la journée (3ᵉ bouteille)', 'Se laver une fois'],
            dhikr: 'Main sur les pieds, Allāhu Akbar × 33',
            reminder: 'Tu es complet dans ton voyage. Paix, clarté et force demeurent en toi. Chaque geste t’a rapproché de la lumière intérieure.'
      },
];

export const PARCOURS_INTRO = {
      title: '🌿 Voyage vers la Lumière Intérieure',
      subtitle: 'Pendant 21 jours, tu vas déposer doucement ce qui pèse sur ton cœur et ton esprit.',
      introduction: `Chaque souffle, chaque gorgée, chaque geste devient une porte vers la paix et la clarté.
L’eau que tu lis avec les versets, les paroles sacrées que tu prononces, le dhikr que tu fais avec ton corps… tout se transforme en un fil lumineux qui relie ton être à Celui qui guide.
Ce parcours n’impose rien. Il invite simplement ton cœur à s’ouvrir, à respirer et à recevoir la sérénité.
Chaque geste est un pas, chaque pas un rappel : tout ce que tu vis est entre les mains d’Allah.
Ouvre ton esprit, prépare ton cœur, et laisse-toi guider.`,
      fonctionnement: `Le parcours dure 21 jours
Il est composé de 7 étapes de 3 jours
Chaque étape commence par une lecture unique de versets
Jour 1 :
Ouvrir 3 bouteilles d’eau
Lire les versets une seule fois sur les bouteilles
Pendant les 3 jours :
Boire l’eau d’une bouteille par jour toute la journée
Se laver une fois (visage, mains, nuque)
Faire le Dhikr quotidien spécifique`,
      cloture: `🌿 Clôture du Voyage
Tu as parcouru 21 jours de lumière, de souffle et de gorgées sacrées.
Chaque verset que tu as lu, chaque dhikr que tu as prononcé, chaque geste de l’eau que tu as porté à ton corps a tissé un fil lumineux entre ton cœur et Celui qui guide.
Il n’y a rien à mesurer, rien à juger. Ce qui devait agir en toi a commencé son travail.
La sérénité, la clarté et la force que tu ressens sont les traces visibles de ce chemin intérieur.
Tu peux maintenant continuer à boire, à te laver, à faire dhikr, ou simplement marcher dans la vie avec cette présence nouvelle.
Chaque souffle reste un rappel, chaque geste un lien.
L’essentiel est simple : laisse cette lumière te guider, aujourd’hui et toujours.`,
};

// ========== NOUVELLE STRUCTURE (parcours multiples) ==========

export interface ParcoursDay {
      day: number;
      emoji: string;
      title: string;
      verses: string; // Références des versets (ex: "1 à 12")
      sensCentral: string;
      lecon: string;
      pratiqueQuotidienne: string;
      pratiqueJour: string;
}

export interface Parcours {
      id: string;
      emoji: string;
      title: string;
      subtitle: string;
      surahNumber: number;
      surahName: string;
      duration: number; // nombre de jours
      supportSymbolique: string;
      description: string;
      intention: string;
      organisation: string;
      usageSupport: string;
      days: ParcoursDay[];
      cloture: string;
      mention: string;
}

// ========== PARCOURS 1 : Yâ-Sîn – Apaisement ==========

export const PARCOURS_YASIN: Parcours = {
      id: 'yasin-apaisement',
      emoji: '💧',
      title: 'Yâ-Sîn – Apaisement',
      subtitle: 'Un parcours pour calmer le cœur, déposer les charges intérieures et retrouver une forme de sérénité.',
      surahNumber: 36,
      surahName: 'Yâ-Sîn',
      duration: 7,
      supportSymbolique: 'l\'eau',
      description: `Ce parcours propose la récitation quotidienne de la sourate Yâ-Sîn sur une durée de 7 jours.
Yâ-Sîn est une sourate de rappel, de miséricorde et d'apaisement.
Elle calme le cœur, éclaire l'esprit et aide à se remettre à Allah lorsque la charge intérieure devient lourde.
Ce parcours ne vise pas à provoquer un état particulier,
mais à installer un apaisement progressif,
fondé sur la Parole d'Allah et la confiance.`,
      intention: `Apaiser mon cœur par la Parole d'Allah,
déposer ce qui m'alourdit,
et me remettre à Lui avec douceur et confiance.`,
      organisation: `Durée : 7 jours
Récitation : sourate Yâ-Sîn, une fois par jour
Moment : libre (recommandé en période de calme)
Support : eau
Lecture ou écoute : au choix`,
      usageSupport: `Jour 1 : récitation sur 3 bouteilles d'eau
Jours 1 à 7 : utilisation de cette même eau
Usage quotidien :
boire une petite quantité
passer un peu d'eau sur le visage (optionnel)
L'eau est utilisée ici comme support symbolique,
associée à l'apaisement et à la vie,
sans être considérée comme une cause spirituelle
ni une promesse de résultat.
(Si l'utilisateur ne souhaite pas utiliser d'eau de cette manière, le parcours reste pleinement valable.)`,
      days: [
            {
                  day: 1,
                  emoji: '🟢',
                  title: 'Le rappel vivant',
                  verses: '1 à 12',
                  sensCentral: `Allah rappelle que le Coran est une révélation pleine de sagesse,
adressée à des cœurs parfois inattentifs.
Tout est connu, inscrit, mesuré par Allah.`,
                  lecon: 'L\'apaisement commence quand on accepte d\'écouter le rappel.',
                  pratiqueQuotidienne: `S'autoriser à ralentir
Accueillir le Coran sans attente ni pression
Se rappeler que rien n'est hors du regard d'Allah`,
                  pratiqueJour: `Réciter Yâ-Sîn sur 3 bouteilles d'eau
Boire un peu d'eau
Passer légèrement sur le visage
Conserver l'eau pour les jours suivants`,
            },
            {
                  day: 2,
                  emoji: '🔵',
                  title: 'L\'écoute et l\'humilité',
                  verses: '13 à 32',
                  sensCentral: `Allah raconte l'histoire de peuples qui ont refusé d'écouter le rappel,
non par manque de preuves, mais par orgueil.`,
                  lecon: 'Le cœur s\'apaise lorsqu\'il accepte d\'écouter sans se défendre.',
                  pratiqueQuotidienne: `Accueillir un rappel sans se justifier
Laisser tomber la résistance intérieure
Accepter d'être guidé`,
                  pratiqueJour: `Réciter Yâ-Sîn
Boire un peu de l'eau préparée`,
            },
            {
                  day: 3,
                  emoji: '🟣',
                  title: 'Les signes qui rassurent',
                  verses: '33 à 44',
                  sensCentral: `Allah attire l'attention sur les signes dans la création :
la terre, l'eau, les cycles, l'ordre parfait.`,
                  lecon: 'Observer les signes d\'Allah apaise l\'angoisse.',
                  pratiqueQuotidienne: `Porter attention à ce qui fonctionne encore dans sa vie
Remercier pour les choses simples
Sortir du mental excessif`,
                  pratiqueJour: `Réciter Yâ-Sîn
Boire un peu de l'eau`,
            },
            {
                  day: 4,
                  emoji: '🟠',
                  title: 'La sortie de l\'insouciance',
                  verses: '45 à 50',
                  sensCentral: `Allah décrit l'insouciance humaine face à la fin.
Ce rappel vise à éveiller sans effrayer.`,
                  lecon: 'La conscience apaise plus que l\'ignorance.',
                  pratiqueQuotidienne: `Revenir au présent
Réajuster ses priorités
Vivre avec lucidité, pas avec peur`,
                  pratiqueJour: `Réciter Yâ-Sîn
Utiliser l'eau si disponible`,
            },
            {
                  day: 5,
                  emoji: '🟡',
                  title: 'La justice qui rassure',
                  verses: '51 à 67',
                  sensCentral: `Allah rappelle la résurrection et la justice parfaite.
Rien n'est oublié, rien n'est injuste.`,
                  lecon: 'Savoir que la justice appartient à Allah soulage le cœur.',
                  pratiqueQuotidienne: `Cesser de ruminer les injustices
Se concentrer sur ce qui dépend de soi
Se remettre à Allah avec confiance`,
                  pratiqueJour: `Réciter Yâ-Sîn
Boire un peu de l'eau`,
            },
            {
                  day: 6,
                  emoji: '🟢',
                  title: 'L\'espérance apaisante',
                  verses: '68 à 82',
                  sensCentral: `Allah évoque Sa miséricorde, Sa capacité à redonner vie,
et la récompense de ceux qui croient.`,
                  lecon: 'L\'espérance sincère apaise plus que la certitude matérielle.',
                  pratiqueQuotidienne: `Ne pas désespérer de soi
Avancer sans se juger durement
Faire confiance au temps d'Allah`,
                  pratiqueJour: `Réciter Yâ-Sîn
Utiliser l'eau restante`,
            },
            {
                  day: 7,
                  emoji: '🌙',
                  title: 'La remise totale',
                  verses: '83',
                  sensCentral: `Allah conclut en rappelant que tout Lui appartient
et que tout retourne à Lui.`,
                  lecon: 'La paix naît quand on dépose ce qui ne dépend plus de nous.',
                  pratiqueQuotidienne: `Lâcher les tensions accumulées
Dormir avec le cœur remis à Allah
Accepter ses limites avec douceur`,
                  pratiqueJour: `Réciter Yâ-Sîn
Boire la dernière eau si disponible
Terminer dans le silence`,
            },
      ],
      cloture: `Il n'y a rien à forcer.
Rien à mesurer.
Rien à attendre.
L'apaisement vient quand le cœur se remet à Allah.`,
      mention: `Ce parcours est proposé comme un temps de récitation et de rappel.
L'eau est utilisée comme support symbolique,
sans constituer une promesse d'apaisement garanti
ni un avis médical ou thérapeutique.`,
};

// ========== PARCOURS 2 : Ar-Rahmân – Bénédiction ==========

export const PARCOURS_RAHMAN: Parcours = {
      id: 'rahman-benediction',
      emoji: '🫒',
      title: 'Ar-Rahmân – Bénédiction',
      subtitle: 'Un parcours de gratitude et d\'équilibre, pour reconnaître les bienfaits visibles et invisibles et accueillir la bénédiction avec humilité.',
      surahNumber: 55,
      surahName: 'Ar-Rahmân',
      duration: 7,
      supportSymbolique: 'l\'huile d\'olive',
      description: `Ce parcours propose la récitation quotidienne de la sourate Ar-Rahmân sur une durée de 7 jours.
Ar-Rahmân est la sourate de la miséricorde manifeste.
Elle rappelle, de manière répétée, les bienfaits d'Allah que l'être humain oublie, minimise ou nie,
et invite à une gratitude consciente, source de bénédiction et de stabilité intérieure.
Ce parcours vise à :
réapprendre à reconnaître les bienfaits,
rééquilibrer le cœur,
accueillir la bénédiction d'Allah sans exigence.`,
      intention: `Reconnaître les bienfaits d'Allah,
nourrir la gratitude,
et accueillir la bénédiction
avec humilité et conscience.`,
      organisation: `Durée : 7 jours
Récitation : sourate Ar-Rahmân, une fois par jour
Moment : libre
Support : huile d'olive
Lecture ou écoute : au choix`,
      usageSupport: `Jour 1 : récitation avec un flacon d'huile d'olive
Jours 1 à 7 :
une seule goutte,
appliquée légèrement sur le front,
après la récitation
L'huile d'olive est utilisée ici comme support symbolique,
mentionnée dans le Coran comme une substance bénie,
sans être considérée comme une cause spirituelle
ni une promesse de résultat.
(Si l'utilisateur ne souhaite pas utiliser d'huile, le parcours reste pleinement valable.)`,
      days: [
            {
                  day: 1,
                  emoji: '🟢',
                  title: 'La miséricorde comme fondement',
                  verses: '1 à 4',
                  sensCentral: `Allah commence par Son Nom Ar-Rahmân.
Avant toute action humaine, Il enseigne, crée et élève l'homme.
La relation avec Allah repose d'abord sur la miséricorde.`,
                  lecon: 'La bénédiction commence par la miséricorde, pas par l\'effort.',
                  pratiqueQuotidienne: `Cesser de se définir uniquement par ses résultats
Accueillir l'apprentissage avec douceur
Revenir au Coran sans pression`,
                  pratiqueJour: `Réciter Ar-Rahmân
Appliquer une goutte d'huile d'olive sur le front`,
            },
            {
                  day: 2,
                  emoji: '🔵',
                  title: 'L\'équilibre et la mesure',
                  verses: '5 à 13',
                  sensCentral: `Allah décrit l'ordre parfait de la création et la balance établie.
Puis revient la question répétée :
« Lequel des bienfaits de votre Seigneur nierez-vous ? »`,
                  lecon: 'La bénédiction se perd dans l\'excès et renaît dans la mesure.',
                  pratiqueQuotidienne: `Rééquilibrer un aspect de sa journée
Réduire un excès inutile
Choisir la mesure dans ses décisions`,
                  pratiqueJour: `Réciter Ar-Rahmân
Appliquer une goutte d'huile d'olive sur le front`,
            },
            {
                  day: 3,
                  emoji: '🟣',
                  title: 'Les bienfaits visibles',
                  verses: '14 à 25',
                  sensCentral: `Allah évoque la création, la terre, les mers, les ressources.
Tout ce qui soutient la vie est un don.`,
                  lecon: 'Ce qui est reconnu devient source de bénédiction.',
                  pratiqueQuotidienne: `Nommer consciemment trois bienfaits dans la journée
Remercier sans attendre plus
Réduire la comparaison avec autrui`,
                  pratiqueJour: `Réciter Ar-Rahmân
Appliquer une goutte d'huile d'olive sur le front`,
            },
            {
                  day: 4,
                  emoji: '🟠',
                  title: 'La responsabilité et la finitude',
                  verses: '26 à 36',
                  sensCentral: `Tout disparaît sauf Allah.
La miséricorde n'annule pas la responsabilité.`,
                  lecon: 'La bénédiction s\'inscrit dans une vie consciente et responsable.',
                  pratiqueQuotidienne: `Assumer un acte ou une parole
Corriger une petite injustice
Agir avec conscience du temps limité`,
                  pratiqueJour: `Réciter Ar-Rahmân
Appliquer une goutte d'huile d'olive sur le front`,
            },
            {
                  day: 5,
                  emoji: '🟡',
                  title: 'La paix comme récompense',
                  verses: '37 à 61',
                  sensCentral: `Allah décrit les récompenses réservées à ceux qui L'ont craint.
La description insiste sur la paix, la sécurité et la proximité.`,
                  lecon: 'La vraie bénédiction est une paix intérieure accordée par Allah.',
                  pratiqueQuotidienne: `Choisir la paix plutôt que la domination
Éloigner ce qui trouble inutilement le cœur
Faire un bien discret, sans attente`,
                  pratiqueJour: `Réciter Ar-Rahmân
Appliquer une goutte d'huile d'olive sur le front`,
            },
            {
                  day: 6,
                  emoji: '🟢',
                  title: 'La miséricorde étendue',
                  verses: '62 à 78',
                  sensCentral: `Allah montre l'étendue de Sa miséricorde et la diversité des degrés.
Il n'y a pas une seule place, mais une générosité immense.`,
                  lecon: 'La bénédiction d\'Allah dépasse nos calculs.',
                  pratiqueQuotidienne: `Ne pas désespérer de soi
Cesser de juger la place des autres
Espérer sans relâchement`,
                  pratiqueJour: `Réciter Ar-Rahmân
Appliquer une goutte d'huile d'olive sur le front`,
            },
            {
                  day: 7,
                  emoji: '🌙',
                  title: 'La gratitude comme réponse',
                  verses: 'Clôture de la sourate',
                  sensCentral: `La sourate se termine par la louange.
La gratitude devient la réponse naturelle à la miséricorde.`,
                  lecon: 'La gratitude attire la bénédiction et stabilise le cœur.',
                  pratiqueQuotidienne: `Remercier Allah pour ce qui est déjà présent
Réduire les plaintes inutiles
Se remettre à Allah avec confiance`,
                  pratiqueJour: `Réciter Ar-Rahmân
Appliquer la dernière goutte d'huile d'olive sur le front
Terminer par un moment de silence`,
            },
      ],
      cloture: `Il n'y a rien à réclamer.
Rien à comparer.
Rien à forcer.
La bénédiction se cultive par la gratitude.`,
      mention: `Ce parcours est proposé comme un temps de récitation et de rappel.
L'huile d'olive est utilisée comme support symbolique,
sans constituer une promesse de bénédiction garantie
ni un avis médical ou thérapeutique.`,
};

// ========== PARCOURS 3 : Al-Wâqi'ah – Subsistance ==========

export const PARCOURS_WAQIAH: Parcours = {
      id: 'waqiah-subsistance',
      emoji: '🍯',
      title: 'Al-Wâqi\'ah – Subsistance et lucidité',
      subtitle: 'Un parcours pour réajuster son rapport au monde matériel, se détacher de l\'illusion du contrôle et renforcer la confiance en Allah.',
      surahNumber: 56,
      surahName: 'Al-Wâqi\'ah',
      duration: 7,
      supportSymbolique: 'le miel',
      description: `Ce parcours propose la récitation quotidienne de la sourate Al-Wâqi'ah sur une durée de 7 jours.
Al-Wâqi'ah est une sourate de réveil intérieur.
Elle rappelle la réalité de l'issue finale, la diversité des chemins humains,
et aide à se détacher de l'illusion matérielle pour se confier pleinement à Allah.
Ce parcours n'a pas pour objectif d'attirer une richesse particulière,
mais de transformer le regard sur la subsistance,
en installant la confiance, la sobriété et la lucidité.`,
      intention: `Réajuster mon rapport à la subsistance,
me détacher de l'illusion du contrôle,
et me confier à Allah avec lucidité et confiance.`,
      organisation: `Durée : 7 jours
Récitation : sourate Al-Wâqi'ah, une fois par jour
Moment : libre (recommandé en soirée ou après 'Ishâ)
Support : miel
Lecture ou écoute : au choix`,
      usageSupport: `Jour 1 : récitation avec un récipient de miel
Jours 1 à 7 : consommation de ce même miel
Usage quotidien :
une petite cuillère seulement
après la récitation
Le miel est utilisé ici comme support symbolique,
rappelant la douceur, la subsistance et le bienfait mentionné dans le Coran,
sans être considéré comme une cause spirituelle
ni une promesse de richesse.
(Si l'utilisateur ne souhaite pas utiliser de miel, le parcours reste pleinement valable.)`,
      days: [
            {
                  day: 1,
                  emoji: '🟢',
                  title: 'L\'événement inévitable',
                  verses: '1 à 6',
                  sensCentral: `Allah annonce un événement certain : la fin et le bouleversement total.
Tout ce qui semblait stable perdra sa valeur.`,
                  lecon: 'Ce monde n\'est pas une sécurité durable.',
                  pratiqueQuotidienne: `Relativiser les inquiétudes matérielles
Se rappeler que rien ici-bas n'est définitif
Diminuer l'attachement excessif aux biens`,
                  pratiqueJour: `Réciter Al-Wâqi'ah
Prendre une petite cuillère de miel
Rester quelques instants en silence`,
            },
            {
                  day: 2,
                  emoji: '🔵',
                  title: 'Les chemins de l\'humanité',
                  verses: '7 à 10',
                  sensCentral: `Allah distingue trois catégories d'êtres humains.
La vie n'est pas neutre : chaque choix oriente vers une issue.`,
                  lecon: 'Les habitudes quotidiennes construisent une destination.',
                  pratiqueQuotidienne: `Observer ses choix financiers et matériels
Réduire une habitude basée sur l'excès
Introduire plus de conscience dans ses décisions`,
                  pratiqueJour: `Réciter Al-Wâqi'ah
Prendre une petite cuillère de miel`,
            },
            {
                  day: 3,
                  emoji: '🟣',
                  title: 'La vraie réussite',
                  verses: '11 à 26',
                  sensCentral: `Allah décrit les rapprochés : leur paix, leur honneur, leur stabilité intérieure.
La réussite n'est pas l'accumulation, mais la proximité avec Allah.`,
                  lecon: 'La richesse du cœur vaut plus que celle des mains.',
                  pratiqueQuotidienne: `Faire un acte sincère sans intérêt matériel
Réduire la comparaison avec les autres
Revenir à l'intention plutôt qu'au gain`,
                  pratiqueJour: `Réciter Al-Wâqi'ah
Prendre une petite cuillère de miel`,
            },
            {
                  day: 4,
                  emoji: '🟠',
                  title: 'La droiture accessible',
                  verses: '27 à 40',
                  sensCentral: `Allah évoque les gens de la droite : croyants sincères, constants, sans excès.
La miséricorde d'Allah est vaste et accessible.`,
                  lecon: 'La constance dans le bien nourrit une subsistance saine.',
                  pratiqueQuotidienne: `Préférer la stabilité à la précipitation
Avancer sans envier
Travailler avec éthique, même dans la simplicité`,
                  pratiqueJour: `Réciter Al-Wâqi'ah
Prendre une petite cuillère de miel`,
            },
            {
                  day: 5,
                  emoji: '🟡',
                  title: 'L\'illusion matérielle',
                  verses: '41 à 56',
                  sensCentral: `Allah décrit ceux qui ont vécu dans l'insouciance et l'excès.
Le cœur s'endurcit lorsqu'il s'attache uniquement à la matière.`,
                  lecon: 'L\'excès appauvrit le cœur avant d\'appauvrir les biens.',
                  pratiqueQuotidienne: `Identifier une source d'excès (dépense, désir, consommation)
Réintroduire de la sobriété
Se rappeler que le cœur a aussi besoin de limites`,
                  pratiqueJour: `Réciter Al-Wâqi'ah
Prendre une petite cuillère de miel`,
            },
            {
                  day: 6,
                  emoji: '🟢',
                  title: 'La dépendance à Allah',
                  verses: '57 à 74',
                  sensCentral: `Allah rappelle que l'homme ne crée ni la vie, ni la subsistance.
Même ce qu'il croit maîtriser dépend d'Allah.`,
                  lecon: 'Reconnaître sa dépendance libère de l\'angoisse matérielle.',
                  pratiqueQuotidienne: `Dire al-hamdulillâh pour un bienfait simple
Remplacer l'obsession du contrôle par la confiance
Faire sa part sans arrogance`,
                  pratiqueJour: `Réciter Al-Wâqi'ah
Prendre une petite cuillère de miel`,
            },
            {
                  day: 7,
                  emoji: '🌙',
                  title: 'La vérité au moment du départ',
                  verses: '75 à 96',
                  sensCentral: `Allah ramène l'homme à la mort et à la vérité ultime.
À ce moment, seule la relation avec Allah demeure.`,
                  lecon: 'Ce que l\'on emporte n\'est pas ce que l\'on accumule, mais ce que l\'on a été.',
                  pratiqueQuotidienne: `Alléger son rapport à l'argent et aux biens
Donner ou partager, même peu
Se remettre à Allah avec confiance`,
                  pratiqueJour: `Réciter Al-Wâqi'ah
Prendre la dernière petite cuillère de miel
Terminer par un temps de silence`,
            },
      ],
      cloture: `Il n'y a rien à forcer.
Rien à réclamer.
Rien à comparer.
La subsistance est entre les mains d'Allah.
La confiance apaise le cœur.`,
      mention: `Ce parcours est proposé comme un temps de récitation et de rappel.
Le miel est utilisé comme support symbolique,
sans constituer une promesse de richesse,
ni un avis médical ou financier.`,
};

// ========== PARCOURS 4 : Al-Mulk – Protection ==========

export const PARCOURS_MULK: Parcours = {
      id: 'mulk-protection',
      emoji: '🖤',
      title: 'Al-Mulk – Protection',
      subtitle: "Un parcours de vigilance et de responsabilité, traditionnellement récité le soir, pour se placer sous la protection d'Allah avec conscience.",
      surahNumber: 67,
      surahName: 'Al-Mulk',
      duration: 7,
      supportSymbolique: 'l\'huile de nigelle',
      description: `Ce parcours propose la récitation quotidienne de la sourate Al-Mulk sur une durée de 7 jours.
Al-Mulk est une sourate de protection et de lucidité.
Elle rappelle la souveraineté totale d'Allah,
la responsabilité individuelle,
et la vigilance du cœur avant le repos et le sommeil.
Ce parcours ne vise pas à provoquer une peur,
mais à installer une protection consciente,
fondée sur le rappel, la responsabilité et la confiance en Allah.`,
      intention: `Me placer sous la protection d'Allah
en reconnaissant Sa souveraineté,
en vivant avec vigilance
et en assumant ma responsabilité.`,
      organisation: `Durée : 7 jours
Récitation : sourate Al-Mulk, une fois par jour
Moment recommandé : le soir
Support : huile de nigelle (ingestion légère)
Lecture ou écoute : au choix`,
      usageSupport: `Quantité : quelques gouttes seulement
Mode : sur une petite cuillère ou sous la langue
Fréquence : une fois par jour
Moment : après la récitation
L'huile de nigelle est utilisée ici comme support symbolique,
mentionnée dans la tradition prophétique comme contenant un bienfait,
sans être considérée comme une cause spirituelle,
ni une garantie de protection automatique.
(Si l'utilisateur ne souhaite pas l'ingérer, le parcours reste valable sans.)`,
      days: [
            {
                  day: 1,
                  emoji: '🟢',
                  title: "La souveraineté absolue d'Allah",
                  verses: '1 à 5',
                  sensCentral: `Allah affirme que toute royauté Lui appartient.
Il a créé la mort et la vie pour éprouver les actes,
et a établi un ordre parfait dans les cieux.`,
                  lecon: 'La protection commence quand on reconnaît que tout appartient à Allah.',
                  pratiqueQuotidienne: `Relativiser ce qui inquiète excessivement
Se rappeler que rien n'échappe au contrôle d'Allah
Dormir en se remettant à Lui`,
                  pratiqueJour: `Réciter Al-Mulk
Prendre quelques gouttes d'huile de nigelle`,
            },
            {
                  day: 2,
                  emoji: '🔵',
                  title: 'La vigilance du regard et du cœur',
                  verses: '6 à 11',
                  sensCentral: `Allah décrit le sort de ceux qui ont rejeté le rappel.
Le danger n'est pas l'ignorance, mais le refus d'écouter.`,
                  lecon: 'Un cœur vigilant est une protection en soi.',
                  pratiqueQuotidienne: `Observer ce qui nourrit ou assombrit le cœur
Répondre aux rappels au lieu de les repousser
Réduire ce qui endurcit intérieurement`,
                  pratiqueJour: `Réciter Al-Mulk
Prendre quelques gouttes d'huile de nigelle`,
            },
            {
                  day: 3,
                  emoji: '🟣',
                  title: 'La sécurité véritable',
                  verses: '12 à 15',
                  sensCentral: `Allah promet pardon et récompense à ceux qui Le craignent sans Le voir.
La vraie sécurité n'est pas matérielle, mais intérieure.`,
                  lecon: 'Se sentir en sécurité vient de la relation avec Allah, pas du contrôle.',
                  pratiqueQuotidienne: `Cesser de vouloir tout maîtriser
Cultiver la confiance plutôt que l'angoisse
Se rappeler qu'Allah voit tout`,
                  pratiqueJour: `Réciter Al-Mulk
Prendre quelques gouttes d'huile de nigelle`,
            },
            {
                  day: 4,
                  emoji: '🟠',
                  title: 'L\'illusion de la fausse protection',
                  verses: '16 à 18',
                  sensCentral: `Allah rappelle que rien ne protège en dehors de Lui.
Les sécurités apparentes peuvent disparaître à tout moment.`,
                  lecon: 'Ce à quoi on s\'accroche peut devenir fragile sans Allah.',
                  pratiqueQuotidienne: `Identifier ce que l'on prend à tort comme protection
Recentrer sa confiance sur Allah
Alléger les peurs excessives`,
                  pratiqueJour: `Réciter Al-Mulk
Prendre quelques gouttes d'huile de nigelle`,
            },
            {
                  day: 5,
                  emoji: '🟡',
                  title: 'La dépendance à Allah',
                  verses: '19 à 23',
                  sensCentral: `Allah montre que même les oiseaux sont portés par Sa volonté.
La subsistance et la stabilité viennent de Lui seul.`,
                  lecon: 'Reconnaître sa dépendance est une forme de protection.',
                  pratiqueQuotidienne: `Dire merci pour les bienfaits invisibles
Avancer avec responsabilité, sans arrogance
Accepter ses limites humaines`,
                  pratiqueJour: `Réciter Al-Mulk
Prendre quelques gouttes d'huile de nigelle`,
            },
            {
                  day: 6,
                  emoji: '🟢',
                  title: 'Le rappel avant la fin',
                  verses: '24 à 27',
                  sensCentral: `Allah rappelle le rassemblement final.
Le rappel vient avant l'épreuve, par miséricorde.`,
                  lecon: 'Le rappel est une protection avant l\'épreuve.',
                  pratiqueQuotidienne: `Ne pas repousser les rappels
Corriger ce qui peut l'être aujourd'hui
Vivre avec conscience, pas avec peur`,
                  pratiqueJour: `Réciter Al-Mulk
Prendre quelques gouttes d'huile de nigelle`,
            },
            {
                  day: 7,
                  emoji: '🌙',
                  title: 'La remise totale et la protection finale',
                  verses: '28 à 30',
                  sensCentral: `Allah rappelle que nul ne peut sauver ou nuire sans Sa permission.
Tout se termine par la dépendance totale à Lui.`,
                  lecon: 'La protection ultime est la remise totale à Allah.',
                  pratiqueQuotidienne: `Lâcher ce qui ne dépend plus de soi
Dormir avec confiance
Se remettre à Allah sans résistance intérieure`,
                  pratiqueJour: `Réciter Al-Mulk
Prendre la dernière prise légère d'huile de nigelle
Terminer dans le silence`,
            },
      ],
      cloture: `Il n'y a rien à prouver.
Rien à forcer.
Rien à craindre.
Ce qui protège réellement appartient à Allah.`,
      mention: `Ce parcours est proposé comme un temps de récitation et de rappel.
L'huile de nigelle est utilisée comme support symbolique,
sans constituer une promesse de protection,
ni un avis médical ou thérapeutique.`,
};

// ========== LISTE DE TOUS LES PARCOURS ==========

export const ALL_PARCOURS: Parcours[] = [
      PARCOURS_YASIN,
      PARCOURS_RAHMAN,
      PARCOURS_WAQIAH,
      PARCOURS_MULK,
];

// ========== FONCTION HELPER ==========

export function getParcoursById(id: string): Parcours | undefined {
      return ALL_PARCOURS.find(p => p.id === id);
}
