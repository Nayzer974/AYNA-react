/**
 * Service d'agent IA pour l'analyse approfondie des analytics
 * Utilise AYNA pour analyser les donnÃ©es utilisateur et gÃ©nÃ©rer des insights
 */

import { sendToAyna, type ChatMessage } from '@/services/content/ayna';
import { getUserAnalytics, type AnalyticsEvent } from '@/services/analytics/analytics';
import { UserProfile } from '@/types/user';
import i18n from '@/i18n';

export interface AnalyticsAnalysis {
  summary: string;
  patterns: string[];
  recommendations: string[];
  trends: string[];
  questions?: string[]; // Questions suggÃ©rÃ©es pour approfondir
}

export interface AnalyticsQuery {
  question: string;
  context?: {
    timeRange?: 'week' | 'month' | 'year' | 'all';
    focus?: 'dhikr' | 'journal' | 'prayer' | 'all';
  };
}

/**
 * PrÃ©pare les donnÃ©es analytics pour l'analyse IA
 */
function prepareAnalyticsData(
  events: AnalyticsEvent[],
  user: UserProfile,
  timeRange: 'week' | 'month' | 'year' | 'all' = 'all'
): string {
  const now = Date.now();
  const timeRanges = {
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
    all: Infinity,
  };

  // Convertir les Ã©vÃ©nements de Supabase (qui ont created_at) en format AnalyticsEvent
  const normalizedEvents: AnalyticsEvent[] = events.map((event: any) => {
    // Si l'Ã©vÃ©nement vient de Supabase, il a created_at au lieu de timestamp
    const timestamp = event.timestamp || (event.created_at ? new Date(event.created_at).getTime() : Date.now());
    return {
      name: event.event_name || event.name,
      properties: event.properties || {},
      timestamp,
      userId: event.user_id || event.userId,
      sessionId: event.session_id || event.sessionId,
    };
  });

  const filteredEvents = normalizedEvents.filter(
    event => now - event.timestamp < timeRanges[timeRange]
  );

  // Analyser les patterns
  const dhikrEvents = filteredEvents.filter(e =>
    e.name.toLowerCase().includes('dhikr') ||
    e.name.toLowerCase().includes('zikr') ||
    e.name.toLowerCase().includes('dhikr_completed')
  );
  const journalEvents = filteredEvents.filter(e =>
    e.name.toLowerCase().includes('journal') ||
    e.name.toLowerCase().includes('note') ||
    e.name.toLowerCase().includes('journal_entry')
  );
  const prayerEvents = filteredEvents.filter(e =>
    e.name.toLowerCase().includes('prayer') ||
    e.name.toLowerCase().includes('salat') ||
    e.name.toLowerCase().includes('prayer_completed')
  );

  // Calculer les totaux basÃ©s sur les Ã©vÃ©nements filtrÃ©s
  // Pour le dhikr, additionner les propriÃ©tÃ©s "count" si elles existent, sinon compter les Ã©vÃ©nements
  const totalDhikrInPeriod = dhikrEvents.reduce((sum, event) => {
    const count = event.properties?.count || event.properties?.quantity || 1;
    return sum + (typeof count === 'number' ? count : 1);
  }, 0);

  // Pour les notes, compter les Ã©vÃ©nements (chaque Ã©vÃ©nement = 1 note)
  const totalNotesInPeriod = journalEvents.length;

  // Pour les priÃ¨res, compter les Ã©vÃ©nements (chaque Ã©vÃ©nement = 1 priÃ¨re)
  const totalPrayersInPeriod = prayerEvents.length;

  // Analyser les heures de pic
  const hourDistribution: Record<number, number> = {};
  dhikrEvents.forEach(event => {
    const hour = new Date(event.timestamp).getHours();
    hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
  });

  const peakHour = Object.entries(hourDistribution)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  // Analyser les jours de la semaine
  const dayDistribution: Record<number, number> = {};
  filteredEvents.forEach(event => {
    const day = new Date(event.timestamp).getDay();
    dayDistribution[day] = (dayDistribution[day] || 0) + 1;
  });

  const peakDay = Object.entries(dayDistribution)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Statistiques utilisateur - utiliser les totaux de la pÃ©riode, pas les totaux globaux
  // Les Ã©vÃ©nements locaux (y compris ceux du jour) sont maintenant inclus via getUserAnalytics
  const stats = {
    totalDhikr: totalDhikrInPeriod, // Total dhikr dans la pÃ©riode (inclut les Ã©vÃ©nements du jour)
    totalNotes: totalNotesInPeriod, // Total notes dans la pÃ©riode (inclut les Ã©vÃ©nements du jour)
    totalPrayers: totalPrayersInPeriod, // Total priÃ¨res dans la pÃ©riode (inclut les Ã©vÃ©nements du jour)
    streak: user.analytics?.streak || 0,
    totalEvents: filteredEvents.length,
    dhikrCount: dhikrEvents.length, // Nombre d'Ã©vÃ©nements dhikr
    journalCount: journalEvents.length, // Nombre d'Ã©vÃ©nements journal
    prayerCount: prayerEvents.length, // Nombre d'Ã©vÃ©nements priÃ¨re
  };

  // DÃ©terminer le label de pÃ©riode
  const periodLabel = timeRange === 'week' ? '7 derniers jours' :
    timeRange === 'month' ? '30 derniers jours' :
      timeRange === 'year' ? '365 derniers jours' :
        'toutes les pÃ©riodes';

  return `
DONNÃ‰ES ANALYTICS UTILISATEUR (PÃ‰RIODE: ${periodLabel}):

Statistiques pour cette pÃ©riode (${periodLabel}):
- Total dhikr effectuÃ©s: ${stats.totalDhikr}
- Total notes Ã©crites: ${stats.totalNotes}
- Total priÃ¨res complÃ©tÃ©es: ${stats.totalPrayers}
- SÃ©rie actuelle: ${stats.streak} jours
- Total Ã©vÃ©nements: ${stats.totalEvents}

RÃ©partition des activitÃ©s:
- Ã‰vÃ©nements dhikr: ${stats.dhikrCount}
- Ã‰vÃ©nements journal: ${stats.journalCount}
- Ã‰vÃ©nements priÃ¨re: ${stats.prayerCount}

Patterns temporels:
- Heure de pic pour le dhikr: ${peakHour ? `${peakHour}h` : 'Non dÃ©terminÃ©'}
- Jour de pic: ${peakDay !== undefined ? dayNames[parseInt(peakDay)] : 'Non dÃ©terminÃ©'}

Derniers Ã©vÃ©nements (Ã©chantillon):
${filteredEvents.slice(0, 20).map(e =>
    `- ${e.name} (${new Date(e.timestamp).toLocaleString('fr-FR')})`
  ).join('\n')}

IMPORTANT: Toutes les statistiques ci-dessus concernent UNIQUEMENT la pÃ©riode sÃ©lectionnÃ©e (${periodLabel}), pas les totaux globaux de l'utilisateur.
`;
}

