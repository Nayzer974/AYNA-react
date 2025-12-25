# 📱 Configuration des Widgets iOS/Android

## Vue d'ensemble

Les widgets AYNA permettent d'afficher des informations importantes directement sur l'écran d'accueil :
- **Heures de Prière** : Affiche les heures de prière du jour avec la prochaine prière en évidence
- **Dhikr du Jour** : Affiche le dhikr quotidien avec texte arabe et traduction
- **Verset du Jour** : Affiche un verset du Coran avec traduction

## Architecture

### Services
- `widgetManager.ts` : Gère les données des widgets (récupération, stockage, synchronisation)
- `useWidgets.ts` : Hook React pour utiliser les données des widgets dans les composants

### Composants
- `PrayerTimesWidget.tsx` : Composant widget heures de prière
- `DhikrWidget.tsx` : Composant widget dhikr
- `VerseWidget.tsx` : Composant widget verset

### Page
- `WidgetsSettings.tsx` : Page de configuration et prévisualisation des widgets

## Installation des widgets natifs

### Pour iOS (nécessite configuration native)

1. **Ajouter le target Widget Extension dans Xcode**
   - Ouvrir le projet dans Xcode
   - File > New > Target > Widget Extension
   - Nom : `AYNAWidgets`
   - Language : Swift
   - Include Configuration Intent : Oui (pour permettre la configuration)

2. **Installer les dépendances nécessaires**
   ```bash
   npm install react-native-widget
   # ou utiliser expo-widget si disponible
   ```

3. **Configurer app.json/app.config.js**
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-widget",
           {
             "widgetExtensionBundleIdentifier": "com.votreapp.AYNAWidgets"
           }
         ]
       ]
     }
   }
   ```

### Pour Android (nécessite configuration native)

1. **Créer les fichiers Widget Provider**
   - Créer `android/app/src/main/java/com/votreapp/widgets/`
   - Créer les classes pour chaque widget (PrayerTimesWidgetProvider, etc.)

2. **Ajouter les permissions dans AndroidManifest.xml**
   ```xml
   <receiver android:name=".widgets.PrayerTimesWidgetProvider">
     <intent-filter>
       <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
     </intent-filter>
     <meta-data
       android:name="android.appwidget.provider"
       android:resource="@xml/prayer_times_widget_info" />
   </receiver>
   ```

3. **Créer les fichiers XML de configuration**
   - `android/app/src/main/res/xml/prayer_times_widget_info.xml`
   - Définir la taille, l'intervalle de mise à jour, etc.

## Utilisation dans l'application

### Mise à jour automatique

Les widgets se mettent à jour automatiquement :
- Lors du lancement de l'application
- Toutes les heures (configurable via `WIDGET_UPDATE_INTERVAL`)
- Lors de l'appel manuel de `refreshWidgetsData()`

### Hook useWidgets

```typescript
import { useWidgets } from '@/hooks/useWidgets';

function MyComponent() {
  const { widgetsData, loading, refreshWidgetsData } = useWidgets();

  if (loading) return <Loading />;

  return (
    <View>
      {widgetsData?.prayerTimes && (
        <PrayerTimesWidget data={widgetsData.prayerTimes} />
      )}
    </View>
  );
}
```

### Service widgetManager

```typescript
import {
  syncWidgetsData,
  updateAllWidgetsData,
  getPrayerTimesWidgetData,
  getDhikrWidgetData,
  getVerseWidgetData,
} from '@/services/widgetManager';

// Synchroniser les données (vérifie le cache d'abord)
const data = await syncWidgetsData(userLocation, 'fr');

// Forcer la mise à jour
const data = await updateAllWidgetsData(userLocation, 'fr');

// Récupérer une donnée spécifique
const prayerData = await getPrayerTimesWidgetData(userLocation);
```

## Structure des données

### PrayerTimesWidgetData
```typescript
{
  type: 'prayer_times';
  timings: {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
  };
  nextPrayer: {
    name: string;
    time: string;
    timeUntil: string;
  } | null;
  date: string;
}
```

### DhikrWidgetData
```typescript
{
  type: 'dhikr';
  arabic: string;
  transliteration?: string;
  translation?: string;
  reference?: string;
  date: string;
}
```

### VerseWidgetData
```typescript
{
  type: 'verse';
  arabic: string;
  translation: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  date: string;
}
```

## Stockage

Les données des widgets sont stockées dans AsyncStorage avec la clé `@ayna_widget_data` :
- Format : JSON avec `AllWidgetsData`
- Expiration : 1 heure par défaut
- Mise à jour : Automatique lors de la synchronisation

## Notes importantes

1. **Widgets natifs** : Pour que les widgets apparaissent sur l'écran d'accueil iOS/Android, il faut implémenter les extensions natives. Cette implémentation fournit la structure React Native qui peut être utilisée par les extensions.

2. **Partage de données** : Les extensions de widgets natives doivent accéder aux données via :
   - App Groups (iOS) : Partager AsyncStorage ou UserDefaults
   - SharedPreferences (Android) : Partager les données entre l'app et les widgets

3. **Mise à jour** : Les widgets se mettent à jour via :
   - Timer système (iOS WidgetKit, Android AppWidgetManager)
   - App refresh (lorsque l'utilisateur ouvre l'app)
   - Remote notifications (push pour forcer une mise à jour)

4. **Performance** : Les widgets doivent être légers et rapides à charger. Éviter les opérations réseau lourdes dans les extensions de widgets.

## Prochaines étapes

1. ✅ Structure de base créée
2. ✅ Services de gestion des données
3. ✅ Composants React Native
4. ✅ Page de configuration
5. ⏳ Configuration native iOS (nécessite Xcode)
6. ⏳ Configuration native Android (nécessite Android Studio)
7. ⏳ Tests sur appareils réels

---

**Date de création :** Aujourd'hui  
**Statut :** Structure complète, configuration native nécessaire








