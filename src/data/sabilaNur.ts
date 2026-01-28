/**
 * SABILA NUR - Structure des 4 défis de 40 jours
 * 
 * Structure des tâches :
 * - Jours 1-18 : 3 tâches/jour (spirituelle, discipline, action)
 * - Jours 19-40 : 5 tâches/jour (+ introspection, ancrage_concret)
 */

import { getAlFatihaVerse, AL_FATIHA_VERSES } from './quranVerses';

// Types de tâches
export type TaskType = 
  | 'kalwa'                    // Kalwa (méditation) - spirituelle
  | 'nur_shifa'                // Nur Shifa (guérison) - spirituelle
  | 'spirituelle_ia'           // Tâche spirituelle générée par IA
  | 'discipline_ia'            // Tâche discipline générée par IA
  | 'action_ia'                // Tâche action générée par IA
  | 'introspection'            // Introspection (à partir du jour 19)
  | 'ancrage_concret'          // Ancrage concret (à partir du jour 19)
  | 'connexion_soi'            // Connexion à soi (à partir du jour 19)
  | 'alfatiha_verse'           // Lecture 1 verset Al-Fatiha (jours 11-17)
  | 'yassine_reading'          // Lecture 10 versets Yassine (jours 28-35)
  | 'yassine_final'            // Lecture versets 81-83 Yassine (jours 37-39)
  | 'projection';              // Projection intention (jour 40)

export interface Task {
  description: string;
  type: TaskType;
  generatedByIA?: boolean;      // Pour les tâches générées par IA
  divineAttribute?: string;      // Nom divin pour les kalwa (ex: "Nûr", "Hafidh")
  verseReference?: string;       // Pour les versets
  hasIntention?: boolean;        // Indique si l'intention est intégrée dans cette tâche
  hasPoincon?: boolean;           // Indique si un poinçon est associé à ce jour
  options?: string[];            // Plusieurs options pour cette tâche (une seule sera sélectionnée aléatoirement)
}

export interface Day {
  day: number;
  title: string;
  block?: string;              // Nom de la porte de l'âme (à définir)
  blockNumber?: number;         // Numéro du bloc (1-7)
  tasks: Task[];
  verse?: {
    reference: string;
    arabic?: string;
    transliteration?: string;
    translation: string;
    tafsir?: string;
  };
  closingPhrase?: string;
  // Indicateurs spéciaux
  hasKalwa?: boolean;
  hasNurShifa?: boolean;
  hasYassine?: boolean;
  hasAlFatiha?: boolean;
  hasIntention?: boolean;       // Jour avec intention intégrée
  hasPoincon?: boolean;         // Jour avec poinçon
}

export interface BlockInfo {
  number: number;
  name: string;              // Nom de la porte de l'âme (ex: "An-Nafs al-Ammârah")
  nameTranslation: string;   // Traduction (ex: "l'âme impulsive")
  introText: string;         // Texte d'introduction du bloc
  intention: string;         // Intention du bloc
}

export interface Challenge {
  id: string;
  title: string;
  emoji: string;  // Gardé pour compatibilité, mais on utilisera iconName
  iconName: 'Heart' | 'Shield' | 'Flame' | 'Sparkles';  // Nom de l'icône Lucide
  attribute: string;
  attributeArabic: string;
  description: string;
  color: string;
  days: Day[];
  blocks: BlockInfo[];      // Informations sur les 7 blocs
  introduction?: string;   // Texte d'introduction du défi
}

/**
 * Fonction pour extraire le nom divin sans "Yâ " depuis l'attribut du défi
 */
function extractDivineName(attribute: string): string {
  // Enlever "Yâ " ou "Ya " au début
  return attribute.replace(/^Yâ\s+|^Ya\s+/i, '').trim();
}

/**
 * Informations sur les 7 blocs (portes de l'âme)
 */
const BLOCKS_INFO: BlockInfo[] = [
  {
    number: 1,
    name: 'An-Nafs al-Ammârah',
    nameTranslation: 'l\'âme impulsive',
    introText: 'Tu entres dans la première porte.\nIci, l\'âme réagit avant de comprendre.\nElle veut, elle fuit, elle s\'agite, elle contrôle.\nCe n\'est pas un défaut : c\'est un état.\n\nDans ce bloc, on ne combat pas l\'âme.\nOn l\'observe.\nOn ralentit.\nOn commence à voir.',
    intention: 'reconnaître ton état sans te juger'
  },
  {
    number: 2,
    name: 'An-Nafs al-Lawwâmah',
    nameTranslation: 'l\'âme qui se blâme',
    introText: 'Quelque chose s\'est réveillé en toi.\nTu vois tes écarts, tes contradictions, tes chutes.\nParfois, tu te juges trop durement.\n\nCette porte n\'est pas celle de la culpabilité,\nmais celle de la responsabilité.',
    intention: 'te corriger avec lucidité, pas avec violence'
  },
  {
    number: 3,
    name: 'An-Nafs al-Mulhima',
    nameTranslation: 'l\'âme inspirée',
    introText: 'Tu commences à sentir.\nCe qui est juste.\nCe qui ne l\'est plus.\nL\'âme reçoit des signaux, mais tout n\'est pas encore clair.\n\nDans ce bloc, on ne cherche pas à s\'élever.\nOn nettoie ce qui brouille l\'inspiration.',
    intention: 'purifier pour laisser passer la lumière'
  },
  {
    number: 4,
    name: 'An-Nafs al-Mutma\'innah',
    nameTranslation: 'l\'âme apaisée',
    introText: 'Après l\'agitation, le calme.\nL\'âme n\'est plus en lutte permanente.\nElle goûte à la stabilité, même au milieu des épreuves.\n\nCette paix ne se force pas.\nElle s\'installe.',
    intention: 'accueillir la tranquillité sans la retenir'
  },
  {
    number: 5,
    name: 'An-Nafs ar-Râḍiyah',
    nameTranslation: 'l\'âme satisfaite',
    introText: 'Ici, l\'âme apprend à accepter.\nLe décret.\nLe retard.\nLa perte.\nL\'imprévu.\n\nCe bloc ne parle pas de résignation,\nmais de رضا — la satisfaction intérieure.',
    intention: 'lâcher la résistance et faire confiance'
  },
  {
    number: 6,
    name: 'An-Nafs al-Mardiyyah',
    nameTranslation: 'l\'âme agréée',
    introText: 'L\'âme s\'aligne.\nCe qu\'elle ressent, ce qu\'elle pense et ce qu\'elle fait\ncommencent à marcher ensemble.\n\nL\'ego se fait plus discret.\nLa sincérité prend la place.',
    intention: 'agir pour Allah, sans chercher à être vu'
  },
  {
    number: 7,
    name: 'An-Nafs aṣ-Ṣāfiyah',
    nameTranslation: 'l\'âme purifiée',
    introText: 'Tu arrives à la dernière porte.\nIl ne s\'agit plus de travailler sur toi,\nmais de te remettre entièrement.\n\nCe bloc est un retour.\nUn dépouillement.\nUn abandon conscient.',
    intention: 'remettre ton chemin entre les mains d\'Allah.\nKun fa yakûn.'
  }
];

/**
 * Retourne les descriptions spécifiques pour un jour donné selon le défi
 */
