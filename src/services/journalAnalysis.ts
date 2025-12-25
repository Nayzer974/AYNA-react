/**
 * Service d'analyse IA pour le journal
 * Analyse les notes et émotions pour générer des insights
 */

import { sendToAyna, type ChatMessage } from './ayna';
import { loadJournalNotes, type JournalNote } from './notesStorage';
import { UserProfile } from '@/contexts/UserContext';
import i18n from '@/i18n';

export interface EmotionAnalysis {
  dominantEmotion: string;
  emotions: Array<{ emotion: string; intensity: number; count: number }>;
  sentiment: 'positive' | 'neutral' | 'negative';
  trends: string[];
}

export interface JournalInsight {
  summary: string;
  themes: string[];
  patterns: string[];
  recommendations: string[];
  emotions: EmotionAnalysis;
}

/**
 * Détecte les émotions dans un texte avec une analyse contextuelle améliorée
 */
function detectEmotions(text: string): string[] {
  const emotions: string[] = [];
  const textLower = text.toLowerCase();
  
  // Nettoyer le texte pour une meilleure détection
  const cleanText = textLower
    .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Dictionnaire d'émotions avec mots-clés et expressions contextuelles
  const emotionKeywords: Record<string, { keywords: string[]; negativeIndicators?: string[] }> = {
    joie: {
      keywords: ['joyeux', 'heureux', 'content', 'satisfait', 'réjoui', 'ravie', 'enchanté', 'béni', 'bénédiction', 'bien', 'bien-être', 'me sens bien', 'vais bien', 'vas bien', 'allons bien', 'ça va bien', 'va bien', 'généralement bien', 'globalement bien', 'plutôt bien', 'assez bien', 'très bien', 'super bien', 'plaisir', 'plaisir', 'agréable', 'bonheur', 'heureuse', 'joyeuse', 'contente', 'satisfaite'],
      negativeIndicators: ['pas', 'ne', 'non', 'jamais', 'mal']
    },
    paix: {
      keywords: ['paix', 'calme', 'serein', 'tranquille', 'apaisé', 'sérénité', 'zen', 'repos', 'sereine', 'tranquille', 'apaisée'],
      negativeIndicators: ['pas', 'ne', 'non', 'trouble', 'perturbé']
    },
    gratitude: {
      keywords: ['gratitude', 'reconnaissant', 'merci', 'remercier', 'bénédiction', 'béni', 'alhamdulillah', 'hamdoulillah', 'reconnaissante', 'bénie'],
      negativeIndicators: ['pas', 'ne', 'non']
    },
    espoir: {
      keywords: ['espoir', 'espérer', 'optimiste', 'confiant', 'confiance', 'inshallah', 'inchallah', 'optimisme', 'optimiste', 'confiante'],
      negativeIndicators: ['pas', 'ne', 'non', 'désespoir', 'désespéré']
    },
    amour: {
      keywords: ['amour', 'aimer', 'affection', 'tendre', 'cœur', 'adorer', 'chérir'],
      negativeIndicators: ['pas', 'ne', 'non', 'haïr', 'détester']
    },
    tristesse: {
      keywords: ['triste', 'tristesse', 'déçu', 'déception', 'malheureux', 'chagrin', 'désolé', 'peiné', 'mélancolie', 'douleur', 'souffrance', 'mal', 'malade', 'va mal', 'vais mal', 'vas mal', 'allons mal'],
    },
    anxiété: {
      keywords: ['anxieux', 'anxiété', 'inquiet', 'inquiétude', 'stress', 'stressé', 'angoisse', 'angoissé', 'panique', 'paniqué', 'souci', 'soucieux', 'préoccupé'],
    },
    colère: {
      keywords: ['colère', 'fâché', 'énervé', 'frustré', 'frustration', 'irrité', 'furieux', 'rage', 'enragé', 'agacé'],
    },
    peur: {
      keywords: ['peur', 'craint', 'effrayé', 'terrifié', 'appréhension', 'appréhender', 'redouter'],
    },
    fatigue: {
      keywords: ['fatigué', 'fatigue', 'épuisé', 'épuisement', 'lassé', 'épuisement', 'épuisant', 'exténué'],
    },
    désespoir: {
      keywords: ['désespoir', 'désespéré', 'perdu', 'sans espoir', 'abandonné', 'déprimé', 'dépression'],
    },
  };

  // Détecter les émotions avec vérification des indicateurs négatifs
  for (const [emotion, config] of Object.entries(emotionKeywords)) {
    const hasKeyword = config.keywords.some(keyword => {
      // Vérifier si le mot-clé est présent
      const keywordIndex = cleanText.indexOf(keyword);
      if (keywordIndex === -1) return false;
      
      // Vérifier s'il y a des indicateurs négatifs avant le mot-clé (dans les 20 caractères précédents)
      if (config.negativeIndicators) {
        const contextBefore = cleanText.substring(Math.max(0, keywordIndex - 20), keywordIndex);
        const hasNegative = config.negativeIndicators.some(neg => contextBefore.includes(neg));
        if (hasNegative) return false; // Ignorer si contexte négatif
      }
      
      return true;
    });
    
    if (hasKeyword) {
      emotions.push(emotion);
    }
  }

  // Détection spéciale pour les expressions négatives courantes
  const negativePhrases = [
    'je vais mal', 'je me sens mal', 'je suis mal', 'ça va mal', 'va très mal', 'vais très mal',
    'je ne vais pas bien', 'je ne me sens pas bien', 'pas bien', 'très mal',
    'difficile', 'dur', 'compliqué', 'problème', 'souffre', 'souffrance',
    'déprimé', 'déprime', 'triste', 'malheureux', 'malheur'
  ];
  
  const hasNegativePhrase = negativePhrases.some(phrase => cleanText.includes(phrase));
  if (hasNegativePhrase && !emotions.some(e => ['tristesse', 'anxiété', 'désespoir', 'fatigue'].includes(e))) {
    emotions.push('tristesse');
  }

  // Si aucune émotion détectée, retourner neutre
  return emotions.length > 0 ? emotions : ['neutre'];
}

