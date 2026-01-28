/**
 * Service pour l'analyse IA des intentions
 * Utilise l'IA pour suggÃ©rer le nom d'Allah le plus appropriÃ© selon l'intention
 */

import { asmaUlHusna, AsmaName } from '@/data/asmaData';
import { DivineName } from '@/data/khalwaData';
import { supabase } from '@/services/auth/supabase';
import { APP_CONFIG } from '@/config';
import { DAIRAT_AN_NUR_SYSTEM_PROMPT } from '@/config/dairatAnNurPrompt';
import { sendToAyna, type ChatMessage } from '@/services/content/ayna';
import i18n from '@/i18n';

export interface IntentionAnalysisResult {
  names: {
    name: DivineName;
    explanation: string;
  }[];
}

/**
 * Analyse l'intention de l'utilisateur et suggÃ¨re le nom d'Allah le plus appropriÃ©
 * Utilise l'IA via Edge Function pour une analyse personnalisÃ©e
 */
export async function analyzeIntentionForDivineName(
  intention: string
): Promise<IntentionAnalysisResult> {
  try {
    // Appeler l'Edge Function pour l'analyse IA
    if (APP_CONFIG.useSupabase && supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (session?.access_token) {
        const functionUrl = `${APP_CONFIG.supabaseUrl}/functions/v1/analyze-intention`;

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: APP_CONFIG.supabaseAnonKey || '',
          },
          body: JSON.stringify({
            intention,
            names: asmaUlHusna.map((n) => ({
              number: n.number,
              arabic: n.arabic,
              transliteration: n.transliteration,
              meaning: n.meaning,
              description: n.description.substring(0, 200), // Limiter pour rÃ©duire la taille
            })),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.selectedNames && Array.isArray(result.selectedNames)) {
            const namesWithExplanations = [];

            for (const selected of result.selectedNames) {
              const fullName = asmaUlHusna.find(n => n.number === selected.number);
              if (fullName) {
                namesWithExplanations.push({
                  name: {
                    id: `asma-${fullName.number}`,
                    arabic: fullName.arabic,
                    transliteration: fullName.transliteration,
                    meaning: fullName.meaning,
                    meaningEn: '',
                    description: fullName.description,
                  },
                  explanation: selected.explanation
                });
              }
            }

            if (namesWithExplanations.length > 0) {
              return { names: namesWithExplanations };
            }
          }
          // Backward compatibility for single result
          else if (result.selectedName && result.explanation) {
            // Trouver le nom complet dans asmaUlHusna
            const fullName = asmaUlHusna.find(
              (n) => n.number === result.selectedName.number
            );
            if (fullName) {
              return {
                names: [{
                  name: {
                    id: `asma-${fullName.number}`,
                    arabic: fullName.arabic,
                    transliteration: fullName.transliteration,
                    meaning: fullName.meaning,
                    meaningEn: '',
                    description: fullName.description,
                  },
                  explanation: result.explanation,
                }]
              };
            }
          }
        }
      }
    }

    // Fallback : analyse locale basÃ©e sur des mots-clÃ©s
    return analyzeIntentionLocally(intention);
  } catch (error) {
    console.error('[intentionAI] Error analyzing intention:', error);
    // Fallback vers l'analyse locale
    return analyzeIntentionLocally(intention);
  }
}

/**
 * Analyse locale de l'intention (fallback sans IA)
 * Utilise des mots-clÃ©s pour suggÃ©rer un nom appropriÃ©
 */
