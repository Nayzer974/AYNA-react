/**
 * Service d'agent IA pour l'analyse approfondie des analytics
 * Utilise AYNA pour analyser les données utilisateur et générer des insights
 */

import { sendToAyna, type ChatMessage } from './ayna';
import { getUserAnalytics, type AnalyticsEvent } from './analytics';
import { UserProfile } from '@/contexts/UserContext';
import i18n from '@/i18n';

export interface AnalyticsAnalysis {
  summary: string;
  patterns: string[];
  recommendations: string[];
  trends: string[];
  questions?: string[]; // Questions suggérées pour approfondir
}

export interface AnalyticsQuery {
  question: string;
  context?: {
    timeRange?: 'week' | 'month' | 'year' | 'all';
    focus?: 'dhikr' | 'journal' | 'prayer' | 'all';
  };
}

/**
 * Prépare les données analytics pour l'analyse IA
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

  // Convertir les événements de Supabase (qui ont created_at) en format AnalyticsEvent
  const normalizedEvents: AnalyticsEvent[] = events.map((event: any) => {
    // Si l'événement vient de Supabase, il a created_at au lieu de timestamp
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

  // Calculer les totaux basés sur les événements filtrés
  // Pour le dhikr, additionner les propriétés "count" si elles existent, sinon compter les événements
  const totalDhikrInPeriod = dhikrEvents.reduce((sum, event) => {
    const count = event.properties?.count || event.properties?.quantity || 1;
    return sum + (typeof count === 'number' ? count : 1);
  }, 0);

  // Pour les notes, compter les événements (chaque événement = 1 note)
  const totalNotesInPeriod = journalEvents.length;

  // Pour les prières, compter les événements (chaque événement = 1 prière)
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

  // Statistiques utilisateur - utiliser les totaux de la période, pas les totaux globaux
  // Les événements locaux (y compris ceux du jour) sont maintenant inclus via getUserAnalytics
  const stats = {
    totalDhikr: totalDhikrInPeriod, // Total dhikr dans la période (inclut les événements du jour)
    totalNotes: totalNotesInPeriod, // Total notes dans la période (inclut les événements du jour)
    totalPrayers: totalPrayersInPeriod, // Total prières dans la période (inclut les événements du jour)
    streak: user.analytics?.streak || 0,
    totalEvents: filteredEvents.length,
    dhikrCount: dhikrEvents.length, // Nombre d'événements dhikr
    journalCount: journalEvents.length, // Nombre d'événements journal
    prayerCount: prayerEvents.length, // Nombre d'événements prière
  };

  // Déterminer le label de période
  const periodLabel = timeRange === 'week' ? '7 derniers jours' : 
                     timeRange === 'month' ? '30 derniers jours' : 
                     timeRange === 'year' ? '365 derniers jours' : 
                     'toutes les périodes';

  return `
DONNÉES ANALYTICS UTILISATEUR (PÉRIODE: ${periodLabel}):

Statistiques pour cette période (${periodLabel}):
- Total dhikr effectués: ${stats.totalDhikr}
- Total notes écrites: ${stats.totalNotes}
- Total prières complétées: ${stats.totalPrayers}
- Série actuelle: ${stats.streak} jours
- Total événements: ${stats.totalEvents}

Répartition des activités:
- Événements dhikr: ${stats.dhikrCount}
- Événements journal: ${stats.journalCount}
- Événements prière: ${stats.prayerCount}

Patterns temporels:
- Heure de pic pour le dhikr: ${peakHour ? `${peakHour}h` : 'Non déterminé'}
- Jour de pic: ${peakDay !== undefined ? dayNames[parseInt(peakDay)] : 'Non déterminé'}

Derniers événements (échantillon):
${filteredEvents.slice(0, 20).map(e => 
  `- ${e.name} (${new Date(e.timestamp).toLocaleString('fr-FR')})`
).join('\n')}

IMPORTANT: Toutes les statistiques ci-dessus concernent UNIQUEMENT la période sélectionnée (${periodLabel}), pas les totaux globaux de l'utilisateur.
`;
}

/**
 * Génère une analyse automatique des analytics
 */
