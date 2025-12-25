# Fonctionnalités Analytics - Guide d'installation

## 📦 Packages requis

Pour utiliser toutes les fonctionnalités analytics, vous devez installer les packages suivants :

```bash
npx expo install expo-file-system expo-sharing
```

Ces packages sont nécessaires pour :
- **expo-file-system** : Créer et sauvegarder les fichiers d'export (JSON/CSV)
- **expo-sharing** : Partager les fichiers exportés avec d'autres applications

## ✅ Fonctionnalités implémentées

### 1. Export des données (JSON/CSV)

Les utilisateurs peuvent exporter toutes leurs données analytics dans deux formats :
- **JSON** : Format structuré complet avec toutes les métadonnées
- **CSV** : Format tabulaire pour analyse dans Excel/Google Sheets

**Fichier** : `application/src/services/analyticsExport.ts`

**Utilisation** :
```typescript
import { exportAnalytics } from '@/services/analyticsExport';

// Export JSON
await exportAnalytics(userId, 'json');

// Export CSV
await exportAnalytics(userId, 'csv');
```

### 2. Réinitialisation complète des analytics

Permet de supprimer toutes les données analytics (local + Supabase).

**Fichier** : `application/src/services/analyticsReset.ts`

**Utilisation** :
```typescript
import { resetAllAnalytics } from '@/services/analyticsReset';

await resetAllAnalytics(userId);
```

### 3. Graphiques avancés

#### Graphique en courbe (LineChart)
Visualise l'évolution de l'activité sur une période avec une courbe lisse.

**Fichier** : `application/src/components/analytics/AdvancedCharts.tsx`

**Utilisation** :
```tsx
import { LineChart } from '@/components/analytics/AdvancedCharts';

<LineChart
  data={[
    { x: 'Lun', y: 5, date: new Date() },
    { x: 'Mar', y: 8, date: new Date() },
    // ...
  ]}
  color="#6366F1"
  label="Activité hebdomadaire"
/>
```

#### Heatmap (Carte de chaleur)
Visualise l'activité quotidienne sur une période avec une carte de chaleur.

**Utilisation** :
```tsx
import { Heatmap } from '@/components/analytics/AdvancedCharts';

<Heatmap
  data={[
    { date: new Date(), value: 1 },
    // ...
  ]}
  startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
  endDate={new Date()}
  color="#6366F1"
/>
```

### 4. Filtres de date pour l'historique

Les utilisateurs peuvent filtrer l'historique par :
- **Type d'événement** : Dhikr, Prières, Notes, Méditations
- **Période** : 7, 30, 90 derniers jours ou période personnalisée

**Fonctionnalités** :
- Sélection rapide de périodes prédéfinies
- Filtrage par date de début et fin
- Combinaison de filtres (type + date)

## 🔧 Configuration

### Permissions (Android)

Dans `app.config.js`, les permissions suivantes sont déjà configurées :
```javascript
permissions: [
  "READ_EXTERNAL_STORAGE",
  "WRITE_EXTERNAL_STORAGE"
]
```

### Permissions (iOS)

Les permissions iOS sont gérées automatiquement par Expo.

## 📝 Notes importantes

1. **Export** : Les fichiers sont sauvegardés dans le répertoire de documents de l'application et peuvent être partagés via le menu de partage natif.

2. **Réinitialisation** : ⚠️ Cette action est **irréversible**. Toutes les données analytics locales et distantes seront supprimées.

3. **Graphiques** : Les graphiques utilisent `react-native-svg` qui est déjà installé dans le projet.

4. **Performance** : Les graphiques sont optimisés pour afficher jusqu'à 100 points de données sans lag.

## 🐛 Dépannage

### Erreur "expo-file-system not found"
```bash
npx expo install expo-file-system
```

### Erreur "expo-sharing not found"
```bash
npx expo install expo-sharing
```

### Les graphiques ne s'affichent pas
Vérifiez que `react-native-svg` est installé :
```bash
npx expo install react-native-svg
```

## 📚 Documentation

- [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/)
- [react-native-svg](https://github.com/react-native-svg/react-native-svg)




