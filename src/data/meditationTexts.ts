/**
 * Textes de méditation pour Bayt Nûr
 * Sessions guidées de 5, 10 et 15 minutes
 */

export interface MeditationStep {
  id: string;
  title: string;
  duration: number; // en secondes
  text: string;
  isVisualization?: boolean;
  isSilence?: boolean;
}

export interface MeditationSession {
  duration: 5 | 10 | 15;
  steps: MeditationStep[];
}

export interface VisualizationText {
  id: 'fire' | 'rain' | 'wind' | 'forest';
  icon: string;
  title: {
    fr: string;
    en: string;
    ar: string;
  };
  text: {
    fr: string;
    en: string;
    ar: string;
  };
}

// ============================================
// VISUALISATIONS
// ============================================

export const visualizations: VisualizationText[] = [
  {
    id: 'fire',
    icon: '🔥',
    title: {
      fr: 'Crépitement du feu',
      en: 'Crackling fire',
      ar: 'صوت النار',
    },
    text: {
      fr: `Écoute le crépitement du feu.
Un feu calme, contenu, stable.
Il n'est pas là pour brûler, ni pour détruire.
Il éclaire. Il réchauffe.

Observe sa présence.
Toujours en mouvement, sans agitation.

Comme ce feu, laisse ce qui est confus
se clarifier doucement.
Pas en forçant,
mais en laissant la lumière faire son travail.

Ce qui est inutile se dissout.
Ce qui est essentiel demeure.

Ressens une chaleur tranquille
au centre de la poitrine.
Une chaleur qui ne presse pas,
qui ne consume pas, qui soutient.

Inspire… Expire…

Dans cette chaleur stable,
la qualité présente trouve naturellement sa place.
Sans excès. Sans tension.

Reste quelques instants avec cette clarté paisible.`,
      en: `Listen to the crackling of the fire.
A calm, contained, stable fire.
It is not here to burn or destroy.
It illuminates. It warms.

Observe its presence.
Always moving, without agitation.

Like this fire, let what is confused
clarify gently.
Not by forcing,
but by letting the light do its work.

What is unnecessary dissolves.
What is essential remains.

Feel a quiet warmth
at the center of your chest.
A warmth that does not rush,
that does not consume, that supports.

Breathe in… Breathe out…

In this stable warmth,
the present quality finds its place naturally.
Without excess. Without tension.

Stay a few moments with this peaceful clarity.`,
      ar: `استمع إلى صوت النار.
نار هادئة، مستقرة، ثابتة.
ليست هنا لتحرق أو تدمر.
إنها تضيء. تدفئ.

راقب حضورها.
دائماً في حركة، دون اضطراب.

مثل هذه النار، دع ما هو مشوش
يتوضح بلطف.
ليس بالقوة،
بل بترك النور يقوم بعمله.

ما لا فائدة منه يذوب.
ما هو أساسي يبقى.

اشعر بدفء هادئ
في وسط صدرك.
دفء لا يستعجل،
لا يستهلك، بل يدعم.

تنفس للداخل... تنفس للخارج...

في هذا الدفء المستقر،
الجودة الحاضرة تجد مكانها بشكل طبيعي.
بلا إفراط. بلا توتر.

ابقَ لحظات قليلة مع هذا الوضوح السلمي.`,
    },
  },
  {
    id: 'rain',
    icon: '🌧️',
    title: {
      fr: 'Pluie',
      en: 'Rain',
      ar: 'المطر',
    },
    text: {
      fr: `Écoute le son de la pluie.
Une pluie douce, régulière, paisible.
Elle ne force rien.
Elle descend simplement, goutte après goutte.

Comme cette pluie,
la qualité évoquée n'a pas besoin d'être provoquée.
Elle est déjà là, disponible, accessible.

Laisse cette douceur entourer l'intérieur,
sans chercher à changer quoi que ce soit.

Chaque goutte est un rappel.
Chaque instant est un cadeau.

Inspire… Expire…

Laisse la pluie nettoyer doucement
ce qui n'a plus besoin d'être porté.

Reste dans cette douceur, quelques instants.`,
      en: `Listen to the sound of the rain.
A soft, regular, peaceful rain.
It forces nothing.
It simply falls, drop by drop.

Like this rain,
the evoked quality does not need to be provoked.
It is already there, available, accessible.

Let this gentleness surround your interior,
without trying to change anything.

Each drop is a reminder.
Each moment is a gift.

Breathe in… Breathe out…

Let the rain gently cleanse
what no longer needs to be carried.

Stay in this gentleness, for a few moments.`,
      ar: `استمع إلى صوت المطر.
مطر ناعم، منتظم، هادئ.
لا يفرض شيئاً.
ينزل ببساطة، قطرة بعد قطرة.

مثل هذا المطر،
الجودة المذكورة لا تحتاج إلى استفزاز.
إنها موجودة بالفعل، متاحة، قابلة للوصول.

دع هذا اللطف يحيط بداخلك،
دون محاولة تغيير أي شيء.

كل قطرة تذكير.
كل لحظة هدية.

تنفس للداخل... تنفس للخارج...

دع المطر ينظف بلطف
ما لم يعد بحاجة إلى حمله.

ابقَ في هذا اللطف، لبضع لحظات.`,
    },
  },
  {
    id: 'wind',
    icon: '🌬️',
    title: {
      fr: 'Vent du désert',
      en: 'Desert wind',
      ar: 'ريح الصحراء',
    },
    text: {
      fr: `Écoute le souffle du vent.
Un vent large, libre,
qui traverse l'espace sans obstacle.

Imagine un désert vaste.
Pas vide, mais ouvert.
Sans murs. Sans limites proches.

Le vent ne s'arrête pas.
Il ne lutte pas. Il passe, simplement.

Comme ce vent,
laisse ce qui est lourd s'éloigner doucement.
Pas en le chassant,
mais en cessant de le retenir.

Ce qui doit rester reste.
Ce qui n'a plus besoin d'être porté peut partir.

Laisse cet espace intérieur s'élargir.
Plus de place. Plus de respiration.

Inspire… Expire…

Dans cet espace ouvert,
la qualité présente peut circuler librement.
Sans contrainte. Sans effort.

Reste simplement avec ce souffle large quelques instants.`,
      en: `Listen to the breath of the wind.
A wide, free wind,
that crosses space without obstacle.

Imagine a vast desert.
Not empty, but open.
Without walls. Without nearby limits.

The wind does not stop.
It does not struggle. It simply passes.

Like this wind,
let what is heavy drift away gently.
Not by chasing it,
but by ceasing to hold it.

What must stay stays.
What no longer needs to be carried can leave.

Let this inner space expand.
More room. More breath.

Breathe in… Breathe out…

In this open space,
the present quality can flow freely.
Without constraint. Without effort.

Simply stay with this wide breath for a few moments.`,
      ar: `استمع إلى نفس الريح.
ريح واسعة، حرة،
تعبر الفضاء بلا عائق.

تخيل صحراء شاسعة.
ليست فارغة، بل مفتوحة.
بلا جدران. بلا حدود قريبة.

الريح لا تتوقف.
لا تكافح. تمر ببساطة.

مثل هذه الريح،
دع ما هو ثقيل يبتعد بلطف.
ليس بمطاردته،
بل بالتوقف عن التمسك به.

ما يجب أن يبقى يبقى.
ما لم يعد بحاجة إلى حمله يمكن أن يرحل.

دع هذا الفضاء الداخلي يتسع.
مزيد من المكان. مزيد من التنفس.

تنفس للداخل... تنفس للخارج...

في هذا الفضاء المفتوح،
الجودة الحاضرة يمكن أن تتدفق بحرية.
بلا قيود. بلا جهد.

ابقَ ببساطة مع هذا النفس الواسع لبضع لحظات.`,
    },
  },
  {
    id: 'forest',
    icon: '🌲',
    title: {
      fr: 'Forêt',
      en: 'Forest',
      ar: 'الغابة',
    },
    text: {
      fr: `Imagine une forêt paisible.
Les arbres sont là depuis longtemps.
Ils ne se pressent pas.
Ils ne se comparent pas.

Le sol est ferme sous tes pieds.
Présent. Fiable.

Chaque arbre est enraciné profondément.
Il ne lutte pas contre le vent.
Il tient.

Comme cette forêt,
laisse l'intérieur retrouver sa stabilité naturelle.
Pas besoin de grandir plus vite.
Pas besoin d'être ailleurs.

Ce qui a besoin de temps prend le temps.
Ce qui est déjà solide soutient le reste.

Sens une base tranquille s'installer à l'intérieur.
Une présence posée. Sans tension.

Inspire… Expire…

Dans cette stabilité silencieuse,
la qualité présente peut s'enraciner doucement.
Sans effort. Sans résistance.

Reste quelques instants
avec cette sensation de solidité calme.`,
      en: `Imagine a peaceful forest.
The trees have been here for a long time.
They do not rush.
They do not compare themselves.

The ground is firm under your feet.
Present. Reliable.

Each tree is deeply rooted.
It does not fight against the wind.
It holds.

Like this forest,
let your interior find its natural stability.
No need to grow faster.
No need to be elsewhere.

What needs time takes time.
What is already solid supports the rest.

Feel a quiet base settling inside.
A grounded presence. Without tension.

Breathe in… Breathe out…

In this silent stability,
the present quality can root itself gently.
Without effort. Without resistance.

Stay a few moments
with this feeling of calm solidity.`,
      ar: `تخيل غابة هادئة.
الأشجار موجودة هنا منذ زمن طويل.
لا تستعجل.
لا تقارن نفسها.

الأرض صلبة تحت قدميك.
حاضرة. موثوقة.

كل شجرة متجذرة بعمق.
لا تحارب الريح.
تصمد.

مثل هذه الغابة،
دع داخلك يجد استقراره الطبيعي.
لا حاجة للنمو أسرع.
لا حاجة لتكون في مكان آخر.

ما يحتاج وقتاً يأخذ وقته.
ما هو صلب بالفعل يدعم الباقي.

اشعر بقاعدة هادئة تستقر بالداخل.
حضور راسخ. بلا توتر.

تنفس للداخل... تنفس للخارج...

في هذا الاستقرار الصامت،
الجودة الحاضرة يمكن أن تتجذر بلطف.
بلا جهد. بلا مقاومة.

ابقَ لحظات قليلة
مع هذا الشعور بالصلابة الهادئة.`,
    },
  },
];

