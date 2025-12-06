# 🚀 Guide d'Installation Complète - Application AYNA Mobile

**Date:** 2025-01-27

## 📋 Étape 1: Créer les Tables Supabase

### 1.1 Exécuter le Script SQL Principal

1. Ouvrez Supabase Dashboard → SQL Editor
2. Exécutez le script: `scripts/create-all-tables-complete.sql`

Ce script crée:
- ✅ Table `profiles` (avec toutes les colonnes nécessaires)
- ✅ Table `analytics_events` (pour les analytics)
- ✅ Table `user_preferences` (pour la personnalisation)
- ✅ Tables `community_posts`, `community_post_likes` (communauté)
- ✅ Tables `user_bans`, `banned_emails` (modération)
- ✅ Toutes les RLS policies
- ✅ Triggers pour `updated_at`
- ✅ Fonction pour créer automatiquement un profil à l'inscription

### 1.2 Vérifier les Tables

Après exécution, vérifiez que toutes les tables existent:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## 📋 Étape 2: Configuration Expo

### 2.1 Expo Project ID (pour Notifications Push)

1. Créez un projet Expo sur https://expo.dev
2. Notez votre Project ID
3. Ajoutez-le dans `app.config.js`:
```javascript
extra: {
  expoProjectId: 'votre-project-id',
  // ... autres configs
}
```

Ou dans `.env`:
```
EXPO_PUBLIC_PROJECT_ID=votre-project-id
```

### 2.2 Apple Developer (pour OAuth Apple)

1. Créez un compte Apple Developer
2. Configurez "Sign in with Apple" dans Apple Developer
3. Configurez les credentials dans Supabase Dashboard → Authentication → Providers → Apple

## 📋 Étape 3: Intégrations Effectuées

### ✅ Fonctionnalités Intégrées

#### 1. OAuth Apple
- ✅ Service créé: `src/services/appleAuth.ts`
- ✅ Intégré dans `UserContext`
- ✅ Bouton ajouté dans `Login.tsx` (iOS uniquement)

#### 2. Notifications Push
- ✅ Service créé: `src/services/notifications.ts`
- ✅ Intégré dans `Home.tsx` (enregistrement automatique)
- ✅ Fonctions pour rappels de prière et Challenge 40 jours

#### 3. Audio/Vocal (TTS)
- ✅ Service créé: `src/services/speech.ts`
- ✅ Intégré dans `Chat.tsx` (lecture automatique des réponses d'AYNA)
- ✅ Support FR, AR, EN

#### 4. Multilingue (i18n)
- ✅ Configuration: `src/i18n/index.ts`
- ✅ Traductions FR, AR, EN créées
- ✅ Intégré dans `App.tsx`
- ✅ Sélecteur de langue dans `Settings.tsx`

#### 5. Analytics Avancées
- ✅ Service créé: `src/services/analytics.ts`
- ✅ Intégré dans `Home.tsx` et `Chat.tsx`
- ✅ Tracking page views et événements

#### 6. Personnalisation
- ✅ Service créé: `src/services/personalization.ts`
- ✅ Intégré dans `Settings.tsx`
- ✅ Sauvegarde des préférences utilisateur

## 📋 Étape 4: Utilisation

### Notifications Push
Les notifications sont automatiquement enregistrées au chargement de Home si l'utilisateur est connecté.

### TTS dans Chat
Les réponses d'AYNA sont automatiquement lues à voix haute.

### Changement de Langue
Dans Settings → Section "Langue", sélectionnez FR, AR ou EN.

### Analytics
Les événements sont automatiquement trackés:
- Page views
- Messages chat
- Changements de thème/langue

## ⚠️ Notes Importantes

1. **Table profiles**: Le script crée automatiquement un profil quand un utilisateur s'inscrit
2. **Notifications**: Nécessite un Expo Project ID configuré
3. **OAuth Apple**: Nécessite configuration Apple Developer
4. **i18n**: Les traductions de base sont créées, mais il faut traduire toutes les pages progressivement

## 🔧 Prochaines Étapes

1. Traduire toutes les pages avec `useTranslation`
2. Intégrer notifications dans Challenge40Days
3. Implémenter STT (Speech-to-Text) avec API externe
4. Créer dashboard admin pour analytics
5. Ajouter plus de traductions dans les fichiers JSON