function getDayDescriptions(day: number, challengeId: string, attribute: string): {
  spirituelle?: string;
  discipline?: string;
  action?: string;
  introspection?: string;
  ancrage?: string;
} | null {
  // Défi 1 : Voyage du Cœur (Yâ Nûr)
  if (challengeId === 'voyage-du-coeur') {
    const descriptions: Record<number, any> = {
      1: {
        spirituelle: '🌿 Nur Shifa\n\nLire Al-Fâtiha sur un verre d\'eau, avec présence.\nSouffler légèrement sur l\'eau.\nBoire cette eau ou s\'en essuyer le visage.',
        discipline: null,
        action: '🤍 Intention guidée\n\nAvant de poursuivre le défi, prends un moment pour poser ton intention.\nQuestionne ton cœur, simplement :\nQu\'est-ce que je veux apaiser en moi ?\nQu\'est-ce qui me pèse le plus aujourd\'hui ?\nQuelle gêne revient souvent dans mon cœur ?\nPuis formule une intention courte et sincère, par exemple :\n> « Ô Allah, je fais ce chemin pour apaiser mon cœur de … »'
      },
      2: {
        spirituelle: '🌿 Tâche spirituelle — Présence du cœur\n\nMéditation :\nPorter l\'attention sur le cœur comme lieu de réception de la miséricorde d\'Allah.\nVisualiser une lumière apaisante (comme symbole).\nRéciter Yâ Rahmân, Yâ Rahîm pendant 5 à 10 minutes.\n\n> Objectif :\nAdoucir le cœur et installer la sakîna.',
        discipline: '🧭 Tâche de discipline — Préserver la douceur.\n\nAujourd\'hui, observe ce qui durcit ton cœur\net abstiens-toi de toute dureté inutile\n(parole sèche, réaction immédiate, jugement intérieur).\n\n> Sens :\nNe pas ajouter de poids là où le cœur cherche à s\'alléger.',
        action: '🔥 Tâche d\'action — Geste de miséricorde\n\nPose un seul geste concret de douceur, même discret\n(parole apaisante, pardon silencieux, aide simple).\n\n> Sens :\nLaisser la miséricorde reçue circuler vers l\'extérieur.'
      },
      3: {
        spirituelle: `🌿 Tâche spirituelle — Kalwa Yâ Nûr`,
        discipline: '🧭 Tâche de discipline — Ralentir l\'intérieur\n\nAujourd\'hui, refuse la précipitation intérieure.\nNe fais qu\'une chose à la fois.\nRalentis volontairement lorsque tu te sens pressé ou dispersé.\n\n> Sens :\nLa lumière se perçoit dans le calme, pas dans l\'agitation.',
        action: '🔥 Tâche d\'action — Présence dans un acte simple.\n\nChoisis une action ordinaire de la journée\n(travail, marche, rangement, échange)\net accomplis-la avec présence totale, sans distraction.\n\n> Sens :\nIncarner la lumière dans le quotidien.'
      },
      4: {
        spirituelle: '🌿 Tâche spirituelle — Retour au cœur\n\nRéciter doucement Yâ Nûr pendant quelques minutes.\nPorter l\'attention sur le cœur et observer ce qui pèse, sans chercher à corriger.\n\n> Objectif :\nReconnaître ce qui alourdit le cœur pour commencer à l\'alléger.',
        discipline: '🧭 Tâche de discipline — Ne pas nourrir le poids.\n\nAujourd\'hui, ne nourris pas une pensée ou une émotion qui t\'alourdit\n(rumination, inquiétude, comparaison).\nQuand elle revient, laisse-la passer sans t\'y attacher.\n\n> Sens :\nTout ce que l\'on nourrit grandit.',
        action: '🔥 Tâche d\'action — Alléger le concret\n\nAllège une seule chose dans ta journée :\n-ranger un petit espace,\n-terminer une tâche en attente,\n-retirer quelque chose d\'inutile.\n\n> Sens :\nAlléger l\'extérieur aide le cœur à respirer.'
      },
      5: {
        spirituelle: '🌿 Tâche spirituelle — Apaisement conscient.\n\nPrends quelques minutes de calme.\nPorte l\'attention sur ta respiration, puis sur ton cœur.\nSans invocation particulière.\nSans analyse.\nLaisse simplement le rythme ralentir.\n\n> Objectif :\nPermettre au cœur de se poser sans effort.',
        discipline: '🧭 Tâche de discipline — Ne pas s\'alimenter en agitation.\n\nAujourd\'hui, évite volontairement une source d\'agitation :\n-discussions inutiles,\n-contenus stressants,\n-sollicitations excessives.\n\n> Sens :\nLe cœur s\'apaise quand on cesse de le surcharger.',
        action: '🔥 Tâche d\'action — Geste de simplicité\n\nFais une chose simple et lente aujourd\'hui :\n-marcher quelques minutes sans distraction.\n-boire un verre d\'eau en conscience.\n-ranger calmement un petit espace.\n\n> Sens :\nLa simplicité extérieure aide le cœur à retrouver le calme.'
      },
      6: {
        spirituelle: '🌿 Tâche spirituelle — Parole consciente\n\nMéditation :\nRéciter Subḥâna Rabbiyal \'Aẓîm lentement,\nen ressentant la vibration de la parole et du souffle.\nRespiration profonde, 5 à 10 minutes.\n\n> Objectif :\nPurifier la parole et l\'intention.',
        discipline: '🧭 Tâche de discipline — Retenir avant de parler\n\nAujourd\'hui, marque un temps d\'arrêt avant chaque parole importante.\nSi une parole n\'est ni utile, ni vraie, ni apaisante, ne la dis pas.\n\n> Sens :\nLa parole devient pure quand elle est choisie, pas automatique.',
        action: '🔥 Tâche d\'action — Parole juste\n\nPrononce une seule parole juste et bénéfique aujourd\'hui :\n\nune vérité dite avec douceur,\n\nun encouragement sincère,\n\nou un silence gardé là où parler aurait blessé.\n\n> Sens :\nLa parole purifiée se reconnaît à son effet.'
      },
      7: {
        spirituelle: '🌿 Tâche spirituelle.\n\nRécite le du\'ā :\n> Ḥasbiyallāhu lā ilāha illā Huwa\nAllah me suffit, il n\'y a de divinité que Lui.\n-Répète-le pendant quelques minutes,\ncomme un rappel que le cœur n\'est pas seul.',
        discipline: '🧭 Tâche de discipline:\n\nAujourd\'hui, lorsque une inquiétude apparaît,\nne la développe pas.\nReconnais-la, puis reviens simplement à ce que tu fais.',
        action: '🔥 Tâche d\'action:\n\nFais une chose concrète que tu repousses par peur ou hésitation,\nmême petite.\nAvance sans attendre d\'être rassuré.'
      },
      8: {
        spirituelle: '🌙Jour8.\n🌿 Tâche spirituelle:\n\nRécite le du\'ā :\n> Al-ḥamdu lillāhi \'alā kulli ḥāl\nLouange à Allah en toute situation.\n-Répète-le pendant quelques minutes,\nen pensant à une chose simple pour laquelle tu peux dire merci aujourd\'hui.',
        discipline: '🧭 Tâche de discipline:\n\nAujourd\'hui, évite de te plaindre, même intérieurement.\nQuand l\'envie vient, remplace-la par une reconnaissance silencieuse.',
        action: '🔥 Tâche d\'action.\n\nExprime une gratitude concrète :\n-remercie une personne.\n-reconnais un effort.\n-ou valorise un détail souvent ignoré.'
      },
      9: {
        spirituelle: `🌙jour 9 — Laisser la lumière éclairer\n-----\n🌿 Tâche spirituelle. \nKalwa Yâ Nûr.`,
        discipline: '🧭 Tâche de discipline.\n\nAujourd\'hui, n\'oppose pas de résistance à ce qui te dérange légèrement\n(situation, remarque, imprévu).\nAccueille sans réagir immédiatement.',
        action: '🔥 Tâche d\'action.\n\nFais un choix simple et juste, même inconfortable,\nplutôt que ce qui est facile ou automatique.'
      },
      10: {
        spirituelle: '🌙 Jour 10 — Ouvrir par l\'acte juste\n---\n🌿 Tâche spirituelle — Actes et ouverture\n\nMéditation :\nPoser les mains sur le cœur ou devant soi,\nréciter Yâ Fattâḥ,\npuis accomplir une action concrète juste.\n\n> Objectif :\nRelier le dhikr à l\'action.',
        discipline: '🧭 Tâche de discipline — Aller jusqu\'au bout.\n\nAujourd\'hui, ne laisse pas une action commencée inachevée.\nCe que tu débutes, tu le termines, même simplement.\n\n> Sens :\nL\'ouverture se bloque souvent dans l\'inachevé.',
        action: '🔥 Tâche d\'action — Acte utile pour autrui\n\nAccomplis une action utile pour quelqu\'un d\'autre\n(sans attendre de retour) :\naider, rendre service, faciliter.\n\n> Sens :\nLes ouvertures durables passent par le don.'
      },
      11: {
        spirituelle: '🌙 Jour 11 — Al-Fâtiha | Verset 1\n﴿ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴾\nAu nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux.\n\n🧠 Sens du verset\nCe verset n\'est pas une information.\nC\'est une entrée en présence.\nIl enseigne :\n-ne rien commencer par soi\n-ne rien s\'approprier\n-placer l\'acte sous la miséricorde, pas sous le contrôle\n\n🌿 Spiritualité:\nLire le verset lentement, puis rester quelques instants en silence en conscience du fait que tout commence par Allah.',
        discipline: '🧭 Discipline(— tenir l\'entrée)\n1. Ne pas commencer une action importante dans la précipitation.\n2. Marquer un court temps d\'arrêt avant toute décision.\n3. Éviter de parler ou d\'agir mécaniquement.\n4. Refuser l\'automatisme dans les gestes du quotidien.\n5. Se rappeler intérieurement que l\'acte ne t\'appartient pas.\n👉 Discipline = ralentir pour laisser entrer Allah.',
        action: '🔥 Action:(incarner le commencement juste)\n1. Recommencer consciemment une action habituelle (travail, parole, tâche).\n2. Corriger un geste fait trop vite.\n3. Faire une chose simple avec présence totale.\n4. Choisir la qualité plutôt que la quantité aujourd\'hui.\n5. Poser un acte sans chercher à en tirer un bénéfice personnel.\n👉 Action = agir sans se mettre au centre'
      },
      12: {
        spirituelle: '🌙 Jour 12 — Al-Fâtiha | Verset 2\n﴿ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴾\nLouange à Allah, Seigneur des mondes.\n\n🧠 Sens du verset :\nCe verset n\'est pas une émotion.\nC\'est une reconnaissance lucide.\nIl enseigne :\nque tout bien a une source\nque la maîtrise ne t\'appartient pas\nque la gratitude précède la demande\n\n🌿 Spiritualité:\nLire le verset lentement, puis méditer sur ce qui t\'est donné sans que tu l\'aies produit.',
        discipline: '🧭 Discipline: tenir la reconnaissance\n1. S\'abstenir de toute plainte verbale aujourd\'hui.\n2. Ne pas minimiser ce qui t\'est donné, même petit.\n3. Éviter de comparer ta situation à celle des autres.\n4. Reconnaître intérieurement un bienfait sans l\'expliquer.\n5. Garder une attitude sobre face à ce qui te manque.\n👉 Discipline = ne pas laisser la plainte couvrir la louange',
        action: '🔥 Action: incarner la gratitude\n1. Exprimer une gratitude concrète (parole ou geste), sans attente.\n2. Prendre soin de quelque chose qui t\'est confié.\n3. Utiliser un bienfait dans un but juste.\n4. Aider quelqu\'un avec ce que tu as déjà.\n5. Transformer une facilité en acte de bien.\n👉 Action = remercier par l\'usage'
      },
      13: {
        spirituelle: '🌙 Jour 13 — Al-Fâtiha | Verset 3\n﴿ الرَّحْمَٰنِ الرَّحِيمِ ﴾\nLe Tout Miséricordieux, le Très Miséricordieux.\n\n🧠 Sens du verset :\nCe verset ne décrit pas seulement Allah.\nIl rappelle la manière dont Il se manifeste envers la création :\npar la miséricorde avant le jugement,\npar la douceur avant la rigueur.\nIl enseigne :\nque la miséricorde précède la correction.\nque la dureté n\'est pas la voie.\nque l\'on est traité comme on traite.\n\n🌿 Spiritualité:\nLire le verset lentement, puis méditer sur la miséricorde reçue, même quand elle n\'a pas été méritée.',
        discipline: '🧭 Discipline: tenir la douceur\n1. S\'abstenir de toute dureté inutile dans la parole.\n2. Ne pas répondre immédiatement sous l\'émotion.\n3. Éviter le jugement intérieur envers soi ou autrui.\n4. Ralentir volontairement dans les échanges tendus.\n5. Choisir la douceur même quand tu pourrais imposer.\n👉 Discipline = ne pas fermer la porte de la miséricorde',
        action: '🔥 Action: incarner la miséricorde\n1. Faciliter une situation pour quelqu\'un.\n2. Pardonner une petite chose sans la rappeler.\n3. Aider sans faire sentir l\'aide.\n4. Alléger une charge (temps, parole, geste).\n5. Répondre avec calme là où tu aurais répondu sèchement.\n👉 Action = faire passer la miséricorde avant la victoire.'
      },
      14: {
        spirituelle: '🌙 Jour 14 — Al-Fâtiha | Verset 4\n﴿ مَالِكِ يَوْمِ الدِّينِ ﴾\nMaître du Jour de la rétribution.\n\n🧠 Sens du verset :\nCe verset remet l\'âme à sa place.\nIl rappelle que :\nle jugement final n\'appartient à personne d\'autre qu\'Allah.\nchaque acte a une portée réelle.\nla responsabilité ne peut pas être évitée.\nIl enseigne :\nla conscience des conséquences.\nla fin de l\'illusion d\'impunité.\nla lucidité sans peur excessive.\n\n🌿 Spiritualité:\nLire le verset lentement, puis méditer sur le fait que tout acte aura un sens et un retour, même ceux que personne ne voit.',
        discipline: '🧭 Discipline:tenir la responsabilité.\n1. Agir aujourd\'hui en te rappelant que chaque geste compte.\n2. Éviter toute légèreté dans une action connue comme sérieuse.\n3. Ne pas repousser une obligation claire.\n4. Assumer un tort sans te justifier excessivement.\n5. Garder une attitude droite même sans contrôle extérieur.\n👉 Discipline = vivre en conscience du retour',
        action: '🔥 Action: incarner la responsabilité.\n1. Corriger un comportement discret mais incorrect.\n2. Tenir une promesse ou un engagement négligé.\n3. Réparer une petite injustice, même silencieuse.\n4. Choisir la droiture plutôt que la facilité.\n5. Mettre de l\'ordre dans une affaire laissée en suspens.\n👉 Action = agir comme si cela comptait vraiment.'
      },
      15: {
        spirituelle: '🌙 Jour 15 — Al-Fâtiha | Verset 5\n﴿ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴾\nC\'est Toi que nous adorons, et c\'est de Toi que nous implorons l\'aide.\n\n🧠 Sens du verset :\nCe verset est un engagement.\nIl affirme :\nl\'exclusivité de l\'adoration.\nla dépendance réelle à Allah.\nla fin de l\'illusion d\'autosuffisance.\nIl enseigne :\nl\'humilité active.\nl\'équilibre entre effort et reliance.\nla cohérence entre ce que l\'on dit et ce que l\'on vit.\n\n🌿 Spiritualité:\nLire le verset lentement, puis méditer sur cette parole comme un pacte personnel : adorer Allah seul et reconnaître son besoin d\'aide.',
        discipline: '🧭 Discipline:tenir l\'exclusivité et la reliance.\n1. Cesser aujourd\'hui de compter uniquement sur tes propres forces.\n2. Ne pas agir par orgueil ou autosuffisance.\n3. Revenir intérieurement à Allah avant une tâche difficile.\n4. Refuser de chercher l\'approbation des gens au détriment d\'Allah.\n5. Garder la cohérence entre l\'intention et l\'acte.\n👉 Discipline = ne pas se suffire à soi-même.',
        action: '🔥 Action:demander et agir juste\n1. Demander sincèrement l\'aide d\'Allah avant une action importante.\n2. Accepter l\'aide d\'une personne sans te sentir diminué.\n3. Renoncer à une action motivée par l\'ego.\n4. Poser un acte d\'adoration avec présence réelle.\n5. Agir sans te glorifier du résultat.\n👉 Action = agir en servant, pas en dominant.'
      },
      16: {
        spirituelle: '🌙 Jour 16 — Al-Fâtiha | Verset 6\n﴿ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴾\nGuide-nous sur le droit chemin.\n\n🧠 Sens du verset :\nCe verset est une demande claire, répétée chaque jour.\nIl affirme que :\nla guidance ne s\'improvise pas.\nconnaître le bien ne suffit pas, il faut y être conduit.\nla droiture est un chemin vivant, pas une idée abstraite.\nIl enseigne :\nl\'humilité face à la direction.\nla vigilance face aux écarts subtils.\nla nécessité de demander, encore et encore.\n\n🌿 Spiritualité:\nLire le verset lentement, puis le formuler intérieurement comme une demande réelle, personnelle et présente.',
        discipline: '🧭 Discipline: tenir la direction\n1. Refuser aujourd\'hui un choix flou ou ambigu.\n2. Ne pas justifier une décision que tu sais déviée.\n3. Ralentir avant toute décision importante.\n4. Vérifier que tes actions vont dans la même direction.\n5. Te rappeler que la droiture se tient au quotidien, pas ponctuellement.\n👉 Discipline = ne pas marcher sans direction.',
        action: '🔥 Action:marcher droit concrètement\n1. Choisir l\'option la plus droite même si elle est plus exigeante.\n2. Corriger un petit écart volontairement ignoré.\n3. Poser un acte cohérent avec ce que tu sais être juste.\n4. Renoncer à une facilité qui t\'éloigne du droit chemin.\n5. Avancer avec constance plutôt qu\'avec précipitation.\n👉 Action = mettre les pas dans la bonne direction.'
      },
      17: {
        spirituelle: '🌙 Jour 17 — Al-Fâtiha | Verset 7\n﴿ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴾\nLe chemin de ceux que Tu as comblés de faveurs,\nnon pas de ceux qui ont encouru Ta colère,\nni des égarés.\n\n🧠 Sens du verset :\nCe verset précise la demande de guidance.\nIl enseigne que :\ntous les chemins ne se valent pas.\nla droiture a des modèles concrets.\nl\'égarement peut venir soit du refus conscient, soit de la confusion.\nIl rappelle que la guidance n\'est pas abstraite :\nelle se voit dans les choix, les comportements, les fréquentations.\n\n🌿 Spiritualité:\nLire le verset lentement, puis méditer sur le chemin que tu suis réellement, pas celui que tu revendiques.',
        discipline: '🧭 Discipline:choisir le bon modèle.\n1. Ne pas imiter un comportement que tu sais erroné, même s\'il est courant.\n2. Refuser une habitude populaire mais contraire à tes valeurs.\n3. Être vigilant face à la confusion déguisée en "liberté".\n4. Ne pas persister dans une erreur connue par orgueil.\n5. Te rappeler que le bon chemin se reconnaît à ses fruits.\n👉 Discipline = ne pas suivre sans discernement',
        action: '🔥 Action: marcher avec les justes\n1. Align­er un choix concret avec un modèle droit et intègre.\n2. T\'éloigner d\'une influence qui te trouble intérieurement.\n3. Renforcer une pratique qui t\'ancre dans la droiture.\n4. Agir aujourd\'hui comme quelqu\'un que tu respectes spirituellement.\n5. Choisir la clarté plutôt que la facilité.\n👉 Action = marcher avec ceux qui ont reçu la faveur.'
      },
      18: {
        spirituelle: `🌙18 — Intégration de la lumière.\n\n🌿 Tâche spirituelle:\nKalwa Yâ Nûr.`,
        discipline: '🧭 Tâche de discipline:\n\nAujourd\'hui, n\'ajoute rien de nouveau.\nRespecte ce qui est déjà en place : rythme, engagements, décisions prises.\n\n> Sens : intégrer avant d\'accumuler.',
        action: '🔥 Tâche d\'action:\n\nApplique une chose apprise depuis le début du défi\ndans un geste concret de la journée\n(parole, comportement, choix simple).\n\n> Sens : la lumière devient réelle quand elle est vécue.'
      },
      18: {
        spirituelle: `Kalwa ${attribute}.`,
        discipline: 'Aujourd\'hui, n\'ajoute rien de nouveau.\nRespecte ce qui est déjà en place : rythme, engagements, décisions prises.\n\n> Sens : intégrer avant d\'accumuler.',
        action: 'Applique une chose apprise depuis le début du défi\ndans un geste concret de la journée\n(parole, comportement, choix simple).\n\n> Sens : la lumière devient réelle quand elle est vécue.'
      },
      19: {
        spirituelle: '🌙Jour 19 — Tenir sans compenser:\n\n🌿 Spiritualité:\n Kalwa Yâ Nûr.\n> Axe spirituel : rester avec la lumière sans fuite.',
        discipline: '🧭 Discipline:\n\nAujourd\'hui, ne cherche pas à te distraire\nquand un léger inconfort apparaît\n(ennui, impatience, vide, agitation).\n\n> Axe : arrêter la compensation.',
        action: '🔥 Action:\n\nContinue une tâche routinière jusqu\'au bout,\nsans la rendre plus agréable,\nsans t\'échapper mentalement.\n\n> Axe : fidélité à l\'ordinaire.',
        introspection: '🪞 Introspection:\n\nRépond intérieurement à cette question :\n« Qu\'est-ce que j\'utilise pour éviter de ressentir ? »\n\n> Axe : lucidité sans analyse.',
        ancrage: '🧱 Ancrage concret:\n\nAccepte un inconfort mineur aujourd\'hui\n(ne pas changer de place, ne pas optimiser, ne pas améliorer).\n\n> Axe : stabilité corporelle.'
      },
      20: {
        spirituelle: '🌙Jour 20 — Clarifier la vision\n---\n\n🌿 Spiritualité — Clarté intérieure:\n\nMéditation :\nPorter l\'attention sur le front comme lieu de concentration.\nVisualiser la lumière de guidance descendant vers le cœur.\nRéciter Yâ Nûr pendant 5 à 10 minutes.\n\n> Axe : voir juste avant d\'agir.',
        discipline: '🧭 Discipline — Ne pas se mentir:\n\nAujourd\'hui, ne te raconte pas d\'histoire\npour justifier une décision, un retard ou un choix flou.\nAppelle les choses par leur nom, intérieurement.\n\n> Axe : honnêteté intérieure.',
        action: '🔥 Action — Choix clair:\n\nFais un choix clair aujourd\'hui\nlà où tu laissais volontairement le flou\n(même un petit choix).\n\n> Axe : la clarté soulage le cœur.',
        introspection: '🪞 Introspection:\n\nPose-toi cette question, une seule fois :\n« Où est-ce que je sais déjà ce qui est juste ? »\n\n> Axe : reconnaître ce qui est déjà vu.',
        ancrage: '🧱 Ancrage concret:\n\nÉlimine une source de confusion matérielle:\nun objet mal placé, un message ambigu, une information inutile.\n\n> Axe : la clarté commence dans le concret.'
      },
      21: {
        spirituelle: '🌙Jour 21 — Poser une limite claire:\n---\n🌿 Spiritualité:\n Kalwa  Yâ Nûr.',
        discipline: '🧭 Discipline — Ne pas dépasser:\n\nAujourd\'hui, ne dépasse pas une limite claire :\n-temps.\n-énergie.\n-disponibilité.\n-Quand c\'est suffisant, tu t\'arrêtes.',
        action: '🔥 Action — Dire non une fois:\n\nDis un non juste aujourd\'hui\n(là où tu aurais dit oui par habitude ou pression).',
        introspection: '🪞 Introspection:\n\nRépond intérieurement à cette question :\n« Où est-ce que je me surcharge inutilement ? »',
        ancrage: '🧱 Ancrage concret:\n\nCrée une limite visible :\nfermer un onglet, couper une notification, fixer une fin claire à une activité.'
      },
      22: {
        spirituelle: '🌙Jour 22 — Suspendre la réaction:\n\n🌿 Spiritualité:\n\nRécite le du\'ā : Allāhumma ihdinī li-aḥsani l-akhlāq\nÔ Allah, guide-moi vers le meilleur comportement.\nRépète-le pendant quelques minutes, comme une demande de retenue.',
        discipline: '🧭 Discipline — Différer volontairement:\n\nDiffère volontairement une réponse ou une décision non urgente.\nChoisis consciemment de ne pas agir tout de suite.',
        action: '🔥 Action:\n\nLaisse une situation évoluer sans intervenir,\nmême si tu aurais habituellement pris la main.',
        introspection: '🪞 Introspection:\n\n« Qu\'est-ce qui déclenche mes réactions rapides ? »',
        ancrage: '🧱 Ancrage concret:\n\nRange ou mets hors de vue un élément\nqui provoque chez toi une réaction automatique\n(notification, application, objet).'
      },
      23: {
        spirituelle: '🌙Jour 23 — Détacher le cœur:\n-----\n🌿 Spiritualité:\n\nRécite le du\'ā : Allāhumma lā taj\'al ad-dunyā akbara hamminā\nÔ Allah, ne fais pas de ce monde notre plus grande préoccupation.\nRépète-le pendant quelques minutes, sans analyse.',
        discipline: '🧭 Discipline — Ne pas insister:\n\nAujourd\'hui, n\'insiste pas pour obtenir quelque chose\n(réponse, validation, résultat).',
        action: '🔥 Action:\n\nRenonce volontairement à une petite chose\nque tu voulais absolument aujourd\'hui.',
        introspection: '🪞 Introspection:\n\n« À quoi est-ce que je m\'accroche inutilement ? »',
        ancrage: '🧱 Ancrage concret:\n\nÉloigne-toi consciemment d\'un contenu, objet ou habitude\nqui capte excessivement ton attention.'
      },
      24: {
        spirituelle: '🌙Jour 24 — S\'établir intérieurement:\n-----\n🌿 Spiritualité — Stabilité intérieure\n\nMéditation :\nRespiration consciente.\nAttention portée au centre du corps (ventre) comme lieu de stabilité.\nRéciter Yâ Qawiyy pendant 5 à 10 minutes.\n\n> Objectif :\nRenforcer la stabilité et la maîtrise.',
        discipline: '🧭 Discipline — Tenir une position:\n\nAujourd\'hui, ne change pas d\'avis sur une décision simple\nque tu sais déjà juste.\nTiens ta position sans te justifier.',
        action: '🔥 Action — Effort maintenu:\n\nMaintiens un effort physique ou pratique jusqu\'au bout\n(même léger),\nsans l\'interrompre par confort.',
        introspection: '🪞 Introspection:\n\n« Où est-ce que je manque de fermeté intérieure ? »',
        ancrage: '🧱 Ancrage concret:\n\nAdopte une posture stable aujourd\'hui :\nassis droit, debout ancré, gestes posés\npendant une activité précise.'
      },
      25: {
        spirituelle: 'Jour 25 — Cesser l\'auto-accusation\n---\n🌿 Spiritualité — Dhikr\n\nRécite : Astaghfirullāh\n« Je demande pardon à Allah »\nRépète-le pendant quelques minutes,\ncomme une libération, pas comme une accusation.',
        discipline: '🧭 Discipline:\n\nAujourd\'hui, ne te parles pas durement.\nAucune phrase intérieure qui t\'accuse ou t\'écrase.',
        action: '🔥 Action:\n\nCorrige une petite erreur calmement,\nsans te reprocher de l\'avoir faite.',
        introspection: '🪞 Introspection:\n\n« De quoi est-ce que je me fais porter la faute inutilement ? »',
        ancrage: '🧱 Ancrage concret:\n\nDis intérieurement une phrase simple :\n« Je fais ce que je peux, et je confie le reste à Allah. »'
      },
      26: {
        spirituelle: '🌙Jour 26 — Retirer la comparaison\n-----\n🌿 Spiritualité — Dhikr\n\nRécite : Mā shā\' Allāh\n« Ce qu\'Allah a voulu »\nRépète-le pendant quelques minutes,\nen reconnaissant que chaque chemin est différent.',
        discipline: '🧭 Discipline:\n\nAujourd\'hui, ne te compares pas\nni en mieux, ni en moins bien.',
        action: '🔥 Action:\n\nRéduis volontairement une exposition\nqui nourrit la comparaison\n(réseaux, discussions, contenus).',
        introspection: '🪞 Introspection:\n\n« Qui est-ce que je regarde au lieu de regarder mon cœur ? »',
        ancrage: '🧱 Ancrage concret:\n\nOccupe-toi d\'une chose simple pour toi,\nsans référence à personne d\'autre.'
      },
      27: {
        spirituelle: '🌙Jour 27 — Déposer ce qui reste\n------\n🌿 Spiritualité :\n Kalwa  Yâ Nûr.',
        discipline: '🧭 Discipline:\n\nAujourd\'hui, ne rouvre pas un sujet ancien\n(pensée, discussion, souvenir)\nque ton cœur a déjà travaillé.',
        action: '🔥 Action:\n\nLaisse une chose inachevée en paix\nsans la forcer à se résoudre aujourd\'hui\n(si elle peut attendre sans conséquence).',
        introspection: '🪞 Introspection:\n\n« Qu\'est-ce que je peux laisser à Allah sans y revenir ? »',
        ancrage: '🧱 Ancrage concret:\n\nRange ou mets à distance un objet ou un élément symbolique\nlié à une préoccupation passée.'
      },
      28: {
        spirituelle: '🌙 Jour 28 — Sourate Yâ-Sîn (36:1–10).\n\n🧠 Thème central des versets.\nLe Coran est un rappel clair.\nLa voie droite est déjà connue,\nCertains cœurs se ferment par refus, pas par ignorance,\nLa guidance est proposée, jamais imposée\n\n🌿 SPIRITUALITÉ:\n(lecture & méditation)\n1. Lire les versets 1 à 10 lentement, sans multitâche et mediter',
        discipline: '🧭 DISCIPLINE\n(disponibilité au rappel)\n1. Couper volontairement toute distraction pendant le temps spirituel.\n2. Ne pas repousser la lecture à plus tard dans la journée.\n3. Respecter un moment fixe pour la lecture.\n4. Ne pas consommer d\'informations inutiles juste après la lecture.\n5. S\'abstenir de parler inutilement dans l\'heure qui suit.',
        action: '🔥 ACTION:\n(incarner la voie droite)\n1. Accomplir une action juste que tu sais déjà devoir faire.\n2. Corriger un comportement que tu sais incorrect.\n3. Répondre à une responsabilité que tu retardes.\n4. Poser un acte aligné avec une valeur claire de l\'islam.\n5. Cesser une action que tu sais inutile ou nuisible.',
        introspection: '🤍 INTROSPECTION:\n(voir les voiles intérieurs)\n1. Identifier une vérité que tu connais mais que tu évites.\n2. Reconnaître une habitude de justification intérieure.\n3. Observer une résistance quand un rappel apparaît.\n4. Noter ce qui te ferme intérieurement (peur, orgueil, confort).\n5. Accepter sans jugement ce qui est encore bloqué.',
        ancrage: '🪨 ANCRAGE CONCRET:\n(rendre le rappel vivant dans le corps)\n1. Marcher lentement en conscience après la lecture.\n2. Respirer profondément en sentant l\'air entrer et sortir.\n3. Ancrer les pieds au sol quelques instants.\n4. Se redresser physiquement (posture droite).\n5. Toucher un élément réel (sol, mur, objet) pour revenir au présent.'
      },
      29: {
        spirituelle: '🌙 Jour 29 — Sourate Yâ-Sîn (36:12–20)\n\n🧠 Sens des versets :\nDans ces versets, Allah تعالى parle de :\nCeux qui craignent Allah dans l\'invisible.\nLa récompense et le pardon promis.\nLe fait que tout est compté et inscrit.\nL\'exemple du peuple qui rejette les messagers.\nL\'homme venu de loin qui appelle à suivre la vérité, malgré l\'opposition.\n👉 Thème central :\nCroire sans voir, rester droit quand la majorité refuse, assumer la vérité même seul.\n\n🌿 SPIRITUALITÉ:\n(lecture & rappel)\n1. Lire les versets 12 à 20 lentement et entièrement, avec attention et silence après la lecture.',
        discipline: '🧭 DISCIPLINE:\n(fidélité intérieure, même sans regard extérieur)\n1. Agir correctement aujourd\'hui même si personne ne te voit.\n2. Respecter une obligation sans chercher reconnaissance.\n3. Ne pas modifier ton comportement pour plaire aux autres.\n4. Garder une intention droite dans un acte discret.\n5. Ne pas abandonner une bonne pratique par peur du regard.\n👉 Discipline = tenir dans l\'invisible',
        action: '🔥 ACTION:\n(témoigner par les actes)\n1. Défendre une vérité avec calme, sans agressivité.\n2. Poser un acte juste même s\'il est impopulaire.\n3. Soutenir une personne ou une cause juste discrètement.\n4. Dire une parole vraie quand le silence serait plus confortable.\n5. Choisir Allah plutôt que l\'approbation des gens.\n👉 Action = avancer même seul',
        introspection: '🤍 INTROSPECTION:\n(regard sur la sincérité)\n1. Observer ce que tu fais uniquement quand on te regarde.\n2. Identifier une peur liée au jugement des autres.\n3. Reconnaître où tu adaptes ta foi pour être accepté.\n4. Te demander : si personne ne voyait, agirais-je pareil ?\n5. Accueillir avec honnêteté tes contradictions intérieures.\n👉 Introspection = aligner l\'intérieur et l\'extérieur',
        ancrage: '🪨 ANCRAGE CONCRET:\n(incarner la fidélité)\n1. Marcher seul quelques minutes en silence.\n2. Poser les mains sur la poitrine et respirer calmement.\n3. Écrire une intention sincère et la garder pour toi.\n4. Ralentir volontairement un geste quotidien.\n5. Sentir le poids du corps et l\'instant présent.\n👉 Ancrage = rester stable quand l\'extérieur bouge.'
      },
      30: {
        spirituelle: '🌙 Jour 30 — Sourate Yâ-Sîn (36:21–30)\n\n🧠 Sens des versets :\nDans ces versets, Allah ﷻ parle de :\nSuivre ceux qui ne demandent aucune récompense.\nLa sincérité du message, sans intérêt personnel.\nLe rappel que la création entière témoigne d\'Allah.\nLe regret profond de ceux qui ont rejeté la vérité.\nLe caractère éphémère de la vie et des occasions manquées.\n👉 Thème central :\nLa vérité est simple, sincère, et sans contrepartie.\nLe plus grand regret est de l\'avoir reconnue trop tard.\n\n🌿 SPIRITUALITÉ\n(lecture & rappel)\n1. Lire les versets 21 à 30 lentement et entièrement, avec attention et silence après la lecture.',
        discipline: '🧭 DISCIPLINE:\n(pureté de l\'intention)\n1. Refuser de faire une bonne action dans l\'attente d\'un retour.\n2. Vérifier l\'intention avant d\'agir : pour Allah ou pour autre chose ?\n3. Continuer une action juste même sans encouragement.\n4. Ne pas conditionner le bien à une récompense.\n5. Éviter toute recherche de reconnaissance dans la foi.\n👉 Discipline = agir sans calcul',
        action: '🔥 ACTION:\n(sincérité incarnée)\n1. Accomplir un bien sans en parler à personne.\n2. Aider sans expliquer ni justifier ton geste.\n3. Dire une vérité utile sans chercher l\'approbation.\n4. Faire une sadaqa discrète, même minime.\n5. Poser un acte juste sans attendre de retour immédiat.\n👉 Action = donner sans attendre',
        introspection: '🤍 INTROSPECTION:\n(regarder le regret avant qu\'il n\'arrive)\n1. Identifier une vérité que tu reconnais mais que tu repousses\n2. Imaginer le regret de ne pas avoir agi aujourd\'hui\n3. Reconnaître où tu attends trop avant de faire le bien\n4. Te demander : qu\'est-ce que je ne veux pas regretter plus tard ?\n5. Accepter que certaines occasions ne reviennent pas\n👉 Introspection = agir avant le regret',
        ancrage: '🪨 ANCRAGE CONCRET:\n(se rappeler de la finitude)\n1. Marcher lentement en observant ce qui disparaît (ombres, sons)\n2. Toucher un objet simple et rappeler sa fragilité\n3. Respirer profondément en conscience de l\'instant\n4. Écrire une action que tu feras aujourd\'hui, pas demain\n5. T\'ancrer dans le présent sans projection excessive\n👉 Ancrage = vivre maintenant'
      },
      31: {
        spirituelle: '🌙 Jour 31 — Sourate Yâ-Sîn (36:31–40)\n\n🧠 Sens des versets:\nDans ces versets, Allah ﷻ parle de :\nLes générations passées détruites dont les gens ne tirent pas de leçon.\nLes signes constants d\'Allah dans la création.\nL\'ordre précis du jour et de la nuit.\nLe fait que chaque chose suit une trajectoire déterminée.\nL\'impossibilité pour la création de sortir du cadre qu\'Allah a fixé.\n👉 Thème central :\nLes signes sont clairs, répétés et stables.\nL\'oubli vient du cœur, pas du manque de preuves.\n\n🌿 SPIRITUALITÉ:\n(lecture & rappel)\n1. Lire les versets 31 à 40 lentement et entièrement, avec attention et silence après la lecture.',
        discipline: '🧭 DISCIPLINE:\n(respect de l\'ordre et des limites)\n1. Respecter un cadre précis aujourd\'hui (horaire, engagement, règle)\n2. Ne pas dépasser volontairement une limite connue\n3. Accepter une contrainte sans te plaindre\n4. Honorer un rythme naturel (repos, effort, silence)\n5. Cesser de lutter contre un ordre que tu ne contrôles pas\n👉 Discipline = se placer dans l\'ordre, pas contre lui',
        action: '🔥 ACTION:\n(s\'aligner avec l\'ordre voulu)\n1. Mettre de l\'ordre dans un aspect concret de ta vie\n2. Réparer un déséquilibre évident (excès, négligence)\n3. Agir avec régularité plutôt qu\'avec intensité\n4. Ajuster un comportement pour qu\'il soit plus juste et mesuré\n5. Respecter le temps des choses sans précipitation\n👉 Action = agir en harmonie',
        introspection: '🤍 INTROSPECTION:\n(regarder sa place)\n1. Identifier où tu refuses une limite\n2. Reconnaître une lutte inutile contre la réalité\n3. Observer ton rapport au temps (impatience, fuite)\n4. Te demander : suis-je aligné ou en résistance ?\n5. Accepter que tout n\'est pas entre tes mains\n👉 Introspection = retrouver sa juste place',
        ancrage: '🪨 ANCRAGE CONCRET:\n(s\'ancrer dans le rythme réel)\n1. Observer le ciel, la lumière ou l\'obscurité consciemment\n2. Marcher en suivant un rythme lent et régulier\n3. Synchroniser la respiration avec les pas\n4. S\'asseoir immobile quelques minutes\n5. Ressentir le passage du temps sans le combler\n👉 Ancrage = sentir l\'ordre dans le corps'
      },
      32: {
        spirituelle: '🌙 Jour 32 — Sourate Yâ-Sîn (36:41–50)\n\n🧠 Sens des versets:\nDans ces versets, Allah ﷻ parle de :\nSignes dans le déplacement et le transport (l\'arche, les moyens porteurs)\nLe fait qu\'Allah porte, protège et fait traverser.\nLa miséricorde...\n\n🌿 SPIRITUALITÉ:\n(lecture & rappel)\n1. Lire les versets 41 à 50 lentement et entièrement, avec attention et silence après la lecture.',
        discipline: '🧭 DISCIPLINE:\n(respect de l\'ordre et des limites)\n1. Respecter un cadre précis aujourd\'hui (horaire, engagement, règle)\n2. Ne pas dépasser volontairement une limite connue\n3. Accepter une contrainte sans te plaindre\n4. Honorer un rythme naturel (repos, effort, silence)\n5. Cesser de lutter contre un ordre que tu ne contrôles pas\n👉 Discipline = se placer dans l\'ordre, pas contre lui',
        action: '🔥 ACTION:\n(s\'aligner avec l\'ordre voulu)\n1. Mettre de l\'ordre dans un aspect concret de ta vie\n2. Réparer un déséquilibre évident (excès, négligence)\n3. Agir avec régularité plutôt qu\'avec intensité\n4. Ajuster un comportement pour qu\'il soit plus juste et mesuré\n5. Respecter le temps des choses sans précipitation\n👉 Action = agir en harmonie',
        introspection: '🤍 INTROSPECTION:\n(regarder sa place)\n1. Identifier où tu refuses une limite\n2. Reconnaître une lutte inutile contre la réalité\n3. Observer ton rapport au temps (impatience, fuite)\n4. Te demander : suis-je aligné ou en résistance ?\n5. Accepter que tout n\'est pas entre tes mains\n👉 Introspection = retrouver sa juste place',
        ancrage: '🪨 ANCRAGE CONCRET:\n(s\'ancrer dans le rythme réel)\n1. Observer le ciel, la lumière ou l\'obscurité consciemment\n2. Marcher en suivant un rythme lent et régulier\n3. Synchroniser la respiration avec les pas\n4. S\'asseoir immobile quelques minutes\n5. Ressentir le passage du temps sans le combler\n👉 Ancrage = sentir l\'ordre dans le corps'
      },
      36: {
        spirituelle: `Kalwa ${attribute}.`,
        discipline: 'Discipline — Ne rien ajouter\n\nAujourd\'hui, n\'ajoute aucune nouvelle pratique,\naucune nouvelle décision,\naucun nouvel engagement.\n\n> Sens : ce qui est juste n\'a plus besoin d\'être enrichi.',
        action: 'Action — Geste de clôture simple\n\nAccomplis un geste simple qui marque la fin :\n\nterminer proprement une tâche,\n\nranger un espace,\n\nfermer symboliquement quelque chose (cahier, onglet, note).\n\n> Sens : donner une forme concrète à la clôture intérieure.',
        introspection: 'Pose-toi cette question, sans chercher de réponse longue :\n« Qu\'est-ce qui est plus apaisé en moi qu\'au début ? »',
        ancrage: 'Prends un moment sans stimulation\n(pas d\'écran, pas de contenu, pas de recherche),\njuste pour laisser redescendre.'
      },
      37: {
        spirituelle: 'KUN (Sois)\n\nLecture : Yâ-Sîn — versets 81 à 83\n\n🌿 5 tâches spirituelles\n\n1. Lecture et méditation\nLire lentement Yâ-Sîn, versets 81 à 83,\nen s\'arrêtant sur la puissance du commandement divin.\n\n2. Dhikr\nRéciter Subḥānallāh\n(Gloire à Allah)\npendant quelques minutes.\n\n3. Présence silencieuse\nRester immobile quelques instants après la lecture,\nsans parole, sans demande.\n\n4. Contemplation intérieure\nPorter l\'attention sur le cœur\net reconnaître la Toute-Puissance d\'Allah.\n\n5. Remise simple\nDire intérieurement :\n« Ô Allah, ce qui doit être, sera. »',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      },
      38: {
        spirituelle: 'FA (Alors)\n\nPoint de présence de l\'ancrage (Pieds)\nLecture : Yâ-Sîn — versets 81 à 83\n\n🌿 5 tâches spirituelles\n\n1. Méditation d\'ancrage\nMarcher lentement et consciemment.\nRessentir l\'ancrage dans la création d\'Allah.\nRéciter Yâ Wâsi‘ pendant 5 à 10 minutes.\n\n2. Dhikr\nRéciter Al-ḥamdu lillāh\n(Louange à Allah)\npendant quelques minutes.\n\n3. Lecture et méditation\nRelire Yâ-Sîn, versets 81 à 83,\nen ressentant le Fa : ce qui suit naturellement la Volonté divine.\n\n4. Marche consciente silencieuse\nContinuer à marcher quelques instants\nsans parole ni pensée dirigée.\n\n5. Reconnaissance intérieure\nDire intérieurement :\n« Ce qui vient d\'Allah est juste. »',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      },
      39: {
        spirituelle: 'YAKŪN (Et c\'est)\n\nLecture : Yâ-Sîn — versets 81 à 83\n\n🌿 5 tâches spirituelles\n\n1. Lecture et méditation\nLire Yâ-Sîn, versets 81 à 83\ncomme un décret paisible et accompli.\n\n2. Dhikr\nRéciter Allāhu Akbar\n(Allah est plus Grand)\npendant quelques minutes.\n\n3. Contemplation extérieure\nRegarder le ciel, la nature ou un espace ouvert,\nen silence.\n\n4. Silence du cœur\nRester quelques instants sans formuler d\'intention ni de demande.\n\n5. Remise finale\nDire intérieurement :\n« Ô Allah, je Te remets ce chemin et ses fruits. »',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      }
    };
    return descriptions[day] || null;
  }
  
  // Défi 2 : Libération Spirituelle (Yâ Ḥafîẓ)
  if (challengeId === 'liberation-spirituelle') {
    const descriptions: Record<number, any> = {
      1: {
        spirituelle: '🌿 Nur Shifa — Protection initiale\n\nLire Al-Fâtiha sur un verre d\'eau.\n\nSouffler légèrement dessus.\n\nBoire cette eau ou s\'en essuyer le visage.\n\n(Geste de mise sous protection.)',
        discipline: null,
        action: null
      },
      2: {
        spirituelle: '🌿 Tâche spirituelle — Présence protectrice du cœur\n\nMéditation :\nPorter doucement l\'attention sur le cœur\ncomme un espace qu\'Allah protège.\n\nVisualiser une lumière protectrice entourant le cœur\n(comme un voile ou une enveloppe).\n\nRéciter Yâ Ḥafîẓ pendant quelques minutes.\n\n> Objectif :\nSentir que le cœur n\'est plus exposé, mais gardé.',
        discipline: '🧭 Tâche de discipline — Préserver le cœur\n\nAujourd\'hui, n\'expose pas ton cœur inutilement :\n\névite une discussion qui t\'agite,\n\nne te livre pas à quelqu\'un qui ne respecte pas ton état.\n\n> Se protéger n\'est pas fuir.',
        action: '🔥 Tâche d\'action — Geste de protection\n\nÉloigne-toi volontairement d\'une source d\'agitation\n(contenu, personne, pensée répétitive)\nmême temporairement.\n\n> Ce que tu retires n\'entre plus.'
      },
      3: {
        spirituelle: `🌿 Tâche spirituelle — Kalwa Yâ Ḥafîẓ\n\n> Objectif : sentir que tu n'es pas exposé.`,
        discipline: '🧭 Tâche de discipline — Préserver ton état\n\nAujourd\'hui, ne te justifie pas inutilement.\nCe qui est clair pour toi n\'a pas besoin d\'être défendu.',
        action: '🔥 Tâche d\'action — Retrait conscient\n\nFais un pas de retrait volontaire\nface à une situation qui te met sous pression\n(silence, distance, pause).'
      },
      4: {
        spirituelle: '🌿 Tâche spirituelle — Dhikr de retenue\n\nRéciter doucement :\n\nHasbiyallāhu lā ilāha illā Huwa\n« Allah me suffit, il n\'y a de divinité que Lui »\n\nPendant quelques minutes,\ncomme une affirmation de suffisance intérieure.\n\n> Objectif :\nNe plus laisser entrer ce qui n\'est pas nécessaire.',
        discipline: '🧭 Tâche de discipline — Choisir ce qui entre\n\nAujourd\'hui, choisis consciemment ce que tu laisses entrer :\nparoles, informations, émotions, demandes.',
        action: '🔥 Tâche d\'action — Fermeture concrète\n\nFerme une porte inutile :\n\nune discussion,\n\nune application,\n\nune habitude,\n\nun accès qui t\'envahit.'
      },
      5: {
        spirituelle: '🌿 Tâche spirituelle — Dhikr de décharge\n\nRéciter doucement :\n\nTawakkaltu \'alā Allāh\n« Je m\'en remets à Allah »\n\nPendant quelques minutes,\ncomme un dépôt conscient.\n\n> Objectif :\nRemettre à Allah ce que ton cœur porte inutilement.',
        discipline: '🧭 Tâche de discipline — Ne pas absorber\n\nAujourd\'hui, n\'absorbe pas les émotions ou problèmes des autres.\nTu peux écouter, mais tu ne portes pas.',
        action: '🔥 Tâche d\'action — Restitution\n\nIdentifie une charge que tu portes pour quelqu\'un d\'autre\n(et qui ne t\'est pas demandée)\net rends-la intérieurement à Allah.'
      },
      6: {
        spirituelle: '🌿 Tâche spirituelle — Parole retenue\n\nDhikr conscient :\nRéciter doucement :\n\nSubḥānallāhi wa biḥamdih\n« Gloire et louange à Allah »\n\nPendant quelques minutes,\nen ressentant la retenue et la paix dans la gorge.\n\n> Objectif :\nInstaller une parole protégée, mesurée.',
        discipline: '🧭 Tâche de discipline — Parler moins, parler juste\n\nAujourd\'hui, ne dis pas tout ce que tu penses.\nGarde pour toi ce qui n\'apporte ni bien ni apaisement.',
        action: '🔥 Tâche d\'action — Silence choisi\n\nChoisis un moment précis de la journée\noù tu gardes le silence,\nmême si tu pourrais parler.'
      },
      7: {
        spirituelle: '🌿 Tâche spirituelle — Lecture & protection\n\nLire le verset 4:45 (An-Nisâ\') ou le verset 2:255 (Âyat al-Kursî),\nlentement, avec présence.\n\nPuis dire intérieurement :\n« Allah me suffit comme protecteur. »\n\n> Objectif :\nRappeler au cœur que la protection vient d\'Allah, non du contrôle.',
        discipline: '🧭 Tâche de discipline — Ne pas anticiper le mal\n\nAujourd\'hui, ne projette pas ce qui pourrait mal se passer.\nQuand une crainte apparaît, tu ne la développes pas.',
        action: '🔥 Tâche d\'action — Geste de confiance\n\nFais une chose que tu repousses par peur\n(même petite),\nsans chercher à tout sécuriser avant.'
      },
      8: {
        spirituelle: '🌿 Tâche spirituelle — Prostération consciente\n\nEffectuer une prosternation volontaire (sujūd)\nen dehors de la prière obligatoire.\n\nDans la prosternation, dire intérieurement (sans formule imposée)\nce qui te pèse, te fait peur ou t\'encombre.\n\nRester quelques instants dans cette position.\n\n> Objectif :\nDéposer ce que le cœur n\'arrive plus à porter debout.',
        discipline: '🧭 Tâche de discipline — Ne pas retenir\n\nAujourd\'hui, ne retiens pas intérieurement\nce que tu peux confier à Allah.',
        action: '🔥 Tâche d\'action — Abaissement volontaire\n\nAccomplis un geste d\'humilité discret\n(servir, demander aide, reconnaître un tort).'
      },
      9: {
        spirituelle: `🌿 Tâche spirituelle — Kalwa ya hafiz\n\n> Objectif : retrouver un espace intérieur protégé.`,
        discipline: '🧭 Tâche de discipline — Préserver son seuil\n\nAujourd\'hui, ne t\'expose pas inutilement :\npas d\'explication superflue,\npas de justification automatique,\npas d\'ouverture non nécessaire.',
        action: '🔥 Tâche d\'action — Retrait choisi\n\nChoisis une situation où tu te retires calmement\navant que la tension n\'apparaisse\n(fin de discussion, pause, distance).'
      },
      10: {
        spirituelle: '🌿 Tâche spirituelle — Actes et ouverture\n\nMéditation :\nPoser les mains sur le cœur ou devant soi,\nréciter Yâ Fattâḥ,\npuis accomplir une action concrète juste.\n\n> Objectif : relier le dhikr à l\'action.',
        discipline: '🧭 Tâche de discipline — Clarifier avant d\'agir\n\nAujourd\'hui, n\'agis pas dans la confusion.\nAvant un geste important, demande-toi intérieurement :\n« Est-ce que cet acte protège ou m\'expose ? »\nPuis agis en conséquence.\n\n👉 Axe nouveau : discernement de l\'acte, pas le courage.',
        action: '🔥 Tâche d\'action — Acte protecteur\n\nFais un acte qui te protège :\n\nposer un cadre,\n\nsécuriser quelque chose,\n\nprévenir plutôt que réparer,\n\nmettre une limite concrète.\n\n👉 Axe nouveau : agir pour préserver, pas pour avancer.'
      },
      18: {
        spirituelle: `🌿 Tâche spirituelle — Kalwa Yâ Ḥafîẓ`,
        discipline: '🧭 Tâche de discipline — Ne pas rouvrir\n\nAujourd\'hui, ne rouvre pas :\n\nune discussion passée,\n\nune pensée déjà traitée,\n\nune inquiétude déjà confiée à Allah.\n\n👉 Ce qui est déposé ne se reprend pas.',
        action: '🔥 Tâche d\'action — Acte de retrait clair\n\nFais un acte concret de retrait :\n\narrêter une interaction inutile,\n\nte désengager d\'une attente,\n\nmettre fin à une habitude spirituellement pesante.\n\n👉 La libération passe aussi par l\'arrêt.'
      },
      19: {
        spirituelle: `🌿 Tâche spirituelle — Kalwa Yâ Ḥafîẓ`,
        discipline: '🧭 Tâche de discipline — Ne pas s\'accrocher\n\nAujourd\'hui, n\'insiste pas\nlà où tu sens une résistance intérieure\n(réponse, validation, résultat).\n\n👉 L\'attachement nourrit la dépendance.',
        action: '🔥 Tâche d\'action — Lâcher volontairement\n\nRenonce volontairement à une chose\nque tu voulais contrôler, obtenir ou maintenir aujourd\'hui.\n\n👉 Lâcher est un acte.',
        introspection: '🪞 Tâche d\'introspection — Question unique\n\nPose-toi intérieurement :\n« À quoi est-ce que je m\'accroche encore par sécurité ? »',
        ancrage: '🧱 Tâche d\'ancrage concret — Détachement visible\n\nÉloigne-toi concrètement d\'un élément\n(objet, habitude, interaction)\nqui maintient cet attachement.'
      },
      20: {
        spirituelle: '🌿 Tâche spirituelle — Clarté intérieure (inchangée)\n\nMéditation :\nPorter l\'attention sur le front comme lieu de concentration.\nVisualiser la lumière de guidance descendant vers le cœur.\nRéciter Yâ Nûr pendant 5 à 10 minutes.',
        discipline: '🧭 Tâche de discipline — Ne pas interpréter\n\nAujourd\'hui, n\'interprète pas :\n\nles intentions des autres,\n\nles signes,\n\nles silences.\n\n👉 Tu constates, sans tirer de conclusion.',
        action: '🔥 Tâche d\'action — Simplification\n\nSupprime une option, une hypothèse ou un scénario\nqui complique inutilement ta situation actuelle.\n\n👉 La clarté vient souvent par retrait.',
        introspection: '🪞 Tâche d\'introspection — Question unique\n\nDemande-toi une seule fois :\n« Qu\'est-ce que je complique alors que c\'est simple ? »',
        ancrage: '🧱 Tâche d\'ancrage concret — Vision nette\n\nNettoie ou ordonne un espace visuel\n(bureau, écran, notes, environnement)\npour qu\'il n\'y ait qu\'un essentiel visible.'
      },
      21: {
        spirituelle: `🌿 Tâche spirituelle — Kalwa Yâ Ḥafîẓ`,
        discipline: '🧭 Tâche de discipline — Ne pas vérifier\n\nAujourd\'hui, ne vérifie pas :\n\nune réponse attendue,\n\nun résultat,\n\nune réaction.\n\n👉 La protection n\'a pas besoin de contrôle.',
        action: '🔥 Tâche d\'action — Laisser se faire\n\nLaisse une chose suivre son cours\nsans intervenir, relancer ou ajuster.\n\n👉 La libération passe parfois par l\'inaction.',
        introspection: '🪞 Tâche d\'introspection — Question unique\n\nPose-toi intérieurement :\n« Qu\'est-ce que je surveille encore par peur ? »',
        ancrage: '🧱 Tâche d\'ancrage concret — Dépôt symbolique\n\nDépose symboliquement une préoccupation\n(en la notant puis en fermant la note,\nou en posant un objet à distance).'
      },
      22: {
        spirituelle: '🌿 Tâche spirituelle — Rappel de paix\n\nRéciter calmement :\n\nSalāmun qawlan min Rabbin Raḥīm\n« Paix, parole venant d\'un Seigneur Miséricordieux » (Yâ-Sîn 58)\n\nLaisser la paix descendre, sans analyse.',
        discipline: '🧭 Tâche de discipline — Ne pas se justifier\n\nAujourd\'hui, ne te justifie pas\nquand tu n\'as rien fait de mal.',
        action: '🔥 Tâche d\'action — Laisser passer\n\nLaisse une critique, une remarque ou un malaise\npasser sans répondre ni corriger.',
        introspection: '🪞 Tâche d\'introspection\n\n« Où est-ce que je me défends alors que je pourrais rester en paix ? »',
        ancrage: '🧱 Tâche d\'ancrage concret\n\nDétends consciemment les épaules et la mâchoire\nà un moment précis de la journée.'
      },
      23: {
        spirituelle: '🌿 Tâche spirituelle — Présence simple\n\nLire lentement ce verset :\n\nWa mā tashā\'ūna illā an yashā\' Allāh\n« Vous ne voulez que ce qu\'Allah veut » (At-Takwîr 29)\n\nRester quelques instants avec ce rappel.',
        discipline: '🧭 Tâche de discipline — Rester dans l\'instant\n\nAujourd\'hui, ne projette pas\ncomment une situation va évoluer.',
        action: '🔥 Tâche d\'action — Faire seulement l\'étape juste\n\nFais uniquement l\'action nécessaire maintenant,\nsans préparer la suite.',
        introspection: '🪞 Tâche d\'introspection\n\n« Qu\'est-ce que j\'essaie d\'anticiper pour me rassurer ? »',
        ancrage: '🧱 Tâche d\'ancrage concret\n\nRamène ton attention à un geste présent\n(mains, respiration naturelle, posture)\nsans le modifier.'
      },
      24: {
        spirituelle: '🌿 Tâche spirituelle — Stabilité intérieure (inchangée)\n\nMéditation :\nRespiration consciente.\nAttention portée au centre du corps (ventre) comme lieu de stabilité.\nRéciter Yâ Qawiyy pendant 5 à 10 minutes.\n\n> Objectif : renforcer la stabilité et la maîtrise intérieure.',
        discipline: '🧭 Tâche de discipline — Ne pas réagir au premier mouvement\n\nAujourd\'hui, ne suis pas la première impulsion\n(peur, colère, envie, malaise).\nTu attends que le mouvement se pose.',
        action: '🔥 Tâche d\'action — Choix posé\n\nFais une action lente et volontaire\nlà où tu aurais tendance à agir vite\n(marche, réponse, décision simple).',
        introspection: '🪞 Tâche d\'introspection — Question unique\n\nDemande-toi une seule fois :\n« Où est-ce que je réagis avant d\'être stable ? »',
        ancrage: '🧱 Tâche d\'ancrage concret — Stabilité physique\n\nAdopte consciemment une posture stable\n(assis ou debout)\npendant une activité précise de la journée.'
      },
      25: {
        spirituelle: '🌿 Spirituelle — Lecture consciente\n\nLire lentement Sourate Quraysh (106).\nRessentir la sécurité qu\'Allah donne sans condition visible.',
        discipline: '🧭 Discipline\n\nAujourd\'hui, ne laisse pas une peur décider à ta place,\nmême si elle est discrète.',
        action: '🔥 Action\n\nFais une petite chose que tu évites depuis longtemps\nnon par incapacité,\nmais par peur diffuse.',
        introspection: '🪞 Introspection\n\n« De quoi ai-je peur sans jamais le dire ? »',
        ancrage: '🧱 Ancrage concret\n\nExpire profondément en conscience après cette action,\nsans te justifier.'
      },
      26: {
        spirituelle: '🌿 Spirituelle — Salât \'ala n-Nabî ﷺ\n\nEnvoyer des salawat sur le Prophète ﷺ\nquelques minutes,\nen te rappelant qu\'il ﷺ a été rejeté tout en étant véridique.',
        discipline: '🧭 Discipline\n\nAujourd\'hui, ne cherche pas à être validé\nni par parole, ni par attitude.',
        action: '🔥 Action\n\nAgis justement,\nmême si personne ne le remarque.',
        introspection: '🪞 Introspection\n\n« Qui est-ce que j\'essaie de satisfaire intérieurement ? »',
        ancrage: '🧱 Ancrage concret\n\nNe regarde pas la réaction des autres après ton acte.'
      },
      27: {
        spirituelle: `🌿 Spirituelle — Kalwa Yâ Ḥafîẓ\n\nEntrer en Kalwa avec Yâ Ḥafîẓ.\nSentir que ce qui est gardé par Allah ne dépend pas de ta vigilance.`,
        discipline: '🧭 Discipline\n\nAujourd\'hui, n\'anticipe pas un problème\nqui n\'est pas encore là.',
        action: '🔥 Action\n\nLaisse volontairement une chose incomplète\nqui peut attendre sans danger.',
        introspection: '🪞 Introspection\n\n« Qu\'est-ce que je contrôle par peur de lâcher ? »',
        ancrage: '🧱 Ancrage concret\n\nPose tes mains ouvertes quelques instants\nen signe de remise.'
      },
      36: {
        spirituelle: `🌿 Spiritualité — Kalwa Yâ Ḥafîẓ`,
        discipline: '🧭 Discipline — Ne pas revenir en arrière\n\nAujourd\'hui, ne retourne pas vers une ancienne habitude intérieure :\ndoute, scénario, peur, attachement, besoin de validation.\n\n> C\'est fini : on ne réouvre pas.',
        action: '🔥 Action — Couper le lien\n\nCoupe un lien invisible par un geste clair :\narrêter une vérification, cesser une relance, mettre fin à une attente.\n\n> La chaîne meurt quand on n\'y touche plus.',
        introspection: '🪞 Introspection — Question de clôture\n\nRépond intérieurement :\n« Quelle chaîne s\'est le plus affaiblie en moi ? »\n\n> Juste une réponse courte.',
        ancrage: '🧱 Ancrage concret — Sceau\n\nÉcris une phrase simple (papier ou note) :\n« Je ferme cette porte. Allah me suffit. »\nPuis ferme la note.\n\n> Un sceau visible pour une clôture invisible.'
      },
      37: {
        spirituelle: '🌑 KUN (Sois)\n\nLecture : Yâ-Sîn 81–83\n\n🌿 5 tâches spirituelles\n\n1. Lecture & méditation\nLire lentement Yâ-Sîn 81 à 83, en laissant résonner le commandement divin.\n\n2. Dhikr\nRéciter Subḥānallāh\n(Gloire à Allah), quelques minutes.\n\n3. Silence conscient\nRester immobile après la lecture, sans parole ni demande.\n\n4. Abandon intérieur\nDire intérieurement :\n« Ô Allah, ce qui doit être, sera. »\n\n5. Présence du cœur\nPorter l\'attention sur le cœur, sans image, juste présence.',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      },
      38: {
        spirituelle: '🌒 FA (Alors)\n\nPoint de présence de l\'ancrage (Pieds)\nLecture : Yâ-Sîn 81–83\n\n🌿 5 tâches spirituelles\n\n1. Méditation d\'ancrage\nMarcher lentement et consciemment.\nRessentir l\'ancrage dans la création d\'Allah.\nRéciter Yâ Wâsi‘ pendant 5 à 10 minutes.\n\n2. Lecture & méditation\nLire Yâ-Sîn 81 à 83, en ressentant le Fa : ce qui se déploie.\n\n3. Dhikr\nRéciter Al-ḥamdu lillāh\n(Louange à Allah), quelques minutes.\n\n4. Marche silencieuse\nContinuer à marcher sans parole ni intention formulée.\n\n5. Reconnaissance intérieure\nDire intérieurement :\n« Ce qui vient d\'Allah est juste. »',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      },
      39: {
        spirituelle: '🌕 YAKŪN (Et c\'est)\n\nLecture : Yâ-Sîn 81–83\n\n🌿 5 tâches spirituelles\n\n1. Lecture & méditation\nLire Yâ-Sîn 81 à 83 comme un décret paisible et accompli.\n\n2. Dhikr\nRéciter Allāhu Akbar\n(Allah est plus Grand), quelques minutes.\n\n3. Contemplation\nObserver le ciel, la nature\nen silence.\n\n4. Silence du cœur\nRester quelques instants\nsans demande, sans projection.\n\n5. Remise finale\nDire intérieurement :\n« Ô Allah, je Te remets les fruits de ce chemin. »',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      }
    };
    return descriptions[day] || null;
  }
  
  // Défi 3 : Discipline & Baraka (Yâ Qawiyy)
  if (challengeId === 'discipline-baraka') {
    const descriptions: Record<number, any> = {
      1: {
        spirituelle: '🌿 Nur Shifa — Mise en baraka\n\nLire Al-Fâtiha sur un verre d\'eau.\n\nSouffler légèrement dessus.\n\nBoire cette eau ou s\'en essuyer le visage.\n\n(Geste de bénédiction et de mise en ordre.)',
        discipline: null,
        action: null
      },
      2: {
        spirituelle: '🌿 Tâche spirituelle — Présence du cœur (inchangée)\n\nMéditation :\nPorter l\'attention sur le cœur comme lieu de réception de la miséricorde d\'Allah.\nVisualiser une lumière apaisante (comme symbole).\nRéciter Yâ Raḥmân, Yâ Raḥîm pendant 5 à 10 minutes.\n\n> Objectif : adoucir le cœur et installer la sakîna.',
        discipline: '🧭 Tâche de discipline — Ralentir volontairement\n\nAujourd\'hui, ralentis volontairement un moment précis de ta journée\n(parole, geste, déplacement, décision).\n\n👉 La discipline commence par la maîtrise du rythme.',
        action: '🔥 Tâche d\'action — Geste régulier\n\nAccomplis un petit geste régulier\nque tu pourras refaire chaque jour\n(même très simple).\n\n👉 La baraka vient de ce qui revient, pas de ce qui impressionne.'
      },
      3: {
        spirituelle: `🌿 Tâche spirituelle — Kalwa Yâ Qawiyy\n\nEntrer en Kalwa avec l'invocation Yâ Qawiyy`,
        discipline: '🧭 Tâche de discipline — Ne pas rompre\n\nAujourd\'hui, ne romps pas :\n\nun engagement simple,\n\nun horaire décidé,\n\nune règle que tu t\'es fixée.\n\n👉 Même si l\'envie baisse, tu tiens.',
        action: '🔥 Tâche d\'action — Continuité minimale\n\nRefais le même geste que la veille (Jour 2),\nmême plus petit,\nmais sans l\'abandonner.\n\n👉 La baraka s\'installe quand quelque chose continue.'
      },
      4: {
        spirituelle: '🌿 Tâche spirituelle — Présence et clarté\n\nRéciter doucement :\nRabbi zidnī \'ilmā\n« Seigneur, augmente-moi en science (clarté). »\n\nRester quelques instants en présence après la récitation.\n\n> Objectif :\nClarifier l\'intention avant l\'effort.',
        discipline: '🧭 Tâche de discipline — Structurer\n\nAujourd\'hui, donne une forme claire à une chose floue :\nhoraire, tâche, objectif, intention.\n\n👉 La discipline commence quand c\'est défini.',
        action: '🔥 Tâche d\'action — Organisation simple\n\nRange ou organise un seul espace précis\n(pas tout, juste un).\n\n👉 La baraka aime l\'ordre simple.'
      },
      5: {
        spirituelle: '🌿 Tâche spirituelle — Équilibre\n\nRéciter calmement :\nAllāhumma bārik lanā fī waqtinā\n« Ô Allah, mets la baraka dans notre temps. »\n\nRessentir le temps comme un don, non une pression.',
        discipline: '🧭 Tâche de discipline — Ne pas forcer\n\nAujourd\'hui, ne te surcharge pas.\nArrête-toi quand le seuil est atteint.\n\n👉 Forcer fait perdre la baraka.',
        action: '🔥 Tâche d\'action — Priorité unique\n\nChoisis une seule priorité réelle pour la journée\net fais-la correctement, sans dispersion.\n\n👉 Une chose bénie vaut mieux que dix inachevées.'
      },
      6: {
        spirituelle: '🌿 Tâche spirituelle — Point de présence de la parole (Gorge)\n\nMéditation :\nPorter l\'attention sur la gorge comme lieu de passage de la parole.\nRessentir le souffle qui monte et descend.\nRéciter Subḥāna Rabbiyal \'Aẓīm lentement, pendant 5 à 10 minutes.\n\n> Objectif :\nPurifier la parole et installer une parole mesurée, porteuse de baraka.',
        discipline: '🧭 Tâche de discipline — Parler avec intention\n\nAujourd\'hui, ne parle pas sans intention claire.\nAvant de parler, demande-toi intérieurement :\n« Est-ce utile, juste ou nécessaire ? »\n\n👉 La discipline commence avant que la parole ne sorte.',
        action: '🔥 Tâche d\'action — Parole bénéfique\n\nPrononce une parole bénéfique et mesurée aujourd\'hui :\nencouragement, vérité douce, rappel utile — sans excès.\n\n👉 Une parole juste peut suffire à faire entrer la baraka.'
      },
      7: {
        spirituelle: '🌿 Tâche spirituelle — Attention rassemblée\n\nLire lentement "Alam nashraḥ laka ṣadrak" (94:1)\n« N\'avons-Nous pas ouvert pour toi ta poitrine ? »\nRester quelques instants avec ce sens d\'ouverture calme.\n\n> Objectif : rassembler l\'attention sans tension.',
        discipline: '🧭 Tâche de discipline — Une chose à la fois\n\nAujourd\'hui, évite le multitâche.\nTermine une action avant d\'en commencer une autre.',
        action: '🔥 Tâche d\'action — Focus bref\n\nConsacre un court moment à une seule tâche, sans interruption.'
      },
      8: {
        spirituelle: '🌿 Tâche spirituelle — Souplesse intérieure\n\nRéciter calmement :\nAllāhumma yassir wa lā tu\'assir\n« Ô Allah, facilite et ne complique pas. »\n\n> Objectif : installer une force souple, durable.',
        discipline: '🧭 Tâche de discipline — Ajuster sans abandonner\n\nSi quelque chose est trop lourd aujourd\'hui, ajuste-le\n(plutôt que de l\'abandonner).',
        action: '🔥 Tâche d\'action — Version allégée\n\nFais la version la plus simple d\'une tâche importante,\nmais fais-la.'
      },
      9: {
        spirituelle: `🌿 Tâche spirituelle — Kalwa Yâ Qawiyy\n\nEntrer en Kalwa avec l'invocation Yâ Qawiyy.\n\n> Goûter à une force qui tient sans lutter.`,
        discipline: '🧭 Tâche de discipline — Tenir sans se presser\n\nAujourd\'hui, ne te presse pas.\nGarde le rythme décidé, même lent, sans accélérer pour "finir".\n\n👉 La baraka se perd dans la précipitation.',
        action: '🔥 Tâche d\'action — Stabilité concrète\n\nAccomplis une action simple mais régulière\nà heure fixe ou dans un cadre précis.\n\n👉 Ce qui est stable attire la baraka.'
      },
      10: {
        spirituelle: '🌿 Tâche spirituelle — Point de présence des actes (Mains)\n\nMéditation :\nPoser les mains sur le cœur ou devant soi.\nRéciter Yâ Fattâḥ, puis rester un instant en présence.\nEnsuite, accomplir un acte juste (simple, clair, sans excès).\n\n> Objectif :\nRelier la force intérieure à l\'action concrète porteuse de baraka.',
        discipline: '🧭 Tâche de discipline — Choisir avant d\'agir\n\nAujourd\'hui, choisis consciemment ce que tu fais\net renonce à ce qui n\'est pas essentiel.\n\n👉 La discipline, c\'est aussi savoir dire non.',
        action: '🔥 Tâche d\'action — Acte utile\n\nRéalise une action utile qui produit un bénéfice réel\n(même modeste), sans chercher à en faire plus.\n\n👉 La baraka accompagne l\'utilité.'
      },
      18: {
        spirituelle: `🌿 Tâche spirituelle — Kalwa Yâ Qawiyy\n\nEntrer en Kalwa avec l'invocation Yâ Qawiyy.\nAujourd'hui, ne cherche pas l'énergie ni l'émotion.\nRessens simplement la force qui reste même quand l'élan disparaît.\n\nObjectif :\nGoûter à une force stable, indépendante de l'humeur.`,
        discipline: '🧭 Tâche de discipline — Faire même sans envie\n\nAujourd\'hui, fais ce qui est prévu,\nmême si l\'envie n\'est pas là,\nsans chercher à ressentir quoi que ce soit.\n\n👉 La discipline commence quand l\'envie n\'est plus le moteur.',
        action: '🔥 Tâche d\'action — Continuité silencieuse\n\nRéalise une action utile et discrète,\nsans en parler, sans la montrer, sans t\'en féliciter.\n\n👉 La baraka aime ce qui est fait en silence.'
      },
      19: {
        spirituelle: `🌿 Tâche spirituelle — kalwa\nYâ Qawiyy`,
        discipline: '🧭 Tâche de discipline — Horaire respecté\n\nAujourd\'hui, respecte un horaire précis\nmême si la tâche est courte.\n\n👉 La baraka aime ce qui est cadré.',
        action: '🔥 Tâche d\'action — Régularité visible\n\nRépète un geste utile que tu as déjà fait les jours précédents,\nau même moment ou dans le même cadre.\n\n👉 La répétition juste installe la baraka.',
        introspection: '🪞 Tâche d\'introspection — Question unique\n\nDemande-toi une seule fois :\n« Où est-ce que je manque encore de régularité ? »',
        ancrage: '🧱 Tâche d\'ancrage concret — Marque de constance\n\nNote quelque part (papier, note, agenda)\nce que tu veux tenir jusqu\'à la fin du défi.\n\n👉 Ce qui est écrit s\'ancre.'
      },
      20: {
        spirituelle: '🌿 Tâche spirituelle — Point de présence de la vision\n\nMéditation :\nPorter l\'attention sur le front comme lieu de clarté.\nVisualiser une lumière douce et stable qui éclaire la direction.\nRéciter doucement :\n\nYâ Nûr\n\nPendant 5 à 10 minutes.\n\n> Objectif :\nRecevoir une vision juste, sans confusion ni agitation.',
        discipline: '🧭 Tâche de discipline — Ne pas brouiller\n\nAujourd\'hui, n\'ajoute rien à ce que tu fais déjà :\nni nouvelle règle,\nni nouvel objectif,\nni nouvelle méthode.\n\n👉 La baraka se bloque quand on brouille.',
        action: '🔥 Tâche d\'action — Clarifier une direction\n\nClarifie une seule direction concrète :\nce que tu fais en priorité,\net ce que tu mets volontairement de côté.\n\n👉 La clarté attire la baraka.',
        introspection: '🪞 Tâche d\'introspection — Question unique\n\nDemande-toi une seule fois :\n« Où est-ce que je manque encore de clarté ? »',
        ancrage: '🧱 Tâche d\'ancrage concret — Trace écrite\n\nÉcris une phrase simple qui résume ta direction actuelle.\nUne ligne. Rien de plus.\n\n👉 La lumière aime ce qui est lisible.'
      },
      21: {
        spirituelle: `🌿 Tâche spirituelle — Kalwa Yâ Qawiyy`,
        discipline: '🧭 Discipline — Ne pas presser\n\nAujourd\'hui, ne presse rien :\nni résultat,\nni réponse,\nni avancement.\n\n👉 La baraka se retire quand on accélère.',
        action: '🔥 Action — Laisser mûrir\n\nLaisse une chose inachevée volontairement\npour qu\'elle mûrisse sans intervention\n(juste aujourd\'hui).\n\n👉 Ce qui est mûr vient sans être tiré.',
        introspection: '🪞 Introspection — Question unique\n\nDemande-toi une seule fois :\n« Où est-ce que je force alors que je pourrais laisser faire ? »',
        ancrage: '🧱 Ancrage concret — Geste de stabilité\n\nPose un geste lent et stable dans ta journée\n(marche calme, action posée, mouvement maîtrisé)\nen pleine conscience.\n\n👉 La baraka aime ce qui est posé.'
      },
      22: {
        spirituelle: '🌿 Tâche spirituelle — Hadith (Intention)\n\nMéditer ce hadith authentique :\n\n> « Les actions ne valent que par les intentions. »\n— Ṣaḥīḥ al-Bukhārī & Ṣaḥīḥ Muslim\n\nPrendre un moment pour réajuster l\'intention\nsans changer ce que tu fais.',
        discipline: '🧭 Discipline — Faire pour Allah\n\nAujourd\'hui, ne fais pas un acte pour être vu, validé ou reconnu.\nTu fais, puis tu passes à autre chose.',
        action: '🔥 Action — Acte discret\n\nAccomplis un bien discret,\nsans en parler, sans le montrer.',
        introspection: '🪞 Introspection — Question unique\n\n« Pour qui est-ce que je fais réellement cet acte ? »',
        ancrage: '🧱 Ancrage concret — Effacement\n\nSupprime une trace inutile de toi\n(message, justification, explication superflue).'
      },
      23: {
        spirituelle: '🌿 Tâche spirituelle — Hadith (Régularité)\n\nMéditer ce hadith authentique :\n\n> « L\'acte le plus aimé d\'Allah est celui qui est constant,\nmême s\'il est petit. »\n— Ṣaḥīḥ al-Bukhārī & Ṣaḥīḥ Muslim\n\nLaisser cette parole s\'installer simplement.',
        discipline: '🧭 Discipline — Ne pas en faire trop\n\nAujourd\'hui, n\'ajoute rien.\nContente-toi de ce que tu peux tenir facilement.',
        action: '🔥 Action — Petit acte constant\n\nRéalise un acte très simple\nque tu pourras refaire chaque jour sans contrainte.',
        introspection: '🪞 Introspection — Question unique\n\n« Qu\'est-ce que je peux tenir sans me forcer ? »',
        ancrage: '🧱 Ancrage concret — Point fixe\n\nAssocie cet acte à un moment précis de la journée\n(même très court).'
      },
      24: {
        spirituelle: '🌿 Tâche spirituelle — Point de présence du centre intérieur (Ventre)\n\nMéditation :\nRespiration consciente.\nPorter l\'attention sur le ventre comme lieu de stabilité.\nRéciter Yâ Qawiyy pendant 5 à 10 minutes.\n\n> Objectif : renforcer la stabilité et la maîtrise.',
        discipline: '🧭 Discipline — Ne pas réagir au premier mouvement\n\nAujourd\'hui, n\'agis pas sur la première impulsion\n(peur, envie, agitation).\nLaisse-la se poser avant toute décision.',
        action: '🔥 Action — Choix posé\n\nFais une action lente et volontaire\nlà où tu agissais habituellement vite.',
        introspection: '🪞 Introspection — Question unique\n\n« Qu\'est-ce qui me déstabilise encore de l\'intérieur ? »',
        ancrage: '🧱 Ancrage concret — Stabilité physique\n\nAdopte consciemment une posture stable\n(assis ou debout) pendant une activité précise.'
      },
      25: {
        spirituelle: '🌿 Spiritualité — Disposition intérieure\n\nDire une seule fois, avec présence :\n« Ô Allah, mets la baraka dans ce que je fais déjà. »\n\n> Objectif : ouvrir la continuité sans ajouter.',
        discipline: '🧭 Discipline — Ne pas casser le rythme\n\nAujourd\'hui, ne romps pas une habitude bénéfique existante,\nmême si elle te paraît petite ou banale.',
        action: '🔥 Action — Fidélité simple\n\nRefais exactement une action utile déjà présente dans tes jours précédents,\nsans l\'améliorer, sans la modifier.',
        introspection: '🪞 Introspection\n\n« Qu\'est-ce qui mérite simplement de continuer ? »',
        ancrage: '🧱 Ancrage concret\n\nFais cette action au même moment que d\'habitude.'
      },
      26: {
        spirituelle: '🌿 Spiritualité — Rappel prophétique\n\nSe rappeler ce sens prophétique clair :\n\n> La meilleure voie est celle de la mesure et de la simplicité.\n\n> Objectif : alléger sans perdre.',
        discipline: '🧭 Discipline — Retirer l\'excès\n\nEnlève une exigence inutile\n(règle, pression, condition que tu t\'imposes).',
        action: '🔥 Action — Simplification réelle\n\nSimplifie une tâche concrète\n(moins d\'étapes, moins de contrôle).',
        introspection: '🪞 Introspection\n\n« Où est-ce que je complique sans raison ? »',
        ancrage: '🧱 Ancrage concret\n\nAllège ton environnement\n(retire un objet, une contrainte, un poids).'
      },
      27: {
        spirituelle: `🌿 Spiritualité — Kalwa Yâ Qawiyy\n\nEntrer en Kalwa avec Yâ Qawiyy.\nRessentir une force qui porte, pas qui contrôle.`,
        discipline: '🧭 Discipline — Ne pas surveiller\n\nAujourd\'hui, ne vérifie pas\nun résultat, une réponse ou un avancement.',
        action: '🔥 Action — Laisser être\n\nLaisse une chose se faire sans intervenir,\nmême si tu pourrais contrôler.',
        introspection: '🪞 Introspection\n\n« Qu\'est-ce que je contrôle par peur ? »',
        ancrage: '🧱 Ancrage concret\n\nPoser les mains ouvertes quelques instants,\nen signe de remise.'
      },
      36: {
        spirituelle: `🌿 Spiritualité — Kalwa Yâ Qawiyy\n\nEntrer en Kalwa.\nRessentir que ce qui devait être tenu l'a été.`,
        discipline: '🧭 Discipline — Ne rien ajouter\n\nAujourd\'hui, n\'ajoute rien :\nni règle, ni engagement, ni attente.',
        action: '🔥 Action — Dernier geste posé\n\nFais un dernier geste simple et juste,\nsans projection sur la suite.',
        introspection: '🪞 Introspection\n\n« Où est-ce que la baraka s\'est installée ? »',
        ancrage: '🧱 Ancrage concret\n\nÉcris une phrase simple :\n« Je laisse Allah faire fructifier. »'
      },
      37: {
        spirituelle: '🌑 KUN (Sois)\n\nLecture : Yâ-Sîn 81–83\n\nIntention du jour :\nEntrer dans l\'acceptation du décret.\n\n🌿 Spiritualité — Lecture & méditation\n\nLire lentement Yâ-Sîn 81 à 83,\nlaisser résonner le pouvoir du Kun.\n\n🌿 Dhikr\n\nSubḥānallāh — reconnaître la perfection du décret.\n\n🌿 Silence\n\nRester en silence après la lecture.\n\n🌿 Abandon intérieur\n\nDire intérieurement :\n« Ô Allah, ce qui doit être, sera. »\n\n🌿 Présence du cœur\n\nRester présent, sans demande.',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      },
      38: {
        spirituelle: '🌒 FA (Alors)\n\nPoint de présence : les pieds (Qadamayn)\nLecture : Yâ-Sîn 81–83\n\nIntention du jour :\nLaisser le décret descendre dans la vie réelle.\n\n🌿 Spiritualité — Ancrage\n\nMarcher lentement et consciemment.\nRessentir les pieds sur le sol.\nRéciter Yâ Wâsi‘.\n\n🌿 Lecture\n\nRelire Yâ-Sîn 81–83 en mouvement.\n\n🌿 Dhikr\n\nAl-ḥamdu liLlāh — accueillir ce qui se met en place.\n\n🌿 Marche silencieuse\n\nContinuer sans parole.\n\n🌿 Reconnaissance\n\nDire intérieurement :\n« Ce qui vient d\'Allah est juste. »',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      },
      39: {
        spirituelle: '🌕 YAKŪN (Et c\'est)\n\nLecture : Yâ-Sîn 81–83\n\nIntention :\nAccueillir ce qui est décrété.\n\n🌿 Spiritualité — Lecture & méditation\n\nLire Yâ-Sîn 81 à 83\ncomme un décret accompli.\n\n🌿 Dhikr\n\nDire Allāhu Akbar,\npour reconnaître la grandeur de Celui qui décide.\n\n🌿 Contemplation\n\nObserver le ciel, la lumière ou un espace ouvert,\nsans réflexion.\n\n🌿 Silence du cœur\n\nRester quelques instants\nsans demande, sans projection.\n\n🌿 Remise finale\n\nDire intérieurement :\n« Ô Allah, je Te remets les fruits de ce chemin. »',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      }
    };
    return descriptions[day] || null;
  }
  
  // Défi 4 : Pureté de l'Esprit (Yâ Laṭîf)
  if (challengeId === 'purete-esprit') {
    const descriptions: Record<number, any> = {
      1: {
        spirituelle: '🌿 Spiritualité\n\nNur Shifa : lire Al-Fâtiha sur un verre d\'eau, boire ou s\'essuyer le visage\n\nKalwa Yâ Allah',
        discipline: null,
        action: null
      },
      2: {
        spirituelle: '🌿 Spiritualité — Présence du cœur\n\nPorter l\'attention sur le cœur.\nVisualiser une lumière douce.\nRéciter Yâ Raḥmân, Yâ Raḥîm.',
        discipline: '🧭 Discipline\n\nNe nourris pas une pensée négative aujourd\'hui.',
        action: '🔥 Action\n\nQuand une pensée lourde apparaît, ne la suis pas.'
      },
      3: {
        spirituelle: `🌿 Spiritualité\n\nKalwa Yâ Laṭîf`,
        discipline: '🧭 Discipline\n\nParle-toi intérieurement avec douceur.',
        action: '🔥 Action\n\nInterromps une rumination dès que tu la remarques.'
      },
      4: {
        spirituelle: '🌿 Spiritualité\n\nLire lentement :\n« Allāhu Laṭīfun bi\'ibādih » (42:19)',
        discipline: '🧭 Discipline\n\nNe cherche pas à analyser inutilement.',
        action: '🔥 Action\n\nSimplifie une décision aujourd\'hui.'
      },
      5: {
        spirituelle: '🌿 Spiritualité\n\nRespiration consciente + Yâ Laṭîf.',
        discipline: '🧭 Discipline\n\nRéduis volontairement une stimulation\n(informations, écrans, discussions inutiles).',
        action: '🔥 Action\n\nAccorde-toi un court moment sans pensée volontaire.'
      },
      6: {
        spirituelle: '🌿 Spiritualité — Présence de la parole\n\nPorter l\'attention sur la gorge.\nRéciter lentement Subḥāna Rabbiyal \'Aẓīm.',
        discipline: '🧭 Discipline\n\nNe verbalise pas intérieurement chaque pensée.',
        action: '🔥 Action\n\nChoisis une parole douce ou le silence.'
      },
      7: {
        spirituelle: '🌿 Spiritualité\n\nLire lentement :\n« Alam nashraḥ laka ṣadrak » (94:1)',
        discipline: '🧭 Discipline\n\nNe projette pas demain aujourd\'hui.',
        action: '🔥 Action\n\nSois pleinement présent à une seule chose.'
      },
      8: {
        spirituelle: '🌿 Spiritualité\n\nFaire une prosternation volontaire (sujūd)\net déposer mentalement ce qui pèse.',
        discipline: '🧭 Discipline\n\nNe reprends pas ce qui a été déposé.',
        action: '🔥 Action\n\nContinue ta journée sans revenir dessus.'
      },
      9: {
        spirituelle: `🌿 Spiritualité\n\nKalwa Yâ Laṭîf`,
        discipline: '🧭 Discipline\n\nRéduis les dialogues intérieurs inutiles.',
        action: '🔥 Action\n\nÉloigne-toi d\'une agitation mentale.'
      },
      10: {
        spirituelle: '🌿 Spiritualité — Présence des mains\n\nPoser les mains devant soi.\nRéciter Yâ Fattâḥ, puis accomplir un acte juste.',
        discipline: '🧭 Discipline\n\nNe te presse pas dans l\'action.',
        action: '🔥 Action\n\nFais un geste posé et conscient.'
      },
      18: {
        spirituelle: `🌿 Spiritualité\n\nKalwa Yâ Laṭîf`,
        discipline: '🧭 Discipline\n\nNe t\'identifie pas à une pensée aujourd\'hui.',
        action: '🔥 Action\n\nLaisse passer une pensée sans la suivre.'
      },
      19: {
        spirituelle: `🌿 Spiritualité — Kalwa Yâ Laṭîf\n\nEntrer en Kalwa avec Yâ Laṭîf,\nlaisser la douceur agir sans diriger la pensée.`,
        discipline: '🧭 Discipline\n\nNe cherche pas à comprendre ce que tu ressens.',
        action: '🔥 Action\n\nRéduis volontairement une source de bruit mental.',
        introspection: '🪞 Introspection\n\n« Quelle pensée revient quand je suis fatigué ? »',
        ancrage: '🧱 Ancrage concret\n\nAccorde-toi un moment sans stimulation.'
      },
      20: {
        spirituelle: '🌿 Spiritualité — Vision intérieure\n\nPorter l\'attention sur le front,\nvisualiser une lumière douce,\nréciter Yâ Nûr.',
        discipline: '🧭 Discipline\n\nN\'interprète rien aujourd\'hui.',
        action: '🔥 Action\n\nClarifie une intention, sans plan.',
        introspection: '🪞 Introspection\n\n« Où est-ce que je confonds clarté et contrôle ? »',
        ancrage: '🧱 Ancrage concret\n\nÉcris une idée claire, sans explication.'
      },
      21: {
        spirituelle: `🌿 Spiritualité — Kalwa Yâ Laṭîf\n\nEntrer en Kalwa,\nlaisser les pensées se déposer d'elles-mêmes.`,
        discipline: '🧭 Discipline\n\nNe force aucune décision.',
        action: '🔥 Action\n\nLaisse une question ouverte.',
        introspection: '🪞 Introspection\n\n« Qu\'est-ce que je veux comprendre trop vite ? »',
        ancrage: '🧱 Ancrage concret\n\nRalentis volontairement un rythme.'
      },
      22: {
        spirituelle: '🌿 Spiritualité — Hadith\n\n« Les actions ne valent que par les intentions. »\n(Bukhârî & Muslim)',
        discipline: '🧭 Discipline\n\nRéajuste l\'intention sans changer l\'acte.',
        action: '🔥 Action\n\nFais un acte discret.',
        introspection: '🪞 Introspection\n\n« Pour qui est-ce que je fais cela ? »',
        ancrage: '🧱 Ancrage concret\n\nSupprime une justification inutile.'
      },
      23: {
        spirituelle: '🌿 Spiritualité — Hadith\n\n« L\'acte le plus aimé d\'Allah est celui qui est constant, même s\'il est petit. »',
        discipline: '🧭 Discipline\n\nN\'en fais pas plus que nécessaire.',
        action: '🔥 Action\n\nUn petit acte simple et répétable.',
        introspection: '🪞 Introspection\n\n« Qu\'est-ce que je peux tenir sans effort ? »',
        ancrage: '🧱 Ancrage concret\n\nAssocie cet acte à un moment fixe.'
      },
      24: {
        spirituelle: '🌿 Spiritualité — Centre intérieur\n\nRespiration consciente,\nattention au centre du corps,\nréciter Yâ Laṭîf.',
        discipline: '🧭 Discipline\n\nNe réagis pas à la première impulsion.',
        action: '🔥 Action\n\nFais une action lentement.',
        introspection: '🪞 Introspection\n\n« Qu\'est-ce qui me déstabilise encore ? »',
        ancrage: '🧱 Ancrage concret\n\nAdopte une posture stable quelques instants.'
      },
      25: {
        spirituelle: '🌿 Spiritualité\n\nDire intérieurement :\n« Ô Allah, mets la douceur dans ce que je fais déjà. »\n\n> Objectif : ouvrir la continuité sans ajouter.',
        discipline: '🧭 Discipline\n\nNe change rien d\'utile aujourd\'hui.',
        action: '🔥 Action\n\nRefais une action bénéfique identique.',
        introspection: '🪞 Introspection\n\n« Qu\'est-ce qui mérite simplement de continuer ? »',
        ancrage: '🧱 Ancrage concret\n\nGarde le même moment et le même lieu.'
      },
      26: {
        spirituelle: '🌿 Spiritualité\n\nRappel intérieur de la simplicité.',
        discipline: '🧭 Discipline\n\nRetire une exigence mentale.',
        action: '🔥 Action\n\nSimplifie une tâche réelle.',
        introspection: '🪞 Introspection\n\n« Où est-ce que je complique inutilement ? »',
        ancrage: '🧱 Ancrage concret\n\nAllège ton environnement.'
      },
      27: {
        spirituelle: `🌿 Spiritualité\n\nKalwa Yâ Laṭîf`,
        discipline: '🧭 Discipline\n\nNe surveille pas un résultat.',
        action: '🔥 Action\n\nLaisse une chose se faire sans intervenir.',
        introspection: '🪞 Introspection\n\n« Qu\'est-ce que je contrôle par peur ? »',
        ancrage: '🧱 Ancrage concret\n\nOuvre les mains quelques instants.'
      },
      36: {
        spirituelle: `🌿 Spiritualité — Kalwa Yâ Laṭîf\n\nEntrer en Kalwa,\nsentir la clarté installée.`,
        discipline: '🧭 Discipline\n\nN\'ajoute rien.',
        action: '🔥 Action\n\nUn dernier geste simple.',
        introspection: '🪞 Introspection\n\n« Où l\'esprit est-il plus léger ? »',
        ancrage: '🧱 Ancrage concret\n\nÉcris : « Je laisse Allah préserver cette clarté. »'
      },
      37: {
        spirituelle: '🌑 KUN (Sois)\n\n🌱 Ouverture\n\nAujourd\'hui, tu ne cherches plus.\nTu te tiens présent devant la Volonté.\n\n🌿 Tâches spirituelles\n\n1. Lecture & méditation\nLire lentement Yâ-Sîn 81 à 83,\nen laissant résonner le sens du Kun :\nQuand Allah veut une chose, Il dit : Sois.\n\n2. Dhikr\nDire Subḥānallāh,\npour reconnaître la perfection du décret divin.\n\n3. Silence intérieur\nRester en silence après la lecture,\nsans formuler de demande.\n\n4. Remise intérieure\nDire dans le cœur :\n« Ô Allah, je Te remets ce qui doit être. »\n\n5. Présence pure\nRester simplement présent,\nsans pensée dirigée.',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      },
      38: {
        spirituelle: '🌒 FA (Alors)\n\n🌱 Ouverture\n\nCe qui a été décrété\ncommence à prendre forme.\n\n🌿 Tâches spirituelles\n\n1. Ancrage conscient\nMarcher lentement, en conscience,\nen ressentant chaque pas comme une descente du décret.\n\n2. Dhikr\nRéciter Yâ Wâsi‘,\nen ressentant l\'ouverture et l\'ampleur de ce qu\'Allah accorde.\n\n3. Lecture & méditation\nLire à nouveau Yâ-Sîn 81 à 83,\nen laissant le Fa — alors — s\'installer.\n\n4. Louange\nDire Al-ḥamdu liLlāh,\npour ce qui se met en place, visible ou non.\n\n5. Présence en mouvement\nContinuer la marche quelques instants\nsans parole ni pensée volontaire.',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      },
      39: {
        spirituelle: '🌕 YAKŪN (Et c\'est)\n\n🌱 Ouverture\n\nIl n\'y a plus rien à attendre.\nIl y a seulement à accueillir.\n\n🌿 Tâches spirituelles\n\n1. Lecture & méditation\nLire Yâ-Sîn 81 à 83\ncomme un décret accompli.\n\n2. Dhikr\nDire Allāhu Akbar,\npour reconnaître la grandeur de Celui qui décide.\n\n3. Contemplation\nObserver le ciel, la lumière ou un espace ouvert,\nsans réflexion.\n\n4. Silence du cœur\nRester quelques instants\nsans demande, sans projection.\n\n5. Remise finale\nDire intérieurement :\n« Ô Allah, je Te remets les fruits de ce chemin. »',
        discipline: null,
        action: null,
        introspection: null,
        ancrage: null
      }
    };
    return descriptions[day] || null;
  }
  
  return null;
}