function analyzeIntentionLocally(intention: string): IntentionAnalysisResult {
  const lowerIntention = intention.toLowerCase();
  const results: { name: DivineName; explanation: string }[] = [];
  const seenIds = new Set<string>();

  // Helper pour ajouter un résultat unique
  const addResult = (idPrefix: string, number: number, explanation: string) => {
    // Si on a déjà 3 noms, on arrête
    if (results.length >= 3) return;

    // Vérifier si le nom complet existe
    const asmaName = asmaUlHusna.find((n) => n.number === number);
    if (!asmaName) return;

    // Générer l'ID simulé utilisé par BaytAnNur
    const id = `asma-${number}`;

    if (!seenIds.has(id)) {
      seenIds.add(id);
      results.push({
        name: {
          id: id,
          arabic: asmaName.arabic,
          transliteration: asmaName.transliteration,
          meaning: asmaName.meaning,
          meaningEn: '', // Pas dispo dans local
          description: asmaName.description,
        },
        explanation: explanation,
      });
    }
  };

  // Mapping des mots-clés vers les noms d'Allah
  const keywordMappings: { keywords: string[]; names: number[]; reason: string }[] = [
    {
      keywords: ['calme', 'paix', 'sérénité', 'tranquillité', 'apaisement', 'stress', 'anxiété'],
      names: [5], // As-Salam
      reason: "As-Salam, la Source de la Paix, est le nom parfait pour trouver la sérénité et l'apaisement que tu recherches.",
    },
    {
      keywords: ['peur', 'crainte', 'angoisse', 'inquiétude', 'protéger', 'protection'],
      names: [7, 38], // Al-Muhaymin, Al-Hafiz
      reason: "Al-Muhaymin, le Protecteur Vigilant, veille sur toi. Invoque-Le pour trouver la sécurité.",
    },
    {
      keywords: ['pardon', 'repentir', 'erreur', 'faute', 'péché', 'regrette'],
      names: [14, 34, 81], // Al-Ghaffar, Al-Ghafur, Al-'Afuww
      reason: "Al-Ghaffar, le Pardonneur perpétuel, efface les pêchés de ceux qui reviennent vers Lui.",
    },
    {
      keywords: ['force', 'courage', 'épreuve', 'difficile', 'dur', 'surmonter', 'endurance'],
      names: [53, 54], // Al-Qawiyy, Al-Matin
      reason: "Al-Qawiyy, le Très-Fort, peut te donner la force de surmonter cette épreuve.",
    },
    {
      keywords: ['guidance', 'guide', 'chemin', 'direction', 'perdu', 'égaré', 'décision'],
      names: [93, 97], // Al-Hadi, Ar-Rashid
      reason: "Al-Hadi, le Guide, t'éclairera le chemin et t'aidera à trouver la bonne direction.",
    },
    {
      keywords: ['amour', 'aimer', 'cœur', 'affection', 'tendresse'],
      names: [47], // Al-Wadud
      reason: "Al-Wadud, le Très-Aimant, remplit les cœurs de Son amour.",
    },
    {
      keywords: ['subsistance', 'argent', 'travail', 'richesse', 'pauvreté', 'besoin', 'provision'],
      names: [17], // Ar-Razzaq
      reason: "Ar-Razzaq, le Pourvoyeur, subvient aux besoins de toutes Ses créatures.",
    },
    {
      keywords: ['sagesse', 'comprendre', 'savoir', 'connaissance', 'apprendre'],
      names: [46, 19], // Al-Hakim, Al-Alim
      reason: "Al-Hakim, le Sage, t'accordera la sagesse pour comprendre ce que tu vis.",
    },
    {
      keywords: ['guérison', 'maladie', 'santé', 'malade', 'guérir', 'souffrance'],
      names: [14, 91], // Al-Ghaffar, An-Nafi'
      reason: "An-Nafi', Celui qui accorde le bien, peut t'accorder la guérison que tu recherches.",
    },
    {
      keywords: ['gratitude', 'remercier', 'reconnaissance', 'merci', 'bienfait'],
      names: [1, 35], // Ar-Rahman, Ash-Shakur
      reason: "Ash-Shakur, le Reconnaissant, récompense ceux qui Le remercient.",
    },
    {
      keywords: ['ouverture', 'déblocage', 'opportunité', 'porte', 'issue', 'solution'],
      names: [18], // Al-Fattah
      reason: "Al-Fattah, Celui qui ouvre, peut débloquer ta situation et t'ouvrir des portes.",
    },
    {
      keywords: ['patience', 'attendre', 'espérer', 'espoir'],
      names: [98], // As-Sabur
      reason: "As-Sabur, le Très-Patient, t'enseignera la patience et te soutiendra.",
    },
  ];

  // 1. Chercher des correspondances exactes
  // Mélanger les mappings pour la variété
  const shuffledMappings = [...keywordMappings].sort(() => Math.random() - 0.5);

  for (const mapping of shuffledMappings) {
    for (const keyword of mapping.keywords) {
      if (lowerIntention.includes(keyword)) {
        // Ajouter tous les noms correspondants (max 3 au total)
        const shuffledNames = [...mapping.names].sort(() => Math.random() - 0.5);
        for (const nameNumber of shuffledNames) {
          addResult(`asma`, nameNumber, mapping.reason);
          if (results.length >= 3) break;
        }
        break; // Un seul keyword par mapping
      }
    }
    if (results.length >= 3) break;
  }

  // 2. Si pas assez de noms, compléter avec des aléatoires
  while (results.length < 3) {
    const randomName = asmaUlHusna[Math.floor(Math.random() * asmaUlHusna.length)];
    const explanation = `Ce nom d'Allah ${randomName.transliteration} (${randomName.meaning}) t'accompagnera dans ta réflexion.`;
    addResult('asma', randomName.number, explanation);
  }

  return {
    names: results
  };
}