/**
 * Analyse les notes du journal pour extraire les émotions
 */
function analyzeEmotions(notes: JournalNote[]): EmotionAnalysis {
  const emotionCounts: Record<string, number> = {};
  const emotionIntensities: Record<string, number[]> = {};
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  notes.forEach(note => {
    const emotions = detectEmotions(note.text);
    const textLower = note.text.toLowerCase();

    // Calculer l'intensité (basé sur la longueur et les mots forts)
    const intensity = Math.min(
      1.0,
      (note.text.length / 500) + 
      (textLower.includes('très') || textLower.includes('beaucoup') ? 0.3 : 0) +
      (textLower.includes('extrêmement') || textLower.includes('énormément') ? 0.5 : 0)
    );

    emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      if (!emotionIntensities[emotion]) {
        emotionIntensities[emotion] = [];
      }
      emotionIntensities[emotion].push(intensity);
    });

    // Classer le sentiment global
    const positiveEmotions = ['joie', 'paix', 'gratitude', 'espoir', 'amour'];
    const negativeEmotions = ['tristesse', 'anxiété', 'colère', 'peur', 'fatigue', 'désespoir'];

    if (emotions.some(e => positiveEmotions.includes(e))) {
      positiveCount++;
    } else if (emotions.some(e => negativeEmotions.includes(e))) {
      negativeCount++;
    } else {
      neutralCount++;
    }
  });

  // Calculer les moyennes d'intensité
  const emotionsWithIntensity = Object.entries(emotionCounts).map(([emotion, count]) => {
    const intensities = emotionIntensities[emotion] || [];
    const avgIntensity = intensities.length > 0
      ? intensities.reduce((a, b) => a + b, 0) / intensities.length
      : 0.5;

    return {
      emotion,
      intensity: avgIntensity,
      count,
    };
  }).sort((a, b) => b.count - a.count);

  const dominantEmotion = emotionsWithIntensity[0]?.emotion || 'neutre';

  // Déterminer le sentiment global
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (positiveCount > negativeCount && positiveCount > neutralCount) {
    sentiment = 'positive';
  } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
    sentiment = 'negative';
  }

  // Analyser les tendances (dernières notes vs anciennes)
  // Les notes sont déjà triées par ordre chronologique (plus anciennes en premier)
  // Donc les premières notes sont les plus anciennes, les dernières sont les plus récentes
  const olderNotes = notes.slice(0, Math.min(5, Math.floor(notes.length / 2))); // Première moitié = plus anciennes
  const recentNotes = notes.slice(-Math.min(5, Math.floor(notes.length / 2))); // Dernière moitié = plus récentes

  const recentPositive = recentNotes.filter(note => {
    const emotions = detectEmotions(note.text);
    return emotions.some(e => ['joie', 'paix', 'gratitude', 'espoir', 'amour'].includes(e));
  }).length;

  const olderPositive = olderNotes.filter(note => {
    const emotions = detectEmotions(note.text);
    return emotions.some(e => ['joie', 'paix', 'gratitude', 'espoir', 'amour'].includes(e));
  }).length;

  const trends: string[] = [];
  if (recentPositive > olderPositive) {
    trends.push('Amélioration du bien-être émotionnel');
  } else if (recentPositive < olderPositive) {
    trends.push('Baisse du bien-être émotionnel');
  }

  return {
    dominantEmotion,
    emotions: emotionsWithIntensity,
    sentiment,
    trends,
  };
}