/**
 * Génère la structure complète d'un défi de 40 jours
 * Structure exacte selon la nouvelle architecture
 */
function generateDaysStructure(attribute: string, attributeArabic: string, challengeId?: string): Day[] {
  const days: Day[] = [];

  // ========== PARTIE 1 : JOURS 1-18 (3 TÂCHES/JOUR) ==========

  // BLOC 1 : Jours 1-3
  // J1 : Nur Shifa + Kalwa Ya Allah + Intention
  const day1Descriptions = challengeId ? getDayDescriptions(1, challengeId, attribute) : null;
  days.push({
    day: 1,
    title: 'JOUR 1 — OUVERTURE ET INTENTION',
    block: `${BLOCKS_INFO[0].name} — ${BLOCKS_INFO[0].nameTranslation}`,
    blockNumber: 1,
    tasks: [
      {
        description: day1Descriptions?.spirituelle || 'Nur Shifa : Al-Fâtiha dans l\'eau',
        type: 'nur_shifa',
        verseReference: 'Al-Fâtiha (1:1-7)'
      },
      {
        description: 'Kalwa : Yâ Allah',
        type: 'kalwa',
        divineAttribute: 'Allah'
      },
      {
        description: 'Définir votre intention pour ce défi',
        type: 'spirituelle_ia',
        hasIntention: true,
        generatedByIA: false
      }
    ],
    hasKalwa: true,
    hasNurShifa: true,
    hasIntention: true,
    hasAlFatiha: true,
    closingPhrase: 'Ce défi commence sous la lumière de Yâ Nûr.\nTu n\'as rien à forcer.\nLaisse la lumière faire son œuvre.',
    verse: {
      reference: 'Al-Fâtiha (1:1-7)',
      arabic: AL_FATIHA_VERSES.verses.map(v => v.arabic).join(' '),
      translation: AL_FATIHA_VERSES.verses.map(v => v.translation).join(' '),
      tafsir: 'La sourate d\'ouverture du Coran'
    }
  });

  // J2 : 3 tâches + poinçon (Présence du cœur - Qalb)
  days.push({
    day: 2,
    title: 'JOUR 2 — PRÉSENCE DU CŒUR (QALB)',
    block: `${BLOCKS_INFO[0].name} — ${BLOCKS_INFO[0].nameTranslation}`,
    blockNumber: 1,
    tasks: [
      {
        description: '🌿 Tâche spirituelle — Présence du cœur\n\nPorter l\'attention sur le cœur comme lieu de réception de la miséricorde d\'Allah.\nVisualiser symboliquement une lumière apaisante.\nRéciter Yâ Rahmân, Yâ Rahîm pendant 5 à 10 minutes.\n\n> Objectif : adoucir le cœur et installer la sakîna.',
        type: 'spirituelle_ia',
        generatedByIA: false
      },
      {
        description: '🧭 Discipline\n\n1. Éviter toute dureté inutile dans la parole\n2. Ne pas nourrir une rancune aujourd\'hui\n3. Ralentir volontairement dans les échanges\n4. S\'abstenir de juger intérieurement\n5. Préserver le calme du cœur face aux provocations',
        type: 'discipline_ia',
        generatedByIA: false,
        options: [
          'Éviter toute dureté inutile dans la parole',
          'Ne pas nourrir une rancune aujourd\'hui',
          'Ralentir volontairement dans les échanges',
          'S\'abstenir de juger intérieurement',
          'Préserver le calme du cœur face aux provocations'
        ]
      },
      {
        description: '🔥 Action\n\n1. Pardonner une petite chose sans la rappeler\n2. Faire preuve de douceur dans une interaction\n3. Aider quelqu\'un sans le faire sentir\n4. Alléger une charge pour autrui\n5. Poser un geste bienveillant discret',
        type: 'action_ia',
        generatedByIA: false,
        options: [
          'Pardonner une petite chose sans la rappeler',
          'Faire preuve de douceur dans une interaction',
          'Aider quelqu\'un sans le faire sentir',
          'Alléger une charge pour autrui',
          'Poser un geste bienveillant discret'
        ],
        hasPoincon: true
      }
    ],
    hasPoincon: true
  });

  // J3 : Kalwa attribut d'Allah + 2 tâches
  const divineNamePhase1 = extractDivineName(attribute);
  const day3Descriptions = challengeId ? getDayDescriptions(3, challengeId, attribute) : null;
  days.push({
    day: 3,
    title: 'JOUR 3 — LUMIÈRE DU CŒUR',
    block: `${BLOCKS_INFO[0].name} — ${BLOCKS_INFO[0].nameTranslation}`,
    blockNumber: 1,
    tasks: [
      {
        description: day3Descriptions?.spirituelle || `Kalwa : ${attribute}`,
        type: 'kalwa',
        divineAttribute: divineNamePhase1
      },
      {
        description: day3Descriptions?.discipline || 'Tâche discipline du jour 3',
        type: 'discipline_ia',
        generatedByIA: !day3Descriptions?.discipline
      },
      {
        description: day3Descriptions?.action || 'Tâche action du jour 3',
        type: 'action_ia',
        generatedByIA: !day3Descriptions?.action
      }
    ],
    hasKalwa: true
  });

  // BLOC 2 : Jours 4-9
  // J4 : 3 tâches (avec intention intégrée)
  const day4Descriptions = challengeId ? getDayDescriptions(4, challengeId, attribute) : null;
  days.push({
    day: 4,
    title: 'JOUR 4 — ALLÉGER LE CŒUR',
    block: `${BLOCKS_INFO[1].name} — ${BLOCKS_INFO[1].nameTranslation}`,
    blockNumber: 2,
    tasks: [
      {
        description: day4Descriptions?.spirituelle || 'Tâche spirituelle du jour 4',
        type: 'spirituelle_ia',
        generatedByIA: !day4Descriptions?.spirituelle
      },
      {
        description: day4Descriptions?.discipline || 'Tâche discipline du jour 4',
        type: 'discipline_ia',
        generatedByIA: !day4Descriptions?.discipline
      },
      {
        description: day4Descriptions?.action || 'Tâche action du jour 4',
        type: 'action_ia',
        generatedByIA: !day4Descriptions?.action
      }
    ]
  });

  // J5 : 3 tâches
  const day5Descriptions = challengeId ? getDayDescriptions(5, challengeId, attribute) : null;
  days.push({
    day: 5,
    title: 'JOUR 5 — REVENIR AU CALME INTÉRIEUR',
    block: `${BLOCKS_INFO[1].name} — ${BLOCKS_INFO[1].nameTranslation}`,
    blockNumber: 2,
    tasks: [
      {
        description: day5Descriptions?.spirituelle || 'Tâche spirituelle du jour 5',
        type: 'spirituelle_ia',
        generatedByIA: !day5Descriptions?.spirituelle
      },
      {
        description: day5Descriptions?.discipline || 'Tâche discipline du jour 5',
        type: 'discipline_ia',
        generatedByIA: !day5Descriptions?.discipline
      },
      {
        description: day5Descriptions?.action || 'Tâche action du jour 5',
        type: 'action_ia',
        generatedByIA: !day5Descriptions?.action
      }
    ]
  });

  // J6 : 3 tâches + poinçon (Présence de la parole - Gorge)
  const day6Descriptions = challengeId ? getDayDescriptions(6, challengeId, attribute) : null;
  days.push({
    day: 6,
    title: challengeId === 'voyage-du-coeur' ? 'JOUR 6 — PRÉSENCE DE LA PAROLE (GORGE)' : challengeId === 'liberation-spirituelle' ? 'JOUR 6 — PROTÉGER LA PAROLE (GORGE)' : challengeId === 'discipline-baraka' ? 'JOUR 6 — MAÎTRISER LA PAROLE POUR PRÉSERVER LA BARAKA' : challengeId === 'purete-esprit' ? 'JOUR 6 — PURIFIER LA PAROLE INTÉRIEURE' : 'JOUR 6 — PRÉSENCE DE LA PAROLE (GORGE)',
    block: `${BLOCKS_INFO[1].name} — ${BLOCKS_INFO[1].nameTranslation}`,
    blockNumber: 2,
    tasks: [
      {
        description: day6Descriptions?.spirituelle || '🌿 Tâche spirituelle — Parole consciente\n\nRéciter Subḥâna Rabbiyal \'Aẓîm lentement,\nen ressentant la vibration de la parole et du souffle.\nRespiration profonde, 5 à 10 minutes.\n\n> Objectif : purifier la parole et l\'intention.',
        type: 'spirituelle_ia',
        generatedByIA: !day6Descriptions?.spirituelle
      },
      {
        description: day6Descriptions?.discipline || '🧭 Discipline\n\n1. Éviter toute parole inutile\n2. Ne pas parler sous l\'émotion\n3. S\'abstenir de critiquer ou de se plaindre\n4. Réfléchir avant de répondre\n5. Respecter le silence quand il est plus juste',
        type: 'discipline_ia',
        generatedByIA: !day6Descriptions?.discipline,
        options: day6Descriptions?.discipline ? undefined : [
          'Éviter toute parole inutile',
          'Ne pas parler sous l\'émotion',
          'S\'abstenir de critiquer ou de se plaindre',
          'Réfléchir avant de répondre',
          'Respecter le silence quand il est plus juste'
        ]
      },
      {
        description: day6Descriptions?.action || '🔥 Action\n\n1. Dire une parole vraie et bénéfique\n2. Se taire là où la parole nuirait\n3. Corriger une parole maladroite\n4. Encourager quelqu\'un sincèrement\n5. Utiliser la parole pour apaiser',
        type: 'action_ia',
        generatedByIA: !day6Descriptions?.action,
        options: day6Descriptions?.action ? undefined : [
          'Dire une parole vraie et bénéfique',
          'Se taire là où la parole nuirait',
          'Corriger une parole maladroite',
          'Encourager quelqu\'un sincèrement',
          'Utiliser la parole pour apaiser'
        ],
        hasPoincon: true
      }
    ],
    hasPoincon: true,
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'La parole qui est pesée\ndevient source de paix.' : challengeId === 'liberation-spirituelle' ? 'La parole retenue\nest aussi une forme de protection.' : challengeId === 'discipline-baraka' ? 'Quand la parole est maîtrisée,\nla baraka reste.' : challengeId === 'purete-esprit' ? 'Quand la parole se purifie,\nl\'esprit s\'apaise.' : undefined
  });

  // J7 : 3 tâches
  const day7Descriptions = challengeId ? getDayDescriptions(7, challengeId, attribute) : null;
  days.push({
    day: 7,
    title: 'JOUR 7 — RENFORCER LA CONFIANCE DU CŒUR',
    block: `${BLOCKS_INFO[1].name} — ${BLOCKS_INFO[1].nameTranslation}`,
    blockNumber: 2,
    tasks: [
      {
        description: day7Descriptions?.spirituelle || 'Tâche spirituelle du jour 7',
        type: 'spirituelle_ia',
        generatedByIA: !day7Descriptions?.spirituelle
      },
      {
        description: day7Descriptions?.discipline || 'Tâche discipline du jour 7',
        type: 'discipline_ia',
        generatedByIA: !day7Descriptions?.discipline
      },
      {
        description: day7Descriptions?.action || 'Tâche action du jour 7',
        type: 'action_ia',
        generatedByIA: !day7Descriptions?.action
      }
    ]
  });

  // J8 : 3 tâches
  const day8Descriptions = challengeId ? getDayDescriptions(8, challengeId, attribute) : null;
  days.push({
    day: 8,
    title: 'JOUR 8 — GRATITUDE',
    block: `${BLOCKS_INFO[1].name} — ${BLOCKS_INFO[1].nameTranslation}`,
    blockNumber: 2,
    tasks: [
      {
        description: day8Descriptions?.spirituelle || 'Tâche spirituelle du jour 8',
        type: 'spirituelle_ia',
        generatedByIA: !day8Descriptions?.spirituelle
      },
      {
        description: day8Descriptions?.discipline || 'Tâche discipline du jour 8',
        type: 'discipline_ia',
        generatedByIA: !day8Descriptions?.discipline
      },
      {
        description: day8Descriptions?.action || 'Tâche action du jour 8',
        type: 'action_ia',
        generatedByIA: !day8Descriptions?.action
      }
    ]
  });

  // J9 : Kalwa attribut d'Allah + 2 tâches
  const day9Descriptions = challengeId ? getDayDescriptions(9, challengeId, attribute) : null;
  days.push({
    day: 9,
    title: 'JOUR 9 — LAISSER LA LUMIÈRE ÉCLAIRER',
    block: `${BLOCKS_INFO[1].name} — ${BLOCKS_INFO[1].nameTranslation}`,
    blockNumber: 2,
    tasks: [
      {
        description: day9Descriptions?.spirituelle || `Kalwa : ${attribute}`,
        type: 'kalwa',
        divineAttribute: divineNamePhase1
      },
      {
        description: day9Descriptions?.discipline || 'Tâche discipline du jour 9',
        type: 'discipline_ia',
        generatedByIA: !day9Descriptions?.discipline
      },
      {
        description: day9Descriptions?.action || 'Tâche action du jour 9',
        type: 'action_ia',
        generatedByIA: !day9Descriptions?.action
      }
    ],
    hasKalwa: true
  });

  // BLOC 3 : Jours 10-18
  // J10 : 3 tâches (avec intention intégrée)
  const day10Descriptions = challengeId ? getDayDescriptions(10, challengeId, attribute) : null;
  days.push({
    day: 10,
    title: 'JOUR 10 — OUVRIR PAR L\'ACTE JUSTE',
    block: `${BLOCKS_INFO[2].name} — ${BLOCKS_INFO[2].nameTranslation}`,
    blockNumber: 3,
    tasks: [
      {
        description: day10Descriptions?.spirituelle || 'Tâche spirituelle du jour 10',
        type: 'spirituelle_ia',
        generatedByIA: !day10Descriptions?.spirituelle
      },
      {
        description: day10Descriptions?.discipline || 'Tâche discipline du jour 10',
        type: 'discipline_ia',
        generatedByIA: !day10Descriptions?.discipline
      },
      {
        description: day10Descriptions?.action || 'Tâche action du jour 10',
        type: 'action_ia',
        generatedByIA: !day10Descriptions?.action
      }
    ]
  });

  // J11-17 : 1 verset Al-Fatiha par jour + 2 tâches spécifiques
  const alFatihaDays = [
    {
      day: 11,
      verseNumber: 1,
      verseSense: 'Ce verset n\'est pas une information.\nC\'est une entrée en présence.\n\nIl enseigne :\n- ne rien commencer par soi\n- ne rien s\'approprier\n- placer l\'acte sous la miséricorde, pas sous le contrôle',
      spiritualite: 'Lire le verset lentement, puis rester quelques instants en silence en conscience du fait que tout commence par Allah.',
      discipline: [
        'Ne pas commencer une action importante dans la précipitation',
        'Marquer un court temps d\'arrêt avant toute décision',
        'Éviter de parler ou d\'agir mécaniquement',
        'Refuser l\'automatisme dans les gestes du quotidien',
        'Se rappeler intérieurement que l\'acte ne t\'appartient pas'
      ],
      action: [
        'Recommencer consciemment une action habituelle (travail, parole, tâche)',
        'Corriger un geste fait trop vite',
        'Faire une chose simple avec présence totale',
        'Choisir la qualité plutôt que la quantité aujourd\'hui',
        'Poser un acte sans chercher à en tirer un bénéfice personnel'
      ],
      closingPhrase: 'D\'après Abu Hurayra (qu\'Allah l\'agrée), le Prophète (paix sur lui) a dit :\n« Allah a certes dit :\n\n"J\'ai divisé la prière entre Moi et Mon serviteur en deux parties et Mon serviteur a ce qu\'il demande."'
    },
    {
      day: 12,
      verseNumber: 2,
      verseSense: 'Ce verset n\'est pas une émotion.\nC\'est une reconnaissance lucide.\n\nIl enseigne :\n- que tout bien a une source\n- que la maîtrise ne t\'appartient pas\n- que la gratitude précède la demande',
      spiritualite: 'Lire le verset lentement, puis méditer sur ce qui t\'est donné sans que tu l\'aies produit.',
      discipline: [
        'S\'abstenir de toute plainte verbale aujourd\'hui',
        'Ne pas minimiser ce qui t\'est donné, même petit',
        'Éviter de comparer ta situation à celle des autres',
        'Reconnaître intérieurement un bienfait sans l\'expliquer',
        'Garder une attitude sobre face à ce qui te manque'
      ],
      action: [
        'Exprimer une gratitude concrète (parole ou geste), sans attente',
        'Prendre soin de quelque chose qui t\'est confié',
        'Utiliser un bienfait dans un but juste',
        'Aider quelqu\'un avec ce que tu as déjà',
        'Transformer une facilité en acte de bien'
      ],
      closingPhrase: 'Ainsi lorsque le serviteur dit : "Toutes les louanges appartiennent à Allah, Seigneur des Mondes", Allah dit : "Mon serviteur M\'a loué."'
    },
    {
      day: 13,
      verseNumber: 3,
      verseSense: 'Ce verset ne décrit pas seulement Allah.\nIl rappelle la manière dont Il se manifeste envers la création :\npar la miséricorde avant le jugement,\npar la douceur avant la rigueur.\n\nIl enseigne :\n- que la miséricorde précède la correction\n- que la dureté n\'est pas la voie\n- que l\'on est traité comme on traite',
      spiritualite: 'Lire le verset lentement, puis méditer sur la miséricorde reçue, même quand elle n\'a pas été méritée.',
      discipline: [
        'S\'abstenir de toute dureté inutile dans la parole',
        'Ne pas répondre immédiatement sous l\'émotion',
        'Éviter le jugement intérieur envers soi ou autrui',
        'Ralentir volontairement dans les échanges tendus',
        'Choisir la douceur même quand tu pourrais imposer'
      ],
      action: [
        'Faciliter une situation pour quelqu\'un',
        'Pardonner une petite chose sans la rappeler',
        'Aider sans faire sentir l\'aide',
        'Alléger une charge (temps, parole, geste)',
        'Répondre avec calme là où tu aurais répondu sèchement'
      ],
      closingPhrase: 'Lorsqu\'il dit : "Le Tout-Miséricordieux, le Très-Miséricordieux", Allah dit : "Mon serviteur M\'a glorifié."'
    },
    {
      day: 14,
      verseNumber: 4,
      verseSense: 'Ce verset remet l\'âme à sa place.\nIl rappelle que :\n- le jugement final n\'appartient à personne d\'autre qu\'Allah\n- chaque acte a une portée réelle\n- la responsabilité ne peut pas être évitée\n\nIl enseigne :\n- la conscience des conséquences\n- la fin de l\'illusion d\'impunité\n- la lucidité sans peur excessive',
      spiritualite: 'Lire le verset lentement, puis méditer sur le fait que tout acte aura un sens et un retour, même ceux que personne ne voit.',
      discipline: [
        'Agir aujourd\'hui en te rappelant que chaque geste compte',
        'Éviter toute légèreté dans une action connue comme sérieuse',
        'Ne pas repousser une obligation claire',
        'Assumer un tort sans te justifier excessivement',
        'Garder une attitude droite même sans contrôle extérieur'
      ],
      action: [
        'Corriger un comportement discret mais incorrect',
        'Tenir une promesse ou un engagement négligé',
        'Réparer une petite injustice, même silencieuse',
        'Choisir la droiture plutôt que la facilité',
        'Mettre de l\'ordre dans une affaire laissée en suspens'
      ],
      closingPhrase: 'Puis, quand il dit : "Maître du Jour de la Rétribution", Allah dit : "Mon serviteur M\'a honoré."'
    },
    {
      day: 15,
      verseNumber: 5,
      verseSense: 'Ce verset est un engagement.\nIl affirme :\n- l\'exclusivité de l\'adoration\n- la dépendance réelle à Allah\n- la fin de l\'illusion d\'autosuffisance\n\nIl enseigne :\n- l\'humilité active\n- l\'équilibre entre effort et reliance\n- la cohérence entre ce que l\'on dit et ce que l\'on vit',
      spiritualite: 'Lire le verset lentement, puis méditer sur cette parole comme un pacte personnel : adorer Allah seul et reconnaître son besoin d\'aide.',
      discipline: [
        'Cesser aujourd\'hui de compter uniquement sur tes propres forces',
        'Ne pas agir par orgueil ou autosuffisance',
        'Revenir intérieurement à Allah avant une tâche difficile',
        'Refuser de chercher l\'approbation des gens au détriment d\'Allah',
        'Garder la cohérence entre l\'intention et l\'acte'
      ],
      action: [
        'Demander sincèrement l\'aide d\'Allah avant une action importante',
        'Accepter l\'aide d\'une personne sans te sentir diminué',
        'Renoncer à une action motivée par l\'ego',
        'Poser un acte d\'adoration avec présence réelle',
        'Agir sans te glorifier du résultat'
      ],
      closingPhrase: 'Lorsqu\'il dit : "C\'est Toi seul que nous adorons et c\'est de Toi seul dont nous implorons le secours", Allah dit : "Cela est entre Moi et Mon serviteur et Mon serviteur a ce qu\'il demande."'
    },
    {
      day: 16,
      verseNumber: 6,
      verseSense: 'Ce verset est une demande claire, répétée chaque jour.\nIl affirme que :\n- la guidance ne s\'improvise pas\n- connaître le bien ne suffit pas, il faut y être conduit\n- la droiture est un chemin vivant, pas une idée abstraite\n\nIl enseigne :\n- l\'humilité face à la direction\n- la vigilance face aux écarts subtils\n- la nécessité de demander, encore et encore',
      spiritualite: 'Lire le verset lentement, puis le formuler intérieurement comme une demande réelle, personnelle et présente.',
      discipline: [
        'Refuser aujourd\'hui un choix flou ou ambigu',
        'Ne pas justifier une décision que tu sais déviée',
        'Ralentir avant toute décision importante',
        'Vérifier que tes actions vont dans la même direction',
        'Te rappeler que la droiture se tient au quotidien, pas ponctuellement'
      ],
      action: [
        'Choisir l\'option la plus droite même si elle est plus exigeante',
        'Corriger un petit écart volontairement ignoré',
        'Poser un acte cohérent avec ce que tu sais être juste',
        'Renoncer à une facilité qui t\'éloigne du droit chemin',
        'Avancer avec constance plutôt qu\'avec précipitation'
      ],
      closingPhrase: 'Puis, quand il dit : "Guide-nous sur le droit chemin"Allah dit : "Cela est pour Mon serviteur et Mon serviteur a ce qu\'il demande."'
    },
    {
      day: 17,
      verseNumber: 7,
      verseSense: 'Ce verset précise la demande de guidance.\nIl enseigne que :\n- tous les chemins ne se valent pas\n- la droiture a des modèles concrets\n- l\'égarement peut venir soit du refus conscient, soit de la confusion\n\nIl rappelle que la guidance n\'est pas abstraite :\nelle se voit dans les choix, les comportements, les fréquentations.',
      spiritualite: 'Lire le verset lentement, puis méditer sur le chemin que tu suis réellement, pas celui que tu revendiques.',
      discipline: [
        'Ne pas imiter un comportement que tu sais erroné, même s\'il est courant',
        'Refuser une habitude populaire mais contraire à tes valeurs',
        'Être vigilant face à la confusion déguisée en "liberté"',
        'Ne pas persister dans une erreur connue par orgueil',
        'Te rappeler que le bon chemin se reconnaît à ses fruits'
      ],
      action: [
        'Aligner un choix concret avec un modèle droit et intègre',
        'T\'éloigner d\'une influence qui te trouble intérieurement',
        'Renforcer une pratique qui t\'ancre dans la droiture',
        'Agir aujourd\'hui comme quelqu\'un que tu respectes spirituellement',
        'Choisir la clarté plutôt que la facilité'
      ],
      closingPhrase: 'Puis, quand il dit : "le chemin de ceux que tu as comblés de Tes faveurs, non pas de ceux qui ont encouru Ta colère ni des égarés", Allah dit : "Cela est pour Mon serviteur et Mon serviteur a ce qu\'il demande."'
    }
  ];

  alFatihaDays.forEach(({ day, verseNumber, verseSense, spiritualite, discipline, action, closingPhrase }) => {
    const verse = getAlFatihaVerse(verseNumber);
    // Utiliser les descriptions personnalisées si disponibles
    const dayDescriptions = challengeId ? getDayDescriptions(day, challengeId, attribute) : null;
    
    days.push({
      day,
      title: dayDescriptions?.spirituelle ? (dayDescriptions.spirituelle.includes('Jour 11') ? '🌙 Jour 11 — Al-Fâtiha | Verset 1' : dayDescriptions.spirituelle.includes('Jour 12') ? '🌙 Jour 12 — Al-Fâtiha | Verset 2' : dayDescriptions.spirituelle.includes('Jour 13') ? '🌙 Jour 13 — Al-Fâtiha | Verset 3' : dayDescriptions.spirituelle.includes('Jour 14') ? '🌙 Jour 14 — Al-Fâtiha | Verset 4' : dayDescriptions.spirituelle.includes('Jour 15') ? '🌙 Jour 15 — Al-Fâtiha | Verset 5' : dayDescriptions.spirituelle.includes('Jour 16') ? '🌙 Jour 16 — Al-Fâtiha | Verset 6' : dayDescriptions.spirituelle.includes('Jour 17') ? '🌙 Jour 17 — Al-Fâtiha | Verset 7' : `🌙 Jour ${day} — Al-Fâtiha | Verset ${verseNumber}`) : `🌙 Jour ${day} — Al-Fâtiha | Verset ${verseNumber}`,
      block: `${BLOCKS_INFO[2].name} — ${BLOCKS_INFO[2].nameTranslation}`,
      blockNumber: 3,
      tasks: [
        {
          description: dayDescriptions?.spirituelle || (verse ? `${verse.arabic}\n${verse.translation}\n\n🧠 Sens du verset\n${verseSense}\n\n------\n🌿 Spiritualité:\n${spiritualite}` : `🧠 Sens du verset\n\n${verseSense}\n\n---\n\n🌿 Spiritualité\n\n${spiritualite}`),
          type: 'alfatiha_verse',
          verseReference: `Al-Fâtiha (1:${verseNumber})`,
          generatedByIA: false
        },
        {
          description: dayDescriptions?.discipline || `🧭 Discipline(${day === 11 ? '— tenir l\'entrée' : day === 12 ? 'tenir la reconnaissance' : day === 13 ? 'tenir la douceur' : day === 14 ? 'tenir la responsabilité' : day === 15 ? 'tenir l\'exclusivité et la reliance' : day === 16 ? 'tenir la direction' : 'choisir le bon modèle'})\n${discipline.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n👉 Discipline = ${day === 11 ? 'ralentir pour laisser entrer Allah' : day === 12 ? 'ne pas laisser la plainte couvrir la louange' : day === 13 ? 'ne pas fermer la porte de la miséricorde' : day === 14 ? 'vivre en conscience du retour' : day === 15 ? 'ne pas se suffire à soi-même' : day === 16 ? 'ne pas marcher sans direction' : 'ne pas suivre sans discernement'}\n-----`,
          type: 'discipline_ia',
          generatedByIA: false,
          options: dayDescriptions?.discipline ? undefined : discipline
        },
        {
          description: dayDescriptions?.action || `🔥 Action:(${day === 11 ? 'incarner le commencement juste' : day === 12 ? 'incarner la gratitude' : day === 13 ? 'incarner la miséricorde' : day === 14 ? 'incarner la responsabilité' : day === 15 ? 'demander et agir juste' : day === 16 ? 'marcher droit concrètement' : 'marcher avec les justes'})\n${action.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n👉 Action = ${day === 11 ? 'agir sans se mettre au centre' : day === 12 ? 'remercier par l\'usage' : day === 13 ? 'faire passer la miséricorde avant la victoire' : day === 14 ? 'agir comme si cela comptait vraiment' : day === 15 ? 'agir en servant, pas en dominant' : day === 16 ? 'mettre les pas dans la bonne direction' : 'marcher avec ceux qui ont reçu la faveur'}\n-----`,
          type: 'action_ia',
          generatedByIA: false,
          options: dayDescriptions?.action ? undefined : action,
          hasPoincon: day === 14 // J14 a un poinçon (Présence de la clarté intérieure - Front)
        }
      ],
      hasAlFatiha: true,
      hasPoincon: day === 14, // J14 : Présence de la clarté intérieure (Front)
      closingPhrase: closingPhrase,
      verse: verse ? {
        reference: `Al-Fâtiha (1:${verseNumber})`,
        arabic: verse.arabic,
        translation: verse.translation,
        tafsir: verseSense
      } : {
        reference: `Al-Fâtiha (1:${verseNumber})`,
        translation: `Verset ${verseNumber} d'Al-Fâtiha`,
        tafsir: verseSense
      }
    });
  });

  // J18 : Kalwa attribut d'Allah + 2 tâches
  const day18Descriptions = challengeId ? getDayDescriptions(18, challengeId, attribute) : null;
  days.push({
    day: 18,
    title: 'JOUR 18 — INTÉGRATION DE LA LUMIÈRE',
    block: `${BLOCKS_INFO[2].name} — ${BLOCKS_INFO[2].nameTranslation}`,
    blockNumber: 3,
    tasks: [
      {
        description: day18Descriptions?.spirituelle || `Kalwa : ${attribute}`,
        type: 'kalwa',
        divineAttribute: divineNamePhase1
      },
      {
        description: day18Descriptions?.discipline || 'Tâche discipline du jour 18',
        type: 'discipline_ia',
        generatedByIA: !day18Descriptions?.discipline
      },
      {
        description: day18Descriptions?.action || 'Tâche action du jour 18',
        type: 'action_ia',
        generatedByIA: !day18Descriptions?.action
      }
    ],
    hasKalwa: true
  });

  // ========== PARTIE 2 : JOURS 19-40 (5 TÂCHES/JOUR) ==========

  // BLOC 4 : Jours 19-21
  // J19 : Kalwa attribut d'Allah + 4 tâches (avec intention intégrée)
  const divineNamePhase2 = extractDivineName(attribute);
  const day19Descriptions = challengeId ? getDayDescriptions(19, challengeId, attribute) : null;
  days.push({
    day: 19,
    title: challengeId === 'voyage-du-coeur' ? 'JOUR 19 — TENIR SANS COMPENSER' : challengeId === 'liberation-spirituelle' ? 'JOUR 19 — RETIRER L\'ATTACHEMENT CACHÉ' : challengeId === 'discipline-baraka' ? 'JOUR 19 — INSTALLER LA CONSTANCE' : challengeId === 'purete-esprit' ? 'JOUR 19 — L\'ESPRIT SE REPOSE' : 'JOUR 19 — KALWA',
    block: `${BLOCKS_INFO[3].name} — ${BLOCKS_INFO[3].nameTranslation}`,
    blockNumber: 4,
    tasks: [
      {
        description: day19Descriptions?.spirituelle || `Kalwa : ${attribute}`,
        type: 'kalwa',
        divineAttribute: divineNamePhase2
      },
      {
        description: day19Descriptions?.discipline || 'Tâche discipline du jour 19',
        type: 'discipline_ia',
        generatedByIA: !day19Descriptions?.discipline
      },
      {
        description: day19Descriptions?.action || 'Tâche action du jour 19',
        type: 'action_ia',
        generatedByIA: !day19Descriptions?.action
      },
      {
        description: day19Descriptions?.introspection || 'Connexion à soi du jour 19',
        type: 'introspection',
        generatedByIA: !day19Descriptions?.introspection
      },
      {
        description: day19Descriptions?.ancrage || 'Ancrage concret du jour 19',
        type: 'ancrage_concret',
        generatedByIA: !day19Descriptions?.ancrage
      }
    ],
    hasKalwa: true,
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'La lumière ne demande pas toujours d\'agir.\nParfois, elle demande de tenir.' : challengeId === 'liberation-spirituelle' ? 'Ce qui est lâché sous la protection d\'Allah\nne laisse pas de vide,\nil laisse de l\'espace.' : challengeId === 'discipline-baraka' ? 'La discipline devient baraka\nquand elle cesse d\'être un combat\net devient une habitude tenue.' : challengeId === 'purete-esprit' ? 'L\'esprit se purifie\nquand il n\'est plus sollicité.' : undefined
  });

  // J20 : 5 tâches + poinçon (Présence des actes - Mains ou Vision intérieure selon le défi)
  const day20Descriptions = challengeId ? getDayDescriptions(20, challengeId, attribute) : null;
  const day20Title = challengeId === 'voyage-du-coeur' ? 'JOUR 20 — CLARIFIER LA VISION' : challengeId === 'liberation-spirituelle' ? 'JOUR 20 — POINT DE PRÉSENCE DE LA VISION INTÉRIEURE (FRONT)' : challengeId === 'discipline-baraka' ? 'JOUR 20 — POINÇON DE LA VISION CLAIRE (FRONT)' : challengeId === 'purete-esprit' ? 'JOUR 20 — CLARIFIER SANS FORCER' : 'JOUR 20 — PRÉSENCE DES ACTES (MAINS)';
  days.push({
    day: 20,
    title: day20Title,
    block: `${BLOCKS_INFO[3].name} — ${BLOCKS_INFO[3].nameTranslation}`,
    blockNumber: 4,
    tasks: [
      {
        description: day20Descriptions?.spirituelle || '🌿 Tâche spirituelle — Actes et ouverture\n\nPoser les mains sur le cœur ou devant soi.\nRéciter Yâ Fattâḥ,\npuis accomplir une action concrète juste, même simple.\n\n> Objectif : relier le dhikr à l\'action.',
        type: 'spirituelle_ia',
        generatedByIA: !day20Descriptions?.spirituelle
      },
      {
        description: day20Descriptions?.discipline || '🧭 Discipline\n\n1. Ne pas dissocier parole et action\n2. Éviter la passivité déguisée\n3. Tenir un engagement pris\n4. Agir avec intention claire\n5. Ne pas repousser une bonne action',
        type: 'discipline_ia',
        generatedByIA: !day20Descriptions?.discipline,
        options: day20Descriptions?.discipline ? undefined : [
          'Ne pas dissocier parole et action',
          'Éviter la passivité déguisée',
          'Tenir un engagement pris',
          'Agir avec intention claire',
          'Ne pas repousser une bonne action'
        ]
      },
      {
        description: day20Descriptions?.action || '🔥 Action\n\n1. Accomplir une action juste immédiatement\n2. Aider concrètement quelqu\'un\n3. Finaliser une tâche utile\n4. Servir sans chercher la reconnaissance\n5. Ouvrir une porte fermée (symbolique ou réelle)',
        type: 'action_ia',
        generatedByIA: !day20Descriptions?.action,
        options: day20Descriptions?.action ? undefined : [
          'Accomplir une action juste immédiatement',
          'Aider concrètement quelqu\'un',
          'Finaliser une tâche utile',
          'Servir sans chercher la reconnaissance',
          'Ouvrir une porte fermée (symbolique ou réelle)'
        ],
        hasPoincon: true
      },
      {
        description: day20Descriptions?.introspection || '🤍 Connexion à soi du jour 20',
        type: 'introspection',
        generatedByIA: !day20Descriptions?.introspection
      },
      {
        description: day20Descriptions?.ancrage || '🪨 Ancrage concret du jour 20',
        type: 'ancrage_concret',
        generatedByIA: !day20Descriptions?.ancrage
      }
    ],
    hasPoincon: true,
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'Quand la vision devient claire,\nle cœur n\'a plus besoin de se défendre.' : challengeId === 'liberation-spirituelle' ? 'La lumière n\'ajoute pas.\nElle enlève ce qui n\'est pas nécessaire.' : challengeId === 'discipline-baraka' ? 'Quand la lumière éclaire la voie,\nla discipline cesse d\'être lourde\net la baraka peut circuler.' : challengeId === 'purete-esprit' ? 'Voir devient simple\nquand l\'esprit s\'apaise.' : undefined
  });

  // J21 : Kalwa attribut d'Allah + 4 tâches
  const day21Descriptions = challengeId ? getDayDescriptions(21, challengeId, attribute) : null;
  const day21Title = challengeId === 'voyage-du-coeur' ? 'JOUR 21 — POSER UNE LIMITE CLAIRE' : challengeId === 'liberation-spirituelle' ? 'JOUR 21 — SE SENTIR GARDÉ POUR LÂCHER PRISE' : challengeId === 'discipline-baraka' ? 'JOUR 21 — LA BARAKA PAR LA FORCE TRANQUILLE' : challengeId === 'purete-esprit' ? 'JOUR 21 — LAISSER SE POSER' : 'JOUR 21 — KALWA';
  days.push({
    day: 21,
    title: day21Title,
    block: `${BLOCKS_INFO[3].name} — ${BLOCKS_INFO[3].nameTranslation}`,
    blockNumber: 4,
    tasks: [
      {
        description: day21Descriptions?.spirituelle || `Kalwa : ${attribute}`,
        type: 'kalwa',
        divineAttribute: divineNamePhase2
      },
      {
        description: day21Descriptions?.discipline || 'Tâche discipline du jour 21',
        type: 'discipline_ia',
        generatedByIA: !day21Descriptions?.discipline
      },
      {
        description: day21Descriptions?.action || 'Tâche action du jour 21',
        type: 'action_ia',
        generatedByIA: !day21Descriptions?.action
      },
      {
        description: day21Descriptions?.introspection || 'Connexion à soi du jour 21',
        type: 'introspection',
        generatedByIA: !day21Descriptions?.introspection
      },
      {
        description: day21Descriptions?.ancrage || 'Ancrage concret du jour 21',
        type: 'ancrage_concret',
        generatedByIA: !day21Descriptions?.ancrage
      }
    ],
    hasKalwa: true,
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'Une limite juste\nprotège la paix du cœur.' : challengeId === 'liberation-spirituelle' ? 'Ce qui est gardé par Allah\nn\'a pas besoin d\'être surveillé.' : challengeId === 'discipline-baraka' ? 'La vraie force\nn\'accélère pas.\nElle laisse fructifier.' : challengeId === 'purete-esprit' ? 'Ce qui est juste\nse pose sans effort.' : undefined
  });

  // BLOC 5 : Jours 22-27
  // J22 : 5 tâches (avec intention intégrée)
  const day22Descriptions = challengeId ? getDayDescriptions(22, challengeId, attribute) : null;
  const day22Title = challengeId === 'voyage-du-coeur' ? 'JOUR 22 — SUSPENDRE LA RÉACTION' : challengeId === 'liberation-spirituelle' ? 'JOUR 22 — SORTIR DE L\'AUTO-DÉFENSE' : challengeId === 'discipline-baraka' ? 'JOUR 22 — LA BARAKA DANS L\'INTENTION' : challengeId === 'purete-esprit' ? 'JOUR 22 — INTENTION CLAIRE' : 'JOUR 22';
  days.push({
    day: 22,
    title: day22Title,
    block: `${BLOCKS_INFO[4].name} — ${BLOCKS_INFO[4].nameTranslation}`,
    blockNumber: 5,
    tasks: [
      {
        description: day22Descriptions?.spirituelle || 'Tâche spirituelle du jour 22',
        type: 'spirituelle_ia',
        generatedByIA: !day22Descriptions?.spirituelle
      },
      {
        description: day22Descriptions?.discipline || 'Tâche discipline du jour 22',
        type: 'discipline_ia',
        generatedByIA: !day22Descriptions?.discipline
      },
      {
        description: day22Descriptions?.action || 'Tâche action du jour 22',
        type: 'action_ia',
        generatedByIA: !day22Descriptions?.action
      },
      {
        description: day22Descriptions?.introspection || 'Connexion à soi du jour 22',
        type: 'introspection',
        generatedByIA: !day22Descriptions?.introspection
      },
      {
        description: day22Descriptions?.ancrage || 'Ancrage concret du jour 22',
        type: 'ancrage_concret',
        generatedByIA: !day22Descriptions?.ancrage
      }
    ],
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'Quand la réaction se suspend,\nle cœur se repose.' : challengeId === 'liberation-spirituelle' ? 'La paix n\'a pas besoin d\'arguments.' : challengeId === 'discipline-baraka' ? 'Quand l\'intention est pure,\nla baraka descend.' : challengeId === 'purete-esprit' ? 'L\'intention allège l\'esprit.' : undefined
  });

  // J23 : 5 tâches
  const day23Descriptions = challengeId ? getDayDescriptions(23, challengeId, attribute) : null;
  const day23Title = challengeId === 'voyage-du-coeur' ? 'JOUR 23 — DÉTACHER LE CŒUR' : challengeId === 'liberation-spirituelle' ? 'JOUR 23 — NE PLUS ANTICIPER' : challengeId === 'discipline-baraka' ? 'JOUR 23 — LA BARAKA DANS LA RÉGULARITÉ' : challengeId === 'purete-esprit' ? 'JOUR 23 — RÉGULARITÉ APAISANTE' : 'JOUR 23';
  days.push({
    day: 23,
    title: day23Title,
    block: `${BLOCKS_INFO[4].name} — ${BLOCKS_INFO[4].nameTranslation}`,
    blockNumber: 5,
    tasks: [
      {
        description: day23Descriptions?.spirituelle || 'Tâche spirituelle du jour 23',
        type: 'spirituelle_ia',
        generatedByIA: !day23Descriptions?.spirituelle
      },
      {
        description: day23Descriptions?.discipline || 'Tâche discipline du jour 23',
        type: 'discipline_ia',
        generatedByIA: !day23Descriptions?.discipline
      },
      {
        description: day23Descriptions?.action || 'Tâche action du jour 23',
        type: 'action_ia',
        generatedByIA: !day23Descriptions?.action
      },
      {
        description: day23Descriptions?.introspection || 'Connexion à soi du jour 23',
        type: 'introspection',
        generatedByIA: !day23Descriptions?.introspection
      },
      {
        description: day23Descriptions?.ancrage || 'Ancrage concret du jour 23',
        type: 'ancrage_concret',
        generatedByIA: !day23Descriptions?.ancrage
      }
    ],
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'Ce qui est lâché\ncesse de peser.' : challengeId === 'liberation-spirituelle' ? 'Le futur appartient à Allah.\nLe cœur se repose quand il reste ici.' : challengeId === 'discipline-baraka' ? 'La baraka\nse cache dans ce qui dure.' : challengeId === 'purete-esprit' ? 'La constance purifie.' : undefined
  });

  // J24 : 5 tâches + poinçon (Présence de la stabilité intérieure - Centre)
  const day24Descriptions = challengeId ? getDayDescriptions(24, challengeId, attribute) : null;
  const day24Title = challengeId === 'voyage-du-coeur' ? 'JOUR 24 — S\'ÉTABLIR INTÉRIEUREMENT' : challengeId === 'liberation-spirituelle' ? 'JOUR 24 — POINT DE PRÉSENCE DU CENTRE INTÉRIEUR (VENTRE)' : challengeId === 'discipline-baraka' ? 'JOUR 24 — POINÇON DE LA STABILITÉ (VENTRE)' : challengeId === 'purete-esprit' ? 'JOUR 24 — STABILITÉ INTÉRIEURE' : 'JOUR 24 — PRÉSENCE DE LA STABILITÉ INTÉRIEURE (CENTRE)';
  days.push({
    day: 24,
    title: day24Title,
    block: `${BLOCKS_INFO[4].name} — ${BLOCKS_INFO[4].nameTranslation}`,
    blockNumber: 5,
    tasks: [
      {
        description: day24Descriptions?.spirituelle || '🌿 Tâche spirituelle — Stabilité intérieure\n\nRespiration consciente et lente.\nAttention portée au centre du corps comme lieu de stabilité.\nRéciter Yâ Qawiyy, 5 à 10 minutes.\n\n> Objectif : renforcer la stabilité et la maîtrise.',
        type: 'spirituelle_ia',
        generatedByIA: !day24Descriptions?.spirituelle
      },
      {
        description: day24Descriptions?.discipline || '🧭 Discipline\n\n1. Ne pas céder à l\'impulsion\n2. Maintenir le calme face à la pression\n3. Éviter les excès\n4. Tenir une constance minimale\n5. Rester posé dans les décisions',
        type: 'discipline_ia',
        generatedByIA: !day24Descriptions?.discipline,
        options: day24Descriptions?.discipline ? undefined : [
          'Ne pas céder à l\'impulsion',
          'Maintenir le calme face à la pression',
          'Éviter les excès',
          'Tenir une constance minimale',
          'Rester posé dans les décisions'
        ]
      },
      {
        description: day24Descriptions?.action || '🔥 Action\n\n1. Résister à une tentation\n2. Maintenir une posture droite\n3. Avancer sans précipitation\n4. Consolider une habitude saine\n5. Agir avec maîtrise plutôt qu\'émotion',
        type: 'action_ia',
        generatedByIA: !day24Descriptions?.action,
        options: day24Descriptions?.action ? undefined : [
          'Résister à une tentation',
          'Maintenir une posture droite',
          'Avancer sans précipitation',
          'Consolider une habitude saine',
          'Agir avec maîtrise plutôt qu\'émotion'
        ],
        hasPoincon: true
      },
      {
        description: day24Descriptions?.introspection || '🤍 Connexion à soi du jour 24',
        type: 'introspection',
        generatedByIA: !day24Descriptions?.introspection
      },
      {
        description: day24Descriptions?.ancrage || '🪨 Ancrage concret du jour 24',
        type: 'ancrage_concret',
        generatedByIA: !day24Descriptions?.ancrage
      }
    ],
    hasPoincon: true,
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'La force véritable\nest celle qui tient sans se crisper.' : challengeId === 'liberation-spirituelle' ? 'Quand le centre est stable,\nle cœur n\'est plus bousculé.' : challengeId === 'discipline-baraka' ? 'Quand le centre est stable,\nla baraka reste.' : challengeId === 'purete-esprit' ? 'Quand le centre est calme,\nl\'esprit suit.' : undefined
  });

  // J25 : 5 tâches
  const day25Descriptions = challengeId ? getDayDescriptions(25, challengeId, attribute) : null;
  const day25Title = challengeId === 'voyage-du-coeur' ? 'JOUR 25 — CESSER L\'AUTO-ACCUSATION' : challengeId === 'liberation-spirituelle' ? 'JOUR 25 — LIBÉRATION DE LA PEUR CACHÉE' : challengeId === 'discipline-baraka' ? 'JOUR 25 — LA BARAKA DANS LA CONTINUITÉ' : challengeId === 'purete-esprit' ? 'JOUR 25 — CONTINUER SANS MODIFIER' : 'JOUR 25';
  days.push({
    day: 25,
    title: day25Title,
    block: `${BLOCKS_INFO[4].name} — ${BLOCKS_INFO[4].nameTranslation}`,
    blockNumber: 5,
    tasks: [
      {
        description: day25Descriptions?.spirituelle || 'Tâche spirituelle du jour 25',
        type: 'spirituelle_ia',
        generatedByIA: !day25Descriptions?.spirituelle
      },
      {
        description: day25Descriptions?.discipline || 'Tâche discipline du jour 25',
        type: 'discipline_ia',
        generatedByIA: !day25Descriptions?.discipline
      },
      {
        description: day25Descriptions?.action || 'Tâche action du jour 25',
        type: 'action_ia',
        generatedByIA: !day25Descriptions?.action
      },
      {
        description: day25Descriptions?.introspection || 'Connexion à soi du jour 25',
        type: 'introspection',
        generatedByIA: !day25Descriptions?.introspection
      },
      {
        description: day25Descriptions?.ancrage || 'Ancrage concret du jour 25',
        type: 'ancrage_concret',
        generatedByIA: !day25Descriptions?.ancrage
      }
    ],
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'Un cœur qui se pardonne\ncommence à s\'apaiser.' : challengeId === 'liberation-spirituelle' ? 'La peur perd sa chaîne\nquand elle est traversée.' : challengeId === 'discipline-baraka' ? 'La baraka n\'a pas besoin de nouveauté,\nelle aime la fidélité.' : challengeId === 'purete-esprit' ? 'La fidélité apaise l\'esprit.' : undefined
  });

  // J26 : 5 tâches
  const day26Descriptions = challengeId ? getDayDescriptions(26, challengeId, attribute) : null;
  const day26Title = challengeId === 'voyage-du-coeur' ? 'JOUR 26 — RETIRER LA COMPARAISON' : challengeId === 'liberation-spirituelle' ? 'JOUR 26 — LIBÉRATION DU BESOIN D\'APPROBATION' : challengeId === 'discipline-baraka' ? 'JOUR 26 — LA BARAKA DANS LA SIMPLICITÉ' : challengeId === 'purete-esprit' ? 'JOUR 26 — ALLÉGER' : 'JOUR 26';
  days.push({
    day: 26,
    title: day26Title,
    block: `${BLOCKS_INFO[4].name} — ${BLOCKS_INFO[4].nameTranslation}`,
    blockNumber: 5,
    tasks: [
      {
        description: day26Descriptions?.spirituelle || 'Tâche spirituelle du jour 26',
        type: 'spirituelle_ia',
        generatedByIA: !day26Descriptions?.spirituelle
      },
      {
        description: day26Descriptions?.discipline || 'Tâche discipline du jour 26',
        type: 'discipline_ia',
        generatedByIA: !day26Descriptions?.discipline
      },
      {
        description: day26Descriptions?.action || 'Tâche action du jour 26',
        type: 'action_ia',
        generatedByIA: !day26Descriptions?.action
      },
      {
        description: day26Descriptions?.introspection || 'Connexion à soi du jour 26',
        type: 'introspection',
        generatedByIA: !day26Descriptions?.introspection
      },
      {
        description: day26Descriptions?.ancrage || 'Ancrage concret du jour 26',
        type: 'ancrage_concret',
        generatedByIA: !day26Descriptions?.ancrage
      }
    ],
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'La comparaison agite.\nLa justesse apaise.' : challengeId === 'liberation-spirituelle' ? 'La liberté commence\nquand le regard des autres s\'éteint.' : challengeId === 'discipline-baraka' ? 'La baraka descend\nlà où il y a sobriété.' : challengeId === 'purete-esprit' ? 'La légèreté est une purification.' : undefined
  });

  // J27 : Kalwa attribut d'Allah + 4 tâches
  const day27Descriptions = challengeId ? getDayDescriptions(27, challengeId, attribute) : null;
  const day27Title = challengeId === 'voyage-du-coeur' ? 'JOUR 27 — DÉPOSER CE QUI RESTE' : challengeId === 'liberation-spirituelle' ? 'JOUR 27 — LIBÉRATION DU FAUX CONTRÔLE' : challengeId === 'discipline-baraka' ? 'JOUR 27 — LA BARAKA DANS LA CONFIANCE' : challengeId === 'purete-esprit' ? 'JOUR 27 — FAIRE CONFIANCE' : 'JOUR 27 — KALWA';
  days.push({
    day: 27,
    title: day27Title,
    block: `${BLOCKS_INFO[4].name} — ${BLOCKS_INFO[4].nameTranslation}`,
    blockNumber: 5,
    tasks: [
      {
        description: day27Descriptions?.spirituelle || `Kalwa : ${attribute}`,
        type: 'kalwa',
        divineAttribute: divineNamePhase2
      },
      {
        description: day27Descriptions?.discipline || 'Tâche discipline du jour 27',
        type: 'discipline_ia',
        generatedByIA: !day27Descriptions?.discipline
      },
      {
        description: day27Descriptions?.action || 'Tâche action du jour 27',
        type: 'action_ia',
        generatedByIA: !day27Descriptions?.action
      },
      {
        description: day27Descriptions?.introspection || 'Connexion à soi du jour 27',
        type: 'introspection',
        generatedByIA: !day27Descriptions?.introspection
      },
      {
        description: day27Descriptions?.ancrage || 'Ancrage concret du jour 27',
        type: 'ancrage_concret',
        generatedByIA: !day27Descriptions?.ancrage
      }
    ],
    hasKalwa: true,
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'Ce qui est déposé\nn\'alourdit plus le cœur.' : challengeId === 'liberation-spirituelle' ? 'Ce qui est confié à Allah\nn\'a plus besoin d\'être surveillé.' : challengeId === 'discipline-baraka' ? 'La baraka grandit\nquand la confiance remplace la maîtrise.' : challengeId === 'purete-esprit' ? 'La confiance apaise.' : undefined
  });

  // BLOC 6 : Jours 28-36
  // J28-35 : Lecture 10 versets Yassine + 4 tâches
  const yassineDays = [
    {
      day: 28,
      verses: '1-10',
      verseStart: 1,
      verseEnd: 10,
      theme: 'Le Coran est un rappel clair.\nLa voie droite est déjà connue.\nCertains cœurs se ferment par refus, pas par ignorance.\nLa guidance est proposée, jamais imposée.',
      spiritualite: 'Lire les versets 1 à 10 lentement, sans multitâche et méditer.',
      discipline: [
        'Couper volontairement toute distraction pendant le temps spirituel',
        'Ne pas repousser la lecture à plus tard dans la journée',
        'Respecter un moment fixe pour la lecture',
        'Ne pas consommer d\'informations inutiles juste après la lecture',
        'S\'abstenir de parler inutilement dans l\'heure qui suit'
      ],
      action: [
        'Accomplir une action juste que tu sais déjà devoir faire',
        'Corriger un comportement que tu sais incorrect',
        'Répondre à une responsabilité que tu retardes',
        'Poser un acte aligné avec une valeur claire de l\'islam',
        'Cesser une action que tu sais inutile ou nuisible'
      ],
      introspection: [
        'Identifier une vérité que tu connais mais que tu évites',
        'Reconnaître une habitude de justification intérieure',
        'Observer une résistance quand un rappel apparaît',
        'Noter ce qui te ferme intérieurement (peur, orgueil, confort)',
        'Accepter sans jugement ce qui est encore bloqué'
      ],
      ancrage: [
        'Marcher lentement en conscience après la lecture',
        'Respirer profondément en sentant l\'air entrer et sortir',
        'Ancrer les pieds au sol quelques instants',
        'Se redresser physiquement (posture droite)',
        'Toucher un élément réel (sol, mur, objet) pour revenir au présent'
      ],
      closingPhrase: 'Le rappel est clair.\nLa question n\'est pas ce qui est dit,\nmais ce que tu choisis de laisser entrer.'
    },
    {
      day: 29,
      verses: '12-20',
      verseStart: 12,
      verseEnd: 20,
      theme: 'Croire sans voir, rester droit quand la majorité refuse, assumer la vérité même seul.',
      spiritualite: 'Lire les versets 11 à 20 lentement et entièrement, avec attention et silence après la lecture.',
      discipline: [
        'Agir correctement aujourd\'hui même si personne ne te voit',
        'Respecter une obligation sans chercher reconnaissance',
        'Ne pas modifier ton comportement pour plaire aux autres',
        'Garder une intention droite dans un acte discret',
        'Ne pas abandonner une bonne pratique par peur du regard'
      ],
      action: [
        'Défendre une vérité avec calme, sans agressivité',
        'Poser un acte juste même s\'il est impopulaire',
        'Soutenir une personne ou une cause juste discrètement',
        'Dire une parole vraie quand le silence serait plus confortable',
        'Choisir Allah plutôt que l\'approbation des gens'
      ],
      introspection: [
        'Observer ce que tu fais uniquement quand on te regarde',
        'Identifier une peur liée au jugement des autres',
        'Reconnaître où tu adaptes ta foi pour être accepté',
        'Te demander : si personne ne voyait, agirais-je pareil ?',
        'Accueillir avec honnêteté tes contradictions intérieures'
      ],
      ancrage: [
        'Marcher seul quelques minutes en silence',
        'Poser les mains sur la poitrine et respirer calmement',
        'Écrire une intention sincère et la garder pour toi',
        'Ralentir volontairement un geste quotidien',
        'Sentir le poids du corps et l\'instant présent'
      ],
      closingPhrase: 'Allah voit dans l\'invisible.\nCe qui est compté n\'est pas ce qui est montré,\nmais ce qui est sincère.'
    },
    {
      day: 30,
      verses: '21-30',
      verseStart: 21,
      verseEnd: 30,
      theme: 'La vérité est simple, sincère, et sans contrepartie.\nLe plus grand regret est de l\'avoir reconnue trop tard.',
      spiritualite: 'Lire les versets 21 à 30 lentement et entièrement, avec attention et silence après la lecture.',
      discipline: [
        'Refuser de faire une bonne action dans l\'attente d\'un retour',
        'Vérifier l\'intention avant d\'agir : pour Allah ou pour autre chose ?',
        'Continuer une action juste même sans encouragement',
        'Ne pas conditionner le bien à une récompense',
        'Éviter toute recherche de reconnaissance dans la foi'
      ],
      action: [
        'Accomplir un bien sans en parler à personne',
        'Aider sans expliquer ni justifier ton geste',
        'Dire une vérité utile sans chercher l\'approbation',
        'Faire une sadaqa discrète, même minime',
        'Poser un acte juste sans attendre de retour immédiat'
      ],
      introspection: [
        'Identifier une vérité que tu reconnais mais que tu repousses',
        'Imaginer le regret de ne pas avoir agi aujourd\'hui',
        'Reconnaître où tu attends trop avant de faire le bien',
        'Te demander : qu\'est-ce que je ne veux pas regretter plus tard ?',
        'Accepter que certaines occasions ne reviennent pas'
      ],
      ancrage: [
        'Marcher lentement en observant ce qui disparaît (ombres, sons)',
        'Toucher un objet simple et rappeler sa fragilité',
        'Respirer profondément en conscience de l\'instant',
        'Écrire une action que tu feras aujourd\'hui, pas demain',
        'T\'ancrer dans le présent sans projection excessive'
      ],
      closingPhrase: 'La vérité n\'a pas besoin de récompense.\nLe regret, lui, arrive quand il est trop tard.'
    },
    {
      day: 31,
      verses: '31-40',
      verseStart: 31,
      verseEnd: 40,
      theme: 'Les signes sont clairs, répétés et stables.\nL\'oubli vient du cœur, pas du manque de preuves.',
      spiritualite: 'Lire les versets 31 à 40 lentement et entièrement, avec attention et silence après la lecture.',
      discipline: [
        'Respecter un cadre précis aujourd\'hui (horaire, engagement, règle)',
        'Ne pas dépasser volontairement une limite connue',
        'Accepter une contrainte sans te plaindre',
        'Honorer un rythme naturel (repos, effort, silence)',
        'Cesser de lutter contre un ordre que tu ne contrôles pas'
      ],
      action: [
        'Mettre de l\'ordre dans un aspect concret de ta vie',
        'Réparer un déséquilibre évident (excès, négligence)',
        'Agir avec régularité plutôt qu\'avec intensité',
        'Ajuster un comportement pour qu\'il soit plus juste et mesuré',
        'Respecter le temps des choses sans précipitation'
      ],
      introspection: [
        'Identifier où tu refuses une limite',
        'Reconnaître une lutte inutile contre la réalité',
        'Observer ton rapport au temps (impatience, fuite)',
        'Te demander : suis-je aligné ou en résistance ?',
        'Accepter que tout n\'est pas entre tes mains'
      ],
      ancrage: [
        'Observer le ciel, la lumière ou l\'obscurité consciemment',
        'Marcher en suivant un rythme lent et régulier',
        'Synchroniser la respiration avec les pas',
        'S\'asseoir immobile quelques minutes',
        'Ressentir le passage du temps sans le combler'
      ],
      closingPhrase: 'Tout suit un ordre.\nL\'égarement commence quand on refuse sa place.'
    },
    {
      day: 32,
      verses: '41-50',
      verseStart: 41,
      verseEnd: 50,
      theme: 'Tu es porté, protégé et maintenu par Allah,\nmais le temps accordé n\'est ni infini ni garanti.',
      spiritualite: 'Lire les versets 41 à 50 lentement et entièrement, avec attention et silence après la lecture.',
      discipline: [
        'Ne pas remettre à plus tard une obligation claire',
        'Agir aujourd\'hui sans présumer du lendemain',
        'Reconnaître consciemment une protection d\'Allah dans ta journée',
        'Éviter toute insouciance volontaire face au rappel',
        'Garder une attitude d\'éveil, pas de négligence'
      ],
      action: [
        'Accomplir une bonne action que tu reportais',
        'Réparer une négligence avant qu\'elle ne devienne irréversible',
        'Dire une parole vraie que tu retardais',
        'Profiter d\'une capacité actuelle (temps, santé, force)',
        'Poser un acte utile en conscience de sa fragilité'
      ],
      introspection: [
        'Identifier une chose que tu considères acquise à tort',
        'Observer où tu vis comme si demain était garanti',
        'Reconnaître une insouciance intérieure',
        'Te demander : si tout s\'arrêtait aujourd\'hui, que regretterais-je ?',
        'Accepter que le délai accordé est une miséricorde'
      ],
      ancrage: [
        'S\'asseoir quelques minutes en ressentant le soutien du sol',
        'Respirer profondément en conscience d\'être maintenu en vie',
        'Marcher en observant chaque pas comme un don',
        'Toucher un objet porteur (chaise, sol, mur)',
        'Ralentir volontairement pour ressentir la stabilité'
      ],
      closingPhrase: 'Tu es porté par miséricorde.\nMais le temps accordé n\'est pas éternel.'
    },
    {
      day: 33,
      verses: '51-60',
      verseStart: 51,
      verseEnd: 60,
      theme: 'L\'heure viendra sans avertissement.\nCe jour-là, chacun sera séparé selon ce qu\'il a réellement suivi.',
      spiritualite: 'Lire les versets 51 à 60 lentement et entièrement, avec attention et silence après la lecture.',
      discipline: [
        'Respecter aujourd\'hui un engagement pris devant Allah',
        'Ne pas banaliser un péché connu',
        'Refuser une facilité qui mène à la désobéissance',
        'Se rappeler consciemment que chaque acte compte',
        'Honorer une obligation même si elle pèse'
      ],
      action: [
        'Cesser une action qui te rapproche d\'un mauvais chemin',
        'Poser un acte qui marque clairement ton choix pour Allah',
        'Dire non à une influence nuisible',
        'Revenir à une pratique droite abandonnée',
        'Agir comme si cet acte devait être présenté aujourd\'hui'
      ],
      introspection: [
        'Identifier ce qui dirige tes choix au quotidien',
        'Reconnaître une habitude dictée par autre chose qu\'Allah',
        'Observer où tu te disperses intérieurement',
        'Te demander : qui est réellement suivi dans mes décisions ?',
        'Accepter ce qui doit être rectifié'
      ],
      ancrage: [
        'Se tenir debout quelques instants en silence',
        'Respirer lentement en imaginant la comparution',
        'Ressentir le poids du corps et de l\'instant',
        'Marcher en conscience de chaque pas',
        'S\'asseoir immobile sans distraction'
      ],
      closingPhrase: 'Ce jour-là, la séparation sera claire.\nChacun sera avec ce qu\'il a suivi.'
    },
    {
      day: 34,
      verses: '61-70',
      verseStart: 61,
      verseEnd: 70,
      theme: 'La vérité a toujours été claire.\nLe problème n\'est pas le manque de guidance, mais le refus de l\'emprunter.',
      spiritualite: 'Lire les versets 61 à 70 lentement et entièrement, avec attention et silence après la lecture.',
      discipline: [
        'Ne pas suivre une habitude simplement parce qu\'elle est ancienne',
        'Vérifier que tes choix quotidiens mènent réellement vers Allah',
        'Refuser de justifier une erreur connue',
        'Ne pas banaliser un rappel clair',
        'Se rappeler que la clarté engage une responsabilité'
      ],
      action: [
        'Corriger une incohérence entre ce que tu dis et ce que tu fais',
        'Mettre fin à une pratique qui te détourne du chemin droit',
        'Agir conformément à un rappel clair reçu récemment',
        'Choisir une action qui t\'élève plutôt qu\'une facilité',
        'Préserver ta langue d\'une parole inutile ou trompeuse'
      ],
      introspection: [
        'Réfléchir à ce que tes actes diraient de toi',
        'Observer ce que tes habitudes révèlent réellement',
        'Identifier une illusion dans laquelle tu te rassures',
        'Te demander : si mes actes parlaient, que diraient-ils ?',
        'Reconnaître sans fuite ce qui doit être rectifié'
      ],
      ancrage: [
        'Poser les mains sur les cuisses et rester immobile quelques instants',
        'Respirer profondément en gardant le dos droit',
        'Marcher lentement en conscience du chemin sous tes pieds',
        'Ressentir chaque mouvement volontairement',
        'S\'ancrer dans la posture de responsabilité'
      ],
      closingPhrase: 'Le chemin était clair.\nCe jour-là, ce ne sont pas les mots qui parleront,\nmais les actes.'
    },
    {
      day: 35,
      verses: '71-80',
      verseStart: 71,
      verseEnd: 80,
      theme: 'Celui qui a donné la vie et les bienfaits est capable de redonner la vie.\nL\'ingratitude vient de l\'oubli de l\'origine.',
      spiritualite: 'Lire les versets 71 à 80 lentement et entièrement, avec attention et silence après la lecture.',
      discipline: [
        'Ne pas attribuer tes capacités uniquement à toi-même',
        'Reconnaître consciemment l\'origine d\'un bienfait reçu aujourd\'hui',
        'Éviter toute parole d\'orgueil ou d\'auto-suffisance',
        'Respecter les dons qui te sont confiés (corps, temps, ressources)',
        'Ne pas banaliser ce qui t\'est donné quotidiennement'
      ],
      action: [
        'Utiliser un bienfait dans un but juste',
        'Partager une ressource que tu aurais pu garder',
        'Protéger ou préserver quelque chose qui t\'a été confié',
        'Transformer un don reçu en bien pour autrui',
        'Faire une sadaqa, même minime, en reconnaissance'
      ],
      introspection: [
        'Identifier un bienfait que tu considères comme acquis',
        'Reconnaître où tu oublies Allah dans l\'abondance',
        'Observer une plainte malgré ce qui est donné',
        'Te demander : si tout m\'était retiré, que resterait-il ?',
        'Accueillir l\'humilité sans te dévaloriser'
      ],
      ancrage: [
        'Poser la main sur la poitrine et sentir la respiration',
        'Toucher un objet utile et se rappeler son utilité',
        'Marcher en conscience de la force dans les jambes',
        'Respirer profondément en ressentant la vitalité',
        'S\'arrêter un instant pour ressentir la vie en soi'
      ],
      closingPhrase: 'Celui qui a donné la vie une première fois\nest capable de la redonner.'
    }
  ];

  yassineDays.forEach(({ day, verses, verseStart, verseEnd, theme, spiritualite, discipline, action, introspection, ancrage, closingPhrase }) => {
    // Utiliser les descriptions personnalisées si disponibles
    const dayDescriptions = challengeId ? getDayDescriptions(day, challengeId, attribute) : null;
    
    days.push({
      day,
      title: `JOUR ${day} — YASSINE (${verses})`,
      block: `${BLOCKS_INFO[5].name} — ${BLOCKS_INFO[5].nameTranslation}`,
      blockNumber: 6,
      tasks: [
        {
          description: dayDescriptions?.spirituelle || `🧠 Thème central des versets\n\n${theme}\n\n---\n\n🌿 SPIRITUALITÉ\n\n(lecture & méditation)\n\n${spiritualite}`,
          type: 'yassine_reading',
          verseReference: `Yâ-Sîn (36:${verseStart}-${verseEnd})`,
          generatedByIA: false
        },
        {
          description: dayDescriptions?.discipline || `🧭 DISCIPLINE\n\n(disponibilité au rappel)\n\n${discipline.map((d, i) => `${i + 1}. ${d}`).join('\n')}`,
          type: 'discipline_ia',
          generatedByIA: false,
          options: dayDescriptions?.discipline ? undefined : discipline
        },
        {
          description: dayDescriptions?.action || `🔥 ACTION\n\n(incarner la voie droite)\n\n${action.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
          type: 'action_ia',
          generatedByIA: false,
          options: dayDescriptions?.action ? undefined : action
        },
        {
          description: dayDescriptions?.introspection || `🤍 INTROSPECTION\n\n(voir les voiles intérieurs)\n\n${introspection.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`,
          type: 'introspection',
          generatedByIA: false,
          options: dayDescriptions?.introspection ? undefined : introspection
        },
        {
          description: dayDescriptions?.ancrage || `🪨 ANCRAGE CONCRET\n\n(rendre le rappel vivant dans le corps)\n\n${ancrage.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
          type: 'ancrage_concret',
          generatedByIA: false,
          options: dayDescriptions?.ancrage ? undefined : ancrage
        }
      ],
      hasYassine: true,
      closingPhrase: dayDescriptions?.spirituelle ? undefined : closingPhrase,
      verse: {
        reference: `Yâ-Sîn (36:${verseStart}-${verseEnd})`,
        translation: `Versets ${verseStart} à ${verseEnd} de Yassine`,
        tafsir: theme
      }
    });
  });

  // J36 : Kalwa attribut d'Allah + 4 tâches
  const day36Descriptions = challengeId ? getDayDescriptions(36, challengeId, attribute) : null;
  const day36Title = challengeId === 'voyage-du-coeur' ? 'JOUR 36 — SCELLER LE CHEMIN' : challengeId === 'liberation-spirituelle' ? 'JOUR 36 — CLÔTURE DE LA LIBÉRATION' : challengeId === 'discipline-baraka' ? 'JOUR 36 — CLÔTURE DISCIPLINE & BARAKA' : challengeId === 'purete-esprit' ? 'JOUR 36 — SCELLER LA PURETÉ' : 'JOUR 36 — KALWA';
  days.push({
    day: 36,
    title: day36Title,
    block: `${BLOCKS_INFO[5].name} — ${BLOCKS_INFO[5].nameTranslation}`,
    blockNumber: 6,
    tasks: [
      {
        description: day36Descriptions?.spirituelle || `Kalwa : ${attribute}`,
        type: 'kalwa',
        divineAttribute: divineNamePhase2
      },
      {
        description: day36Descriptions?.discipline || 'Tâche discipline du jour 36',
        type: 'discipline_ia',
        generatedByIA: !day36Descriptions?.discipline
      },
      {
        description: day36Descriptions?.action || 'Tâche action du jour 36',
        type: 'action_ia',
        generatedByIA: !day36Descriptions?.action
      },
      {
        description: day36Descriptions?.introspection || 'Connexion à soi du jour 36',
        type: 'introspection',
        generatedByIA: !day36Descriptions?.introspection
      },
      {
        description: day36Descriptions?.ancrage || 'Ancrage concret du jour 36',
        type: 'ancrage_concret',
        generatedByIA: !day36Descriptions?.ancrage
      }
    ],
    hasKalwa: true,
    closingPhrase: challengeId === 'voyage-du-coeur' ? 'Le chemin n\'a plus besoin d\'être tenu.\nIl est maintenant posé.' : challengeId === 'liberation-spirituelle' ? 'Fin de la libération.\nDébut du décret.' : challengeId === 'discipline-baraka' ? 'Fin de la discipline.\nDébut du décret.' : challengeId === 'purete-esprit' ? 'La pureté est scellée.' : undefined
  });

  // BLOC 7 : Jours 37-40
  // J37-39 : Lecture versets 81-83 Yassine (Kun fa yakūn) - Format spécial avec 5 tâches spirituelles
  const day37Descriptions = challengeId ? getDayDescriptions(37, challengeId, attribute) : null;
  const day38Descriptions = challengeId ? getDayDescriptions(38, challengeId, attribute) : null;
  const day39Descriptions = challengeId ? getDayDescriptions(39, challengeId, attribute) : null;
  
  // Jour 37 : KUN (Sois)
  if (day37Descriptions?.spirituelle) {
    // Parser les 5 tâches spirituelles depuis la description
    const spiritualText = day37Descriptions.spirituelle;
    // Extraire les 5 tâches (format: "1. ...\n\n2. ..." ou "🌿 ...\n\n🌿 ...")
    const taskMatches = spiritualText.match(/(?:^|\n)(?:\d+\.|🌿)\s*([^\n]+(?:\n(?!\d+\.|🌿)[^\n]+)*)/g);
    const spiritualTasks = taskMatches ? taskMatches.map(t => t.replace(/^(?:\n)?(?:\d+\.|🌿)\s*/, '').trim()) : [];
    
    // Si on n'a pas trouvé de tâches numérotées, utiliser la description complète comme première tâche
    const day37Title = challengeId === 'voyage-du-coeur' ? 'JOUR 37 — KUN (SOIS)' : challengeId === 'liberation-spirituelle' ? 'JOUR 37 — KUN (SOIS)' : challengeId === 'discipline-baraka' ? 'JOUR 37 — KUN (SOIS)' : challengeId === 'purete-esprit' ? 'JOUR 37 — KUN (SOIS)' : 'JOUR 37 — KUN (SOIS)';
    days.push({
      day: 37,
      title: day37Title,
      block: `${BLOCKS_INFO[6].name} — ${BLOCKS_INFO[6].nameTranslation}`,
      blockNumber: 7,
      tasks: spiritualTasks.length >= 5 ? [
        // Enlever la première tâche yassine, garder les 4 tâches spirituelles
        {
          description: spiritualTasks[1],
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: spiritualTasks[2],
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: spiritualTasks[3],
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: spiritualTasks[4],
          type: 'spirituelle_ia',
          generatedByIA: false
        }
      ] : [
        // Enlever la première tâche yassine
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        }
      ],
      hasYassine: true,
      closingPhrase: challengeId === 'voyage-du-coeur' ? 'Ici, rien ne se provoque.\nTout commence par Kun.' : challengeId === 'liberation-spirituelle' ? 'Ici, rien ne se provoque.\nTout commence par Kun.' : challengeId === 'discipline-baraka' ? 'Ici, rien ne se force.\nTout commence par Kun.' : challengeId === 'purete-esprit' ? 'Tout commence\npar Kun.' : 'Quand Allah décide une chose,\nSa volonté suffit.',
      verse: {
        reference: 'Yâ-Sîn (36:81-83)',
        translation: 'Versets 81 à 83 de Yassine',
        tafsir: 'Kun fa yakūn'
      }
    });
  } else {
    // Fallback vers l'ancienne structure si pas de description
    days.push({
      day: 37,
      title: 'JOUR 37 — KUN (SOIS)',
      block: `${BLOCKS_INFO[6].name} — ${BLOCKS_INFO[6].nameTranslation}`,
      blockNumber: 7,
      tasks: [
        // Enlever la première tâche yassine, garder les 4 autres
        {
          description: '🧭 DISCIPLINE\n\n(ne pas se substituer à la volonté d\'Allah)\n\n1. Cesser de vouloir décider de l\'issue\n2. Ne pas imposer ton scénario à une situation\n3. Renoncer à maîtriser ce qui ne t\'appartient pas\n4. Accepter qu\'Allah décide autrement que toi\n5. Respecter les limites de ton pouvoir',
          type: 'discipline_ia',
          generatedByIA: false,
          options: [
            'Cesser de vouloir décider de l\'issue',
            'Ne pas imposer ton scénario à une situation',
            'Renoncer à maîtriser ce qui ne t\'appartient pas',
            'Accepter qu\'Allah décide autrement que toi',
            'Respecter les limites de ton pouvoir'
          ]
        },
        {
          description: '🔥 ACTION\n\n(poser l\'acte juste, puis s\'arrêter)\n\n1. Faire ce qui est juste aujourd\'hui, sans anticiper le résultat\n2. Accomplir une obligation puis lâcher prise\n3. Ne pas multiplier les actions par peur\n4. Poser une intention claire et la confier à Allah\n5. Cesser d\'agir là où l\'effort est déjà fait',
          type: 'action_ia',
          generatedByIA: false,
          options: [
            'Faire ce qui est juste aujourd\'hui, sans anticiper le résultat',
            'Accomplir une obligation puis lâcher prise',
            'Ne pas multiplier les actions par peur',
            'Poser une intention claire et la confier à Allah',
            'Cesser d\'agir là où l\'effort est déjà fait'
          ]
        },
        {
          description: '🤍 INTROSPECTION\n\n(observer le besoin de contrôle)\n\n1. Identifier ce que tu veux absolument diriger\n2. Reconnaître une peur liée au résultat\n3. Observer où tu confonds effort et maîtrise\n4. Te demander : et si Allah décidait autrement ?\n5. Accepter la dépossession intérieure',
          type: 'introspection',
          generatedByIA: false,
          options: [
            'Identifier ce que tu veux absolument diriger',
            'Reconnaître une peur liée au résultat',
            'Observer où tu confonds effort et maîtrise',
            'Te demander : et si Allah décidait autrement ?',
            'Accepter la dépossession intérieure'
          ]
        },
        {
          description: '🪨 ANCRAGE CONCRET\n\n(se retirer intérieurement)\n\n1. Expirer lentement en relâchant les épaules\n2. S\'asseoir immobile quelques minutes\n3. Poser les pieds au sol en conscience\n4. Laisser la respiration se faire seule\n5. Ressentir le calme après l\'effort',
          type: 'ancrage_concret',
          generatedByIA: false,
          options: [
            'Expirer lentement en relâchant les épaules',
            'S\'asseoir immobile quelques minutes',
            'Poser les pieds au sol en conscience',
            'Laisser la respiration se faire seule',
            'Ressentir le calme après l\'effort'
          ]
        }
      ],
      hasYassine: true,
      closingPhrase: 'Quand Allah décide une chose,\nSa volonté suffit.',
      verse: {
        reference: 'Yâ-Sîn (36:81-83)',
        translation: 'Versets 81 à 83 de Yassine',
        tafsir: 'Kun fa yakūn'
      }
    });
  }
  
  // Jour 38 : FA (Alors) - Point de présence de l'ancrage (Pieds)
  if (day38Descriptions?.spirituelle) {
    const spiritualText = day38Descriptions.spirituelle;
    const taskMatches = spiritualText.match(/(?:^|\n)(?:\d+\.|🌿)\s*([^\n]+(?:\n(?!\d+\.|🌿)[^\n]+)*)/g);
    const spiritualTasks = taskMatches ? taskMatches.map(t => t.replace(/^(?:\n)?(?:\d+\.|🌿)\s*/, '').trim()) : [];
    
    const day38Title = challengeId === 'voyage-du-coeur' ? 'JOUR 38 — FA (ALORS)' : challengeId === 'liberation-spirituelle' ? 'JOUR 38 — FA (ALORS)' : challengeId === 'discipline-baraka' ? 'JOUR 38 — FA (ALORS)' : challengeId === 'purete-esprit' ? 'JOUR 38 — FA (ALORS)' : 'JOUR 38 — FA (ALORS)';
    days.push({
      day: 38,
      title: day38Title,
      block: `${BLOCKS_INFO[6].name} — ${BLOCKS_INFO[6].nameTranslation}`,
      blockNumber: 7,
      tasks: spiritualTasks.length >= 5 ? [
        // Enlever la première tâche yassine, garder les 4 tâches spirituelles
        {
          description: spiritualTasks[1],
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: spiritualTasks[2],
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: spiritualTasks[3],
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: spiritualTasks[4],
          type: 'spirituelle_ia',
          generatedByIA: false
        }
      ] : [
        // Enlever la première tâche yassine
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        }
      ],
      hasYassine: true,
      hasPoincon: true, // J38 : Présence de l'ancrage (Pieds)
      closingPhrase: challengeId === 'voyage-du-coeur' ? 'Ce qui est voulu par Allah\nse met en place sans résistance.' : challengeId === 'liberation-spirituelle' ? 'Ce qui est voulu par Allah\nse met en place sans résistance.' : challengeId === 'discipline-baraka' ? 'Ce qui est décrété\nprend forme sans résistance.' : challengeId === 'purete-esprit' ? 'Ce qui est voulu\nsuit son cours.' : 'Entre l\'ordre et l\'accomplissement,\nl\'homme n\'intervient pas.',
      verse: {
        reference: 'Yâ-Sîn (36:81-83)',
        translation: 'Versets 81 à 83 de Yassine',
        tafsir: 'Kun fa yakūn'
      }
    });
  } else {
    // Fallback
    days.push({
      day: 38,
      title: 'JOUR 38 — FA (ALORS)',
      block: `${BLOCKS_INFO[6].name} — ${BLOCKS_INFO[6].nameTranslation}`,
      blockNumber: 7,
      tasks: [
        // Enlever la première tâche yassine
        {
          description: '🧭 DISCIPLINE\n\n(ne pas se substituer à la volonté d\'Allah)\n\n1. Ne pas interrompre un changement déjà lancé\n2. Ne pas revenir en arrière par peur\n3. Ne pas forcer un timing différent\n4. Accepter l\'inconnu entre l\'ordre et le résultat\n5. Rester patient sans inertie',
          type: 'discipline_ia',
          generatedByIA: false,
          options: [
            'Ne pas interrompre un changement déjà lancé',
            'Ne pas revenir en arrière par peur',
            'Ne pas forcer un timing différent',
            'Accepter l\'inconnu entre l\'ordre et le résultat',
            'Rester patient sans inertie'
          ]
        },
        {
          description: '🔥 ACTION\n\n(poser l\'acte juste, puis s\'arrêter)\n\n1. Laisser une situation évoluer sans la contrôler\n2. Ne pas sur-agir par impatience\n3. Continuer droit sans précipitation\n4. Faire confiance après avoir fait ta part\n5. T\'abstenir d\'une action dictée par l\'angoisse',
          type: 'action_ia',
          generatedByIA: false,
          options: [
            'Laisser une situation évoluer sans la contrôler',
            'Ne pas sur-agir par impatience',
            'Continuer droit sans précipitation',
            'Faire confiance après avoir fait ta part',
            'T\'abstenir d\'une action dictée par l\'angoisse'
          ],
          hasPoincon: true
        },
        {
          description: '🤍 INTROSPECTION\n\n(observer le besoin de contrôle)\n\n1. Observer ton rapport à l\'attente\n2. Reconnaître l\'inconfort du non-visible\n3. Identifier le besoin de "preuves" immédiates\n4. Te demander : suis-je capable de laisser faire ?\n5. Accueillir le vide sans le remplir',
          type: 'introspection',
          generatedByIA: false,
          options: [
            'Observer ton rapport à l\'attente',
            'Reconnaître l\'inconfort du non-visible',
            'Identifier le besoin de "preuves" immédiates',
            'Te demander : suis-je capable de laisser faire ?',
            'Accueillir le vide sans le remplir'
          ]
        },
        {
          description: '🪨 ANCRAGE CONCRET\n\n(se retirer intérieurement)\n\n1. Marcher lentement sans destination\n2. Observer un mouvement naturel (vent, eau)\n3. Respirer sans modifier le rythme\n4. Ressentir le corps en déplacement\n5. Rester immobile en laissant passer les pensées',
          type: 'ancrage_concret',
          generatedByIA: false,
          options: [
            'Marcher lentement sans destination',
            'Observer un mouvement naturel (vent, eau)',
            'Respirer sans modifier le rythme',
            'Ressentir le corps en déplacement',
            'Rester immobile en laissant passer les pensées'
          ]
        }
      ],
      hasYassine: true,
      hasPoincon: true,
      closingPhrase: 'Entre l\'ordre et l\'accomplissement,\nl\'homme n\'intervient pas.',
      verse: {
        reference: 'Yâ-Sîn (36:81-83)',
        translation: 'Versets 81 à 83 de Yassine',
        tafsir: 'Kun fa yakūn'
      }
    });
  }
  
  // Jour 39 : YAKŪN (Et c'est)
  if (day39Descriptions?.spirituelle) {
    const spiritualText = day39Descriptions.spirituelle;
    const taskMatches = spiritualText.match(/(?:^|\n)(?:\d+\.|🌿)\s*([^\n]+(?:\n(?!\d+\.|🌿)[^\n]+)*)/g);
    const spiritualTasks = taskMatches ? taskMatches.map(t => t.replace(/^(?:\n)?(?:\d+\.|🌿)\s*/, '').trim()) : [];
    
    const day39Title = challengeId === 'voyage-du-coeur' ? 'JOUR 39 — YAKŪN (ET C\'EST)' : challengeId === 'liberation-spirituelle' ? 'JOUR 39 — YAKŪN (ET C\'EST)' : challengeId === 'discipline-baraka' ? 'JOUR 39 — YAKŪN (ET C\'EST)' : challengeId === 'purete-esprit' ? 'JOUR 39 — YAKŪN (ET C\'EST)' : 'JOUR 39 — YAKŪN (ET C\'EST)';
    days.push({
      day: 39,
      title: day39Title,
      block: `${BLOCKS_INFO[6].name} — ${BLOCKS_INFO[6].nameTranslation}`,
      blockNumber: 7,
      tasks: spiritualTasks.length >= 5 ? [
        // Enlever la première tâche yassine, garder les 4 tâches spirituelles
        {
          description: spiritualTasks[1],
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: spiritualTasks[2],
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: spiritualTasks[3],
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: spiritualTasks[4],
          type: 'spirituelle_ia',
          generatedByIA: false
        }
      ] : [
        // Enlever la première tâche yassine
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        },
        {
          description: '',
          type: 'spirituelle_ia',
          generatedByIA: false
        }
      ],
      hasYassine: true,
      closingPhrase: challengeId === 'voyage-du-coeur' ? 'Il dit : « Sois »,\net cela est.\nÀ Allah appartient' : challengeId === 'liberation-spirituelle' ? 'Il dit : « Sois »,\net cela est.\nÀ Allah appartient' : challengeId === 'discipline-baraka' ? 'Il dit : « Sois »,\net cela est.\nÀ Allah appartient' : challengeId === 'purete-esprit' ? 'Soit ! Et c\'est.' : 'Il dit : « Sois »,\net cela est.\nÀ Allah appartient',
      verse: {
        reference: 'Yâ-Sîn (36:81-83)',
        translation: 'Versets 81 à 83 de Yassine',
        tafsir: 'Kun fa yakūn'
      }
    });
  } else {
    // Fallback
    days.push({
      day: 39,
      title: 'JOUR 39 — YAKŪN (ET C\'EST)',
      block: `${BLOCKS_INFO[6].name} — ${BLOCKS_INFO[6].nameTranslation}`,
      blockNumber: 7,
      tasks: [
        // Enlever la première tâche yassine
        {
          description: '🧭 DISCIPLINE\n\n(ne pas se substituer à la volonté d\'Allah)\n\n1. Ne pas contester intérieurement ce qui est\n2. Ne pas comparer le résultat à ton attente\n3. Accueillir la réalité sans commentaire excessif\n4. Cesser de nourrir le regret\n5. Se rappeler que le retour est vers Allah',
          type: 'discipline_ia',
          generatedByIA: false,
          options: [
            'Ne pas contester intérieurement ce qui est',
            'Ne pas comparer le résultat à ton attente',
            'Accueillir la réalité sans commentaire excessif',
            'Cesser de nourrir le regret',
            'Se rappeler que le retour est vers Allah'
          ]
        },
        {
          description: '🔥 ACTION\n\n(poser l\'acte juste, puis s\'arrêter)\n\n1. Agir avec la réalité présente\n2. Ajuster ton comportement sans amertume\n3. Remercier Allah même sans comprendre\n4. Continuer à agir droit quoi qu\'il arrive\n5. Déposer le résultat dans une du\'ā simple',
          type: 'action_ia',
          generatedByIA: false,
          options: [
            'Agir avec la réalité présente',
            'Ajuster ton comportement sans amertume',
            'Remercier Allah même sans comprendre',
            'Continuer à agir droit quoi qu\'il arrive',
            'Déposer le résultat dans une du\'ā simple'
          ]
        },
        {
          description: '🤍 INTROSPECTION\n\n(observer le besoin de contrôle)\n\n1. Observer un attachement à une issue précise\n2. Reconnaître une déception sans la nourrir\n3. Te demander : et si c\'était exactement ce qu\'il fallait ?\n4. Accepter de ne pas comprendre maintenant\n5. Revenir à l\'essentiel',
          type: 'introspection',
          generatedByIA: false,
          options: [
            'Observer un attachement à une issue précise',
            'Reconnaître une déception sans la nourrir',
            'Te demander : et si c\'était exactement ce qu\'il fallait ?',
            'Accepter de ne pas comprendre maintenant',
            'Revenir à l\'essentiel'
          ]
        },
        {
          description: '🪨 ANCRAGE CONCRET\n\n(se retirer intérieurement)\n\n1. Poser la main sur le cœur\n2. Respirer lentement et profondément\n3. S\'asseoir immobile sans objectif\n4. Ressentir le poids du corps au sol\n5. Rester dans le silence',
          type: 'ancrage_concret',
          generatedByIA: false,
          options: [
            'Poser la main sur le cœur',
            'Respirer lentement et profondément',
            'S\'asseoir immobile sans objectif',
            'Ressentir le poids du corps au sol',
            'Rester dans le silence'
          ]
        }
      ],
      hasYassine: true,
      closingPhrase: 'Il dit : « Sois »,\net cela est.\nÀ Allah appartient',
      verse: {
        reference: 'Yâ-Sîn (36:81-83)',
        translation: 'Versets 81 à 83 de Yassine',
        tafsir: 'Kun fa yakūn'
      }
    });
  }

  // J40 : Nur Shifa + Gratitude + Sadaqa + Introspection + Kalwa Ya Allah
  days.push({
    day: 40,
    title: 'JOUR 40 — RETOUR À ALLAH',
    block: `${BLOCKS_INFO[6].name} — ${BLOCKS_INFO[6].nameTranslation}`,
    blockNumber: 7,
    tasks: [
      {
        description: '🌙 Nur Shifa\n\nRécite Ayat al-Kursi, puis Al-Ikhlâs, Al-Falaq, An-Nâs.\nSouffle doucement sur de l\'eau.\n\nAvec cette eau :\n- bois-en,\n- ou essuie ton visage,\n- ou lave-toi avec conscience.\n\nPrends ce moment lentement, présent, sans précipitation.',
        type: 'nur_shifa',
        verseReference: 'Ayat al-Kursi + 3 Qul',
        generatedByIA: false
      },
      {
        description: '🤲 Gratitude\n\nAccomplis deux rak\'at uniquement pour remercier Allah.\nSans demande. Sans attente.',
        type: 'action_ia',
        generatedByIA: false
      },
      {
        description: '💝 Sadaqa\n\nDonne une aumône, même petite.\nScelle le chemin par le geste.',
        type: 'action_ia',
        generatedByIA: false
      },
      {
        description: '🤍 Introspection\n\nReviens intérieurement sur les 39 jours écoulés.\nSans analyser. Sans juger.\nObserve simplement ce qui a changé, ce qui demeure, ce qui a été confié.',
        type: 'introspection',
        generatedByIA: false
      },
      {
        description: '🧘 Kalwa — Yâ Allah\n\nAssieds-toi en silence.\nInvoque Yâ Allah.\nLaisse le Nom descendre dans le cœur.\nNe cherche rien. Ne demande rien.',
        type: 'kalwa',
        divineAttribute: 'Allah',
        generatedByIA: false
      }
    ],
    hasKalwa: true,
    hasNurShifa: true,
    closingPhrase: 'Tout ce qui a commencé par Allah\nretourne à Allah.',
    verse: {
      reference: 'Ayat al-Kursi + 3 Qul',
      translation: 'Ayat al-Kursi et les 3 Qul',
      tafsir: 'Versets de protection et de guérison'
    }
  });

  return days;
}

