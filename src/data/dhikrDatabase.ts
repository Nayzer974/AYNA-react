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
}];

export function getRandomDhikr(): Dhikr {
  const randomIndex = Math.floor(Math.random() * dhikrDatabase.length);
  return dhikrDatabase[randomIndex];
}