// ============================================
// TEXTES DES SESSIONS (Français)
// ============================================

export const sessionTexts = {
  // Accueil & mise en condition
  welcome: {
    fr: `Assalâm 'alaykoum.
Bienvenue dans Bayt Nûr.
Prends un instant pour t'installer.

Si tu le souhaites,
pose doucement les deux mains sur ta poitrine.
Ce geste est une invitation, pas une obligation.

Ici, tu n'as rien à prouver.
Sois simplement présent.`,
    en: `Assalâm 'alaykoum.
Welcome to Bayt Nûr.
Take a moment to settle in.

If you wish,
gently place both hands on your chest.
This gesture is an invitation, not an obligation.

Here, you have nothing to prove.
Simply be present.`,
    ar: `السلام عليكم.
مرحباً بك في بيت النور.
خذ لحظة للاستقرار.

إذا رغبت،
ضع يديك برفق على صدرك.
هذه الإيماءة دعوة، ليست التزاماً.

هنا، ليس عليك إثبات شيء.
كن حاضراً ببساطة.`,
  },

  // Orientation intérieure
  orientation: {
    fr: `Le Nom présent dans cet instant
renvoie à une qualité divine.

Laisse cette qualité orienter ton cœur intérieurement.
Tu peux invoquer Allah dans le silence,
à travers cette qualité.

Même sans mots, l'invocation est entendue.`,
    en: `The Name present in this moment
refers to a divine quality.

Let this quality orient your heart inwardly.
You can invoke Allah in silence,
through this quality.

Even without words, the invocation is heard.`,
    ar: `الاسم الحاضر في هذه اللحظة
يشير إلى صفة إلهية.

دع هذه الصفة توجه قلبك داخلياً.
يمكنك أن تدعو الله في الصمت،
من خلال هذه الصفة.

حتى بدون كلمات، الدعاء مسموع.`,
  },

  // Respiration guidée
  breathing: {
    fr: `Inspire lentement par le nez
pendant quatre secondes.
Expire doucement par la bouche
pendant six secondes.

Encore une fois.
Inspire…
Expire…

Puis laisse la respiration devenir naturelle.`,
    en: `Breathe in slowly through your nose
for four seconds.
Breathe out gently through your mouth
for six seconds.

Once more.
Breathe in…
Breathe out…

Then let the breathing become natural.`,
    ar: `تنفس ببطء من أنفك
لمدة أربع ثوانٍ.
أخرج الهواء برفق من فمك
لمدة ست ثوانٍ.

مرة أخرى.
تنفس للداخل...
تنفس للخارج...

ثم دع التنفس يصبح طبيعياً.`,
  },

  // Descente intérieure (sessions 10 et 15 min)
  innerDescent: {
    fr: `Maintenant,
laisse cette présence descendre plus profondément.
Pas dans la tête. Dans la poitrine.

Tu n'as rien à provoquer.
Même le silence est suffisant.`,
    en: `Now,
let this presence descend more deeply.
Not in the head. In the chest.

You have nothing to provoke.
Even silence is enough.`,
    ar: `الآن،
دع هذا الحضور ينزل أعمق.
ليس في الرأس. في الصدر.

ليس عليك إثارة شيء.
حتى الصمت كافٍ.`,
  },

  // Redescente consciente
  consciousReturn: {
    fr: `Sens à nouveau le corps.
La respiration.
Le contact avec l'instant.

Ce qui a été accueilli peut rester avec toi.`,
    en: `Feel your body again.
The breath.
The contact with this moment.

What has been welcomed can stay with you.`,
    ar: `اشعر بجسدك مرة أخرى.
التنفس.
التواصل مع هذه اللحظة.

ما تم استقباله يمكن أن يبقى معك.`,
  },

  // Clôture
  closing: {
    fr: `Reviens doucement à l'instant.
Ce rappel peut t'accompagner
dans la suite de ta journée.

Assalâm 'alaykoum.`,
    en: `Come back gently to this moment.
This reminder can accompany you
throughout the rest of your day.

Assalâm 'alaykoum.`,
    ar: `عد برفق إلى هذه اللحظة.
هذا التذكير يمكن أن يرافقك
في بقية يومك.

السلام عليكم.`,
  },
};