/**
 * Analyse l'intention pour suggÃ©rer un dhikr/duah appropriÃ©
 * Pour la page Dairat An Nur (Cercle de Dhikr)
 */
export interface DhikrItem {
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
}

export interface DhikrSuggestionResult {
  intentionReformulated: string;
  dhikrs: DhikrItem[];
  presenceAdvice: string;
  practiceSuggestion: string;
  // PropriÃ©tÃ© de compatibilitÃ© avec l'ancien format (pour l'affichage)
  arabic?: string;
  transliteration?: string;
  translation?: string;
  reference?: string;
  explanation?: string;
}

// Base de donnÃ©es de dhikr/duah validÃ©s
const validDhikrDuah: Array<{
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  keywords: string[];
}> = [
    {
      arabic: 'Ø±ÙŽØ¨ÙŽÙ‘Ù†ÙŽØ§ Ø¢ØªÙÙ†ÙŽØ§ ÙÙÙŠ Ø§Ù„Ø¯ÙÙ‘Ù†Ù’ÙŠÙŽØ§ Ø­ÙŽØ³ÙŽÙ†ÙŽØ©Ù‹ ÙˆÙŽÙÙÙŠ Ø§Ù„Ø¢Ø®ÙØ±ÙŽØ©Ù Ø­ÙŽØ³ÙŽÙ†ÙŽØ©Ù‹ ÙˆÙŽÙ‚ÙÙ†ÙŽØ§ Ø¹ÙŽØ°ÙŽØ§Ø¨ÙŽ Ø§Ù„Ù†ÙŽÙ‘Ø§Ø±Ù',
      transliteration: "Rabbana atina fid-dunya hasanah wa fil-akhirati hasanah wa qina 'adhaban-nar",
      translation: 'Seigneur, accorde-nous le bien dans ce monde et dans l\'au-delÃ , et protÃ¨ge-nous du chÃ¢timent du Feu.',
      reference: 'Sourate Al-Baqarah (2:201)',
      keywords: ['bien', 'monde', 'au-delÃ ', 'protection', 'gÃ©nÃ©ral'],
    },
    {
      arabic: 'Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¥ÙÙ†ÙÙ‘ÙŠ Ø£ÙŽØ¹ÙÙˆØ°Ù Ø¨ÙÙƒÙŽ Ù…ÙÙ†ÙŽ Ø§Ù„Ù’Ù‡ÙŽÙ…ÙÙ‘ ÙˆÙŽØ§Ù„Ù’Ø­ÙŽØ²ÙŽÙ†Ù',
      transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan",
      translation: 'Ã” Allah, je cherche refuge auprÃ¨s de Toi contre l\'anxiÃ©tÃ© et la tristesse.',
      reference: 'Hadith (Boukhari)',
      keywords: ['anxiÃ©tÃ©', 'tristesse', 'stress', 'inquiÃ©tude', 'souci', 'peur'],
    },
    {
      arabic: 'Ù„ÙŽØ§ Ø¥ÙÙ„ÙŽÙ°Ù‡ÙŽ Ø¥ÙÙ„ÙŽÙ‘Ø§ Ø£ÙŽÙ†ØªÙŽ Ø³ÙØ¨Ù’Ø­ÙŽØ§Ù†ÙŽÙƒÙŽ Ø¥ÙÙ†ÙÙ‘ÙŠ ÙƒÙÙ†ØªÙ Ù…ÙÙ†ÙŽ Ø§Ù„Ø¸ÙŽÙ‘Ø§Ù„ÙÙ…ÙÙŠÙ†ÙŽ',
      transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin",
      translation: 'Il n\'y a pas de divinitÃ© Ã  part Toi. Gloire Ã  Toi ! J\'Ã©tais parmi les injustes.',
      reference: "Du'a de Yunus (as) - Sourate Al-Anbiya (21:87)",
      keywords: ['Ã©preuve', 'difficultÃ©', 'dÃ©tresse', 'aide', 'secours'],
    },
    {
      arabic: 'Ø±ÙŽØ¨ÙÙ‘ Ø§Ø´Ù’Ø±ÙŽØ­Ù’ Ù„ÙÙŠ ØµÙŽØ¯Ù’Ø±ÙÙŠ ÙˆÙŽÙŠÙŽØ³ÙÙ‘Ø±Ù’ Ù„ÙÙŠ Ø£ÙŽÙ…Ù’Ø±ÙÙŠ',
      transliteration: 'Rabbi-shrah li sadri wa yassir li amri',
      translation: 'Seigneur, ouvre-moi ma poitrine et facilite-moi ma tÃ¢che.',
      reference: "Du'a de Musa (as) - Sourate Ta-Ha (20:25-26)",
      keywords: ['facilitÃ©', 'ouverture', 'tÃ¢che', 'travail', 'stress', 'anxiÃ©tÃ©'],
    },
    {
      arabic: 'Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø§Ù‡Ù’Ø¯ÙÙ†ÙÙŠ ÙˆÙŽØ³ÙŽØ¯ÙÙ‘Ø¯Ù’Ù†ÙÙŠ',
      transliteration: 'Allahumma-hdini wa saddidni',
      translation: 'Ã” Allah, guide-moi et dirige-moi sur le droit chemin.',
      reference: 'Hadith (Muslim)',
      keywords: ['guidance', 'direction', 'chemin', 'dÃ©cision', 'choix'],
    },
    {
      arabic: 'Ø±ÙŽØ¨ÙÙ‘ Ø²ÙØ¯Ù’Ù†ÙÙŠ Ø¹ÙÙ„Ù’Ù…Ù‹Ø§',
      transliteration: 'Rabbi zidni ilma',
      translation: 'Seigneur, augmente ma science.',
      reference: 'Sourate Ta-Ha (20:114)',
      keywords: ['savoir', 'connaissance', 'Ã©tude', 'examen', 'apprendre'],
    },
    {
      arabic: 'Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¥ÙÙ†ÙÙ‘ÙŠ Ø£ÙŽØ³Ù’Ø£ÙŽÙ„ÙÙƒÙŽ Ø§Ù„Ù’Ø¹ÙŽÙÙ’ÙˆÙŽ ÙˆÙŽØ§Ù„Ù’Ø¹ÙŽØ§ÙÙÙŠÙŽØ©ÙŽ',
      transliteration: "Allahumma inni as'alukal-'afwa wal-'afiyah",
      translation: "Ã” Allah, je Te demande le pardon et la santÃ©.",
      reference: 'Hadith (Ibn Majah)',
      keywords: ['pardon', 'santÃ©', 'guÃ©rison', 'maladie', 'bien-Ãªtre'],
    },
    {
      arabic: 'Ø­ÙŽØ³Ù’Ø¨ÙÙ†ÙŽØ§ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù ÙˆÙŽÙ†ÙØ¹Ù’Ù…ÙŽ Ø§Ù„Ù’ÙˆÙŽÙƒÙÙŠÙ„Ù',
      transliteration: "Hasbunallahu wa ni'mal-wakil",
      translation: 'Allah nous suffit, Il est notre meilleur garant.',
      reference: 'Sourate Al-Imran (3:173)',
      keywords: ['confiance', 'tawakkul', 'suffisance', 'aide', 'soutien'],
    },
    {
      arabic: 'Ø±ÙŽØ¨ÙŽÙ‘Ù†ÙŽØ§ Ù‡ÙŽØ¨Ù’ Ù„ÙŽÙ†ÙŽØ§ Ù…ÙÙ†Ù’ Ø£ÙŽØ²Ù’ÙˆÙŽØ§Ø¬ÙÙ†ÙŽØ§ ÙˆÙŽØ°ÙØ±ÙÙ‘ÙŠÙŽÙ‘Ø§ØªÙÙ†ÙŽØ§ Ù‚ÙØ±ÙŽÙ‘Ø©ÙŽ Ø£ÙŽØ¹Ù’ÙŠÙÙ†Ù',
      transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yun",
      translation: 'Seigneur, accorde-nous en nos Ã©pouses et nos enfants la joie de nos yeux.',
      reference: 'Sourate Al-Furqan (25:74)',
      keywords: ['famille', 'enfant', 'mariage', 'Ã©poux', 'Ã©pouse', 'bonheur'],
    },
    {
      arabic: 'Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø§ØºÙ’ÙÙØ±Ù’ Ù„ÙÙŠ Ø°ÙŽÙ†Ù’Ø¨ÙÙŠ ÙƒÙÙ„ÙŽÙ‘Ù‡Ù',
      transliteration: 'Allahumma-ghfir li dhanbi kullahu',
      translation: 'Ã” Allah, pardonne-moi tous mes pÃ©chÃ©s.',
      reference: 'Hadith (Muslim)',
      keywords: ['pardon', 'pÃ©chÃ©', 'repentir', 'erreur', 'faute'],
    },
  ];

