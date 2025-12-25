# 📋 Liste des fichiers liés à Bayt An Nur

**Date de création :** 2025-01-27  
**Module :** Bayt An Nur - Mode Khalwa

---

## 📁 Fichiers principaux du module

### 1. Fichier principal
- **`application/src/pages/BaytAnNur/index.tsx`** (1847 lignes)
  - Composant principal refactorisé
  - Gère les 10 écrans de navigation
  - Logique complète de session Khalwa
  - Intégration avec les défis 40 jours

### 2. Ancien fichier (à vérifier si encore utilisé)
- **`application/src/pages/BaytAnNur.tsx`**
  - Ancienne version (peut être obsolète)
  - À vérifier si encore référencé

---

## 🗂️ Structure modulaire (dans `BaytAnNur/`)

### 3. Types TypeScript
- **`application/src/pages/BaytAnNur/types/index.ts`**
  - `Screen` : Type pour les écrans de navigation
  - `KhalwaSession` : Interface de session Khalwa
  - `BaytAnNurRouteParams` : Paramètres de navigation

### 4. Hooks personnalisés
- **`application/src/pages/BaytAnNur/hooks/useAudioAmbiance.ts`**
  - Hook pour charger les fichiers audio d'ambiance
  - Gestion des fichiers locaux et distants

- **`application/src/pages/BaytAnNur/hooks/useBreathingTimer.ts`**
  - Hook pour gérer le timer de respiration
  - Gestion des phases : inhale, hold, exhale
  - Support des types : libre, 4-4, 3-6-9

### 5. Utilitaires
- **`application/src/pages/BaytAnNur/utils/index.ts`**
  - `getGradientColors()` : Conversion de gradients CSS en tableau de couleurs
  - `formatTime()` : Formatage du temps en MM:SS

### 6. Styles
- **`application/src/pages/BaytAnNur/styles/index.ts`**
  - Tous les styles StyleSheet pour le module
  - Styles pour tous les écrans (welcome, intention, session, etc.)

### 7. Dossiers vides (structure préparée)
- **`application/src/pages/BaytAnNur/components/`** (vide)
- **`application/src/pages/BaytAnNur/screens/`** (vide)

---

## 🔧 Services et données

### 8. Service de stockage
- **`application/src/services/khalwaStorage.ts`**
  - Sauvegarde des sessions (local + Supabase)
  - Chargement des sessions
  - Calcul des statistiques
  - Synchronisation offline/online

### 9. Données statiques
- **`application/src/data/khalwaData.ts`**
  - Liste des 20 noms divins
  - Ambiances sonores (5 options)
  - Thèmes visuels par ambiance
  - Mapping intention → nom divin
  - Durées disponibles
  - Types de respiration

---

## 🎨 Composants UI partagés

### 10. Composants spécifiques Khalwa
- **`application/src/components/AmbianceCard.tsx`**
  - Carte d'ambiance sonore
  - Affichage avec icône et description

- **`application/src/components/KhalwaToast.tsx`**
  - Messages de guidage pendant la session
  - Hook `useKhalwaToast` pour la gestion des messages

---

## 📄 Pages liées

### 11. Statistiques
- **`application/src/pages/KhalwaStats.tsx`**
  - Page de statistiques des sessions Khalwa
  - Graphiques et données d'utilisation

### 12. Intégration avec les défis
- **`application/src/pages/Challenge40Days.tsx`**
  - Intègre Bayt An Nur pour les tâches Kalwa
  - Navigation avec paramètres (divineNameId, selectedAmbiance, etc.)

---

## 🧭 Navigation

### 13. Navigation
- **`application/src/navigation/AppNavigator.tsx`**
  - Route `BaytAnNur` définie ligne 253
  - Route `KhalwaStats` définie ligne 289
  - Configuration des écrans lazy-loaded

---

## 🌍 Internationalisation (i18n)

### 14. Traductions
- **`application/src/i18n/locales/fr.json`**
  - Clés `khalwa.*` en français
  - Tous les textes de l'interface

- **`application/src/i18n/locales/en.json`**
  - Clés `khalwa.*` en anglais
  - Traduction complète

- **`application/src/i18n/locales/ar.json`**
  - Clés `khalwa.*` en arabe
  - Traduction complète

---

## 📊 Autres fichiers liés

### 15. Analytics
- **`application/src/services/analyticsStats.ts`**
  - Statistiques d'utilisation du module

- **`application/src/analytics/examples.ts`**
  - Exemples d'analytics pour Khalwa

### 16. Services
- **`application/src/services/syncService.ts`**
  - Synchronisation des données Khalwa

### 17. Pages utilisant Bayt An Nur
- **`application/src/pages/Home.tsx`**
  - Navigation vers Bayt An Nur depuis l'accueil

- **`application/src/pages/Analytics.tsx`**
  - Analytics incluant les données Khalwa

---

## 📚 Documentation

### 18. Documentation
- **`ANALYSE_BAYT_AN_NUR.md`** (à la racine du projet)
  - Analyse complète du module
  - Architecture et structure
  - Flux utilisateur

---

## 📈 Résumé

### Total des fichiers
- **18 fichiers principaux** + **3 fichiers de traduction** = **21 fichiers**

### Répartition
- **1** fichier principal (`index.tsx`)
- **2** hooks personnalisés
- **1** fichier de types
- **1** fichier d'utilitaires
- **1** fichier de styles
- **2** services (stockage + données)
- **2** composants UI
- **2** pages (stats + intégration défis)
- **3** fichiers de traduction
- **Plusieurs** fichiers de navigation et services

### Structure du module
```
BaytAnNur/
├── index.tsx (fichier principal)
├── types/
│   └── index.ts
├── hooks/
│   ├── useAudioAmbiance.ts
│   └── useBreathingTimer.ts
├── utils/
│   └── index.ts
├── styles/
│   └── index.ts
├── components/ (vide)
└── screens/ (vide)
```

---

## ✅ Statut

Le module est **bien structuré et modulaire** avec :
- ✅ Séparation claire des responsabilités
- ✅ Hooks réutilisables
- ✅ Types TypeScript bien définis
- ✅ Styles centralisés
- ✅ Internationalisation complète
- ✅ Intégration avec les autres modules

---

**Dernière mise à jour :** 2025-01-27