export async function generateAnalyticsAnalysis(
  user: UserProfile,
  timeRange: 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<AnalyticsAnalysis> {
  try {
    // ✅ Permettre l'accès anonyme - Utiliser un ID par défaut si user.id n'existe pas
    const userId = user.id || 'anonymous';
    const analytics = await getUserAnalytics(userId);
    const events = (analytics.events || []) as AnalyticsEvent[];

    const analyticsData = prepareAnalyticsData(events, user, timeRange);
    const userLanguage = i18n.language || 'fr';

    const systemPrompt = `Tu es un expert en analyse de données et en spiritualité islamique. Tu analyses les données d'utilisation d'une application de spiritualité musulmane (dhikr, journal, prières) pour fournir des insights pertinents et des recommandations personnalisées.

${userLanguage === 'fr' ? `
IMPORTANT: Réponds UNIQUEMENT en français.

Ta mission:
1. Analyser les patterns dans les données
2. Identifier les tendances (augmentation, diminution, stabilité)
3. Donner des recommandations personnalisées basées sur les patterns
4. Suggérer des questions pour approfondir l'analyse
5. Être encourageant et bienveillant dans tes recommandations

Format de réponse (JSON strict):
{
  "summary": "Résumé en 2-3 phrases de l'analyse globale",
  "patterns": ["Pattern 1", "Pattern 2", "Pattern 3"],
  "recommendations": ["Recommandation 1", "Recommandation 2", "Recommandation 3"],
  "trends": ["Tendance 1", "Tendance 2"],
  "questions": ["Question suggérée 1", "Question suggérée 2"]
}
` : userLanguage === 'ar' ? `
مهم جداً: يجب أن ترد بالعربية فقط.

مهمتك:
1. تحليل الأنماط في البيانات
2. تحديد الاتجاهات (زيادة، نقصان، استقرار)
3. تقديم توصيات مخصصة بناءً على الأنماط
4. اقتراح أسئلة للتعمق في التحليل
5. كن مشجعاً ومتعاطفاً في توصياتك

تنسيق الرد (JSON صارم):
{
  "summary": "ملخص في 2-3 جمل من التحليل الشامل",
  "patterns": ["نمط 1", "نمط 2", "نمط 3"],
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"],
  "trends": ["اتجاه 1", "اتجاه 2"],
  "questions": ["سؤال مقترح 1", "سؤال مقترح 2"]
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

Analyse ces données et génère une analyse complète au format JSON.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyse ces données analytics et génère une analyse complète.' },
    ];

    const response = await sendToAyna(messages, userLanguage, user.id);

    // Parser la réponse JSON
    try {
      // Nettoyer la réponse : supprimer les caractères de contrôle (U+0000 à U+001F)
      // sauf les caractères valides comme \n, \r, \t
      const cleanedContent = response.content
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Supprimer les caractères de contrôle sauf \n, \r, \t
        .trim();
      
      // Extraire le JSON de la réponse (peut contenir du markdown)
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Nettoyer à nouveau le JSON extrait
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
      console.error('[aiAnalyticsAgent] Contenu reçu:', response.content.substring(0, 500));
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
    console.error('[aiAnalyticsAgent] Erreur génération analyse:', error);
    return {
      summary: 'Impossible de générer une analyse pour le moment.',
      patterns: [],
      recommendations: [],
      trends: [],
      questions: [],
    };
  }
}

/**
 * Répond à une question sur les analytics
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

    const systemPrompt = `Tu es un expert en analyse de données et en spiritualité islamique. Tu réponds à des questions sur les analytics d'utilisation d'une application de spiritualité musulmane.

${userLanguage === 'fr' ? `
IMPORTANT: Réponds UNIQUEMENT en français.

Tu dois:
1. Analyser les données fournies
2. Répondre de manière claire et précise à la question
3. Utiliser les données pour étayer ta réponse
4. Être encourageant et bienveillant
` : userLanguage === 'ar' ? `
مهم جداً: يجب أن ترد بالعربية فقط.

يجب عليك:
1. تحليل البيانات المقدمة
2. الإجابة بشكل واضح ودقيق على السؤال
3. استخدام البيانات لدعم إجابتك
4. كن مشجعاً ومتعاطفاً
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

Réponds de manière détaillée et utile.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query.question },
    ];

    const response = await sendToAyna(messages, userLanguage, user.id);
    return response.content;
  } catch (error) {
    console.error('[aiAnalyticsAgent] Erreur requête analytics:', error);
    return 'Désolé, je n\'ai pas pu analyser vos données pour le moment.';
  }
}