/**
 * Analyse l'intention pour suggÃ©rer un dhikr/duah appropriÃ©
 * Utilise le nouveau prompt Da'irat an-NÃ»r avec support pour 1-3 dhikr
 * @param intention Intention de l'utilisateur
 * @param excludeDhikr Dhikr Ã  exclure (pour Ã©viter les doublons lors de "Autre suggestion")
 * @param userId ID de l'utilisateur (pour l'IA)
 */
export async function analyzeIntentionForDhikr(
  intention: string,
  excludeDhikr?: DhikrSuggestionResult,
  userId?: string
): Promise<DhikrSuggestionResult> {
  try {
    // Construire le prompt avec l'intention
    const userPrompt = `Intention de l'utilisateur : "${intention}"

${excludeDhikr ? `Attention : exclure les dhikr dÃ©jÃ  suggÃ©rÃ©s :\n${excludeDhikr.dhikrs.map(d => `- ${d.arabic}`).join('\n')}\n\n` : ''}
Analyse cette intention et propose 1 Ã  3 dhikr authentiques adaptÃ©s. RÃ©ponds UNIQUEMENT en JSON selon le format spÃ©cifiÃ©.`;

    // Construire les messages pour l'IA
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: DAIRAT_AN_NUR_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    // Utiliser sendToAyna pour obtenir la rÃ©ponse
    const userLanguage = i18n.language || 'fr';
    const response = await sendToAyna(messages, userLanguage, userId);

    if (response && response.content) {
      try {
        // Extraire le JSON de la rÃ©ponse (peut contenir du markdown)
        let jsonStr = response.content.trim();

        // Nettoyer si le JSON est dans un bloc markdown
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\s*/g, '');
        }

        const parsed = JSON.parse(jsonStr);

        // Valider et formater la rÃ©ponse
        if (parsed.intentionReformulated && parsed.dhikrs && Array.isArray(parsed.dhikrs) && parsed.dhikrs.length > 0 && parsed.dhikrs.length <= 3) {
          // S'assurer que tous les dhikr ont les champs requis
          const validDhikrs = parsed.dhikrs.filter((d: any) =>
            d.arabic && d.translation && d.reference
          );

          if (validDhikrs.length > 0) {
            // ComplÃ©ter avec transliteration si manquant
            const completeDhikrs = validDhikrs.map((d: DhikrItem) => ({
              ...d,
              transliteration: d.transliteration || '',
            }));

            return {
              intentionReformulated: parsed.intentionReformulated,
              dhikrs: completeDhikrs,
              presenceAdvice: parsed.presenceAdvice || 'Prends ce rappel comme une lumiÃ¨re discrÃ¨te, pas comme une charge.',
              practiceSuggestion: parsed.practiceSuggestion || 'RÃ©pÃ¨te avec prÃ©sence, Ã  ton rythme.',
              // CompatibilitÃ© avec l'ancien format (pour l'affichage)
              arabic: completeDhikrs[0].arabic,
              transliteration: completeDhikrs[0].transliteration,
              translation: completeDhikrs[0].translation,
              reference: completeDhikrs[0].reference,
              explanation: `${parsed.intentionReformulated}\n\n${parsed.presenceAdvice || ''}`,
            };
          }
        }
      } catch (parseError) {
        console.error('[intentionAI] Erreur lors du parsing JSON:', parseError);
        // Fallback vers analyse locale
      }
    }

    // Fallback : analyse locale
    return analyzeIntentionForDhikrLocally(intention, excludeDhikr);
  } catch (error) {
    console.error('[intentionAI] Error analyzing intention for dhikr:', error);
    return analyzeIntentionForDhikrLocally(intention, excludeDhikr);
  }
}

