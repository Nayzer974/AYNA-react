# 📤 Guide : Invitations par lien pour les sessions privées

**Date :** 2025-01-27  
**Fonctionnalité :** Système d'invitation par lien pour les sessions privées de dhikr

---

## 🎯 Vue d'ensemble

Les utilisateurs peuvent maintenant inviter d'autres personnes à rejoindre leurs sessions privées via un lien d'invitation unique. Le lien peut être partagé via n'importe quelle application (WhatsApp, SMS, email, etc.).

### Fonctionnalités

- ✅ Génération automatique d'un token d'invitation unique pour chaque session privée
- ✅ Lien d'invitation partageable (deep link + lien web)
- ✅ Rejoindre une session via le lien (même sans connaître l'utilisateur)
- ✅ Synchronisation automatique avec Supabase pour les utilisateurs invités
- ✅ Interface UI pour partager et copier le lien

---

## 📋 Installation

### Étape 1 : Exécuter le script SQL

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Exécuter le script : `scripts/create-private-session-invitations.sql`

Ce script :
- Vérifie que la colonne `session_name` existe
- Crée un index pour améliorer les performances
- Crée la fonction `validate_invite_token` pour valider les tokens

### Étape 2 : Vérifier la configuration

Le deep linking est déjà configuré dans `app.config.js` :
```javascript
scheme: "ayna"
```

Les liens d'invitation utilisent le format :
- **Deep link :** `ayna://dhikr/invite/SESSION_ID?token=TOKEN`
- **Lien web :** `https://ayna.app/dhikr/invite/SESSION_ID?token=TOKEN`

---

## 🚀 Utilisation

### Pour le créateur de la session

1. **Créer une session privée** dans "Mes Sessions"
2. **Ouvrir la session** pour voir les détails
3. **Cliquer sur "Partager"** ou **"Copier"** pour obtenir le lien
4. **Partager le lien** avec les contacts via WhatsApp, SMS, email, etc.

### Pour l'invité

1. **Recevoir le lien** d'invitation
2. **Cliquer sur le lien** :
   - Si l'app est installée : l'app s'ouvre automatiquement et rejoint la session
   - Si l'app n'est pas installée : redirection vers la page web (à implémenter)
3. **Se connecter** si nécessaire (l'invitation fonctionne même sans être connecté au moment du clic)
4. **Rejoindre automatiquement** la session privée

---

## 🔧 Fonctionnement technique

### Génération du token

Chaque session privée reçoit automatiquement un token unique lors de sa création :
```typescript
const inviteToken = generateInviteToken(); // Format: "timestamp_random"
```

### Format du lien

**Deep link (app) :**
```
ayna://dhikr/invite/private_1234567890_abc123?token=xyz789_456def
```

**Lien web (fallback) :**
```
https://ayna.app/dhikr/invite/private_1234567890_abc123?token=xyz789_456def
```

### Stockage du token

Le token est stocké :
- **Localement** : Dans `AsyncStorage` avec la session privée (`invite_token`)
- **Sur le serveur** : Dans `dhikr_sessions.session_name` au format `"Session privée - TOKEN"`

### Rejoindre via le lien

1. L'app détecte les paramètres `inviteSessionId` et `inviteToken` dans la route
2. Appelle `joinPrivateSessionByToken(userId, sessionId, token)`
3. Vérifie que la session existe sur le serveur
4. Ajoute l'utilisateur comme participant via `join_dhikr_session` RPC
5. Affiche la session active

---

## 📱 Interface utilisateur

### Boutons ajoutés

Dans la vue "Session Active" pour les sessions privées :

1. **Bouton "Partager"** (icône Share2)
   - Ouvre le menu de partage natif
   - Partage le lien web + deep link
   - Fallback : copie dans le presse-papiers si le partage échoue

2. **Bouton "Copier"** (icône Copy)
   - Copie le lien web dans le presse-papiers
   - Affiche une confirmation

3. **Bouton "Supprimer"** (existant)
   - Supprime la session privée

### Emplacement

Les boutons apparaissent dans la carte d'information de la session privée, juste en dessous du titre.

---

## 🔐 Sécurité

### Validation du token

- Le token est unique pour chaque session
- Le token est validé côté serveur lors de la jointure
- Seuls les utilisateurs avec le token valide peuvent rejoindre

### Permissions

- **Créateur** : Peut partager, copier et supprimer
- **Invités** : Peuvent rejoindre via le lien, participer, mais ne peuvent pas supprimer
- **Non-invités** : Ne peuvent pas rejoindre sans le lien

### Limitations

- Les sessions privées sont limitées à 2 par utilisateur
- Le nombre de participants n'est pas limité (mais peut être ajouté si nécessaire)
- Les sessions complétées ne peuvent plus être rejointes

---

## 🐛 Dépannage

### Le lien ne fonctionne pas

**Problème :** Le lien ne ouvre pas l'app ou ne rejoint pas la session.

**Solutions :**
1. Vérifier que le deep linking est configuré dans `app.config.js`
2. Vérifier que les paramètres de route sont correctement passés
3. Vérifier que l'utilisateur est connecté
4. Vérifier que la session existe toujours et est active

### Le token n'est pas généré

**Problème :** Les sessions privées existantes n'ont pas de token.

**Solution :** Les nouvelles sessions reçoivent automatiquement un token. Pour les sessions existantes, elles recevront un token lors de la prochaine synchronisation ou peuvent être recréées.

### Erreur "Session introuvable"

**Problème :** Le lien est invalide ou la session a été supprimée.

**Solutions :**
1. Vérifier que le lien est complet (sessionId + token)
2. Vérifier que la session existe sur le serveur
3. Vérifier que la session est toujours active

---

## 📝 Code ajouté

### Services

**`src/services/privateDhikrSessions.ts` :**
- `generateInviteToken()` : Génère un token unique
- `generateInviteLink()` : Génère le deep link
- `generateInviteLinkWeb()` : Génère le lien web
- `joinPrivateSessionByToken()` : Rejoint via le token
- `regenerateInviteToken()` : Régénère le token (pour révoquer l'ancien)

### Interface

**`src/pages/CercleDhikr.tsx` :**
- Boutons "Partager" et "Copier" dans la vue session privée
- Gestion du deep linking via `route.params`
- Alertes de confirmation

### Base de données

**`scripts/create-private-session-invitations.sql` :**
- Index pour les recherches par token
- Fonction `validate_invite_token` pour validation

---

## 🔮 Améliorations futures possibles

### Priorité Haute

1. **Page web de redirection**
   - Créer une page web qui redirige vers l'app si installée
   - Afficher un message si l'app n'est pas installée

2. **Expiration des liens**
   - Ajouter une date d'expiration aux tokens
   - Permettre de régénérer le token pour révoquer l'ancien

3. **Notifications push**
   - Notifier les invités quand ils reçoivent une invitation
   - Notifier le créateur quand quelqu'un rejoint

### Priorité Moyenne

4. **QR Code**
   - Générer un QR code pour le lien
   - Faciliter le partage en personne

5. **Statistiques d'invitation**
   - Voir qui a rejoint via le lien
   - Voir combien de personnes ont cliqué sur le lien

6. **Limite de participants**
   - Permettre au créateur de limiter le nombre de participants
   - Afficher un message si la session est pleine

---

## ✅ Checklist de vérification

- [ ] Script SQL exécuté dans Supabase
- [ ] Deep linking configuré dans `app.config.js`
- [ ] Boutons "Partager" et "Copier" visibles dans les sessions privées
- [ ] Génération de token automatique pour les nouvelles sessions
- [ ] Partage du lien fonctionne
- [ ] Copie du lien fonctionne
- [ ] Rejoindre via le lien fonctionne
- [ ] Synchronisation avec Supabase fonctionne
- [ ] Les invités peuvent participer à la session

---

## 📚 Ressources

- **Service :** `src/services/privateDhikrSessions.ts`
- **Page :** `src/pages/CercleDhikr.tsx`
- **Script SQL :** `scripts/create-private-session-invitations.sql`
- **Documentation :** `ANALYSE_DAIRAT_AN_NUR.md`

---

**Fin du guide**

*Cette fonctionnalité permet aux utilisateurs de partager facilement leurs sessions privées avec leurs contacts.*





