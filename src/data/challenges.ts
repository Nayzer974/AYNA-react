export interface Task {
  description: string;
  type?: 'kalwa' | 'dhikr' | 'verse' | 'writing' | 'action' | 'breathing' | 'other';
}

export interface Day {
  day: number;
  title: string;
  tasks: Task[];
  verse?: {
    reference: string;
    arabic?: string;
    transliteration?: string;
    translation: string;
    fullText?: string;
    tafsir?: string;
  };
  block?: string;
  closingPhrase?: string;
}

export interface Challenge {
  id: string;
  title: string;
  emoji: string;
  attribute: string;
  attributeArabic: string;
  description: string;
  color: string;
  days: Day[];
}

export const challenges: Challenge[] = [
  {
    id: 'nur',
    title: 'VOYAGE DU CŒUR',
    emoji: '🌙✨',
    attribute: 'Yâ Nûr',
    attributeArabic: 'النور',
    description: 'Un voyage intérieur pour apaiser, purifier et illuminer ton cœur chaque jour.',
    color: '#FFD369',
    days: [
      {
        day: 1,
        title: 'OUVERTURE & NÛR SHIFA',
        block: 'JOURS 1 À 3 — OUVERTURE',
        tasks: [
          { description: 'Kalwa : "Yâ Allah"', type: 'kalwa' },
          { description: 'Nûr & Shifa : Lire sourate Al-Fâtiha (1:1–7) sur un verre d\'eau, souffler dessus, puis boire ou passer sur le visage', type: 'action' },
          { description: 'Écrire : Ton intention pour ces 40 jours + 1 gratitude du jour', type: 'writing' }
        ],
        verse: {
          reference: 'Al-Fâtiha (1:1–7)',
          translation: 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux. Louange à Allah, Seigneur de l\'univers. Le Tout Miséricordieux, le Très Miséricordieux. Maître du Jour de la rétribution. C\'est Toi que nous adorons, et c\'est Toi dont nous implorons secours. Guide-nous dans le droit chemin, le chemin de ceux que Tu as comblés de Tes bienfaits, non pas de ceux qui ont encouru Ta colère, ni des égarés.',
          tafsir: 'Ibn Kathir explique qu\'Al-Fâtiha est la mère du Coran et contient tous les sens du Livre. Al-Baghawi précise que cette sourate comprend la louange d\'Allah, l\'affirmation de Sa seigneurie, l\'unicité dans l\'adoration, la demande de guidance, et la distinction entre les bienheureux et les égarés. Al-Baydawi ajoute que "le droit chemin" (as-sirât al-mustaqîm) est l\'Islam, et que cette sourate est récitée dans chaque rak\'a de la prière car elle résume toute la guidance divine.'
        },
        closingPhrase: 'Aujourd\'hui, un voile se lève doucement. Laisse Allah guider chaque pas de ton cœur.'
      },
      {
        day: 2,
        title: 'ALLÉGER LE CŒUR',
        tasks: [
          { description: 'Écrire : "Qu\'est-ce qui pèse sur mon cœur aujourd\'hui ?"', type: 'writing' },
          { description: 'Lire sourate Ar-Ra\'d, verset 28 (13:28)', type: 'verse' },
          { description: 'Faire 1 acte de douceur envers toi-même', type: 'action' }
        ],
        verse: {
          reference: 'Ar-Ra\'d (13:28)',
          translation: 'Ceux qui ont cru et dont les cœurs se tranquillisent à l\'évocation d\'Allah. N\'est-ce point par l\'évocation d\'Allah que se tranquillisent les cœurs ?',
          tafsir: 'Ibn Kathir explique que ce verset révèle le secret de la tranquillité du cœur. Le dhikr (évocation) d\'Allah apaise les cœurs et dissipe l\'anxiété. Al-Baghawi précise que la tranquillité du cœur vient uniquement du rappel d\'Allah, et que rien d\'autre ne peut apporter cette paix intérieure profonde. Al-Baydawi ajoute que cette question rhétorique renforce cette vérité et invite à pratiquer le dhikr constamment.'
        },
        closingPhrase: 'Chaque souffle de douceur que tu offres à ton âme est accueilli par la miséricorde divine.'
      },
      {
        day: 3,
        title: 'KALWA YÂ NÛR',
        tasks: [
          { description: 'Kalwa : Yâ Nûr', type: 'kalwa' },
          { description: 'Lire sourate An-Nûr, verset 35 (24:35)', type: 'verse' },
          { description: 'Écrire : "Qu\'est-ce qui s\'est apaisé en moi aujourd\'hui ?"', type: 'writing' }
        ],
        verse: {
          reference: 'An-Nûr (24:35)',
          translation: 'Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un cristal, et celui-ci ressemble à un astre brillant. Son combustible vient d\'un arbre béni : un olivier ni oriental ni occidental, dont l\'huile semble éclairer sans que le feu ne la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose des paraboles aux gens, et Allah est Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset décrit la lumière de la guidance divine. La niche représente le cœur du croyant, la lampe est la foi, le cristal symbolise la clarté et la pureté, et l\'huile pure représente la sincérité. "Lumière sur lumière" signifie la lumière de la révélation combinée à la lumière de la foi dans le cœur. Al-Baghawi précise que cette parabole illustre comment la guidance divine éclaire le cœur du croyant. Al-Baydawi ajoute que l\'olivier ni oriental ni occidental symbolise la guidance parfaite et équilibrée.'
      },
        closingPhrase: 'Ta lumière intérieure commence à briller doucement, même dans les coins les plus sombres de ton cœur.'
      },
      {
        day: 4,
        title: 'PURIFICATION LÉGÈRE',
        block: 'JOURS 4 À 9 — PURIFICATION',
        tasks: [
          { description: 'Pardonner une petite chose, même intérieurement', type: 'action' },
          { description: 'Lire sourate Al-Baqara, verset 185 (2:185)', type: 'verse' },
          { description: 'Astaghfirullah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Baqara (2:185)',
          translation: 'Allah veut pour vous la facilité ; Il ne veut pas la difficulté pour vous. Afin que vous paracheviez le nombre et que vous proclamiez la grandeur d\'Allah pour vous avoir guidés, et afin que vous soyez reconnaissants.',
          tafsir: 'Ibn Kathir explique que ce verset révèle la miséricorde d\'Allah qui veut la facilité pour Ses serviteurs dans l\'accomplissement du jeûne du Ramadan. Al-Baghawi précise que cette facilité inclut les permissions pour les voyageurs et les malades. Al-Baydawi ajoute que ce verset enseigne que l\'Islam est une religion de facilité et que la gratitude pour cette guidance est essentielle.'
        },
        closingPhrase: 'Le pardon fait tomber un poids invisible ; ton cœur respire à nouveau.'
      },
      {
        day: 5,
        title: 'LIBÉRATION DU CŒUR',
        tasks: [
          { description: 'Identifier et libérer une frustration', type: 'action' },
          { description: 'Lire sourate Al-A\'râf, verset 156 (7:156)', type: 'verse' },
          { description: 'Écrire 1 victoire du jour', type: 'writing' }
        ],
        verse: {
          reference: 'Al-A\'râf (7:156)',
          translation: 'Et inscris pour nous un bien en ce monde et dans l\'Au-delà. Nous voilà revenus vers Toi. Il dit : "Je frappe de Mon châtiment qui Je veux, mais Ma miséricorde embrasse toute chose. Je l\'inscris donc pour ceux qui Me craignent, acquittent la zakat, et ont foi en Nos signes."',
          tafsir: 'Ibn Kathir explique que ce verset révèle l\'immensité de la miséricorde divine qui embrasse toute chose. Al-Baghawi précise que la miséricorde d\'Allah précède et dépasse Son châtiment. Ceux qui bénéficient de cette miséricorde sont ceux qui craignent Allah (taqwa), accomplissent la zakat (purification des biens), et croient aux signes divins. Al-Baydawi ajoute que cette promesse divine couvre à la fois ce monde et l\'Au-delà pour les pieux.'
        },
        closingPhrase: 'Chaque libération, même petite, rapproche ton âme de Sa lumière.'
      },
      {
        day: 6,
        title: 'NETTOYAGE PAR L\'ACTION',
        tasks: [
          { description: 'Faire une action de bonté pour quelqu\'un ou pour toi-même', type: 'action' },
          { description: 'Astaghfirullah × 99', type: 'dhikr' },
          { description: 'Lire sourate Al-Baqara, verset 195 (2:195)', type: 'verse' }
        ],
        verse: {
          reference: 'Al-Baqara (2:195)',
          translation: 'Dépensez dans le sentier d\'Allah, et ne vous jetez pas vous-mêmes dans la destruction. Faites le bien. Car Allah aime les bienfaisants.',
          tafsir: 'Ibn Kathir explique que ce verset ordonne la dépense dans le sentier d\'Allah et interdit de se jeter dans la destruction par avarice ou négligence. Al-Baghawi précise que "la destruction" peut signifier l\'avare qui refuse de dépenser ou celui qui dépense excessivement. Al-Baydawi ajoute que le bienfaisant (muhsin) est celui qui accomplit les bonnes actions avec excellence et sincérité.'
        },
        closingPhrase: 'Le bien que tu sèmes aujourd\'hui nourrit ton âme demain.'
      },
      {
        day: 7,
        title: 'DOUCEUR & MISÉRICORDE',
        tasks: [
          { description: 'Écrire l\'émotion que tu laisses partir', type: 'writing' },
          { description: 'Lire sourate Al-Kahf, verset 58 (18:58)', type: 'verse' },
          { description: '3 respirations conscientes et profondes', type: 'breathing' }
        ],
        verse: {
          reference: 'Al-Kahf (18:58)',
          translation: 'Ton Seigneur est le Pardonneur, le Très Miséricordieux. S\'Il voulait les châtier pour ce qu\'ils ont acquis, Il hâterait leur châtiment. Mais ils ont un rendez-vous au-delà duquel ils ne trouveront aucun refuge.',
          tafsir: 'Ibn Kathir explique que ce verset rappelle la miséricorde et le pardon d\'Allah, et qu\'Il donne un délai aux pécheurs pour se repentir. Al-Baghawi précise que le "rendez-vous" fait référence au Jour du Jugement où chacun sera rétribué selon ses actes. Al-Baydawi ajoute que ce verset montre la patience d\'Allah et Son désir de pardonner plutôt que de punir immédiatement.'
        },
        closingPhrase: 'La miséricorde que tu offres au monde revient en éclats de lumière dans ton cœur.'
      },
      {
        day: 8,
        title: 'STABILISATION',
        tasks: [
          { description: 'Écrire 1 gratitude', type: 'writing' },
          { description: 'Lire sourate At-Tawba, verset 32 (9:32)', type: 'verse' },
          { description: '1 acte de douceur', type: 'action' }
        ],
        verse: {
          reference: 'At-Tawba (9:32)',
          translation: 'Ils veulent éteindre la lumière d\'Allah avec leurs bouches, mais Allah parachèvera Sa lumière, même si les mécréants le détestent.',
          tafsir: 'Ibn Kathir explique que "la lumière d\'Allah" fait référence à l\'Islam et au Coran. Al-Baghawi précise que les mécréants tentent d\'éteindre cette lumière par leurs paroles et leurs complots, mais Allah garantit que Sa lumière triomphera. Al-Baydawi ajoute que ce verset est une promesse divine que l\'Islam se répandra malgré l\'opposition, car Allah parachèvera toujours Sa guidance.'
        },
        closingPhrase: 'La lumière intérieure devient constante quand tu choisis la stabilité et la paix.'
      },
      {
        day: 9,
        title: 'KALWA YÂ NÛR',
        tasks: [
          { description: 'Kalwa : Yâ Nûr', type: 'kalwa' },
          { description: 'Lire sourate Al-Baqara, verset 257 (2:257)', type: 'verse' },
          { description: 'Écrire : transformation ressentie', type: 'writing' }
        ],
        verse: {
          reference: 'Al-Baqara (2:257)',
          translation: 'Allah est le Protecteur de ceux qui croient. Il les fait sortir des ténèbres vers la lumière. Quant à ceux qui ne croient pas, leurs protecteurs sont les Taghout qui les font sortir de la lumière vers les ténèbres. Voilà les gens du Feu où ils demeureront éternellement.',
          tafsir: 'Ibn Kathir explique que ce verset établit la distinction fondamentale entre les croyants et les mécréants. Allah est le Protecteur (Wali) des croyants, les guidant des ténèbres de l\'ignorance et de l\'égarement vers la lumière de la foi et de la guidance. Al-Baghawi précise que "les ténèbres" représentent l\'incroyance et l\'ignorance, tandis que "la lumière" symbolise la foi et la guidance divine. Al-Baydawi ajoute que les Taghout sont les idoles et les fausses divinités qui égarent les mécréants.'
      },
        closingPhrase: 'Chaque ténèbre dissipée révèle une clarté que tu portais déjà en toi.'
      },
      {
        day: 10,
        title: 'APAISEMENT & COMPAGNIE D\'ALLAH',
        block: 'JOURS 10 À 17 — APAISEMENT',
        tasks: [
          { description: 'Lire sourate At-Tawba, verset 40 (9:40)', type: 'verse' },
          { description: 'Dhikr : Yâ Latîf × 99', type: 'dhikr' },
          { description: 'Écrire : sensation d\'apaisement du jour', type: 'writing' }
        ],
        verse: {
          reference: 'At-Tawba (9:40)',
          translation: 'Si vous ne lui portez pas secours, Allah l\'a déjà secouru lorsque ceux qui ne croyaient pas l\'avaient banni, deuxième de deux. Quand ils étaient dans la grotte et qu\'il disait à son compagnon : "Ne t\'afflige pas, car Allah est avec nous." Allah fit alors descendre Sa sérénité sur lui et le secourut de troupes que vous ne voyiez pas, et Il abaissa la parole de ceux qui ne croyaient pas. Et la parole d\'Allah est la plus haute. Allah est Puissant et Sage.',
          tafsir: 'Ibn Kathir explique que ce verset relate l\'épisode de la grotte lors de l\'Hégire du Prophète ﷺ avec Abu Bakr. Al-Baghawi précise que cette histoire enseigne que la compagnie d\'Allah est la meilleure protection, et que la sérénité (sakîna) divine descend sur ceux qui placent leur confiance en Lui. Al-Baydawi ajoute que ce récit montre comment Allah protège Ses serviteurs même dans les moments les plus difficiles, et que la parole d\'Allah triomphe toujours.'
        },
        closingPhrase: 'Allah est avec toi à chaque souffle. Ressens Sa présence qui berce ton cœur.'
      },
      {
        day: 11,
        title: 'DOUCEUR DU REGARD',
        tasks: [
          { description: 'Protéger ton regard des distractions et négativités', type: 'action' },
          { description: 'Lire un hadith : "Allah est Doux et Il aime la douceur" (Sahih Muslim)', type: 'verse' },
          { description: 'Écrire une émotion positive ressentie', type: 'writing' }
        ],
        closingPhrase: 'Ton regard purifie et illumine ce qui t\'entoure, même ce que tu ne vois pas.'
      },
      {
        day: 12,
        title: 'PROTECTION DU CŒUR',
        tasks: [
          { description: 'Éviter une mauvaise habitude', type: 'action' },
          { description: 'Lire sourate Qâf, verset 16 (50:16)', type: 'verse' },
          { description: '3 respirations conscientes', type: 'breathing' }
        ],
        verse: {
          reference: 'Qâf (50:16)',
          translation: 'Nous avons effectivement créé l\'homme et Nous savons ce que son âme lui suggère, et Nous sommes plus proche de lui que sa veine jugulaire.',
          tafsir: 'Ibn Kathir explique que ce verset révèle la proximité absolue d\'Allah avec Sa création. Al-Baghawi précise que cette proximité signifie qu\'Allah connaît toutes les pensées, intentions et suggestions de l\'âme. Al-Baydawi ajoute que la comparaison avec la veine jugulaire montre qu\'Allah est plus proche de l\'homme que sa propre vie, et qu\'Il connaît tout ce qui se passe en lui.'
        },
        closingPhrase: 'Allah est plus proche de toi que ta veine jugulaire. Tu n\'es jamais seul.'
      },
      {
        day: 13,
        title: 'GRATITUDE ACTIVE',
        tasks: [
          { description: '2 gratitudes écrites', type: 'writing' },
          { description: 'Lire sourate Ibrahim, verset 7 (14:7)', type: 'verse' },
          { description: 'Dhikr : Yâ Latîf × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Ibrahim (14:7)',
          translation: 'Et lorsque votre Seigneur proclama : "Si vous êtes reconnaissants, très certainement J\'augmenterai [Mes bienfaits] pour vous. Mais si vous êtes ingrats, Mon châtiment sera terrible."',
          tafsir: 'Ibn Kathir explique que ce verset établit le principe de la gratitude et de ses récompenses. La gratitude attire l\'augmentation des bienfaits divins, tandis que l\'ingratitude mène au châtiment. Al-Baghawi précise que la gratitude comprend la reconnaissance dans le cœur, l\'expression par la langue, et l\'utilisation des bienfaits dans l\'obéissance à Allah. Al-Baydawi ajoute que cette promesse divine est une incitation à la gratitude constante, car chaque bienfait mérite reconnaissance.'
        },
        closingPhrase: 'La gratitude illumine ton cœur et ouvre des portes invisibles.'
      },
      {
        day: 14,
        title: 'SINCÉRITÉ',
        tasks: [
          { description: 'Acte sincère envers toi-même ou autrui', type: 'action' },
          { description: 'Rappel : "Je choisis la sincérité"', type: 'action' },
          { description: 'Écrire : purification ressentie', type: 'writing' }
        ],
        closingPhrase: 'La sincérité aligne ton âme avec la lumière divine.'
      },
      {
        day: 15,
        title: 'DEMANDE DE LUMIÈRE',
        tasks: [
          { description: '3 respirations profondes', type: 'breathing' },
          { description: 'Relire le verset An-Nûr (24:35)', type: 'verse' },
          { description: 'Écrire : "Où ai-je besoin de lumière aujourd\'hui ?"', type: 'writing' }
        ],
        verse: {
          reference: 'An-Nûr (24:35)',
          translation: 'Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un cristal, et celui-ci ressemble à un astre brillant. Son combustible vient d\'un arbre béni : un olivier ni oriental ni occidental, dont l\'huile semble éclairer sans que le feu ne la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose des paraboles aux gens, et Allah est Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset décrit la lumière de la guidance divine. La niche représente le cœur du croyant, la lampe est la foi, le cristal symbolise la clarté et la pureté, et l\'huile pure représente la sincérité. "Lumière sur lumière" signifie la lumière de la révélation combinée à la lumière de la foi dans le cœur. Al-Baghawi précise que cette parabole illustre comment la guidance divine éclaire le cœur du croyant. Al-Baydawi ajoute que l\'olivier ni oriental ni occidental symbolise la guidance parfaite et équilibrée.'
        },
        closingPhrase: 'Demande, ouvre ton cœur. Allah guide ceux qui s\'avancent vers Lui.'
      },
      {
        day: 16,
        title: 'CALME & SAKÎNA',
        tasks: [
          { description: '5 minutes de silence complet', type: 'breathing' },
          { description: 'Lire sourate Al-Fath, verset 4 (48:4)', type: 'verse' },
          { description: 'Dhikr : SubhanAllah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Fath (48:4)',
          translation: 'C\'est Lui qui a fait descendre la sérénité dans les cœurs des croyants afin qu\'ils ajoutent une foi à leur foi. À Allah appartiennent les armées des cieux et de la terre. Allah est Omniscient et Sage.',
          tafsir: 'Ibn Kathir explique que la sérénité (sakîna) est une tranquillité et une paix qui descendent du ciel dans les cœurs des croyants. Al-Baghawi précise que cette sérénité renforce la foi et apporte la confiance en Allah. Al-Baydawi ajoute que "ajouter une foi à leur foi" signifie que leur foi s\'intensifie et se renforce, et que les armées d\'Allah sont toujours prêtes à soutenir les croyants.'
        },
        closingPhrase: 'La sérénité descend dans ton cœur et renforce ta foi à chaque souffle.'
      },
      {
        day: 17,
        title: 'CŒUR STABLE',
        tasks: [
          { description: 'Écrire ton progrès et ton état intérieur', type: 'writing' },
          { description: 'Lire sourate Al-Fajr, versets 27–28 (89:27–28)', type: 'verse' },
          { description: 'Protéger tes paroles aujourd\'hui', type: 'action' }
        ],
        verse: {
          reference: 'Al-Fajr (89:27–28)',
          translation: 'Ô toi, âme apaisée ! Retourne vers ton Seigneur, satisfaite et agréée. Entre donc parmi Mes serviteurs, et entre dans Mon Paradis.',
          tafsir: 'Ibn Kathir explique que "l\'âme apaisée" (an-nafs al-mutma\'inna) est celle qui a trouvé la paix et la sérénité dans l\'obéissance à Allah. Al-Baghawi précise que cette âme retourne vers son Seigneur satisfaite de ce qu\'Allah lui a donné et agréée par Lui. Al-Baydawi ajoute que ce verset décrit l\'état béni de l\'âme du croyant au moment de la mort et son entrée au Paradis.'
        },
        closingPhrase: 'Ton âme apaisée retourne vers son Seigneur satisfaite et comblée.'
      },
      {
        day: 18,
        title: 'KALWA YÂ NÛR & CLARTÉ',
        block: 'JOUR 18 — PIVOT',
        tasks: [
          { description: 'Kalwa : Yâ Nûr × 99', type: 'kalwa' },
          { description: 'Lire sourate Al-Baqara 2:257', type: 'verse' },
          { description: 'Dhikr : Yâ Nûr', type: 'dhikr' },
          { description: 'Écrire : "Quelle zone de mon cœur a besoin de lumière ?"', type: 'writing' },
          { description: 'Respiration consciente 3•6•9', type: 'breathing' }
        ],
        verse: {
          reference: 'Al-Baqara (2:257)',
          translation: 'Allah est le Protecteur de ceux qui croient. Il les fait sortir des ténèbres vers la lumière. Quant à ceux qui ne croient pas, leurs protecteurs sont les Taghout qui les font sortir de la lumière vers les ténèbres. Voilà les gens du Feu où ils demeureront éternellement.',
          tafsir: 'Ibn Kathir explique que ce verset établit la distinction fondamentale entre les croyants et les mécréants. Allah est le Protecteur (Wali) des croyants, les guidant des ténèbres de l\'ignorance et de l\'égarement vers la lumière de la foi et de la guidance. Al-Baghawi précise que "les ténèbres" représentent l\'incroyance et l\'ignorance, tandis que "la lumière" symbolise la foi et la guidance divine.'
      },
        closingPhrase: 'Aujourd\'hui, je choisis la clarté intérieure. Chaque zone sombre de mon cœur s\'éclaire doucement.'
      },
      {
        day: 19,
        title: 'Libérer les traces du passé',
        block: 'BLOC : LIBÉRATION (JOURS 19 À 21)',
        tasks: [
          { description: 'Kalwa : Yâ Nûr', type: 'kalwa' },
          { description: 'Lire An-Nûr (24:35)', type: 'verse' },
          { description: 'Écrire : "Qu\'est-ce qui m\'a blessé dans le passé ?"', type: 'writing' },
          { description: 'Astaghfirullah × 99', type: 'dhikr' },
          { description: '3 respirations lentes', type: 'breathing' }
        ],
        verse: {
          reference: 'An-Nûr (24:35)',
          translation: 'Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un cristal, et celui-ci ressemble à un astre brillant. Son combustible vient d\'un arbre béni : un olivier ni oriental ni occidental, dont l\'huile semble éclairer sans que le feu ne la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose des paraboles aux gens, et Allah est Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset décrit la lumière de la guidance divine. La niche représente le cœur du croyant, la lampe est la foi, le cristal symbolise la clarté et la pureté, et l\'huile pure représente la sincérité. "Lumière sur lumière" signifie la lumière de la révélation combinée à la lumière de la foi dans le cœur. Al-Baydawi précise que cette parabole illustre comment la guidance divine éclaire le cœur du croyant.'
        },
        closingPhrase: 'Je libère le passé avec confiance. Chaque cicatrice devient lumière.'
      },
      {
        day: 20,
        title: 'Guérison active',
        tasks: [
          { description: 'Un acte de guérison (toi ou autrui)', type: 'action' },
          { description: 'Lire Ar-Ra\'d (13:28)', type: 'verse' },
          { description: 'Écrire une intention de guérison', type: 'writing' },
          { description: 'Lire 1 page de Coran', type: 'verse' },
          { description: 'Dhikr : Yâ Latîf × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Ar-Ra\'d (13:28)',
          translation: 'Ceux qui ont cru et dont les cœurs se tranquillisent à l\'évocation d\'Allah. N\'est-ce point par l\'évocation d\'Allah que se tranquillisent les cœurs ?',
          tafsir: 'Ibn Kathir explique que ce verset révèle le secret de la tranquillité du cœur. Le dhikr (évocation) d\'Allah apaise les cœurs et dissipe l\'anxiété. Al-Baghawi précise que la tranquillité du cœur vient uniquement du rappel d\'Allah, et que rien d\'autre ne peut apporter cette paix intérieure profonde.'
        },
        closingPhrase: 'Chaque geste de guérison purifie mon cœur et celui du monde autour de moi.'
      },
      {
        day: 21,
        title: 'Protection du cœur',
        tasks: [
          { description: 'Kalwa : Yâ Nûr', type: 'kalwa' },
          { description: 'Lire Al-Baqara (2:257)', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui, je protège mon cœur de…"', type: 'writing' },
          { description: 'Relaxation 3 min', type: 'breathing' },
          { description: '1 gratitude', type: 'writing' }
        ],
        verse: {
          reference: 'Al-Baqara (2:257)',
          translation: 'Allah est le Protecteur de ceux qui croient. Il les fait sortir des ténèbres vers la lumière. Quant à ceux qui ne croient pas, leurs protecteurs sont les Taghout qui les font sortir de la lumière vers les ténèbres. Voilà les gens du Feu où ils demeureront éternellement.',
          tafsir: 'Ibn Kathir explique que ce verset établit la distinction fondamentale entre les croyants et les mécréants. Allah est le Protecteur (Wali) des croyants, les guidant des ténèbres de l\'ignorance et de l\'égarement vers la lumière de la foi et de la guidance. Al-Baghawi précise que "les ténèbres" représentent l\'incroyance et l\'ignorance, tandis que "la lumière" symbolise la foi et la guidance divine.'
      },
        closingPhrase: 'Mon cœur devient un sanctuaire lumineux où la paix règne.'
      },
      {
        day: 22,
        title: 'Lumière et constance',
        block: 'BLOC : ASCENSION (JOURS 22 À 27)',
        tasks: [
          { description: 'Lire An-Nûr (24:35)', type: 'verse' },
          { description: 'Marche consciente 10 min', type: 'action' },
          { description: 'Écrire l\'émotion du jour', type: 'writing' },
          { description: 'Éviter une mauvaise habitude', type: 'action' },
          { description: 'Dhikr : SubhanAllah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'An-Nûr (24:35)',
          translation: 'Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un cristal, et celui-ci ressemble à un astre brillant. Son combustible vient d\'un arbre béni : un olivier ni oriental ni occidental, dont l\'huile semble éclairer sans que le feu ne la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose des paraboles aux gens, et Allah est Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset décrit la lumière de la guidance divine. La niche représente le cœur du croyant, la lampe est la foi, le cristal symbolise la clarté et la pureté, et l\'huile pure représente la sincérité. "Lumière sur lumière" signifie la lumière de la révélation combinée à la lumière de la foi dans le cœur. Al-Baydawi précise que cette parabole illustre comment la guidance divine éclaire le cœur du croyant.'
        },
        closingPhrase: 'La constance illumine le chemin de l\'âme. Chaque pas est guidé par Sa lumière.'
      },
      {
        day: 23,
        title: 'Sérénité',
        tasks: [
          { description: 'Lire Al-Fath (48:4)', type: 'verse' },
          { description: 'Ranger un petit espace', type: 'action' },
          { description: 'Écrire : "Ce qui m\'a fait du bien aujourd\'hui"', type: 'writing' },
          { description: '5 minutes sans téléphone', type: 'action' },
          { description: 'Dhikr : Yâ Nûr × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Fath (48:4)',
          translation: 'C\'est Lui qui a fait descendre la sérénité dans les cœurs des croyants afin qu\'ils ajoutent une foi à leur foi. À Allah appartiennent les armées des cieux et de la terre. Allah est Omniscient et Sage.',
          tafsir: 'Ibn Kathir explique que la sérénité (sakîna) est une tranquillité et une paix qui descendent du ciel dans les cœurs des croyants. Al-Baghawi précise que cette sérénité renforce la foi et apporte la confiance en Allah. C\'est une miséricorde divine qui apaise les cœurs dans les moments difficiles.'
        },
        closingPhrase: 'La sérénité naît dans le cœur qui se détache de l\'agitation extérieure.'
      },
      {
        day: 24,
        title: 'Renforcement du cœur',
        tasks: [
          { description: 'Lire At-Tawba (9:40)', type: 'verse' },
          { description: 'Faire un acte sincère', type: 'action' },
          { description: 'Écrire : "Aujourd\'hui j\'ai résisté à…"', type: 'writing' },
          { description: '3 respirations profondes', type: 'breathing' },
          { description: 'Lire un hadith doux', type: 'verse' }
        ],
        verse: {
          reference: 'At-Tawba (9:40)',
          translation: 'Si vous ne lui portez pas secours, Allah l\'a déjà secouru lorsque ceux qui ne croyaient pas l\'avaient banni, deuxième de deux. Quand ils étaient dans la grotte et qu\'il disait à son compagnon : "Ne t\'afflige pas, car Allah est avec nous." Allah fit alors descendre Sa sérénité sur lui et le secourut de troupes que vous ne voyiez pas, et Il abaissa la parole de ceux qui ne croyaient pas. Et la parole d\'Allah est la plus haute. Allah est Puissant et Sage.',
          tafsir: 'Ibn Kathir explique que ce verset relate l\'épisode de la grotte lors de l\'Hégire du Prophète ﷺ avec Abu Bakr. Al-Baghawi précise que cette histoire enseigne que la compagnie d\'Allah est la meilleure protection, et que la sérénité (sakîna) divine descend sur ceux qui placent leur confiance en Lui. Al-Baydawi ajoute que ce récit montre comment Allah protège Ses serviteurs même dans les moments les plus difficiles, et que la parole d\'Allah triomphe toujours.'
        },
        closingPhrase: 'Le cœur se fortifie lorsqu\'on lui offre sincérité et patience.'
      },
      {
        day: 25,
        title: 'Lâcher prise',
        tasks: [
          { description: 'Lire Qâf (50:16)', type: 'verse' },
          { description: 'Écrire ce que tu dois lâcher', type: 'writing' },
          { description: 'Astaghfirullah × 99', type: 'dhikr' },
          { description: '5 min de calme intérieur', type: 'breathing' },
          { description: 'Action de miséricorde', type: 'action' }
        ],
        verse: {
          reference: 'Qâf (50:16)',
          translation: 'Nous avons effectivement créé l\'homme et Nous savons ce que son âme lui suggère, et Nous sommes plus proche de lui que sa veine jugulaire.',
          tafsir: 'Ibn Kathir explique que ce verset révèle la proximité d\'Allah avec Sa création. Allah est plus proche de l\'homme que sa propre veine jugulaire, ce qui signifie qu\'Il connaît toutes ses pensées et intentions. Al-Baydawi précise que cette proximité divine est une source de réconfort et de guidance pour le croyant.'
        },
        closingPhrase: 'Lâcher prise est un acte de courage : mon cœur respire librement.'
      },
      {
        day: 26,
        title: 'Gratitude profonde',
        tasks: [
          { description: 'Lire Ibrahim (14:7)', type: 'verse' },
          { description: 'Écrire 3 gratitudes', type: 'writing' },
          { description: 'Faire un acte de bonté', type: 'action' },
          { description: 'Lire 1 passage du Coran', type: 'verse' },
          { description: 'Dhikr : Alhamdulillah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Ibrahim (14:7)',
          translation: 'Et lorsque votre Seigneur proclama : "Si vous êtes reconnaissants, très certainement J\'augmenterai [Mes bienfaits] pour vous. Mais si vous êtes ingrats, Mon châtiment sera terrible."',
          tafsir: 'Ibn Kathir explique que ce verset établit le principe de la gratitude et de ses récompenses. La gratitude attire l\'augmentation des bienfaits divins, tandis que l\'ingratitude mène au châtiment. Al-Baghawi précise que la gratitude comprend la reconnaissance dans le cœur, l\'expression par la langue, et l\'utilisation des bienfaits dans l\'obéissance à Allah. Al-Baydawi ajoute que cette promesse divine est une incitation à la gratitude constante, car chaque bienfait mérite reconnaissance.'
        },
        closingPhrase: 'La gratitude transforme le quotidien en lumière et en bénédictions.'
      },
      {
        day: 27,
        title: 'KALWA YÂ NÛR',
        tasks: [
          { description: 'Kalwa : Yâ Nûr', type: 'kalwa' },
          { description: 'Lire An-Nûr (24:35)', type: 'verse' },
          { description: 'Écrire : "Qu\'ai-je appris sur moi cette semaine ?"', type: 'writing' },
          { description: 'Acte de lumière', type: 'action' },
          { description: 'Respiration 3•6•9', type: 'breathing' }
        ],
        verse: {
          reference: 'An-Nûr (24:35)',
          translation: 'Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un cristal, et celui-ci ressemble à un astre brillant. Son combustible vient d\'un arbre béni : un olivier ni oriental ni occidental, dont l\'huile semble éclairer sans que le feu ne la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose des paraboles aux gens, et Allah est Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset décrit la lumière de la guidance divine. La niche représente le cœur du croyant, la lampe est la foi, le cristal symbolise la clarté et la pureté, et l\'huile pure représente la sincérité. "Lumière sur lumière" signifie la lumière de la révélation combinée à la lumière de la foi dans le cœur. Al-Baydawi précise que cette parabole illustre comment la guidance divine éclaire le cœur du croyant.'
      },
        closingPhrase: 'Chaque semaine qui passe, mon cœur devient plus clair et plus doux.'
      },
      {
        day: 28,
        title: 'Déposer un poids',
        block: 'BLOC : LUMIÈRE (JOURS 28 À 36)',
        tasks: [
          { description: 'Lire Al-Baqara (2:257)', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui je dépose…"', type: 'writing' },
          { description: 'Dhikr : Yâ Latîf × 99', type: 'dhikr' },
          { description: 'Lire un verset de Yâ-Sîn', type: 'verse' },
          { description: 'Acte de bonté', type: 'action' }
        ],
        verse: {
          reference: 'Al-Baqara (2:257)',
          translation: 'Allah est le Protecteur de ceux qui croient. Il les fait sortir des ténèbres vers la lumière. Quant à ceux qui ne croient pas, leurs protecteurs sont les Taghout qui les font sortir de la lumière vers les ténèbres. Voilà les gens du Feu où ils demeureront éternellement.',
          tafsir: 'Ibn Kathir explique que ce verset établit la distinction fondamentale entre les croyants et les mécréants. Allah est le Protecteur (Wali) des croyants, les guidant des ténèbres de l\'ignorance et de l\'égarement vers la lumière de la foi et de la guidance. Al-Baghawi précise que "les ténèbres" représentent l\'incroyance et l\'ignorance, tandis que "la lumière" symbolise la foi et la guidance divine.'
        },
        closingPhrase: 'Déposer mes fardeaux ouvre la place pour la lumière divine.'
      },
      {
        day: 29,
        title: 'Purification',
        tasks: [
          { description: 'Lire Ar-Ra\'d (13:28)', type: 'verse' },
          { description: 'Écrire : "Quelle parole je choisis ?"', type: 'writing' },
          { description: 'Dhikr : SubhanAllah × 99', type: 'dhikr' },
          { description: 'Ranger un coin', type: 'action' },
          { description: 'Lire un rappel inspirant', type: 'verse' }
        ],
        verse: {
          reference: 'Ar-Ra\'d (13:28)',
          translation: 'Ceux qui ont cru et dont les cœurs se tranquillisent à l\'évocation d\'Allah. N\'est-ce point par l\'évocation d\'Allah que se tranquillisent les cœurs ?',
          tafsir: 'Ibn Kathir explique que ce verset révèle le secret de la tranquillité du cœur. Le dhikr (évocation) d\'Allah apaise les cœurs et dissipe l\'anxiété. Al-Baghawi précise que la tranquillité du cœur vient uniquement du rappel d\'Allah, et que rien d\'autre ne peut apporter cette paix intérieure profonde.'
        },
        closingPhrase: 'Chaque mot choisi avec soin éclaire mon cœur et mon entourage.'
      },
      {
        day: 30,
        title: 'Gratitude silencieuse',
        tasks: [
          { description: 'Lire Al-Fath (48:4)', type: 'verse' },
          { description: 'Silence 5 min', type: 'breathing' },
          { description: 'Écrire une lumière ressentie', type: 'writing' },
          { description: 'Lire Yâ-Sîn (un verset)', type: 'verse' },
          { description: 'Dhikr : Alhamdulillah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Fath (48:4)',
          translation: 'C\'est Lui qui a fait descendre la sérénité dans les cœurs des croyants afin qu\'ils ajoutent une foi à leur foi. À Allah appartiennent les armées des cieux et de la terre. Allah est Omniscient et Sage.',
          tafsir: 'Ibn Kathir explique que la sérénité (sakîna) est une tranquillité et une paix qui descendent du ciel dans les cœurs des croyants. Al-Baghawi précise que cette sérénité renforce la foi et apporte la confiance en Allah. C\'est une miséricorde divine qui apaise les cœurs dans les moments difficiles.'
        },
        closingPhrase: 'La gratitude silencieuse élève l\'âme et attire la bénédiction.'
      },
      {
        day: 31,
        title: 'Discipline du cœur',
        tasks: [
          { description: 'Lire At-Tawba (9:40)', type: 'verse' },
          { description: 'Faire une tâche repoussée', type: 'action' },
          { description: 'Écrire : élévation du jour', type: 'writing' },
          { description: '5 respirations profondes', type: 'breathing' },
          { description: 'Dhikr : Yâ Nûr × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'At-Tawba (9:40)',
          translation: 'Si vous ne lui portez pas secours, Allah l\'a déjà secouru lorsque ceux qui ne croyaient pas l\'avaient banni, deuxième de deux. Quand ils étaient dans la grotte et qu\'il disait à son compagnon : "Ne t\'afflige pas, car Allah est avec nous." Allah fit alors descendre Sa sérénité sur lui et le secourut de troupes que vous ne voyiez pas, et Il abaissa la parole de ceux qui ne croyaient pas. Et la parole d\'Allah est la plus haute. Allah est Puissant et Sage.',
          tafsir: 'Ibn Kathir explique que ce verset relate l\'épisode de la grotte lors de l\'Hégire du Prophète ﷺ avec Abu Bakr. Al-Baghawi précise que cette histoire enseigne que la compagnie d\'Allah est la meilleure protection, et que la sérénité (sakîna) divine descend sur ceux qui placent leur confiance en Lui. Al-Baydawi ajoute que ce récit montre comment Allah protège Ses serviteurs même dans les moments les plus difficiles, et que la parole d\'Allah triomphe toujours.'
        },
        closingPhrase: 'La discipline est lumière : elle trace le chemin vers un cœur stable.'
      },
      {
        day: 32,
        title: 'Lâcher une habitude',
        tasks: [
          { description: 'Lire Ibrahim (14:7)', type: 'verse' },
          { description: 'Retirer une mauvaise habitude', type: 'action' },
          { description: 'Ajouter une bonne', type: 'action' },
          { description: 'Lire 1 passage du Coran', type: 'verse' },
          { description: 'Astaghfirullah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Ibrahim (14:7)',
          translation: 'Et lorsque votre Seigneur proclama : "Si vous êtes reconnaissants, très certainement J\'augmenterai [Mes bienfaits] pour vous. Mais si vous êtes ingrats, Mon châtiment sera terrible."',
          tafsir: 'Ibn Kathir explique que ce verset établit le principe de la gratitude et de ses récompenses. La gratitude attire l\'augmentation des bienfaits divins, tandis que l\'ingratitude mène au châtiment. Al-Baghawi précise que la gratitude comprend la reconnaissance dans le cœur, l\'expression par la langue, et l\'utilisation des bienfaits dans l\'obéissance à Allah. Al-Baydawi ajoute que cette promesse divine est une incitation à la gratitude constante, car chaque bienfait mérite reconnaissance.'
        },
        closingPhrase: 'Lâcher l\'ancien fait de la place pour le meilleur en moi.'
      },
      {
        day: 33,
        title: 'Lumière sur lumière',
        tasks: [
          { description: 'Lire An-Nûr (24:35)', type: 'verse' },
          { description: 'Écrire : "Où ai-je besoin de lumière aujourd\'hui ?"', type: 'writing' },
          { description: 'Dhikr : Yâ Nûr × 99', type: 'dhikr' },
          { description: 'Lire Yâ-Sîn (verset choisi)', type: 'verse' },
          { description: 'Acte de rahma (miséricorde)', type: 'action' }
        ],
        verse: {
          reference: 'An-Nûr (24:35)',
          translation: 'Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un cristal, et celui-ci ressemble à un astre brillant. Son combustible vient d\'un arbre béni : un olivier ni oriental ni occidental, dont l\'huile semble éclairer sans que le feu ne la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose des paraboles aux gens, et Allah est Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset décrit la lumière de la guidance divine. La niche représente le cœur du croyant, la lampe est la foi, le cristal symbolise la clarté et la pureté, et l\'huile pure représente la sincérité. "Lumière sur lumière" signifie la lumière de la révélation combinée à la lumière de la foi dans le cœur. Al-Baydawi précise que cette parabole illustre comment la guidance divine éclaire le cœur du croyant.'
        },
        closingPhrase: 'La lumière qui vient d\'Allah éclaire même les coins cachés de mon cœur.'
      },
      {
        day: 34,
        title: 'Larguer un poids',
        tasks: [
          { description: 'Lire Al-Baqara (2:257)', type: 'verse' },
          { description: 'Écrire : "Je lâche…"', type: 'writing' },
          { description: 'Dhikr : SubhanAllah × 99', type: 'dhikr' },
          { description: 'Marche consciente 10 min', type: 'action' },
          { description: 'Lire un rappel islamique', type: 'verse' }
        ],
        verse: {
          reference: 'Al-Baqara (2:257)',
          translation: 'Allah est le Protecteur de ceux qui croient. Il les fait sortir des ténèbres vers la lumière. Quant à ceux qui ne croient pas, leurs protecteurs sont les Taghout qui les font sortir de la lumière vers les ténèbres. Voilà les gens du Feu où ils demeureront éternellement.',
          tafsir: 'Ibn Kathir explique que ce verset établit la distinction fondamentale entre les croyants et les mécréants. Allah est le Protecteur (Wali) des croyants, les guidant des ténèbres de l\'ignorance et de l\'égarement vers la lumière de la foi et de la guidance. Al-Baghawi précise que "les ténèbres" représentent l\'incroyance et l\'ignorance, tandis que "la lumière" symbolise la foi et la guidance divine.'
        },
        closingPhrase: 'Lâcher un poids, c\'est permettre à la lumière de circuler librement.'
      },
      {
        day: 35,
        title: 'Élévation',
        tasks: [
          { description: 'Lire Al-Fath (48:4)', type: 'verse' },
          { description: 'Écrire : élévation du jour', type: 'writing' },
          { description: 'Dhikr : Alhamdulillah × 99', type: 'dhikr' },
          { description: 'Visionnage d\'une courte vidéo rappel', type: 'action' },
          { description: 'Sadaqa', type: 'action' }
        ],
        verse: {
          reference: 'Al-Fath (48:4)',
          translation: 'C\'est Lui qui a fait descendre la sérénité dans les cœurs des croyants afin qu\'ils ajoutent une foi à leur foi. À Allah appartiennent les armées des cieux et de la terre. Allah est Omniscient et Sage.',
          tafsir: 'Ibn Kathir explique que la sérénité (sakîna) est une tranquillité et une paix qui descendent du ciel dans les cœurs des croyants. Al-Baghawi précise que cette sérénité renforce la foi et apporte la confiance en Allah. C\'est une miséricorde divine qui apaise les cœurs dans les moments difficiles.'
        },
        closingPhrase: 'Chaque acte de lumière m\'élève plus près de la présence divine.'
      },
      {
        day: 36,
        title: 'KALWA YÂ NÛR : pré-vortex',
        tasks: [
          { description: 'Kalwa : Yâ Nûr', type: 'kalwa' },
          { description: 'Lire An-Nûr (24:35)', type: 'verse' },
          { description: 'Respiration consciente 3•6•9', type: 'breathing' },
          { description: 'Invocation personnelle', type: 'dhikr' },
          { description: 'Lire Yâ-Sîn', type: 'verse' }
        ],
        verse: {
          reference: 'An-Nûr (24:35)',
          translation: 'Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un cristal, et celui-ci ressemble à un astre brillant. Son combustible vient d\'un arbre béni : un olivier ni oriental ni occidental, dont l\'huile semble éclairer sans que le feu ne la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose des paraboles aux gens, et Allah est Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset décrit la lumière de la guidance divine. La niche représente le cœur du croyant, la lampe est la foi, le cristal symbolise la clarté et la pureté, et l\'huile pure représente la sincérité. "Lumière sur lumière" signifie la lumière de la révélation combinée à la lumière de la foi dans le cœur. Al-Baydawi précise que cette parabole illustre comment la guidance divine éclaire le cœur du croyant.'
      },
        closingPhrase: 'Mon cœur s\'ouvre au vortex de lumière. Tout est prêt pour la transformation finale.'
      },
      {
        day: 37,
        title: 'KUN (SOIS)',
        block: 'BLOC FINAL — KUN • FA • YA • KUN (JOURS 37 À 40)',
        tasks: [
          { description: 'Lire Yâ-Sîn 77–81', type: 'verse' },
          { description: 'Écrire ce que tu dois quitter', type: 'writing' },
          { description: 'Abandonner une mauvaise habitude', type: 'action' },
          { description: 'Dhikr : SubhanAllah × 99', type: 'dhikr' },
          { description: 'Silence 5 min', type: 'breathing' }
        ],
        verse: {
          reference: 'Yâ-Sîn (77–81)',
          translation: 'L\'homme ne voit-il pas que Nous l\'avons créé d\'une goutte de sperme ? Et le voilà [devenu] un disputeur déclaré ! Il propose pour Nous un exemple, tandis qu\'il oublie sa propre création. Il dit : "Qui va faire revivre des ossements une fois réduits en poussière ?" Dis : "Celui qui les a créés une première fois les fera revivre. Il connaît parfaitement toute création."',
          tafsir: 'Ibn Kathir explique que ce passage rappelle à l\'homme sa création humble et sa résurrection future. Al-Baghawi précise que ces versets réfutent les doutes sur la résurrection en rappelant que Celui qui a créé l\'homme une première fois peut certainement le recréer. C\'est un rappel de la puissance absolue d\'Allah.'
        },
        closingPhrase: 'Aujourd\'hui, je choisis d\'être. Ma volonté s\'aligne avec celle d\'Allah.'
      },
      {
        day: 38,
        title: 'FA (ET CELA FUT)',
        tasks: [
          { description: 'Lire Yâ-Sîn 82', type: 'verse' },
          { description: 'Ajouter une bonne habitude', type: 'action' },
          { description: 'Écrire une lumière ressentie', type: 'writing' },
          { description: 'Lire un passage doux', type: 'verse' },
          { description: 'Dhikr : Yâ Nûr × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Yâ-Sîn (82)',
          translation: 'Sa parole, quand Il veut une chose, est de dire : "Sois !" et elle est.',
          tafsir: 'Ibn Kathir explique que ce verset illustre la puissance absolue d\'Allah. Quand Il veut créer quelque chose, Il dit simplement "Sois !" (Kun) et cela existe immédiatement. Al-Baydawi précise que cela démontre que la création divine est instantanée et sans effort, contrairement à la création humaine qui nécessite du temps et des moyens.'
        },
        closingPhrase: 'Tout ce qui est voulu par Allah existe déjà. Je m\'ouvre à Sa création.'
      },
      {
        day: 39,
        title: 'YA (PURIFICATION)',
        tasks: [
          { description: 'Lire Yâ-Sîn 83', type: 'verse' },
          { description: 'Écrire : "Qui pardonner ?"', type: 'writing' },
          { description: 'Astaghfirullah × 99', type: 'dhikr' },
          { description: 'Lire 1 page du Coran', type: 'verse' },
          { description: '1 acte de miséricorde', type: 'action' }
        ],
        verse: {
          reference: 'Yâ-Sîn (83)',
          translation: 'Gloire à Celui qui détient en Sa main la royauté sur toute chose, et c\'est vers Lui que vous serez ramenés.',
          tafsir: 'Ibn Kathir explique que ce verset proclame la souveraineté absolue d\'Allah sur toute chose. Toute la création retournera vers Lui pour le jugement. Al-Baghawi précise que "la royauté" (mulk) signifie ici le pouvoir et la domination absolue sur toute chose, et que le retour vers Allah est inévitable pour tous.'
        },
        closingPhrase: 'Le pardon purifie mon âme et fait rayonner ma lumière.'
      },
      {
        day: 40,
        title: 'KUN FINAL (LE SCEAU)',
        tasks: [
          { description: 'Kalwa : Yâ Allah', type: 'kalwa' },
          { description: 'Lire Ayat Al-Kursi + 3 Qul', type: 'verse' },
          { description: 'Écrire ton intention de nouvelle vie', type: 'writing' },
          { description: 'Faire 2 rakaat', type: 'action' },
          { description: 'Sadaqa', type: 'action' }
        ],
        verse: {
          reference: 'Al-Baqara (2:255) - Ayat Al-Kursi',
          translation: 'Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. À Lui appartient tout ce qui est dans les cieux et sur la terre. Qui peut intercéder auprès de Lui sans Sa permission ? Il connaît leur passé et leur futur. Et, de Sa science, ils n\'embrassent que ce qu\'Il veut. Son Trône déborde les cieux et la terre, dont la garde ne Lui coûte aucune peine. Et Il est le Très Haut, le Très Grand.',
          tafsir: 'Ibn Kathir explique qu\'Ayat Al-Kursi est le plus grand verset du Coran. Il proclame l\'unicité absolue d\'Allah, Sa vie éternelle, Sa subsistance par Lui-même, et Sa souveraineté totale. Al-Baghawi précise que ce verset protège celui qui le récite et affirme la grandeur et la majesté d\'Allah au-dessus de toute Sa création.'
        },
        closingPhrase: 'Le voyage se termine, mais la lumière commence. Mon cœur est ouvert, prêt pour une vie nouvelle et lumineuse.'
      }
    ]
  },
  {
    id: 'hafidh',
    title: 'LIBÉRATION SPIRITUELLE',
    emoji: '🟣',
    attribute: 'Yâ Hafidh',
    attributeArabic: 'الحفيظ',
    description: '40 jours de libération spirituelle et de protection divine.',
    color: '#9B59B6',
    days: [
      {
        day: 1,
        title: 'OUVERTURE & PROTECTION',
        block: 'JOURS 1 À 3 — OUVERTURE',
        tasks: [
          { description: 'Kalwa : Yâ Allah', type: 'kalwa' },
          { description: 'Nûr & Shifa — Al-Fâtiha sur l\'eau', type: 'action' },
          { description: 'Écriture + Dhikr × 99', type: 'writing' }
        ],
        verse: {
          reference: 'Al-Fâtiha (1:1–7)',
          translation: 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux. Louange à Allah, Seigneur de l\'univers. Le Tout Miséricordieux, le Très Miséricordieux. Maître du Jour de la rétribution. C\'est Toi que nous adorons, et c\'est Toi dont nous implorons secours. Guide-nous dans le droit chemin, le chemin de ceux que Tu as comblés de Tes bienfaits, non pas de ceux qui ont encouru Ta colère, ni des égarés.',
          tafsir: 'Ibn Kathir explique qu\'Al-Fâtiha est la mère du Coran et contient tous les sens du Livre. Al-Baghawi précise que cette sourate comprend la louange d\'Allah, l\'affirmation de Sa seigneurie, l\'unicité dans l\'adoration, la demande de guidance, et la distinction entre les bienheureux et les égarés. Al-Baydawi ajoute que "le droit chemin" (as-sirât al-mustaqîm) est l\'Islam, et que cette sourate est récitée dans chaque rak\'a de la prière car elle résume toute la guidance divine.'
        },
        closingPhrase: 'Aujourd\'hui, un voile s\'est levé sur ton cœur. Laisse Allah prendre la suite.'
      },
      {
        day: 2,
        title: 'PROTECTION DOUCE',
        block: 'JOURS 1 À 3 — OUVERTURE',
        tasks: [
          { description: 'Identifier 1 source de stress', type: 'action' },
          { description: 'Lire At-Tawba (9:51)', type: 'verse' },
          { description: 'La hawla wa la quwwata illa billah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'At-Tawba (9:51)',
          translation: 'Dis : "Rien ne nous atteindra, en dehors de ce qu\'Allah a prescrit pour nous. Il est notre Protecteur. C\'est en Allah que les croyants doivent placer leur confiance."',
          tafsir: 'Ibn Kathir explique que ce verset enseigne que rien n\'arrive sans la permission d\'Allah. Al-Baghawi précise que cette confiance en Allah (tawakkul) est le fondement de la sérénité du croyant, car il sait que tout ce qui lui arrive est décrété par Allah et que rien ne peut l\'atteindre sans Sa permission.'
        },
        closingPhrase: 'Rien ne t\'atteindra sans la permission d\'Allah. Aujourd\'hui, tu t\'es remis entre Ses mains.'
      },
      {
        day: 3,
        title: 'KALWA YÂ HAFIDH',
        tasks: [
          { description: 'Kalwa : Yâ Hafidh', type: 'kalwa' },
          { description: 'Lire Yusuf (12:64)', type: 'verse' },
          { description: 'Écrire une protection reçue', type: 'writing' }
        ],
        verse: {
          reference: 'Yusuf (12:64)',
          translation: 'Il dit : "Me confieriez-vous à son sujet comme je l\'ai confié à son frère auparavant ? Allah est le meilleur gardien et Il est le Très Miséricordieux des miséricordieux."',
          tafsir: 'Ibn Kathir explique que Ya\'qub (Jacob) exprime sa confiance en Allah comme le meilleur gardien. Al-Baydawi précise que ce verset enseigne que la protection d\'Allah est supérieure à toute protection humaine, et que le croyant doit placer sa confiance en Lui.'
      },
        closingPhrase: 'Allah te protège dans le visible et l\'invisible.'
      },
      {
        day: 4,
        title: 'FERMER UNE PORTE',
        block: 'JOURS 4 À 9 — PURIFICATION',
        tasks: [
          { description: 'Fermer 1 mauvaise habitude', type: 'action' },
          { description: 'Lire Al-Baqara (2:286)', type: 'verse' },
          { description: 'Astaghfirullah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Baqara (2:286)',
          translation: 'Allah n\'impose à aucune âme une charge supérieure à sa capacité. Elle aura ce qu\'elle aura gagné, et elle subira ce qu\'elle aura gagné. Seigneur, ne nous tiens pas rigueur si nous oublions ou commettons une erreur. Seigneur, ne nous charge pas d\'un fardeau comme Tu l\'as fait pour ceux qui nous ont précédés. Seigneur, ne nous impose pas ce que nous ne pouvons supporter. Fais-nous grâce, pardonne-nous et fais-nous miséricorde. Tu es notre Maître, accorde-nous la victoire sur les peuples mécréants.',
          tafsir: 'Ibn Kathir explique que ce verset révèle la miséricorde d\'Allah qui n\'impose jamais à une âme plus qu\'elle ne peut supporter. Al-Baghawi précise que cette invocation enseigne la confiance en la miséricorde divine et la demande de pardon pour les erreurs involontaires. Al-Baydawi ajoute que ce verset est une supplication complète qui couvre tous les aspects de la vie du croyant et sa relation avec son Seigneur.'
        },
        closingPhrase: 'Aujourd\'hui tu t\'es allégé. Continue doucement.'
      },
      {
        day: 5,
        title: 'DISSIPER UNE LOURDEUR',
        tasks: [
          { description: 'Écrire une lourdeur', type: 'writing' },
          { description: 'Lire Al-Falaq (113)', type: 'verse' },
          { description: 'Hasbiyallâh × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Falaq (113)',
          translation: 'Dis : "Je cherche protection auprès du Seigneur de l\'aube naissante contre le mal des êtres qu\'Il a créés, contre le mal de l\'obscurité quand elle s\'approfondit, contre le mal de celles qui soufflent [les sorcières] sur les nœuds, et contre le mal de l\'envieux quand il envie."',
          tafsir: 'Ibn Kathir explique que cette sourate est une protection contre tous les maux, visibles et invisibles. Al-Baghawi précise qu\'elle protège contre le mal des créatures, le mal de l\'obscurité, la sorcellerie et l\'envie. C\'est une invocation puissante de protection divine.'
        },
        closingPhrase: 'Allah connaît les fatigues que tu ne dis pas.'
      },
      {
        day: 6,
        title: 'NETTOYAGE SPIRITUEL',
        tasks: [
          { description: 'Douche légère / rangement', type: 'action' },
          { description: 'Lire An-Nâs (114)', type: 'verse' },
          { description: 'Respiration 3•6•9', type: 'breathing' }
        ],
        verse: {
          reference: 'An-Nâs (114)',
          translation: 'Dis : "Je cherche protection auprès du Seigneur des hommes, le Souverain des hommes, le Dieu des hommes, contre le mal du mauvais conseiller, furtif, qui souffle le mal dans les poitrines des hommes, qu\'il soit parmi les djinns ou parmi les hommes."',
          tafsir: 'Ibn Kathir explique que cette sourate protège contre le mal du diable et des djinns qui insufflent le mal dans les cœurs. Al-Baghawi précise qu\'elle est récitée pour se protéger contre les suggestions malveillantes et les tentations du diable.'
        },
        closingPhrase: 'La lumière aime les lieux propres, ton cœur aussi.'
      },
      {
        day: 7,
        title: 'APAISER LA PEUR',
        tasks: [
          { description: 'Écrire la peur du jour', type: 'writing' },
          { description: 'Lire Al-An\'am (6:82)', type: 'verse' },
          { description: 'Respiration lente', type: 'breathing' }
        ],
        verse: {
          reference: 'Al-An\'am (6:82)',
          translation: 'Ceux qui ont cru et n\'ont point troublé la pureté de leur foi par quelque iniquité, ceux-là ont la sécurité ; et ce sont eux les bien-guidés.',
          tafsir: 'Ibn Kathir explique que ce verset promet la sécurité à ceux qui préservent la pureté de leur foi sans l\'associer à l\'iniquité. Al-Baghawi précise que "l\'iniquité" ici fait référence au shirk (association), et que ceux qui préservent leur foi de toute association ont la sécurité et la guidance.'
        },
        closingPhrase: 'Allah donne la sécurité à ceux qui reviennent à Lui.'
      },
      {
        day: 8,
        title: 'PROTECTION CONTINUE',
        tasks: [
          { description: 'Écrire 1 pensée toxique', type: 'writing' },
          { description: 'Lire Al-Ahqaf (46:13)', type: 'verse' },
          { description: 'Mini purification (eau, parfum, fenêtre)', type: 'action' }
        ],
        verse: {
          reference: 'Al-Ahqaf (46:13)',
          translation: 'Ceux qui disent : "Notre Seigneur est Allah", puis se tiennent sur le droit chemin, ils n\'ont rien à craindre et ils ne seront point affligés.',
          tafsir: 'Ibn Kathir explique que ce verset promet la sécurité et la paix à ceux qui proclament l\'unicité d\'Allah et suivent le droit chemin. Al-Baghawi précise que cette proclamation doit être suivie d\'actions conformes à la guidance divine.'
        },
        closingPhrase: 'La droiture attire la paix, pas la peur.'
      },
      {
        day: 9,
        title: 'KALWA YÂ HAFIDH',
        tasks: [
          { description: 'Kalwa : Yâ Hafidh', type: 'kalwa' },
          { description: 'Lire At-Tawba (9:116)', type: 'verse' },
          { description: 'Visualisation : lumière protectrice', type: 'action' }
        ],
        verse: {
          reference: 'At-Tawba (9:116)',
          translation: 'À Allah appartient le royaume des cieux et de la terre. Il donne la vie et Il donne la mort. Et vous n\'avez pas d\'allié ni de secoureur en dehors d\'Allah.',
          tafsir: 'Ibn Kathir explique que ce verset affirme la souveraineté absolue d\'Allah et qu\'il n\'y a pas d\'autre protecteur ou secoureur que Lui. Al-Baghawi précise que cette vérité doit être ancrée dans le cœur du croyant pour qu\'il place toute sa confiance en Allah seul.'
      },
        closingPhrase: 'Tu n\'as pas d\'autre Protecteur qu\'Allah, et c\'est suffisant.'
      },
      {
        day: 10,
        title: 'TRANSMETTRE LA PEUR À ALLAH',
        block: 'JOURS 10 À 17 — LIBÉRATION',
        tasks: [
          { description: 'Lire Âl \'Imrân (3:173)', type: 'verse' },
          { description: 'Écrire une peur + la donner à Allah', type: 'writing' },
          { description: 'Hasbiyallâh × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Âl \'Imrân (3:173)',
          translation: 'Ceux à qui les gens ont dit : "Les gens se sont rassemblés contre vous ; craignez-les donc." Cela accrut leur foi et ils dirent : "Allah nous suffit ; Il est le meilleur garant."',
          tafsir: 'Ibn Kathir explique que ce verset relate la réaction des croyants face à la peur. Au lieu de s\'effrayer, leur foi s\'accrut et ils placèrent leur confiance en Allah. Al-Baghawi précise que "Allah nous suffit" (Hasbunallahu) est une expression de confiance totale en la protection divine.'
        },
        closingPhrase: 'Confie ce qui te dépasse, Allah ne déçoit pas.'
      },
      {
        day: 11,
        title: 'FERMER UNE PORTE DU SHAYTAN',
        tasks: [
          { description: 'Protéger regard / colère', type: 'action' },
          { description: 'Lire hadith "Croyant fort"', type: 'verse' },
          { description: 'Écrire une émotion', type: 'writing' }
        ],
        closingPhrase: 'Chaque maîtrise de toi-même est une victoire spirituelle.'
      },
      {
        day: 12,
        title: 'MÉMOS DU CŒUR',
        tasks: [
          { description: 'Éviter une mauvaise habitude', type: 'action' },
          { description: 'Lire Yunus (10:62)', type: 'verse' },
          { description: 'Respiration', type: 'breathing' }
        ],
        verse: {
          reference: 'Yunus (10:62)',
          translation: 'En vérité, les alliés d\'Allah n\'ont ni peur ni tristesse. Ceux qui ont cru et qui étaient pieux, ils auront une bonne nouvelle dans la vie présente et dans l\'au-delà. Il n\'y aura pas de changement aux paroles d\'Allah. Voilà l\'énorme succès.',
          tafsir: 'Ibn Kathir explique que les alliés d\'Allah (awliya) sont ceux qui croient et sont pieux. Ils n\'ont ni peur de l\'avenir ni tristesse du passé. Al-Baghawi précise que cette promesse s\'applique à ceux qui remplissent les conditions de la foi et de la piété.'
        },
        closingPhrase: 'Les alliés d\'Allah n\'ont ni peur ni tristesse.'
      },
      {
        day: 13,
        title: 'TAWWAKUL',
        tasks: [
          { description: '2 gratitudes', type: 'writing' },
          { description: 'Lire Az-Zumar (39:38)', type: 'verse' },
          { description: 'Yâ Hafidh × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Az-Zumar (39:38)',
          translation: 'Et si tu leur demandais : "Qui a créé les cieux et la terre ?" Ils diraient : "Allah." Dis : "Voyez-vous donc : ce que vous invoquez en dehors d\'Allah, peuvent-ils créer quelque chose ou la détruire ?" Dis : "Allah suffit comme garant."',
          tafsir: 'Ibn Kathir explique que ce verset établit qu\'Allah seul est le Créateur et qu\'Il suffit comme garant. Al-Baghawi précise que cette vérité doit être ancrée dans le cœur pour que le croyant place toute sa confiance en Allah seul. Al-Baydawi ajoute que ce verset réfute le polythéisme en montrant que les idoles ne peuvent rien créer ni détruire.'
        },
        closingPhrase: 'Celui qui s\'en remet à Allah n\'est jamais abandonné.'
      },
      {
        day: 14,
        title: 'PURIFICATION DU REGARD',
        tasks: [
          { description: 'Acte sincère', type: 'action' },
          { description: 'Lire un rappel', type: 'verse' },
          { description: 'Écrire : purification', type: 'writing' }
        ],
        closingPhrase: 'La pureté du regard purifie le cœur.'
      },
      {
        day: 15,
        title: 'DEMANDE DE PROTECTION',
        tasks: [
          { description: '3 respirations', type: 'breathing' },
          { description: 'Lire Al-Baqara (2:286)', type: 'verse' },
          { description: 'Écrire un besoin de protection', type: 'writing' }
        ],
        verse: {
          reference: 'Al-Baqara (2:286)',
          translation: 'Allah n\'impose à aucune âme une charge supérieure à sa capacité. Elle aura ce qu\'elle aura gagné, et elle subira ce qu\'elle aura gagné. Seigneur, ne nous tiens pas rigueur si nous oublions ou commettons une erreur. Seigneur, ne nous charge pas d\'un fardeau comme Tu l\'as fait pour ceux qui nous ont précédés. Seigneur, ne nous impose pas ce que nous ne pouvons supporter. Fais-nous grâce, pardonne-nous et fais-nous miséricorde. Tu es notre Maître, accorde-nous la victoire sur les peuples mécréants.',
          tafsir: 'Ibn Kathir explique que ce verset révèle la miséricorde d\'Allah qui n\'impose jamais à une âme plus qu\'elle ne peut supporter. Al-Baghawi précise que cette invocation enseigne la confiance en la miséricorde divine et la demande de pardon pour les erreurs involontaires. Al-Baydawi ajoute que ce verset est une supplication complète qui couvre tous les aspects de la vie du croyant et sa relation avec son Seigneur.'
        },
        closingPhrase: 'Allah répond aux cœurs sincères.'
      },
      {
        day: 16,
        title: 'SAKÎNA',
        tasks: [
          { description: '5 minutes de silence', type: 'breathing' },
          { description: 'Lire Ar-Ra\'d (13:28)', type: 'verse' },
          { description: 'SubhanAllah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Ar-Ra\'d (13:28)',
          translation: 'Ceux qui ont cru et dont les cœurs se tranquillisent à l\'évocation d\'Allah. N\'est-ce point par l\'évocation d\'Allah que se tranquillisent les cœurs ?',
          tafsir: 'Ibn Kathir explique que ce verset révèle le secret de la tranquillité du cœur. Le dhikr (évocation) d\'Allah apaise les cœurs et dissipe l\'anxiété. Al-Baghawi précise que la tranquillité du cœur vient uniquement du rappel d\'Allah, et que rien d\'autre ne peut apporter cette paix intérieure profonde.'
        },
        closingPhrase: 'Les cœurs se tranquillisent par le rappel d\'Allah.'
      },
      {
        day: 17,
        title: 'CŒUR PRÉSERVÉ',
        tasks: [
          { description: 'Écrire ton progrès', type: 'writing' },
          { description: 'Lire Al-Hajj (22:38)', type: 'verse' },
          { description: 'Ne pas médire', type: 'action' }
        ],
        verse: {
          reference: 'Al-Hajj (22:38)',
          translation: 'Allah défend ceux qui croient. Allah n\'aime point tout traître et ingrat.',
          tafsir: 'Ibn Kathir explique que ce verset promet la défense d\'Allah pour les croyants. Al-Baghawi précise qu\'Allah défend les croyants contre leurs ennemis et les protège dans ce monde et dans l\'au-delà.'
      },
        closingPhrase: 'Allah défend ceux qui croient. Tu n\'es pas seul.'
      },
      {
        day: 18,
        title: 'KALWA YÂ HAFIDH & CLARTÉ',
        block: 'JOUR 18 — PIVOT',
        tasks: [
          { description: 'Kalwa : Yâ Hafidh', type: 'kalwa' },
          { description: 'Lire Yusuf (12:101)', type: 'verse' },
          { description: 'Yâ Hafidh × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Yusuf (12:101)',
          translation: 'Mon Seigneur ! Tu m\'as donné du pouvoir et m\'as enseigné l\'interprétation des rêves. Créateur des cieux et de la terre, Tu es mon Protecteur dans ce monde et dans l\'au-delà. Fais-moi mourir en soumission et fais-moi rejoindre les vertueux."',
          tafsir: 'Ibn Kathir explique que cette invocation de Yusuf (Joseph) exprime sa reconnaissance envers Allah et sa demande de protection dans les deux mondes. Al-Baydawi précise que cette prière illustre la confiance totale en la protection divine.'
      },
        closingPhrase: 'Celui qui protège ton âme connaît ton chemin mieux que toi.'
      },
      {
        day: 19,
        title: 'KALWA YÂ HAFIDH',
        block: 'JOURS 19 À 21 — LIBÉRATION PROFONDE',
        tasks: [
          { description: 'Kalwa : Yâ Hafidh', type: 'kalwa' },
          { description: 'Yâ Hafidh × 99', type: 'dhikr' },
          { description: 'Lire Al-Fath (48:20)', type: 'verse' },
          { description: 'Écrire une lourdeur', type: 'writing' },
          { description: 'Invocation douce', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Fath (48:20)',
          translation: 'Allah vous a promis un butin abondant que vous prendrez, et Il a hâté pour vous celui-ci, et a repoussé de vous les mains des gens, afin que ce soit un signe pour les croyants et qu\'Il vous guide sur un droit chemin.',
          tafsir: 'Ibn Kathir explique que ce verset promet la victoire et la protection aux croyants. Al-Baghawi précise que cette promesse divine est un signe de la véracité de la foi et de la guidance d\'Allah.'
        },
        closingPhrase: 'Plus tu t\'approches d\'Allah, plus la lumière s\'installe.'
      },
      {
        day: 20,
        title: 'DÉLESTAGE',
        tasks: [
          { description: 'Nettoyer un coin', type: 'action' },
          { description: 'Lire Âl \'Imrân (3:160)', type: 'verse' },
          { description: 'Écrire : "Je me déleste de…"', type: 'writing' },
          { description: 'Hasbiyallâh × 99', type: 'dhikr' },
          { description: 'Petite marche', type: 'action' }
        ],
        verse: {
          reference: 'Âl \'Imrân (3:160)',
          translation: 'Si Allah vous secourt, nul ne peut vous vaincre. S\'Il vous abandonne, qui donc après Lui vous secourra ? C\'est en Allah que les croyants doivent placer leur confiance.',
          tafsir: 'Ibn Kathir explique que ce verset établit que la victoire vient uniquement d\'Allah. Al-Baghawi précise que si Allah accorde Son secours, personne ne peut vaincre les croyants, et que la confiance doit être placée uniquement en Lui.'
        },
        closingPhrase: 'Quand Allah te secourt, rien ne peut te vaincre.'
      },
      {
        day: 21,
        title: 'KALWA YÂ HAFIDH',
        tasks: [
          { description: 'Kalwa : Yâ Hafidh', type: 'kalwa' },
          { description: 'Yâ Hafidh × 99', type: 'dhikr' },
          { description: 'Lire Al-Baqara (2:107)', type: 'verse' },
          { description: 'Fermer 2 portes du mal', type: 'action' },
          { description: 'Acte de foi', type: 'action' }
        ],
        verse: {
          reference: 'Al-Baqara (2:107)',
          translation: 'Ne sais-tu pas qu\'à Allah appartient le royaume des cieux et de la terre, et qu\'en dehors d\'Allah vous n\'avez ni protecteur ni secoureur ?',
          tafsir: 'Ibn Kathir explique que ce verset rappelle la souveraineté absolue d\'Allah et qu\'il n\'y a pas d\'autre protecteur. Al-Baghawi précise que cette vérité doit être ancrée dans le cœur pour que le croyant place toute sa confiance en Allah seul.'
      },
        closingPhrase: 'Tu n\'as d\'autre allié qu\'Allah, et c\'est le meilleur des alliés.'
      },
      {
        day: 22,
        title: 'ALIGNEMENT',
        block: 'JOURS 22 À 27 — ASCENSION',
        tasks: [
          { description: 'Lire Al-Ahzab (33:3)', type: 'verse' },
          { description: 'Nettoyer une pensée', type: 'action' },
          { description: 'Dire : "Ô Allah protège-moi aujourd\'hui"', type: 'dhikr' },
          { description: 'Écrire 2 gratitudes', type: 'writing' },
          { description: 'Respiration', type: 'breathing' }
        ],
        verse: {
          reference: 'Al-Ahzab (33:3)',
          translation: 'Et place ta confiance en Allah. Allah suffit comme garant.',
          tafsir: 'Ibn Kathir explique que ce verset ordonne au Prophète ﷺ et aux croyants de placer leur confiance totale en Allah. Al-Baghawi précise que le tawakkul (confiance en Allah) est le fondement de la sérénité du cœur, car le croyant sait qu\'Allah gère toutes ses affaires. Al-Baydawi ajoute que cette confiance implique de s\'en remettre totalement à Allah après avoir accompli les causes légitimes, sachant qu\'Il est le meilleur protecteur et que Sa protection est complète et suffisante.'
        },
        closingPhrase: 'Celui qui place sa confiance en Allah trouve toujours une porte.'
      },
      {
        day: 23,
        title: 'PURIFICATION DU MENTAL',
        tasks: [
          { description: 'Lire Al-Furqan (25:29)', type: 'verse' },
          { description: 'Retirer jalousie / rancune', type: 'action' },
          { description: 'Hasbiyallâh × 99', type: 'dhikr' },
          { description: '2 minutes de silence', type: 'breathing' },
          { description: 'Boire de l\'eau', type: 'action' }
        ],
        verse: {
          reference: 'Al-Furqan (25:29)',
          translation: 'Il m\'a effectivement égaré loin du rappel [du Coran] après qu\'il me soit parvenu. Et le Diable abandonne [l\'homme] à son sort.',
          tafsir: 'Ibn Kathir explique que ce verset décrit comment le diable égare l\'homme puis l\'abandonne. Al-Baghawi précise que le diable ne peut égarer que ceux qui s\'éloignent du rappel d\'Allah, et qu\'il les abandonne ensuite à leur sort.'
        },
        closingPhrase: 'Le diable abandonne celui qui revient à Allah.'
      },
      {
        day: 24,
        title: 'COUPER LES LIENS DU MAL',
        tasks: [
          { description: 'Lire An-Nisa (4:76)', type: 'verse' },
          { description: 'Écrire une peur', type: 'writing' },
          { description: 'La remettre à Allah', type: 'action' },
          { description: 'La hawla… × 99', type: 'dhikr' },
          { description: 'Rangement symbolique', type: 'action' }
        ],
        verse: {
          reference: 'An-Nisa (4:76)',
          translation: 'Ceux qui croient combattent dans le sentier d\'Allah, et ceux qui ne croient pas combattent dans le sentier du Taghout. Combattez donc les alliés de Diable, car la ruse du Diable est faible.',
          tafsir: 'Ibn Kathir explique que ce verset distingue le combat des croyants de celui des mécréants. Al-Baghawi précise que le combat des croyants est pour la cause d\'Allah, tandis que celui des mécréants est pour les idoles, et que la ruse du diable est faible face à la vérité.'
        },
        closingPhrase: 'Allah combat pour ceux qui sont sincères.'
      },
      {
        day: 25,
        title: 'ALLÉGEMENT',
        tasks: [
          { description: 'Lire At-Talaq (65:2–3)', type: 'verse' },
          { description: 'Écrire : libération du jour', type: 'writing' },
          { description: 'SubhanAllah × 99', type: 'dhikr' },
          { description: 'Pause réseaux', type: 'action' },
          { description: 'Acte discret', type: 'action' }
        ],
        verse: {
          reference: 'At-Talaq (65:2–3)',
          translation: 'Et quiconque craint Allah, Il lui facilite les choses. Et quiconque place sa confiance en Allah, Il lui suffit. Allah atteint ce qu\'Il Se propose. Allah a assigné une mesure à chaque chose.',
          tafsir: 'Ibn Kathir explique que ce verset promet la facilitation des choses à ceux qui craignent Allah. Al-Baghawi précise que la crainte d\'Allah (taqwa) et la confiance en Lui (tawakkul) apportent la facilité et la suffisance dans tous les aspects de la vie.'
        },
        closingPhrase: 'Quiconque place sa confiance en Allah, Il lui suffit.'
      },
      {
        day: 26,
        title: 'GRATITUDE PROTECTRICE',
        tasks: [
          { description: 'Lire Al-Mulk (67:30)', type: 'verse' },
          { description: '3 gratitudes', type: 'writing' },
          { description: 'Tawakkul écrit', type: 'writing' },
          { description: '3 minutes silence', type: 'breathing' },
          { description: 'Eau ou parfum', type: 'action' }
        ],
        verse: {
          reference: 'Al-Mulk (67:30)',
          translation: 'Dis : "Voyez-vous ? Si votre eau était absorbée au fond de la terre, qui vous apporterait de l\'eau courante ?"',
          tafsir: 'Ibn Kathir explique que ce verset rappelle la dépendance de l\'homme envers les bienfaits d\'Allah. Al-Baghawi précise que cela illustre que tous les bienfaits viennent d\'Allah et que l\'homme doit être reconnaissant.'
        },
        closingPhrase: 'La gratitude appelle les protections d\'Allah.'
      },
      {
        day: 27,
        title: 'KALWA YÂ HAFIDH',
        tasks: [
          { description: 'Kalwa : Yâ Hafidh', type: 'kalwa' },
          { description: 'Yâ Hafidh × 99', type: 'dhikr' },
          { description: 'Lire An-Naml (27:62)', type: 'verse' },
          { description: 'Écrire une protection reçue', type: 'writing' },
          { description: 'Visualisation protectrice', type: 'action' }
        ],
        verse: {
          reference: 'An-Naml (27:62)',
          translation: 'N\'est-ce pas Lui qui répond à l\'angoissé quand il L\'invoque, et qui enlève le mal, et qui vous fait succéder sur la terre des générations les unes après les autres ? Y a-t-il donc une divinité avec Allah ? C\'est rarement que vous vous souvenez !',
          tafsir: 'Ibn Kathir explique que ce verset proclame qu\'Allah seul répond aux invocations de ceux qui sont dans la détresse. Al-Baghawi précise que ce verset rappelle les attributs divins : répondre aux invocations, enlever le mal, et gérer la succession des générations. Al-Baydawi ajoute que cette question rhétorique renforce l\'unicité d\'Allah et invite à la réflexion sur Ses bienfaits.'
      },
        closingPhrase: 'Allah exauce l\'angoissé lorsqu\'il L\'invoque.'
      },
      {
        day: 28,
        title: 'Protection du cœur',
        block: 'JOURS 28 À 36 — STABILISATION & NETTOYAGE',
        tasks: [
          { description: 'Lire Yâ-Sîn', type: 'verse' },
          { description: 'Écrire : "Je me libère de…"', type: 'writing' },
          { description: 'La hawla… × 99', type: 'dhikr' },
          { description: 'Acte de pureté', type: 'action' },
          { description: 'Boire de l\'eau', type: 'action' }
        ],
        verse: {
          reference: 'Yâ-Sîn (36:1)',
          translation: 'Yâ-Sîn. Par le Coran plein de sagesse.',
          tafsir: 'Ibn Kathir explique que Yâ-Sîn est l\'une des lettres mystérieuses du Coran. Al-Baghawi précise que cette sourate est appelée "le cœur du Coran" et qu\'elle contient des leçons profondes sur la résurrection et la guidance.'
        },
        closingPhrase: 'La protection commence par un cœur vivant.'
      },
      {
        day: 29,
        title: 'Nettoyage des pensées',
        tasks: [
          { description: 'Lire An-Nur (24:21)', type: 'verse' },
          { description: 'Écrire pensée toxique', type: 'writing' },
          { description: 'Écrire pensée saine', type: 'writing' },
          { description: 'Petit rappel', type: 'verse' },
          { description: 'Respiration', type: 'breathing' }
        ],
        verse: {
          reference: 'An-Nur (24:21)',
          translation: 'Ô vous qui avez cru ! Ne suivez pas les traces du Diable. Quiconque suit les traces du Diable, [sachez] qu\'il commande la turpitude et le blâmable. Et n\'eût été la grâce d\'Allah sur vous et Sa miséricorde, nul d\'entre vous n\'aurait jamais été pur. Mais Allah purifie qui Il veut. Allah est Audient et Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset interdit de suivre les traces du diable. Al-Baghawi précise que suivre le diable mène à la turpitude et au blâmable, et que seule la grâce d\'Allah purifie les cœurs.'
        },
        closingPhrase: 'Les pensées pures attirent la lumière d\'Allah.'
      },
      {
        day: 30,
        title: 'Libération spirituelle',
        tasks: [
          { description: 'Lire Yâ-Sîn', type: 'verse' },
          { description: 'Silence 5 min', type: 'breathing' },
          { description: 'SubhanAllah × 99', type: 'dhikr' },
          { description: 'Écrire une libération', type: 'writing' },
          { description: 'Marche', type: 'action' }
        ],
        verse: {
          reference: 'Yâ-Sîn (36:1)',
          translation: 'Yâ-Sîn. Par le Coran plein de sagesse.',
          tafsir: 'Ibn Kathir explique que Yâ-Sîn est l\'une des lettres mystérieuses du Coran. Al-Baghawi précise que cette sourate est appelée "le cœur du Coran" et qu\'elle contient des leçons profondes sur la résurrection et la guidance.'
        },
        closingPhrase: 'Une âme libérée trouve la paix.'
      },
      {
        day: 31,
        title: 'Renforcer ton armure',
        tasks: [
          { description: 'Lire Al-Hajj (22:78)', type: 'verse' },
          { description: 'Faire une tâche repoussée', type: 'action' },
          { description: 'Yâ Hafidh × 99', type: 'dhikr' },
          { description: 'Woudou', type: 'action' },
          { description: 'Écrire une gratitude', type: 'writing' }
        ],
        verse: {
          reference: 'Al-Hajj (22:78)',
          translation: 'Et luttez pour Allah avec tout l\'effort qu\'Il mérite. C\'est Lui qui vous a élus ; et Il ne vous a imposé aucune gêne dans la religion, celle de votre père Abraham, lequel vous a déjà nommés "Musulmans" avant [ce Livre] et dans ce [Livr] même, afin que le Messager soit témoin contre vous, et que vous soyez vous-mêmes témoins contre les gens. Accomplissez donc la prière, acquittez la zakat et attachez-vous fortement à Allah. C\'est Lui votre Maître. Et quel excellent Maître et quel excellent Secoureur !',
          tafsir: 'Ibn Kathir explique que ce verset ordonne de lutter pour Allah avec sincérité. Al-Baghawi précise que la religion d\'Allah est facile et que les croyants doivent s\'attacher fermement à Lui.'
        },
        closingPhrase: 'Allah a élu les croyants pour marcher avec force.'
      },
      {
        day: 32,
        title: 'Lâcher une attache',
        tasks: [
          { description: 'Lire Al-Baqara (2:286)', type: 'verse' },
          { description: 'Retirer une mauvaise habitude', type: 'action' },
          { description: 'Ajouter une bonne', type: 'action' },
          { description: 'Écrire', type: 'writing' },
          { description: 'Istighfar × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Baqara (2:286)',
          translation: 'Allah n\'impose à aucune âme une charge supérieure à sa capacité. Elle aura ce qu\'elle aura gagné, et elle subira ce qu\'elle aura gagné. Seigneur, ne nous tiens pas rigueur si nous oublions ou commettons une erreur. Seigneur, ne nous charge pas d\'un fardeau comme Tu l\'as fait pour ceux qui nous ont précédés. Seigneur, ne nous impose pas ce que nous ne pouvons supporter. Fais-nous grâce, pardonne-nous et fais-nous miséricorde. Tu es notre Maître, accorde-nous la victoire sur les peuples mécréants.',
          tafsir: 'Ibn Kathir explique que ce verset révèle la miséricorde d\'Allah qui n\'impose jamais à une âme plus qu\'elle ne peut supporter. Al-Baghawi précise que cette invocation enseigne la confiance en la miséricorde divine et la demande de pardon pour les erreurs involontaires. Al-Baydawi ajoute que ce verset est une supplication complète qui couvre tous les aspects de la vie du croyant et sa relation avec son Seigneur.'
        },
        closingPhrase: 'Allah n\'impose jamais plus que tu ne peux porter.'
      },
      {
        day: 33,
        title: 'Lumière protectrice',
        tasks: [
          { description: 'Lire Yâ-Sîn', type: 'verse' },
          { description: 'Yâ Hafidh × 99', type: 'dhikr' },
          { description: 'Écrire une lumière récente', type: 'writing' },
          { description: 'Acte de rahma', type: 'action' },
          { description: 'Silence', type: 'breathing' }
        ],
        verse: {
          reference: 'Yâ-Sîn (36:1)',
          translation: 'Yâ-Sîn. Par le Coran plein de sagesse.',
          tafsir: 'Ibn Kathir explique que Yâ-Sîn est l\'une des lettres mystérieuses du Coran. Al-Baghawi précise que cette sourate est appelée "le cœur du Coran" et qu\'elle contient des leçons profondes sur la résurrection et la guidance.'
        },
        closingPhrase: 'La miséricorde illumine la protection.'
      },
      {
        day: 34,
        title: 'Nettoyage du mental',
        tasks: [
          { description: 'Lire Al-Fath (48:7)', type: 'verse' },
          { description: 'La hawla… × 99', type: 'dhikr' },
          { description: 'Rangement', type: 'action' },
          { description: 'Air frais', type: 'action' },
          { description: 'Invocation douce', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Fath (48:7)',
          translation: 'À Allah appartiennent les armées des cieux et de la terre. Allah est Tout-Puissant et Sage.',
          tafsir: 'Ibn Kathir explique que ce verset proclame que toutes les armées appartiennent à Allah. Al-Baghawi précise que cela rappelle la puissance absolue d\'Allah et que les croyants doivent placer leur confiance en Lui.'
        },
        closingPhrase: 'Les armées d\'Allah sont avec toi.'
      },
      {
        day: 35,
        title: 'Élévation protectrice',
        tasks: [
          { description: 'Lire Yunus (10:107)', type: 'verse' },
          { description: 'Sadaqa', type: 'action' },
          { description: 'Alhamdulillah × 99', type: 'dhikr' },
          { description: 'Vision claire', type: 'action' },
          { description: 'Écrire élévation', type: 'writing' }
        ],
        verse: {
          reference: 'Yunus (10:107)',
          translation: 'Si Allah fait qu\'un mal te touche, nul autre que Lui ne peut l\'enlever. Et s\'Il te veut un bien, nul ne peut repousser Sa grâce. Il en gratifie qui Il veut parmi Ses serviteurs. Et c\'est Lui le Pardonneur, le Très Miséricordieux.',
          tafsir: 'Ibn Kathir explique que ce verset établit qu\'Allah seul contrôle le bien et le mal. Al-Baghawi précise que seul Allah peut enlever le mal et accorder le bien, et que le croyant doit placer toute sa confiance en Lui. Al-Baydawi ajoute que cette vérité renforce la soumission totale à la volonté divine et la gratitude pour tous les bienfaits.'
        },
        closingPhrase: 'Personne ne peut bloquer ce qu\'Allah ouvre.'
      },
      {
        day: 36,
        title: 'KALWA YÂ HAFIDH',
        tasks: [
          { description: 'Kalwa : Yâ Hafidh', type: 'kalwa' },
          { description: 'Lire Al-Falaq (113)', type: 'verse' },
          { description: 'Visualisation : armure', type: 'action' },
          { description: 'Écrire', type: 'writing' },
          { description: 'Respiration', type: 'breathing' }
        ],
        verse: {
          reference: 'Al-Falaq (113)',
          translation: 'Dis : "Je cherche protection auprès du Seigneur de l\'aube naissante contre le mal des êtres qu\'Il a créés, contre le mal de l\'obscurité quand elle s\'approfondit, contre le mal de celles qui soufflent [les sorcières] sur les nœuds, et contre le mal de l\'envieux quand il envie."',
          tafsir: 'Ibn Kathir explique que cette sourate est une protection contre tous les maux, visibles et invisibles. Al-Baghawi précise qu\'elle protège contre le mal des créatures, le mal de l\'obscurité, la sorcellerie et l\'envie. C\'est une invocation puissante de protection divine.'
        },
        closingPhrase: 'La lumière repousse tout mal.'
      },
      {
        day: 37,
        title: 'KUN (Rupture)',
        block: 'BLOC FINAL — KUN • FA • YA • KUN',
        tasks: [
          { description: 'Lire Yâ-Sîn 77–81', type: 'verse' },
          { description: 'Couper une source de négativité', type: 'action' },
          { description: 'Nettoyage profond', type: 'action' },
          { description: 'Silence 7 min', type: 'breathing' },
          { description: 'Écrire ce que tu refuses désormais', type: 'writing' }
        ],
        verse: {
          reference: 'Yâ-Sîn (77–81)',
          translation: 'L\'homme ne voit-il pas que Nous l\'avons créé d\'une goutte de sperme ? Et le voilà [devenu] un disputeur déclaré ! Il propose pour Nous un exemple, tandis qu\'il oublie sa propre création. Il dit : "Qui va faire revivre des ossements une fois réduits en poussière ?" Dis : "Celui qui les a créés une première fois les fera revivre. Il connaît parfaitement toute création."',
          tafsir: 'Ibn Kathir explique que ce passage rappelle à l\'homme sa création humble et sa résurrection future. Al-Baghawi précise que ces versets réfutent les doutes sur la résurrection en rappelant que Celui qui a créé l\'homme une première fois peut certainement le recréer. C\'est un rappel de la puissance absolue d\'Allah.'
        },
        closingPhrase: 'Toute renaissance commence par une rupture.'
      },
      {
        day: 38,
        title: 'FA (Ouverture)',
        tasks: [
          { description: 'Lire Yâ-Sîn 82', type: 'verse' },
          { description: 'Ajouter une nouvelle habitude protectrice', type: 'action' },
          { description: 'Écrire énergie positive', type: 'writing' },
          { description: 'Dhikr', type: 'dhikr' },
          { description: 'Boire de l\'eau', type: 'action' }
        ],
        verse: {
          reference: 'Yâ-Sîn (82)',
          translation: 'Sa parole, quand Il veut une chose, est de dire : "Sois !" et elle est.',
          tafsir: 'Ibn Kathir explique que ce verset illustre la puissance absolue d\'Allah. Quand Il veut créer quelque chose, Il dit simplement "Sois !" (Kun) et cela existe immédiatement. Al-Baydawi précise que cela démontre que la création divine est instantanée et sans effort, contrairement à la création humaine qui nécessite du temps et des moyens.'
        },
        closingPhrase: 'Quand Allah dit Sois, la lumière arrive.'
      },
      {
        day: 39,
        title: 'YA (Purification)',
        tasks: [
          { description: 'Lire Yâ-Sîn 83', type: 'verse' },
          { description: 'Istighfar × 70', type: 'dhikr' },
          { description: 'Écrire : "Je suis sous la protection d\'Allah."', type: 'writing' },
          { description: 'Lire 1 page de Coran', type: 'verse' },
          { description: 'Acte de miséricorde', type: 'action' }
        ],
        verse: {
          reference: 'Yâ-Sîn (83)',
          translation: 'Gloire à Celui qui détient en Sa main la royauté sur toute chose, et c\'est vers Lui que vous serez ramenés.',
          tafsir: 'Ibn Kathir explique que ce verset proclame la souveraineté absolue d\'Allah sur toute chose. Toute la création retournera vers Lui pour le jugement. Al-Baghawi précise que "la royauté" (mulk) signifie ici le pouvoir et la domination absolue sur toute chose, et que le retour vers Allah est inévitable pour tous.'
        },
        closingPhrase: 'Celui qui se purifie, Allah l\'élève.'
      },
      {
        day: 40,
        title: 'KUN FINAL — SCEAU',
        tasks: [
          { description: 'Kalwa : Yâ Allah', type: 'kalwa' },
          { description: 'Nûr & Shifa (Ayat Al-Kursi + 3 Qul)', type: 'action' },
          { description: 'Écrire intention nouvelle vie', type: 'writing' },
          { description: '2 rakaat', type: 'action' },
          { description: 'Sadaqa', type: 'action' }
        ],
        verse: {
          reference: 'Al-Baqara (2:255) - Ayat Al-Kursi',
          translation: 'Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. À Lui appartient tout ce qui est dans les cieux et sur la terre. Qui peut intercéder auprès de Lui sans Sa permission ? Il connaît leur passé et leur futur. Et, de Sa science, ils n\'embrassent que ce qu\'Il veut. Son Trône déborde les cieux et la terre, dont la garde ne Lui coûte aucune peine. Et Il est le Très Haut, le Très Grand.',
          tafsir: 'Ibn Kathir explique qu\'Ayat Al-Kursi est le plus grand verset du Coran. Il proclame l\'unicité absolue d\'Allah, Sa vie éternelle, Sa subsistance par Lui-même, et Sa souveraineté totale. Al-Baghawi précise que ce verset protège celui qui le récite et affirme la grandeur et la majesté d\'Allah au-dessus de toute Sa création.'
        },
        closingPhrase: 'Tu viens de traverser 40 jours de lumière. Qu\'Allah scelle dans ta vie ce que ton cœur a construit.'
      }
    ]
  },
  {
    id: 'qawiyy',
    title: 'DISCIPLINE & BARAKA',
    emoji: '🔥',
    attribute: 'Yâ Qawiyy',
    attributeArabic: 'القوي',
    description: '40 jours de discipline, force et baraka.',
    color: '#E74C3C',
    days: [
      {
        day: 1,
        title: 'OUVERTURE & ANCRAGE',
        block: 'JOURS 1 À 3 — OUVERTURE & ANCRAGE',
        tasks: [
          { description: 'Kalwa : Yâ Allah', type: 'kalwa' },
          { description: 'Nûr & Shifa : Lire Al-Fâtiha (1:1–7)', type: 'action' },
          { description: 'Écriture + discipline : Ton objectif principal du défi', type: 'writing' }
        ],
        verse: {
          reference: 'Al-Fâtiha (1:1–7)',
          translation: 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux. Louange à Allah, Seigneur de l\'univers. Le Tout Miséricordieux, le Très Miséricordieux. Maître du Jour de la rétribution. C\'est Toi que nous adorons, et c\'est Toi dont nous implorons secours. Guide-nous dans le droit chemin, le chemin de ceux que Tu as comblés de Tes bienfaits, non pas de ceux qui ont encouru Ta colère, ni des égarés.',
          tafsir: 'Ibn Kathir explique qu\'Al-Fâtiha est la mère du Coran et contient tous les sens du Livre. Al-Baghawi précise que cette sourate comprend la louange d\'Allah, l\'affirmation de Sa seigneurie, l\'unicité dans l\'adoration, la demande de guidance, et la distinction entre les bienheureux et les égarés. Al-Baydawi ajoute que "le droit chemin" (as-sirât al-mustaqîm) est l\'Islam, et que cette sourate est récitée dans chaque rak\'a de la prière car elle résume toute la guidance divine.'
        },
        closingPhrase: 'Aujourd\'hui, je m\'ouvre à la force d\'Allah et à la lumière qui guide mes pas.'
      },
      {
        day: 2,
        title: 'ACTION SIMPLE',
        block: 'JOURS 1 À 3 — OUVERTURE & ANCRAGE',
        tasks: [
          { description: 'Choisir 1 action importante à réaliser', type: 'action' },
          { description: 'Lire Âl \'Imrân (3:159)', type: 'verse' },
          { description: '5 minutes d\'ordre + dire "Yâ Matîn" × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Âl \'Imrân (3:159)',
          translation: 'C\'est par quelque miséricorde de la part d\'Allah que tu as été si doux envers eux ! Mais si tu étais rude, au cœur dur, ils se seraient enfuis de ton entourage. Pardonne-leur donc, et implore pour eux le pardon [d\'Allah]. Et consulte-les à propos des affaires ; puis une fois que tu t\'es décidé, confie-toi à Allah, car Allah aime ceux qui Lui font confiance.',
          tafsir: 'Ibn Kathir explique que ce verset enseigne la douceur et la consultation avant de prendre une décision, puis la confiance en Allah. Al-Baghawi précise que la douceur attire les cœurs et que la consultation est une sunna, mais une fois décidé, il faut placer sa confiance en Allah.'
        },
        closingPhrase: 'Chaque petit pas guidé par Allah construit ma force intérieure.'
      },
      {
        day: 3,
        title: 'KALWA YÂ QAWIYY',
        tasks: [
          { description: 'Kalwa : Yâ Qawiyy', type: 'kalwa' },
          { description: 'Choisir une discipline simple à pratiquer', type: 'action' },
          { description: 'Écrire : "Quelle force Allah veut mettre en moi aujourd\'hui ?"', type: 'writing' }
        ],
        verse: {
          reference: 'Adh-Dhâriyât (51:58)',
          translation: 'Allah est le Détenteur de la force, l\'Inébranlable.',
          tafsir: 'Ibn Kathir explique que ce verset proclame qu\'Allah est la source de toute force. Al-Baghawi précise que toute force vient d\'Allah et que le croyant doit chercher la force en Lui.'
      },
        closingPhrase: 'Je me tiens fermement dans la puissance qu\'Allah dépose en moi.'
      },
      {
        day: 4,
        title: 'PREMIÈRE RÉGULARITÉ',
        block: 'JOURS 4 À 9 — CONSTANCE & STRUCTURE',
        tasks: [
          { description: '10 min d\'une tâche utile', type: 'action' },
          { description: 'Lire Al-Baqara (2:153)', type: 'verse' },
          { description: 'Ranger un petit espace', type: 'action' }
        ],
        verse: {
          reference: 'Al-Baqara (2:153)',
          translation: 'Ô vous qui croyez ! Cherchez secours dans la patience et la prière. Allah est avec les patients.',
          tafsir: 'Ibn Kathir explique que ce verset ordonne de chercher secours dans la patience (sabr) et la prière (salat). Al-Baghawi précise que la patience et la prière sont les deux piliers de la force spirituelle et qu\'Allah est avec ceux qui patientent.'
        },
        closingPhrase: 'La patience et la régularité sont mes alliées pour une force durable.'
      },
      {
        day: 5,
        title: 'RÉDUIRE LE CHAOS',
        tasks: [
          { description: 'Éliminer une distraction', type: 'action' },
          { description: 'Lire Ar-Ra\'d (13:11)', type: 'verse' },
          { description: 'Écrire : "Qu\'ai-je accompli aujourd\'hui ?" + Yâ Qawiyy × 99', type: 'writing' }
        ],
        verse: {
          reference: 'Ar-Ra\'d (13:11)',
          translation: 'Il y a pour chaque peuple un ange gardien. Quand leur terme arrive, ils ne peuvent le retarder d\'un instant ni l\'avancer.',
          tafsir: 'Ibn Kathir explique que ce verset établit qu\'il y a des anges gardiens pour chaque peuple. Al-Baghawi précise que cela rappelle que tout est décrété par Allah et que l\'homme doit changer lui-même pour que son état change.'
        },
        closingPhrase: 'Je choisis le calme intérieur pour accueillir la baraka.'
      },
      {
        day: 6,
        title: 'ORDONNER TON MONDE',
        tasks: [
          { description: 'Marcher 5 minutes en pleine conscience', type: 'action' },
          { description: 'Lire Al-Fath (48:7)', type: 'verse' },
          { description: 'Faire une tâche que tu repousses', type: 'action' }
        ],
        verse: {
          reference: 'Al-Fath (48:7)',
          translation: 'À Allah appartiennent les armées des cieux et de la terre. Allah est Tout-Puissant et Sage.',
          tafsir: 'Ibn Kathir explique que ce verset proclame que toutes les armées appartiennent à Allah. Al-Baghawi précise que cela rappelle la puissance absolue d\'Allah et que les croyants doivent placer leur confiance en Lui.'
        },
        closingPhrase: 'Chaque action disciplinée me rapproche de la force d\'Allah.'
      },
      {
        day: 7,
        title: 'MICRO-VICTOIRE',
        tasks: [
          { description: 'Écrire une petite victoire du jour', type: 'writing' },
          { description: 'Lire Al-Mulk (67:15)', type: 'verse' },
          { description: 'Alléger ta charge mentale', type: 'action' }
        ],
        verse: {
          reference: 'Al-Mulk (67:15)',
          translation: 'C\'est Lui qui vous a fait la terre pour lit et le ciel pour toit, qui a fait descendre l\'eau du ciel et qui, par elle, a fait sortir des fruits pour vous nourrir. Ne Lui donnez donc pas d\'égaux, alors que vous savez [tout cela].',
          tafsir: 'Ibn Kathir explique que ce verset rappelle les bienfaits d\'Allah : la terre comme lit, le ciel comme toit, et l\'eau qui fait pousser les fruits. Al-Baghawi précise que ces bienfaits sont une preuve de la puissance et de la miséricorde d\'Allah. Al-Baydawi ajoute que ce verset invite à la gratitude et à la réflexion sur les signes divins dans la création, et interdit l\'association à Allah.'
        },
        closingPhrase: 'Chaque petite victoire est un pilier de ma constance.'
      },
      {
        day: 8,
        title: 'CONTINUITÉ',
        tasks: [
          { description: 'Ranger un espace quotidien', type: 'action' },
          { description: 'Lire As-Saff (61:4)', type: 'verse' },
          { description: 'Dire Yâ Qawiyy × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'As-Saff (61:4)',
          translation: 'Allah aime ceux qui combattent dans Son sentier en rangs serrés, comme un édifice renforcé.',
          tafsir: 'Ibn Kathir explique que ce verset décrit les croyants comme un édifice solide et uni. Al-Baghawi précise que l\'unité et la discipline sont aimées d\'Allah et apportent la force.'
        },
        closingPhrase: 'Ma discipline construit un édifice solide dans mon cœur.'
      },
      {
        day: 9,
        title: 'KALWA YÂ QAWIYY',
        tasks: [
          { description: 'Kalwa : Yâ Qawiyy', type: 'kalwa' },
          { description: 'Écrire : "Qu\'est-ce qui vole ma discipline ?"', type: 'writing' },
          { description: 'Respiration 3•6•9', type: 'breathing' }
        ],
        verse: {
          reference: 'Al-Hajj (22:40)',
          translation: 'Ceux qui ont été expulsés de leurs demeures, sans aucun droit, seulement parce qu\'ils disaient : "Allah est notre Seigneur." Si Allah ne repoussait pas les gens les uns par les autres, les ermitages seraient démolis, ainsi que les églises, les synagogues et les mosquées où le nom d\'Allah est beaucoup invoqué. Allah soutient, certes, ceux qui soutiennent (Sa Religion). Allah est Fort et Puissant.',
          tafsir: 'Ibn Kathir explique que ce verset promet le soutien d\'Allah à ceux qui sont opprimés pour leur foi. Al-Baghawi précise que ce verset justifie la défense des lieux de culte et des croyants persécutés. Al-Baydawi ajoute que ce verset montre la justice divine qui protège les opprimés et punit les oppresseurs, et qu\'Allah est Fort et Puissant.'
      },
        closingPhrase: 'Je laisse Allah sécuriser ma force et protéger mon effort.'
      },
      {
        day: 10,
        title: '15 MINUTES BARAKA',
        block: 'JOURS 10 À 17 — PROFONDEUR & RÉSILIENCE',
        tasks: [
          { description: '15 minutes concentrées sur une seule tâche', type: 'action' },
          { description: 'Lire Ash-Sharh (94:5–6)', type: 'verse' },
          { description: 'Écrire : "Victoire du jour" + Yâ Qawiyy × 99', type: 'writing' }
        ],
        verse: {
          reference: 'Ash-Sharh (94:5–6)',
          translation: 'À côté de la difficulté est certes une facilité. À côté de la difficulté est certes une facilité.',
          tafsir: 'Ibn Kathir explique que ce verset promet que chaque difficulté est suivie d\'une facilité. Al-Baghawi précise que cette promesse est répétée pour renforcer l\'espoir et que la facilité suit toujours la difficulté.'
        },
        closingPhrase: 'La facilité suit toujours la persévérance.'
      },
      {
        day: 11,
        title: 'COUPER UNE DISTRACTION',
        tasks: [
          { description: 'Éloigner une distraction', type: 'action' },
          { description: 'Lire Az-Zumar (39:10)', type: 'verse' },
          { description: 'Écrire ton ressenti + Yâ Qawiyy × 99', type: 'writing' }
        ],
        verse: {
          reference: 'Az-Zumar (39:10)',
          translation: 'Dis : "Ô Mes serviteurs qui avez cru ! Craignez votre Seigneur. Ceux qui accomplissent le bien dans ce monde auront une bonne [récompense]. La terre d\'Allah est vaste. Ceux qui endurent auront leur récompense sans compter."',
          tafsir: 'Ibn Kathir explique que ce verset promet une récompense sans limite à ceux qui endurent. Al-Baghawi précise que la patience et l\'endurance sont récompensées au-delà de toute mesure.'
        },
        closingPhrase: 'Chaque effort sincère est vu et récompensé par Allah.'
      },
      {
        day: 12,
        title: 'S\'ORGANISER',
        tasks: [
          { description: 'Écrire 3 priorités', type: 'writing' },
          { description: 'Lire Al-Baqara (2:45)', type: 'verse' },
          { description: 'Hydratation + mini-entretien physique', type: 'action' }
        ],
        verse: {
          reference: 'Al-Baqara (2:45)',
          translation: 'Cherchez secours dans la patience et la prière. Certes, la prière est une lourde obligation, sauf pour les humbles.',
          tafsir: 'Ibn Kathir explique que ce verset ordonne de chercher secours dans la patience et la prière. Al-Baghawi précise que la prière est difficile sauf pour ceux qui sont humbles et soumis à Allah.'
        },
        closingPhrase: 'Mon organisation nourrit ma force intérieure.'
      },
      {
        day: 13,
        title: 'AFFRONTER CE QUE TU REPASSES',
        tasks: [
          { description: 'Faire une chose que tu repousses', type: 'action' },
          { description: 'Lire An-Najm (53:39)', type: 'verse' },
          { description: 'Dire Yâ Qawiyy × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'An-Najm (53:39)',
          translation: 'Et que l\'homme n\'obtient que [le fruit] de ses efforts.',
          tafsir: 'Ibn Kathir explique que ce verset établit que l\'homme n\'obtient que le fruit de ses efforts. Al-Baghawi précise que chaque effort est récompensé selon sa valeur et sa sincérité.'
        },
        closingPhrase: 'Chaque effort courageux construit ma baraka.'
      },
      {
        day: 14,
        title: 'TENIR LA PRIÈRE',
        tasks: [
          { description: 'Faire une prière à l\'heure', type: 'action' },
          { description: 'Lire un rappel', type: 'verse' },
          { description: 'Écrire : "Que m\'a apporté la discipline aujourd\'hui ?" + Yâ Qawiyy × 99', type: 'writing' }
        ],
        closingPhrase: 'La régularité dans la prière renforce tout mon être.'
      },
      {
        day: 15,
        title: 'RÉDUCTION DU CHAOS',
        tasks: [
          { description: '3 respirations profondes', type: 'breathing' },
          { description: 'Lire An-Najm (53:39)', type: 'verse' },
          { description: 'Retirer une source de désordre + Yâ Qawiyy × 99', type: 'action' }
        ],
        verse: {
          reference: 'An-Najm (53:39)',
          translation: 'Et que l\'homme n\'obtient que [le fruit] de ses efforts.',
          tafsir: 'Ibn Kathir explique que ce verset établit que l\'homme n\'obtient que le fruit de ses efforts. Al-Baghawi précise que chaque effort est récompensé selon sa valeur et sa sincérité.'
        },
        closingPhrase: 'Je choisis la clarté et l\'ordre pour accueillir la force divine.'
      },
      {
        day: 16,
        title: 'SILENCE & FORCE',
        tasks: [
          { description: '5 minutes de silence', type: 'breathing' },
          { description: 'Lire Al-Fath (48:4)', type: 'verse' },
          { description: '5 minutes d\'ordre + Yâ Qawiyy × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Fath (48:4)',
          translation: 'C\'est Lui qui a fait descendre la sérénité dans les cœurs des croyants afin qu\'ils ajoutent une foi à leur foi. À Allah appartiennent les armées des cieux et de la terre. Allah est Omniscient et Sage.',
          tafsir: 'Ibn Kathir explique que la sérénité (sakîna) est une tranquillité et une paix qui descendent du ciel dans les cœurs des croyants. Al-Baghawi précise que cette sérénité renforce la foi et apporte la confiance en Allah. C\'est une miséricorde divine qui apaise les cœurs dans les moments difficiles.'
        },
        closingPhrase: 'Le silence nourrit ma puissance et ma baraka.'
      },
      {
        day: 17,
        title: 'CŒUR DISCIPLINÉ',
        tasks: [
          { description: 'Écrire ton progrès', type: 'writing' },
          { description: 'Lire Muhammad (47:7)', type: 'verse' },
          { description: 'Protéger ta parole du jour + Yâ Qawiyy × 99', type: 'action' }
        ],
        verse: {
          reference: 'Muhammad (47:7)',
          translation: 'Ô vous qui croyez ! Si vous secourez Allah, Il vous secourra et raffermira vos pas.',
          tafsir: 'Ibn Kathir explique que ce verset promet le secours d\'Allah à ceux qui Le secourent. Al-Baghawi précise que secourir Allah signifie suivre Sa guidance et défendre Sa religion, et qu\'Allah raffermit alors les pas des croyants.'
      },
        closingPhrase: 'Ma discipline est guidée et renforcée par Allah.'
      },
      {
        day: 18,
        title: 'KALWA YÂ QAWIYY',
        block: 'JOURS 18 — PIVOT & RENFORCEMENT',
        tasks: [
          { description: 'Kalwa : Yâ Qawiyy', type: 'kalwa' },
          { description: 'Lire Al-Baqara (2:286)', type: 'verse' },
          { description: 'Écrire : "Que veut Allah me rendre capable de faire ?"', type: 'writing' },
          { description: 'Choisir une discipline à renforcer', type: 'action' },
          { description: 'Respiration 3•6•9', type: 'breathing' }
        ],
        verse: {
          reference: 'Al-Baqara (2:286)',
          translation: 'Allah n\'impose à aucune âme une charge supérieure à sa capacité. Elle aura ce qu\'elle aura gagné, et elle subira ce qu\'elle aura gagné. Seigneur, ne nous tiens pas rigueur si nous oublions ou commettons une erreur. Seigneur, ne nous charge pas d\'un fardeau comme Tu l\'as fait pour ceux qui nous ont précédés. Seigneur, ne nous impose pas ce que nous ne pouvons supporter. Fais-nous grâce, pardonne-nous et fais-nous miséricorde. Tu es notre Maître, accorde-nous la victoire sur les peuples mécréants.',
          tafsir: 'Ibn Kathir explique que ce verset révèle la miséricorde d\'Allah qui n\'impose jamais à une âme plus qu\'elle ne peut supporter. Al-Baghawi précise que cette invocation enseigne la confiance en la miséricorde divine et la demande de pardon pour les erreurs involontaires. Al-Baydawi ajoute que ce verset est une supplication complète qui couvre tous les aspects de la vie du croyant et sa relation avec son Seigneur.'
      },
        closingPhrase: 'Je découvre mes capacités guidées par Allah et les renforce chaque jour.'
      },
      {
        day: 19,
        title: 'KALWA YÂ QAWIYY',
        block: 'JOURS 19 À 21 — FORCE & COURAGE',
        tasks: [
          { description: 'Kalwa : Yâ Qawiyy', type: 'kalwa' },
          { description: 'Lire Al-Anfal (8:46)', type: 'verse' },
          { description: 'Acte de courage', type: 'action' },
          { description: 'Mini-effort physique', type: 'action' },
          { description: 'Écrire : "Aujourd\'hui je suis fort avec Allah" + Yâ Qawiyy × 99', type: 'writing' }
        ],
        verse: {
          reference: 'Al-Anfal (8:46)',
          translation: 'Et obéissez à Allah et à Son messager, et ne vous disputez pas, sinon vous fléchirez et perdrez votre force. Et soyez endurants, car Allah est avec les endurants.',
          tafsir: 'Ibn Kathir explique que ce verset ordonne l\'obéissance à Allah et à Son messager, et interdit les disputes qui affaiblissent la communauté. Al-Baghawi précise que les disputes divisent et affaiblissent, tandis que l\'unité et l\'endurance renforcent. Al-Baydawi ajoute que l\'endurance (sabr) est une qualité essentielle qui mérite la compagnie d\'Allah.'
        },
        closingPhrase: 'Ma force est mon engagement et ma confiance en Allah.'
      },
      {
        day: 20,
        title: 'DISCIPLINE PROPRE',
        tasks: [
          { description: '15 minutes sur une seule tâche', type: 'action' },
          { description: 'Lire un rappel sur la patience', type: 'verse' },
          { description: 'Réduire une tentation', type: 'action' },
          { description: 'Écrire ton amélioration + Yâ Qawiyy × 99', type: 'writing' },
          { description: 'Hydratation + marche consciente', type: 'action' }
        ],
        closingPhrase: 'Chaque effort discipliné nettoie mon esprit et fortifie mon cœur.'
      },
      {
        day: 21,
        title: 'KALWA YÂ QAWIYY',
        tasks: [
          { description: 'Kalwa : Yâ Qawiyy', type: 'kalwa' },
          { description: 'Lire At-Tahrim (66:8)', type: 'verse' },
          { description: 'Action importante du jour', type: 'action' },
          { description: 'Exercice mental : "Je choisis ma vie"', type: 'action' },
          { description: 'Petit rangement symbolique', type: 'action' }
        ],
        verse: {
          reference: 'At-Tahrim (66:8)',
          translation: 'Ô vous qui croyez ! Repentez-vous à Allah d\'un repentir sincère. Il se peut que votre Seigneur efface vos fautes et vous fasse entrer dans des jardins sous lesquels coulent les ruisseaux, le jour où Allah n\'humiliera pas le Prophète et ceux qui ont cru avec lui. Leur lumière courra devant eux et à leur droite ; ils diront : "Seigneur, parfais-nous notre lumière et pardonne-nous. Tu es certes Omnipotent."',
          tafsir: 'Ibn Kathir explique que ce verset ordonne le repentir sincère et promet le pardon et les jardins. Al-Baghawi précise que le repentir sincère efface les péchés et ouvre la voie vers le Paradis.'
      },
        closingPhrase: 'Je choisis ma vie avec force, discipline et clarté intérieure.'
      },
      {
        day: 22,
        title: 'STABILISATION',
        block: 'JOURS 22 À 27 — STABILISATION & CONSTANCE',
        tasks: [
          { description: 'Lire un verset selon ton état', type: 'verse' },
          { description: 'Écrire une seule priorité du jour', type: 'writing' },
          { description: 'Ranger un espace', type: 'action' },
          { description: 'Boire de l\'eau + marcher 5 min', type: 'action' },
          { description: 'Ne pas repousser 1 effort important + Yâ Qawiyy × 99', type: 'action' }
        ],
        closingPhrase: 'La stabilité se construit par la constance, la clarté et le courage quotidien.'
      },
      {
        day: 23,
        title: 'STABILISATION',
        tasks: [
          { description: 'Lire un verset selon ton état', type: 'verse' },
          { description: 'Écrire une seule priorité du jour', type: 'writing' },
          { description: 'Ranger un espace', type: 'action' },
          { description: 'Boire de l\'eau + marcher 5 min', type: 'action' },
          { description: 'Ne pas repousser 1 effort important + Yâ Qawiyy × 99', type: 'action' }
        ],
        closingPhrase: 'La stabilité se construit par la constance, la clarté et le courage quotidien.'
      },
      {
        day: 24,
        title: 'STABILISATION',
        tasks: [
          { description: 'Lire un verset selon ton état', type: 'verse' },
          { description: 'Écrire une seule priorité du jour', type: 'writing' },
          { description: 'Ranger un espace', type: 'action' },
          { description: 'Boire de l\'eau + marcher 5 min', type: 'action' },
          { description: 'Ne pas repousser 1 effort important + Yâ Qawiyy × 99', type: 'action' }
        ],
        closingPhrase: 'La stabilité se construit par la constance, la clarté et le courage quotidien.'
      },
      {
        day: 25,
        title: 'STABILISATION',
        tasks: [
          { description: 'Lire un verset selon ton état', type: 'verse' },
          { description: 'Écrire une seule priorité du jour', type: 'writing' },
          { description: 'Ranger un espace', type: 'action' },
          { description: 'Boire de l\'eau + marcher 5 min', type: 'action' },
          { description: 'Ne pas repousser 1 effort important + Yâ Qawiyy × 99', type: 'action' }
        ],
        closingPhrase: 'La stabilité se construit par la constance, la clarté et le courage quotidien.'
      },
      {
        day: 26,
        title: 'STABILISATION',
        tasks: [
          { description: 'Lire un verset selon ton état', type: 'verse' },
          { description: 'Écrire une seule priorité du jour', type: 'writing' },
          { description: 'Ranger un espace', type: 'action' },
          { description: 'Boire de l\'eau + marcher 5 min', type: 'action' },
          { description: 'Ne pas repousser 1 effort important + Yâ Qawiyy × 99', type: 'action' }
        ],
        closingPhrase: 'La stabilité se construit par la constance, la clarté et le courage quotidien.'
      },
      {
        day: 27,
        title: 'KALWA YÂ QAWIYY',
        tasks: [
          { description: 'Kalwa : Yâ Qawiyy', type: 'kalwa' },
          { description: 'Lire Ash-Shûrâ (42:36)', type: 'verse' },
          { description: 'Acte de discipline clair', type: 'action' },
          { description: 'Le faire dans la journée', type: 'action' },
          { description: 'Écrire : "Quel domaine gagne de la force ?" + Yâ Qawiyy × 99', type: 'writing' }
        ],
        verse: {
          reference: 'Ash-Shûrâ (42:36)',
          translation: 'Tout ce qui vous a été donné n\'est que jouissance de la vie présente ; mais ce qui est auprès d\'Allah est meilleur et plus durable pour ceux qui ont cru et qui placent leur confiance en leur Seigneur.',
          tafsir: 'Ibn Kathir explique que ce verset rappelle que les biens de ce monde sont temporaires. Al-Baghawi précise que ce qui est auprès d\'Allah est meilleur et éternel pour ceux qui croient et placent leur confiance en Lui.'
      },
        closingPhrase: 'Ce que je construis avec Allah est éternel.'
      },
      {
        day: 28,
        title: 'STABILISATION FINALE',
        block: 'JOURS 28 À 36 — STABILISATION FINALE & MAÎTRISE',
        tasks: [
          { description: 'Tenir une prière à l\'heure', type: 'action' },
          { description: 'Choisir 1 discipline à garder à vie', type: 'action' },
          { description: 'Lire un passage de Yâ-Sîn', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui j\'ai accompli…" + Yâ Qawiyy × 99', type: 'writing' },
          { description: 'Réduire une distraction + lutter contre la paresse du matin', type: 'action' }
        ],
        closingPhrase: 'Chaque action répétée avec sincérité construit ma force durable.'
      },
      {
        day: 29,
        title: 'STABILISATION FINALE',
        tasks: [
          { description: 'Tenir une prière à l\'heure', type: 'action' },
          { description: 'Choisir 1 discipline à garder à vie', type: 'action' },
          { description: 'Lire un passage de Yâ-Sîn', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui j\'ai accompli…" + Yâ Qawiyy × 99', type: 'writing' },
          { description: 'Réduire une distraction + lutter contre la paresse du matin', type: 'action' }
        ],
        closingPhrase: 'Chaque action répétée avec sincérité construit ma force durable.'
      },
      {
        day: 30,
        title: 'STABILISATION FINALE',
        tasks: [
          { description: 'Tenir une prière à l\'heure', type: 'action' },
          { description: 'Choisir 1 discipline à garder à vie', type: 'action' },
          { description: 'Lire un passage de Yâ-Sîn', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui j\'ai accompli…" + Yâ Qawiyy × 99', type: 'writing' },
          { description: 'Réduire une distraction + lutter contre la paresse du matin', type: 'action' }
        ],
        closingPhrase: 'Chaque action répétée avec sincérité construit ma force durable.'
      },
      {
        day: 31,
        title: 'STABILISATION FINALE',
        tasks: [
          { description: 'Tenir une prière à l\'heure', type: 'action' },
          { description: 'Choisir 1 discipline à garder à vie', type: 'action' },
          { description: 'Lire un passage de Yâ-Sîn', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui j\'ai accompli…" + Yâ Qawiyy × 99', type: 'writing' },
          { description: 'Réduire une distraction + lutter contre la paresse du matin', type: 'action' }
        ],
        closingPhrase: 'Chaque action répétée avec sincérité construit ma force durable.'
      },
      {
        day: 32,
        title: 'STABILISATION FINALE',
        tasks: [
          { description: 'Tenir une prière à l\'heure', type: 'action' },
          { description: 'Choisir 1 discipline à garder à vie', type: 'action' },
          { description: 'Lire un passage de Yâ-Sîn', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui j\'ai accompli…" + Yâ Qawiyy × 99', type: 'writing' },
          { description: 'Réduire une distraction + lutter contre la paresse du matin', type: 'action' }
        ],
        closingPhrase: 'Chaque action répétée avec sincérité construit ma force durable.'
      },
      {
        day: 33,
        title: 'STABILISATION FINALE',
        tasks: [
          { description: 'Tenir une prière à l\'heure', type: 'action' },
          { description: 'Choisir 1 discipline à garder à vie', type: 'action' },
          { description: 'Lire un passage de Yâ-Sîn', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui j\'ai accompli…" + Yâ Qawiyy × 99', type: 'writing' },
          { description: 'Réduire une distraction + lutter contre la paresse du matin', type: 'action' }
        ],
        closingPhrase: 'Chaque action répétée avec sincérité construit ma force durable.'
      },
      {
        day: 34,
        title: 'STABILISATION FINALE',
        tasks: [
          { description: 'Tenir une prière à l\'heure', type: 'action' },
          { description: 'Choisir 1 discipline à garder à vie', type: 'action' },
          { description: 'Lire un passage de Yâ-Sîn', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui j\'ai accompli…" + Yâ Qawiyy × 99', type: 'writing' },
          { description: 'Réduire une distraction + lutter contre la paresse du matin', type: 'action' }
        ],
        closingPhrase: 'Chaque action répétée avec sincérité construit ma force durable.'
      },
      {
        day: 35,
        title: 'STABILISATION FINALE',
        tasks: [
          { description: 'Tenir une prière à l\'heure', type: 'action' },
          { description: 'Choisir 1 discipline à garder à vie', type: 'action' },
          { description: 'Lire un passage de Yâ-Sîn', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui j\'ai accompli…" + Yâ Qawiyy × 99', type: 'writing' },
          { description: 'Réduire une distraction + lutter contre la paresse du matin', type: 'action' }
        ],
        closingPhrase: 'Chaque action répétée avec sincérité construit ma force durable.'
      },
      {
        day: 36,
        title: 'KALWA YÂ QAWIYY',
        tasks: [
          { description: 'Kalwa : Yâ Qawiyy', type: 'kalwa' },
          { description: 'Lire Ash-Sharh (94:5–6)', type: 'verse' },
          { description: 'Respiration profonde', type: 'breathing' },
          { description: 'Écrire : "Qu\'ai-je construit ?"', type: 'writing' },
          { description: 'Acte de discipline symbolique + Yâ Qawiyy × 99', type: 'action' }
        ],
        verse: {
          reference: 'Ash-Sharh (94:5–6)',
          translation: 'À côté de la difficulté est certes une facilité. À côté de la difficulté est certes une facilité.',
          tafsir: 'Ibn Kathir explique que ce verset promet que chaque difficulté est suivie d\'une facilité. Al-Baghawi précise que cette promesse est répétée pour renforcer l\'espoir et que la facilité suit toujours la difficulté.'
      },
        closingPhrase: 'Tout ce que je bâtis aujourd\'hui est le fondement de ma baraka.'
      },
      {
        day: 37,
        title: 'KUN (Rupture)',
        block: 'BLOC FINAL — KUN • FA • YA • KUN',
        tasks: [
          { description: 'Lire Yâ-Sîn (77–81)', type: 'verse' },
          { description: 'Rompre une mauvaise habitude', type: 'action' },
          { description: 'Gros tri / rangement lié à cette habitude', type: 'action' },
          { description: 'Silence profond', type: 'breathing' },
          { description: 'Écrire ce que tu quittes + Yâ Qawiyy × 99', type: 'writing' }
        ],
        verse: {
          reference: 'Yâ-Sîn (77–81)',
          translation: 'L\'homme ne voit-il pas que Nous l\'avons créé d\'une goutte de sperme ? Et le voilà [devenu] un disputeur déclaré ! Il propose pour Nous un exemple, tandis qu\'il oublie sa propre création. Il dit : "Qui va faire revivre des ossements une fois réduits en poussière ?" Dis : "Celui qui les a créés une première fois les fera revivre. Il connaît parfaitement toute création."',
          tafsir: 'Ibn Kathir explique que ce passage rappelle à l\'homme sa création humble et sa résurrection future. Al-Baghawi précise que ces versets réfutent les doutes sur la résurrection en rappelant que Celui qui a créé l\'homme une première fois peut certainement le recréer. C\'est un rappel de la puissance absolue d\'Allah.'
        },
        closingPhrase: 'Je laisse derrière moi tout ce qui entrave ma force et ma lumière.'
      },
      {
        day: 38,
        title: 'FA (Ouverture)',
        tasks: [
          { description: 'Lire Yâ-Sîn (82)', type: 'verse' },
          { description: 'Introduire une nouvelle discipline', type: 'action' },
          { description: 'Écrire ton intention', type: 'writing' },
          { description: 'Faire la nouvelle discipline', type: 'action' },
          { description: 'Dire : "La hawla wa la quwwata illa billah" + Yâ Qawiyy × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Yâ-Sîn (82)',
          translation: 'Sa parole, quand Il veut une chose, est de dire : "Sois !" et elle est.',
          tafsir: 'Ibn Kathir explique que ce verset illustre la puissance absolue d\'Allah. Quand Il veut créer quelque chose, Il dit simplement "Sois !" (Kun) et cela existe immédiatement. Al-Baydawi précise que cela démontre que la création divine est instantanée et sans effort, contrairement à la création humaine qui nécessite du temps et des moyens.'
        },
        closingPhrase: 'Mon ouverture à la nouveauté est guidée par Allah et emplie de baraka.'
      },
      {
        day: 39,
        title: 'YA (Purification)',
        tasks: [
          { description: 'Lire Yâ-Sîn (83)', type: 'verse' },
          { description: 'Astaghfirullah × 99', type: 'dhikr' },
          { description: 'Purification du comportement', type: 'action' },
          { description: 'Écrire : "Où ai-je manqué de discipline ?"', type: 'writing' },
          { description: 'Acte de réparation', type: 'action' }
        ],
        verse: {
          reference: 'Yâ-Sîn (83)',
          translation: 'Gloire à Celui qui détient en Sa main la royauté sur toute chose, et c\'est vers Lui que vous serez ramenés.',
          tafsir: 'Ibn Kathir explique que ce verset proclame la souveraineté absolue d\'Allah sur toute chose. Toute la création retournera vers Lui pour le jugement. Al-Baghawi précise que "la royauté" (mulk) signifie ici le pouvoir et la domination absolue sur toute chose, et que le retour vers Allah est inévitable pour tous.'
        },
        closingPhrase: 'Je me purifie pour accueillir la force et la lumière d\'Allah.'
      },
      {
        day: 40,
        title: 'KUN FINAL — SCEAU',
        tasks: [
          { description: 'Kalwa : Yâ Allah', type: 'kalwa' },
          { description: 'Nûr & Shifa : Ayat Al-Kursi + 3 Qul + Eau / miel / musc', type: 'action' },
          { description: 'Écrire ton plan des 40 prochains jours + Yâ Qawiyy × 99', type: 'writing' },
          { description: '2 rakaat', type: 'action' },
          { description: 'Aumône', type: 'action' }
        ],
        verse: {
          reference: 'Al-Baqara (2:255) - Ayat Al-Kursi',
          translation: 'Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. À Lui appartient tout ce qui est dans les cieux et sur la terre. Qui peut intercéder auprès de Lui sans Sa permission ? Il connaît leur passé et leur futur. Et, de Sa science, ils n\'embrassent que ce qu\'Il veut. Son Trône déborde les cieux et la terre, dont la garde ne Lui coûte aucune peine. Et Il est le Très Haut, le Très Grand.',
          tafsir: 'Ibn Kathir explique qu\'Ayat Al-Kursi est le plus grand verset du Coran. Il proclame l\'unicité absolue d\'Allah, Sa vie éternelle, Sa subsistance par Lui-même, et Sa souveraineté totale. Al-Baghawi précise que ce verset protège celui qui le récite et affirme la grandeur et la majesté d\'Allah au-dessus de toute Sa création.'
        },
        closingPhrase: 'Mon voyage de discipline et de baraka atteint son sceau : force, lumière et direction pour les jours à venir.'
      }
    ]
  },
  {
    id: 'latif',
    title: 'PURETÉ DE L\'ESPRIT',
    emoji: '🌿',
    attribute: 'Yâ Latîf',
    attributeArabic: 'اللطيف',
    description: '40 jours pour purifier et apaiser ton esprit.',
    color: '#27AE60',
    days: [
      {
        day: 1,
        title: 'OUVERTURE & ANCRAGE',
        block: 'JOURS 1 À 3 — OUVERTURE',
        tasks: [
          { description: 'Kalwa : Yâ Allah', type: 'kalwa' },
          { description: 'Nûr & Shifa : Al-Fâtiha dans l\'eau', type: 'action' },
          { description: 'Écriture + Discipline : "Qu\'est-ce qui charge mon esprit ?"', type: 'writing' }
        ],
        verse: {
          reference: 'Al-Fâtiha (1:1–7)',
          translation: 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux. Louange à Allah, Seigneur de l\'univers. Le Tout Miséricordieux, le Très Miséricordieux. Maître du Jour de la rétribution. C\'est Toi que nous adorons, et c\'est Toi dont nous implorons secours. Guide-nous dans le droit chemin, le chemin de ceux que Tu as comblés de Tes bienfaits, non pas de ceux qui ont encouru Ta colère, ni des égarés.',
          tafsir: 'Ibn Kathir explique qu\'Al-Fâtiha est la mère du Coran et contient tous les sens du Livre. Al-Baghawi précise que cette sourate comprend la louange d\'Allah, l\'affirmation de Sa seigneurie, l\'unicité dans l\'adoration, la demande de guidance, et la distinction entre les bienheureux et les égarés. Al-Baydawi ajoute que "le droit chemin" (as-sirât al-mustaqîm) est l\'Islam, et que cette sourate est récitée dans chaque rak\'a de la prière car elle résume toute la guidance divine.'
        },
        closingPhrase: 'Aujourd\'hui, j\'ouvre mon esprit à la clarté divine. Mon cœur s\'allège, ma baraka se déploie.'
      },
      {
        day: 2,
        title: 'APAISEMENT LÉGER',
        block: 'JOURS 1 À 3 — OUVERTURE',
        tasks: [
          { description: 'Écris 3 pensées qui tournent en boucle pour les identifier', type: 'writing' },
          { description: 'Lis Ar-Ra\'d 13:28', type: 'verse' },
          { description: 'Dhikr : Astaghfirullah × 99 + ranger un petit espace visuel', type: 'dhikr' }
        ],
        verse: {
          reference: 'Ar-Ra\'d (13:28)',
          translation: 'Ceux qui ont cru et dont les cœurs se tranquillisent à l\'évocation d\'Allah. N\'est-ce point par l\'évocation d\'Allah que se tranquillisent les cœurs ?',
          tafsir: 'Ibn Kathir explique que ce verset révèle le secret de la tranquillité du cœur. Le dhikr (évocation) d\'Allah apaise les cœurs et dissipe l\'anxiété. Al-Baghawi précise que la tranquillité du cœur vient uniquement du rappel d\'Allah, et que rien d\'autre ne peut apporter cette paix intérieure profonde.'
        },
        closingPhrase: 'Je laisse la paix d\'Allah pénétrer chaque pensée et chaque recoin de mon esprit. Mon cœur se calme et ma clarté intérieure augmente.'
      },
      {
        day: 3,
        title: 'KALWA YÂ LATÎF',
        tasks: [
          { description: 'Kalwa : Yâ Latîf', type: 'kalwa' },
          { description: 'Visualisation : une brise douce traverse ton esprit', type: 'action' },
          { description: 'Écris : "Qu\'est-ce qui s\'est apaisé aujourd\'hui ?"', type: 'writing' }
        ],
        verse: {
          reference: 'Ash-Shûrâ (42:19)',
          translation: 'Allah est Doux envers Ses serviteurs. Il attribue Ses dons à qui Il veut. Il est le Fort, Le Tout-Puissant.',
          tafsir: 'Ibn Kathir explique que ce verset proclame la douceur d\'Allah envers Ses serviteurs. Al-Baghawi précise que la douceur (lutf) d\'Allah se manifeste dans Sa miséricorde et Sa bienveillance envers ceux qui L\'invoquent.'
      },
        closingPhrase: 'Aujourd\'hui, mon esprit s\'adoucit et se remplit de sérénité. Je me sens guidé par la douceur divine.'
      },
      {
        day: 4,
        title: 'VIDAGE MENTAL',
        block: 'JOURS 4 À 9 — APAISEMENT MENTAL',
        tasks: [
          { description: 'Écriture 2 minutes : "Je vide mon esprit de toute agitation."', type: 'writing' },
          { description: 'Lire At-Tawba 9:40', type: 'verse' },
          { description: 'Dhikr : La hawla wa la quwwata illa billah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'At-Tawba (9:40)',
          translation: 'Si vous ne lui portez pas secours, Allah l\'a déjà secouru lorsque ceux qui ne croyaient pas l\'avaient banni, deuxième de deux. Quand ils étaient dans la grotte et qu\'il disait à son compagnon : "Ne t\'afflige pas, car Allah est avec nous." Allah fit alors descendre Sa sérénité sur lui et le secourut de troupes que vous ne voyiez pas, et Il abaissa la parole de ceux qui ne croyaient pas. Et la parole d\'Allah est la plus haute. Allah est Puissant et Sage.',
          tafsir: 'Ibn Kathir explique que ce verset relate l\'épisode de la grotte lors de l\'Hégire du Prophète ﷺ avec Abu Bakr. Al-Baghawi précise que cette histoire enseigne que la compagnie d\'Allah est la meilleure protection, et que la sérénité (sakîna) divine descend sur ceux qui placent leur confiance en Lui. Al-Baydawi ajoute que ce récit montre comment Allah protège Ses serviteurs même dans les moments les plus difficiles, et que la parole d\'Allah triomphe toujours.'
        },
        closingPhrase: 'Chaque pensée encombrante se dissout, laissant place à la clarté et à la lumière de mon esprit.'
      },
      {
        day: 5,
        title: 'PROTECTION DU MENTAL',
        tasks: [
          { description: 'Éloigne-toi d\'une source mentale toxique ou stressante', type: 'action' },
          { description: 'Lire Yunus 10:57', type: 'verse' },
          { description: 'Silence 1 minute, visualise ton esprit entouré de lumière protectrice', type: 'breathing' }
        ],
        verse: {
          reference: 'Yunus (10:57)',
          translation: 'Ô gens ! Une exhortation vous est venue de votre Seigneur, une guérison pour ce qui est dans les poitrines, un guide et une miséricorde pour les croyants.',
          tafsir: 'Ibn Kathir explique que ce verset décrit le Coran comme une guérison pour les cœurs. Al-Baghawi précise que le Coran guérit les maladies du cœur, guide vers la vérité, et est une miséricorde pour les croyants.'
        },
        closingPhrase: 'Mon esprit est un sanctuaire sacré. Je le protège de toute négativité et accueille la paix.'
      },
      {
        day: 6,
        title: 'RESPIRATION & CLARTÉ',
        tasks: [
          { description: 'Respiration profonde 3•6•9', type: 'breathing' },
          { description: 'Lire Al-Inshirah 94:5–6', type: 'verse' },
          { description: 'Ranger un petit espace ou organiser un objet', type: 'action' }
        ],
        verse: {
          reference: 'Al-Inshirah (94:5–6)',
          translation: 'À côté de la difficulté est une facilité. À côté de la difficulté est une facilité.',
          tafsir: 'Ibn Kathir explique que ce verset promet que chaque difficulté est suivie d\'une facilité. Al-Baghawi précise que cette promesse est répétée pour renforcer l\'espoir et que la facilité suit toujours la difficulté.'
        },
        closingPhrase: 'Je choisis de respirer la lumière et de libérer mon esprit de tout chaos intérieur.'
      },
      {
        day: 7,
        title: 'APAISEMENT DU CŒUR',
        tasks: [
          { description: 'Marcher 3 minutes en silence, en ressentant chaque pas', type: 'action' },
          { description: 'Lire Ar-Rahman 55:13', type: 'verse' },
          { description: 'Écris : "Ce qui me fatigue intérieurement"', type: 'writing' }
        ],
        verse: {
          reference: 'Ar-Rahman (55:13)',
          translation: 'Lequel des bienfaits de votre Seigneur nierez-vous ?',
          tafsir: 'Ibn Kathir explique que ce verset répété dans la sourate Ar-Rahman rappelle les innombrables bienfaits d\'Allah. Al-Baghawi précise que cette répétition invite à la réflexion et à la gratitude pour tous les bienfaits divins.'
        },
        closingPhrase: 'Mon cœur s\'apaise et s\'harmonise avec la douceur de la création et de mon Créateur.'
      },
      {
        day: 8,
        title: 'LÂCHER PRISE',
        tasks: [
          { description: 'Écrire 2 minutes : "Ce que je dois laisser aller."', type: 'writing' },
          { description: 'Lire Az-Zumar 39:53', type: 'verse' },
          { description: 'Dhikr : Yâ Latîf × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Az-Zumar (39:53)',
          translation: 'Dis : "Ô Mes serviteurs qui avez commis des excès à votre propre détriment, ne désespérez pas de la miséricorde d\'Allah. Car Allah pardonne tous les péchés. Oui, c\'est Lui le Pardonneur, le Très Miséricordieux."',
          tafsir: 'Ibn Kathir explique que ce verset interdit le désespoir de la miséricorde d\'Allah. Al-Baghawi précise qu\'Allah pardonne tous les péchés à ceux qui se repentent, et qu\'il ne faut jamais désespérer de Sa miséricorde. Al-Baydawi ajoute que ce verset est une source d\'espoir pour tous les pécheurs et encourage le repentir sincère.'
        },
        closingPhrase: 'Je relâche ce qui ne m\'appartient pas et ouvre mon esprit à la sérénité et à la miséricorde d\'Allah.'
      },
      {
        day: 9,
        title: 'KALWA YÂ LATÎF',
        tasks: [
          { description: 'Kalwa : Yâ Latîf', type: 'kalwa' },
          { description: 'Exercice : identifier la source principale de stress dans ton esprit', type: 'action' },
          { description: 'Visualisation : lumière douce dans la tête et la poitrine', type: 'action' }
        ],
        verse: {
          reference: 'An-Nur (24:35)',
          translation: 'Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un cristal, et celui-ci ressemble à un astre brillant. Son combustible vient d\'un arbre béni : un olivier ni oriental ni occidental, dont l\'huile semble éclairer sans que le feu ne la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose des paraboles aux gens, et Allah est Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset décrit la lumière de la guidance divine. La niche représente le cœur du croyant, la lampe est la foi, le cristal symbolise la clarté et la pureté, et l\'huile pure représente la sincérité. "Lumière sur lumière" signifie la lumière de la révélation combinée à la lumière de la foi dans le cœur. Al-Baydawi précise que cette parabole illustre comment la guidance divine éclaire le cœur du croyant.'
        },
        closingPhrase: 'Chaque pensée trouve sa lumière et chaque tension s\'adoucit. Mon esprit devient clair comme une eau pure.'
      },
      {
        day: 10,
        title: '1 PENSÉE → 1 SOLUTION',
        block: 'JOURS 10 À 17 — PURIFICATION MENTALE',
        tasks: [
          { description: 'Choisis 1 pensée lourde → cherche une solution simple', type: 'action' },
          { description: 'Lire Al-Baqara 2:286', type: 'verse' },
          { description: 'Silence intérieur 2 minutes, visualise la résolution', type: 'breathing' },
          { description: 'Dhikr : Yâ Latîf × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-Baqara (2:286)',
          translation: 'Allah n\'impose à aucune âme une charge supérieure à sa capacité. Elle aura ce qu\'elle aura gagné, et elle subira ce qu\'elle aura gagné. Seigneur, ne nous tiens pas rigueur si nous oublions ou commettons une erreur. Seigneur, ne nous charge pas d\'un fardeau comme Tu l\'as fait pour ceux qui nous ont précédés. Seigneur, ne nous impose pas ce que nous ne pouvons supporter. Fais-nous grâce, pardonne-nous et fais-nous miséricorde. Tu es notre Maître, accorde-nous la victoire sur les peuples mécréants.',
          tafsir: 'Ibn Kathir explique que ce verset révèle la miséricorde d\'Allah qui n\'impose jamais à une âme plus qu\'elle ne peut supporter. Al-Baghawi précise que cette invocation enseigne la confiance en la miséricorde divine et la demande de pardon pour les erreurs involontaires. Al-Baydawi ajoute que ce verset est une supplication complète qui couvre tous les aspects de la vie du croyant et sa relation avec son Seigneur.'
        },
        closingPhrase: 'Chaque problème est une opportunité de purifier mon esprit et d\'augmenter ma force intérieure.'
      },
      {
        day: 11,
        title: 'APAISER L\'ANGOISSE',
        tasks: [
          { description: 'Éloigne-toi d\'une source d\'angoisse ou de tension mentale', type: 'action' },
          { description: 'Lire Al-A\'raf 7:156', type: 'verse' },
          { description: 'Dhikr : Astaghfirullah × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'Al-A\'râf (7:156)',
          translation: 'Et inscris pour nous un bien en ce monde et dans l\'Au-delà. Nous voilà revenus vers Toi. Il dit : "Je frappe de Mon châtiment qui Je veux, mais Ma miséricorde embrasse toute chose. Je l\'inscris donc pour ceux qui Me craignent, acquittent la zakat, et ont foi en Nos signes."',
          tafsir: 'Ibn Kathir explique que ce verset révèle l\'immensité de la miséricorde divine qui embrasse toute chose. Al-Qurtubi précise que la miséricorde d\'Allah précède et dépasse Son châtiment. Ceux qui bénéficient de cette miséricorde sont ceux qui craignent Allah (taqwa), accomplissent la zakat (purification des biens), et croient aux signes divins.'
        },
        closingPhrase: 'La miséricorde d\'Allah remplit mon cœur et mon esprit de calme et de clarté.'
      },
      {
        day: 12,
        title: 'CALMER LE BRUIT',
        tasks: [
          { description: 'Évite une dispute ou une situation stressante', type: 'action' },
          { description: 'Lire Fussilat 41:34', type: 'verse' },
          { description: 'Écris : "Une peur que je remets à Allah"', type: 'writing' }
        ],
        verse: {
          reference: 'Fussilat (41:34)',
          translation: 'La bonne action et la mauvaise action ne sont pas pareilles. Repousse [le mal] par ce qui est meilleur ; et voilà que celui avec qui tu avais une animosité devient tel un ami chaleureux.',
          tafsir: 'Ibn Kathir explique que ce verset ordonne de répondre au mal par le bien. Al-Baghawi précise que cette approche transforme les ennemis en amis et apporte la paix dans les relations.'
        },
        closingPhrase: 'Je transforme chaque agitation en lumière et en paix intérieure.'
      },
      {
        day: 13,
        title: 'REMPLACER UNE PENSÉE',
        tasks: [
          { description: 'Remplace une pensée négative par une pensée saine et lumineuse', type: 'action' },
          { description: 'Lire An-Nahl 16:97', type: 'verse' },
          { description: 'Dhikr : Yâ Latîf × 99', type: 'dhikr' }
        ],
        verse: {
          reference: 'An-Nahl (16:97)',
          translation: 'Quiconque, mâle ou femelle, fait une bonne œuvre tout en étant croyant, Nous lui ferons vivre une bonne vie. Et Nous les récompenserons, certes, en fonction des meilleures de leurs actions.',
          tafsir: 'Ibn Kathir explique que ce verset promet une bonne vie à ceux qui font de bonnes œuvres avec foi. Al-Baghawi précise que cette bonne vie comprend la paix intérieure, la sérénité et la satisfaction dans ce monde, ainsi que la récompense dans l\'au-delà.'
        },
        closingPhrase: 'Je choisis les pensées qui nourrissent mon esprit et apaisent mon cœur.'
      },
      {
        day: 14,
        title: 'APAISEMENT INTÉRIEUR',
        tasks: [
          { description: 'Silence intérieur 2 minutes', type: 'breathing' },
          { description: 'Lire Âl \'Imran 3:139', type: 'verse' },
          { description: 'Écris : "Mon esprit mérite le calme"', type: 'writing' }
        ],
        verse: {
          reference: 'Âl \'Imran (3:139)',
          translation: 'Ne vous affligez point et ne soyez pas faibles, et vous serez les plus hauts si vous êtes croyants.',
          tafsir: 'Ibn Kathir explique que ce verset interdit l\'affliction et la faiblesse aux croyants. Al-Baghawi précise que les croyants doivent être forts et confiants, car ils seront élevés s\'ils maintiennent leur foi.'
        },
        closingPhrase: 'Je me connecte à la douceur divine et laisse mon esprit se stabiliser.'
      },
      {
        day: 15,
        title: 'FOCUS',
        tasks: [
          { description: 'Concentre-toi sur une seule tâche essentielle', type: 'action' },
          { description: 'Lire Al-Baqara 2:152', type: 'verse' },
          { description: 'Ranger un espace mental ou visuel', type: 'action' }
        ],
        verse: {
          reference: 'Al-Baqara (2:152)',
          translation: 'Rappelez-vous de Moi, Je Me rappellerai de vous. Remerciez-Moi et ne soyez pas ingrats envers Moi.',
          tafsir: 'Ibn Kathir explique que ce verset établit la relation de rappel mutuel entre Allah et Ses serviteurs. Al-Baghawi précise que se souvenir d\'Allah attire Son rappel et Sa miséricorde, et que la gratitude est essentielle.'
        },
        closingPhrase: 'Ma concentration nourrit la clarté de mon esprit et la douceur de mon cœur.'
      },
      {
        day: 16,
        title: 'PURETÉ',
        tasks: [
          { description: 'Écris : "Ce que j\'ai laissé tomber émotionnellement."', type: 'writing' },
          { description: 'Lire Az-Zumar 39:23', type: 'verse' },
          { description: 'Respiration lente, visualise la purification de tes émotions', type: 'breathing' }
        ],
        verse: {
          reference: 'Az-Zumar (39:23)',
          translation: 'Allah a fait descendre le plus beau récit, un Livre dont [certains versets] se ressemblent et se répètent. Les peaux de ceux qui redoutent leur Seigneur frissonnent à sa lecture, puis leurs peaux et leurs cœurs s\'apaisent au rappel d\'Allah. Voilà la guidance d\'Allah par laquelle Il guide qui Il veut. Et quiconque Allah égare n\'a point de guide.',
          tafsir: 'Ibn Kathir explique que ce verset décrit l\'effet du Coran sur les cœurs pieux. Al-Baghawi précise que le Coran fait frissonner les peaux par crainte, puis apaise les cœurs par la guidance et la miséricorde. Al-Baydawi ajoute que "le plus beau récit" fait référence au Coran, et que sa répétition de certains versets renforce leur impact sur les cœurs.'
        },
        closingPhrase: 'Chaque émotion négative est transformée en lumière, mon esprit s\'allège.'
      },
      {
        day: 17,
        title: 'CALME PROFOND',
        tasks: [
          { description: 'Protéger ta parole du jour', type: 'action' },
          { description: 'Lire Al-Fath 48:4', type: 'verse' },
          { description: 'Écris ton progrès, ce que ton esprit a gagné en paix et douceur', type: 'writing' }
        ],
        verse: {
          reference: 'Al-Fath (48:4)',
          translation: 'C\'est Lui qui a fait descendre la sérénité dans les cœurs des croyants afin qu\'ils ajoutent une foi à leur foi. À Allah appartiennent les armées des cieux et de la terre. Allah est Omniscient et Sage.',
          tafsir: 'Ibn Kathir explique que la sérénité (sakîna) est une tranquillité et une paix qui descendent du ciel dans les cœurs des croyants. Al-Baghawi précise que cette sérénité renforce la foi et apporte la confiance en Allah. C\'est une miséricorde divine qui apaise les cœurs dans les moments difficiles.'
      },
        closingPhrase: 'Mon esprit est un havre de sérénité, mon cœur respire la douceur divine.'
      },
      {
        day: 18,
        title: 'KALWA YÂ LATÎF',
        block: 'JOUR 18 — PIVOT (5 tâches)',
        tasks: [
          { description: 'Kalwa : Yâ Latîf', type: 'kalwa' },
          { description: 'Lire Al-Baqara 2:256', type: 'verse' },
          { description: 'Écrire : "Qu\'est-ce que je dois laisser aller ?"', type: 'writing' },
          { description: 'Silence intérieur 2 minutes, visualisation d\'une bulle de protection mentale', type: 'breathing' },
          { description: 'Respiration 3•6•9', type: 'breathing' }
        ],
        verse: {
          reference: 'Al-Baqara (2:256)',
          translation: 'Nulle contrainte en religion ! Car le bon chemin s\'est distingué de l\'égarement. Donc, quiconque mécroit au Rebelle tandis qu\'il croit en Allah saisit l\'anse la plus solide, qui ne peut se briser. Et Allah est Audient et Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset établit qu\'il n\'y a pas de contrainte en religion, car la vérité s\'est distinguée de l\'erreur. Al-Baghawi précise que "l\'anse la plus solide" (al-\'urwat al-wuthqa) fait référence à la foi en Allah et au rejet du Taghout. Al-Baydawi ajoute que ce verset abroge l\'obligation de combattre les gens du Livre jusqu\'à ce qu\'ils acceptent l\'Islam, et établit la liberté de croyance.'
      },
        closingPhrase: 'Je lâche ce qui ne m\'appartient pas et fais de mon esprit un lieu de pureté et de sérénité.'
      },
      {
        day: 19,
        title: 'KALWA YÂ LATÎF',
        block: 'JOURS 19 À 21 — DOUCEUR INTÉRIEURE',
        tasks: [
          { description: 'Kalwa : Yâ Latîf', type: 'kalwa' },
          { description: 'Lire Yunus 10:62–63', type: 'verse' },
          { description: 'Écrire : "Une épine mentale que je retire aujourd\'hui."', type: 'writing' },
          { description: 'Respiration lente et profonde, visualise ton esprit libéré', type: 'breathing' },
          { description: 'Ranger un coin ou organiser un petit espace', type: 'action' }
        ],
        verse: {
          reference: 'Yunus (10:62–63)',
          translation: 'En vérité, les alliés d\'Allah n\'ont ni peur ni tristesse. Ceux qui ont cru et qui étaient pieux, ils auront une bonne nouvelle dans la vie présente et dans l\'au-delà. Il n\'y aura pas de changement aux paroles d\'Allah. Voilà l\'énorme succès.',
          tafsir: 'Ibn Kathir explique que les alliés d\'Allah (awliya) sont ceux qui croient et sont pieux. Ils n\'ont ni peur de l\'avenir ni tristesse du passé. Al-Baghawi précise que cette promesse s\'applique à ceux qui remplissent les conditions de la foi et de la piété.'
        },
        closingPhrase: 'Aujourd\'hui, je retire ce qui me pèse et accueille la douceur divine dans chaque pensée.'
      },
      {
        day: 20,
        title: 'APAISEMENT COMPLET',
        tasks: [
          { description: 'Ne pas se juger pour les pensées passées', type: 'action' },
          { description: 'Lire Ar-Ra\'d 13:28', type: 'verse' },
          { description: 'Faire une action relaxante ou déstressante', type: 'action' },
          { description: 'Écrire : "Mon esprit mérite la paix."', type: 'writing' },
          { description: 'Petite marche ou mouvement conscient', type: 'action' }
        ],
        verse: {
          reference: 'Ar-Ra\'d (13:28)',
          translation: 'Ceux qui ont cru et dont les cœurs se tranquillisent à l\'évocation d\'Allah. N\'est-ce point par l\'évocation d\'Allah que se tranquillisent les cœurs ?',
          tafsir: 'Ibn Kathir explique que ce verset révèle le secret de la tranquillité du cœur. Le dhikr (évocation) d\'Allah apaise les cœurs et dissipe l\'anxiété. Al-Baghawi précise que la tranquillité du cœur vient uniquement du rappel d\'Allah, et que rien d\'autre ne peut apporter cette paix intérieure profonde.'
        },
        closingPhrase: 'Je choisis de me libérer du jugement et de nourrir mon esprit de paix et de sérénité.'
      },
      {
        day: 21,
        title: 'KALWA YÂ LATÎF',
        tasks: [
          { description: 'Kalwa : Yâ Latîf', type: 'kalwa' },
          { description: 'Lire An-Nur 24:35', type: 'verse' },
          { description: 'Faire un acte de calme : boire une tasse d\'eau lentement ou méditer', type: 'action' },
          { description: 'Visualisation : douceur mentale et lumière dans chaque coin de ton esprit', type: 'action' },
          { description: 'Silence 1 minute, ancrage profond', type: 'breathing' }
        ],
        verse: {
          reference: 'An-Nûr (24:35)',
          translation: 'Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un cristal, et celui-ci ressemble à un astre brillant. Son combustible vient d\'un arbre béni : un olivier ni oriental ni occidental, dont l\'huile semble éclairer sans que le feu ne la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose des paraboles aux gens, et Allah est Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset décrit la lumière de la guidance divine. La niche représente le cœur du croyant, la lampe est la foi, le cristal symbolise la clarté et la pureté, et l\'huile pure représente la sincérité. "Lumière sur lumière" signifie la lumière de la révélation combinée à la lumière de la foi dans le cœur. Al-Baydawi précise que cette parabole illustre comment la guidance divine éclaire le cœur du croyant.'
        },
        closingPhrase: 'Mon esprit est une lumière qui rayonne, chaque pensée est éclairée par la douceur divine.'
      },
      {
        day: 22,
        title: 'APAISEMENT QUOTIDIEN',
        block: 'JOURS 22 À 27 — APAISEMENT QUOTIDIEN',
        tasks: [
          { description: 'Lire un verset selon ton état mental', type: 'verse' },
          { description: 'Écrire une seule pensée claire qui guidera ta journée', type: 'writing' },
          { description: 'Ranger un espace physique ou mental', type: 'action' },
          { description: 'Dire : "Ô Allah, calme mon esprit" et méditer quelques instants', type: 'dhikr' },
          { description: 'Réduire une surcharge mentale', type: 'action' }
        ],
        closingPhrase: 'Je choisis chaque jour de calmer mon esprit, d\'apaiser mes pensées et de vivre dans la clarté et la légèreté.'
      },
      {
        day: 23,
        title: 'APAISEMENT QUOTIDIEN',
        tasks: [
          { description: 'Lire un verset selon ton état mental', type: 'verse' },
          { description: 'Écrire une seule pensée claire qui guidera ta journée', type: 'writing' },
          { description: 'Ranger un espace physique ou mental', type: 'action' },
          { description: 'Dire : "Ô Allah, calme mon esprit" et méditer quelques instants', type: 'dhikr' },
          { description: 'Réduire une surcharge mentale', type: 'action' }
        ],
        closingPhrase: 'Je choisis chaque jour de calmer mon esprit, d\'apaiser mes pensées et de vivre dans la clarté et la légèreté.'
      },
      {
        day: 24,
        title: 'APAISEMENT QUOTIDIEN',
        tasks: [
          { description: 'Lire un verset selon ton état mental', type: 'verse' },
          { description: 'Écrire une seule pensée claire qui guidera ta journée', type: 'writing' },
          { description: 'Ranger un espace physique ou mental', type: 'action' },
          { description: 'Dire : "Ô Allah, calme mon esprit" et méditer quelques instants', type: 'dhikr' },
          { description: 'Réduire une surcharge mentale', type: 'action' }
        ],
        closingPhrase: 'Je choisis chaque jour de calmer mon esprit, d\'apaiser mes pensées et de vivre dans la clarté et la légèreté.'
      },
      {
        day: 25,
        title: 'APAISEMENT QUOTIDIEN',
        tasks: [
          { description: 'Lire un verset selon ton état mental', type: 'verse' },
          { description: 'Écrire une seule pensée claire qui guidera ta journée', type: 'writing' },
          { description: 'Ranger un espace physique ou mental', type: 'action' },
          { description: 'Dire : "Ô Allah, calme mon esprit" et méditer quelques instants', type: 'dhikr' },
          { description: 'Réduire une surcharge mentale', type: 'action' }
        ],
        closingPhrase: 'Je choisis chaque jour de calmer mon esprit, d\'apaiser mes pensées et de vivre dans la clarté et la légèreté.'
      },
      {
        day: 26,
        title: 'APAISEMENT QUOTIDIEN',
        tasks: [
          { description: 'Lire un verset selon ton état mental', type: 'verse' },
          { description: 'Écrire une seule pensée claire qui guidera ta journée', type: 'writing' },
          { description: 'Ranger un espace physique ou mental', type: 'action' },
          { description: 'Dire : "Ô Allah, calme mon esprit" et méditer quelques instants', type: 'dhikr' },
          { description: 'Réduire une surcharge mentale', type: 'action' }
        ],
        closingPhrase: 'Je choisis chaque jour de calmer mon esprit, d\'apaiser mes pensées et de vivre dans la clarté et la légèreté.'
      },
      {
        day: 27,
        title: 'KALWA YÂ LATÎF',
        tasks: [
          { description: 'Kalwa : Yâ Latîf', type: 'kalwa' },
          { description: 'Lire Fussilat 41:46', type: 'verse' },
          { description: 'Écrire : "Qu\'est-ce qui m\'a ramené du stress ?"', type: 'writing' },
          { description: 'Adoucir la parole, parler avec douceur à soi et aux autres', type: 'action' },
          { description: 'Silence intérieur 2 minutes, visualisation de lumière douce', type: 'breathing' }
        ],
        verse: {
          reference: 'Fussilat (41:46)',
          translation: 'Quiconque fait le bien, c\'est pour lui-même ; et quiconque fait le mal, c\'est contre lui-même. Ton Seigneur n\'est point injuste envers les serviteurs.',
          tafsir: 'Ibn Kathir explique que ce verset établit que chaque action a ses conséquences. Al-Baghawi précise que le bien profite à celui qui le fait, et le mal nuit à celui qui le commet, et qu\'Allah n\'est jamais injuste.'
      },
        closingPhrase: 'Je prends conscience de ma transformation intérieure. Mon esprit est plus clair, mon cœur plus apaisé.'
      },
      {
        day: 28,
        title: 'DÉPOSER UNE PENSÉE LOURDE',
        block: 'JOURS 28 À 36 — STABILISATION & NETTOYAGE',
        tasks: [
          { description: 'Choisir une pensée lourde et la remettre à Allah', type: 'action' },
          { description: 'Lire un passage de Yâ-Sîn', type: 'verse' },
          { description: 'Silence 2 minutes, respiration consciente', type: 'breathing' },
          { description: 'Écrire : "Ce que je choisis de ne plus penser."', type: 'writing' },
          { description: 'Réduire un bruit mental ou visuel', type: 'action' }
        ],
        verse: {
          reference: 'Yâ-Sîn (36:1)',
          translation: 'Yâ-Sîn. Par le Coran plein de sagesse.',
          tafsir: 'Ibn Kathir explique que Yâ-Sîn est l\'une des lettres mystérieuses du Coran. Al-Baghawi précise que cette sourate est appelée "le cœur du Coran" et qu\'elle contient des leçons profondes sur la résurrection et la guidance.'
        },
        closingPhrase: 'Je dépose mes pensées lourdes et accueille la légèreté divine.'
      },
      {
        day: 29,
        title: 'PAIX INTÉRIEURE',
        tasks: [
          { description: 'Ranger un petit espace autour de soi', type: 'action' },
          { description: 'Lire un passage d\'Ash-Sharh 94:5–6', type: 'verse' },
          { description: 'Écrire : "Aujourd\'hui je choisis le calme."', type: 'writing' },
          { description: '3 minutes de respiration lente', type: 'breathing' },
          { description: 'Petit geste de bienveillance', type: 'action' }
        ],
        verse: {
          reference: 'Ash-Sharh (94:5–6)',
          translation: 'À côté de la difficulté est certes une facilité. À côté de la difficulté est certes une facilité.',
          tafsir: 'Ibn Kathir explique que ce verset promet que chaque difficulté est suivie d\'une facilité. Al-Baghawi précise que cette promesse est répétée pour renforcer l\'espoir et que la facilité suit toujours la difficulté.'
        },
        closingPhrase: 'La paix intérieure grandit dans le calme et la douceur.'
      },
      {
        day: 30,
        title: 'PURETÉ DU CŒUR',
        tasks: [
          { description: 'Écrire ce qui a pesé sur le cœur récemment', type: 'writing' },
          { description: 'Lire Az-Zumar 39:23', type: 'verse' },
          { description: 'Silence intérieur 2 minutes', type: 'breathing' },
          { description: 'Visualiser une lumière douce dans le cœur', type: 'action' },
          { description: 'Action symbolique de purification', type: 'action' }
        ],
        verse: {
          reference: 'Az-Zumar (39:23)',
          translation: 'Allah a fait descendre le plus beau récit, un Livre dont [certains versets] se ressemblent et se répètent. Les peaux de ceux qui redoutent leur Seigneur frissonnent à sa lecture, puis leurs peaux et leurs cœurs s\'apaisent au rappel d\'Allah. Voilà la guidance d\'Allah par laquelle Il guide qui Il veut. Et quiconque Allah égare n\'a point de guide.',
          tafsir: 'Ibn Kathir explique que ce verset décrit l\'effet du Coran sur les cœurs pieux. Al-Baghawi précise que le Coran fait frissonner les peaux par crainte, puis apaise les cœurs par la guidance et la miséricorde. Al-Baydawi ajoute que "le plus beau récit" fait référence au Coran, et que sa répétition de certains versets renforce leur impact sur les cœurs.'
        },
        closingPhrase: 'Mon cœur se purifie et s\'allège de toute lourdeur.'
      },
      {
        day: 31,
        title: 'DOUCEUR DES PENSÉES',
        tasks: [
          { description: 'Identifier une pensée négative persistante', type: 'action' },
          { description: 'Lire Al-A\'raf 7:156', type: 'verse' },
          { description: 'Remplacer la pensée négative par une pensée apaisante', type: 'action' },
          { description: 'Écrire : "Ma pensée est légère et claire."', type: 'writing' },
          { description: 'Marche consciente 5 minutes', type: 'action' }
        ],
        verse: {
          reference: 'Al-A\'râf (7:156)',
          translation: 'Et inscris pour nous un bien en ce monde et dans l\'Au-delà. Nous voilà revenus vers Toi. Il dit : "Je frappe de Mon châtiment qui Je veux, mais Ma miséricorde embrasse toute chose. Je l\'inscris donc pour ceux qui Me craignent, acquittent la zakat, et ont foi en Nos signes."',
          tafsir: 'Ibn Kathir explique que ce verset révèle l\'immensité de la miséricorde divine qui embrasse toute chose. Al-Qurtubi précise que la miséricorde d\'Allah précède et dépasse Son châtiment. Ceux qui bénéficient de cette miséricorde sont ceux qui craignent Allah (taqwa), accomplissent la zakat (purification des biens), et croient aux signes divins.'
        },
        closingPhrase: 'Chaque pensée négative est remplacée par la douceur et la clarté.'
      },
      {
        day: 32,
        title: 'RESSENTIR LA SÉRÉNITÉ',
        tasks: [
          { description: 'Choisir un moment de silence complet (3 minutes)', type: 'breathing' },
          { description: 'Lire Al-Fath 48:4', type: 'verse' },
          { description: 'Écrire : "Ma sérénité augmente aujourd\'hui."', type: 'writing' },
          { description: 'Respiration lente et profonde 3•6•9', type: 'breathing' },
          { description: 'Observer le calme intérieur et extérieur', type: 'action' }
        ],
        verse: {
          reference: 'Al-Fath (48:4)',
          translation: 'C\'est Lui qui a fait descendre la sérénité dans les cœurs des croyants afin qu\'ils ajoutent une foi à leur foi. À Allah appartiennent les armées des cieux et de la terre. Allah est Omniscient et Sage.',
          tafsir: 'Ibn Kathir explique que la sérénité (sakîna) est une tranquillité et une paix qui descendent du ciel dans les cœurs des croyants. Al-Baghawi précise que cette sérénité renforce la foi et apporte la confiance en Allah. C\'est une miséricorde divine qui apaise les cœurs dans les moments difficiles.'
        },
        closingPhrase: 'La sérénité grandit en moi et transforme mon esprit.'
      },
      {
        day: 33,
        title: 'ADOUCIR LA PAROLE',
        tasks: [
          { description: 'Observer et protéger ses paroles', type: 'action' },
          { description: 'Lire An-Nur 24:35', type: 'verse' },
          { description: 'Écrire : "Je choisis des mots qui apaisent."', type: 'writing' },
          { description: 'Un acte de douceur envers quelqu\'un', type: 'action' },
          { description: 'Silence intérieur 1 minute', type: 'breathing' }
        ],
        verse: {
          reference: 'An-Nûr (24:35)',
          translation: 'Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un cristal, et celui-ci ressemble à un astre brillant. Son combustible vient d\'un arbre béni : un olivier ni oriental ni occidental, dont l\'huile semble éclairer sans que le feu ne la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose des paraboles aux gens, et Allah est Omniscient.',
          tafsir: 'Ibn Kathir explique que ce verset décrit la lumière de la guidance divine. La niche représente le cœur du croyant, la lampe est la foi, le cristal symbolise la clarté et la pureté, et l\'huile pure représente la sincérité. "Lumière sur lumière" signifie la lumière de la révélation combinée à la lumière de la foi dans le cœur. Al-Baydawi précise que cette parabole illustre comment la guidance divine éclaire le cœur du croyant.'
        },
        closingPhrase: 'Mes paroles deviennent douces et apaisantes, reflétant la lumière divine.'
      },
      {
        day: 34,
        title: 'ÉQUILIBRE MENTAL',
        tasks: [
          { description: 'Faire une liste des priorités mentales du jour', type: 'writing' },
          { description: 'Lire Al-Baqara 2:152', type: 'verse' },
          { description: 'Ranger un coin qui crée du désordre', type: 'action' },
          { description: 'Écrire : "Je garde seulement l\'essentiel."', type: 'writing' },
          { description: 'Marche consciente ou étirement doux', type: 'action' }
        ],
        verse: {
          reference: 'Al-Baqara (2:152)',
          translation: 'Rappelez-vous de Moi, Je Me rappellerai de vous. Remerciez-Moi et ne soyez pas ingrats envers Moi.',
          tafsir: 'Ibn Kathir explique que ce verset établit la relation de rappel mutuel entre Allah et Ses serviteurs. Al-Baghawi précise que se souvenir d\'Allah attire Son rappel et Sa miséricorde, et que la gratitude est essentielle.'
        },
        closingPhrase: 'L\'équilibre mental naît de la simplicité et de la clarté.'
      },
      {
        day: 35,
        title: 'PROTECTION DU CŒUR',
        tasks: [
          { description: 'Noter une pensée qui dérange encore', type: 'writing' },
          { description: 'Lire Az-Zumar 39:10', type: 'verse' },
          { description: 'Silence intérieur 2 minutes', type: 'breathing' },
          { description: 'Visualisation : lumière douce dans la poitrine', type: 'action' },
          { description: 'Petit acte de protection', type: 'action' }
        ],
        verse: {
          reference: 'Az-Zumar (39:10)',
          translation: 'Dis : "Ô Mes serviteurs qui avez cru ! Craignez votre Seigneur. Ceux qui accomplissent le bien dans ce monde auront une bonne [récompense]. La terre d\'Allah est vaste. Ceux qui endurent auront leur récompense sans compter."',
          tafsir: 'Ibn Kathir explique que ce verset promet une récompense sans limite à ceux qui endurent. Al-Baghawi précise que la patience et l\'endurance sont récompensées au-delà de toute mesure.'
        },
        closingPhrase: 'Mon cœur est protégé par la douceur et la lumière divine.'
      },
      {
        day: 36,
        title: 'KALWA YÂ LATÎF',
        tasks: [
          { description: 'Kalwa : Yâ Latîf (moment méditatif)', type: 'kalwa' },
          { description: 'Lire Ash-Sharh 94:1–4', type: 'verse' },
          { description: 'Respiration profonde 3•6•9', type: 'breathing' },
          { description: 'Écrire : "Mon esprit s\'est adouci sur…"', type: 'writing' },
          { description: 'Acte symbolique de paix', type: 'action' }
        ],
        verse: {
          reference: 'Ash-Sharh (94:1–4)',
          translation: 'N\'avons-Nous pas ouvert pour toi ta poitrine ? Et ne t\'avons-Nous pas déchargé du fardeau qui accablait ton dos ? Et n\'avons-Nous pas exalté pour toi ton renom ?',
          tafsir: 'Ibn Kathir explique que ce verset rappelle les bienfaits d\'Allah envers le Prophète ﷺ : l\'ouverture de sa poitrine, le déchargement de son fardeau, et l\'exaltation de son renom. Al-Baghawi précise que "l\'ouverture de la poitrine" fait référence à l\'illumination du cœur du Prophète, et que "le fardeau" représente les préoccupations et les difficultés. Al-Baydawi ajoute que ces bienfaits sont une source de réconfort et de gratitude pour tous les croyants.'
      },
        closingPhrase: 'Mon esprit s\'est transformé en un havre de paix et de douceur.'
      },
      {
        day: 37,
        title: 'KUN (Rupture)',
        block: 'BLOC FINAL — KUN • FA • YA • KUN',
        tasks: [
          { description: 'Lire Yâ-Sîn 77–81', type: 'verse' },
          { description: 'Rompre avec une pensée ou habitude toxique', type: 'action' },
          { description: 'Effacer contact/message/déclencheur mental', type: 'action' },
          { description: 'Silence profond 3 minutes', type: 'breathing' },
          { description: 'Écrire ce que tu quittes', type: 'writing' }
        ],
        verse: {
          reference: 'Yâ-Sîn (77–81)',
          translation: 'L\'homme ne voit-il pas que Nous l\'avons créé d\'une goutte de sperme ? Et le voilà [devenu] un disputeur déclaré ! Il propose pour Nous un exemple, tandis qu\'il oublie sa propre création. Il dit : "Qui va faire revivre des ossements une fois réduits en poussière ?" Dis : "Celui qui les a créés une première fois les fera revivre. Il connaît parfaitement toute création."',
          tafsir: 'Ibn Kathir explique que ce passage rappelle à l\'homme sa création humble et sa résurrection future. Al-Baghawi précise que ces versets réfutent les doutes sur la résurrection en rappelant que Celui qui a créé l\'homme une première fois peut certainement le recréer. C\'est un rappel de la puissance absolue d\'Allah.'
        },
        closingPhrase: 'Je romps avec tout ce qui empoisonne mon esprit et ouvre la voie à la pureté.'
      },
      {
        day: 38,
        title: 'FA (Ouverture)',
        tasks: [
          { description: 'Lire Yâ-Sîn 82', type: 'verse' },
          { description: 'Introduire une nouvelle pensée positive', type: 'action' },
          { description: 'Écrire ton intention pour les jours à venir', type: 'writing' },
          { description: 'Faire un petit acte symbolique d\'ouverture', type: 'action' },
          { description: 'Dire "La hawla wa la quwwata illa billah" × 33', type: 'dhikr' }
        ],
        verse: {
          reference: 'Yâ-Sîn (82)',
          translation: 'Sa parole, quand Il veut une chose, est de dire : "Sois !" et elle est.',
          tafsir: 'Ibn Kathir explique que ce verset illustre la puissance absolue d\'Allah. Quand Il veut créer quelque chose, Il dit simplement "Sois !" (Kun) et cela existe immédiatement. Al-Baydawi précise que cela démontre que la création divine est instantanée et sans effort, contrairement à la création humaine qui nécessite du temps et des moyens.'
        },
        closingPhrase: 'J\'ouvre mon esprit à la nouveauté et à la lumière divine.'
      },
      {
        day: 39,
        title: 'YA (Purification)',
        tasks: [
          { description: 'Lire Yâ-Sîn 83', type: 'verse' },
          { description: 'Istighfar × 70 pour purification intérieure', type: 'dhikr' },
          { description: 'Purification mentale ou comportementale', type: 'action' },
          { description: 'Écrire : "Purifie mes pensées de ce qui n\'est pas pour moi."', type: 'writing' },
          { description: 'Acte de douceur ou de pardon', type: 'action' }
        ],
        verse: {
          reference: 'Yâ-Sîn (83)',
          translation: 'Gloire à Celui qui détient en Sa main la royauté sur toute chose, et c\'est vers Lui que vous serez ramenés.',
          tafsir: 'Ibn Kathir explique que ce verset proclame la souveraineté absolue d\'Allah sur toute chose. Toute la création retournera vers Lui pour le jugement. Al-Baghawi précise que "la royauté" (mulk) signifie ici le pouvoir et la domination absolue sur toute chose, et que le retour vers Allah est inévitable pour tous.'
        },
        closingPhrase: 'La purification de mon esprit me rapproche de la douceur divine.'
      },
      {
        day: 40,
        title: 'KUN FINAL — SCEAU',
        tasks: [
          { description: 'Kalwa : Yâ Allah', type: 'kalwa' },
          { description: 'Nûr & Shifa : Ayat Al-Kursi + 3 Qul + eau/miel/musc', type: 'action' },
          { description: 'Écrire ton plan des 40 prochains jours : mental, cœur, actions', type: 'writing' },
          { description: '2 rakaat pour clôture spirituelle', type: 'action' },
          { description: 'Aumône symbolique ou réelle', type: 'action' }
        ],
        verse: {
          reference: 'Al-Baqara (2:255) - Ayat Al-Kursi',
          translation: 'Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. À Lui appartient tout ce qui est dans les cieux et sur la terre. Qui peut intercéder auprès de Lui sans Sa permission ? Il connaît leur passé et leur futur. Et, de Sa science, ils n\'embrassent que ce qu\'Il veut. Son Trône déborde les cieux et la terre, dont la garde ne Lui coûte aucune peine. Et Il est le Très Haut, le Très Grand.',
          tafsir: 'Ibn Kathir explique qu\'Ayat Al-Kursi est le plus grand verset du Coran. Il proclame l\'unicité absolue d\'Allah, Sa vie éternelle, Sa subsistance par Lui-même, et Sa souveraineté totale. Al-Baghawi précise que ce verset protège celui qui le récite et affirme la grandeur et la majesté d\'Allah au-dessus de toute Sa création.'
        },
        closingPhrase: 'Mon esprit est purifié, mon cœur apaisé. Je suis prêt pour une vie nouvelle guidée par la douceur divine.'
      }
    ]
  }
];

export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find(c => c.id === id);
}

export function getDayByChallengeAndDay(challengeId: string, day: number): Day | undefined {
  const challenge = getChallengeById(challengeId);
  return challenge?.days.find(d => d.day === day);
}