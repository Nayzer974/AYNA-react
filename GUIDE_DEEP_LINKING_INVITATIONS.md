# 🔗 Guide : Deep Linking pour les Invitations

**Date :** 2025-01-27  
**Fonctionnalité :** Deep linking pour rejoindre les sessions privées via un lien

---

## ⚠️ Important : Deep Linking en Développement vs Production

### En Développement (Expo Go)

Le deep linking avec `ayna://` **ne fonctionne pas** dans Expo Go car Expo Go utilise son propre scheme (`exp://`).

**Solutions pour tester :**

1. **Utiliser un build de développement** :
   ```bash
   eas build --platform android --profile development
   ```

2. **Tester directement dans le code** :
   - Ouvrir l'app
   - Aller dans DairatAnNur
   - Créer une session privée
   - Le lien sera généré mais ne fonctionnera qu'en production

3. **Tester manuellement** :
   - Copier le lien généré
   - Dans l'app, naviguer manuellement vers DairatAnNur avec les paramètres

### En Production

Le deep linking fonctionne automatiquement avec le scheme `ayna://` configuré dans `app.config.js`.

---

## 🔧 Configuration

### app.config.js

Le deep linking est configuré avec :
```javascript
scheme: "ayna"
```

### Android

Intent filters configurés pour capturer les liens :
```javascript
intentFilters: [
  {
    action: "VIEW",
    autoVerify: true,
    data: [
      {
        scheme: "ayna",
        host: "dhikr",
        pathPrefix: "/invite"
      }
    ],
    category: ["BROWSABLE", "DEFAULT"]
  }
]
```

### iOS

URL schemes configurés dans `infoPlist` :
```javascript
CFBundleURLTypes: [
  {
    CFBundleURLSchemes: ["ayna"],
    CFBundleURLName: "com.ayna.app"
  }
]
```

---

## 📱 Format du Lien

### Deep Link
```
ayna://dhikr/invite/SESSION_ID?token=TOKEN
```

**Exemple :**
```
ayna://dhikr/invite/private_1234567890_abc123?token=xyz789_456def
```

### Comment ça fonctionne

1. **L'utilisateur clique sur le lien** (depuis WhatsApp, SMS, email, etc.)
2. **Le système d'exploitation** détecte le scheme `ayna://`
3. **L'app AYNA s'ouvre** automatiquement
4. **App.tsx** capture le deep link via `Linking.addEventListener`
5. **Navigation** vers `DairatAnNur` avec les paramètres `inviteSessionId` et `inviteToken`
6. **CercleDhikr.tsx** détecte les paramètres et appelle `joinPrivateSessionByToken`
7. **L'utilisateur rejoint** automatiquement la session

---

## 🧪 Tester le Deep Linking

### Méthode 1 : Via ADB (Android)

```bash
# Ouvrir l'app avec le deep link
adb shell am start -W -a android.intent.action.VIEW -d "ayna://dhikr/invite/private_1234567890_abc123?token=xyz789_456def" com.ayna.app
```

### Méthode 2 : Via Terminal (iOS Simulator)

```bash
# Ouvrir l'app avec le deep link
xcrun simctl openurl booted "ayna://dhikr/invite/private_1234567890_abc123?token=xyz789_456def"
```

### Méthode 3 : Via Code (Développement)

Dans `CercleDhikr.tsx`, ajouter un bouton de test temporaire :

```typescript
<Pressable onPress={() => {
  Linking.openURL('ayna://dhikr/invite/private_1234567890_abc123?token=xyz789_456def');
}}>
  <Text>Test Deep Link</Text>
</Pressable>
```

---

## 🐛 Dépannage

### Le lien n'ouvre pas l'app

**Problème :** Le deep link ne fonctionne pas.

**Solutions :**
1. Vérifier que `scheme: "ayna"` est dans `app.config.js`
2. Vérifier que les intent filters sont configurés (Android)
3. Vérifier que les URL schemes sont configurés (iOS)
4. **Rebuild l'app** après modification de `app.config.js`
5. En développement avec Expo Go, utiliser un build de développement

### L'app s'ouvre mais ne navigue pas

**Problème :** L'app s'ouvre mais reste sur l'écran d'accueil.

**Solutions :**
1. Vérifier que `App.tsx` écoute les deep links
2. Vérifier que la navigation est prête (`navigationRef.isReady()`)
3. Vérifier les logs console pour voir si le deep link est capturé

### Erreur "Session introuvable"

**Problème :** Le lien fonctionne mais la session n'est pas trouvée.

**Solutions :**
1. Vérifier que le token est valide
2. Vérifier que la session existe sur le serveur
3. Vérifier que la session est toujours active
4. Vérifier que l'utilisateur est connecté

---

## 📝 Code Ajouté

### App.tsx

Gestion du deep linking pour les invitations :
```typescript
// Vérifier si c'est une invitation à une session privée
if (url.startsWith('ayna://dhikr/invite/')) {
  // Parser l'URL et naviguer vers DairatAnNur
  navigationRef.navigate('DairatAnNur', {
    inviteSessionId: sessionId,
    inviteToken: token,
  });
}
```

### CercleDhikr.tsx

Détection des paramètres d'invitation :
```typescript
// Vérifier si on doit rejoindre une session via un lien d'invitation
if (params?.inviteSessionId && params?.inviteToken && user?.id) {
  const joinedSession = await joinPrivateSessionByToken(
    user.id,
    params.inviteSessionId,
    params.inviteToken
  );
  // Afficher la session
}
```

---

## ✅ Checklist

- [x] Scheme configuré dans `app.config.js`
- [x] Intent filters configurés (Android)
- [x] URL schemes configurés (iOS)
- [x] Gestion du deep linking dans `App.tsx`
- [x] Détection des paramètres dans `CercleDhikr.tsx`
- [x] Fonction `joinPrivateSessionByToken` créée
- [ ] Tester en production (build EAS)
- [ ] Créer une page web de redirection (optionnel)

---

## 🔮 Améliorations Futures

1. **Page web de redirection** : Créer une page web qui redirige vers l'app
2. **QR Code** : Générer un QR code pour le lien
3. **Notifications push** : Notifier les invités quand ils reçoivent une invitation
4. **Expiration des liens** : Ajouter une date d'expiration aux tokens

---

**Note :** Le deep linking fonctionne uniquement en production ou dans un build de développement. Il ne fonctionne **pas** dans Expo Go.





