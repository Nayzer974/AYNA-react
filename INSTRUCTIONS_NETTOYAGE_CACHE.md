# 🧹 Instructions de Nettoyage du Cache - Résoudre l'erreur Runtime

## ⚡ Solution Rapide (à essayer en premier)

### Étape 1 : Nettoyer le cache Metro

```powershell
# Depuis le dossier application/
cd d:\ayna_final\application

# Option A : Utiliser le flag --clear
npm run start:clean

# Option B : Utiliser expo directement
expo start -c
```

### Étape 2 : Si l'erreur persiste

```powershell
# 1. Arrêter Metro (Ctrl + C)

# 2. Supprimer le cache .expo
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# 3. Nettoyer le cache npm
npm cache clean --force

# 4. Relancer avec cache nettoyé
npm run start:clean
```

### Étape 3 : Si toujours en erreur - Nettoyage complet

```powershell
# 1. Arrêter Metro (Ctrl + C)

# 2. Supprimer node_modules et réinstaller
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# 3. Supprimer le cache .expo
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# 4. Relancer
npm run start:clean
```

---

## 📱 Actions sur Expo Go

1. **Fermer complètement Expo Go** (pas juste mettre en arrière-plan)
2. **Redémarrer l'app Expo Go**
3. **Re-scanner le QR code** après avoir lancé Metro avec `--clear`

---

## 🔍 Vérifications

### Babel config ✅
Le fichier `babel.config.js` est correctement configuré :
- `react-native-reanimated/plugin` est bien en dernier

### Imports ✅
- `react-native-gesture-handler` est importé en premier dans `index.ts`
- Aucun module natif importé dans `index.ts` avant l'initialisation

---

## 🎯 Scripts npm disponibles

- `npm start` : Démarrer Metro normalement
- `npm run start:clean` : Démarrer Metro avec cache nettoyé ⭐ (utiliser celui-ci si erreur)

---

## 📝 Notes

- L'erreur "Cannot read property 'S' of undefined" est **souvent** causée par un cache Metro corrompu
- Nettoyer le cache résout le problème dans **90% des cas**
- Si l'erreur persiste après nettoyage complet, vérifier les imports circulaires avec `npx expo-doctor`

