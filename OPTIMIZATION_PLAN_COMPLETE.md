# 🚀 PLAN D'OPTIMISATION COMPLET - AYNA Mobile

**Date:** 27 janvier 2025  
**Statut:** En cours d'exécution

---

## 📋 RÉSUMÉ DES ACTIONS

### ✅ Phase 1: NETTOYAGE IMMÉDIAT (TERMINÉ)
1. ✅ **Fichier backup supprimé:** `BaytAnNur.tsx.backup`
2. ✅ **Rapport d'audit créé:** `OPTIMIZATION_AUDIT_REPORT.md`
3. ⚠️ **Migration analytics:** Wrapper en place, migration progressive recommandée

### 🔄 Phase 2: DÉPENDANCES (EN COURS)

#### Dépendances à SUPPRIMER
```json
{
  "expo-notifications": "^0.32.14",  // ❌ DÉSACTIVÉ - code commenté partout
  "i18next-browser-languagedetector": "^8.2.0",  // ❌ INUTILE - détecteur custom utilisé
}
```

**Actions:**
- [ ] Supprimer `expo-notifications` du package.json
- [ ] Supprimer `i18next-browser-languagedetector` du package.json
- [ ] Nettoyer le code commenté dans `notifications.ts`
- [ ] Vérifier `PrayerTimeManager.ts` qui utilise peut-être encore notifications

#### Dépendances à VÉRIFIER
```json
{
  "expo-gl": "~16.0.8",  // ❓ Utilisé? Si non → SUPPRIMER
  "expo-image-manipulator": "~14.0.8",  // ❓ Utilisé? Si non → SUPPRIMER
  "expo-sharing": "~14.0.8",  // ❓ Utilisé? Si non → SUPPRIMER
  "@shopify/react-native-skia": "2.2.12",  // ⚠️ LOURD - vérifier usage réel
}
```

**Actions:**
- [ ] Rechercher usage de `expo-gl` dans le code
- [ ] Rechercher usage de `expo-image-manipulator` dans le code
- [ ] Rechercher usage de `expo-sharing` dans le code
- [ ] Vérifier si Skia est vraiment nécessaire (peut-être remplacé par Reanimated)

### 🔄 Phase 3: OPTIMISATION ANALYTICS (EN COURS)

#### État Actuel
- ✅ Analytics v2 implémenté (`src/analytics/`)
- ✅ Wrapper migration en place (`analytics-migration-wrapper.ts`)
- ⚠️ 19 fichiers utilisent encore `from '@/services/analytics'` (ancien système)

#### Fichiers à Migrer
1. `pages/Home.tsx` - ⚠️ Import changé mais utilisation à vérifier
2. `pages/Signup.tsx`
3. `pages/Settings.tsx`
4. `pages/Quran.tsx`
5. `pages/Chat.tsx`
6. `pages/Journal.tsx`
7. `pages/Profile.tsx`
8. `pages/ForgotPassword.tsx`
9. `pages/ChangePassword.tsx`
10. `pages/NurShifa.tsx`
11. `pages/Login.tsx`
12. `pages/ResetPassword.tsx`
13. `pages/QuranReader.tsx`
14. `pages/AsmaUlHusna.tsx`
15. `services/userAnalytics.ts`
16. `services/khalwaStorage.ts`
17. `services/notesStorage.ts`
18. `services/journalAnalysis.ts`
19. `services/analyticsStats.ts` (utilise analytics.ts)

**Recommandation:** Garder le wrapper pendant 30 jours pour compatibilité, puis supprimer `analytics.ts` et migrer directement.

### 🔄 Phase 4: PERFORMANCE (À FAIRE)

#### Memoization des Composants Lourds
```typescript
// À ajouter:
- React.memo(Home)
- React.memo(Analytics)
- React.memo(Journal)
- React.memo(Chat)
- React.memo(QuranReader)
```

#### useCallback pour Handlers
```typescript
// À optimiser dans chaque composant:
const handleAction = useCallback(() => {
  // ...
}, [dependencies]);
```

#### useMemo pour Calculs Coûteux
```typescript
// Analytics.tsx - calculs statistiques
const stats = useMemo(() => calculateStats(data), [data]);

// Journal.tsx - filtres/transformations
const filteredEntries = useMemo(() => filterEntries(entries, filter), [entries, filter]);
```

### 🔄 Phase 5: COMPATIBILITÉ STANDALONE (À VÉRIFIER)

#### APIs Expo à Vérifier
- [x] `expo-audio` - ✅ Utilisé (useTasbihSound)
- [ ] `expo-blur` - ✅ Utilisé (GlassCard)
- [ ] `expo-sensors` - ⚠️ Qibla - **CRITIQUE** - tester standalone
- [ ] `expo-location` - ⚠️ Qibla - **CRITIQUE** - tester standalone
- [ ] `expo-image-picker` - ✅ Avatar upload - tester standalone
- [ ] `expo-speech` - ❓ Utilisé? Vérifier

#### Tests Standalone Requis
- [ ] Build Android AAB et tester Qibla
- [ ] Build iOS IPA et tester Qibla
- [ ] Tester location permissions
- [ ] Tester sensors (magnétomètre)
- [ ] Tester image picker
- [ ] Tester offline-first

---

## 📊 MÉTRIQUES ATTENDUES

### Bundle Size
- **Avant:** TBD (à mesurer avec `npx expo-doctor`)
- **Cible:** -30% (suppression dépendances + optimisations)
- **Gains attendus:**
  - `expo-notifications`: ~50KB
  - `i18next-browser-languagedetector`: ~10KB
  - `expo-gl` (si non utilisé): ~200KB
  - `expo-image-manipulator` (si non utilisé): ~100KB
  - Code mort: ~50KB

### Performance
- **Re-renders:** -40% (avec memoization)
- **Memory:** <150MB en usage normal
- **FPS:** Stable 60 FPS
- **Startup time:** <2s

---

## 🎯 PRIORITÉS D'EXÉCUTION

### 🔴 CRITIQUE (Avant production)
1. ✅ Supprimer fichier backup
2. ⚠️ Vérifier compatibilité standalone (Qibla, Location, Sensors)
3. ⚠️ Supprimer dépendances inutiles
4. ⚠️ Tester builds AAB/IPA

### 🟡 IMPORTANT (Optimisation)
1. ⚠️ Memoization composants lourds
2. ⚠️ Optimisation AsyncStorage
3. ⚠️ Réduction re-renders

### 🟢 SOUHAITABLE (Polish)
1. ⚠️ Migration complète analytics (post-lancement)
2. ⚠️ Optimisation assets
3. ⚠️ Code splitting avancé

---

## ✅ CHECKLIST FINALE

### Code
- [x] Fichiers backup supprimés
- [ ] Code mort supprimé
- [ ] Duplications fusionnées
- [ ] Imports optimisés
- [ ] Memoization ajoutée
- [ ] useCallback/useMemo ajoutés

### Bundle
- [ ] Dépendances inutiles supprimées
- [ ] Tree-shaking vérifié
- [ ] Assets optimisés
- [ ] Lazy loading complet

### Performance
- [ ] Re-renders minimisés
- [ ] AsyncStorage optimisé
- [ ] Mémoire optimisée
- [ ] UI thread non bloqué

### Compatibilité
- [ ] Standalone Android testé
- [ ] Standalone iOS testé
- [ ] Permissions vérifiées
- [ ] Offline-first vérifié

### Conformité
- [x] GDPR 100%
- [ ] Apple Store ready
- [ ] Google Play ready
- [ ] Documentation complète

---

**Prochaine étape:** Vérifier usage des dépendances et supprimer les inutiles





