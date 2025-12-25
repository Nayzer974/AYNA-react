# Documentation - Calendrier Musulman

## Vue d'ensemble

Le composant `CalendrierMusulman` affiche un calendrier Hijri officiel adapté automatiquement au pays de l'utilisateur. Il utilise des calendriers officiels reconnus par les autorités religieuses.

## Architecture

### Fichiers créés

1. **`application/src/services/hijriCalendar.ts`**
   - Service de détection du pays
   - Adaptation du calendrier selon le pays
   - Gestion des événements religieux

2. **`application/src/components/CalendrierMusulman.tsx`**
   - Composant React Native réutilisable
   - Section scrollable verticalement
   - Affichage du calendrier et des événements

3. **`application/src/pages/Home.tsx`** (modifié)
   - Intégration du composant sur la page d'accueil

## Fonctionnalités

### Détection automatique du pays

Le système détecte automatiquement le pays de l'utilisateur via :
1. **Géolocalisation** (si permission accordée)
   - Utilise les coordonnées GPS
   - Fait un géocodage inverse via OpenStreetMap ou BigDataCloud
2. **Locale de l'appareil** (fallback)
   - Extrait le code pays depuis la locale système
   - Exemple : `fr-FR` → `FR`

### Calendriers officiels supportés

| Pays | Code ISO | Calendrier officiel | Méthode |
|------|----------|---------------------|---------|
| Arabie Saoudite | SA, SAU | Umm al-Qura | 1 |
| Égypte | EG, EGY | Calendrier égyptien | 5 |
| Pakistan | PK, PAK | Karachi | 4 |
| Iran | IR, IRN | Téhéran | 7 |
| Europe (FR, GB, DE, etc.) | Voir liste | Muslim World League | 3 |
| Amérique du Nord (US, CA) | US, USA, CA, CAN | ISNA | 2 |
| Autres | - | ISNA (par défaut) | 2 |

### Événements religieux majeurs

Le calendrier affiche automatiquement :
- **Ramadan** (9/1) - Mois de jeûne
- **Laylat al-Qadr** (9/27) - Nuit du Destin
- **Aïd al-Fitr** (10/1) - Fête de la rupture du jeûne
- **Aïd al-Adha** (12/10) - Fête du sacrifice
- **Mawlid an-Nabi** (3/12) - Naissance du Prophète
- **Isra et Miraj** (7/27) - Voyage nocturne
- **Ashura** (1/10) - Jour de Ashura

## Comment modifier la source officielle

### 1. Ajouter un nouveau pays

Pour ajouter un nouveau pays avec son calendrier officiel, modifiez le fichier `application/src/services/hijriCalendar.ts` :

```typescript
const COUNTRY_TO_METHOD: Record<string, HijriCalendarMethod> = {
  // ... pays existants ...
  
  // Nouveau pays
  'DZ': HijriCalendarMethod.MWL,  // Algérie
  'DZA': HijriCalendarMethod.MWL,
  
  'MA': HijriCalendarMethod.MWL,  // Maroc
  'MAR': HijriCalendarMethod.MWL,
  
  // etc.
};
```

### 2. Changer la méthode de calcul pour un pays

Modifiez la valeur dans `COUNTRY_TO_METHOD` :

```typescript
// Exemple : Changer la France pour utiliser Umm al-Qura
'FR': HijriCalendarMethod.UMM_AL_QURA,  // Au lieu de MWL
```

### 3. Ajouter un événement religieux

Modifiez le tableau `MAJOR_RELIGIOUS_EVENTS` dans `hijriCalendar.ts` :

```typescript
export const MAJOR_RELIGIOUS_EVENTS: ReligiousEvent[] = [
  // ... événements existants ...
  
  {
    name: 'Nouvel An Hijri',
    nameAr: 'رأس السنة الهجرية',
    hijriMonth: 1,
    hijriDay: 1,
    description: 'Premier jour de l\'année Hijri',
  },
];
```

### 4. Utiliser une API différente

