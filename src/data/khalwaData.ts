/**
 * Données pour le module Bayt An Nûr - Mode Khalwa
 */

export interface DivineName {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string; // Traduction française
  meaningEn: string; // Traduction anglaise
  description: string;
  visualizations?: Record<string, string>; // ambianceId -> visualisation
}

// Liste des noms divins pour la Khalwa (23 noms exclusifs)
export const divineNames: DivineName[] = [
  {
    id: 'ar-rahman',
    arabic: 'الرَّحْمَن',
    transliteration: 'Ar-Rahman',
    meaning: 'Le Tout Miséricordieux',
    meaningEn: 'The Most Merciful',
    description: 'Ar-Rahman dont la miséricorde embrasse toute la création.',
    visualizations: {
      'forest': 'Assieds-toi sous un arbre, ferme les yeux. Inspire profondément, expire lentement, en récitant mentalement « Ar-Rahman ». Sens la paix envahir ton cœur et chaque pensée.',
      'desert': 'Face aux dunes, ferme les yeux. Sens le vent effleurer ton visage. Inspire et expire en récitant « Ar-Rahman ». Visualise Sa miséricorde qui purifie ton âme comme le vent balaie le sable.',
      'pluie': 'Écoute la pluie tomber. Inspire profondément, expire lentement, en récitant « Ar-Rahman ». Sens chaque goutte nourrir ton cœur de Sa miséricorde.',
      'feu-de-bois': 'Observe les flammes. Respire profondément et récite « Ar-Rahman ». Visualise Sa lumière et Sa chaleur remplir ton cœur de paix.'
    }
  },
  {
    id: 'al-hakim',
    arabic: 'الحَكِيم',
    transliteration: 'Al-Hakim',
    meaning: 'Le Sage',
    meaningEn: 'The Wise',
    description: 'Al-Hakim est Celui dont la sagesse est parfaite.',
    visualizations: {
      'forest': 'Contemple les arbres et les ruisseaux. Respire et répète mentalement « Al-Hakim ». Sens Sa sagesse dans l\'ordre parfait de la nature.',
      'desert': 'Face au vent du désert, inspire et récite « Al-Hakim ». Ressens Sa sagesse qui guide chaque grain de sable et chaque souffle.',
      'pluie': 'Écoute la pluie tomber et répète « Al-Hakim ». Sens l\'ordre divin dans chaque goutte qui nourrit la terre.',
      'feu-de-bois': 'Regarde le feu danser et récite « Al-Hakim ». Sens la sagesse divine dans la force et la lumière qu\'il dégage.'
    }
  },
  {
    id: 'al-qadir',
    arabic: 'القَادِر',
    transliteration: 'Al-Qadir',
    meaning: 'Le Tout-Puissant',
    meaningEn: 'The All-Powerful',
    description: 'Al-Qadir est Celui dont la puissance est absolue.',
    visualizations: {
      'forest': 'Inspire en observant la vie autour de toi et répète « Al-Qadir ». Sens Sa puissance dans chaque souffle, chaque arbre et chaque être vivant.',
      'desert': 'Face aux dunes et au vent, récite « Al-Qadir ». Ressens Sa puissance dans l\'immensité silencieuse.',
      'pluie': 'Écoute les gouttes et répète « Al-Qadir ». Visualise Sa puissance qui fait tomber la pluie et nourrir la terre.',
      'feu-de-bois': 'Observe les flammes et récite « Al-Qadir ». Sens Sa force qui éclaire et purifie tout.'
    }
  },
  {
    id: 'al-latif',
    arabic: 'اللَّطِيف',
    transliteration: 'Al-Latîf',
    meaning: 'Le Subtil, Bienveillant',
    meaningEn: 'The Subtle, The Kind',
    description: 'Al-Latîf est Celui qui est subtil dans Sa bienveillance.',
    visualizations: {
      'forest': 'Inspire en ressentant les bruits doux de la nature. Récite « Yâ Latîf ». Sens Sa subtilité et Sa bienveillance toucher ton cœur.',
      'desert': 'Face au vent du désert, récite « Yâ Latîf ». Sens Sa protection et Sa délicatesse dans chaque souffle.',
      'pluie': 'Écoute la pluie et récite « Yâ Latîf ». Ressens Sa bienveillance subtile dans chaque goutte.',
      'feu-de-bois': 'Observe le feu et récite « Yâ Latîf ». Sens Sa douceur et Sa protection envelopper ton cœur.'
    }
  },
  {
    id: 'ya-latif',
    arabic: 'يَا لَطِيف',
    transliteration: 'Yâ Latîf',
    meaning: 'Le Subtil, Bienveillant',
    meaningEn: 'The Subtle, The Kind',
    description: 'Yâ Latîf est Celui qui est subtil dans Sa bienveillance.',
    visualizations: {
      'forest': 'Inspire en ressentant les bruits doux de la nature. Récite « Yâ Latîf ». Sens Sa subtilité et Sa bienveillance toucher ton cœur.',
      'desert': 'Face au vent du désert, récite « Yâ Latîf ». Sens Sa protection et Sa délicatesse dans chaque souffle.',
      'pluie': 'Écoute la pluie et récite « Yâ Latîf ». Ressens Sa bienveillance subtile dans chaque goutte.',
      'feu-de-bois': 'Observe le feu et récite « Yâ Latîf ». Sens Sa douceur et Sa protection envelopper ton cœur.'
    }
  },
  {
    id: 'al-wadud',
    arabic: 'الوَدُود',
    transliteration: 'Al-Wadud',
    meaning: 'Le Très Aimant',
    meaningEn: 'The Most Loving',
    description: 'Al-Wadud est Celui qui aime Ses serviteurs.',
    visualizations: {
      'forest': 'Inspire profondément, écoute le chant des oiseaux, et récite « Al-Wadud ». Sens Son amour envelopper ton cœur et chaque pensée.',
      'desert': 'Le vent souffle sur ton visage, répète « Al-Wadud ». Ressens Son amour constant et protecteur.',
      'pluie': 'Écoute la pluie et récite « Al-Wadud ». Visualise Son amour descendre comme les gouttes, nourrissant ton âme.',
      'feu-de-bois': 'Observe les flammes et récite « Al-Wadud ». Sens Son amour réchauffer et illuminer ton cœur.'
    }
  },
  {
    id: 'al-hafidh',
    arabic: 'الحَفِيظ',
    transliteration: 'Al-Hafidh',
    meaning: 'Le Protecteur',
    meaningEn: 'The Protector',
    description: 'Al-Hafidh est Celui qui protège et préserve.',
    visualizations: {
      'forest': 'Inspire et récite « Yâ Hafidh ». Sens Sa protection comme les arbres protègent la vie autour.',
      'desert': 'Face au vent, répète « Yâ Hafidh ». Ressens Sa protection dans l\'immensité silencieuse.',
      'pluie': 'Écoute la pluie et récite « Yâ Hafidh ». Visualise Sa protection tomber sur toi avec chaque goutte.',
      'feu-de-bois': 'Observe les flammes et récite « Yâ Hafidh ». Sens Sa lumière protectrice remplir ton cœur.'
    }
  },
  {
    id: 'ya-hafidh',
    arabic: 'يَا حَفِيظ',
    transliteration: 'Yâ Hafidh',
    meaning: 'Le Protecteur',
    meaningEn: 'The Protector',
    description: 'Yâ Hafidh est Celui qui protège et préserve.',
    visualizations: {
      'forest': 'Inspire et récite « Yâ Hafidh ». Sens Sa protection comme les arbres protègent la vie autour.',
      'desert': 'Face au vent, répète « Yâ Hafidh ». Ressens Sa protection dans l\'immensité silencieuse.',
      'pluie': 'Écoute la pluie et récite « Yâ Hafidh ». Visualise Sa protection tomber sur toi avec chaque goutte.',
      'feu-de-bois': 'Observe les flammes et récite « Yâ Hafidh ». Sens Sa lumière protectrice remplir ton cœur.'
    }
  },
  {
    id: 'al-qawiyy',
    arabic: 'القَوِي',
    transliteration: 'Al-Qawiyy',
    meaning: 'Le Fort, Le Puissant',
    meaningEn: 'The Strong, The Powerful',
    description: 'Al-Qawiyy est Celui qui donne la force, l\'endurance, la stabilité et la capacité d\'agir.',
    visualizations: {
      'forest': 'Inspire profondément et récite « Yâ Qawiyy ». Sens Sa force dans chaque arbre, chaque racine qui s\'ancre profondément. Visualise cette force divine remplir ton cœur et te donner l\'endurance.',
      'desert': 'Face au vent du désert, répète « Yâ Qawiyy ». Ressens Sa puissance dans l\'immensité et la stabilité des dunes. Sens cette force t\'ancrer et te stabiliser.',
      'pluie': 'Écoute la pluie et récite « Yâ Qawiyy ». Visualise Sa force nourrir la terre et donner vie. Sens cette puissance divine renforcer ta détermination.',
      'feu-de-bois': 'Observe les flammes et récite « Yâ Qawiyy ». Sens Sa force dans la chaleur et la lumière. Visualise cette puissance remplir ton cœur de détermination.'
    }
  },
  {
    id: 'ya-qawiyy',
    arabic: 'يَا قَوِي',
    transliteration: 'Yâ Qawiyy',
    meaning: 'Le Fort, Le Puissant',
    meaningEn: 'The Strong, The Powerful',
    description: 'Yâ Qawiyy est Celui qui donne la force, l\'endurance, la stabilité et la capacité d\'agir.',
    visualizations: {
      'forest': 'Inspire et récite « Al-Hafidh ». Sens Sa protection comme les arbres protègent la vie autour.',
      'desert': 'Face au vent, répète « Al-Hafidh ». Ressens Sa protection dans l\'immensité silencieuse.',
      'pluie': 'Écoute la pluie et récite « Al-Hafidh ». Visualise Sa protection tomber sur toi avec chaque goutte.',
      'feu-de-bois': 'Observe les flammes et récite « Al-Hafidh ». Sens Sa lumière protectrice remplir ton cœur.'
    }
  },
  {
    id: 'as-sami',
    arabic: 'السَّمِيع',
    transliteration: 'As-Sami\'',
    meaning: 'L\'Audient',
    meaningEn: 'The All-Hearing',
    description: 'As-Sami\' est Celui qui entend tout.',
    visualizations: {
      'forest': 'Inspire et récite « As-Sami\' ». Sens qu\'Il entend chaque pensée et chaque souffle.',
      'desert': 'Le vent te caresse, répète « As-Sami\' ». Ressens qu\'Il perçoit même ce qui est silencieux.',
      'pluie': 'Écoute la pluie et récite « As-Sami\' ». Sens que chaque goutte et chaque murmure Lui sont connus.',
      'feu-de-bois': 'Observe le feu et répète « As-Sami\' ». Sens qu\'Il entend et perçoit tout autour de toi.'
    }
  },
  {
    id: 'al-basir',
    arabic: 'البَصِير',
    transliteration: 'Al-Basir',
    meaning: 'Le Voyant',
    meaningEn: 'The All-Seeing',
    description: 'Al-Basir est Celui qui voit tout.',
    visualizations: {
      'forest': 'Inspire et récite « Al-Basir ». Sens que chaque détail de la vie est sous Son regard.',
      'desert': 'Face au vent et aux dunes, répète « Al-Basir ». Ressens que rien n\'échappe à Sa vision.',
      'pluie': 'Écoute la pluie et récite « Al-Basir ». Sens Sa présence attentive dans chaque goutte.',
      'feu-de-bois': 'Observe les flammes et répète « Al-Basir ». Visualise Son regard illuminant et veillant sur tout.'
    }
  },
  {
    id: 'al-mujib',
    arabic: 'المُجِيب',
    transliteration: 'Al-Mujib',
    meaning: 'Celui qui Répond',
    meaningEn: 'The Responsive',
    description: 'Al-Mujib est Celui qui répond aux invocations.',
    visualizations: {
      'forest': 'Inspire profondément et récite « Al-Mujib ». Sens qu\'Il entend tes besoins et y répond par Sa miséricorde.',
      'desert': 'Le vent te touche, répète « Al-Mujib ». Ressens qu\'Il répond même dans le silence et l\'immensité.',
      'pluie': 'Écoute la pluie et récite « Al-Mujib ». Visualise chaque goutte comme une réponse de Sa bienveillance.',
      'feu-de-bois': 'Observe les flammes et récite « Al-Mujib ». Sens Sa réponse arriver à toi avec clarté et lumière.'
    }
  },
  {
    id: 'al-quddus',
    arabic: 'القُدُّوس',
    transliteration: 'Al-Quddus',
    meaning: 'Le Pur, Le Saint',
    meaningEn: 'The Pure, The Holy',
    description: 'Al-Quddus est Celui qui est absolument pur.',
    visualizations: {
      'forest': 'Inspire et récite « Al-Quddus ». Sens la pureté et la sainteté d\'Allah purifier ton cœur.',
      'desert': 'Face au vent, répète « Al-Quddus ». Ressens que Son caractère pur éclaire même les lieux arides.',
      'pluie': 'Écoute la pluie et récite « Al-Quddus ». Sens la purification de ton âme à chaque goutte.',
      'feu-de-bois': 'Observe le feu et répète « Al-Quddus ». Visualise Sa pureté dissiper toute obscurité intérieure.'
    }
  },
  {
    id: 'al-aziz',
    arabic: 'العَزِيز',
    transliteration: 'Al-Aziz',
    meaning: 'Le Tout-Puissant, L\'Invincible',
    meaningEn: 'The All-Powerful, The Invincible',
    description: 'Al-Aziz est Celui qui est puissant et invincible.',
    visualizations: {
      'forest': 'Inspire profondément et récite « Al-Aziz ». Sens Sa puissance dans la stabilité des arbres et la force de la vie qui t\'entoure.',
      'desert': 'Face au vent, répète « Al-Aziz ». Ressens Sa force qui domine l\'immensité silencieuse et le temps.',
      'pluie': 'Écoute les gouttes et récite « Al-Aziz ». Visualise Sa puissance nourrissant la terre et soutenant toute vie.',
      'feu-de-bois': 'Observe le feu et répète « Al-Aziz ». Sens Sa puissance qui éclaire et transforme, invincible et parfaite.'
    }
  },
  {
    id: 'al-ghaffar',
    arabic: 'الغَفَّار',
    transliteration: 'Al-Ghaffar',
    meaning: 'Le Grand Pardonneur',
    meaningEn: 'The Great Forgiver',
    description: 'Al-Ghaffar est Celui qui pardonne abondamment.',
    visualizations: {
      'forest': 'Inspire et récite « Al-Ghaffar ». Sens Ses pardons descendre comme la lumière à travers les feuilles, purifiant ton cœur.',
      'desert': 'Face au vent chaud, répète « Al-Ghaffar ». Ressens qu\'Il efface les erreurs passées comme le vent balaie le sable.',
      'pluie': 'Écoute la pluie et récite « Al-Ghaffar ». Visualise chaque goutte emporter tes fautes et apaiser ton âme.',
      'feu-de-bois': 'Observe le feu et répète « Al-Ghaffar ». Sens Ses pardons réchauffer ton cœur et éclairer ton esprit.'
    }
  },
  {
    id: 'ar-razzaq',
    arabic: 'الرَّزَّاق',
    transliteration: 'Ar-Razzaq',
    meaning: 'Le Pourvoyeur',
    meaningEn: 'The Provider',
    description: 'Ar-Razzaq est Celui qui pourvoit à tous les besoins.',
    visualizations: {
      'forest': 'Inspire profondément et récite « Ar-Razzaq ». Sens que chaque arbre, chaque brin d\'herbe reflète Sa générosité.',
      'desert': 'Le vent souffle sur les dunes, répète « Ar-Razzaq ». Ressens que Sa providence atteint même les lieux les plus arides.',
      'pluie': 'Écoute les gouttes tomber et récite « Ar-Razzaq ». Visualise Sa générosité qui nourrit ton cœur et la terre.',
      'feu-de-bois': 'Observe le feu et répète « Ar-Razzaq ». Sens Sa lumière pourvoir à tes besoins et illuminer ton chemin.'
    }
  },
  {
    id: 'al-shakur',
    arabic: 'الشَّكُور',
    transliteration: 'Al-Shakur',
    meaning: 'Le Reconnaissant, Celui qui récompense',
    meaningEn: 'The Appreciative, The Rewarder',
    description: 'Al-Shakur est Celui qui récompense abondamment.',
    visualizations: {
      'forest': 'Inspire et récite « Al-Shakur ». Sens qu\'Il valorise chaque effort et chaque intention pure dans ton cœur.',
      'desert': 'Face au vent, répète « Al-Shakur ». Ressens que chaque pas, chaque souffle, est reconnu par Lui.',
      'pluie': 'Écoute la pluie et récite « Al-Shakur ». Visualise Ses récompenses tomber comme chaque goutte sur la terre.',
      'feu-de-bois': 'Observe le feu et récite « Al-Shakur ». Sens Sa gratitude illuminer ton cœur et renforcer ta foi.'
    }
  },
  {
    id: 'al-mu\'min',
    arabic: 'المُؤمِن',
    transliteration: 'Al-Mu\'min',
    meaning: 'Le Protecteur de la Foi',
    meaningEn: 'The Guardian of Faith',
    description: 'Al-Mu\'min est Celui qui protège la foi.',
    visualizations: {
      'forest': 'Inspire et récite « Al-Mu\'min ». Sens que ta foi est protégée et renforcée par Sa présence.',
      'desert': 'Face au vent, répète « Al-Mu\'min ». Ressens la solidité de ta foi malgré l\'immensité et le silence du désert.',
      'pluie': 'Écoute la pluie et récite « Al-Mu\'min ». Visualise Sa protection fortifiant ton cœur et ton esprit.',
      'feu-de-bois': 'Observe le feu et récite « Al-Mu\'min ». Sens ta foi illuminée et défendue par Sa lumière.'
    }
  },
  {
    id: 'al-jabbar',
    arabic: 'الجَبَّار',
    transliteration: 'Al-Jabbar',
    meaning: 'Le Contraignant, L\'Omnipotent',
    meaningEn: 'The Compeller, The Omnipotent',
    description: 'Al-Jabbar est Celui dont la puissance ordonne tout.',
    visualizations: {
      'forest': 'Inspire et récite « Al-Jabbar ». Sens Sa force ordonner la vie autour de toi, puissante et parfaite.',
      'desert': 'Le vent balaie le sable, répète « Al-Jabbar ». Ressens Sa puissance inébranlable dans chaque élément.',
      'pluie': 'Écoute les gouttes et récite « Al-Jabbar ». Visualise Sa force qui soutient et équilibre le monde.',
      'feu-de-bois': 'Observe le feu et répète « Al-Jabbar ». Sens Sa puissance qui purifie et domine toutes choses.'
    }
  },
  {
    id: 'al-karim',
    arabic: 'الكَرِيم',
    transliteration: 'Al-Karim',
    meaning: 'Le Généreux',
    meaningEn: 'The Generous',
    description: 'Al-Karim est Celui qui est généreux au-delà de toute mesure.',
    visualizations: {
      'forest': 'Inspire profondément et récite « Al-Karim ». Sens Sa générosité dans chaque arbre, chaque feuille, chaque souffle.',
      'desert': 'Face au vent, répète « Al-Karim ». Ressens que même les lieux arides reçoivent Sa bonté infinie.',
      'pluie': 'Écoute la pluie et récite « Al-Karim ». Visualise Sa générosité qui descend et nourrit ton cœur et ton âme.',
      'feu-de-bois': 'Observe le feu et répète « Al-Karim ». Sens Sa lumière généreuse réchauffer et illuminer tout autour de toi.'
    }
  },
  {
    id: 'as-salam',
    arabic: 'السَّلَام',
    transliteration: 'As-Salam',
    meaning: 'La Paix, L\'Origine de la Paix',
    meaningEn: 'The Peace, The Source of Peace',
    description: 'As-Salam est la source de toute paix.',
    visualizations: {
      'forest': 'Inspire et récite « As-Salam ». Sens la paix divine circuler dans ton cœur et ton esprit.',
      'desert': 'Face au vent, répète « As-Salam ». Ressens la tranquillité et la protection dans le silence du désert.',
      'pluie': 'Écoute la pluie et récite « As-Salam ». Visualise Sa paix tomber sur toi comme chaque goutte.',
      'feu-de-bois': 'Observe le feu et répète « As-Salam ». Sens Sa lumière apporter sérénité et équilibre intérieur.'
    }
  },
  {
    id: 'al-majeed',
    arabic: 'المَجِيد',
    transliteration: 'Al-Majeed',
    meaning: 'Le Glorieux',
    meaningEn: 'The Glorious',
    description: 'Al-Majeed est Celui dont la gloire est incomparable.',
    visualizations: {
      'forest': 'Inspire profondément et récite « Al-Majeed ». Sens la gloire d\'Allah dans l\'harmonie et la beauté de la nature.',
      'desert': 'Face au vent, répète « Al-Majeed ». Ressens Sa grandeur et Sa gloire dans l\'immensité et le silence.',
      'pluie': 'Écoute la pluie et récite « Al-Majeed ». Visualise Sa gloire se manifester dans chaque goutte nourrissante.',
      'feu-de-bois': 'Observe le feu et répète « Al-Majeed ». Sens Sa majesté et Sa lumière emplir ton cœur et ton esprit.'
    }
  },
  {
    id: 'al-hadi',
    arabic: 'الهَادِي',
    transliteration: 'Al-Hadi',
    meaning: 'Le Guide, Celui qui Guide',
    meaningEn: 'The Guide, The One Who Guides',
    description: 'Al-Hadi est Celui qui guide vers le droit chemin.',
    visualizations: {
      'forest': 'Inspire et récite « Al-Hadi ». Sens qu\'Il guide chaque pas et chaque pensée dans le droit chemin.',
      'desert': 'Face au vent, répète « Al-Hadi ». Visualise Sa guidance te menant à travers l\'immensité silencieuse et les épreuves.',
      'pluie': 'Écoute la pluie et récite « Al-Hadi ». Sens Sa guidance nourrir ton cœur et éclairer ton esprit.',
      'feu-de-bois': 'Observe le feu et répète « Al-Hadi ». Visualise Sa lumière te guidant dans l\'obscurité, protégeant et éclairant ton chemin.'
    }
  },
  {
    id: 'ya-nur',
    arabic: 'يَا نُور',
    transliteration: 'Ya Nur',
    meaning: 'La Lumière',
    meaningEn: 'The Light',
    description: 'Ya Nur est la Lumière divine qui illumine.',
    visualizations: {
      'forest': 'Assieds-toi sous un arbre, ferme les yeux. Inspire profondément, expire lentement. Visualise une lumière pure descendante d\'Allah (Nûr) qui enveloppe ton cœur et illumine chaque pensée. À chaque respiration, récite mentalement « Yâ Nûr ». Sens la clarté et la paix remplir ton âme.',
      'desert': 'Face aux dunes, ferme les yeux et sens le vent du désert effleurer ton visage. Imagine que chaque rafale apporte un rayon de Nûr, purifiant ton cœur et éclairant ton esprit. Récite « Yâ Nûr » à chaque souffle.',
      'pluie': 'Écoute la pluie tomber et visualise chaque goutte comme un rayon de lumière d\'Allah. À chaque respiration, récite « Yâ Nûr ». Sens ton âme se remplir de clarté et de guidance.',
      'feu-de-bois': 'Observe les flammes et imagine leur chaleur transformée en lumière divine. Récite « Yâ Nûr » à chaque souffle et sens ton cœur illuminé et apaisé.'
    }
  },
  {
    id: 'ya-fatah',
    arabic: 'يَا فَتَّاح',
    transliteration: 'Ya Fatah',
    meaning: 'Le Grand Ouvreur',
    meaningEn: 'The Great Opener',
    description: 'Ya Fatah est Celui qui ouvre les portes.',
    visualizations: {
      'forest': 'Inspire profondément, ferme les yeux et récite « Ya Fatah ». Visualise Allah ouvrant des chemins de guidance, de sagesse et de bénédiction autour de toi, comme si chaque arbre révélait un passage secret vers Sa lumière.',
      'desert': 'Face au vent, répète « Ya Fatah ». Sens que chaque souffle ouvre ton cœur, purifie ton esprit et te guide dans l\'immensité silencieuse.',
      'pluie': 'Écoute la pluie et récite « Ya Fatah ». Visualise chaque goutte comme une ouverture vers la miséricorde et les bienfaits d\'Allah.',
      'feu-de-bois': 'Observe le feu et récite « Ya Fatah ». Sens chaque flamme comme une ouverture vers la clarté intérieure et la guidance divine.'
    }
  },
  {
    id: 'ya-allah',
    arabic: 'يَا اللَّه',
    transliteration: 'Ya Allah',
    meaning: 'Le Nom Universel',
    meaningEn: 'The Universal Name',
    description: 'Ya Allah est le Nom Suprême qui englobe tout.',
    visualizations: {
      'forest': 'Inspire profondément, ferme les yeux et récite « Ya Allah ». Ressens la présence d\'Allah remplir chaque souffle et chaque pensée, connectant ton cœur à Sa grandeur infinie.',
      'desert': 'Face au vent du désert, répète « Ya Allah ». Sens que même dans le silence et l\'immensité, Allah est proche, guidant et protégeant ton âme.',
      'pluie': 'Écoute la pluie et récite « Ya Allah ». Visualise chaque goutte comme une manifestation de Sa miséricorde et de Son attention.',
      'feu-de-bois': 'Observe le feu et répète « Ya Allah ». Sens Son nom illuminer ton cœur, purifier tes pensées et renforcer ta foi.'
    }
  }
];

