# Documentation - HijriCalendarView

## Vue d'ensemble

Le composant `HijriCalendarView` est un calendrier Hijri classique avec grille de jours, similaire au calendrier iOS. Il affiche un mois complet avec navigation par swipe horizontal et animations fluides.

## Architecture

### Fichiers

1. **`application/src/components/HijriCalendarView.tsx`**
   - Composant principal du calendrier avec grille
   - Gestion des animations de swipe
   - Navigation entre les mois

2. **`application/src/components/CalendrierBottomSheet.tsx`**
   - Bottom sheet iOS-style qui contient le calendrier
   - Apparaît au scroll vers le haut

3. **`application/src/services/hijriCalendar.ts`**
   - Service de gestion du calendrier Hijri
   - Détection du pays et adaptation

## Structure du calendrier

### En-tête
- **Année Hijri** : Affichée en haut (ex: 1447)
- **Mois Hijri** : Nom du mois en français ou arabe selon la langue
- **Boutons de navigation** : Flèches gauche/droite pour changer de mois

### Grille du calendrier
- **7 colonnes** : Jours de la semaine (Dim, Lun, Mar, Mer, Jeu, Ven, Sam)
- **4 à 6 lignes** : Semaines du mois (selon le nombre de jours)
- **Jours vides** : Cellules vides avant le premier jour et après le dernier jour du mois

### Mise en évidence
- **Jour actuel** : Badge circulaire avec gradient de fond
- **Événements religieux** : Point indicateur sur les jours avec événements

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

1. **Animation de swipe**
   - Spring animation avec `damping: 20` et `stiffness: 90`
   - Transition fluide lors du changement de mois
   - Retour élastique si le swipe n'est pas assez fort

2. **Animation du jour actuel**
   - Gradient de fond animé
   - Badge circulaire avec ombre

## Personnalisation

### Modifier le style

#### Couleurs et thème

Le calendrier utilise automatiquement le thème de l'utilisateur. Pour modifier les couleurs :

```typescript
// Dans HijriCalendarView.tsx
const theme = getTheme(user?.theme || 'default');

// Les couleurs utilisées :
// - theme.colors.text : Texte principal
// - theme.colors.textSecondary : Texte secondaire
// - theme.colors.accent : Couleur d'accent (jour actuel, événements)
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
  marginBottom: 8, // Augmenter l'espacement entre les semaines
}
```

### Modifier les animations

#### Vitesse de l'animation

Dans les fonctions `goToPreviousMonth` et `goToNextMonth` :

```typescript
translateX.value = withSpring(SCREEN_WIDTH, {
  damping: 15, // Réduire = plus rapide, Augmenter = plus lent
  stiffness: 100, // Augmenter = plus rapide, Réduire = plus lent
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
// Dans HijriCalendarView.tsx
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

## Intégration dans le bottom sheet

Le calendrier est automatiquement intégré dans le bottom sheet. Pour modifier le comportement :

### Hauteur du bottom sheet

Dans `CalendrierBottomSheet.tsx` :

```typescript
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.8; // 80% au lieu de 75%
```

### Détection du scroll

Dans `CalendrierBottomSheet.tsx`, modifier le seuil pour ouvrir le bottom sheet :

```typescript
if (scrollDelta < -10 && !isOpen.value && currentScrollY < 100) {
  // Ouvrir si scrollY < 100 au lieu de 50
}
```

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
  days: CalendarDay[];     // Liste des jours du mois
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

### Les jours ne sont pas alignés correctement

1. Vérifier que le `weekday` est correctement renseigné dans les données
2. Vérifier la logique de `buildCalendarGrid()`
3. Ajuster le `startIndex` si nécessaire

### Les animations ne fonctionnent pas

1. Vérifier que `react-native-reanimated` est bien installé
2. Vérifier que le Babel plugin est configuré
3. Redémarrer le serveur Metro

## Exemples d'utilisation

### Utiliser le calendrier dans une autre page

```typescript
import { HijriCalendarView } from '@/components/HijriCalendarView';

function MaPage() {
  return (
    <View>
      <HijriCalendarView 
        initialYear={1447}
        initialMonth={6}
      />
    </View>
  );
}
```

### Forcer un mois spécifique

```typescript
const [year, setYear] = useState(1447);
const [month, setMonth] = useState(6);

<HijriCalendarView 
  initialYear={year}
  initialMonth={month}
/>
```

## Support

Pour toute question ou problème :
- Code source : `application/src/components/HijriCalendarView.tsx`
- Service : `application/src/services/hijriCalendar.ts`
- Documentation API AlAdhan : https://aladhan.com/api




