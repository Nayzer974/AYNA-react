# 🔔 IMPLÉMENTATION - NOTIFICATIONS INTELLIGENTES

**Date :** 2025-01-27  
**Version :** 1.0  
**Statut :** ✅ Implémenté

---

## 📋 RÉSUMÉ

Système complet de notifications intelligentes avec :
- ✅ Rappels de prières personnalisés basés sur les habitudes
- ✅ Suggestions contextuelles basées sur l'activité
- ✅ Analyse des patterns d'utilisation
- ✅ Notifications adaptatives selon le contexte
- ✅ Interface de configuration dans Settings

---

## 🎯 FONCTIONNALITÉS IMPLÉMENTÉES

### 1. Service de Notifications Intelligentes (`smartNotifications.ts`)

#### Gestion des Habitudes Utilisateur
- **`loadUserHabits()`** : Charge les habitudes depuis AsyncStorage
- **`saveUserHabits()`** : Sauvegarde les habitudes (local + Supabase)
- **`updateHabitsFromActivity()`** : Met à jour les habitudes après une activité

#### Types d'Habitudes Suivies
- **Patterns de prière** : Heure moyenne, taux de complétion, offset préféré
- **Patterns de dhikr** : Moments préférés, durée moyenne, fréquence
- **Patterns de journal** : Moments préférés, fréquence
- **Heures actives** : Période d'activité de l'utilisateur
- **Dernière activité** : Type et timestamp

#### Génération de Notifications
- **`generatePrayerNotifications()`** : Rappels de prières personnalisés
  - Offsets adaptatifs selon les habitudes
  - Respect des heures silencieuses
  - Respect du temps de prière
- **`generateDhikrNotifications()`** : Rappels de dhikr adaptatifs
- **`generateJournalNotifications()`** : Rappels de journal personnalisés
- **`generateSuggestions()`** : Suggestions contextuelles
  - Si pas de dhikr aujourd'hui
  - Si prières manquées
  - Fréquence configurable

#### Paramètres de Notifications
- **`loadNotificationSettings()`** : Charge les paramètres
- **`saveNotificationSettings()`** : Sauvegarde les paramètres
- **`scheduleAllSmartNotifications()`** : Planifie toutes les notifications

### 2. Hook `useSmartNotifications`

#### Fonctionnalités
- Charge automatiquement les habitudes et paramètres
- Met à jour les habitudes après chaque activité
- Replanifie les notifications automatiquement
- Interface simple pour enregistrer les activités

#### API
```typescript
const {
  habits,                    // Habitudes utilisateur
  settings,                  // Paramètres de notifications
  scheduledNotifications,    // Notifications planifiées
  loading,                   // État de chargement
  recordActivity,            // Enregistrer une activité
  updateSettings,            // Mettre à jour les paramètres
  rescheduleNotifications,   // Replanifier les notifications
} = useSmartNotifications();
```

### 3. Composant de Configuration (`SmartNotificationsSettings.tsx`)

