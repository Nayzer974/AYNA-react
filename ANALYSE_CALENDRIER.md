# Analyse du Calendrier Hijri/Grégorien

## 📋 Résumé de l'implémentation

Votre calendrier affiche **simultanément** :
- ✅ **Calendrier grégorien** (standard) : basé sur `new Date()` de JavaScript
- ✅ **Calendrier Hijri** (musulman) : basé sur l'API AlAdhan officielle

## 🔍 Source des données

### Calendrier Grégorien
- **Source** : JavaScript natif (`new Date()`)
- **Précision** : ✅ 100% fiable (calendrier standard)
- **Affichage** : Jours de 1 à 31 selon le mois

### Calendrier Hijri
- **Source** : API AlAdhan (https://api.aladhan.com/v1)
- **Précision** : ✅ Fiable (API reconnue pour les dates islamiques)
- **Endpoints utilisés** :
  - `/gToH` : Conversion Grégorien → Hijri
  - `/hToG` : Conversion Hijri → Grégorien

## ⚙️ Fonctionnement technique

### 1. Chargement du calendrier

Le système utilise une **stratégie de chargement progressive** :

1. **Jours critiques** (chargés en priorité via API) :
   - 1er jour du mois
   - 15ème jour (milieu du mois)
   - Dernier jour du mois
   - Jour actuel (aujourd'hui)

2. **Autres jours** :
   - Utilisation d'une **conversion approximative** pour affichage immédiat
   - Mise à jour en arrière-plan avec les vraies valeurs de l'API

3. **Cache** :
   - Les dates converties sont mises en cache pour éviter les appels API redondants
   - Cache en mémoire pour la session

### 2. Conversion approximative

En cas d'absence de connexion ou pour les jours non critiques, le système utilise une fonction de conversion approximative basée sur :
- Époque Hijri : 16 juillet 622 (1 Muharram 1 AH)
- Durée moyenne d'une année Hijri : 354.37 jours
- Durée moyenne d'un mois Hijri : 29.5 jours

**Note** : Cette conversion est approximative et peut avoir une marge d'erreur de ±1 jour.

## ✅ Validation du calendrier

### Outil de validation intégré

Un bouton de validation est disponible en mode développement (`__DEV__`) :
- Cliquez sur "🔍 Valider le calendrier" dans le calendrier
- Le système va :
  1. Convertir plusieurs dates du mois en Hijri
  2. Reconvertir ces dates Hijri en Grégorien
  3. Vérifier que les dates correspondent (test bidirectionnel)
  4. Générer un rapport de précision

### Comment utiliser la validation

1. Ouvrez le calendrier dans l'application
2. Le bouton "🔍 Valider le calendrier" apparaît en bas (mode développement uniquement)
3. Cliquez dessus pour lancer la validation
4. Un rapport détaillé s'affiche avec :
   - Précision globale (%)
   - Détails pour chaque date testée
   - Vérification bidirectionnelle (Grég. → Hijri → Grég.)

## 📊 Points à vérifier

### 1. Correspondance des dates
- ✅ Chaque jour grégorien doit avoir une date Hijri correspondante
- ✅ Les dates importantes (Ramadan, Aïd) doivent être correctes

### 2. Cohérence bidirectionnelle
- ✅ Conversion Grégorien → Hijri → Grégorien doit revenir à la date d'origine
- ✅ Conversion Hijri → Grégorien → Hijri doit revenir à la date d'origine

### 3. Jours de la semaine
- ✅ Le jour de la semaine doit correspondre pour les deux calendriers
- ✅ L'ordre des jours : Lun, Mar, Mer, Jeu, Ven, Sam, Dim

## 🔧 Ajustements possibles

### Ajustement de date Hijri

Si les dates Hijri affichées ne correspondent pas à celles observées dans votre pays, vous pouvez ajuster :

```typescript
import { setDateAdjustment } from '@/services/hijriConverter';

// Ajuster de -1 jour
setDateAdjustment(-1);

// Ajuster de +1 jour
setDateAdjustment(+1);

// Pas d'ajustement (par défaut)
setDateAdjustment(0);
```

## 📝 Limitations connues

1. **Conversion approximative** :
   - Les jours non critiques utilisent une conversion approximative
   - Mise à jour progressive en arrière-plan avec les vraies valeurs

2. **Dépendance Internet** :
   - Les conversions précises nécessitent une connexion Internet
   - En mode hors ligne, seules les conversions approximatives sont disponibles

3. **Rate limiting API** :
   - L'API AlAdhan a des limites de requêtes
   - Le système utilise un système de retry avec backoff exponentiel
   - Cache pour réduire les appels API

## 🎯 Conclusion

Votre calendrier est **fiable** car :
- ✅ Utilise l'API AlAdhan officielle pour les conversions Hijri
- ✅ Calendrier grégorien basé sur JavaScript natif (standard)
- ✅ Système de validation intégré pour vérifier la précision
- ✅ Chargement progressif pour optimiser les performances
- ✅ Cache pour réduire les appels API

**Recommandation** : Utilisez le bouton de validation en mode développement pour vérifier la précision des dates pour votre mois actuel.