Si vous souhaitez utiliser une autre API que AlAdhan, modifiez les fonctions dans `hijriCalendar.ts` :

```typescript
// Exemple : Utiliser une API personnalisée
export async function getTodayHijriDate(countryCode?: string | null): Promise<HijriDate | null> {
  try {
    // Votre logique personnalisée ici
    const response = await fetch('https://votre-api.com/hijri-date');
    const data = await response.json();
    // Transformer les données au format HijriDate
    return transformToHijriDate(data);
  } catch (error) {
    // Fallback vers AlAdhan
    return await gregorianToHijri(/* ... */);
  }
}
```

### 5. Modifier l'ajustement de date

Pour certains pays, la date Hijri peut nécessiter un ajustement de ±1 jour. Utilisez la fonction dans `hijriConverter.ts` :

```typescript
import { setDateAdjustment } from '@/services/hijriConverter';

// Ajuster de +1 jour
setDateAdjustment(1);

// Ajuster de -1 jour
setDateAdjustment(-1);

// Réinitialiser
setDateAdjustment(0);
```

## Stratégie de fallback

Si aucune source officielle n'existe pour un pays donné, le système utilise :

1. **ISNA (Islamic Society of North America)** - Méthode par défaut
2. **API AlAdhan** - Source de données principale
3. **Locale de l'appareil** - Si la géolocalisation échoue

## Personnalisation du composant

### Modifier le style

Le composant utilise le thème de l'utilisateur. Pour modifier les styles, éditez `CalendrierMusulman.tsx` :

```typescript
const styles = StyleSheet.create({
  container: {
    // Vos styles personnalisés
    borderRadius: 16,  // Au lieu de 12
    padding: 20,        // Au lieu de 16
  },
  // ...
});
```

### Modifier la hauteur maximale

Pour changer la hauteur maximale du calendrier (actuellement 500px) :

```typescript
container: {
  // ...
  maxHeight: 600,  // Augmenter la hauteur
},
```

### Ajouter des traductions

Ajoutez les clés de traduction dans vos fichiers i18n :

```json
{
  "calendar": {
    "title": "Calendrier Hijri",
    "loading": "Chargement du calendrier...",
    "events": "Événements religieux"
  }
}
```

## Intégration dans d'autres pages

Pour utiliser le calendrier dans une autre page :

```typescript
import { CalendrierMusulman } from '@/components/CalendrierMusulman';

function MaPage() {
  return (
    <View>
      <CalendrierMusulman />
    </View>
  );
}
```

## Dépannage

### Le calendrier ne s'affiche pas

1. Vérifiez la connexion Internet (requis pour l'API AlAdhan)
2. Vérifiez les permissions de localisation
3. Consultez les logs de la console pour les erreurs

### La date Hijri est incorrecte

1. Vérifiez que le pays est correctement détecté
2. Vérifiez la méthode de calcul utilisée dans `COUNTRY_TO_METHOD`
3. Utilisez `setDateAdjustment()` si nécessaire

### Les événements religieux ne s'affichent pas

1. Vérifiez que les dates dans `MAJOR_RELIGIOUS_EVENTS` sont correctes
2. Vérifiez que le mois Hijri correspond

## API utilisée

- **AlAdhan API** : https://api.aladhan.com/v1
  - Endpoint principal pour les conversions de dates
  - Supporte plusieurs méthodes de calcul
  - Gratuite et sans clé API requise

## Notes importantes

1. **Connexion Internet requise** : Le calendrier nécessite une connexion Internet pour fonctionner
2. **Permissions** : La géolocalisation améliore la précision mais n'est pas obligatoire
3. **Performance** : Les données sont chargées une fois au montage du composant
4. **Scroll** : Le calendrier est scrollable uniquement à l'intérieur de sa section

## Support

Pour toute question ou problème, consultez :
- Documentation AlAdhan : https://aladhan.com/api
- Code source : `application/src/services/hijriCalendar.ts`
- Composant : `application/src/components/CalendrierMusulman.tsx`




