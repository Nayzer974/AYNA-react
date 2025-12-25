# 📅 Architecture Calendrier Production-Ready

**Date:** 2025-01-13  
**Statut:** ✅ Implémenté

## 🎯 Vue d'ensemble

Architecture production-ready pour un calendrier grégorien avec affichage Hijri, support multilingue (Ar/Fr/En) et RTL, pour Android + iOS avec React Native (Expo).

## 📦 Stack Technique

### Dépendances installées
```json
{
  "react-native-calendars": "^1.1313.0",
  "moment": "^2.30.1",
  "moment-hijri": "^3.0.0",
  "i18next": "^25.7.1",
  "react-i18next": "^16.4.0",
  "@react-native-async-storage/async-storage": "^2.2.0"
}
```

### Services créés

1. **`src/services/rtl.ts`** - Gestion RTL automatique
2. **`src/services/calendarService.ts`** - Service de calendrier avec moment-hijri
3. **`src/components/HijriCalendarProduction.tsx`** - Composant calendrier production-ready

## 🔧 Configuration

### 1. Service RTL (`src/services/rtl.ts`)

Gère automatiquement le changement de direction (RTL/LTR) selon la langue :

```typescript
import { setRTLForLanguage, isRTLRequired } from '@/services/rtl';

// Configurer RTL pour une langue
const requiresRestart = await setRTLForLanguage('ar'); // true sur Android

// Vérifier si RTL requis
const isRTL = isRTLRequired('ar'); // true
```

**⚠️ Important:** Sur Android, un redémarrage de l'app est requis pour que RTL prenne effet.

### 2. Service Calendrier (`src/services/calendarService.ts`)

Configure `react-native-calendars` et `moment-hijri` avec support multilingue :

```typescript
import { 
  initializeCalendarService,
  getHijriDateString,
  getHijriDay 
} from '@/services/calendarService';

// Initialiser au démarrage de l'app
initializeCalendarService();

// Obtenir la date Hijri formatée
const hijriDate = await getHijriDateString('2025-12-13');
// Résultat: "22 Joumada ath-thania 1447" (selon la locale)

// Obtenir le jour Hijri pour affichage sous chaque jour
const hijriDay = await getHijriDay('2025-12-13');
// Résultat: "22"
```

### 3. Configuration i18n améliorée (`src/i18n/index.ts`)

Intègre automatiquement RTL lors du changement de langue :

```typescript
import { changeLanguage } from '@/i18n';

// Changer la langue (configure RTL automatiquement)
const requiresRestart = await changeLanguage('ar');
if (requiresRestart) {
  // Afficher un message à l'utilisateur pour redémarrer l'app (Android)
}
```

### 4. Initialisation dans App.tsx

```typescript
import { initializeRTL } from './src/i18n';
import { initializeCalendarService } from './src/services/calendarService';

useEffect(() => {
  initializeRTL().catch(console.error);
  initializeCalendarService();
}, []);
```

## 🎨 Composant Calendrier Production

### Utilisation basique

```typescript
import { HijriCalendarProduction } from '@/components/HijriCalendarProduction';

<HijriCalendarProduction
  onDayPress={(day, hijriDate) => {
    console.log('Date sélectionnée:', day.dateString);
    console.log('Date Hijri:', hijriDate);
  }}
/>
```

### Utilisation avancée

```typescript
<HijriCalendarProduction
  current="2025-12-13"
  minDate="2025-01-01"
  maxDate="2026-12-31"
  markedDates={{
    '2025-12-13': {
      marked: true,
      dotColor: '#FFD369',
    },
  }}
  onDayPress={async (day, hijriDate) => {
    // day: { dateString: '2025-12-13', day: 13, month: 12, year: 2025 }
    // hijriDate: "22 Joumada ath-thania 1447"
    setSelectedDate(day.dateString);
    setSelectedHijriDate(hijriDate);
  }}
/>
```

## 🌍 Support Multilingue

### Traductions ajoutées

Les traductions suivantes ont été ajoutées dans `src/i18n/locales/` :

**Français (`fr.json`):**
```json
{
  "calendar": {
    "title": "Calendrier",
    "hijriDate": "Date Hijri",
    "gregorianDate": "Date Grégorienne",
    "selectDate": "Sélectionner une date",
    "today": "Aujourd'hui",
    "loading": "Chargement du calendrier...",
    "error": "Erreur lors du chargement du calendrier"
  }
}
```