/**
 * Génère une analyse complète du journal
 */
export async function analyzeJournal(
  userId: string,
  timeRange: 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<JournalInsight> {
  try {
    const notes = await loadJournalNotes();
    
    // Filtrer par période
    const now = Date.now();
    const timeRanges = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
      all: Infinity,
    };

    const filteredNotes = notes.filter(note => {
      const noteTime = new Date(note.createdAt).getTime();
      return now - noteTime < timeRanges[timeRange];
    });

    if (filteredNotes.length === 0) {
      return {
        summary: 'Aucune note trouvée pour cette période.',
        themes: [],
        patterns: [],
        recommendations: [],
        emotions: {
          dominantEmotion: 'neutre',
          emotions: [],
          sentiment: 'neutral',
          trends: [],
        },
      };
    }

    // TRIER PAR ORDRE CHRONOLOGIQUE (plus anciennes en premier, plus récentes en dernier)
    const sortedNotes = [...filteredNotes].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB; // Ordre croissant = plus anciennes en premier
    });

    // Analyser les émotions (utiliser les notes triées)
    const emotionAnalysis = analyzeEmotions(sortedNotes);

    // Préparer les données pour l'IA (dans l'ordre chronologique)
    const notesText = sortedNotes
      .slice(0, 20) // Limiter à 20 notes pour éviter un prompt trop long
      .map((note, index) => {
        const date = new Date(note.createdAt).toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        return `Note ${index + 1} (${date} - ${index === 0 ? 'la plus ancienne' : index === sortedNotes.length - 1 ? 'la plus récente' : ''}):\n${note.text.substring(0, 500)}`;
      })
      .join('\n\n---\n\n');

    const userLanguage = i18n.language || 'fr';

    const systemPrompt = `Tu es un expert en analyse de journal personnel et en psychologie positive. Tu analyses les notes d'un journal spirituel pour fournir des insights pertinents.

${userLanguage === 'fr' ? `
IMPORTANT: Réponds UNIQUEMENT en français.