/**
 * Les 4 défis de Sabila Nur
 */
// Textes d'introduction spécifiques pour chaque défi
const CHALLENGE_INTRODUCTIONS: Record<string, string> = {
  'voyage-du-coeur': `Ce défi de 40 jours est un chemin intérieur vers la lumière du cœur.

À travers l'invocation de Yâ Nûr (النور), tu vas progressivement éclairer les recoins de ton être, guérir les blessures du passé et révéler la beauté qui réside en toi.

Chaque jour, tu recevras des pratiques de méditation (Kalwa), des moments de guérison spirituelle (Nûr Shifa), des exercices de discipline et des actions concrètes pour ancrer cette lumière dans ta vie quotidienne.

Tu traverseras 7 portes de l'âme, de l'âme impulsive à l'âme purifiée, en apprenant à observer, à te corriger, à t'inspirer, à t'apaiser, à accepter, à t'aligner et finalement à te remettre entièrement.

Prends ton temps. Il n'y a pas de course à gagner. L'important est la présence et la sincérité dans chaque geste.

Que cette lumière t'accompagne tout au long de ce voyage.`,
  'liberation-spirituelle': `Ce défi de 40 jours est un chemin de libération intérieure à travers la protection d'Allah.

En invoquant Yâ Hafidh (الحفيظ), tu vas tisser une armure de lumière autour de ton âme, retrouver ton cœur léger et te libérer des chaînes invisibles qui t'empêchent d'avancer.

Chaque jour, tu recevras des pratiques spirituelles pour t'ancrer dans cette protection, des moments de méditation profonde, des exercices de discipline et des actions qui renforcent ta confiance en la protection divine.

Tu traverseras les 7 portes de l'âme en apprenant à reconnaître les mécanismes de protection, à lâcher les peurs, à faire confiance au décret divin et à vivre dans la sérénité de celui qui sait qu'il est protégé.

Prends ton temps. Il n'y a pas de course à gagner. L'important est la présence et la sincérité dans chaque geste.

Que cette protection t'accompagne tout au long de ce voyage.`,
  'discipline-baraka': `Ce défi de 40 jours est un chemin de discipline et de baraka à travers la force divine.

En invoquant Yâ Qawiyy (القويّ), tu vas développer ta force intérieure, ton endurance et ta capacité à agir avec constance, tout en attirant la bénédiction dans chaque aspect de ta vie.

Chaque jour, tu recevras des pratiques spirituelles pour renforcer ta discipline, des moments de méditation pour ancrer ta force, des exercices concrets et des actions qui construisent ta stabilité intérieure.

Tu traverseras les 7 portes de l'âme en apprenant à transformer l'impulsivité en action réfléchie, à développer la constance, à puiser dans la force divine et à agir avec détermination tout en restant humble.

Prends ton temps. Il n'y a pas de course à gagner. L'important est la présence et la sincérité dans chaque geste.

Que cette force t'accompagne tout au long de ce voyage.`,
  'purete-esprit': `Ce défi de 40 jours est un chemin de purification intérieure à travers la subtilité divine.

En invoquant Yâ Latîf (اللطيف), tu vas purifier ton esprit, ton cœur et tes intentions, en apprenant à percevoir la subtilité de la présence divine dans chaque moment de ta vie.

Chaque jour, tu recevras des pratiques de purification spirituelle, des moments de méditation profonde, des exercices pour affiner ta perception et des actions qui reflètent la pureté de tes intentions.

Tu traverseras les 7 portes de l'âme en apprenant à nettoyer les impuretés de l'âme, à purifier tes intentions, à affiner ta perception spirituelle et à vivre dans la subtilité de celui qui perçoit la présence divine dans les détails.

Prends ton temps. Il n'y a pas de course à gagner. L'important est la présence et la sincérité dans chaque geste.

Que cette pureté t'accompagne tout au long de ce voyage.`
};

