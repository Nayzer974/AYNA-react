/**
 * Dhikr authentiques (issus du Coran et de la Sunna)
 * Pour la session commune qui change toutes les 24h
 */

export interface AuthenticDhikr {
  arabic: string;
  transliteration: string;
  translation: string;
  category: string;
}

export const AUTHENTIC_DHIKR: AuthenticDhikr[] = [
  // Dhikr de base
  {
    arabic: 'سُبْحَانَ ٱللَّٰه',
    transliteration: 'Subḥānallāh',
    translation: 'Gloire à Allah',
    category: 'base'
  },
  {
    arabic: 'ٱلْحَمْدُ لِلَّٰهِ',
    transliteration: 'Al-ḥamdu liLlāh',
    translation: 'Louange à Allah',
    category: 'base'
  },
  {
    arabic: 'ٱللَّٰهُ أَكْبَر',
    transliteration: 'Allāhu Akbar',
    translation: 'Allah est Le Plus Grand',
    category: 'base'
  },
  {
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰه',
    transliteration: 'Lā ilāha illa Llāh',
    translation: 'Il n\'y a de divinité qu\'Allah',
    category: 'base'
  },
  {
    arabic: 'أَسْتَغْفِرُ ٱللَّٰه',
    transliteration: 'AstaghfiruLlāh',
    translation: 'Je demande pardon à Allah',
    category: 'base'
  },
  // Dhikr coraniques explicites
  {
    arabic: 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ',
    transliteration: 'Subḥānallāhi wa bi-ḥamdih',
    translation: 'Gloire et louange à Allah',
    category: 'coranique'
  },
  {
    arabic: 'سُبْحَانَ ٱللَّٰهِ ٱلْعَظِيم',
    transliteration: 'Subḥānallāhi al-ʿAẓīm',
    translation: 'Gloire à Allah, le Magnifique',
    category: 'coranique'
  },
  {
    arabic: 'حَسْبِيَ ٱللَّٰهُ لَا إِلَٰهَ إِلَّا هُوَ',
    transliteration: 'Ḥasbiyallāhu lā ilāha illā Huwa',
    translation: 'Allah me suffit, il n\'y a de divinité que Lui',
    category: 'coranique'
  },
  {
    arabic: 'نِعْمَ ٱلْمَوْلَىٰ وَنِعْمَ ٱلنَّصِير',
    transliteration: 'Niʿma al-Mawlā wa niʿma an-Naṣīr',
    translation: 'Quel excellent Maître et quel excellent Soutien',
    category: 'coranique'
  },
  {
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: 'Rabbi zidnī ʿilmā',
    translation: 'Ô mon Seigneur, augmente-moi en science',
    category: 'coranique'
  },
  // Dhikr de tawḥīd et de confiance
  {
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰه',
    transliteration: 'Lā ḥawla wa lā quwwata illā biLlāh',
    translation: 'Il n\'y a de force ni de puissance qu\'en Allah',
    category: 'tawhid'
  },
  {
    arabic: 'تَوَكَّلْتُ عَلَى ٱللَّٰه',
    transliteration: 'Tawakkaltu ʿalā Llāh',
    translation: 'Je place ma confiance en Allah',
    category: 'tawhid'
  },
  {
    arabic: 'ٱللَّٰهُ وَلِيُّ ٱلَّذِينَ ءَامَنُوا',
    transliteration: 'Allāhu waliyyu alladhīna āmanū',
    translation: 'Allah est le Protecteur des croyants',
    category: 'tawhid'
  },
  {
    arabic: 'ٱللَّٰهُمَّ أَنتَ رَبِّي',
    transliteration: 'Allāhumma anta Rabbī',
    translation: 'Ô Allah, Tu es mon Seigneur',
    category: 'tawhid'
  },
  {
    arabic: 'ٱللَّٰهُ لَطِيف',
    transliteration: 'Allāhu Laṭīf',
    translation: 'Allah est Le Subtil, Le Bienveillant',
    category: 'tawhid'
  },
  // Dhikr de pardon et purification
  {
    arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ رَبِّي وَأَتُوبُ إِلَيْهِ',
    transliteration: 'AstaghfiruLlāha rabbī wa atūbu ilayh',
    translation: 'Je demande pardon à Allah, mon Seigneur, et je me repens à Lui',
    category: 'pardon'
  },
  {
    arabic: 'رَبِّ ٱغْفِرْ لِي',
    transliteration: 'Rabbi ighfir lī',
    translation: 'Ô mon Seigneur, pardonne-moi',
    category: 'pardon'
  },
  {
    arabic: 'ٱللَّٰهُمَّ ٱغْفِرْ لِي ذُنُوبِي',
    transliteration: 'Allāhumma ighfir lī dhunūbī',
    translation: 'Ô Allah, pardonne-moi mes péchés',
    category: 'pardon'
  },
  {
    arabic: 'غُفْرَانَكَ رَبَّنَا',
    transliteration: 'Ghufrānaka Rabbana',
    translation: 'Nous implorons Ton pardon, ô notre Seigneur',
    category: 'pardon'
  },
  {
    arabic: 'يَا غَفَّار',
    transliteration: 'Yā Ghaffār',
    translation: 'Ô Toi le Grand Pardonneur',
    category: 'pardon'
  },
  // Dhikr de paix et d'apaisement
  {
    arabic: 'ٱللَّٰهُمَّ أَنتَ ٱلسَّلَام',
    transliteration: 'Allāhumma anta as-Salām',
    translation: 'Ô Allah, Tu es la Paix',
    category: 'paix'
  },
  {
    arabic: 'يَا سَلَام',
    transliteration: 'Yā Salām',
    translation: 'Ô Source de la Paix',
    category: 'paix'
  },
  {
    arabic: 'ٱللَّٰهُمَّ أَنزِلِ ٱلسَّكِينَة',
    transliteration: 'Allāhumma anzil as-sakīnah',
    translation: 'Ô Allah, fais descendre la sérénité',
    category: 'paix'
  },
  {
    arabic: 'قُلُوبُنَا بِذِكْرِكَ تَطْمَئِنّ',
    transliteration: 'Qulūbunā bi-dhikrika taṭmaʾinn',
    translation: 'Nos cœurs s\'apaisent par Ton rappel',
    category: 'paix'
  },
  {
    arabic: 'ٱللَّٰهُمَّ ٱجْعَل لِّي نُورًا',
    transliteration: 'Allāhumma ijʿal lī nūran',
    translation: 'Ô Allah, accorde-moi une lumière',
    category: 'paix'
  },
  // Dhikr de lumière et de guidance
  {
    arabic: 'ٱللَّٰهُمَّ ٱهْدِنِي',
    transliteration: 'Allāhumma ihdinī',
    translation: 'Ô Allah, guide-moi',
    category: 'lumiere'
  },
  {
    arabic: 'يَا نُور',
    transliteration: 'Yā Nūr',
    translation: 'Ô Lumière',
    category: 'lumiere'
  },
  {
    arabic: 'ٱللَّٰهُمَّ زِدْنَا هُدًى',
    transliteration: 'Allāhumma zidnā hudā',
    translation: 'Ô Allah, augmente-nous en guidée',
    category: 'lumiere'
  },
  {
    arabic: 'رَبِّ ٱشْرَحْ لِي صَدْرِي',
    transliteration: 'Rabbi shraḥ lī ṣadrī',
    translation: 'Ô mon Seigneur, ouvre ma poitrine',
    category: 'lumiere'
  },
  {
    arabic: 'ٱللَّٰهُمَّ أَرِنَا ٱلْحَقَّ حَقًّا',
    transliteration: 'Allāhumma arinā al-ḥaqq ḥaqqā',
    translation: 'Ô Allah, fais-nous voir la vérité comme vérité',
    category: 'lumiere'
  },
  // Dhikr de protection
  {
    arabic: 'أَعُوذُ بِكَلِمَاتِ ٱللَّٰهِ ٱلتَّامَّات',
    transliteration: 'Aʿūdhu bi-kalimātiLlāhi at-tāmmāt',
    translation: 'Je cherche refuge dans les paroles parfaites d\'Allah',
    category: 'protection'
  },
  {
    arabic: 'ٱللَّٰهُمَّ ٱحْفَظْنِي',
    transliteration: 'Allāhumma iḥfaẓnī',
    translation: 'Ô Allah, protège-moi',
    category: 'protection'
  },
  {
    arabic: 'يَا حَفِيظ',
    transliteration: 'Yā Ḥafīẓ',
    translation: 'Ô Protecteur',
    category: 'protection'
  },
  {
    arabic: 'ٱللَّٰهُ خَيْرٌ حَافِظًا',
    transliteration: 'Allāhu khayru ḥāfiẓā',
    translation: 'Allah est le Meilleur des protecteurs',
    category: 'protection'
  },
  {
    arabic: 'ٱللَّٰهُمَّ أَجِرْنَا مِنَ ٱلنَّار',
    transliteration: 'Allāhumma ajirnā min an-nār',
    translation: 'Ô Allah, protège-nous du Feu',
    category: 'protection'
  },
  // Dhikr de clôture et remise
  {
    arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا',
    transliteration: 'Rabbanā taqabbal minnā',
    translation: 'Ô notre Seigneur, accepte de nous',
    category: 'cloture'
  },
  {
    arabic: 'ٱللَّٰهُمَّ ٱخْتِمْ لَنَا بِخَيْر',
    transliteration: 'Allāhumma kh\'tim lanā bi-khayr',
    translation: 'Ô Allah, accorde-nous une bonne fin',
    category: 'cloture'
  },
  {
    arabic: 'إِلَيْكَ ٱلْمَصِير',
    transliteration: 'Ilayka al-maṣīr',
    translation: 'Vers Toi est le retour',
    category: 'cloture'
  },
  {
    arabic: 'إِنَّ ٱللَّٰهَ مَعَ ٱلصَّابِرِينَ',
    transliteration: 'Innallāha maʿa aṣ-ṣābirīn',
    translation: 'Allah est avec les patients',
    category: 'cloture'
  },
  {
    arabic: 'سُبْحَانَكَ ٱللَّٰهُمَّ وَبِحَمْدِكَ',
    transliteration: 'Subḥānaka Allāhumma wa bi-ḥamdik',
    translation: 'Gloire et louange à Toi, ô Allah',
    category: 'cloture'
  }
];

/**
 * Obtient un dhikr authentique par index (pour rotation sur 24h)
 */
export function getAuthenticDhikrByIndex(index: number): AuthenticDhikr {
  const normalizedIndex = index % AUTHENTIC_DHIKR.length;
  return AUTHENTIC_DHIKR[normalizedIndex];
}