Ta mission:
1. Lire et analyser TOUTES les notes fournies en détail
2. Identifier les thèmes récurrents dans les notes
3. Détecter les patterns émotionnels et comportementaux avec précision
4. Analyser les tendances temporelles (amélioration, détérioration, stabilité)
5. Donner des recommandations personnalisées pour le bien-être spirituel
6. Être bienveillant, encourageant et respectueux de la spiritualité islamique
7. Si tu détectes une amélioration de l'humeur ou du bien-être sur la période, l'expliquer explicitement
8. Si tu détectes une détérioration, être empathique et proposer des solutions

Analyse émotionnelle détectée (à utiliser comme référence, mais analyser le contenu réel des notes):
- Émotion dominante: ${emotionAnalysis.dominantEmotion}
- Sentiment global: ${emotionAnalysis.sentiment}
- Tendances: ${emotionAnalysis.trends.join(', ') || 'Aucune'}

IMPORTANT: 
- Les notes sont présentées dans l'ordre CHRONOLOGIQUE (de la plus ancienne à la plus récente)
- Analyse TOUTES les notes en détail dans l'ordre chronologique
- Ne te base pas uniquement sur les émotions détectées automatiquement
- Lis le contenu réel des notes pour comprendre le contexte émotionnel réel de l'utilisateur
- Identifie clairement l'évolution émotionnelle dans le temps (du début à la fin de la période)
- Si l'utilisateur exprime de la détresse, de la tristesse ou des difficultés, identifie-le clairement
- Si tu détectes une amélioration ou une détérioration de l'humeur, explique-la en tenant compte de l'ordre chronologique
- **CRITIQUE**: Analyse en profondeur TOUTES les émotions exprimées, y compris les positives (bien-être, joie, paix, gratitude, espoir, amour) ET les négatives (tristesse, anxiété, colère, peur, fatigue, désespoir)
- Si l'utilisateur dit "généralement bien mais parfois triste", identifie les DEUX émotions (bien-être/joie ET tristesse)
- Ne te limite pas à une seule émotion dominante, identifie toutes les émotions principales présentes dans les notes
- Pour chaque émotion détectée, indique son intensité (0.0 à 1.0) et le nombre de fois qu'elle apparaît

Format de réponse (JSON strict):
{
  "summary": "Résumé en 3-4 phrases de l'analyse globale du journal, incluant explicitement les tendances détectées (amélioration, détérioration, stabilité) sur la période",
  "themes": ["Thème 1", "Thème 2", "Thème 3"],
  "patterns": ["Pattern 1", "Pattern 2"],
  "recommendations": ["Recommandation 1", "Recommandation 2", "Recommandation 3"],
  "emotions": {
    "dominantEmotion": "émotion la plus fréquente (ex: 'joie' ou 'bien-être')",
    "emotions": [
      {"emotion": "joie", "intensity": 0.7, "count": 5},
      {"emotion": "bien-être", "intensity": 0.6, "count": 3},
      {"emotion": "tristesse", "intensity": 0.4, "count": 2}
    ],
    "sentiment": "positive|neutral|negative",
    "trends": ["Tendance 1", "Tendance 2"]
  }
}
` : userLanguage === 'ar' ? `
مهم جداً: يجب أن ترد بالعربية فقط.

مهمتك:
1. قراءة وتحليل جميع الملاحظات المقدمة بالتفصيل
2. تحديد المواضيع المتكررة في الملاحظات
3. اكتشاف الأنماط العاطفية والسلوكية بدقة
4. تحليل الاتجاهات الزمنية (تحسن، تدهور، استقرار)
5. تقديم توصيات مخصصة للرفاهية الروحية
6. كن متعاطفاً ومشجعاً ومحترماً للروحانية الإسلامية
7. إذا اكتشفت تحسناً في المزاج أو الرفاهية خلال الفترة، اشرحه بوضوح
8. إذا اكتشفت تدهوراً، كن متعاطفاً واقترح حلولاً

التحليل العاطفي المكتشف (استخدمه كمرجع، لكن حلل المحتوى الفعلي للملاحظات):
- العاطفة السائدة: ${emotionAnalysis.dominantEmotion}
- المشاعر العامة: ${emotionAnalysis.sentiment}
- الاتجاهات: ${emotionAnalysis.trends.join(', ') || 'لا شيء'}

