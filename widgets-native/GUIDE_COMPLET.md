# 📱 Guide Complet : Configuration des Widgets Natifs

## Vue d'ensemble

Ce guide explique comment configurer les widgets natifs pour iOS (WidgetKit) et Android (App Widgets).

---

## 🍎 iOS - WidgetKit

### Étape 1 : Générer les fichiers natifs

```bash
cd application
npx expo prebuild
```

### Étape 2 : Créer Widget Extension dans Xcode

1. Ouvrir `ios/AynaMobile.xcworkspace`
2. File > New > Target
3. Sélectionner **Widget Extension**
4. Nom: `AYNAWidgets`
5. Language: **Swift**
6. ✅ Cocher **Include Configuration Intent**

### Étape 3 : Configurer App Groups

1. Target principal > Signing & Capabilities
2. + Capability > App Groups
3. Créer: `group.com.ayna.app.shared`
4. Répéter pour target `AYNAWidgets`

### Étape 4 : Implémenter les Providers

Créer les fichiers dans `ios/AYNAWidgets/` :

- `PrayerTimesProvider.swift` - Charger depuis UserDefaults
- `DhikrProvider.swift`
- `VerseProvider.swift`

Exemple `PrayerTimesProvider.swift` :

```swift
struct PrayerTimesProvider: IntentTimelineProvider {
    let userDefaults = UserDefaults(suiteName: "group.com.ayna.app.shared")
    
    func getTimeline(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let data = loadData()
        let timeline = Timeline(entries: [data], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func loadData() -> PrayerTimesEntry {
        // Lire depuis UserDefaults
        let json = userDefaults?.string(forKey: "widget_prayer_times") ?? "{}"
        // Parser JSON et créer Entry
    }
}
```

---

## 🤖 Android - App Widgets

### Étape 1 : Créer Widget Provider

Créer `android/app/src/main/java/com/ayna/app/widgets/PrayerTimesWidgetProvider.kt`

### Étape 2 : Créer Layout XML

Créer `android/app/src/main/res/layout/prayer_times_widget.xml`

### Étape 3 : Configurer AndroidManifest.xml

Ajouter dans `<application>` :

```xml
<receiver android:name=".widgets.PrayerTimesWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/prayer_times_widget_info" />
</receiver>
```

---

## 📦 Partage de données

Les données sont sauvegardées dans React Native via `widgetManager.ts`.

Pour que les widgets natifs y accèdent :

- **iOS**: Utiliser UserDefaults avec App Groups
- **Android**: Utiliser SharedPreferences

Un module Expo personnalisé peut faciliter le partage.

---

## ✅ Checklist

### iOS
- [ ] Extension créée
- [ ] App Groups configuré
- [ ] Code Swift implémenté
- [ ] Testé sur device

### Android
- [ ] Provider créé
- [ ] Layout XML créé
- [ ] Manifest configuré
- [ ] Testé sur device

Voir les templates dans les dossiers `ios-templates/` et `android-templates/`.








