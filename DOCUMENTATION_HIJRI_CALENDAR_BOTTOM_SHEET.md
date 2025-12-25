# Documentation - HijriCalendarBottomSheet

## Vue d'ensemble

Le composant `HijriCalendarBottomSheet` est un calendrier Hijri complet et clair, conçu pour être affiché dans un bottom sheet iOS-style. Il garantit l'affichage correct de l'année, du mois et de tous les jours du mois avec une navigation fluide.

## Architecture

### Fichiers

1. **`application/src/components/HijriCalendarBottomSheet.tsx`**
   - Composant principal du calendrier
   - Gestion de l'affichage complet (année, mois, jours)
   - Navigation entre les mois avec animations fluides

2. **`application/src/components/CalendrierBottomSheet.tsx`**
   - Bottom sheet iOS-style qui contient le calendrier
   - Gestion de l'apparition/disparition

3. **`application/src/services/hijriCalendar.ts`**
   - Service de gestion du calendrier Hijri
   - Détection du pays et adaptation

## Structure du calendrier

### En-tête
- **Année Hijri** : Affichée en haut, centrée (ex: 1447)
- **Mois Hijri** : Nom du mois en français ou arabe selon la langue
- **Boutons de navigation** : Flèches gauche/droite pour changer de mois

### Ligne des jours de la semaine
- **7 colonnes** : Dim, Lun, Mar, Mer, Jeu, Ven, Sam (ou équivalents en AR/EN)
- Alignement correct sur 7 colonnes

### Grille du mois
- **Tous les jours du mois** : Garantis d'être affichés
- **Jours vides** : Gérés proprement avant/après le mois
- **Jour actuel** : Mis en évidence avec badge circulaire et gradient
- **Événements religieux** : Indicateur visuel (point)

## Fonctionnalités

### Navigation entre les mois

1. **Boutons de navigation**
   - Flèche gauche : Mois précédent
   - Flèche droite : Mois suivant

2. **Swipe horizontal**
   - Swipe vers la droite : Mois précédent
   - Swipe vers la gauche : Mois suivant
   - Seuil : 25% de la largeur de l'écran ou vélocité > 0.5

### Animations

1. **Animation de changement de mois**
   - Fade out/in lors du changement de mois
   - Transition fluide sans rechargement brutal
   - Durée : 150ms fade out, 200ms fade in

2. **Animation du jour actuel**
   - Gradient de fond animé
   - Badge circulaire avec ombre

## Personnalisation

### Modifier le style

#### Couleurs et thème

Le calendrier utilise automatiquement le thème de l'utilisateur. Pour modifier les couleurs :

```typescript
// Dans HijriCalendarBottomSheet.tsx
const theme = getTheme(user?.theme || 'default');

// Les couleurs utilisées :
// - theme.colors.text : Texte principal
// - theme.colors.textSecondary : Texte secondaire (jours de la semaine)
// - theme.colors.accent : Couleur d'accent (jour actuel, événements, boutons)
// - theme.colors.backgroundSecondary : Fond du calendrier
```

#### Taille des cellules

Modifier dans `styles.dayCell` :

```typescript
dayCell: {
  flex: 1,
  minHeight: 50, // Augmenter la hauteur minimale
  aspectRatio: 1,
  maxWidth: (SCREEN_WIDTH - 32) / 7,
  // ...
}
```

#### Espacement

Modifier dans `styles.weekRow` :

```typescript
weekRow: {
  flexDirection: 'row',
  marginBottom: 12, // Augmenter l'espacement entre les semaines
}
```

#### Typographie

Modifier les styles de texte :

```typescript
yearText: {
  fontSize: 20, // Augmenter la taille de l'année
  fontWeight: '700', // Rendre plus gras
  // ...
}

monthText: {
  fontSize: 28, // Augmenter la taille du mois
  fontWeight: '800', // Rendre plus gras
  // ...
}
```

### Modifier les animations

#### Vitesse de l'animation

Dans les fonctions `goToPreviousMonth` et `goToNextMonth` :

```typescript
// Animation de sortie
opacity.value = withTiming(0, { duration: 200 }, () => { // Augmenter la durée
  runOnJS(changeMonth)(-1);
});

// Animation d'entrée (dans changeMonth)
opacity.value = withTiming(1, { duration: 300 }, { // Augmenter la durée
  // ...
});
```

#### Seuil de swipe

Dans `panResponder.onPanResponderRelease` :

```typescript
const swipeThreshold = SCREEN_WIDTH * 0.3; // 30% au lieu de 25%
const velocityThreshold = 0.7; // Plus élevé = swipe plus rapide requis
```

### Changer la langue

