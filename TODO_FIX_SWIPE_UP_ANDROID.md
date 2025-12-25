# TODO - Fix Swipe Up Android - Calendrier Bottom Sheet

## 🔍 Analyse du problème

### Système actuel identifié
- ✅ **Gesture utilisé** : `PanResponder` natif (React Native)
- ✅ **Détection swipe up** : Via `scrollY` du `ScrollView` avec `setInterval`
- ✅ **Ouverture** : Basée sur `scrollDelta < -5` et `currentScrollY < 100`
- ❌ **Problème Android** : Le `ScrollView` capture les touches et bloque la détection

### Problèmes identifiés

1. **Détection indirecte** : Le swipe up est détecté via le scroll, pas directement via gesture
2. **Conflit ScrollView** : Sur Android, le `ScrollView` peut bloquer les gestures custom
3. **Pas de GestureHandlerRootView** : `react-native-gesture-handler` est installé mais pas utilisé pour le bottom sheet
4. **Interval polling** : Utilisation de `setInterval` au lieu d'événements directs

---

## ✅ TODO LIST TECHNIQUE

### Phase 1 : Vérifications préalables

#### 1.1 Vérifier react-native-gesture-handler
- [ ] Confirmer que `react-native-gesture-handler` est bien importé en premier dans `index.ts` ✅ (déjà fait)
- [ ] Vérifier que `GestureHandlerRootView` enveloppe l'app au root
- [ ] Tester si un wrapper au niveau `App.tsx` est nécessaire

#### 1.2 Analyser les conflits ScrollView
- [ ] Vérifier si le `ScrollView` de `Home.tsx` bloque les gestures
- [ ] Tester avec `nestedScrollEnabled={true}` (déjà présent)
- [ ] Tester avec `scrollEnabled={false}` temporairement pour isoler le problème

#### 1.3 Vérifier les overlays/z-index
- [ ] Confirmer que le bottom sheet n'a pas de `pointerEvents` qui bloque
- [ ] Vérifier que l'overlay ne capture pas les touches quand fermé
- [ ] Tester avec `pointerEvents="box-none"` sur les parents

---

### Phase 2 : Implémentation avec react-native-gesture-handler

#### 2.1 Ajouter GestureHandlerRootView
- [ ] Envelopper l'app dans `GestureHandlerRootView` au niveau root
- [ ] Vérifier qu'il n'y a qu'un seul wrapper (pas de duplication)

#### 2.2 Remplacer la détection par scroll par un GestureDetector
- [ ] Créer un `GestureDetector` pour détecter le swipe up
- [ ] Utiliser `Gesture.Pan()` avec `activeOffsetY` pour Android
- [ ] Configurer les seuils Android spécifiques :
  ```typescript
  activeOffsetY: [-20, 20]  // Détecter dès 20px de mouvement
  failOffsetX: [-50, 50]    // Ignorer si mouvement horizontal > 50px
  ```

#### 2.3 Implémenter la détection directe du swipe up
- [ ] Détecter le swipe up directement sur le `ScrollView` ou un wrapper invisible
- [ ] Utiliser `onGestureEvent` pour suivre le mouvement
- [ ] Utiliser `onEnd` pour déclencher l'ouverture du bottom sheet

---

### Phase 3 : Optimisations Android spécifiques

#### 3.1 Ajuster les seuils Android
- [ ] `minDist` : Distance minimale pour déclencher (Android: 15px, iOS: 10px)
- [ ] `activeOffsetY` : Seuil de détection vertical (Android: [-15, 15])
- [ ] `failOffsetX` : Seuil pour ignorer les mouvements horizontaux (Android: [-30, 30])

#### 3.2 Gérer la priorité des gestures
- [ ] Configurer `simultaneousHandlers` si nécessaire
- [ ] Utiliser `waitFor` pour éviter les conflits avec le ScrollView
- [ ] Tester avec `enabled` conditionnel selon la position du scroll

#### 3.3 Zone de détection
- [ ] Limiter la zone de détection au bas de l'écran (derniers 100px)
- [ ] Ajouter un indicateur visuel (handle) pour guider l'utilisateur
- [ ] Tester avec `hitSlop` pour agrandir la zone de touch