مهم جداً:
- الملاحظات معروضة بالترتيب الزمني (من الأقدم إلى الأحدث)
- حلل جميع الملاحظات بالتفصيل بالترتيب الزمني
- لا تعتمد فقط على المشاعر المكتشفة تلقائياً
- اقرأ المحتوى الفعلي للملاحظات لفهم السياق العاطفي الحقيقي للمستخدم
- حدد بوضوح التطور العاطفي مع مرور الوقت (من البداية إلى نهاية الفترة)
- إذا عبر المستخدم عن الضيق أو الحزن أو الصعوبات، حددها بوضوح
- إذا اكتشفت تحسناً أو تدهوراً في المزاج، اشرحه مع مراعاة الترتيب الزمني
- **حرج**: حلل بعمق جميع المشاعر المعبر عنها، بما في ذلك الإيجابية (الرفاهية، الفرح، السلام، الامتنان، الأمل، الحب) والسلبية (الحزن، القلق، الغضب، الخوف، التعب، اليأس)
- إذا قال المستخدم "أشعر بالراحة بشكل عام لكن أحياناً حزين"، حدد المشاعر الاثنتين (الرفاهية/الفرح والحزن)
- لا تقتصر على عاطفة واحدة مهيمنة، حدد جميع المشاعر الرئيسية الموجودة في الملاحظات
- لكل عاطفة مكتشفة، حدد شدتها (0.0 إلى 1.0) وعدد مرات ظهورها

تنسيق الرد (JSON صارم):
{
  "summary": "ملخص في 2-3 جمل من التحليل الشامل للمجلة",
  "themes": ["موضوع 1", "موضوع 2", "موضوع 3"],
  "patterns": ["نمط 1", "نمط 2"],
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"],
  "emotions": {
    "dominantEmotion": "العاطفة الأكثر تكراراً",
    "emotions": [
      {"emotion": "فرح", "intensity": 0.7, "count": 5},
      {"emotion": "رفاهية", "intensity": 0.6, "count": 3},
      {"emotion": "حزن", "intensity": 0.4, "count": 2}
    ],
    "sentiment": "positive|neutral|negative",
    "trends": ["اتجاه 1", "اتجاه 2"]
  }
}
` : `
IMPORTANT: Respond ONLY in English.

Your mission:
1. Read and analyze ALL provided notes in detail
2. Identify recurring themes in notes
3. Detect emotional and behavioral patterns with precision
4. Analyze temporal trends (improvement, deterioration, stability)
5. Provide personalized recommendations for spiritual well-being
6. Be compassionate, encouraging, and respectful of Islamic spirituality
7. If you detect an improvement in mood or well-being over the period, explain it explicitly
8. If you detect deterioration, be empathetic and propose solutions

Detected emotional analysis (use as reference, but analyze the actual content of notes):
- Dominant emotion: ${emotionAnalysis.dominantEmotion}
- Global sentiment: ${emotionAnalysis.sentiment}
- Trends: ${emotionAnalysis.trends.join(', ') || 'None'}

IMPORTANT:
- Notes are presented in CHRONOLOGICAL order (oldest to newest)
- Analyze ALL notes in detail in chronological order
- Do not rely solely on automatically detected emotions
- Read the actual content of notes to understand the user's real emotional context
- Clearly identify emotional evolution over time (from beginning to end of period)
- If the user expresses distress, sadness, or difficulties, identify it clearly
- If you detect improvement or deterioration in mood, explain it considering chronological order
- **CRITICAL**: Analyze in depth ALL expressed emotions, including positive ones (well-being, joy, peace, gratitude, hope, love) AND negative ones (sadness, anxiety, anger, fear, fatigue, despair)
- If the user says "generally well but sometimes sad", identify BOTH emotions (well-being/joy AND sadness)
- Do not limit yourself to a single dominant emotion, identify all main emotions present in the notes
- For each detected emotion, indicate its intensity (0.0 to 1.0) and the number of times it appears

