export interface Surah {
  number: number;
  name: string;
  arabicName: string;
  englishName: string;
  frenchName: string;
  verses: number;
  revelation: 'Meccan' | 'Medinan';
}
export const surahs: Surah[] = [{
  number: 1,
  name: 'Al-Fatiha',
  arabicName: 'الفاتحة',
  englishName: 'The Opening',
  frenchName: "Prologue",
  verses: 7,
  revelation: 'Meccan'
}, {
  number: 2,
  name: 'Al-Baqarah',
  arabicName: 'البقرة',
  englishName: 'The Cow',
  frenchName: "La Vache",
  verses: 286,
  revelation: 'Medinan'
}, {
  number: 3,
  name: "Al 'Imran",
  arabicName: 'آل عمران',
  englishName: 'Family of Imran',
  frenchName: "La Famille de Imran",
  verses: 200,
  revelation: 'Medinan'
}, {
  number: 4,
  name: 'An-Nisa',
  arabicName: 'النساء',
  englishName: 'The Women',
  frenchName: "Les Femmes",
  verses: 176,
  revelation: 'Medinan'
}, {
  number: 5,
  name: "Al-Ma'idah",
  arabicName: 'المائدة',
  englishName: 'The Table Spread',
  frenchName: "La Table Servie",
  verses: 120,
  revelation: 'Medinan'
}, {
  number: 6,
  name: "Al-An'am",
  arabicName: 'الأنعام',
  englishName: 'The Cattle',
  frenchName: "Les Bestiaux",
  verses: 165,
  revelation: 'Meccan'
}, {
  number: 7,
  name: "Al-A'raf",
  arabicName: 'الأعراف',
  englishName: 'The Heights',
  frenchName: "Al A'raf",
  verses: 206,
  revelation: 'Meccan'
}, {
  number: 8,
  name: 'Al-Anfal',
  arabicName: 'الأنفال',
  englishName: 'The Spoils of War',
  frenchName: "Le Butin",
  verses: 75,
  revelation: 'Medinan'
}, {
  number: 9,
  name: 'At-Tawbah',
  arabicName: 'التوبة',
  englishName: 'The Repentance',
  frenchName: "Le Repentir",
  verses: 129,
  revelation: 'Medinan'
}, {
  number: 10,
  name: 'Yunus',
  arabicName: 'يونس',
  englishName: 'Jonah',
  frenchName: "Jonas",
  verses: 109,
  revelation: 'Meccan'
}, {
  number: 11,
  name: 'Hud',
  arabicName: 'هود',
  englishName: 'Hud',
  frenchName: "Houd",
  verses: 123,
  revelation: 'Meccan'
}, {
  number: 12,
  name: 'Yusuf',
  arabicName: 'يوسف',
  englishName: 'Joseph',
  frenchName: "Joseph",
  verses: 111,
  revelation: 'Meccan'
}, {
  number: 13,
  name: "Ar-Ra'd",
  arabicName: 'الرعد',
  englishName: 'The Thunder',
  frenchName: "Le Tonnerre",
  verses: 43,
  revelation: 'Medinan'
}, {
  number: 14,
  name: 'Ibrahim',
  arabicName: 'ابراهيم',
  englishName: 'Abraham',
  frenchName: "Ibrahim",
  verses: 52,
  revelation: 'Meccan'
}, {
  number: 15,
  name: 'Al-Hijr',
  arabicName: 'الحجر',
  englishName: 'The Rocky Tract',
  frenchName: "Al Hidjr",
  verses: 99,
  revelation: 'Meccan'
}, {
  number: 16,
  name: 'An-Nahl',
  arabicName: 'النحل',
  englishName: 'The Bee',
  frenchName: "Les Abeilles",
  verses: 128,
  revelation: 'Meccan'
}, {
  number: 17,
  name: "Al-Isra'",
  arabicName: 'الإسراء',
  englishName: 'The Night Journey',
  frenchName: "Le Voyage Nocturne",
  verses: 111,
  revelation: 'Meccan'
}, {
  number: 18,
  name: 'Al-Kahf',
  arabicName: 'الكهف',
  englishName: 'The Cave',
  frenchName: "La Caverne",
  verses: 110,
  revelation: 'Meccan'
}, {
  number: 19,
  name: 'Maryam',
  arabicName: 'مريم',
  englishName: 'Mary',
  frenchName: "Marie",
  verses: 98,
  revelation: 'Meccan'
}, {
  number: 20,
  name: 'Ta-Ha',
  arabicName: 'طه',
  englishName: 'Ta-Ha',
  frenchName: "Ta-Ha",
  verses: 135,
  revelation: 'Meccan'
}, {
  number: 21,
  name: "Al-Anbiya'",
  arabicName: 'الأنبياء',
  englishName: 'The Prophets',
  frenchName: "Les Prophètes",
  verses: 112,
  revelation: 'Meccan'
}, {
  number: 22,
  name: 'Al-Hajj',
  arabicName: 'الحج',
  englishName: 'The Pilgrimage',
  frenchName: "Le Pelerinage",
  verses: 78,
  revelation: 'Medinan'
}, {
  number: 23,
  name: "Al-Mu'minun",
  arabicName: 'المؤمنون',
  englishName: 'The Believers',
  frenchName: "Les Croyants",
  verses: 118,
  revelation: 'Meccan'
}, {
  number: 24,
  name: 'An-Nur',
  arabicName: 'النور',
  englishName: 'The Light',
  frenchName: "La Lumière",
  verses: 64,
  revelation: 'Medinan'
}, {
  number: 25,
  name: 'Al-Furqan',
  arabicName: 'الفرقان',
  englishName: 'The Criterion',
  frenchName: "Le Discernement",
  verses: 77,
  revelation: 'Meccan'
}, {
  number: 26,
  name: "Ash-Shu'ara'",
  arabicName: 'الشعراء',
  englishName: 'The Poets',
  frenchName: "Les Poètes",
  verses: 227,
  revelation: 'Meccan'
}, {
  number: 27,
  name: 'An-Naml',
  arabicName: 'النمل',
  englishName: 'The Ant',
  frenchName: "Les Fourmis",
  verses: 93,
  revelation: 'Meccan'
}, {
  number: 28,
  name: 'Al-Qasas',
  arabicName: 'القصص',
  englishName: 'The Stories',
  frenchName: "Le Récit",
  verses: 88,
  revelation: 'Meccan'
}, {
  number: 29,
  name: "Al-'Ankabut",
  arabicName: 'العنكبوت',
  englishName: 'The Spider',
  frenchName: "L'Araignée",
  verses: 69,
  revelation: 'Meccan'
}, {
  number: 30,
  name: 'Ar-Rum',
  arabicName: 'الروم',
  englishName: 'The Romans',
  frenchName: "Les Romains",
  verses: 60,
  revelation: 'Meccan'
}, {
  number: 31,
  name: 'Luqman',
  arabicName: 'لقمان',
  englishName: 'Luqman',
  frenchName: "Louqmân",
  verses: 34,
  revelation: 'Meccan'
}, {
  number: 32,
  name: 'As-Sajdah',
  arabicName: 'السجدة',
  englishName: 'The Prostration',
  frenchName: "La Prosternation",
  verses: 30,
  revelation: 'Meccan'
}, {
  number: 33,
  name: 'Al-Ahzab',
  arabicName: 'الأحزاب',
  englishName: 'The Combined Forces',
  frenchName: "Les Coalisés",
  verses: 73,
  revelation: 'Medinan'
}, {
  number: 34,
  name: "Saba'",
  arabicName: 'سبإ',
  englishName: 'Sheba',
  frenchName: "Saba",
  verses: 54,
  revelation: 'Meccan'
}, {
  number: 35,
  name: 'Fatir',
  arabicName: 'فاطر',
  englishName: 'Originator',
  frenchName: "Le Créateur",
  verses: 45,
  revelation: 'Meccan'
}, {
  number: 36,
  name: 'Ya-Sin',
  arabicName: 'يس',
  englishName: 'Ya-Sin',
  frenchName: "Ya-Sîn",
  verses: 83,
  revelation: 'Meccan'
}, {
  number: 37,
  name: 'As-Saffat',
  arabicName: 'الصافات',
  englishName: 'Those who set the Ranks',
  frenchName: "Les Rangées",
  verses: 182,
  revelation: 'Meccan'
}, {
  number: 38,
  name: 'Sad',
  arabicName: 'ص',
  englishName: 'The Letter Sad',
  frenchName: "Sâd",
  verses: 88,
  revelation: 'Meccan'
}, {
  number: 39,
  name: 'Az-Zumar',
  arabicName: 'الزمر',
  englishName: 'The Troops',
  frenchName: "Les Groupes",
  verses: 75,
  revelation: 'Meccan'
}, {
  number: 40,
  name: 'Ghafir',
  arabicName: 'غافر',
  englishName: 'The Forgiver',
  frenchName: "Le Pardonneur",
  verses: 85,
  revelation: 'Meccan'
}, {
  number: 41,
  name: 'Fussilat',
  arabicName: 'فصلت',
  englishName: 'Explained in Detail',
  frenchName: "Les Versets Détaillées",
  verses: 54,
  revelation: 'Meccan'
}, {
  number: 42,
  name: 'Ash-Shuraa',
  arabicName: 'الشورى',
  englishName: 'The Consultation',
  frenchName: "La Consultation",
  verses: 53,
  revelation: 'Meccan'
}, {
  number: 43,
  name: 'Az-Zukhruf',
  arabicName: 'الزخرف',
  englishName: 'The Ornaments of Gold',
  frenchName: "L'Ornement",
  verses: 89,
  revelation: 'Meccan'
}, {
  number: 44,
  name: 'Ad-Dukhan',
  arabicName: 'الدخان',
  englishName: 'The Smoke',
  frenchName: "La Fumée",
  verses: 59,
  revelation: 'Meccan'
}, {
  number: 45,
  name: 'Al-Jathiyah',
  arabicName: 'الجاثية',
  englishName: 'The Crouching',
  frenchName: "L'Agenouillée",
  verses: 37,
  revelation: 'Meccan'
}, {
  number: 46,
  name: 'Al-Ahqaf',
  arabicName: 'الأحقاف',
  englishName: 'The Wind-Curved Sandhills',
  frenchName: "Al Ahqaf",
  verses: 35,
  revelation: 'Meccan'
}, {
  number: 47,
  name: 'Muhammad',
  arabicName: 'محمد',
  englishName: 'Muhammad',
  frenchName: "Mouhammed",
  verses: 38,
  revelation: 'Medinan'
}, {
  number: 48,
  name: 'Al-Fath',
  arabicName: 'الفتح',
  englishName: 'The Victory',
  frenchName: "La Victoire Eclatante",
  verses: 29,
  revelation: 'Medinan'
}, {
  number: 49,
  name: 'Al-Hujurat',
  arabicName: 'الحجرات',
  englishName: 'The Rooms',
  frenchName: "Les Appartements",
  verses: 18,
  revelation: 'Medinan'
}, {
  number: 50,
  name: 'Qaf',
  arabicName: 'ق',
  englishName: 'The Letter Qaf',
  frenchName: "Qaf",
  verses: 45,
  revelation: 'Meccan'
}, {
  number: 51,
  name: 'Adh-Dhariyat',
  arabicName: 'الذاريات',
  englishName: 'The Winnowing Winds',
  frenchName: "Qui Eparpillent",
  verses: 60,
  revelation: 'Meccan'
}, {
  number: 52,
  name: 'At-Tur',
  arabicName: 'الطور',
  englishName: 'The Mount',
  frenchName: "At Toûr",
  verses: 49,
  revelation: 'Meccan'
}, {
  number: 53,
  name: 'An-Najm',
  arabicName: 'النجم',
  englishName: 'The Star',
  frenchName: "L'Etoile",
  verses: 62,
  revelation: 'Meccan'
}, {
  number: 54,
  name: 'Al-Qamar',
  arabicName: 'القمر',
  englishName: 'The Moon',
  frenchName: "La Lune",
  verses: 55,
  revelation: 'Meccan'
}, {
  number: 55,
  name: 'Ar-Rahman',
  arabicName: 'الرحمن',
  englishName: 'The Beneficent',
  frenchName: "Le Tout Miséricordieux",
  verses: 78,
  revelation: 'Medinan'
}, {
  number: 56,
  name: "Al-Waqi'ah",
  arabicName: 'الواقعة',
  englishName: 'The Inevitable',
  frenchName: "L'Evénement",
  verses: 96,
  revelation: 'Meccan'
}, {
  number: 57,
  name: 'Al-Hadid',
  arabicName: 'الحديد',
  englishName: 'The Iron',
  frenchName: "Le Fer",
  verses: 29,
  revelation: 'Medinan'
}, {
  number: 58,
  name: 'Al-Mujadila',
  arabicName: 'المجادلة',
  englishName: 'The Pleading Woman',
  frenchName: "La Discussion",
  verses: 22,
  revelation: 'Medinan'
}, {
  number: 59,
  name: 'Al-Hashr',
  arabicName: 'الحشر',
  englishName: 'The Exile',
  frenchName: "L'Exode",
  verses: 24,
  revelation: 'Medinan'
}, {
  number: 60,
  name: 'Al-Mumtahanah',
  arabicName: 'الممتحنة',
  englishName: 'She that is to be examined',
  frenchName: "L'Eprouvée",
  verses: 13,
  revelation: 'Medinan'
}, {
  number: 61,
  name: 'As-Saf',
  arabicName: 'الصف',
  englishName: 'The Ranks',
  frenchName: "Le Rang",
  verses: 14,
  revelation: 'Medinan'
}, {
  number: 62,
  name: "Al-Jumu'ah",
  arabicName: 'الجمعة',
  englishName: 'The Congregation',
  frenchName: "Le Vendredi",
  verses: 11,
  revelation: 'Medinan'
}, {
  number: 63,
  name: 'Al-Munafiqun',
  arabicName: 'المنافقون',
  englishName: 'The Hypocrites',
  frenchName: "Les Hypocrites",
  verses: 11,
  revelation: 'Medinan'
}, {
  number: 64,
  name: 'At-Taghabun',
  arabicName: 'التغابن',
  englishName: 'The Mutual Disillusion',
  frenchName: "La Grande Perte",
  verses: 18,
  revelation: 'Medinan'
}, {
  number: 65,
  name: 'At-Talaq',
  arabicName: 'الطلاق',
  englishName: 'The Divorce',
  frenchName: "Le Divorce",
  verses: 12,
  revelation: 'Medinan'
}, {
  number: 66,
  name: 'At-Tahrim',
  arabicName: 'التحريم',
  englishName: 'The Prohibition',
  frenchName: "L'Interdiction",
  verses: 12,
  revelation: 'Medinan'
}, {
  number: 67,
  name: 'Al-Mulk',
  arabicName: 'الملك',
  englishName: 'The Sovereignty',
  frenchName: "La Royauté",
  verses: 30,
  revelation: 'Meccan'
}, {
  number: 68,
  name: 'Al-Qalam',
  arabicName: 'القلم',
  englishName: 'The Pen',
  frenchName: "La Plume",
  verses: 52,
  revelation: 'Meccan'
}, {
  number: 69,
  name: 'Al-Haqqah',
  arabicName: 'الحاقة',
  englishName: 'The Reality',
  frenchName: "Celle qui Montre la Vérité",
  verses: 52,
  revelation: 'Meccan'
}, {
  number: 70,
  name: "Al-Ma'arij",
  arabicName: 'المعارج',
  englishName: 'The Ascending Stairways',
  frenchName: "Les Voies d'Ascension",
  verses: 44,
  revelation: 'Meccan'
}, {
  number: 71,
  name: 'Nuh',
  arabicName: 'نوح',
  englishName: 'Noah',
  frenchName: "Noé",
  verses: 28,
  revelation: 'Meccan'
}, {
  number: 72,
  name: 'Al-Jinn',
  arabicName: 'الجن',
  englishName: 'The Jinn',
  frenchName: "Les Djinns",
  verses: 28,
  revelation: 'Meccan'
}, {
  number: 73,
  name: 'Al-Muzzammil',
  arabicName: 'المزمل',
  englishName: 'The Enshrouded One',
  frenchName: "L'enveloppé",
  verses: 20,
  revelation: 'Meccan'
}, {
  number: 74,
  name: 'Al-Muddaththir',
  arabicName: 'المدثر',
  englishName: 'The Cloaked One',
  frenchName: "Le Revêtu d'un Manteau",
  verses: 56,
  revelation: 'Meccan'
}, {
  number: 75,
  name: 'Al-Qiyamah',
  arabicName: 'القيامة',
  englishName: 'The Resurrection',
  frenchName: "La Résurrection",
  verses: 40,
  revelation: 'Meccan'
}, {
  number: 76,
  name: 'Al-Insan',
  arabicName: 'الانسان',
  englishName: 'The Man',
  frenchName: "L'Homme",
  verses: 31,
  revelation: 'Medinan'
}, {
  number: 77,
  name: 'Al-Mursalat',
  arabicName: 'المرسلات',
  englishName: 'The Emissaries',
  frenchName: "Les Envoyés",
  verses: 50,
  revelation: 'Meccan'
}, {
  number: 78,
  name: "An-Naba'",
  arabicName: 'النبإ',
  englishName: 'The Tidings',
  frenchName: "La Nouvelle",
  verses: 40,
  revelation: 'Meccan'
}, {
  number: 79,
  name: "An-Nazi'at",
  arabicName: 'النازعات',
  englishName: 'Those who drag forth',
  frenchName: "Ceux qui Arrachent les Ames",
  verses: 46,
  revelation: 'Meccan'
}, {
  number: 80,
  name: 'Abasa',
  arabicName: 'عبس',
  englishName: 'He Frowned',
  frenchName: "Il s'est renfrogné",
  verses: 42,
  revelation: 'Meccan'
}, {
  number: 81,
  name: 'At-Takwir',
  arabicName: 'التكوير',
  englishName: 'The Overthrowing',
  frenchName: "L'Obscurcissement",
  verses: 29,
  revelation: 'Meccan'
}, {
  number: 82,
  name: 'Al-Infitar',
  arabicName: 'الإنفطار',
  englishName: 'The Cleaving',
  frenchName: "La Rupture",
  verses: 19,
  revelation: 'Meccan'
}, {
  number: 83,
  name: 'Al-Mutaffifin',
  arabicName: 'المطففين',
  englishName: 'The Defrauding',
  frenchName: "Les Fraudeurs",
  verses: 36,
  revelation: 'Meccan'
}, {
  number: 84,
  name: 'Al-Inshiqaq',
  arabicName: 'الإنشقاق',
  englishName: 'The Sundering',
  frenchName: "La Déchirure",
  verses: 25,
  revelation: 'Meccan'
}, {
  number: 85,
  name: 'Al-Buruj',
  arabicName: 'البروج',
  englishName: 'The Mansions of the Stars',
  frenchName: "Les Constellations",
  verses: 22,
  revelation: 'Meccan'
}, {
  number: 86,
  name: 'At-Tariq',
  arabicName: 'الطارق',
  englishName: 'The Nightcommer',
  frenchName: "L'Astre Nocturne",
  verses: 17,
  revelation: 'Meccan'
}, {
  number: 87,
  name: "Al-A'la",
  arabicName: 'الأعلى',
  englishName: 'The Most High',
  frenchName: "Le Très Haut",
  verses: 19,
  revelation: 'Meccan'
}, {
  number: 88,
  name: 'Al-Ghashiyah',
  arabicName: 'الغاشية',
  englishName: 'The Overwhelming',
  frenchName: "L'Enveloppante",
  verses: 26,
  revelation: 'Meccan'
}, {
  number: 89,
  name: 'Al-Fajr',
  arabicName: 'الفجر',
  englishName: 'The Dawn',
  frenchName: "L'Aube",
  verses: 30,
  revelation: 'Meccan'
}, {
  number: 90,
  name: 'Al-Balad',
  arabicName: 'البلد',
  englishName: 'The City',
  frenchName: "La Cité",
  verses: 20,
  revelation: 'Meccan'
}, {
  number: 91,
  name: 'Ash-Shams',
  arabicName: 'الشمس',
  englishName: 'The Sun',
  frenchName: "Le Soleil",
  verses: 15,
  revelation: 'Meccan'
}, {
  number: 92,
  name: 'Al-Layl',
  arabicName: 'الليل',
  englishName: 'The Night',
  frenchName: "La Nuit",
  verses: 21,
  revelation: 'Meccan'
}, {
  number: 93,
  name: 'Ad-Duhaa',
  arabicName: 'الضحى',
  englishName: 'The Morning Hours',
  frenchName: "Le Jour Montant",
  verses: 11,
  revelation: 'Meccan'
}, {
  number: 94,
  name: 'Ash-Sharh',
  arabicName: 'الشرح',
  englishName: 'The Relief',
  frenchName: "L'Ouverture",
  verses: 8,
  revelation: 'Meccan'
}, {
  number: 95,
  name: 'At-Tin',
  arabicName: 'التين',
  englishName: 'The Fig',
  frenchName: "Le Figuier",
  verses: 8,
  revelation: 'Meccan'
}, {
  number: 96,
  name: "Al-'Alaq",
  arabicName: 'العلق',
  englishName: 'The Clot',
  frenchName: "L'Adhérence",
  verses: 19,
  revelation: 'Meccan'
}, {
  number: 97,
  name: 'Al-Qadr',
  arabicName: 'القدر',
  englishName: 'The Power',
  frenchName: "La Destinée",
  verses: 5,
  revelation: 'Meccan'
}, {
  number: 98,
  name: 'Al-Bayyinah',
  arabicName: 'البينة',
  englishName: 'The Clear Proof',
  frenchName: "La Preuve",
  verses: 8,
  revelation: 'Medinan'
}, {
  number: 99,
  name: 'Az-Zalzalah',
  arabicName: 'الزلزلة',
  englishName: 'The Earthquake',
  frenchName: "La Secousse",
  verses: 8,
  revelation: 'Medinan'
}, {
  number: 100,
  name: "Al-'Adiyat",
  arabicName: 'العاديات',
  englishName: 'The Courser',
  frenchName: "Les Coursiers",
  verses: 11,
  revelation: 'Meccan'
}, {
  number: 101,
  name: "Al-Qari'ah",
  arabicName: 'القارعة',
  englishName: 'The Calamity',
  frenchName: "Le Fracas",
  verses: 11,
  revelation: 'Meccan'
}, {
  number: 102,
  name: 'At-Takathur',
  arabicName: 'التكاثر',
  englishName: 'The Rivalry in world increase',
  frenchName: "La Course aux Richesses",
  verses: 8,
  revelation: 'Meccan'
}, {
  number: 103,
  name: "Al-'Asr",
  arabicName: 'العصر',
  englishName: 'The Declining Day',
  frenchName: "Le Temps",
  verses: 3,
  revelation: 'Meccan'
}, {
  number: 104,
  name: 'Al-Humazah',
  arabicName: 'الهمزة',
  englishName: 'The Traducer',
  frenchName: "Les Calomniateurs",
  verses: 9,
  revelation: 'Meccan'
}, {
  number: 105,
  name: 'Al-Fil',
  arabicName: 'الفيل',
  englishName: 'The Elephant',
  frenchName: "L'Eléphant",
  verses: 5,
  revelation: 'Meccan'
}, {
  number: 106,
  name: 'Quraysh',
  arabicName: 'قريش',
  englishName: 'Quraysh',
  frenchName: "Les Coraïch",
  verses: 4,
  revelation: 'Meccan'
}, {
  number: 107,
  name: "Al-Ma'un",
  arabicName: 'الماعون',
  englishName: 'The Small kindnesses',
  frenchName: "L'Ustensile",
  verses: 7,
  revelation: 'Meccan'
}, {
  number: 108,
  name: 'Al-Kawthar',
  arabicName: 'الكوثر',
  englishName: 'The Abundance',
  frenchName: "L'Abondance",
  verses: 3,
  revelation: 'Meccan'
}, {
  number: 109,
  name: 'Al-Kafirun',
  arabicName: 'الكافرون',
  englishName: 'The Disbelievers',
  frenchName: "Les Infidèles",
  verses: 6,
  revelation: 'Meccan'
}, {
  number: 110,
  name: 'An-Nasr',
  arabicName: 'النصر',
  englishName: 'The Divine Support',
  frenchName: "Le Secours",
  verses: 3,
  revelation: 'Medinan'
}, {
  number: 111,
  name: 'Al-Masad',
  arabicName: 'المسد',
  englishName: 'The Palm Fiber',
  frenchName: "Les Fibres",
  verses: 5,
  revelation: 'Meccan'
}, {
  number: 112,
  name: 'Al-Ikhlas',
  arabicName: 'الإخلاص',
  englishName: 'The Sincerity',
  frenchName: "Le Monothéisme Pur",
  verses: 4,
  revelation: 'Meccan'
}, {
  number: 113,
  name: 'Al-Falaq',
  arabicName: 'الفلق',
  englishName: 'The Daybreak',
  frenchName: "L'Aube Naissante",
  verses: 5,
  revelation: 'Meccan'
}, {
  number: 114,
  name: 'An-Nas',
  arabicName: 'الناس',
  englishName: 'Mankind',
  frenchName: "Les Hommes",
  verses: 6,
  revelation: 'Meccan'
}];


