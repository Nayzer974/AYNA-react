# Scénarios d'échec Expo/Offline - Analytics v2

## Scénarios identifiés et solutions

### 1. ✅ AsyncStorage Quota Exceeded
**Problème :** AsyncStorage peut échouer si le stockage est plein (~6MB limite)
**Impact :** Événements perdus, app peut crasher si erreur non catchée
**Solution :** Gestion gracieuse avec fallback et réduction agressive de la queue

### 2. ✅ JSON Corruption
**Problème :** JSON.parse peut échouer si données corrompues
**Impact :** Queue inutilisable, perte de tous les événements
**Solution :** Validation et réparation automatique des données corrompues

### 3. ✅ Race Conditions
**Problème :** Opérations concurrentes sur la queue (dequeueBatch + enqueue)
**Impact :** Événements dupliqués ou perdus
**Solution :** Verrous avec opérations atomiques

### 4. ✅ App Crash During Save
**Problème :** App crash pendant saveQueue → données perdues
**Impact :** Événements non persistés
**Solution :** Écriture atomique avec sauvegarde avant modification

### 5. ✅ Network Change During Batch
**Problème :** Réseau change pendant l'envoi d'un batch
**Impact :** Batch partiellement envoyé, doublons possibles
**Solution :** Vérification réseau avant chaque opération, tracking des événements envoyés

### 6. ✅ Partial Batch Failure
**Problème :** Batch de 50 événements, 30 envoyés, puis erreur
**Impact :** 30 marqués comme envoyés, 20 perdus
**Solution :** Transaction-like approach avec rollback en cas d'échec

### 7. ✅ Timer Suspension (Background)
**Problème :** setTimeout suspendu en background, retry ne se déclenche pas
**Impact :** Sync reportée indéfiniment
**Solution :** Ne pas utiliser setTimeout pour retry, utiliser AppState + network listeners

### 8. ✅ UUID Collisions (Rare)
**Problème :** Math.random() peut générer des UUID identiques (très rare)
**Impact :** Déduplication incorrecte
**Solution :** UUID avec timestamp + counter pour garantir unicité

### 9. ✅ Queue Inconsistency
**Problème :** dequeueBatch appelé plusieurs fois avant markSent → même batch envoyé plusieurs fois
**Impact :** Doublons dans Supabase
**Solution :** Verrous avec tracking des batches en cours

### 10. ✅ Context Building Failures
**Problème :** Constants.expoConfig undefined ou device null
**Impact :** Création d'événement échoue
**Solution :** Valeurs par défaut safe pour tous les champs context

### 11. ✅ Memory Pressure (OS Clears Storage)
**Problème :** OS vide AsyncStorage sous pression mémoire
**Impact :** Perte de tous les événements en queue
**Solution :** Acceptable (OS behavior), mais loguer pour monitoring

### 12. ✅ Large JSON Serialization
**Problème :** JSON.stringify lent/échoue pour queue de 1000 événements
**Impact :** Blocage UI, crash possible
**Solution :** Chunking, validation de taille avant sérialisation