Response format (strict JSON):
{
  "summary": "Summary in 2-3 sentences of the overall journal analysis",
  "themes": ["Theme 1", "Theme 2", "Theme 3"],
  "patterns": ["Pattern 1", "Pattern 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "emotions": {
    "dominantEmotion": "most frequent emotion (e.g., 'joy' or 'well-being')",
    "emotions": [
      {"emotion": "joy", "intensity": 0.7, "count": 5},
      {"emotion": "well-being", "intensity": 0.6, "count": 3},
      {"emotion": "sadness", "intensity": 0.4, "count": 2}
    ],
    "sentiment": "positive|neutral|negative",
    "trends": ["Trend 1", "Trend 2"]
  }
}
`}

${userLanguage === 'fr' ? `Notes du journal (${sortedNotes.length} notes, période: ${timeRange}):
Les notes sont présentées dans l'ordre CHRONOLOGIQUE (de la plus ancienne à la plus récente).

${notesText}

Analyse ces notes dans l'ordre chronologique et génère une analyse complète au format JSON. 
Identifie clairement l'évolution émotionnelle dans le temps.` : userLanguage === 'ar' ? `ملاحظات المجلة (${sortedNotes.length} ملاحظة، الفترة: ${timeRange}):
الملاحظات معروضة بالترتيب الزمني (من الأقدم إلى الأحدث).

${notesText}

حلل هذه الملاحظات بالترتيب الزمني واكتب تحليلاً شاملاً بصيغة JSON.
حدد بوضوح التطور العاطفي مع مرور الوقت.` : `Journal notes (${sortedNotes.length} notes, period: ${timeRange}):
Notes are presented in CHRONOLOGICAL order (oldest to newest).

${notesText}

Analyze these notes in chronological order and generate a complete analysis in JSON format.
Clearly identify emotional evolution over time.`}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyse ces notes de journal et génère une analyse complète.' },
    ];

    const response = await sendToAyna(messages, userLanguage, userId);

    // Parser la réponse JSON
    try {
      // Nettoyer la réponse : supprimer les caractères de contrôle (U+0000 à U+001F)
      // sauf les caractères valides comme \n, \r, \t
      const cleanedContent = response.content
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Supprimer les caractères de contrôle sauf \n, \r, \t
        .trim();
      
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Nettoyer à nouveau le JSON extrait
        const jsonString = jsonMatch[0]
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
          .trim();
        
        const parsed = JSON.parse(jsonString);
        
        // Utiliser les émotions analysées par l'IA si disponibles, sinon utiliser l'analyse locale
        let finalEmotions = emotionAnalysis;
        if (parsed.emotions && typeof parsed.emotions === 'object') {
          // Fusionner l'analyse IA avec l'analyse locale pour plus de précision
          const aiEmotions = parsed.emotions;
          finalEmotions = {
            dominantEmotion: aiEmotions.dominantEmotion || emotionAnalysis.dominantEmotion,
            emotions: Array.isArray(aiEmotions.emotions) && aiEmotions.emotions.length > 0
              ? aiEmotions.emotions
              : emotionAnalysis.emotions,
            sentiment: aiEmotions.sentiment || emotionAnalysis.sentiment,
            trends: Array.isArray(aiEmotions.trends) && aiEmotions.trends.length > 0
              ? aiEmotions.trends
              : emotionAnalysis.trends,
          };
        }
        
        return {
          summary: parsed.summary || '',
          themes: Array.isArray(parsed.themes) ? parsed.themes : [],
          patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          emotions: finalEmotions,
        };
      }
    } catch (parseError) {
      console.error('[journalAnalysis] Erreur parsing JSON:', parseError);
      console.error('[journalAnalysis] Contenu reçu:', response.content.substring(0, 500));
    }

    // Fallback
    return {
      summary: response.content.substring(0, 300),
      themes: [],
      patterns: [],
      recommendations: [],
      emotions: emotionAnalysis,
    };
  } catch (error) {
    console.error('[journalAnalysis] Erreur analyse journal:', error);
    return {
      summary: 'Impossible de générer une analyse pour le moment.',
      themes: [],
      patterns: [],
      recommendations: [],
      emotions: {
        dominantEmotion: 'neutre',
        emotions: [],
        sentiment: 'neutral',
        trends: [],
      },
    };
  }
}

/**
 * Analyse une note spécifique
 */
export async function analyzeSingleNote(
  noteText: string,
  userId: string
): Promise<{
  emotions: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  themes: string[];
  insight: string;
}> {
  try {
    const emotions = detectEmotions(noteText);
    const positiveEmotions = ['joie', 'paix', 'gratitude', 'espoir', 'amour'];
    const negativeEmotions = ['tristesse', 'anxiété', 'colère', 'peur', 'fatigue', 'désespoir'];

    const hasPositive = emotions.some(e => positiveEmotions.includes(e));
    const hasNegative = emotions.some(e => negativeEmotions.includes(e));

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (hasPositive && !hasNegative) {
      sentiment = 'positive';
    } else if (hasNegative && !hasPositive) {
      sentiment = 'negative';
    }

    const userLanguage = i18n.language || 'fr';

    const systemPrompt = `Tu es un expert en analyse de journal personnel. Tu analyses une note pour identifier les thèmes et donner un insight.

