# Guide de Compilation Android pour AYNA

Ce guide vous explique comment compiler votre application Android avec Expo EAS Build.

## 📋 Prérequis

1. **Compte Expo** : Créez un compte sur [expo.dev](https://expo.dev) si vous n'en avez pas
2. **EAS CLI** : Installez l'outil en ligne de commande EAS

```bash
npm install -g eas-cli
```

3. **Connexion à Expo** : Connectez-vous à votre compte

```bash
eas login
```

## 🚀 Étapes de Compilation

### Option 1 : Build de Preview (APK - pour tester)

Cette option génère un fichier APK que vous pouvez installer directement sur votre appareil Android.

```bash
npm run build:android:preview
```

Ou directement :

```bash
eas build --platform android --profile preview
```

**Résultat** : Un fichier APK téléchargeable depuis le dashboard Expo

### Option 2 : Build de Production (AAB - pour Google Play Store)

Cette option génère un fichier AAB (Android App Bundle) requis pour publier sur Google Play Store.

```bash
npm run build:android:production
```

Ou directement :

```bash
eas build --platform android --profile production
```

**Résultat** : Un fichier AAB téléchargeable depuis le dashboard Expo

### Option 3 : Build de Développement (avec Expo Dev Client)

Cette option génère un build avec le client de développement Expo intégré.

```bash
npm run build:android:dev
```

Ou directement :

```bash
eas build --platform android --profile development
```

## 📱 Installation de l'APK

1. Une fois le build terminé, vous recevrez un lien de téléchargement
2. Téléchargez l'APK sur votre appareil Android
3. Activez "Sources inconnues" dans les paramètres Android
4. Installez l'APK en le tapant

## 🔧 Configuration Actuelle

- **Package Name** : `com.ayna.app`
- **Version** : `1.0.0`
- **Owner** : `bl4ck00`
- **Project ID** : `c2832911-1e2c-4175-a93b-c61fdbbd2575`

## 📝 Notes Importantes

1. **Premier Build** : Le premier build peut prendre 15-30 minutes
2. **Builds Suivants** : Les builds suivants sont généralement plus rapides (10-20 minutes)
3. **Quota Gratuit** : Expo offre un quota gratuit de builds par mois
4. **Keystore** : EAS gère automatiquement le keystore pour signer votre application

## 🐛 Dépannage

### Erreur "Not logged in"
```bash
eas login
```

### Erreur "Project not linked"
```bash
eas project:init
```

### Vérifier le statut des builds
```bash
eas build:list
```

## 📚 Ressources

- [Documentation EAS Build](https://docs.expo.dev/build/introduction/)
- [Dashboard Expo](https://expo.dev)
- [Guide de publication Google Play](https://docs.expo.dev/submit/android/)

