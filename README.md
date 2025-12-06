# AYNA Mobile - Application React Native

Application mobile AYNA migrée depuis React Web vers React Native (Expo).

## 🚀 Démarrage rapide

### Installation
```bash
npm install
```

### Configuration
1. Copier `.env.example` vers `.env`
2. Remplir les variables d'environnement (notamment Supabase)

### Lancer l'application
```bash
# Démarrer le serveur de développement
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS (Mac uniquement)
npm run ios

# Lancer sur Web
npm run web
```

## 📦 Dépendances installées

### Navigation
- @react-navigation/native
- @react-navigation/stack
- @react-navigation/bottom-tabs
- react-native-screens
- react-native-safe-area-context
- react-native-gesture-handler

### Stockage
- @react-native-async-storage/async-storage
- expo-secure-store

### Styles
- nativewind (Tailwind CSS pour React Native)
- tailwindcss

### Icons
- lucide-react-native

### Charts
- victory-native

### Expo Packages
- expo-location (géolocalisation)
- expo-sensors (orientation)
- expo-image-picker (sélection d'images)
- expo-image-manipulator (redimensionnement)
- expo-linear-gradient (dégradés)
- expo-blur (effet de flou)
- expo-av (audio/vidéo)
- expo-font (polices)
- react-native-svg (SVG)
- react-native-reanimated (animations)

### Backend
- @supabase/supabase-js (Supabase client)
- axios (HTTP client)

## 📁 Structure du projet

```
application/
├── src/
│   ├── components/     # Composants réutilisables
│   ├── contexts/       # Contextes React
│   ├── pages/          # Pages de l'application
│   ├── services/       # Services (API, Supabase, etc.)
│   ├── hooks/          # Hooks personnalisés
│   ├── utils/          # Utilitaires
│   ├── types/          # Types TypeScript
│   ├── data/           # Données statiques
│   └── navigation/     # Configuration de navigation
├── assets/
│   ├── fonts/          # Polices
│   ├── images/         # Images
│   └── sounds/         # Sons d'ambiance
├── App.tsx             # Point d'entrée
└── global.css          # Styles Tailwind globaux
```

## ✅ État actuel

- ✅ Projet Expo créé
- ✅ Toutes les dépendances installées
- ✅ TypeScript configuré avec paths
- ✅ NativeWind configuré
- ✅ Structure de dossiers créée
- ✅ Permissions configurées (app.json)
- ⏳ Migration des composants en cours...

## 📝 Notes

- L'application est connectée à Supabase pour l'authentification, la base de données et le storage
- Les variables d'environnement doivent être configurées dans `.env`
- Voir la documentation complète dans `D:\ayna_final\` pour le plan de migration

