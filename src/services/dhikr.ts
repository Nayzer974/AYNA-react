/**
 * Service pour récupérer les dhikr (invocations)
 * 
 * Adapté pour React Native depuis le service web
 */

export interface DhikrItem {
  text: string;
  translation?: string;
  language?: string;
  reference?: string;
}

/**
 * Récupère tous les dhikr depuis l'API
 */
async function fetchAllDhikr(): Promise<DhikrItem[]> {
  try {
    // Utiliser l'API dua-dhikr
    const baseUrl = 'https://dua-dhikr.onrender.com';
    const response = await fetch(`${baseUrl}/api/dhikr`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Normaliser les données
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data.dhikr && Array.isArray(data.dhikr)) {
      return data.dhikr;
    }
    
    return [];
  } catch (e) {
    console.warn('Erreur lors de la récupération des dhikr:', e);
    return getFallbackDhikr();
  }
}

/**
 * Dhikr de secours si l'API échoue
 */
function getFallbackDhikr(): DhikrItem[] {
  return [
    { text: 'لَا إِلَٰهَ إِلَّا اللَّهُ', translation: "Il n'y a de divinité qu'Allah", language: 'ar', reference: 'Coran 47:19' },
    { text: 'سُبْحَانَ اللَّهِ', translation: 'Gloire à Allah', language: 'ar', reference: 'Coran 17:1' },
    { text: 'الْحَمْدُ لِلَّهِ', translation: 'Louange à Allah', language: 'ar', reference: 'Coran 1:2' },
    { text: 'اللَّهُ أَكْبَرُ', translation: 'Allah est le plus grand', language: 'ar', reference: 'Coran 9:33' },
    { text: 'أَسْتَغْفِرُ اللَّهَ', translation: "Je demande pardon à Allah", language: 'ar', reference: 'Coran 71:10' },
    { text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', translation: "Il n'y a de force ni de puissance qu'en Allah", language: 'ar', reference: 'Hadith' },
    { text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', translation: "Notre Seigneur, donne-nous le bien dans ce monde et le bien dans l'au-delà, et protège-nous du châtiment du Feu", language: 'ar', reference: 'Coran 2:201' },
  ];
}

/**
 * Récupère le dhikr du jour
 * 
 * @param preferredLang Langue préférée (par défaut: 'fr')
 * @returns Le dhikr du jour ou null si aucune donnée disponible
 */
export async function getDhikrOfDay(preferredLang = 'fr'): Promise<DhikrItem | null> {
  const all = await fetchAllDhikr();
  if (all.length === 0) return null;
  
  // Si les données de l'API n'ont pas de traduction, essayer de les extraire du texte
  const processed = all.map(d => {
    // Si le texte contient " (traduction)", extraire les deux parties
    if (d.text && !d.translation && d.text.includes(' (')) {
      const match = d.text.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        return {
          ...d,
          text: match[1].trim(),
          translation: match[2].trim()
        };
      }
    }
    return d;
  });
  
  // Essayer de trouver des items dans la langue préférée ou en arabe
  const inLang = processed.filter(d => 
    (d.language || '').toLowerCase().includes(preferredLang) || 
    (d.language || '').toLowerCase().includes('ar')
  );
  const list = inLang.length > 0 ? inLang : processed;
  
  // Calculer l'index du jour (basé sur le nombre de jours depuis l'époque)
  const dayIndex = Math.floor((Date.now() / 86400000)) % list.length;
  
  return list[dayIndex] || list[0] || null;
}

