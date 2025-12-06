# Installation du Système de Synchronisation Offline/Online

Ce guide explique le système de synchronisation automatique qui permet à l'application de fonctionner hors ligne et de synchroniser les données quand la connexion revient.

## 📋 Vue d'ensemble

Le système de synchronisation permet :
- ✅ Sauvegarde locale automatique de toutes les données importantes
- ✅ Synchronisation automatique vers Supabase quand la connexion revient
- ✅ File d'attente pour les données en attente de synchronisation
- ✅ Nettoyage automatique des données locales après synchronisation réussie

## 🔧 Données synchronisées

Les données suivantes sont sauvegardées localement ET synchronisées vers Supabase :

1. **Sessions Khalwa** (`khalwa_sessions`)
   - Sauvegardées localement dans AsyncStorage
   - Synchronisées vers Supabase quand en ligne
   - Statistiques calculées depuis Supabase ou localement

2. **Tracking d'utilisation** (`user_usage_tracking`, `module_visits`)
   - Sessions de tracking sauvegardées localement
   - Visites de modules sauvegardées localement
   - Synchronisées vers Supabase quand en ligne

3. **Notes de journal** (optionnel)
   - Actuellement uniquement locales
   - Peuvent être synchronisées dans le futur si nécessaire

4. **Entrées du challenge 40 jours**
   - Sauvegardées via UserContext (AsyncStorage + Supabase user_metadata)
   - Synchronisation automatique

## 🚀 Fonctionnement

### 1. Sauvegarde locale (toujours)
Quand l'utilisateur crée/modifie des données :
- Les données sont **toujours** sauvegardées localement en premier
- Cela garantit qu'aucune donnée n'est perdue même en cas de crash

### 2. Synchronisation vers Supabase
- Si **en ligne** : tentative de sauvegarde directe dans Supabase
- Si **hors ligne** : ajout à la file d'attente de synchronisation
- Si erreur Supabase : ajout à la file d'attente pour réessayer plus tard

### 3. Synchronisation automatique
- Au démarrage de l'app si en ligne
- Quand la connexion revient (détection automatique)
- Quand l'app revient au premier plan

### 4. Nettoyage
- Les données locales sont conservées pour les statistiques
- Les données synchronisées avec succès sont retirées de la queue
- Les données qui doivent rester locales (préférences, cache) sont conservées

## 📦 Dépendances

Le système utilise :
- `@react-native-community/netinfo` : Détection de la connexion réseau
- `@react-native-async-storage/async-storage` : Stockage local
- `@supabase/supabase-js` : Synchronisation vers Supabase

## 🔍 Vérification

Pour vérifier que le système fonctionne :

1. **Tester hors ligne** :
   - Activer le mode avion
   - Créer une session Khalwa
   - Vérifier qu'elle est sauvegardée localement
   - Désactiver le mode avion
   - Vérifier que la session est synchronisée vers Supabase

2. **Vérifier la queue de synchronisation** :
   ```typescript
   import { getSyncQueue, getSyncStatus } from '@/services/syncService';
   
   const queue = await getSyncQueue();
   const status = await getSyncStatus();
   console.log('Queue:', queue);
   console.log('Status:', status);
   ```

3. **Synchroniser manuellement** :
   ```typescript
   import { syncQueue } from '@/services/syncService';
   
   const result = await syncQueue();
   console.log('Synchronisé:', result.synced, 'Échoué:', result.failed);
   ```

## ⚙️ Configuration

Le système est automatiquement activé dans `App.tsx` via le hook `useAutoSync()`.

Aucune configuration supplémentaire n'est nécessaire.

## 🐛 Dépannage

### Les données ne se synchronisent pas

1. Vérifier la connexion réseau :
   ```typescript
   import { isOnline } from '@/services/syncService';
   const online = await isOnline();
   console.log('En ligne:', online);
   ```

2. Vérifier que Supabase est configuré :
   - Vérifier `APP_CONFIG.useSupabase`
   - Vérifier que `supabase` est initialisé

3. Vérifier la file d'attente :
   ```typescript
   const queue = await getSyncQueue();
   console.log('Éléments en attente:', queue.length);
   ```

### Les données sont perdues

- Les données sont toujours sauvegardées localement en premier
- Vérifier AsyncStorage pour les données locales
- Les données non synchronisées restent dans la queue jusqu'à synchronisation réussie

## 📝 Notes importantes

- Les données locales sont **toujours** sauvegardées, même si Supabase échoue
- La synchronisation est **automatique** et **transparente** pour l'utilisateur
- Les erreurs de synchronisation sont **loguées** mais n'empêchent pas l'utilisation de l'app
- Les données sont **retentées** automatiquement jusqu'à 5 fois avant d'être supprimées de la queue