Le calendrier détecte automatiquement la langue via `i18n.language`. Pour forcer une langue :

```typescript
// Dans HijriCalendarBottomSheet.tsx
const getWeekdays = () => {
  // Forcer l'arabe
  return WEEKDAYS_AR;
  
  // Ou forcer le français
  // return WEEKDAYS_FR;
};
```

### Changer la source du calendrier Hijri

Modifier dans `application/src/services/hijriCalendar.ts` :

1. **Ajouter un nouveau pays** :

```typescript
const COUNTRY_TO_METHOD: Record<string, HijriCalendarMethod> = {
  // ... pays existants ...
  'DZ': HijriCalendarMethod.MWL, // Algérie
  'DZA': HijriCalendarMethod.MWL,
};
```

2. **Utiliser une API différente** :

Modifier la fonction `getHijriCalendarForMonth` pour utiliser une autre API :

```typescript
export async function getHijriCalendarForMonth(...) {
  // Votre logique personnalisée ici
  const response = await fetch('https://votre-api.com/hijri-calendar');
  // ...
}
```

## Logique de construction de la grille

La fonction `buildCalendarGrid()` garantit que tous les jours du mois sont affichés :

1. **Calcul du jour de départ** : Utilise la date grégorienne du premier jour pour déterminer le jour de la semaine
2. **Création de la grille** : 6 semaines maximum (42 jours)
3. **Gestion des jours vides** : Avant le début et après la fin du mois
4. **Vérification** : S'assure que tous les jours du mois sont inclus

## Structure des données

### CalendarDay

```typescript
interface CalendarDay {
  hijriDay: number;        // Jour Hijri (1-30)
  hijriMonth: number;      // Mois Hijri (1-12)
  hijriYear: number;       // Année Hijri
  gregorianDay: number;    // Jour grégorien
  gregorianMonth: number;  // Mois grégorien
  gregorianYear: number;   // Année grégorienne
  weekday: string;         // Jour de la semaine (en anglais)
  weekdayAr?: string;      // Jour de la semaine (en arabe)
  isToday: boolean;        // Est-ce aujourd'hui ?
  events?: ReligiousEvent[]; // Événements religieux
}
```

### CalendarMonth

```typescript
interface CalendarMonth {
  hijriMonth: number;      // Mois Hijri (1-12)
  hijriYear: number;       // Année Hijri
  monthName: string;       // Nom du mois (en français/anglais)
  monthNameAr?: string;    // Nom du mois (en arabe)
  days: CalendarDay[];     // Liste des jours du mois (TOUS les jours)
}
```

## Cache des calendriers

Le composant utilise un cache pour éviter de recharger les mois déjà chargés :

```typescript
const calendarsCache = useRef<Map<string, CalendarMonth>>(new Map());
```

Pour vider le cache :

```typescript
calendarsCache.current.clear();
```

## Dépannage

### Le calendrier ne s'affiche pas correctement

1. Vérifier la connexion Internet (requis pour l'API AlAdhan)
2. Vérifier que les données du calendrier sont bien chargées
3. Vérifier les logs de la console pour les erreurs
4. Vérifier que tous les jours du mois sont présents dans `calendar.days`

### Les jours ne sont pas alignés correctement

1. Vérifier que le calcul du `startIndex` est correct (utilise la date grégorienne)
2. Vérifier la logique de `buildCalendarGrid()`
3. S'assurer que tous les jours du mois sont dans `calendar.days`

### Les animations ne fonctionnent pas

1. Vérifier que `react-native-reanimated` est bien installé
2. Vérifier que le Babel plugin est configuré
3. Redémarrer le serveur Metro

### L'année ou le mois ne s'affichent pas

1. Vérifier que `calendar.hijriYear` et `calendar.hijriMonth` sont définis
2. Vérifier que `calendar.monthName` et `calendar.monthNameAr` sont définis
3. Vérifier que la langue est correctement détectée

## Exemples d'utilisation

### Utiliser le calendrier dans une autre page

```typescript
import { HijriCalendarBottomSheet } from '@/components/HijriCalendarBottomSheet';

function MaPage() {
  return (
    <View>
      <HijriCalendarBottomSheet />
    </View>
  );
}
```

### Forcer un mois spécifique

```typescript
// Modifier le useEffect initial pour forcer un mois
useEffect(() => {
  // ...
  const year = 1447; // Forcer l'année
  const month = 6; // Forcer le mois
  // ...
}, []);
```

## Support

Pour toute question ou problème :
- Code source : `application/src/components/HijriCalendarBottomSheet.tsx`
- Service : `application/src/services/hijriCalendar.ts`
- Documentation API AlAdhan : https://aladhan.com/api