/**
 * Analyse locale pour suggÃ©rer un dhikr (fallback)
 * Retourne 1 Ã  3 dhikr selon le nouveau format
 */
function analyzeIntentionForDhikrLocally(intention: string, excludeDhikr?: DhikrSuggestionResult): DhikrSuggestionResult {
  const lowerIntention = intention.toLowerCase();

  // Filtrer les dhikr dÃ©jÃ  suggÃ©rÃ©s
  const excludeArabics = excludeDhikr?.dhikrs?.map(d => d.arabic) || [];
  const availableDhikr = excludeDhikr
    ? validDhikrDuah.filter(d => !excludeArabics.includes(d.arabic))
    : validDhikrDuah;

  // Si plus aucun dhikr disponible, rÃ©initialiser la liste
  const dhikrList = availableDhikr.length > 0 ? availableDhikr : validDhikrDuah;

  // Trouver les dhikr correspondants (1 Ã  3 maximum)
  const matchedDhikrs: typeof validDhikrDuah = [];
  const matchedKeywords = new Set<string>();

  for (const dhikr of dhikrList) {
    if (matchedDhikrs.length >= 3) break;

    for (const keyword of dhikr.keywords) {
      if (lowerIntention.includes(keyword) && !matchedKeywords.has(keyword)) {
        matchedDhikrs.push(dhikr);
        matchedKeywords.add(keyword);
        break; // Ne prendre qu'un dhikr par mot-clÃ© correspondant
      }
    }
  }

  // Si aucun mot-clÃ© trouvÃ©, choisir 1 dhikr alÃ©atoire
  const selectedDhikrs = matchedDhikrs.length > 0
    ? matchedDhikrs.slice(0, 3) // Maximum 3
    : [dhikrList[Math.floor(Math.random() * dhikrList.length)]];

  // Reformuler l'intention de maniÃ¨re simple
  const intentionReformulated = `Tu cherches Ã  ${intention.toLowerCase()}.`;

  // Convertir au nouveau format
  const dhikrs: DhikrItem[] = selectedDhikrs.map(d => ({
    arabic: d.arabic,
    transliteration: d.transliteration,
    translation: d.translation,
    reference: d.reference,
  }));

  return {
    intentionReformulated,
    dhikrs,
    presenceAdvice: 'Prends ce rappel comme une lumiÃ¨re discrÃ¨te, pas comme une charge. MÃªme peu, avec sincÃ©ritÃ©, suffit.',
    practiceSuggestion: dhikrs.length === 1
      ? 'RÃ©pÃ¨te avec prÃ©sence, Ã  ton rythme. Tu peux faire 33 ou 99 rÃ©pÃ©titions.'
      : 'Tu peux choisir l\'un de ces dhikr ou les alterner. RÃ©pÃ¨te avec prÃ©sence, Ã  ton rythme.',
    // CompatibilitÃ© avec l'ancien format (pour l'affichage)
    arabic: dhikrs[0].arabic,
    transliteration: dhikrs[0].transliteration,
    translation: dhikrs[0].translation,
    reference: dhikrs[0].reference,
    explanation: `${intentionReformulated}\n\nPour cette intention, je te propose ${dhikrs.length === 1 ? 'cette invocation' : 'ces invocations'} authentique${dhikrs.length > 1 ? 's' : ''} tirÃ©e${dhikrs.length > 1 ? 's' : ''} du Coran et de la Sunna.`,
  };
}


