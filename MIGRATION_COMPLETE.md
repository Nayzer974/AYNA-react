# Migration Complète - WebApp vers Application Mobile Native

## ✅ Pages Migrées

### 1. **UmmAyna (Community)** ✅
- **Fichier** : `src/pages/UmmAyna.tsx`
- **Statut** : Complète et fonctionnelle
- **Fonctionnalités** :
  - Posts communautaires avec Realtime Supabase
  - Système de likes
  - Modération admin (bannissement)
  - Vérification de bannissement avant publication
  - Pull-to-refresh
  - Optimisé pour mobile

### 2. **Challenge40Days** 🔄 EN COURS
- **Fichier** : `src/pages/Challenge40Days.tsx` (à créer)
- **Composants nécessaires** :
  - `src/components/challenge/OnboardingScreen.tsx`
  - `src/components/challenge/DayScreen.tsx`
  - `src/components/challenge/PortalScreen.tsx`
  - `src/components/challenge/ReturnScreen.tsx`
  - `src/components/challenge/HistoryScreen.tsx`
  - `src/components/challenge/NiyyaScreen.tsx`
  - `src/components/challenge/ChallengeSelectionScreen.tsx`
  - `src/components/challenge/ActionChecklist.tsx`
  - `src/components/challenge/DhikrCounter.tsx`
  - `src/components/challenge/JournalEntry.tsx`
  - `src/components/challenge/VerseBlock.tsx`
- **Données** : `src/data/challenges.ts` ✅ (copié)

### 3. **AdminBans** ⏳ À FAIRE
- **Fichier** : `src/pages/AdminBans.tsx` (à créer)
- **Fonctionnalités** :
  - Liste des bannissements
  - Débannir des utilisateurs
  - Filtres par type (temporaire/permanent)
  - Accès admin uniquement

### 4. **KhalwaStats** ⏳ À FAIRE
- **Fichier** : `src/pages/KhalwaStats.tsx` (à créer)
- **Fonctionnalités** :
  - Statistiques des sessions Khalwa
  - Graphiques de progression
  - Sessions récentes
  - Noms divins les plus utilisés

## 📋 Prochaines Étapes

1. **Créer Challenge40Days.tsx** avec tous ses composants
2. **Créer AdminBans.tsx**
3. **Créer KhalwaStats.tsx**
4. **Mettre à jour AppNavigator.tsx** pour inclure les nouvelles pages
5. **Tester toutes les pages** sur mobile

## 🔧 Services Nécessaires

- ✅ `src/services/supabase.ts` - Existe
- ⏳ `src/services/challengeStorage.ts` - À créer (pour Challenge40Days)
- ⏳ `src/services/khalwaStorage.ts` - À vérifier/créer (pour KhalwaStats)

## 📝 Notes

- Tous les composants doivent être adaptés pour React Native
- Utiliser `react-native-reanimated` au lieu de `framer-motion`
- Utiliser `lucide-react-native` au lieu de `lucide-react`
- Utiliser `StyleSheet` ou `NativeWind` pour les styles
- Utiliser `@react-navigation` pour la navigation


