# 🔧 FIX : Erreur "Cannot read property 'S' of undefined" [runtime not ready]

## 🎯 Solution rapide (à essayer en premier)

### 1. Nettoyer le cache Metro

```powershell
# Depuis le dossier application/
cd d:\ayna_final\application

# Option 1 : Nettoyer le cache Expo/Metro
expo start -c

# Option 2 : Si cela ne suffit pas, supprimer manuellement
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
npm cache clean --force
```

### 2. Utiliser le script de nettoyage

```powershell
# Exécuter le script de nettoyage
cd d:\ayna_final\application
.\clean-cache.ps1
```

### 3. Redémarrer complètement

1. **Arrêter Metro** : `Ctrl + C` dans le terminal
2. **Fermer Expo Go** complètement (fermer l'app, pas juste mettre en arrière-plan)
3. **Relancer** :
   ```powershell
   npm start -- --clear
   ```
4. **Rouvrir Expo Go** et re-scanner le QR code

---

## 🔍 Causes possibles

### 1. Cache Metro corrompu (90% des cas)
- Le cache Metro peut être corrompu après des changements de code
- **Solution** : Nettoyer avec `expo start -c` ou supprimer `.expo`

### 2. Module natif non initialisé
- Un module natif (ex: `react-native-reanimated`) est importé avant que le runtime soit prêt
- **Vérification** : `babel.config.js` doit avoir `react-native-reanimated/plugin` en dernier
- ✅ **Déjà correct** : Le plugin est bien en dernier dans `babel.config.js`

### 3. Import circulaire
- Un import circulaire peut causer des modules undefined
- **Vérification** : Utiliser `npx expo-doctor` pour détecter

### 4. Problème avec react-native-reanimated
- Reanimated peut causer cette erreur si mal configuré
- **Vérification** : ✅ Babel configuré correctement

---

## ✅ Corrections appliquées

### 1. Logger dans i18n/index.ts
- ✅ Remplacé `console.error` par `logger.error` avec fallback
- ✅ Import lazy du logger pour éviter les problèmes de runtime

---

## 📋 Checklist de résolution

- [ ] Nettoyer le cache Metro (`expo start -c`)
- [ ] Supprimer `.expo` si existe
- [ ] Nettoyer le cache npm (`npm cache clean --force`)
- [ ] Redémarrer Metro avec `--clear`
- [ ] Fermer complètement Expo Go
- [ ] Re-scanner le QR code
- [ ] Si toujours en erreur : Supprimer `node_modules` et réinstaller

---

## 🚨 Si l'erreur persiste

### Option 1 : Réinstallation complète
```powershell
cd d:\ayna_final\application
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm start -- --clear
```

### Option 2 : Vérifier les imports
- Vérifier qu'aucun module natif n'est importé dans `index.ts`
- Vérifier que `react-native-gesture-handler` est bien importé en premier dans `index.ts` ✅ (déjà fait)

### Option 3 : Vérifier babel.config.js
- Le plugin `react-native-reanimated/plugin` doit être en dernier ✅ (déjà fait)

---

## 📝 Notes

- L'erreur "Cannot read property 'S' of undefined" est souvent liée à un cache Metro corrompu
- Le script `clean-cache.ps1` automatise la plupart des étapes de nettoyage
- Si l'erreur persiste après nettoyage, c'est probablement un problème d'import circulaire ou de module natif

