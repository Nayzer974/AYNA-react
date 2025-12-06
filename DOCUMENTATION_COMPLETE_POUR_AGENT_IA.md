# 📋 Documentation Complète - Application AYNA Mobile

**Date:** 2025-01-27  
**Version:** 1.0  
**Type:** Application Mobile React Native (Expo)  
**Base:** Migration depuis Application Web React

---

## 📑 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Problèmes actuels connus](#2-problèmes-actuels-connus)
3. [Pages et fonctionnalités migrées](#3-pages-et-fonctionnalités-migrées)
4. [Pages et fonctionnalités manquantes](#4-pages-et-fonctionnalités-manquantes)
5. [Fonctionnalités complètes de l'application](#5-fonctionnalités-complètes-de-lapplication)
6. [Roadmap et fonctionnalités à venir](#6-roadmap-et-fonctionnalités-à-venir)
7. [Architecture technique](#7-architecture-technique)
8. [Instructions pour continuer le développement](#8-instructions-pour-continuer-le-développement)

---

## 1. Vue d'ensemble

### 1.1 Contexte

**AYNA** est une application spirituelle musulmane qui accompagne les croyants dans leur cheminement intérieur. L'application web existe déjà et fonctionne. Nous sommes en train de migrer toutes les fonctionnalités vers une application mobile native (React Native + Expo).

### 1.2 État actuel

- ✅ **Application Web** : Complète et fonctionnelle
- 🔄 **Application Mobile** : En cours de migration (environ 60% complété)
- 📍 **Localisation** :
  - Web App : `D:\webapp ayna\ayna app\`
  - Mobile App : `D:\ayna_final\application\`

### 1.3 Technologies utilisées

**Mobile :**
- React Native (Expo)
- TypeScript
- Supabase (Backend as a Service)
- React Navigation
- Expo SDK

**Web (référence) :**
- React + Vite
- TypeScript
- Supabase
- Tailwind CSS
- Framer Motion

---

## 2. Problèmes actuels connus

### 2.1 🔴 Problèmes critiques

#### 2.1.1 Backend DairatAnNur (CercleDhikr) - RÉSOLU MAIS À INSTALLER
- **Statut** : ✅ Code corrigé, ⚠️ Scripts SQL à exécuter
- **Description** : Le backend pour les sessions de dhikr a été complètement réinitialisé et recréé
- **Fichiers** :
  - `scripts/reset-dhikr-backend-complete.sql` - Script de réinitialisation
  - `scripts/create-dhikr-backend-mobile.sql` - Nouveau backend propre
  - `src/services/dhikrSessions.ts` - Service client mis à jour
- **Action requise** : Exécuter les deux scripts SQL dans Supabase SQL Editor
- **Documentation** : `scripts/INSTALLATION_BACKEND_DHIKR.md`

#### 2.1.2 Authentification - Utilisateurs connectés sans email vérifié
- **Statut** : ✅ Résolu dans le code
- **Description** : Les utilisateurs connectés (même sans email vérifié) peuvent maintenant créer des sessions de dhikr
- **Solution** : Utilisation de `getSession()` au lieu de `getUser()` et fonctions RPC `SECURITY DEFINER`

### 2.2 🟡 Problèmes moyens

#### 2.2.1 Configuration Quran API
- **Fichier** : `src/services/quran.ts`
- **Problème** : Propriétés `alquranCloudBaseUrl` et `alquranApiBaseUrl` manquantes dans `config.ts`
- **Solution** : Ajouter ces URLs dans `src/config.ts` ou modifier `quran.ts` pour utiliser des endpoints explicites

#### 2.2.2 Expo AV Deprecation
- **Problème** : `expo-av` est déprécié dans le SDK actuel
- **Solution** : Migrer vers `expo-audio` et `expo-video`
- **Statut** : ⚠️ Package `expo-audio` ajouté mais migration non complétée

#### 2.2.3 Background Tasks
- **Problème** : Les tâches en arrière-plan ne fonctionnent pas dans Expo Go
- **Solution** : Créer un dev-client ou build standalone avec EAS
- **Statut** : ⚠️ Configuration partielle dans `app.json`

### 2.3 🟢 Problèmes mineurs

#### 2.3.1 Fonts Loading
- **Fichier** : `src/contexts/ThemeContext.tsx`
- **Problème** : Les fonts Poppins ne bloquent pas le rendu
- **Solution** : Optionnel - Exposer `fontsLoaded` boolean si nécessaire

#### 2.3.2 Error Handling Auth
- **Fichier** : `src/services/auth.ts`
- **Problème** : Distinguer erreurs réseau vs 401
- **Solution** : Améliorer la gestion d'erreurs pour afficher des messages plus clairs

---

## 3. Pages et fonctionnalités migrées

### 3.1 ✅ Pages complètement migrées

#### 3.1.1 Authentification
- ✅ **Login** (`src/pages/Login.tsx`)
  - Connexion email/password
  - OAuth Google (à vérifier)
  - Gestion des erreurs
- ✅ **Signup** (`src/pages/Signup.tsx`)
  - Inscription avec email/password
  - Sélection d'avatar par genre
  - Validation des champs
- ✅ **ForgotPassword** (`src/pages/ForgotPassword.tsx`)
  - Récupération de mot de passe
- ✅ **ResetPassword** (`src/pages/ResetPassword.tsx`)
  - Réinitialisation du mot de passe

#### 3.1.2 Pages principales
- ✅ **Home** (`src/pages/Home.tsx`)
  - Heures de prière
  - Dhikr du jour
  - Navigation rapide
  - Boussole Qibla (à vérifier)
- ✅ **Profile** (`src/pages/Profile.tsx`)
  - Affichage du profil
  - Gestion de la photo de profil (persistante)
  - Sélection d'avatar par genre
  - Suppression de photo
- ✅ **Settings** (`src/pages/Settings.tsx`)
  - Paramètres utilisateur
  - Thèmes
  - Déconnexion

#### 3.1.3 Coran et spiritualité
- ✅ **Quran** (`src/pages/Quran.tsx`)
  - Liste des sourates
- ✅ **QuranReader** (`src/pages/QuranReader.tsx`)
  - Lecteur de sourate avec texte arabe et traduction
- ✅ **AsmaUlHusna** (`src/pages/AsmaUlHusna.tsx`)
  - Les 99 noms d'Allah

#### 3.1.4 Communauté
- ✅ **UmmAyna** (`src/pages/UmmAyna.tsx`)
  - Posts communautaires
  - Likes en temps réel
  - Suppression de posts
  - Modération admin (bannissement)
  - Realtime Supabase

#### 3.1.5 Méditation et Dhikr
- ✅ **BaytAnNur** (`src/pages/BaytAnNur.tsx`)
  - Sessions Khalwa (méditation)
- ✅ **Sabilanur** (`src/pages/Sabilanur.tsx`)
  - (À vérifier le contenu exact)
- ✅ **NurShifa** (`src/pages/NurShifa.tsx`)
  - (À vérifier le contenu exact)
- ✅ **DairatAnNur** (`src/pages/DairatAnNur.tsx`)
  - Cercle de Dhikr (backend à installer)
  - Création de sessions
  - Rejoindre des sessions
  - Compteur de clics
  - Participants en temps réel

#### 3.1.6 Autres
- ✅ **QiblaPage** (`src/pages/QiblaPage.tsx`)
  - Direction de la Qibla
- ✅ **Journal** (`src/pages/Journal.tsx`)
  - Journal spirituel
- ✅ **Analytics** (`src/pages/Analytics.tsx`)
  - Statistiques et graphiques
- ✅ **Chat** (`src/pages/Chat.tsx`)
  - Chat avec l'IA AYNA

### 3.2 ⚠️ Pages partiellement migrées

Aucune page partiellement migrée identifiée pour le moment.

---

## 4. Pages et fonctionnalités manquantes

### 4.1 🔴 Pages critiques à migrer

#### 4.1.1 Challenge40Days
- **Fichier Web** : `D:\webapp ayna\ayna app\src\pages\Challenge40Days.tsx`
- **Statut** : ❌ Non migré
- **Fonctionnalités** :
  - Onboarding screen
  - Day screen (écran du jour actuel)
  - Portal screen (jour 34)
  - Return screen (jours 35-40)
  - History screen (historique)
  - Niyya screen (intention)
  - Gestion des phases (3, 6, 9 jours)
  - Intégration avec journal
  - Sauvegarde de progression
- **Composants nécessaires** :
  - `components/challenge/DayScreen.tsx`
  - `components/challenge/OnboardingScreen.tsx`
  - `components/challenge/PortalScreen.tsx`
  - `components/challenge/ReturnScreen.tsx`
  - `components/challenge/HistoryScreen.tsx`
  - `components/challenge/NiyyaScreen.tsx`
- **Services nécessaires** :
  - `services/challengeStorage.ts`
  - Intégration avec `data/challenges.ts`
- **Navigation** : Stack Navigator pour les différents écrans

#### 4.1.2 AdminBans
- **Fichier Web** : `D:\webapp ayna\ayna app\src\pages\AdminBans.tsx`
- **Statut** : ❌ Non migré
- **Fonctionnalités** :
  - Liste des utilisateurs bannis
  - Bannissement temporaire/permanent
  - Débannissement
  - Historique des bannissements
  - Filtres par type de ban
- **Permissions** : Admin uniquement
- **Services nécessaires** :
  - `services/supabase.ts` (fonction `isCurrentUserAdmin` existe déjà)
  - RPC Supabase pour gérer les bans

#### 4.1.3 KhalwaStats
- **Fichier Web** : `D:\webapp ayna\ayna app\src\pages\KhalwaStats.tsx`
- **Statut** : ❌ Non migré
- **Fonctionnalités** :
  - Statistiques des sessions Khalwa
  - Graphiques de progression
  - Sessions récentes
  - Temps total de méditation
  - Noms divins les plus utilisés
  - Ambiances sonores préférées
- **Services nécessaires** :
  - `services/khalwaStorage.ts` (existe déjà)
  - `getKhalwaStats()`
  - `loadKhalwaSessions()`
- **Données nécessaires** :
  - `data/khalwaData.ts` (divineNames, soundAmbiances)

### 4.2 🟡 Pages secondaires à migrer

#### 4.2.1 Healing
- **Fichier Web** : `D:\webapp ayna\ayna app\src\pages\Healing.tsx`
- **Statut** : ⚠️ Page "Coming soon" dans la webapp
- **Fonctionnalités** : À définir (actuellement juste un placeholder)
- **Priorité** : Basse (fonctionnalité future)

### 4.3 🟢 Fonctionnalités manquantes dans les pages migrées

#### 4.3.1 Home
- ⚠️ Boussole Qibla : À tester avec `expo-location` et `expo-sensors`
- ⚠️ Notifications push pour les heures de prière

#### 4.3.2 Chat (AYNA)
- ⚠️ Synthèse vocale (TTS) : À implémenter avec `expo-speech`
- ⚠️ Reconnaissance vocale (STT) : À implémenter
- ⚠️ Mode hors ligne : Cache des conversations

#### 4.3.3 Journal
- ⚠️ Enregistrement vocal : À implémenter avec `expo-av` ou `expo-audio`
- ⚠️ Analyse IA des entrées : À vérifier l'intégration

#### 4.3.4 Analytics
- ⚠️ Graphiques : Vérifier que `react-native-chart-kit` ou `victory-native` fonctionne correctement
- ⚠️ Export de données : Fonctionnalité à ajouter

---

## 5. Fonctionnalités complètes de l'application

### 5.1 Authentification et utilisateurs

#### 5.1.1 Authentification
- ✅ Connexion email/password
- ✅ Inscription avec sélection d'avatar par genre
- ✅ OAuth Google (à vérifier sur mobile)
- ⚠️ OAuth Apple (iOS) - Non implémenté
- ✅ Récupération de mot de passe
- ✅ Réinitialisation de mot de passe
- ✅ Gestion de session persistante
- ✅ Photo de profil persistante (même après déconnexion)

#### 5.1.2 Profil utilisateur
- ✅ Affichage du profil
- ✅ Modification de la photo de profil
- ✅ Sélection d'avatar prédéfini par genre
- ✅ Suppression de photo de profil
- ✅ Paramètres utilisateur
- ✅ Thèmes personnalisables
- ✅ Déconnexion

### 5.2 Spiritualité et pratique

#### 5.2.1 Coran
- ✅ Liste des 114 sourates
- ✅ Lecteur de sourate avec texte arabe
- ✅ Traduction française
- ✅ Navigation entre sourates
- ✅ Gestion de la Basmala
- ⚠️ Audio du Coran (fonctionnalité future)

#### 5.2.2 Dhikr et invocations
- ✅ Base de données complète des dhikr
- ✅ Dhikr du jour sur la page d'accueil
- ✅ Cercle de Dhikr (DairatAnNur)
  - ✅ Création de sessions communautaires
  - ✅ Rejoindre des sessions
  - ✅ Compteur de clics en temps réel
  - ✅ Participants en temps réel
  - ✅ Objectifs personnalisables (100-999 clics)
  - ⚠️ Backend à installer (scripts SQL fournis)

#### 5.2.3 Les 99 noms d'Allah
- ✅ Liste complète des noms
- ✅ Affichage arabe et translittération
- ✅ Significations
- ✅ Recherche

#### 5.2.4 Méditation (Khalwa)
- ✅ Sessions de méditation guidée
- ✅ Sélection de nom divin
- ✅ Ambiances sonores
- ✅ Durée personnalisable
- ✅ Types de respiration (libre, 4-4, 3-6-9)
- ✅ Mode guidé
- ✅ Enregistrement du ressenti
- ⚠️ Statistiques (page à migrer)

### 5.3 Communauté

#### 5.3.1 UmmAyna (Communauté)
- ✅ Publication de posts
- ✅ Système de likes
- ✅ Affichage en temps réel (Supabase Realtime)
- ✅ Suppression de ses propres posts
- ✅ Modération admin
  - ✅ Bannissement d'utilisateurs
  - ✅ Vérification du statut de ban avant publication
- ⚠️ Page AdminBans (à migrer)

### 5.4 Développement personnel

#### 5.4.1 Journal spirituel
- ✅ Création d'entrées
- ✅ Suivi des émotions
- ✅ Notes personnelles
- ✅ Historique des entrées
- ⚠️ Enregistrement vocal (à implémenter)
- ⚠️ Analyse IA (à vérifier)

#### 5.4.2 Challenge des 40 jours
- ❌ **NON MIGRÉ** - Page complète à migrer
- Fonctionnalités dans la webapp :
  - Onboarding
  - 40 jours de défis
  - Phases (3, 6, 9 jours)
  - Jour spécial "Portal" (jour 34)
  - Retour (jours 35-40)
  - Historique
  - Intention (Niyya)
  - Intégration avec journal

#### 5.4.3 Analytics
- ✅ Statistiques personnelles
- ✅ Graphiques de progression
- ✅ Suivi des activités
- ⚠️ Export de données (à ajouter)

### 5.5 Assistant IA (AYNA)

#### 5.5.1 Chat avec AYNA
- ✅ Interface conversationnelle
- ✅ Réponses contextuelles
- ✅ Guidance spirituelle
- ✅ Intégration avec les données utilisateur
- ⚠️ Synthèse vocale (TTS) - À implémenter
- ⚠️ Reconnaissance vocale (STT) - À implémenter
- ⚠️ Mode hors ligne - À implémenter

### 5.6 Utilitaires

#### 5.6.1 Heures de prière
- ✅ Intégration API Aladhan
- ✅ Affichage des 5 prières (Fajr, Dhuhr, Asr, Maghrib, Isha)
- ✅ Géolocalisation
- ⚠️ Notifications push (à implémenter)

#### 5.6.2 Qibla
- ✅ Calcul de la direction
- ✅ Boussole interactive
- ⚠️ À tester avec `expo-location` et `expo-sensors`

#### 5.6.3 Calendrier Hijri
- ✅ Conversion de dates
- ✅ Affichage des dates islamiques

### 5.7 Administration

#### 5.7.1 Modération
- ✅ Vérification du statut admin
- ✅ Bannissement d'utilisateurs
- ✅ Vérification avant publication
- ⚠️ Page AdminBans (à migrer)
  - Liste des bans
  - Débannissement
  - Historique

---

## 6. Roadmap et fonctionnalités à venir

### 6.1 Phase actuelle (Migration Web → Mobile)

#### 6.1.1 Priorité haute
1. ✅ **Backend DairatAnNur** - Code prêt, scripts SQL à exécuter
2. ❌ **Challenge40Days** - Migration complète nécessaire
3. ❌ **AdminBans** - Migration nécessaire
4. ❌ **KhalwaStats** - Migration nécessaire

#### 6.1.2 Priorité moyenne
1. ⚠️ **OAuth Apple** - Pour iOS
2. ⚠️ **Notifications push** - Heures de prière, rappels
3. ⚠️ **Enregistrement vocal** - Journal, Chat
4. ⚠️ **Synthèse vocale** - Chat AYNA
5. ⚠️ **Mode hors ligne** - Cache des données

### 6.2 Phase 2 (Améliorations)

#### 6.2.1 Fonctionnalités audio/vocale
- Synthèse vocale complète (TTS) pour AYNA
- Reconnaissance vocale (STT) pour le chat
- Audio du Coran
- Rappels vocaux

#### 6.2.2 Notifications
- Notifications push pour heures de prière
- Rappels quotidiens de dhikr
- Notifications communautaires
- Rappels du Challenge 40 jours

#### 6.2.3 Mode hors ligne
- Cache des données critiques
- Synchronisation automatique
- Mode offline pour lecture Coran
- Mode offline pour journal

### 6.3 Phase 3 (Extensions)

#### 6.3.1 Multilingue
- Support arabe
- Support anglais
- Interface multilingue

#### 6.3.2 Analytics avancées
- Export de données utilisateur
- Statistiques détaillées
- Graphiques avancés

#### 6.3.3 Personnalisation
- Thèmes personnalisables par utilisateur
- Personnalisation de l'interface
- Préférences avancées

### 6.4 Phase 4 (Fonctionnalités avancées)

#### 6.4.1 Contenus exclusifs
- Audio du Coran avec récitateurs
- Contenus premium
- Intégration boutique (Shopify)

#### 6.4.2 Communauté élargie
- Groupes privés
- Événements communautaires
- Messagerie privée

#### 6.4.3 Fonctionnalités avancées
- IA améliorée avec contexte émotionnel
- Recommandations personnalisées
- Suivi de santé spirituelle

---

## 7. Architecture technique

### 7.1 Structure des dossiers

```
D:\ayna_final\application\
├── src/
│   ├── components/          # Composants réutilisables
│   ├── contexts/            # Contextes React (User, Theme)
│   ├── data/               # Données statiques (dhikr, challenges, etc.)
│   ├── navigation/         # Configuration navigation
│   ├── pages/              # Pages de l'application
│   ├── services/           # Services (Supabase, API, etc.)
│   ├── theme/              # Thèmes et styles
│   └── utils/              # Utilitaires
├── scripts/                 # Scripts SQL pour Supabase
├── docs/                   # Documentation
└── app.json               # Configuration Expo
```

### 7.2 Technologies principales

#### 7.2.1 Frontend
- **React Native** : Framework mobile
- **Expo** : Outils et SDK
- **TypeScript** : Langage
- **React Navigation** : Navigation
- **Expo Linear Gradient** : Dégradés
- **Lucide React Native** : Icônes

#### 7.2.2 Backend
- **Supabase** : Backend as a Service
  - Authentication
  - Database (PostgreSQL)
  - Storage
  - Realtime
  - RPC Functions
  - Row Level Security (RLS)

#### 7.2.3 Services externes
- **Aladhan API** : Heures de prière
- **AYNA API** : Assistant IA (backend propriétaire)

### 7.3 Configuration

#### 7.3.1 Variables d'environnement
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AYNA_API_URL` (si nécessaire)

#### 7.3.2 Configuration Expo
- `app.json` : Configuration de l'application
- Permissions : Location, Notifications, etc.

### 7.4 Navigation

#### 7.4.1 Structure
- **Bottom Tabs** : Navigation principale (Home, Journal, Analytics, Quran, Profile)
- **Stack Navigator** : Navigation secondaire (Chat, Settings, etc.)

#### 7.4.2 Pages principales (Tabs)
1. Home
2. Journal (authentification requise)
3. Analytics (authentification requise)
4. Quran
5. Profile (authentification requise)

#### 7.4.3 Pages secondaires (Stack)
- Chat (authentification requise)
- QuranReader
- AsmaUlHusna
- QiblaPage
- Settings
- ResetPassword
- BaytAnNur
- Sabilanur (authentification requise)
- UmmAyna
- NurShifa
- DairatAnNur (authentification requise)
- Login
- Signup
- ForgotPassword

---

## 8. Instructions pour continuer le développement

### 8.1 Prochaines étapes prioritaires

#### 8.1.1 Installation du backend DairatAnNur
1. Ouvrir Supabase SQL Editor
2. Exécuter `scripts/reset-dhikr-backend-complete.sql`
3. Exécuter `scripts/create-dhikr-backend-mobile.sql`
4. Vérifier que les fonctions RPC sont créées
5. Tester la création de session dans l'app

#### 8.1.2 Migration Challenge40Days
1. Créer `src/pages/Challenge40Days.tsx`
2. Créer les composants dans `src/components/challenge/` :
   - `DayScreen.tsx`
   - `OnboardingScreen.tsx`
   - `PortalScreen.tsx`
   - `ReturnScreen.tsx`
   - `HistoryScreen.tsx`
   - `NiyyaScreen.tsx`
3. Vérifier/créer `src/services/challengeStorage.ts`
4. Vérifier `src/data/challenges.ts`
5. Adapter le code web (React) vers React Native :
   - Remplacer `motion.div` par `Animated.View`
   - Remplacer `useNavigate` par `useNavigation`
   - Adapter les styles Tailwind vers `StyleSheet`
6. Ajouter la route dans `AppNavigator.tsx`

#### 8.1.3 Migration AdminBans
1. Créer `src/pages/AdminBans.tsx`
2. Adapter le code web vers React Native
3. Vérifier les services Supabase pour les bans
4. Ajouter la route dans `AppNavigator.tsx` (protégée admin)
5. Tester les permissions admin

#### 8.1.4 Migration KhalwaStats
1. Créer `src/pages/KhalwaStats.tsx`
2. Vérifier `src/services/khalwaStorage.ts`
3. Vérifier `src/data/khalwaData.ts`
4. Adapter les graphiques pour React Native
5. Ajouter la route dans `AppNavigator.tsx`

### 8.2 Checklist de migration d'une page

Pour chaque page à migrer :

- [ ] Lire le fichier source dans `D:\webapp ayna\ayna app\src\pages\`
- [ ] Identifier les dépendances (composants, services, données)
- [ ] Créer le fichier dans `D:\ayna_final\application\src\pages\`
- [ ] Adapter les imports :
  - `react-router-dom` → `@react-navigation/native`
  - `framer-motion` → `react-native-reanimated` ou animations natives
  - `lucide-react` → `lucide-react-native`
- [ ] Adapter les composants :
  - `div` → `View`
  - `img` → `Image`
  - `button` → `Pressable`
  - `input` → `TextInput`
  - `textarea` → `TextInput` (multiline)
- [ ] Adapter les styles :
  - Classes Tailwind → `StyleSheet.create`
  - Utiliser les thèmes depuis `getTheme()`
- [ ] Adapter la navigation :
  - `useNavigate()` → `useNavigation()`
  - `navigate('/path')` → `navigation.navigate('ScreenName')`
- [ ] Tester sur mobile (Expo Go ou dev-client)
- [ ] Ajouter la route dans `AppNavigator.tsx`
- [ ] Vérifier les permissions (authentification, admin, etc.)

### 8.3 Points d'attention

#### 8.3.1 Performance
- Utiliser `FlatList` pour les longues listes
- Lazy loading des images
- Debouncing des appels API
- Cache avec AsyncStorage

#### 8.3.2 UX Mobile
- Respecter les Safe Areas (encoche, barre de navigation)
- Feedback haptique pour les actions importantes
- Pull-to-refresh natif
- Gestes natifs (swipe, etc.)

#### 8.3.3 Tests
- Tester sur iOS et Android
- Tester avec et sans connexion
- Tester les permissions (location, notifications, etc.)
- Tester les cas d'erreur

### 8.4 Ressources utiles

#### 8.4.1 Documentation
- React Native : https://reactnative.dev/docs/getting-started
- Expo : https://docs.expo.dev/
- React Navigation : https://reactnavigation.org/
- Supabase : https://supabase.com/docs

#### 8.4.2 Fichiers de référence
- `src/pages/UmmAyna.tsx` : Exemple de migration complète avec Realtime
- `src/pages/CercleDhikr.tsx` : Exemple de page complexe avec plusieurs vues
- `src/services/dhikrSessions.ts` : Exemple de service avec Supabase

### 8.5 Commandes utiles

```bash
# Démarrer l'application
cd D:\ayna_final\application
npx expo start

# Nettoyer le cache
npx expo start -c

# Build pour développement
eas build --profile development --platform ios
eas build --profile development --platform android

# Vérifier les types TypeScript
npx tsc --noEmit
```

---

## 9. Résumé pour l'agent IA

### 9.1 État actuel
- **60% de migration complétée**
- **Backend DairatAnNur** : Code prêt, scripts SQL à exécuter
- **3 pages critiques** à migrer : Challenge40Days, AdminBans, KhalwaStats

### 9.2 Prochaines actions
1. Exécuter les scripts SQL pour DairatAnNur
2. Migrer Challenge40Days (page complexe avec plusieurs écrans)
3. Migrer AdminBans (page admin)
4. Migrer KhalwaStats (statistiques avec graphiques)

### 9.3 Problèmes à résoudre
1. Configuration Quran API (URLs manquantes)
2. Migration expo-av vers expo-audio
3. Background tasks (nécessite dev-client)
4. OAuth Apple pour iOS

### 9.4 Fonctionnalités futures
- Notifications push
- Mode hors ligne
- Audio/vocal (TTS/STT)
- Multilingue
- Contenus premium

---

## 10. Contact et support

### 10.1 Fichiers importants
- **Documentation complète** : Ce fichier
- **Installation backend** : `scripts/INSTALLATION_BACKEND_DHIKR.md`
- **PRD complet** : `requierment.md`
- **Description web app** : `docs/DESCRIPTION_APPLICATION_WEB.md`

### 10.2 Structure des scripts SQL
- `scripts/reset-dhikr-backend-complete.sql` : Réinitialisation
- `scripts/create-dhikr-backend-mobile.sql` : Nouveau backend
- Autres scripts dans `scripts/` pour référence

---

**Fin de la documentation**

*Cette documentation est destinée à un agent IA pour continuer le développement de l'application mobile AYNA. Toutes les informations nécessaires pour comprendre l'état actuel, les problèmes, et les prochaines étapes sont incluses.*