// ============================================
// STRUCTURES DES SESSIONS
// ============================================

export function getSessionSteps(
  duration: 5 | 10 | 15,
  visualizationId: 'fire' | 'rain' | 'wind' | 'forest',
  language: 'fr' | 'en' | 'ar' = 'fr'
): MeditationStep[] {
  const viz = visualizations.find(v => v.id === visualizationId);
  const vizText = viz?.text[language] || viz?.text.fr || '';

  if (duration === 5) {
    return [
      { id: 'welcome', title: 'Accueil', duration: 45, text: sessionTexts.welcome[language] },
      { id: 'orientation', title: 'Orientation', duration: 45, text: sessionTexts.orientation[language] },
      { id: 'breathing', title: 'Respiration', duration: 60, text: sessionTexts.breathing[language] },
      { id: 'visualization', title: viz?.title[language] || 'Visualisation', duration: 120, text: vizText, isVisualization: true },
      { id: 'closing', title: 'Clôture', duration: 30, text: sessionTexts.closing[language] },
    ];
  }

  if (duration === 10) {
    return [
      { id: 'welcome', title: 'Accueil', duration: 60, text: sessionTexts.welcome[language] },
      { id: 'orientation', title: 'Orientation', duration: 60, text: sessionTexts.orientation[language] },
      { id: 'breathing', title: 'Respiration', duration: 120, text: sessionTexts.breathing[language] },
      { id: 'visualization', title: viz?.title[language] || 'Visualisation', duration: 180, text: vizText, isVisualization: true },
      { id: 'innerDescent', title: 'Descente intérieure', duration: 120, text: sessionTexts.innerDescent[language] },
      { id: 'consciousReturn', title: 'Redescente', duration: 60, text: sessionTexts.consciousReturn[language] },
      { id: 'closing', title: 'Clôture', duration: 30, text: sessionTexts.closing[language] },
    ];
  }

  // 15 minutes
  return [
    { id: 'welcome', title: 'Accueil', duration: 90, text: sessionTexts.welcome[language] },
    { id: 'orientation', title: 'Orientation', duration: 90, text: sessionTexts.orientation[language] },
    { id: 'breathing', title: 'Respiration', duration: 180, text: sessionTexts.breathing[language] },
    { id: 'visualization', title: viz?.title[language] || 'Visualisation', duration: 240, text: vizText, isVisualization: true },
    { id: 'innerDescent', title: 'Descente intérieure', duration: 180, text: sessionTexts.innerDescent[language] },
    { id: 'silence', title: 'Silence habité', duration: 60, text: '', isSilence: true },
    { id: 'consciousReturn', title: 'Redescente', duration: 60, text: sessionTexts.consciousReturn[language] },
    { id: 'closing', title: 'Clôture', duration: 60, text: sessionTexts.closing[language] },
  ];
}

