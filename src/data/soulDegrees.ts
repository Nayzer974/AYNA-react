/**
 * Blocs des Degrés de l'Âme - Sabila Nur
 * Textes d'entrée et de sortie pour chaque bloc
 */

export interface SoulDegreeBlock {
  id: number;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  icon: string;
  color: string;
  // Textes d'entrée
  entry: {
    fr: string;
    en: string;
    ar: string;
  };
  // Textes de sortie avec verset
  exit: {
    fr: string;
    en: string;
    ar: string;
    verse: {
      reference: string;
      arabic: string;
      translation: {
        fr: string;
        en: string;
        ar: string;
      };
    };
  };
  // Bouton d'action
  buttonText: {
    entry: { fr: string; en: string; ar: string };
    exit: { fr: string; en: string; ar: string };
  };
}

export const soulDegreeBlocks: SoulDegreeBlock[] = [
  // ============================================
  // BLOC 1 - An-Nafs al-Ammārah (L'âme incitatrice)
  // ============================================
  {
    id: 1,
    nameAr: 'النفس الأمارة',
    nameFr: 'An-Nafs al-Ammārah',
    nameEn: 'The Commanding Soul',
    icon: '🚪',
    color: '#8B4513',
    entry: {
      fr: `Tu entres dans le premier seuil du chemin.
Ce bloc correspond à ce que les savants appellent
l'âme incitatrice.
C'est l'âme des habitudes,
des automatismes,
des réactions rapides..
Ce n'est pas une faute.
Ce n'est pas un défaut moral.
C'est le point de départ naturel de l'être humain.
À ce stade, il ne s'agit pas de lutter,
ni de corriger,
ni de forcer quoi que ce soit.
Il s'agit d'observer.
Observer comment tu fonctionnes.
Observer ce qui revient sans cesse.
Observer sans te juger.
Ce bloc n'est pas un test.
Ce n'est pas une épreuve.
C'est une installation intérieure.
Entre dans ce bloc avec simplicité,
et rappelle-toi :
La lucidité précède toujours la transformation.`,
      en: `You enter the first threshold of the path.

This block corresponds to what scholars call the commanding soul.
It is the soul of habits, automatisms, quick reactions.

This is not a fault.
This is not a moral defect.
It is the natural starting point of the human being.

At this stage, it is not about fighting, correcting, or forcing anything.
It is about observing.

Observe how you function.
Observe what keeps coming back.
Observe without judging yourself.

This block is not a test.
It is not a trial.
It is an inner settling.

Enter this block with simplicity,
and remember:
Lucidity always precedes transformation.`,
      ar: `تدخل العتبة الأولى من الطريق.

هذا المستوى يتوافق مع ما يسميه العلماء النفس الأمارة.
إنها نفس العادات، والآليات، وردود الفعل السريعة.

هذا ليس خطأ.
هذا ليس عيباً أخلاقياً.
إنها نقطة البداية الطبيعية للإنسان.

في هذه المرحلة، الأمر لا يتعلق بالقتال أو التصحيح أو إجبار أي شيء.
إنه يتعلق بالمراقبة.

راقب كيف تعمل.
راقب ما يعود باستمرار.
راقب دون أن تحكم على نفسك.

هذا المستوى ليس اختباراً.
ليس محنة.
إنه استقرار داخلي.

ادخل هذا المستوى ببساطة،
وتذكر:
الوضوح يسبق التحول دائماً.`,
    },
    exit: {
      fr: `Tu arrives à la fin de ce premier bloc.
Durant ces jours,
tu n'as rien eu à prouver.
Tu as simplement appris à voir.
Voir tes habitudes.
Voir tes réflexes.
Voir ce qui te pousse à agir sans réfléchir.
Le Coran nous rappelle :
« Nous écrivons ce qu'ils ont fait et leurs traces,
et toute chose Nous l'avons dénombrée
dans un registre clair. »
Ce verset ne vise pas à faire peur.
Il rappelle que rien n'est insignifiant.
Chaque geste laisse une trace.
Chaque choix, même discret, compte.
En prenant conscience de cela,
tu as déjà franchi un seuil.
Avant de continuer,
prends un instant pour refaire ton intention.
Non pour être parfait,
mais pour rester sincère.
Le chemin ne demande pas de la force,
il demande de la présence.`,
      en: `You arrive at the end of this first block.

During these days, you had nothing to prove.
You simply learned to see.

See your habits.
See your reflexes.
See what pushes you to act without thinking.

This verse is not meant to frighten.
It reminds that nothing is insignificant.
Every gesture leaves a trace.
Every choice, even discreet, counts.

By becoming aware of this,
you have already crossed a threshold.

Before continuing,
take a moment to renew your intention.
Not to be perfect,
but to remain sincere.

The path does not ask for strength,
it asks for presence.`,
      ar: `تصل إلى نهاية هذا المستوى الأول.

خلال هذه الأيام، لم يكن عليك إثبات شيء.
تعلمت ببساطة أن ترى.

رؤية عاداتك.
رؤية ردود أفعالك.
رؤية ما يدفعك للتصرف دون تفكير.

هذه الآية ليست للتخويف.
إنها تذكير بأن لا شيء تافه.
كل إيماءة تترك أثراً.
كل خيار، حتى الصغير، مهم.

بإدراكك لهذا،
لقد عبرت بالفعل عتبة.

قبل المتابعة،
خذ لحظة لتجديد نيتك.
ليس لتكون مثالياً،
بل لتبقى صادقاً.

الطريق لا يطلب القوة،
بل يطلب الحضور.`,
      verse: {
        reference: 'Yā-Sīn 36:12',
        arabic: 'إِنَّا نَحْنُ نُحْيِي الْمَوْتَىٰ وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ ۚ وَكُلَّ شَيْءٍ أَحْصَيْنَاهُ فِي إِمَامٍ مُّبِينٍ',
        translation: {
          fr: 'Nous écrivons ce qu\'ils ont fait et leurs traces, et toute chose Nous l\'avons dénombrée dans un registre clair.',
          en: 'We record what they have done and their traces, and We have enumerated everything in a clear register.',
          ar: 'إِنَّا نَحْنُ نُحْيِي الْمَوْتَىٰ وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ ۚ وَكُلَّ شَيْءٍ أَحْصَيْنَاهُ فِي إِمَامٍ مُّبِينٍ',
        },
      },
    },
    buttonText: {
      entry: {
        fr: '👉 Entrer dans le Bloc 1 avec sincérité',
        en: '👉 Enter Block 1 with sincerity',
        ar: '👉 دخول المستوى ١ بإخلاص',
      },
      exit: {
        fr: '👉 Refaire mon intention et continuer le chemin',
        en: '👉 Renew my intention and continue the path',
        ar: '👉 تجديد نيتي ومواصلة الطريق',
      },
    },
  },

  // ============================================
  // BLOC 2 - An-Nafs al-Lawwāmah (L'âme qui se reproche)
  // ============================================
  {
    id: 2,
    nameAr: 'النفس اللوامة',
    nameFr: 'An-Nafs al-Lawwāmah',
    nameEn: 'The Self-Reproaching Soul',
    icon: '🔵',
    color: '#1E90FF',
    entry: {
      fr: `Tu entres maintenant dans le temps de l'âme qui se questionne.
Après l'observation vient souvent le doute.
Tu commences à voir ce qui ne va pas.
Tu remarques tes manques,
tes hésitations,.
tes contradictions.
Cette étape correspond à ce que les savants appellent
l'âme qui se reproche.
Elle peut te pousser à te corriger,
mais aussi à te juger trop durement.
Ce bloc n'est pas là pour t'accuser.
Il est là pour t'apprendre une chose essentielle :
👉 se corriger sans se condamner.
Pendant ces jours,
tu vas apprendre à distinguer
la lucidité de la culpabilité,
l'effort sincère de l'exigence excessive.
Entre dans ce bloc avec douceur.
Le chemin ne demande pas que tu sois dur avec toi-même,
il demande que tu sois vrai.`,
      en: `You now enter the time of the questioning soul.

After observation often comes doubt.
You begin to see what is wrong.
You notice your lacks, your hesitations, your contradictions.

This stage corresponds to what scholars call the self-reproaching soul.
It can push you to correct yourself,
but also to judge yourself too harshly.

This block is not here to accuse you.
It is here to teach you something essential:
to correct without condemning.

During these days,
you will learn to distinguish
lucidity from guilt,
sincere effort from excessive demands.

Enter this block with gentleness.
The path does not ask you to be hard on yourself,
it asks you to be true.`,
      ar: `تدخل الآن في وقت النفس التي تتساءل.

بعد المراقبة غالباً ما يأتي الشك.
تبدأ برؤية ما هو خاطئ.
تلاحظ نقائصك، ترددك، تناقضاتك.

هذه المرحلة تتوافق مع ما يسميه العلماء النفس اللوامة.
يمكن أن تدفعك لتصحيح نفسك،
لكن أيضاً للحكم على نفسك بقسوة شديدة.

هذا المستوى ليس هنا لاتهامك.
إنه هنا ليعلمك شيئاً أساسياً:
التصحيح دون الإدانة.

خلال هذه الأيام،
ستتعلم التمييز
بين الوضوح والشعور بالذنب،
بين الجهد الصادق والمطالب المفرطة.

ادخل هذا المستوى بلطف.
الطريق لا يطلب منك أن تكون قاسياً على نفسك،
بل يطلب منك أن تكون صادقاً.`,
    },
    exit: {
      fr: `Tu arrives à la fin de ce deuxième bloc.
Tu as appris à te regarder
sans détourner les yeux,
mais aussi sans t'écraser sous le reproche.
Le Coran nous rappelle :
« Il ne nous incombe que la transmission claire. »
Ce verset enseigne une règle profonde :
👉 ta responsabilité n'est pas la perfection,
👉 ta responsabilité est la clarté et la sincérité.
Tu fais ta part.
Tu avances avec ce que tu comprends.
Le reste n'est pas entre tes mains.
Avant de continuer,
prends un instant pour refaire ton intention.
Non pour effacer ce qui n'a pas été fait,
mais pour repartir avec plus de justesse.
Le chemin se construit
par des pas clairs,
pas par des jugements lourds.`,
      en: `You arrive at the end of this second block.

You have learned to look at yourself without turning away,
but also without crushing yourself under reproach.

This verse teaches a profound rule:
your responsibility is not perfection,
your responsibility is clarity and sincerity.

You do your part.
You move forward with what you understand.
The rest is not in your hands.

Before continuing,
take a moment to renew your intention.
Not to erase what has not been done,
but to start again with more accuracy.

The path is built by clear steps,
not by heavy judgments.`,
      ar: `تصل إلى نهاية هذا المستوى الثاني.

تعلمت أن تنظر إلى نفسك دون أن تدير عينيك،
لكن أيضاً دون أن تسحق نفسك تحت اللوم.

هذه الآية تعلم قاعدة عميقة:
مسؤوليتك ليست الكمال،
مسؤوليتك هي الوضوح والإخلاص.

تقوم بدورك.
تتقدم بما تفهمه.
الباقي ليس بين يديك.

قبل المتابعة،
خذ لحظة لتجديد نيتك.
ليس لمحو ما لم يُفعل،
بل للانطلاق من جديد بمزيد من الدقة.

الطريق يُبنى بخطوات واضحة،
ليس بأحكام ثقيلة.`,
      verse: {
        reference: 'Yā-Sīn 36:17',
        arabic: 'وَمَا عَلَيْنَا إِلَّا الْبَلَاغُ الْمُبِينُ',
        translation: {
          fr: 'Il ne nous incombe que la transmission claire.',
          en: 'It is only incumbent upon us to convey clearly.',
          ar: 'وَمَا عَلَيْنَا إِلَّا الْبَلَاغُ الْمُبِينُ',
        },
      },
    },
    buttonText: {
      entry: {
        fr: '👉 Entrer dans le Bloc 2 avec sincérité',
        en: 'Enter Block 2 with sincerity',
        ar: 'دخول المستوى ٢ بإخلاص',
      },
      exit: {
        fr: '👉 Refaire mon intention et continuer le chemin',
        en: '👉 Renew my intention and continue the path',
        ar: '👉 تجديد نيتي ومواصلة الطريق',
      },
    },
  },

  // ============================================
  // BLOC 3 - An-Nafs al-Mulhimah (L'âme inspirée)
  // ============================================
  {
    id: 3,
    nameAr: 'النفس الملهمة',
    nameFr: 'An-Nafs al-Mulhimah',
    nameEn: 'The Inspired Soul',
    icon: '✨',
    color: '#9370DB',
    entry: {
      fr: `Tu entres maintenant dans le temps de l'âme inspirée.
À ce stade, le cœur commence à ressentir des élans justes.
Des inspirations apparaissent.
L'envie de bien faire se renforce.
Mais toute inspiration n'est pas encore une direction.
L'âme inspirée peut s'élever,
mais elle peut aussi se tromper sans le vouloir,
si elle se fie uniquement à ce qu'elle ressent.
C'est pour cela que ce bloc n'est pas un bloc d'action,
mais un bloc d'orientation.
Pendant ces jours, tu ne vas pas seulement réciter Al-Fātiḥa.
Tu vas apprendre à la vivre.
Al-Fātiḥa est la boussole du croyant.
Elle rappelle que la guidance ne vient pas de l'élan intérieur,
mais d'Allah.
Entre dans ce bloc avec humilité.
Non pour suivre ce que tu ressens,
mais pour demander chaque jour :
« Guide-nous dans le droit chemin. »`,
      en: `You now enter the time of the inspired soul.

At this stage, the heart begins to feel righteous impulses.
Inspirations appear.
The desire to do good grows stronger.

But not every inspiration is yet a direction.
The inspired soul can rise,
but it can also err without meaning to,
if it relies solely on what it feels.

This is why this block invites you to cultivate discernment.
True inspiration is accompanied by peace.
It does not push you, it attracts you.
It does not agitate you, it soothes you.

During these days,
you will learn to distinguish
sincere impulse from passing urge,
inner guidance from subtle illusion.

Enter this block with gentle vigilance.
The path now asks you to listen more finely,
not to blindly follow every movement of the heart,
but to verify its source.

Inspiration becomes light
when it aligns with Revelation
and the wisdom of the people of knowledge.`,
      ar: `تدخل الآن في وقت النفس الملهمة.

في هذه المرحلة، يبدأ القلب بالشعور بنوازع صحيحة.
تظهر إلهامات.
الرغبة في فعل الخير تزداد قوة.

لكن ليس كل إلهام هو بالضرورة اتجاه.
النفس الملهمة يمكن أن ترتفع،
لكنها يمكن أن تخطئ أيضاً دون قصد،
إذا اعتمدت فقط على ما تشعر به.

لهذا السبب يدعوك هذا المستوى لتنمية التمييز.
الإلهام الحقيقي يصاحبه السلام.
لا يدفعك، بل يجذبك.
لا يثيرك، بل يهدئك.

خلال هذه الأيام،
ستتعلم التمييز
بين النزوة الصادقة والرغبة العابرة،
بين التوجيه الداخلي والوهم الخفي.

ادخل هذا المستوى بيقظة لطيفة.
الطريق يطلب منك الآن أن تستمع بدقة أكبر،
ألا تتبع بشكل أعمى كل حركة من القلب،
بل أن تتحقق من مصدرها.

الإلهام يصبح نوراً
عندما يتوافق مع الوحي
وحكمة أهل العلم.`,
    },
    exit: {
      fr: `Tu arrives à la fin de ce bloc.
Tu as vécu Al-Fātiḥa comme une demande,
pas comme une simple récitation.
Tu as appris que l'inspiration,
même sincère,
a besoin d'une direction claire.
Le Coran nous rappelle :
« Je serais alors dans un égarement manifeste. »
Ce verset n'est pas une menace.
C'est un rappel lucide.
Il nous enseigne que sans adoration juste
et sans guidance demandée à Allah,
l'égarement peut devenir évident,
même quand l'intention est bonne.
Si Al-Fātiḥa est la demande de guidance,
ce verset est le rappel de ce qui arrive
quand on s'en passe.
En quittant ce bloc,
garde cette conscience avec toi :
👉 l'inspiration ouvre une porte,
👉 la guidance la maintient droite.
Tu peux maintenant avancer,
avec plus de clarté et plus d'humilité.`,
      en: `You arrive at the end of this third block.

You have learned that inspiration is a gift,
but that it requires accompaniment.
The heart can open to light,
but it must remain humble before what it receives.

This verse reminds us that signs are everywhere,
in the heavens, on earth, within ourselves.
But seeing the signs requires an attentive heart,
a heart that does not rush.

You have cultivated this attention.
You have learned to welcome inspiration
without losing yourself in it.

Before continuing,
take a moment to give thanks.
For this capacity to feel.
For this openness that grows.

The path continues,
and it becomes more luminous
as discernment refines itself.`,
      ar: `تصل إلى نهاية هذا المستوى الثالث.

تعلمت أن الإلهام هدية،
لكنه يتطلب مرافقة.
القلب يمكن أن ينفتح على النور،
لكن يجب أن يبقى متواضعاً أمام ما يتلقاه.

هذه الآية تذكرنا أن الآيات في كل مكان،
في السماوات، على الأرض، في أنفسنا.
لكن رؤية الآيات تتطلب قلباً منتبهاً،
قلباً لا يتسرع.

لقد نميت هذا الانتباه.
تعلمت أن تستقبل الإلهام
دون أن تضيع فيه.

قبل المتابعة،
خذ لحظة للشكر.
على هذه القدرة على الشعور.
على هذا الانفتاح الذي ينمو.

الطريق يستمر،
ويصبح أكثر إشراقاً
مع تنقيح التمييز.`,
      verse: {
        reference: 'Yā-Sīn 36:24',
        arabic: 'إِنِّي إِذًا لَّفِي ضَلَالٍ مُّبِينٍ',
        translation: {
          fr: 'Je serais alors dans un égarement manifeste.',
          en: 'I would then be in manifest error.',
          ar: 'إِنِّي إِذًا لَّفِي ضَلَالٍ مُّبِينٍ',
        },
      },
    },
    buttonText: {
      entry: {
        fr: '👉 Entrer dans le Bloc 3 avec sincérité',
        en: '👉 Enter Block 3 with sincerity',
        ar: '👉 دخول المستوى ٣ بإخلاص',
      },
      exit: {
        fr: '👉 Refaire sont intention et continuer le chemin.',
        en: '👉 Renew my intention and continue the path',
        ar: '👉 تجديد نيتي ومواصلة الطريق',
      },
    },
  },

  // ============================================
  // BLOC 4 - An-Nafs al-Mutma'innah (L'âme apaisée)
  // ============================================
  {
    id: 4,
    nameAr: 'النفس المطمئنة',
    nameFr: 'An-Nafs al-Mutma\'innah',
    nameEn: 'The Tranquil Soul',
    icon: '🌊',
    color: '#00CED1',
    entry: {
      fr: `Tu entres maintenant dans un temps d'apaisement.
Après l'effort et le questionnement,
le cœur commence à se calmer.
Ce degré de l'âme est appelé
l'âme apaisée.
Ce n'est pas une paix parfaite.
C'est une paix relative, fragile parfois,
mais réelle.
Tu peux ressentir plus de stabilité,
moins de lutte intérieure,
plus de clarté dans tes intentions.
Ce bloc n'est pas là pour t'installer dans le confort.
Il est là pour t'apprendre
à goûter la paix sans t'y attacher.
Car la paix intérieure n'est pas une fin,
mais un espace pour agir avec plus de justesse.
Entre dans ce bloc avec gratitude.
Accueille ce qui est là,
sans chercher à le retenir.`,
      en: `You now enter the time of the tranquil soul.

After agitation, calm.
The soul is no longer in constant struggle.
It tastes stability, even in the midst of trials.

This peace is not forced.
It settles.

In this block, you will learn to recognize
this inner tranquility that can exist
even when external circumstances move.

The tranquil soul is not the absence of difficulties.
It is the ability to remain centered
when everything around can be in motion.

Enter this block with gentleness.
Let this peace settle naturally,
without forcing it, without holding it.`,
      ar: `تدخل الآن في وقت النفس المطمئنة.

بعد الاضطراب، الهدوء.
النفس لم تعد في صراع دائم.
تذوق الاستقرار، حتى في وسط المحن.

هذا السلام لا يُفرض.
إنه يستقر.

في هذا المستوى، ستتعلم التعرف على
هذه الهدوء الداخلي الذي يمكن أن يوجد
حتى عندما تكون الظروف الخارجية متحركة.

النفس المطمئنة ليست غياب الصعوبات.
إنها القدرة على البقاء مركزاً
عندما يكون كل شيء حولك في حركة.

ادخل هذا المستوى بلطف.
دع هذا السلام يستقر بشكل طبيعي،
دون إجباره، دون الإمساك به.`,
    },
    exit: {
      fr: `Tu arrives à la fin de ce bloc.
Tu as goûté à un certain apaisement.
Tu as senti que le cœur pouvait se poser,
même brièvement.
Le Coran nous rappelle :
« Et quand on leur dit : "Dépensez de ce qu'Allah vous a accordé",
ceux qui ont mécru disent aux croyants :
"Nourririons-nous celui qu'Allah pourrait nourrir ?"
Vous n'êtes que dans un égarement manifeste. »
Ce verset rappelle une vérité importante :
👉 la paix intérieure ne doit pas devenir une excuse
pour se détourner de la responsabilité.
L'apaisement véritable ne coupe pas du monde.
Il rend plus attentif,
plus juste,
plus conscient des autres.
Avant de continuer le chemin,
prends un instant pour refaire ton intention.
Demande à Allah que la paix reçue
devienne une force pour agir avec droiture,
et non un refuge pour éviter l'effort.
Le chemin continue,
non pas dans la fuite,
mais dans la présence.`,
      en: `You arrive at the end of this fourth block.

You have tasted inner peace.
This stability that can exist
even when winds blow around you.

This verse reminds us that peace
is not the absence of movement,
but the ability to remain anchored
in what does not change.

You have learned to recognize this tranquility.
Not to confuse it with immobility.
Not to lose it in agitation.

Before continuing,
take a moment to anchor this peace.
To let it settle more deeply.

The path continues,
and it becomes more stable
as peace takes root.`,
      ar: `تصل إلى نهاية هذا المستوى الرابع.

لقد ذقت السلام الداخلي.
هذا الاستقرار الذي يمكن أن يوجد
حتى عندما تهب الرياح حولك.

هذه الآية تذكرنا أن السلام
ليس غياب الحركة،
بل القدرة على البقاء راسخاً
في ما لا يتغير.

تعلمت التعرف على هذا الهدوء.
ألا تخلطه مع الجمود.
ألا تفقده في الاضطراب.

قبل المتابعة،
خذ لحظة لترسيخ هذا السلام.
لتدعه يستقر بشكل أعمق.

الطريق يستمر،
ويصبح أكثر استقراراً
مع ترسخ السلام.`,
      verse: {
        reference: 'Yā-Sīn 36:47',
        arabic: 'وَإِذَا قِيلَ لَهُمْ أَنفِقُوا مِمَّا رَزَقَكُمُ اللَّهُ قَالَ الَّذِينَ كَفَرُوا لِلَّذِينَ آمَنُوا أَنُطْعِمُ مَن لَّوْ يَشَاءُ اللَّهُ أَطْعَمَهُ إِنْ أَنتُمْ إِلَّا فِي ضَلَالٍ مُّبِينٍ',
        translation: {
          fr: 'Et quand on leur dit : "Dépensez de ce qu\'Allah vous a accordé", ceux qui ont mécru disent aux croyants : "Nourririons-nous celui qu\'Allah pourrait nourrir ?" Vous n\'êtes que dans un égarement manifeste.',
          en: 'And when it is said to them, "Spend from what Allah has provided for you," those who disbelieve say to those who believe, "Should we feed one whom, if Allah had willed, He would have fed? You are not but in clear error."',
          ar: 'وَإِذَا قِيلَ لَهُمْ أَنفِقُوا مِمَّا رَزَقَكُمُ اللَّهُ قَالَ الَّذِينَ كَفَرُوا لِلَّذِينَ آمَنُوا أَنُطْعِمُ مَن لَّوْ يَشَاءُ اللَّهُ أَطْعَمَهُ إِنْ أَنتُمْ إِلَّا فِي ضَلَالٍ مُّبِينٍ',
        },
      },
    },
    buttonText: {
      entry: {
        fr: '👉 Entrer dans le Bloc 4 avec sincérité',
        en: '👉 Enter Block 4 with sincerity',
        ar: '👉 دخول المستوى ٤ بإخلاص',
      },
      exit: {
        fr: '👉 Refaire mon intention et continuer le chemin',
        en: '👉 Renew my intention and continue the path',
        ar: '👉 تجديد نيتي ومواصلة الطريق',
      },
    },
  },

  // ============================================
  // BLOC 5 - An-Nafs ar-Râḍiyah (L'âme satisfaite)
  // ============================================
  {
    id: 5,
    nameAr: 'النفس الراضية',
    nameFr: 'An-Nafs ar-Râḍiyah',
    nameEn: 'The Satisfied Soul',
    icon: '🌅',
    color: '#FF8C00',
    entry: {
      fr: `Tu entres maintenant dans le temps de l'acceptation consciente.
Après l'apaisement,
l'âme commence à regarder la vie
avec moins de résistance intérieure.
Ce degré de l'âme est appelé
l'âme satisfaite.
Il ne s'agit pas d'aimer toutes les situations,
ni de nier la difficulté.
Il s'agit d'accepter que ce qui arrive
n'est pas hors du regard d'Allah.
Dans ce bloc,
tu apprends à distinguer
l'acceptation de la résignation.
Accepter, ce n'est pas abandonner l'effort.
Accepter, c'est avancer
sans révolte intérieure inutile.
Entre dans ce bloc avec confiance.
Le cœur qui accepte
devient plus disponible pour la sincérité.`,
      en: `You now enter the time of the satisfied soul.

Here, the soul learns to accept.
The decree.
The delay.
The loss.
The unexpected.

This block does not speak of resignation,
but of رضا — inner satisfaction.

Satisfaction is not passive acceptance.
It is the active acceptance of what is,
while continuing to act with sincerity.

In this block, you will learn to distinguish
between what is in your hands
and what is not.

Enter this block with trust.
Let satisfaction settle
without giving up effort.`,
      ar: `تدخل الآن في وقت النفس الراضية.

هنا، تتعلم النفس القبول.
القضاء.
التأخير.
الخسارة.
غير المتوقع.

هذا المستوى لا يتحدث عن الاستسلام،
بل عن الرضا — الرضا الداخلي.

الرضا ليس قبولاً سلبياً.
إنه القبول النشط لما هو موجود،
مع الاستمرار في العمل بإخلاص.

في هذا المستوى، ستتعلم التمييز
بين ما هو بين يديك
وما ليس كذلك.

ادخل هذا المستوى بالثقة.
دع الرضا يستقر
دون التخلي عن الجهد.`,
    },
    exit: {
      fr: `Tu arrives à la fin de ce bloc.
Tu as travaillé l'acceptation,
non comme une faiblesse,
mais comme une lucidité intérieure.
Le Coran nous rappelle :
« Ne vous ai-Je pas engagés, ô enfants d'Adam,
à ne pas adorer Satan ?
Il est pour vous un ennemi déclaré. »
Ce verset rappelle une vérité essentielle :
👉 accepter le décret d'Allah
ne signifie pas baisser la vigilance.
Même dans la satisfaction,
l'âme reste exposée aux pièges,
aux justifications,
aux glissements discrets.
L'acceptation saine
s'accompagne toujours de lucidité.
Avant de continuer,
prends un instant pour refaire ton intention.
Demande à Allah
que ton acceptation reste un acte de foi,
et non un prétexte pour relâcher l'attention.
Le chemin se poursuit,
avec plus de confiance,
et plus de vigilance intérieure.`,
      en: `You arrive at the end of this fifth block.

You have learned to accept.
To distinguish what depends on you
from what does not depend on you.

This verse reminds us that satisfaction
comes from deep acceptance
of what Allah has decreed.

You have cultivated this acceptance.
You have learned to act with sincerity
while accepting the result.

Before continuing,
take a moment to give thanks.
For this capacity to accept.
For this peace that grows.

The path continues,
and it becomes lighter
as satisfaction settles.`,
      ar: `تصل إلى نهاية هذا المستوى الخامس.

تعلمت القبول.
التمييز بين ما يعتمد عليك
وما لا يعتمد عليك.

هذه الآية تذكرنا أن الرضا
يأتي من القبول العميق
لما قضاه الله.

لقد نميت هذا القبول.
تعلمت العمل بإخلاص
مع قبول النتيجة.

قبل المتابعة،
خذ لحظة للشكر.
على هذه القدرة على القبول.
على هذا السلام الذي ينمو.

الطريق يستمر،
ويصبح أخف
مع استقرار الرضا.`,
      verse: {
        reference: 'Yā-Sīn 36:60',
        arabic: 'أَلَمْ أَعْهَدْ إِلَيْكُمْ يَا بَنِي آدَمَ أَن لَّا تَعْبُدُوا الشَّيْطَانَ ۖ إِنَّهُ لَكُمْ عَدُوٌّ مُّبِينٌ',
        translation: {
          fr: 'Ne vous ai-Je pas engagés, ô enfants d\'Adam, à ne pas adorer Satan ? Il est pour vous un ennemi déclaré.',
          en: 'Did I not enjoin upon you, O children of Adam, that you not worship Satan - [for] indeed, he is to you a clear enemy -',
          ar: 'أَلَمْ أَعْهَدْ إِلَيْكُمْ يَا بَنِي آدَمَ أَن لَّا تَعْبُدُوا الشَّيْطَانَ ۖ إِنَّهُ لَكُمْ عَدُوٌّ مُّبِينٌ',
        },
      },
    },
    buttonText: {
      entry: {
        fr: '👉 Entrer dans le Bloc 5 avec sincérité',
        en: '👉 Enter Block 5 with sincerity',
        ar: '👉 دخول المستوى ٥ بإخلاص',
      },
      exit: {
        fr: '👉 Refaire mon intention et continuer le chemin',
        en: '👉 Renew my intention and continue the path',
        ar: '👉 تجديد نيتي ومواصلة الطريق',
      },
    },
  },

  // ============================================
  // BLOC 6 - An-Nafs al-Mardiyyah (L'âme agréée)
  // ============================================
  {
    id: 6,
    nameAr: 'النفس المرضية',
    nameFr: 'An-Nafs al-Mardiyyah',
    nameEn: 'The Well-Pleasing Soul',
    icon: '🌟',
    color: '#9370DB',
    entry: {
      fr: `Tu entres maintenant dans un temps de maturité intérieure.
À ce stade du chemin,
l'effort devient plus discret,
moins démonstratif,
mais plus sincère.
Ce degré de l'âme est appelé
l'âme agréée.
Cela ne signifie pas que tout est accompli.
Cela signifie que l'intention se purifie,
que l'action cherche moins à être vue,
et davantage à être juste.
Dans ce bloc,
tu ne vas pas seulement lire une sourate.
Tu vas vivre la sourate
Yā-Sīn,
pas à pas,
à travers les tâches,
les rappels,
et les silences.
Yā-Sīn n'est pas une récitation rapide.
C'est un rappel puissant
sur la vie,
la responsabilité,
la résurrection
et le retour à Allah.
Pendant ces jours,
chaque verset lu
est une question posée au cœur.
Entre dans ce bloc avec humilité.
Non pour accumuler des lectures,
mais pour laisser le Coran
te replacer face à l'essentiel.`,
      en: `You now enter the time of the well-pleasing soul.

The soul aligns.
What it feels, what it thinks and what it does
begin to walk together.

The ego becomes more discreet.
Sincerity takes its place.

In this block, you will learn to act
without seeking to be seen,
without seeking recognition,
but simply for Allah.

The well-pleasing soul is not the one that is perfect.
It is the one that is sincere.

Enter this block with humility.
Let sincerity guide your actions.`,
      ar: `تدخل الآن في وقت النفس المرضية.

النفس تتوافق.
ما تشعر به، ما تفكر فيه وما تفعله
تبدأ في السير معاً.

الأنا تصبح أكثر خفاءً.
الإخلاص يأخذ مكانه.

في هذا المستوى، ستتعلم العمل
دون البحث عن أن تُرى،
دون البحث عن الاعتراف،
بل ببساطة لله.

النفس المرضية ليست التي هي مثالية.
إنها التي هي صادقة.

ادخل هذا المستوى بالتواضع.
دع الإخلاص يوجه أفعالك.`,
    },
    exit: {
      fr: `Tu arrives à la fin de ce bloc.
Tu as traversé Yā-Sīn
non comme un texte à terminer,
mais comme un rappel à habiter.
Tu as lu jusqu'au seuil,
jusqu'à ce qui éclaire sans distraire.
Le Coran nous rappelle :
« Nous ne lui avons pas enseigné la poésie.
Ce n'est qu'un rappel
et un Coran explicite. »
Ce verset vient poser une limite claire :
👉 le Coran n'est pas une émotion à consommer,
👉 ni un discours à enjoliver.
Il est un rappel
qui recentre,
qui dérange parfois,
et qui éclaire sans détour.
En quittant ce bloc,
tu n'es pas appelé à te sentir élevé,
mais responsable.
Responsable de ce que tu as compris.
Responsable de ce que tu as vu.
Avant de continuer,
prends un instant pour refaire ton intention.
Demande à Allah
que ce rappel reste vivant dans tes actes,
et non enfermé dans une lecture passée.
Le chemin continue,
vers un dernier seuil,
avec plus de gravité
et plus de conscience.`,
      en: `You arrive at the end of this sixth block.

You have learned to act with sincerity.
To no longer seek recognition,
but simply to do what is right.

This verse reminds us that sincere action
is that which is done for Allah,
without expectation of return.

You have cultivated this sincerity.
You have learned to act
without seeking to be seen.

Before continuing,
take a moment to purify your intention.
To act solely for Allah.

The path continues,
and it becomes purer
as sincerity grows.`,
      ar: `تصل إلى نهاية هذا المستوى السادس.

تعلمت العمل بإخلاص.
عدم البحث عن الاعتراف،
بل ببساطة فعل ما هو صحيح.

هذه الآية تذكرنا أن العمل الصادق
هو الذي يُفعل لله،
دون توقع عائد.

لقد نميت هذا الإخلاص.
تعلمت العمل
دون البحث عن أن تُرى.

قبل المتابعة،
خذ لحظة لتنقية نيتك.
للعمل فقط لله.

الطريق يستمر،
ويصبح أنقى
مع نمو الإخلاص.`,
      verse: {
        reference: 'Yā-Sīn 36:69',
        arabic: 'وَمَا عَلَّمْنَاهُ الشِّعْرَ وَمَا يَنبَغِي لَهُ ۚ إِنْ هُوَ إِلَّا ذِكْرٌ وَقُرْآنٌ مُّبِينٌ',
        translation: {
          fr: 'Nous ne lui avons pas enseigné la poésie. Ce n\'est qu\'un rappel et un Coran explicite.',
          en: 'And We did not give him knowledge of poetry, nor is it befitting for him. It is not but a reminder and a clear Qur\'an',
          ar: 'وَمَا عَلَّمْنَاهُ الشِّعْرَ وَمَا يَنبَغِي لَهُ ۚ إِنْ هُوَ إِلَّا ذِكْرٌ وَقُرْآنٌ مُّبِينٌ',
        },
      },
    },
    buttonText: {
      entry: {
        fr: '👉 Entrer dans le Bloc 6 avec sincérité',
        en: '👉 Enter Block 6 with sincerity',
        ar: '👉 دخول المستوى ٦ بإخلاص',
      },
      exit: {
        fr: '👉 Refaire mon intention et continuer le chemin',
        en: '👉 Renew my intention and continue the path',
        ar: '👉 تجديد نيتي ومواصلة الطريق',
      },
    },
  },

  // ============================================
  // BLOC 7 - An-Nafs aṣ-Ṣāfiyah (L'âme purifiée)
  // ============================================
  {
    id: 7,
    nameAr: 'النفس الصافية',
    nameFr: 'An-Nafs aṣ-Ṣāfiyah',
    nameEn: 'The Purified Soul',
    icon: '💎',
    color: '#FFD700',
    entry: {
      fr: `Tu entres maintenant dans le dernier seuil du chemin.
Ce bloc correspond à un état de clarté intérieure.
Non pas une élévation au-dessus des autres,
non pas une perfection atteinte,
mais une disponibilité du cœur.
Ce degré de l'âme est appelé, à titre pédagogique,
l'âme clarifiée.
À ce stade,
il ne s'agit plus de multiplier les efforts,
ni de chercher de nouvelles méthodes.
Il s'agit de laisser agir.
Pendant ces jours,
tu vas lire et méditer
les trois derniers versets de la sourate
Yā-Sīn.
Ces versets parlent de la création,
de la puissance d'Allah,
et du retour inévitable vers Lui.
« Quand Il veut une chose,
Son ordre consiste à dire : "Sois",
et elle est. »
Ce bloc n'est pas un aboutissement spirituel.
C'est un retour à l'essentiel.
Entre dans ce bloc avec silence,
avec respect,
et avec confiance.
Ici, on ne demande plus.
On se tient simplement
devant ce qui est.`,
      en: `You now enter the last gate.

It is no longer about working on yourself,
but about completely surrendering yourself.

This block is a return.
A stripping away.
A conscious abandonment.

The purified soul is not the one that has no more faults.
It is the one that has surrendered itself into the hands of Allah.

In this block, you will learn to let go
of what remains of attachment to yourself,
to completely surrender yourself.

Enter this block with abandonment.
Let yourself be surrendered.`,
      ar: `تدخل الآن في البوابة الأخيرة.

لم يعد الأمر يتعلق بالعمل على نفسك،
بل بإرجاع نفسك بالكامل.

هذا المستوى هو عودة.
تجريد.
تخلي واعٍ.

النفس الصافية ليست التي لا عيوب لها.
إنها التي أرجعت نفسها بين يدي الله.

في هذا المستوى، ستتعلم التخلي
عما تبقى من التعلق بنفسك،
لإرجاع نفسك بالكامل.

ادخل هذا المستوى بالتخلي.
دع نفسك تُرجع.`,
    },
    exit: {
      fr: `Tu arrives au terme de ce chemin.
Tu as médité sur les paroles
qui rappellent l'origine de l'homme,
la puissance de la création,
et le retour vers Allah.
Le Coran nous rappelle :
« L'homme ne voit-il pas
que Nous l'avons créé d'une goutte ?
Et le voilà devenu un adversaire déclaré. »
Ces versets ne ferment pas un cycle.
Ils ouvrent la vie réelle.
Ils rappellent que tout commence par Allah,
que tout dépend d'Allah,
et que tout retourne vers Lui.
À ce stade,
tu n'es pas invité à refaire ton intention.
Tu es invité à la sceller.
Sceller ce que tu as compris.
Sceller ce que tu as accepté.
Sceller ce que tu choisis désormais de vivre.
Kun fa-yakūn
n'est pas une formule.
C'est un rappel :
👉 quand Allah veut, cela est.
👉 et quand cela est,
l'homme est responsable de sa réponse.
Tu quittes maintenant le défi,
non pas transformé en quelqu'un d'autre,
mais plus conscient de ta place.
Le chemin ne s'arrête pas ici.
Il commence
dans ta manière de vivre.`,
      en: `You arrive at the end of this 40-day path.

You have traveled the seven gates of the soul.
You have learned to observe, to correct, to inspire,
to calm, to accept, to act with sincerity,
and finally to surrender yourself.

This verse reminds us that everything returns to Allah.
That everything comes from Him and returns to Him.

You have walked this path.
You have learned to know yourself.
You have learned to surrender yourself.

Now, continue.
Not to finish, but to live.
Not to reach, but to be.

The path does not end here.
It continues in your daily life.
In every gesture, every word, every intention.

May this light accompany you.`,
      ar: `تصل إلى نهاية هذا الطريق الممتد 40 يوماً.

لقد سافرت عبر البوابات السبع للنفس.
تعلمت المراقبة، التصحيح، الإلهام،
التهدئة، القبول، العمل بإخلاص،
وأخيراً إرجاع نفسك.

هذه الآية تذكرنا أن كل شيء يعود إلى الله.
أن كل شيء يأتي منه ويعود إليه.

لقد مشيت هذا الطريق.
تعلمت معرفة نفسك.
تعلمت إرجاع نفسك.

الآن، استمر.
ليس للانتهاء، بل للعيش.
ليس للوصول، بل للوجود.

الطريق لا ينتهي هنا.
إنه يستمر في حياتك اليومية.
في كل حركة، كل كلمة، كل نية.

ليكن هذا النور يرافقك.`,
      verse: {
        reference: 'Yā-Sīn 36:77',
        arabic: 'أَوَلَمْ يَرَ الْإِنسَانُ أَنَّا خَلَقْنَاهُ مِن نُّطْفَةٍ فَإِذَا هُوَ خَصِيمٌ مُّبِينٌ',
        translation: {
          fr: 'L\'homme ne voit-il pas que Nous l\'avons créé d\'une goutte ? Et le voilà devenu un adversaire déclaré.',
          en: 'Does man not see that We created him from a [mere] sperm-drop - then at once he is a clear adversary?',
          ar: 'أَوَلَمْ يَرَ الْإِنسَانُ أَنَّا خَلَقْنَاهُ مِن نُّطْفَةٍ فَإِذَا هُوَ خَصِيمٌ مُّبِينٌ',
        },
      },
    },
    buttonText: {
      entry: {
        fr: '👉 Entrer dans le Bloc 7',
        en: '👉 Enter Block 7',
        ar: '👉 دخول المستوى ٧',
      },
      exit: {
        fr: '👉 Sceller mon intention et revenir à la vie',
        en: '👉 Seal my intention and return to life',
        ar: '👉 ختم نيتي والعودة إلى الحياة',
      },
    },
  },
];

// Fonction utilitaire pour obtenir un bloc par ID
export function getSoulDegreeBlock(blockId: number): SoulDegreeBlock | undefined {
  return soulDegreeBlocks.find(block => block.id === blockId);
}

// Fonction pour obtenir tous les blocs
export function getAllSoulDegreeBlocks(): SoulDegreeBlock[] {
  return soulDegreeBlocks;
}

