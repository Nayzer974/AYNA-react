/**
 * Validateur de calendrier Hijri/Grégorien
 * 
 * Vérifie la précision des conversions de dates entre les calendriers
 * grégorien et Hijri en comparant avec l'API AlAdhan officielle.
 */

import { gregorianToHijri, hijriToGregorian } from '@/services/content/aladhan';

export interface ValidationResult {
  date: string;
  gregorian: {
    day: number;
    month: number;
    year: number;
  };
  hijri: {
    day: number;
    month: number;
    year: number;
  } | null;
  isValid: boolean;
  error?: string;
  reverseCheck?: {
    convertedBack: {
      day: number;
      month: number;
      year: number;
    } | null;
    matches: boolean;
  };
}

/**
 * Valide une date grégorienne en la convertissant en Hijri
 * puis en reconvertissant pour vérifier la cohérence
 */
export async function validateGregorianDate(
  year: number,
  month: number,
  day: number
): Promise<ValidationResult> {
  const result: ValidationResult = {
    date: `${day}/${month}/${year}`,
    gregorian: { day, month, year },
    hijri: null,
    isValid: false,
  };

  try {
    // Conversion Grégorien → Hijri
    const hijriDate = await gregorianToHijri(year, month, day);

    if (!hijriDate) {
      result.error = 'Impossible de convertir en date Hijri';
      return result;
    }

    result.hijri = {
      day: parseInt(hijriDate.day),
      month: hijriDate.month.number,
      year: parseInt(hijriDate.year),
    };

    // Vérification inverse : Hijri → Grégorien
    const gregorianBack = await hijriToGregorian(
      result.hijri.year,
      result.hijri.month,
      result.hijri.day
    );

    if (gregorianBack) {
      result.reverseCheck = {
        convertedBack: {
          day: parseInt(gregorianBack.day),
          month: gregorianBack.month.number,
          year: parseInt(gregorianBack.year),
        },
        matches:
          parseInt(gregorianBack.day) === day &&
          gregorianBack.month.number === month &&
          parseInt(gregorianBack.year) === year,
      };

      result.isValid = result.reverseCheck.matches;
    } else {
      result.error = 'Impossible de reconvertir en date grégorienne';
    }
  } catch (error: any) {
    result.error = error.message || 'Erreur lors de la validation';
  }

  return result;
}

/**
 * Valide plusieurs dates pour un mois complet
 */
export async function validateMonth(
  year: number,
  month: number
): Promise<{
  results: ValidationResult[];
  validCount: number;
  invalidCount: number;
  totalDays: number;
  accuracy: number;
}> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const results: ValidationResult[] = [];

  // Valider les jours critiques d'abord (1er, 15, dernier)
  const criticalDays = [1, 15, daysInMonth];

  for (const day of criticalDays) {
    const result = await validateGregorianDate(year, month, day);
    results.push(result);
    // Petit délai pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Valider quelques jours supplémentaires pour échantillon
  const sampleDays = [5, 10, 20, 25];
  for (const day of sampleDays) {
    if (day <= daysInMonth && !criticalDays.includes(day)) {
      const result = await validateGregorianDate(year, month, day);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = results.filter(r => !r.isValid).length;
  const accuracy = (validCount / results.length) * 100;

  return {
    results,
    validCount,
    invalidCount,
    totalDays: results.length,
    accuracy,
  };
}

/**
 * Vérifie des dates importantes du calendrier musulman
 */
export async function validateImportantDates(): Promise<ValidationResult[]> {
  const importantDates = [
    // Ramadan 2025 (approximatif)
    { year: 2025, month: 3, day: 1 }, // Début Ramadan approximatif
    { year: 2025, month: 3, day: 30 }, // Fin Ramadan approximatif

    // Aïd al-Fitr 2025 (approximatif)
    { year: 2025, month: 4, day: 1 },

    // Aïd al-Adha 2025 (approximatif)
    { year: 2025, month: 6, day: 6 },

    // Aujourd'hui
    {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    },
  ];

  const results: ValidationResult[] = [];

  for (const date of importantDates) {
    const result = await validateGregorianDate(date.year, date.month, date.day);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Génère un rapport de validation complet
 */
export async function generateValidationReport(
  year: number,
  month: number
): Promise<string> {
  const monthValidation = await validateMonth(year, month);
  const importantDates = await validateImportantDates();

  let report = `\n=== RAPPORT DE VALIDATION DU CALENDRIER ===\n\n`;
  report += `Mois analysé: ${month}/${year}\n`;
  report += `Jours validés: ${monthValidation.totalDays}\n`;
  report += `Dates valides: ${monthValidation.validCount}\n`;
  report += `Dates invalides: ${monthValidation.invalidCount}\n`;
  report += `Précision: ${monthValidation.accuracy.toFixed(2)}%\n\n`;

  report += `--- Détails des validations ---\n`;
  for (const result of monthValidation.results) {
    report += `\nDate: ${result.date}\n`;
    if (result.hijri) {
      report += `  → Hijri: ${result.hijri.day}/${result.hijri.month}/${result.hijri.year}\n`;
    }
    if (result.reverseCheck) {
      report += `  → Reconversion: ${result.reverseCheck.convertedBack?.day}/${result.reverseCheck.convertedBack?.month}/${result.reverseCheck.convertedBack?.year}\n`;
      report += `  → Correspondance: ${result.reverseCheck.matches ? '✅ OUI' : '❌ NON'}\n`;
    }
    if (result.error) {
      report += `  → Erreur: ${result.error}\n`;
    }
  }

  report += `\n--- Dates importantes ---\n`;
  for (const result of importantDates) {
    report += `\nDate: ${result.date}\n`;
    if (result.hijri) {
      report += `  → Hijri: ${result.hijri.day}/${result.hijri.month}/${result.hijri.year}\n`;
      report += `  → Valide: ${result.isValid ? '✅ OUI' : '❌ NON'}\n`;
    }
    if (result.error) {
      report += `  → Erreur: ${result.error}\n`;
    }
  }

  report += `\n=== FIN DU RAPPORT ===\n`;

  return report;
}


