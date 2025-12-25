/**
 * Utilitaires pour les événements du calendrier
 * Détecte les événements religieux et spéciaux pour une date donnée
 */

export interface CalendarEvent {
  name: string;
  nameAr?: string;
  description?: string;
  type: 'hijri_month' | 'special_day' | 'religious_event';
  isImportant?: boolean;
}

// Événements religieux majeurs avec leurs dates Hijri
export const RELIGIOUS_EVENTS: Array<{
  name: string;
  nameAr: string;
  hijriMonth: number;
  hijriDay: number;
  description: string;
  type: 'hijri_month' | 'special_day' | 'religious_event';
  isImportant: boolean;
}> = [
  // Mois spéciaux
  {
    name: 'Ramadan',
    nameAr: 'رمضان',
    hijriMonth: 9,
    hijriDay: 1,
    description: 'Mois sacré du jeûne',
    type: 'hijri_month',
    isImportant: true,
  },
  {
    name: 'Muharram',
    nameAr: 'محرم',
    hijriMonth: 1,
    hijriDay: 1,
    description: 'Premier mois de l\'année Hijri',
    type: 'hijri_month',
    isImportant: false,
  },
  {
    name: 'Shawwal',
    nameAr: 'شوال',
    hijriMonth: 10,
    hijriDay: 1,
    description: 'Mois d\'Eid al-Fitr',
    type: 'hijri_month',
    isImportant: false,
  },
  {
    name: 'Dhul-Hijjah',
    nameAr: 'ذو الحجة',
    hijriMonth: 12,
    hijriDay: 1,
    description: 'Mois du pèlerinage et d\'Eid al-Adha',
    type: 'hijri_month',
    isImportant: true,
  },
  
  // Jours spéciaux
  {
    name: 'Laylat al-Qadr',
    nameAr: 'ليلة القدر',
    hijriMonth: 9,
    hijriDay: 27,
    description: 'Nuit du Destin (dernière décade de Ramadan)',
    type: 'special_day',
    isImportant: true,
  },
  {
    name: 'Ashura',
    nameAr: 'عاشوراء',
    hijriMonth: 1,
    hijriDay: 10,
    description: '10ème jour de Muharram',
    type: 'special_day',
    isImportant: true,
  },
  {
    name: 'Mawlid an-Nabi',
    nameAr: 'المولد النبوي',
    hijriMonth: 3,
    hijriDay: 12,
    description: 'Naissance du Prophète',
    type: 'religious_event',
    isImportant: true,
  },
  {
    name: 'Isra et Miraj',
    nameAr: 'الإسراء والمعراج',
    hijriMonth: 7,
    hijriDay: 27,
    description: 'Voyage nocturne',
    type: 'religious_event',
    isImportant: true,
  },
  {
    name: 'Eid al-Fitr',
    nameAr: 'عيد الفطر',
    hijriMonth: 10,
    hijriDay: 1,
    description: 'Fête de la rupture du jeûne',
    type: 'religious_event',
    isImportant: true,
  },
  {
    name: 'Eid al-Adha',
    nameAr: 'عيد الأضحى',
    hijriMonth: 12,
    hijriDay: 10,
    description: 'Fête du sacrifice',
    type: 'religious_event',
    isImportant: true,
  },
];

/**
 * Trouve les événements pour une date Hijri donnée
 */
export function getEventsForHijriDate(
  hijriDay: number,
  hijriMonth: number,
  hijriYear: number
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  
  // Chercher les événements qui correspondent à cette date
  for (const event of RELIGIOUS_EVENTS) {
    // Pour les mois spéciaux, vérifier si c'est le premier jour du mois
    if (event.type === 'hijri_month' && hijriDay === 1 && hijriMonth === event.hijriMonth) {
      events.push({
        name: event.name,
        nameAr: event.nameAr,
        description: event.description,
        type: event.type,
        isImportant: event.isImportant,
      });
    }
    // Pour les jours spéciaux, vérifier la date exacte
    else if (event.type !== 'hijri_month' && hijriDay === event.hijriDay && hijriMonth === event.hijriMonth) {
      events.push({
        name: event.name,
        nameAr: event.nameAr,
        description: event.description,
        type: event.type,
        isImportant: event.isImportant,
      });
    }
  }
  
  return events;
}

/**
 * Vérifie si un jour est spécial (Ramadan, Eid, etc.)
 */
export function isSpecialDay(hijriDay: number, hijriMonth: number): boolean {
  const events = getEventsForHijriDate(hijriDay, hijriMonth, 1445); // Année arbitraire pour la vérification
  return events.some(e => e.isImportant);
}