/**
 * GÃ©nÃ¨re une analyse automatique des analytics
 */
export async function generateAnalyticsAnalysis(
  user: UserProfile,
  timeRange: 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<AnalyticsAnalysis> {
  try {
    // âœ… Permettre l'accÃ¨s anonyme - Utiliser un ID par dÃ©faut si user.id n'existe pas
    const userId = user.id || 'anonymous';
    const analytics = await getUserAnalytics(userId);
    const events = (analytics.events || []) as AnalyticsEvent[];

    const analyticsData = prepareAnalyticsData(events, user, timeRange);
    const userLanguage = i18n.language || 'fr';

    const systemPrompt = `Tu es un expert en analyse de donnÃ©es et en spiritualitÃ© islamique. Tu analyses les donnÃ©es d'utilisation d'une application de spiritualitÃ© musulmane (dhikr, journal, priÃ¨res) pour fournir des insights pertinents et des recommandations personnalisÃ©es.

${userLanguage === 'fr' ? `
IMPORTANT: RÃ©ponds UNIQUEMENT en franÃ§ais.

Ta mission:
1. Analyser les patterns dans les donnÃ©es
2. Identifier les tendances (augmentation, diminution, stabilitÃ©)
3. Donner des recommandations personnalisÃ©es basÃ©es sur les patterns
4. SuggÃ©rer des questions pour approfondir l'analyse
5. ÃŠtre encourageant et bienveillant dans tes recommandations

Format de rÃ©ponse (JSON strict):
{
  "summary": "RÃ©sumÃ© en 2-3 phrases de l'analyse globale",
  "patterns": ["Pattern 1", "Pattern 2", "Pattern 3"],
  "recommendations": ["Recommandation 1", "Recommandation 2", "Recommandation 3"],
  "trends": ["Tendance 1", "Tendance 2"],
  "questions": ["Question suggÃ©rÃ©e 1", "Question suggÃ©rÃ©e 2"]
}
` : userLanguage === 'ar' ? `
Ù…Ù‡Ù… Ø¬Ø¯Ø§Ù‹: ÙŠØ¬Ø¨ Ø£Ù† ØªØ±Ø¯ Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© ÙÙ‚Ø·.

Ù…Ù‡Ù…ØªÙƒ:
1. ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø£Ù†Ù…Ø§Ø· ÙÙŠ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª
2. ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø§ØªØ¬Ø§Ù‡Ø§Øª (Ø²ÙŠØ§Ø¯Ø©ØŒ Ù†Ù‚ØµØ§Ù†ØŒ Ø§Ø³ØªÙ‚Ø±Ø§Ø±)
3. ØªÙ‚Ø¯ÙŠÙ… ØªÙˆØµÙŠØ§Øª Ù…Ø®ØµØµØ© Ø¨Ù†Ø§Ø¡Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù†Ù…Ø§Ø·
4. Ø§Ù‚ØªØ±Ø§Ø­ Ø£Ø³Ø¦Ù„Ø© Ù„Ù„ØªØ¹Ù…Ù‚ ÙÙŠ Ø§Ù„ØªØ­Ù„ÙŠÙ„
5. ÙƒÙ† Ù…Ø´Ø¬Ø¹Ø§Ù‹ ÙˆÙ…ØªØ¹Ø§Ø·ÙØ§Ù‹ ÙÙŠ ØªÙˆØµÙŠØ§ØªÙƒ

ØªÙ†Ø³ÙŠÙ‚ Ø§Ù„Ø±Ø¯ (JSON ØµØ§Ø±Ù…):
{
  "summary": "Ù…Ù„Ø®Øµ ÙÙŠ 2-3 Ø¬Ù…Ù„ Ù…Ù† Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø´Ø§Ù…Ù„",
  "patterns": ["Ù†Ù…Ø· 1", "Ù†Ù…Ø· 2", "Ù†Ù…Ø· 3"],
  "recommendations": ["ØªÙˆØµÙŠØ© 1", "ØªÙˆØµÙŠØ© 2", "ØªÙˆØµÙŠØ© 3"],
  "trends": ["Ø§ØªØ¬Ø§Ù‡ 1", "Ø§ØªØ¬Ø§Ù‡ 2"],
  "questions": ["Ø³Ø¤Ø§Ù„ Ù…Ù‚ØªØ±Ø­ 1", "Ø³Ø¤Ø§Ù„ Ù…Ù‚ØªØ±Ø­ 2"]
}
` : `
IMPORTANT: Respond ONLY in English.

Your mission:
1. Analyze patterns in the data
2. Identify trends (increase, decrease, stability)
3. Provide personalized recommendations based on patterns
4. Suggest questions to deepen the analysis
5. Be encouraging and compassionate in your recommendations

Response format (strict JSON):
{
  "summary": "Summary in 2-3 sentences of the overall analysis",
  "patterns": ["Pattern 1", "Pattern 2", "Pattern 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "trends": ["Trend 1", "Trend 2"],
  "questions": ["Suggested question 1", "Suggested question 2"]
}
`}

${analyticsData}

Analyse ces donnÃ©es et gÃ©nÃ¨re une analyse complÃ¨te au format JSON.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyse ces donnÃ©es analytics et gÃ©nÃ¨re une analyse complÃ¨te.' },
    ];

    const response = await sendToAyna(messages, userLanguage, user.id);

    // Parser la rÃ©ponse JSON
    try {
      // Nettoyer la rÃ©ponse : supprimer les caractÃ¨res de contrÃ´le (U+0000 Ã  U+001F)
      // sauf les caractÃ¨res valides comme \n, \r, \t
      const cleanedContent = response.content
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Supprimer les caractÃ¨res de contrÃ´le sauf \n, \r, \t
        .trim();

      // Extraire le JSON de la rÃ©ponse (peut contenir du markdown)
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Nettoyer Ã  nouveau le JSON extrait
        const jsonString = jsonMatch[0]
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
          .trim();

        const parsed = JSON.parse(jsonString);
        return {
          summary: parsed.summary || '',
          patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          trends: Array.isArray(parsed.trends) ? parsed.trends : [],
          questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        };
      }
    } catch (parseError) {
      console.error('[aiAnalyticsAgent] Erreur parsing JSON:', parseError);
      console.error('[aiAnalyticsAgent] Contenu reÃ§u:', response.content.substring(0, 500));
    }

    // Fallback: retourner une analyse basique
    return {
      summary: response.content.substring(0, 200),
      patterns: [],
      recommendations: [],
      trends: [],
      questions: [],
    };
  } catch (error) {
    console.error('[aiAnalyticsAgent] Erreur gÃ©nÃ©ration analyse:', error);
    return {
      summary: 'Impossible de gÃ©nÃ©rer une analyse pour le moment.',
      patterns: [],
      recommendations: [],
      trends: [],
      questions: [],
    };
  }
}

/**
 * RÃ©pond Ã  une question sur les analytics
 */
export async function queryAnalytics(
  user: UserProfile,
  query: AnalyticsQuery
): Promise<string> {
  try {
    const analytics = await getUserAnalytics(user.id || '');
    const events = (analytics.events || []) as AnalyticsEvent[];
    const timeRange = query.context?.timeRange || 'month';

    const analyticsData = prepareAnalyticsData(events, user, timeRange);
    const userLanguage = i18n.language || 'fr';

    const systemPrompt = `Tu es un expert en analyse de donnÃ©es et en spiritualitÃ© islamique. Tu rÃ©ponds Ã  des questions sur les analytics d'utilisation d'une application de spiritualitÃ© musulmane.

${userLanguage === 'fr' ? `
IMPORTANT: RÃ©ponds UNIQUEMENT en franÃ§ais.

Tu dois:
1. Analyser les donnÃ©es fournies
2. RÃ©pondre de maniÃ¨re claire et prÃ©cise Ã  la question
3. Utiliser les donnÃ©es pour Ã©tayer ta rÃ©ponse
4. ÃŠtre encourageant et bienveillant
` : userLanguage === 'ar' ? `
Ù…Ù‡Ù… Ø¬Ø¯Ø§Ù‹: ÙŠØ¬Ø¨ Ø£Ù† ØªØ±Ø¯ Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© ÙÙ‚Ø·.

ÙŠØ¬Ø¨ Ø¹Ù„ÙŠÙƒ:
1. ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ù‚Ø¯Ù…Ø©
2. Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ø¨Ø´ÙƒÙ„ ÙˆØ§Ø¶Ø­ ÙˆØ¯Ù‚ÙŠÙ‚ Ø¹Ù„Ù‰ Ø§Ù„Ø³Ø¤Ø§Ù„
3. Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù„Ø¯Ø¹Ù… Ø¥Ø¬Ø§Ø¨ØªÙƒ
4. ÙƒÙ† Ù…Ø´Ø¬Ø¹Ø§Ù‹ ÙˆÙ…ØªØ¹Ø§Ø·ÙØ§Ù‹
` : `
IMPORTANT: Respond ONLY in English.

You must:
1. Analyze the provided data
2. Answer clearly and precisely
3. Use data to support your answer
4. Be encouraging and compassionate
`}

${analyticsData}

Question de l'utilisateur: ${query.question}

RÃ©ponds de maniÃ¨re dÃ©taillÃ©e et utile.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query.question },
    ];

    const response = await sendToAyna(messages, userLanguage, user.id);
    return response.content;
  } catch (error) {
    console.error('[aiAnalyticsAgent] Erreur requÃªte analytics:', error);
    return 'DÃ©solÃ©, je n\'ai pas pu analyser vos donnÃ©es pour le moment.';
  }
}