export const SABILA_NUR_CHALLENGES: Challenge[] = [
  {
    id: 'voyage-du-coeur',
    title: 'VOYAGE DU CŒUR',
    emoji: '🌙✨',
    iconName: 'Heart',
    attribute: 'Yâ Nûr',
    attributeArabic: 'النور',
    description: 'Le chemin lumineux vers un cœur qui guérit, s\'allège et se révèle',
    color: '#FFD369',
    days: generateDaysStructure('Yâ Nûr', 'النور', 'voyage-du-coeur'),
    blocks: BLOCKS_INFO,
    introduction: CHALLENGE_INTRODUCTIONS['voyage-du-coeur']
  },
  {
    id: 'liberation-spirituelle',
    title: 'LIBÉRATION SPIRITUELLE',
    emoji: '✨',
    iconName: 'Shield',
    attribute: 'Yâ Hafidh',
    attributeArabic: 'الحفيظ',
    description: 'Quarante jours pour t\'ancrer dans Sa protection, retrouver ton cœur léger et tisser une armure de lumière autour de ton âme.',
    color: '#9B59B6',
    days: generateDaysStructure('Yâ Hafidh', 'الحفيظ', 'liberation-spirituelle'),
    blocks: BLOCKS_INFO,
    introduction: CHALLENGE_INTRODUCTIONS['liberation-spirituelle']
  },
  {
    id: 'discipline-baraka',
    title: 'DISCIPLINE & BARAKA',
    emoji: '🔥',
    iconName: 'Flame',
    attribute: 'Yâ Qawiyy',
    attributeArabic: 'القويّ',
    description: 'Celui qui donne la force, l\'endurance, la stabilité et la capacité d\'agir.',
    color: '#E74C3C',
    days: generateDaysStructure('Yâ Qawiyy', 'القويّ', 'discipline-baraka'),
    blocks: BLOCKS_INFO,
    introduction: CHALLENGE_INTRODUCTIONS['discipline-baraka']
  },
  {
    id: 'purete-esprit',
    title: 'PURETÉ DE L\'ESPRIT',
    emoji: '🌙✨',
    iconName: 'Sparkles',
    attribute: 'Yâ Latîf',
    attributeArabic: 'اللطيف',
    description: 'Quarante jours pour purifier ton esprit, ton cœur et tes intentions. Chaque souffle devient un rappel, chaque geste une purification, chaque intention une lumière qui éclaire ton chemin.',
    color: '#3498DB',
    days: generateDaysStructure('Yâ Latîf', 'اللطيف', 'purete-esprit'),
    blocks: BLOCKS_INFO,
    introduction: CHALLENGE_INTRODUCTIONS['purete-esprit']
  }
];