${userLanguage === 'fr' ? `
IMPORTANT: Réponds UNIQUEMENT en français.

Ta mission:
1. Lire attentivement TOUTE la note fournie
2. Identifier les émotions réelles exprimées (même si implicites)
3. Détecter les thèmes principaux
4. Fournir un insight empathique et bienveillant
5. Si la note exprime de la détresse, de la tristesse ou des difficultés, l'identifier clairement

Format de réponse (JSON strict):
{
  "themes": ["Thème 1", "Thème 2"],
  "insight": "Insight en 2-3 phrases qui reflète fidèlement le contenu émotionnel de la note"
}
` : userLanguage === 'ar' ? `
مهم جداً: يجب أن ترد بالعربية فقط.

تنسيق الرد (JSON صارم):
{
  "themes": ["موضوع 1", "موضوع 2"],
  "insight": "رؤية في 2-3 جمل"
}
` : `
IMPORTANT: Respond ONLY in English.

Response format (strict JSON):
{
  "themes": ["Theme 1", "Theme 2"],
  "insight": "Insight in 2-3 sentences"
}
`}

Note à analyser:
${noteText.substring(0, 1000)}

Analyse cette note et génère une réponse au format JSON.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyse cette note.' },
    ];

    const response = await sendToAyna(messages, userLanguage, userId);

    try {
      // Nettoyer la réponse : supprimer les caractères de contrôle (U+0000 à U+001F)
      // sauf les caractères valides comme \n, \r, \t
      const cleanedContent = response.content
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Supprimer les caractères de contrôle sauf \n, \r, \t
        .trim();
      
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Nettoyer à nouveau le JSON extrait
        const jsonString = jsonMatch[0]
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
          .trim();
        
        const parsed = JSON.parse(jsonString);
        return {
          emotions,
          sentiment,
          themes: Array.isArray(parsed.themes) ? parsed.themes : [],
          insight: parsed.insight || '',
        };
      }
    } catch (parseError) {
      console.error('[journalAnalysis] Erreur parsing JSON:', parseError);
      console.error('[journalAnalysis] Contenu reçu:', response.content.substring(0, 500));
    }

    return {
      emotions,
      sentiment,
      themes: [],
      insight: response.content.substring(0, 200),
    };
  } catch (error) {
    console.error('[journalAnalysis] Erreur analyse note:', error);
    return {
      emotions: detectEmotions(noteText),
      sentiment: 'neutral',
      themes: [],
      insight: 'Impossible d\'analyser cette note pour le moment.',
    };
  }
}

