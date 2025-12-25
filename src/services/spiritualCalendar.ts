/**
 * Service de calendrier spirituel islamique
 */

export interface SpiritualEvent {
  id: string;
  name: string;
  nameAr: string;
  date: string; // Date Hijri
  type: 'hijri_month' | 'special_day' | 'religious_event';
  description?: string;
  reminder?: boolean;
}

export const SPIRITUAL_EVENTS: SpiritualEvent[] = [
  // Mois Hijri spéciaux
  {
    id: 'ramadan',
    name: 'Ramadan',
    nameAr: 'رمضان',
    date: '09-01', // Format MM-DD pour l'année Hijri
    type: 'hijri_month',
    description: 'Mois sacré du jeûne',
    reminder: true,
  },
  {
    id: 'muharram',
    name: 'Muharram',
    nameAr: 'محرم',
    date: '01-01',
    type: 'hijri_month',
    description: 'Premier mois de l\'année Hijri',
  },
  {
    id: 'shawwal',
    name: 'Shawwal',
    nameAr: 'شوال',
    date: '10-01',
    type: 'hijri_month',
    description: 'Mois d\'Eid al-Fitr',
  },
  {
    id: 'dhul-hijjah',
    name: 'Dhul-Hijjah',
    nameAr: 'ذو الحجة',
    date: '12-01',
    type: 'hijri_month',
    description: 'Mois du pèlerinage et d\'Eid al-Adha',
    reminder: true,
  },
  
  // Jours spéciaux
  {
    id: 'laylatul-qadr',
    name: 'Laylat al-Qadr',
    nameAr: 'ليلة القدر',
    date: '09-27', // Approximatif (dernière décade de Ramadan)
    type: 'special_day',
    description: 'Nuit du Destin',
    reminder: true,
  },
  {
    id: 'ashura',
    name: 'Ashura',
    nameAr: 'عاشوراء',
    date: '10-10',
    type: 'special_day',
    description: '10ème jour de Muharram',
  },
  {
    id: 'eid-al-fitr',
    name: 'Eid al-Fitr',
    nameAr: 'عيد الفطر',
    date: '10-01',
    type: 'religious_event',
    description: 'Fête de la rupture du jeûne',
    reminder: true,
  },
  {
    id: 'eid-al-adha',
    name: 'Eid al-Adha',
    nameAr: 'عيد الأضحى',
    date: '12-10',
    type: 'religious_event',
    description: 'Fête du sacrifice',
    reminder: true,
  },
];

export function getUpcomingEvents(limit: number = 5): SpiritualEvent[] {
  // Pour simplifier, retourner les événements fixes
  // Dans une vraie implémentation, il faudrait convertir les dates Hijri en dates grégoriennes
  return SPIRITUAL_EVENTS.slice(0, limit);
}

export function getEventByDate(date: string): SpiritualEvent | undefined {
  const dateParts = date.split('-');
  const monthDay = `${dateParts[1]}-${dateParts[2]}`;
  return SPIRITUAL_EVENTS.find(e => e.date === monthDay);
}