/**
 * Fonction helper pour obtenir un défi par ID
 */
export function getChallengeById(id: string): Challenge | undefined {
  return SABILA_NUR_CHALLENGES.find(c => c.id === id);
}

/**
 * Fonction helper pour obtenir un jour par numéro
 */
export function getDayByNumber(challenge: Challenge, dayNumber: number): Day | undefined {
  return challenge.days.find(d => d.day === dayNumber);
}

/**
 * Fonction helper pour obtenir les informations d'un bloc par numéro
 */
export function getBlockInfo(challenge: Challenge, blockNumber: number): BlockInfo | undefined {
  return challenge.blocks.find(b => b.number === blockNumber);
}

/**
 * Fonction helper pour obtenir le bloc d'un jour donné
 */
export function getBlockForDay(challenge: Challenge, dayNumber: number): BlockInfo | undefined {
  const day = getDayByNumber(challenge, dayNumber);
  if (!day || !day.blockNumber) return undefined;
  return getBlockInfo(challenge, day.blockNumber);
}

/**
 * Valide que la structure générée contient bien 40 jours
 */
export function validateChallengeStructure(challenge: Challenge): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Vérifier qu'il y a 40 jours
  if (challenge.days.length !== 40) {
    errors.push(`Nombre de jours incorrect : ${challenge.days.length} au lieu de 40`);
  }
  
  // Vérifier que tous les jours de 1 à 40 sont présents
  const dayNumbers = challenge.days.map(d => d.day).sort((a, b) => a - b);
  for (let i = 1; i <= 40; i++) {
    if (!dayNumbers.includes(i)) {
      errors.push(`Jour ${i} manquant`);
    }
  }
  
  // Vérifier la structure des tâches
  challenge.days.forEach(day => {
    // Jours 1-18 : 3 tâches
    if (day.day >= 1 && day.day <= 18) {
      if (day.tasks.length !== 3) {
        errors.push(`Jour ${day.day} : devrait avoir 3 tâches, a ${day.tasks.length}`);
      }
    }
    // Jours 19-36 : 5 tâches
    else if (day.day >= 19 && day.day <= 36) {
      if (day.tasks.length !== 5) {
        errors.push(`Jour ${day.day} : devrait avoir 5 tâches, a ${day.tasks.length}`);
      }
    }
    // Jours 37-39 : 4 tâches (sans la première tâche yassine)
    else if (day.day >= 37 && day.day <= 39) {
      if (day.tasks.length !== 4) {
        errors.push(`Jour ${day.day} : devrait avoir 4 tâches, a ${day.tasks.length}`);
      }
    }
    // Jour 40 : 5 tâches
    else if (day.day === 40) {
      if (day.tasks.length !== 5) {
        errors.push(`Jour ${day.day} : devrait avoir 5 tâches, a ${day.tasks.length}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}


