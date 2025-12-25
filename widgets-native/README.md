# 📱 Configuration des Widgets Natifs iOS/Android

Ce dossier contient les templates et instructions pour configurer les widgets natifs.

## 📁 Structure

```
widgets-native/
├── README.md (ce fichier)
├── ios-templates/
│   └── AYNAWidgets.swift (template Swift pour iOS)
├── android-templates/
│   └── PrayerTimesWidgetProvider.kt (template Kotlin pour Android)
└── GUIDE_COMPLET.md (guide détaillé)
```

## 🚀 Démarrage rapide

### Pour iOS

1. **Générer les fichiers natifs**
   ```bash
   cd application
   npx expo prebuild
   ```

2. **Ouvrir dans Xcode**
   ```bash
   open ios/AynaMobile.xcworkspace
   ```

3. **Créer Widget Extension**
   - File > New > Target
   - Widget Extension
   - Nom: `AYNAWidgets`
   - Cocher "Include Configuration Intent"

4. **Configurer App Groups**
   - Target principal > Signing & Capabilities
   - Ajouter App Groups: `group.com.ayna.app.shared`
   - Répéter pour le target AYNAWidgets

5. **Copier le code Swift**
   - Copier `ios-templates/AYNAWidgets.swift` dans le dossier de l'extension

### Pour Android

1. **Générer les fichiers natifs**
   ```bash
   cd application
   npx expo prebuild
   ```

2. **Créer les fichiers**
   - Créer `android/app/src/main/java/com/ayna/app/widgets/`
   - Copier `PrayerTimesWidgetProvider.kt`
   - Créer les layouts XML (voir guide complet)

3. **Configurer AndroidManifest.xml**
   - Ajouter les receivers pour chaque widget

## 📚 Documentation

Voir `GUIDE_COMPLET.md` pour les instructions détaillées.

## ⚠️ Note importante

Les widgets natifs nécessitent :
- Configuration manuelle dans Xcode (iOS)
- Configuration manuelle dans Android Studio (Android)
- Partage de données via App Groups (iOS) ou SharedPreferences (Android)

Les données sont déjà préparées dans React Native via `widgetManager.ts`.