// Fonction pour obtenir la visualisation correspondant à une ambiance
export function getVisualizationForAmbiance(ambianceId: string): 'fire' | 'rain' | 'wind' | 'forest' {
  const mapping: Record<string, 'fire' | 'rain' | 'wind' | 'forest'> = {
    'feu-de-bois': 'fire',
    'fire': 'fire',
    'pluie': 'rain',
    'rain': 'rain',
    'desert': 'wind',
    'wind': 'wind',
    'forest': 'forest',
    'foret': 'forest',
  };
  return mapping[ambianceId] || 'forest';
}

// ============================================
// KHALWA YA ALLAH - SABILAT NUR (Format spécial avec timestamps)
// ============================================

/**
 * Fonction spéciale pour le khalwa "Ya Allah" de Sabilat Nûr
 * Session de 5 minutes avec format guidé précis
 */
export function getYaAllahKhalwaSteps(language: 'fr' | 'en' | 'ar' = 'fr'): MeditationStep[] {
  const texts = {
    fr: {
      entry: `Installe-toi dans le calme.
Assieds-toi ou allonge-toi, le dos détendu.
Ferme doucement les yeux.
Dis intérieurement :
Bismillāh.
Je me retire de tout pour Me tourner vers Toi.`,
      breathing: `Inspire lentement par le nez.
Expire doucement par la bouche.
Encore une fois.
À chaque expiration, relâche ce que tu portes.`,
      heart: `Porte ton attention sur ton cœur.
Sens ses battements.
Chaque battement est une miséricorde.
Dis intérieurement :
Yā Allāh…
Tu connais mon cœur mieux que moi.`,
      presence: `Dis lentement, sans forcer :
Yā Allāh, Tu me vois.
Yā Allāh, Tu m'entends.
Yā Allāh, Tu es avec moi.
Laisse ces paroles descendre dans le cœur.`,
      breathInvocation: `Commence un souffle lent :
Inspire sur 4 temps
Expire sur 6 temps
À l'inspiration, dis intérieurement :
Yā Allāh
À l'expiration, dis intérieurement :
Yā Allāh
Encore…
Rien d'autre.
Juste Son Nom.`,
      abandonment: `Imagine que ton cœur s'ouvre doucement.
Dépose :
les soucis
les peurs
les attentes
la fatigue
Dis intérieurement :
Yā Allāh, je Te confie ce que je ne sais pas porter.
Yā Allāh, prends soin de moi mieux que je ne le peux.
Reste dans cet abandon.`,
      silence: `Maintenant…
Ne dis plus rien.
Respire.
Sois présent.
Si une pensée vient, laisse-la passer.
Reviens au cœur.
Reviens à Allah.`,
      closing: `Dis doucement dans ton cœur :
Al-ḥamdu liLlāh.
Tout bien vient de Toi.
Quand tu es prêt, ouvre doucement les yeux.`,
    },
    en: {
      entry: `Settle into calm.
Sit or lie down, with your back relaxed.
Close your eyes gently.
Say inwardly:
Bismillāh.
I withdraw from everything to turn to You.`,
      breathing: `Breathe in slowly through your nose.
Breathe out gently through your mouth.
Once more.
With each exhalation, release what you carry.`,
      heart: `Bring your attention to your heart.
Feel its beats.
Each beat is a mercy.
Say inwardly:
Yā Allāh…
You know my heart better than I do.`,
      presence: `Say slowly, without forcing:
Yā Allāh, You see me.
Yā Allāh, You hear me.
Yā Allāh, You are with me.
Let these words descend into the heart.`,
      breathInvocation: `Begin a slow breath:
Inhale for 4 counts
Exhale for 6 counts
On inhalation, say inwardly:
Yā Allāh
On exhalation, say inwardly:
Yā Allāh
Again…
Nothing else.
Just His Name.`,
      abandonment: `Imagine your heart opening gently.
Release:
worries
fears
expectations
fatigue
Say inwardly:
Yā Allāh, I entrust to You what I cannot carry.
Yā Allāh, take care of me better than I can.
Remain in this abandonment.`,
      silence: `Now…
Say nothing more.
Breathe.
Be present.
If a thought comes, let it pass.
Return to the heart.
Return to Allah.`,
      closing: `Say gently in your heart:
Al-ḥamdu liLlāh.
All good comes from You.
When you are ready, open your eyes gently.`,
    },
    ar: {
      entry: `استقر في الهدوء.
اجلس أو استلقي، ظهرك مرتاح.
أغمض عينيك برفق.
قل في داخلك:
بسم الله.
أنا أبتعد عن كل شيء لأتوجه إليك.`,
      breathing: `تنفس ببطء من الأنف.
أخرج الهواء برفق من الفم.
مرة أخرى.
مع كل زفير، اترك ما تحمله.`,
      heart: `وجه انتباهك إلى قلبك.
اشعر بنبضاته.
كل نبضة هي رحمة.
قل في داخلك:
يا الله...
أنت تعرف قلبي أفضل مني.`,
      presence: `قل ببطء، بدون إجبار:
يا الله، أنت تراني.
يا الله، أنت تسمعني.
يا الله، أنت معي.
دع هذه الكلمات تنزل في القلب.`,
      breathInvocation: `ابدأ نفساً بطيئاً:
شهيق على 4 عد
زفير على 6 عد
عند الشهيق، قل في داخلك:
يا الله
عند الزفير، قل في داخلك:
يا الله
مرة أخرى...
لا شيء آخر.
فقط اسمه.`,
      abandonment: `تخيل قلبك ينفتح برفق.
ضع:
الهموم
المخاوف
التوقعات
التعب
قل في داخلك:
يا الله، أعهد إليك بما لا أستطيع حمله.
يا الله، اعتن بي أفضل مما أستطيع.
ابق في هذا التسليم.`,
      silence: `الآن...
لا تقل شيئاً أكثر.
تنفس.
كن حاضراً.
إذا جاءت فكرة، دعها تمر.
عد إلى القلب.
عد إلى الله.`,
      closing: `قل برفق في قلبك:
الحمد لله.
كل خير يأتي منك.
عندما تكون مستعداً، افتح عينيك برفق.`,
    },
  };

  const langTexts = texts[language] || texts.fr;

  // Format exact avec timestamps (5 minutes = 300 secondes)
  // ⏱️ 00:00 – 00:30 | Entrée en khalwa (30 secondes)
  // ⏱️ 00:30 – 01:00 | Respiration consciente (30 secondes)
  // ⏱️ 01:00 – 01:30 | Ancrage du cœur (30 secondes)
  // ⏱️ 01:30 – 02:00 | Présence (30 secondes)
  // ⏱️ 02:00 – 03:00 | Souffle + Invocation (60 secondes)
  // ⏱️ 03:00 – 04:00 | Abandon (60 secondes)
  // ⏱️ 04:00 – 04:30 | Silence habité (30 secondes)
  // ⏱️ 04:30 – 05:00 | Clôture (30 secondes)

  return [
    { id: 'entry', title: 'Entrée en khalwa', duration: 30, text: langTexts.entry },
    { id: 'breathing', title: 'Respiration consciente', duration: 30, text: langTexts.breathing },
    { id: 'heart', title: 'Ancrage du cœur 🫀', duration: 30, text: langTexts.heart },
    { id: 'presence', title: 'Présence', duration: 30, text: langTexts.presence },
    { id: 'breathInvocation', title: 'Souffle + Invocation', duration: 60, text: langTexts.breathInvocation },
    { id: 'abandonment', title: 'Abandon', duration: 60, text: langTexts.abandonment },
    { id: 'silence', title: 'Silence habité', duration: 30, text: '', isSilence: true },
    { id: 'closing', title: 'Clôture', duration: 30, text: langTexts.closing },
  ];
}