**Anglais (`en.json`):**
```json
{
  "calendar": {
    "title": "Calendar",
    "hijriDate": "Hijri Date",
    "gregorianDate": "Gregorian Date",
    "selectDate": "Select a date",
    "today": "Today",
    "loading": "Loading calendar...",
    "error": "Error loading calendar"
  }
}
```

**Arabe (`ar.json`):**
```json
{
  "calendar": {
    "title": "التقويم",
    "hijriDate": "التاريخ الهجري",
    "gregorianDate": "التاريخ الميلادي",
    "selectDate": "اختر تاريخًا",
    "today": "اليوم",
    "loading": "جاري تحميل التقويم...",
    "error": "خطأ في تحميل التقويم"
  }
}
```

## ✅ Exactitude Religieuse

### Système Hybride (déjà implémenté)

Le système utilise une approche hybride pour garantir l'exactitude :

1. **Librairie locale Umm al-Qura** (priorité) - Réponse instantanée
2. **API AlAdhan** (si internet disponible) - Précision maximale
3. **Cache local** (AsyncStorage) - Si pas d'internet
4. **Fallback local** - Si pas de cache

**Fichiers concernés:**
- `src/services/hijriConverter.ts` - Orchestrateur hybride
- `src/services/hijriConverterLocal.ts` - Librairie locale Umm al-Qura
- `src/services/hijriCache.ts` - Gestion du cache

### Pour les événements religieux (Ramadan, Aïd)

⚠️ **Recommandation:** Utiliser l'API AlAdhan pour les événements religieux importants, car les calculs astronomiques peuvent varier selon l'observation réelle de la lune.

## 📱 Fonctionnalités

### ✅ Implémenté

- [x] Calendrier grégorien avec `react-native-calendars`
- [x] Affichage Hijri sous chaque jour
- [x] Support multilingue (Ar/Fr/En)
- [x] Support RTL automatique pour l'arabe
- [x] Intégration avec le système hybride (API + Cache + Local)
- [x] Thème adaptatif selon le thème de l'app
- [x] Date du jour Hijri affichée en haut
- [x] Sélection de date avec callback
- [x] Marqueurs de dates personnalisables
- [x] Limites min/max de dates

### 🎨 UX Premium

- Affichage du jour Hijri sous chaque jour grégorien
- Mise en évidence de la date du jour
- Animation de sélection
- Support RTL complet pour l'arabe
- Thème cohérent avec l'application

## 🔄 Migration depuis l'ancien composant

### Ancien composant (`HijriCalendar.tsx`)

Le composant existant reste disponible et fonctionnel. Il utilise un système de calendrier personnalisé.

### Nouveau composant (`HijriCalendarProduction.tsx`)

Utilise `react-native-calendars` avec une meilleure UX et support RTL.

**Pour migrer:**

```typescript
// Avant
import { HijriCalendar } from '@/components/HijriCalendar';

// Après
import { HijriCalendarProduction } from '@/components/HijriCalendarProduction';
```

## 📋 Checklist Production

### ✅ Complété

- [x] RTL testé et configuré
- [x] Service de calendrier créé
- [x] Composant production-ready créé
- [x] Traductions ajoutées (Fr/Ar/En)
- [x] Intégration avec système hybride
- [x] Initialisation dans App.tsx

### ⚠️ À tester

- [ ] RTL sur appareil Android réel
- [ ] Fonts compatibles arabe (ex: Cairo, Noto)
- [ ] Test sur fuseaux horaires différents
- [ ] Snapshot tests sur changement langue
- [ ] Performance avec beaucoup de dates marquées

### 📝 Mention légale

⚠️ **Important:** Ajouter une mention légale dans les paramètres ou à propos :

> "Les dates Hijri sont calculées à partir d'algorithmes astronomiques. Pour les événements religieux importants (Ramadan, Aïd), nous recommandons de vérifier avec les autorités religieuses locales."

## 🚀 Prochaines étapes

1. **Tester sur appareils réels** (Android + iOS)
2. **Adapter HijriCalendarModal.tsx** pour utiliser le nouveau composant
3. **Ajouter des tests unitaires** pour le service de calendrier
4. **Optimiser les performances** pour le chargement des jours Hijri
5. **Ajouter des animations** pour le changement de mois

## 📚 Documentation

- [react-native-calendars](https://github.com/wix/react-native-calendars)
- [moment-hijri](https://github.com/xsoh/moment-hijri)
- [i18next](https://www.i18next.com/)
- [React Native RTL](https://reactnative.dev/docs/0.64/direct-manipulation#i18nmanager)