// Mapping intention → nom divin suggéré (optionnel, peut être aléatoire en V1)
export const intentionToNameMapping: Record<string, string[]> = {
  'calme': ['as-salam', 'al-latif', 'al-wadud'],
  'peur': ['al-wali', 'al-hafiz', 'al-mu\'min'],
  'remercier': ['ar-rahman', 'ar-rahim', 'al-karim'],
  'pardon': ['al-ghafur', 'ar-rahim', 'al-wadud'],
  'guidance': ['al-hakim', 'al-wali', 'al-mujib'],
  'paix': ['as-salam', 'al-latif', 'al-wadud'],
  'force': ['al-aziz', 'al-malik', 'al-mutakabbir'],
  'protection': ['al-hafiz', 'al-wali', 'al-muhaymin']
};

// Types de respiration - Simplifié : seulement le mode libre (normal)
export type BreathingType = 'libre';

// Ambiances sonores
export interface SoundAmbiance {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const soundAmbiances: SoundAmbiance[] = [
  {
    id: 'pluie',
    name: 'Pluie',
    icon: '🌧️',
    description: 'Bruit de pluie apaisant'
  },
  {
    id: 'forest',
    name: 'Forêt',
    icon: '🌲',
    description: 'Vent dans les arbres'
  },
  {
    id: 'desert',
    name: 'Désert',
    icon: '🏜️',
    description: 'Vent doux'
  },
  {
    id: 'feu-de-bois',
    name: 'Feu de bois',
    icon: '🔥',
    description: 'Crépitement du feu'
  },
  {
    id: 'neige-faina',
    name: 'Neige (ambiance Faïna)',
    icon: '❄️',
    description: 'Ambiance secrète - Neige apaisante'
  },
  {
    id: 'silence',
    name: 'Silence',
    icon: '🔇',
    description: 'Aucun son'
  }
];

// Mapping des IDs d'ambiance vers les fichiers audio
export const soundAmbianceFiles: Record<string, string> = {
  'pluie': '/son/pluie.mp4',
  'forest': '/son/forêt.mp4',
  'desert': '/son/desert.mp4',
  'feu-de-bois': '/son/feu de bois.mp4',
  'neige-faina': '/son/faina.mp3',
  'silence': '' // Pas de fichier pour le silence
};

// Configuration des thèmes visuels pour chaque ambiance
export interface AmbianceTheme {
  id: string;
  name: string;
  backgroundGradient: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  textSecondaryColor: string;
  cardBackground: string;
  cardBorderColor: string;
  buttonBackground: string;
  buttonTextColor: string;
  icon: string;
  decorativeIcons: string[];
}

export const THEME_CONFIG: Record<string, AmbianceTheme> = {
  'forest': {
    id: 'forest',
    name: 'Forêt',
    backgroundGradient: 'linear-gradient(180deg, #1a3d1a 0%, #2d5a2d 50%, #1a3d1a 100%)',
    primaryColor: '#4a7c4a',
    accentColor: '#90ee90',
    textColor: '#e8f5e8',
    textSecondaryColor: '#c4e4c4',
    cardBackground: 'rgba(74, 124, 74, 0.15)',
    cardBorderColor: 'rgba(144, 238, 144, 0.3)',
    buttonBackground: 'rgba(74, 124, 74, 0.2)',
    buttonTextColor: '#e8f5e8',
    icon: '🌲',
    decorativeIcons: ['🌳', '🍃', '🌿', '🌱', '🦋', '🐦']
  },
  'pluie': {
    id: 'pluie',
    name: 'Pluie',
    backgroundGradient: 'linear-gradient(180deg, #2d3a4a 0%, #3d4a5a 50%, #2d3a4a 100%)',
    primaryColor: '#5a7a9a',
    accentColor: '#87ceeb',
    textColor: '#e8f4f8',
    textSecondaryColor: '#c4d8e4',
    cardBackground: 'rgba(90, 122, 154, 0.15)',
    cardBorderColor: 'rgba(135, 206, 235, 0.3)',
    buttonBackground: 'rgba(90, 122, 154, 0.2)',
    buttonTextColor: '#e8f4f8',
    icon: '🌧️',
    decorativeIcons: ['💧', '🌊', '☔', '🌦️', '💙', '☁️']
  },
  'feu-de-bois': {
    id: 'feu-de-bois',
    name: 'Feu de bois',
    backgroundGradient: 'linear-gradient(180deg, #2a1a0a 0%, #3d2a1a 50%, #2a1a0a 100%)',
    primaryColor: '#8b4513',
    accentColor: '#ff6b35',
    textColor: '#ffe8d6',
    textSecondaryColor: '#f4d4a6',
    cardBackground: 'rgba(139, 69, 19, 0.15)',
    cardBorderColor: 'rgba(255, 107, 53, 0.3)',
    buttonBackground: 'rgba(139, 69, 19, 0.2)',
    buttonTextColor: '#ffe8d6',
    icon: '🔥',
    decorativeIcons: ['🔥', '🕯️', '✨', '🌟', '💫', '🪵']
  },
  'desert': {
    id: 'desert',
    name: 'Désert',
    backgroundGradient: 'linear-gradient(180deg, #3d2a1a 0%, #5a3d2d 50%, #3d2a1a 100%)',
    primaryColor: '#d4a574',
    accentColor: '#f4d4a6',
    textColor: '#f5e6d3',
    textSecondaryColor: '#e6c49a',
    cardBackground: 'rgba(212, 165, 116, 0.15)',
    cardBorderColor: 'rgba(244, 212, 166, 0.3)',
    buttonBackground: 'rgba(212, 165, 116, 0.2)',
    buttonTextColor: '#f5e6d3',
    icon: '🏜️',
    decorativeIcons: ['🌵', '☀️', '🌅', '🏜️', '🐪', '⭐']
  },
  'neige-faina': {
    id: 'neige-faina',
    name: 'Neige (ambiance Faïna)',
    backgroundGradient: 'linear-gradient(180deg, #2d3a4a 0%, #4a5a6a 50%, #2d3a4a 100%)',
    primaryColor: '#87ceeb',
    accentColor: '#b0e0e6',
    textColor: '#f0f8ff',
    textSecondaryColor: '#d3e0e6',
    cardBackground: 'rgba(135, 206, 235, 0.15)',
    cardBorderColor: 'rgba(176, 224, 230, 0.3)',
    buttonBackground: 'rgba(135, 206, 235, 0.2)',
    buttonTextColor: '#f0f8ff',
    icon: '❄️',
    decorativeIcons: ['❄️', '🌨️', '⛄', '❄️', '🌨️', '❄️']
  },
  'silence': {
    id: 'silence',
    name: 'Silence',
    backgroundGradient: 'linear-gradient(180deg, #0A0F2C 0%, #1E1E2F 100%)',
    primaryColor: '#FFD369',
    accentColor: '#9B59B6',
    textColor: '#ffffff',
    textSecondaryColor: '#e0e0e0',
    cardBackground: 'rgba(255, 211, 105, 0.1)',
    cardBorderColor: 'rgba(255, 211, 105, 0.2)',
    buttonBackground: 'rgba(255, 255, 255, 0.1)',
    buttonTextColor: '#ffffff',
    icon: '🔇',
    decorativeIcons: ['✨', '🌟', '💫', '⭐', '🌙']
  }
};

// Fonction pour obtenir le thème d'une ambiance
export function getAmbianceTheme(ambianceId: string): AmbianceTheme {
  return THEME_CONFIG[ambianceId] || THEME_CONFIG['silence'];
}

// Durées disponibles (en minutes) - Simplifiées pour une expérience plus concentrée
export const availableDurations = [5, 10, 15];

// Fonction pour suggérer un nom divin basé sur l'intention
export function suggestDivineName(intention: string): DivineName {
  const lowerIntention = intention.toLowerCase();

  // Chercher des mots-clés dans l'intention
  for (const [keyword, nameIds] of Object.entries(intentionToNameMapping)) {
    if (lowerIntention.includes(keyword)) {
      const suggestedId = nameIds[Math.floor(Math.random() * nameIds.length)];
      const name = divineNames.find(n => n.id === suggestedId);
      if (name) return name;
    }
  }

  // Si aucun mapping trouvé, retourner un nom aléatoire
  return divineNames[Math.floor(Math.random() * divineNames.length)];
}

// Fonction pour suggérer 3 noms divins basés sur l'intention
export function suggestDivineNames(intention: string, count: number = 3): DivineName[] {
  const lowerIntention = intention.toLowerCase();

  // 1. Chercher des correspondances exactes par mots-clés
  const matchedNames: DivineName[] = [];
  const seenIds = new Set<string>();

  for (const [keyword, nameIds] of Object.entries(intentionToNameMapping)) {
    if (lowerIntention.includes(keyword)) {
      // Mélanger les IDs pour ne pas toujours prendre les mêmes
      const shuffledIds = [...nameIds].sort(() => Math.random() - 0.5);

      for (const id of shuffledIds) {
        if (!seenIds.has(id)) {
          const name = divineNames.find(n => n.id === id);
          if (name) {
            matchedNames.push(name);
            seenIds.add(id);
          }
        }
      }
    }
  }

  // Mélanger les résultats trouvés
  matchedNames.sort(() => Math.random() - 0.5);

  // 2. Si on n'a pas assez de noms, compléter avec des noms aléatoires
  while (matchedNames.length < count) {
    const randomName = divineNames[Math.floor(Math.random() * divineNames.length)];
    if (!seenIds.has(randomName.id)) {
      matchedNames.push(randomName);
      seenIds.add(randomName.id);
    }
  }

  // Retourner le nombre demandé
  return matchedNames.slice(0, count);
}

// Fonction pour obtenir un nom divin aléatoire
export function getRandomDivineName(): DivineName {
  return divineNames[Math.floor(Math.random() * divineNames.length)];
}

// Mapping des noms de khalwa depuis les défis vers les noms divins
const khalwaNameMapping: Record<string, string> = {
  'yâ allah': 'allah', // Utiliser le nom divin spécial "Allah"
  'ya allah': 'allah',
  'allâh': 'allah',
  'allah': 'allah',
  'yâ nûr': 'ya-nur',
  'ya nur': 'ya-nur',
  'yâ nur': 'ya-nur',
  'nûr': 'ya-nur',
  'nur': 'ya-nur',
  'yâ hafidh': 'ya-hafidh',
  'ya hafidh': 'ya-hafidh',
  'yâ hafiz': 'ya-hafidh',
  'hafidh': 'ya-hafidh',
  'hafiz': 'ya-hafidh',
  'yâ qawiyy': 'ya-qawiyy',
  'ya qawiyy': 'ya-qawiyy',
  'qawiyy': 'ya-qawiyy',
  'qawi': 'ya-qawiyy',
  'yâ latîf': 'ya-latif',
  'ya latif': 'ya-latif',
  'yâ latif': 'ya-latif',
  'latîf': 'ya-latif',
  'latif': 'ya-latif',
};

// Fonction pour extraire le nom du khalwa depuis la description d'une tâche
export function extractKhalwaName(taskDescription: string): string | null {
  // Pattern pour extraire le nom après "Kalwa :" ou "Kalwa:"
  // Gère les cas avec guillemets, sans guillemets, et avec "× 99" ou autres suffixes

  // Essayer d'abord avec guillemets (simple ou double)
  let match = taskDescription.match(/Kalwa\s*:\s*["']([^"']+)(?:\s*×\s*\d+)?["']/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Si pas de guillemets, extraire jusqu'à la fin ou jusqu'à "×" suivi d'un nombre
  match = taskDescription.match(/Kalwa\s*:\s*([^×]+?)(?:\s*×\s*\d+)?$/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

// Fonction pour mapper un nom de khalwa vers un DivineName
export function mapKhalwaNameToDivineName(khalwaName: string): DivineName | null {
  const normalizedName = khalwaName.toLowerCase().trim();

  // Vérifier d'abord le mapping direct
  const mappedId = khalwaNameMapping[normalizedName];
  if (mappedId) {
    const divineName = divineNames.find(n => n.id === mappedId);
    if (divineName) return divineName;
  }

  // Chercher par transliteration (sans le préfixe "Yâ" ou "Ya")
  const nameWithoutPrefix = normalizedName.replace(/^yâ\s+|^ya\s+/i, '');
  const divineName = divineNames.find(n =>
    n.transliteration.toLowerCase().replace(/[^a-z0-9]/g, '') ===
    nameWithoutPrefix.replace(/[^a-z0-9]/g, '')
  );
  if (divineName) return divineName;

  // Si aucun mapping trouvé, retourner null (sera géré par le composant)
  return null;
}