---

### Phase 4 : Tests et validation

#### 4.1 Tests sur écran minimal
- [ ] Créer un écran de test avec uniquement le swipe up
- [ ] Vérifier si le gesture fonctionne isolément
- [ ] Identifier si le problème est global ou local au composant

#### 4.2 Logs de debug
- [ ] Ajouter des logs dans `onGestureEvent`
- [ ] Ajouter des logs dans `onHandlerStateChange`
- [ ] Vérifier si Android reçoit les événements (même si non traités)

#### 4.3 Tests cross-platform
- [ ] Tester sur Android (tous les appareils disponibles)
- [ ] Vérifier qu'iOS fonctionne toujours (pas de régression)
- [ ] Tester avec différents types de swipe (rapide, lent, court, long)

---

### Phase 5 : Solution alternative (si nécessaire)

#### 5.1 Bouton fantôme
- [ ] Ajouter un bouton invisible en bas de l'écran
- [ ] Détecter le tap pour ouvrir le bottom sheet
- [ ] Style : `opacity: 0.01` ou `pointerEvents: 'auto'` avec zone transparente

#### 5.2 Handle draggable
- [ ] Ajouter une barre visible en bas de l'écran
- [ ] Permettre de glisser cette barre vers le haut
- [ ] Style : Barre fine avec indicateur visuel

#### 5.3 Bottom sheet avec snap points
- [ ] Utiliser `@gorhom/bottom-sheet` (si compatible Expo)
- [ ] Alternative : Implémenter des snap points custom

---

## 🛠️ IMPLÉMENTATION RECOMMANDÉE

### Solution 1 : GestureDetector avec react-native-gesture-handler (RECOMMANDÉ)

```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Dans App.tsx ou root component
<GestureHandlerRootView style={{ flex: 1 }}>
  {/* App content */}
</GestureHandlerRootView>

// Dans CalendrierBottomSheet.tsx
const panGesture = Gesture.Pan()
  .activeOffsetY([-20, 20])  // Détecter mouvement vertical
  .failOffsetX([-50, 50])     // Ignorer si horizontal
  .onStart(() => {
    // Log pour debug
    console.log('[SwipeUp] Gesture started');
  })
  .onUpdate((event) => {
    // Suivre le mouvement
    if (event.translationY < 0 && !isOpen.value) {
      // Swipe vers le haut détecté
      translateY.value = MIN_TRANSLATE_Y;
      isOpen.value = true;
    }
  })
  .onEnd(() => {
    // Finaliser l'animation
  });
```

### Solution 2 : Détection directe sur ScrollView (ALTERNATIVE)

```typescript
// Dans Home.tsx, ajouter un wrapper avec gesture handler
<GestureDetector gesture={swipeUpGesture}>
  <ScrollView
    onScroll={handleScroll}
    scrollEventThrottle={16}
    nestedScrollEnabled={true}
    // ... autres props
  >
    {/* Content */}
  </ScrollView>
</GestureDetector>
```

---

## 📋 CHECKLIST FINALE

- [ ] GestureHandlerRootView ajouté au root
- [ ] GestureDetector implémenté pour swipe up
- [ ] Seuils Android configurés correctement
- [ ] Conflits ScrollView résolus
- [ ] Logs de debug ajoutés
- [ ] Tests Android réussis
- [ ] Tests iOS validés (pas de régression)
- [ ] Code nettoyé et commenté

---

## 🚨 POINTS D'ATTENTION

1. **Expo compatibility** : Vérifier que `react-native-gesture-handler` fonctionne avec Expo
2. **Performance** : Éviter les re-renders inutiles avec `useCallback` et `useMemo`
3. **Accessibility** : Maintenir l'accessibilité pour les utilisateurs avec handicaps
4. **UX** : Garder l'expérience identique à iOS (animations fluides)

---

## 📝 NOTES

- Le problème est probablement dû au fait que le `ScrollView` capture les touches avant que le gesture handler ne puisse les traiter
- Sur Android, les gestures nécessitent souvent des seuils plus permissifs
- `react-native-gesture-handler` est plus fiable que `PanResponder` pour les gestures complexes sur Android


