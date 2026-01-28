/**
 * Hadiths de Riyad as-Salihin
 * Collection pour le module NurAyna
 */

export interface Hadith {
  id: string;
  number: number;
  chapter: string;
  chapterAr: string;
  arabic: string;
  transliteration?: string;
  translation: {
    fr: string;
    en: string;
  };
  narrator: string;
  narratorAr: string;
  source: string;
  grade: 'sahih' | 'hasan' | 'daif';
  themes: string[];
}

export const hadiths: Hadith[] = [
  {
    id: 'rs-1',
    number: 1,
    chapter: 'L\'intention',
    chapterAr: 'النية',
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا، أَوِ امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ',
    translation: {
      fr: 'Les actes ne valent que par leurs intentions. À chacun selon son intention. Celui qui émigre pour Allah et Son Messager, son émigration sera pour Allah et Son Messager. Celui qui émigre pour un bien de ce monde ou pour épouser une femme, son émigration sera pour ce vers quoi il a émigré.',
      en: 'Actions are judged by intentions. Each person will be rewarded according to their intention. Whoever migrates for Allah and His Messenger, their migration will be for Allah and His Messenger. Whoever migrates for worldly gain or to marry a woman, their migration will be for what they migrated for.',
    },
    narrator: 'Umar ibn al-Khattab',
    narratorAr: 'عمر بن الخطاب رضي الله عنه',
    source: 'Bukhari & Muslim',
    grade: 'sahih',
    themes: ['intention', 'sincérité', 'fondements'],
  },
  {
    id: 'rs-2',
    number: 2,
    chapter: 'Le repentir',
    chapterAr: 'التوبة',
    arabic: 'كُلُّ ابْنِ آدَمَ خَطَّاءٌ، وَخَيْرُ الْخَطَّائِينَ التَّوَّابُونَ',
    translation: {
      fr: 'Tout fils d\'Adam commet des péchés, et les meilleurs des pécheurs sont ceux qui se repentent.',
      en: 'Every son of Adam sins, and the best of sinners are those who repent.',
    },
    narrator: 'Anas ibn Malik',
    narratorAr: 'أنس بن مالك رضي الله عنه',
    source: 'Tirmidhi',
    grade: 'hasan',
    themes: ['repentir', 'espoir', 'miséricorde'],
  },
  {
    id: 'rs-3',
    number: 3,
    chapter: 'La patience',
    chapterAr: 'الصبر',
    arabic: 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ، إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ، وَلَيْسَ ذَاكَ لِأَحَدٍ إِلَّا لِلْمُؤْمِنِ، إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ، فَكَانَ خَيْرًا لَهُ، وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ، فَكَانَ خَيْرًا لَهُ',
    translation: {
      fr: 'Comme l\'affaire du croyant est étonnante ! Tout ce qui lui arrive est un bien, et cela n\'est accordé qu\'au croyant. S\'il lui arrive un bonheur, il remercie, et c\'est un bien pour lui. S\'il lui arrive un malheur, il patiente, et c\'est un bien pour lui.',
      en: 'How wonderful is the affair of the believer! Everything that happens to them is good, and this is only for the believer. If something good happens, they give thanks, and it is good for them. If something bad happens, they are patient, and it is good for them.',
    },
    narrator: 'Suhayb',
    narratorAr: 'صهيب رضي الله عنه',
    source: 'Muslim',
    grade: 'sahih',
    themes: ['patience', 'gratitude', 'épreuves', 'foi'],
  },
  {
    id: 'rs-4',
    number: 4,
    chapter: 'La véracité',
    chapterAr: 'الصدق',
    arabic: 'عَلَيْكُمْ بِالصِّدْقِ، فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ، وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ',
    translation: {
      fr: 'Attachez-vous à la véracité, car la véracité mène à la piété, et la piété mène au Paradis.',
      en: 'Hold fast to truthfulness, for truthfulness leads to righteousness, and righteousness leads to Paradise.',
    },
    narrator: 'Abdullah ibn Mas\'ud',
    narratorAr: 'عبد الله بن مسعود رضي الله عنه',
    source: 'Bukhari & Muslim',
    grade: 'sahih',
    themes: ['véracité', 'piété', 'paradis'],
  },
  {
    id: 'rs-5',
    number: 5,
    chapter: 'La confiance en Allah',
    chapterAr: 'التوكل على الله',
    arabic: 'لَوْ أَنَّكُمْ تَوَكَّلُونَ عَلَى اللَّهِ حَقَّ تَوَكُّلِهِ، لَرَزَقَكُمْ كَمَا يَرْزُقُ الطَّيْرَ، تَغْدُو خِمَاصًا، وَتَرُوحُ بِطَانًا',
    translation: {
      fr: 'Si vous vous en remettiez à Allah d\'une confiance véritable, Il vous accorderait votre subsistance comme Il l\'accorde aux oiseaux qui partent le matin le ventre vide et rentrent le soir repus.',
      en: 'If you were to rely upon Allah with true reliance, He would provide for you as He provides for the birds; they go out in the morning hungry and return in the evening full.',
    },
    narrator: 'Umar ibn al-Khattab',
    narratorAr: 'عمر بن الخطاب رضي الله عنه',
    source: 'Tirmidhi',
    grade: 'sahih',
    themes: ['confiance', 'tawakkul', 'subsistance'],
  },
  {
    id: 'rs-6',
    number: 6,
    chapter: 'La rectitude',
    chapterAr: 'الاستقامة',
    arabic: 'قُلْ: آمَنْتُ بِاللَّهِ، ثُمَّ اسْتَقِمْ',
    translation: {
      fr: 'Dis : "Je crois en Allah", puis sois droit.',
      en: 'Say: "I believe in Allah", then be steadfast.',
    },
    narrator: 'Sufyan ibn Abdullah',
    narratorAr: 'سفيان بن عبد الله رضي الله عنه',
    source: 'Muslim',
    grade: 'sahih',
    themes: ['rectitude', 'foi', 'persévérance'],
  },
  {
    id: 'rs-7',
    number: 7,
    chapter: 'La méditation',
    chapterAr: 'التفكر',
    arabic: 'تَفَكَّرُوا فِي آلَاءِ اللَّهِ، وَلَا تَفَكَّرُوا فِي اللَّهِ',
    translation: {
      fr: 'Méditez sur les bienfaits d\'Allah, mais ne méditez pas sur l\'Essence d\'Allah.',
      en: 'Reflect on the blessings of Allah, but do not reflect on the Essence of Allah.',
    },
    narrator: 'Ibn Abbas',
    narratorAr: 'ابن عباس رضي الله عنهما',
    source: 'Tabarani',
    grade: 'hasan',
    themes: ['méditation', 'bienfaits', 'gratitude'],
  },
  {
    id: 'rs-8',
    number: 8,
    chapter: 'L\'excellence du dhikr',
    chapterAr: 'فضل الذكر',
    arabic: 'مَثَلُ الَّذِي يَذْكُرُ رَبَّهُ وَالَّذِي لَا يَذْكُرُ رَبَّهُ، مَثَلُ الْحَيِّ وَالْمَيِّتِ',
    translation: {
      fr: 'L\'exemple de celui qui invoque son Seigneur et de celui qui ne L\'invoque pas est comme l\'exemple du vivant et du mort.',
      en: 'The example of one who remembers their Lord and one who does not is like the example of the living and the dead.',
    },
    narrator: 'Abu Musa al-Ash\'ari',
    narratorAr: 'أبو موسى الأشعري رضي الله عنه',
    source: 'Bukhari',
    grade: 'sahih',
    themes: ['dhikr', 'invocation', 'vie spirituelle'],
  },
  {
    id: 'rs-9',
    number: 9,
    chapter: 'La douceur',
    chapterAr: 'الرفق',
    arabic: 'إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الْأَمْرِ كُلِّهِ',
    translation: {
      fr: 'Certes, Allah est Doux et Il aime la douceur en toute chose.',
      en: 'Indeed, Allah is Gentle and He loves gentleness in all things.',
    },
    narrator: 'Aisha',
    narratorAr: 'عائشة رضي الله عنها',
    source: 'Bukhari & Muslim',
    grade: 'sahih',
    themes: ['douceur', 'gentillesse', 'caractère'],
  },
  {
    id: 'rs-10',
    number: 10,
    chapter: 'L\'humilité',
    chapterAr: 'التواضع',
    arabic: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ، وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلَّا عِزًّا، وَمَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلَّا رَفَعَهُ اللَّهُ',
    translation: {
      fr: 'La charité ne diminue en rien la richesse. Allah n\'accroît un serviteur par le pardon qu\'en honneur. Et quiconque s\'humilie pour Allah, Allah l\'élève.',
      en: 'Charity does not decrease wealth. Allah does not increase a servant through forgiveness except in honor. And whoever humbles themselves for Allah, Allah raises them.',
    },
    narrator: 'Abu Hurayra',
    narratorAr: 'أبو هريرة رضي الله عنه',
    source: 'Muslim',
    grade: 'sahih',
    themes: ['humilité', 'charité', 'pardon'],
  },
  {
    id: 'rs-11',
    number: 11,
    chapter: 'Le bon comportement',
    chapterAr: 'حسن الخلق',
    arabic: 'أَكْمَلُ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا',
    translation: {
      fr: 'Les croyants les plus parfaits en foi sont ceux qui ont le meilleur caractère.',
      en: 'The most complete of believers in faith are those with the best character.',
    },
    narrator: 'Abu Hurayra',
    narratorAr: 'أبو هريرة رضي الله عنه',
    source: 'Tirmidhi',
    grade: 'sahih',
    themes: ['caractère', 'foi', 'comportement'],
  },
  {
    id: 'rs-12',
    number: 12,
    chapter: 'La pudeur',
    chapterAr: 'الحياء',
    arabic: 'الْحَيَاءُ لَا يَأْتِي إِلَّا بِخَيْرٍ',
    translation: {
      fr: 'La pudeur n\'apporte que du bien.',
      en: 'Modesty brings nothing but good.',
    },
    narrator: 'Imran ibn Husayn',
    narratorAr: 'عمران بن حصين رضي الله عنه',
    source: 'Bukhari & Muslim',
    grade: 'sahih',
    themes: ['pudeur', 'modestie', 'vertu'],
  },
];

// Fonction pour obtenir tous les hadiths
export function getAllHadiths(): Hadith[] {
  return hadiths;
}

// Fonction pour obtenir un hadith par ID
export function getHadithById(id: string): Hadith | undefined {
  return hadiths.find(h => h.id === id);
}

// Fonction pour obtenir les hadiths par chapitre
export function getHadithsByChapter(chapter: string): Hadith[] {
  return hadiths.filter(h => h.chapter.toLowerCase().includes(chapter.toLowerCase()));
}

// Fonction pour obtenir les hadiths par thème
export function getHadithsByTheme(theme: string): Hadith[] {
  return hadiths.filter(h => h.themes.some(t => t.toLowerCase().includes(theme.toLowerCase())));
}

// Fonction pour obtenir un hadith aléatoire
export function getRandomHadith(): Hadith {
  return hadiths[Math.floor(Math.random() * hadiths.length)];
}

// Liste des chapitres uniques
export function getHadithChapters(): string[] {
  return [...new Set(hadiths.map(h => h.chapter))];
}

