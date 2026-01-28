export interface Dhikr {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;
  category: 'morning' | 'evening' | 'general' | 'salawat';
}

export const dhikrDatabase: Dhikr[] = [{
  id: '1',
  arabic: 'سُبْحَانَ اللهِ',
  transliteration: 'SubhanAllah',
  translation: 'Gloire à Allah',
  count: 33,
  category: 'general'
}, {
  id: '2',
  arabic: 'الْحَمْدُ لِلَّهِ',
  transliteration: 'Alhamdulillah',
  translation: 'Louange à Allah',
  count: 33,
  category: 'general'
}, {
  id: '3',
  arabic: 'اللَّهُ أَكْبَرُ',
  transliteration: 'Allahu Akbar',
  translation: 'Allah est le Plus Grand',
  count: 34,
  category: 'general'
}, {
  id: '4',
  arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
  transliteration: 'La ilaha illallah',
  translation: "Il n'y a de divinité qu'Allah",
  count: 100,
  category: 'general'
}, {
  id: '5',
  arabic: 'أَسْتَغْفِرُ اللهَ',
  transliteration: 'Astaghfirullah',
  translation: 'Je demande pardon à Allah',
  count: 100,
  category: 'general'
}, {
  id: '6',
  arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
  transliteration: 'Allahumma salli ala Muhammad',
  translation: 'Ô Allah, prie sur Muhammad',
  count: 100,
  category: 'salawat'
}, {
  id: '7',
  arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
  transliteration: 'La hawla wa la quwwata illa billah',
  translation: 'Il n\'y a de force ni de puissance qu\'en Allah',
  count: 100,
  category: 'general'
}, {
  id: '8',
  arabic: 'اللَّهُمَّ بَارِكْ لِي فِيمَا أَعْطَيْتَنِي',
  transliteration: 'Allahumma barik li fima a\'taitani',
  translation: 'Ô Allah, bénis-moi dans ce que Tu m\'as donné',
  count: 100,
  category: 'general'
}, {
  id: '9',
  arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
  transliteration: 'SubhanAllahi wa bihamdihi',
  translation: 'Gloire et louange à Allah',
  count: 100,
  category: 'morning'
}, {
  id: '10',
  arabic: 'سُبْحَانَ اللهِ العَظِيم',
  transliteration: 'SubhanAllahil Azim',
  translation: 'Gloire à Allah le Tout-Puissant',
  count: 100,
  category: 'general'
}, {
  id: '11',
  arabic: 'يَا حَيُّ يَا قَيُّوم',
  transliteration: 'Ya Hayyu Ya Qayyum',
  translation: 'Ô Vivant, Ô Subsistant par Lui-même',
  count: 100,
  category: 'general'
}, {
  id: '12',
  arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً',
  transliteration: 'Rabbana atina fid-dunya hasanah wa fil-akhirati hasanah',
  translation: 'Seigneur, accorde-nous le bien dans ce monde et dans l\'au-delà',
  count: 33,
  category: 'general'
}, {
  id: '13',
  arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
  transliteration: 'Hasbunallahu wa ni\'mal wakil',
  translation: 'Allah nous suffit, Il est notre meilleur garant',
  count: 100,
  category: 'general'
}, {
  id: '14',
  arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ',
  transliteration: 'Allahumma inni as\'alukal \'afiyah',
  translation: 'Ô Allah, je Te demande la santé et la sécurité',
  count: 33,
  category: 'morning'
}, {
  id: '15',
  arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ',
  transliteration: 'Allahumma antas-salam wa minkas-salam',
  translation: 'Ô Allah, Tu es la Paix et de Toi vient la paix',
  count: 33,
  category: 'general'
}, {
  id: '16',
  arabic: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَآلِهِ وَصَحْبِهِ وَسَلِّم',
  transliteration: 'Allahumma salli ala sayyidina Muhammad wa alihi wa sahbihi wa sallim',
  translation: 'Ô Allah, prie et accorde la paix sur notre maître Muhammad, sa famille et ses compagnons',
  count: 100,
  category: 'salawat'
}, {
  id: '17',
  arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ',
  transliteration: 'Bismillahilladhi la yadurru ma\'asmihi shay\'un',
  translation: 'Au nom d\'Allah, avec Lui rien ne peut nuire',
  count: 3,
  category: 'morning'
}, {
  id: '18',
  arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
  transliteration: 'A\'udhu bi kalimatillahi-t-tammati min sharri ma khalaq',
  translation: 'Je cherche refuge dans les paroles parfaites d\'Allah contre le mal de ce qu\'Il a créé',
  count: 3,
  category: 'evening'
}, {
  id: '19',
  arabic: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالإِسْلامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا',
  transliteration: 'Raditu billahi rabban wa bil-islami dinan wa bi-Muhammadin nabiyya',
  translation: 'J\'agrée Allah comme Seigneur, l\'Islam comme religion et Muhammad comme prophète',
  count: 3,
  category: 'morning'
}, {
  id: '20',
  arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ',
  transliteration: 'Ya muqallibal-qulub thabbit qalbi \'ala dinik',
  translation: 'Ô Celui qui retourne les cœurs, affermis mon cœur sur Ta religion',
  count: 33,
  category: 'general'
}, {
  id: '21',
  arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ',
  transliteration: 'Hasbiyallahu la ilaha illa huwa',
  translation: 'Allah me suffit, il n\'y a de divinité que Lui',
  count: 100,
  category: 'general'
}, {
  id: '22',
  arabic: 'يَا حَيُّ يَا قَيُّومُ، بِرَحْمَتِكَ أَسْتَغِيثُ',
  transliteration: 'Ya Hayyu Ya Qayyum, bi-rahmatika astaghithu',
  translation: 'Ô Vivant, Ô Subsistant, par Ta miséricorde je demande secours',
  count: 100,
  category: 'general'
}, {
  id: '23',
  arabic: 'لَا إِلَهَ إِلَّا أَنْتَ، سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
  transliteration: 'La ilaha illa anta, subhanaka inni kuntu minaz-zalimin',
  translation: 'Il n\'y a de divinité que Toi, gloire à Toi, j\'ai été parmi les injustes',
  count: 100,
  category: 'general'
}, {
  id: '24',
  arabic: 'رَبِّ يَسِّرْ',
  transliteration: 'Rabbi yassir',
  translation: 'Seigneur, facilite',
  count: 100,
  category: 'general'
}, {
  id: '25',
  arabic: 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو',
  transliteration: 'Allahumma rahmataka arju',
  translation: 'Ô Allah, j\'espère Ta miséricorde',
  count: 100,
  category: 'general'
}, {
  id: '26',
  arabic: 'يَا اللَّهُ',
  transliteration: 'Ya Allah',
  translation: 'Ô Allah',
  count: 100,
  category: 'general'
}, {
  id: '27',
  arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ. اللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ.',
  transliteration: 'Allahumma salli \'ala Muhammad wa \'ala ali Muhammad, kama sallayta \'ala Ibrahim wa \'ala ali Ibrahim, innaka hamidun majid. Allahumma barik \'ala Muhammad wa \'ala ali Muhammad, kama barakta \'ala Ibrahim wa \'ala ali Ibrahim, innaka hamidun majid.',
  translation: 'Ô Allah, prie sur Muhammad et sur la famille de Muhammad comme Tu as prié sur Ibrahim et la famille d\'Ibrahim. Tu es Digne de louange et de gloire. Ô Allah, bénis Muhammad et la famille de Muhammad comme Tu as béni Ibrahim et la famille d\'Ibrahim.',
  count: 100,
  category: 'salawat'
}, {
  id: '28',
  arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ',
  transliteration: 'Allahumma salli \'ala Muhammad wa \'ala ali Muhammad',
  translation: 'Ô Allah, prie sur Muhammad et sur la famille de Muhammad.',
  count: 100,
  category: 'salawat'
}];

export function getRandomDhikr(): Dhikr {
  const randomIndex = Math.floor(Math.random() * dhikrDatabase.length);
  return dhikrDatabase[randomIndex];
}