#### Sections Configurables
- **Toggle principal** : Activer/désactiver les notifications
- **Rappels de Prières** :
  - Activer/désactiver
  - Mode adaptatif (s'adapte aux habitudes)
  - Offsets personnalisables (si non adaptatif)
- **Rappels de Dhikr** :
  - Activer/désactiver
  - Mode adaptatif
- **Rappels de Journal** :
  - Activer/désactiver
  - Mode adaptatif
- **Suggestions Intelligentes** :
  - Activer/désactiver
  - Fréquence (Faible, Moyenne, Élevée)
- **Heures Silencieuses** :
  - Activer/désactiver
  - Plage horaire configurable
- **Respect du Temps de Prière** :
  - Ne pas notifier pendant les 30 minutes autour des prières

---

## 🔧 INTÉGRATION

### 1. Dans Settings.tsx

Le composant `SmartNotificationsSettings` a été ajouté dans la page Settings, juste après la section Privacy.

### 2. Enregistrement des Activités

Pour que le système apprenne des habitudes, il faut enregistrer les activités :

#### Exemple : Enregistrer une prière complétée

```typescript
import { useSmartNotifications } from '@/hooks/useSmartNotifications';

function PrayerComponent() {
  const { recordActivity } = useSmartNotifications();
  
  const handlePrayerCompleted = async (prayerName: string) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    await recordActivity('prayer', {
      prayerName,
      time,
    });
  };
  
  // ...
}
```

#### Exemple : Enregistrer un dhikr

```typescript
const handleDhikrCompleted = async (duration: number) => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  await recordActivity('dhikr', {
    time,
    duration,
  });
};
```

#### Exemple : Enregistrer une entrée de journal

```typescript
const handleJournalEntry = async () => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  await recordActivity('journal', {
    time,
  });
};
```

---

## 📍 POINTS D'INTÉGRATION RECOMMANDÉS

### 1. PrayerTimesCardSlide.tsx
Quand l'utilisateur coche une prière comme complétée :
```typescript
await recordActivity('prayer', {
  prayerName: key, // 'Fajr', 'Dhuhr', etc.
  time: currentTime,
});
```

### 2. Home.tsx (Dhikr)
Quand l'utilisateur complète un dhikr :
```typescript
await recordActivity('dhikr', {
  time: currentTime,
  duration: dhikrDuration,
});
```

### 3. Journal.tsx
Quand l'utilisateur sauvegarde une entrée :
```typescript
await recordActivity('journal', {
  time: currentTime,
});
```

### 4. BaytAnNur.tsx
Quand l'utilisateur complète une session de méditation :
```typescript
await recordActivity('meditation', {
  duration: sessionDuration,
});
```

### 5. QuranReader.tsx
Quand l'utilisateur lit le Coran :
```typescript
await recordActivity('quran', {
  duration: readingDuration,
});
```

---

## 🎯 ALGORITHME D'APPRENTISSAGE

### Patterns de Prière
- **Heure moyenne** : Moyenne mobile avec facteur d'apprentissage de 0.3
- **Taux de complétion** : Augmente de 0.1 à chaque prière complétée
- **Offset préféré** : Appris progressivement selon les habitudes

### Patterns de Dhikr/Journal
- **Moments préférés** : Ajout automatique des moments d'activité
- **Durée moyenne** : Moyenne mobile (70% ancienne, 30% nouvelle)
- **Fréquence** : Augmente progressivement

### Heures Actives
- **Début** : Heure la plus précoce d'activité
- **Fin** : Heure la plus tardive d'activité

---

## 🔔 TYPES DE NOTIFICATIONS

### 1. Rappels de Prières
- **10 minutes avant** : "La prière X approche dans 10 minutes"
- **5 minutes avant** : "La prière X approche dans 5 minutes"
- **À l'heure** : "Il est temps pour la prière X"
- **Personnalisation** : Messages adaptés selon le taux de complétion

### 2. Rappels de Dhikr
- **Moment préféré** : Basé sur les habitudes ou paramètres
- **Message** : "N'oubliez pas votre moment de dhikr quotidien"
- **Durée suggérée** : Si habitude établie

### 3. Rappels de Journal
- **Moment préféré** : Basé sur les habitudes
- **Message adaptatif** : Plus urgent si plusieurs jours sans écriture

### 4. Suggestions Intelligentes
- **Pas de dhikr aujourd'hui** : Suggestion dans 2 heures
- **Prières manquées** : Rappel avec nombre de prières à rattraper
- **Fréquence** : Configurable (Faible, Moyenne, Élevée)

---

## 🚀 PROCHAINES ÉTAPES

### 1. Intégration Backend (Notifications Push)
Actuellement, les notifications sont stockées localement. Pour les notifications push réelles :

1. **Créer une Edge Function Supabase** pour envoyer les notifications push
2. **Intégrer avec Expo Push Notifications** ou un service tiers (OneSignal, Firebase)
3. **Synchroniser les notifications planifiées** avec le backend
4. **Gérer les tokens push** des utilisateurs

### 2. Intégration dans les Pages
- ✅ Settings : Configuration complète
- ⏳ PrayerTimesCardSlide : Enregistrer les prières complétées
- ⏳ Home : Enregistrer les dhikr
- ⏳ Journal : Enregistrer les entrées
- ⏳ BaytAnNur : Enregistrer les méditations
- ⏳ QuranReader : Enregistrer les lectures

### 3. Améliorations Futures
- **Notifications de verset du jour** : À implémenter
- **Notifications d'événements spirituels** : Ramadan, Laylat al-Qadr, etc.
- **Notifications de communauté** : Messages, likes, etc.
- **Analytics des notifications** : Taux d'ouverture, efficacité

---

## 📊 STRUCTURE DES DONNÉES

### UserHabits
```typescript
{
  prayerPatterns: {
    'Fajr': {
      averageTime: '05:30',
      completionRate: 0.85,
      preferredReminderOffset: 10,
      lastCompleted: '2025-01-27T05:30:00Z'
    },
    // ...
  },
  dhikrPatterns: {
    preferredTimes: ['08:00', '14:00', '20:00'],
    averageDuration: 5,
    frequency: 1.2
  },
  journalPatterns: {
    preferredTimes: ['20:00'],
    frequency: 3.5
  },
  activeHours: {
    start: '06:00',
    end: '23:00'
  },
  lastActivity: {
    type: 'prayer',
    timestamp: '2025-01-27T12:30:00Z'
  }
}
```

### NotificationSettings
```typescript
{
  enabled: true,
  prayerReminders: {
    enabled: true,
    offsets: [10, 5, 0],
    adaptive: true
  },
  dhikrReminders: {
    enabled: true,
    times: ['08:00', '14:00', '20:00'],
    adaptive: true
  },
  journalReminders: {
    enabled: true,
    times: ['20:00'],
    adaptive: true
  },
  suggestions: {
    enabled: true,
    frequency: 'medium'
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00'
  },
  respectPrayerTime: true
}
```

---

## ✅ CHECKLIST D'INTÉGRATION

- [x] Service `smartNotifications.ts` créé
- [x] Hook `useSmartNotifications` créé
- [x] Composant `SmartNotificationsSettings` créé
- [x] Intégration dans Settings.tsx
- [x] Intégration dans PrayerTimesCardSlide.tsx (enregistrer prières)
- [x] Hook `useNotificationScheduler` créé
- [x] Replanification automatique dans App.tsx
- [ ] Intégration dans Home.tsx (enregistrer dhikr)
- [ ] Intégration dans Journal.tsx (enregistrer entrées)
- [ ] Intégration dans BaytAnNur.tsx (enregistrer méditations)
- [ ] Intégration dans QuranReader.tsx (enregistrer lectures)
- [ ] Backend pour notifications push (optionnel)
- [ ] Tests unitaires (optionnel)

---

## 📝 NOTES

- Les notifications sont actuellement stockées localement dans AsyncStorage
- Pour les notifications push réelles, il faudra intégrer un service backend
- Le système apprend progressivement des habitudes de l'utilisateur
- Les notifications sont replanifiées automatiquement après chaque activité
- Le mode adaptatif s'active automatiquement après quelques jours d'utilisation

---

**Date de création :** 2025-01-27  
**Version :** 1.0  
**Statut :** ✅ Implémenté (intégration dans les pages en cours)

